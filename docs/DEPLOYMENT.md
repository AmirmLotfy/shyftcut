# Shyftcut Deployment Guide

Single source of truth for deploying Shyftcut. Covers Vercel (frontend), Supabase (API, auth, DB), Polar (payments), and required secrets.

---

## Before pushing to GitHub

- **Never commit** `.env`, `.env.local`, `.env.vercel`, `.env.vapid`, or any file containing API keys, passwords, or tokens. These are in `.gitignore`.
- Use **`.env.example`** as a template only; copy to `.env` and fill in values locally.
- If you use `git init` for the first time, run `git status` and ensure no env or secret files are staged.

---

## Architecture Overview

```
┌─────────────┐     ┌──────────────────────────────┐     ┌─────────────┐
│   Vercel    │     │ Supabase Edge Functions      │     │  Supabase   │
│  (Static    │────▶│ api, webhook-polar           │────▶│  Auth + DB  │
│   SPA)      │     │ (Deno)                       │     │             │
└─────────────┘     └──────────────────────────────┘     └─────────────┘
       │                          │
       │                          ├── Gemini (AI)
       │                          ├── Polar (payments)
       │                          └── Resend (email)
```

---

## 1. Vercel (Frontend)

**Build:** `npm run build` → `dist/`

### Required env vars

| Variable | Purpose |
|----------|---------|
| **VITE_SUPABASE_URL** | Supabase project URL |
| **VITE_SUPABASE_ANON_KEY** | Supabase anon key |
| **VITE_API_URL** | `https://<project-ref>.supabase.co/functions/v1` |

### Optional

| Variable | Purpose |
|----------|---------|
| **VITE_APP_ORIGIN** | Canonical URL for SEO |
| **VITE_SENTRY_DSN** | Sentry error tracking |
| **E2E_TEST_EMAIL** | E2E test user (CI) |
| **E2E_TEST_PASSWORD** | E2E test password (CI) |

---

## 2. Supabase Edge Functions

Deploy from project root:

```bash
npx supabase functions deploy api --no-verify-jwt
npx supabase functions deploy webhook-polar --no-verify-jwt
npx supabase functions deploy send-study-reminders --no-verify-jwt
npx supabase functions deploy send-push-reminders --no-verify-jwt
npx supabase functions deploy courses-search
```

Or run everything (migrations, secrets sync, all functions, Vercel prod):

```bash
npm run deploy:all
```

Optional flags: `--skip-migrations`, `--skip-vercel`.

### Secrets (Supabase Dashboard → Edge Functions → Secrets)

Supabase auto-injects: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

**You must set:**

| Secret | Required | Used by | Purpose |
|--------|----------|---------|---------|
| **GEMINI_API_KEY** | Yes | api | Gemini AI (roadmap, chat, quiz) |
| **POLAR_ACCESS_TOKEN** | Yes | api | Polar checkout |
| **POLAR_WEBHOOK_SECRET** | Yes | webhook-polar | Webhook verification |
| **RESEND_API_KEY** | Yes | api, webhook-polar | Email (contact, newsletter, welcome) |
| **FROM_EMAIL** | Yes | api, webhook-polar | Sender email |
| **CONTACT_TO_EMAIL** | Yes | api | Contact form recipient |

**Optional:** `GEMINI_MODEL`, `CORS_ORIGIN`, `SITE_URL` (for study reminder emails and unsubscribe links; e.g. `https://shyftcut.com`), `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` (for Web Push reminders; generate with `npx web-push generate-vapid-keys`). For admin-only batch API (bulk quiz generation), set `ADMIN_SECRET` and send header `X-Admin-Secret` when calling `POST /api/admin/batch` or `GET /api/admin/batch/:batchId`.

**Gemini 3 only:** The app uses only Gemini 3 models. Supported model IDs: `gemini-3-flash-preview` (default), `gemini-3-pro-preview`, `gemini-3-pro-image-preview` (for AI avatar generation). Set `GEMINI_MODEL` to override the default text model. Roadmap generation uses **Grounding with Google Search** plus structured JSON output for real course URLs; chat uses Google Search when the client sends `useSearch: true`.

