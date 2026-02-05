# Backend on Supabase Edge Functions

All API logic runs on **Supabase Edge Functions**. **Vercel** serves only the static SPA (`dist/`); no serverless functions are deployed on Vercel.

## Architecture

- **Client**: SPA on Vercel; calls `VITE_API_URL` (Supabase Functions base URL) with header `X-Path` (e.g. `/api/profile`).
- **Supabase**: Edge Function `api` (single router) handles all API routes; Edge Function `webhook-polar` handles Polar webhooks; Edge Function `courses-search` is used by `api` to resolve real course URLs via Gemini + Google Search. Auth and DB are Supabase.

## Edge Function `api` routes

- **Profile**: GET/PATCH
- **Roadmaps**: GET
- **Roadmap**: GET/PATCH by id; **roadmap/active**; **roadmap/weeks/complete** POST
- **roadmap/generate**: POST (Gemini + Google Search, then fills missing course URLs via `courses-search`, insert roadmaps/weeks/courses)
- **Subscription**: GET
- **Usage**: GET
- **Analytics**: GET
- **Contact**: POST
- **Newsletter**: POST
- **Checkout**: create (POST), portal (GET)
- **Courses**: PATCH by id
- **Chat**: POST (streaming), **chat/history** GET/DELETE, **chat/messages** POST
- **Quiz**: **quiz/generate** POST, **quiz/results** POST
- **Auth**: **auth/sync** POST, **auth/account** GET (auth_methods) / DELETE (delete account), **auth/set-password** POST, **auth/change-password** POST

## Deploy Edge Functions

```bash
npx supabase functions deploy api --no-verify-jwt
npx supabase functions deploy webhook-polar --no-verify-jwt
npx supabase functions deploy courses-search --no-verify-jwt
```

The `courses-search` function is invoked by the `api` function during roadmap generation to resolve real course URLs; it uses the same `GEMINI_API_KEY`.

## Secrets (Supabase Edge Functions)

Set in Supabase Dashboard → Project Settings → Edge Functions → secrets, or use the sync script.

**Required / optional:**

- `SUPABASE_URL` (often set by Supabase for linked project)
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY` (for auth/change-password and auth/account DELETE password verification)
- `RESEND_API_KEY`, `FROM_EMAIL`, `CONTACT_TO_EMAIL` (contact form, newsletter)
- `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET` (checkout + webhook-polar)
- `GEMINI_API_KEY` (roadmap/generate, chat, quiz/generate); optional: `GEMINI_MODEL`, `ROADMAP_USE_GROUNDING`
- `CORS_ORIGIN` (optional)

### Syncing secrets from env or Vercel

1. **From local env**: Ensure `.env` or `.env.local` has the keys above (do not commit). Then:
   ```bash
   npm run supabase:secrets:sync
   ```
   Or: `node scripts/sync-secrets-to-supabase.mjs`

2. **From Vercel**: Pull env from Vercel, then run the script with that file:
   ```bash
   vercel env pull .env.vercel
   ENV_FILE=.env.vercel node scripts/sync-secrets-to-supabase.mjs
   ```
   After changing env in Vercel, run `vercel env pull` and re-run the sync script to update Supabase Edge Function secrets.

The script only pushes whitelisted keys (see `scripts/sync-secrets-to-supabase.mjs`).

## Frontend (Vercel)

- Set **VITE_API_URL** in Vercel (build env) to `https://<project-ref>.supabase.co/functions/v1` so production uses Edge Functions only.
- Build and deploy. The app sends requests to `VITE_API_URL/api` with `X-Path` set to the logical path (e.g. `/api/profile`).

## Polar webhook

In the Polar dashboard, set the webhook URL to:

`https://<project-ref>.supabase.co/functions/v1/webhook-polar`

## Vercel = static only

- **vercel.json**: No `functions` block; `rewrites` send all routes to `/index.html` for the SPA.
- **api/** and **server/** have been removed; all API logic lives in Supabase Edge Functions.
