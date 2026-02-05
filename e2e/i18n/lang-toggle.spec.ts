import { test, expect } from '@playwright/test';

test.describe('Language toggle', () => {
  test('toggles to Arabic and sets RTL', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');

    const html = page.locator('html');
    const initialDir = await html.getAttribute('dir');
    const initialLang = await html.getAttribute('lang');

    // Click language toggle (desktop or open mobile menu first)
    const langToggle = page.getByTestId('lang-toggle');
    const mobileMenu = page.getByRole('button', { name: /menu/i });

    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await page.getByTestId('lang-toggle').first().click();
    } else {
      await langToggle.first().click();
    }

    await expect(html).toHaveAttribute('dir', /rtl|ltr/);
    await expect(html).toHaveAttribute('lang', /ar|en/);

    // If we started in en, we should now be ar with RTL
    if (initialLang === 'en') {
      await expect(html).toHaveAttribute('dir', 'rtl');
      await expect(html).toHaveAttribute('lang', 'ar');
    }
  });
});
