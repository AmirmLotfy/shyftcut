# Gemini API Key Rotation Implementation Guide

## Current State Analysis

### Current Implementation
- **Single API Key**: Uses `GEMINI_API_KEY` environment variable
- **Basic Retry**: One retry on 429 (rate limit) with 1.5s delay
- **No Rotation**: All requests use the same key
- **Error Handling**: Limited - only handles 429, other errors fail immediately

### Usage Points
The Gemini API is used across multiple endpoints:
1. **Chat** (`/api/chat`) - Streaming responses
2. **Roadmap Generation** (`/api/roadmap/generate`)
3. **Job Search** (`/api/jobs/find`)
4. **Course Search** (`/api/courses/search`)
5. **Quiz Generation** (`/api/quiz/generate`)
6. **Career DNA Analysis** (`/api/career-dna/analyze`)
7. **Content Moderation** (`moderateContent()`)
8. **Avatar Generation** (`/api/profile/avatar`)

### Current Limitations
- **Rate Limits**: Single key hits rate limits quickly under load
- **Quota Exhaustion**: No fallback when quota is exceeded
- **Key Failures**: No recovery mechanism if a key becomes invalid
- **Load Distribution**: All traffic goes through one key

---

## Smart Rotation Strategy

### 1. **Multi-Key Support**

#### Configuration Options

**Option A: Comma-Separated Keys (Recommended)**
```env
GEMINI_API_KEY=key1,key2,key3
```

**Option B: Numbered Keys**
```env
GEMINI_API_KEY_1=key1
GEMINI_API_KEY_2=key2
GEMINI_API_KEY_3=key3
```

**Recommendation**: Option A is simpler and easier to manage. Option B allows per-key configuration (e.g., different models per key).

---

### 2. **Key Health Tracking**

Each key should track:
- **Status**: `healthy`, `rate_limited`, `error`, `quota_exceeded`, `disabled`
- **Last Error**: Error code and timestamp
- **Consecutive Failures**: Count of consecutive failures
- **Last Success**: Timestamp of last successful request
- **Request Count**: Total requests made with this key
- **Error Count**: Total errors encountered

### 3. **Rotation Logic**

#### Priority Order
1. **Round-Robin** among healthy keys (load balancing)
2. **Fallback** to next healthy key on error
3. **Exponential Backoff** for failed keys
4. **Recovery** after cooldown period

#### Error Handling Strategy

| Error Code | Action | Cooldown |
|------------|--------|----------|
| **429** (Rate Limit) | Rotate immediately, mark key as rate-limited | 60 seconds |
| **401** (Unauthorized) | Mark key as disabled permanently | Permanent |
| **402** (Payment Required) | Mark key as quota_exceeded | 1 hour |
| **500** (Server Error) | Retry with next key, mark as error | 30 seconds |
| **503** (Service Unavailable) | Retry with next key, mark as error | 60 seconds |

#### Smart Features

1. **Adaptive Cooldown**
   - Start with 30s cooldown
   - Double on consecutive failures (max 1 hour)
   - Reset on successful request

2. **Health Recovery**
   - Check failed keys periodically
   - Test with a lightweight request
   - Restore to healthy pool if successful

3. **Load Balancing**
   - Distribute requests evenly across healthy keys
   - Track usage per key
   - Prefer less-used keys when multiple are available

4. **Priority Routing**
   - Critical endpoints (moderation) → prefer most reliable keys
   - High-volume endpoints (chat) → distribute evenly
   - Batch operations → use dedicated keys if available

---

## Implementation Plan

### Phase 1: Core Rotation Infrastructure

#### 1.1 Create Key Manager (`supabase/functions/_shared/gemini-rotation.ts`)

**Features:**
- Parse multiple API keys from environment
- Track key health and status
- Implement round-robin selection
- Handle key rotation on errors
- Manage cooldown periods

**Key Functions:**
```typescript
- getAvailableKeys(): string[]
- getNextKey(): string | null
- markKeyError(key: string, error: number): void
- markKeySuccess(key: string): void
- resetKeyHealth(key: string): void
```

#### 1.2 Update `getGeminiConfig()`

**Changes:**
- Return multiple keys instead of single key
- Integrate with key manager
- Maintain backward compatibility (single key)

### Phase 2: Enhanced Retry Logic

#### 2.1 Update `geminiFetchWithRetry()`

**Enhancements:**
- Try multiple keys on failure
- Implement exponential backoff per key
- Track errors per key
- Return which key was used (for logging)

**Flow:**
1. Get next available key
2. Make request
3. On error:
   - Mark key as failed
   - Get next available key
   - Retry (up to max attempts)
4. On success:
   - Mark key as healthy
   - Return response

### Phase 3: Integration Points

#### 3.1 Update All API Endpoints

**Files to Update:**
- `supabase/functions/api/index.ts` (all routes)
- `supabase/functions/courses-search/index.ts`
- `supabase/functions/_shared/moderation.ts`

**Changes:**
- Use new rotation-aware config
- Handle key rotation errors gracefully
- Log which key was used (for debugging)

#### 3.2 Error Response Enhancement

**Improvements:**
- Return more specific error messages
- Include retry-after hints when available
- Log key rotation events

### Phase 4: Monitoring & Observability

#### 4.1 Logging

**Log Events:**
- Key rotation events
- Key health changes
- Error rates per key
- Usage distribution

**Format:**
```
[gemini-rotation] Using key: key1 (healthy)
[gemini-rotation] Key key1 failed: 429, rotating to key2
[gemini-rotation] Key key2 recovered after 60s cooldown
```

#### 4.2 Metrics (Optional)

Track:
- Requests per key
- Success rate per key
- Average response time per key
- Rotation frequency

