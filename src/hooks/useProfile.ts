import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { debugError } from '@/lib/debug';
import { captureException } from '@/lib/error-tracking';

export function useProfile() {
  const { user, session, getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const token = await getAccessToken();
      return apiFetch<unknown | null>('/api/profile', { token });
    },
    enabled: !!user && !!session,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      if (!user) throw new Error('Not authenticated');
      const token = await getAccessToken();
      if (!token) throw new Error('Session expired. Please sign in again.');
      return apiFetch<unknown>('/api/profile', {
        method: 'PATCH',
        token,
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
    onError: (error) => {
      debugError('useProfile', 'updateProfile failed', error);
      captureException(error);
    },
  });

  return {
    profile: profile ?? null,
    isLoading,
    error,
    updateProfile: updateProfile.mutate,
    isUpdating: updateProfile.isPending,
  };
}
