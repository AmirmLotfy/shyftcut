import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';

export interface UserBadge {
  badge_id: string;
  earned_at: string;
  name: string;
  description: string | null;
}

export function useUserBadges() {
  const { user, getAccessToken } = useAuth();

  const { data: badges = [], isLoading, error } = useQuery({
    queryKey: ['user-badges', user?.id],
    queryFn: async (): Promise<UserBadge[]> => {
      if (!user) return [];
      const token = await getAccessToken();
      return apiFetch<UserBadge[]>('/api/community/me/badges', { token }) ?? [];
    },
    enabled: !!user,
  });

  return { badges, isLoading, error };
}
