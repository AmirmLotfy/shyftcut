/**
 * Gemini API Key Rotation Manager
 * Handles multi-key rotation, health tracking, and automatic failover for Gemini API calls.
 * Works in stateless Edge Function environment (in-memory state per request).
 */

export type KeyStatus = "healthy" | "rate_limited" | "error" | "quota_exceeded" | "disabled";

export interface KeyHealth {
  status: KeyStatus;
  lastError?: number;
  lastErrorTime?: number;
  consecutiveFailures: number;
  lastSuccessTime?: number;
}

export interface RotationConfig {
  maxRetries: number;
  cooldownBaseMs: number;
  cooldownMaxMs: number;
}

const DEFAULT_CONFIG: RotationConfig = {
  maxRetries: 3,
  cooldownBaseMs: 30_000, // 30 seconds
  cooldownMaxMs: 3_600_000, // 1 hour
};

/**
 * Calculate cooldown duration based on error type and consecutive failures.
 */
function getCooldownMs(errorCode: number, consecutiveFailures: number, config: RotationConfig): number {
  // 401 (Unauthorized) - permanent, but we'll use max cooldown
  if (errorCode === 401) return config.cooldownMaxMs;

  // 402 (Payment Required) - 1 hour
  if (errorCode === 402) return 3_600_000;

  // 429 (Rate Limit) - 60 seconds
  if (errorCode === 429) return 60_000;

  // 500/503 (Server Error) - 30-60 seconds
  if (errorCode === 500 || errorCode === 503) return 60_000;

  // Other errors - exponential backoff: 30s, 60s, 120s, ... up to max
  const exponential = config.cooldownBaseMs * Math.pow(2, consecutiveFailures - 1);
  return Math.min(exponential, config.cooldownMaxMs);
}

/**
 * Determine key status from error code.
 */
function getStatusFromError(errorCode: number): KeyStatus {
  if (errorCode === 401) return "disabled";
  if (errorCode === 402) return "quota_exceeded";
  if (errorCode === 429) return "rate_limited";
  if (errorCode === 500 || errorCode === 503) return "error";
  return "error";
}

/**
 * Check if a key is available (healthy or cooldown expired).
 */
function isKeyAvailable(health: KeyHealth, now: number, config: RotationConfig): boolean {
  if (health.status === "healthy") return true;
  if (health.status === "disabled") return false;

  // Check if cooldown has expired
  if (health.lastErrorTime && health.lastError) {
    const cooldown = getCooldownMs(health.lastError, health.consecutiveFailures, config);
    return now >= health.lastErrorTime + cooldown;
  }

  return false;
}

/**
 * Mask API key for logging (only show first 8 chars).
 */
function maskKey(key: string): string {
  if (!key || key.length <= 8) return "***";
  return `${key.slice(0, 8)}***`;
}

/**
 * Key Rotation Manager for Gemini API.
 * Manages multiple API keys with health tracking and automatic rotation.
 */
export class GeminiKeyManager {
  private keys: string[] = [];
  private health: Map<string, KeyHealth> = new Map();
  private lastUsedIndex: number = -1;
  private config: RotationConfig;

  constructor(config?: Partial<RotationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadKeys();
  }

  /**
   * Load API keys from environment variables.
   * Supports numbered keys (GEMINI_API_KEY_1, _2, _3) or single key (GEMINI_API_KEY).
   */
  private loadKeys(): void {
    const keys: string[] = [];

    // Try numbered keys first
    for (let i = 1; i <= 10; i++) {
      const key = Deno.env.get(`GEMINI_API_KEY_${i}`);
      if (key && key.trim()) {
        keys.push(key.trim());
      }
    }

    // Fallback to single key if no numbered keys found
    if (keys.length === 0) {
      const singleKey = Deno.env.get("GEMINI_API_KEY");
      if (singleKey && singleKey.trim()) {
        keys.push(singleKey.trim());
      }
    }

    this.keys = keys;

    // Initialize health tracking for all keys
    for (const key of this.keys) {
      if (!this.health.has(key)) {
        this.health.set(key, {
          status: "healthy",
          consecutiveFailures: 0,
        });
      }
    }

    if (this.keys.length > 0) {
      console.log(`[gemini-rotation] Loaded ${this.keys.length} API key(s)`);
    }
  }

  /**
   * Get all available keys (healthy or cooldown expired).
   */
  getAvailableKeys(): string[] {
    const now = Date.now();
    return this.keys.filter((key) => {
      const health = this.health.get(key) ?? { status: "healthy" as KeyStatus, consecutiveFailures: 0 };
      return isKeyAvailable(health, now, this.config);
    });
  }

