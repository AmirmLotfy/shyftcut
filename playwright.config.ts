import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  globalSetup: path.join(__dirname, 'e2e', 'global-setup.ts'),
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: [/e2e\/routes\/protected\.spec\.ts/, /e2e\/flows\/.*\.spec\.ts/],
    },
    {
      name: 'chromium-authenticated',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      testMatch: [/e2e\/routes\/protected\.spec\.ts/, /e2e\/flows\/.*\.spec\.ts/, /e2e\/a11y\/.*\.spec\.ts/],
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 5'] },
      testMatch: [/e2e\/routes\/public\.spec\.ts/, /e2e\/auth\/auth\.spec\.ts/, /e2e\/i18n\/.*\.spec\.ts/],
    },
    {
      name: 'mobile-chromium-authenticated',
      use: {
        ...devices['Pixel 5'],
        storageState: 'e2e/.auth/user.json',
      },
      testMatch: [/e2e\/flows\/wizard\.spec\.ts/],
    },
  ],
  webServer: {
    command: 'VITE_E2E=true npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
});
