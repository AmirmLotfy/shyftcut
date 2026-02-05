# API & Auth Flow Audit

Comprehensive audit of API endpoints, auth flows, and identified gaps/issues.

---

## 1. Bug Fixed

### Route function – undefined `p3`/`p4` (fixed)
- **Issue:** `route()` used `p3` and `p4` for community routes (`/api/community/groups/:id/join`, `/api/community/chat/room/:id/messages`) but they were never defined.
- **Impact:** `/api/community/groups/{id}/join` would route to `community/groups/id` instead of `community/groups/join`; join/leave/members actions could fail or behave incorrectly.
- **Fix:** Added `const p3 = parts[3]; const p4 = parts[4];` in `supabase/functions/api/index.ts`.

---

## 2. API Endpoints

### Public (no auth)

| Endpoint | Method | Notes |
|----------|--------|-------|
| `/api/contact` | POST | Contact form; requires `email`, `message` |
| `/api/newsletter` | POST | Newsletter signup; requires `email` |
| `/api/roadmap/generate-guest` | POST | Guest roadmap; rate-limited by IP (3/hour) |
| `/api/vapid-public` | GET | VAPID public key for push |
| `/api/unsubscribe-email` | GET | Unsubscribe link; token in query |
| `/api/admin/batch` | POST | Admin-only; `X-Admin-Secret` header |
| `/api/jobs/weekly` | GET | Weekly jobs (no auth) |

### Auth required

| Endpoint | Method | Notes |
|----------|--------|-------|
| `/api/profile` | GET, PATCH | Profile CRUD |
| `/api/profile/avatar/upload` | POST | Avatar upload |
| `/api/profile/avatar/generate` | POST | AI avatar generate |
| `/api/auth/account` | GET | Account info (has_password, has_google) |
| `/api/auth/set-password` | POST | Set password (passwordless users) |
| `/api/auth/change-password` | POST | Change password |
| `/api/roadmaps` | GET | List roadmaps |
| `/api/roadmap` (query `?id=`) | GET | Single roadmap |
| `/api/roadmap/active` | GET | Active roadmap |
| `/api/roadmap/weeks/complete` | POST | Mark week complete |
| `/api/roadmap/generate` | POST | Generate roadmap (auth) |
| `/api/subscription` | GET | Subscription status |
| `/api/usage` | GET | Usage limits |
| `/api/analytics` | GET | Analytics |
| `/api/courses/:id` | PATCH | Mark course complete |
| `/api/notes` | GET, POST | Notes |
| `/api/notes/:id` | PATCH, DELETE | Single note |
| `/api/tasks` | GET, POST | Tasks |
| `/api/tasks/:id` | PATCH, DELETE | Single task |
| `/api/tasks/suggest` | POST | AI task suggestions |
| `/api/chat` | POST | Chat (streaming) |
| `/api/chat/history` | GET, DELETE | Chat history |
| `/api/chat/messages` | POST | Persist messages |
| `/api/quiz/generate` | POST | Generate quiz |
| `/api/quiz/results` | POST | Submit quiz results |
| `/api/checkout/create` | POST | Create Polar checkout |
| `/api/checkout/portal` | GET | Customer portal URL |
| `/api/cv/analyze` | POST | CV analysis (Gemini) |
| `/api/jobs/list` | GET | Saved jobs |
| `/api/jobs/find` | POST | Find jobs (Gemini grounding) |
| `/api/study-streak` | GET | Study streak |
| `/api/study-activity` | POST | Log study activity |
| `/api/notification-preferences` | GET, PATCH | Notification prefs |
| `/api/push-subscription` | POST, DELETE | Push subscription |
| `/api/community/peers` | GET | Peers |
| `/api/community/connections` | GET, POST, DELETE | Connections |
| `/api/community/leaderboard` | GET | Leaderboard |
| `/api/community/groups` | GET, POST | Study groups |
| `/api/community/groups/:id` | GET, PATCH, DELETE | Single group |
| `/api/community/groups/:id/join` | POST | Join group |
| `/api/community/groups/:id/leave` | DELETE | Leave group |
| `/api/community/groups/:id/members` | GET | Group members |
| `/api/community/groups/top-by-streak` | GET | Top by streak |
| `/api/community/chat/room/:id` | GET, POST | Chat room |
| `/api/community/chat/room/:id/messages` | GET, POST | Chat messages |
| `/api/community/badges` | GET | Badges |
| `/api/community/me/badges` | GET | User badges |
| `/api/support` | POST | Support form (auth) |

