import AxeBuilder from '@axe-core/playwright';
import { Page } from '@playwright/test';

/** Run Axe a11y check; expect no critical or serious violations. */
export async function runA11yCheck(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const criticalOrSerious = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );
  return criticalOrSerious;
}
