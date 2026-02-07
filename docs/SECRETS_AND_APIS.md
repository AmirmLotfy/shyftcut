# Shyftcut – Full List of Secrets & APIs

Everything you need for the project to work end-to-end. Set these in **Vercel** (for the frontend/build) and/or **Supabase** (for Edge Functions). Do not commit real values to Git.

---

## 1. Vercel (frontend / build)

Used at **build time** and in the **browser**. Add in Vercel Dashboard → Project → Settings → Environment Variables.

| Variable | Required | Description |
|----------|----------|-------------|
| **VITE_SUPABASE_URL** | Yes | Supabase project URL, e.g. `https://xxxxx.supabase.co` (Settings → API) |
| **VITE_SUPABASE_ANON_KEY** | Yes | Supabase anon/public key (Settings → API) |
| **VITE_API_URL** | Yes (prod) | Supabase Edge Functions base URL: `https://xxxxx.supabase.co/functions/v1` so the app calls your Edge API |
| **VITE_APP_ORIGIN** | Optional | Public app URL for SEO (canonical, OG, sitemap), e.g. `https://shyftcut.com` |

**Google Sign-in:** Configure in **Supabase Dashboard → Authentication → Providers → Google** (Client ID + Client Secret). No frontend env var required unless you use a separate Google OAuth flow.

---

## 2. Supabase Edge Function secrets

Used by **Edge Functions** (`api` and `webhook-polar`). Supabase **auto-injects** the first four in production; you only set the rest.

**Where to set:** Supabase Dashboard → Project Settings → Edge Functions → Secrets, or run `npm run supabase:secrets:sync` after putting values in `.env` / `.env.vercel`.

### Auto-injected by Supabase (do not set via CLI)

| Variable | Description |
|----------|-------------|
| **SUPABASE_URL** | Project URL (injected) |
| **SUPABASE_ANON_KEY** | Anon key (injected) |
| **SUPABASE_SERVICE_ROLE_KEY** | Service role key (injected) |
| **SUPABASE_DB_URL** | Database URL when available (injected) |

### You must set (custom secrets)

