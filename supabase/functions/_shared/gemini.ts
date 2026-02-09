/**
 * Gemini API helpers for Edge (Deno). Same shape as server/lib/ai.ts.
 * Supports multiple API keys with rotation (GEMINI_API_KEY_1, _2, _3) or single key (GEMINI_API_KEY).
 */
import { getKeyManager, GeminiKeyManager } from "./gemini-rotation.ts";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "gemini-3-flash-preview";
const RETRY_DELAY_MS = 1500;
/** Timeout for Gemini API calls (generate and stream). */
export const GEMINI_REQUEST_TIMEOUT_MS = 90_000;

/**
 * Supported Gemini 3 models (see https://ai.google.dev/gemini-api/docs/models/gemini).
 * Image generation uses Gemini 3 Pro Image Preview (Nano Banana Pro): https://ai.google.dev/gemini-api/docs/image-generation
 */
const GEMINI_MODELS = ["gemini-3-flash-preview", "gemini-3-pro-preview", "gemini-3-pro-image-preview"];
/** Model for image generation (Nano Banana Pro). Model code per docs: gemini-3-pro-image-preview. */
export const GEMINI_IMAGE_MODEL = "gemini-3-pro-image-preview";

export interface GeminiConfig {
  apiKey: string;
  model: string;
  keyManager?: GeminiKeyManager;
}

/**
 * Get Gemini configuration with rotation support.
 * Supports numbered keys (GEMINI_API_KEY_1, _2, _3) or single key (GEMINI_API_KEY) for backward compatibility.
 * Returns null if no keys are configured.
 */
export function getGeminiConfig(): GeminiConfig | null {
  const keyManager = getKeyManager();
  const apiKey = keyManager.getNextKey();
  
  if (!apiKey) {
    // Fallback: try single key directly (for backward compatibility)
    const singleKey = Deno.env.get("GEMINI_API_KEY") ?? "";
    if (!singleKey) return null;
    const envModel = (Deno.env.get("GEMINI_MODEL") ?? "").trim();
    const model = envModel && GEMINI_MODELS.includes(envModel) ? envModel : DEFAULT_MODEL;
    return { apiKey: singleKey, model };
  }

  const envModel = (Deno.env.get("GEMINI_MODEL") ?? "").trim();
  const model = envModel && GEMINI_MODELS.includes(envModel) ? envModel : DEFAULT_MODEL;
  return { apiKey, model, keyManager };
}

/** True if model supports Flash-only thinking levels (minimal, medium). Pro only supports low/high. */
export function isGemini3Flash(model: string): boolean {
  return model === "gemini-3-flash-preview";
}

export function getGeminiGenerateContentUrl(model: string): string {
  return `${GEMINI_BASE}/models/${encodeURIComponent(model)}:generateContent`;
}

export function getGeminiStreamUrl(model: string): string {
  return `${GEMINI_BASE}/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`;
}

const CACHED_CONTENTS_URL = `${GEMINI_BASE}/cachedContents`;

/** Minimum system instruction length (chars) to consider context caching. Gemini 3 Flash min cache size is 1024 tokens (~4k chars). */
export const MIN_SYSTEM_PROMPT_LENGTH_FOR_CACHE = 1500;

/**
 * Create explicit context cache for system instruction. Use cachedContent name in generate/stream request to avoid re-sending same context.
 * Returns cache name (e.g. "cachedContents/xxx") or null on failure. TTL default 1 hour.
 */
