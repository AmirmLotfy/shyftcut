# E2E tests (Playwright)

Run: `npm run test:e2e`

- By default, Playwright starts the dev server (`npm run dev`) and runs tests against http://localhost:8080.
- If the server is already running, it will be reused.
- To run against a different URL: `PLAYWRIGHT_BASE_URL=https://… npx playwright test`
- First time: `npx playwright install` (or `npx playwright install chromium`).
