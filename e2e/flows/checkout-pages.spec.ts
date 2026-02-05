import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/user.json' });

test('Checkout success page shows success message', async ({ page }) => {
  await page.goto('/checkout/success');
  await expect(page).toHaveURL('/checkout/success');
  await expect(page.getByText(/success|thank you/i)).toBeVisible();
});

test('Checkout cancel page shows cancelled message', async ({ page }) => {
  await page.goto('/checkout/cancel');
  await expect(page).toHaveURL('/checkout/cancel');
  await expect(page.getByText(/cancelled|cancel/i)).toBeVisible();
});
