/**
 * Core Web Vitals (LCP, FID/INP, CLS) reporting.
 * Reports to console in dev; can be extended to send to GA4 or analytics.
 */
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

function reportMetric(metric: { name: string; value: number; id: string }) {
  if (import.meta.env.DEV) {
    console.debug(`[Web Vitals] ${metric.name}:`, metric.value, metric.id);
  }
  // Optional: send to GA4 or analytics
  // gtag?.("event", metric.name, { value: metric.value, event_id: metric.id });
}

export function initWebVitals() {
  onCLS(reportMetric);
  onFCP(reportMetric);
  onINP(reportMetric);
  onLCP(reportMetric);
  onTTFB(reportMetric);
}
