import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { requireE2EDatabaseUrl } from '../backend/scripts/e2e-database-url.mjs';

const databaseUrl = requireE2EDatabaseUrl();
export default defineConfig({
  testDir: './e2e', fullyParallel: false, workers: 1, retries: 0,
  timeout: 30_000, expect: { timeout: 10_000 }, forbidOnly: Boolean(process.env.CI),
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:54322', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    { name: 'E2E backend', command: 'npm run test:serve-e2e',
      cwd: fileURLToPath(new URL('../backend', import.meta.url)),
      env: { TEST_DATABASE_URL: databaseUrl },
      url: 'http://127.0.0.1:54321/api/health/ready', reuseExistingServer: false, timeout: 90_000 },
    { name: 'E2E frontend', command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 54322 --strictPort',
      env: { VITE_API_BASE_URL: 'http://127.0.0.1:54321/api' },
      url: 'http://127.0.0.1:54322', reuseExistingServer: false, timeout: 90_000 },
  ],
});
