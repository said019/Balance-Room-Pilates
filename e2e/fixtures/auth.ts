import { test as base, Page, expect } from "@playwright/test";

// ──────────────────────────────────────────────────────────────
// Shared user credential fixtures
// ──────────────────────────────────────────────────────────────

export type UserRole = "admin" | "client" | "coach";

export interface UserCredentials {
  email: string;
  password: string;
  role: UserRole;
}

/** Resolves credentials from env vars at test-run time */
export function credentialsFor(role: UserRole): UserCredentials {
  const prefix = role.toUpperCase();
  const email = process.env[`${prefix}_EMAIL`];
  const password = process.env[`${prefix}_PASSWORD`];
  if (!email || !password) throw new Error(`Configura ${prefix}_EMAIL y ${prefix}_PASSWORD para una cuenta de pruebas autorizada.`);
  return { email, password, role };
}

// ──────────────────────────────────────────────────────────────
// Login helper — reusable across all tests
// ──────────────────────────────────────────────────────────────

export async function loginAs(page: Page, role: UserRole): Promise<void> {
  const { email, password } = credentialsFor(role);
  const loginPath = role === "coach" ? "/coach/login" : "/login";
  await page.goto(loginPath);

  await page.getByLabel(/correo|email/i).fill(email);
  await page.getByLabel(/contraseña|password/i).fill(password);
  await page.getByRole("button", { name: /iniciar|entrar|login|sign in/i }).click();

  // Wait for redirect away from the login page
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 15_000,
  });
}

// ──────────────────────────────────────────────────────────────
// Fixture types
// ──────────────────────────────────────────────────────────────

type AuthFixtures = {
  adminPage: Page;
  clientPage: Page;
  coachPage: Page;
};

/**
 * Extended test with pre-authenticated page fixtures for each role.
 *
 * Usage:
 *   import { test } from '../fixtures/auth';
 *   test('admin can see dashboard', async ({ adminPage }) => { … });
 */
export const test = base.extend<AuthFixtures>({
  adminPage: async ({ page }, use) => {
    await loginAs(page, "admin");
    await use(page);
  },

  clientPage: async ({ page }, use) => {
    await loginAs(page, "client");
    await use(page);
  },

  coachPage: async ({ page }, use) => {
    await loginAs(page, "coach");
    await use(page);
  },
});

export { expect };
