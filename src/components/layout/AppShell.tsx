import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
import { useProfile } from '@/hooks/useProfile';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { IconSignOut } from '@/lib/icons';
import { useIsMobile } from '@/hooks/use-mobile';
import { useStudyReminderBrowserNotification } from '@/hooks/useStudyReminderBrowserNotification';
import { cn } from '@/lib/utils';
import { LOGO_PATH } from '@/lib/seo';
import { dashboardPaths, isDashboardPath } from '@/lib/dashboard-routes';

interface AppShellProps {
  children: ReactNode;
  hideFooter?: boolean;
}

export function AppShell({ children, hideFooter = false }: AppShellProps) {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  const isMobile = useIsMobile();
  useStudyReminderBrowserNotification();
  const { pathname } = useLocation();
  const showCreateFAB =
    !isMobile &&
    !!user &&
    (pathname === dashboardPaths.index || pathname === dashboardPaths.roadmap || pathname.startsWith(`${dashboardPaths.roadmap}/`));

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
          <Link to={dashboardPaths.index} className="flex items-center gap-2">
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
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {user && (
              <>
                <span className="mx-1 h-5 w-px bg-border" aria-hidden />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to={dashboardPaths.profile}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground min-touch"
                      data-testid="nav-link-profile"
                    >
                      <Avatar className="h-7 w-7 shrink-0 ring-1 ring-border/50">
                        {(profile as { avatar_url?: string })?.avatar_url ? (
                          <AvatarImage src={(profile as { avatar_url?: string }).avatar_url} alt="" />
                        ) : null}
                        <AvatarFallback className="text-xs font-medium">
                          {(user.user_metadata?.display_name ?? user.email ?? 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{t('nav.profile')}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSignOut}
                      className="h-9 w-9 text-muted-foreground hover:text-destructive"
                      data-testid="logout-button"
                      aria-label={t('nav.logout')}
                    >
                      <IconSignOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{t('nav.logout')}</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
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

  // Desktop: sidebar (has logo + toggle) + minimal top bar (theme toggle only)
  return (
    <SidebarProvider>
      {user && <ProfileLanguageSync />}
      <AppSidebar />
      <SidebarInset>
        <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/40 bg-background/80 px-4 backdrop-blur-xl">
          <SidebarTrigger aria-label="Toggle sidebar" className="h-9 w-9 rounded-lg hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors -ml-1" />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {user && (
              <>
                <span className="mx-1 h-5 w-px bg-border" aria-hidden />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to={dashboardPaths.profile}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground min-touch"
                      data-testid="nav-link-profile"
                    >
                      <Avatar className="h-8 w-8 shrink-0 ring-1 ring-border/50">
                        {(profile as { avatar_url?: string })?.avatar_url ? (
                          <AvatarImage src={(profile as { avatar_url?: string }).avatar_url} alt="" />
                        ) : null}
                        <AvatarFallback className="text-xs font-medium">
                          {(user.user_metadata?.display_name ?? user.email ?? 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden max-w-[90px] truncate sm:inline md:max-w-[120px]">
                        {user.user_metadata?.display_name ?? user.email?.split('@')[0]}
                      </span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{t('nav.profile')}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSignOut}
                      className="h-9 w-9 text-muted-foreground hover:text-destructive"
                      data-testid="logout-button"
                      aria-label={t('nav.logout')}
                    >
                      <IconSignOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{t('nav.logout')}</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
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