---

## Configuration

### Environment Variables

```env
# Single key (backward compatible)
GEMINI_API_KEY=your-key-here

# Multiple keys (comma-separated)
GEMINI_API_KEY=key1,key2,key3

# Optional: Per-key configuration (if using numbered keys)
GEMINI_API_KEY_1=key1
GEMINI_API_KEY_2=key2
GEMINI_MODEL_KEY_1=gemini-3-pro-preview  # Different model per key
GEMINI_MODEL_KEY_2=gemini-3-flash-preview

# Rotation settings (optional, with defaults)
GEMINI_ROTATION_MAX_RETRIES=3
GEMINI_ROTATION_COOLDOWN_BASE_MS=30000
GEMINI_ROTATION_COOLDOWN_MAX_MS=3600000
```

### Default Settings

- **Max Retries**: 3 attempts (try 3 different keys)
- **Base Cooldown**: 30 seconds
- **Max Cooldown**: 1 hour
- **Health Check Interval**: 5 minutes (for failed keys)

---

## Smart Rotation Features

### 1. **Intelligent Key Selection**

**Priority Algorithm:**
1. Select from healthy keys using round-robin
2. Prefer keys with fewer recent requests
3. Avoid keys that just failed (respect cooldown)
4. For critical operations, prefer most reliable keys

### 2. **Adaptive Error Handling**

**429 Rate Limit:**
- Immediate rotation to next key
- Mark current key as rate-limited
- Short cooldown (60s) - rate limits are usually temporary

**401 Unauthorized:**
- Permanent disable (key is invalid)
- Log alert for manual intervention
- Don't retry with same key

**402 Payment Required:**
- Mark as quota exceeded
- Longer cooldown (1 hour)
- May recover if quota resets

**500/503 Server Errors:**
- Retry with next key immediately
- Mark as error (temporary)
- Shorter cooldown (30-60s)

### 3. **Health Recovery**

**Automatic Recovery:**
- Periodically test failed keys with lightweight request
- Restore to healthy pool if successful
- Exponential backoff for recovery attempts

**Manual Override:**
- Admin endpoint to reset key health
- Force health check for specific key
- Disable/enable keys manually

### 4. **Load Balancing**

**Distribution:**
- Round-robin among healthy keys
- Track request count per key
- Prefer less-used keys when available

**Fairness:**
- Ensure all keys get similar usage
- Prevent single key from being overloaded
- Balance across all available keys

---

## Implementation Considerations

### Backward Compatibility

- **Single Key**: Continue to work with `GEMINI_API_KEY=single-key`
- **No Breaking Changes**: Existing code should work without modification
- **Gradual Migration**: Can add multiple keys incrementally

### Performance

- **Minimal Overhead**: Key selection is O(1) operation
- **No External Dependencies**: Use in-memory state (Deno KV optional for persistence)
- **Fast Failover**: Immediate rotation on errors

### Security

- **Key Isolation**: Errors on one key don't expose others
- **No Key Logging**: Never log full API keys (only prefixes)
- **Secure Storage**: Keys only in environment variables

### Edge Function Constraints

- **Stateless**: Each request is independent
- **No Shared State**: Use in-memory tracking (resets on cold start)
- **Optional Persistence**: Use Deno KV for cross-request state (if needed)

---

## Testing Strategy

### Unit Tests

1. **Key Parsing**: Test comma-separated and numbered keys
2. **Rotation Logic**: Test round-robin selection
3. **Error Handling**: Test each error code behavior
4. **Cooldown**: Test cooldown periods and recovery

### Integration Tests

1. **End-to-End**: Test with real API keys (test keys)
2. **Error Scenarios**: Simulate rate limits and errors
3. **Recovery**: Test key recovery after cooldown
4. **Load**: Test under high request volume

### Monitoring

1. **Log Analysis**: Review rotation logs
2. **Error Rates**: Track errors per key
3. **Usage Distribution**: Ensure even distribution
4. **Performance**: Monitor response times

---

## Migration Path

### Step 1: Add Rotation Infrastructure
- Create `gemini-rotation.ts`
- Keep existing `getGeminiConfig()` working
- Add new `getGeminiConfigWithRotation()`

### Step 2: Update Retry Logic
- Enhance `geminiFetchWithRetry()` to support rotation
- Maintain backward compatibility

### Step 3: Gradual Rollout
- Test with non-critical endpoints first
- Monitor for issues
- Roll out to all endpoints

### Step 4: Add Multiple Keys
- Add second key to environment
- Verify rotation works
- Add more keys as needed

---

## Example Usage

### Before (Current)
```typescript
const config = getGeminiConfig();
const res = await geminiFetchWithRetry(url, {
  headers: getGeminiHeaders(config.apiKey),
  // ...
});
```

### After (With Rotation)
```typescript
const config = getGeminiConfigWithRotation();
const res = await geminiFetchWithRetry(url, {
  headers: getGeminiHeaders(config.apiKey),
  // ...
});
// Rotation happens automatically inside geminiFetchWithRetry
```

**No code changes needed in endpoints!** The rotation is transparent.

---

## Benefits

1. **Higher Availability**: Multiple keys = redundancy
2. **Better Rate Limit Handling**: Distribute load across keys
3. **Automatic Failover**: Seamless switching on errors
4. **Improved Reliability**: Recover from temporary issues
5. **Scalability**: Handle more traffic with multiple keys
6. **Cost Optimization**: Use free tier keys efficiently

---

## Next Steps

1. **Review** this plan and adjust as needed
2. **Implement** Phase 1 (core rotation infrastructure)
3. **Test** with multiple keys in development
4. **Deploy** gradually to production
5. **Monitor** rotation behavior and adjust settings