**Optional:** `GEMINI_ROADMAP_THINKING_LEVEL` — set to `high` for deeper reasoning (slower, more tokens); default is `low` for lower latency on roadmap generation. `GEMINI_AVATAR_IMAGE_SIZE` — `2K` (default) or `4K` for AI avatar resolution.

### Gemini 3 performance and latency (best practices)

- **Thinking level:** Roadmap uses `thinkingLevel: "low"` by default (~faster, lower cost); set `GEMINI_ROADMAP_THINKING_LEVEL=high` for more depth. Chat and task-suggest use `low`; quiz and (optional) roadmap use `high` when configured.
- **Context caching:** Chat caches the system instruction when it is long (see `MIN_SYSTEM_PROMPT_LENGTH_FOR_CACHE` in `gemini.ts`) to reduce tokens and latency on follow-up messages.
- **Timeouts and retries:** All Gemini calls use a 90s timeout and one retry on 429 (see `gemini.ts`). Responses consistently over ~5s may indicate quota or network issues.
- **Concise prompts:** System prompts use XML sections (`<role>`, `<context>`, `<task>`) and “Based on the information above” to keep context clear and reduce noise.
- **Structured output:** Roadmap and quiz use `responseMimeType: application/json` (with schema or function calling) so the model returns parseable JSON in one shot.

### Gemini 3 rate limits and quotas

