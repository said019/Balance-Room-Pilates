import { expect, test } from '@playwright/test';

const user = {
  id: 'b77924ab-2119-442b-acf4-546856d36073',
  email: 'booking-flow@example.invalid',
  display_name: 'Prueba de reserva',
  role: 'client',
};

test.beforeEach(async ({ page }) => {
  // No real accounts, bookings or API writes are made by these flow tests.
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/auth/login') || path.endsWith('/auth/register')) {
      return route.fulfill({ json: { user, token: 'booking-flow-test-token' } });
    }
    if (path.endsWith('/auth/me')) return route.fulfill({ json: { user } });
    if (path.endsWith('/memberships/me')) {
      return route.fulfill({ status: 404, json: { error: 'No tienes membresía activa' } });
    }
    return route.fulfill({ json: [] });
  });
});

test('public booking button requires sign-in', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Encuentra tu clase' }).click();
  await expect(page).toHaveURL(/\/login\?returnUrl=%2Fapp%2Fbook$/);
  await expect(page.getByText('Inicia sesión para reservar tu clase.', { exact: false })).toBeVisible();
  await expect(page.getByText('AGENDA DE MUESTRA')).toHaveCount(0);
});

test('direct booking link keeps its filter after login and reload', async ({ page }) => {
  await page.goto('/reservar?tipo=H%C3%ADbrido');
  await expect(page).toHaveURL(/\/login\?returnUrl=/);
  expect(new URL(page.url()).searchParams.get('returnUrl')).toBe('/app/book?tipo=H%C3%ADbrido');
  await page.getByLabel('Correo electrónico').fill(user.email);
  await page.getByLabel('Contraseña', { exact: true }).fill('TestPassword8');
  await page.getByRole('button', { name: 'Entrar a mi cuenta' }).click();
  await expect(page).toHaveURL(/\/app\/book\?tipo=H%C3%ADbrido$/);
  await expect(page.locator('#member-content')).toBeVisible();
  await page.reload();
  await expect(page.locator('#member-content')).toBeVisible();
});

test('registration keeps the booking destination', async ({ page }) => {
  await page.goto('/reservar?tipo=Funcional');
  await page.getByRole('link', { name: 'Crea tu cuenta' }).click();
  await expect(page).toHaveURL(/\/register\?returnUrl=/);
  expect(new URL(page.url()).searchParams.get('returnUrl')).toBe('/app/book?tipo=Funcional');
  await page.getByLabel('Nombre completo').fill(user.display_name);
  await page.getByLabel('Correo electrónico').fill(user.email);
  await page.getByLabel('Teléfono').fill('+525550000000');
  await page.getByLabel('Contraseña', { exact: true }).fill('TestPassword8');
  await page.getByLabel('Confirmar contraseña').fill('TestPassword8');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Crear mi cuenta' }).click();
  await expect(page).toHaveURL(/\/app\/book\?tipo=Funcional$/);
  await expect(page.locator('#member-content')).toBeVisible();
});

test('password recovery and sign-in retain the destination', async ({ page }) => {
  await page.goto('/reservar');
  await page.getByRole('link', { name: '¿La olvidaste?' }).click();
  await expect(page).toHaveURL(/\/forgot-password\?returnUrl=%2Fapp%2Fbook$/);
  await page.getByRole('link', { name: 'Ya tengo cuenta.' }).click();
  await expect(page).toHaveURL(/\/login\?returnUrl=%2Fapp%2Fbook$/);
});

test('members with a valid session go straight to booking', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('altitud2707_token', 'booking-flow-test-token'));
  await page.goto('/reservar');
  await expect(page).toHaveURL(/\/app\/book$/);
  await expect(page.locator('#member-content')).toBeVisible();
});

test('an expired session retains the requested booking route', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('expired-fixture-set')) {
      localStorage.setItem('altitud2707_token', 'expired-test-token');
      sessionStorage.setItem('expired-fixture-set', 'true');
    }
  });
  await page.route('**/api/auth/me', route => route.fulfill({ status: 401, json: { error: 'Sesión vencida' } }));
  await page.goto('/app/book?tipo=Funcional');
  await expect(page).toHaveURL(/\/login\?returnUrl=/);
  expect(new URL(page.url()).searchParams.get('returnUrl')).toBe('/app/book?tipo=Funcional');
});

test('the explicitly labelled preview stays public', async ({ page }) => {
  await page.goto('/app/preview/book');
  await expect(page.locator('#member-content')).toBeVisible();
  await expect(page.locator('.member-preview')).toBeVisible();
});
