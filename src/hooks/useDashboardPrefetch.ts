import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { isDashboardPath } from '@/lib/dashboard-routes';

/**
 * Prefetches dashboard-critical data when user enters any /dashboard/* route.
 * Runs while the lazy-loaded page chunk is loading, giving a head start on API calls.
 */
export function useDashboardPrefetch() {
  const queryClient = useQueryClient();
  const { pathname } = useLocation();
  const { user, session, getAccessToken } = useAuth();

  useEffect(() => {
    if (!isDashboardPath(pathname) || !user?.id || !session) return;

    const prefetch = async () => {
      const token = await getAccessToken();
      if (!token) return;

      const uid = user.id;

      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: ['roadmaps', uid],
          queryFn: () => apiFetch<unknown[]>('/api/roadmaps', { token }),
        }),
        queryClient.prefetchQuery({
          queryKey: ['activeRoadmap', uid],
          queryFn: () => apiFetch<unknown | null>('/api/roadmap/active', { token }),
        }),
        queryClient.prefetchQuery({
          queryKey: ['profile', uid],
          queryFn: () => apiFetch<unknown | null>('/api/profile', { token }),
        }),
        queryClient.prefetchQuery({
          queryKey: ['subscription', uid],
          queryFn: () => apiFetch<unknown | null>('/api/subscription', { token }),
        }),
        queryClient.prefetchQuery({
          queryKey: ['usage-limits', uid],
          queryFn: () =>
            apiFetch<{
              roadmapsCreated: number;
              chatMessagesThisMonth: number;
              quizzesTakenThisMonth?: number;
              notesCount?: number;
              tasksCount?: number;
              aiSuggestionsToday?: number;
            }>('/api/usage', { token }),
        }),
        queryClient.prefetchQuery({
          queryKey: ['study-streak', uid],
          queryFn: () =>
            apiFetch<{
              current_streak: number;
              longest_streak: number;
              last_activity_date: string | null;
              activity_dates: string[];
            }>('/api/study-streak', { token }),
        }),
        queryClient.prefetchQuery({
          queryKey: ['notification-preferences', uid],
          queryFn: () => apiFetch('/api/notification-preferences', { token }),
        }),
        queryClient.prefetchQuery({
          queryKey: ['analytics', uid],
          queryFn: () => apiFetch('/api/analytics', { token }),
        }),
      ]);
    };

    void prefetch();
  }, [pathname, user?.id, session, getAccessToken, queryClient]);
}
