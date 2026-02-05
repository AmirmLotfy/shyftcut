# Chat & Checkout Error Debugging Guide

## Checkout 502 (Failed to create checkout session)

| Cause | Fix |
|-------|-----|
| Invalid `POLAR_ACCESS_TOKEN` | Regenerate in [Polar Dashboard](https://polar.sh) → Settings → Access Tokens; set in Supabase secrets |
| Invalid or archived product ID | Verify `POLAR_PRODUCTS` in `src/lib/polar-config.ts` matches products in Polar → Products |
| Polar API 4xx (validation) | Error message is now passed through; check Supabase Edge Function logs for details |
| Unhandled exception | Check Supabase Dashboard → Functions → api → Logs |

---

## Error Summary

| Error | Source | Action |
|-------|--------|--------|
| **A listener indicated an asynchronous response...** | Browser extension (e.g. ad blocker, password manager) | Ignore – not from app code. Disable extensions to confirm. |
| **500 on /api (chat)** | Supabase Edge Function → Gemini API failure | Check Supabase Edge Function logs (below). |
| **[Chat] streamChat failed Failed to get AI response** | Frontend catches 500, shows API error message | Fixed: API now returns Gemini’s error in response; toast shows real reason. |
| **Node cannot be found in the current page** | DevTools / React DevTools or extension | Ignore – not from app code. |

---

## How to See the Real 500 Cause

1. **Supabase Dashboard** → Project → **Edge Functions** → `api` → **Logs**
2. Find entries like `chat AI error: 400 {...}` or `chat AI error: 500 {...}`
3. The second part is the raw Gemini API error (e.g. invalid model, thoughtSignature, quota)

---

## Common Gemini Error Causes

| Code | Meaning |
|------|---------|
| 400 | Bad request (e.g. invalid thoughtSignature, malformed payload, unsupported tool combo) |
| 401 | Invalid or missing `GEMINI_API_KEY` |
| 429 | Rate limit (retries are handled) |
| 500 | Gemini service error or timeout |

---

## If Chat Keeps Failing

1. **Confirm secrets:** `GEMINI_API_KEY` in Supabase Edge Function secrets.
2. **Try a different Gemini 3 model:** `GEMINI_MODEL=gemini-3-pro-preview` (if `gemini-3-flash-preview` is unstable).
3. **Turn off Web Search:** Use chat without “Web search” to rule out `google_search` tool issues.
4. **New chat:** Start a new conversation in case a bad `thoughtSignature` is causing 400s.

---

## Recent Changes

- Chat handler now parses Gemini error responses and returns clearer messages.
- User-visible errors:
  - 401 → "Invalid AI configuration. Please contact support."
  - 400 → Gemini message (e.g. thoughtSignature problem).
  - 5xx → "AI service is temporarily unavailable. Please try again in a moment."
