/**
 * Framer Motion animation variants - 2026 design system
 * Use for scroll-triggered, stagger, and micro-interactions
 */

import type { Variants } from 'framer-motion';

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const fadeInUpSlow: Variants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
};

export const slideInFromLeft: Variants = {
  initial: { opacity: 0, x: -24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
};

export const slideInFromRight: Variants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 16 },
};

export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

export const staggerContainerSlow: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

/** For bento cards / list items - stagger with longer delay */
export const staggerChildren: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

/** Blur-in text reveal */
export const blurIn: Variants = {
  initial: { opacity: 0, filter: 'blur(8px)' },
  animate: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(4px)' },
};

/** Parallax scroll - use with useScroll and useTransform */
export const parallaxVariants: Variants = {
  initial: { opacity: 0.6, y: 40 },
  animate: { opacity: 1, y: 0 },
};

/** Card hover tilt (use with whileHover) */
export const cardTilt = {
  rest: { rotateX: 0, rotateY: 0 },
  hover: { rotateX: 2, rotateY: 2, scale: 1.02 },
};

/** Transition presets */
export const tFast = { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] };
export const tNormal = { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] };
export const tSlow = { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] };
export const tSpring = { type: 'spring' as const, stiffness: 300, damping: 24 };
export const tSpringSoft = { type: 'spring' as const, stiffness: 200, damping: 20 };
