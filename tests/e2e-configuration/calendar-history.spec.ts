import { test, expect, origin } from './fixtures';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
const out = fileURLToPath(new URL('../../../../evidence/configuration/', import.meta.url));

test('calendar preserves history and only offers supported agenda tools', async ({ browser, fixture: f }) => {
    await f.pool.query("UPDATE classes SET date=$1 WHERE id=ANY($2::uuid[])", [f.today, [f.ids.first, f.ids.second]]);
    await f.pool.query("UPDATE classes SET status='cancelled' WHERE id=$1", [f.ids.second]);
    const snapshot = async () => ({
        classes: (await f.pool.query('SELECT id,date::text,status,start_time,end_time,max_capacity,current_bookings FROM classes WHERE class_type_id=$1 ORDER BY id', [f.ids.classType])).rows,
        bookings: (await f.pool.query('SELECT id,class_id,status,credits_debited FROM bookings WHERE user_id=ANY($1::uuid[]) ORDER BY id', [[f.ids.client, f.ids.other]])).rows,
        memberships: (await f.pool.query('SELECT id,classes_remaining FROM memberships WHERE user_id=ANY($1::uuid[]) ORDER BY id', [[f.ids.client, f.ids.other]])).rows,
        totals: (await f.pool.query('SELECT (SELECT count(*)::int FROM classes) AS classes,(SELECT count(*)::int FROM bookings) AS bookings,(SELECT count(*)::int FROM booking_credit_ledger) AS ledger')).rows[0],
    });
    const before = await snapshot();
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'es-MX', timezoneId: 'America/Mexico_City', reducedMotion: 'reduce', serviceWorkers: 'block' });
    await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await context.addInitScript(token => localStorage.setItem('altitud2707_token', token), f.tokens.admin);
    const page = await context.newPage(); const errors: string[] = [], responses: any[] = [], legacy: any[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) responses.push({ path: new URL(response.url()).pathname, status: response.status() }); });
    const evidence: any = { before, legacy, views: [] };
    try {
        await page.goto(origin + '/admin/calendar');
        await page.getByText('Herramientas de agenda', { exact: true }).click();
        await page.getByRole('button', { name: 'Ver canceladas', exact: true }).click();
        await page.getByRole('button', { name: format(parseISO(f.today), "EEEE d 'de' MMMM", { locale: es }), exact: true }).click();
        await expect(page.getByRole('button').filter({ hasText: '19:00' }).filter({ hasText: 'QA TRAIN' })).toBeVisible();

        // Captures the original misleading controls before the regression assertion.
        // This is restricted by fixtures.ts to the disposable configuration database.
        for (const [label, endpoint] of [['Limpiar semana', '/bulk-delete'], ['Eliminar canceladas', '/delete-cancelled']]) {
            const button = page.getByRole('button', { name: label, exact: true });
            if (await button.count()) {
                page.once('dialog', dialog => dialog.accept());
                const response = page.waitForResponse(r => r.url().endsWith(endpoint));
                await button.click(); const result = await response; const body = await result.json();
                legacy.push({ label, status: result.status(), body });
                expect(result.status()).toBe(410); expect(body.code).toBe('HISTORY_PRESERVED');
            }
        }
        if (legacy.length) {
            await page.screenshot({ path: out + 'calendar-history-red.png', fullPage: true });
            evidence.after = await snapshot(); expect(evidence.after).toEqual(before);
        }
        await expect(page.getByRole('button', { name: 'Limpiar semana', exact: true })).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Eliminar canceladas', exact: true })).toHaveCount(0);
        await expect(page.getByText('Las clases con historial se conservan.', { exact: false })).toBeVisible();

        await page.getByRole('button', { name: 'Generar semana', exact: true }).click();
        const generate = page.getByRole('dialog', { name: 'Generar Clases' });
        await expect(generate.getByRole('button', { name: 'Generar', exact: true })).toBeEnabled();
        await generate.getByRole('button', { name: 'Cancelar', exact: true }).click();
        const preview = page.waitForResponse(r => r.url().endsWith('/classes/copy-week'));
        await page.getByRole('button', { name: 'Copiar semana anterior', exact: true }).click();
        const copyResponse = await preview; expect(copyResponse.status()).toBe(200);
        expect(copyResponse.request().postDataJSON().dryRun).toBe(true);
        evidence.copyPreview = await copyResponse.json();
        const copy = page.getByRole('dialog', { name: 'Copiar semana anterior' });
        await expect(copy).toBeVisible(); await copy.getByRole('button', { name: 'Cancelar', exact: true }).click();
        for (const width of [390, 1440]) {
            await page.setViewportSize({ width, height: 900 });
            evidence.views.push(await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth })));
            await page.screenshot({ path: out + `calendar-history-${width}.png`, fullPage: true });
        }
        await page.setViewportSize({ width: 390, height: 844 });
        await page.getByRole('button', { name: 'Ocultar canceladas', exact: true }).click();
        await expect(page.getByRole('button').filter({ hasText: '19:00' }).filter({ hasText: 'QA TRAIN' })).toHaveCount(0);
        evidence.after = await snapshot(); expect(evidence.after).toEqual(before);
        expect(evidence.views.every((v: any) => v.width <= v.viewport)).toBe(true);
        expect(errors).toEqual([]); expect(responses).toEqual([]);
    } finally {
        evidence.errors = errors; evidence.responses = responses;
        writeFileSync(out + (legacy.length ? 'calendar-history-red.json' : 'calendar-history-green.json'), JSON.stringify(evidence, null, 2));
        await context.close();
    }
});
