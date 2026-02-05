import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';

// Types
export interface AdminUser {
  id: string;
  user_id: string;
  email?: string;
  display_name?: string;
  role?: string;
  created_at: string;
  subscriptions?: Array<{ tier: string; status: string }>;
}

export interface AdminUserStats {
  total: number;
  byTier: { free: number; premium: number; pro: number };
  newUsersLast30Days: number;
  activeUsersLast7Days: number;
}

export interface AdminSubscription {
  id: string;
  user_id: string;
  tier: string;
  status: string;
  current_period_start?: string;
  current_period_end?: string;
  created_at: string;
  profiles?: { display_name?: string; email?: string };
}

export interface AdminAnalytics {
  users: { total: number; newLast30Days: number; dau: number };
  subscriptions: { active: number; distribution?: Record<string, number> };
  content: { roadmaps: number; chatMessages: number };
  timeSeries?: {
    userGrowth: Array<{ date: string; value: number }>;
    activeUsers: Array<{ date: string; value: number }>;
    revenue: Array<{ date: string; value: number }>;
  };
}

export interface WeeklyInsights {
  key_insights: string[];
  trends: {
    user_growth: 'up' | 'down' | 'stable';
    revenue: 'up' | 'down' | 'stable';
    engagement: 'up' | 'down' | 'stable';
  };
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    impact: string;
  }>;
  alerts: Array<{
    severity: 'critical' | 'warning' | 'info';
    message: string;
  }>;
  metrics_summary: {
    week_over_week_growth: number;
    top_performing_feature: string;
    area_needing_attention: string;
  };
}

export interface AdminAuditLog {
  id: string;
  admin_user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details: Record<string, unknown>;
  created_at: string;
  profiles?: { display_name?: string; email?: string };
}

// Hooks
export function useAdminUsers(filters?: {
  search?: string;
  role?: string;
  tier?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  const { getAccessToken } = useAuth();
  const params = new URLSearchParams();
  if (filters?.search) params.set('search', filters.search);
  if (filters?.role) params.set('role', filters.role);
  if (filters?.tier) params.set('tier', filters.tier);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.startDate) params.set('start_date', filters.startDate);
  if (filters?.endDate) params.set('end_date', filters.endDate);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));

  return useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<{ users: AdminUser[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
        `/api/admin/users?${params.toString()}`,
        { token }
      );
    },
  });
}

export function useAdminUserStats() {
  const { getAccessToken } = useAuth();
  return useQuery({
    queryKey: ['admin', 'users', 'stats'],
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<AdminUserStats>('/api/admin/users/stats', { token });
    },
  });
}

export function useAdminUser(userId: string) {
  const { getAccessToken } = useAuth();
  return useQuery({
    queryKey: ['admin', 'users', userId],
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<{ profile: AdminUser; subscription?: AdminSubscription; roadmaps: unknown[]; activity: unknown[] }>(
        `/api/admin/users/${userId}`,
        { token }
      );
    },
    enabled: !!userId,
  });
}

export function useAdminSubscriptions(filters?: {
  tier?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  const { getAccessToken } = useAuth();
  const params = new URLSearchParams();
  if (filters?.tier) params.set('tier', filters.tier);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.startDate) params.set('start_date', filters.startDate);
  if (filters?.endDate) params.set('end_date', filters.endDate);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));

  return useQuery({
    queryKey: ['admin', 'subscriptions', filters],
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<{ subscriptions: AdminSubscription[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
        `/api/admin/subscriptions?${params.toString()}`,
        { token }
      );
    },
  });
}

export function useAdminRevenue() {
  const { getAccessToken } = useAuth();
  return useQuery({
    queryKey: ['admin', 'subscriptions', 'revenue'],
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<{ mrr: number; arr: number; activeSubscriptions: number }>('/api/admin/subscriptions/revenue', { token });
    },
  });
}

export function useAdminAnalytics(startDate?: string, endDate?: string) {
  const { getAccessToken } = useAuth();
  const params = new URLSearchParams();
  if (startDate) params.set('start_date', startDate);
  if (endDate) params.set('end_date', endDate);

  return useQuery({
    queryKey: ['admin', 'analytics', startDate, endDate],
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<AdminAnalytics>(`/api/admin/analytics?${params.toString()}`, { token });
    },
  });
}

export function useAdminInsights() {
  const { getAccessToken } = useAuth();
  return useQuery({
    queryKey: ['admin', 'analytics', 'insights'],
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<{ insights: WeeklyInsights; cached: boolean }>('/api/admin/analytics/insights', { token });
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useAdminAuditLog(filters?: {
  adminUserId?: string;
  action?: string;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  const { getAccessToken } = useAuth();
  const params = new URLSearchParams();
  if (filters?.adminUserId) params.set('admin_user_id', filters.adminUserId);
  if (filters?.action) params.set('action', filters.action);
  if (filters?.resourceType) params.set('resource_type', filters.resourceType);
  if (filters?.startDate) params.set('start_date', filters.startDate);
  if (filters?.endDate) params.set('end_date', filters.endDate);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));

  return useQuery({
    queryKey: ['admin', 'audit-log', filters],
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<{ logs: AdminAuditLog[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
        `/api/admin/audit-log?${params.toString()}`,
        { token }
      );
    },
  });
}

export function useAdminSettings() {
  const { getAccessToken } = useAuth();
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<{ settings: Array<{ key: string; value: unknown; description?: string }> }>('/api/admin/settings', { token });
    },
  });
}

export function useAdminFeatureFlags() {
  const { getAccessToken } = useAuth();
  return useQuery({
    queryKey: ['admin', 'settings', 'feature-flags'],
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<{ featureFlags: Record<string, unknown> }>('/api/admin/settings/feature-flags', { token });
    },
  });
}

// Mutations
export function useUpdateAdminUser() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Record<string, unknown> }) => {
      const token = await getAccessToken();
      return apiFetch<AdminUser>(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(updates),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', variables.userId] });
    },
  });
}

export function useDeleteAdminUser() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, cascade }: { userId: string; cascade?: boolean }) => {
      const token = await getAccessToken();
      return apiFetch<{ success: boolean }>(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        token,
        body: JSON.stringify({ cascade }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useUpdateAdminSubscription() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ subscriptionId, updates }: { subscriptionId: string; updates: Record<string, unknown> }) => {
      const token = await getAccessToken();
      return apiFetch<AdminSubscription>(`/api/admin/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions', 'revenue'] });
    },
  });
}

export function useUpdateAdminFeatureFlags() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (featureFlags: Record<string, unknown>) => {
      const token = await getAccessToken();
      return apiFetch(`/api/admin/settings/feature-flags`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ featureFlags }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'feature-flags'] });
    },
  });
}

export function useUpdateAdminSetting() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: unknown; description?: string }) => {
      const token = await getAccessToken();
      return apiFetch(`/api/admin/settings/${key}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ value, description }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
  });
}