  /**
   * Get next key using round-robin selection from available keys.
   * Returns null if no keys are available.
   */
  getNextKey(): string | null {
    const available = this.getAvailableKeys();
    if (available.length === 0) {
      // Last resort: try keys in cooldown
      const allKeys = this.keys.filter((key) => {
        const health = this.health.get(key);
        return health?.status !== "disabled";
      });
      if (allKeys.length === 0) {
        console.warn("[gemini-rotation] No available keys");
        return null;
      }
      // Use first non-disabled key as last resort
      const lastResort = allKeys[0];
      console.warn(`[gemini-rotation] Using key in cooldown as last resort: ${maskKey(lastResort)}`);
      return lastResort;
    }

    // Round-robin selection
    this.lastUsedIndex = (this.lastUsedIndex + 1) % available.length;
    const selected = available[this.lastUsedIndex];
    const health = this.health.get(selected);
    console.log(`[gemini-rotation] Using key: ${maskKey(selected)} (${health?.status ?? "healthy"})`);
    return selected;
  }

  /**
   * Mark a key as failed with error code.
   */
  markKeyError(key: string, errorCode: number): void {
    const health = this.health.get(key) ?? {
      status: "healthy" as KeyStatus,
      consecutiveFailures: 0,
    };

    const newStatus = getStatusFromError(errorCode);
    const now = Date.now();
    const consecutiveFailures = newStatus === health.status ? health.consecutiveFailures + 1 : 1;

    const updated: KeyHealth = {
      status: newStatus,
      lastError: errorCode,
      lastErrorTime: now,
      consecutiveFailures,
      lastSuccessTime: health.lastSuccessTime,
    };

    this.health.set(key, updated);

    const cooldown = getCooldownMs(errorCode, consecutiveFailures, this.config);
    console.warn(
      `[gemini-rotation] Key ${maskKey(key)} failed: ${errorCode} (${newStatus}), cooldown: ${Math.round(cooldown / 1000)}s`
    );
  }

  /**
   * Mark a key as successful.
   */
  markKeySuccess(key: string): void {
    const health = this.health.get(key);
    if (health?.status === "healthy") {
      // Already healthy, just update success time
      this.health.set(key, {
        ...health,
        lastSuccessTime: Date.now(),
      });
      return;
    }

    // Recover from error state
    const now = Date.now();
    this.health.set(key, {
      status: "healthy",
      consecutiveFailures: 0,
      lastSuccessTime: now,
      lastError: health?.lastError,
      lastErrorTime: health?.lastErrorTime,
    });

    console.log(`[gemini-rotation] Key ${maskKey(key)} recovered (healthy)`);
  }

  /**
   * Reset health for a specific key (manual recovery).
   */
  resetKeyHealth(key: string): void {
    this.health.set(key, {
      status: "healthy",
      consecutiveFailures: 0,
      lastSuccessTime: Date.now(),
    });
    console.log(`[gemini-rotation] Key ${maskKey(key)} health reset manually`);
  }

  /**
   * Get health status for all keys (for debugging).
   */
  getAllKeysHealth(): Array<{ key: string; health: KeyHealth; masked: string }> {
    return this.keys.map((key) => ({
      key,
      health: this.health.get(key) ?? { status: "healthy" as KeyStatus, consecutiveFailures: 0 },
      masked: maskKey(key),
    }));
  }

  /**
   * Get number of available keys.
   */
  getAvailableKeyCount(): number {
    return this.getAvailableKeys().length;
  }

  /**
   * Get total number of keys.
   */
  getTotalKeyCount(): number {
    return this.keys.length;
  }

  /**
   * Get max retries configuration.
   */
  getMaxRetries(): number {
    return this.config.maxRetries;
  }
}

/**
 * Create a singleton instance (per-request, resets on cold start).
 * In Edge Functions, this is fine since each request gets a fresh instance.
 */
let managerInstance: GeminiKeyManager | null = null;

/**
 * Get or create the key manager instance.
 */
export function getKeyManager(config?: Partial<RotationConfig>): GeminiKeyManager {
  if (!managerInstance) {
    const maxRetries = parseInt(Deno.env.get("GEMINI_ROTATION_MAX_RETRIES") ?? "3", 10);
    const cooldownBase = parseInt(Deno.env.get("GEMINI_ROTATION_COOLDOWN_BASE_MS") ?? "30000", 10);
    const cooldownMax = parseInt(Deno.env.get("GEMINI_ROTATION_COOLDOWN_MAX_MS") ?? "3600000", 10);

    managerInstance = new GeminiKeyManager({
      maxRetries: isNaN(maxRetries) ? undefined : maxRetries,
      cooldownBaseMs: isNaN(cooldownBase) ? undefined : cooldownBase,
      cooldownMaxMs: isNaN(cooldownMax) ? undefined : cooldownMax,
      ...config,
    });
  }
  return managerInstance;
}
