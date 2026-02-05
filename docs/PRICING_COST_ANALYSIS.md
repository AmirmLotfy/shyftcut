# Shyftcut: Real Cost & Profit Per Subscription

This document uses **actual API usage** from the codebase (prompts, `maxOutputTokens`, optional grounding) and **official pricing** to compute cost per request, per free user, and per paid user. It also ensures **free-plan user costs are covered** by paid revenue.

---

## 1. Official API & payment costs

### 1.1 Gemini API (gemini-3-flash-preview)

| Item | Rate | Source |
|------|------|--------|
| **Input tokens** | $0.50 / 1M tokens | [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing) |
| **Output tokens** | $3.00 / 1M tokens | Same |

### 1.2 Grounding with Google Search (Gemini 3)

| Item | Rate | Source |
|------|------|--------|
| **Free allowance** | 5,000 search queries / month (project-wide) | [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing) |
| **Overage** | $14 / 1,000 search queries | Same (billing from Jan 5, 2026) |

Each **user request** can trigger **one or more** search queries; we are charged per query.

### 1.3 Polar (payment processing)

| Item | Rate |
|------|------|
| **Subscriptions** | 4.5% + $0.40 per transaction |

---

## 2. Real usage from codebase

### 2.1 Roadmap generation (`server/handlers/roadmap/generate.ts`)

- **System prompt:** Career guidance + user profile (job, industry, target career, skills, platforms, hours, budget, timeline, optional `careerReason`). Approx **~1,800 chars** → **~450 tokens**.
- **User content:** Single short prompt → **~30 tokens**.
- **Total input:** **~480 tokens**.
- **Output:** `maxOutputTokens: 8192`. Structured JSON: 12 weeks × (title, description, skills, deliverables, hours, 2–3 courses with title/platform/url/instructor/duration/difficulty/price/rating). Typical **~4,500 tokens**.
- **Optional:** `ROADMAP_USE_GROUNDING === "true"` → `googleSearch` tool enabled. One roadmap can trigger many queries (e.g. course lookups per week). Assume **~25 search queries per roadmap** when grounding is on.

**Cost per roadmap (tokens only):**  
`480 × 0.50/1e6 + 4,500 × 3/1e6 = 0.00024 + 0.0135 = **$0.0137**`

**Cost per roadmap with grounding (tokens + search, after free 5k):**  
`$0.0137 + 25 × ($14/1,000) = $0.0137 + $0.35 = **$0.364**`

### 2.2 Quiz generation (`server/handlers/quiz/generate.ts`)

- **System prompt:** Week topic + skills, “create 5 MC questions with 4 options and explanation”. **~350 chars** → **~90 tokens**. User: weekId, skills, weekTitle → **~40 tokens**.
- **Total input:** **~130 tokens**.
- **Output:** `maxOutputTokens: 4096`. Function-call JSON: 5 questions × (question, 4 options, correct_index, explanation). Typical **~1,000 tokens**.
- **No grounding.**

**Cost per quiz:**  
`130 × 0.50/1e6 + 1,000 × 3/1e6 = 0.000065 + 0.003 = **$0.0031**`

### 2.3 Chat (`server/handlers/chat.ts`)

- **System instruction:** Coach persona + user context (profile + roadmap title, progress, current week). **~600 chars** → **~150 tokens**; profile/roadmap **~150 tokens** → **~300 tokens** system.
- **Contents:** Last 20 messages (`slice(-20)`), plus new user message. Assume **~90 tokens/message** → **~1,800 + 90 = 1,890 tokens** input.
- **Total input:** **~2,200 tokens** (rounded from 300 + 1,890).
- **Output:** `maxOutputTokens: 2048`. Assume **~400 tokens** per reply.
- **Optional:** `useSearch === true` → `googleSearch` tool. Assume **~2 search queries per chat turn** when search is used.

**Cost per chat (tokens only):**  
`2,200 × 0.50/1e6 + 400 × 3/1e6 = 0.0011 + 0.0012 = **$0.0023**`

**Cost per chat with search (tokens + search, after free 5k):**  
`$0.0023 + 2 × ($14/1,000) = $0.0023 + $0.028 = **$0.030**`

---

## 3. Free plan: limits and cost coverage

### 3.1 Free plan limits (from code)

| Feature | Limit | Handler |
|---------|--------|---------|
| **Roadmaps** | 1 **total** (lifetime) | `roadmap/generate.ts` |
| **Chat** | 10 user messages **per month** | `chat.ts` |
| **Quizzes** | 3 **per month** | `quiz/generate.ts` |
| **Course recs** | 1 course per week (in roadmap; no extra API) | `roadmap/generate.ts` (slice) |

Roadmap grounding is **env-driven** (`ROADMAP_USE_GROUNDING`); if enabled, it applies to **all** users (including free). Chat search is **user-toggled**; free users can use it within their 10 messages.

### 3.2 Cost per free user per month (real calculation)

**Scenario A – No grounding (baseline)**  
- 1 roadmap (lifetime, amortize as 1 in first month): **$0.0137**  
- 10 chat (no search): **10 × $0.0023 = $0.023**  
- 3 quizzes: **3 × $0.0031 = $0.0093**  
- **Total: ~$0.046/user/month**

**Scenario B – Roadmap grounding on; free user uses 1 roadmap with search**  
- 1 roadmap with grounding: **$0.364**  
- 10 chat no search: **$0.023**  
- 3 quizzes: **$0.0093**  
- **Total: ~$0.40/user/month**

**Scenario C – Heavy free user (1 roadmap with grounding + 2 chat with search)**  
- 1 roadmap with grounding: **$0.364**  
- 2 chat with search: **2 × $0.030 = $0.06**  
- 8 chat no search: **8 × $0.0023 = $0.018**  
- 3 quizzes: **$0.0093**  
- **Total: ~$0.45/user/month**

