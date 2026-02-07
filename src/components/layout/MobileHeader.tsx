import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { IconMenu } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { MobileNavSheet } from '@/components/layout/MobileNavSheet';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { cn } from '@/lib/utils';
import { LOGO_PATH } from '@/lib/seo';

/**
 * Dedicated mobile header — minimal chrome (logo + menu), scroll-aware background.
 * Hides on scroll-down, shows on scroll-up. Renders only on viewports < 768px.
 */
export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const scrollDirection = useScrollDirection(12);
  const { pathname } = useLocation();

  const isHome = pathname === '/';
  const isOverHero = isHome && !scrolled;

  /* Hide header when scrolling down, show when scrolling up */
  const hideOnScroll = scrollDirection === 'down' && scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const rightActionsClass = cn(
    'min-touch',
    isOverHero ? 'text-foreground/90 hover:bg-white/10 hover:text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
  );

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        'pt-[env(safe-area-inset-top)]',
        'min-h-[3.5rem]',
        hideOnScroll ? '-translate-y-full' : 'translate-y-0',
        isOverHero
          ? 'border-transparent bg-transparent backdrop-blur-0'
          : 'border-b border-border/60 bg-background/95 shadow-sm backdrop-blur-xl dark:shadow-black/10'
      )}
    >
      <nav className="container relative mx-auto flex h-14 min-h-[3.5rem] flex-nowrap items-center justify-between gap-3 px-4">
        <Link
          to="/"
          className="flex min-w-0 shrink-0 items-center gap-2"
          data-testid="nav-link-home"
        >
          <img
            src={LOGO_PATH}
            alt="Shyftcut"
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 object-contain"
            fetchPriority="high"
            decoding="async"
          />
          <span className="truncate text-base font-bold gradient-text sm:text-lg">Shyftcut</span>
        </Link>

        <MobileNavSheet
          open={isOpen}
          onOpenChange={setIsOpen}
          trigger={
            <Button
              variant="ghost"
              size="icon"
              className={cn('min-touch h-10 w-10 rounded-xl', rightActionsClass)}
              aria-label="Menu"
            >
              <IconMenu className="h-5 w-5" />
            </Button>
          }
        />
      </nav>
    </header>
  );
}
