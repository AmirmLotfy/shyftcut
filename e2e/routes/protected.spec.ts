import { test, expect } from '@playwright/test';

test.describe('Protected Routes', () => {
  test('Dashboard loads', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId('dashboard-content')).toBeVisible();
  });

  test('Wizard loads', async ({ page }) => {
    await page.goto('/wizard');
    await expect(page).toHaveURL('/wizard');
    await expect(page.getByTestId('wizard-form')).toBeVisible();
  });

  test('Roadmap list loads', async ({ page }) => {
    await page.goto('/roadmap');
    await expect(page).toHaveURL(/\/roadmap/);
    await expect(page.getByTestId('roadmap-list')).toBeVisible();
  });

  test('Profile loads', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL('/profile');
    await expect(page.getByTestId('profile-form')).toBeVisible();
  });

  test('Chat loads', async ({ page }) => {
    await page.goto('/chat');
    await expect(page).toHaveURL('/chat');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Courses loads', async ({ page }) => {
    await page.goto('/courses');
    await expect(page).toHaveURL('/courses');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Checkout success loads', async ({ page }) => {
    await page.goto('/checkout/success');
    await expect(page).toHaveURL('/checkout/success');
    await expect(page.getByText(/thank you|success/i)).toBeVisible();
  });

  test('Checkout cancel loads', async ({ page }) => {
    await page.goto('/checkout/cancel');
    await expect(page).toHaveURL('/checkout/cancel');
    await expect(page.getByText(/cancelled|cancel/i)).toBeVisible();
  });
});
