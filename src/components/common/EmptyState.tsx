import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** Shared empty state for app pages: icon, title, description, optional CTA. */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'public-glass-card flex flex-col items-center justify-center rounded-2xl px-6 py-12 text-center sm:px-10 sm:py-16',
        className
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/80 text-muted-foreground">
        {icon}
      </div>
      <h2 className="mb-2 text-xl font-semibold">{title}</h2>
      {description && <p className="mb-6 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}
