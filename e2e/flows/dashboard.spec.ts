import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/user.json' });

test('Dashboard loads and shows content', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByTestId('dashboard-content')).toBeVisible();
});
