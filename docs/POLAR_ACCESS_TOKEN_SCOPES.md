# Polar Access Token Scopes and Creation Guide

## Required Scopes for Shyftcut

Based on the API endpoints used in `supabase/functions/api/index.ts`, your Polar Organization Access Token needs the following scopes:

### Required Scopes

| Scope | Purpose | Used For |
|-------|---------|----------|
| **`checkouts:write`** | Create checkout sessions | `POST /v1/checkouts` - Creating checkout sessions when users upgrade |
| **`customers:write`** | Create and manage customers | `POST /v1/customers` - Creating Polar customers for new users |
| **`customer_portal:write`** or **`customer_sessions:write`** | Create customer portal sessions | `POST /v1/customer-sessions` - Generating customer portal URLs for subscription management |

### Optional but Recommended Scopes

| Scope | Purpose | Used For |
|-------|---------|----------|
| **`subscriptions:read`** | Read subscription data | Reading subscription details (for future admin features) |
| **`products:read`** | Read product data | Reading product/price information (for verification) |

---

## How to Create a New Polar Access Token

### Step-by-Step Instructions

1. **Go to Polar Dashboard**
   - Navigate to: `https://polar.sh/dashboard/${org_slug}/settings`
   - Or: **Settings** → **General** → Scroll to **Developers** section

2. **Create New Token**
   - Click **"New Token"** button in the Developers section

3. **Configure Token Details**

   **Name:**
   ```
   Shyftcut Production
   ```
   (Use a descriptive name to identify this token)

   **Expiration:**
   - **Leave blank** (for never-expiring token) ⚠️ **IMPORTANT**
   - Or set to a very far future date (e.g., 10 years) if blank is not allowed
   - **Do NOT set a short expiration** - tokens expire after redeploys if they have expiration dates

   **Scopes:**
   Select these scopes:
   - ✅ `checkouts:write`
   - ✅ `customers:write`
   - ✅ `customer_portal:write` (or `customer_sessions:write` if available)
   - ✅ `subscriptions:read` (recommended)
   - ✅ `products:read` (recommended)

4. **Copy the Token**
   - Token starts with `polar_oat_...`
   - **Copy immediately** - you may only see it once
   - Token format: `polar_oat_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

5. **Save Token Securely**
   - Store in a password manager
   - Document creation date for rotation planning

---

## Add Token to Supabase

### Option 1: Via Supabase Dashboard (Recommended)

1. **Supabase Dashboard** → Your project → **Project Settings** → **Edge Functions** → **Secrets**

2. **Add/Update Secret:**
   - **Name:** `POLAR_ACCESS_TOKEN`
   - **Value:** Paste the token directly (no extra spaces/newlines)
   - Click **Save**

3. **No redeploy needed** - Edge Functions read secrets at runtime

### Option 2: Via CLI (Alternative)

1. **Add to `.env` file:**
   ```bash
   POLAR_ACCESS_TOKEN=polar_oat_YOUR_TOKEN_HERE
   ```

2. **Sync to Supabase:**
   ```bash
   npm run supabase:secrets:sync
   ```

   ⚠️ **Note:** The sync script may truncate long tokens. If you encounter issues, use Option 1 (Dashboard) instead.

---

## Verify Token Works

### Test with curl:

```bash
curl -X GET "https://api.polar.sh/v1/products" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**Expected:** Returns JSON array of products (not an error)

### Test Checkout Creation:

```bash
curl -X POST "https://api.polar.sh/v1/checkouts" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "products": ["YOUR_PRODUCT_ID"],
    "success_url": "https://your-app.com/success",
    "return_url": "https://your-app.com"
  }'
```

**Expected:** Returns checkout object with `url` field

---

## API Endpoints Used by Shyftcut

Based on `supabase/functions/api/index.ts`:

| Endpoint | Method | Purpose | Required Scope |
|----------|--------|---------|----------------|
| `/v1/customers` | POST | Create Polar customer for new user | `customers:write` |
| `/v1/checkouts` | POST | Create checkout session | `checkouts:write` |
| `/v1/customer-sessions` | POST | Create customer portal session | `customer_portal:write` |

---

## Troubleshooting

### Token Not Working?

1. **Check token expiration** in Polar Dashboard → Settings → API → Organization Access Tokens
2. **Verify token format** - should start with `polar_oat_` and be ~50-60 characters
3. **Verify scopes** - ensure all required scopes are selected
4. **Test token directly** with curl (see above)
5. **Check Supabase logs:**
   ```bash
   npx supabase functions logs api --limit 50
   ```
   Look for "POLAR_ACCESS_TOKEN" or "401" errors

### Token Expires After Redeploy?

- **Cause:** Token was created with an expiration date
- **Solution:** Create a new token **without expiration** (leave expiration field blank)
- **Best Practice:** Set token directly in Supabase Dashboard (not via sync script) to avoid truncation

### Missing Scopes Error?

- **Error:** `403 Forbidden` or `insufficient_scope`
- **Solution:** Create a new token with all required scopes selected
- **Verify:** Check which scopes are selected in Polar Dashboard

---

## Security Best Practices

1. ✅ **Create tokens without expiration** for production use
2. ✅ **Use descriptive names** so you can identify tokens in Polar Dashboard
3. ✅ **Rotate tokens periodically** (e.g., annually) for security
4. ✅ **Keep a backup** of working tokens in a secure password manager
5. ✅ **Monitor token usage** in Polar Dashboard to detect issues early
6. ✅ **Never commit tokens** to Git or expose in client-side code
7. ✅ **Set tokens directly in Supabase Dashboard** to avoid truncation issues

---

## Related Documentation

- [POLAR_TOKEN_SETUP.md](POLAR_TOKEN_SETUP.md) - Initial token setup
- [POLAR_TOKEN_TROUBLESHOOTING.md](POLAR_TOKEN_TROUBLESHOOTING.md) - Troubleshooting guide
- [POLAR_WEBHOOK_SETUP.md](POLAR_WEBHOOK_SETUP.md) - Webhook configuration
- [Polar OAT Documentation](https://docs.polar.sh/integrate/oat)
- [Polar API Reference](https://docs.polar.sh/api-reference)
