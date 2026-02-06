import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  IconList,
  IconUser,
  IconSignOut,
  IconMapTrifold,
  IconBookOpen,
  IconMessageSquare,
  IconUserCircle,
  IconCaretDown,
  IconHouse,
  IconGlobe,
} from '@/lib/icons';
import { LOGO_PATH } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { dashboardPaths } from '@/lib/dashboard-routes';

/** Paths that use the app layout. All app routes live under /dashboard. */
export { isDashboardPath as isAppPath } from '@/lib/dashboard-routes';

export function AppHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const { t, direction } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const appNavItems = [
    { label: t('nav.dashboard'), href: dashboardPaths.index, icon: IconMapTrifold },
    { label: t('nav.roadmap'), href: dashboardPaths.roadmap, icon: IconMapTrifold },
    { label: t('nav.courses'), href: dashboardPaths.courses, icon: IconBookOpen },
    { label: t('nav.chat'), href: dashboardPaths.chat, icon: IconMessageSquare },
  ];

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    navigate('/');
  };

  const handleNavClick = () => setIsOpen(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-border/60 bg-background/95 shadow-sm backdrop-blur-xl dark:shadow-black/10">
      <nav className="container relative mx-auto flex h-14 items-center justify-between gap-4 px-4 md:px-6">
        <Link
          to={dashboardPaths.index}
          className="flex shrink-0 items-center gap-2"
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
          <span className="text-lg font-bold gradient-text">Shyftcut</span>
        </Link>

        {/* Desktop: app nav + Home link */}
        <div className="hidden items-center gap-0.5 md:flex">
          {appNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              data-testid={item.href === dashboardPaths.index ? 'nav-link-dashboard' : undefined}
              className="min-touch rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/"
            className="min-touch flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <IconHouse className="h-4 w-4" />
            {t('nav.home')}
          </Link>
        </div>

        {/* Right: theme, language, user menu */}
        <div className="flex items-center gap-0.5">
          <ThemeToggle />
          <LanguageToggleButton />
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden gap-1.5 sm:flex"
                  data-testid="user-menu-trigger"
                >
                  <IconUser className="h-4 w-4" />
                  <span className="hidden max-w-[100px] truncate sm:inline">
                    {user.user_metadata?.display_name ?? user.email?.split('@')[0]}
                  </span>
                  <IconCaretDown className="h-3.5 w-3.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={direction === 'rtl' ? 'start' : 'end'}>
                <DropdownMenuItem asChild>
                  <Link to={dashboardPaths.profile} className="flex items-center gap-2">
                    <IconUser className="h-4 w-4" />
                    {t('nav.profile')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-destructive"
                  data-testid="logout-button"
                >
                  <IconSignOut className="h-4 w-4" />
                  {t('nav.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="min-touch h-8 w-8 md:hidden" aria-label="Menu">
                <IconList className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-8 pt-4">
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted" />
              <SheetHeader className="mb-6 text-start">
                <SheetTitle className="flex items-center gap-2">
                  <img
                    src={LOGO_PATH}
                    alt="Shyftcut"
                    width={32}
                    height={32}
                    className="h-8 w-8 shrink-0 object-contain"
                    decoding="async"
                  />
                  <span className="gradient-text">Shyftcut</span>
                </SheetTitle>
              </SheetHeader>
              <div className="grid gap-1">
                {appNavItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={handleNavClick}
                    className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium transition-colors hover:bg-muted active:bg-muted/80"
                  >
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    {item.label}
                  </Link>
                ))}
                <Link
                  to="/"
                  onClick={handleNavClick}
                  className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium transition-colors hover:bg-muted active:bg-muted/80"
                >
                  <IconHouse className="h-5 w-5 text-muted-foreground" />
                  {t('nav.home')}
                </Link>
              </div>
              {user && (
                <div className="mt-4 border-t border-border pt-4">
                  <div className="grid gap-1">
                    <Link
                      to={dashboardPaths.profile}
                      onClick={handleNavClick}
                      className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium transition-colors hover:bg-muted active:bg-muted/80"
                    >
                      <IconUserCircle className="h-5 w-5 text-muted-foreground" />
                      {t('nav.profile')}
                    </Link>
                    <button
                      onClick={handleSignOut}
                      data-testid="logout-button"
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium text-destructive transition-colors hover:bg-destructive/10 active:bg-destructive/20"
                    >
                      <IconSignOut className="h-5 w-5" />
                      {t('nav.logout')}
                    </button>
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}

function LanguageToggleButton() {
  const { language, setLanguage } = useLanguage();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
      className="min-touch h-8 w-8"
      aria-label="Toggle language"
    >
      <IconGlobe className="h-4 w-4" />
    </Button>
  );
}
