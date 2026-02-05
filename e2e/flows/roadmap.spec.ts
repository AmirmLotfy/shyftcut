import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/user.json' });

test('Roadmap page loads', async ({ page }) => {
  await page.goto('/roadmap');
  await expect(page).toHaveURL(/\/roadmap/);
  await expect(page.getByTestId('roadmap-list')).toBeVisible();
});
