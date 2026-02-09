# Shyftcut

**AI-powered career transition platform.** Get a personalized 12-week learning roadmap, verified course recommendations from trusted platforms, AI coaching, quizzes, and progress tracking—all in 90 seconds.

<a href="https://shyftcut.com"><img src="Shyftcut-devpost-gemini.webp" alt="Shyftcut" width="480" /></a>

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Gemini 3 Implementation](#gemini-3-implementation)
- [Cost & Performance Optimizations](#cost--performance-optimizations)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Deployment](#deployment)
- [Scripts](#scripts)
- [Documentation](#documentation)

---

## Features

### Core (Free & Premium)

- **Career DNA** — Viral quiz: discover your career fit in 90 seconds. Challenge friends, share squad links, compare results on a public leaderboard. Anghami-style share cards with glass design. Phone opt-in (country codes + flags). Optional nickname and signup prompts. No login required.
- **90-second Wizard** — Answer 5 short steps; get a tailored 12-week career roadmap (success sound when ready)
- **Personalized Roadmaps** — Weekly goals, skills to learn, deliverables, and verified course links from 16 trusted platforms
- **Real Course URLs** — Google Search grounding finds actual course pages (Udemy, Coursera, YouTube, edX, etc.)
- **Study Tracking** — Mark weeks complete, track progress, earn streaks and badges
- **Notes & Tasks** — Per-week notes and tasks with AI task suggestions
- **Archive & Delete** — Archive roadmaps or permanently delete them (Dashboard + Roadmap page). Free users: deleting frees your slot to create a new roadmap.

### Premium

- **Unlimited Roadmaps** — Create as many roadmaps as you need
- **AI Career Coach (Chat)** — 24/7 coaching with optional web search grounding
- **Unlimited Quizzes** — AI-generated quizzes per week (Gemini function calling)
- **CV Analysis** — Paste your CV; get strengths, gaps, and recommendations
- **Job Recommendations** — Find 10 matching jobs via Google Search; save to list
- **AI Avatar Generation** — Generate professional profile pictures (3/month)
- **Community** — Peers, study groups, leaderboard, group chat
- **Web Push & Email Reminders** — Stay on track with study reminders

### Platform

- **Bilingual** — English and Arabic (RTL) with full i18n
- **Responsive** — Desktop and mobile; PWA support
- **Auth** — Email/password, Google OAuth, magic links
- **Payments** — Polar integration (subscription checkout, customer portal)
- **Contact Forms** — Public contact form with phone (country codes + flags); submissions stored with country metadata

### Admin Dashboard (Superadmin)

- **Users** — List, search, export, bulk actions
- **Subscriptions** — Revenue, churn analysis, manual updates
- **Analytics** — Traffic, conversions, user journeys
- **Career DNA Leads** — Phone numbers with country codes from Challenge Friends
- **Contact Submissions** — All public contact form submissions
- **Tickets** — Support ticket management
- **Audit Log** — Admin action history
- **Settings** — Feature flags, Meta Pixel, themes

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui, React Router |
| **Backend** | Supabase Edge Functions (Deno) — single `api` router + `courses-search`, `webhook-polar`, `send-study-reminders`, `send-push-reminders` |
| **Auth & DB** | Supabase (PostgreSQL, Auth, Storage) |
| **AI** | Google Gemini 3 (text + image generation) |
| **Payments** | Polar |
| **Email** | Resend |
| **Deploy** | Vercel (frontend), Supabase (Edge Functions) |

---

## Gemini 3 Implementation

Shyftcut uses **only Gemini 3 models** across all AI features.

### Models

| Model | Use Case | Context |
|-------|----------|---------|
| `gemini-3-flash-preview` | Roadmap, chat, CV, jobs, quiz, moderation | 1M in / 64k out |
| `gemini-3-pro-preview` | Optional override via `GEMINI_MODEL` | 1M in / 64k out |
| `gemini-3-pro-image-preview` | Avatar generation | 65k in / 32k out |

### Capabilities Used

- **Google Search Grounding** — Roadmap and course recommendations use real-time web search for actual course URLs (paid users only for roadmap)
- **Structured Output** — `responseMimeType: application/json` + `responseJsonSchema` for parseable responses
- **Thinking Levels** — Optimized per feature: `low` (chat, CV analysis), `medium` (jobs/find), `high` (quiz), configurable for roadmap
- **Flash-only Levels** — `minimal` (courses-search, moderation), `medium` (CV, jobs) when using Flash
- **Thought Signatures** — Chat maintains reasoning context across turns
- **Context Caching** — System prompts cached across roadmap, CV, jobs, quiz, and chat (up to 90% token reduction)
- **Batch API** — Weekly jobs cron uses batch processing (50% cost reduction for async workloads)
- **API Key Rotation** — Multi-key support with automatic failover for rate limits and reliability
- **16 Trusted Course Platforms** — Udemy, Coursera, LinkedIn Learning, YouTube, Pluralsight, Skillshare, edX, FutureLearn, Khan Academy, Codecademy, DataCamp, freeCodeCamp, MasterClass, Microsoft Learn, AWS Training, Google Cloud Skills

### Key Files

- `supabase/functions/_shared/gemini.ts` — Config, retries, caching, thought signatures
- `supabase/functions/_shared/course-hosts.ts` — Allowed domains and validation
- `supabase/functions/courses-search/index.ts` — Dedicated course URL finder via grounding
- `docs/COURSE_SEARCH_GROUNDING.md` — Course search and grounding flow
- `docs/GEMINI_MODELS_AUDIT.md` — Model and best-practices audit

---

## Cost & Performance Optimizations

Shyftcut implements comprehensive cost and performance optimizations across all AI features to minimize API costs while maintaining high-quality user experiences.

### 1. Context Caching (Up to 90% Token Reduction)

**Implementation:** Static system prompts are cached using Gemini's Context Caching API, avoiding re-sending repetitive instructions on every request.

**Features Using Context Caching:**
- **Roadmap Generation** — Caches static career guidance templates (separated from dynamic user context)
- **CV Analysis** — Caches analysis instructions
- **Jobs/Find** — Caches job search system prompts
- **Quiz Generation** — Caches quiz creation templates
- **Chat** — Caches long system instructions for coaching context

**Impact:** Reduces input tokens by up to 90% for features with large, repetitive system prompts. Cache TTL: 1 hour (configurable).

**Code:** `createCachedContent()` in `supabase/functions/_shared/gemini.ts`

### 2. Batch API for Asynchronous Tasks (50% Cost Reduction)

**Implementation:** Weekly job recommendations cron job uses Gemini Batch API for bulk processing.

**Features Using Batch API:**
- **Weekly Jobs Cron** — Processes all eligible users' job searches in a single batch request

**Impact:** 50% cost reduction for asynchronous workloads. Acceptable 24-hour turnaround time for weekly digests.

**Code:** `submitBatchGenerateContent()` and `getBatchStatus()` in `supabase/functions/_shared/gemini.ts`

### 3. Smart Grounding (Google Search) Management

**Implementation:** Google Search grounding is strategically enabled only where it adds value and only for paid users.

**Optimizations:**
- **Roadmap Generation** — Grounding disabled for free users (saves ~$0.35 per roadmap)
- **Chat Search** — Rate-limited for free users (5 searches/day), unlimited for paid
- **Course URL Resolution** — Cached to avoid redundant searches

**Impact:** Reduces expensive search query costs ($14/1k queries after 5k free/month) while maintaining quality for premium users.

**Database:** `chat_search_usage` table tracks daily search usage for rate limiting

### 4. Thinking Levels Optimization

**Implementation:** Thinking levels are optimized per feature based on complexity requirements.

**Optimizations:**
- **CV Analysis** — Uses `low` thinking level for Flash models (was `medium`)
- **Jobs/Find** — Uses `medium` thinking level for Flash models (balanced quality/cost)
- **Quiz Generation** — Uses `high` thinking level (quality-critical)
- **Chat** — Uses `low` thinking level (fast, conversational)

**Impact:** Reduces token costs for thinking tokens while maintaining appropriate reasoning depth per use case.

### 5. Token Limit Optimization

**Implementation:** `maxOutputTokens` adjusted based on actual usage patterns to prevent over-generation.

**Optimizations:**
- **CV Analysis** — Reduced from 4096 → 3072 tokens
- **Quiz Generation** — Reduced from 4096 → 3072 tokens
- **Jobs/Find** — Kept at 8192 tokens (needs full job listings)

**Impact:** Prevents unnecessary token generation, reducing output costs by ~25% for CV and Quiz features.

### 6. Course URL Caching

**Implementation:** Database cache layer prevents redundant API calls for the same course searches.

**Features:**
- **Cache Key:** `platform` + `query` + `language`
- **Cache Table:** `course_url_cache` stores resolved URLs
- **Fallback:** API call only when cache miss occurs

**Impact:** Eliminates redundant `courses-search` API calls (saves ~$0.02 per cached URL) and reduces latency.

**Database:** `course_url_cache` table with composite primary key

### 7. API Key Rotation & Reliability

**Implementation:** Multi-key rotation system with automatic failover for rate limits and quota management.

**Features:**
- **Multiple Keys:** Supports `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`
- **Round-Robin:** Distributes load across healthy keys
- **Automatic Failover:** Switches keys on rate limits (429) or errors
- **Health Tracking:** Monitors key status and error rates

**Impact:** Improves reliability, handles rate limits gracefully, and enables higher throughput.

**Code:** `gemini-rotation.ts` module with `GeminiKeyManager`

### 8. Rate Limiting & Usage Controls

**Implementation:** Tier-based rate limiting prevents abuse and controls costs.

**Free User Limits:**
- **Chat Search** — 5 searches per day (tracked in `chat_search_usage` table)
- **Roadmap Grounding** — Disabled (no Google Search queries)
- **Other Features** — Standard monthly limits apply

**Paid User Benefits:**
- **Unlimited** chat search with grounding
- **Full grounding** enabled for roadmap generation
- **Unlimited** usage of all AI features

**Impact:** Protects against cost overruns from free users while providing premium experience for paid subscribers.

### Performance Metrics

| Optimization | Cost Savings | Performance Impact |
|--------------|--------------|-------------------|
| Context Caching | Up to 90% input token reduction | Faster response times (less data sent) |
| Batch API (Weekly Jobs) | 50% cost reduction | Acceptable async delay (24h) |
| Grounding Management | ~$0.35/roadmap for free users | No quality impact (free users) |
| Thinking Levels | ~20-30% token reduction | Minimal quality impact |
| Token Limits | ~25% output reduction | Prevents over-generation |
| Course URL Caching | ~$0.02 per cached URL | Instant cache hits |
| Rate Limiting | Prevents abuse costs | Protects service stability |

### Database Tables for Optimization

- **`chat_search_usage`** — Tracks daily search usage for rate limiting
- **`course_url_cache`** — Caches resolved course URLs (platform + query + language)

**Migration:** `supabase/migrations/20260219000000_cost_optimization_tables.sql`

### Related Documentation

- [SERVICES_AND_COSTS_FINDINGS.md](docs/SERVICES_AND_COSTS_FINDINGS.md) — Complete cost analysis
- [PRICING_COST_ANALYSIS.md](docs/PRICING_COST_ANALYSIS.md) — Per-feature cost breakdown
- [GEMINI_MODELS_AUDIT.md](docs/GEMINI_MODELS_AUDIT.md) — Model usage and best practices

---

## Local Setup

1. **Clone and install**

   ```sh
   git clone https://github.com/AmirmLotfy/shyftcut.git
   cd shyftcut
   npm install
   ```

2. **Environment**

   ```sh
   cp .env.example .env
   ```

   Fill in required vars (see [Environment Variables](#environment-variables)).

3. **Dev server**

   ```sh
   npm run dev
   ```

   App runs at `http://localhost:5173`.

4. **Supabase**

   - Create a project at [supabase.com](https://supabase.com)
   - Run migrations (see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md))
   - Set Edge Function secrets (`GEMINI_API_KEY`, etc.)

---

## Environment Variables

See `.env.example` for the full list.

**Frontend (build time):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`  
**Supabase Edge (secrets):** `GEMINI_API_KEY`, `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `RESEND_API_KEY`, `FROM_EMAIL`, `CONTACT_TO_EMAIL`

Optional: `GEMINI_MODEL`, `GEMINI_ROADMAP_THINKING_LEVEL`, `ROADMAP_USE_GROUNDING`, `GEMINI_AVATAR_IMAGE_SIZE`, `CORS_ORIGIN`, `SITE_URL`, `VAPID_*`, `CRON_SECRET`, `ADMIN_SECRET`

Full details: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md), [docs/SECRETS_AND_APIS.md](docs/SECRETS_AND_APIS.md)

---

## Testing

### Test User (Premium)

For manual testing of Premium features, a Gemini Team account is pre-configured:

| Field | Value |
|-------|-------|
| **Email** | `gemini@shyftcut.com` |
| **Password** | `Gemini3@devpost.com` |

**Option A — Migration (recommended):** The test user is created automatically when you apply migrations:

```sh
npx supabase db push
```

Or for local development with a fresh DB:

```sh
npx supabase db reset
```

**Option B — Node script:** If you need to add/update the user without running migrations:

```sh
npm run add:gemini-test-user
```

Requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env` or `.env.local`.

### Unit Tests

```sh
npm run test
```

### Course URL Validation

```sh
npm run test:course-validation
```

### API Tests

```sh
VITE_API_URL=https://YOUR_PROJECT.supabase.co/functions/v1 \
SUPABASE_ANON_KEY=your-anon-key \
npm run test:api
```

---

## Deployment

**One-command deploy** (migrations, Edge Functions, Vercel):

```sh
npm run deploy:all
```

**Manual:**

- **Frontend:** Vercel (`npx vercel --prod`)
- **Edge Functions:** `npx supabase functions deploy api --no-verify-jwt` (+ webhook-polar, courses-search, send-study-reminders, send-push-reminders)

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full checklist.

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run test` | Unit tests (Vitest) |
| `npm run test:api` | API endpoint tests |
| `npm run test:course-links` | Roadmap + course-search API test |
| `npm run test:course-validation` | Course URL validation unit test |
| `npm run add:gemini-test-user` | Add/update Gemini Team Premium test user |
| `npm run supabase:secrets:sync` | Sync env to Supabase Edge secrets |
| `npm run deploy:all` | Full deploy (migrations, functions, Vercel) |
| `npm run github-push` | Security check, commit, push to GitHub (requires `gh auth login`) |

---

## Documentation

| Doc | Description |
|-----|-------------|
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deployment guide, secrets, checklist |
| [SECRETS_AND_APIS.md](docs/SECRETS_AND_APIS.md) | All secrets and API config |
| [COURSE_SEARCH_GROUNDING.md](docs/COURSE_SEARCH_GROUNDING.md) | Course URL search and allowed platforms |
| [GEMINI_MODELS_AUDIT.md](docs/GEMINI_MODELS_AUDIT.md) | Gemini 3 models and best practices |
| [AUTH_FLOW.md](docs/AUTH_FLOW.md) | Auth flows (email, Google, magic link) |
| [POLAR_WEBHOOK_SETUP.md](docs/POLAR_WEBHOOK_SETUP.md) | Polar payments and webhooks |

---

## License

[MIT](LICENSE)
