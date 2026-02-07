# Unified Secrets Management Guide

## Overview

Shyftcut uses **two separate secret management systems** that serve different purposes:

1. **Vercel** - Frontend/build-time secrets (only `VITE_*` variables)
2. **Supabase** - Backend Edge Function secrets (API keys, tokens, etc.)

**There are NO conflicts** - they serve different purposes and don't overlap.

**⚠️ Important:** For sensitive tokens like `POLAR_ACCESS_TOKEN`, it's recommended to set them **directly in Supabase Dashboard** rather than using the sync script to avoid potential truncation or encoding issues. See [POLAR_TOKEN_TROUBLESHOOTING.md](POLAR_TOKEN_TROUBLESHOOTING.md) for details.

---

## 1. Vercel Secrets (Frontend Only)

### Purpose
- Used at **build time** (Vite compilation)
- Exposed to the **browser** (client-side code)
- Only for **public** configuration values

### Variables
| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Public anon key (safe for browser) |
| `VITE_API_URL` | Edge Functions base URL |
| `VITE_APP_ORIGIN` | Public app URL (SEO) |
| `VITE_SENTRY_DSN` | Error tracking (optional) |

### Where to Set
- **Vercel Dashboard** → Project → Settings → Environment Variables
- Or via CLI: `vercel env add VITE_SUPABASE_URL`

### Important Notes
- ✅ **Safe for browser** - These are public values
- ✅ **Build-time only** - Used during `npm run build`
- ❌ **Never put API keys here** - They would be exposed in the browser

---

## 2. Supabase Secrets (Backend Only)

### Purpose
- Used by **Edge Functions** (server-side code)
- **Never exposed** to the browser
- Secure storage for API keys and tokens

### Variables
| Variable | Purpose |
|----------|---------|
| `POLAR_ACCESS_TOKEN` | Payment provider API token |
| `POLAR_WEBHOOK_SECRET` | Webhook signing secret |
| `GEMINI_API_KEY` | AI API key |
| `RESEND_API_KEY` | Email service API key |
| `FROM_EMAIL` | Sender email address |
| `CONTACT_TO_EMAIL` | Contact form recipient |

### Where to Set

#### Option A: Via Dashboard (Recommended)
1. Go to **Supabase Dashboard** → Project Settings → Edge Functions → Secrets
2. Add each secret manually
3. **No redeploy needed** - secrets are available immediately

#### Option B: Via Sync Script (Automated)
1. Add secrets to `.env` or `.env.local`:
   ```bash
   POLAR_ACCESS_TOKEN=polar_oat_...
   GEMINI_API_KEY=...
   ```
2. Run sync script:
   ```bash
   npm run supabase:secrets:sync
   ```
3. Script reads `.env` → syncs to Supabase → cleans up

#### Option C: From Vercel (If Needed)
1. Pull Vercel env (if you store secrets there temporarily):
   ```bash
   vercel env pull .env.vercel
   ```
2. Sync from that file:
   ```bash
   ENV_FILE=.env.vercel npm run supabase:secrets:sync
   ```

---

## 3. Unified Workflow (Recommended)

### One-Time Setup

1. **Create `.env` file** (never commit this):
   ```bash
   # Frontend (for Vercel)
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_API_URL=https://xxx.supabase.co/functions/v1
   
   # Backend (for Supabase Edge Functions)
   POLAR_ACCESS_TOKEN=polar_oat_...
   GEMINI_API_KEY=...
   RESEND_API_KEY=re_...
   FROM_EMAIL=onboarding@resend.dev
   ```

2. **Set Vercel secrets** (one-time):
   ```bash
   vercel env add VITE_SUPABASE_URL production
   vercel env add VITE_SUPABASE_ANON_KEY production
   vercel env add VITE_API_URL production
   ```
   Or use Vercel Dashboard → Settings → Environment Variables

3. **Set Supabase secrets** (one-time):
   ```bash
   npm run supabase:secrets:sync
   ```

### When Secrets Change

#### Frontend Secrets (Vercel)
- Update in **Vercel Dashboard** → Settings → Environment Variables
- Or via CLI: `vercel env add VITE_XXX production`
- **Redeploy required** for changes to take effect

#### Backend Secrets (Supabase)
- Update in **Supabase Dashboard** → Edge Functions → Secrets
- Or update `.env` and run: `npm run supabase:secrets:sync`
- **No redeploy needed** - Edge Functions read secrets at runtime

---

## 4. Common Issues & Solutions

### Issue: "Secret not found" in Edge Function

**Solution:**
1. Verify secret exists: `npx supabase secrets list`
2. Check spelling (case-sensitive)
3. Ensure secret is set for correct project: `npx supabase link`

### Issue: "Token expired" after redeploy

**Solution:**
- This is **not** a secrets management issue
- Token likely has expiration date set in provider dashboard
- See [POLAR_TOKEN_SETUP.md](POLAR_TOKEN_SETUP.md) for Polar tokens

### Issue: "Want to sync from Vercel to Supabase"

**Why this doesn't work:**
- Vercel only stores `VITE_*` variables (frontend)
- Supabase needs backend secrets (no `VITE_` prefix)
- They serve different purposes

**Solution:**
- Keep secrets in `.env` file locally
- Sync to Vercel (frontend) and Supabase (backend) separately
- Use sync script for Supabase: `npm run supabase:secrets:sync`

---

## 5. Security Best Practices

1. ✅ **Never commit `.env`** - Already in `.gitignore`
2. ✅ **Use separate tokens** - Don't reuse tokens across environments
3. ✅ **Rotate tokens regularly** - Especially for production
4. ✅ **Use least privilege** - Only grant necessary permissions
5. ✅ **Monitor usage** - Check provider dashboards for unusual activity

---

## 6. Quick Reference

| Action | Command |
|--------|---------|
| List Supabase secrets | `npx supabase secrets list` |
| Sync secrets to Supabase | `npm run supabase:secrets:sync` |
| Pull Vercel env | `vercel env pull .env.vercel` |
| List Vercel env | `vercel env ls` |
| Deploy everything | `npm run deploy:all` |

---

## 7. Architecture Diagram

```
┌─────────────────┐         ┌──────────────────┐
│   .env file     │         │  Vercel Secrets  │
│  (local only)   │         │  (VITE_* only)   │
└────────┬────────┘         └────────┬─────────┘
         │                            │
         │                            │
         ├──────────────┬──────────────┤
         │              │              │
         ▼              ▼              ▼
┌─────────────────────────────────────────────┐
│      Supabase Edge Functions Secrets         │
│  (POLAR_ACCESS_TOKEN, GEMINI_API_KEY, etc.)  │
└─────────────────────────────────────────────┘
```

**Key Points:**
- `.env` is the **source of truth** locally
- Vercel gets **frontend** secrets (`VITE_*`)
- Supabase gets **backend** secrets (no prefix)
- They **don't conflict** - different purposes

---

## Related Documentation

- [POLAR_TOKEN_SETUP.md](POLAR_TOKEN_SETUP.md) - Polar token expiration issues
- [SECRETS_AND_APIS.md](SECRETS_AND_APIS.md) - Full API keys reference
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment checklist
