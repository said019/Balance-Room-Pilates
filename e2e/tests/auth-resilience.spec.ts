import { expect, test, type BrowserContext, type Route } from '@playwright/test';

const oldToken = 'synthetic-session-before-revalidation';
const newToken = 'synthetic-session-after-login';
const user = {
  id: 'b6813311-5411-4ab0-9619-f39f7d963244',
  email: 'auth-fixture@example.invalid', display_name: 'Prueba de sesión', role: 'client',
};

async function install(context: BrowserContext, handle: (route: Route) => Promise<void>) {
  await context.addInitScript(({ token, account }) => {
    if (sessionStorage.getItem('auth-fixture-installed')) return;
    sessionStorage.setItem('auth-fixture-installed', 'true');
    localStorage.setItem('altitud2707_token', token);
    localStorage.setItem('altitud2707-auth-storage', JSON.stringify({ state: { token, user: account, isAuthenticated: true }, version: 0 }));
  }, { token: oldToken, account: user });
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith('/api/')) return handle(route);
    // No credentials or API request can reach an external service.
    if (url.origin !== 'http://127.0.0.1:2707') return route.abort('blockedbyclient');
    return route.continue();
  });
}

for (const failure of ['503', 'network'] as const) {
  test(`${failure} keeps the session and supports retry`, async ({ context, page }) => {
    let recovered = false;
    await install(context, async route => {
      if (new URL(route.request().url()).pathname === '/api/auth/me') {
        if (recovered) return route.fulfill({ json: { user } });
        return failure === '503' ? route.fulfill({ status: 503, json: { error: 'Synthetic outage' } }) : route.abort('failed');
      }
      return route.fulfill({ json: [] });
    });
    await page.goto('/app/profile');
    await expect(page.getByRole('heading', { name: 'Volvemos en un momento' })).toBeVisible();
    await expect(page).toHaveURL(/\/app\/profile$/);
    expect(await page.evaluate(() => localStorage.getItem('altitud2707_token'))).toBe(oldToken);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('altitud2707-auth-storage')!).state.isAuthenticated)).toBe(true);
    recovered = true;
    await page.getByRole('button', { name: 'Intentar de nuevo' }).click();
    await expect(page.getByRole('heading', { name: 'Volvemos en un momento' })).toBeHidden();
    await expect(page).toHaveURL(/\/app\/profile$/);
    expect(await page.evaluate(() => localStorage.getItem('altitud2707_token'))).toBe(oldToken);
  });
}

test('401 for the current bearer removes only that session', async ({ context, page }) => {
  await install(context, route => route.fulfill({ status: 401, json: { error: 'Synthetic rejection', code: 'AUTH_SESSION_INVALID' } }));
  await page.goto('/app/profile');
  await expect(page).toHaveURL(/\/login\?returnUrl=/);
  expect(await page.evaluate(() => localStorage.getItem('altitud2707_token'))).toBeNull();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('altitud2707-auth-storage')!).state.isAuthenticated)).toBe(false);
});

for (const responseStatus of [401, 200]) {
  test(`late ${responseStatus} from an old session cannot replace a newer login`, async ({ context, page }) => {
    let release!: () => void;
    let requested!: () => void;
    const requestStarted = new Promise<void>(resolve => { requested = resolve; });
    const released = new Promise<void>(resolve => { release = resolve; });
    let oldRequests = 0;
    await install(context, async route => {
      if (new URL(route.request().url()).pathname === '/api/auth/me' && route.request().headers().authorization === `Bearer ${oldToken}`) {
        oldRequests++;
        requested();
        await released;
        return route.fulfill({ status: responseStatus, json: responseStatus === 200 ? { user } : { error: 'Old bearer expired', code: 'AUTH_SESSION_INVALID' } });
      }
      return route.fulfill({ json: [] });
    });
    await page.goto('/app/profile');
    await requestStarted;
    await page.evaluate(async ({ token, account }) => {
      const modulePath = '/src/stores/authStore.ts';
      const { useAuthStore } = await import(modulePath);
      useAuthStore.getState().setAuth({ ...account, display_name: 'Sesión nueva' }, token);
    }, { token: newToken, account: user });
    const complete = page.waitForResponse(response => response.url().endsWith('/api/auth/me') && response.status() === responseStatus);
    release();
    await complete;
    await expect.poll(async () => page.evaluate(async () => {
      const modulePath = '/src/stores/authStore.ts';
      const { useAuthStore } = await import(modulePath);
      const state = useAuthStore.getState();
      return { token: state.token, name: state.user?.display_name, authenticated: state.isAuthenticated };
    })).toEqual({ token: newToken, name: 'Sesión nueva', authenticated: true });
    expect(await page.evaluate(() => localStorage.getItem('altitud2707_token'))).toBe(newToken);
    await expect(page).toHaveURL(/\/app\/profile$/);
    expect(oldRequests, 'Concurrent validation uses one request per bearer').toBe(1);
  });
}
