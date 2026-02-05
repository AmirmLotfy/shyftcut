import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LOGO_PATH } from '@/lib/seo';
import { cn } from '@/lib/utils';

/**
 * Slim top bar for onboarding (Wizard) — Back arrow + Logo.
 * Back navigates to / (guest) or /dashboard (logged-in).
 */
export function OnboardingHeader() {
  const { user } = useAuth();
  const backTo = user ? '/dashboard' : '/';

  return (
    <header
      className={cn(
        'flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border/60 bg-background/95 px-4 backdrop-blur-xl',
        'pt-[env(safe-area-inset-top)]'
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="min-touch h-10 w-10 shrink-0"
        asChild
        aria-label={user ? 'Back to Dashboard' : 'Back to Home'}
      >
        <Link to={backTo} replace>
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </Button>
      <div className="flex flex-1 items-center justify-center">
        <img
          src={LOGO_PATH}
          alt="Shyftcut"
          width={32}
          height={32}
          className="h-8 w-8 shrink-0 object-contain"
          decoding="async"
          aria-hidden
        />
      </div>
      <div className="w-10 shrink-0" aria-hidden />
    </header>
  );
}