**Blended free user (mix of A/B/C):** assume **$0.08–$0.15/user/month** average; **$0.25/user/month** conservative to cover heavy users and roadmap grounding.

---

## 4. Max logical forecasted cost per paid user

“Max logical” = heavy but plausible usage (power user, not abuse). Paid users have **unlimited** roadmaps, chat, and quizzes.

| Feature | Max logical use/month | Unit cost | Assumption | Cost |
|---------|------------------------|-----------|------------|------|
| **Roadmaps** | 5 | $0.364 with grounding | All with `ROADMAP_USE_GROUNDING`; ~25 queries each | 5 × $0.364 = **$1.82** |
| **Chat** | 300 turns | $0.0023 no search, $0.030 with search | 25% use “Search the web”: 75×$0.030 + 225×$0.0023 | **$2.77** |
| **Quizzes** | 24 | $0.0031 | 12 weeks × 2 quizzes/week | 24 × $0.0031 = **$0.07** |
| **Subtotal API** | | | | **$4.66** |
| **Infra** | | | | **$0.02** |
| **Buffer (10%)** | | | Spikes / price changes | **$0.47** |
| **Total max logical cost** | | | | **~$5.15** |

So at **max logical forecasted usage**, a paid user costs about **$5.15/month**.

- **Revenue (monthly $6.99):** After Polar (4.5% + $0.40) → **$6.28** net.  
  **Margin at max logical:** $6.28 − $5.15 ≈ **$1.13/user/month** (still profitable).
- **Revenue (yearly $59):** After Polar → **$55.94** net per year ≈ **$4.66/month** equivalent.  
  If that user is at max logical every month: $4.66 − $5.15 ≈ **−$0.49/month** (slight loss at extreme). In practice, few users will sustain max logical every month; blended with normal usage, yearly remains profitable.

---

## 5. Paid plan: typical cost per subscriber per month

Assumed usage for an **average active paid** user (not max logical):

| Feature | Assumed use | Cost (tokens) | Cost (search if used) | Total |
|---------|-------------|----------------|------------------------|-------|
| **Roadmaps** | 0.5/month (half create one) | 0.5 × $0.0137 = $0.007 | If 50% with grounding: 0.25 × $0.35 = $0.088 | **~$0.095** |
| **Chat** | 80 turns/month | 80 × $0.0023 = $0.184 | If 15% with search: 12 × $0.028 = $0.34 | **~$0.52** |
| **Quizzes** | 6/month | 6 × $0.0031 = $0.019 | — | **$0.019** |

**Paid API cost (with realistic grounding mix):**  
`$0.095 + $0.52 + $0.019 = **$0.63/user/month**`

Add **infra** (Vercel/Neon) **~$0.02** and **15% buffer** for spikes and future price changes:  
`($0.63 + $0.02) × 1.15 ≈ **$0.75**` → round to **$0.80/paid user/month** (typical active user).

---

## 6. Free users covered by paid revenue

Free users generate **no revenue**; their cost must be covered by **margin from paid subscribers**.

- **Conservative free cost:** **$0.25/free user/month**  
- **Paid cost:** **$0.80/paid user/month**  
- **Paid revenue (current):** $6.99/month or $59/year (≈ $4.92/month equivalent for yearly)

**Per paid subscriber:**  
- After Polar (4.5% + $0.40): **$6.99 − $0.71 = $6.28** (monthly) or **$59 − $3.06 = $55.94** (yearly, one charge).  
- Monthly equivalent yearly: **$55.94 / 12 ≈ $4.66** net per month.

**Blended requirement (example):**  
If **20% of users are paid** and **80% free**:  
- Cost: `0.20 × $0.80 + 0.80 × $0.25 = $0.16 + $0.20 = $0.36/user/month` (blended).  
- Revenue: `0.20 × $6.28 = $1.26/user/month` (if all monthly).  
- **Margin:** Revenue − Cost = **$0.90/user/month** → free users are **covered**, and we stay profitable.

---

## 7. Profit per subscription (after real costs)

| Plan | Price | Polar fee | Net to us | API + infra cost | **You keep** | Margin |
|------|--------|-----------|-----------|-------------------|--------------|--------|
| **Monthly** | $6.99 | $0.71 | $6.28 | $0.80 | **$5.48/mo** | 87% |
| **Yearly** | $59 | $3.06 | $55.94 | $9.60/yr ($0.80×12) | **$46.34/yr** | 83% |

These figures **include** realistic Gemini token usage, optional roadmap and chat grounding, and a cost buffer. Free-plan usage is covered by pricing as long as the ratio of paid to free users is in a reasonable range (e.g. ≥ ~15–20% paid).

---

## 8. Summary

- **Real per-request costs:** Roadmap **$0.0137** (or **$0.364** with grounding), Quiz **$0.0031**, Chat **$0.0023** (or **$0.030** with search). Grounding: **$14/1,000** search queries after 5k free/month.
- **Free user:** **~$0.05–$0.45/month** depending on grounding; **$0.25/month** conservative for coverage.
- **Paid user (typical):** **~$0.80/month** (tokens + grounding mix + infra + buffer).
- **Paid user (max logical forecast):** **~$5.15/month** (5 roadmaps with grounding, 300 chat with 25% search, 24 quizzes). At $6.99/mo you still keep **~$1.13/user**; yearly at that usage is borderline, but few users sustain max logical every month.
- **Current prices ($6.99/mo, $59/yr)** leave **~$5.48/mo** or **~$46.34/yr** per paid subscriber at typical usage and **cover free users** at typical paid-to-free ratios.
