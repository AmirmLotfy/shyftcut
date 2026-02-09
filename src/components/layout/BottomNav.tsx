import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, Target, Menu } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { prefetchRoute } from '@/lib/route-prefetch';
import { dashboardPaths, studyPath } from '@/lib/dashboard-routes';
import { AppMoreSheet } from './AppMoreSheet';
import { IconAICoach } from '@/components/common/IconAICoach';

const leftNavItems = [
  { href: dashboardPaths.index, icon: LayoutDashboard, labelKey: { en: 'Dashboard', ar: 'لوحة التحكم' }, activeColor: 'from-blue-500/25 to-purple-500/25 text-blue-400' },
  { href: dashboardPaths.roadmap, icon: Map, labelKey: { en: 'Roadmap', ar: 'خريطة الطريق' }, activeColor: 'from-emerald-500/25 to-teal-500/25 text-emerald-400' },
];

const rightNavItems = [
  { href: dashboardPaths.study, icon: Target, labelKey: { en: 'Focus', ar: 'تركيز' }, activeColor: 'from-orange-500/25 to-amber-500/25 text-orange-400' },
];

const navBarStyles =
  'flex flex-row items-center justify-around rounded-[1.25rem] border border-white/10 dark:border-white/5 bg-background/70 dark:bg-background/60 backdrop-blur-2xl shadow-xl shadow-black/10 dark:shadow-black/30 px-2 py-2 min-h-[52px]';

export function BottomNav() {
  const location = useLocation();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const roadmapIdFromPath = location.pathname.startsWith(dashboardPaths.roadmap + '/')
    ? location.pathname.slice((dashboardPaths.roadmap + '/').length).split('/')[0]?.split('?')[0]
    : undefined;

  const getNavHref = (href: string) => {
    if (roadmapIdFromPath && href === dashboardPaths.study) return studyPath(roadmapIdFromPath);
    return href;
  };

  const isActive = (href: string) => {
    if (href === dashboardPaths.index) return location.pathname === dashboardPaths.index;
    return location.pathname.startsWith(href);
  };

  const renderNavItem = (
    item: { href: string; icon: React.ComponentType<{ className?: string }>; labelKey: { en: string; ar: string }; activeColor: string }
  ) => {
    const Icon = item.icon;
    const href = getNavHref(item.href);
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        to={user ? href : '/signup'}
        onMouseEnter={() => user && prefetchRoute(href)}
        onFocus={() => user && prefetchRoute(href)}
        className={cn(
          'min-touch flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-2 transition-all duration-200 active:scale-[0.96]',
          active ? `bg-gradient-to-r ${item.activeColor}` : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
        )}
        aria-current={active ? 'page' : undefined}
      >
        <Icon className={cn('h-5 w-5 shrink-0 transition-transform', active && 'scale-110')} />
        <span className="text-[10px] font-medium leading-tight">{item.labelKey[language]}</span>
      </Link>
    );
  };

  return (
    <>
      <div
        className="fixed bottom-0 inset-x-0 z-40 flex items-end justify-center pointer-events-none rtl:flex-row-reverse"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}
      >
        <nav
          className="flex w-full max-w-md items-end justify-center gap-0 pointer-events-auto rtl:flex-row-reverse"
          aria-label="Main navigation"
        >
          {/* Left segment */}
          <div className={cn('flex flex-1 rtl:flex-row-reverse', navBarStyles, 'rounded-r-none rtl:rounded-r-[1.25rem] rtl:rounded-l-none')}>
            {leftNavItems.map(renderNavItem)}
          </div>

          {/* Center: AI Coach – elevated, bigger icon, cutout */}
          <div className="relative flex flex-col items-center justify-end -mb-2 shrink-0">
            <Link
              to={user ? dashboardPaths.chat : '/signup'}
              onMouseEnter={() => user && prefetchRoute(dashboardPaths.chat)}
              onFocus={() => user && prefetchRoute(dashboardPaths.chat)}
              className={cn(
                'min-touch flex flex-col items-center justify-center gap-0.5 rounded-2xl px-4 py-2.5 transition-all duration-200 active:scale-[0.96] ring-4 ring-background dark:ring-background',
                isActive(dashboardPaths.chat)
                  ? 'bg-gradient-to-r from-pink-500/95 to-rose-500/95 dark:from-pink-600/95 dark:to-rose-600/95 text-pink-400 shadow-lg shadow-pink-500/20'
                  : 'bg-gradient-to-r from-pink-500/90 to-rose-500/90 dark:from-pink-600/90 dark:to-rose-600/90 text-muted-foreground hover:text-pink-400 hover:shadow-lg'
              )}
              aria-current={isActive(dashboardPaths.chat) ? 'page' : undefined}
            >
              <IconAICoach className={cn('h-8 w-8 shrink-0 transition-transform', isActive(dashboardPaths.chat) && 'scale-110')} />
              <span className="text-[10px] font-medium leading-tight">{language === 'ar' ? 'المدرب' : 'AI Coach'}</span>
            </Link>
          </div>

          {/* Right segment */}
          <div className={cn('flex flex-1 rtl:flex-row-reverse', navBarStyles, 'rounded-l-none rtl:rounded-l-[1.25rem] rtl:rounded-r-none')}>
            {rightNavItems.map(renderNavItem)}
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className="min-touch flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-2 text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-muted/40 active:scale-[0.96]"
              aria-label={language === 'ar' ? 'المزيد' : 'More'}
            >
              <Menu className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-medium leading-tight">{language === 'ar' ? 'المزيد' : 'More'}</span>
            </button>
          </div>
        </nav>
      </div>
      <AppMoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
    </>
  );
}
