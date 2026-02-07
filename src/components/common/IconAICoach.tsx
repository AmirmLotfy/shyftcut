import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

interface IconAICoachProps {
  className?: string;
}

/** Custom AI Coach icon - gradient orb with subtle inner glow, no star/sparkle. */
export const IconAICoach = forwardRef<SVGSVGElement, IconAICoachProps>(
  ({ className, ...props }, ref) => {
    const id = useId().replace(/:/g, '-');
    return (
      <svg
        ref={ref}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('h-5 w-5 shrink-0', className)}
        aria-hidden
        {...props}
      >
        <defs>
          <linearGradient id={`ai-coach-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(330, 80%, 60%)" />
            <stop offset="50%" stopColor="hsl(270, 80%, 60%)" />
            <stop offset="100%" stopColor="hsl(240, 80%, 55%)" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="9" fill={`url(#ai-coach-grad-${id})`} opacity="0.9" />
        <circle cx="12" cy="12" r="5" fill="white" fillOpacity="0.35" />
      </svg>
    );
  }
);
IconAICoach.displayName = 'IconAICoach';
