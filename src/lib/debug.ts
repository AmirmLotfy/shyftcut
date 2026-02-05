/**
 * Debug logging: only logs when in development or VITE_DEBUG is set.
 * Use for API errors, flow traces, and non-sensitive diagnostics.
 */

const isDebug =
  typeof import.meta !== "undefined" &&
  (import.meta.env?.DEV === true || import.meta.env?.VITE_DEBUG === "true");

export function debugLog(scope: string, message: string, ...args: unknown[]): void {
  if (!isDebug) return;
  try {
    const prefix = `[${scope}]`;
    if (args.length > 0) {
      console.debug(prefix, message, ...args);
    } else {
      console.debug(prefix, message);
    }
  } catch {
    // no-op if console is unavailable
  }
}

export function debugWarn(scope: string, message: string, ...args: unknown[]): void {
  if (!isDebug) return;
  try {
    const prefix = `[${scope}]`;
    if (args.length > 0) {
      console.warn(prefix, message, ...args);
    } else {
      console.warn(prefix, message);
    }
  } catch {
    // no-op
  }
}

export function debugError(scope: string, message: string, error?: unknown): void {
  try {
    const prefix = `[${scope}]`;
    if (error instanceof Error) {
      console.error(prefix, message, error.message, error.stack);
    } else {
      console.error(prefix, message, error);
    }
  } catch {
    // no-op
  }
}
