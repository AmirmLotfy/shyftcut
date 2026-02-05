import { useRef, useEffect, useState } from 'react';

/**
 * Mouse-tracking gradient overlay - subtle 2026 hero effect
 * Adds a soft gradient that follows cursor position
 */
export function InteractiveGradient() {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setPosition({ x, y });
    };

    el.addEventListener('mousemove', onMove, { passive: true });
    return () => el.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 opacity-40"
      aria-hidden
      style={{
        background: `radial-gradient(circle at ${position.x}% ${position.y}%, hsl(var(--primary) / 0.12) 0%, transparent 50%)`,
        transition: 'background 0.4s ease-out',
      }}
    />
  );
}
