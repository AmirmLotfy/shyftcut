import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { isAppPath } from './AppHeader';
import { AppShell } from './AppShell';
import { Footer } from './Footer';
import { OnboardingHeader } from './OnboardingHeader';
import { CookieConsent } from '@/components/common/CookieConsent';
import { InstallPrompt } from '@/components/common/InstallPrompt';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

export function Layout({ children, hideFooter = false }: LayoutProps) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const isHome = pathname === '/';
  const appPath = isAppPath(pathname);
  const isOnboarding = pathname === '/wizard';

  // Onboarding: slim header with back + logo, no footer/bottom nav
  if (isOnboarding) {
    return (
      <div className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-clip">
        <OnboardingHeader />
        <main className="min-h-screen min-w-0 max-w-full flex-1 overflow-x-clip">{children}</main>
        <CookieConsent />
        <InstallPrompt />
      </div>
    );
  }

  // App routes: sidebar (desktop) + bottom nav (mobile) via AppShell
  if (appPath) {
    return <AppShell hideFooter={hideFooter}>{children}</AppShell>;
  }

  // Public routes: header + main + footer (overflow containment for RTL mobile)
  return (
    <div className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-clip">
      <Header />
      <main className={cn('min-w-0 max-w-full flex-1 overflow-x-clip', isHome ? 'pt-0' : 'pt-24 md:pt-14')}>{children}</main>
      {!hideFooter && <Footer />}
      <CookieConsent />
      <InstallPrompt />
    </div>
  );
}