Rate limits are enforced **per Google Cloud project** (not per API key). Check [Gemini API rate limits](https://ai.google.dev/gemini-api/docs/rate-limits) and [Google AI Studio usage](https://aistudio.google.com/usage) for your project’s current limits. Typical dimensions:

| Dimension | Description |
|-----------|-------------|
| **RPM** | Requests per minute |
| **TPM** | Tokens per minute |
| **RPD** | Requests per day |
| **IPM** | Images per minute (for `gemini-3-pro-image-preview`) |

Free tier is typically low (e.g. 5 RPM, 25 RPD); paid tiers increase RPM/TPM/RPD. Preview models may have stricter limits. Exceeding any dimension returns **429**; the API retries once on 429 and then returns a user-facing “Rate limit exceeded” message.

**App-side limits** (to stay under Gemini quotas and avoid abuse):

- **Guest roadmap:** 3 previews per IP per hour (in-memory; resets on cold start).
- **Chat / roadmap / quiz / tasks / avatar:** No per-user RPM cap in-app; rely on Supabase Edge concurrency and Gemini project quota. If you see sustained 429s, consider: increasing project quota in Google AI Studio, adding per-user or per-IP throttling, or a circuit breaker in `gemini.ts`.

### Sync secrets from env

```bash
vercel env pull .env.vercel   # optional
npm run supabase:secrets:sync
```

See [scripts/sync-secrets-to-supabase.mjs](../scripts/sync-secrets-to-supabase.mjs) for whitelist.

---

## 3. Polar (Payments)

- **Webhook URL:** `https://<project-ref>.supabase.co/functions/v1/webhook-polar`
- **Events:** checkout.created, subscription.created, subscription.active, subscription.updated, subscription.canceled, subscription.revoked
- **Product/price IDs:** Must match [src/lib/polar-config.ts](../src/lib/polar-config.ts)

---

## 4. Supabase Auth

Configure in Supabase Dashboard → Authentication → Providers:

- **Google:** Client ID + Client Secret for Google Sign-In

**JWT expiry (e.g. 30 minutes):** Access token expiry is set in Dashboard → Authentication → JWT Keys (“Access token expiry time”). The app always sends a fresh token for API calls (via `getSession()`, which can refresh). If users hit 401 loops, check: (1) backend returns 401 with body `{ error, code }` (e.g. `code: "token_expired"`) and (2) RLS on `profiles` allows `auth.uid() = user_id` for SELECT/UPDATE so the client can load profile after sign-in.

---

## 5. Database

Run migrations in Supabase SQL editor:

- `supabase/migrations/20260201120000_auth_user_profile_trigger.sql`
- `supabase/migrations/20260201200000_initial_shyftcut_schema.sql`
- `supabase/migrations/20260204000000_avatar_generations.sql`
- `supabase/migrations/20260205000000_cv_jobs_profile.sql` (profiles: location, job_work_preference, find_jobs_enabled; table: job_recommendations)

Or use `supabase/schema.sql` as reference.

### 5.1 Storage (avatars)

For **AI-generated profile avatars** (Premium feature, 3 per month):

1. In Supabase Dashboard go to **Storage** and create a bucket named **`avatars`**.
2. Set the bucket to **Public** so profile picture URLs returned by the API are viewable.
3. The `api` Edge Function uploads generated images to `avatars/<user_id>/<timestamp>.png` using the service role key.

If the bucket is missing or not public, `POST /api/profile/avatar/generate` returns 500 with a message to create the bucket.

### 5.2 Weekly job recommendations (optional)

Paid users can enable “Get 10 jobs sent to me weekly” in Profile. To run the weekly job fetch:

1. Set **CRON_SECRET** in Edge Function secrets (Dashboard or `supabase secrets set CRON_SECRET=your-secret`), and ensure it (and `SUPABASE_ANON_KEY`) are in your `.env` for the Vault step.
2. Enable **pg_cron** (and optionally **pg_net**; the migration enables pg_net) in Supabase: Dashboard → Database → Extensions. Enable **Vault** if you use the script below.
3. Apply migrations: `npx supabase db push` (this creates the `avatars` bucket and schedules the weekly cron that reads from Vault).
4. Populate Vault so the cron can authenticate: run **`node scripts/setup-cron-vault.mjs`** from the project root (reads `SUPABASE_DB_URL`, `SUPABASE_ANON_KEY`, `CRON_SECRET` from `.env` / `.env.local`). Alternatively run the SQL in [docs/cron-jobs-weekly.sql](cron-jobs-weekly.sql) in the SQL editor with your values if you prefer not to use Vault.

The cron calls `POST /api/jobs/weekly` with header `X-Cron-Secret: YOUR_CRON_SECRET` every week (e.g. Sunday 00:00 UTC). The handler fetches up to 10 jobs per paid user who has `find_jobs_enabled` and saves them to `job_recommendations`.

---

## 6. Deployment Checklist

- [ ] Vercel: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
- [ ] Supabase Edge: GEMINI_API_KEY, POLAR_ACCESS_TOKEN, POLAR_WEBHOOK_SECRET, RESEND_API_KEY, FROM_EMAIL, CONTACT_TO_EMAIL
- [ ] Supabase Auth: Google provider configured
- [ ] Polar: Webhook URL set to webhook-polar; price IDs match polar-config.ts
- [ ] Database: Migrations applied
- [ ] Storage: `avatars` bucket created and set to Public (for AI avatar generation)
- [ ] Deploy: `npx vercel --prod` and `npx supabase functions deploy api --no-verify-jwt` (and webhook-polar)

---

## 7. Backend checklist (verification)

Use this to verify backend configuration. See also [Supabase Environment Variables](https://supabase.com/docs/guides/functions/secrets), [Inspecting edge function environment variables](https://supabase.com/docs/guides/functions/config), and [Polar Webhooks](https://docs.polar.sh/api/webhooks) / [Setup Webhooks](https://polar.sh/docs/webhooks).

### Supabase Edge Function secrets

**Required (set via Dashboard or `supabase secrets set`):**

| Secret | Used by | Purpose |
|--------|---------|---------|
| GEMINI_API_KEY | api | Roadmap generation, chat, quiz (Gemini) |
| POLAR_ACCESS_TOKEN | api | Checkout create, customer portal |
| POLAR_WEBHOOK_SECRET | webhook-polar | HMAC verification of webhook payloads |
| RESEND_API_KEY | api, webhook-polar | Contact form, newsletter, welcome email |
| FROM_EMAIL | api, webhook-polar | Sender address (e.g. onboarding@resend.dev) |
| CONTACT_TO_EMAIL | api | Contact form recipient |

**Optional:** `GEMINI_MODEL`, `CORS_ORIGIN`, `CRON_SECRET` (for weekly job recommendations cron). Supabase auto-injects `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`; override `SUPABASE_ANON_KEY` only if needed.

**Verify:** From project root run `supabase secrets list` and confirm the required keys exist. Set any missing via Dashboard (Project → Edge Functions → Secrets) or `supabase secrets set KEY=value`. No redeploy needed after changing secrets.

**Logs:** Use Supabase Dashboard → Edge Functions → Logs, or Supabase MCP `get_logs` with `service: "edge-function"`, to inspect recent api/webhook-polar errors (e.g. 500s).

**Full verification:** See [SUPABASE_AND_POLAR_VERIFICATION.md](SUPABASE_AND_POLAR_VERIFICATION.md) for a Supabase + Polar checklist (MCP checks, products, webhook URL).

### Analytics (free vs paid)

The `/api/analytics` endpoint returns the same payload for all authenticated users (free and paid): roadmaps created, chat messages this month, quizzes taken, average quiz score, lastQuizAt, lastActiveAt. There is no tier check; the Dashboard shows this block to every logged-in user. To add premium-only metrics (e.g. longer history, breakdowns by week, or export), add a tier check in the analytics handler and extend the response for paid users.

### Study tools limits (free vs paid)

| Feature | Free | Premium |
|--------|------|---------|
| Notes | 20 total | Unlimited |
| Tasks | 30 total | Unlimited |
| AI task suggestions | 5 per day | Unlimited |

The `/api/usage` response includes `notesCount`, `tasksCount`, and `aiSuggestionsToday`. The API enforces limits on `POST /api/notes`, `POST /api/tasks`, and `POST /api/tasks/suggest` (returns 402 with `limit_code` when over limit). The frontend shows upgrade prompts and uses `useUsageLimits` for remaining counts. Daily AI suggest usage is stored in `ai_suggest_calls`.

### Vercel environment variables

**Required for production (and preview if testing preview URLs):**

| Variable | Purpose |
|----------|---------|
| VITE_SUPABASE_URL | Supabase project URL |
| VITE_SUPABASE_ANON_KEY | Supabase anon key |
| VITE_API_URL | `https://<project-ref>.supabase.co/functions/v1` |

**Optional:** `VITE_APP_ORIGIN`, `VITE_SENTRY_DSN`.

**Verify:** Run `vercel env ls` and ensure the required `VITE_*` variables exist for Production (and Preview if needed). No backend secrets are required on Vercel; the frontend only needs the anon key and API base URL.

### Polar webhook verification

1. **Polar Dashboard** → Your organization → **Settings** → **Webhooks**.
2. Confirm **webhook URL** is `https://<project-ref>.supabase.co/functions/v1/webhook-polar` (replace `<project-ref>` with your Supabase project reference).
3. Confirm **subscribed events** include: checkout.created, subscription.created, subscription.active, subscription.updated, subscription.canceled, subscription.revoked (optionally order.created).
4. Confirm **POLAR_WEBHOOK_SECRET** in Supabase (Edge Function secrets) matches the secret shown in Polar for this endpoint. See [docs/POLAR_WEBHOOK_SETUP.md](POLAR_WEBHOOK_SETUP.md) for full setup.

---

## 8. Verification (runtime)

1. **Frontend:** Landing loads, auth works (sign up, login, Google).
2. **API:** Create roadmap (wizard), use chat, take quiz.
3. **Payments:** Checkout from pricing → Polar → success/cancel.
4. **Webhook:** Complete checkout; subscription tier updates; welcome email sent.
