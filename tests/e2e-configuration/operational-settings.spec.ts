import { test, expect, origin } from './fixtures';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
const out = fileURLToPath(new URL('../../../../evidence/configuration/', import.meta.url));
mkdirSync(out, { recursive: true });

test('admin settings persist real SQL, keep pending notes honest, protect drafts, and drive public/member cancellation', async ({ browser, request, fixture: f }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'es-MX', timezoneId: 'America/Mexico_City', reducedMotion: 'reduce', serviceWorkers: 'block' });
    await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort('blockedbyclient'));
    await context.addInitScript(token => localStorage.setItem('altitud2707_token', token), f.tokens.admin);
    const page = await context.newPage(), errors: string[] = [], serverErrors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 500) serverErrors.push(new URL(response.url()).pathname); });
    const evidence: any = { frontend: origin, rules: [], screens: [] };
    const save = async (hours: string) => {
        await page.getByLabel('Anticipación para cancelar o reagendar', { exact: true }).fill(hours);
        const saved = page.waitForResponse(response => new URL(response.url()).pathname === '/api/operational-settings' && response.request().method() === 'PUT');
        await page.getByRole('button', { name: 'Guardar configuración', exact: true }).click();
        expect((await saved).status()).toBe(200);
        await expect(page.getByText('Configuración guardada.', { exact: true })).toBeVisible();
    };
    try {
        await page.goto(origin + '/admin/settings/operations');
        await expect(page.getByLabel('Anticipación para cancelar o reagendar', { exact: true })).toHaveValue('4');
        await expect(page.getByLabel('Anticipación máxima para reservar')).toHaveValue('');
        await expect(page.getByRole('switch')).toHaveCount(0);
        await page.getByLabel('Anticipación máxima para reservar').fill('15');
        await page.getByLabel('Reservas activas por persona').fill('2');
        await page.getByLabel('Reservas por persona al día').fill('1');
        await page.getByText('Lista de espera', { exact: true }).click();
        await page.getByLabel('Nota administrativa: Lista de espera').fill('QA: confirmar la modalidad con el studio; sigue pendiente.');
        await save('6');
        const row = (await f.pool.query('SELECT version,cancellation_hours,booking_advance_days,max_active_bookings,max_bookings_per_day,pending_notes,updated_by FROM operational_settings WHERE id=true')).rows[0];
        expect(row).toMatchObject({ cancellation_hours: 6, booking_advance_days: 15, max_active_bookings: 2, max_bookings_per_day: 1, updated_by: f.ids.admin });
        expect(row.pending_notes.waitlist_mode).toContain('sigue pendiente');
        const audit = (await f.pool.query('SELECT count(*)::int AS n FROM operational_settings_audit WHERE actor_id=$1 AND version=$2', [f.ids.admin, row.version])).rows[0];
        expect(audit.n).toBe(1); evidence.rules.push(row);
        await page.reload();
        await expect(page.getByLabel('Anticipación para cancelar o reagendar', { exact: true })).toHaveValue('6');
        await page.getByText('Lista de espera', { exact: true }).click();
        await expect(page.getByLabel('Nota administrativa: Lista de espera')).toHaveValue(row.pending_notes.waitlist_mode);
        const publicResponse = await request.get(origin + '/api/operational-settings/public');
        expect(publicResponse.status()).toBe(200);
        expect(Object.keys(await publicResponse.json()).sort()).toEqual(['cancellation_hours', 'version']);
        for (const path of ['/cancellation-policy', '/terms']) {
            const publicPage = await context.newPage(); await publicPage.goto(origin + path);
            await expect(publicPage.getByText(/mínimo de 6 horas/)).toBeVisible(); await publicPage.close();
        }
        const booked = await request.post(origin + '/api/bookings', { headers: { Authorization: `Bearer ${f.tokens.client}` }, data: { classId: f.ids.first } });
        expect(booked.status()).toBe(201);
        await f.pool.query("UPDATE classes SET date=((clock_timestamp()+interval '5 hours') AT TIME ZONE 'America/Mexico_City')::date,start_time=((clock_timestamp()+interval '5 hours') AT TIME ZONE 'America/Mexico_City')::time,end_time=((clock_timestamp()+interval '6 hours') AT TIME ZONE 'America/Mexico_City')::time WHERE id=$1", [f.ids.first]);
        const clientContext = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'es-MX', timezoneId: 'America/Mexico_City', serviceWorkers: 'block' });
        await clientContext.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort('blockedbyclient'));
        await clientContext.addInitScript(token => localStorage.setItem('altitud2707_token', token), f.tokens.client);
        const client = await clientContext.newPage();
        await client.goto(origin + '/app/classes'); await client.getByRole('button', { name: 'Cancelar', exact: true }).click();
        await expect(client.getByText(/Faltan menos de 6 horas/)).toBeVisible();
        await expect(client.getByRole('button', { name: 'Plazo de cancelación terminado' })).toBeDisabled();
        await client.getByRole('button', { name: 'Conservar mi lugar' }).click();
        await client.getByRole('button', { name: 'Reagendar', exact: true }).click();
        await expect(client.getByText('El plazo de 6 horas para reagendar terminó.')).toBeVisible();
        await client.getByRole('button', { name: 'Conservar mi sesión' }).click();
        await save('2');
        await client.getByRole('button', { name: 'Cancelar', exact: true }).click();
        await expect(client.getByText(/mínimo 2 horas de anticipación/)).toBeVisible();
        await expect(client.getByRole('button', { name: 'Sí, cancelar sesión' })).toBeEnabled();
        await client.getByRole('button', { name: 'Sí, cancelar sesión' }).click();
        await expect.poll(async () => (await f.pool.query('SELECT status FROM bookings WHERE class_id=$1 AND user_id=$2', [f.ids.first, f.ids.client])).rows[0].status).toBe('cancelled');
        expect((await f.pool.query('SELECT classes_remaining FROM memberships WHERE id=$1', [f.ids.membership])).rows[0].classes_remaining).toBe(8);
        await clientContext.close();

        // A second writer wins; stale UI may not silently overwrite that version.
        const current = (await request.get(origin + '/api/operational-settings', { headers: { Authorization: `Bearer ${f.tokens.admin}` } })).json();
        const version = (await current).version;
        expect((await request.put(origin + '/api/operational-settings', { headers: { Authorization: `Bearer ${f.tokens.admin}` }, data: { expectedVersion: version, cancellation_hours: 9 } })).status()).toBe(200);
        await page.getByLabel('Anticipación para cancelar o reagendar', { exact: true }).fill('8');
        await page.getByRole('button', { name: 'Guardar configuración', exact: true }).click();
        await expect(page.getByRole('alert')).toContainText('Otra persona actualizó la configuración');
        await expect(page.getByLabel('Anticipación para cancelar o reagendar', { exact: true })).toHaveValue('8');
        await expect(page.getByRole('button', { name: 'Guardar configuración', exact: true })).toBeDisabled();
        await page.getByRole('button', { name: 'Recargar y descartar mis cambios' }).click();
        await expect(page.getByLabel('Anticipación para cancelar o reagendar', { exact: true })).toHaveValue('9');

        await page.getByLabel('Duración del beneficio Founding').selectOption('six_calendar_months');
        await expect(page.getByRole('button', { name: 'Guardar regla Founding' })).toBeDisabled();
        await page.getByLabel(/Confirmo que esta regla se asignará/).check();
        await page.getByRole('button', { name: 'Guardar regla Founding' }).click();
        await expect(page.getByText('Regla Founding guardada.')).toBeVisible();
        const founding = (await f.pool.query('SELECT version,mode,updated_by FROM founding_policy WHERE singleton=true')).rows[0];
        expect(founding.mode).toBe('six_calendar_months'); expect(founding.updated_by).toBe(f.ids.admin); evidence.founding = founding;
        await page.reload(); await expect(page.getByLabel('Duración del beneficio Founding')).toHaveValue('six_calendar_months');
        for (const width of [320, 390, 768, 1440]) {
            await page.setViewportSize({ width, height: 900 }); await page.waitForLoadState('networkidle');
            const content = await page.evaluate(() => document.documentElement.scrollWidth);
            expect(content).toBeLessThanOrEqual(width + 1); evidence.screens.push({ width, content });
            await page.screenshot({ path: out + `settings-${width}.png`, fullPage: true });
        }
        const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
        evidence.accessibility = axe.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) }));
        expect(evidence.accessibility).toEqual([]);
        expect(errors).toEqual([]); expect(serverErrors).toEqual([]);
        evidence.errors = errors; evidence.serverErrors = serverErrors;
    } finally { writeFileSync(out + 'operational-settings.json', JSON.stringify(evidence, null, 2)); await context.close(); }
});

