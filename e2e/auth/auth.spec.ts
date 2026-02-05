import { test, expect } from '@playwright/test';

test.describe('Auth Flows', () => {
  test('Signup flow (email/password)', async ({ page }) => {
    const timestamp = Date.now();
    const email = `e2e-test-${timestamp}@example.com`;
    const password = 'TestPassword123!';
    const name = 'E2E Test User';

    await page.goto('/signup');
    await page.getByTestId('signup-name').fill(name);
    await page.getByTestId('signup-email').fill(email);
    await page.getByTestId('signup-password').fill(password);
    await page.getByRole('button', { name: /sign up|create account/i }).click();

    await expect(page).toHaveURL(/\/(wizard|dashboard)/);
    await expect(page.getByTestId('login-form')).not.toBeVisible();
  });

  test('Login flow (email/password)', async ({ page }) => {
    const email = process.env.E2E_TEST_EMAIL;
    const password = process.env.E2E_TEST_PASSWORD;

    if (!email || !password) {
      test.skip();
      return;
    }

    await page.goto('/login');
    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill(password);
    await page.getByRole('button', { name: /sign in|login/i }).click();

    await expect(page).toHaveURL(/\/(dashboard|wizard)/);
    await expect(page.getByTestId('dashboard-content')).toBeVisible();
  });

  test('Logout flow', async ({ page }) => {
    const email = process.env.E2E_TEST_EMAIL;
    const password = process.env.E2E_TEST_PASSWORD;

    if (!email || !password) {
      test.skip();
      return;
    }

    await page.goto('/login');
    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill(password);
    await page.getByRole('button', { name: /sign in|login/i }).click();

    await expect(page).toHaveURL(/\/(dashboard|wizard)/);

    const userMenuTrigger = page.getByTestId('user-menu-trigger');
    const mobileMenuButton = page.getByRole('button', { name: /menu/i });
    if (await userMenuTrigger.isVisible()) {
      await userMenuTrigger.click();
    } else if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
    }
    await page.getByTestId('logout-button').first().click();
    await expect(page).toHaveURL(/\/(login|$)/);

    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('Protected route redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
    await expect(page.getByTestId('login-form')).toBeVisible();
  });

  test('Session restore after reload', async ({ page }) => {
    const email = process.env.E2E_TEST_EMAIL;
    const password = process.env.E2E_TEST_PASSWORD;

    if (!email || !password) {
      test.skip();
      return;
    }

    await page.goto('/login');
    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill(password);
    await page.getByRole('button', { name: /sign in|login/i }).click();

    await expect(page).toHaveURL(/\/(dashboard|wizard)/);

    await page.reload();
    await expect(page).toHaveURL(/\/(dashboard|wizard)/);
    await expect(page.getByTestId('login-form')).not.toBeVisible();
  });
});
