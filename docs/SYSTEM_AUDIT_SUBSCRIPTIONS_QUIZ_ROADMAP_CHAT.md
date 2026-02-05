# System Audit: Subscriptions, Quiz, Roadmap, Chat, Upgrade UX

**Date:** 2025-02-04  
**Scope:** Frontend, backend API, Edge Functions, secrets, upgrade UX

---

## 1. Subscriptions

### Frontend
- **`useSubscription`** (`src/hooks/useSubscription.ts`): Fetches `/api/subscription`, returns `tier`, `isPremium`, `periodEnd`, `features`
- **`getUpgradePath(user)`**: Logged-in → `/upgrade`, guest → `/pricing`
- **Tier features** defined in `useSubscription`: free (1 roadmap, 10 chat, 3 quizzes, 20 notes, 30 tasks, 5 AI suggests/day), premium/pro (unlimited)

### Backend (Edge Function `api`)
- **`GET /api/subscription`**: Reads `subscriptions` table by `user_id`, returns tier, status, period dates
- **`ensureProfileAndSubscription`**: Creates/upserts profile + free subscription on first auth

### Webhook (`webhook-polar`)
- **Events:** `subscription.created`, `subscription.active` → set tier, send welcome email
- **Events:** `subscription.updated` → update period dates
- **Events:** `subscription.canceled`, `subscription.revoked` → set tier=free, send cancel email
- **Metadata:** Expects `user_id` and `plan_id` in subscription metadata (from checkout)

### Secrets (Supabase Edge Functions)
| Secret | Required | Used by |
|--------|----------|---------|
| `POLAR_ACCESS_TOKEN` | Yes | api (checkout/create, checkout/portal) |
| `POLAR_WEBHOOK_SECRET` | Yes | webhook-polar |
| `RESEND_API_KEY` | Yes | webhook-polar (welcome/cancel emails) |
| `FROM_EMAIL` | Yes | webhook-polar |

### Sync
`npm run supabase:secrets:sync` reads `.env` / `.env.local` / `.env.vercel` and pushes whitelisted keys. Whitelist includes `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `RESEND_API_KEY`, `FROM_EMAIL`.

### Polar Config
- **`src/lib/polar-config.ts`**: Product IDs for Premium monthly/yearly
- **Checkout** uses `productId` (not `priceId`) for Polar API

---

## 2. Quiz Generation and Validation

### Frontend
- **`useQuiz`** (`src/hooks/useQuiz.ts`): `generateQuiz({ weekId, skills, weekTitle })` → POST `/api/quiz/generate`
- **`QuizModal`**: Renders quiz, handles generate/retry, submit to `/api/quiz/results`
- **Error handling**: 402 (limit), 429 (rate limit), 500 → user-facing messages

### Backend (Edge Function `api`)
- **`POST /api/quiz/generate`**:
  - Auth required
  - Tier check: free users limited to 3 quizzes/month (from `quiz_results`)
  - Uses Gemini with function calling (`create_quiz`) and `thinkingLevel: "high"`
  - `cleanQuizOutput()` validates/sanitizes AI response (question, options, correct_index, explanation)
  - Returns `{ success, weekId, questions }`

### Validation (`cleanQuizOutput`)
- Ensures `questions` array, each item has `question`, `options` (4 items), `correct_index` (0–3), `explanation`
- Truncates to length limits (MAX_QUESTION_LEN, MAX_OPTION_LEN, etc.)

### Secrets
- **`GEMINI_API_KEY`**: Required for quiz generation

### Known Issues
- 500 errors: Often Gemini API (rate limit, quota, model availability). Check Edge Function logs.
- `gemini-3-flash-preview` model must be valid in Google AI Studio.

---

## 3. Roadmap Generation

### Frontend
- **Wizard** (`src/pages/Wizard.tsx`): Collects profile data, calls `/api/roadmap/generate` (auth) or `/api/roadmap/generate-guest` (guest)
- **Limits**: `useRoadmap` + `canCreateRoadmap()` from `useUsageLimits`

### Backend
- **`POST /api/roadmap/generate`**: Auth required, free limit 1 roadmap
- **`POST /api/roadmap/generate-guest`**: No auth, preview only (2 weeks, limited courses)
- Uses Gemini with Google Search grounding, `responseMimeType: application/json`, `ROADMAP_RESPONSE_JSON_SCHEMA`
- `cleanRoadmapOutput()`, `fillMissingCourseUrls()` for validation

### Secrets
- **`GEMINI_API_KEY`**: Required
- **`GEMINI_ROADMAP_THINKING_LEVEL`**: Optional, `high` or `low` (default)

---

## 4. Upgrade UX – Dashboard Premium Container

### Current Flow
1. **Dashboard** subscription card: "Upgrade" button → `Link to="/upgrade?returnTo=/dashboard"`
2. **`/upgrade`** is in `APP_PATHS` → `Layout` renders `AppShell` (sidebar on desktop, bottom nav on mobile)
3. **Upgrade page**: `CheckoutButton` → `window.location.href = checkoutUrl` → user leaves app for Polar checkout

### Issue
When user clicks **"Upgrade Now"** (CheckoutButton), they are redirected to Polar’s hosted checkout in the **same tab**. The app is replaced by the external payment page.

### Fix Applied
`CheckoutButton` now opens the checkout URL in a **new tab** (`window.open(checkoutUrl, '_blank')`) so the app stays open. After payment, user can close the Polar tab and return to the app; subscription state will refresh on next navigation or query invalidation.

---

## 5. Chat with AI

### Frontend
- **`Chat.tsx`**: `apiPath`, `apiHeaders` for streaming; `useUsageLimits` for free-tier limit (10 msgs/month)
- **Streaming**: `fetch` with `ReadableStream`, SSE parsing
- **History**: `GET /api/chat/history`, `GET/POST /api/chat/messages` for persistence

### Backend (Edge Function `api`)
- **`POST /api/chat`**: Streams from Gemini `streamGenerateContent`
- Tier check: free users limited to 10 user messages/month (from `chat_history`)
- Uses `contentsFromChatMessages` for `thoughtSignature` (Gemini 3 reasoning continuity)
- Optional context caching for long system prompts
- Persists user message + assistant response to `chat_history`

### Secrets
- **`GEMINI_API_KEY`**: Required

### API Flow
1. Load chat history from DB
2. Build system prompt (roadmap context, profile)
3. Call Gemini stream API
4. Parse SSE chunks, extract text
5. Save assistant response to DB
6. Stream chunks to client

---

## Summary: Required Secrets

| Secret | Service | Purpose |
|--------|---------|---------|
| `GEMINI_API_KEY` | api | Quiz, chat, roadmap, avatar, CV, jobs |
| `POLAR_ACCESS_TOKEN` | api | Checkout create, customer portal |
| `POLAR_WEBHOOK_SECRET` | webhook-polar | Webhook signature verification |
| `RESEND_API_KEY` | api, webhook-polar | Email (welcome, cancel, contact, newsletter) |
| `FROM_EMAIL` | api, webhook-polar | Sender address |
| `CONTACT_TO_EMAIL` | api | Contact form recipient |

---

## Verification Commands

```bash
# Sync secrets
npm run supabase:secrets:sync

# Deploy Edge Functions
npx supabase functions deploy api --no-verify-jwt
npx supabase functions deploy webhook-polar --no-verify-jwt

# Check logs (API 500s)
npx supabase functions logs api --limit 50
```