| Variable | Required | Used by | Description |
|----------|----------|---------|-------------|
| **GEMINI_API_KEY** | Yes (AI features) | `api` | Google AI (Gemini) API key from [Google AI Studio](https://aistudio.google.com/apikey). For rotation, also set `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3` |
| **GEMINI_API_KEY_1** | Optional (rotation) | `api` | First rotation key for automatic failover and load balancing |
| **GEMINI_API_KEY_2** | Optional (rotation) | `api` | Second rotation key for automatic failover and load balancing |
| **GEMINI_API_KEY_3** | Optional (rotation) | `api` | Third rotation key for automatic failover and load balancing |
| **POLAR_ACCESS_TOKEN** | Yes (payments) | `api`, checkout | Polar API token from [Polar Dashboard](https://polar.sh) → API |
| **POLAR_WEBHOOK_SECRET** | Yes (payments) | `webhook-polar` | Webhook signing secret from Polar → Webhooks |
| **RESEND_API_KEY** | Yes (contact/newsletter) | `api`, `webhook-polar` | API key from [Resend](https://resend.com/api-keys) |
| **FROM_EMAIL** | Yes (email) | `api`, `webhook-polar` | Sender email (e.g. `onboarding@resend.dev` or your verified domain) |
| **CONTACT_TO_EMAIL** | Yes (contact form) | `api` | Where contact form submissions are sent (e.g. `support@shyftcut.com`) |
| **SUPABASE_ANON_KEY** | Optional override | `api` | Only if you need to override the auto-injected anon key (e.g. auth password checks in Edge) |
| **GEMINI_MODEL** | Optional | `api` | e.g. `gemini-3-flash-preview` (only Gemini 3 models supported) |
| **GEMINI_AVATAR_IMAGE_SIZE** | Optional | `api` | Avatar image resolution: `2K` (default) or `4K` |
| **GEMINI_ROTATION_MAX_RETRIES** | Optional | `api` | Max rotation attempts when keys fail (default: 3) |
| **GEMINI_ROTATION_COOLDOWN_BASE_MS** | Optional | `api` | Base cooldown period for failed keys in milliseconds (default: 30000) |
| **GEMINI_ROTATION_COOLDOWN_MAX_MS** | Optional | `api` | Maximum cooldown period for failed keys in milliseconds (default: 3600000) |
| **ROADMAP_USE_GROUNDING** | Optional | `api` | Set to `"false"` to disable Google Search for roadmap (saves cost; missing URLs filled via courses-search). Default: enabled. |
| **CORS_ORIGIN** | Optional | `api`, `webhook-polar` | Restrict CORS, e.g. `https://shyftcut.com` (default `*`) |
| **CAREER_DNA_DISCOUNT_ID** | Optional | `api`, checkout | Polar discount UUID for Career DNA quiz takers (50% off first 3 months). Create in Polar Dashboard → Discounts, code `CAREERDNA50`. |

---

## 3. Polar (payments)

- **Dashboard:** [polar.sh](https://polar.sh)
- **API token:** Create in Polar → Settings/API → Organization Access Tokens. **Important:** Create token **without expiration** (leave expiration field blank) to avoid token expiration after redeploys. **Recommended:** Set token directly in Supabase Dashboard (not via sync script) to avoid truncation issues. See [POLAR_TOKEN_SETUP.md](POLAR_TOKEN_SETUP.md) and [POLAR_TOKEN_TROUBLESHOOTING.md](POLAR_TOKEN_TROUBLESHOOTING.md) for details.
- **Webhook secret:** Polar → Webhooks → create endpoint → copy signing secret. Set in Supabase as `POLAR_WEBHOOK_SECRET`.
- **Webhook URL:** `https://<your-project-ref>.supabase.co/functions/v1/webhook-polar`
- **Product/price IDs:** In app, `src/lib/polar-config.ts` must use the same price IDs as in your Polar product.

**⚠️ Token Issues:** If your token stops working, see [POLAR_TOKEN_TROUBLESHOOTING.md](POLAR_TOKEN_TROUBLESHOOTING.md) for debugging steps. Common causes: token truncation during sync, character encoding issues, or actual expiration despite "never expire" setting.

### Affonso (affiliate program, optional)

If you use [Affonso](https://affonso.io) + Polar for affiliate tracking:

1. **index.html:** Program ID is set in the Affonso script (`data-affonso`).
2. **VITE_AFFONSO_PORTAL_URL:** Optional. Override the affiliate dashboard link (default: app.affonso.io).
3. **VITE_AFFONSO_PORTAL_URL:** Set in Vercel if you want a fallback link when embed fails. Optional.
4. **Polar:** Add Affonso webhook (URL + secret from Affonso) for events `order.created`, `order.refunded`, `subscription.canceled`.
5. See [Polar Affonso docs](https://docs.polar.sh/features/integrations/affonso) for full setup.

---

## 4. Resend (email)

- **Dashboard:** [resend.com](https://resend.com)
- **API key:** Resend → API Keys. Set as `RESEND_API_KEY` in Supabase Edge secrets.
- **FROM_EMAIL:** Must be a verified domain or `onboarding@resend.dev` for testing.
- **CONTACT_TO_EMAIL:** Inbox for contact form (any address).

---

## 5. Google AI (Gemini)

- **API key:** [Google AI Studio](https://aistudio.google.com/apikey). Set as `GEMINI_API_KEY` in Supabase Edge secrets.
- **API key rotation (recommended):** For better reliability and rate limit handling, set multiple keys:
  - `GEMINI_API_KEY_1` - First rotation key
  - `GEMINI_API_KEY_2` - Second rotation key
  - `GEMINI_API_KEY_3` - Third rotation key
- **Rotation behavior:** The system automatically rotates between keys on errors (429 rate limits, 500 server errors, etc.), distributes load evenly, and recovers failed keys after cooldown periods.
- **Backward compatibility:** Single `GEMINI_API_KEY` still works if numbered keys are not set.
- Used for: roadmap generation, chat, quiz generation, content moderation, avatar generation.

---

## 6. Supabase (auth + database)

- **Project URL & keys:** Supabase Dashboard → Settings → API (Project URL, anon key, service_role key).
- **Frontend:** Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel.
- **Edge:** Supabase injects `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` for deployed functions; no need to set them via CLI.
- **Auth providers:** Configure Google (and others) under Authentication → Providers.

---

## 7. Sync script (optional)

To push **custom** Edge secrets from your env file (e.g. after `vercel env pull .env.vercel`):

```bash
vercel env pull .env.vercel   # optional: get latest from Vercel
npm run supabase:secrets:sync
```

Only whitelisted keys are pushed; `SUPABASE_*` are skipped (auto-injected). See `scripts/sync-secrets-to-supabase.mjs`.

---

## Quick checklist

- [ ] **Vercel:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` (and optionally `VITE_APP_ORIGIN`)
- [ ] **Supabase Edge secrets:** `GEMINI_API_KEY` (or `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3` for rotation), `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `RESEND_API_KEY`, `FROM_EMAIL`, `CONTACT_TO_EMAIL`
- [ ] **Supabase Auth:** Google (and any other) provider configured
- [ ] **Polar:** Webhook URL pointing to your `webhook-polar` Edge Function; product/price IDs match `polar-config.ts`
