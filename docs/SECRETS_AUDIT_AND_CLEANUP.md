# Secrets Audit and Cleanup Guide

**Date:** 2026-02-06  
**Status:** Found duplicates - cleanup required

---

## Current State Analysis

### Vercel Secrets (Frontend Only - Should Have)

✅ **Correct (Frontend/Build-time):**
- `VITE_SUPABASE_URL` - ✅ Correct
- `VITE_SUPABASE_ANON_KEY` - ✅ Correct  
- `VITE_API_URL` - ✅ Correct
- `VITE_SESSION_IDLE_TIMEOUT_MS` - ✅ Correct
- `VITE_HCAPTCHA_SITE_KEY` - ✅ Correct
- `VITE_AFFONSO_PORTAL_URL` - ✅ Correct

❌ **Wrong (Backend Secrets - Should NOT be in Vercel):**
- `SUPABASE_URL` - ❌ Should be Supabase only (auto-injected)
- `SUPABASE_ANON_KEY` - ❌ Should be Supabase only (auto-injected)
- `SUPABASE_SERVICE_ROLE_KEY` - ❌ Should be Supabase only (auto-injected)
- `SUPABASE_DB_URL` - ❌ Should be Supabase only (auto-injected)
- `SUPABASE_JWT_SECRET` - ❌ Should be Supabase only (if needed)
- `GEMINI_API_KEY` - ❌ Should be Supabase only
- `RESEND_API_KEY` - ❌ Should be Supabase only
- `FROM_EMAIL` - ❌ Should be Supabase only
- `CONTACT_TO_EMAIL` - ❌ Should be Supabase only
- `CAREER_DNA_DISCOUNT_ID` - ❌ Should be Supabase only
- `GOOGLE_CLIENT_SECRET` - ❌ Should be Supabase only (if needed)

### Supabase Secrets (Backend Only - Correct)

✅ **All Correct:**
- `POLAR_ACCESS_TOKEN` - ✅ Correct
- `POLAR_WEBHOOK_SECRET` - ✅ Correct
- `GEMINI_API_KEY` - ✅ Correct
- `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3` - ✅ Correct
- `RESEND_API_KEY` - ✅ Correct
- `FROM_EMAIL` - ✅ Correct
- `CONTACT_TO_EMAIL` - ✅ Correct
- `CAREER_DNA_DISCOUNT_ID` - ✅ Correct
- `CRON_SECRET` - ✅ Correct
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` - ✅ Correct
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` - ✅ Correct (auto-injected, but can be set manually)

---

## Problem: Duplicate Secrets

**Issue:** Backend secrets are stored in **both** Vercel and Supabase, causing:
1. **Confusion** - Which one is actually used?
2. **Maintenance overhead** - Need to update in two places
3. **Security risk** - Backend secrets exposed in Vercel (even if not used)
4. **Potential conflicts** - Different values in different places

---

## Cleanup Plan

### Step 1: Remove Backend Secrets from Vercel

