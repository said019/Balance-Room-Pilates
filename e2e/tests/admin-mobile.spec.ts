import { writeFileSync, mkdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { adminRoutes, installAdminPreview } from '../fixtures/admin-preview';

test.describe.configure({ mode: 'parallel' });

// Read-only local rendering tests. API fixtures intentionally cannot mutate real data.
for (const width of [320, 390, 768, 1440]) {
  test(`admin routes render within ${width}px`, async ({ browser }, testInfo) => {
    test.setTimeout(300_000);
    const context = await browser.newContext({ viewport: { width, height: 900 }, locale: 'es-MX', reducedMotion: 'reduce' });
    const unexpected = await installAdminPreview(context);
    const page = await context.newPage();
    const results: Array<Record<string, unknown>> = [];
    let errors: string[] = [];
    let consoleErrors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    for (const route of adminRoutes) {
      errors = [];
      consoleErrors = [];
      await page.goto(`http://127.0.0.1:2707${route}`);
      await page.waitForLoadState('networkidle');
      try { await page.locator('main').waitFor({ state: 'visible', timeout: 5_000 }); } catch { console.log(JSON.stringify({ route, errors })); results.push({ route, errors: [...errors], missingMain: true }); expect.soft(false, `${route}: main must render`).toBe(true); continue; }
      await page.screenshot({ path: testInfo.outputPath(`${width}-${route.replaceAll('/', '_')}.png`), fullPage: true });
      const metrics = await page.evaluate(() => ({
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        overflow: [...document.querySelectorAll('main *')].filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width && (rect.right > innerWidth + 2 || rect.left < -2) && getComputedStyle(el).position !== 'fixed';
        }).slice(0, 15).map(el => ({ tag: el.tagName, className: el.getAttribute('class'), text: el.textContent?.slice(0, 80), right: Math.round(el.getBoundingClientRect().right) })),
      }));
      const a11y = await new AxeBuilder({ page }).include('main').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      results.push({ route, ...metrics, errors: [...errors], consoleErrors: [...consoleErrors], violations: a11y.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })) });
      mkdirSync('/tmp/altitud-admin-inventory', { recursive: true });
      writeFileSync(`/tmp/altitud-admin-inventory/${width}.json`, JSON.stringify({ width, unexpected, results }, null, 2));
      console.log(JSON.stringify({ route, scrollWidth: metrics.scrollWidth, errors, violationCount: a11y.violations.length }));
      expect.soft(errors, `${route}: runtime errors`).toEqual([]);
      expect.soft(metrics.scrollWidth, `${route}: viewport overflow`).toBeLessThanOrEqual(width + 2);
    }
    await testInfo.attach('admin-layout-inventory', { body: JSON.stringify({ width, unexpected, results }, null, 2), contentType: 'application/json' });
    expect(unexpected, 'Every mock must match an observed API contract').toEqual([]);
    await context.close();
  });
}

test('mobile navigation stays on screen, traps focus and closes after navigation', async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const unexpected = await installAdminPreview(context);
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:2707/admin/dashboard');
  await page.waitForLoadState('networkidle');
  const trigger = page.getByRole('button', { name: 'Abrir navegación', exact: true });
  await trigger.click();
  const menu = page.getByRole('dialog', { name: 'Administración de 2707 Altitud' });
  await expect(menu).toBeVisible();
  for (let index = 0; index < 35; index++) {
    await page.keyboard.press('Tab');
    expect(await menu.evaluate(element => element.contains(document.activeElement)), 'Focus remains inside the menu').toBe(true);
  }
  await page.screenshot({ path: testInfo.outputPath('navigation-open.png'), fullPage: true });
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await menu.getByRole('button', { name: 'Clases', exact: true }).click();
  await menu.getByRole('link', { name: 'Disciplinas', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/classes\/types$/);
  await expect(menu).toBeHidden();
  await page.getByRole('button', { name: 'Notificaciones', exact: true }).click();
  await expect(page.getByText('Actividad reciente', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.keyboard.press('Escape');
  expect(unexpected).toEqual([]);
  await context.close();
});

test('mobile payment forms remain usable with a long member name and plan', async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 900 }, reducedMotion: 'reduce' });
  const unexpected = await installAdminPreview(context);
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:2707/admin/payments?tab=register');
  await page.waitForLoadState('networkidle');
  await page.getByRole('textbox', { name: 'Buscar cliente' }).fill('María');
  await page.getByRole('button', { name: /María Fernanda Hernández/ }).click();
  await page.getByRole('combobox', { name: 'Plan o paquete' }).click();
  await page.getByRole('option', { name: /Unlimited/ }).click();
  await page.getByRole('button', { name: 'Transferencia', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath('payment-member-selected.png'), fullPage: true });
  const a11y = await new AxeBuilder({ page }).include('main').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(a11y.violations).toEqual([]);
  await page.getByRole('button', { name: 'Invitado', exact: true }).click();
  await expect(page.getByPlaceholder('Nombre completo')).toBeVisible();
  await page.getByRole('combobox', { name: 'Clase a reservar' }).click();
  await page.getByRole('option', { name: /Híbrido/ }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath('payment-guest-selected.png'), fullPage: true });
  await page.goto('http://127.0.0.1:2707/admin/payments?tab=manual-income');
  await page.waitForLoadState('networkidle');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  expect((await new AxeBuilder({ page }).include('main').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  expect(unexpected).toEqual([]);
  await context.close();
});