export async function createCachedContent(
  apiKey: string,
  model: string,
  systemInstructionText: string,
  displayName: string,
  ttlSeconds = 3600
): Promise<string | null> {
  const body = {
    model: `models/${model}`,
    systemInstruction: { parts: [{ text: systemInstructionText }] },
    displayName: displayName.slice(0, 128),
    ttl: `${ttlSeconds}s`,
  };
  try {
    const res = await fetch(CACHED_CONTENTS_URL, {
      method: "POST",
      headers: getGeminiHeaders(apiKey),
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { name?: string };
    return json.name ?? null;
  } catch {
    return null;
  }
}

/** GenerateContent request shape for batch (contents, systemInstruction, tools, toolConfig, generationConfig). */
export type BatchGenerateContentRequest = {
  contents: Array<{ role: string; parts: Array<{ text: string }> }>;
  systemInstruction?: { parts: Array<{ text: string }> };
  tools?: unknown[];
  toolConfig?: unknown;
  generationConfig?: Record<string, unknown>;
};

/**
 * Submit a batch of GenerateContent requests (inline, no file upload). Use for non–real-time bulk workloads (e.g. quiz generation).
 * Returns batch name (e.g. "batches/xxx") for polling, or null on failure. 20MB limit for inline requests.
 */
export async function submitBatchGenerateContent(
  apiKey: string,
  model: string,
  requests: BatchGenerateContentRequest[],
  displayName: string
): Promise<string | null> {
  const url = `${GEMINI_BASE}/models/${encodeURIComponent(model)}:batchGenerateContent`;
  const body = {
    batch: {
      model: `models/${model}`,
      displayName: displayName.slice(0, 128),
      inputConfig: {
        requests: {
          requests: requests.map((req) => ({ request: req })),
        },
      },
    },
  };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: getGeminiHeaders(apiKey),
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { name?: string };
    return json.name ?? null;
  } catch {
    return null;
  }
}

/** Get batch status (state, output). Name format: batches/{batchId}. */
export async function getBatchStatus(apiKey: string, batchName: string): Promise<{ state?: string; output?: unknown; error?: string } | null> {
  const url = `${GEMINI_BASE}/${batchName}`;
  try {
    const res = await fetch(url, { method: "GET", headers: getGeminiHeaders(apiKey) });
    if (!res.ok) return null;
    const json = (await res.json()) as { state?: string; output?: unknown; error?: { message?: string } };
    return {
      state: json.state,
      output: json.output,
      error: json.error?.message,
    };
  } catch {
    return null;
  }
}

export function getGeminiHeaders(apiKey: string): Record<string, string> {
  return {
    "x-goog-api-key": apiKey,
    "Content-Type": "application/json",
  };
}

export function messagesToGeminiContents(
  messages: { role: string; content: string }[]
): Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> {
  const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];
  for (const m of messages) {
    const text = String(m?.content ?? "").trim();
    if (!text) continue;
    const role = m.role === "user" ? "user" : "model";
    contents.push({ role, parts: [{ text }] });
  }
  return contents;
}

/** Message shape that may include metadata.thoughtSignature for model turns (for Gemini 3 reasoning continuity). */
export type ChatMessageWithMeta = {
  role: string;
  content: string;
  metadata?: { thoughtSignature?: string };
};

/**
 * Build Gemini contents from chat messages, including thoughtSignature on model parts when present.
 * Use this for chat so the model can maintain reasoning across turns.
 */
export function contentsFromChatMessages(
  messages: ChatMessageWithMeta[]
): Array<{ role: "user" | "model"; parts: Array<{ text: string; thoughtSignature?: string }> }> {
  const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string; thoughtSignature?: string }> }> = [];
  for (const m of messages) {
    const text = String(m?.content ?? "").trim();
    if (!text) continue;
    const role = m.role === "user" ? "user" : "model";
    const part: { text: string; thoughtSignature?: string } = { text };
    if (role === "model" && (m as ChatMessageWithMeta).metadata?.thoughtSignature) {
      part.thoughtSignature = (m as ChatMessageWithMeta).metadata!.thoughtSignature;
    }
    contents.push({ role, parts: [part] });
  }
  return contents;
}

export function openAiFunctionToGeminiDeclaration(
  name: string,
  description: string,
  parameters: Record<string, unknown>
): { name: string; description: string; parameters: Record<string, unknown> } {
  return { name, description, parameters };
}

/** Blocked finish reasons: do not use content; return user-friendly message instead */
const BLOCKED_FINISH_REASONS = ["SAFETY", "RECITATION", "BLOCKLIST", "PROHIBITED_CONTENT"] as const;

export type GeminiFinishReasonCheck = {
  ok: boolean;
  finishReason?: string;
  userMessage?: string;
};

