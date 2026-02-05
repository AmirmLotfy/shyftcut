# Subscription Flow – Test Report

Full audit of subscription flow: UI, UX, API calls, outputs, routes, frontend and backend.

---

## 1. Routes & Pages

| Route | Component | Auth | Description |
|-------|-----------|------|-------------|
| `/pricing` | Pricing | Public | Public pricing page; CTAs link to `/upgrade` (logged-in) or stay on pricing |
| `/upgrade` | Upgrade | Protected | In-app upgrade; CheckoutButton opens Polar in new tab |
| `/checkout/success` | CheckoutSuccess | Protected | Post-payment success; invalidates subscription, redirects after 5s |
| `/checkout/cancel` | CheckoutCancel | Protected | Checkout cancelled; links to upgrade/pricing or dashboard |
| `/dashboard` | Dashboard | Protected | Shows Upgrade CTA (free) or Manage subscription (premium) |
| `/profile` | Profile | Protected | Subscription card: View plans, Manage subscription (premium) |

---

## 2. API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/subscription` | GET | Required | Returns tier, status, current_period_* from `subscriptions` |
| `/api/checkout/create` | POST | Required | Creates Polar checkout; returns `{ checkoutUrl }` |
| `/api/checkout/portal` | GET | Required | Creates Polar customer portal; returns `{ url }` |
| `/api/usage` | GET | Required | Returns limits (roadmaps, chat, quizzes, etc.) |

### Checkout Create Payload

```json
{
  "planId": "premium",
  "productId": "<product-uuid>",
  "successUrl": "https://shyftcut.com/checkout/success?returnTo=/dashboard",
  "returnUrl": "/dashboard"
}
```

### Subscription Response

```json
{
  "tier": "free" | "premium" | "pro",
  "status": "active",
  "current_period_start": "ISO8601",
  "current_period_end": "ISO8601",
  "polar_customer_id": "uuid",
  "polar_subscription_id": "uuid"
}
```

---

## 3. Frontend Flow

### Upgrade Path Logic (`getUpgradePath`)
- Logged in → `/upgrade`
- Guest → `/pricing`

### CheckoutButton
1. User clicks "Upgrade Now"
2. If not logged in → redirect to `/signup`
3. POST `/api/checkout/create` with `planId`, `productId`, `successUrl`, `returnUrl`
4. On success: `window.open(checkoutUrl, '_blank')` — Polar opens in new tab
5. On error: toast with message; uses `skipUnauthorizedLogout: true` to avoid logout on 401

### Checkout Success
1. Invalidates `subscription` and `usage-limits` queries
2. Shows confetti, feature list, Go to Dashboard, Manage billing
3. Auto-redirect after 5 seconds to `returnTo` (default `/dashboard`)

### Manage Subscription (Portal)
1. User clicks "Manage subscription" (Dashboard or Profile)
2. GET `/api/checkout/portal?returnUrl=<current page>`
3. Redirects to Polar customer portal URL (same tab)

---

## 4. Backend Flow

### checkout/create
1. `ensureProfileAndSubscription` — creates profile/sub if missing
2. Validate `productId` required
3. Validate `successUrl`/`returnUrl` same-origin
4. Get or create Polar customer (by email, `external_id` = user_id)
5. Store `polar_customer_id` in `subscriptions` if new
6. POST to Polar `v1/checkouts` with `products`, `success_url`, `return_url`, `metadata: { user_id, plan_id }`
7. Return `{ checkoutUrl }` from Polar response

### checkout/portal
1. Require `polar_customer_id` in `subscriptions`
2. POST to Polar `v1/customer-sessions` with `customer_id`, `return_url`
3. Return `{ url: session.customer_portal_url }`

### Webhook (webhook-polar)
- `subscription.created`, `subscription.active` → set tier, send welcome email
- `subscription.updated` → update period dates
- `subscription.canceled`, `subscription.revoked` → set tier=free, send cancel email
- Metadata must include `user_id` and `plan_id` (set in checkout/create)

---

## 5. API Test Results (Automated)

Run: `VITE_API_URL=<api-base> node scripts/test-subscription-flow.mjs`

| Test | Expected | Result |
|------|----------|--------|
| GET /api/subscription (no auth) | 401 | ✓ |
| POST /api/checkout/create (no auth) | 401 | ✓ |
| GET /api/checkout/portal (no auth) | 401 | ✓ |
| GET /api/usage (no auth) | 401 | ✓ |
| Method validation (401 before 405) | 401 or 405 | ✓ |

---

## 6. Manual UI/UX Verification Checklist

### Pricing Page (`/pricing`)
- [ ] Plans displayed (Free, Premium)
- [ ] CTA links to `/upgrade` when logged in, `/pricing` when guest
- [ ] Premium features listed

### Upgrade Page (`/upgrade`)
- [ ] Redirects to login if not authenticated (ProtectedRoute)
- [ ] Monthly/Yearly toggle
- [ ] "Upgrade Now" opens Polar checkout in **new tab**
- [ ] If already premium: shows "Already Premium" with link to Profile

### Checkout Success (`/checkout/success`)
- [ ] Confetti animation
- [ ] Feature list visible
- [ ] "Go to Dashboard" and "Manage billing" buttons
- [ ] Auto-redirect after 5 seconds
- [ ] `returnTo` query param respected

### Checkout Cancel (`/checkout/cancel`)
- [ ] Cancelled message
- [ ] "Back to Upgrade" (logged in) or "Back to Pricing" (guest)
- [ ] "Continue with Free Plan" → Dashboard

### Dashboard
- [ ] Free user: "Upgrade" button → CheckoutButton
- [ ] Premium user: "Manage subscription" → Portal (same tab)

### Profile
- [ ] Free user: "View plans" → Link to /upgrade
- [ ] Premium user: "Manage subscription" → Portal

---

## 7. Polar Product IDs

| Plan | Interval | Product ID |
|------|----------|------------|
| Premium | Monthly | `fb08648d-d92f-4fc9-bb76-f43df88991b4` |
| Premium | Yearly | `21d9e315-f385-4c89-b58b-a74985db817b` |

---

## 8. Secrets Required

| Secret | Used By |
|--------|---------|
| `POLAR_ACCESS_TOKEN` | checkout/create, checkout/portal |
| `POLAR_WEBHOOK_SECRET` | webhook-polar |
| `RESEND_API_KEY` | webhook-polar (welcome/cancel emails) |
| `FROM_EMAIL` | webhook-polar |
