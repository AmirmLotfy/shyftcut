# Shyftcut

**AI-powered career transition platform.** Get a personalized 12-week learning roadmap, verified course recommendations from trusted platforms, AI coaching, quizzes, and progress tracking—all in 90 seconds.

<a href="https://shyftcut.com"><img src="Shyftcut-devpost-gemini.jpg" alt="Shyftcut" width="480" /></a>

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Gemini 3 Implementation](#gemini-3-implementation)
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

- **Google Search Grounding** — Roadmap and course recommendations use real-time web search for actual course URLs
- **Structured Output** — `responseMimeType: application/json` + `responseJsonSchema` for parseable responses
- **Thinking Levels** — `low` (chat, CV, jobs, courses-search), `high` (quiz), configurable for roadmap
- **Flash-only Levels** — `minimal` (courses-search, moderation), `medium` (CV, jobs) when using Flash
- **Thought Signatures** — Chat maintains reasoning context across turns
- **Context Caching** — Long chat system prompts cached to reduce tokens and latency
- **Batch API** — Quiz generation supports bulk/batch mode
- **16 Trusted Course Platforms** — Udemy, Coursera, LinkedIn Learning, YouTube, Pluralsight, Skillshare, edX, FutureLearn, Khan Academy, Codecademy, DataCamp, freeCodeCamp, MasterClass, Microsoft Learn, AWS Training, Google Cloud Skills

### Key Files

- `supabase/functions/_shared/gemini.ts` — Config, retries, caching, thought signatures
- `supabase/functions/_shared/course-hosts.ts` — Allowed domains and validation
- `supabase/functions/courses-search/index.ts` — Dedicated course URL finder via grounding
- `docs/COURSE_SEARCH_GROUNDING.md` — Course search and grounding flow
- `docs/GEMINI_MODELS_AUDIT.md` — Model and best-practices audit

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
