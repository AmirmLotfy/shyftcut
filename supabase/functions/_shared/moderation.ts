/**
 * AI content moderation for community (chat messages, study groups).
 * Uses Gemini 3 Flash. Returns allowed/blocked; fail closed on error.
 */

import {
  getGeminiConfig,
  getGeminiGenerateContentUrl,
  getGeminiHeaders,
  geminiFetchWithRetry,
  checkGeminiFinishReason,
  isGemini3Flash,
} from "./gemini.ts";

const MODERATION_TIMEOUT_MS = 10_000;

const MODERATION_SYSTEM_PROMPT = `You are a content moderator for a career-learning community. Classify the user's text.
Block (allowed: false) if it contains: political advocacy/partisanship, sexual content, religious proselytizing/debate, hate speech, violence, harassment, spam, or off-topic inappropriate content.
Allow (allowed: true) for: career advice, study tips, encouragement, general learning discussion, professional networking.
Respond with JSON only: {"allowed": boolean, "reason": "brief reason if blocked"}`;

const MODERATION_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    allowed: { type: "boolean", description: "Whether the content is allowed" },
    reason: { type: "string", description: "Brief reason when blocked, e.g. political, sexual, religious" },
  },
  required: ["allowed"],
};

export interface ModerationResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Moderate user-generated content. Returns { allowed: true } if content is OK,
 * { allowed: false, reason? } if blocked. On Gemini failure, returns { allowed: false } (fail closed).
 */
export async function moderateContent(text: string): Promise<ModerationResult> {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) return { allowed: true };

  const config = getGeminiConfig();
  if (!config) {
    console.warn("[moderation] Gemini not configured, blocking content");
    return { allowed: false, reason: "Moderation unavailable" };
  }

  try {
    const aiRes = await geminiFetchWithRetry(
      getGeminiGenerateContentUrl(config.model),
      {
        method: "POST",
        headers: getGeminiHeaders(config.apiKey),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: MODERATION_SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: trimmed }] }],
          generationConfig: {
            thinkingConfig: { thinkingLevel: isGemini3Flash(config.model) ? "minimal" : "low" },
            temperature: 0,
            maxOutputTokens: 128,
            responseMimeType: "application/json",
            responseJsonSchema: MODERATION_RESPONSE_SCHEMA,
          },
        }),
      },
      MODERATION_TIMEOUT_MS
    );

    if (!aiRes.ok) {
      console.warn("[moderation] Gemini API error:", aiRes.status);
      return { allowed: false, reason: "Moderation unavailable" };
    }

    const aiJson = (await aiRes.json()) as {
      candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: string }> } }>;
    };

    const cands = aiJson.candidates ?? [];
    const check = checkGeminiFinishReason(cands, cands[0]?.finishReason);
    if (!check.ok) {
      console.warn("[moderation] Gemini finish reason:", check.finishReason);
      return { allowed: false, reason: "Content could not be verified" };
    }

    const parts = cands[0]?.content?.parts ?? [];
    const rawText = parts.map((p) => p.text ?? "").join("").trim();
    if (!rawText) return { allowed: false, reason: "Content could not be verified" };

    const parsed = JSON.parse(rawText) as { allowed?: boolean; reason?: string };
    const allowed = parsed.allowed === true;
    return {
      allowed,
      reason: allowed ? undefined : (parsed.reason ?? "Content violates community guidelines"),
    };
  } catch (e) {
    console.warn("[moderation] Error:", e instanceof Error ? e.message : "unknown");
    return { allowed: false, reason: "Moderation unavailable" };
  }
}
