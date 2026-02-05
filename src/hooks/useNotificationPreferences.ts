import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { debugError } from '@/lib/debug';
import { captureException } from '@/lib/error-tracking';

export interface NotificationPreferences {
  user_id: string;
  email_reminders: boolean;
  push_enabled: boolean;
  reminder_time: string;
  timezone: string;
  in_app_reminder: boolean;
}

export function useNotificationPreferences() {
  const { user, session, getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: prefs, isLoading, error } = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async (): Promise<NotificationPreferences | null> => {
      if (!user) return null;
      const token = await getAccessToken();
      return apiFetch<NotificationPreferences>('/api/notification-preferences', { token });
    },
    enabled: !!user && !!session,
  });

  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      if (!user) throw new Error('Not authenticated');
      const token = await getAccessToken();
      if (!token) throw new Error('Session expired. Please sign in again.');
      return apiFetch<NotificationPreferences>('/api/notification-preferences', {
        method: 'PATCH',
        token,
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', user?.id] });
    },
    onError: (error) => {
      debugError('useNotificationPreferences', 'update failed', error);
      captureException(error);
    },
  });

  return {
    preferences: prefs ?? null,
    isLoading,
    error,
    updatePreferences: updatePreferences.mutate,
    isUpdating: updatePreferences.isPending,
  };
}
