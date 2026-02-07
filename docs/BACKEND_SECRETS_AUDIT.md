# Backend Secrets Audit - Vercel Dependency Check

**Date:** 2026-02-06  
**Status:** ✅ No Backend Secrets from Vercel

---

## Summary

**✅ GOOD NEWS:** Your app is **NOT** relying on any backend secrets from Vercel. All backend operations use Supabase Edge Functions which read secrets from Supabase, not Vercel.

---

## Frontend Environment Variables (Vercel)

The frontend **only** uses these `VITE_*` variables from Vercel:

### ✅ Safe Frontend Variables (Public, Browser-Safe)
- `VITE_API_URL` - API endpoint URL (e.g., `https://xxx.supabase.co/functions/v1`)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Public anon key (safe for browser)
- `VITE_SESSION_IDLE_TIMEOUT_MS` - Session timeout config
- `VITE_HCAPTCHA_SITE_KEY` - Public hCaptcha site key
- `VITE_AFFONSO_PORTAL_URL` - Public affiliate URL
- `VITE_GOOGLE_CLIENT_ID` - Public Google OAuth client ID
- `VITE_NEON_AUTH_URL` - Public Neon auth URL

**All of these are public values** that are safe to expose in the browser.

---

## Backend Secrets (Supabase Edge Functions)

All backend operations use **Supabase Edge Functions** which read secrets from **Supabase**, not Vercel:

### Edge Functions Read Secrets From Supabase:

1. **`POLAR_ACCESS_TOKEN`** - Payment provider token
   - Used in: `supabase/functions/api/index.ts` → `checkout/create`
   - Source: `Deno.env.get("POLAR_ACCESS_TOKEN")` → Supabase secrets

2. **`POLAR_WEBHOOK_SECRET`** - Webhook signing secret
   - Used in: `supabase/functions/webhook-polar/index.ts`
   - Source: `Deno.env.get("POLAR_WEBHOOK_SECRET")` → Supabase secrets

3. **`GEMINI_API_KEY`** - AI API key
   - Used in: `supabase/functions/_shared/gemini.ts`
   - Source: `Deno.env.get("GEMINI_API_KEY")` → Supabase secrets

4. **`RESEND_API_KEY`** - Email service key
   - Used in: `supabase/functions/_shared/resend.ts`
   - Source: `Deno.env.get("RESEND_API_KEY")` → Supabase secrets

5. **`FROM_EMAIL`** - Sender email
   - Used in: `supabase/functions/_shared/resend.ts`
   - Source: `Deno.env.get("FROM_EMAIL")` → Supabase secrets

6. **`CONTACT_TO_EMAIL`** - Contact form recipient
   - Used in: Edge Functions
   - Source: `Deno.env.get("CONTACT_TO_EMAIL")` → Supabase secrets

7. **`SUPABASE_SERVICE_ROLE_KEY`** - Admin API key
   - Used in: `supabase/functions/_shared/supabase.ts`
   - Source: `Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")` → Supabase secrets (auto-injected)

8. **`SUPABASE_URL`** - Project URL
   - Used in: Edge Functions
   - Source: `Deno.env.get("SUPABASE_URL")` → Supabase secrets (auto-injected)

9. **`SUPABASE_ANON_KEY`** - Anon key (for some operations)
   - Used in: Edge Functions
   - Source: `Deno.env.get("SUPABASE_ANON_KEY")` → Supabase secrets (auto-injected)

10. **`CRON_SECRET`** - Cron job authentication
    - Used in: Cron functions
    - Source: `Deno.env.get("CRON_SECRET")` → Supabase secrets

11. **`VAPID_PUBLIC_KEY`** / **`VAPID_PRIVATE_KEY`** - Web push keys
    - Used in: Push notification functions
    - Source: `Deno.env.get("VAPID_*")` → Supabase secrets

---

## How Frontend Calls Backend

### Frontend → Backend Flow:

1. **Frontend** calls API via `apiFetch()` or `fetch()`:
   ```typescript
   // src/lib/api.ts
   apiFetch('/api/checkout/create', { ... })
   ```

2. **Request goes to Supabase Edge Functions**:
   - URL: `https://xxx.supabase.co/functions/v1/api`
   - Headers: `X-Path: /api/checkout/create`, `Authorization: Bearer <anon_key>`

3. **Edge Function** (`supabase/functions/api/index.ts`):
   - Reads secrets from `Deno.env.get()` → **Supabase secrets**
   - Makes backend API calls (Polar, Gemini, Resend, etc.)
   - Returns response to frontend

### Key Point:
- **Frontend never sees backend secrets**
- **Backend secrets are never in Vercel**
- **All backend operations happen server-side in Edge Functions**

---

## Verification

### ✅ Checked Files:

1. **Frontend (`src/`)**:
   - ✅ Only uses `VITE_*` variables
   - ✅ No backend secrets accessed
   - ✅ All API calls go through Edge Functions

2. **Backend (`supabase/functions/`)**:
   - ✅ All secrets read via `Deno.env.get()`
   - ✅ No references to Vercel env vars
   - ✅ All secrets come from Supabase

3. **API Client (`src/lib/api.ts`)**:
   - ✅ Only uses `VITE_API_URL` and `VITE_SUPABASE_ANON_KEY`
   - ✅ No backend secrets in frontend code

---

## Conclusion

**✅ Your app architecture is correct:**

- **Vercel** = Frontend secrets only (`VITE_*`)
- **Supabase** = Backend secrets only (no `VITE_` prefix)
- **No overlap** = No backend secrets in Vercel
- **No dependency** = Frontend doesn't need backend secrets

**You're all set!** 🎉

---

## Related Documentation

- [SECRETS_MANAGEMENT.md](SECRETS_MANAGEMENT.md) - Unified secrets guide
- [SECRETS_CLEANUP_FINAL.md](SECRETS_CLEANUP_FINAL.md) - Cleanup report
- [EDGE_FUNCTION_SECRETS.md](EDGE_FUNCTION_SECRETS.md) - Edge Function secrets
