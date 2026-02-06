import { test, expect } from '@playwright/test';

/**
 * E2E: Guest visiting a protected route is redirected to login,
 * and the login page is shown (full "after login lands on dashboard" requires auth credentials).
 */
test.describe('Dashboard protection', () => {
  test('guest visiting /dashboard is redirected to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId('login-form')).toBeVisible();
  });

  test('guest visiting /profile is redirected to /login', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);
  });

  test('guest visiting /roadmap is redirected to /login', async ({ page }) => {
    await page.goto('/roadmap');
    await expect(page).toHaveURL(/\/login/);
  });
});
