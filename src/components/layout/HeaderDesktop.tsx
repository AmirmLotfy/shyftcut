import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  IconGlobe,
  IconUser,
  IconSignOut,
  IconHouse,
  IconCreditCard,
  IconBookOpen,
  IconMapTrifold,
} from '@/lib/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardPaths } from '@/lib/dashboard-routes';
import { getUpgradePath } from '@/lib/upgrade-link';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { cn } from '@/lib/utils';
import { LOGO_PATH } from '@/lib/seo';

/**
 * Desktop header — full nav links, theme, language, auth.
 * Renders only on viewports >= 768px.
 */
export function HeaderDesktop() {
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const { language, setLanguage, t, direction } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const isHome = pathname === '/';
  const isOverHero = isHome && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { label: t('nav.home'), href: '/', icon: IconHouse },
    { label: user ? (language === 'ar' ? 'ترقية' : 'Upgrade') : t('nav.pricing'), href: getUpgradePath(user), icon: IconCreditCard },
    { label: t('nav.blog'), href: '/blog', icon: IconBookOpen },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

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
        isOverHero
          ? 'border-transparent bg-transparent backdrop-blur-0'
          : 'border-b border-border/60 bg-background/95 shadow-sm backdrop-blur-xl dark:shadow-black/10'
      )}
    >
      <nav className="container relative mx-auto flex h-14 min-h-[3.5rem] items-center justify-between gap-4 px-4 md:flex-row md:px-6">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2.5"
          data-testid="nav-link-home"
        >
          <img
            src={LOGO_PATH}
            alt="Shyftcut"
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 object-contain transition-all"
            fetchPriority="high"
            decoding="async"
          />
          <span className="text-lg font-bold gradient-text">Shyftcut</span>
        </Link>

        <div className="flex items-center gap-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              data-testid={item.href === '/' ? 'nav-link-home' : undefined}
              className={cn(
                'min-touch rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isOverHero
                  ? 'text-foreground/90 hover:bg-white/10 hover:text-foreground'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-0.5">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} className={rightActionsClass} aria-label="Toggle language" data-testid="lang-toggle">
            <IconGlobe className="h-4 w-4" />
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className={cn('gap-1.5', rightActionsClass)} data-testid="user-menu-trigger">
                  <IconUser className="h-4 w-4" />
                  <span className="max-w-[100px] truncate">{user.user_metadata?.display_name ?? user.email?.split('@')[0]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={direction === 'rtl' ? 'start' : 'end'}>
                <DropdownMenuItem asChild>
                  <Link to={dashboardPaths.index} className="flex items-center gap-2" data-testid="nav-link-dashboard">
                    <IconMapTrifold className="h-4 w-4" />
                    {t('nav.dashboard')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={dashboardPaths.profile} className="flex items-center gap-2">
                    <IconUser className="h-4 w-4" />
                    {t('nav.profile')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-destructive" data-testid="logout-button">
                  <IconSignOut className="h-4 w-4" />
                  {t('nav.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" asChild className={cn('text-sm', rightActionsClass)}>
                <Link to="/login" data-testid="nav-link-login">{t('nav.login')}</Link>
              </Button>
              <Button size="sm" asChild className="btn-glow rounded-lg px-4">
                <Link to="/signup" data-testid="nav-link-signup">{t('nav.signup')}</Link>
              </Button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
