/**
 * Base URL for canonical, OG, and sitemap. Set VITE_APP_ORIGIN in build for staging/production.
 */
export const BASE_URL =
  (import.meta.env.VITE_APP_ORIGIN as string | undefined)?.replace(/\/$/, "") ||
  "https://shyftcut.com";

/** Single source for app logo (favicon, nav, auth, footer, PWA, OG). WebP for fast load (~75KB). */
export const LOGO_PATH = "/Shyftcut-logo.webp";

/** OG image for social previews (1200×630). */
export const OG_IMAGE_PATH = "/og-image.png";
export const DEFAULT_OG_IMAGE_URL = `${BASE_URL}${OG_IMAGE_PATH}`;

/** Default OG image dimensions (1.91:1). */
export const DEFAULT_OG_IMAGE_WIDTH = 1200;
export const DEFAULT_OG_IMAGE_HEIGHT = 630;
export const DEFAULT_OG_IMAGE_TYPE = "image/png";

export function canonicalUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${p}`;
}