/**
 * Check Gemini response for blocked finish reason or missing candidate.
 * Call after parsing generateContent JSON. For function calling, only treat as ok when
 * finishReason is STOP or STOP_SEQUENCE (or equivalent for function call).
 */
export function checkGeminiFinishReason(candidates: unknown[], finishReason?: string): GeminiFinishReasonCheck {
  const reason = (finishReason ?? "").toUpperCase();
  if (!candidates?.length) {
    return { ok: false, finishReason: "EMPTY", userMessage: "The model did not return a response. Please try again." };
  }
  if (BLOCKED_FINISH_REASONS.some((r) => reason === r)) {
    return { ok: false, finishReason: reason, userMessage: "Your request could not be completed due to content filters. Please rephrase and try again." };
  }
  return { ok: true, finishReason: reason || undefined };
}

/**
 * For function-calling responses: only use functionCall when finish reason indicates success.
 */
export function isOkFinishReasonForFunctionCall(finishReason?: string): boolean {
  const r = (finishReason ?? "").toUpperCase();
  return r === "STOP" || r === "STOP_SEQUENCE" || r === "FUNCTION_CALL" || r === "";
}

export type GeminiUsageMetadata = {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
  thoughtsTokenCount?: number;
  promptTokensDetails?: unknown;
  toolUsePromptTokenCount?: number;
};

/**
 * Log token usage for cost and rate-limit visibility. Do not log user or model content.
 */
export function logGeminiUsage(usage: GeminiUsageMetadata | undefined | null, route?: string): void {
  if (!usage) return;
  const prompt = usage.promptTokenCount ?? 0;
  const candidates = usage.candidatesTokenCount ?? 0;
  const total = usage.totalTokenCount ?? 0;
  const thoughts = usage.thoughtsTokenCount ?? 0;
  const prefix = route ? `[${route}]` : "[gemini]";
  console.log(
    `${prefix} usage: prompt=${prompt} candidates=${candidates} total=${total}` +
      (thoughts > 0 ? ` thoughts=${thoughts}` : "")
  );
}

/**
 * Extract API key from request headers (x-goog-api-key).
 */
function extractApiKeyFromOptions(options: RequestInit): string | null {
  const headers = options.headers as Record<string, string> | Headers | undefined;
  if (!headers) return null;
  
  if (headers instanceof Headers) {
    return headers.get("x-goog-api-key");
  }
  
  if (typeof headers === "object" && headers !== null) {
    return headers["x-goog-api-key"] ?? null;
  }
  
  return null;
}

/**
 * Update request headers with new API key.
 */
function updateOptionsWithApiKey(options: RequestInit, apiKey: string): RequestInit {
  const headers = options.headers as Record<string, string> | Headers | undefined;
  const newHeaders: Record<string, string> = {};
  
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      newHeaders[key] = value;
    });
  } else if (typeof headers === "object" && headers !== null) {
    Object.assign(newHeaders, headers);
  }
  
  newHeaders["x-goog-api-key"] = apiKey;
  
  return {
    ...options,
    headers: newHeaders,
  };
}

/**
 * Fetch with timeout and multi-key rotation retry.
 * Automatically rotates to next available key on errors (429, 401, 402, 500, etc.).
 * Does not persist partial content on failure.
 * 
 * Note: If rotation is enabled (numbered keys set), this function will use the rotation manager
 * and may override the API key in the provided headers. If only a single key is configured,
 * it uses the key from headers (backward compatible).
 */
