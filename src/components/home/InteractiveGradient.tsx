import { useRef, useEffect, useState } from 'react';

/**
 * Mouse-tracking gradient overlay - desktop only.
 * On mobile/touch, uses static gradient to avoid listeners and re-renders.
 */
export function InteractiveGradient() {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [hasPointer, setHasPointer] = useState(false);

  useEffect(() => {
    const el = ref.current;
    const fine = window.matchMedia('(pointer: fine)').matches;
    setHasPointer(fine);
    if (!el || !fine) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setPosition({ x, y });
    };

    el.addEventListener('mousemove', onMove, { passive: true });
    return () => el.removeEventListener('mousemove', onMove);
  }, []);

  const bg = hasPointer
    ? `radial-gradient(circle at ${position.x}% ${position.y}%, hsl(var(--primary) / 0.12) 0%, transparent 50%)`
    : 'radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.08) 0%, transparent 50%)';

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 opacity-40"
      aria-hidden
      style={{
        background: bg,
        transition: hasPointer ? 'background 0.4s ease-out' : 'none',
      }}
    />
  );
}
