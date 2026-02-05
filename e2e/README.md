# E2E Tests (Playwright)

End-to-end tests for Shyftcut covering all routes, auth flows, and critical user journeys.

## Setup

1. Install dependencies: `npm install`
2. Install Playwright browsers (if not already): `npx playwright install chromium`
3. Create a test user (optional for protected tests):
   - Sign up at `/signup` or use an existing user
   - Set env vars in `.env`: `E2E_TEST_EMAIL` and `E2E_TEST_PASSWORD`

## Running Tests

- **All tests**: `npm run test:e2e`
- **UI mode** (interactive): `npm run test:e2e:ui`
- **Headed** (see browser): `npm run test:e2e:headed`
- **Debug**: `npm run test:e2e:debug`

## Test Structure

- `e2e/routes/` - Public, protected, and 404 route tests
- `e2e/auth/` - Signup, login, logout, protected redirect, session restore
- `e2e/flows/` - Wizard, dashboard, roadmap, profile, checkout, chat
- `e2e/api/` - Optional API smoke test

## CI

Tests run in GitHub Actions on push/PR to `main`. Requires secrets:
- `E2E_TEST_EMAIL`
- `E2E_TEST_PASSWORD`

## Environment

- **Local (default)**: Uses `npm run build && npm run preview` (port 4173). API is not available with preview-only.
- **Full stack**: Run `vercel dev` in one terminal, then `npm run test:e2e:fullstack` (or `PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e`). Requires Vercel CLI.
- **API smoke**: Set `PLAYWRIGHT_API_URL` or `VITE_API_URL` to your Supabase Edge base URL to run API smoke test (GET /api/profile → 401).

## Test IDs

See `e2e/test-ids.ts` for centralized test IDs. Add new IDs when introducing flows.
