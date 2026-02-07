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

### Inspiration

Career switchers waste hours googling courses and piecing together learning paths. We wanted one place where someone answers a few questions and gets a concrete 12-week plan with real course URLs—not placeholders—in under two minutes. Gemini 3’s grounding and structured output made that possible.

### What it does

Shyftcut is an AI-powered career transition platform. Users take a 90-second wizard (or a viral Career DNA quiz), get a personalized 12-week learning roadmap with **real course links** from 16 trusted platforms (Udemy, Coursera, LinkedIn Learning, YouTube, etc.), and track progress with weekly tasks and notes. Premium users get an AI career coach (chat with optional web search), unlimited AI-generated quizzes, CV analysis, job recommendations via Google Search, and AI avatar generation—all powered by Gemini 3.

### How we built it

Shyftcut is a React (Vite, TypeScript, Tailwind, shadcn/ui) frontend on Vercel. All AI runs in Supabase Edge Functions (Deno): a single `api` router handles chat, roadmap generation, CV analysis, job search, quiz generation, task suggestions, and avatar generation. Roadmap generation uses Gemini 3 with `tools: [{ google_search: {} }]`, `responseMimeType: application/json`, and a strict schema; we then clean invalid URLs and call a dedicated `courses-search` function (also Gemini + grounding) to fill missing course links. Chat uses streaming, optional search grounding, and cached system instructions. Quiz and task features use Gemini function declarations. Avatar images use `gemini-3-pro-image-preview`. Auth and data are Supabase (PostgreSQL, Auth, Storage); payments are Polar; email is Resend. The app is bilingual (English and Arabic, RTL).

### Challenges we ran into

Balancing grounding quality with strict output shape required clear prompts and schema design so the model returned both grounded content and valid JSON. We had to handle thought parts in responses (e.g. for Flash) and strip them before parsing. Validating and allowlisting course URLs across 16 platforms and filling gaps without over-calling the API meant batching and timeouts in `fillMissingCourseUrls`. Keeping chat responsive with long system prompts led us to Gemini 3 context caching and key rotation for reliability. Shipping a single codebase for free and premium (roadmap limits, unlimited quizzes, chat, CV, jobs, avatar) required careful feature flags and subscription checks in the Edge layer.

### Accomplishments that we're proud of

- **Gemini 3 end-to-end:** Every AI feature uses only Gemini 3 (Flash, Pro, Pro Image)—roadmaps, chat, CV, jobs, quizzes, tasks, avatars—with no fallback models.
- **Real course links at scale:** Google Search grounding + a 16-platform allowlist and URL validation so every roadmap ships with working course URLs, not placeholders.
- **Structured output + grounding:** Combining `responseMimeType: application/json` and `responseJsonSchema` with `google_search` so we get parseable, grounded roadmaps in one call.
- **Production-ready stack:** Single Edge router, context caching, thought signatures for chat, function calling for quizzes/tasks, and bilingual (EN/AR) UX.

### What we learned

We learned to lean on Gemini 3’s full stack: **Google Search grounding** for roadmap and job recommendations so links are real and up to date; **structured JSON output** so we can parse and validate weeks, skills, and courses; **function calling** for quizzes and task suggestions so the UI stays deterministic; and **thought signatures** in chat so the coach keeps context across turns. We tuned thinking levels (e.g. low for CV/jobs, higher for roadmaps) and added context caching for long system prompts to keep latency and cost in check. Enforcing an allowlist of 16 trusted course platforms and validating every URL kept quality high and avoided hallucinated links.

### What's next for Shyftcut | Your 90-second career shift, powered by Gemini 3

We plan to deepen Gemini 3 integration: more grounded features (e.g. live salary and hiring trends in chat), expanded course platforms, and community study groups with shared roadmaps. We’ll keep optimizing thinking levels and caching for latency, and explore batch and reasoning features as the Gemini 3 API evolves.

---

## Built with (comma separated)

Google Gemini 3 API, Supabase (Edge Functions, PostgreSQL, Auth, Storage), Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui, React Router, Framer Motion, Vercel, Polar, Resend, Deno