export async function geminiFetchWithRetry(url: string, options: RequestInit, timeoutMs = GEMINI_REQUEST_TIMEOUT_MS): Promise<Response> {
  const keyManager = getKeyManager();
  const maxRetries = keyManager.getMaxRetries();
  const hasMultipleKeys = keyManager.getTotalKeyCount() > 1;
  const usedKeys: string[] = [];
  let lastError: Response | null = null;
  let lastErrorCode: number | null = null;

  // Get initial API key
  // If rotation is enabled (multiple keys), use rotation manager
  // Otherwise, extract from headers (backward compatible)
  let currentApiKey: string | null;
  
  if (hasMultipleKeys) {
    // Use rotation manager for multi-key setup
    currentApiKey = keyManager.getNextKey();
  } else {
    // Single key mode: extract from headers or fallback to env
    currentApiKey = extractApiKeyFromOptions(options) ?? Deno.env.get("GEMINI_API_KEY") ?? null;
  }
  
  if (!currentApiKey) {
    return new Response(JSON.stringify({ error: "No API keys configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Try with rotation (up to maxRetries attempts)
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      // Retry logic
      if (hasMultipleKeys) {
        // Multi-key mode: rotate to next key
        if (currentApiKey) {
          keyManager.markKeyError(currentApiKey, lastErrorCode ?? 500);
        }
        
        // Get next available key
        const nextKey = keyManager.getNextKey();
        if (!nextKey) {
          // No more keys available
          console.error(`[gemini-rotation] All keys exhausted after ${attempt} attempts`);
          break;
        }
        
        // Avoid using same key twice in same request
        if (usedKeys.includes(nextKey) && usedKeys.length < keyManager.getTotalKeyCount()) {
          // Try to find a different key
          const available = keyManager.getAvailableKeys().filter((k) => !usedKeys.includes(k));
          if (available.length > 0) {
            currentApiKey = available[0];
          } else {
            currentApiKey = nextKey; // Last resort
          }
        } else {
          currentApiKey = nextKey;
        }
        
        usedKeys.push(currentApiKey);
        
        // Update options with new API key
        options = updateOptionsWithApiKey(options, currentApiKey);
        
        // Small delay before retry (except for immediate rotation on 429)
        if (lastErrorCode !== 429) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        }
      } else {
        // Single-key mode: preserve original behavior (retry once on 429 only)
        if (lastErrorCode === 429 && attempt === 1) {
          // Original behavior: retry once with same key on 429
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        } else {
          // Not a 429 or already retried - don't retry further
          break;
        }
      }
    } else {
      // First attempt
      usedKeys.push(currentApiKey);
      // Update options with current API key (in case rotation manager provided it)
      options = updateOptionsWithApiKey(options, currentApiKey);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const opts: RequestInit = { ...options, signal: controller.signal };

    try {
      const res = await fetch(url, opts);
      
      // Success - mark key as healthy
      if (res.ok) {
        clearTimeout(timeoutId);
        if (hasMultipleKeys) {
          keyManager.markKeySuccess(currentApiKey);
        }
        return res;
      }

      // Error - check if we should retry
      lastError = res;
      lastErrorCode = res.status;
      clearTimeout(timeoutId);

      // 401 (Unauthorized) - don't retry, key is invalid
      if (res.status === 401) {
        if (hasMultipleKeys) {
          keyManager.markKeyError(currentApiKey, 401);
        }
        return res;
      }

      // 429 (Rate Limit) - retry logic depends on mode
      if (res.status === 429) {
        if (hasMultipleKeys) {
          // Multi-key: rotate to next key
          continue;
        } else {
          // Single-key: retry once with same key (original behavior)
          if (attempt === 0) {
            continue; // Will retry once
          } else {
            return res; // Already retried
          }
        }
      }

      // 402 (Payment Required) - retry with next key (multi-key only)
      if (res.status === 402) {
        if (hasMultipleKeys) {
          continue;
        } else {
          return res; // Single-key: don't retry
        }
      }

      // 500/503 (Server Error) - retry with next key (multi-key only)
      if (res.status === 500 || res.status === 503) {
        if (hasMultipleKeys) {
          continue;
        } else {
          return res; // Single-key: don't retry
        }
      }

      // Other errors - retry with next key (multi-key only, up to max retries)
      if (hasMultipleKeys && attempt < maxRetries) {
        continue;
      }

      // Max retries reached or single-key mode
      return res;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Network/timeout error - retry with next key
      if (attempt < maxRetries) {
        lastErrorCode = 0; // Network error
        continue;
      }
      
      // Max retries reached - return error
      throw error;
    }
  }

  // All retries exhausted - return last error or create error response
  if (lastError) {
    return lastError;
  }

  return new Response(
    JSON.stringify({ error: "AI service is temporarily unavailable. Please try again." }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}
