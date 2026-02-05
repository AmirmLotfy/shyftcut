/**
 * Edge Function logging: structured error/debug logs.
 * Set DEBUG=1 in secrets to enable debug logs (optional).
 */

const DEBUG = Deno.env.get("DEBUG") === "1" || Deno.env.get("DEBUG") === "true";

export function logError(scope: string, message: string, err?: unknown): void {
  const payload: Record<string, unknown> = { scope, message };
  if (err !== undefined) {
    if (err instanceof Error) {
      payload.error = err.message;
      payload.name = err.name;
      if (DEBUG) payload.stack = err.stack;
    } else {
      payload.error = String(err);
    }
  }
  console.error(JSON.stringify(payload));
}

export function logDebug(scope: string, message: string, data?: Record<string, unknown>): void {
  if (!DEBUG) return;
  console.log(JSON.stringify({ scope, message, ...data }));
}

/** Return a safe user-facing error message (no stack or internal details). */
export function safeErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message && err.message.length < 200) {
    return err.message;
  }
  return "An error occurred";
}
