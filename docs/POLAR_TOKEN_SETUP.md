# Polar Access Token Setup Guide

## Problem: Token Expires After Redeploy

If your Polar access token stops working after each redeploy, it's likely because the token was created with an **expiration date** in the Polar Dashboard.

## Solution: Create a Non-Expiring Token

### Steps:

1. **Go to Polar Dashboard** → Settings → API → Organization Access Tokens
2. **Create a new token** with these settings:
   - **Name**: `Shyftcut Production` (or similar)
   - **Expiration**: **Leave blank** or set to a very far future date (e.g., 10 years)
   - **Scopes**: Select all required scopes (checkout, customers, subscriptions, etc.)

3. **Copy the token** (starts with `polar_oat_...`)

4. **Update your `.env` file**:
   ```bash
   POLAR_ACCESS_TOKEN=polar_oat_YOUR_NEW_TOKEN_HERE
   ```

5. **Sync to Supabase**:
   ```bash
   npm run supabase:secrets:sync
   ```

6. **Verify the token works**:
   ```bash
   curl -X GET "https://api.polar.sh/v1/products" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json"
   ```
   Should return a list of products, not an error.

## Why This Happens

- **Polar Organization Access Tokens (OAT)** can have custom expiration dates
- If you set an expiration when creating the token, it will expire at that time
- **Redeploying doesn't cause expiration** - but if the token was already expired or close to expiring, it will fail
- The sync script properly handles the token format, so the issue is always token expiration

## Best Practices

1. **Create tokens without expiration** for production use
2. **Use descriptive names** so you can identify tokens in Polar Dashboard
3. **Rotate tokens periodically** (e.g., annually) for security
4. **Keep a backup** of working tokens in a secure password manager
5. **Monitor token usage** in Polar Dashboard to detect issues early

## Troubleshooting

### Token still not working after sync?

1. **Check token expiration** in Polar Dashboard → Settings → API
2. **Verify token format** - should start with `polar_oat_`
3. **Test token directly** with curl (see above)
4. **Check Supabase logs** for authentication errors:
   ```bash
   npx supabase functions logs api
   ```

### Token works locally but not in production?

- Secrets are environment-specific
- Make sure you're syncing to the correct Supabase project
- Verify the project is linked: `npx supabase link`

## Related Documentation

- [Polar API Documentation](https://docs.polar.sh/integrate/oat)
- [Supabase Edge Functions Secrets](docs/EDGE_FUNCTION_SECRETS.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
