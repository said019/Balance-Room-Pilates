import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

// Synthetic session tests only. Never load credential-based E2E fixtures.
export default defineConfig({
  testDir: './tests',
  testMatch: 'auth-resilience.spec.ts',
  outputDir: './reports/auth-resilience',
  workers: 1,
  reporter: [['list'], ['json', { outputFile: fileURLToPath(new URL('./reports/auth-resilience.json', import.meta.url)) }]],
  use: { headless: true, serviceWorkers: 'block', baseURL: 'http://127.0.0.1:2707' },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 2707 --strictPort',
    url: 'http://127.0.0.1:2707',
    reuseExistingServer: true,
  },
});
