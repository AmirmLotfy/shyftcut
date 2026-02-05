import { test, expect } from '@playwright/test';
import { runA11yCheck } from '../helpers/a11y';

test.describe('Accessibility - public pages', () => {
  const publicPages = [
    { path: '/pricing', name: 'Pricing' },
    { path: '/contact', name: 'Contact' },
    { path: '/blog', name: 'Blog' },
    { path: '/about', name: 'About' },
  ];

  for (const { path, name } of publicPages) {
    test(`${name} has no critical a11y violations`, async ({ page }) => {
      await page.goto(path);
      const violations = await runA11yCheck(page);
      expect(violations).toEqual([]);
    });
  }
});

test.describe('Accessibility - protected pages', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  const protectedPages = [
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/roadmap', name: 'Roadmap' },
    { path: '/profile', name: 'Profile' },
    { path: '/chat', name: 'Chat' },
    { path: '/courses', name: 'Courses' },
  ];

  for (const { path, name } of protectedPages) {
    test(`${name} has no critical a11y violations`, async ({ page }) => {
      await page.goto(path);
      const violations = await runA11yCheck(page);
      expect(violations).toEqual([]);
    });
  }
});
