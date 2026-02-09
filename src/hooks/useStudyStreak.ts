import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';

export interface StudyStreakData {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  activity_dates: string[];
}

export function useStudyStreak() {
  const { user, session, getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['study-streak', user?.id],
    queryFn: async (): Promise<StudyStreakData> => {
      if (!user) return { current_streak: 0, longest_streak: 0, last_activity_date: null, activity_dates: [] };
      const token = await getAccessToken();
      const res = await apiFetch<StudyStreakData>('/api/study-streak', { token });
      return res ?? { current_streak: 0, longest_streak: 0, last_activity_date: null, activity_dates: [] };
    },
    enabled: !!user && !!session,
    staleTime: 2 * 60 * 1000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['study-streak', user?.id] });

  return {
    streak: data ?? { current_streak: 0, longest_streak: 0, last_activity_date: null, activity_dates: [] },
    isLoading,
    error,
    invalidate,
  };
}