Remove these from Vercel (they're already in Supabase):

```bash
# Remove backend secrets from Vercel (keep only VITE_*)
vercel env rm SUPABASE_URL production
vercel env rm SUPABASE_URL preview
vercel env rm SUPABASE_URL development

vercel env rm SUPABASE_ANON_KEY production
vercel env rm SUPABASE_ANON_KEY preview
vercel env rm SUPABASE_ANON_KEY development

vercel env rm SUPABASE_SERVICE_ROLE_KEY production
vercel env rm SUPABASE_SERVICE_ROLE_KEY preview
vercel env rm SUPABASE_SERVICE_ROLE_KEY development

vercel env rm SUPABASE_DB_URL production
vercel env rm SUPABASE_DB_URL preview
vercel env rm SUPABASE_DB_URL development

vercel env rm SUPABASE_JWT_SECRET production
vercel env rm SUPABASE_JWT_SECRET preview
vercel env rm SUPABASE_JWT_SECRET development

vercel env rm GEMINI_API_KEY production
vercel env rm GEMINI_API_KEY preview
vercel env rm GEMINI_API_KEY development

vercel env rm RESEND_API_KEY production
vercel env rm RESEND_API_KEY preview
vercel env rm RESEND_API_KEY development

vercel env rm FROM_EMAIL production
vercel env rm FROM_EMAIL preview
vercel env rm FROM_EMAIL development

vercel env rm CONTACT_TO_EMAIL production
vercel env rm CONTACT_TO_EMAIL preview
vercel env rm CONTACT_TO_EMAIL development

vercel env rm CAREER_DNA_DISCOUNT_ID production
vercel env rm CAREER_DNA_DISCOUNT_ID preview
vercel env rm CAREER_DNA_DISCOUNT_ID development

vercel env rm GOOGLE_CLIENT_SECRET production
vercel env rm GOOGLE_CLIENT_SECRET preview
vercel env rm GOOGLE_CLIENT_SECRET development
```

### Step 2: Verify Vercel Only Has Frontend Secrets

After cleanup, Vercel should only have:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL`
- `VITE_SESSION_IDLE_TIMEOUT_MS`
- `VITE_HCAPTCHA_SITE_KEY`
- `VITE_AFFONSO_PORTAL_URL`
- `VITE_APP_ORIGIN` (if set)
- `VITE_SENTRY_DSN` (if set)
- `VITE_META_PIXEL_ID` (if set)

### Step 3: Verify Supabase Has All Backend Secrets

Supabase should have:
- `POLAR_ACCESS_TOKEN`
- `POLAR_WEBHOOK_SECRET`
- `GEMINI_API_KEY` (+ rotation keys if used)
- `RESEND_API_KEY`
- `FROM_EMAIL`
- `CONTACT_TO_EMAIL`
- `CAREER_DNA_DISCOUNT_ID`
- `CRON_SECRET`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` (auto-injected, but can be set manually)

---

## Automated Cleanup Script

I'll create a script to help with cleanup:

```bash
# Run this to see what will be removed
node scripts/audit-secrets.mjs

# Then manually remove duplicates, or use the cleanup script
```

---

## Prevention: Best Practices

### 1. Clear Separation

**Vercel (Frontend):**
- Only `VITE_*` variables
- Used at build time and in browser
- Public configuration values

**Supabase (Backend):**
- No `VITE_` prefix
- Used by Edge Functions
- Private API keys and tokens

### 2. Naming Convention

- ✅ `VITE_*` = Frontend (Vercel)
- ✅ No prefix = Backend (Supabase)
- ❌ Never put backend secrets in Vercel
- ❌ Never put frontend secrets in Supabase

### 3. Sync Script Behavior

The sync script (`npm run supabase:secrets:sync`) should:
- ✅ Only sync to Supabase
- ✅ Skip `VITE_*` variables (frontend only)
- ✅ Skip `SUPABASE_*` variables (auto-injected)
- ❌ Never sync to Vercel

### 4. Documentation

- ✅ Document which secrets go where
- ✅ Use `.env.example` as reference
- ✅ Keep `SECRETS_MANAGEMENT.md` updated

---

## Next Steps

1. **Review this audit** - Confirm which secrets to remove
2. **Remove duplicates from Vercel** - Use commands above
3. **Verify functionality** - Test that everything still works
4. **Update documentation** - Ensure `.env.example` is clear
5. **Set up prevention** - Add checks to prevent future duplicates

---

## Verification Commands

After cleanup, verify:

```bash
# Check Vercel (should only have VITE_*)
vercel env ls | grep -v "VITE_" | grep -v "^name"

# Check Supabase (should have backend secrets)
npx supabase secrets list

# Verify no duplicates
comm -12 <(vercel env ls | awk '{print $1}' | sort) <(npx supabase secrets list | awk '{print $1}' | sort)
```

---

## Related Documentation

- [SECRETS_MANAGEMENT.md](SECRETS_MANAGEMENT.md) - Unified secrets guide
- [POLAR_TOKEN_TROUBLESHOOTING.md](POLAR_TOKEN_TROUBLESHOOTING.md) - Token issues
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment checklist
