import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, Clock, MessageSquare, User, MoreHorizontal } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { prefetchRoute } from '@/lib/route-prefetch';
import { dashboardPaths } from '@/lib/dashboard-routes';
import { AppMoreSheet } from './AppMoreSheet';

const navItems = [
  { href: dashboardPaths.index, icon: LayoutDashboard, labelKey: { en: 'Dashboard', ar: 'لوحة التحكم' } },
  { href: dashboardPaths.roadmap, icon: Map, labelKey: { en: 'Roadmap', ar: 'خريطة الطريق' } },
  { href: dashboardPaths.study, icon: Clock, labelKey: { en: 'Focus', ar: 'تركيز' } },
  { href: dashboardPaths.chat, icon: MessageSquare, labelKey: { en: 'AI Coach', ar: 'المدرب' } },
  { href: dashboardPaths.profile, icon: User, labelKey: { en: 'Profile', ar: 'الملف' } },
];

export function BottomNav() {
  const location = useLocation();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === dashboardPaths.index) return location.pathname === dashboardPaths.index;
    return location.pathname.startsWith(href);
  };

  return (
    <>
      <nav
        className="fixed bottom-0 inset-x-0 z-40 flex flex-row items-stretch justify-center border-t border-border/60 bg-background/95 backdrop-blur-xl rtl:flex-row-reverse"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))', paddingTop: '0.5rem' }}
        aria-label="Main navigation"
      >
        <div className="flex w-full max-w-lg flex-row items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={user ? item.href : '/signup'}
                onMouseEnter={() => user && prefetchRoute(item.href)}
                onFocus={() => user && prefetchRoute(item.href)}
                className={cn(
                  'min-touch flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 transition-colors active:scale-[0.97] sm:min-h-0',
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full transition-colors sm:h-10 sm:w-10',
                    active && 'bg-primary/15'
                  )}
                >
                  <Icon className={cn('h-5 w-5 sm:h-6 sm:w-6', active && 'text-primary')} />
                </span>
                <span className="text-[11px] font-medium tabular-nums sm:text-xs">
                  {item.labelKey[language]}
                </span>
              </Link>
            );
          })}
            <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              'min-touch flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-muted-foreground transition-colors hover:text-foreground active:scale-[0.97] sm:min-h-0'
            )}
            aria-label={language === 'ar' ? 'المزيد' : 'More'}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full sm:h-10 sm:w-10">
              <MoreHorizontal className="h-5 w-5 sm:h-6 sm:w-6" />
            </span>
            <span className="text-[11px] font-medium sm:text-xs">{language === 'ar' ? 'المزيد' : 'More'}</span>
          </button>
        </div>
      </nav>
      <AppMoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
    </>
  );
}
