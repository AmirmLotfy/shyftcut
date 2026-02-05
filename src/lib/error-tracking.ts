/**
 * Client-side error tracking. Initializes Sentry when VITE_SENTRY_DSN is set (production only).
 * Call initErrorTracking() in main.tsx; use captureException() in ErrorBoundary.
 */

import * as Sentry from '@sentry/react';

const DSN = import.meta.env.VITE_SENTRY_DSN;

export function initErrorTracking() {
  if (!DSN || typeof DSN !== 'string' || !DSN.startsWith('https://')) return;
  if (import.meta.env.DEV) return;
  Sentry.init({
    dsn: DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    environment: import.meta.env.MODE,
  });
}

export function captureException(error: unknown) {
  if (import.meta.env.DEV) {
    try {
      console.error("[ErrorTracking] captureException:", error);
    } catch { /* ignore */ }
  }
  if (!DSN) return;
  try {
    Sentry.captureException(error);
  } catch { /* ignore */ }
}
