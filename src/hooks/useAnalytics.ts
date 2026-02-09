import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';

export interface Analytics {
  roadmapsCreated: number;
  chatMessagesThisMonth: number;
  quizzesTaken: number;
  averageQuizScore: number | null;
  lastQuizAt: string | null;
  lastActiveAt: string | null;
}

export function useAnalytics() {
  const { user, session, getAccessToken } = useAuth();

  const { data: analytics, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['analytics', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const token = await getAccessToken();
      return apiFetch<Analytics>('/api/analytics', { token });
    },
    enabled: !!user && !!session,
    staleTime: 2 * 60 * 1000,
  });

  return {
    analytics: analytics ?? null,
    isLoading,
    isError,
    error,
    refetch,
  };
}
