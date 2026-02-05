import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';

export interface Note {
  id: string;
  user_id: string;
  roadmap_week_id: string | null;
  course_recommendation_id: string | null;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function useNotes(roadmapWeekId: string | undefined) {
  const { user, session, getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['notes', user?.id, roadmapWeekId ?? 'all'];

  const { data: notes = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];
      const token = await getAccessToken();
      const url = roadmapWeekId
        ? `/api/notes?roadmap_week_id=${encodeURIComponent(roadmapWeekId)}`
        : '/api/notes';
      return apiFetch<Note[]>(url, { token });
    },
    enabled: !!user && !!session,
  });

  const createNote = useMutation({
    mutationFn: async (payload: { title: string; content?: string; roadmap_week_id?: string; course_recommendation_id?: string }) => {
      const token = await getAccessToken();
      return apiFetch<Note>('/api/notes', {
        method: 'POST',
        token,
        body: JSON.stringify({
          title: payload.title,
          content: payload.content ?? '',
          roadmap_week_id: payload.roadmap_week_id ?? null,
          course_recommendation_id: payload.course_recommendation_id ?? null,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; title?: string; content?: string }) => {
      const token = await getAccessToken();
      return apiFetch<Note>(`/api/notes/${id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const token = await getAccessToken();
      await apiFetch(`/api/notes/${id}`, { method: 'DELETE', token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return { notes, isLoading, createNote, updateNote, deleteNote };
}
