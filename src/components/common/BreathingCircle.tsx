import { cn } from '@/lib/utils';

interface BreathingCircleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10 md:h-12 md:w-12',
  lg: 'h-16 w-20 md:h-20 md:w-20',
};

export function BreathingCircle({ className, size = 'md' }: BreathingCircleProps) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center shrink-0',
        sizeMap[size],
        className
      )}
      aria-hidden
    >
      <div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 shadow-lg shadow-purple-500/30"
        style={{ animation: 'breathing 3s ease-in-out infinite' }}
      />
      <div
        className="absolute inset-[15%] rounded-full bg-gradient-to-br from-white/40 to-transparent"
        style={{ animation: 'breathing 3s ease-in-out infinite 0.4s' }}
      />
    </div>
  );
}
