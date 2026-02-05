# Why Edge Function Secrets Live in Supabase

## Where your code runs

- **Edge Functions** run on **Supabase’s infrastructure** (Deno Deploy), not on your machine or Vercel.
- They only see environment variables that **Supabase** provides. They never see your local `.env` or Vercel env.

So any secret the function needs (API keys, etc.) must be set **in Supabase** (Dashboard or `supabase secrets set`). That’s the only way the function can read it via `Deno.env.get('SECRET_NAME')`.

## What Supabase provides by default

In production, Supabase **automatically** injects these for every Edge Function:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL` (when available)

You do **not** need to add these as secrets; they’re already there.

## What you must set yourself

Anything else your functions use must be set as **Edge Function secrets** in Supabase, for example:

- `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`)
- **Optional (recommended for production):** `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3` — Multiple keys for automatic rotation, failover, and load balancing. The system automatically rotates between keys on errors (429 rate limits, 500 server errors, etc.) and distributes load evenly. Falls back to `GEMINI_API_KEY` if numbered keys are not set.
- **Optional:** `GEMINI_ROTATION_MAX_RETRIES` — Max rotation attempts when keys fail (default: 3)
- **Optional:** `GEMINI_ROTATION_COOLDOWN_BASE_MS` — Base cooldown period for failed keys in milliseconds (default: 30000)
- **Optional:** `GEMINI_ROTATION_COOLDOWN_MAX_MS` — Maximum cooldown period for failed keys in milliseconds (default: 3600000)
- Roadmap generation **always uses Grounding with Google Search** so course recommendations get **real course URLs** from the web (Coursera, Udemy, YouTube, etc.). No extra secret required. See [Gemini: Grounding with Google Search](https://ai.google.dev/gemini-api/docs/google-search).
- **Optional:** `GEMINI_ROADMAP_THINKING_LEVEL` — set to `high` for deeper reasoning on roadmap (slower, more tokens); default `low` for lower latency.
- `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`
- `RESEND_API_KEY`, `FROM_EMAIL`, `CONTACT_TO_EMAIL` (contact form / newsletter)
- `SUPABASE_ANON_KEY` only if you need to override the default (e.g. for auth password checks in a specific project)
- Optional: `CORS_ORIGIN`
- **Optional:** `CRON_SECRET` — for the weekly job-recommendations cron. The `POST /api/jobs/weekly` route is invoked by pg_cron (or an external scheduler) with header `X-Cron-Secret` or body `{ "cron_secret": "..." }`. Set a strong random value; do not expose to the frontend.

## How to set them

1. **Dashboard**: Project → Edge Functions → Secrets → add key/value.
2. **CLI from your env file**:  
   Put the values in `.env` (or `.env.local`), then run:
   ```bash
   npm run supabase:secrets:sync
   ```
   The script only pushes a fixed whitelist of keys, so you never push unrelated env vars.

**Security:** Do not commit `.env` (or `.env.vercel`). Keep it in `.gitignore` and use it only locally or in CI with masked secrets.

---

## Local Edge Function development

When running Edge Functions locally with `supabase functions serve`, they need the same secrets as in production. Two options:

1. **Env file at functions level**  
   Create `supabase/functions/.env` (or `.env.local`) with the same keys you set in Supabase (e.g. `GEMINI_API_KEY` or `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3` for rotation, `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `RESEND_API_KEY`, `FROM_EMAIL`, `CONTACT_TO_EMAIL`). Do **not** commit this file; add `supabase/functions/.env` and `supabase/functions/.env.local` to `.gitignore` if needed.

2. **CLI flag**  
   Use an env file from the project root:  
   `supabase functions serve --env-file .env.local`  
   (or `--env-file .env`). Only include keys that your functions use; the sync script whitelist in [scripts/sync-secrets-to-supabase.mjs](../scripts/sync-secrets-to-supabase.mjs) is a good reference.

Supabase docs: [Environment Variables](https://supabase.com/docs/guides/functions/secrets), [Inspecting edge function environment variables](https://supabase.com/docs/guides/functions/config).
