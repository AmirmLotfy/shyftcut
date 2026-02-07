# Why Polar Secrets Break After Each Deploy (and the Fix)

## Root Cause

**Every deploy runs `npm run supabase:secrets:sync`**, which reads from `.env` / `.env.local` / `.env.vercel` and pushes whitelisted secrets to Supabase via `supabase secrets set --env-file`.

### The Problem

1. **Sync overwrites Supabase with .env values** — When `supabase secrets set --env-file` runs, it **updates** the secrets in the file. If `POLAR_ACCESS_TOKEN` is in the env file, it overwrites whatever is in Supabase.

2. **Vicious cycle**:
   - Token works → You add a new one in Polar Dashboard and set it in Supabase Dashboard → Checkout works
   - Next deploy → Sync runs → `.env` has the **old** token (or a stale/corrupt one)
   - Sync overwrites Supabase with the old value → Checkout fails with 401
   - You add another new token in Supabase Dashboard → Works until next deploy

3. **Additional risk: .env source** — The sync prefers `.env.vercel` if it exists (from `vercel env pull`). If POLAR was removed from Vercel during secrets cleanup, `.env.vercel` may have no `POLAR_ACCESS_TOKEN`. In that case, sync wouldn’t include it — but if you have it in `.env` or `.env.local`, sync will push it and overwrite the good value from the Dashboard.

4. **Potential corruption** — Env parsing, escaping, and quoting in the sync script can, in edge cases, change the token (newlines, special characters, truncation). Polar tokens are sensitive to exact format (`polar_oat_...`).

## The Fix (Implemented)

**`POLAR_ACCESS_TOKEN` and `POLAR_WEBHOOK_SECRET` are excluded from the sync script.**  
They are no longer pushed during deploy, so the values you set in the Supabase Dashboard stay intact.

### What You Need to Do

1. **Set both secrets once in the Supabase Dashboard**:
   - Go to: **Supabase Dashboard** → Your Project → **Settings** → **Edge Functions** → **Secrets**
   - Add or update:
     - `POLAR_ACCESS_TOKEN` — from Polar Dashboard → Settings → API → Organization Access Tokens (create token, leave expiration blank)
     - `POLAR_WEBHOOK_SECRET` — from Polar Dashboard → Webhooks → your webhook → Signing Secret

2. **Do not rely on .env for Polar secrets** — You can keep them in `.env` for local dev if needed, but they will no longer be synced. Production uses only the Dashboard values.

3. **After deploy** — Polar secrets will not be touched by the sync step. You should not need to add a new token after each deploy.

## Verification

After deploying:

```bash
# Check Polar token is present (value is masked)
npx supabase secrets list | grep POLAR

# Test token
curl -X GET "https://api.polar.sh/v1/products" \
  -H "Authorization: Bearer $(npx supabase secrets get POLAR_ACCESS_TOKEN 2>/dev/null | tail -1)" \
  -H "Content-Type: application/json"
```

If the curl returns a JSON list of products, the token is valid.

## References

- [POLAR_TOKEN_FIX_NOW.md](./POLAR_TOKEN_FIX_NOW.md) — Quick fix when token fails
- [POLAR_TOKEN_TROUBLESHOOTING.md](./POLAR_TOKEN_TROUBLESHOOTING.md) — General troubleshooting
- [Polar OAT docs](https://docs.polar.sh/integrate/oat)
- [Supabase Edge Functions secrets](https://supabase.com/docs/guides/functions/secrets)
