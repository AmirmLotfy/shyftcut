# Course Search & Google Search Grounding

How Shyftcut finds real course URLs using Gemini 3 + Google Search and enforces allowed platforms.

---

## Overview

1. **Roadmap generation** uses Gemini with `google_search` tool (when `ROADMAP_USE_GROUNDING !== "false"`) to generate a 12-week roadmap including course recommendations with real URLs.
2. **fillMissingCourseUrls** calls the `courses-search` Edge Function for any course with a missing or invalid URL.
3. **courses-search** uses Gemini + Google Search to find a single real course URL for a given platform and query.

Both flows enforce **allowed platforms only**: Udemy, Coursera, LinkedIn Learning, YouTube, Pluralsight, Skillshare.

---

## Google Search Grounding Best Practices

Per [Gemini Google Search docs](https://ai.google.dev/gemini-api/docs/google-search):

- Use `tools: [{ google_search: {} }]` ✓
- Combine with structured output (`responseMimeType`, `responseJsonSchema`) ✓ (Gemini 3 supports this)
- Clear prompt instructions: "Return only real, working course URLs from search results—no invented or placeholder URLs" ✓
- Validate output in application code ✓

---

## Allowed Platforms Layer

**Domains (16 platforms):** `udemy.com`, `coursera.org`, `linkedin.com`, `youtube.com`, `pluralsight.com`, `skillshare.com`, `edx.org`, `futurelearn.com`, `khanacademy.org`, `codecademy.com`, `datacamp.com`, `freecodecamp.org`, `masterclass.com`, `cloudskillsboost.google`, `learn.microsoft.com`, `aws.amazon.com` (and subdomains).

**Shared module:** `supabase/functions/_shared/course-hosts.ts`

- `ALLOWED_COURSE_HOSTS` — list of allowed domains
- `ALLOWED_DOMAINS_INSTRUCTION` — prompt text instructing the model to use only these domains
- `isAllowedCourseHost(url)` — validates URL host
- `isBrowseOrCategoryPage(url)` — returns true for browse/category pages (e.g. coursera.org/browse/...) to reject
- `isValidCourseUrl(url)` — validates URL format (full path, not homepage, not browse/category)
- `getPlatformDomain(platform)` — maps display names (e.g. "Udemy", "LinkedIn Learning") to allowed hosts

**Validation points:**

1. **Roadmap prompts** — Explicitly instruct the model: "Course URLs must be from these domains only: ..."
2. **cleanRoadmapOutput** — Strips any URL not from an allowed host; sets `url` to `null`
3. **fillMissingCourseUrls** — Only calls courses-search when `getPlatformDomain(platform)` returns a value (skips unknown platforms like edX)
4. **courses-search** — Returns early with `url: null` if platform is not in our allowlist; validates returned URL with `isAllowedCourseHost` before returning

---

## Flow Diagram

```
User → Roadmap Generate (Gemini + google_search)
         → cleanRoadmapOutput (strip invalid URLs)
         → fillMissingCourseUrls (for each course with null URL and allowed platform)
               → courses-search (Gemini + google_search)
               → validate URL against allowed hosts
               → return url or null
         → Save roadmap to DB
```

---

## Wizard Platforms

The frontend Wizard (`src/pages/Wizard.tsx`) offers 16 platforms: Coursera, Udemy, LinkedIn Learning, YouTube, Pluralsight, Skillshare, edX, FutureLearn, Khan Academy, Codecademy, DataCamp, freeCodeCamp, MasterClass, Microsoft Learn, AWS Training, Google Cloud Skills. All align with `ALLOWED_COURSE_HOSTS`.
