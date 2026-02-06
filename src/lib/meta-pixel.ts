/**
 * Meta Pixel (Facebook Pixel) integration
 * Provides access to fbq function for tracking events
 */

declare global {
  interface Window {
    fbq?: (
      action: 'init' | 'track' | 'trackCustom',
      eventName: string,
      params?: Record<string, unknown>
    ) => void;
    _fbq?: typeof window.fbq;
  }
}

/**
 * Get Meta Pixel instance (fbq function)
 * Returns null if Meta Pixel is not loaded or not configured
 */
export function getMetaPixel(): typeof window.fbq | null {
  if (typeof window === 'undefined') return null;
  
  const pixelId = import.meta.env.VITE_META_PIXEL_ID;
  if (!pixelId) {
    return null;
  }
  
  return window.fbq || null;
}

/**
 * Initialize Meta Pixel (called from index.html)
 * This is a helper function that can be called if needed
 */
export function initMetaPixel(pixelId: string): void {
  if (typeof window === 'undefined') return;
  
  // Meta Pixel is initialized via script tag in index.html
  // This function is just for reference/documentation
  if (!window.fbq) {
    console.warn('[Meta Pixel] fbq not found. Ensure Meta Pixel script is loaded in index.html');
    return;
  }
  
  if (pixelId) {
    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');
  }
}

// Auto-initialize if pixel ID is available
if (typeof window !== 'undefined') {
  const pixelId = import.meta.env.VITE_META_PIXEL_ID;
  if (pixelId && window.fbq) {
    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');
  }
}

/**
 * Track a standard Meta Pixel event
 */
export function trackMetaPixelEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  const fbq = getMetaPixel();
  if (fbq) {
    fbq('track', eventName, params);
  }
}

/**
 * Track a custom Meta Pixel event
 */
export function trackMetaPixelCustom(
  eventName: string,
  params?: Record<string, unknown>
): void {
  const fbq = getMetaPixel();
  if (fbq) {
    fbq('trackCustom', eventName, params);
  }
}
