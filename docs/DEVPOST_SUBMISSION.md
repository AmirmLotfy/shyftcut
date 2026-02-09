# Devpost Submission Copy — Gemini 3 Hackathon

## Project name (60 characters max)

**Current:** Shyftcut — AI career roadmaps in 90 seconds, powered by Gemini 3

**Alternatives (pick one):**
- Shyftcut: Your 90-second career shift, powered by Gemini 3 (52)
- Shyftcut — 90 seconds to your next career, built on Gemini 3 (54)
- Shyftcut: AI roadmaps that actually link to real courses (Gemini 3) (58)
- From zero to roadmap in 90 seconds — Shyftcut × Gemini 3 (52)
- Shyftcut — Career change in 90 sec. Real courses. Gemini 3. (52)
- Shyftcut: Gemini 3–powered career roadmaps with real course links (58)
- One quiz. One roadmap. Real courses. Shyftcut on Gemini 3. (52)
- Shyftcut — Skip the googling. Get your career roadmap. Gemini 3. (58)
- Shyftcut: 90 sec to a 12-week career plan (Gemini 3) (48)
- Shyftcut — AI career coach & roadmap in 90 seconds (Gemini 3) (52)

---

## Elevator pitch (200 characters max)

Get a personalized 12-week career roadmap with real course links in 90 sec. Gemini 3 powers roadmaps, coaching, CV analysis, job search, and quizzes with Google Search grounding & structured output.

---

## About the project (Markdown allowed)

**One quiz. One roadmap. Real courses.** Shyftcut turns career chaos into a clear 12-week plan—in 90 seconds. No more dead links or guesswork: every course URL is _real_, thanks to Gemini 3 and Google Search grounding.

![Shyftcut — Your 90-second career shift, powered by Gemini 3](https://github.com/AmirmLotfy/shyftcut/raw/main/Shyftcut-devpost-gemini.webp)

---

### Inspiration

Career switchers waste **hours** googling courses and piecing together learning paths. We wanted one place where someone answers a few questions and gets a concrete 12-week plan with **real course URLs**—not placeholders—in under two minutes. Gemini 3’s grounding and structured output made that possible.

---

### What it does

| User action | What they get (Gemini 3) |
|-------------|---------------------------|
| **90-second Wizard** | Personalized 12-week roadmap with weekly goals, skills, deliverables, and **real course links** from 16 platforms |
| **Career DNA quiz** | Viral “discover your fit” result + shareable card; optional leaderboard & challenge friends |
| **Dashboard** | Study tracking, streaks, badges; per-week notes & tasks with **AI task suggestions** (function calling) |
| **AI Coach (Chat)** | 24/7 career chat with optional **web search grounding**; streaming replies, thought signatures for context |
| **Quizzes** | Unlimited **AI-generated multiple-choice quizzes** per week (Gemini function calling) |
| **CV Analysis** | Paste CV → strengths, gaps, and actionable recommendations |
| **Job search** | **10 matching jobs** via Google Search grounding; save to list |
| **Avatar** | Generate professional profile pictures (3/month, **Gemini 3 Pro Image**) |

The app is **bilingual** (English & Arabic, RTL) and works on desktop and mobile.

---

### How we built it

**Frontend:** React (Vite, TypeScript, Tailwind, shadcn/ui) on Vercel — fast, responsive, PWA-ready.

**Backend:** All AI runs in **Supabase Edge Functions (Deno)**. One `api` router handles chat, roadmap, CV, jobs, quiz, tasks, and avatar. A dedicated `courses-search` function fills missing course URLs using Gemini + Google Search.

**Gemini 3 usage at a glance:**

| Feature | Model | Key API usage |
|---------|--------|----------------|
| Roadmap generation | gemini-3-flash-preview | `google_search` tool, `responseMimeType: application/json`, schema |
| Chat (coach) | gemini-3-flash-preview | Streaming, optional grounding, context caching, thought signatures |
| CV analysis / Jobs | gemini-3-flash-preview | Structured JSON, grounding for jobs |
| Quizzes / Tasks | gemini-3-flash-preview | Function declarations (`create_quiz`, `suggest_tasks`) |
| Avatar | gemini-3-pro-image-preview | Image generation |

**Example:** Roadmap generation sends one request with `tools: [{ google_search: {} }]` and a strict JSON schema; we clean invalid URLs and call `courses-search` for any missing links. Result: a full roadmap with real Udemy, Coursera, YouTube, etc. links in one flow.

**Rest of stack:** Auth & DB (Supabase), payments (Polar), email (Resend).

---

### Challenges we ran into

| Challenge | How we solved it |
|-----------|-------------------|
| Grounding + strict JSON in one call | Clear system prompts, `responseJsonSchema`, and post-processing to strip invalid URLs and fill gaps via `courses-search` |
| Thought parts in Gemini Flash responses | Strip thought parts before parsing JSON; handle both thought and final content in streams |
| 16 platforms, no hallucinated URLs | Allowlist in `course-hosts.ts`, validate every URL; only call search for allowed platforms with batching and timeouts |
| Long chat system prompts → latency | Gemini 3 **context caching** for system instruction; key rotation for reliability |
| Free vs Premium in one codebase | Feature flags and subscription checks in the Edge layer; single router, different limits (e.g. 1 roadmap vs unlimited) |

---

### Accomplishments that we're proud of

- **Gemini 3 only.** Every AI feature uses **only** Gemini 3 (Flash, Pro, Pro Image)—no fallback models.
- **Real course links at scale.** Google Search grounding + 16-platform allowlist + validation = every roadmap ships with working links.
- **Structured output + grounding together.** `responseMimeType: application/json` + `responseJsonSchema` + `google_search` in one call for parseable, grounded roadmaps.
- **Production-ready.** Single Edge router, context caching, thought signatures, function calling, bilingual (EN/AR).

---

### What we learned

We leaned on **Gemini 3’s full stack**: **Google Search grounding** for real, up-to-date links; **structured JSON output** for reliable parsing; **function calling** for deterministic quizzes and tasks; **thought signatures** so the coach keeps context across turns. We tuned thinking levels (e.g. low for CV/jobs, higher for roadmaps) and used **context caching** for long prompts to keep latency and cost in check. The 16-platform allowlist and URL validation kept quality high and avoided hallucinated links.

---

### What's next for Shyftcut | Your 90-second career shift, powered by Gemini 3

More **grounded** features (e.g. live salary and hiring trends in chat), more course platforms, and **community study groups** with shared roadmaps. We’ll keep optimizing thinking levels and caching, and explore batch and reasoning features as the Gemini 3 API evolves.

---

## Built with (comma separated)

Google Gemini 3 API, Supabase (Edge Functions, PostgreSQL, Auth, Storage), Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui, React Router, Framer Motion, Vercel, Polar, Resend, Deno
