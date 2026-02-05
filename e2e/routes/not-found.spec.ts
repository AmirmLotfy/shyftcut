import { test, expect } from '@playwright/test';

test('404 page loads for unknown route', async ({ page }) => {
  await page.goto('/unknown-route-xyz');
  await expect(page).toHaveURL('/unknown-route-xyz');
  await expect(page.getByRole('heading', { name: /404|not found|page not found/i })).toBeVisible();
});
