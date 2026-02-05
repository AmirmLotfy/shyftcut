import { motion } from 'framer-motion';

/**
 * Organic morphing gradient blobs for hero background - 2026 style
 * On mobile: single blob, reduced animation for better performance.
 */
export function HeroBlobs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Large primary blob - morphing; slower on mobile for perf */}
      <motion.div
        className="absolute left-[5%] top-[10%] h-[200px] w-[200px] md:h-[420px] md:w-[420px] sm:h-[280px] sm:w-[280px]"
        animate={{
          borderRadius: [
            '60% 40% 30% 70% / 60% 30% 70% 40%',
            '30% 60% 70% 40% / 50% 60% 30% 60%',
            '60% 40% 30% 70% / 60% 30% 70% 40%',
          ],
          x: [0, 15, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.25) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      {/* Accent blob - hidden on small mobile for perf */}
      <motion.div
        className="absolute right-[0%] top-[35%] hidden h-[280px] w-[280px] sm:block md:h-[360px] md:w-[360px]"
        animate={{
          borderRadius: [
            '40% 60% 60% 40% / 70% 30% 70% 30%',
            '60% 40% 40% 60% / 30% 70% 30% 70%',
            '40% 60% 60% 40% / 70% 30% 70% 30%',
          ],
          x: [0, -10, 0],
          y: [0, 15, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: 'radial-gradient(circle, hsl(var(--accent) / 0.2) 0%, transparent 70%)',
          filter: 'blur(70px)',
        }}
      />
      {/* Secondary glow - bottom; hidden on small mobile */}
      <motion.div
        className="absolute bottom-[5%] left-[25%] hidden h-[200px] w-[200px] sm:block md:h-[260px] md:w-[260px]"
        animate={{
          borderRadius: [
            '50% 50% 30% 70% / 50% 50% 50% 50%',
            '70% 30% 50% 50% / 30% 70% 50% 50%',
            '50% 50% 30% 70% / 50% 50% 50% 50%',
          ],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary-glow) / 0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
    </div>
  );
}
