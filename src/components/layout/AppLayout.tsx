import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AppShell } from './AppShell';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardPrefetch } from '@/hooks/useDashboardPrefetch';

/** Skeleton shown in content area while a nested app route is loading. Keeps shell visible. */
function AppPageSkeleton() {
  return (
    <div className="container mx-auto max-w-app-content px-4 py-8">
      <Skeleton className="mb-6 h-9 w-64" />
      <Skeleton className="mb-6 h-5 w-72" />
      <Skeleton className="mb-6 h-24 w-full rounded-xl" />
      <div className="mb-8 grid gap-3 grid-cols-1 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Layout route for app pages. Keeps AppShell (sidebar, top bar) mounted; only outlet content swaps. */
export function AppLayout() {
  useDashboardPrefetch();
  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AppShell>
        <Suspense fallback={<AppPageSkeleton />}>
          <Outlet />
        </Suspense>
      </AppShell>
    </>
  );
}
