/**
 * Playwright config for full-stack E2E (API + frontend).
 * Run `vercel dev` in another terminal, then: npm run test:e2e:fullstack
 * Or set PLAYWRIGHT_BASE_URL to a deployed preview URL.
 */
import baseConfig from './playwright.config';

const { webServer: _, ...rest } = baseConfig;
export default {
  ...rest,
  use: {
    ...baseConfig.use,
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
  },
};
