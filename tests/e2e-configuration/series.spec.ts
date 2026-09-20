import { test, expect, origin } from './fixtures';
import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
const out = fileURLToPath(new URL('../../../../evidence/configuration/', import.meta.url));

test('calendar and template editors preview explicit scope before SQL changes and preserve history', async ({ browser, fixture: f }) => {
    const schedule = randomUUID(), slots = Array.from({ length: 3 }, () => randomUUID());
    const booked = randomUUID(), past = randomUUID(), exception = randomUUID(), booking = randomUUID();
    const name = 'QA serie ' + schedule.slice(0, 7);
    const dates = (await f.pool.query("SELECT $1::date::text AS first,($1::date+7)::text AS second,($1::date+14)::text AS booked,($1::date+21)::text AS exception,($1::date-7)::text AS past,extract(dow FROM $1::date)::int AS weekday", [f.date])).rows[0];
    const evidence: any = { dates, previews: [], sql: [] };
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'es-MX', timezoneId: 'America/Mexico_City', reducedMotion: 'reduce', serviceWorkers: 'block' });
    await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort('blockedbyclient'));
    await context.addInitScript(token => localStorage.setItem('altitud2707_token', token), f.tokens.admin);
    const page = await context.newPage(), errors: string[] = [], failures: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 500) failures.push(new URL(response.url()).pathname); });
    const readRows = async () => (await f.pool.query('SELECT id,date::text,start_time,end_time,max_capacity,is_exception FROM classes WHERE schedule_id=$1 ORDER BY date', [schedule])).rows;
    const openClass = async (date: string, time: string) => {
        await page.goto(origin + '/admin/calendar');
        const day = format(parseISO(date), "EEEE d 'de' MMMM", { locale: es });
        await expect(page.getByRole('button', { name: /^lunes \d+ de / })).toBeVisible();
        for (let i = 0; i < 5 && !(await page.getByRole('button', { name: day, exact: true }).count()); i++) {
            const monday = await page.getByRole('button', { name: /^lunes \d+ de / }).getAttribute('aria-label');
            await page.getByRole('button', { name: 'Semana siguiente' }).click();
            await expect(page.getByRole('button', { name: /^lunes \d+ de / })).not.toHaveAttribute('aria-label', monday!);
        }
        await page.getByRole('button', { name: day, exact: true }).click();
        await page.getByRole('button').filter({ hasText: name }).filter({ hasText: time }).first().click();
        await page.getByRole('button', { name: 'Editar', exact: true }).click();
        return page.getByRole('dialog', { name: 'Editar Clase', exact: true });
    };
    const preview = async (dialog: ReturnType<typeof page.getByRole>) => {
        const response = page.waitForResponse(r => r.url().endsWith('/series-preview'));
        await dialog.getByRole('button', { name: 'Revisar impacto' }).click();
        const result = await response; const data = await result.json(); evidence.previews.push({ status: result.status(), ...data });
        expect(result.status(), JSON.stringify(data)).toBe(200); return data;
    };
    const apply = async (dialog: ReturnType<typeof page.getByRole>) => {
        const response = page.waitForResponse(r => r.url().endsWith('/series-apply'));
        await dialog.getByRole('button', { name: 'Aplicar cambio revisado' }).click();
        expect((await response).status()).toBe(200);
    };
    try {
        await f.pool.query('UPDATE class_types SET name=$2 WHERE id=$1', [f.ids.classType, name]);
        for (let i = 0; i < slots.length; i++) await f.pool.query('INSERT INTO schedule_slots(id,day_of_week,start_time,is_published)VALUES($1,$2,$3,true)', [slots[i], dates.weekday, ['10:13', '11:13', '12:13'][i]]);
        await f.pool.query("INSERT INTO schedules(id,class_type_id,instructor_id,day_of_week,start_time,end_time,max_capacity,schedule_slot_id)VALUES($1,$2,$3,$4,'10:13','11:03',12,$5)", [schedule, f.ids.classType, f.ids.coach, dates.weekday, slots[0]]);
        await f.pool.query("UPDATE classes SET schedule_id=$1,date=$2,start_time='10:13',end_time='11:03',max_capacity=12 WHERE id=$3", [schedule, dates.first, f.ids.first]);
        await f.pool.query("UPDATE classes SET schedule_id=$1,date=$2,start_time='10:13',end_time='11:03',max_capacity=12 WHERE id=$3", [schedule, dates.second, f.ids.second]);
        for (const [id, date, isException] of [[booked, dates.booked, false], [past, dates.past, false], [exception, dates.exception, true]]) await f.pool.query("INSERT INTO classes(id,schedule_id,class_type_id,instructor_id,date,start_time,end_time,max_capacity,is_exception)VALUES($1,$2,$3,$4,$5,'10:13','11:03',12,$6)", [id, schedule, f.ids.classType, f.ids.coach, date, isException]);
        await f.pool.query("INSERT INTO bookings(id,user_id,class_id,status,is_free_booking)VALUES($1,$2,$3,'confirmed',true)", [booking, f.ids.client, booked]);
        const original = await readRows(); evidence.original = original;

        let dialog = await openClass(dates.first, '10:13');
        await expect(dialog.getByLabel('Aplicar a')).toHaveValue('one');
        await dialog.locator('input[name="maxCapacity"]').fill('10');
        await expect(dialog.getByRole('button', { name: 'Aplicar cambio revisado' })).toHaveCount(0);
        const one = await preview(dialog); expect(one.applicable.map((row: any) => row.id)).toEqual([f.ids.first]);
        await dialog.screenshot({ path: out + 'series-one-mobile.png' }); await apply(dialog);
        expect((await readRows()).find(row => row.id === f.ids.first)).toMatchObject({ max_capacity: 10, is_exception: true });

        dialog = await openClass(dates.second, '10:13');
        await dialog.getByLabel('Aplicar a').selectOption('following');
        await dialog.locator('input[name="startTime"]').fill('11:13');
        await dialog.locator('input[name="endTime"]').fill('12:03');
        const following = await preview(dialog);
        expect(following.applicable.map((row: any) => row.id)).toEqual([f.ids.second]);
        expect(following.blocked).toEqual(expect.arrayContaining([expect.objectContaining({ id: booked, reason: 'booking_history' }), expect.objectContaining({ id: exception, reason: 'individual_exception' })]));
        await apply(dialog);
        let rows = await readRows(); evidence.sql.push(rows);
        expect(rows.find(row => row.id === f.ids.second).start_time).toBe('11:13:00');
        for (const id of [booked, past, exception]) expect(rows.find(row => row.id === id)).toEqual(original.find(row => row.id === id));
        expect(rows.find(row => row.id === f.ids.first)).toMatchObject({ max_capacity: 10, start_time: '10:13:00', is_exception: true });

        await page.goto(origin + '/admin/classes/schedules');
        const weekday = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][dates.weekday];
        await page.getByRole('button', { name: weekday, exact: true }).click();
        await page.locator('.group').filter({ has: page.getByText(name, { exact: true }) }).getByRole('button', { name: 'Editar serie', exact: true }).click();
        dialog = page.getByRole('dialog', { name: 'Editar serie futura' });
        await dialog.getByLabel('Aplicar a').selectOption('following');
        await dialog.getByLabel('Desde la fecha').fill(dates.second);
        await dialog.getByLabel('Inicio', { exact: true }).fill('12:13');
        await dialog.getByLabel('Fin', { exact: true }).fill('13:03');
        const template = await preview(dialog);
        expect(template.templateWillChange).toBe(true); expect(template.effectiveFrom).toBe(dates.second);
        await dialog.getByText('Ver clases que conservan su horario').click();
        await dialog.screenshot({ path: out + 'series-template-mobile.png' }); await apply(dialog);
        rows = await readRows(); evidence.sql.push(rows);
        expect(rows.find(row => row.id === f.ids.second).start_time).toBe('12:13:00');
        for (const id of [booked, past, exception]) expect(rows.find(row => row.id === id)).toEqual(original.find(row => row.id === id));
        expect((await f.pool.query('SELECT count(*)::int AS count FROM booking_credit_ledger WHERE booking_id=$1', [booking])).rows[0].count).toBe(0);
        evidence.versions = (await f.pool.query('SELECT effective_from::text,end_time,max_capacity FROM schedule_versions WHERE schedule_id=$1 ORDER BY effective_from', [schedule])).rows;
        expect(evidence.versions).toHaveLength(2);
        expect(errors).toEqual([]); expect(failures).toEqual([]); evidence.errors = errors; evidence.serverErrors = failures;
    } finally {
        writeFileSync(out + 'series-browser.json', JSON.stringify(evidence, null, 2)); await context.close();
        await f.pool.query('DELETE FROM bookings WHERE id=$1', [booking]);
        await f.pool.query('DELETE FROM classes WHERE schedule_id=$1', [schedule]);
        await f.pool.query('DELETE FROM schedules WHERE id=$1', [schedule]);
        await f.pool.query('DELETE FROM schedule_slots WHERE id=ANY($1::uuid[])', [slots]);
    }
});
