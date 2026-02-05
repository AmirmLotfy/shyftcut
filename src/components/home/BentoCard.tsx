import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type BentoSize = 'large' | 'wide' | 'default';

interface BentoCardProps {
  size?: BentoSize;
  className?: string;
  children: ReactNode;
  delay?: number;
  /** Tailwind classes for md: grid placement (e.g. md:col-start-1 md:row-start-1 md:col-span-2 md:row-span-2) */
  placement?: string;
}

const sizeClasses: Record<BentoSize, string> = {
  large: 'md:col-span-2 md:row-span-2',
  wide: 'md:col-span-2 md:row-span-1',
  default: 'md:col-span-1 md:row-span-1',
};

export function BentoCard({ size = 'default', className, children, delay = 0, placement }: BentoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.35 }}
      className={cn(sizeClasses[size], placement, 'min-h-[160px]')}
    >
      <Card
        className={cn(
          'public-glass-card group h-full transition-all duration-300',
          'hover:-translate-y-0.5'
        )}
      >
        <CardContent className="flex h-full flex-col p-4 sm:p-5 md:p-6">
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}
