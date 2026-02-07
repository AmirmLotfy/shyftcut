# Polar Webhook URL and Events Reference

## Webhook URL Format

According to [Supabase Edge Functions documentation](https://supabase.com/docs/guides/functions/quickstart), the webhook URL format is:

```
https://<PROJECT_REF>.supabase.co/functions/v1/webhook-polar
```

### How to Get Your Project Reference

1. **From Supabase Dashboard:**
   - Go to **Settings → API**
   - Your **Project URL** is shown as `https://<project-ref>.supabase.co`
   - Extract the `<project-ref>` part (the string before `.supabase.co`)

2. **From Environment Variable:**
   - If you have `VITE_SUPABASE_URL` or `SUPABASE_URL` set (e.g., `https://qydmjbiwukwlmblosolb.supabase.co`)
   - Extract the project reference: `qydmjbiwukwlmblosolb`
   - Your webhook URL becomes: `https://qydmjbiwukwlmblosolb.supabase.co/functions/v1/webhook-polar`

3. **From Supabase Dashboard URL:**
   - Your Supabase dashboard URL is: `https://supabase.com/dashboard/project/<project-ref>`
   - Use that `<project-ref>` in the webhook URL

### Example

If your Supabase project URL is:
```
https://qydmjbiwukwlmblosolb.supabase.co
```

Then your webhook URL is:
```
https://qydmjbiwukwlmblosolb.supabase.co/functions/v1/webhook-polar
```

---

## Required Webhook Events

Based on the webhook handler code (`supabase/functions/webhook-polar/index.ts`), subscribe to these events in Polar:

### Required Events

| Event | Purpose | Handler Action |
|-------|---------|----------------|
| `checkout.created` | New checkout session created | Logged (activation happens on subscription events) |
| `subscription.created` | New subscription created | Activates subscription, sets tier, sends welcome email |
| `subscription.active` | Subscription becomes active | Activates subscription, sets tier, sends welcome email |
| `subscription.updated` | Subscription period/status changes | Updates period dates and status |
| `subscription.canceled` | User canceled subscription | Sets tier to free, sends cancel email |
| `subscription.revoked` | Subscription ended/revoked | Sets tier to free, sends cancel email |

### Optional Events

| Event | Purpose | Handler Action |
|-------|---------|----------------|
| `order.created` | Order/renewal created | Not currently handled (for future logging) |

---

## Polar Dashboard Configuration

1. **Polar Dashboard** → Your organization → **Settings** → **Webhooks** → **Add Endpoint**

2. **URL:** 
   ```
   https://<PROJECT_REF>.supabase.co/functions/v1/webhook-polar
   ```
   Replace `<PROJECT_REF>` with your actual project reference.

3. **Delivery format:** **Raw** (JSON)

4. **Secret:** 
   - Generate a random secret (or set your own)
   - Copy this secret immediately (shown only once)
   - Add to Supabase as `POLAR_WEBHOOK_SECRET` (see below)

5. **Events:** Select all required events listed above

6. **Save** the endpoint

---

## Supabase Secret Configuration

After creating the webhook in Polar, add the secret to Supabase:

**Location:** Supabase Dashboard → Project Settings → Edge Functions → Secrets

- **Name:** `POLAR_WEBHOOK_SECRET`
- **Value:** The exact secret from Polar (must match exactly, no extra spaces/newlines)

**Important:** The secret must match exactly between Polar and Supabase. The webhook handler uses HMAC-SHA256 signature verification, and any mismatch will cause webhook requests to be rejected with a 401 error.

---

## Verification Checklist

- [ ] Webhook URL is correct format: `https://<project-ref>.supabase.co/functions/v1/webhook-polar`
- [ ] All required events are subscribed in Polar
- [ ] `POLAR_WEBHOOK_SECRET` is set in Supabase Edge Function secrets
- [ ] Secret matches exactly between Polar and Supabase (no extra spaces)
- [ ] Edge Function `webhook-polar` is deployed: `npx supabase functions deploy webhook-polar --no-verify-jwt`

---

## References

- [Supabase Edge Functions Quickstart](https://supabase.com/docs/guides/functions/quickstart)
- [Polar Webhook Events Documentation](https://docs.polar.sh/integrate/webhooks/events)
- [Standard Webhooks Specification](https://www.standardwebhooks.com/)
