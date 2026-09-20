import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

/** Dedicated local suite: never loads the existing credential-based fixtures. */
export default defineConfig({
  testDir: './tests',
  testMatch: 'admin-mobile.spec.ts',
  outputDir: './reports/admin-mobile',
  workers: 2,
  reporter: [['list'], ['json', { outputFile: fileURLToPath(new URL('./reports/admin-mobile.json', import.meta.url)) }]],
  use: { headless: true },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 2707 --strictPort',
    url: 'http://127.0.0.1:2707',
    reuseExistingServer: true,
  },
});
