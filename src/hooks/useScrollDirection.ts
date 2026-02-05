import { useState, useEffect, useRef } from 'react';

export type ScrollDirection = 'up' | 'down' | null;

/**
 * Returns scroll direction: 'up' | 'down' | null.
 * null when at top or when direction hasn't been determined yet.
 * Uses a threshold to avoid jitter on small scrolls.
 */
export function useScrollDirection(threshold = 10): ScrollDirection {
  const [direction, setDirection] = useState<ScrollDirection>(null);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y <= 0) {
          setDirection(null);
        } else if (y > lastY.current + threshold) {
          setDirection('down');
          lastY.current = y;
        } else if (y < lastY.current - threshold) {
          setDirection('up');
          lastY.current = y;
        }
        ticking.current = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return direction;
}
