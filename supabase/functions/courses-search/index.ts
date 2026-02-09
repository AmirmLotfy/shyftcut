// Dedicated Edge Function: find real course URLs via Gemini + Google Search grounding.
// Used by roadmap/generate to fill missing course URLs. Requires GEMINI_API_KEY.

import { corsHeaders } from "../_shared/cors.ts";
import { getGeminiConfig, getGeminiGenerateContentUrl, getGeminiHeaders, geminiFetchWithRetry, checkGeminiFinishReason, isGemini3Flash } from "../_shared/gemini.ts";
import { isAllowedCourseHost, isValidCourseUrl, ALLOWED_DOMAINS_INSTRUCTION, REAL_COURSE_URL_INSTRUCTION, getPlatformDomain } from "../_shared/course-hosts.ts";
import { verifyCourseUrl } from "../_shared/verify-course-url.ts";

const MAX_QUERY_LEN = 300;
const MAX_PLATFORM_LEN = 100;

/** Extract text from Gemini content parts (skip thought). */
function extractTextFromParts(parts: Array<{ text?: string; thought?: boolean }>): string {
  if (!parts?.length) return "";
  return parts
    .filter((p) => (p as { thought?: boolean }).thought !== true)
    .map((p) => p.text ?? "")
    .join("");
}

const COURSE_SEARCH_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    url: { type: "string", description: "A single real, working course page URL from search. Must be from an allowed platform. Must NOT be a browse/category page (e.g. coursera.org/browse/...). Use direct course URLs like coursera.org/learn/..., udemy.com/course/..., youtube.com/watch?v=..." },
    title: { type: "string", description: "Exact course title from the page if found." },
  },
  required: ["url"],
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { platform?: string; query?: string; language?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const platform = typeof body.platform === "string" ? body.platform.trim().slice(0, MAX_PLATFORM_LEN) : "";
  const query = typeof body.query === "string" ? body.query.trim().slice(0, MAX_QUERY_LEN) : "";
  const language = (typeof body.language === "string" && (body.language === "ar" || body.language === "en")) ? body.language : "en";

  if (!platform || !query) {
    return new Response(
      JSON.stringify({ error: "platform and query are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  if (!getPlatformDomain(platform)) {
    return new Response(
      JSON.stringify({ url: null, title: undefined }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const config = getGeminiConfig();
  if (!config) {
    return new Response(
      JSON.stringify({ error: "AI is not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const langInstruction = language === "ar"
    ? " When results exist in Arabic, prefer them. Use Egyptian modern professional tone for titles when presenting to Arabic users."
    : " Use English search and results.";
  const systemPrompt = `You are a course finder. Use Google Search to find ONE real course on the platform "${platform}" that matches the user's query. ${ALLOWED_DOMAINS_INSTRUCTION} ${REAL_COURSE_URL_INSTRUCTION} Return only one result: the URL of a specific course page (not the platform homepage, not a browse/category page, not a search results page). The URL must be a full HTTP or HTTPS link to a course detail page (path must not be only /).${langInstruction}`;
  const userPrompt = `Find a real course on ${platform} for: ${query}. Use search and return the exact course page URL and title in the required JSON format.`;

  const aiRes = await geminiFetchWithRetry(getGeminiGenerateContentUrl(config.model), {
    method: "POST",
    headers: getGeminiHeaders(config.apiKey),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: {
        thinkingConfig: { thinkingLevel: isGemini3Flash(config.model) ? "minimal" : "low" },
        temperature: 1.0,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
        responseJsonSchema: COURSE_SEARCH_RESPONSE_SCHEMA,
      },
    }),
  });

  if (!aiRes.ok) {
    const text = await aiRes.text();
    console.error("[courses-search] Gemini error:", aiRes.status, text);
    return new Response(
      JSON.stringify({ error: "Search failed", url: null }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let aiJson: { candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: string; thought?: boolean }> } }> };
  try {
    aiJson = (await aiRes.json()) as typeof aiJson;
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid AI response", url: null }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const cands = aiJson.candidates ?? [];
  const check = checkGeminiFinishReason(cands, cands[0]?.finishReason);
  if (!check.ok) {
    return new Response(
      JSON.stringify({ url: null, title: null }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const parts = cands[0]?.content?.parts ?? [];
  const jsonText = extractTextFromParts(parts as Array<{ text?: string; thought?: boolean }>);
  if (!jsonText.trim()) {
    return new Response(
      JSON.stringify({ url: null, title: null }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let parsed: { url?: string; title?: string };
  try {
    parsed = JSON.parse(jsonText) as { url?: string; title?: string };
  } catch {
    return new Response(
      JSON.stringify({ url: null, title: null }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const rawUrl = typeof parsed.url === "string" ? parsed.url.trim().slice(0, 2048) : "";
  let validUrl: string | null = isValidCourseUrl(rawUrl) && isAllowedCourseHost(rawUrl) ? rawUrl : null;
  if (validUrl && !(await verifyCourseUrl(validUrl))) {
    validUrl = null;
  }
  const title = typeof parsed.title === "string" ? parsed.title.trim().slice(0, 500) : undefined;

  return new Response(
    JSON.stringify({ url: validUrl, title: title ?? undefined }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
