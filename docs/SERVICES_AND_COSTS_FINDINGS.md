# Shyftcut: Services, Real API Costs, Limits & Pricing – Full Findings

**Date:** 2026-02-09  
**Scope:** All used services, real API costs vs user limits (free/paid), and pricing alignment.

---

## 1. Services in use

| Service | Where used | Purpose |
|--------|------------|--------|
| **Google AI (Gemini)** | Edge `api`, `courses-search` | Roadmap, chat, quiz, CV analysis, jobs/find, avatar, task suggestions, content moderation, admin insights, course URL resolution |
| **Supabase** | Auth, DB, Storage, Edge Functions | Auth, profiles, roadmaps, subscriptions, usage, chat history, jobs, avatars, community, admin |
| **Polar** | Edge `api` (checkout), `webhook-polar` | Subscriptions (Premium $6.99/mo, $59/yr), webhooks |
| **Resend** | Edge `api`, `webhook-polar`, `send-study-reminders` | Contact form, newsletter, welcome/cancel emails, study reminders |
| **Vercel** | Frontend | SPA hosting (build + env: `VITE_*`) |
| **hCaptcha** | Frontend (optional) | `VITE_HCAPTCHA_SITE_KEY` – public only; no backend cost in codebase |

---

## 2. Real API costs (official & code-aligned)

### 2.1 Gemini API – text (gemini-3-flash-preview)

**Source:** [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)

| Item | Rate |
|------|------|
| Input | $0.50 / 1M tokens |
| Output (incl. thinking) | $3.00 / 1M tokens |

### 2.2 Gemini – Grounding with Google Search

| Item | Rate |
|------|------|
| Free allowance | 5,000 search queries / month (project-wide) |
| Overage | $14 / 1,000 search queries (billing from Jan 5, 2026) |

One user request can trigger multiple search queries; billing is per query.

### 2.3 Gemini – Image generation (gemini-3-pro-image-preview)

**Source:** Same pricing page – “Gemini 3 Pro Image Preview”

| Item | Rate |
|------|------|
| 1K/2K image (e.g. 2048×2048) | $0.134 per image |
| 4K image | $0.24 per image |

Avatar uses 2K by default (`GEMINI_AVATAR_IMAGE_SIZE` 2K/1K/4K). **Cost per avatar: ~$0.134** (2K).

### 2.4 Polar (payments)

| Item | Rate |
|------|------|
| Subscriptions | 4.5% + $0.40 per transaction |

### 2.5 Resend (email)

