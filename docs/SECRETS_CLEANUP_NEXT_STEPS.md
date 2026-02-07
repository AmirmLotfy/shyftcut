# Secrets Cleanup - Next Steps

**Date:** 2026-02-06  
**Status:** Ready for cleanup

---

## 🔍 Audit Results

### Found Duplicates

**11 backend secrets** are stored in **both** Vercel and Supabase:

1. `CAREER_DNA_DISCOUNT_ID`
2. `CONTACT_TO_EMAIL`
3. `FROM_EMAIL`
4. `GEMINI_API_KEY`
5. `POLAR_ACCESS_TOKEN`
6. `POLAR_WEBHOOK_SECRET`
7. `RESEND_API_KEY`
8. `SUPABASE_ANON_KEY`
9. `SUPABASE_DB_URL`
10. `SUPABASE_SERVICE_ROLE_KEY`
11. `SUPABASE_URL`

### Additional Issues

- **32 backend secrets** incorrectly in Vercel (including duplicates above)
- Many legacy/unused secrets (DATABASE_URL, POSTGRES_*, NEON_*, etc.)

---

## ✅ What Should Stay Where

### Vercel (Frontend Only)
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_ANON_KEY`
- ✅ `VITE_API_URL`
- ✅ `VITE_SESSION_IDLE_TIMEOUT_MS`
- ✅ `VITE_HCAPTCHA_SITE_KEY`
- ✅ `VITE_AFFONSO_PORTAL_URL`
- ✅ `VITE_GOOGLE_CLIENT_ID`
- ✅ `VITE_NEON_AUTH_URL`

### Supabase (Backend Only)
- ✅ All backend secrets (POLAR_*, GEMINI_*, RESEND_*, etc.)
- ✅ Auto-injected Supabase secrets (SUPABASE_URL, etc.)

---

## 🚀 Cleanup Steps

### Step 1: Review Audit

```bash
npm run secrets:audit
```

This shows what duplicates exist and what will be removed.

### Step 2: Dry Run Cleanup

```bash
npm run secrets:cleanup
```

This shows what **would** be removed without actually removing anything.

### Step 3: Execute Cleanup

```bash
npm run secrets:cleanup:live
```

This removes the 11 duplicate backend secrets from Vercel (all environments).

**Or manually remove each:**

```bash
# Remove each secret from all environments
vercel env rm CAREER_DNA_DISCOUNT_ID production preview development --yes
vercel env rm CONTACT_TO_EMAIL production preview development --yes
vercel env rm FROM_EMAIL production preview development --yes
vercel env rm GEMINI_API_KEY production preview development --yes
vercel env rm POLAR_ACCESS_TOKEN production preview development --yes
vercel env rm POLAR_WEBHOOK_SECRET production preview development --yes
vercel env rm RESEND_API_KEY production preview development --yes
vercel env rm SUPABASE_ANON_KEY production preview development --yes
vercel env rm SUPABASE_DB_URL production preview development --yes
vercel env rm SUPABASE_SERVICE_ROLE_KEY production preview development --yes
vercel env rm SUPABASE_URL production preview development --yes
```

### Step 4: Verify Cleanup

```bash
# Check Vercel only has frontend secrets
vercel env ls | grep -E '^\s+VITE_'

# Check Supabase has all backend secrets
npx supabase secrets list

# Run audit again to confirm no duplicates
npm run secrets:audit
```

### Step 5: Test Deployment

```bash
npm run deploy:all
```

Or deploy separately:
```bash
# Deploy frontend
vercel --prod --force

# Deploy backend functions
npm run supabase:secrets:sync  # Ensure secrets are synced
npx supabase functions deploy api
```

---

## 📋 Prevention Checklist

After cleanup, ensure:

- ✅ **Vercel** only has `VITE_*` variables
- ✅ **Supabase** has all backend secrets
- ✅ No duplicates between Vercel and Supabase
- ✅ `.env.example` clearly documents which secrets go where
- ✅ `sync-secrets-to-supabase.mjs` only syncs to Supabase (not Vercel)
- ✅ Documentation (`SECRETS_MANAGEMENT.md`) is up to date

---

## 🔧 Available Commands

```bash
# Audit secrets (find duplicates)
npm run secrets:audit

# Preview cleanup (dry run)
npm run secrets:cleanup

# Execute cleanup (removes duplicates)
npm run secrets:cleanup:live

# Sync secrets to Supabase (from .env)
npm run supabase:secrets:sync
```

---

## 📚 Related Documentation

- [SECRETS_AUDIT_AND_CLEANUP.md](SECRETS_AUDIT_AND_CLEANUP.md) - Detailed audit report
- [SECRETS_MANAGEMENT.md](SECRETS_MANAGEMENT.md) - Unified secrets guide
- [POLAR_TOKEN_TROUBLESHOOTING.md](POLAR_TOKEN_TROUBLESHOOTING.md) - Token issues

---

## ⚠️ Important Notes

1. **Backend secrets in Vercel are NOT used** - They're just taking up space and causing confusion
2. **Removing them is safe** - Your app only uses Supabase secrets for backend
3. **Frontend secrets stay in Vercel** - They're needed for build time and browser
4. **Test after cleanup** - Ensure everything still works

---

## 🎯 Expected Outcome

After cleanup:

- ✅ **Vercel:** ~8 frontend secrets (`VITE_*`)
- ✅ **Supabase:** ~18 backend secrets
- ✅ **No duplicates**
- ✅ **Clear separation** of concerns
- ✅ **Easier maintenance** - one source of truth per secret
