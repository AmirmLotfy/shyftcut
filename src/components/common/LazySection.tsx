import { useState, useRef, useEffect } from 'react';

/**
 * Renders children only when the section enters the viewport.
 * Reduces initial payload and improves LCP/INP on heavy landing sections.
 */
export function LazySection({
  children,
  className,
  rootMargin = '100px',
  fallback = null,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  rootMargin?: string;
  fallback?: React.ReactNode;
  id?: string;
}) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
        }
      },
      { rootMargin, threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} id={id} className={className}>
      {inView ? children : fallback}
    </div>
  );
}
