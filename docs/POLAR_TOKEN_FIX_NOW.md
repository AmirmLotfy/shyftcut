# Fix Polar Token 401 Error - Immediate Steps

**Error:** `401 (Unauthorized)` - Payment provider authentication failed

## Quick Fix (5 minutes)

### Step 1: Generate New Token in Polar Dashboard

1. Go to **Polar Dashboard** → Settings → API → Organization Access Tokens
2. Click **"Create Token"**
3. Fill in:
   - **Name**: `Shyftcut Production - ${new Date().toISOString().split('T')[0]}`
   - **Expiration**: **LEAVE BLANK** (truly never expire)
   - **Scopes**: Select all (checkout, customers, subscriptions, products, etc.)
4. Click **"Create"**
5. **Copy the token immediately** (starts with `polar_oat_...`)

### Step 2: Set Token Directly in Supabase Dashboard (Recommended)

**⚠️ IMPORTANT: Set directly in Dashboard to avoid sync script issues**

1. Go to **Supabase Dashboard** → Your Project → Settings → Edge Functions → Secrets
2. Find `POLAR_ACCESS_TOKEN` or click **"Add new secret"**
3. **Key**: `POLAR_ACCESS_TOKEN`
4. **Value**: Paste the token you copied from Polar (should start with `polar_oat_`)
5. Click **"Save"**

### Step 3: Verify Token Works

Test the token directly:

```bash
# Replace YOUR_TOKEN with the actual token
curl -X GET "https://api.polar.sh/v1/products" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected:** Should return a JSON list of products, not an error.

### Step 4: Test Checkout Flow

1. Go to your app: https://shyftcut.com
2. Try to upgrade/subscribe
3. Should work without 401 error

---

## Alternative: Update via CLI (If Dashboard doesn't work)

If you prefer CLI, update `.env` first, then sync:

```bash
# 1. Update .env file
# Add: POLAR_ACCESS_TOKEN=polar_oat_YOUR_NEW_TOKEN

# 2. Sync to Supabase
npm run supabase:secrets:sync

# 3. Redeploy Edge Functions
npx supabase functions deploy api --no-verify-jwt
```

---

## Why This Happens

- **Token expired**: Even "never expire" tokens can expire if not set correctly
- **Token revoked**: Someone might have revoked it in Polar Dashboard
- **Token format corrupted**: Sync script might have truncated/encoded it incorrectly
- **Wrong token**: Token might be for a different Polar organization

---

## Prevention (and deploy fix)

1. ✅ **Set token directly in Supabase Dashboard** (bypasses sync script issues)
2. ✅ **POLAR secrets excluded from deploy sync** — `POLAR_ACCESS_TOKEN` and `POLAR_WEBHOOK_SECRET` are no longer pushed during `npm run deploy:all`. Set them once in the Dashboard; they will not be overwritten. See [POLAR_SECRETS_DEPLOY_FIX.md](./POLAR_SECRETS_DEPLOY_FIX.md).
3. ✅ **Create token with truly blank expiration** (leave field empty)
4. ✅ **Test token immediately** after creation
5. ✅ **Document token creation date** in token name
6. ✅ **Keep backup** in secure password manager

---

## Still Not Working?

1. **Check token in Polar Dashboard**:
   - Settings → API → Organization Access Tokens
   - Verify token exists and is not expired/revoked

2. **Verify token format**:
   - Should start with `polar_oat_`
   - Should be ~50-60 characters long
   - No spaces or line breaks

3. **Check Supabase Dashboard**:
   - Settings → Edge Functions → Secrets
   - Verify `POLAR_ACCESS_TOKEN` exists and matches Polar token

4. **Test with curl** (see Step 3 above)

5. **Check Edge Function logs**:
   - Supabase Dashboard → Edge Functions → api → Logs
   - Look for authentication errors

---

## Related Docs

- [POLAR_TOKEN_SETUP.md](POLAR_TOKEN_SETUP.md) - Detailed setup guide
- [POLAR_TOKEN_TROUBLESHOOTING.md](POLAR_TOKEN_TROUBLESHOOTING.md) - Comprehensive troubleshooting
- [SECRETS_MANAGEMENT.md](SECRETS_MANAGEMENT.md) - Secrets management guide
