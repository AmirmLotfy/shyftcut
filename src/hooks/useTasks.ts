import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';

export interface Task {
  id: string;
  user_id: string;
  roadmap_week_id: string | null;
  course_recommendation_id: string | null;
  title: string;
  notes: string;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  source: 'user' | 'ai';
}

export function useTasks(roadmapWeekId: string | undefined) {
  const { user, session, getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['tasks', user?.id, roadmapWeekId ?? 'all'];

  const { data: tasks = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];
      const token = await getAccessToken();
      const url = roadmapWeekId
        ? `/api/tasks?roadmap_week_id=${encodeURIComponent(roadmapWeekId)}`
        : '/api/tasks';
      return apiFetch<Task[]>(url, { token });
    },
    enabled: !!user && !!session,
  });

  const createTask = useMutation({
    mutationFn: async (payload: {
      title: string;
      notes?: string;
      due_date?: string | null;
      roadmap_week_id?: string;
      course_recommendation_id?: string;
      source?: 'user' | 'ai';
    }) => {
      const token = await getAccessToken();
      return apiFetch<Task>('/api/tasks', {
        method: 'POST',
        token,
        body: JSON.stringify({
          title: payload.title,
          notes: payload.notes ?? '',
          due_date: payload.due_date ?? null,
          roadmap_week_id: payload.roadmap_week_id ?? null,
          course_recommendation_id: payload.course_recommendation_id ?? null,
          source: payload.source ?? 'user',
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: string;
      title?: string;
      notes?: string;
      due_date?: string | null;
      completed?: boolean;
    }) => {
      const token = await getAccessToken();
      return apiFetch<Task>(`/api/tasks/${id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const token = await getAccessToken();
      await apiFetch(`/api/tasks/${id}`, { method: 'DELETE', token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return { tasks, isLoading, createTask, updateTask, deleteTask };
}
