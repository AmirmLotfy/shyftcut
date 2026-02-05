import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import type { LucideIcon } from 'lucide-react';

interface WizardStepProps {
  children: ReactNode;
  isActive: boolean;
  direction: 'forward' | 'backward';
}

export function WizardStep({ children, isActive, direction }: WizardStepProps) {
  const variants = {
    enter: (dir: string) => ({
      x: dir === 'forward' ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: string) => ({
      x: dir === 'forward' ? -100 : 100,
      opacity: 0,
    }),
  };

  return (
    <AnimatePresence mode="wait" custom={direction}>
      {isActive && (
        <motion.div
          key="step"
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="w-full"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
  stepIcons?: LucideIcon[];
}

export function StepIndicator({ currentStep, totalSteps, labels = [], stepIcons }: StepIndicatorProps) {
  const progressPercent = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;
  const currentLabel = labels[currentStep] ?? '';

  return (
    <>
      {/* Mobile: pill stepper + progress bar */}
      <div className="mb-6 md:hidden space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-muted-foreground">
            {currentStep + 1} {labels.length ? `of ${totalSteps}` : ''}
            {currentLabel ? ` · ${currentLabel}` : ''}
          </span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>

      {/* Desktop: vertical step rail */}
      <nav
        className="hidden md:flex flex-col w-44 shrink-0"
        aria-label="Progress"
      >
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const Icon = stepIcons?.[index];

          return (
            <div key={index} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  role="step"
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={labels[index] ? `Step ${index + 1}: ${labels[index]}` : `Step ${index + 1}`}
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all duration-300',
                    isActive && 'border-primary bg-primary text-primary-foreground',
                    isCompleted && 'border-primary bg-primary/20 text-primary',
                    !isActive && !isCompleted && 'border-muted-foreground/30 text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : Icon ? (
                    <Icon className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < totalSteps - 1 && (
                  <div
                    className={cn(
                      'my-1 w-0.5 h-6 transition-colors',
                      isCompleted ? 'bg-primary' : 'bg-muted-foreground/30'
                    )}
                  />
                )}
              </div>
              {labels[index] && (
                <span
                  className={cn(
                    'pt-1.5 text-xs font-medium transition-colors',
                    isActive && 'text-primary font-semibold',
                    !isActive && 'text-muted-foreground'
                  )}
                >
                  {labels[index]}
                </span>
              )}
            </div>
          );
        })}
      </nav>
    </>
  );
}
