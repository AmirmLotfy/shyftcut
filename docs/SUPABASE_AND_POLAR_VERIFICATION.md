# Supabase & Polar verification checklist

Use this to verify backend configuration and Polar setup. You can use **Supabase MCP** (`get_logs`, `list_edge_functions`, `get_project_url`, `list_tables`) and **Polar MCP** (e.g. `polar_products_list`) to check things programmatically, plus the Dashboards for secrets and webhooks.

---

## 1. Supabase project

| Check | How |
|-------|-----|
| **Project URL** | MCP: `get_project_url`. Expected: `https://<project-ref>.supabase.co` (e.g. `https://qydmjbiwukwlmblosolb.supabase.co`). |
| **Edge Functions** | MCP: `list_edge_functions`. Expect `api` and `webhook-polar`, both `status: "ACTIVE"`. |
| **Edge Function logs** | MCP: `get_logs` with `service: "edge-function"`. Look for 500s on `api` (e.g. checkout) or `webhook-polar`. |
| **Tables** | MCP: `list_tables`. Expect at least `profiles`, `subscriptions`, `roadmaps`, `roadmap_weeks`, `course_recommendations`, `newsletter_subscribers`, `chat_history`. |

---

## 2. Supabase Edge Function secrets

Set in **Supabase Dashboard → Project → Edge Functions → Secrets** (or `supabase secrets set`). No redeploy needed after changing secrets.

| Secret | Used by | Purpose |
|--------|---------|---------|
| **GEMINI_API_KEY** | api | Roadmap, chat, quiz (Gemini) |
| **POLAR_ACCESS_TOKEN** | api | Checkout create, customer portal |
| **POLAR_WEBHOOK_SECRET** | webhook-polar | HMAC verification of Polar webhooks |
| **RESEND_API_KEY** | api, webhook-polar | Contact, newsletter, welcome email |
| **FROM_EMAIL** | api, webhook-polar | Sender email |
| **CONTACT_TO_EMAIL** | api | Contact form recipient |

**Verify:** `supabase secrets list` (or Dashboard). Do **not** commit secret values.

---

## 3. Polar products & prices

The app uses **product IDs** for the Create Checkout Session API (`products: [ productId ]`), and **price IDs** only for display in `polar-config.ts`.

| Plan | Product name (Polar) | Product ID | Price ID (monthly/yearly) |
|------|----------------------|------------|---------------------------|
| Premium monthly | Shyftcut Premium | `fb08648d-d92f-4fc9-bb76-f43df88991b4` | `0807f6a7-b546-457e-99d1-fb4d008b5154` |
| Premium yearly | Shyftcut Premium Annual | `21d9e315-f385-4c89-b58b-a74985db817b` | `f7a4f270-4641-4e89-839c-2c4265cfbfc3` |

**Verify:** Polar Dashboard → Products, or MCP: `polar_products_list`. Confirm product IDs and price IDs match [src/lib/polar-config.ts](../src/lib/polar-config.ts).

---

## 4. Polar webhook

- **URL:** `https://<project-ref>.supabase.co/functions/v1/webhook-polar`  
  Example: `https://qydmjbiwukwlmblosolb.supabase.co/functions/v1/webhook-polar`
- **Events:** subscription.created, subscription.active, subscription.updated, subscription.canceled, subscription.revoked (and optionally checkout.created if you use it).
- **Secret:** Must match Supabase secret `POLAR_WEBHOOK_SECRET` (e.g. value from Polar → Webhooks → endpoint → signing secret).

**Verify:** Polar Dashboard → Webhooks → your endpoint. Confirm URL and that the signing secret is the same as in Supabase.

See [POLAR_WEBHOOK_SETUP.md](POLAR_WEBHOOK_SETUP.md) for step-by-step setup.

---

## 5. Checkout 500 fix (Create Checkout Session)

Polar’s **Create Checkout Session** (`POST /v1/checkouts`) expects **`products`** (array of **product IDs**), not `product_price_id`. The app was updated to:

- Send `productId` from the client (from `POLAR_PRODUCTS.premium.monthly.productId` / `.yearly.productId`).
- Build payload: `{ products: [ productId ], success_url, return_url, metadata, customer_id | customer_email }`.

**Troubleshooting:** (1) Ensure **POLAR_ACCESS_TOKEN** is set in Supabase Edge Function secrets (Org Access Token with `checkouts:write` and `customers:write`). (2) Check Edge Function logs for `checkout/create:` errors—Polar's response body is logged. (3) Confirm product IDs in polar-config.ts match Polar Dashboard. (4) If you see `ensureProfileAndSubscription: ... failed`, check that `profiles` and `subscriptions` tables exist and the service role can upsert.

---

## 6. Quick MCP checks (summary)

```text
# Supabase
get_project_url          → base URL for webhook and API
list_edge_functions     → api, webhook-polar present and ACTIVE
get_logs(edge-function) → recent 500s / errors
list_tables             → profiles, subscriptions, etc.

# Polar (if MCP available)
polar_products_list     → Shyftcut Premium / Shyftcut Premium Annual with correct IDs
```

Webhook URL and webhook secret must be verified in the **Polar Dashboard** (no MCP for listing webhooks in this setup).
