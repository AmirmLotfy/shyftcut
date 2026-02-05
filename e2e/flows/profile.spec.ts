import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/user.json' });

test('Profile page loads and shows form', async ({ page }) => {
  await page.goto('/profile');
  await expect(page).toHaveURL('/profile');
  await expect(page.getByTestId('profile-form')).toBeVisible();
});
