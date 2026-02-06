import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { debugError } from '@/lib/debug';
import { captureException } from '@/lib/error-tracking';

export function useRoadmap(roadmapId?: string) {
  const { user, session, getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: roadmaps, isLoading: isLoadingAll, isError: isErrorRoadmaps, error: errorRoadmaps } = useQuery({
    queryKey: ['roadmaps', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const token = await getAccessToken();
      return apiFetch<unknown[]>('/api/roadmaps', { token });
    },
    enabled: !!user && !!session,
  });

  const { data: activeRoadmap, isLoading: isLoadingActive, isError: isErrorActive, error: errorActive } = useQuery({
    queryKey: ['activeRoadmap', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const token = await getAccessToken();
      const data = await apiFetch<unknown | null>('/api/roadmap/active', { token });
      return data;
    },
    enabled: !!user && !!session,
  });

  const { data: roadmap, isLoading: isLoadingSingle, isError: isErrorSingle, error: errorSingle } = useQuery({
    queryKey: ['roadmap', roadmapId],
    queryFn: async () => {
      if (!roadmapId) return null;
      const token = await getAccessToken();
      const data = await apiFetch<unknown>(`/api/roadmap?id=${encodeURIComponent(roadmapId)}`, { token });
      return data;
    },
    enabled: !!roadmapId && !!user && !!session,
  });

  const completeWeek = useMutation({
    mutationFn: async (weekId: string) => {
      const token = await getAccessToken();
      await apiFetch('/api/roadmap/weeks/complete', {
        method: 'POST',
        token,
        body: JSON.stringify({ weekId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap'] });
      queryClient.invalidateQueries({ queryKey: ['activeRoadmap'] });
      queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
      queryClient.invalidateQueries({ queryKey: ['study-streak'] });
    },
    onError: (error) => {
      debugError('useRoadmap', 'completeWeek failed', error);
      captureException(error);
    },
  });

  const updateRoadmap = useMutation({
    mutationFn: async ({
      roadmapId: rid,
      payload,
    }: {
      roadmapId: string;
      payload: { title?: string; description?: string; status?: 'active' | 'inactive' | 'archived' };
    }) => {
      const token = await getAccessToken();
      return apiFetch<unknown>(`/api/roadmap?id=${encodeURIComponent(rid)}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (_, { roadmapId: rid }) => {
      queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
      queryClient.invalidateQueries({ queryKey: ['activeRoadmap'] });
      queryClient.invalidateQueries({ queryKey: ['roadmap', rid] });
      if (roadmapId) queryClient.invalidateQueries({ queryKey: ['roadmap', roadmapId] });
    },
    onError: (error) => {
      debugError('useRoadmap', 'updateRoadmap failed', error);
      captureException(error);
    },
  });

  const deleteRoadmap = useMutation({
    mutationFn: async (rid: string) => {
      const token = await getAccessToken();
      await apiFetch(`/api/roadmap?id=${encodeURIComponent(rid)}`, {
        method: 'DELETE',
        token,
      });
    },
    onSuccess: (_, rid) => {
      queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
      queryClient.invalidateQueries({ queryKey: ['activeRoadmap'] });
      queryClient.invalidateQueries({ queryKey: ['roadmap', rid] });
      queryClient.invalidateQueries({ queryKey: ['usage-limits'] });
      if (roadmapId === rid) queryClient.invalidateQueries({ queryKey: ['roadmap', roadmapId] });
    },
    onError: (error) => {
      debugError('useRoadmap', 'deleteRoadmap failed', error);
      captureException(error);
    },
  });

  const isError = isErrorRoadmaps || isErrorActive || isErrorSingle;
  const error = errorRoadmaps ?? errorActive ?? errorSingle;

  return {
    roadmaps: roadmaps ?? [],
    activeRoadmap: activeRoadmap ?? null,
    roadmap: roadmap ?? null,
    isLoading: isLoadingAll || isLoadingActive || isLoadingSingle,
    isError,
    error,
    completeWeek: completeWeek.mutate,
    isCompletingWeek: completeWeek.isPending,
    updateRoadmap: updateRoadmap.mutate,
    isUpdatingRoadmap: updateRoadmap.isPending,
    deleteRoadmap: deleteRoadmap.mutate,
    isDeletingRoadmap: deleteRoadmap.isPending,
  };
}
