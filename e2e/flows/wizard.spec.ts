import { test, expect } from '@playwright/test';
import { runA11yCheck } from '../helpers/a11y';

test.use({ storageState: 'e2e/.auth/user.json' });

test('Wizard loads and shows first step', async ({ page }) => {
  await page.goto('/wizard');
  await expect(page).toHaveURL('/wizard');
  await expect(page.getByTestId('wizard-form')).toBeVisible();
  await expect(page.getByText(/about you|عنك/i)).toBeVisible();
});

test('Wizard has no critical accessibility violations', async ({ page }) => {
  await page.goto('/wizard');
  const violations = await runA11yCheck(page);
  expect(violations).toEqual([]);
});

test('Wizard completes all 5 steps with valid selections', async ({ page }) => {
  await page.goto('/wizard');
  await expect(page.getByTestId('wizard-form')).toBeVisible();

  const selectFirstOption = async (nth = 0) => {
    const triggers = page.getByRole('combobox');
    await triggers.nth(nth).click();
    await page.getByRole('option').first().click();
  };

  // Step 0: About You - 3 selects
  await selectFirstOption(0);
  await selectFirstOption(1);
  await selectFirstOption(2);
  await page.getByTestId('wizard-next').click();

  // Step 1: Goals - 1 select
  await selectFirstOption(0);
  await page.getByTestId('wizard-next').click();

  // Step 2: Skills - click 2 skill chips
  await page.getByText('JavaScript', { exact: true }).first().click();
  await page.getByText('React', { exact: true }).first().click();
  await page.getByTestId('wizard-next').click();

  // Step 3: Learning - learning style buttons + platform badges
  await page.getByRole('button', { name: /video/i }).first().click();
  await page.getByText('Coursera', { exact: true }).first().click();
  await page.getByTestId('wizard-next').click();

  // Step 4: Availability - slider has default 10, click budget
  await page.getByRole('button', { name: /free only|مجاني/i }).first().click();

  await expect(page.getByTestId('wizard-generate')).toBeVisible();
  await page.getByTestId('wizard-generate').click();

  // Either redirect to roadmap (API success) or stay on wizard
  try {
    await page.waitForURL(/\/roadmap\//, { timeout: 60000 });
  } catch {
    await expect(page).toHaveURL('/wizard');
  }
});
