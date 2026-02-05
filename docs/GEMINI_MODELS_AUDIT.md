# Gemini Models Audit

**Date:** 2025-02-04  
**Source:** [Gemini API Models](https://ai.google.dev/gemini-api/docs/models), [Gemini 3 Developer Guide](https://ai.google.dev/gemini-api/docs/gemini-3)

---

## Current Model Configuration

| Setting | Value |
|---------|-------|
| **Default model** | `gemini-3-flash-preview` |
| **Supported models** | `gemini-3-flash-preview`, `gemini-3-pro-preview`, `gemini-3-pro-image-preview` |
| **Image model** | `gemini-3-pro-image-preview` (Nano Banana Pro) |
| **API base** | `https://generativelanguage.googleapis.com/v1beta` |

---

## Model Names (Verified Correct ✓)

| Model ID | Use Case | Context | Notes |
|----------|----------|---------|-------|
| `gemini-3-flash-preview` | Chat, roadmap, CV, jobs, quiz | 1M in / 64k out | Free tier available; Pro-level intelligence, faster |
| `gemini-3-pro-preview` | (optional override via GEMINI_MODEL) | 1M in / 64k out | No free tier; most capable |
| `gemini-3-pro-image-preview` | Avatar generation | 65k in / 32k out | Image generation; strict thought signature for editing |

---

## Gemini 3 Best Practices (from official docs)

### 1. Thinking level
- **Default:** `high` (max reasoning depth)
- **Chat / simple tasks:** Use `thinkingLevel: "low"` → faster, lower latency
- **Quiz / complex reasoning:** Use `thinkingLevel: "high"` ✓ (we do this)

### 2. Temperature
- **Recommendation:** Keep at `1.0` (default)
- **Warning:** Lower values may cause looping, degraded performance on reasoning tasks
- **Our usage:** Some handlers use 0.3–0.5 (CV, jobs, courses-search) → consider updating to 1.0

### 3. Thought signatures
- **Chat:** Return `thoughtSignature` from model parts to maintain reasoning across turns ✓ (we do this)
- **Function calling:** Strict validation; missing signatures → 400 error
- **Image generation:** Required for conversational editing

### 4. Free tier
- **gemini-3-flash-preview:** Free tier available
- **gemini-3-pro-preview:** No free tier in API (rate limits may apply)

---

## Note: Gemini 3 Only

This project uses **only Gemini 3 models** to avoid API/format conflicts. Gemini 2.5 models are not in the allowlist.

---

## Recommended Updates Applied

1. **Temperature:** Set to 1.0 for all Gemini 3 calls (CV, jobs, courses-search)
2. **Thinking level:** Add `thinkingConfig: { thinkingLevel: "low" }` to CV and jobs handlers for faster structured outputs
3. **courses-search:** Update temperature 0.3 → 1.0 per Gemini 3 best practices
