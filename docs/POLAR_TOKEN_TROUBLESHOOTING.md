# Polar Token Troubleshooting Guide

## Problem: Token Needs Regeneration Even When Set to "Never Expire"

If you're experiencing this issue, it's likely one of these causes:

### 1. Token Truncation During Sync

**Symptoms:**
- Token works when tested directly with curl
- Token fails in Edge Function
- Token length differs between `.env` and Supabase

**Solution:**
1. Check token length:
   ```bash
   # In .env
   grep POLAR_ACCESS_TOKEN .env | cut -d'=' -f2 | wc -c
   
   # In Supabase
   npx supabase secrets get POLAR_ACCESS_TOKEN | tail -1 | wc -c
   ```
2. If lengths differ, the sync script might be truncating
3. Set token directly via Supabase Dashboard instead of sync script

### 2. Character Encoding Issues

**Symptoms:**
- Token contains special characters that get corrupted
- Token works locally but not in production

**Solution:**
1. Ensure `.env` file uses UTF-8 encoding
2. Avoid copying token from places that might add hidden characters
3. Set token directly in Supabase Dashboard → Edge Functions → Secrets

### 3. Token Format Issues

**Symptoms:**
- Token starts with `polar_oat_` but still fails
- Error: "invalid_token" or "expired"

**Solution:**
1. Verify token format: Should start with `polar_oat_` and be ~50-60 characters
2. Check token in Polar Dashboard → Settings → API → Organization Access Tokens
3. Ensure token has correct scopes (checkout, customers, subscriptions)
4. Create new token **without expiration** (leave expiration field blank)

### 4. Token Actually Expired (Despite "Never Expire" Setting)

**Symptoms:**
- Token was created with "never expire" but still fails
- Error: "The access token provided is expired"

**Possible Causes:**
- Polar might have a maximum lifetime even for "never expire" tokens
- Token might have been revoked manually
- Organization settings might override token expiration

**Solution:**
1. Check token status in Polar Dashboard
2. Create a new token and verify expiration is truly blank
3. Test token immediately after creation:
   ```bash
   curl -X GET "https://api.polar.sh/v1/products" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json"
   ```

### 5. Supabase Secret Storage Issue

**Symptoms:**
- Token works when set via Dashboard
- Token fails when set via sync script
- Token appears correct in `supabase secrets list`

**Solution:**
1. **Set token directly via Dashboard** (bypass sync script):
   - Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets
   - Add/update `POLAR_ACCESS_TOKEN` manually
   - Copy token directly from Polar Dashboard (don't use `.env`)

2. **Verify token is stored correctly**:
   ```bash
   npx supabase secrets get POLAR_ACCESS_TOKEN
   ```
   Should show the full token without truncation

3. **Test token in Edge Function**:
   - Check Edge Function logs for authentication errors
   - Verify token is being read correctly: `Deno.env.get("POLAR_ACCESS_TOKEN")`

### 6. Recommended Workflow

**Best Practice: Set Token Directly in Supabase Dashboard**

1. **Create token in Polar Dashboard**:
   - Settings → API → Organization Access Tokens
   - Name: `Shyftcut Production`
   - Expiration: **Leave blank** (truly never expire)
   - Scopes: Select all required (checkout, customers, subscriptions)

2. **Copy token immediately** (don't close the dialog)

3. **Set in Supabase Dashboard**:
   - Supabase Dashboard → Project Settings → Edge Functions → Secrets
   - Add/Update `POLAR_ACCESS_TOKEN`
   - Paste token directly (no `.env` file involved)

4. **Verify**:
   ```bash
   # Check it's stored
   npx supabase secrets list | grep POLAR
   
   # Test it works
   curl -X GET "https://api.polar.sh/v1/products" \
     -H "Authorization: Bearer $(npx supabase secrets get POLAR_ACCESS_TOKEN 2>&1 | tail -1)" \
     -H "Content-Type: application/json"
   ```

5. **No redeploy needed** - Edge Functions read secrets at runtime

### 7. Debugging Steps

If token still fails:

1. **Check Edge Function logs**:
   ```bash
   npx supabase functions logs api --limit 50
   ```
   Look for "POLAR_ACCESS_TOKEN" or "401" errors

2. **Verify token in code**:
   Add temporary logging in Edge Function:
   ```typescript
   const token = Deno.env.get("POLAR_ACCESS_TOKEN");
   console.log("Token length:", token?.length);
   console.log("Token starts with:", token?.slice(0, 20));
   ```

3. **Test token directly**:
   ```bash
   TOKEN=$(npx supabase secrets get POLAR_ACCESS_TOKEN 2>&1 | tail -1)
   curl -X GET "https://api.polar.sh/v1/products" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json"
   ```

4. **Check Polar Dashboard**:
   - Verify token is active
   - Check if token was revoked
   - Verify organization permissions

### 8. Prevention

To avoid this issue in the future:

1. ✅ **Set token directly in Supabase Dashboard** (not via sync script)
2. ✅ **Create token without expiration** (leave field blank)
3. ✅ **Test token immediately** after creation
4. ✅ **Document token creation date** for rotation planning
5. ✅ **Use descriptive token names** in Polar Dashboard
6. ✅ **Monitor token usage** in Polar Dashboard

---

## Related Documentation

- [POLAR_TOKEN_SETUP.md](POLAR_TOKEN_SETUP.md) - Initial token setup
- [SECRETS_MANAGEMENT.md](SECRETS_MANAGEMENT.md) - Unified secrets guide
