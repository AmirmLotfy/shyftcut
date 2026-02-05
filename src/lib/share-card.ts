import { toPng } from 'html-to-image';

const SHARE_CARD_WIDTH = 1080;
const SHARE_CARD_HEIGHT = 1920; // 9:16 for Instagram Stories

/**
 * Captures the share card element as a PNG blob for sharing/saving.
 * Uses Instagram Stories dimensions (1080×1920) for viral sharing.
 */
export async function captureShareCard(element: HTMLElement): Promise<Blob> {
  return toPng(element, {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    cacheBust: true,
    pixelRatio: 2,
    style: {
      transform: 'scale(1)',
    },
  });
}
