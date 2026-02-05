import { chromium, FullConfig } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:4173';
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  if (!email || !password) {
    console.warn(
      '[E2E] E2E_TEST_EMAIL and E2E_TEST_PASSWORD not set. Auth setup skipped. Protected tests (dashboard, wizard, roadmap, profile, chat, flows) will fail or be skipped. Add these secrets to run full suite.'
    );
    // Create empty storage state so tests can still run (they'll fail on protected routes)
    const authDir = path.join(__dirname, '.auth');
    const fs = await import('fs');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(authDir, 'user.json'),
      JSON.stringify({ cookies: [], origins: [] })
    );
    return;
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  try {
    await page.goto('/login');
    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill(password);
    await page.getByRole('button', { name: /sign in|login/i }).click();

    await page.waitForURL(/\/(dashboard|wizard)/, { timeout: 15000 });
    await context.storageState({ path: path.join(__dirname, '.auth', 'user.json') });
  } catch (error) {
    console.error('Auth setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
