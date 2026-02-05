import { Link, useNavigate } from 'react-router-dom';
import {
  IconGlobe,
  IconUser,
  IconSignOut,
  IconHouse,
  IconCreditCard,
  IconSparkle,
  IconMapTrifold,
} from '@/lib/icons';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getUpgradePath } from '@/lib/upgrade-link';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LOGO_PATH } from '@/lib/seo';

interface MobileNavSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
}

/**
 * Bottom sheet nav for mobile — auth, nav links, theme, language.
 * Shared by Header (mobile menu).
 */
export function MobileNavSheet({ open, onOpenChange, trigger }: MobileNavSheetProps) {
  const { language, setLanguage, t } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { label: t('nav.home'), href: '/', icon: IconHouse },
    { label: user ? t('nav.upgrade') : t('nav.pricing'), href: getUpgradePath(user), icon: IconCreditCard },
    { label: t('nav.blog'), href: '/blog', icon: IconSparkle },
  ];

  const handleSignOut = async () => {
    await signOut();
    onOpenChange(false);
    navigate('/');
  };

  const handleNavClick = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="bottom"
        className="flex max-h-[88dvh] flex-col rounded-t-3xl border-t border-border/80 bg-background px-0 pb-0 pt-0 shadow-2xl [&>button]:hidden"
      >
        <div className="shrink-0 border-b border-border/50 bg-muted/20 px-4 pb-4 pt-5 rtl:px-4">
          <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
          <SheetHeader className="text-start">
            <SheetTitle className="flex items-center gap-3">
              <img src={LOGO_PATH} alt="Shyftcut" width={36} height={36} className="h-9 w-9 shrink-0 object-contain" decoding="async" />
              <span className="gradient-text text-xl font-bold">Shyftcut</span>
            </SheetTitle>
          </SheetHeader>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
          {!user && (
            <div className="mb-2 flex flex-col gap-2">
              <Button size="lg" asChild className="min-touch w-full rounded-xl py-6 text-base font-semibold" onClick={handleNavClick}>
                <Link to="/signup" data-testid="nav-link-signup">{t('nav.signup')}</Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="min-touch w-full rounded-xl" onClick={handleNavClick}>
                <Link to="/login" data-testid="nav-link-login">{t('nav.login')}</Link>
              </Button>
            </div>
          )}

          <nav className="grid gap-0.5 py-2" aria-label="Main">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={handleNavClick}
                className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] font-medium transition-colors hover:bg-muted/80 active:bg-muted"
              >
                <item.icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {user && (
            <>
              <div className="my-1 h-px bg-border/60" />
              <Link to="/dashboard" onClick={handleNavClick} className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] font-medium transition-colors hover:bg-muted/80 active:bg-muted" data-testid="nav-link-dashboard">
                <IconMapTrifold className="h-5 w-5 shrink-0 text-muted-foreground" />
                {t('nav.dashboard')}
              </Link>
              <Link to="/profile" onClick={handleNavClick} className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] font-medium transition-colors hover:bg-muted/80 active:bg-muted">
                <IconUser className="h-5 w-5 shrink-0 text-muted-foreground" />
                {t('nav.profile')}
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-start text-[15px] font-medium text-destructive transition-colors hover:bg-destructive/10 active:bg-destructive/20"
                data-testid="logout-button"
              >
                <IconSignOut className="h-5 w-5 shrink-0" />
                {t('nav.logout')}
              </button>
            </>
          )}

          <div className="mt-4 flex justify-center py-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-medium text-muted-foreground">
              <img src="https://cdn.simpleicons.org/googlegemini" alt="" width={14} height={14} className="h-3.5 w-3.5 shrink-0 object-contain" aria-hidden />
              {t('landing.poweredBy')}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-3">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              data-testid="lang-toggle"
              className="min-touch flex-1 justify-start gap-2 text-sm"
              aria-label="Toggle language"
            >
              <IconGlobe className="h-4 w-4 shrink-0" />
              {language === 'ar' ? t('common.english') : t('common.arabic')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
