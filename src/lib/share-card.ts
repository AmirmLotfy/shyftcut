import { toBlob } from 'html-to-image';

const SHARE_CARD_WIDTH = 1080;
const SHARE_CARD_HEIGHT = 1920; // 9:16 for Instagram Stories

/** 1x1 transparent PNG – used when an image fails to load so capture doesn't abort */
const TRANSPARENT_PLACEHOLDER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

/**
 * Captures the share card element as a PNG blob for sharing/saving.
 * Uses Instagram Stories dimensions (1080×1920) for viral sharing.
 */
export async function captureShareCard(element: HTMLElement): Promise<Blob> {
  const blob = await toBlob(element, {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    cacheBust: true,
    pixelRatio: 2,
    skipFonts: true, // Avoid SecurityError: cannot access cssRules on cross-origin stylesheets (Google Fonts)
    imagePlaceholder: TRANSPARENT_PLACEHOLDER,
    fetchRequestInit: { mode: 'cors', credentials: 'same-origin' },
    style: {
      transform: 'scale(1)',
    },
  });
  if (!blob) throw new Error('Capture returned null blob');
  return blob;
}