**Source:** [Resend pricing](https://resend.com/pricing)

| Plan | Cost | Limit |
|------|------|--------|
| Free | $0/mo | 3,000 emails/mo, 100/day |
| Pro | $20/mo | 50,000 emails |
| Scale | $90/mo | 100,000 emails |

No per-email line item; cost is by monthly volume tier. Typical use: contact, newsletter, welcome, cancel, study reminders → likely within free tier at moderate scale.

### 2.6 Supabase Edge Functions

**Source:** [Supabase Functions pricing](https://supabase.com/docs/guides/functions/pricing)

| Item | Rate |
|------|------|
| Free plan | 500,000 invocations/month included |
| Overage | $2 per 1M invocations |

Every API route hit = 1 invocation (plus `courses-search` when roadmap has missing URLs).

### 2.7 Vercel

Frontend only; no serverless on Vercel. Cost depends on your plan (Hobby/Pro); not an API cost.

### 2.8 hCaptcha

Only `VITE_HCAPTCHA_SITE_KEY` is used (client-side). No backend verification found in Edge code → no direct API cost in current setup.

---

## 3. Per-feature cost (from code + pricing)

| Feature | Model / API | Typical tokens / call | Cost per call (tokens) | Grounding / other | Approx total/call |
|---------|-------------|------------------------|-------------------------|--------------------|--------------------|
| **Roadmap generate** | Flash | ~480 in, ~4.5k out | **$0.0137** | Optional: ~25 queries → +$0.35 (after 5k free) | **$0.014** or **$0.36** with grounding |
| **Chat (no search)** | Flash | ~2.2k in, ~400 out | **$0.0023** | — | **$0.0023** |
| **Chat (with search)** | Flash | same | **$0.0023** | ~2 queries → +$0.028 | **~$0.030** |
| **Quiz generate** | Flash | ~130 in, ~1k out | **$0.0031** | — | **$0.0031** |
| **CV analyze** | Flash | CV text + ~400 sys, 4k max out | **~$0.01–0.02** (varies with CV length) | — | **~$0.015** |
| **Jobs/find** | Flash | ~500 in, up to 8k out | **~$0.025** | Many queries (10 jobs) → **~$0.14–0.35** | **~$0.17–0.38** |
| **Avatar generate** | Pro Image | — | — | $0.134 (2K) / $0.24 (4K) | **$0.134** (2K) |
| **Task suggest** | Flash | ~300 in, 1024 max out | **~$0.0035** | — | **~$0.0035** |
| **Moderation** | Flash | small in, 128 out | **~$0.0002** | — | **~$0.0002** |
| **courses-search** (per URL) | Flash | ~200 in, 1024 out | **~$0.003** | 1+ search queries → **~$0.014+** | **~$0.02** per course URL |
| **Admin insights** | Flash | variable, 2048 out | **~$0.01** | — | **~$0.01** |

Existing **PRICING_COST_ANALYSIS.md** already covers roadmap, quiz, chat (with/without search) and grounding; the table above adds **CV, jobs, avatar, task suggest, moderation, courses-search, admin**.

---

## 4. User limits (free vs paid) – from code

**Source:** `useSubscription.ts` tier features, `api/index.ts` enforcement.

### Free

| Feature | Limit | Enforcement |
|---------|--------|-------------|
| Roadmaps | **1 total** (lifetime) | `roadmap/generate` returns 402 if count ≥ 1 |
| Chat | **10 user messages / month** | Usage count in DB |
| Quizzes | **3 / month** | Usage count |
| Notes | 20 total | — |
| Tasks | 30 total | — |
| AI task suggestions | **5 / day** | `AI_SUGGEST_PER_DAY_FREE` in `tasks/suggest` |
| Course recs (in roadmap) | 1 per week (slice in roadmap) | Backend slice to 1 course per week for free |
| CV analysis | ❌ | Premium only |
| Job recommendations | ❌ | Premium only |
| Avatar | ❌ (or not exposed) | Premium; **3 / month** in `profile/avatar/generate` |

### Premium / Pro

| Feature | Limit |
|---------|--------|
| Roadmaps, chat, quizzes, notes, tasks, AI suggestions | **Unlimited** (-1 in code) |
| Full course recommendations | Yes |
| CV analysis | Unlimited (per request) |
| Job recommendations | “Find jobs” + **weekly cron** (10 jobs per run, `find_jobs_enabled`) |
| Avatar | **3 generations / month** (`AVATAR_LIMIT_PER_MONTH`) |

---

## 5. Your pricing (from code & UI)

**Source:** `src/lib/polar-config.ts`, `src/pages/Pricing.tsx`.

| Plan | Price | Interval |
|------|--------|----------|
| Free | $0 | — |
| Premium | **$6.99** | month |
| Premium | **$59** | year (~$4.92/mo equivalent) |

Net after Polar (4.5% + $0.40): **~$6.28/mo** (monthly) or **~$55.94/year** (~$4.66/mo equivalent).

---

## 6. Cost vs limits – findings

### 6.1 Free plan

- **Documented (PRICING_COST_ANALYSIS):**  
  - No grounding: **~$0.05/user/month** (1 roadmap + 10 chat + 3 quizzes).  
  - With roadmap grounding: **~$0.40/user/month**.  
  - Conservative blend: **~$0.25/user/month** to cover heavy and grounding usage.

- **Not in cost doc:**  
  - **Task suggestions:** 5/day × 30 ≈ 150/month × ~$0.0035 ≈ **$0.53/user/month** if every free user maxes this. In practice, lower.  
  - **Moderation:** Only on community (study group create, chat message). Negligible per user.  
  - **courses-search:** Only when roadmap has missing URLs (and grounding/fill is used); already reflected in “roadmap with grounding” and fill logic.

- **Conclusion:** Free cost range **~$0.05–$0.45** (or higher if many free users max task suggestions). Using **$0.25** as conservative free cost is still reasonable; if task suggestions are heavily used, consider **$0.30–$0.35** or tightening the 5/day for free.

### 6.2 Paid plan – typical vs max

- **Typical paid (from PRICING_COST_ANALYSIS):** **~$0.80/paid user/month** (roadmap + chat + quiz mix, some grounding, infra + buffer).

- **Add for Premium-only features (typical):**  
  - CV: e.g. 1–2 analyses/month → **~$0.02–0.03**.  
  - Jobs/find: e.g. 2 runs/month + weekly cron for opted-in users. Manual **~$0.35–0.75**, cron **~$0.35 × 4 ≈ $1.40** per active “find jobs” user/month.  
  - Avatar: 3/month × $0.134 = **~$0.40** if all 3 used.  
  - **Total extra (typical):** **~$0.50–$2.00** depending on job + avatar usage.

- **Max logical paid (doc):** **~$5.15/month** (5 roadmaps with grounding, 300 chat with 25% search, 24 quizzes).  
  - Add: CV 5×, jobs 4×, avatar 3×, task suggests unlimited → add **~$0.10 + ~$1.50 + ~$0.40 + ~$2** ≈ **~$4** → **total ~$9/month** for an extreme power user.  
  - At **$6.99** you would be **negative** for that extreme user; at **$6.28** net, even more so. In practice, few users hit this; the existing “max logical” **$5.15** is already the main risk.

### 6.3 Grounding (Google Search)

- **5,000 free queries/month** project-wide.  
- Roadmap with grounding: **~25 queries**; jobs/find: **~10–20**; chat with search: **~2**; courses-search: **1+** per URL.  
- If you enable **ROADMAP_USE_GROUNDING** and have many roadmaps + jobs + course fills, you can exceed 5k quickly; overage **$14/1k** can add up.  
- **Recommendation:** Monitor search usage in Google Cloud; consider feature flags or caps for free users (e.g. no grounding for free, or limit courses-search calls per roadmap).

### 6.4 Avatar (Gemini Pro Image)

- **$0.134 per 2K image.**  
- Premium limit **3/month** → max **~$0.40/user/month** for avatars.  
- Aligned with “typical” Premium add-on above.

### 6.5 Jobs (weekly cron + manual)

- **jobs/weekly** runs for paid users with `find_jobs_enabled`. Each run = 1 Gemini call with grounding (**~$0.17–0.38**).  
- 4 weeks × **~$0.35** ≈ **~$1.40/user/month** for users who have weekly job digest on.  
- Plus manual “Find jobs” calls.  
- **Recommendation:** Ensure only paid + opted-in users get weekly runs; consider a cap (e.g. max 4 runs/month) if needed.

### 6.6 Resend

- Transactional (contact, newsletter, welcome, cancel, reminders) → volume-based.  
- 3k free/month is often enough for early stage; above that, **$20/mo** for 50k.  
- No change to per-user cost logic; just track total emails.

### 6.7 Supabase Edge

- **500k invocations/month** free.  
- Each API request (including chat, roadmap, quiz, CV, jobs, avatar, etc.) = 1 invocation; `courses-search` is extra.  
- At scale, **$2/1M** is cheap; main cost remains **Gemini + grounding**.

---

## 7. Pricing vs cost – summary

| Scenario | Cost/user/month | Revenue (net) | Margin |
|----------|------------------|---------------|--------|
| Free (no grounding) | ~$0.05 | $0 | — |
| Free (with grounding, conservative) | ~$0.25 | $0 | — |
| Paid typical | ~$0.80–$1.50 | $6.28 (monthly) | **~$4.80–5.50** |
| Paid yearly typical | ~$0.80–$1.50 | ~$4.66/mo | **~$3.20–3.90** |
| Paid max logical (doc) | ~$5.15 | $6.28 | **~$1.13** |
| Paid extreme (with CV/jobs/avatar/suggest) | ~$9 | $6.28 | **Negative** |

- **Current pricing ($6.99 / $59)** is fine for **typical** and **documented max logical** usage.  
- **Extreme** power users (heavy grounding + jobs + avatar + task suggest) can exceed **$6.28**; they are likely rare.  
- **Free** users are covered if paid mix is in the **~15–20%+** range (as in PRICING_COST_ANALYSIS).

---

## 8. Recommendations

1. **Update PRICING_COST_ANALYSIS.md** to include:  
   - CV analyze (~$0.015/call),  
   - Jobs/find (~$0.17–0.38 with grounding),  
   - Avatar ($0.134/image, 3/month cap),  
   - Task suggest (~$0.0035, 5/day free),  
   - courses-search (~$0.02 per URL when used),  
   - Moderation (negligible).

2. **Monitor Google Search usage** (grounding) and set billing alerts; consider disabling or limiting grounding for free users if you want to keep free cost under **$0.25**.

3. **Cap or meter expensive Premium features** if you see abuse or a few users dominating cost:  
   - e.g. max “Find jobs” runs per month, or max weekly cron runs per user.

4. **Resend:** Track monthly email volume; move to Pro when you approach 3k.

5. **Supabase Edge:** Track invocations in dashboard; 500k free is generous; overage $2/1M is small vs Gemini.

6. **hCaptcha:** Currently client-only; if you add server-side verification later, include that service in this audit.

---

## 9. Quick reference – services and env

| Service | Config / secret | Set in |
|---------|-----------------|--------|
| Gemini | `GEMINI_API_KEY` (or `_1`/`_2`/`_3`) | Supabase Edge secrets |
| Supabase | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected + Vercel for `VITE_*` |
| Polar | `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET` | Supabase Edge |
| Resend | `RESEND_API_KEY`, `FROM_EMAIL`, `CONTACT_TO_EMAIL` | Supabase Edge |
| Vercel | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`, etc. | Vercel env |
| hCaptcha | `VITE_HCAPTCHA_SITE_KEY` | Vercel (optional) |

---

*This document aligns with `docs/PRICING_COST_ANALYSIS.md` and extends it with all used services, real API costs, and limits for free and paid users.*
