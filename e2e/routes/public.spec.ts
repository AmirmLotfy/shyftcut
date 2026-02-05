import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Public Routes', () => {
  test('Landing page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Landing page has no critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);
  });

  test('Login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(page.getByTestId('login-email')).toBeVisible();
    await expect(page.getByTestId('login-password')).toBeVisible();
    await expect(page.getByRole('link', { name: /sign up|signup/i })).toBeVisible();
  });

  test('Login page has no critical accessibility violations', async ({ page }) => {
    await page.goto('/login');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);
  });

  test('Signup page loads', async ({ page }) => {
    await page.goto('/signup');
    await expect(page).toHaveURL('/signup');
    await expect(page.getByTestId('signup-form')).toBeVisible();
    await expect(page.getByTestId('signup-name')).toBeVisible();
    await expect(page.getByTestId('signup-email')).toBeVisible();
    await expect(page.getByTestId('signup-password')).toBeVisible();
    await expect(page.getByRole('link', { name: /log in|login/i })).toBeVisible();
  });

  test('Signup page has no critical accessibility violations', async ({ page }) => {
    await page.goto('/signup');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);
  });

  test('Pricing page loads', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page).toHaveURL('/pricing');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Terms page loads', async ({ page }) => {
    await page.goto('/terms');
    await expect(page).toHaveURL('/terms');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Privacy page loads', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page).toHaveURL('/privacy');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Cookies page loads', async ({ page }) => {
    await page.goto('/cookies');
    await expect(page).toHaveURL('/cookies');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Refund page loads', async ({ page }) => {
    await page.goto('/refund');
    await expect(page).toHaveURL('/refund');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('About page loads', async ({ page }) => {
    await page.goto('/about');
    await expect(page).toHaveURL('/about');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Careers page loads', async ({ page }) => {
    await page.goto('/careers');
    await expect(page).toHaveURL('/careers');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Contact page loads', async ({ page }) => {
    await page.goto('/contact');
    await expect(page).toHaveURL('/contact');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Blog page loads with posts', async ({ page }) => {
    await page.goto('/blog');
    await expect(page).toHaveURL('/blog');
    await expect(page.getByTestId('blog-card-how-to-transition-into-tech')).toBeVisible();
  });

  test('Blog post page loads', async ({ page }) => {
    await page.goto('/blog/how-to-transition-into-tech');
    await expect(page).toHaveURL('/blog/how-to-transition-into-tech');
    await expect(page.getByRole('article')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
