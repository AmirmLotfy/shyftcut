import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { BottomNav } from './BottomNav';
import { CookieConsent } from '@/components/common/CookieConsent';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { InstallPrompt } from '@/components/common/InstallPrompt';
import { CreateRoadmapFAB } from '@/components/common/CreateRoadmapFAB';
import { ProfileLanguageSync } from '@/components/common/ProfileLanguageSync';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useStudyReminderBrowserNotification } from '@/hooks/useStudyReminderBrowserNotification';
import { cn } from '@/lib/utils';
import { LOGO_PATH } from '@/lib/seo';

interface AppShellProps {
  children: ReactNode;
  hideFooter?: boolean;
}

export function AppShell({ children, hideFooter = false }: AppShellProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  useStudyReminderBrowserNotification();
  const { pathname } = useLocation();
  const showCreateFAB =
    !isMobile &&
    !!user &&
    (pathname === '/dashboard' || pathname === '/roadmap' || pathname.startsWith('/roadmap/'));

  // Mobile: no sidebar, logo-only top bar, bottom nav with More sheet
  if (isMobile) {
    return (
      <div className="flex min-h-svh min-w-0 flex-col overflow-x-hidden">
        {user && <ProfileLanguageSync />}
        {/* Mobile top bar: logo + theme toggle, safe-area for notch */}
        <div
          className="flex min-h-14 shrink-0 items-center justify-between border-b border-border/60 bg-background/95 px-4 backdrop-blur-xl"
          style={{ paddingTop: 'max(0.875rem, env(safe-area-inset-top))' }}
        >
          <Link to="/dashboard" className="flex items-center gap-2">
            <img
              src={LOGO_PATH}
              alt="Shyftcut"
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 object-contain"
              decoding="async"
              fetchPriority="high"
            />
            <span className="text-base font-bold gradient-text">Shyftcut</span>
          </Link>
          <ThemeToggle />
        </div>
        <div className={cn('flex min-w-0 flex-1 flex-col overflow-x-hidden', user && 'pb-20')}>
          {children}
        </div>
        {user && <BottomNav />}
        <CookieConsent />
        <InstallPrompt />
      </div>
    );
  }

  // Desktop: sidebar + top bar with trigger
  return (
    <SidebarProvider>
      {user && <ProfileLanguageSync />}
      <AppSidebar />
      <SidebarInset>
        <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-background/95 px-4 backdrop-blur-xl">
          <div className="flex items-center gap-3 min-w-0">
            <SidebarTrigger aria-label="Toggle sidebar" className="h-8 w-8 shrink-0" />
            <Link to="/dashboard" className="flex items-center gap-2 min-w-0">
              <img
                src={LOGO_PATH}
                alt="Shyftcut"
                width={32}
                height={32}
                className="h-8 w-8 shrink-0 object-contain"
                decoding="async"
                fetchPriority="high"
              />
              <span className="text-base font-bold gradient-text truncate">Shyftcut</span>
            </Link>
          </div>
          <ThemeToggle />
        </div>
        <div className="relative flex min-w-0 flex-1 flex-col overflow-x-hidden">
          {/* Decorative shapes (reference: glassmorphism-sidebar) */}
          <div className="dashboard-shape-1" aria-hidden />
          <div className="dashboard-shape-2" aria-hidden />
          {children}
          {showCreateFAB && <CreateRoadmapFAB />}
        </div>
        <CookieConsent />
        <InstallPrompt />
      </SidebarInset>
    </SidebarProvider>
  );
}
