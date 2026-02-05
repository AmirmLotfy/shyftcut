# Polar webhook setup for Shyftcut

The app uses a **Supabase Edge Function** for the Polar webhook (not Vercel). The handler lives in `supabase/functions/webhook-polar/index.ts`.

## Webhook URL

Use your Supabase project’s Edge Functions URL:

**Production:**
```
https://<project-ref>.supabase.co/functions/v1/webhook-polar
```

Replace `<project-ref>` with your Supabase project reference (e.g. from the Supabase dashboard URL or `SUPABASE_URL`).

If you use a custom domain for Supabase Edge Functions, use that base URL + `/webhook-polar` instead.

---

## Steps in Polar

1. **Polar Dashboard** → Your organization → **Settings** → **Webhooks** → **Add Endpoint**.

2. **URL:** Paste your webhook URL, e.g.  
   `https://<project-ref>.supabase.co/functions/v1/webhook-polar`

3. **Delivery format:** **Raw** (JSON).

4. **Secret:** Generate a random secret (or set your own). You will add this to **Supabase** as `POLAR_WEBHOOK_SECRET` (see below).

5. **Events to subscribe to** (required for subscription lifecycle):

   | Event | Purpose |
   |-------|--------|
   | `checkout.created` | New checkout (we use metadata to activate subscription) |
   | `subscription.created` | New subscription created |
   | `subscription.active` | Subscription active (we set tier + period) |
   | `subscription.updated` | Period/status changes, cancellations |
   | `subscription.canceled` | User canceled (we keep active until period end) |
   | `subscription.revoked` | Subscription ended (we set tier to free) |
   | `order.created` | Optional; for renewal logging |

   The handler in `supabase/functions/webhook-polar/index.ts` uses:  
   `checkout.created`, `subscription.created`, `subscription.active`, `subscription.updated`, `subscription.canceled`, `subscription.revoked`, and optionally `order.created`.

6. Save the endpoint. Polar will show the **webhook secret** (only once or in endpoint details). Copy it.

---

## Supabase env / secrets

In **Supabase Dashboard** → Your project → **Project Settings** → **Edge Functions** (or **Settings** → **Edge Functions** → **Secrets**):

- **Name:** `POLAR_WEBHOOK_SECRET`
- **Value:** (the same secret you configured in Polar when creating the webhook endpoint)

Redeploy the Edge Function after setting the secret so it is available at runtime.

Optional (used by the webhook for welcome email):  
- `RESEND_API_KEY`  
- `FROM_EMAIL`  

---

## Notes (from Polar docs)

- **Signature:** Polar uses [Standard Webhooks](https://www.standardwebhooks.com/). The handler verifies the `webhook-signature` (or `x-webhook-signature`) header with HMAC SHA256. The secret must match exactly (no extra spaces/newlines).
- **Timeout:** Polar waits ~10s; respond within ~2s and do heavy work async if needed.
- **Retries:** Up to 10 retries with backoff on non-2xx. Return `200` after processing.
- **Redirects:** Do not use a URL that redirects. Use the final URL.
- **Custom domain:** If you use one for Edge Functions, configure the webhook with that base URL.
