// Supabase Edge Function: single router for all /api/* routes.
// Frontend sends X-Path header (e.g. /api/profile). Requires SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY; optional RESEND_API_KEY, GEMINI_API_KEY, etc.

import { getCorsHeaders, corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getAuthUser } from "../_shared/auth.ts";
import { getSupabase } from "../_shared/supabase.ts";
import { logError, safeErrorMessage } from "../_shared/log.ts";
import { moderateContent } from "../_shared/moderation.ts";
import { checkSuperadmin, logAdminAction, requireSuperadmin } from "../_shared/admin.ts";
import {
  getGeminiConfig,
  getGeminiGenerateContentUrl,
  getGeminiStreamUrl,
  getGeminiHeaders,
  geminiFetchWithRetry,
  messagesToGeminiContents,
  contentsFromChatMessages,
  openAiFunctionToGeminiDeclaration,
  GEMINI_IMAGE_MODEL,
  checkGeminiFinishReason,
  isOkFinishReasonForFunctionCall,
  logGeminiUsage,
  createCachedContent,
  MIN_SYSTEM_PROMPT_LENGTH_FOR_CACHE,
  isGemini3Flash,
  submitBatchGenerateContent,
  getBatchStatus,
} from "../_shared/gemini.ts";
import { isAllowedCourseHost, isValidCourseUrl, ALLOWED_DOMAINS_INSTRUCTION, REAL_COURSE_URL_INSTRUCTION, getPlatformDomain } from "../_shared/course-hosts.ts";
import { isYouTubeUrl } from "../_shared/verify-course-url.ts";
import { scrapeCourseMetadata } from "../_shared/course-metadata.ts";

const CHAT_BLOCKED_MESSAGE = "This response was blocked by content filters. Please rephrase and try again.";

const DIFFICULTY_LEVELS = ["beginner", "intermediate", "advanced"] as const;
const MAX_TITLE_LEN = 500;
const MAX_DESCRIPTION_LEN = 2000;
const MAX_STRING_ITEM_LEN = 500;
const MAX_QUESTION_LEN = 1000;
const MAX_OPTION_LEN = 500;
const MAX_EXPLANATION_LEN = 2000;

// Input validation limits (abuse prevention and model limits)
const MAX_CHAT_MESSAGE_LEN = 32_000;
const MAX_CHAT_MESSAGES = 20;
const MAX_CHAT_TOTAL_CHARS = 100_000;
const MAX_CHAT_HISTORY_MESSAGE_LEN = 50_000; // for persisted messages
const MAX_PROFILE_FIELD_LEN = 500;
const MAX_PROFILE_ARRAY_ITEMS = 50;
const MAX_PROFILE_ARRAY_ITEM_LEN = 200;
const MAX_QUIZ_WEEK_TITLE_LEN = 500;
const MAX_QUIZ_SKILLS_ITEMS = 50;
const MAX_QUIZ_SKILL_LEN = 200;
const MAX_FC_ARGS_BYTES = 512 * 1024; // 512KB for function call JSON
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Strong password: min 8 chars, at least one digit, lowercase, uppercase, symbol. Aligns with Supabase Dashboard and client validatePassword(). */
function validatePasswordStrong(password: string): { valid: boolean; error?: string } {
  if (typeof password !== "string" || password.length < 8) return { valid: false, error: "New password must be at least 8 characters" };
  if (!/\d/.test(password)) return { valid: false, error: "Password must include at least one number" };
  if (!/[a-z]/.test(password)) return { valid: false, error: "Password must include at least one lowercase letter" };
  if (!/[A-Z]/.test(password)) return { valid: false, error: "Password must include at least one uppercase letter" };
  if (!/[!@#$%^&*()_+\-=[\]{};':"|<>?,./~\\]/.test(password)) return { valid: false, error: "Password must include at least one symbol" };
  return { valid: true };
}

/** JSON schema for roadmap structured output (Gemini 3 grounding + responseMimeType application/json). */
const ROADMAP_RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Roadmap title." },
    description: { type: "string", description: "Brief roadmap description." },
    difficulty_level: { type: "string", enum: ["beginner", "intermediate", "advanced"], description: "Difficulty level." },
    weeks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          week_number: { type: "number", description: "1-based week index." },
          title: { type: "string", description: "Week title." },
          description: { type: "string", description: "Week description." },
          skills_to_learn: { type: "array", items: { type: "string" }, description: "Skills to learn this week." },
          deliverables: { type: "array", items: { type: "string" }, description: "Deliverables for this week." },
          estimated_hours: { type: "number", description: "Estimated hours per week." },
          courses: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string", description: "Course title from search results." },
                platform: { type: "string", description: "Platform name (e.g. Coursera, YouTube)." },
                url: { type: "string", description: "Real, working course URL from search. Must be from an allowed platform: udemy.com, coursera.org, linkedin.com, youtube.com, pluralsight.com, skillshare.com, edx.org, futurelearn.com, khanacademy.org, codecademy.com, datacamp.com, freecodecamp.org, masterclass.com, cloudskillsboost.google, learn.microsoft.com, aws.amazon.com." },
                instructor: { type: "string" },
                duration: { type: "string" },
                difficulty_level: { type: "string" },
                price: { type: "number" },
                rating: { type: "number" },
              },
              required: ["title", "platform", "url"],
            },
            description: "Courses with real URLs from web search.",
          },
        },
        required: ["week_number", "title", "description", "skills_to_learn", "deliverables", "estimated_hours", "courses"],
      },
    },
  },
  required: ["title", "description", "difficulty_level", "weeks"],
};

const MIN_CV_PASTE_LEN = 50;
const MAX_CV_PASTE_LEN = 50_000;

/** JSON schema for CV analysis structured output. */
const CV_ANALYSIS_RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    strengths: {
      type: "array",
      items: { type: "string" },
      description: "3–5 key strengths from the CV.",
    },
    gaps: {
      type: "array",
      items: { type: "string" },
      description: "Gaps vs target role (skills or experience to develop).",
    },
    recommendations: {
      type: "array",
      items: { type: "string" },
      description: "3–5 short actionable recommendations.",
    },
    skill_keywords: {
      type: "array",
      items: { type: "string" },
      description: "Extracted skill keywords for job matching.",
    },
  },
  required: ["strengths", "gaps", "recommendations", "skill_keywords"],
};

/** JSON schema for Career DNA analyzer (Gemini Flash, minimal thinking). */
const CAREER_DNA_RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    matchScore: { type: "number", description: "0-100 match between personality and declared field." },
    personalityArchetype: { type: "string", description: "e.g. Strategic Empath, Ambitious Realist" },
    archetypeDescription: { type: "string", description: "2-3 sentence description of the archetype." },
    superpower: { type: "string", description: "User's strongest work-related trait." },
    superpowerRarity: { type: "string", description: "e.g. only 17% of people have this trait" },
    hiddenTalent: { type: "string", description: "Less obvious strength." },
    hiddenTalentCareerHint: { type: "string", description: "Career this talent suits, e.g. Product Management" },
    suggestedCareers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          career: { type: "string" },
          matchPercent: { type: "number" },
          reason: { type: "string" },
        },
        required: ["career", "matchPercent", "reason"],
      },
      description: "Top 3 alternative careers from allowed list.",
    },
    shareableQuote: { type: "string", description: "Short shareable line, e.g. I'm a 73% match for my major" },
    scoreTier: { type: "string", enum: ["visionaries", "naturals", "explorers", "shifters", "awakeners", "misfits"], description: "90-100 visionaries, 75-89 naturals, 60-74 explorers, 45-59 shifters, 30-44 awakeners, 0-29 misfits" },
    personaCharacterId: { type: "string", description: "One of: v1,v2,v3,v4 (visionaries), n1-n4 (naturals), e1-e4 (explorers), s1-s4 (shifters), a1-a4 (awakeners), m1-m4 (misfits). Pick the one that best fits the user's answers." },
  },
  required: ["matchScore", "personalityArchetype", "archetypeDescription", "superpower", "superpowerRarity", "hiddenTalent", "hiddenTalentCareerHint", "suggestedCareers", "shareableQuote", "scoreTier"],
};

/** JSON schema for jobs find (Gemini grounding) – array of job objects. */
const JOBS_RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    jobs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Job title." },
          company: { type: "string", description: "Company name." },
          url: { type: "string", description: "Real job listing URL (must be valid HTTP/HTTPS from search)." },
          location_type: { type: "string", enum: ["remote", "hybrid", "on_site"], description: "Work arrangement." },
          location: { type: "string", description: "Location string if any." },
          match_score: { type: "number", description: "0–100 match score for the candidate." },
        },
        required: ["title", "company", "url", "location_type", "match_score"],
      },
      description: "Up to 10 real open job listings with URLs from web search.",
    },
  },
  required: ["jobs"],
};

/** Extract concatenated text from Gemini content parts (skip thought parts). Used for structured JSON response. */
function extractTextFromParts(parts: Array<{ text?: string; thought?: boolean }>): string {
  if (!parts?.length) return "";
  return parts
    .filter((p) => (p as { thought?: boolean }).thought !== true)
    .map((p) => p.text ?? "")
    .join("");
}

/** Grounding metadata from Gemini (Google Search). Candidate may have groundingMetadata. */
type GroundingMetadata = {
  webSearchQueries?: string[];
  groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
};

function extractGroundingFromCandidate(candidate: unknown): { queries: string[]; citations: Array<{ uri: string; title?: string }> } | null {
  const gm = (candidate as { groundingMetadata?: GroundingMetadata })?.groundingMetadata;
  if (!gm) return null;
  const queries = Array.isArray(gm.webSearchQueries) ? gm.webSearchQueries : [];
  const citations = (gm.groundingChunks ?? [])
    .map((c) => c.web)
    .filter((w): w is { uri?: string; title?: string } => !!w && !!w.uri)
    .map((w) => ({ uri: w.uri!, title: w.title }));
  if (queries.length === 0 && citations.length === 0) return null;
  return { queries, citations };
}

/** Strip null bytes and control characters, then trim and cap length. Do not log full content in production. */
function sanitizeUserText(s: unknown, maxLen: number): string {
  if (s == null) return "";
  const t = String(s)
    .replace(/\0/g, "")
    // eslint-disable-next-line no-control-regex -- intentional: strip control chars for sanitization
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "")
    .trim();
  return t.length > maxLen ? t.slice(0, maxLen) : t;
}

// Guest roadmap generation: rate limit by IP (in-memory; resets on cold start)
const guestRateLimitMap = new Map<string, { count: number; windowStart: number }>();
const GUEST_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const GUEST_RATE_LIMIT_MAX = 3;

// Study tools: free-tier limits (premium = unlimited)
const NOTES_LIMIT_FREE = 20;
const TASKS_LIMIT_FREE = 30;
const AI_SUGGEST_PER_DAY_FREE = 5;

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") ?? "unknown";
}