---

## 3. Auth Flows

### Sign up (email + password)
- **Flow:** Signup → Supabase `signUp` → email confirmation (if enabled) or immediate session
- **Gaps:** If email confirmation is ON, user sees "Check your email" and cannot access app until they confirm. E2E signup test may fail if confirmation is required (test expects redirect to wizard/dashboard).
- **Recommendation:** For E2E, either disable email confirmation in Supabase test project or use a test inbox.

### Sign in (email + password)
- **Flow:** Login → `signInWithPassword` → session → redirect
- **Status:** Implemented and covered by E2E.

### Magic link
- **Flow:** Login → Email link tab → `signInWithOtp` → email sent → user clicks link → lands on `/login` with hash → Supabase parses hash → session
- **Gaps:** E2E does not test magic link. Manual test recommended.
- **Note:** Magic link redirects to `/login`; hash-based auth should work with existing `onAuthStateChange` + `getSession`.

### Google OAuth
- **Flow:** `signInWithOAuth` → redirect to Google → callback with hash → session
- **Status:** Implemented. Ensure redirect URLs include `/login` and root.

### Password reset
- **Flow:** ForgotPassword → `resetPasswordForEmail` → email → user clicks link → `/reset-password` with hash → `updateUser({ password })` → success
- **Status:** Implemented. E2E does not cover reset flow.

### Session restore
- **Flow:** `getSession()` on load; `onAuthStateChange` for refresh
- **Status:** Implemented. E2E covers reload.

### 401 handling
- **Flow:** API returns 401 → `apiFetch` calls `onUnauthorized` → clear session, redirect to `/login?expired=1`
- **Override:** `skipUnauthorizedLogout: true` used for checkout/portal to avoid logout on session expiry during upgrade.

---

## 4. Potential Gaps & Issues

### Auth
1. **hCaptcha + E2E:** If `VITE_HCAPTCHA_SITE_KEY` is set, signup/login submit is disabled until captcha is solved. E2E tests do not solve captcha. Consider using a test key or disabling captcha in test env.
2. **Magic link E2E:** No automated test for magic link. Add manual test or E2E with email testing service.
3. **Google OAuth E2E:** No automated test for Google sign-in (requires real Google account and consent).

### API
4. **`support` vs `contact`:** Support is auth-required; contact is public. Ensure both have correct rate limiting and abuse protection.
5. **Guest roadmap rate limit:** In-memory map; resets on cold start. For production scale, consider Redis or similar.
6. **Checkout 401:** Checkout/create and checkout/portal use `skipUnauthorizedLogout`; ensure UX handles "session expired" clearly (e.g. toast + stay on page).

### Frontend
7. **Login magic link tab:** Default tab is "Password". Magic link users must switch tab. Consider persisting last-used mode in localStorage.
8. **Reset password redirect:** After successful reset, user is signed in. Ensure redirect goes to dashboard/wizard, not stuck on reset page.

---

## 5. How to Run Tests

### Unit tests
```bash
npm run test
```

### E2E (Playwright)
```bash
# Requires VITE_API_URL or PLAYWRIGHT_API_URL for API smoke
# Requires E2E_TEST_EMAIL + E2E_TEST_PASSWORD for auth tests
npm run test:e2e
```

### API smoke (manual)
```bash
# Set VITE_API_URL to your Supabase Edge Function URL, e.g.:
# VITE_API_URL=https://qydmjbiwukwlmblosolb.supabase.co/functions/v1
npm run test:e2e -- e2e/api/smoke.spec.ts
```

### API endpoint test script
```bash
node scripts/test-api-endpoints.mjs
```

---

## 6. Checklist for Production

- [ ] Email confirmation: Custom SMTP configured (Resend)
- [ ] Magic link: Email template configured in Supabase
- [ ] Redirect URLs: Include production + localhost for dev
- [ ] hCaptcha: Site key in Vercel env; enabled in Supabase
- [ ] Secrets: GEMINI_API_KEY, POLAR_*, RESEND_API_KEY set in Supabase
- [ ] Rate limits: Guest roadmap, contact, newsletter reviewed