test('anonymous, client and reception cannot edit admin configuration; mounted pages avoid server errors', async ({ browser, request, fixture: f }) => {
    for (const role of ['anonymous', 'client', 'reception']) {
        const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
        await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort('blockedbyclient'));
        if (role !== 'anonymous') await context.addInitScript(token => localStorage.setItem('altitud2707_token', token), f.tokens[role]);
        const page = await context.newPage(); await page.goto(origin + '/admin/settings/operations');
        await expect(page).toHaveURL(new RegExp(role === 'anonymous' ? '/login\\?' : role === 'client' ? '/app$' : '/admin/bookings$'));
        await expect(page.getByRole('button', { name: 'Guardar configuración', exact: true })).toHaveCount(0);
        const denied = await request.put(origin + '/api/operational-settings', { headers: role === 'anonymous' ? {} : { Authorization: `Bearer ${f.tokens[role]}` }, data: { expectedVersion: 1, cancellation_hours: 4 } });
        expect(denied.status()).toBe(role === 'anonymous' ? 401 : 403); await context.close();
    }
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort('blockedbyclient'));
    await context.addInitScript(token => localStorage.setItem('altitud2707_token', token), f.tokens.admin);
    const page = await context.newPage(), failed: string[] = [], errors: string[] = [];
    page.on('response', response => { if (response.status() >= 500) failed.push(`${response.status()} ${new URL(response.url()).pathname}`); });
    page.on('pageerror', error => errors.push(error.message));
    for (const path of ['/', '/pricing', '/admin/settings/operations', '/admin/settings/cancellations', '/admin/reports/classes', '/admin/founding50']) { await page.goto(origin + path); await page.waitForLoadState('networkidle'); }
    expect(failed).toEqual([]); expect(errors).toEqual([]);
    writeFileSync(out + 'configuration-canary.json', JSON.stringify({ paths: 6, failed, errors, deniedRoles: ['anonymous', 'client', 'reception'] }, null, 2));
    await context.close();
});