function checkGuestRateLimit(ip: string): boolean {
  const now = Date.now();
  let entry = guestRateLimitMap.get(ip);
  if (!entry) {
    guestRateLimitMap.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (now - entry.windowStart > GUEST_RATE_LIMIT_WINDOW_MS) {
    entry = { count: 1, windowStart: now };
    guestRateLimitMap.set(ip, entry);
    return true;
  }
  if (entry.count >= GUEST_RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// Career DNA quiz: rate limit by IP
const careerDnaRateLimitMap = new Map<string, { count: number; windowStart: number }>();
const CAREER_DNA_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const CAREER_DNA_RATE_LIMIT_MAX = 10;

function checkCareerDnaRateLimit(ip: string): boolean {
  const now = Date.now();
  let entry = careerDnaRateLimitMap.get(ip);
  if (!entry) {
    careerDnaRateLimitMap.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (now - entry.windowStart > CAREER_DNA_RATE_LIMIT_WINDOW_MS) {
    entry = { count: 1, windowStart: now };
    careerDnaRateLimitMap.set(ip, entry);
    return true;
  }
  if (entry.count >= CAREER_DNA_RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

async function hashIp(ip: string): Promise<string> {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 32);
  } catch {
    return "unknown";
  }
}

// Rate limit for contact, support, newsletter (in-memory; resets on cold start)
const publicRateLimitMap = new Map<string, { count: number; windowStart: number }>();
const PUBLIC_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const CONTACT_RATE_LIMIT_MAX = 5;
const NEWSLETTER_RATE_LIMIT_MAX = 3;
const SUPPORT_RATE_LIMIT_MAX = 5;

function checkPublicRateLimit(key: string, maxPerWindow: number): boolean {
  const now = Date.now();
  let entry = publicRateLimitMap.get(key);
  if (!entry) {
    publicRateLimitMap.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (now - entry.windowStart > PUBLIC_RATE_LIMIT_WINDOW_MS) {
    entry = { count: 1, windowStart: now };
    publicRateLimitMap.set(key, entry);
    return true;
  }
  if (entry.count >= maxPerWindow) return false;
  entry.count++;
  return true;
}

function trimStr(s: unknown, maxLen: number): string {
  if (s == null) return "";
  const t = String(s).trim();
  return t.length > maxLen ? t.slice(0, maxLen) : t;
}

function normalizeDifficultyLevel(value: unknown): "beginner" | "intermediate" | "advanced" {
  const s = String(value ?? "").trim().toLowerCase();
  if (DIFFICULTY_LEVELS.includes(s as (typeof DIFFICULTY_LEVELS)[number])) return s as "beginner" | "intermediate" | "advanced";
  return "intermediate";
}

function isPaidTier(tier: string | undefined): boolean {
  return tier === "premium" || tier === "pro";
}

/** Previous calendar day in UTC (YYYY-MM-DD). */
function prevDay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Compute current streak (consecutive days ending on endDate) and longest streak from distinct activity dates; upsert study_streaks. */
async function updateStudyStreak(
  supabase: ReturnType<typeof getSupabase>,
  userId: string,
  endDate: string
): Promise<void> {
  const { data: rows } = await supabase
    .from("study_activity")
    .select("activity_date")
    .eq("user_id", userId)
    .order("activity_date", { ascending: false });
  const dateSet = new Set<string>();
  for (const r of rows ?? []) {
    const d = (r as { activity_date?: string }).activity_date;
    if (d) dateSet.add(d);
  }
  let currentStreak = 0;
  let d = endDate;
  while (dateSet.has(d)) {
    currentStreak++;
    d = prevDay(d);
  }
  const sorted = [...dateSet].sort().reverse();
  let longestStreak = 0;
  let run = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0 || sorted[i] === prevDay(sorted[i - 1])) run++;
    else {
      longestStreak = Math.max(longestStreak, run);
      run = 1;
    }
  }
  longestStreak = Math.max(longestStreak, run, currentStreak);
  await supabase.from("study_streaks").upsert(
    {
      user_id: userId,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_activity_date: endDate,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (currentStreak >= 7) await awardBadge(supabase, userId, "streak_7");
  if (currentStreak >= 30) await awardBadge(supabase, userId, "streak_30");
}

async function awardBadge(
  supabase: ReturnType<typeof getSupabase>,
  userId: string,
  badgeId: string
): Promise<void> {
  await supabase.from("user_badges").upsert(
    { user_id: userId, badge_id: badgeId },
    { onConflict: "user_id,badge_id" }
  );
}

/** Call courses-search edge function to get a real course URL. Returns null on any failure or missing config. */
async function fetchCourseUrlFromSearch(
  supabaseUrl: string,
  anonKey: string,
  platform: string,
  query: string,
  language: string
): Promise<string | null> {
  if (!supabaseUrl?.trim() || !anonKey?.trim()) return null;
  const url = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/courses-search`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${anonKey}` },
      body: JSON.stringify({
        platform: String(platform).trim().slice(0, 100),
        query: String(query).trim().slice(0, 300),
        language: language === "ar" ? "ar" : "en",
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { url?: string | null };
    return typeof data?.url === "string" && data.url ? data.url : null;
  } catch {
    return null;
  }
}

/**
 * Enrich course metadata by scraping the course URL for real pricing and other metadata.
 * Updates the course record in the database with scraped data.
 */
async function enrichCourseMetadata(
  supabase: ReturnType<typeof getSupabase>,
  courseId: string,
  courseUrl: string
): Promise<void> {
  try {
    const metadata = await scrapeCourseMetadata(courseUrl);
    const updates: Record<string, unknown> = {};
    
    // Only update fields that we successfully scraped (don't overwrite with null)
    if (metadata.price !== null) {
      updates.price = metadata.price;
      updates.currency = metadata.currency || 'USD';
    }
    if (metadata.rating !== null) {
      updates.rating = metadata.rating;
    }
    if (metadata.instructor) {
      updates.instructor = metadata.instructor;
    }
    if (metadata.duration) {
      updates.duration = metadata.duration;
    }
    if (metadata.difficulty_level) {
      updates.difficulty_level = metadata.difficulty_level;
    }
    if (metadata.title) {
      updates.title = metadata.title;
    }
    
    // Only update if we found at least one piece of metadata
    if (Object.keys(updates).length > 0) {
      await supabase
        .from("course_recommendations")
        .update(updates)
        .eq("id", courseId);
    }
  } catch (error) {
    console.warn("[enrichCourseMetadata] Failed for course", courseId, error);
    // Silently fail - don't block roadmap generation
  }
}

/** Fill missing course URLs in roadmapData by calling courses-search. Mutates roadmapData.weeks[].courses[].url. */
async function fillMissingCourseUrls(
  roadmapData: Record<string, unknown>,
  language: string,
  supabaseUrl: string,
  anonKey: string,
  maxToFill: number
): Promise<void> {
  const weeks = Array.isArray(roadmapData.weeks) ? roadmapData.weeks as Array<Record<string, unknown>> : [];
  const toFill: { weekIndex: number; courseIndex: number; platform: string; title: string }[] = [];
  for (let wi = 0; wi < weeks.length; wi++) {
    const courses = Array.isArray(weeks[wi].courses) ? weeks[wi].courses as Array<Record<string, unknown>> : [];
    for (let ci = 0; ci < courses.length; ci++) {
      const c = courses[ci];
      const url = c?.url;
      const hasUrl = typeof url === "string" && url.trim() && isValidCourseUrl(url) && isAllowedCourseHost(url);
      if (hasUrl) continue;
      const platform = typeof c?.platform === "string" ? c.platform.trim() : "";
      const title = typeof c?.title === "string" ? c.title.trim() : "";
      if (platform && title && getPlatformDomain(platform)) toFill.push({ weekIndex: wi, courseIndex: ci, platform, title });
    }
  }
  if (toFill.length === 0) return;
  const slice = toFill.slice(0, maxToFill);
  const results = await Promise.all(
    slice.map(({ platform, title }) => fetchCourseUrlFromSearch(supabaseUrl, anonKey, platform, title, language))
  );
  for (let i = 0; i < slice.length; i++) {
    const url = results[i];
    if (!url) continue;
    const { weekIndex, courseIndex } = slice[i];
    const weeksArr = roadmapData.weeks as Array<Record<string, unknown>>;
    const courses = weeksArr[weekIndex]?.courses as Array<Record<string, unknown>> | undefined;
    if (courses?.[courseIndex]) (courses[courseIndex] as Record<string, unknown>).url = url;
  }
}

function cleanRoadmapOutput(roadmapData: Record<string, unknown>): void {
  roadmapData.title = trimStr(roadmapData.title, MAX_TITLE_LEN);
  roadmapData.description = trimStr(roadmapData.description, MAX_DESCRIPTION_LEN);
  roadmapData.difficulty_level = normalizeDifficultyLevel(roadmapData.difficulty_level);
  const weeks = Array.isArray(roadmapData.weeks) ? roadmapData.weeks : [];
  for (const w of weeks) {
    if (w && typeof w === "object") {
      const week = w as Record<string, unknown>;
      week.title = trimStr(week.title, MAX_TITLE_LEN);
      week.description = trimStr(week.description, MAX_DESCRIPTION_LEN);
      if (Array.isArray(week.skills_to_learn)) week.skills_to_learn = week.skills_to_learn.map((s: unknown) => trimStr(s, MAX_STRING_ITEM_LEN));
      if (Array.isArray(week.deliverables)) week.deliverables = week.deliverables.map((s: unknown) => trimStr(s, MAX_STRING_ITEM_LEN));
      if (Array.isArray(week.courses)) {
        for (const c of week.courses) {
          if (c && typeof c === "object") {
            const course = c as Record<string, unknown>;
            course.title = trimStr(course.title, MAX_TITLE_LEN);
            const platform = trimStr(course.platform, MAX_STRING_ITEM_LEN);
            course.platform = platform;
            const rawUrl = typeof course.url === "string" ? course.url.trim().slice(0, 2048) : "";
            const validUrl = isValidCourseUrl(rawUrl) ? rawUrl : null;
            const allowed = validUrl && isAllowedCourseHost(validUrl);
            const isYoutube = allowed && isYouTubeUrl(validUrl);
            course.url = allowed && !isYoutube ? validUrl : null;
          }
        }
      }
    }
  }
}

function cleanQuizOutput(quizData: Record<string, unknown>): { questions: Array<Record<string, unknown>> } {
  const raw = Array.isArray(quizData.questions) ? quizData.questions : [];
  const questions: Array<Record<string, unknown>> = [];
  for (const q of raw) {
    if (!q || typeof q !== "object") continue;
    const item = q as Record<string, unknown>;
    const options = Array.isArray(item.options) ? item.options.map((o: unknown) => trimStr(o, MAX_OPTION_LEN)) : [];
    const correctIndex = typeof item.correct_index === "number" ? Math.floor(item.correct_index) : 0;
    const validCorrectIndex = options.length > 0 ? Math.max(0, Math.min(correctIndex, options.length - 1)) : 0;
    questions.push({
      question: trimStr(item.question, MAX_QUESTION_LEN),
      options,
      correct_index: validCorrectIndex,
      explanation: trimStr(item.explanation, MAX_EXPLANATION_LEN),
    });
  }
  return { questions };
}

async function verifyPassword(supabaseUrl: string, anonKey: string, email: string, password: string): Promise<boolean> {
  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: anonKey },
    body: JSON.stringify({ email, password }),
  });
  return res.ok;
}

function route(path: string): string | null {
  const parts = path.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  const p0 = parts[0];
  if (p0 === "health") return "health";
  const p1 = parts[1];
  const p2 = parts[2];
  const p3 = parts[3];
  const p4 = parts[4];
  if (p0 === "profile") {
    if (p1 === "avatar" && p2 === "generate") return "profile/avatar/generate";
    if (p1 === "avatar" && p2 === "upload") return "profile/avatar/upload";
    return "profile";
  }
  if (p0 === "contact") return "contact";
  if (p0 === "support") return "support";
  if (p0 === "newsletter") return "newsletter";
  if (p0 === "roadmaps") return "roadmaps";
  if (p0 === "roadmap") {
    if (!p1) return "roadmap/index";
    if (p1 === "active") return "roadmap/active";
    if (p1 === "generate") return "roadmap/generate";
    if (p1 === "generate-guest") return "roadmap/generate-guest";
    if (p1 === "weeks" && p2 === "complete") return "roadmap/weeks/complete";
    return "roadmap/index";
  }
  if (p0 === "subscription") return "subscription";
  if (p0 === "usage") return "usage";
  if (p0 === "analytics") return "analytics";
  if (p0 === "chat") {
    if (!p1) return "chat";
    if (p1 === "history") return "chat/history";
    if (p1 === "messages") return "chat/messages";
    return "chat";
  }
  if (p0 === "quiz") {
    if (p1 === "generate") return "quiz/generate";
    if (p1 === "results") return "quiz/results";
    return null;
  }
  if (p0 === "checkout") {
    if (p1 === "create") return "checkout/create";
    if (p1 === "portal") return "checkout/portal";
    return null;
  }
  if (p0 === "auth") {
    if (p1 === "sync") return "auth/sync";
    if (p1 === "account") return "auth/account";
    if (p1 === "set-password") return "auth/set-password";
    if (p1 === "change-password") return "auth/change-password";
    return null;
  }
  if (p0 === "courses") {
    if (p1 === "refresh-metadata") return "courses/refresh-metadata";
    if (p1) return "courses/id";
    return null;
  }
  if (p0 === "notes") {
    if (p1) return "notes/id";
    return "notes";
  }
  if (p0 === "tasks") {
    if (p1 === "suggest") return "tasks/suggest";
    if (p1 === "auto-generate") return "tasks/auto-generate";
    if (p1) return "tasks/id";
    return "tasks";
  }
  if (p0 === "admin") {
    if (p1 === "batch") return "admin/batch";
    if (p1 === "users") {
      if (!p2) return "admin/users";
      if (p2 === "create") return "admin/users/create";
      if (p2 === "invite") return "admin/users/invite";
      if (p2 === "stats") return "admin/users/stats";
      if (p2 === "bulk") return "admin/users/bulk";
      if (p2 === "export") return "admin/users/export";
      if (p2 === "journey" && p3) return "admin/users/journey";
      if (p3 === "impersonate") return "admin/users/impersonate";
      if (p3 === "ban") return "admin/users/ban";
      if (p3 === "notes") return "admin/users/notes";
      if (p3 === "tags") return "admin/users/tags";
      return "admin/users/id";
    }
    if (p1 === "subscriptions") {
      if (!p2) return "admin/subscriptions";
      if (p2 === "revenue") return "admin/subscriptions/revenue";
      if (p2 === "churn-analysis") return "admin/subscriptions/churn-analysis";
      if (p2 === "refunds") return "admin/subscriptions/refunds";
      if (p3 === "events") return "admin/subscriptions/events";
      if (p3 === "manual-update") return "admin/subscriptions/manual-update";
      return "admin/subscriptions/id";
    }
    if (p1 === "analytics") {
      if (p2 === "insights") return "admin/analytics/insights";
      if (p2 === "traffic") return "admin/analytics/traffic";
      if (p2 === "conversions") return "admin/analytics/conversions";
      if (p2 === "user-journeys") return "admin/analytics/user-journeys";
      return "admin/analytics";
    }
    if (p1 === "content") {
      if (p2 === "roadmaps") {
        if (p3) return "admin/content/roadmaps/id";
        return "admin/content/roadmaps";
      }
      if (p2 === "chat") {
        if (p3) return "admin/content/chat/id";
        return "admin/content/chat";
      }
      if (p2 === "community") return "admin/content/community";
      return null;
    }
    if (p1 === "settings") {
      if (p2 === "feature-flags") return "admin/settings/feature-flags";
      if (p2) return "admin/settings/key";
      return "admin/settings";
    }
    if (p1 === "themes") {
      if (!p2) return "admin/themes";
      if (p3 === "set-default") return "admin/themes/set-default";
      return "admin/themes/id";
    }
    if (p1 === "audit-log") {
      if (p2) return "admin/audit-log/id";
      return "admin/audit-log";
    }
    if (p1 === "leads") return "admin/leads";
    if (p1 === "contact-requests") return "admin/contact-requests";
    return null;
  }
  if (p0 === "cv" && p1 === "analyze") return "cv/analyze";
  if (p0 === "jobs") {
    if (p1 === "list" || !p1) return "jobs/list";
    if (p1 === "find") return "jobs/find";
    if (p1 === "weekly") return "jobs/weekly";
    return null;
  }
  if (p0 === "study-streak") return "study-streak";
  if (p0 === "study-activity") return "study-activity";
  if (p0 === "notification-preferences") return "notification-preferences";
  if (p0 === "unsubscribe-email") return "unsubscribe-email";
  if (p0 === "push-subscription") return "push-subscription";
  if (p0 === "vapid-public") return "vapid-public";
  if (p0 === "events") {
    if (p1 === "track") return "events/track";
    return null;
  }
  if (p0 === "themes" && !p1) return "themes"; // Public themes endpoint
  if (p0 === "career-dna") {
    if (p1 === "analyze") return "career-dna/analyze";
    if (p1 === "result" && p2) return "career-dna/result";
    if (p1 === "lead") return "career-dna/lead";
    if (p1 === "squad") {
      if (!p2 || p2 === "create") return "career-dna/squad/create"; // POST /squad or /squad/create
      return "career-dna/squad/get"; // GET /squad/:slug
    }
    return null;
  }
  if (p0 === "community") {
    if (p1 === "peers") return "community/peers";
    if (p1 === "connections") return "community/connections";
    if (p1 === "leaderboard") return "community/leaderboard";
    if (p1 === "groups") {
      if (!p2) return "community/groups";
      if (p2 === "top-by-streak") return "community/groups/top-by-streak";
      if (p3 === "join") return "community/groups/join";
      if (p3 === "leave") return "community/groups/leave";
      if (p3 === "members") return "community/groups/members";
      return "community/groups/id";
    }
    if (p1 === "chat" && p2 === "room" && p3) {
      if (p4 === "messages") return "community/chat/messages";
      return "community/chat/room";
    }
    if (p1 === "badges") return "community/badges";
    if (p1 === "me" && p2 === "badges") return "community/me/badges";
    return null;
  }
  return null;
}

async function ensureProfileAndSubscription(
  supabase: ReturnType<typeof getSupabase>,
  userId: string,
  email: string | undefined,
  displayName: string | undefined
) {
  const normalizedEmail = email?.trim().toLowerCase() ?? null;
  const { data: existing } = await supabase.from("profiles").select("user_id").eq("user_id", userId).maybeSingle();
  if (existing) {
    // Profile exists: do not overwrite display_name or other user-edited fields
  } else {
    const name = (displayName ?? email?.split("@")[0] ?? "User").trim().slice(0, 500);
    const { error: insertErr } = await supabase.from("profiles").insert({
      user_id: userId,
      email: normalizedEmail,
      display_name: name,
      preferred_language: "en",
    });
    if (insertErr) {
      logError("api", "ensureProfileAndSubscription: profiles insert failed", new Error(insertErr.message));
    throw new Error("Failed to ensure profile");
    }
  }
  const { error: subErr } = await supabase.from("subscriptions").upsert(
    { user_id: userId, tier: "free", status: "active" },
    { onConflict: "user_id", ignoreDuplicates: true }
  );
  if (subErr) {
    logError("api", "ensureProfileAndSubscription: subscriptions upsert failed", new Error(subErr.message));
    throw new Error("Failed to ensure subscription record");
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) });
  }

  const json = (body: unknown, status: number, init?: ResponseInit) =>
    jsonResponse(body, status, init, req);

  const pathHeader = req.headers.get("x-path") ?? req.headers.get("X-Path");
  const url = new URL(req.url);
  const pathFromQuery = url.searchParams.get("path");
  let path = pathHeader ?? pathFromQuery ?? url.pathname.replace(/^.*\/api\/?/, "/api/");
  
  // If path is just "/api" with query params, try to extract from X-Path header or return error
  if (path === "/api" || path === "/api/") {
    if (!pathHeader && !pathFromQuery) {
      logError("api", "Missing X-Path header", { url: req.url, pathname: url.pathname, searchParams: Object.fromEntries(url.searchParams) });
      return json({ error: "Missing X-Path header. Please ensure the API client sets the X-Path header correctly." }, 400);
    }
    path = pathHeader ?? pathFromQuery ?? "/api/";
  }
  
  const normalizedPath = path.startsWith("/api") ? path : `/api/${path}`;
  const pathSegments = normalizedPath.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  const routeKey = route(normalizedPath);

  if (!routeKey) {
    logError("api", "Route not found", { normalizedPath, pathSegments, url: req.url });
    return json({ error: "Not found", path: normalizedPath }, 404);
  }

  const supabase = getSupabase();
  let body: Record<string, unknown> = {};
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      const text = await req.text();
      if (text) body = JSON.parse(text) as Record<string, unknown>;
    } catch (parseErr) {
      logError("api", "body parse failed", parseErr);
    }
  }

  const authFromHeader = req.headers.get("authorization") ?? null;
  const userToken = req.headers.get("x-user-token")?.trim();
  const authHeader = authFromHeader ?? (userToken ? `Bearer ${userToken}` : null);
  const authResult = await getAuthUser(authHeader);
  const user = "user" in authResult ? authResult.user : null;
  const authFailureReason = "reason" in authResult ? authResult.reason : null;
  const requireAuth = ![
    "health",
    "contact",
    "newsletter",
    "roadmap/generate-guest",
    "admin/batch",
    "jobs/weekly",
    "unsubscribe-email",
    "vapid-public",
    "events/track",
    "themes",
    "career-dna/analyze",
    "career-dna/result",
    "career-dna/lead",
    "career-dna/squad/create",
    "career-dna/squad/get",
  ].includes(routeKey);
  if (requireAuth && !user) {
    const code = authFailureReason ?? "unauthorized";
    return json(
      { error: "Unauthorized", code },
      401,
      { headers: { "X-Auth-Failure-Code": code } }
    );
  }

  function checkAdminSecret(): boolean {
    const secret = Deno.env.get("ADMIN_SECRET") ?? "";
    if (!secret) return false;
    const header = req.headers.get("x-admin-secret") ?? req.headers.get("X-Admin-Secret") ?? "";
    return header === secret;
  }

  try {
    switch (routeKey) {
      case "health": {
        return json({ ok: true, service: "api" }, 200);
      }
      case "profile": {
        if (req.method !== "GET" && req.method !== "PATCH") {
          return json({ error: "Method not allowed" }, 405);
        }
        await ensureProfileAndSubscription(
          supabase,
          user!.id,
          user!.email,
          user!.user_metadata?.display_name as string | undefined
        );
        if (req.method === "PATCH") {
          const { data: current } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user!.id)
            .single();
          if (!current) return json({ error: "Profile not found" }, 404);
          const trimStr = (v: unknown): string | null =>
            v != null && String(v).trim() !== "" ? String(v).trim() : null;
          const b = body as Record<string, unknown>;
          const displayName = trimStr(b.display_name) ?? (current.display_name != null ? String(current.display_name).trim() : null) ?? null;
          const sanitizeSocialUrl = (v: unknown, allowed: (url: string) => boolean): string | null => {
            const s = trimStr(v);
            if (!s) return null;
            try {
              const u = new URL(s.startsWith("http") ? s : `https://${s}`);
              const hostPath = u.hostname + u.pathname;
              if (!allowed(hostPath)) return null;
              return u.toString();
            } catch {
              return null;
            }
          };
          const linkedinOk = (url: string) => /linkedin\.com\/in\//i.test(url);
          const twitterOk = (url: string) => /(twitter\.com|x\.com)\//i.test(url);
          const githubOk = (url: string) => /github\.com\//i.test(url);
          const cur = current as { linkedin_url?: string; twitter_url?: string; github_url?: string };
          const linkedinUrl = !("linkedin_url" in b) ? (cur.linkedin_url ?? null) : (trimStr(b.linkedin_url) === null ? null : (sanitizeSocialUrl(b.linkedin_url, linkedinOk) ?? cur.linkedin_url ?? null));
          const twitterUrl = !("twitter_url" in b) ? (cur.twitter_url ?? null) : (trimStr(b.twitter_url) === null ? null : (sanitizeSocialUrl(b.twitter_url, twitterOk) ?? cur.twitter_url ?? null));
          const githubUrl = !("github_url" in b) ? (cur.github_url ?? null) : (trimStr(b.github_url) === null ? null : (sanitizeSocialUrl(b.github_url, githubOk) ?? cur.github_url ?? null));
          const updatePayload = {
            display_name: displayName ?? current.display_name,
            avatar_url: trimStr(b.avatar_url) ?? b.avatar_url ?? current.avatar_url ?? null,
            job_title: trimStr(b.job_title) ?? b.job_title ?? current.job_title ?? null,
            target_career: trimStr(b.target_career) ?? b.target_career ?? current.target_career ?? null,
            experience_level: trimStr(b.experience_level) ?? b.experience_level ?? current.experience_level ?? null,
            industry: trimStr(b.industry) ?? b.industry ?? current.industry ?? null,
            skills: Array.isArray(b.skills) ? b.skills : (current.skills ?? []),
            learning_style: trimStr(b.learning_style) ?? b.learning_style ?? current.learning_style ?? null,
            weekly_hours: typeof b.weekly_hours === "number" ? b.weekly_hours : (current.weekly_hours ?? 10),
            budget: trimStr(b.budget) ?? b.budget ?? current.budget ?? null,
            preferred_language: trimStr(b.preferred_language) ?? b.preferred_language ?? current.preferred_language ?? "en",
            onboarding_completed: typeof b.onboarding_completed === "boolean" ? b.onboarding_completed : (current.onboarding_completed ?? false),
            location: trimStr(b.location) ?? b.location ?? current.location ?? null,
            job_work_preference: ["remote", "hybrid", "on_site"].includes(String(b.job_work_preference ?? "")) ? b.job_work_preference : (current.job_work_preference ?? null),
            find_jobs_enabled: typeof b.find_jobs_enabled === "boolean" ? b.find_jobs_enabled : (current.find_jobs_enabled ?? false),
            linkedin_url: linkedinUrl,
            twitter_url: twitterUrl,
            github_url: githubUrl,
            phone: (() => {
              if (!("phone" in b)) return (current as { phone?: string }).phone ?? null;
              const raw = trimStr(b.phone);
              if (!raw) return null;
              const sanitized = raw.replace(/\s/g, "").slice(0, 20);
              if (!/^\+?[\d]{7,20}$/.test(sanitized)) return (current as { phone?: string }).phone ?? null;
              return sanitized.startsWith("+") ? sanitized : `+${sanitized}`;
            })(),
            preferred_theme_id: (() => {
              if (!("preferred_theme_id" in b)) return (current as { preferred_theme_id?: string }).preferred_theme_id ?? null;
              const themeId = trimStr(b.preferred_theme_id);
              if (!themeId) return null;
              // Validate UUID format
              if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(themeId)) return (current as { preferred_theme_id?: string }).preferred_theme_id ?? null;
              return themeId;
            })(),
            updated_at: new Date().toISOString(),
          };
          const { data: updated, error } = await supabase
            .from("profiles")
            .update(updatePayload)
            .eq("user_id", user!.id)
            .select()
            .single();
          if (error) throw error;
          return json(updated ?? current);
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user!.id)
          .single();
        return json(profile ?? null);
      }

      case "profile/avatar/generate": {
        if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
        const AVATAR_LIMIT_PER_MONTH = 3;
        const bucketName = "avatars";
        try {
          const sub = await supabase.from("subscriptions").select("tier").eq("user_id", user!.id).single();
          const tier = (sub?.data?.tier ?? "free") as string;
          if (!isPaidTier(tier)) {
            return json({ error: "Avatar generation is for Premium subscribers only." }, 402);
          }
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);
          const { count } = await supabase
            .from("avatar_generations")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user!.id)
            .gte("created_at", startOfMonth.toISOString());
          if ((count ?? 0) >= AVATAR_LIMIT_PER_MONTH) {
            return json(
              { error: `You have used your ${AVATAR_LIMIT_PER_MONTH} avatar generations this month. Next month you can generate more.` },
              402
            );
          }
          const config = getGeminiConfig();
          if (!config) return json({ error: "AI image generation is not configured." }, 500);
          const avatarImageSize = (Deno.env.get("GEMINI_AVATAR_IMAGE_SIZE") ?? "2K").toUpperCase() === "4K" ? "4K" : "2K";
          const imageUrl = getGeminiGenerateContentUrl(GEMINI_IMAGE_MODEL);
          const prompt =
            "Generate a single clean, professional profile avatar image. Style: simple and friendly, like modern app profile pictures (e.g. Google Chrome profile icons). Minimalist, neutral or soft gradient background. Show only head and shoulders, no text. High quality, suitable for a user avatar. Square aspect ratio.";
          const res = await geminiFetchWithRetry(imageUrl, {
            method: "POST",
            headers: getGeminiHeaders(config.apiKey),
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: {
                responseModalities: ["TEXT", "IMAGE"],
                responseMimeType: "image/png",
                imageConfig: { aspectRatio: "1:1", imageSize: avatarImageSize },
              },
            }),
          });
          if (!res.ok) {
            const errText = await res.text();
            console.error("avatar generate Gemini error:", res.status, errText);
            return json({ error: "Avatar generation failed. Please try again." }, 500);
          }
          const json = (await res.json()) as {
            candidates?: Array<{
              finishReason?: string;
              content?: {
                parts?: Array<{
                  inlineData?: { data?: string };
                  inline_data?: { data?: string };
                  thought?: boolean;
                }>;
              };
            }>;
            usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number; thoughtsTokenCount?: number };
          };
          const cands = json.candidates ?? [];
          const finishCheck = checkGeminiFinishReason(cands, cands[0]?.finishReason);
          if (!finishCheck.ok) {
            console.error("avatar generate: blocked finish reason", finishCheck.finishReason);
            return json({ error: finishCheck.userMessage ?? "Avatar generation was blocked. Please try again." }, 400);
          }
          logGeminiUsage(json.usageMetadata, "profile/avatar/generate");
          const parts = json.candidates?.[0]?.content?.parts ?? [];
          let base64Data: string | null = null;
          // Gemini 3 Pro Image may return thought parts then final image; use last non-thought image
          for (const part of parts) {
            if ((part as { thought?: boolean }).thought === true) continue;
            const data = part.inlineData?.data ?? (part as { inline_data?: { data?: string } }).inline_data?.data;
            if (data) base64Data = data;
          }
          if (!base64Data) {
            console.error("avatar generate: no image in response");
            return json({ error: "No image was generated. Please try again." }, 500);
          }
          const binary = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
          const fileName = `${user!.id}/${Date.now()}.png`;
          const { error: uploadError } = await supabase.storage.from(bucketName).upload(fileName, binary, {
            contentType: "image/png",
            upsert: true,
          });
          if (uploadError) {
            console.error("avatar upload error:", uploadError);
            return json(
              { error: "Failed to save avatar. Ensure the 'avatars' storage bucket exists and is public." },
              500
            );
          }
          const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
          const avatarUrl = urlData?.publicUrl ?? "";
          await supabase.from("avatar_generations").insert({ user_id: user!.id });
          await supabase
            .from("profiles")
            .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
            .eq("user_id", user!.id);
          return json({ avatar_url: avatarUrl });
        } catch (err) {
          logError("profile/avatar/generate", "unexpected error", err);
          return json({ error: "Avatar generation failed. Please try again." }, 500);
        }
      }

      case "profile/avatar/upload": {
        if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
        const bucketName = "avatars";
        const MAX_AVATAR_BASE64_BYTES = 2 * 1024 * 1024; // 2MB decoded
        const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"];
        try {
          const payload = body as { image?: string; mime?: string };
          const base64 = typeof payload?.image === "string" ? payload.image.trim() : "";
          const mime = typeof payload?.mime === "string" ? payload.mime.trim().toLowerCase() : "image/png";
          if (!base64) return json({ error: "image (base64) is required" }, 400);
          if (!ALLOWED_MIMES.includes(mime)) return json({ error: "mime must be image/jpeg, image/png, or image/webp" }, 400);
          let binary: Uint8Array;
          try {
            binary = Uint8Array.from(atob(base64.replace(/^data:image\/\w+;base64,/, "")), (c) => c.charCodeAt(0));
          } catch {
            return json({ error: "Invalid base64 image" }, 400);
          }
          if (binary.length > MAX_AVATAR_BASE64_BYTES) return json({ error: "Image too large. Max 2MB." }, 400);
          const ext = mime === "image/jpeg" ? "jpg" : mime === "image/webp" ? "webp" : "png";
          const fileName = `${user!.id}/${Date.now()}.${ext}`;
          const { error: uploadError } = await supabase.storage.from(bucketName).upload(fileName, binary, {
            contentType: mime,
            upsert: true,
          });
          if (uploadError) {
            console.error("profile/avatar/upload error:", uploadError);
            return json(
              { error: "Failed to save avatar. Ensure the 'avatars' storage bucket exists and is public." },
              500
            );
          }
          const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
          const avatarUrl = urlData?.publicUrl ?? "";
          await supabase
            .from("profiles")
            .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
            .eq("user_id", user!.id);
          return json({ avatar_url: avatarUrl });
        } catch (err) {
          logError("profile/avatar/upload", "unexpected error", err);
          return json({ error: "Avatar upload failed. Please try again." }, 500);
        }
      }

      case "cv/analyze": {
        if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
        const subscription = await supabase.from("subscriptions").select("tier").eq("user_id", user!.id).single();
        const tier = (subscription?.data?.tier ?? "free") as string;
        if (!isPaidTier(tier)) {
          return json({ error: "CV analysis is for Premium subscribers only." }, 402);
        }
        const { pasteText } = body as { pasteText?: string };
        const text = sanitizeUserText(pasteText, MAX_CV_PASTE_LEN);
        if (text.length < MIN_CV_PASTE_LEN) {
          return json({ error: "Paste at least 50 characters of your CV to analyze." }, 400);
        }
        const config = getGeminiConfig();
        if (!config) return json({ error: "AI is not configured. Set GEMINI_API_KEY." }, 500);
        const { data: profile } = await supabase.from("profiles").select("target_career, job_title").eq("user_id", user!.id).single();
        const targetRole = (profile as { target_career?: string } | null)?.target_career ?? "the role they are targeting";
        const systemPrompt = `You are a career coach. Analyze the candidate's CV/resume and return a JSON object with:
- strengths: 3–5 key strengths (short strings).
- gaps: 3–5 gaps vs the target role (skills or experience to develop).
- recommendations: 3–5 short actionable recommendations.
- skill_keywords: extracted skill keywords for job matching (e.g. JavaScript, React, project management).
Target role context: ${targetRole}. Return only valid JSON matching the schema.`;
        const genUrl = getGeminiGenerateContentUrl(config.model);
        const aiRes = await geminiFetchWithRetry(genUrl, {
          method: "POST",
          headers: getGeminiHeaders(config.apiKey),
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: `Analyze this CV:\n\n${text}` }] }],
            generationConfig: {
              thinkingConfig: { thinkingLevel: isGemini3Flash(config.model) ? "medium" : "low" },
              temperature: 1.0,
              maxOutputTokens: 4096,
              responseMimeType: "application/json",
              responseJsonSchema: CV_ANALYSIS_RESPONSE_JSON_SCHEMA,
            },
          }),
        });
        if (aiRes.status === 429) return json({ error: "Rate limit exceeded. Please try again later." }, 429);
        if (!aiRes.ok) {
          console.error("cv/analyze Gemini error:", aiRes.status, await aiRes.text());
          return json({ error: "CV analysis failed. Please try again." }, 500);
        }
        let aiJson: { candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>; usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number; thoughtsTokenCount?: number } };
        try {
          aiJson = (await aiRes.json()) as typeof aiJson;
        } catch {
          return json({ error: "CV analysis failed." }, 500);
        }
        const cands = aiJson.candidates ?? [];
        const finishCheck = checkGeminiFinishReason(cands, cands[0]?.finishReason);
        if (!finishCheck.ok) {
          return json({ error: finishCheck.userMessage ?? "Analysis was blocked. Please try again." }, 400);
        }
        logGeminiUsage(aiJson.usageMetadata, "cv/analyze");
        const parts = cands[0]?.content?.parts ?? [];
        const jsonText = extractTextFromParts(parts as Array<{ text?: string; thought?: boolean }>);
        if (!jsonText.trim()) return json({ error: "Invalid analysis response." }, 500);
        let analysis: Record<string, unknown>;
        try {
          analysis = JSON.parse(jsonText) as Record<string, unknown>;
        } catch {
          return json({ error: "Invalid analysis response." }, 500);
        }
        return json({ analysis });
      }

      case "jobs/list": {
        if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
        const subscription = await supabase.from("subscriptions").select("tier").eq("user_id", user!.id).single();
        const tier = (subscription?.data?.tier ?? "free") as string;
        if (!isPaidTier(tier)) {
          return json({ error: "Job recommendations are for Premium subscribers only." }, 402);
        }
        const { data: list } = await supabase
          .from("job_recommendations")
          .select("*")
          .eq("user_id", user!.id)
          .order("fetched_at", { ascending: false })
          .limit(50);
        return json(list ?? []);
      }

      case "jobs/find": {
        if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
        const subscription = await supabase.from("subscriptions").select("tier").eq("user_id", user!.id).single();
        const tier = (subscription?.data?.tier ?? "free") as string;
        if (!isPaidTier(tier)) {
          return json({ error: "Find jobs is for Premium subscribers only." }, 402);
        }
        const config = getGeminiConfig();
        if (!config) return json({ error: "AI is not configured. Set GEMINI_API_KEY." }, 500);
        const { data: profile } = await supabase.from("profiles").select("target_career, job_title, skills, location, job_work_preference").eq("user_id", user!.id).single();
        const p = profile as { target_career?: string; job_title?: string; skills?: string[]; location?: string; job_work_preference?: string } | null;
        const workPref = ["remote", "hybrid", "on_site"].includes(String(p?.job_work_preference ?? "")) ? p!.job_work_preference : "remote";
        const locationStr = trimStr(p?.location ?? "", 200) || "any";
        const skillsStr = Array.isArray(p?.skills) ? p.skills.join(", ") : "";
        const targetRole = trimStr(p?.target_career ?? p?.job_title ?? "software developer", 200);
        const systemPrompt = `You are a job search assistant. Use Google Search to find real, currently open job listings. Return exactly 10 jobs as a JSON object with a "jobs" array. Each job must have: title, company, url (real job listing URL from search - must be valid HTTP/HTTPS), location_type (one of: remote, hybrid, on_site), location (string if any), match_score (0-100). Prefer real job boards: Indeed, LinkedIn, Remotive, company career pages. User preferences: work type ${workPref}, location ${locationStr}, target role ${targetRole}. Skills: ${skillsStr}. Only include jobs that match the user's work preference (${workPref}). Return only valid JSON.`;
        const genUrl = getGeminiGenerateContentUrl(config.model);
        const aiRes = await geminiFetchWithRetry(genUrl, {
          method: "POST",
          headers: getGeminiHeaders(config.apiKey),
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: `Find 10 best open jobs for: ${targetRole}. Work: ${workPref}. Location: ${locationStr}. Return real job URLs only.` }] }],
            tools: [{ google_search: {} }],
            generationConfig: {
              thinkingConfig: { thinkingLevel: isGemini3Flash(config.model) ? "medium" : "low" },
              temperature: 1.0,
              maxOutputTokens: 8192,
              responseMimeType: "application/json",
              responseJsonSchema: JOBS_RESPONSE_JSON_SCHEMA,
            },
          }),
        });
        if (aiRes.status === 429) return json({ error: "Rate limit exceeded. Please try again later." }, 429);
        if (!aiRes.ok) {
          console.error("jobs/find Gemini error:", aiRes.status, await aiRes.text());
          return json({ error: "Job search failed. Please try again." }, 500);
        }
        let aiJson: { candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>; usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number; thoughtsTokenCount?: number } };
        try {
          aiJson = (await aiRes.json()) as typeof aiJson;
        } catch {
          return json({ error: "Job search failed." }, 500);
        }
        const cands = aiJson.candidates ?? [];
        const finishCheck = checkGeminiFinishReason(cands, cands[0]?.finishReason);
        if (!finishCheck.ok) {
          return json({ error: finishCheck.userMessage ?? "Job search was blocked. Please try again." }, 400);
        }
        logGeminiUsage(aiJson.usageMetadata, "jobs/find");
        const parts = cands[0]?.content?.parts ?? [];
        const jsonText = extractTextFromParts(parts as Array<{ text?: string; thought?: boolean }>);
        if (!jsonText.trim()) return json({ error: "Invalid job search response." }, 500);
        let parsed: { jobs?: Array<{ title?: string; company?: string; url?: string; location_type?: string; location?: string; match_score?: number }> };
        try {
          parsed = JSON.parse(jsonText) as typeof parsed;
        } catch {
          return json({ error: "Invalid job search response." }, 500);
        }
        const jobs = Array.isArray(parsed.jobs) ? parsed.jobs : [];
        const fetchedAt = new Date().toISOString();
        const toInsert = jobs.slice(0, 10).filter((j) => typeof j?.url === "string" && (j.url.startsWith("http://") || j.url.startsWith("https://"))).map((j) => {
          let url = (j.url ?? "").trim().slice(0, 2048);
          try {
            new URL(url);
          } catch {
            url = "https://example.com";
          }
          const locType = ["remote", "hybrid", "on_site"].includes(String(j.location_type ?? "")) ? j.location_type : "remote";
          const score = typeof j.match_score === "number" ? Math.max(0, Math.min(100, Math.round(j.match_score))) : null;
          return {
            user_id: user!.id,
            title: trimStr(j.title ?? "Job", 500),
            company: trimStr(j.company ?? "", 500) || null,
            url,
            location_type: locType,
            location: trimStr(j.location ?? "", 500) || null,
            match_score: score,
            source: "gemini_grounding",
            fetched_at: fetchedAt,
          };
        });
        if (toInsert.length > 0) {
          await supabase.from("job_recommendations").insert(toInsert);
        }
        return json({ jobs: toInsert, saved: toInsert.length });
      }

      case "jobs/weekly": {
        if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
        const cronSecret = Deno.env.get("CRON_SECRET") ?? "";
        const headerSecret = req.headers.get("x-cron-secret") ?? req.headers.get("X-Cron-Secret") ?? (body as { cron_secret?: string }).cron_secret ?? "";
        if (!cronSecret || headerSecret !== cronSecret) {
          return json({ error: "Unauthorized" }, 401);
        }
        const config = getGeminiConfig();
        if (!config) return json({ error: "GEMINI_API_KEY not set" }, 500);
        const { data: paidUsers } = await supabase
          .from("profiles")
          .select("user_id, target_career, job_title, skills, location, job_work_preference")
          .eq("find_jobs_enabled", true);
        if (!paidUsers?.length) return json({ ok: true, processed: 0 });
        const subs = await supabase.from("subscriptions").select("user_id, tier").in("user_id", paidUsers.map((u: { user_id: string }) => u.user_id));
        const paidTierUserIds = new Set((subs?.data ?? []).filter((s: { tier: string }) => isPaidTier(s.tier)).map((s: { user_id: string }) => s.user_id));
        let processed = 0;
        for (const row of paidUsers as Array<{ user_id: string; target_career?: string; job_title?: string; skills?: string[]; location?: string; job_work_preference?: string }>) {
          if (!paidTierUserIds.has(row.user_id)) continue;
          const workPref = ["remote", "hybrid", "on_site"].includes(String(row.job_work_preference ?? "")) ? row.job_work_preference : "remote";
          const locationStr = trimStr(row.location ?? "", 200) || "any";
          const skillsStr = Array.isArray(row.skills) ? row.skills.join(", ") : "";
          const targetRole = trimStr(row.target_career ?? row.job_title ?? "software developer", 200);
          const systemPrompt = `You are a job search assistant. Use Google Search to find real, currently open job listings. Return exactly 10 jobs as a JSON object with a "jobs" array. Each job must have: title, company, url (real job listing URL from search - must be valid HTTP/HTTPS), location_type (one of: remote, hybrid, on_site), location (string if any), match_score (0-100). Prefer real job boards. User preferences: work type ${workPref}, location ${locationStr}, target role ${targetRole}. Skills: ${skillsStr}. Only include jobs that match the user's work preference (${workPref}). Return only valid JSON.`;
          const genUrl = getGeminiGenerateContentUrl(config.model);
          try {
            const aiRes = await geminiFetchWithRetry(genUrl, {
              method: "POST",
              headers: getGeminiHeaders(config.apiKey),
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [{ role: "user", parts: [{ text: `Find 10 best open jobs for: ${targetRole}. Work: ${workPref}. Location: ${locationStr}. Return real job URLs only.` }] }],
                tools: [{ google_search: {} }],
                generationConfig: {
                  thinkingConfig: { thinkingLevel: isGemini3Flash(config.model) ? "medium" : "low" },
                  temperature: 1.0,
                  maxOutputTokens: 8192,
                  responseMimeType: "application/json",
                  responseJsonSchema: JOBS_RESPONSE_JSON_SCHEMA,
                },
              }),
            });
            if (!aiRes.ok) continue;
            const aiJson = (await aiRes.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>; usageMetadata?: unknown };
            const parts = aiJson.candidates?.[0]?.content?.parts ?? [];
            const jsonText = extractTextFromParts(parts as Array<{ text?: string; thought?: boolean }>);
            const parsed = JSON.parse(jsonText || "{}") as { jobs?: Array<{ title?: string; company?: string; url?: string; location_type?: string; location?: string; match_score?: number }> };
            const jobs = Array.isArray(parsed.jobs) ? parsed.jobs : [];
            const fetchedAt = new Date().toISOString();
            const toInsert = jobs.slice(0, 10).filter((j) => typeof j?.url === "string" && (j.url.startsWith("http://") || j.url.startsWith("https://"))).map((j) => {
              let url = (j.url ?? "").trim().slice(0, 2048);
              try {
                new URL(url);
              } catch {
                url = "https://example.com";
              }
              const locType = ["remote", "hybrid", "on_site"].includes(String(j.location_type ?? "")) ? j.location_type : "remote";
              const score = typeof j.match_score === "number" ? Math.max(0, Math.min(100, Math.round(j.match_score))) : null;
              return {
                user_id: row.user_id,
                title: trimStr(j.title ?? "Job", 500),
                company: trimStr(j.company ?? "", 500) || null,
                url,
                location_type: locType,
                location: trimStr(j.location ?? "", 500) || null,
                match_score: score,
                source: "gemini_grounding",
                fetched_at: fetchedAt,
              };
            });
            if (toInsert.length > 0) {
              await supabase.from("job_recommendations").insert(toInsert);
              processed++;
            }
          } catch (e) {
            logError("jobs/weekly", `user ${row.user_id}`, e);
          }
        }
        return json({ ok: true, processed });
      }

      case "roadmaps": {
        if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
        const { data: list } = await supabase
          .from("roadmaps")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false });
        return json(list ?? []);
      }

      case "subscription": {
        if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
        await ensureProfileAndSubscription(
          supabase,
          user!.id,
          user!.email,
          user!.user_metadata?.display_name as string | undefined
        );
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user!.id)
          .single();
        return json(sub ?? null);
      }

      case "usage": {
        if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
        const { count: roadmapsCreated } = await supabase
          .from("roadmaps")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user!.id);
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const iso = startOfMonth.toISOString();
        const { count: chatMessagesThisMonth } = await supabase
          .from("chat_history")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user!.id)
          .eq("role", "user")
          .gte("created_at", iso);
        const { count: quizzesTakenThisMonth } = await supabase
          .from("quiz_results")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user!.id)
          .gte("completed_at", iso);
        const { count: notesCount } = await supabase
          .from("notes")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user!.id);
        const { count: tasksCount } = await supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user!.id);
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todayIso = startOfToday.toISOString();
        const { count: aiSuggestionsToday } = await supabase
          .from("ai_suggest_calls")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user!.id)
          .gte("created_at", todayIso);
        return json({
          roadmapsCreated: roadmapsCreated ?? 0,
          chatMessagesThisMonth: chatMessagesThisMonth ?? 0,
          quizzesTakenThisMonth: quizzesTakenThisMonth ?? 0,
          notesCount: notesCount ?? 0,
          tasksCount: tasksCount ?? 0,
          aiSuggestionsToday: aiSuggestionsToday ?? 0,
        });
      }

      case "analytics": {
        if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const iso = startOfMonth.toISOString();
        const { count: roadmapsCreatedVal } = await supabase
          .from("roadmaps")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user!.id);
        const { count: chatMessagesThisMonth } = await supabase
          .from("chat_history")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user!.id)
          .eq("role", "user")
          .gte("created_at", iso);
        const { count: quizzesTaken } = await supabase
          .from("quiz_results")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user!.id);
        const { data: avgRow } = await supabase
          .from("quiz_results")
          .select("score")
          .eq("user_id", user!.id);
        const scores = (avgRow ?? []).map((r: { score?: number }) => r.score).filter((s): s is number => typeof s === "number");
        const averageQuizScore = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;
        const { data: lastQuizRows } = await supabase
          .from("quiz_results")
          .select("completed_at")
          .eq("user_id", user!.id)
          .order("completed_at", { ascending: false })
          .limit(1);
        const lastQuizAt = lastQuizRows?.[0]?.completed_at ?? null;
        const { data: rwRows } = await supabase
          .from("roadmap_weeks")
          .select("completed_at")
          .eq("user_id", user!.id)
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false })
          .limit(1);
        const roadmapWeeksLast = rwRows?.[0]?.completed_at ?? null;
        const { data: chatRows } = await supabase
          .from("chat_history")
          .select("created_at")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(1);
        const chatLast = chatRows?.[0]?.created_at ?? null;
        const dates: (string | null)[] = [lastQuizAt, roadmapWeeksLast, chatLast];
        const lastActiveAt = dates.reduce<string | null>((acc, d) => {
          if (!d) return acc;
          if (!acc) return d;
          return new Date(d) > new Date(acc) ? d : acc;
        }, null);
        return json({
          roadmapsCreated: roadmapsCreatedVal ?? 0,
          chatMessagesThisMonth: chatMessagesThisMonth ?? 0,
          quizzesTaken: quizzesTaken ?? 0,
          averageQuizScore,
          lastQuizAt,
          lastActiveAt,
        });
      }

      case "roadmap/index": {
        if (req.method !== "GET" && req.method !== "PATCH" && req.method !== "DELETE") return json({ error: "Method not allowed" }, 405);
        const id = url.searchParams.get("id") ?? (body.id as string);
        if (!id) return json({ error: "id query required" }, 400);
        const { data: roadmap } = await supabase
          .from("roadmaps")
          .select("*")
          .eq("id", id)
          .eq("user_id", user!.id)
          .single();
        if (!roadmap) return json({ error: "Roadmap not found" }, 404);
        if (req.method === "DELETE") {
          const { error: delErr } = await supabase.from("roadmaps").delete().eq("id", id).eq("user_id", user!.id);
          if (delErr) return json({ error: "Failed to delete roadmap" }, 500);
          return json({ success: true });
        }
        if (req.method === "PATCH") {
          const { title, description, status } = body as { title?: string; description?: string; status?: string };
          if (status === "active") {
            await supabase.from("roadmaps").update({ status: "inactive" }).eq("user_id", user!.id).neq("id", id);
          }
          const newTitle = title !== undefined ? title : roadmap.title;
          const newDescription = description !== undefined ? description : roadmap.description;
          const newStatus = status !== undefined ? status : (roadmap.status ?? "active");
          const { data: updated } = await supabase
            .from("roadmaps")
            .update({ title: newTitle, description: newDescription, status: newStatus, updated_at: new Date().toISOString() })
            .eq("id", id)
            .eq("user_id", user!.id)
            .select()
            .single();
          return json(updated ?? { success: true });
        }
        const { data: weeks } = await supabase
          .from("roadmap_weeks")
          .select("*")
          .eq("roadmap_id", roadmap.id)
          .order("week_number");
        const weeksWithCourses = await Promise.all(
          (weeks ?? []).map(async (w: { id: string }) => {
            const { data: courses } = await supabase.from("course_recommendations").select("*").eq("roadmap_week_id", w.id);
            const { data: q } = await supabase.from("quiz_results").select("score, total_questions").eq("roadmap_week_id", w.id).eq("user_id", user!.id).order("completed_at", { ascending: false }).limit(1);
            const lastQuiz = q?.[0];
            return {
              ...w,
              course_recommendations: courses ?? [],
              last_quiz_score: lastQuiz?.score ?? null,
              last_quiz_total: lastQuiz?.total_questions ?? null,
            };
          })
        );
        return json({ ...roadmap, roadmap_weeks: weeksWithCourses });
      }

      case "roadmap/active": {
        if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
        const { data: roadmap } = await supabase
          .from("roadmaps")
          .select("*")
          .eq("user_id", user!.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (!roadmap) return json(null);
        // Backfill profile.target_career from active roadmap when profile lacks it
        const targetRole = (roadmap as { target_role?: string }).target_role;
        if (targetRole?.trim()) {
          const { data: prof } = await supabase.from("profiles").select("target_career").eq("user_id", user!.id).single();
          const curTarget = (prof as { target_career?: string } | null)?.target_career;
          if (!curTarget?.trim()) {
            await supabase.from("profiles").update({ target_career: targetRole.trim().slice(0, 200), updated_at: new Date().toISOString() }).eq("user_id", user!.id);
          }
        }
        const { data: weeks } = await supabase
          .from("roadmap_weeks")
          .select("*")
          .eq("roadmap_id", roadmap.id)
          .order("week_number");
        const weeksWithCourses = await Promise.all(
          (weeks ?? []).map(async (w: { id: string }) => {
            const { data: courses } = await supabase.from("course_recommendations").select("*").eq("roadmap_week_id", w.id);
            const { data: q } = await supabase.from("quiz_results").select("score, total_questions").eq("roadmap_week_id", w.id).eq("user_id", user!.id).order("completed_at", { ascending: false }).limit(1);
            const lastQuiz = q?.[0];
            return {
              ...w,
              course_recommendations: courses ?? [],
              last_quiz_score: lastQuiz?.score ?? null,
              last_quiz_total: lastQuiz?.total_questions ?? null,
            };
          })
        );
        return json({ ...roadmap, roadmap_weeks: weeksWithCourses });
      }

      case "roadmap/weeks/complete": {
        if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
        const { weekId } = body as { weekId?: string };
        if (!weekId) return json({ error: "weekId required" }, 400);
        const { data: week } = await supabase
          .from("roadmap_weeks")
          .update({ is_completed: true, completed_at: new Date().toISOString() })
          .eq("id", weekId)
          .eq("user_id", user!.id)
          .select("roadmap_id")
          .single();
        const roadmapId = week?.roadmap_id;
        if (roadmapId) {
          const { data: allWeeks } = await supabase.from("roadmap_weeks").select("is_completed").eq("roadmap_id", roadmapId);
          const completed = (allWeeks ?? []).filter((w: { is_completed?: boolean }) => w.is_completed).length;
          const total = (allWeeks ?? []).length;
          const progress = total ? Math.round((completed / total) * 100) : 0;
          await supabase.from("roadmaps").update({ progress_percentage: progress }).eq("id", roadmapId).eq("user_id", user!.id);
        }
        const todayUtc = new Date().toISOString().slice(0, 10);
        await supabase.from("study_activity").insert({
          user_id: user!.id,
          activity_date: todayUtc,
          source: "week_complete",
          roadmap_week_id: weekId,
        });
        await updateStudyStreak(supabase, user!.id, todayUtc);
        if (roadmapId) {
          const { data: completedWeeks } = await supabase.from("roadmap_weeks").select("id").eq("roadmap_id", roadmapId).eq("user_id", user!.id).eq("is_completed", true);
          if ((completedWeeks ?? []).length === 1) await awardBadge(supabase, user!.id, "first_week");
        }
        return json({ success: true });
      }

      case "study-streak": {
        if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
        const { data: streak } = await supabase
          .from("study_streaks")
          .select("current_streak, longest_streak, last_activity_date")
          .eq("user_id", user!.id)
          .single();
        const { data: activityRows } = await supabase
          .from("study_activity")
          .select("activity_date")
          .eq("user_id", user!.id)
          .gte("activity_date", new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
          .order("activity_date", { ascending: false });
        const activityDates = [...new Set((activityRows ?? []).map((r: { activity_date?: string }) => r.activity_date).filter(Boolean))] as string[];
        return json({
          current_streak: (streak as { current_streak?: number })?.current_streak ?? 0,
          longest_streak: (streak as { longest_streak?: number })?.longest_streak ?? 0,
          last_activity_date: (streak as { last_activity_date?: string })?.last_activity_date ?? null,
          activity_dates: activityDates,
        });
      }

      case "study-activity": {
        if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
        const { minutes, date: activityDateParam, roadmap_week_id } = body as { minutes?: number; date?: string; roadmap_week_id?: string };
        const minMinutes = typeof minutes === "number" && minutes >= 1 ? minutes : 1;
        const todayUtc = new Date().toISOString().slice(0, 10);
        const activityDate = typeof activityDateParam === "string" && /^\d{4}-\d{2}-\d{2}$/.test(activityDateParam) ? activityDateParam : todayUtc;
        const weekId = typeof roadmap_week_id === "string" && roadmap_week_id.trim() && UUID_REGEX.test(roadmap_week_id.trim()) ? roadmap_week_id.trim() : null;
        // Verify week belongs to user if provided
        if (weekId) {
          const { data: week } = await supabase.from("roadmap_weeks").select("id").eq("id", weekId).eq("user_id", user!.id).single();
          if (!week) return json({ error: "Week not found" }, 404);
        }
        await supabase.from("study_activity").insert({
          user_id: user!.id,
          activity_date: activityDate,
          source: "study_session",
          study_minutes: minMinutes,
          roadmap_week_id: weekId || null,
        });
        await updateStudyStreak(supabase, user!.id, activityDate);
        return json({ success: true });
      }

      case "unsubscribe-email": {
        if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
        const token = url.searchParams.get("token")?.trim();
        if (!token || !UUID_REGEX.test(token)) {
          return new Response(
            `<html><body><p>Invalid or missing unsubscribe link.</p><p><a href="/">Go to Shyftcut</a></p></body></html>`,
            { status: 400, headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders } }
          );
        }
        const { data: prefs, error: findErr } = await supabase
          .from("notification_preferences")
          .select("user_id")
          .eq("unsubscribe_token", token)
          .single();
        if (findErr || !prefs) {
          return new Response(
            `<html><body><p>This unsubscribe link is invalid or already used.</p><p><a href="/">Go to Shyftcut</a></p></body></html>`,
            { status: 404, headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders } }
          );
        }
        await supabase
          .from("notification_preferences")
          .update({ email_reminders: false, updated_at: new Date().toISOString() })
          .eq("unsubscribe_token", token);
        return new Response(
          `<html><body><p>You've been unsubscribed from study reminder emails.</p><p>You can turn them back on in <a href="/profile">Profile &rarr; Study reminders</a>.</p><p><a href="/">Go to Shyftcut</a></p></body></html>`,
          { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders } }
        );
      }

      case "vapid-public": {
        if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
        const publicKey = Deno.env.get("VAPID_PUBLIC_KEY")?.trim();
        if (!publicKey) return json({ error: "Push not configured" }, 503);
        return json({ publicKey });
      }

      case "themes": {
        if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
        
        // Public endpoint - no auth required
        const { data: themes } = await supabase
          .from("theme_settings")
          .select("id, name, colors, is_default, description")
          .order("is_default", { ascending: false })
          .order("created_at", { ascending: false });
        
        return json({ themes: themes ?? [] });
      }

      case "events/track": {
        if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
        
        // Allow anonymous tracking (user may not be logged in)
        const eventData = body as {
          event_type?: string;
          event_name?: string;
          page_path?: string;
          referrer?: string;
          utm_source?: string;
          utm_medium?: string;
          utm_campaign?: string;
          utm_term?: string;
          utm_content?: string;
          device_type?: string;
          browser?: string;
          country?: string;
          session_id?: string;
          metadata?: Record<string, unknown>;
        };
        
        if (!eventData.event_type || !eventData.event_name || !eventData.page_path || !eventData.session_id) {
          return json({ error: "event_type, event_name, page_path, and session_id are required" }, 400);
        }
        
        // Insert event (user_id is nullable for anonymous users)
        const { error: insertError } = await supabase.from("user_events").insert({
          user_id: user?.id || null,
          event_type: eventData.event_type,
          event_name: eventData.event_name,
          page_path: eventData.page_path,
          referrer: eventData.referrer || null,
          utm_source: eventData.utm_source || null,
          utm_medium: eventData.utm_medium || null,
          utm_campaign: eventData.utm_campaign || null,
          utm_term: eventData.utm_term || null,
          utm_content: eventData.utm_content || null,
          device_type: eventData.device_type || null,
          browser: eventData.browser || null,
          country: eventData.country || null,
          session_id: eventData.session_id,
          metadata: eventData.metadata || {},
        });
        
        if (insertError) {
          logError("api", "events/track: failed to insert event", insertError);
          return json({ error: "Failed to track event" }, 500);
        }
        
        // Update or create session
        if (eventData.session_id) {
          const { data: existingSession } = await supabase
            .from("user_sessions")
            .select("id, page_count")
            .eq("session_id", eventData.session_id)
            .maybeSingle();
          
          if (existingSession) {
            // Update existing session
            await supabase
              .from("user_sessions")
              .update({
                page_count: (existingSession.page_count || 1) + 1,
                country: eventData.country || null,
                device_type: eventData.device_type || null,
                browser: eventData.browser || null,
              })
              .eq("id", existingSession.id);
          } else {
            // Create new session
            await supabase.from("user_sessions").insert({
              user_id: user?.id || null,
              session_id: eventData.session_id,
              referrer: eventData.referrer || null,
              utm_source: eventData.utm_source || null,
              utm_medium: eventData.utm_medium || null,
              utm_campaign: eventData.utm_campaign || null,
              utm_term: eventData.utm_term || null,
              utm_content: eventData.utm_content || null,
              device_type: eventData.device_type || null,
              browser: eventData.browser || null,
              country: eventData.country || null,
              page_count: 1,
            });
          }
        }
        
        return json({ success: true });
      }

      case "push-subscription": {
        if (req.method !== "POST" && req.method !== "DELETE") return json({ error: "Method not allowed" }, 405);
        const endpoint = typeof (body as { endpoint?: string }).endpoint === "string" ? (body as { endpoint: string }).endpoint.trim() : "";
        const p256dh = typeof (body as { keys?: { p256dh?: string } }).keys?.p256dh === "string" ? (body as { keys: { p256dh: string } }).keys.p256dh.trim() : (typeof (body as { p256dh?: string }).p256dh === "string" ? (body as { p256dh: string }).p256dh.trim() : "");
        const auth = typeof (body as { keys?: { auth?: string } }).keys?.auth === "string" ? (body as { keys: { auth: string } }).keys.auth.trim() : (typeof (body as { auth?: string }).auth === "string" ? (body as { auth: string }).auth.trim() : "");
        if (req.method === "POST") {
          if (!endpoint || !p256dh || !auth) return json({ error: "endpoint and keys (p256dh, auth) required" }, 400);
          const userAgent = typeof (body as { user_agent?: string }).user_agent === "string" ? (body as { user_agent: string }).user_agent.slice(0, 500) : null;
          await supabase.from("push_subscriptions").delete().eq("user_id", user!.id).eq("endpoint", endpoint);
          await supabase.from("push_subscriptions").insert({ user_id: user!.id, endpoint, p256dh, auth, user_agent: userAgent });
          return json({ success: true });
        }
        const delEndpoint = typeof (body as { endpoint?: string }).endpoint === "string" ? (body as { endpoint: string }).endpoint.trim() : null;
        if (delEndpoint) await supabase.from("push_subscriptions").delete().eq("user_id", user!.id).eq("endpoint", delEndpoint);
        else await supabase.from("push_subscriptions").delete().eq("user_id", user!.id);
        return json({ success: true });
      }

      case "notification-preferences": {
        if (req.method !== "GET" && req.method !== "PATCH") return json({ error: "Method not allowed" }, 405);
        const { data: existing } = await supabase
          .from("notification_preferences")
          .select("*")
          .eq("user_id", user!.id)
          .single();
        const defaults = {
          email_reminders: true,
          push_enabled: false,
          reminder_time: "20:00",
          timezone: "UTC",
          in_app_reminder: true,
        };
        if (req.method === "GET") {
          const prefs = existing ?? { user_id: user!.id, ...defaults };
          return json(prefs);
        }
        const b = body as Record<string, unknown>;
        const trimStr = (v: unknown): string | null => (v != null && String(v).trim() !== "" ? String(v).trim() : null);
        const emailReminders = typeof b.email_reminders === "boolean" ? b.email_reminders : (existing?.email_reminders ?? defaults.email_reminders);
        const pushEnabled = typeof b.push_enabled === "boolean" ? b.push_enabled : (existing?.push_enabled ?? defaults.push_enabled);
        const reminderTimeRaw = trimStr(b.reminder_time) ?? (existing?.reminder_time ?? defaults.reminder_time);
        const reminderTime = /^\d{1,2}:\d{2}$/.test(String(reminderTimeRaw)) ? String(reminderTimeRaw) : defaults.reminder_time;
        const timezone = trimStr(b.timezone) ?? (existing?.timezone ?? defaults.timezone) ?? "UTC";
        const inAppReminder = typeof b.in_app_reminder === "boolean" ? b.in_app_reminder : (existing?.in_app_reminder ?? defaults.in_app_reminder);
        const payload = {
          user_id: user!.id,
          email_reminders: emailReminders,
          push_enabled: pushEnabled,
          reminder_time: reminderTime,
          timezone: timezone,
          in_app_reminder: inAppReminder,
          updated_at: new Date().toISOString(),
        };
        const { data: updated, error } = await supabase
          .from("notification_preferences")
          .upsert(payload, { onConflict: "user_id" })
          .select()
          .single();
        if (error) throw error;
        return json(updated ?? payload);
      }

      case "community/peers": {
        if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
        const { data: sub } = await supabase.from("subscriptions").select("tier").eq("user_id", user!.id).single();
        const tier = (sub?.tier ?? "free") as string;
        if (!isPaidTier(tier)) return json({ error: "Community is for Premium subscribers." }, 402);
        const targetCareer = url.searchParams.get("target_career")?.trim() || null;
        const experienceLevel = url.searchParams.get("experience_level")?.trim() || null;
        const { data: paidSubs } = await supabase.from("subscriptions").select("user_id").in("tier", ["premium", "pro"]).eq("status", "active");
        const paidUserIds = new Set((paidSubs ?? []).map((s: { user_id: string }) => s.user_id));
        paidUserIds.delete(user!.id);
        const paidIds = Array.from(paidUserIds).slice(0, 500);
        if (paidIds.length === 0) {
          return json([]);
        }
        let query = supabase.from("profiles").select("user_id, display_name, avatar_url, job_title, target_career, experience_level, linkedin_url").in("user_id", paidIds);
        if (targetCareer) query = query.eq("target_career", targetCareer);
        if (experienceLevel) query = query.eq("experience_level", experienceLevel);
        const { data: profiles } = await query.limit(50);
        const userIds = (profiles ?? []).map((p: { user_id: string }) => p.user_id);
        const { data: streaks } = userIds.length ? await supabase.from("study_streaks").select("user_id, current_streak, longest_streak").in("user_id", userIds) : { data: [] };
        const streakMap = new Map((streaks ?? []).map((s: { user_id: string; current_streak?: number; longest_streak?: number }) => [s.user_id, { current_streak: s.current_streak ?? 0, longest_streak: s.longest_streak ?? 0 }]));
        const { data: conns } = await supabase.from("connections").select("target_user_id").eq("user_id", user!.id);
        const connectedSet = new Set((conns ?? []).map((c: { target_user_id: string }) => c.target_user_id));
        const peers = (profiles ?? []).map((p: { user_id: string; display_name?: string; avatar_url?: string; job_title?: string; target_career?: string; experience_level?: string; linkedin_url?: string }) => ({
          user_id: p.user_id,
          display_name: p.display_name ?? null,
          avatar_url: p.avatar_url ?? null,
          job_title: p.job_title ?? null,
          target_career: p.target_career ?? null,
          experience_level: p.experience_level ?? null,
          linkedin_url: p.linkedin_url ?? null,
          current_streak: streakMap.get(p.user_id)?.current_streak ?? 0,
          longest_streak: streakMap.get(p.user_id)?.longest_streak ?? 0,
          connected: connectedSet.has(p.user_id),
        }));
        return json(peers);
      }

      case "community/connections": {
        if (req.method !== "POST" && req.method !== "DELETE") return json({ error: "Method not allowed" }, 405);
        const { data: sub } = await supabase.from("subscriptions").select("tier").eq("user_id", user!.id).single();
        const tier = (sub?.tier ?? "free") as string;
        if (!isPaidTier(tier)) return json({ error: "Community is for Premium subscribers." }, 402);
        const targetUserId = (body as { target_user_id?: string }).target_user_id;
        if (!targetUserId || targetUserId === user!.id) return json({ error: "Invalid target_user_id" }, 400);
        if (req.method === "POST") {
          await supabase.from("connections").upsert({ user_id: user!.id, target_user_id: targetUserId }, { onConflict: "user_id,target_user_id" });
          return json({ success: true });
        }
        await supabase.from("connections").delete().eq("user_id", user!.id).eq("target_user_id", targetUserId);
        return json({ success: true });
      }

      case "community/leaderboard": {
        if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
        const { data: sub } = await supabase.from("subscriptions").select("tier").eq("user_id", user!.id).single();
        const tier = (sub?.tier ?? "free") as string;
        if (!isPaidTier(tier)) return json({ error: "Leaderboard is for Premium subscribers." }, 402);
        const period = url.searchParams.get("period") || "all";
        const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
        const { data: paidSubsLeaderboard } = await supabase.from("subscriptions").select("user_id").in("tier", ["premium", "pro"]).eq("status", "active");
        const paidUserIdsLeaderboard = new Set((paidSubsLeaderboard ?? []).map((s: { user_id: string }) => s.user_id));
        const paidIdsLeaderboard = paidUserIdsLeaderboard.size > 0 ? Array.from(paidUserIdsLeaderboard).slice(0, 500) : [];
        let streakQuery = supabase.from("study_streaks").select("user_id, current_streak, longest_streak, last_activity_date").order("current_streak", { ascending: false }).limit(Math.min(limit * 3, 300));
        if (paidIdsLeaderboard.length > 0) streakQuery = streakQuery.in("user_id", paidIdsLeaderboard);
        if (period === "week" || period === "month") {
          const cut = new Date();
          if (period === "week") cut.setDate(cut.getDate() - 7);
          else cut.setMonth(cut.getMonth() - 1);
          const cutStr = cut.toISOString().slice(0, 10);
          streakQuery = streakQuery.gte("last_activity_date", cutStr);
        }
        const { data: streakRows } = await streakQuery;
        const userIds = (streakRows ?? []).map((r: { user_id: string }) => r.user_id);
        const { data: profs } = userIds.length ? await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", userIds) : { data: [] };
        const profileMap = new Map((profs ?? []).map((p: { user_id: string; display_name?: string; avatar_url?: string }) => [p.user_id, p]));
        const leaderboard = (streakRows ?? []).map((r: { user_id: string; current_streak?: number; longest_streak?: number; last_activity_date?: string }, i: number) => {
          const prof = profileMap.get(r.user_id);
          return {
            rank: i + 1,
            user_id: r.user_id,
            display_name: prof?.display_name ?? null,
            avatar_url: prof?.avatar_url ?? null,
            current_streak: r.current_streak ?? 0,
            longest_streak: r.longest_streak ?? 0,
            last_activity_date: r.last_activity_date ?? null,
          };
        });
        return json(leaderboard);
      }

      case "community/groups": {
        const { data: sub } = await supabase.from("subscriptions").select("tier").eq("user_id", user!.id).single();
        const tier = (sub?.tier ?? "free") as string;
        if (!isPaidTier(tier)) return json({ error: "Study groups are for Premium subscribers." }, 402);
        const targetCareer = url.searchParams.get("target_career")?.trim() || null;
        const experienceLevel = url.searchParams.get("experience_level")?.trim() || null;
        if (req.method === "GET") {
          let q = supabase.from("study_groups").select("id, name, description, roadmap_id, target_career, experience_level, created_by_user_id, created_at");
          if (targetCareer) q = q.eq("target_career", targetCareer);
          if (experienceLevel) q = q.eq("experience_level", experienceLevel);
          const { data: groups, error } = await q.order("created_at", { ascending: false }).limit(50);
          if (error) throw error;
          const creatorIds = [...new Set((groups ?? []).map((g: { created_by_user_id: string }) => g.created_by_user_id))];
          const { data: creators } = creatorIds.length ? await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", creatorIds) : { data: [] };
          const creatorMap = new Map((creators ?? []).map((c: { user_id: string; display_name?: string; avatar_url?: string }) => [c.user_id, c]));
          const { data: memberCounts } = await supabase.from("study_group_members").select("group_id");
          const countMap = new Map<string, number>();
          for (const m of memberCounts ?? []) {
            const gid = (m as { group_id: string }).group_id;
            countMap.set(gid, (countMap.get(gid) ?? 0) + 1);
          }
          const { data: myMemberships } = await supabase.from("study_group_members").select("group_id").eq("user_id", user!.id);
          const myGroupIds = new Set((myMemberships ?? []).map((m: { group_id: string }) => m.group_id));
          const list = (groups ?? []).map((g: { id: string; name: string; description?: string; roadmap_id?: string; target_career?: string; experience_level?: string; created_by_user_id: string; created_at: string }) => {
            const creator = creatorMap.get(g.created_by_user_id);
            return {
              id: g.id,
              name: g.name,
              description: g.description ?? null,
              roadmap_id: g.roadmap_id ?? null,
              target_career: g.target_career ?? null,
              experience_level: g.experience_level ?? null,
              created_by_user_id: g.created_by_user_id,
              created_at: g.created_at,
              creator_name: creator?.display_name ?? null,
              creator_avatar: creator?.avatar_url ?? null,
              member_count: countMap.get(g.id) ?? 0,
              is_member: myGroupIds.has(g.id),
            };
          });
          return json(list);
        }
        if (req.method === "POST") {
          const name = typeof (body as { name?: string }).name === "string" ? String((body as { name: string }).name).trim() : "";
          if (!name || name.length > 200) return json({ error: "Group name is required (max 200 characters)" }, 400);
          const description = typeof (body as { description?: string }).description === "string" ? String((body as { description: string }).description).trim().slice(0, 1000) : null;
          const modEnabled = Deno.env.get("COMMUNITY_MODERATION_ENABLED") !== "false";
          if (modEnabled) {
            const groupText = name + "\n\n" + (description ?? "");
            const mod = await moderateContent(groupText);
            if (!mod.allowed) {
              return json({
                error: "Group name or description not allowed",
                reason: mod.reason ?? "Content violates community guidelines.",
              }, 400);
            }
          }
          const roadmapId = typeof (body as { roadmap_id?: string }).roadmap_id === "string" && UUID_REGEX.test((body as { roadmap_id: string }).roadmap_id) ? (body as { roadmap_id: string }).roadmap_id : null;
          const targetCareerBody = typeof (body as { target_career?: string }).target_career === "string" ? String((body as { target_career: string }).target_career).trim().slice(0, 200) : null;
          const experienceLevelBody = typeof (body as { experience_level?: string }).experience_level === "string" ? String((body as { experience_level: string }).experience_level).trim().slice(0, 100) : null;
          const { data: inserted, error } = await supabase.from("study_groups").insert({
            name,
            description,
            roadmap_id: roadmapId,
            target_career: targetCareerBody,
            experience_level: experienceLevelBody,
            created_by_user_id: user!.id,
          }).select("id, name, description, created_by_user_id, created_at").single();
          if (error) throw error;
          await supabase.from("study_group_members").insert({ group_id: inserted.id, user_id: user!.id, role: "admin" });
          return json(inserted);
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "community/groups/top-by-streak": {
        if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
        const { data: sub } = await supabase.from("subscriptions").select("tier").eq("user_id", user!.id).single();
        if (!isPaidTier((sub?.tier ?? "free") as string)) return json({ error: "Study groups are for Premium subscribers." }, 402);
        const limit = Math.min(20, Math.max(1, parseInt(url.searchParams.get("limit") || "10", 10)));
        const todayUtc = new Date().toISOString().slice(0, 10);
        const { data: groups } = await supabase.from("study_groups").select("id, name").limit(100);
        const { data: allMembers } = await supabase.from("study_group_members").select("group_id, user_id");
        const groupMembers = new Map<string, string[]>();
        for (const m of allMembers ?? []) {
          const gid = (m as { group_id: string }).group_id;
          const uid = (m as { user_id: string }).user_id;
          if (!groupMembers.has(gid)) groupMembers.set(gid, []);
          groupMembers.get(gid)!.push(uid);
        }
        const allUserIds = [...new Set((allMembers ?? []).map((m: { user_id: string }) => m.user_id))];
        const daysBack = 60;
        const startDate = new Date(todayUtc + "T12:00:00Z");
        startDate.setUTCDate(startDate.getUTCDate() - daysBack);
        const startStr = startDate.toISOString().slice(0, 10);
        const { data: activityRows } = allUserIds.length
          ? await supabase.from("study_activity").select("user_id, activity_date").in("user_id", allUserIds).gte("activity_date", startStr).lte("activity_date", todayUtc)
          : { data: [] };
        const userDates = new Map<string, Set<string>>();
        for (const r of activityRows ?? []) {
          const uid = (r as { user_id: string }).user_id;
          const d = (r as { activity_date: string }).activity_date;
          if (!userDates.has(uid)) userDates.set(uid, new Set());
          userDates.get(uid)!.add(d);
        }
        const results: { id: string; name: string; member_count: number; group_streak: number }[] = [];
        for (const g of groups ?? []) {
          const memberIds = groupMembers.get((g as { id: string }).id) ?? [];
          if (memberIds.length === 0) continue;
          let streak = 0;
          let d = todayUtc;
          for (let i = 0; i < daysBack; i++) {
            const studied = memberIds.every((uid) => userDates.get(uid)?.has(d));
            if (!studied) break;
            streak++;
            d = prevDay(d);
          }
          results.push({
            id: (g as { id: string }).id,
            name: (g as { name: string }).name,
            member_count: memberIds.length,
            group_streak: streak,
          });
        }
        results.sort((a, b) => b.group_streak - a.group_streak);
        return json(results.slice(0, limit));
      }

      case "community/groups/id": {
        const { data: sub } = await supabase.from("subscriptions").select("tier").eq("user_id", user!.id).single();
        if (!isPaidTier((sub?.tier ?? "free") as string)) return json({ error: "Study groups are for Premium subscribers." }, 402);
        const groupId = pathSegments[2];
        if (!groupId) return json({ error: "Group ID required" }, 400);
        if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
        const { data: group, error } = await supabase.from("study_groups").select("*").eq("id", groupId).single();
        if (error || !group) return json({ error: "Group not found" }, 404);
        const { data: members } = await supabase.from("study_group_members").select("user_id, role, joined_at").eq("group_id", groupId);
        const userIds = (members ?? []).map((m: { user_id: string }) => m.user_id);
        const { data: profs } = userIds.length ? await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", userIds) : { data: [] };
        const profileMap = new Map((profs ?? []).map((p: { user_id: string; display_name?: string; avatar_url?: string }) => [p.user_id, p]));
        const membersWithProfiles = (members ?? []).map((m: { user_id: string; role: string; joined_at: string }) => ({
          user_id: m.user_id,
          role: m.role,
          joined_at: m.joined_at,
          display_name: profileMap.get(m.user_id)?.display_name ?? null,
          avatar_url: profileMap.get(m.user_id)?.avatar_url ?? null,
        }));
        return json({ ...group, members: membersWithProfiles });
      }

      case "community/groups/join": {
        const { data: sub } = await supabase.from("subscriptions").select("tier").eq("user_id", user!.id).single();
        if (!isPaidTier((sub?.tier ?? "free") as string)) return json({ error: "Study groups are for Premium subscribers." }, 402);
        const groupId = pathSegments[2];
        if (!groupId) return json({ error: "Group ID required" }, 400);
        const { error } = await supabase.from("study_group_members").upsert({ group_id: groupId, user_id: user!.id, role: "member" }, { onConflict: "group_id,user_id" });
        if (error) throw error;
        await awardBadge(supabase, user!.id, "group_member");
        return json({ success: true });
      }

      case "community/groups/leave": {
        const { data: sub } = await supabase.from("subscriptions").select("tier").eq("user_id", user!.id).single();
        if (!isPaidTier((sub?.tier ?? "free") as string)) return json({ error: "Study groups are for Premium subscribers." }, 402);
        const groupId = pathSegments[2];
        if (!groupId) return json({ error: "Group ID required" }, 400);
        await supabase.from("study_group_members").delete().eq("group_id", groupId).eq("user_id", user!.id);
        return json({ success: true });
      }

      case "community/groups/members": {
        if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
        const { data: sub } = await supabase.from("subscriptions").select("tier").eq("user_id", user!.id).single();
        if (!isPaidTier((sub?.tier ?? "free") as string)) return json({ error: "Study groups are for Premium subscribers." }, 402);
        const groupId = pathSegments[2];
        if (!groupId) return json({ error: "Group ID required" }, 400);
        const { data: members } = await supabase.from("study_group_members").select("user_id, role, joined_at").eq("group_id", groupId);
        const userIds = (members ?? []).map((m: { user_id: string }) => m.user_id);
        const { data: profs } = userIds.length ? await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", userIds) : { data: [] };
        const profileMap = new Map((profs ?? []).map((p: { user_id: string; display_name?: string; avatar_url?: string }) => [p.user_id, p]));
        const list = (members ?? []).map((m: { user_id: string; role: string; joined_at: string }) => ({
          user_id: m.user_id,
          role: m.role,
          joined_at: m.joined_at,
          display_name: profileMap.get(m.user_id)?.display_name ?? null,
          avatar_url: profileMap.get(m.user_id)?.avatar_url ?? null,
        }));
        return json(list);
      }

      case "community/chat/room": {
        const { data: sub } = await supabase.from("subscriptions").select("tier").eq("user_id", user!.id).single();
        if (!isPaidTier((sub?.tier ?? "free") as string)) return json({ error: "Chat is for Premium subscribers." }, 402);
        const studyGroupId = pathSegments[3];
        if (!studyGroupId) return json({ error: "Study group ID required" }, 400);
        const { data: member } = await supabase.from("study_group_members").select("user_id").eq("group_id", studyGroupId).eq("user_id", user!.id).single();
        if (!member) return json({ error: "You must be a member of this group to access chat" }, 403);
        let { data: room } = await supabase.from("chat_rooms").select("id").eq("study_group_id", studyGroupId).single();
        if (!room) {
          const { data: inserted, error } = await supabase.from("chat_rooms").insert({ study_group_id: studyGroupId }).select("id").single();
          if (error) throw error;
          room = inserted;
        }
        return json({ room_id: (room as { id: string }).id });
      }

      case "community/chat/messages": {
        const { data: sub } = await supabase.from("subscriptions").select("tier").eq("user_id", user!.id).single();
        if (!isPaidTier((sub?.tier ?? "free") as string)) return json({ error: "Chat is for Premium subscribers." }, 402);
        const roomId = pathSegments[3];
        if (!roomId) return json({ error: "Room ID required" }, 400);
        const { data: room } = await supabase.from("chat_rooms").select("study_group_id").eq("id", roomId).single();
        if (!room?.study_group_id) return json({ error: "Room not found" }, 404);
        const { data: member } = await supabase.from("study_group_members").select("user_id").eq("group_id", room.study_group_id).eq("user_id", user!.id).single();
        if (!member) return json({ error: "You must be a member of this group to access chat" }, 403);
        if (req.method === "GET") {
          const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));
          const { data: messages, error } = await supabase.from("chat_messages").select("id, room_id, user_id, body, created_at").eq("room_id", roomId).order("created_at", { ascending: true }).limit(limit);
          if (error) throw error;
          const userIds = [...new Set((messages ?? []).map((m: { user_id: string }) => m.user_id))];
          const { data: profs } = userIds.length ? await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", userIds) : { data: [] };
          const profileMap = new Map((profs ?? []).map((p: { user_id: string; display_name?: string; avatar_url?: string }) => [p.user_id, p]));
          const list = (messages ?? []).map((m: { id: string; room_id: string; user_id: string; body: string; created_at: string }) => ({
            id: m.id,
            room_id: m.room_id,
            user_id: m.user_id,
            body: m.body,
            created_at: m.created_at,
            display_name: profileMap.get(m.user_id)?.display_name ?? null,
            avatar_url: profileMap.get(m.user_id)?.avatar_url ?? null,
          }));
          return json(list);
        }
        if (req.method === "POST") {
          const bodyText = typeof (body as { body?: string }).body === "string" ? String((body as { body: string }).body).trim().slice(0, 4000) : "";
          if (!bodyText) return json({ error: "Message body required" }, 400);
          const modEnabled = Deno.env.get("COMMUNITY_MODERATION_ENABLED") !== "false";
          if (modEnabled) {
            const mod = await moderateContent(bodyText);
            if (!mod.allowed) {
              return json({
                error: "Message not allowed",
                reason: mod.reason ?? "Content violates community guidelines.",
              }, 400);
            }
          }
          const { data: inserted, error } = await supabase.from("chat_messages").insert({ room_id: roomId, user_id: user!.id, body: bodyText }).select("id, room_id, user_id, body, created_at").single();
          if (error) throw error;
          return json(inserted);
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "community/badges": {
        if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
        const { data: badges, error } = await supabase.from("badges").select("id, name, description, criteria").order("id");
        if (error) throw error;
        return json(badges ?? []);
      }

      case "community/me/badges": {
        if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
        const { data: rows, error } = await supabase.from("user_badges").select("badge_id, earned_at").eq("user_id", user!.id);
        if (error) throw error;
        const badgeIds = (rows ?? []).map((r: { badge_id: string }) => r.badge_id);
        const { data: badgeDetails } = badgeIds.length ? await supabase.from("badges").select("id, name, description").in("id", badgeIds) : { data: [] };
        const detailMap = new Map((badgeDetails ?? []).map((b: { id: string; name: string; description?: string }) => [b.id, b]));
        const list = (rows ?? []).map((r: { badge_id: string; earned_at: string }) => ({
          badge_id: r.badge_id,
          earned_at: r.earned_at,
          name: detailMap.get(r.badge_id)?.name ?? r.badge_id,
          description: detailMap.get(r.badge_id)?.description ?? null,
        }));
        return json(list);
      }

      case "contact": {
        if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
        const ip = getClientIp(req);
        if (!checkPublicRateLimit(`contact:${ip}`, CONTACT_RATE_LIMIT_MAX)) return json({ error: "Too many requests. Try again in 15 minutes." }, 429);
        const name = typeof body.name === "string" ? body.name.trim() : "";
        const email = typeof body.email === "string" ? body.email.trim() : "";
        const phone = typeof body.phone === "string" ? body.phone.trim() : null;
        const phoneCountryCodeRaw = typeof body.phoneCountryCode === "string" ? body.phoneCountryCode.trim() : "";
        const phoneCountryCode = /^[A-Z]{2}$/i.test(phoneCountryCodeRaw) ? phoneCountryCodeRaw.toUpperCase().slice(0, 2) : null;
        const company = typeof body.company === "string" ? body.company.trim() : null;
        const topicRaw = typeof body.topic === "string" ? body.topic.trim().toLowerCase() : "";
        const allowedTopics = ["general", "sales", "support", "partnership", "feedback", "other"];
        const topic = allowedTopics.includes(topicRaw) ? topicRaw : "general";
        const subject = typeof body.subject === "string" ? body.subject.trim() : "";
        const message = typeof body.message === "string" ? body.message.trim() : "";
        if (!name || name.length > 100) return json({ error: "Name is required (max 100 characters)" }, 400);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) return json({ error: "Valid email required (max 255 characters)" }, 400);
        if (phone !== null && phone.length > 30) return json({ error: "Phone max 30 characters" }, 400);
        if (company !== null && company.length > 150) return json({ error: "Company max 150 characters" }, 400);
        if (!subject || subject.length > 200) return json({ error: "Subject is required (max 200 characters)" }, 400);
        if (message.length < 10 || message.length > 2000) return json({ error: "Message must be 10–2000 characters" }, 400);
        const { error: insertErr } = await supabase.from("contact_requests").insert({
          name,
          email,
          phone: phone || null,
          phone_country_code: phoneCountryCode,
          company: company || null,
          topic,
          subject,
          message,
        });
        if (insertErr) {
          logError("api", "contact: insert contact_requests failed", insertErr);
          return json({ error: "Failed to submit. Please try again." }, 500);
        }
        const CONTACT_TO_EMAIL = Deno.env.get("CONTACT_TO_EMAIL") ?? "support@shyftcut.com";
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "onboarding@resend.dev";
        const phoneLine = phone ? `<p><strong>Phone:</strong> ${phone}</p>` : "";
        const companyLine = company ? `<p><strong>Company:</strong> ${company}</p>` : "";
        const topicLabel = topic.charAt(0).toUpperCase() + topic.slice(1);
        if (RESEND_API_KEY) {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
            body: JSON.stringify({
              from: FROM_EMAIL,
              to: CONTACT_TO_EMAIL,
              reply_to: email,
              subject: `[Contact · ${topicLabel}] ${subject}`,
              html: `<p><strong>From:</strong> ${name} &lt;${email}&gt;</p>${phoneLine}${companyLine}<p><strong>Topic:</strong> ${topicLabel}</p><p><strong>Subject:</strong> ${subject}</p><hr /><p>${message.replace(/\n/g, "<br />")}</p>`,
            }),
          });
          if (!res.ok) return json({ error: "Failed to send message. Please try again." }, 500);
        }
        return json({ ok: true });
      }

      case "support": {
        if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
        if (!checkPublicRateLimit(`support:${user!.id}`, SUPPORT_RATE_LIMIT_MAX)) return json({ error: "Too many requests. Try again in 15 minutes." }, 429);
        const subject = typeof body.subject === "string" ? body.subject.trim() : "";
        const message = typeof body.message === "string" ? body.message.trim() : "";
        if (!subject || subject.length > 200) return json({ error: "Subject is required (max 200 characters)" }, 400);
        if (message.length < 10 || message.length > 2000) return json({ error: "Message must be 10–2000 characters" }, 400);
        const email = (user!.email ?? "").trim() || "";
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Valid account email required" }, 400);
        const { data: sub } = await supabase.from("subscriptions").select("tier").eq("user_id", user!.id).single();
        const tier = (sub?.tier ?? "free") as string;
        const priority = isPaidTier(tier) ? "premium" : "free";
        const { error: insertErr } = await supabase.from("support_requests").insert({
          user_id: user!.id,
          email,
          subject,
          message,
          priority,
          status: "open",
        });
        if (insertErr) return json({ error: "Failed to submit support request. Please try again." }, 500);
        const CONTACT_TO_EMAIL = Deno.env.get("CONTACT_TO_EMAIL") ?? "support@shyftcut.com";
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "onboarding@resend.dev";
        if (RESEND_API_KEY) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
            body: JSON.stringify({
              from: FROM_EMAIL,
              to: CONTACT_TO_EMAIL,
              reply_to: email,
              subject: `[Support${priority === "premium" ? " · Priority" : ""}] ${subject}`,
              html: `<p><strong>From:</strong> ${email} (${priority})</p><p><strong>Subject:</strong> ${subject}</p><hr /><p>${message.replace(/\n/g, "<br />")}</p>`,
            }),
          });
        }
        return json({ ok: true });
      }

      case "newsletter": {
        if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
        const ip = getClientIp(req);
        if (!checkPublicRateLimit(`newsletter:${ip}`, NEWSLETTER_RATE_LIMIT_MAX)) return json({ error: "Too many requests. Try again in 15 minutes." }, 429);
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) return json({ error: "Valid email required" }, 400);
        const { error: insertErr } = await supabase.from("newsletter_subscribers").insert({ email });
        if (insertErr) {
          if (insertErr.code === "23505") return json({ error: "Already subscribed" }, 400);
          throw insertErr;
        }
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "onboarding@resend.dev";
        if (RESEND_API_KEY) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
            body: JSON.stringify({
              from: FROM_EMAIL,
              to: email,
              subject: "You're subscribed – Shyftcut",
              html: "<p>Thanks for subscribing! You'll get career tips and Shyftcut updates.</p><p>— The Shyftcut team</p>",
            }),
          });
        }
        return json({ ok: true });
      }

      case "checkout/create": {
        if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
        const polarAccessToken = Deno.env.get("POLAR_ACCESS_TOKEN");
        if (!polarAccessToken) {
          logError("api", "checkout/create: POLAR_ACCESS_TOKEN not set", undefined);
          return json({ error: "Payment system not configured. Please try again later." }, 503);
        }
        try {
        await ensureProfileAndSubscription(supabase, user!.id, user!.email, user!.user_metadata?.display_name as string | undefined);
        const { planId, productId, successUrl, returnUrl, metadata: bodyMetadata } = body as { planId?: string; productId?: string; priceId?: string; successUrl?: string; returnUrl?: string; cancelUrl?: string; metadata?: Record<string, string> };
        const productIdStr = typeof productId === "string" && productId.trim() ? productId.trim() : null;
        if (!productIdStr) return json({ error: "productId is required" }, 400);
        const origin = req.headers.get("origin") || req.headers.get("referer") || "";
        let baseUrl = "https://shyftcut.com";
        if (origin) {
          try {
            baseUrl = new URL(origin).origin;
          } catch {
            // Invalid origin/referer, use default
            baseUrl = "https://shyftcut.com";
          }
        }
        const isSameOrigin = (urlStr: string): boolean => {
          try {
            const u = new URL(urlStr);
            const base = new URL(baseUrl);
            return u.origin === base.origin;
          } catch {
            return false;
          }
        };
        let successUrlStr = typeof successUrl === "string" && successUrl.trim() ? successUrl.trim() : undefined;
        let returnUrlStr = typeof returnUrl === "string" && returnUrl.trim() ? returnUrl.trim() : undefined;
        if (successUrlStr && !isSameOrigin(successUrlStr)) {
          successUrlStr = undefined;
        }
        if (returnUrlStr && !isSameOrigin(returnUrlStr)) {
          returnUrlStr = undefined;
        }
        const { data: sub, error: subSelectErr } = await supabase.from("subscriptions").select("polar_customer_id").eq("user_id", user!.id).single();
        if (subSelectErr && subSelectErr.code !== "PGRST116") {
          logError("api", "checkout/create: subscriptions select failed", new Error(subSelectErr.message));
          return json({ error: "Unable to load subscription. Please try again." }, 500);
        }
        let polarCustomerId = sub?.polar_customer_id ?? null;
        const userEmail = user!.email?.trim() || undefined;
        if (!polarCustomerId && userEmail) {
          const customerRes = await fetch("https://api.polar.sh/v1/customers", {
            method: "POST",
            headers: { Authorization: `Bearer ${polarAccessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ email: userEmail, external_id: user!.id, metadata: { user_id: user!.id } }),
          });
          const customerText = await customerRes.text();
          if (customerRes.ok) {
            try {
              const customer = (customerText ? JSON.parse(customerText) : {}) as { id?: string };
              if (customer?.id) {
                polarCustomerId = customer.id;
                const { error: updateErr } = await supabase.from("subscriptions").update({ polar_customer_id: polarCustomerId }).eq("user_id", user!.id);
                if (updateErr) logError("api", "checkout/create: subscriptions update polar_customer_id failed", new Error(updateErr.message));
              }
            } catch {
              logError("api", "checkout/create: customer parse error", new Error(customerText?.slice(0, 200)));
            }
          } else {
            logError("api", "checkout/create: Polar customers API error", new Error(`${customerRes.status} ${customerText?.slice(0, 300)}`));
          }
        }
        if (!polarCustomerId && !userEmail) {
          return json({ error: "Email required for checkout. Add an email to your account." }, 400);
        }
        const checkoutMetadata: Record<string, unknown> = { user_id: user!.id, plan_id: planId ?? undefined };
        if (bodyMetadata?.from) checkoutMetadata.from = bodyMetadata.from;
        if (bodyMetadata?.career_dna_result_id) checkoutMetadata.career_dna_result_id = bodyMetadata.career_dna_result_id;
        if (bodyMetadata?.affonso_referral) checkoutMetadata.affonso_referral = bodyMetadata.affonso_referral;
        const checkoutPayload: Record<string, unknown> = {
          products: [productIdStr],
          success_url: successUrlStr ?? `${baseUrl}/checkout/success`,
          return_url: returnUrlStr ?? `${baseUrl}/upgrade`,
          metadata: checkoutMetadata,
        };
        const careerDnaDiscountId = Deno.env.get("CAREER_DNA_DISCOUNT_ID");
        if (bodyMetadata?.from === "careerdna" && careerDnaDiscountId) {
          checkoutPayload.discount_id = careerDnaDiscountId;
        }
        if (polarCustomerId) checkoutPayload.customer_id = polarCustomerId;
        else checkoutPayload.customer_email = userEmail;
        
        // Make Polar API call with timeout and error handling
        let checkoutRes: Response;
        let responseText: string;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
          checkoutRes = await fetch("https://api.polar.sh/v1/checkouts", {
          method: "POST",
          headers: { Authorization: `Bearer ${polarAccessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify(checkoutPayload),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          responseText = await checkoutRes.text();
        } catch (fetchError) {
          const isTimeout = fetchError instanceof Error && (fetchError.name === "AbortError" || fetchError.message.includes("timeout"));
          logError("api", "checkout/create: Polar API fetch failed", fetchError);
          return json(
            { error: isTimeout ? "Request timed out. Please try again." : "Failed to connect to payment provider. Please try again." },
            502
          );
        }
        if (!checkoutRes.ok) {
          let errMessage = "Failed to create checkout session";
          try {
            const errJson = responseText ? (JSON.parse(responseText) as { detail?: string | unknown[]; message?: string }) : {};
            if (typeof errJson.message === "string" && errJson.message) errMessage = errJson.message;
            else if (typeof errJson.detail === "string") errMessage = errJson.detail;
            else if (Array.isArray(errJson.detail) && errJson.detail.length > 0) {
              const first = errJson.detail[0];
              errMessage = typeof first === "object" && first !== null && "msg" in first ? String((first as { msg?: string }).msg) : String(first);
            }
          } catch {
            /* use default */
          }
          logError("api", "checkout/create: Polar checkouts API error", new Error(`${checkoutRes.status} ${errMessage} | ${responseText?.slice(0, 200)}`));
          const polarStatus = checkoutRes.status;
          if (polarStatus === 401 || polarStatus === 403) {
            // Return 401/403 to client, not 502, so they know it's an auth issue
            return json(
              { error: "Payment provider authentication failed. Please try again later or contact support.", code: "polar_auth" },
              polarStatus
            );
          }
          const status = polarStatus >= 500 ? 502 : polarStatus >= 400 ? polarStatus : 500;
          return json({ error: errMessage }, status);
        }
        let checkout: { url?: string; checkout?: { url?: string } };
        try {
          checkout = responseText ? (JSON.parse(responseText) as { url?: string; checkout?: { url?: string } }) : {};
        } catch (e) {
          logError("api", "checkout/create: invalid checkout response JSON", e);
          return json({ error: "Invalid response from payment provider" }, 502);
        }
        const checkoutUrl = checkout?.url ?? checkout?.checkout?.url ?? null;
        if (!checkoutUrl) {
          logError("api", "checkout/create: Polar response missing url", new Error(responseText?.slice(0, 200)));
          return json({ error: "Checkout URL not returned. Please try again." }, 502);
        }
          return json({ checkoutUrl });
        } catch (e) {
          logError("api", "checkout/create: unhandled error", e);
          const errorMessage = e instanceof Error ? e.message : String(e);
          console.error("[checkout/create] Unhandled error:", errorMessage, e);
          return json({ error: "Failed to create checkout. Please try again." }, 502);
        }
      }

      case "checkout/portal": {
        if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
        const polarAccessToken = Deno.env.get("POLAR_ACCESS_TOKEN");
        if (!polarAccessToken) return json({ error: "Payment system not configured" }, 500);
        const returnUrl = url.searchParams.get("returnUrl") ?? req.headers.get("referer") ?? "/profile";
        const { data: sub } = await supabase.from("subscriptions").select("polar_customer_id").eq("user_id", user!.id).single();
        const polarCustomerId = sub?.polar_customer_id;
        if (!polarCustomerId) return json({ error: "No subscription found. Subscribe first to manage your plan." }, 404);
        const sessionRes = await fetch("https://api.polar.sh/v1/customer-sessions", {
          method: "POST",
          headers: { Authorization: `Bearer ${polarAccessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ customer_id: polarCustomerId, return_url: returnUrl }),
        });
        if (!sessionRes.ok) return json({ error: "Failed to create customer portal session" }, 500);
        const session = (await sessionRes.json()) as { customer_portal_url?: string };
        return json({ url: session.customer_portal_url });
      }

      case "courses/refresh-metadata": {
        if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
        const { course_id } = body as { course_id?: string };
        if (!course_id) return json({ error: "course_id required" }, 400);
        
        // Get course with URL
        const { data: course, error: fetchError } = await supabase
          .from("course_recommendations")
          .select("id, url")
          .eq("id", course_id)
          .eq("user_id", user!.id)
          .single();
        
        if (fetchError || !course) return json({ error: "Course not found" }, 404);
        if (!course.url || !isValidCourseUrl(course.url) || !isAllowedCourseHost(course.url)) {
          return json({ error: "Course URL is invalid or not from an allowed platform" }, 400);
        }
        
        // Enrich metadata
        await enrichCourseMetadata(supabase, course.id, course.url);
        
        // Return updated course
        const { data: updatedCourse } = await supabase
          .from("course_recommendations")
          .select("*")
          .eq("id", course_id)
          .eq("user_id", user!.id)
          .single();
        
        return json(updatedCourse || course);
      }

      case "courses/id": {
        if (req.method !== "PATCH") return json({ error: "Method not allowed" }, 405);
        const id = pathSegments[1] ?? url.searchParams.get("id") ?? (body.id as string);
        if (!id) return json({ error: "id required" }, 400);
        const { is_saved, is_completed } = body as { is_saved?: boolean; is_completed?: boolean };
        const updates: Record<string, unknown> = {};
        if (is_saved !== undefined) updates.is_saved = is_saved;
        if (is_completed !== undefined) updates.is_completed = is_completed;
        if (Object.keys(updates).length > 0) {
          const { error } = await supabase.from("course_recommendations").update(updates).eq("id", id).eq("user_id", user!.id);
          if (error) throw error;
        }
        const { data: course } = await supabase.from("course_recommendations").select("*").eq("id", id).eq("user_id", user!.id).single();
        if (!course) return json({ error: "Course not found" }, 404);
        return json(course);
      }

      case "notes": {
        if (req.method === "GET") {
          const roadmapWeekId = url.searchParams.get("roadmap_week_id") ?? undefined;
          let q = supabase.from("notes").select("*").eq("user_id", user!.id).order("updated_at", { ascending: false });
          if (roadmapWeekId) q = q.eq("roadmap_week_id", roadmapWeekId);
          const { data, error } = await q;
          if (error) throw error;
          return json(data ?? []);
        }
        if (req.method === "POST") {
          const { data: sub } = await supabase.from("subscriptions").select("tier").eq("user_id", user!.id).single();
          const tier = (sub?.tier ?? "free") as string;
          if (!isPaidTier(tier)) {
            const { count: notesCount } = await supabase.from("notes").select("*", { count: "exact", head: true }).eq("user_id", user!.id);
            if ((notesCount ?? 0) >= NOTES_LIMIT_FREE) {
              return json({ error: "Notes limit reached. Upgrade for unlimited notes.", limit_code: "notes_limit" }, 402);
            }
          }
          const { roadmap_week_id, course_recommendation_id, title, content } = body as { roadmap_week_id?: string; course_recommendation_id?: string; title?: string; content?: string };
          const titleStr = trimStr(title ?? "", 500);
          const { data, error } = await supabase
            .from("notes")
            .insert({
              user_id: user!.id,
              roadmap_week_id: roadmap_week_id || null,
              course_recommendation_id: course_recommendation_id || null,
              title: titleStr,
              content: trimStr(content ?? "", 50000),
            })
            .select()
            .single();
          if (error) throw error;
          return json(data);
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "notes/id": {
        const noteId = pathSegments[1];
        if (!noteId) return json({ error: "Note id required" }, 400);
        if (req.method === "PATCH") {
          const { title, content, roadmap_week_id, course_recommendation_id } = body as { title?: string; content?: string; roadmap_week_id?: string; course_recommendation_id?: string };
          const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
          if (title !== undefined) updates.title = trimStr(title, 500);
          if (content !== undefined) updates.content = trimStr(content, 50000);
          if (roadmap_week_id !== undefined) updates.roadmap_week_id = roadmap_week_id || null;
          if (course_recommendation_id !== undefined) updates.course_recommendation_id = course_recommendation_id || null;
          const { data, error } = await supabase.from("notes").update(updates).eq("id", noteId).eq("user_id", user!.id).select().single();
          if (error) throw error;
          return json(data);
        }
        if (req.method === "DELETE") {
          const { error } = await supabase.from("notes").delete().eq("id", noteId).eq("user_id", user!.id);
          if (error) throw error;
          return json({ success: true });
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "tasks": {
        if (req.method === "GET") {
          const roadmapWeekId = url.searchParams.get("roadmap_week_id") ?? undefined;
          let q = supabase.from("tasks").select("*").eq("user_id", user!.id).order("created_at", { ascending: true });
          if (roadmapWeekId) q = q.eq("roadmap_week_id", roadmapWeekId);
          const { data, error } = await q;
          if (error) throw error;
          return json(data ?? []);
        }
        if (req.method === "POST") {
          const { data: sub } = await supabase.from("subscriptions").select("tier").eq("user_id", user!.id).single();
          const tier = (sub?.tier ?? "free") as string;
          if (!isPaidTier(tier)) {
            const { count: tasksCount } = await supabase.from("tasks").select("*", { count: "exact", head: true }).eq("user_id", user!.id);
            if ((tasksCount ?? 0) >= TASKS_LIMIT_FREE) {
              return json({ error: "Tasks limit reached. Upgrade for unlimited tasks.", limit_code: "tasks_limit" }, 402);
            }
          }
          const { roadmap_week_id, course_recommendation_id, title, notes, due_date, source } = body as { roadmap_week_id?: string; course_recommendation_id?: string; title?: string; notes?: string; due_date?: string; source?: "user" | "ai" };
          const titleStr = trimStr(title ?? "", 500);
          if (!titleStr) return json({ error: "title required" }, 400);
          const taskSource = source === "ai" ? "ai" : "user";
          const { data, error } = await supabase
            .from("tasks")
            .insert({
              user_id: user!.id,
              roadmap_week_id: roadmap_week_id || null,
              course_recommendation_id: course_recommendation_id || null,
              title: titleStr,
              notes: trimStr(notes ?? "", 5000),
              due_date: due_date || null,
              source: taskSource,
            })
            .select()
            .single();
          if (error) throw error;
          return json(data);
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "tasks/id": {
        const taskId = pathSegments[1];
        if (!taskId) return json({ error: "Task id required" }, 400);
        if (req.method === "PATCH") {
          const { title, notes, due_date, completed, roadmap_week_id, course_recommendation_id } = body as { title?: string; notes?: string; due_date?: string | null; completed?: boolean; roadmap_week_id?: string; course_recommendation_id?: string };
          const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
          if (title !== undefined) updates.title = trimStr(title, 500);
          if (notes !== undefined) updates.notes = trimStr(notes, 5000);
          if (due_date !== undefined) updates.due_date = due_date || null;
          if (completed !== undefined) {
            updates.completed = completed;
            updates.completed_at = completed ? new Date().toISOString() : null;
          }
          if (roadmap_week_id !== undefined) updates.roadmap_week_id = roadmap_week_id || null;
          if (course_recommendation_id !== undefined) updates.course_recommendation_id = course_recommendation_id || null;
          const { data, error } = await supabase.from("tasks").update(updates).eq("id", taskId).eq("user_id", user!.id).select().single();
          if (error) throw error;
          return json(data);
        }
        if (req.method === "DELETE") {
          const { error } = await supabase.from("tasks").delete().eq("id", taskId).eq("user_id", user!.id);
          if (error) throw error;
          return json({ success: true });
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "tasks/suggest": {
        if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
        const { roadmap_week_id } = body as { roadmap_week_id?: string };
        if (!roadmap_week_id || typeof roadmap_week_id !== "string") return json({ error: "roadmap_week_id required" }, 400);
        const weekIdSanitized = roadmap_week_id.trim().slice(0, 36);
        if (!UUID_REGEX.test(weekIdSanitized)) return json({ error: "Invalid roadmap_week_id" }, 400);
        const { data: sub } = await supabase.from("subscriptions").select("tier").eq("user_id", user!.id).single();
        const tier = (sub?.tier ?? "free") as string;
        if (!isPaidTier(tier)) {
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          const todayIso = startOfToday.toISOString();
          const { count: aiSuggestionsToday } = await supabase
            .from("ai_suggest_calls")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user!.id)
            .gte("created_at", todayIso);
          if ((aiSuggestionsToday ?? 0) >= AI_SUGGEST_PER_DAY_FREE) {
            return json({ error: "Daily AI suggestions limit reached. Upgrade for unlimited.", limit_code: "ai_suggestions_limit" }, 402);
          }
        }
        const { data: week, error: weekError } = await supabase
          .from("roadmap_weeks")
          .select("id, title, description, skills_to_learn, deliverables")
          .eq("id", weekIdSanitized)
          .eq("user_id", user!.id)
          .single();
        if (weekError || !week) return json({ error: "Week not found" }, 404);
        const { data: courses } = await supabase
          .from("course_recommendations")
          .select("title")
          .eq("roadmap_week_id", weekIdSanitized)
          .eq("user_id", user!.id);
        const courseTitles = (courses ?? []).map((c: { title: string }) => c.title);
        const config = getGeminiConfig();
        if (!config) return json({ error: "AI is not configured. Set GEMINI_API_KEY." }, 500);
        const systemPrompt = `You are a study coach. Given a learning week from a career roadmap, suggest 3 to 5 concrete, actionable tasks the learner can do this week. Be specific and tie tasks to the week's skills, deliverables, and courses.`;
        const userPrompt = `<context>
Week: ${(week as { title: string }).title}
Description: ${(week as { description?: string }).description ?? ""}
Skills to learn: ${((week as { skills_to_learn?: string[] }).skills_to_learn ?? []).join(", ")}
Deliverables: ${((week as { deliverables?: string[] }).deliverables ?? []).join(", ")}
Courses: ${courseTitles.join(", ")}
</context>

Based on the context above, suggest 3-5 specific tasks (e.g. "Complete section 1 of [Course X]", "Draft outline for [deliverable]"). Return only the list of tasks.`;
        const suggestParams = {
          type: "object",
          properties: {
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: { title: { type: "string" }, description: { type: "string" } },
                required: ["title"],
              },
            },
          },
          required: ["tasks"],
        };
        const aiRes = await geminiFetchWithRetry(getGeminiGenerateContentUrl(config.model), {
          method: "POST",
          headers: getGeminiHeaders(config.apiKey),
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            tools: [{ functionDeclarations: [openAiFunctionToGeminiDeclaration("suggest_tasks", "Suggest study tasks for this week", suggestParams)] }],
            toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["suggest_tasks"] } },
            generationConfig: { thinkingConfig: { thinkingLevel: "low" }, temperature: 1.0, maxOutputTokens: 1024 },
          }),
        });
        if (aiRes.status === 429) return json({ error: "Rate limit exceeded. Try again later." }, 429);
        if (!aiRes.ok) {
          console.error("tasks/suggest AI error:", aiRes.status, await aiRes.text());
          return json({ error: "Failed to suggest tasks" }, 500);
        }
        const aiJson = (await aiRes.json()) as { candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ functionCall?: { name?: string; args?: string } }> } }>; usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number; thoughtsTokenCount?: number } };
        const taskCands = aiJson.candidates ?? [];
        const taskFinishCheck = checkGeminiFinishReason(taskCands, taskCands[0]?.finishReason);
        if (!taskFinishCheck.ok) {
          console.error("tasks/suggest: blocked finish reason", taskFinishCheck.finishReason);
          return json({ error: taskFinishCheck.userMessage ?? "Task suggestion was blocked. Please try again." }, 400);
        }
        if (!isOkFinishReasonForFunctionCall(taskCands[0]?.finishReason)) {
          return json({ error: "Invalid AI response format" }, 500);
        }
        logGeminiUsage(aiJson.usageMetadata, "tasks/suggest");
        const parts = aiJson.candidates?.[0]?.content?.parts ?? [];
        const fnPart = parts.find((p: { functionCall?: { name?: string } }) => p.functionCall?.name === "suggest_tasks");
        const argsStr = fnPart?.functionCall?.args;
        if (!argsStr) return json({ error: "Invalid AI response format" }, 500);
        const argsStrEnc = typeof argsStr === "string" ? argsStr : JSON.stringify(argsStr);
        if (new TextEncoder().encode(argsStrEnc).length > MAX_FC_ARGS_BYTES) return json({ error: "Invalid AI response format" }, 500);
        const parsed = JSON.parse(typeof argsStr === "string" ? argsStr : JSON.stringify(argsStr)) as { tasks?: Array<{ title?: string; description?: string }> };
        const rawTasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
        const suggestions = rawTasks
          .filter((t) => t && typeof t.title === "string" && (t.title as string).trim())
          .map((t) => ({ title: trimStr((t.title as string).trim(), 500), description: trimStr((t.description as string) ?? "", 1000) }));
        await supabase.from("ai_suggest_calls").insert({ user_id: user!.id });
        return json({ suggestions });
      }

      case "tasks/auto-generate": {
        if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
        const { roadmap_week_id } = body as { roadmap_week_id?: string };
        if (!roadmap_week_id || typeof roadmap_week_id !== "string") return json({ error: "roadmap_week_id required" }, 400);
        const weekIdSanitized = roadmap_week_id.trim().slice(0, 36);
        if (!UUID_REGEX.test(weekIdSanitized)) return json({ error: "Invalid roadmap_week_id" }, 400);
        
        // Check if user is paid
        const { data: sub } = await supabase.from("subscriptions").select("tier").eq("user_id", user!.id).single();
        const tier = (sub?.tier ?? "free") as string;
        if (!isPaidTier(tier)) {
          return json({ error: "Auto-generation is only available for paid users" }, 403);
        }

        // Check if tasks already exist for this week
        const { count: existingTasks } = await supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user!.id)
          .eq("roadmap_week_id", weekIdSanitized)
          .eq("source", "ai");
        if ((existingTasks ?? 0) > 0) {
          return json({ error: "Tasks already generated for this week" }, 400);
        }

        // Get week data
        const { data: week, error: weekError } = await supabase
          .from("roadmap_weeks")
          .select("id, title, description, skills_to_learn, deliverables")
          .eq("id", weekIdSanitized)
          .eq("user_id", user!.id)
          .single();
        if (weekError || !week) return json({ error: "Week not found" }, 404);

        // Get courses
        const { data: courses } = await supabase
          .from("course_recommendations")
          .select("title")
          .eq("roadmap_week_id", weekIdSanitized)
          .eq("user_id", user!.id);
        const courseTitles = (courses ?? []).map((c: { title: string }) => c.title);

        // Generate tasks using AI (same logic as suggest)
        const config = getGeminiConfig();
        if (!config) return json({ error: "AI is not configured. Set GEMINI_API_KEY." }, 500);
        const systemPrompt = `You are a study coach. Given a learning week from a career roadmap, generate 4 to 6 concrete, actionable tasks the learner should do this week. Be specific and tie tasks to the week's skills, deliverables, and courses. Make tasks actionable and time-bound.`;
        const userPrompt = `<context>
Week: ${(week as { title: string }).title}
Description: ${(week as { description?: string }).description ?? ""}
Skills to learn: ${((week as { skills_to_learn?: string[] }).skills_to_learn ?? []).join(", ")}
Deliverables: ${((week as { deliverables?: string[] }).deliverables ?? []).join(", ")}
Courses: ${courseTitles.join(", ")}
</context>

Based on the context above, generate 4-6 specific tasks (e.g. "Complete section 1-3 of [Course X]", "Draft initial outline for [deliverable]", "Practice [skill] with exercises"). Return only the list of tasks.`;
        const suggestParams = {
          type: "object",
          properties: {
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: { title: { type: "string" }, description: { type: "string" } },
                required: ["title"],
              },
            },
          },
          required: ["tasks"],
        };
        const aiRes = await geminiFetchWithRetry(getGeminiGenerateContentUrl(config.model), {
          method: "POST",
          headers: getGeminiHeaders(config.apiKey),
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            tools: [{ functionDeclarations: [openAiFunctionToGeminiDeclaration("suggest_tasks", "Generate study tasks for this week", suggestParams)] }],
            toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["suggest_tasks"] } },
            generationConfig: { thinkingConfig: { thinkingLevel: "low" }, temperature: 1.0, maxOutputTokens: 1024 },
          }),
        });
        if (aiRes.status === 429) return json({ error: "Rate limit exceeded. Try again later." }, 429);
        if (!aiRes.ok) {
          console.error("tasks/auto-generate AI error:", aiRes.status, await aiRes.text());
          return json({ error: "Failed to generate tasks" }, 500);
        }
        const aiJson = (await aiRes.json()) as { candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ functionCall?: { name?: string; args?: string } }> } }>; usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number; thoughtsTokenCount?: number } };
        const taskCands = aiJson.candidates ?? [];
        const taskFinishCheck = checkGeminiFinishReason(taskCands, taskCands[0]?.finishReason);
        if (!taskFinishCheck.ok) {
          console.error("tasks/auto-generate: blocked finish reason", taskFinishCheck.finishReason);
          return json({ error: taskFinishCheck.userMessage ?? "Task generation was blocked. Please try again." }, 400);
        }
        if (!isOkFinishReasonForFunctionCall(taskCands[0]?.finishReason)) {
          return json({ error: "Invalid AI response format" }, 500);
        }
        logGeminiUsage(aiJson.usageMetadata, "tasks/auto-generate");
        const parts = aiJson.candidates?.[0]?.content?.parts ?? [];
        const fnPart = parts.find((p: { functionCall?: { name?: string } }) => p.functionCall?.name === "suggest_tasks");
        const argsStr = fnPart?.functionCall?.args;
        if (!argsStr) return json({ error: "Invalid AI response format" }, 500);
        const argsStrEnc = typeof argsStr === "string" ? argsStr : JSON.stringify(argsStr);
        if (new TextEncoder().encode(argsStrEnc).length > MAX_FC_ARGS_BYTES) return json({ error: "Invalid AI response format" }, 500);
        const parsed = JSON.parse(typeof argsStr === "string" ? argsStr : JSON.stringify(argsStr)) as { tasks?: Array<{ title?: string; description?: string }> };
        const rawTasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
        const tasksToCreate = rawTasks
          .filter((t) => t && typeof t.title === "string" && (t.title as string).trim())
          .map((t) => ({
            user_id: user!.id,
            roadmap_week_id: weekIdSanitized,
            title: trimStr((t.title as string).trim(), 500),
            notes: trimStr((t.description as string) ?? "", 5000),
            source: "ai" as const,
          }));

        // Batch insert tasks
        if (tasksToCreate.length > 0) {
          const { error: insertError } = await supabase.from("tasks").insert(tasksToCreate);
          if (insertError) {
            console.error("tasks/auto-generate: insert error", insertError);
            return json({ error: "Failed to create tasks" }, 500);
          }
        }

        return json({ success: true, count: tasksToCreate.length });
      }

      case "chat/history": {
        if (req.method !== "GET" && req.method !== "DELETE") return json({ error: "Method not allowed" }, 405);
        if (req.method === "DELETE") {
          await supabase.from("chat_history").delete().eq("user_id", user!.id);
          return json({ success: true });
        }
        const { data: list } = await supabase
          .from("chat_history")
          .select("id, role, content, metadata, created_at")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: true })
          .limit(50);
        return json(list ?? []);
      }

      case "chat/messages": {
        if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
        const { role, content, metadata } = body as { role?: string; content?: string; metadata?: { thoughtSignature?: string } };
        if (!role || content === undefined) return json({ error: "role and content required" }, 400);
        if (!["user", "assistant", "system"].includes(role)) return json({ error: "role must be user, assistant, or system" }, 400);
        const sanitizedContent = sanitizeUserText(content, MAX_CHAT_HISTORY_MESSAGE_LEN);
        const row: { user_id: string; role: string; content: string; metadata?: Record<string, unknown> } = { user_id: user!.id, role, content: sanitizedContent };
        if (metadata && typeof metadata === "object" && metadata.thoughtSignature) {
          row.metadata = { thoughtSignature: sanitizeUserText(metadata.thoughtSignature, 4096) };
        }
        const { error } = await supabase.from("chat_history").insert(row);
        if (error) throw error;
        return json({ success: true });
      }

      case "quiz/results": {
        if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
        const { roadmap_week_id, score, total_questions, answers, feedback } = body as { roadmap_week_id?: string; score?: number; total_questions?: number; answers?: unknown; feedback?: string };
        if (!roadmap_week_id || score === undefined || total_questions === undefined) return json({ error: "roadmap_week_id, score, total_questions required" }, 400);
        const { error } = await supabase.from("quiz_results").insert({
          user_id: user!.id,
          roadmap_week_id,
          score,
          total_questions,
          answers: answers ?? {},
          feedback: feedback ?? null,
        });
        if (error) throw error;
        return json({ success: true });
      }

      case "roadmap/generate": {
        if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
        const { profileData } = body as { profileData?: { targetCareer?: string; jobTitle?: string; industry?: string; experienceLevel?: string; skills?: string[]; learningStyle?: string; preferredPlatforms?: string[]; weeklyHours?: number; budget?: string; timeline?: string; careerReason?: string; preferredLanguage?: string } };
        if (!profileData?.targetCareer) return json({ error: "profileData is required" }, 400);
        const targetCareer = sanitizeUserText(profileData.targetCareer, MAX_PROFILE_FIELD_LEN);
        if (!targetCareer) return json({ error: "targetCareer is required" }, 400);
        const safeProfile = {
          ...profileData,
          targetCareer,
          jobTitle: sanitizeUserText(profileData.jobTitle, MAX_PROFILE_FIELD_LEN) || undefined,
          industry: sanitizeUserText(profileData.industry, MAX_PROFILE_FIELD_LEN) || undefined,
          experienceLevel: sanitizeUserText(profileData.experienceLevel, MAX_PROFILE_FIELD_LEN) || undefined,
          skills: Array.isArray(profileData.skills) ? profileData.skills.slice(0, MAX_PROFILE_ARRAY_ITEMS).map((s) => sanitizeUserText(s, MAX_PROFILE_ARRAY_ITEM_LEN)).filter(Boolean) : [],
          learningStyle: sanitizeUserText(profileData.learningStyle, MAX_PROFILE_FIELD_LEN) || undefined,
          preferredPlatforms: Array.isArray(profileData.preferredPlatforms) ? profileData.preferredPlatforms.slice(0, MAX_PROFILE_ARRAY_ITEMS).map((s) => sanitizeUserText(s, MAX_PROFILE_ARRAY_ITEM_LEN)).filter(Boolean) : [],
          weeklyHours: typeof profileData.weeklyHours === "number" && profileData.weeklyHours >= 1 && profileData.weeklyHours <= 168 ? profileData.weeklyHours : 10,
          budget: sanitizeUserText(profileData.budget, MAX_PROFILE_FIELD_LEN) || undefined,
          timeline: sanitizeUserText(profileData.timeline, 20) || undefined,
          careerReason: sanitizeUserText(profileData.careerReason, MAX_DESCRIPTION_LEN) || undefined,
        };
        await ensureProfileAndSubscription(supabase, user!.id, user!.email, user!.user_metadata?.display_name as string | undefined);
        const { data: profileRow } = await supabase.from("profiles").select("preferred_language").eq("user_id", user!.id).single();
        const preferredLang = ((profileRow as { preferred_language?: string } | null)?.preferred_language ?? profileData?.preferredLanguage ?? "en").trim().toLowerCase();
        const roadmapLang = preferredLang === "ar" ? "ar" : "en";
        const { data: sub } = await supabase.from("subscriptions").select("tier").eq("user_id", user!.id).single();
        const tier = (sub?.tier ?? "free") as string;
        if (!isPaidTier(tier)) {
          const { count: roadmapsCreated } = await supabase.from("roadmaps").select("*", { count: "exact", head: true }).eq("user_id", user!.id);
          if ((roadmapsCreated ?? 0) >= 1) return json({ error: "Roadmap limit reached. Upgrade for unlimited roadmaps." }, 402);
        }
        const config = getGeminiConfig();
        if (!config) return json({ error: "AI is not configured. Set GEMINI_API_KEY." }, 500);
        const roadmapThinkingLevel = (Deno.env.get("GEMINI_ROADMAP_THINKING_LEVEL") ?? "low").trim().toLowerCase() === "high" ? "high" : "low";
        const useGrounding = Deno.env.get("ROADMAP_USE_GROUNDING") !== "false";
        const careerReasonLine = safeProfile.careerReason && String(safeProfile.careerReason).trim() ? `\nUser's motivation: ${String(safeProfile.careerReason).trim()}` : "";
        const languageInstruction = roadmapLang === "ar"
          ? "\n<language>Output the entire roadmap in Egyptian modern professional Arabic (فصحى عصرية مصرية). All field values—title, description, week titles, week descriptions, skills_to_learn, deliverables, and course titles—must be in Arabic. Warm, clear tone. Avoid stiff or bureaucratic phrasing. Write as a native Egyptian professional would.</language>"
          : "\n<language>Output the entire roadmap in English. All field values must be in English.</language>";
        const groundingTaskLine = useGrounding
          ? `Use Google Search to find real courses on the user's preferred platforms. Recommend courses ONLY from those platforms. ${ALLOWED_DOMAINS_INSTRUCTION} ${REAL_COURSE_URL_INSTRUCTION} Respect budget (Free Only / up_to_50 / up_to_200 / unlimited). Set estimated_hours per week within their weekly availability. Each week: title, description, 2-4 skills_to_learn, 2-3 deliverables, estimated_hours, 2-3 courses (title, platform, url). Return only real, working course URLs from search results—no invented or placeholder URLs. Each course url must be a full URL to a specific course page (path must not be only /). Do not use the platform homepage or browse/category pages as the url.`
          : "Recommend courses from the user's preferred platforms. Respect budget (Free Only / up_to_50 / up_to_200 / unlimited). Set estimated_hours per week within their weekly availability. Each week: title, description, 2-4 skills_to_learn, 2-3 deliverables, estimated_hours, 2-3 courses (title, platform, url). Do not invent URLs; use empty string for url if you cannot provide a real link. Missing URLs will be filled later.";
        const systemPrompt = `<role>You are a career guidance expert AI. Create a detailed 12-week learning roadmap for career transition.</role>
<context>
The user is transitioning from "${safeProfile.jobTitle ?? ""}" in "${safeProfile.industry ?? ""}" to "${safeProfile.targetCareer}".
Experience Level: ${safeProfile.experienceLevel ?? ""}
Current Skills: ${(safeProfile.skills ?? []).join(", ")}
Learning Style: ${safeProfile.learningStyle ?? ""}
Preferred Platforms: ${(safeProfile.preferredPlatforms ?? []).join(", ")}
Weekly Hours Available: ${safeProfile.weeklyHours ?? 10}
Budget: ${safeProfile.budget ?? "Not specified"}
Timeline Goal: ${safeProfile.timeline ?? "12"}${careerReasonLine}
</context>
<task>Based on the information above, create a structured 12-week roadmap. ${groundingTaskLine}</task>${languageInstruction}`;
        const roadmapBody: Record<string, unknown> = {
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: useGrounding ? "Generate my personalized 12-week career roadmap with course recommendations. Use search to find real course links." : "Generate my personalized 12-week career roadmap with course recommendations." }] }],
          generationConfig: {
            thinkingConfig: { thinkingLevel: roadmapThinkingLevel },
            temperature: 1.0,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
            responseJsonSchema: ROADMAP_RESPONSE_JSON_SCHEMA,
          },
        };
        if (useGrounding) roadmapBody.tools = [{ google_search: {} }];
        const aiRes = await geminiFetchWithRetry(getGeminiGenerateContentUrl(config.model), {
          method: "POST",
          headers: getGeminiHeaders(config.apiKey),
          body: JSON.stringify(roadmapBody),
        });
        if (aiRes.status === 429) return json({ error: "Rate limit exceeded. Please try again later." }, 429);
        if (aiRes.status === 402) return json({ error: "Payment required. Please add credits to continue." }, 402);
        if (!aiRes.ok) {
          console.error("AI gateway error:", aiRes.status, await aiRes.text());
          return json({ error: "Failed to generate roadmap" }, 500);
        }
        let aiJson: { candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>; usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number; thoughtsTokenCount?: number } };
        try {
          aiJson = (await aiRes.json()) as typeof aiJson;
        } catch {
          console.error("AI response was not valid JSON");
          return json({ error: "Failed to generate roadmap" }, 500);
        }
        const cands = aiJson.candidates ?? [];
        const finishCheck = checkGeminiFinishReason(cands, cands[0]?.finishReason);
        if (!finishCheck.ok) {
          console.error("roadmap generate: blocked finish reason", finishCheck.finishReason);
          return json({ error: finishCheck.userMessage ?? "Roadmap generation was blocked. Please try again." }, 400);
        }
        logGeminiUsage(aiJson.usageMetadata, "roadmap/generate");
        const groundingAuth = extractGroundingFromCandidate(cands[0]);
        if (groundingAuth) {
          console.log(`[roadmap/generate] grounding: ${groundingAuth.queries.length} queries, ${groundingAuth.citations.length} citations`);
        }
        const parts = aiJson.candidates?.[0]?.content?.parts ?? [];
        const jsonText = extractTextFromParts(parts as Array<{ text?: string; thought?: boolean }>);
        if (!jsonText.trim()) return json({ error: "Invalid AI response format" }, 500);
        if (new TextEncoder().encode(jsonText).length > MAX_FC_ARGS_BYTES) return json({ error: "Invalid AI response format" }, 500);
        let roadmapData: Record<string, unknown>;
        try {
          roadmapData = JSON.parse(jsonText) as Record<string, unknown>;
        } catch {
          return json({ error: "Invalid AI response format" }, 500);
        }
        if (typeof roadmapData?.title !== "string" || !roadmapData.title.trim()) return json({ error: "Invalid roadmap structure from AI" }, 500);
        const weeksArr = Array.isArray(roadmapData.weeks) ? roadmapData.weeks : [];
        if (weeksArr.length < 1) return json({ error: "Invalid roadmap structure from AI" }, 500);
        for (const w of weeksArr) {
          const week = w as Record<string, unknown>;
          if (typeof week?.week_number !== "number" || typeof week?.title !== "string" || !Array.isArray(week?.skills_to_learn) || !Array.isArray(week?.deliverables) || typeof week?.estimated_hours !== "number" || !Array.isArray(week?.courses)) {
            return json({ error: "Invalid roadmap structure from AI" }, 500);
          }
          if (!isPaidTier(tier)) (week as Record<string, unknown>).courses = (Array.isArray(week.courses) ? week.courses : []).slice(0, 1);
        }
        cleanRoadmapOutput(roadmapData);
        if (!roadmapData.title) return json({ error: "Invalid roadmap structure from AI" }, 500);
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
        await fillMissingCourseUrls(roadmapData, roadmapLang, supabaseUrl, anonKey, 15);
        await supabase.from("profiles").upsert({
          user_id: user!.id,
          display_name: (user!.email?.split("@")[0] ?? "User").trim().slice(0, 500),
          job_title: safeProfile.jobTitle ?? null,
          industry: safeProfile.industry ?? null,
          experience_level: safeProfile.experienceLevel ?? null,
          target_career: safeProfile.targetCareer ?? null,
          skills: safeProfile.skills ?? [],
          learning_style: safeProfile.learningStyle ?? null,
          weekly_hours: safeProfile.weeklyHours ?? 10,
          budget: safeProfile.budget ?? null,
        }, { onConflict: "user_id" });
        const { data: roadmapRow, error: roadmapErr } = await supabase.from("roadmaps").insert({
          user_id: user!.id,
          title: roadmapData.title,
          description: (roadmapData.description ?? null) as string | null,
          target_role: safeProfile.targetCareer,
          duration_weeks: 12,
          difficulty_level: (roadmapData.difficulty_level ?? "intermediate") as string,
          status: "active",
          progress_percentage: 0,
        }).select("id, title").single();
        if (roadmapErr || !roadmapRow?.id) return json({ error: "Failed to save roadmap" }, 500);
        await supabase.from("roadmaps").update({ status: "inactive" }).eq("user_id", user!.id).neq("id", roadmapRow.id);
        const weeks = weeksArr as Array<Record<string, unknown>>;
        for (const week of weeks) {
          const { data: weekRow, error: weekErr } = await supabase.from("roadmap_weeks").insert({
            roadmap_id: roadmapRow.id,
            user_id: user!.id,
            week_number: week.week_number,
            title: week.title,
            description: (week.description ?? null) as string | null,
            skills_to_learn: (week.skills_to_learn ?? []) as string[],
            deliverables: (week.deliverables ?? []) as string[],
            estimated_hours: (week.estimated_hours ?? 10) as number,
            is_completed: false,
          }).select("id").single();
          if (weekErr || !weekRow?.id) continue;
          const courses = Array.isArray(week.courses) ? week.courses : [];
          const courseIds: string[] = [];
          for (let i = 0; i < courses.length; i++) {
            const c = courses[i] as Record<string, unknown>;
            const courseUrl = (typeof c.url === "string" && c.url) ? c.url : null;
            const { data: courseRow, error: courseErr } = await supabase.from("course_recommendations").insert({
              roadmap_week_id: weekRow.id,
              user_id: user!.id,
              title: c.title ?? "",
              platform: trimStr(c.platform, MAX_STRING_ITEM_LEN),
              url: courseUrl,
              instructor: (c.instructor ?? null) as string | null,
              duration: (c.duration ?? null) as string | null,
              difficulty_level: (c.difficulty_level ?? null) as string | null,
              price: (c.price ?? 0) as number,
              rating: (c.rating ?? null) as number | null,
              relevance_score: 100 - i * 10,
              is_saved: false,
              is_completed: false,
            }).select("id").single();
            
            // Enrich course metadata from URL (async, fire-and-forget)
            if (courseRow?.id && courseUrl && isValidCourseUrl(courseUrl) && isAllowedCourseHost(courseUrl)) {
              courseIds.push(courseRow.id);
              // Don't await - let it run in background
              enrichCourseMetadata(supabase, courseRow.id, courseUrl).catch((err) => {
                console.warn("[roadmap/generate] Failed to enrich course metadata:", courseUrl, err);
              });
            }
          }
        }
        const responsePayload: { success: true; roadmapId: string; title: string; grounding?: { queries: string[]; citations: Array<{ uri: string; title?: string }> } } = { success: true, roadmapId: roadmapRow.id, title: roadmapRow.title };
        if (groundingAuth) responsePayload.grounding = groundingAuth;
        return json(responsePayload);
      }

      case "roadmap/generate-guest": {
        if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
        const ip = getClientIp(req);
        if (!checkGuestRateLimit(ip)) return json({ error: "Too many previews. Try again in an hour." }, 429);
        const { profileData } = body as { profileData?: { targetCareer?: string; jobTitle?: string; industry?: string; experienceLevel?: string; skills?: string[]; learningStyle?: string; preferredPlatforms?: string[]; weeklyHours?: number; budget?: string; timeline?: string; careerReason?: string; preferredLanguage?: string } };
        if (!profileData?.targetCareer) return json({ error: "profileData is required" }, 400);
        const targetCareerGuest = sanitizeUserText(profileData.targetCareer, MAX_PROFILE_FIELD_LEN);
        if (!targetCareerGuest) return json({ error: "targetCareer is required" }, 400);
        const preferredLangGuest = (profileData?.preferredLanguage ?? "en").trim().toLowerCase();
        const roadmapLangGuest = preferredLangGuest === "ar" ? "ar" : "en";
        const safeProfileGuest = {
          ...profileData,
          targetCareer: targetCareerGuest,
          jobTitle: sanitizeUserText(profileData.jobTitle, MAX_PROFILE_FIELD_LEN) || undefined,
          industry: sanitizeUserText(profileData.industry, MAX_PROFILE_FIELD_LEN) || undefined,
          experienceLevel: sanitizeUserText(profileData.experienceLevel, MAX_PROFILE_FIELD_LEN) || undefined,
          skills: Array.isArray(profileData.skills) ? profileData.skills.slice(0, MAX_PROFILE_ARRAY_ITEMS).map((s) => sanitizeUserText(s, MAX_PROFILE_ARRAY_ITEM_LEN)).filter(Boolean) : [],
          learningStyle: sanitizeUserText(profileData.learningStyle, MAX_PROFILE_FIELD_LEN) || undefined,
          preferredPlatforms: Array.isArray(profileData.preferredPlatforms) ? profileData.preferredPlatforms.slice(0, MAX_PROFILE_ARRAY_ITEMS).map((s) => sanitizeUserText(s, MAX_PROFILE_ARRAY_ITEM_LEN)).filter(Boolean) : [],
          weeklyHours: typeof profileData.weeklyHours === "number" && profileData.weeklyHours >= 1 && profileData.weeklyHours <= 168 ? profileData.weeklyHours : 10,
          budget: sanitizeUserText(profileData.budget, MAX_PROFILE_FIELD_LEN) || undefined,
          timeline: sanitizeUserText(profileData.timeline, 20) || undefined,
          careerReason: sanitizeUserText(profileData.careerReason, MAX_DESCRIPTION_LEN) || undefined,
        };
        const config = getGeminiConfig();
        if (!config) return json({ error: "AI is not configured. Set GEMINI_API_KEY." }, 500);
        const roadmapThinkingLevelGuest = (Deno.env.get("GEMINI_ROADMAP_THINKING_LEVEL") ?? "low").trim().toLowerCase() === "high" ? "high" : "low";
        const useGroundingGuest = Deno.env.get("ROADMAP_USE_GROUNDING") !== "false";
        const careerReasonLineGuest = safeProfileGuest.careerReason && String(safeProfileGuest.careerReason).trim() ? `\nUser's motivation: ${String(safeProfileGuest.careerReason).trim()}` : "";
        const languageInstructionGuest = roadmapLangGuest === "ar"
          ? "\n<language>Output the entire roadmap in Egyptian modern professional Arabic (فصحى عصرية مصرية). All field values—title, description, week titles, week descriptions, skills_to_learn, deliverables, and course titles—must be in Arabic. Warm, clear tone. Avoid stiff or bureaucratic phrasing. Write as a native Egyptian professional would.</language>"
          : "\n<language>Output the entire roadmap in English. All field values must be in English.</language>";
        const groundingTaskLineGuest = useGroundingGuest
          ? `Use Google Search to find real courses on the user's preferred platforms. Recommend courses ONLY from those platforms. ${ALLOWED_DOMAINS_INSTRUCTION} ${REAL_COURSE_URL_INSTRUCTION} Respect budget (Free Only / up_to_50 / up_to_200 / unlimited). Set estimated_hours per week within their weekly availability. Each week: title, description, 2-4 skills_to_learn, 2-3 deliverables, estimated_hours, 2-3 courses (title, platform, url). Return only real, working course URLs from search results—no invented or placeholder URLs. Each course url must be a full URL to a specific course page (path must not be only /). Do not use the platform homepage or browse/category pages as the url.`
          : "Recommend courses from the user's preferred platforms. Respect budget (Free Only / up_to_50 / up_to_200 / unlimited). Set estimated_hours per week within their weekly availability. Each week: title, description, 2-4 skills_to_learn, 2-3 deliverables, estimated_hours, 2-3 courses (title, platform, url). Do not invent URLs; use empty string for url if you cannot provide a real link. Missing URLs will be filled later.";
        const systemPromptGuest = `<role>You are a career guidance expert AI. Create a detailed 12-week learning roadmap for career transition.</role>
<context>
The user is transitioning from "${safeProfileGuest.jobTitle ?? ""}" in "${safeProfileGuest.industry ?? ""}" to "${safeProfileGuest.targetCareer}".
Experience Level: ${safeProfileGuest.experienceLevel ?? ""}
Current Skills: ${(safeProfileGuest.skills ?? []).join(", ")}
Learning Style: ${safeProfileGuest.learningStyle ?? ""}
Preferred Platforms: ${(safeProfileGuest.preferredPlatforms ?? []).join(", ")}
Weekly Hours Available: ${safeProfileGuest.weeklyHours ?? 10}
Budget: ${safeProfileGuest.budget ?? "Not specified"}
Timeline Goal: ${safeProfileGuest.timeline ?? "12"}${careerReasonLineGuest}
</context>
<task>Based on the information above, create a structured 12-week roadmap. ${groundingTaskLineGuest}</task>${languageInstructionGuest}`;
        const roadmapBodyGuest: Record<string, unknown> = {
          systemInstruction: { parts: [{ text: systemPromptGuest }] },
          contents: [{ role: "user", parts: [{ text: useGroundingGuest ? "Generate my personalized 12-week career roadmap with course recommendations. Use search to find real course links." : "Generate my personalized 12-week career roadmap with course recommendations." }] }],
          generationConfig: {
            thinkingConfig: { thinkingLevel: roadmapThinkingLevelGuest },
            temperature: 1.0,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
            responseJsonSchema: ROADMAP_RESPONSE_JSON_SCHEMA,
          },
        };
        if (useGroundingGuest) roadmapBodyGuest.tools = [{ google_search: {} }];
        const aiRes = await geminiFetchWithRetry(getGeminiGenerateContentUrl(config.model), {
          method: "POST",
          headers: getGeminiHeaders(config.apiKey),
          body: JSON.stringify(roadmapBodyGuest),
        });
        if (aiRes.status === 429) return json({ error: "Rate limit exceeded. Please try again later." }, 429);
        if (aiRes.status === 402) return json({ error: "Payment required. Please add credits to continue." }, 402);
        if (!aiRes.ok) {
          console.error("AI gateway error (guest):", aiRes.status, await aiRes.text());
          return json({ error: "Failed to generate roadmap" }, 500);
        }
        let aiJson: { candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>; usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number; thoughtsTokenCount?: number } };
        try {
          aiJson = (await aiRes.json()) as typeof aiJson;
        } catch {
          console.error("AI response (guest) was not valid JSON");
          return json({ error: "Failed to generate roadmap" }, 500);
        }
        const candsGuest = aiJson.candidates ?? [];
        const finishCheckGuest = checkGeminiFinishReason(candsGuest, candsGuest[0]?.finishReason);
        if (!finishCheckGuest.ok) {
          console.error("roadmap generate-guest: blocked finish reason", finishCheckGuest.finishReason);
          return json({ error: finishCheckGuest.userMessage ?? "Roadmap generation was blocked. Please try again." }, 400);
        }
        logGeminiUsage(aiJson.usageMetadata, "roadmap/generate-guest");
        const groundingGuest = extractGroundingFromCandidate(candsGuest[0]);
        if (groundingGuest) {
          console.log(`[roadmap/generate-guest] grounding: ${groundingGuest.queries.length} queries, ${groundingGuest.citations.length} citations`);
        }
        const parts = aiJson.candidates?.[0]?.content?.parts ?? [];
        const jsonTextGuest = extractTextFromParts(parts as Array<{ text?: string; thought?: boolean }>);
        if (!jsonTextGuest.trim()) return json({ error: "Invalid AI response format" }, 500);
        if (new TextEncoder().encode(jsonTextGuest).length > MAX_FC_ARGS_BYTES) return json({ error: "Invalid AI response format" }, 500);
        let roadmapData: Record<string, unknown>;
        try {
          roadmapData = JSON.parse(jsonTextGuest) as Record<string, unknown>;
        } catch {
          return json({ error: "Invalid AI response format" }, 500);
        }
        if (typeof roadmapData?.title !== "string" || !roadmapData.title.trim()) return json({ error: "Invalid roadmap structure from AI" }, 500);
        const weeksArr = Array.isArray(roadmapData.weeks) ? roadmapData.weeks : [];
        if (weeksArr.length < 1) return json({ error: "Invalid roadmap structure from AI" }, 500);
        cleanRoadmapOutput(roadmapData);
        const supabaseUrlGuest = Deno.env.get("SUPABASE_URL") ?? "";
        const anonKeyGuest = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
        await fillMissingCourseUrls(roadmapData, roadmapLangGuest, supabaseUrlGuest, anonKeyGuest, 4);
        const weeks = weeksArr.slice(0, 2).map((w: Record<string, unknown>) => ({
          title: w.title ?? "",
          description: w.description ?? "",
          skills_to_learn: (Array.isArray(w.skills_to_learn) ? w.skills_to_learn : []).slice(0, 2),
          deliverables: (Array.isArray(w.deliverables) ? w.deliverables : []).slice(0, 2),
          courses: (Array.isArray(w.courses) ? w.courses : []).slice(0, 1).map((c: Record<string, unknown>) => ({
            title: c.title ?? "",
            platform: c.platform ?? "",
            url: (typeof (c as { url?: string }).url === "string" && (c as { url?: string }).url) ? (c as { url: string }).url : null,
          })),
        }));
        const guestPayload: { title: string; description: string | null; weeks: unknown[]; grounding?: { queries: string[]; citations: Array<{ uri: string; title?: string }> } } = {
          title: roadmapData.title,
          description: (roadmapData.description ?? null) as string | null,
          weeks,
        };
        if (groundingGuest) guestPayload.grounding = groundingGuest;
        return json(guestPayload);
      }

      case "career-dna/analyze": {
        if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
        const ip = getClientIp(req);
        if (!checkCareerDnaRateLimit(ip)) return json({ error: "Too many quiz attempts. Try again in an hour." }, 429);
        const { answers, currentField, isStudent, language, sessionId, squadSlug, displayName } = body as {
          answers?: Record<string, string | number>;
          currentField?: string;
          isStudent?: boolean;
          language?: string;
          sessionId?: string;
          squadSlug?: string;
          displayName?: string;
        };
        if (!answers || typeof answers !== "object" || !currentField || typeof currentField !== "string" || !currentField.trim()) {
          return json({ error: "answers and currentField are required" }, 400);
        }
        const config = getGeminiConfig();
        if (!config) return json({ error: "AI is not configured. Set GEMINI_API_KEY." }, 500);
        const lang = (language ?? "en").toString().trim().toLowerCase() === "ar" ? "ar" : "en";
        const allowedCareers = [
          "Software Engineer", "Data Scientist", "Product Manager", "UX Designer",
          "DevOps Engineer", "Cloud Architect", "Machine Learning Engineer",
          "Frontend Developer", "Backend Developer", "Full Stack Developer",
          "Cybersecurity Analyst", "Business Analyst", "Project Manager",
          "Marketing Manager", "Sales Manager", "HR Manager", "Other",
        ];
        const careersList = allowedCareers.join(", ");
        const langInstr = lang === "ar"
          ? "\n<language>Output all user-facing string fields (archetype, description, superpower, hiddenTalent, shareableQuote, suggested career reasons) in Egyptian modern professional Arabic (فصحى عصرية مصرية). Warm, encouraging tone. Avoid stiff phrasing. Write as a native Egyptian professional would.</language>"
          : "\n<language>Output all string fields in English.</language>";
        const systemPrompt = `<role>You are a career psychologist AI. Analyze the user's quiz answers to determine how well their personality fits their declared field, and suggest better-fit careers.</role>
<psychology>
Use career psychology principles: Holland's RIASEC (Realistic, Investigative, Artistic, Social, Enterprising, Conventional), work-style dimensions (analytical, creative, collaborative, independent, structured, adaptive), and job-fit signals.
- q6 (1-10 engagement/flow): Low (1-4) suggests poor fit or burnout; mid (5-7) mixed; high (8-10) strong engagement. Weight this heavily for match score.
- q7 (would choose again): career regret/satisfaction signal.
- q8 (worries): growth mindset and anxiety type.
Frame low scores as exploration opportunity, not failure.
</psychology>
<task>
1. Map the answers to work-style dimensions (analytical, creative, collaborative, independent, structured, adaptive).
2. Compute a match score (0-100) between their personality and their current field. Weight q6 strongly: low engagement = lower fit score.
3. Assign exactly one score tier by score: visionaries (90-100), naturals (75-89), explorers (60-74), shifters (45-59), awakeners (30-44), misfits (0-29).
4. Pick one persona character ID for that tier (best fits their answers): visionaries→v1|v2|v3|v4, naturals→n1|n2|n3|n4, explorers→e1|e2|e3|e4, shifters→s1|s2|s3|s4, awakeners→a1|a2|a3|a4, misfits→m1|m2|m3|m4.
5. Give a personality archetype: specific and resonant (e.g. "Strategic Empath", "Quiet Builder"), not generic. Brief description.
6. Identify one superpower (strongest trait) that derives from their answers. Rarity stat should feel plausible (e.g. 10-25%).
7. Identify one hidden talent and which career it suits.
8. Suggest exactly 3 alternative careers from this list only: ${careersList}. For each: career name, matchPercent (0-100), short reason.
9. Write a shareable quote for social: "I'm a {score}% match for my {field}. What's yours?" in the output language.
Be encouraging, never shaming. Focus on potential and fit.
</task>${langInstr}`;
        const answersStr = JSON.stringify(answers, null, 2);
        const userPrompt = `Current field: ${sanitizeUserText(currentField, 100)}
Is student: ${isStudent === true ? "yes" : "no"}
Quiz answers:
${answersStr}

Analyze and return the structured response.`;
        const aiBody = {
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: {
            thinkingConfig: { thinkingLevel: isGemini3Flash(config.model) ? "minimal" : "low" },
            temperature: 0.8,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
            responseJsonSchema: CAREER_DNA_RESPONSE_JSON_SCHEMA,
          },
        };
        const aiRes = await geminiFetchWithRetry(getGeminiGenerateContentUrl(config.model), {
          method: "POST",
          headers: getGeminiHeaders(config.apiKey),
          body: JSON.stringify(aiBody),
        });
        if (aiRes.status === 429) return json({ error: "Rate limit exceeded. Please try again later." }, 429);
        if (aiRes.status === 402) return json({ error: "Payment required." }, 402);
        if (!aiRes.ok) {
          console.error("career-dna analyze AI error:", aiRes.status, await aiRes.text());
          return json({ error: "Failed to analyze. Please try again." }, 500);
        }
        let aiJson: { candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>; usageMetadata?: { promptTokenCount?: number } };
        try {
          aiJson = (await aiRes.json()) as typeof aiJson;
        } catch {
          return json({ error: "Invalid AI response" }, 500);
        }
        const cands = aiJson.candidates ?? [];
        const finishCheck = checkGeminiFinishReason(cands, cands[0]?.finishReason);
        if (!finishCheck.ok) return json({ error: finishCheck.userMessage ?? "Analysis was blocked. Please try again." }, 400);
        logGeminiUsage(aiJson.usageMetadata, "career-dna/analyze");
        const parts = cands[0]?.content?.parts ?? [];
        const jsonText = extractTextFromParts(parts as Array<{ text?: string; thought?: boolean }>);
        if (!jsonText.trim()) return json({ error: "Invalid AI response format" }, 500);
        let data: Record<string, unknown>;
        try {
          data = JSON.parse(jsonText) as Record<string, unknown>;
        } catch {
          return json({ error: "Invalid AI response format" }, 500);
        }
        const matchScore = typeof data.matchScore === "number" ? Math.round(Math.max(0, Math.min(100, data.matchScore))) : 50;
        const validTiers = ["visionaries", "naturals", "explorers", "shifters", "awakeners", "misfits"];
        const scoreTier = typeof data.scoreTier === "string" && validTiers.includes(data.scoreTier) ? data.scoreTier : (matchScore >= 90 ? "visionaries" : matchScore >= 75 ? "naturals" : matchScore >= 60 ? "explorers" : matchScore >= 45 ? "shifters" : matchScore >= 30 ? "awakeners" : "misfits");
        const tierToChars: Record<string, string[]> = { visionaries: ["v1","v2","v3","v4"], naturals: ["n1","n2","n3","n4"], explorers: ["e1","e2","e3","e4"], shifters: ["s1","s2","s3","s4"], awakeners: ["a1","a2","a3","a4"], misfits: ["m1","m2","m3","m4"] };
        const allowedChars = tierToChars[scoreTier] ?? ["v1"];
        const rawChar = typeof data.personaCharacterId === "string" ? data.personaCharacterId.trim().toLowerCase() : "";
        const personaCharacterId = allowedChars.includes(rawChar) ? rawChar : allowedChars[0];
        const suggestedCareers = Array.isArray(data.suggestedCareers) ? data.suggestedCareers.slice(0, 3) : [];
        let squadId: string | null = null;
        if (squadSlug && typeof squadSlug === "string" && squadSlug.trim()) {
          const { data: squad } = await supabase.from("career_dna_squads").select("id").eq("slug", squadSlug.trim()).single();
          if (squad) squadId = (squad as { id: string }).id;
        }
        const ipHash = await hashIp(ip);
        const { data: inserted, error: insertErr } = await supabase
          .from("career_dna_results")
          .insert({
            session_id: typeof sessionId === "string" && sessionId.trim() ? sessionId.trim().slice(0, 128) : null,
            ip_hash: ipHash,
            current_field: sanitizeUserText(currentField, 200),
            is_student: isStudent === true,
            match_score: matchScore,
            personality_archetype: typeof data.personalityArchetype === "string" ? data.personalityArchetype.slice(0, 200) : null,
            archetype_description: typeof data.archetypeDescription === "string" ? data.archetypeDescription.slice(0, 500) : null,
            superpower: typeof data.superpower === "string" ? data.superpower.slice(0, 200) : null,
            superpower_rarity: typeof data.superpowerRarity === "string" ? data.superpowerRarity.slice(0, 200) : null,
            hidden_talent: typeof data.hiddenTalent === "string" ? data.hiddenTalent.slice(0, 200) : null,
            hidden_talent_career_hint: typeof data.hiddenTalentCareerHint === "string" ? data.hiddenTalentCareerHint.slice(0, 200) : null,
            shareable_quote: typeof data.shareableQuote === "string" ? data.shareableQuote.slice(0, 300) : null,
            score_tier: scoreTier,
            persona_character_id: personaCharacterId,
            suggested_careers: suggestedCareers,
            raw_answers: answers,
            language: lang,
            squad_id: squadId,
            display_name: typeof displayName === "string" && displayName.trim() ? sanitizeUserText(displayName.trim(), 50) : null,
          })
          .select("id")
          .single();
        if (insertErr || !inserted) {
          console.error("career-dna insert error:", insertErr);
          return json({ error: "Failed to save result" }, 500);
        }
        const resultId = (inserted as { id: string }).id;
        if (squadId) {
          await supabase.from("career_dna_squad_members").upsert({ squad_id: squadId, result_id: resultId }, { onConflict: "squad_id,result_id" });
        }
        return json({
          resultId,
          matchScore,
          scoreTier,
          personaCharacterId,
          personalityArchetype: data.personalityArchetype ?? null,
          archetypeDescription: data.archetypeDescription ?? null,
          superpower: data.superpower ?? null,
          superpowerRarity: data.superpowerRarity ?? null,
          hiddenTalent: data.hiddenTalent ?? null,
          hiddenTalentCareerHint: data.hiddenTalentCareerHint ?? null,
          suggestedCareers,
          shareableQuote: data.shareableQuote ?? null,
          scoreTier,
          personaCharacterId,
        });
      }

      case "career-dna/result": {
        if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
        const resultId = pathSegments[2];
        if (!resultId) return json({ error: "Result ID required" }, 400);
        const { data: row, error } = await supabase
          .from("career_dna_results")
          .select("*")
          .eq("id", resultId)
          .single();
        if (error || !row) return json({ error: "Result not found" }, 404);
        const r = row as Record<string, unknown>;
        return json({
          resultId: r.id,
          matchScore: r.match_score,
          personalityArchetype: r.personality_archetype,
          archetypeDescription: r.archetype_description,
          superpower: r.superpower,
          superpowerRarity: r.superpower_rarity,
          hiddenTalent: r.hidden_talent,
          hiddenTalentCareerHint: r.hidden_talent_career_hint,
          suggestedCareers: r.suggested_careers ?? [],
          shareableQuote: r.shareable_quote,
          scoreTier: r.score_tier,
          personaCharacterId: r.persona_character_id,
          currentField: r.current_field,
          isStudent: r.is_student,
        });
      }

      case "career-dna/lead": {
        if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
        const { phone, source, sourceId, consentMarketing, countryCode } = body as { phone?: string; source?: string; sourceId?: string; consentMarketing?: boolean; countryCode?: string };
        if (!phone || typeof phone !== "string" || !phone.trim()) return json({ error: "Phone is required" }, 400);
        const cleaned = phone.replace(/\D/g, "");
        if (cleaned.length < 8) return json({ error: "Invalid phone number" }, 400);
        const src = source === "squad" || source === "result" ? source : "result";
        const sid = typeof sourceId === "string" && sourceId.trim() ? sourceId.trim().slice(0, 100) : "";
        if (!sid) return json({ error: "sourceId is required" }, 400);
        const cc = typeof countryCode === "string" && /^[A-Z]{2}$/i.test(countryCode.trim()) ? countryCode.trim().toUpperCase().slice(0, 2) : null;
        const { error: leadErr } = await supabase.from("career_dna_leads").insert({
          phone: `+${cleaned}`,
          country_code: cc,
          source: src,
          source_id: sid,
          consent_marketing: consentMarketing === true,
        });
        if (leadErr) return json({ error: "Failed to save" }, 500);
        return json({ ok: true });
      }

      case "career-dna/squad/create": {
        if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
        const { resultId } = body as { resultId?: string };
        if (!resultId || typeof resultId !== "string") return json({ error: "resultId is required" }, 400);
        const { data: existing } = await supabase.from("career_dna_results").select("id, squad_id").eq("id", resultId).single();
        if (!existing) return json({ error: "Result not found" }, 404);
        if ((existing as { squad_id?: string }).squad_id) return json({ error: "Result already in a squad" }, 400);
        const slug = crypto.randomUUID().slice(0, 8).replace(/-/g, "");
        const { data: squad, error: squadErr } = await supabase.from("career_dna_squads").insert({ slug }).select("id").single();
        if (squadErr || !squad) return json({ error: "Failed to create squad" }, 500);
        const sid = (squad as { id: string }).id;
        await supabase.from("career_dna_results").update({ squad_id: sid }).eq("id", resultId);
        await supabase.from("career_dna_squad_members").insert({ squad_id: sid, result_id: resultId });
        const baseUrl = (Deno.env.get("SITE_URL") ?? Deno.env.get("VITE_APP_ORIGIN") ?? "https://shyftcut.com").replace(/\/$/, "");
        return json({ slug, squadId: sid, url: `${baseUrl}/career-dna/squad/${slug}` });
      }

      case "career-dna/squad/get": {
        if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
        const slug = pathSegments[2];
        if (!slug) return json({ error: "Squad slug required" }, 400);
        const { data: squad, error: squadErr } = await supabase.from("career_dna_squads").select("id").eq("slug", slug).single();
        if (squadErr || !squad) return json({ error: "Squad not found" }, 404);
        const sid = (squad as { id: string }).id;
        const { data: members } = await supabase.from("career_dna_squad_members").select("result_id").eq("squad_id", sid);
        const resultIds = ((members ?? []) as Array<{ result_id: string }>).map((m) => m.result_id);
        if (resultIds.length === 0) return json({ slug, results: [] });
        const { data: results } = await supabase.from("career_dna_results").select("*").in("id", resultIds).order("match_score", { ascending: false });
        const formatted = (results ?? []).map((r: Record<string, unknown>) => ({
          resultId: r.id,
          matchScore: r.match_score,
          displayName: r.display_name ?? null,
          personalityArchetype: r.personality_archetype,
          archetypeDescription: r.archetype_description,
          superpower: r.superpower,
          superpowerRarity: r.superpower_rarity,
          hiddenTalent: r.hidden_talent,
          hiddenTalentCareerHint: r.hidden_talent_career_hint,
          suggestedCareers: r.suggested_careers ?? [],
          shareableQuote: r.shareable_quote,
          scoreTier: r.score_tier,
          personaCharacterId: r.persona_character_id,
          currentField: r.current_field,
          isStudent: r.is_student,
        }));
        return json({ slug, results: formatted });
      }

      case "chat": {
        if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
        const { messages, useSearch } = body as { messages?: { role: string; content: string; metadata?: { thoughtSignature?: string } }[]; useSearch?: boolean };
        const subscription = await supabase.from("subscriptions").select("tier").eq("user_id", user!.id).single();
        const tier = (subscription?.data?.tier ?? "free") as string;
        if (!isPaidTier(tier)) {
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);
          const { count: chatMessagesThisMonth } = await supabase.from("chat_history").select("*", { count: "exact", head: true }).eq("user_id", user!.id).eq("role", "user").gte("created_at", startOfMonth.toISOString());
          if ((chatMessagesThisMonth ?? 0) >= 10) return json({ error: "Message limit reached. Upgrade for unlimited AI coaching." }, 402);
        }
        const config = getGeminiConfig();
        if (!config) return json({ error: "AI is not configured. Set GEMINI_API_KEY." }, 500);
        const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
        const { data: roadmap } = await supabase.from("roadmaps").select("*").eq("user_id", user!.id).eq("status", "active").order("created_at", { ascending: false }).limit(1).single();
        let currentWeekTitle = "No roadmap";
        if (roadmap) {
          const { data: weeks } = await supabase.from("roadmap_weeks").select("title, is_completed").eq("roadmap_id", roadmap.id).order("week_number");
          const firstIncomplete = (weeks ?? []).find((w: { is_completed?: boolean }) => !w?.is_completed) as { title?: string } | undefined;
          currentWeekTitle = firstIncomplete?.title ?? "All weeks completed!";
        }
        const systemPromptBase =
          `<role>You are Shyftcut AI, a friendly career coach. Help with career transition, skills, interviews, resume, salary negotiation. Be encouraging and practical. Keep responses concise.</role>
<context>
${profile ? `User: ${(profile as { job_title?: string }).job_title ?? "Not specified"} → ${(profile as { target_career?: string }).target_career ?? "Not specified"}, ${(profile as { experience_level?: string }).experience_level ?? ""}. Skills: ${((profile as { skills?: string[] }).skills ?? []).join(", ") || "Not specified"}` : "No profile."}
${roadmap ? `Roadmap: ${(roadmap as { title?: string }).title}, Progress: ${(roadmap as { progress_percentage?: number }).progress_percentage}%, Current week: ${currentWeekTitle}` : ""}
</context>`;
        const preferredLang = (profile as { preferred_language?: string })?.preferred_language;
        const languageInstruction = preferredLang === "ar" ? "\n<language>Respond in Egyptian modern professional Arabic (فصحى عصرية مصرية) unless the user writes in another language. Warm, conversational, professional. Write like a native Egyptian career coach.</language>" : "";
        const systemPrompt = systemPromptBase + languageInstruction;
        const rawList = Array.isArray(messages) ? messages.slice(-MAX_CHAT_MESSAGES) : [];
        let totalChars = 0;
        const trimmedMessages = rawList.map((m) => {
          const content = sanitizeUserText(m?.content, MAX_CHAT_MESSAGE_LEN);
          const meta = (m as { metadata?: { thoughtSignature?: string } }).metadata;
          const thoughtSig = meta?.thoughtSignature ? sanitizeUserText(meta.thoughtSignature, 4096) : undefined;
          return {
            ...m,
            content,
            metadata: thoughtSig !== undefined ? { thoughtSignature: thoughtSig } : undefined,
          } as { role: string; content: string; metadata?: { thoughtSignature?: string } };
        });
        for (const m of trimmedMessages) {
          totalChars += m.content.length;
          if (totalChars > MAX_CHAT_TOTAL_CHARS) {
            return json({ error: "Conversation is too long. Please start a new chat or shorten messages." }, 400);
          }
        }
        const hasThoughtSigs = trimmedMessages.some((m) => (m as { metadata?: { thoughtSignature?: string } }).metadata?.thoughtSignature);
        const contents = hasThoughtSigs ? contentsFromChatMessages(trimmedMessages as { role: string; content: string; metadata?: { thoughtSignature?: string } }[]) : messagesToGeminiContents(trimmedMessages);
        if (contents.length === 0) return json({ error: "At least one message required" }, 400);
        const bodyPayload: Record<string, unknown> = {
          contents,
          generationConfig: { thinkingConfig: { thinkingLevel: "low" }, temperature: 1.0, maxOutputTokens: 2048 },
        };
        if (systemPrompt.length >= MIN_SYSTEM_PROMPT_LENGTH_FOR_CACHE) {
          const cachedName = await createCachedContent(config.apiKey, config.model, systemPrompt, "shyftcut-chat", 3600);
          if (cachedName) bodyPayload.cachedContent = cachedName;
        }
        if (!bodyPayload.cachedContent) bodyPayload.systemInstruction = { parts: [{ text: systemPrompt }] };
        if (useSearch === true) bodyPayload.tools = [{ google_search: {} }];
        const aiRes = await geminiFetchWithRetry(getGeminiStreamUrl(config.model), {
          method: "POST",
          headers: getGeminiHeaders(config.apiKey),
          body: JSON.stringify(bodyPayload),
        });
        if (aiRes.status === 429) return json({ error: "Rate limit exceeded. Please try again later." }, 429);
        if (aiRes.status === 402) return json({ error: "Message limit reached. Upgrade for unlimited AI coaching." }, 402);
        if (!aiRes.ok) {
          const errBody = await aiRes.text();
          console.error("chat AI error:", aiRes.status, errBody);
          let userMsg = "Failed to get AI response. Please try again.";
          try {
            const errJson = errBody.trim() ? (JSON.parse(errBody) as { error?: { message?: string; code?: number; status?: string } }) : {};
            const geminiMsg = errJson?.error?.message ?? "";
            if (aiRes.status === 401) userMsg = "Invalid AI configuration. Please contact support.";
            else if (aiRes.status === 400 && geminiMsg) userMsg = geminiMsg.slice(0, 200);
            else if (aiRes.status >= 500) userMsg = "AI service is temporarily unavailable. Please try again in a moment.";
            else if (geminiMsg) userMsg = geminiMsg.slice(0, 200);
          } catch {
            /* use default */
          }
          return json({ error: userMsg }, 500);
        }
        const stream = aiRes.body;
        if (!stream) return json({ error: "No response body" }, 500);
        let sseBuffer = "";
        let streamBlocked = false;
        let lastThoughtSignature: string | null = null;
        let groundingCitations: Array<{ uri: string; title?: string }> = [];
        const corsH = corsHeaders as Record<string, string>;
        return new Response(
          stream.pipeThrough(new TextDecoderStream()).pipeThrough(
            new TransformStream({
              transform(chunk, controller) {
                sseBuffer += chunk;
                const lines = sseBuffer.split("\n");
                sseBuffer = lines.pop() ?? "";
                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed.startsWith("data:")) continue;
                  const payload = trimmed.slice(5).trim();
                  if (payload === "[DONE]") continue;
                  try {
                    const data = JSON.parse(payload) as {
                      candidates?: Array<{
                        finishReason?: string;
                        content?: { parts?: Array<{ text?: string; thoughtSignature?: string }> };
                        groundingMetadata?: { groundingChunks?: Array<{ web?: { uri?: string; title?: string } }> };
                      }>;
                      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number; thoughtsTokenCount?: number };
                    };
                    if (data.usageMetadata) logGeminiUsage(data.usageMetadata, "chat");
                    const cand0 = data.candidates?.[0];
                    const gm = (cand0 as { groundingMetadata?: { groundingChunks?: Array<{ web?: { uri?: string; title?: string } }> } })?.groundingMetadata;
                    if (gm?.groundingChunks?.length) {
                      groundingCitations = gm.groundingChunks
                        .map((c) => c.web)
                        .filter((w): w is { uri?: string; title?: string } => !!w && !!w.uri)
                        .map((w) => ({ uri: w.uri!, title: w.title }));
                    }
                    const parts = data.candidates?.[0]?.content?.parts ?? [];
                    for (const p of parts) {
                      const sig = (p as { thoughtSignature?: string }).thoughtSignature;
                      if (sig) lastThoughtSignature = sig;
                    }
                    const cands = data.candidates ?? [];
                    const finishCheck = checkGeminiFinishReason(cands, cands[0]?.finishReason);
                    if (!finishCheck.ok) {
                      streamBlocked = true;
                      const msg = finishCheck.userMessage ?? CHAT_BLOCKED_MESSAGE;
                      controller.enqueue("data: " + JSON.stringify({ choices: [{ delta: { content: msg } }] }) + "\n");
                      continue;
                    }
                    if (!streamBlocked) {
                      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                      if (text) controller.enqueue("data: " + JSON.stringify({ choices: [{ delta: { content: text } }] }) + "\n");
                    }
                  } catch {
                    /* skip */
                  }
                }
              },
              flush(controller) {
                if (!streamBlocked && sseBuffer.trim().startsWith("data:")) {
                  const payload = sseBuffer.trim().slice(5).trim();
                  if (payload !== "[DONE]") {
                    try {
                      const data = JSON.parse(payload) as {
                        candidates?: Array<{
                          finishReason?: string;
                          content?: { parts?: Array<{ text?: string; thoughtSignature?: string }> };
                          groundingMetadata?: { groundingChunks?: Array<{ web?: { uri?: string; title?: string } }> };
                        }>;
                        usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number; thoughtsTokenCount?: number };
                      };
                      const cand0Flush = data.candidates?.[0];
                      const gmFlush = (cand0Flush as { groundingMetadata?: { groundingChunks?: Array<{ web?: { uri?: string; title?: string } }> } })?.groundingMetadata;
                      if (gmFlush?.groundingChunks?.length) {
                        groundingCitations = gmFlush.groundingChunks
                          .map((c) => c.web)
                          .filter((w): w is { uri?: string; title?: string } => !!w && !!w.uri)
                          .map((w) => ({ uri: w.uri!, title: w.title }));
                      }
                      const parts = data.candidates?.[0]?.content?.parts ?? [];
                      for (const p of parts) {
                        const sig = (p as { thoughtSignature?: string }).thoughtSignature;
                        if (sig) lastThoughtSignature = sig;
                      }
                      const cands = data.candidates ?? [];
                      const finishCheck = checkGeminiFinishReason(cands, cands[0]?.finishReason);
                      if (!finishCheck.ok) {
                        const msg = finishCheck.userMessage ?? CHAT_BLOCKED_MESSAGE;
                        controller.enqueue("data: " + JSON.stringify({ choices: [{ delta: { content: msg } }] }) + "\n");
                      } else {
                        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text) controller.enqueue("data: " + JSON.stringify({ choices: [{ delta: { content: text } }] }) + "\n");
                      }
                      logGeminiUsage(data.usageMetadata, "chat");
                    } catch {
                      /* skip */
                    }
                  }
                }
                if (lastThoughtSignature) {
                  controller.enqueue("data: " + JSON.stringify({ thoughtSignature: lastThoughtSignature }) + "\n");
                }
                if (groundingCitations.length > 0) {
                  controller.enqueue("data: " + JSON.stringify({ citations: groundingCitations }) + "\n");
                }
                controller.enqueue("data: [DONE]\n");
              },
            })
          ).pipeThrough(new TextEncoderStream()),
          {
            status: 200,
            headers: {
              ...corsH,
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
          }
        );
      }

      case "quiz/generate": {
        if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
        try {
          const { weekId, skills, weekTitle } = body as { weekId?: string; skills?: string[]; weekTitle?: string };
          const safeWeekTitle = sanitizeUserText(weekTitle, MAX_QUIZ_WEEK_TITLE_LEN) || "General";
          const skillList = Array.isArray(skills) ? skills.slice(0, MAX_QUIZ_SKILLS_ITEMS).map((s) => sanitizeUserText(s, MAX_QUIZ_SKILL_LEN)).filter(Boolean) : [];
          const subscription = await supabase.from("subscriptions").select("tier").eq("user_id", user!.id).single();
          const tier = (subscription?.data?.tier ?? "free") as string;
          if (!isPaidTier(tier)) {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            const { count: quizzesThisMonth } = await supabase.from("quiz_results").select("*", { count: "exact", head: true }).eq("user_id", user!.id).gte("completed_at", startOfMonth.toISOString());
            if ((quizzesThisMonth ?? 0) >= 3) return json({ error: "Quiz limit reached. Upgrade for unlimited quizzes." }, 402);
          }
          const config = getGeminiConfig();
          if (!config) return json({ error: "AI is not configured. Set GEMINI_API_KEY." }, 500);
          const systemPrompt = `<role>You are a career education expert. Create a quiz from the provided context.</role>
<context>
Week Topic: ${safeWeekTitle}
Skills: ${skillList.join(", ")}
</context>
<task>Based on the information above, create 5 multiple-choice questions, 4 options each, one correct. Include brief explanation for the correct answer.</task>`;
          const createQuizParams = {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: { question: { type: "string" }, options: { type: "array", items: { type: "string" } }, correct_index: { type: "number" }, explanation: { type: "string" } },
                  required: ["question", "options", "correct_index", "explanation"],
                },
              },
            },
            required: ["questions"],
          };
          const aiRes = await geminiFetchWithRetry(getGeminiGenerateContentUrl(config.model), {
            method: "POST",
            headers: getGeminiHeaders(config.apiKey),
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents: [{ role: "user", parts: [{ text: "Generate a 5-question quiz for this week's learning." }] }],
              tools: [{ functionDeclarations: [openAiFunctionToGeminiDeclaration("create_quiz", "Create a multiple choice quiz", createQuizParams)] }],
              toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["create_quiz"] } },
              generationConfig: { thinkingConfig: { thinkingLevel: isGemini3Flash(config.model) ? "minimal" : "low" }, temperature: 1.0, maxOutputTokens: 4096 },
            }),
          });
          if (aiRes.status === 429) return json({ error: "Rate limit exceeded. Please try again later." }, 429);
          if (aiRes.status === 402) return json({ error: "Payment required. Please add credits to continue." }, 402);
          if (!aiRes.ok) {
            console.error("quiz generate AI error:", aiRes.status, await aiRes.text());
            return json({ error: "Failed to generate quiz" }, 500);
          }
          const aiJson = (await aiRes.json()) as { candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ functionCall?: { name?: string; args?: string } }> } }>; usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number; thoughtsTokenCount?: number } };
          const quizCands = aiJson.candidates ?? [];
          const quizFinishCheck = checkGeminiFinishReason(quizCands, quizCands[0]?.finishReason);
          if (!quizFinishCheck.ok) {
            console.error("quiz/generate: blocked finish reason", quizFinishCheck.finishReason);
            return json({ error: quizFinishCheck.userMessage ?? "Quiz generation was blocked. Please try again." }, 400);
          }
          if (!isOkFinishReasonForFunctionCall(quizCands[0]?.finishReason)) {
            return json({ error: "Invalid AI response format" }, 500);
          }
          logGeminiUsage(aiJson.usageMetadata, "quiz/generate");
          const parts = aiJson.candidates?.[0]?.content?.parts ?? [];
          const fnPart = parts.find((p: { functionCall?: { name?: string } }) => p.functionCall?.name === "create_quiz");
          const argsStr = fnPart?.functionCall?.args;
          if (!argsStr) return json({ error: "Invalid AI response format" }, 500);
          const quizArgsEnc = typeof argsStr === "string" ? argsStr : JSON.stringify(argsStr);
          if (new TextEncoder().encode(quizArgsEnc).length > MAX_FC_ARGS_BYTES) return json({ error: "Invalid AI response format" }, 500);
          const rawQuizData = JSON.parse(typeof argsStr === "string" ? argsStr : JSON.stringify(argsStr)) as Record<string, unknown>;
          const { questions: cleanedQuestions } = cleanQuizOutput(rawQuizData);
          if (cleanedQuestions.length === 0) return json({ error: "Invalid quiz structure from AI" }, 500);
          return json({ success: true, weekId: weekId ?? null, questions: cleanedQuestions });
        } catch (err) {
          logError("quiz/generate", "unexpected error", err);
          return json({ error: "Quiz generation failed. Please try again." }, 500);
        }
      }

      case "auth/sync": {
        if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
        const { displayName } = body as { displayName?: string };
        const name = (displayName ?? user!.user_metadata?.display_name ?? user!.email?.split("@")[0] ?? "User") as string;
        await ensureProfileAndSubscription(supabase, user!.id, user!.email, typeof name === "string" ? name : undefined);
        return json({ success: true });
      }

      case "auth/account": {
        if (req.method === "GET") {
          const { data: authUserData } = await supabase.auth.admin.getUserById(user!.id);
          const identities = authUserData?.user?.identities ?? [];
          const has_password = identities.some((i: { provider?: string }) => i.provider === "email");
          const has_google = identities.some((i: { provider?: string }) => i.provider === "google");
          return json({ has_password, has_google });
        }
        if (req.method === "DELETE") {
          const { password, confirm } = body as { password?: string; confirm?: string };
          const { data: authUserData } = await supabase.auth.admin.getUserById(user!.id);
          const identities = authUserData?.user?.identities ?? [];
          const hasPassword = identities.some((i: { provider?: string }) => i.provider === "email");
          if (hasPassword) {
            if (!password) return json({ error: "Password required to delete account" }, 400);
            const { data: profileRow } = await supabase.from("profiles").select("email").eq("user_id", user!.id).single();
            const email = (profileRow?.email ?? user!.email) ?? "";
            const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
            const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
            if (!email || !(await verifyPassword(supabaseUrl, anonKey, email, password))) return json({ error: "Invalid password" }, 401);
          } else {
            if (confirm !== "DELETE") return json({ error: "Type DELETE to confirm account deletion" }, 400);
          }
          await supabase.from("chat_history").delete().eq("user_id", user!.id);
          const { data: weekRows } = await supabase.from("roadmap_weeks").select("id").eq("user_id", user!.id);
          for (const w of weekRows ?? []) {
            await supabase.from("quiz_results").delete().eq("roadmap_week_id", (w as { id: string }).id);
            await supabase.from("course_recommendations").delete().eq("roadmap_week_id", (w as { id: string }).id);
          }
          await supabase.from("roadmap_weeks").delete().eq("user_id", user!.id);
          await supabase.from("roadmaps").delete().eq("user_id", user!.id);
          await supabase.from("subscriptions").delete().eq("user_id", user!.id);
          await supabase.from("profiles").delete().eq("user_id", user!.id);
          await supabase.auth.admin.deleteUser(user!.id);
          return json({ success: true });
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "auth/set-password": {
        if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
        const { newPassword } = body as { newPassword?: string };
        const pwdValidation = validatePasswordStrong(newPassword ?? "");
        if (!pwdValidation.valid) return json({ error: pwdValidation.error }, 400);
        const { error: updateErr } = await supabase.auth.admin.updateUserById(user!.id, { password: newPassword });
        if (updateErr) return json({ error: updateErr.message }, 400);
        return json({ success: true });
      }

      case "auth/change-password": {
        if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
        const { currentPassword, newPassword } = body as { currentPassword?: string; newPassword?: string };
        if (!currentPassword || !newPassword) return json({ error: "Current password and new password required" }, 400);
        const pwdValidation = validatePasswordStrong(newPassword);
        if (!pwdValidation.valid) return json({ error: pwdValidation.error }, 400);
        const { data: profileRow } = await supabase.from("profiles").select("email").eq("user_id", user!.id).single();
        const email = (profileRow?.email ?? user!.email) ?? "";
        if (!email) return json({ error: "User email not found" }, 400);
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
        if (!(await verifyPassword(supabaseUrl, anonKey, email, currentPassword))) return json({ error: "Invalid current password" }, 401);
        const { error: updateErr } = await supabase.auth.admin.updateUserById(user!.id, { password: newPassword });
        if (updateErr) return json({ error: updateErr.message }, 400);
        return json({ success: true });
      }

      case "admin/users": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        if (req.method === "GET") {
          const search = url.searchParams.get("search") ?? "";
          const role = url.searchParams.get("role") ?? "";
          const tier = url.searchParams.get("tier") ?? "";
          const status = url.searchParams.get("status") ?? "";
          const startDate = url.searchParams.get("start_date") ?? "";
          const endDate = url.searchParams.get("end_date") ?? "";
          const page = parseInt(url.searchParams.get("page") ?? "1", 10);
          const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 100);
          const offset = (page - 1) * limit;
          
          let query = supabase.from("profiles").select("user_id, display_name, email, created_at, role, job_title, target_career, experience_level, industry, skills, learning_style, weekly_hours, budget, preferred_language, onboarding_completed, location, job_work_preference, find_jobs_enabled, linkedin_url, twitter_url, github_url, phone", { count: "exact" });
          
          if (search) {
            const searchPattern = `%${search}%`;
            query = query.or(`display_name.ilike.${searchPattern},email.ilike.${searchPattern}`);
          }
          if (role) {
            query = query.eq("role", role);
          }
          if (startDate) {
            query = query.gte("created_at", startDate);
          }
          if (endDate) {
            query = query.lte("created_at", endDate);
          }
          
          let profilesData: any[] | null = null;
          let profilesCount: number | null = null;
          let profilesErr: any = null;
          
          const result = await query.order("created_at", { ascending: false }).range(0, 9999);
          profilesData = result.data;
          profilesCount = result.count;
          profilesErr = result.error;
          
          if (profilesErr) {
            const errMsg = String(profilesErr.message || profilesErr).toLowerCase();
            logError("api", "admin/users: query error", { error: profilesErr, search, role, errMsg });
            
            // If .or() syntax error and we have search, try fallback approach
            if ((errMsg.includes("or") || errMsg.includes("syntax") || errMsg.includes("parse")) && search) {
              logError("api", "admin/users: .or() syntax error, using fallback queries", profilesErr);
              try {
                const searchPattern = `%${search}%`;
                let nameQuery = supabase.from("profiles").select("*", { count: "exact" }).ilike("display_name", searchPattern);
                let emailQuery = supabase.from("profiles").select("*", { count: "exact" }).ilike("email", searchPattern);
                if (role) {
                  nameQuery = nameQuery.eq("role", role);
                  emailQuery = emailQuery.eq("role", role);
                }
                if (startDate) {
                  nameQuery = nameQuery.gte("created_at", startDate);
                  emailQuery = emailQuery.gte("created_at", startDate);
                }
                if (endDate) {
                  nameQuery = nameQuery.lte("created_at", endDate);
                  emailQuery = emailQuery.lte("created_at", endDate);
                }
                const [nameResult, emailResult] = await Promise.all([
                  nameQuery.order("created_at", { ascending: false }).range(0, 9999),
                  emailQuery.order("created_at", { ascending: false }).range(0, 9999)
                ]);
                if (nameResult.error && !nameResult.error.message?.toLowerCase().includes("role")) throw nameResult.error;
                if (emailResult.error && !emailResult.error.message?.toLowerCase().includes("role")) throw emailResult.error;
                const nameData = nameResult.data ?? [];
                const emailData = emailResult.data ?? [];
                const combined = [...nameData, ...emailData];
                const uniqueMap = new Map();
                for (const p of combined) {
                  uniqueMap.set((p as any).user_id, p);
                }
                profilesData = Array.from(uniqueMap.values()) as any[];
                profilesCount = profilesData.length;
                profilesErr = null;
              } catch (fallbackErr) {
                logError("api", "admin/users: fallback query also failed", fallbackErr);
                // Continue to role retry logic below
              }
            }
            
            // If role column error, retry without role filter
            if (profilesErr && (errMsg.includes("role") || errMsg.includes("column")) && role) {
              logError("api", "admin/users: role column may not exist, retrying without role filter", profilesErr);
              query = supabase.from("profiles").select("*", { count: "exact" });
              if (search) {
                const searchPattern = `%${search}%`;
                query = query.or(`display_name.ilike.${searchPattern},email.ilike.${searchPattern}`);
              }
              if (startDate) query = query.gte("created_at", startDate);
              if (endDate) query = query.lte("created_at", endDate);
              const retry = await query.order("created_at", { ascending: false }).range(0, 9999);
              if (retry.error) {
                logError("api", "admin/users: retry without role also failed", retry.error);
                throw retry.error;
              }
              profilesData = retry.data;
              profilesCount = retry.count;
              profilesErr = null;
            } else if (profilesErr) {
              throw profilesErr;
            }
          }
          const allProfiles = profilesData ?? [];
          const userIds = allProfiles.map((p: { user_id: string }) => p.user_id).filter(Boolean);
          const subsByUser: Record<string, { tier: string; status: string }> = {};
          if (userIds.length > 0) {
            try {
              const { data: subs, error: subsError } = await supabase.from("subscriptions").select("user_id, tier, status").in("user_id", userIds);
              if (subsError) {
                logError("api", "admin/users: subscriptions query error", subsError);
              } else {
                for (const s of subs ?? []) {
                  if (s.user_id) {
                    subsByUser[s.user_id] = { tier: s.tier || "free", status: s.status || "active" };
                  }
                }
              }
            } catch (subsErr) {
              logError("api", "admin/users: subscriptions query exception", subsErr);
            }
          }
          let filtered = allProfiles.map((p: any) => ({
            ...p,
            subscriptions: p.user_id && subsByUser[p.user_id] ? [{ tier: subsByUser[p.user_id].tier, status: subsByUser[p.user_id].status }] : [],
          }));
          if (tier) {
            filtered = filtered.filter((p: any) => p.user_id && subsByUser[p.user_id]?.tier === tier);
          }
          if (status) {
            filtered = filtered.filter((p: any) => p.user_id && subsByUser[p.user_id]?.status === status);
          }
          const total = filtered.length;
          const paginated = filtered.slice(offset, offset + limit);
          try {
          await logAdminAction(supabase, user!.id, "list_users", "users", undefined, { filters: { search, role, tier, status } }, req);
          } catch (logErr) {
            logError("api", "admin/users: failed to log action", logErr);
          }
          return json({
            users: paginated,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
          });
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/users/create": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
        const { email, password, display_name: displayName, tier: requestedTier, period: periodParam } = body as { email?: string; password?: string; display_name?: string; tier?: string; period?: string };
        const emailTrim = typeof email === "string" ? email.trim().toLowerCase() : "";
        const tier = requestedTier === "premium" ? "premium" : "free";
        const period = periodParam === "1_month" ? "1_month" : "1_year";
        if (!emailTrim || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) return json({ error: "Invalid email" }, 400);
        if (typeof password !== "string" || password.length < 6) return json({ error: "Password must be at least 6 characters" }, 400);
        const { data: createData, error: createErr } = await supabase.auth.admin.createUser({
          email: emailTrim,
          password: password as string,
          email_confirm: true,
          user_metadata: displayName ? { display_name: displayName.trim().slice(0, 500) } : undefined,
        });
        if (createErr) {
          const msg = String(createErr.message || "").toLowerCase();
          if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) return json({ error: "A user with this email is already registered." }, 400);
          return json({ error: createErr.message || "Failed to create user" }, 400);
        }
        const userId = createData?.user?.id;
        if (!userId) return json({ error: "User created but no ID returned" }, 500);
        if (displayName) {
          await supabase.from("profiles").update({ display_name: displayName.trim().slice(0, 500), updated_at: new Date().toISOString() }).eq("user_id", userId);
        }
        const now = new Date();
        const periodEnd = period === "1_month" ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) : new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        const subUpdate: Record<string, unknown> = { tier, updated_at: new Date().toISOString() };
        if (tier === "premium") {
          subUpdate.current_period_start = now.toISOString();
          subUpdate.current_period_end = periodEnd.toISOString();
        }
        const { error: subErr } = await supabase.from("subscriptions").update(subUpdate).eq("user_id", userId);
        if (subErr) logError("api", "admin/users/create: subscription update failed", subErr);
        try {
          await logAdminAction(supabase, user!.id, "create_user", "users", userId, { email: emailTrim, tier, period: tier === "premium" ? period : undefined }, req);
        } catch (logErr) {
          logError("api", "admin/users/create: failed to log action", logErr);
        }
        return json({ user_id: userId, email: emailTrim }, 201);
      }

      case "admin/users/invite": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
        const { email, tier: requestedTier, display_name: displayName, period: periodParam } = body as { email?: string; tier?: string; display_name?: string; period?: string };
        const emailTrim = typeof email === "string" ? email.trim().toLowerCase() : "";
        const tier = requestedTier === "free" ? "free" : "premium";
        const period = periodParam === "1_month" ? "1_month" : "1_year";
        if (!emailTrim || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) return json({ error: "Invalid email" }, 400);
        const metadata: Record<string, string> = { invited_tier: tier };
        if (tier === "premium") metadata.invited_period = period;
        if (displayName && typeof displayName === "string") metadata.display_name = displayName.trim().slice(0, 500);
        const siteUrl = (Deno.env.get("SITE_URL") ?? "https://shyftcut.com").replace(/\/$/, "");
        const redirectTo = `${siteUrl}/accept-invite`;
        const { data: inviteData, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(emailTrim, { data: metadata, redirectTo });
        if (inviteErr) {
          const msg = String(inviteErr.message || "").toLowerCase();
          if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) return json({ error: "A user with this email is already registered." }, 400);
          return json({ error: inviteErr.message || "Failed to send invitation" }, 400);
        }
        try {
          await logAdminAction(supabase, user!.id, "invite_user", "users", inviteData?.user?.id, { email: emailTrim, invited_tier: tier, period: tier === "premium" ? period : undefined }, req);
        } catch (logErr) {
          logError("api", "admin/users/invite: failed to log action", logErr);
        }
        return json({ email: emailTrim, invited_tier: tier, period: tier === "premium" ? period : undefined }, 201);
      }

      case "admin/users/stats": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        if (req.method === "GET") {
          const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true });
          const { count: freeUsers } = await supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("tier", "free");
          const { count: premiumUsers } = await supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("tier", "premium");
          const { count: proUsers } = await supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("tier", "pro");
          
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const { count: newUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo.toISOString());
          
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          const { count: activeUsers } = await supabase
            .from("study_activity")
            .select("user_id", { count: "exact", head: true })
            .gte("activity_date", sevenDaysAgo.toISOString().split("T")[0]);
          
          await logAdminAction(supabase, user!.id, "view_user_stats", "users", undefined, {}, req);
          
          return json({
            total: totalUsers ?? 0,
            byTier: { free: freeUsers ?? 0, premium: premiumUsers ?? 0, pro: proUsers ?? 0 },
            newUsersLast30Days: newUsers ?? 0,
            activeUsersLast7Days: activeUsers ?? 0,
          });
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/users/id": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        const userId = pathSegments[2];
        if (!userId || !UUID_REGEX.test(userId)) return json({ error: "Invalid user ID" }, 400);
        
        if (req.method === "GET") {
          const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
          if (!profile) return json({ error: "User not found" }, 404);
          
          const { data: subscription } = await supabase.from("subscriptions").select("*").eq("user_id", userId).single();
          const { data: roadmaps } = await supabase.from("roadmaps").select("id, title, created_at, progress_percentage").eq("user_id", userId).order("created_at", { ascending: false });
          const { data: activity } = await supabase.from("study_activity").select("*").eq("user_id", userId).order("activity_date", { ascending: false }).limit(50);
          
          await logAdminAction(supabase, user!.id, "view_user", "users", userId, {}, req);
          
          return json({ profile, subscription, roadmaps: roadmaps ?? [], activity: activity ?? [] });
        }
        
        if (req.method === "PATCH") {
          const updates = body as Record<string, unknown>;
          const allowedFields = ["display_name", "email", "role", "job_title", "target_career", "experience_level", "industry", "skills", "learning_style", "weekly_hours", "budget", "preferred_language", "onboarding_completed", "location", "job_work_preference", "find_jobs_enabled", "linkedin_url", "twitter_url", "github_url", "phone"];
          const updatePayload: Record<string, unknown> = {};
          
          for (const field of allowedFields) {
            if (field in updates) {
              updatePayload[field] = updates[field];
            }
          }
          
          const { data, error } = await supabase.from("profiles").update(updatePayload).eq("user_id", userId).select().single();
          if (error) throw error;
          
          await logAdminAction(supabase, user!.id, "update_user", "users", userId, { fields: Object.keys(updatePayload) }, req);
          
          return json(data);
        }
        
        if (req.method === "DELETE") {
          const { cascade } = body as { cascade?: boolean };
          
          if (cascade) {
            await supabase.from("chat_history").delete().eq("user_id", userId);
            const { data: weekRows } = await supabase.from("roadmap_weeks").select("id").eq("user_id", userId);
            for (const w of weekRows ?? []) {
              await supabase.from("quiz_results").delete().eq("roadmap_week_id", (w as { id: string }).id);
              await supabase.from("course_recommendations").delete().eq("roadmap_week_id", (w as { id: string }).id);
            }
            await supabase.from("roadmap_weeks").delete().eq("user_id", userId);
            await supabase.from("roadmaps").delete().eq("user_id", userId);
          }
          
          await supabase.from("subscriptions").delete().eq("user_id", userId);
          await supabase.from("profiles").delete().eq("user_id", userId);
          await supabase.auth.admin.deleteUser(userId);
          
          await logAdminAction(supabase, user!.id, "delete_user", "users", userId, { cascade: !!cascade }, req);
          
          return json({ success: true });
        }
        
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/users/impersonate": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        if (req.method === "POST") {
          const userId = pathSegments[2];
          if (!userId || !UUID_REGEX.test(userId)) return json({ error: "Invalid user ID" }, 400);
          
          const { data: authUser } = await supabase.auth.admin.getUserById(userId);
          if (!authUser.user) return json({ error: "User not found" }, 404);
          
          const { data: session } = await supabase.auth.admin.generateLink({
            type: "magiclink",
            email: authUser.user.email ?? "",
          });
          
          await logAdminAction(supabase, user!.id, "impersonate_user", "users", userId, {}, req);
          
          return json({ impersonationLink: session.properties?.action_link });
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/users/ban": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        if (req.method === "POST") {
          const userId = pathSegments[2];
          if (!userId || !UUID_REGEX.test(userId)) return json({ error: "Invalid user ID" }, 400);
          const { banned } = body as { banned?: boolean };
          
          if (banned === true) {
            await supabase.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
            await logAdminAction(supabase, user!.id, "ban_user", "users", userId, {}, req);
          } else {
            await supabase.auth.admin.updateUserById(userId, { ban_duration: "none" });
            await logAdminAction(supabase, user!.id, "unban_user", "users", userId, {}, req);
          }
          
          return json({ success: true });
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/users/journey": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        if (req.method === "GET") {
          const userId = pathSegments[3];
          if (!userId || !UUID_REGEX.test(userId)) return json({ error: "Invalid user ID" }, 400);
          
          // Get user events
          const { data: events } = await supabase
            .from("user_events")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: true })
            .limit(1000);
          
          // Get sessions
          const { data: sessions } = await supabase
            .from("user_sessions")
            .select("*")
            .eq("user_id", userId)
            .order("started_at", { ascending: true });
          
          // Get conversions
          const { data: conversions } = await supabase
            .from("conversion_events")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: true });
          
          // Get roadmaps
          const { data: roadmaps } = await supabase
            .from("roadmaps")
            .select("id, title, created_at, progress_percentage")
            .eq("user_id", userId)
            .order("created_at", { ascending: true });
          
          // Get subscription history
          const { data: subscriptionEvents } = await supabase
            .from("subscription_events")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: true });
          
          // Build timeline
          const timeline: Array<{
            type: string;
            timestamp: string;
            data: unknown;
          }> = [];
          
          if (events) {
            for (const event of events) {
              timeline.push({
                type: "event",
                timestamp: event.created_at,
                data: event,
              });
            }
          }
          
          if (sessions) {
            for (const session of sessions) {
              timeline.push({
                type: "session",
                timestamp: session.started_at,
                data: session,
              });
            }
          }
          
          if (conversions) {
            for (const conv of conversions) {
              timeline.push({
                type: "conversion",
                timestamp: conv.created_at,
                data: conv,
              });
            }
          }
          
          if (roadmaps) {
            for (const roadmap of roadmaps) {
              timeline.push({
                type: "roadmap",
                timestamp: roadmap.created_at,
                data: roadmap,
              });
            }
          }
          
          if (subscriptionEvents) {
            for (const subEvent of subscriptionEvents) {
              timeline.push({
                type: "subscription_event",
                timestamp: subEvent.created_at,
                data: subEvent,
              });
            }
          }
          
          timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          
          try {
            await logAdminAction(supabase, user!.id, "view_user_journey", "users", userId, {}, req);
          } catch (logErr) {
            logError("api", "admin/users/journey: failed to log action", logErr);
          }
          
          return json({
            timeline,
            events: events ?? [],
            sessions: sessions ?? [],
            conversions: conversions ?? [],
            roadmaps: roadmaps ?? [],
            subscriptionEvents: subscriptionEvents ?? [],
          });
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/users/bulk": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        if (req.method === "POST") {
          const { user_ids, action, data: actionData } = body as {
            user_ids?: string[];
            action?: string;
            data?: Record<string, unknown>;
          };
          
          if (!Array.isArray(user_ids) || user_ids.length === 0) {
            return json({ error: "user_ids array required" }, 400);
          }
          
          if (!action) {
            return json({ error: "action required" }, 400);
          }
          
          const results: Array<{ user_id: string; success: boolean; error?: string }> = [];
          
          for (const userId of user_ids) {
            if (!UUID_REGEX.test(userId)) {
              results.push({ user_id: userId, success: false, error: "Invalid user ID" });
              continue;
            }
            
            try {
              switch (action) {
                case "delete":
                  const cascade = actionData?.cascade === true;
                  if (cascade) {
                    await supabase.from("chat_history").delete().eq("user_id", userId);
                    const { data: weekRows } = await supabase.from("roadmap_weeks").select("id").eq("user_id", userId);
                    for (const w of weekRows ?? []) {
                      await supabase.from("quiz_results").delete().eq("roadmap_week_id", (w as { id: string }).id);
                      await supabase.from("course_recommendations").delete().eq("roadmap_week_id", (w as { id: string }).id);
                    }
                    await supabase.from("roadmap_weeks").delete().eq("user_id", userId);
                    await supabase.from("roadmaps").delete().eq("user_id", userId);
                  }
                  await supabase.from("subscriptions").delete().eq("user_id", userId);
                  await supabase.from("profiles").delete().eq("user_id", userId);
                  await supabase.auth.admin.deleteUser(userId);
                  results.push({ user_id: userId, success: true });
                  break;
                  
                case "update_tier":
                  if (!actionData?.tier) {
                    results.push({ user_id: userId, success: false, error: "tier required" });
                    break;
                  }
                  await supabase
                    .from("subscriptions")
                    .update({ tier: actionData.tier })
                    .eq("user_id", userId);
                  results.push({ user_id: userId, success: true });
                  break;
                  
                case "add_tags":
                  if (!Array.isArray(actionData?.tags)) {
                    results.push({ user_id: userId, success: false, error: "tags array required" });
                    break;
                  }
                  const { data: profile } = await supabase
                    .from("profiles")
                    .select("user_tags")
                    .eq("user_id", userId)
                    .single();
                  const existingTags = (profile?.user_tags as string[]) || [];
                  const newTags = [...new Set([...existingTags, ...(actionData.tags as string[])])];
                  await supabase
                    .from("profiles")
                    .update({ user_tags: newTags })
                    .eq("user_id", userId);
                  results.push({ user_id: userId, success: true });
                  break;
                  
                default:
                  results.push({ user_id: userId, success: false, error: `Unknown action: ${action}` });
              }
            } catch (error) {
              results.push({ user_id: userId, success: false, error: String(error) });
            }
          }
          
          try {
            await logAdminAction(supabase, user!.id, "bulk_user_action", "users", undefined, { action, count: user_ids.length }, req);
          } catch (logErr) {
            logError("api", "admin/users/bulk: failed to log action", logErr);
          }
          
          return json({ results });
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/users/notes": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        const userId = pathSegments[2];
        if (!userId || !UUID_REGEX.test(userId)) return json({ error: "Invalid user ID" }, 400);
        
        if (req.method === "GET") {
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_notes")
            .eq("user_id", userId)
            .single();
          return json({ notes: profile?.user_notes || "" });
        }
        
        if (req.method === "POST") {
          const { notes } = body as { notes?: string };
          await supabase
            .from("profiles")
            .update({ user_notes: notes || null })
            .eq("user_id", userId);
          
          try {
            await logAdminAction(supabase, user!.id, "update_user_notes", "users", userId, {}, req);
          } catch (logErr) {
            logError("api", "admin/users/notes: failed to log action", logErr);
          }
          
          return json({ success: true });
        }
        
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/users/tags": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        const userId = pathSegments[2];
        if (!userId || !UUID_REGEX.test(userId)) return json({ error: "Invalid user ID" }, 400);
        
        if (req.method === "GET") {
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_tags")
            .eq("user_id", userId)
            .single();
          return json({ tags: (profile?.user_tags as string[]) || [] });
        }
        
        if (req.method === "POST") {
          const { action, tags } = body as { action?: "add" | "remove"; tags?: string[] };
          
          if (!action || !Array.isArray(tags)) {
            return json({ error: "action and tags array required" }, 400);
          }
          
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_tags")
            .eq("user_id", userId)
            .single();
          
          const existingTags = (profile?.user_tags as string[]) || [];
          let newTags: string[];
          
          if (action === "add") {
            newTags = [...new Set([...existingTags, ...tags])];
          } else {
            newTags = existingTags.filter(t => !tags.includes(t));
          }
          
          await supabase
            .from("profiles")
            .update({ user_tags: newTags })
            .eq("user_id", userId);
          
          try {
            await logAdminAction(supabase, user!.id, "update_user_tags", "users", userId, { action, tags }, req);
          } catch (logErr) {
            logError("api", "admin/users/tags: failed to log action", logErr);
          }
          
          return json({ success: true, tags: newTags });
        }
        
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/users/export": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        if (req.method === "GET") {
          const format = url.searchParams.get("format") || "json"; // json or csv
          const startDate = url.searchParams.get("start_date");
          const endDate = url.searchParams.get("end_date");
          const tier = url.searchParams.get("tier");
          const status = url.searchParams.get("status");
          const tags = url.searchParams.get("tags"); // comma-separated
          
          let query = supabase.from("profiles").select("*");
          
          if (startDate) query = query.gte("created_at", startDate);
          if (endDate) query = query.lte("created_at", endDate);
          
          const { data: profiles } = await query.order("created_at", { ascending: false }).limit(10000);
          
          // Get subscriptions for filtering
          const userIds = (profiles ?? []).map((p: { user_id: string }) => p.user_id);
          const { data: subscriptions } = await supabase
            .from("subscriptions")
            .select("user_id, tier, status")
            .in("user_id", userIds);
          
          const subsByUser: Record<string, { tier: string; status: string }> = {};
          for (const s of subscriptions ?? []) {
            subsByUser[s.user_id] = { tier: s.tier, status: s.status };
          }
          
          // Filter by tier/status/tags
          let filtered = (profiles ?? []).map((p: any) => ({
            ...p,
            subscription_tier: subsByUser[p.user_id]?.tier || "free",
            subscription_status: subsByUser[p.user_id]?.status || "active",
          }));
          
          if (tier) {
            filtered = filtered.filter((p: any) => subsByUser[p.user_id]?.tier === tier);
          }
          if (status) {
            filtered = filtered.filter((p: any) => subsByUser[p.user_id]?.status === status);
          }
          if (tags) {
            const tagList = tags.split(",").map(t => t.trim());
            filtered = filtered.filter((p: any) => {
              const userTags = (p.user_tags as string[]) || [];
              return tagList.some(tag => userTags.includes(tag));
            });
          }
          
          if (format === "csv") {
            // Convert to CSV
            if (filtered.length === 0) {
              return new Response("No data", { status: 404, headers: { "Content-Type": "text/csv" } });
            }
            
            const headers = Object.keys(filtered[0]);
            const csvRows = [
              headers.join(","),
              ...filtered.map((row: any) =>
                headers.map(header => {
                  const value = row[header];
                  if (Array.isArray(value)) return JSON.stringify(value);
                  if (value === null || value === undefined) return "";
                  return String(value).replace(/"/g, '""');
                }).join(",")
              ),
            ];
            
            const csv = csvRows.join("\n");
            
            try {
              await logAdminAction(supabase, user!.id, "export_users", "users", undefined, { format, count: filtered.length }, req);
            } catch (logErr) {
              logError("api", "admin/users/export: failed to log action", logErr);
            }
            
            return new Response(csv, {
              headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="users_export_${new Date().toISOString().split("T")[0]}.csv"`,
                ...corsHeaders,
              },
            });
          }
          
          try {
            await logAdminAction(supabase, user!.id, "export_users", "users", undefined, { format, count: filtered.length }, req);
          } catch (logErr) {
            logError("api", "admin/users/export: failed to log action", logErr);
          }
          
          return json({ users: filtered, count: filtered.length });
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/subscriptions": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        if (req.method === "GET") {
          const tier = url.searchParams.get("tier") ?? "";
          const status = url.searchParams.get("status") ?? "";
          const startDate = url.searchParams.get("start_date") ?? "";
          const endDate = url.searchParams.get("end_date") ?? "";
          const page = parseInt(url.searchParams.get("page") ?? "1", 10);
          const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 100);
          const offset = (page - 1) * limit;
          
          let query = supabase.from("subscriptions").select("id, user_id, tier, status, current_period_start, current_period_end, created_at", { count: "exact" });
          const includeAll = url.searchParams.get("include_all") === "true";
          if (tier) {
            query = query.eq("tier", tier);
          } else if (!includeAll) {
            query = query.neq("tier", "free");
          }
          if (status) query = query.eq("status", status);
          if (startDate) query = query.gte("created_at", startDate);
          if (endDate) query = query.lte("created_at", endDate);
          const { data: subsData, error, count } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
          if (error) throw error;
          const subs = subsData ?? [];
          const userIds = subs.map((s: { user_id: string }) => s.user_id);
          const profilesByUser: Record<string, { display_name?: string; email?: string }> = {};
          if (userIds.length > 0) {
            const { data: profs } = await supabase.from("profiles").select("user_id, display_name, email").in("user_id", userIds);
            for (const p of profs ?? []) {
              profilesByUser[p.user_id] = { display_name: p.display_name, email: p.email };
            }
          }
          const withProfiles = subs.map((s: any) => ({
            ...s,
            profiles: profilesByUser[s.user_id] ?? {},
          }));
          await logAdminAction(supabase, user!.id, "list_subscriptions", "subscriptions", undefined, { filters: { tier, status } }, req);
          return json({
            subscriptions: withProfiles,
            pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) || 1 },
          });
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/subscriptions/revenue": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        if (req.method === "GET") {
          const { data: premiumSubs } = await supabase.from("subscriptions").select("*").eq("tier", "premium").eq("status", "active");
          const { data: proSubs } = await supabase.from("subscriptions").select("*").eq("tier", "pro").eq("status", "active");
          
          const premiumMonthly = 9.99;
          const premiumYearly = 99.99;
          const proMonthly = 19.99;
          const proYearly = 199.99;
          
          let mrr = 0;
          for (const sub of [...(premiumSubs ?? []), ...(proSubs ?? [])]) {
            const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;
            const periodStart = sub.current_period_start ? new Date(sub.current_period_start) : null;
            if (periodEnd && periodStart) {
              const daysDiff = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
              const isYearly = daysDiff > 300;
              if (sub.tier === "premium") {
                mrr += isYearly ? premiumYearly / 12 : premiumMonthly;
              } else if (sub.tier === "pro") {
                mrr += isYearly ? proYearly / 12 : proMonthly;
              }
            }
          }
          
          const arr = mrr * 12;
          
          await logAdminAction(supabase, user!.id, "view_revenue", "subscriptions", undefined, {}, req);
          
          return json({
            mrr: Math.round(mrr * 100) / 100,
            arr: Math.round(arr * 100) / 100,
            activeSubscriptions: (premiumSubs?.length ?? 0) + (proSubs?.length ?? 0),
          });
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/subscriptions/id": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        const subscriptionId = pathSegments[2];
        if (!subscriptionId || !UUID_REGEX.test(subscriptionId)) return json({ error: "Invalid subscription ID" }, 400);
        
        if (req.method === "GET") {
          const { data: sub, error } = await supabase.from("subscriptions").select("*").eq("id", subscriptionId).single();
          if (error) throw error;
          if (!sub) return json({ error: "Subscription not found" }, 404);
          const { data: prof } = await supabase.from("profiles").select("display_name, email").eq("user_id", sub.user_id).single();
          const data = { ...sub, profiles: prof ?? {} };
          await logAdminAction(supabase, user!.id, "view_subscription", "subscriptions", subscriptionId, {}, req);
          return json(data);
        }
        
        if (req.method === "PATCH") {
          const updates = body as Record<string, unknown>;
          const allowedFields = ["tier", "status", "current_period_start", "current_period_end"];
          const updatePayload: Record<string, unknown> = {};
          
          for (const field of allowedFields) {
            if (field in updates) {
              updatePayload[field] = updates[field];
            }
          }
          
          const { data, error } = await supabase.from("subscriptions").update(updatePayload).eq("id", subscriptionId).select().single();
          if (error) throw error;
          
          await logAdminAction(supabase, user!.id, "update_subscription", "subscriptions", subscriptionId, { fields: Object.keys(updatePayload) }, req);
          
          return json(data);
        }
        
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/subscriptions/events": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        if (req.method === "GET") {
          const subscriptionId = pathSegments[2];
          if (!subscriptionId || !UUID_REGEX.test(subscriptionId)) {
            return json({ error: "Invalid subscription ID" }, 400);
          }
          
          const { data: events } = await supabase
            .from("subscription_events")
            .select("*")
            .eq("subscription_id", subscriptionId)
            .order("created_at", { ascending: true });
          
          try {
            await logAdminAction(supabase, user!.id, "view_subscription_events", "subscriptions", subscriptionId, {}, req);
          } catch (logErr) {
            logError("api", "admin/subscriptions/events: failed to log action", logErr);
          }
          
          return json({ events: events ?? [] });
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/subscriptions/manual-update": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        if (req.method === "POST") {
          const subscriptionId = pathSegments[2];
          if (!subscriptionId || !UUID_REGEX.test(subscriptionId)) {
            return json({ error: "Invalid subscription ID" }, 400);
          }
          
          const { tier, status, current_period_start, current_period_end, reason } = body as {
            tier?: string;
            status?: string;
            current_period_start?: string;
            current_period_end?: string;
            reason?: string;
          };
          
          // Get current subscription
          const { data: currentSub } = await supabase
            .from("subscriptions")
            .select("*")
            .eq("id", subscriptionId)
            .single();
          
          if (!currentSub) {
            return json({ error: "Subscription not found" }, 404);
          }
          
          const updates: Record<string, unknown> = {};
          if (tier) updates.tier = tier;
          if (status) updates.status = status;
          if (current_period_start) updates.current_period_start = current_period_start;
          if (current_period_end) updates.current_period_end = current_period_end;
          
          const { data: updatedSub, error: updateError } = await supabase
            .from("subscriptions")
            .update(updates)
            .eq("id", subscriptionId)
            .select()
            .single();
          
          if (updateError) throw updateError;
          
          // Create subscription event
          const eventType = tier && tier !== currentSub.tier
            ? (tier > currentSub.tier ? "upgraded" : "downgraded")
            : "updated";
          
          await supabase.from("subscription_events").insert({
            subscription_id: subscriptionId,
            user_id: currentSub.user_id,
            event_type: eventType,
            from_tier: currentSub.tier,
            to_tier: (tier || currentSub.tier) as any,
            reason: reason || "Manual admin update",
            metadata: { admin_user_id: user!.id },
          });
          
          try {
            await logAdminAction(supabase, user!.id, "manual_update_subscription", "subscriptions", subscriptionId, { updates }, req);
          } catch (logErr) {
            logError("api", "admin/subscriptions/manual-update: failed to log action", logErr);
          }
          
          return json({ subscription: updatedSub });
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/subscriptions/churn-analysis": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        if (req.method === "GET") {
          const period = url.searchParams.get("period") || "30"; // days
          const periodDays = parseInt(period, 10);
          
          const periodStart = new Date();
          periodStart.setDate(periodStart.getDate() - periodDays);
          
          // Get canceled subscriptions in period
          const { data: canceledSubs } = await supabase
            .from("subscription_events")
            .select("subscription_id, user_id, event_type, created_at, reason, metadata")
            .eq("event_type", "canceled")
            .gte("created_at", periodStart.toISOString());
          
          // Get active subscriptions at start of period
          const { count: activeAtStart } = await supabase
            .from("subscriptions")
            .select("*", { count: "exact", head: true })
            .neq("tier", "free")
            .eq("status", "active")
            .lte("created_at", periodStart.toISOString());
          
          // Get new subscriptions in period
          const { count: newSubs } = await supabase
            .from("subscriptions")
            .select("*", { count: "exact", head: true })
            .neq("tier", "free")
            .gte("created_at", periodStart.toISOString());
          
          // Get current active subscriptions
          const { count: activeNow } = await supabase
            .from("subscriptions")
            .select("*", { count: "exact", head: true })
            .neq("tier", "free")
            .eq("status", "active");
          
          const churned = canceledSubs?.length || 0;
          const churnRate = activeAtStart && activeAtStart > 0
            ? Math.round((churned / activeAtStart) * 10000) / 100
            : 0;
          
          // Churn reasons
          const churnReasons: Record<string, number> = {};
          if (canceledSubs) {
            for (const sub of canceledSubs) {
              const reason = sub.reason || "unknown";
              churnReasons[reason] = (churnReasons[reason] || 0) + 1;
            }
          }
          
          // Retention cohorts (simplified - by signup month)
          const cohortData: Record<string, { total: number; retained: number }> = {};
          const { data: allSubs } = await supabase
            .from("subscriptions")
            .select("user_id, created_at, status")
            .neq("tier", "free");
          
          if (allSubs) {
            for (const sub of allSubs) {
              const signupDate = new Date(sub.created_at);
              const cohort = `${signupDate.getFullYear()}-${String(signupDate.getMonth() + 1).padStart(2, "0")}`;
              if (!cohortData[cohort]) {
                cohortData[cohort] = { total: 0, retained: 0 };
              }
              cohortData[cohort].total++;
              if (sub.status === "active") {
                cohortData[cohort].retained++;
              }
            }
          }
          
          const retentionCohorts = Object.entries(cohortData)
            .map(([cohort, data]) => ({
              cohort,
              total: data.total,
              retained: data.retained,
              retentionRate: Math.round((data.retained / data.total) * 10000) / 100,
            }))
            .sort((a, b) => a.cohort.localeCompare(b.cohort));
          
          try {
            await logAdminAction(supabase, user!.id, "view_churn_analysis", "subscriptions", undefined, { period }, req);
          } catch (logErr) {
            logError("api", "admin/subscriptions/churn-analysis: failed to log action", logErr);
          }
          
          return json({
            period: periodDays,
            churned,
            churnRate,
            activeAtStart: activeAtStart || 0,
            newSubscriptions: newSubs || 0,
            activeNow: activeNow || 0,
            churnReasons: Object.entries(churnReasons).map(([reason, count]) => ({ reason, count })),
            retentionCohorts,
          });
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/subscriptions/refunds": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        if (req.method === "GET") {
          const { data: refundEvents } = await supabase
            .from("subscription_events")
            .select("*, subscriptions(user_id, tier)")
            .eq("event_type", "refunded")
            .order("created_at", { ascending: false })
            .limit(100);
          
          try {
            await logAdminAction(supabase, user!.id, "view_refunds", "subscriptions", undefined, {}, req);
          } catch (logErr) {
            logError("api", "admin/subscriptions/refunds: failed to log action", logErr);
          }
          
          return json({ refunds: refundEvents ?? [] });
        }
        
        if (req.method === "POST") {
          const { subscription_id, amount, reason } = body as {
            subscription_id?: string;
            amount?: number;
            reason?: string;
          };
          
          if (!subscription_id || !UUID_REGEX.test(subscription_id)) {
            return json({ error: "Invalid subscription ID" }, 400);
          }
          
          const { data: sub } = await supabase
            .from("subscriptions")
            .select("*")
            .eq("id", subscription_id)
            .single();
          
          if (!sub) {
            return json({ error: "Subscription not found" }, 404);
          }
          
          // Create refund event
          await supabase.from("subscription_events").insert({
            subscription_id,
            user_id: sub.user_id,
            event_type: "refunded",
            from_tier: sub.tier,
            to_tier: "free",
            amount: amount || 0,
            reason: reason || "Admin refund",
            metadata: { admin_user_id: user!.id },
          });
          
          // Update subscription to free/canceled
          await supabase
            .from("subscriptions")
            .update({ tier: "free", status: "canceled" })
            .eq("id", subscription_id);
          
          try {
            await logAdminAction(supabase, user!.id, "process_refund", "subscriptions", subscription_id, { amount, reason }, req);
          } catch (logErr) {
            logError("api", "admin/subscriptions/refunds: failed to log action", logErr);
          }
          
          return json({ success: true });
        }
        
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/analytics": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        if (req.method === "GET") {
          const startDate = url.searchParams.get("start_date");
          const endDate = url.searchParams.get("end_date");
          
          const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true });
          const { count: activeSubs } = await supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active").neq("tier", "free");
          
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const { count: newUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo.toISOString());
          
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          const { count: dau } = await supabase.from("study_activity").select("user_id", { count: "exact", head: true }).gte("activity_date", sevenDaysAgo.toISOString().split("T")[0]);
          
          const { count: totalRoadmaps } = await supabase.from("roadmaps").select("*", { count: "exact", head: true });
          const { count: totalChatMessages } = await supabase.from("chat_history").select("*", { count: "exact", head: true }).eq("role", "user");
          
          // Time-series data for charts (last 30 days)
          const timeSeriesStart = new Date();
          timeSeriesStart.setDate(timeSeriesStart.getDate() - 30);
          timeSeriesStart.setHours(0, 0, 0, 0);
          
          // Daily user signups
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("created_at")
            .gte("created_at", timeSeriesStart.toISOString())
            .order("created_at", { ascending: true });
          
          const dailySignups: Record<string, number> = {};
          const dailyActiveUsers: Record<string, Set<string>> = {};
          const dailyRevenue: Record<string, number> = {};
          
          // Initialize last 30 days
          for (let i = 0; i < 30; i++) {
            const date = new Date(timeSeriesStart);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split("T")[0];
            dailySignups[dateStr] = 0;
            dailyActiveUsers[dateStr] = new Set();
            dailyRevenue[dateStr] = 0;
          }
          
          // Aggregate signups by date
          if (profilesData) {
            for (const profile of profilesData) {
              const dateStr = (profile.created_at as string).split("T")[0];
              if (dailySignups[dateStr] !== undefined) {
                dailySignups[dateStr]++;
              }
            }
          }
          
          // Daily active users from study_activity
          const { data: activityData } = await supabase
            .from("study_activity")
            .select("user_id, activity_date")
            .gte("activity_date", timeSeriesStart.toISOString().split("T")[0]);
          
          if (activityData) {
            for (const activity of activityData) {
              const dateStr = activity.activity_date as string;
              if (dailyActiveUsers[dateStr]) {
                dailyActiveUsers[dateStr].add(activity.user_id as string);
              }
            }
          }
          
          // Daily revenue (approximate from subscriptions)
          const { data: subscriptionsData } = await supabase
            .from("subscriptions")
            .select("tier, status, current_period_start, current_period_end")
            .eq("status", "active")
            .neq("tier", "free");
          
          const premiumMonthly = 9.99;
          const premiumYearly = 99.99;
          const proMonthly = 19.99;
          const proYearly = 199.99;
          
          if (subscriptionsData) {
            for (const sub of subscriptionsData) {
              const periodStart = sub.current_period_start ? new Date(sub.current_period_start) : null;
              const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;
              if (periodStart && periodEnd) {
                const daysDiff = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
                const isYearly = daysDiff > 300;
                let dailyAmount = 0;
                if (sub.tier === "premium") {
                  dailyAmount = isYearly ? premiumYearly / 365 : premiumMonthly / 30;
                } else if (sub.tier === "pro") {
                  dailyAmount = isYearly ? proYearly / 365 : proMonthly / 30;
                }
                
                // Distribute revenue across active days
                const currentDate = new Date(Math.max(periodStart.getTime(), timeSeriesStart.getTime()));
                const endDate = new Date(Math.min(periodEnd.getTime(), Date.now()));
                while (currentDate <= endDate) {
                  const dateStr = currentDate.toISOString().split("T")[0];
                  if (dailyRevenue[dateStr] !== undefined) {
                    dailyRevenue[dateStr] += dailyAmount;
                  }
                  currentDate.setDate(currentDate.getDate() + 1);
                }
              }
            }
          }
          
          // Convert to arrays for charts
          const userGrowthData = Object.keys(dailySignups)
            .sort()
            .map((date) => ({ date, value: dailySignups[date] }));
          
          const activeUsersData = Object.keys(dailyActiveUsers)
            .sort()
            .map((date) => ({ date, value: dailyActiveUsers[date].size }));
          
          const revenueData = Object.keys(dailyRevenue)
            .sort()
            .map((date) => ({ date, value: Math.round(dailyRevenue[date] * 100) / 100 }));
          
          // Subscription distribution
          const { data: tierData } = await supabase
            .from("subscriptions")
            .select("tier")
            .eq("status", "active");
          
          const tierDistribution: Record<string, number> = { free: 0, premium: 0, pro: 0 };
          if (tierData) {
            for (const sub of tierData) {
              const tier = (sub.tier as string) || "free";
              tierDistribution[tier] = (tierDistribution[tier] || 0) + 1;
            }
          }
          
          await logAdminAction(supabase, user!.id, "view_analytics", "analytics", undefined, {}, req);
          
          return json({
            users: { total: totalUsers ?? 0, newLast30Days: newUsers ?? 0, dau: dau ?? 0 },
            subscriptions: { active: activeSubs ?? 0, distribution: tierDistribution },
            content: { roadmaps: totalRoadmaps ?? 0, chatMessages: totalChatMessages ?? 0 },
            timeSeries: {
              userGrowth: userGrowthData,
              activeUsers: activeUsersData,
              revenue: revenueData,
            },
          });
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/analytics/traffic": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        if (req.method === "GET") {
          const startDate = url.searchParams.get("start_date");
          const endDate = url.searchParams.get("end_date");
          const groupBy = url.searchParams.get("group_by") || "day"; // hour, day, week
          
          const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          const end = endDate ? new Date(endDate) : new Date();
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          
          // Get page views
          const { data: eventsData } = await supabase
            .from("user_events")
            .select("event_type, page_path, referrer, utm_source, utm_medium, utm_campaign, device_type, browser, country, created_at")
            .eq("event_type", "page_view")
            .gte("created_at", start.toISOString())
            .lte("created_at", end.toISOString())
            .order("created_at", { ascending: true });
          
          // Get sessions
          const { data: sessionsData } = await supabase
            .from("user_sessions")
            .select("session_id, started_at, ended_at, page_count, duration_seconds, referrer, utm_source, utm_medium, utm_campaign, device_type, browser, country, converted")
            .gte("started_at", start.toISOString())
            .lte("started_at", end.toISOString());
          
          // Aggregate page views by time period
          const timeSeries: Record<string, number> = {};
          const topPages: Record<string, number> = {};
          const referrers: Record<string, number> = {};
          const utmSources: Record<string, number> = {};
          const utmCampaigns: Record<string, number> = {};
          const devices: Record<string, number> = {};
          const browsers: Record<string, number> = {};
          const countries: Record<string, number> = {};
          
          // Initialize time buckets
          const current = new Date(start);
          while (current <= end) {
            let key = "";
            if (groupBy === "hour") {
              key = current.toISOString().slice(0, 13) + ":00:00";
              current.setHours(current.getHours() + 1);
            } else if (groupBy === "week") {
              const weekStart = new Date(current);
              weekStart.setDate(current.getDate() - current.getDay());
              key = weekStart.toISOString().split("T")[0];
              current.setDate(current.getDate() + 7);
            } else {
              key = current.toISOString().split("T")[0];
              current.setDate(current.getDate() + 1);
            }
            timeSeries[key] = 0;
          }
          
          // Aggregate events
          if (eventsData) {
            for (const event of eventsData) {
              const date = new Date(event.created_at as string);
              let key = "";
              if (groupBy === "hour") {
                key = date.toISOString().slice(0, 13) + ":00:00";
              } else if (groupBy === "week") {
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                key = weekStart.toISOString().split("T")[0];
              } else {
                key = date.toISOString().split("T")[0];
              }
              if (timeSeries[key] !== undefined) timeSeries[key]++;
              
              const path = event.page_path as string;
              topPages[path] = (topPages[path] || 0) + 1;
              
              const ref = event.referrer as string;
              if (ref) {
                try {
                  const refDomain = new URL(ref).hostname;
                  referrers[refDomain] = (referrers[refDomain] || 0) + 1;
                } catch {
                  referrers[ref] = (referrers[ref] || 0) + 1;
                }
              }
              
              const utmSource = event.utm_source as string;
              if (utmSource) utmSources[utmSource] = (utmSources[utmSource] || 0) + 1;
              
              const utmCampaign = event.utm_campaign as string;
              if (utmCampaign) utmCampaigns[utmCampaign] = (utmCampaigns[utmCampaign] || 0) + 1;
              
              const device = event.device_type as string;
              if (device) devices[device] = (devices[device] || 0) + 1;
              
              const browserName = event.browser as string;
              if (browserName) browsers[browserName] = (browsers[browserName] || 0) + 1;
              
              const countryName = event.country as string;
              if (countryName && countryName !== "unknown") countries[countryName] = (countries[countryName] || 0) + 1;
            }
          }
          
          // Calculate session metrics
          let totalSessions = 0;
          let totalPageViews = 0;
          let totalDuration = 0;
          let convertedSessions = 0;
          
          if (sessionsData) {
            totalSessions = sessionsData.length;
            for (const session of sessionsData) {
              totalPageViews += session.page_count || 1;
              if (session.duration_seconds) totalDuration += session.duration_seconds;
              if (session.converted) convertedSessions++;
            }
          }
          
          const avgDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;
          const avgPagesPerSession = totalSessions > 0 ? Math.round((totalPageViews / totalSessions) * 100) / 100 : 0;
          const bounceRate = totalSessions > 0 ? Math.round(((totalSessions - (sessionsData?.filter(s => (s.page_count || 1) > 1).length || 0)) / totalSessions) * 10000) / 100 : 0;
          const conversionRate = totalSessions > 0 ? Math.round((convertedSessions / totalSessions) * 10000) / 100 : 0;
          
          // Convert to arrays
          const timeSeriesData = Object.keys(timeSeries)
            .sort()
            .map((date) => ({ date, value: timeSeries[date] }));
          
          const topPagesData = Object.entries(topPages)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 20)
            .map(([path, count]) => ({ path, count }));
          
          const referrersData = Object.entries(referrers)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 20)
            .map(([domain, count]) => ({ domain, count }));
          
          const utmSourcesData = Object.entries(utmSources)
            .sort(([, a], [, b]) => b - a)
            .map(([source, count]) => ({ source, count }));
          
          const utmCampaignsData = Object.entries(utmCampaigns)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 20)
            .map(([campaign, count]) => ({ campaign, count }));
          
          const devicesData = Object.entries(devices)
            .map(([device, count]) => ({ device, count }));
          
          const browsersData = Object.entries(browsers)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([browser, count]) => ({ browser, count }));
          
          const countriesData = Object.entries(countries)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 20)
            .map(([country, count]) => ({ country, count }));
          
          try {
            await logAdminAction(supabase, user!.id, "view_traffic_analytics", "analytics", undefined, { startDate, endDate }, req);
          } catch (logErr) {
            logError("api", "admin/analytics/traffic: failed to log action", logErr);
          }
          
          return json({
            timeSeries: timeSeriesData,
            topPages: topPagesData,
            referrers: referrersData,
            utmSources: utmSourcesData,
            utmCampaigns: utmCampaignsData,
            devices: devicesData,
            browsers: browsersData,
            countries: countriesData,
            sessionMetrics: {
              totalSessions,
              avgDuration,
              avgPagesPerSession,
              bounceRate,
              conversionRate,
            },
          });
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/analytics/conversions": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        if (req.method === "GET") {
          const startDate = url.searchParams.get("start_date");
          const endDate = url.searchParams.get("end_date");
          
          const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          const end = endDate ? new Date(endDate) : new Date();
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          
          // Get conversion events
          const { data: conversionsData } = await supabase
            .from("conversion_events")
            .select("conversion_type, funnel_stage, value, currency, metadata, created_at, user_id, session_id")
            .gte("created_at", start.toISOString())
            .lte("created_at", end.toISOString())
            .order("created_at", { ascending: true });
          
          // Get sessions for funnel analysis
          const { data: sessionsData } = await supabase
            .from("user_sessions")
            .select("session_id, started_at, utm_source, utm_medium, utm_campaign, converted, conversion_type")
            .gte("started_at", start.toISOString())
            .lte("started_at", end.toISOString());
          
          // Funnel stages
          const funnelStages = ["landing", "signup", "onboarding", "roadmap_generated", "subscription"];
          const funnelData: Record<string, number> = {};
          const conversionRates: Record<string, number> = {};
          
          // Initialize funnel
          for (const stage of funnelStages) {
            funnelData[stage] = 0;
          }
          
          // Aggregate conversions by type and stage
          const conversionsByType: Record<string, number> = {};
          const conversionsByStage: Record<string, number> = {};
          const conversionsBySource: Record<string, number> = {};
          const conversionsByCampaign: Record<string, number> = {};
          const timeToConversion: number[] = [];
          let totalRevenue = 0;
          
          // Count signups (from profiles)
          const { count: signupCount } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .gte("created_at", start.toISOString())
            .lte("created_at", end.toISOString());
          
          funnelData["signup"] = signupCount || 0;
          
          // Count roadmap generations
          const { count: roadmapCount } = await supabase
            .from("roadmaps")
            .select("*", { count: "exact", head: true })
            .gte("created_at", start.toISOString())
            .lte("created_at", end.toISOString());
          
          funnelData["roadmap_generated"] = roadmapCount || 0;
          
          // Count subscriptions
          const { count: subscriptionCount } = await supabase
            .from("subscriptions")
            .select("*", { count: "exact", head: true })
            .neq("tier", "free")
            .gte("created_at", start.toISOString())
            .lte("created_at", end.toISOString());
          
          funnelData["subscription"] = subscriptionCount || 0;
          
          // Process conversion events
          if (conversionsData) {
            for (const conv of conversionsData) {
              const type = conv.conversion_type as string;
              const stage = conv.funnel_stage as string;
              
              conversionsByType[type] = (conversionsByType[type] || 0) + 1;
              conversionsByStage[stage] = (conversionsByStage[stage] || 0) + 1;
              
              if (conv.value) {
                totalRevenue += Number(conv.value);
              }
              
              // Get session for source attribution
              if (conv.session_id) {
                const session = sessionsData?.find(s => s.session_id === conv.session_id);
                if (session) {
                  const source = session.utm_source || "direct";
                  conversionsBySource[source] = (conversionsBySource[source] || 0) + 1;
                  
                  if (session.utm_campaign) {
                    conversionsByCampaign[session.utm_campaign] = (conversionsByCampaign[session.utm_campaign] || 0) + 1;
                  }
                }
              }
            }
          }
          
          // Calculate conversion rates
          const totalVisitors = sessionsData?.length || 0;
          if (totalVisitors > 0) {
            conversionRates["signup"] = Math.round((funnelData["signup"] / totalVisitors) * 10000) / 100;
            conversionRates["roadmap_generated"] = Math.round((funnelData["roadmap_generated"] / totalVisitors) * 10000) / 100;
            conversionRates["subscription"] = Math.round((funnelData["subscription"] / totalVisitors) * 10000) / 100;
          }
          
          // Calculate time to conversion (simplified - would need session start times)
          // This is a placeholder - in production, calculate from session start to conversion
          
          const funnelDataArray = funnelStages.map((stage) => ({
            stage,
            count: funnelData[stage] || 0,
            conversionRate: conversionRates[stage] || 0,
          }));
          
          const conversionsByTypeData = Object.entries(conversionsByType)
            .map(([type, count]) => ({ type, count }));
          
          const conversionsByStageData = Object.entries(conversionsByStage)
            .map(([stage, count]) => ({ stage, count }));
          
          const conversionsBySourceData = Object.entries(conversionsBySource)
            .sort(([, a], [, b]) => b - a)
            .map(([source, count]) => ({ source, count }));
          
          const conversionsByCampaignData = Object.entries(conversionsByCampaign)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 20)
            .map(([campaign, count]) => ({ campaign, count }));
          
          try {
            await logAdminAction(supabase, user!.id, "view_conversion_analytics", "analytics", undefined, { startDate, endDate }, req);
          } catch (logErr) {
            logError("api", "admin/analytics/conversions: failed to log action", logErr);
          }
          
          return json({
            funnel: funnelDataArray,
            conversionsByType: conversionsByTypeData,
            conversionsByStage: conversionsByStageData,
            conversionsBySource: conversionsBySourceData,
            conversionsByCampaign: conversionsByCampaignData,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            timeToConversion: {
              avg: 0, // Placeholder - calculate from actual data
              median: 0,
            },
          });
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/analytics/insights": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        if (req.method === "GET") {
          // Get current week start (Monday)
          const now = new Date();
          const currentWeekStart = new Date(now);
          currentWeekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
          currentWeekStart.setHours(0, 0, 0, 0);
          
          // Get previous week start
          const previousWeekStart = new Date(currentWeekStart);
          previousWeekStart.setDate(previousWeekStart.getDate() - 7);
          
          const currentWeekEnd = new Date(currentWeekStart);
          currentWeekEnd.setDate(currentWeekEnd.getDate() + 7);
          
          const previousWeekEnd = new Date(previousWeekStart);
          previousWeekEnd.setDate(previousWeekEnd.getDate() + 7);
          
          const weekStartStr = currentWeekStart.toISOString().split("T")[0];
          
          // Check cache
          const { data: cached } = await supabase
            .from("admin_insights_cache")
            .select("*")
            .eq("week_start", weekStartStr)
            .gt("expires_at", new Date().toISOString())
            .single();
          
          if (cached) {
            await logAdminAction(supabase, user!.id, "view_insights", "analytics", undefined, { cached: true }, req);
            return json({ insights: cached.insights, cached: true });
          }
          
          // Fetch current week metrics
          const { count: currentNewUsers } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .gte("created_at", currentWeekStart.toISOString())
            .lt("created_at", currentWeekEnd.toISOString());
          
          const { count: currentActiveUsers } = await supabase
            .from("study_activity")
            .select("user_id", { count: "exact", head: true })
            .gte("activity_date", weekStartStr)
            .lt("activity_date", currentWeekEnd.toISOString().split("T")[0]);
          
          const { data: currentSubs } = await supabase
            .from("subscriptions")
            .select("tier, status")
            .eq("status", "active")
            .neq("tier", "free");
          
          const { count: currentRoadmaps } = await supabase
            .from("roadmaps")
            .select("*", { count: "exact", head: true })
            .gte("created_at", currentWeekStart.toISOString())
            .lt("created_at", currentWeekEnd.toISOString());
          
          const { count: currentChatMessages } = await supabase
            .from("chat_history")
            .select("*", { count: "exact", head: true })
            .eq("role", "user")
            .gte("created_at", currentWeekStart.toISOString())
            .lt("created_at", currentWeekEnd.toISOString());
          
          // Calculate current week revenue
          let currentRevenue = 0;
          if (currentSubs) {
            const premiumMonthly = 9.99;
            const premiumYearly = 99.99;
            const proMonthly = 19.99;
            const proYearly = 199.99;
            for (const sub of currentSubs) {
              if (sub.tier === "premium") currentRevenue += premiumMonthly;
              else if (sub.tier === "pro") currentRevenue += proMonthly;
            }
          }
          
          // Fetch previous week metrics
          const { count: prevNewUsers } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .gte("created_at", previousWeekStart.toISOString())
            .lt("created_at", previousWeekEnd.toISOString());
          
          const { count: prevActiveUsers } = await supabase
            .from("study_activity")
            .select("user_id", { count: "exact", head: true })
            .gte("activity_date", previousWeekStart.toISOString().split("T")[0])
            .lt("activity_date", previousWeekEnd.toISOString().split("T")[0]);
          
          const { count: prevRoadmaps } = await supabase
            .from("roadmaps")
            .select("*", { count: "exact", head: true })
            .gte("created_at", previousWeekStart.toISOString())
            .lt("created_at", previousWeekEnd.toISOString());
          
          const { count: prevChatMessages } = await supabase
            .from("chat_history")
            .select("*", { count: "exact", head: true })
            .eq("role", "user")
            .gte("created_at", previousWeekStart.toISOString())
            .lt("created_at", previousWeekEnd.toISOString());
          
          // Calculate previous week revenue (approximate)
          const { data: prevSubs } = await supabase
            .from("subscriptions")
            .select("tier, status")
            .eq("status", "active")
            .neq("tier", "free");
          
          let prevRevenue = 0;
          if (prevSubs) {
            const premiumMonthly = 9.99;
            const proMonthly = 19.99;
            for (const sub of prevSubs) {
              if (sub.tier === "premium") prevRevenue += premiumMonthly;
              else if (sub.tier === "pro") prevRevenue += proMonthly;
            }
          }
          
          // Build prompt for Gemini Flash
          const metricsPrompt = `Analyze the following platform metrics and provide insights:

Current Week (${weekStartStr}):
- New users: ${currentNewUsers ?? 0}
- Active users: ${currentActiveUsers ?? 0}
- Revenue: $${currentRevenue.toFixed(2)}
- Roadmaps created: ${currentRoadmaps ?? 0}
- Chat messages: ${currentChatMessages ?? 0}
- Active subscriptions: ${currentSubs?.length ?? 0}

Previous Week:
- New users: ${prevNewUsers ?? 0}
- Active users: ${prevActiveUsers ?? 0}
- Revenue: $${prevRevenue.toFixed(2)}
- Roadmaps created: ${prevRoadmaps ?? 0}
- Chat messages: ${prevChatMessages ?? 0}

Provide a JSON response with:
1. key_insights: array of 3-5 key insights (strings)
2. trends: object with user_growth, revenue, engagement (each: "up", "down", or "stable")
3. recommendations: array of objects with priority ("high", "medium", "low"), action (string), impact (string)
4. alerts: array of objects with severity ("critical", "warning", "info"), message (string)
5. metrics_summary: object with week_over_week_growth (number), top_performing_feature (string), area_needing_attention (string)

Be concise and actionable. Focus on what matters most for platform growth and user engagement.`;
          
          const config = getGeminiConfig();
          if (!config) {
            return json({ error: "AI not configured" }, 500);
          }
          
          const insightsSchema = {
            type: "object",
            properties: {
              key_insights: {
                type: "array",
                items: { type: "string" },
                description: "3-5 key insights about the week",
              },
              trends: {
                type: "object",
                properties: {
                  user_growth: { type: "string", enum: ["up", "down", "stable"] },
                  revenue: { type: "string", enum: ["up", "down", "stable"] },
                  engagement: { type: "string", enum: ["up", "down", "stable"] },
                },
                required: ["user_growth", "revenue", "engagement"],
              },
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    priority: { type: "string", enum: ["high", "medium", "low"] },
                    action: { type: "string" },
                    impact: { type: "string" },
                  },
                  required: ["priority", "action", "impact"],
                },
              },
              alerts: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    severity: { type: "string", enum: ["critical", "warning", "info"] },
                    message: { type: "string" },
                  },
                  required: ["severity", "message"],
                },
              },
              metrics_summary: {
                type: "object",
                properties: {
                  week_over_week_growth: { type: "number" },
                  top_performing_feature: { type: "string" },
                  area_needing_attention: { type: "string" },
                },
                required: ["week_over_week_growth", "top_performing_feature", "area_needing_attention"],
              },
            },
            required: ["key_insights", "trends", "recommendations", "alerts", "metrics_summary"],
          };
          
          try {
            const genUrl = getGeminiGenerateContentUrl(config.model);
            const aiRes = await geminiFetchWithRetry(genUrl, {
              method: "POST",
              headers: getGeminiHeaders(config.apiKey),
              body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: metricsPrompt }] }],
                generationConfig: {
                  thinkingConfig: { thinkingLevel: isGemini3Flash(config.model) ? "medium" : "low" },
                  temperature: 0.7,
                  maxOutputTokens: 2048,
                  responseMimeType: "application/json",
                  responseJsonSchema: insightsSchema,
                },
              }),
            });
            
            if (!aiRes.ok) {
              console.error("Gemini insights error:", aiRes.status);
              return json({ error: "Failed to generate insights" }, 500);
            }
            
            const aiJson = (await aiRes.json()) as {
              candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
              usageMetadata?: unknown;
            };
            
            logGeminiUsage(aiJson.usageMetadata, "admin/analytics/insights");
            
            const parts = aiJson.candidates?.[0]?.content?.parts ?? [];
            const jsonText = parts.map((p) => p.text ?? "").join("").trim();
            
            if (!jsonText) {
              return json({ error: "Invalid AI response" }, 500);
            }
            
            let insights: Record<string, unknown>;
            try {
              insights = JSON.parse(jsonText) as Record<string, unknown>;
            } catch {
              return json({ error: "Failed to parse insights" }, 500);
            }
            
            // Cache insights for 1 hour
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 1);
            
            await supabase.from("admin_insights_cache").upsert(
              {
                week_start: weekStartStr,
                insights: insights,
                expires_at: expiresAt.toISOString(),
              },
              { onConflict: "week_start" }
            );
            
            await logAdminAction(supabase, user!.id, "view_insights", "analytics", undefined, { cached: false }, req);
            
            return json({ insights, cached: false });
          } catch (error) {
            console.error("Insights generation error:", error);
            return json({ error: "Failed to generate insights" }, 500);
          }
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/content/roadmaps": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        if (req.method === "GET") {
          try {
          const search = url.searchParams.get("search") ?? "";
          const page = parseInt(url.searchParams.get("page") ?? "1", 10);
          const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 100);
          const offset = (page - 1) * limit;
          
            let query = supabase.from("roadmaps").select("id, title, description, user_id, created_at, updated_at, profiles(display_name, email)", { count: "exact" });
          
          if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
          }
          
          const { data, error, count } = await query
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);
          
            if (error) {
              logError("api", "admin/content/roadmaps: query error", error);
              throw error;
            }
          
            try {
          await logAdminAction(supabase, user!.id, "list_roadmaps", "roadmaps", undefined, { search }, req);
            } catch (logErr) {
              logError("api", "admin/content/roadmaps: failed to log action", logErr);
            }
          
            return json({
            roadmaps: data ?? [],
              pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) || 1 },
          });
          } catch (err) {
            logError("api", "admin/content/roadmaps: handler error", err);
            throw err;
        }
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/content/roadmaps/id": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        const roadmapId = pathSegments[3];
        if (!roadmapId || !UUID_REGEX.test(roadmapId)) return json({ error: "Invalid roadmap ID" }, 400);
        
        if (req.method === "DELETE") {
          await supabase.from("roadmaps").delete().eq("id", roadmapId);
          
          await logAdminAction(supabase, user!.id, "delete_roadmap", "roadmaps", roadmapId, {}, req);
          
          return json({ success: true });
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/content/chat": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        if (req.method === "GET") {
          try {
          const userId = url.searchParams.get("user_id");
          const search = url.searchParams.get("search") ?? "";
          const page = parseInt(url.searchParams.get("page") ?? "1", 10);
          const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 100);
          const offset = (page - 1) * limit;
          
            let query = supabase.from("chat_history").select("id, user_id, content, created_at, profiles(display_name, email)", { count: "exact" });
          
          if (userId && UUID_REGEX.test(userId)) {
            query = query.eq("user_id", userId);
          }
          if (search) {
            query = query.ilike("content", `%${search}%`);
          }
          
          const { data, error, count } = await query
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);
          
            if (error) {
              logError("api", "admin/content/chat: query error", error);
              throw error;
            }
          
            try {
          await logAdminAction(supabase, user!.id, "list_chat", "chat_history", undefined, { userId, search }, req);
            } catch (logErr) {
              logError("api", "admin/content/chat: failed to log action", logErr);
            }
          
            return json({
            messages: data ?? [],
              pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) || 1 },
          });
          } catch (err) {
            logError("api", "admin/content/chat: handler error", err);
            throw err;
        }
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/content/chat/id": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        const messageId = pathSegments[3];
        if (!messageId || !UUID_REGEX.test(messageId)) return json({ error: "Invalid message ID" }, 400);
        
        if (req.method === "DELETE") {
          await supabase.from("chat_history").delete().eq("id", messageId);
          
          await logAdminAction(supabase, user!.id, "delete_chat_message", "chat_history", messageId, {}, req);
          
          return json({ success: true });
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/content/community": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        if (req.method === "GET") {
          const { data: groups } = await supabase.from("study_groups").select("*, profiles(display_name)").order("created_at", { ascending: false }).limit(100);
          const { data: messages } = await supabase.from("chat_messages").select("*, profiles(display_name)").order("created_at", { ascending: false }).limit(100);
          
          await logAdminAction(supabase, user!.id, "view_community", "community", undefined, {}, req);
          
          return json({ groups: groups ?? [], messages: messages ?? [] });
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/settings": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        if (req.method === "GET") {
          const { data, error } = await supabase.from("admin_settings").select("*");
          if (error) throw error;
          
          await logAdminAction(supabase, user!.id, "view_settings", "settings", undefined, {}, req);
          
          return json({ settings: data ?? [] });
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/settings/key": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        const key = pathSegments[2];
        if (!key) return json({ error: "Setting key required" }, 400);
        
        if (req.method === "PATCH") {
          const { value, description } = body as { value?: unknown; description?: string };
          if (value === undefined) return json({ error: "Value required" }, 400);
          
          const { data, error } = await supabase
            .from("admin_settings")
            .upsert({ key, value: value as Record<string, unknown>, description, updated_by: user!.id }, { onConflict: "key" })
            .select()
            .single();
          
          if (error) throw error;
          
          await logAdminAction(supabase, user!.id, "update_setting", "settings", key, { value }, req);
          
          return json(data);
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/settings/feature-flags": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        if (req.method === "GET") {
          const { data } = await supabase.from("admin_settings").select("value").eq("key", "feature_flags").single();
          await logAdminAction(supabase, user!.id, "view_feature_flags", "settings", undefined, {}, req);
          return json({ featureFlags: (data?.value as Record<string, unknown>) ?? {} });
        }
        
        if (req.method === "PATCH") {
          const { featureFlags } = body as { featureFlags?: Record<string, unknown> };
          if (!featureFlags) return json({ error: "featureFlags required" }, 400);
          
          const { data, error } = await supabase
            .from("admin_settings")
            .upsert({ key: "feature_flags", value: featureFlags, updated_by: user!.id }, { onConflict: "key" })
            .select()
            .single();
          
          if (error) throw error;
          
          await logAdminAction(supabase, user!.id, "update_feature_flags", "settings", undefined, { featureFlags }, req);
          
          return json(data);
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/audit-log": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        if (req.method === "GET") {
          const adminUserId = url.searchParams.get("admin_user_id");
          const action = url.searchParams.get("action") ?? "";
          const resourceType = url.searchParams.get("resource_type") ?? "";
          const startDate = url.searchParams.get("start_date") ?? "";
          const endDate = url.searchParams.get("end_date") ?? "";
          const page = parseInt(url.searchParams.get("page") ?? "1", 10);
          const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 100);
          const offset = (page - 1) * limit;
          
          let query = supabase.from("admin_audit_log").select("id, admin_user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at", { count: "exact" });
          if (adminUserId && UUID_REGEX.test(adminUserId)) {
            query = query.eq("admin_user_id", adminUserId);
          }
          if (action) {
            query = query.eq("action", action);
          }
          if (resourceType) {
            query = query.eq("resource_type", resourceType);
          }
          if (startDate) {
            query = query.gte("created_at", startDate);
          }
          if (endDate) {
            query = query.lte("created_at", endDate);
          }
          const { data: logsData, error, count } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
          if (error) throw error;
          const logs = logsData ?? [];
          const adminIds = [...new Set(logs.map((l: { admin_user_id: string }) => l.admin_user_id))];
          const profilesByUser: Record<string, { display_name?: string; email?: string }> = {};
          if (adminIds.length > 0) {
            const { data: profs } = await supabase.from("profiles").select("user_id, display_name, email").in("user_id", adminIds);
            for (const p of profs ?? []) {
              profilesByUser[p.user_id] = { display_name: p.display_name, email: p.email };
            }
          }
          const logsWithProfiles = logs.map((l: any) => ({
            ...l,
            profiles: profilesByUser[l.admin_user_id] ?? {},
          }));
          return json({
            logs: logsWithProfiles,
            pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) || 1 },
          });
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/leads": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;

        if (req.method === "GET") {
          const page = parseInt(url.searchParams.get("page") ?? "1", 10);
          const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 100);
          const offset = (page - 1) * limit;
          const source = url.searchParams.get("source") ?? "";
          const startDate = url.searchParams.get("start_date") ?? "";
          const endDate = url.searchParams.get("end_date") ?? "";
          const countryCode = url.searchParams.get("country_code") ?? "";

          let query = supabase.from("career_dna_leads").select("id, phone, country_code, source, source_id, consent_marketing, created_at", { count: "exact" });
          if (source === "squad" || source === "result") {
            query = query.eq("source", source);
          }
          if (countryCode && /^[A-Z]{2}$/i.test(countryCode)) {
            query = query.eq("country_code", countryCode.toUpperCase());
          }
          if (startDate) {
            query = query.gte("created_at", startDate);
          }
          if (endDate) {
            query = query.lte("created_at", endDate);
          }
          const { data: leadsData, error, count } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
          if (error) throw error;
          const leads = (leadsData ?? []).map((l: Record<string, unknown>) => ({
            id: l.id,
            phone: l.phone,
            countryCode: l.country_code ?? null,
            source: l.source,
            sourceId: l.source_id,
            consentMarketing: l.consent_marketing,
            createdAt: l.created_at,
          }));
          return json({
            leads,
            pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) || 1 },
          });
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/contact-requests": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;

        if (req.method === "GET") {
          const page = parseInt(url.searchParams.get("page") ?? "1", 10);
          const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 100);
          const offset = (page - 1) * limit;
          const topic = url.searchParams.get("topic") ?? "";
          const startDate = url.searchParams.get("start_date") ?? "";
          const endDate = url.searchParams.get("end_date") ?? "";

          let query = supabase.from("contact_requests").select("id, name, email, phone, phone_country_code, company, topic, subject, message, created_at", { count: "exact" });
          const allowedTopics = ["general", "sales", "support", "partnership", "feedback", "other"];
          if (topic && allowedTopics.includes(topic)) {
            query = query.eq("topic", topic);
          }
          if (startDate) {
            query = query.gte("created_at", startDate);
          }
          if (endDate) {
            query = query.lte("created_at", endDate);
          }
          const { data: requestsData, error, count } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
          if (error) throw error;
          const requests = (requestsData ?? []).map((r: Record<string, unknown>) => ({
            id: r.id,
            name: r.name,
            email: r.email,
            phone: r.phone ?? null,
            phoneCountryCode: r.phone_country_code ?? null,
            company: r.company ?? null,
            topic: r.topic,
            subject: r.subject,
            message: r.message,
            createdAt: r.created_at,
          }));
          return json({
            requests,
            pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) || 1 },
          });
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/analytics/user-journeys": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        if (req.method === "GET") {
          const startDate = url.searchParams.get("start_date");
          const endDate = url.searchParams.get("end_date");
          
          const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          const end = endDate ? new Date(endDate) : new Date();
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          
          // Get all page views for flow analysis
          const { data: pageViews } = await supabase
            .from("user_events")
            .select("page_path, session_id, user_id, created_at")
            .eq("event_type", "page_view")
            .gte("created_at", start.toISOString())
            .lte("created_at", end.toISOString())
            .order("created_at", { ascending: true });
          
          // Build page flow (common paths)
          const pageFlow: Record<string, Record<string, number>> = {};
          const dropOffPoints: Record<string, number> = {};
          
          if (pageViews) {
            // Group by session
            const sessions: Record<string, Array<{ path: string; timestamp: string }>> = {};
            for (const view of pageViews) {
              const sessionId = view.session_id as string;
              if (!sessions[sessionId]) {
                sessions[sessionId] = [];
              }
              sessions[sessionId].push({
                path: view.page_path as string,
                timestamp: view.created_at as string,
              });
            }
            
            // Build flow graph
            for (const sessionViews of Object.values(sessions)) {
              for (let i = 0; i < sessionViews.length - 1; i++) {
                const from = sessionViews[i].path;
                const to = sessionViews[i + 1].path;
                if (!pageFlow[from]) {
                  pageFlow[from] = {};
                }
                pageFlow[from][to] = (pageFlow[from][to] || 0) + 1;
              }
              
              // Track drop-offs (last page in session)
              if (sessionViews.length > 0) {
                const lastPage = sessionViews[sessionViews.length - 1].path;
                dropOffPoints[lastPage] = (dropOffPoints[lastPage] || 0) + 1;
              }
            }
          }
          
          // Convert to array format
          const flowData = Object.entries(pageFlow).map(([from, tos]) => ({
            from,
            to: Object.entries(tos).map(([to, count]) => ({ to, count })),
          }));
          
          const dropOffData = Object.entries(dropOffPoints)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 20)
            .map(([page, count]) => ({ page, count }));
          
          // Funnel analysis
          const funnelStages = [
            { name: "Landing", path: "/" },
            { name: "Signup", path: "/signup" },
            { name: "Onboarding", path: "/wizard" },
            { name: "Dashboard", path: "/dashboard" },
            { name: "Roadmap", path: "/dashboard/roadmap" },
            { name: "Subscription", path: "/dashboard/upgrade" },
          ];
          
          const funnelData: Array<{ stage: string; count: number; dropOff: number }> = [];
          let previousCount = pageViews?.length || 0;
          
          for (const stage of funnelStages) {
            const stageCount = pageViews?.filter(v => (v.page_path as string).startsWith(stage.path)).length || 0;
            const dropOff = previousCount - stageCount;
            funnelData.push({
              stage: stage.name,
              count: stageCount,
              dropOff: Math.max(0, dropOff),
            });
            previousCount = stageCount;
          }
          
          try {
            await logAdminAction(supabase, user!.id, "view_user_journeys", "analytics", undefined, { startDate, endDate }, req);
          } catch (logErr) {
            logError("api", "admin/analytics/user-journeys: failed to log action", logErr);
          }
          
          return json({
            flow: flowData,
            dropOffPoints: dropOffData,
            funnel: funnelData,
          });
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/themes": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        if (req.method === "GET") {
          const { data: themes } = await supabase
            .from("theme_settings")
            .select("*")
            .order("is_default", { ascending: false })
            .order("created_at", { ascending: false });
          
          try {
            await logAdminAction(supabase, user!.id, "list_themes", "themes", undefined, {}, req);
          } catch (logErr) {
            logError("api", "admin/themes: failed to log action", logErr);
          }
          
          return json({ themes: themes ?? [] });
        }
        
        if (req.method === "POST") {
          const { name, colors, description } = body as {
            name?: string;
            colors?: Record<string, string>;
            description?: string;
          };
          
          if (!name || !colors) {
            return json({ error: "name and colors required" }, 400);
          }
          
          const { data: theme, error: insertError } = await supabase
            .from("theme_settings")
            .insert({
              name,
              colors: colors as any,
              description: description || null,
              is_admin_created: true,
              created_by: user!.id,
            })
            .select()
            .single();
          
          if (insertError) throw insertError;
          
          try {
            await logAdminAction(supabase, user!.id, "create_theme", "themes", theme.id, { name }, req);
          } catch (logErr) {
            logError("api", "admin/themes: failed to log action", logErr);
          }
          
          return json({ theme });
        }
        
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/themes/id": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        const themeId = pathSegments[2];
        if (!themeId || !UUID_REGEX.test(themeId)) {
          return json({ error: "Invalid theme ID" }, 400);
        }
        
        if (req.method === "GET") {
          const { data: theme, error } = await supabase
            .from("theme_settings")
            .select("*")
            .eq("id", themeId)
            .single();
          
          if (error) throw error;
          if (!theme) return json({ error: "Theme not found" }, 404);
          
          return json({ theme });
        }
        
        if (req.method === "PATCH") {
          const { name, colors, description } = body as {
            name?: string;
            colors?: Record<string, string>;
            description?: string;
          };
          
          const updates: Record<string, unknown> = {};
          if (name) updates.name = name;
          if (colors) updates.colors = colors as any;
          if (description !== undefined) updates.description = description;
          
          const { data: theme, error } = await supabase
            .from("theme_settings")
            .update(updates)
            .eq("id", themeId)
            .select()
            .single();
          
          if (error) throw error;
          
          try {
            await logAdminAction(supabase, user!.id, "update_theme", "themes", themeId, { updates }, req);
          } catch (logErr) {
            logError("api", "admin/themes/id: failed to log action", logErr);
          }
          
          return json({ theme });
        }
        
        if (req.method === "DELETE") {
          // Check if theme is default
          const { data: theme } = await supabase
            .from("theme_settings")
            .select("is_default")
            .eq("id", themeId)
            .single();
          
          if (theme?.is_default) {
            return json({ error: "Cannot delete default theme" }, 400);
          }
          
          await supabase.from("theme_settings").delete().eq("id", themeId);
          
          try {
            await logAdminAction(supabase, user!.id, "delete_theme", "themes", themeId, {}, req);
          } catch (logErr) {
            logError("api", "admin/themes/id: failed to log action", logErr);
          }
          
          return json({ success: true });
        }
        
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/themes/set-default": {
        const authCheck = await requireSuperadmin(supabase, user?.id ?? null, req);
        if (!authCheck.authorized) return authCheck.error!;
        
        if (req.method === "POST") {
          const themeId = pathSegments[2];
          if (!themeId || !UUID_REGEX.test(themeId)) {
            return json({ error: "Invalid theme ID" }, 400);
          }
          
          // Unset current default
          await supabase
            .from("theme_settings")
            .update({ is_default: false })
            .eq("is_default", true);
          
          // Set new default
          const { data: theme, error } = await supabase
            .from("theme_settings")
            .update({ is_default: true })
            .eq("id", themeId)
            .select()
            .single();
          
          if (error) throw error;
          
          try {
            await logAdminAction(supabase, user!.id, "set_default_theme", "themes", themeId, {}, req);
          } catch (logErr) {
            logError("api", "admin/themes/set-default: failed to log action", logErr);
          }
          
          return json({ theme });
        }
        return json({ error: "Method not allowed" }, 405);
      }

      case "admin/batch": {
        if (!checkAdminSecret()) return json({ error: "Unauthorized", code: "admin_required" }, 401);
        const batchId = pathSegments[2];
        if (req.method === "GET" && batchId) {
          const config = getGeminiConfig();
          if (!config) return json({ error: "AI not configured" }, 500);
          const name = batchId.startsWith("batches/") ? batchId : `batches/${batchId}`;
          const status = await getBatchStatus(config.apiKey, name);
          if (!status) return json({ error: "Batch not found or failed to fetch" }, 404);
          return json({ name, ...status });
        }
        if (req.method === "POST") {
          const config = getGeminiConfig();
          if (!config) return json({ error: "AI not configured. Set GEMINI_API_KEY." }, 500);
          const { items } = body as { items?: Array<{ weekTitle?: string; skills?: string[] }> };
          const list = Array.isArray(items) ? items.slice(0, 50) : [];
          if (list.length === 0) return json({ error: "body.items required (array of { weekTitle, skills })" }, 400);
          const createQuizParams = {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: { question: { type: "string" }, options: { type: "array", items: { type: "string" } }, correct_index: { type: "number" }, explanation: { type: "string" } },
                  required: ["question", "options", "correct_index", "explanation"],
                },
              },
            },
            required: ["questions"],
          };
          const requests = list.map((item) => {
            const weekTitle = sanitizeUserText(item.weekTitle, MAX_QUIZ_WEEK_TITLE_LEN) || "General";
            const skillList = Array.isArray(item.skills) ? item.skills.slice(0, MAX_QUIZ_SKILLS_ITEMS).map((s) => sanitizeUserText(s, MAX_QUIZ_SKILL_LEN)).filter(Boolean) : [];
            const systemPrompt = `<role>You are a career education expert. Create a quiz from the provided context.</role>
<context>
Week Topic: ${weekTitle}
Skills: ${skillList.join(", ")}
</context>
<task>Based on the information above, create 5 multiple-choice questions, 4 options each, one correct. Include brief explanation for the correct answer.</task>`;
            return {
              contents: [{ role: "user", parts: [{ text: "Generate a 5-question quiz for this week's learning." }] }],
              systemInstruction: { parts: [{ text: systemPrompt }] },
              tools: [{ functionDeclarations: [openAiFunctionToGeminiDeclaration("create_quiz", "Create a multiple choice quiz", createQuizParams)] }],
              toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["create_quiz"] } },
              generationConfig: { thinkingConfig: { thinkingLevel: "high" }, temperature: 1.0, maxOutputTokens: 4096 },
            };
          });
          const batchName = await submitBatchGenerateContent(config.apiKey, config.model, requests, "shyftcut-quiz-batch");
          if (!batchName) return json({ error: "Failed to submit batch" }, 500);
          return json({ batchName, message: "Poll GET /api/admin/batch/" + batchName.replace(/^batches\//, "") + " for status." });
        }
        return json({ error: "Method not allowed" }, 405);
      }

      default:
        return json({ error: "Not implemented" }, 501);
    }
  } catch (err) {
    logError("api", `route ${routeKey} failed`, err);
    const message = safeErrorMessage(err);
    return json({ error: message }, 500);
  }
});
