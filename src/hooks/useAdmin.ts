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
  includeAll?: boolean;
}) {
  const { getAccessToken } = useAuth();
  const params = new URLSearchParams();
  if (filters?.tier) params.set('tier', filters.tier);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.startDate) params.set('start_date', filters.startDate);
  if (filters?.endDate) params.set('end_date', filters.endDate);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.includeAll) params.set('include_all', 'true');

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

export interface CareerDnaLead {
  id: string;
  phone: string;
  countryCode: string | null;
  source: string;
  sourceId: string;
  consentMarketing: boolean;
  createdAt: string;
}

export interface ContactRequest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  phoneCountryCode: string | null;
  company: string | null;
  topic: string;
  subject: string;
  message: string;
  createdAt: string;
}

export function useAdminLeads(filters?: {
  source?: string;
  countryCode?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  const { getAccessToken } = useAuth();
  const params = new URLSearchParams();
  if (filters?.source) params.set('source', filters.source);
  if (filters?.countryCode) params.set('country_code', filters.countryCode);
  if (filters?.startDate) params.set('start_date', filters.startDate);
  if (filters?.endDate) params.set('end_date', filters.endDate);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));

  return useQuery({
    queryKey: ['admin', 'leads', filters],
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<{ leads: CareerDnaLead[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
        `/api/admin/leads?${params.toString()}`,
        { token }
      );
    },
  });
}

export function useAdminContactRequests(filters?: {
  topic?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  const { getAccessToken } = useAuth();
  const params = new URLSearchParams();
  if (filters?.topic) params.set('topic', filters.topic);
  if (filters?.startDate) params.set('start_date', filters.startDate);
  if (filters?.endDate) params.set('end_date', filters.endDate);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));

  return useQuery({
    queryKey: ['admin', 'contact-requests', filters],
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<{ requests: ContactRequest[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
        `/api/admin/contact-requests?${params.toString()}`,
        { token }
      );
    },
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

export function useAdminMetaPixel() {
  const { data, isLoading } = useAdminSettings();
  const metaPixelId =
    typeof data?.settings?.find((s) => s.key === 'meta_pixel_id')?.value === 'string'
      ? (data.settings.find((s) => s.key === 'meta_pixel_id')?.value as string)
      : '';
  return { data: { metaPixelId }, isLoading };
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

export function useCreateAdminUser() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password, display_name, tier, period }: { email: string; password: string; display_name?: string; tier?: 'free' | 'premium'; period?: '1_month' | '1_year' }) => {
      const token = await getAccessToken();
      return apiFetch<{ user_id: string; email: string }>('/api/admin/users/create', {
        method: 'POST',
        token,
        body: JSON.stringify({ email, password, display_name: display_name || undefined, tier: tier || 'free', period: tier === 'premium' ? (period || '1_year') : undefined }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'stats'] });
    },
  });
}

export function useInviteAdminUser() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, tier, display_name, period }: { email: string; tier?: 'free' | 'premium'; display_name?: string; period?: '1_month' | '1_year' }) => {
      const token = await getAccessToken();
      return apiFetch<{ email: string; invited_tier: string; period?: string }>('/api/admin/users/invite', {
        method: 'POST',
        token,
        body: JSON.stringify({ email, tier: tier ?? 'premium', display_name: display_name || undefined, period: tier === 'premium' ? (period || '1_year') : undefined }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'stats'] });
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

// Traffic Analytics
export interface AdminTraffic {
  timeSeries: Array<{ date: string; value: number }>;
  topPages: Array<{ path: string; count: number }>;
  referrers: Array<{ domain: string; count: number }>;
  utmSources: Array<{ source: string; count: number }>;
  utmCampaigns: Array<{ campaign: string; count: number }>;
  devices: Array<{ device: string; count: number }>;
  browsers: Array<{ browser: string; count: number }>;
  countries: Array<{ country: string; count: number }>;
  sessionMetrics: {
    totalSessions: number;
    avgDuration: number;
    avgPagesPerSession: number;
    bounceRate: number;
    conversionRate: number;
  };
}

export function useAdminTraffic(startDate?: string, endDate?: string) {
  const { getAccessToken } = useAuth();
  const params = new URLSearchParams();
  if (startDate) params.set('start_date', startDate);
  if (endDate) params.set('end_date', endDate);

  return useQuery({
    queryKey: ['admin', 'analytics', 'traffic', startDate, endDate],
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<AdminTraffic>(`/api/admin/analytics/traffic?${params.toString()}`, { token });
    },
  });
}

// Conversion Analytics
export interface AdminConversions {
  funnel: Array<{ stage: string; count: number; conversionRate: number }>;
  conversionsByType: Array<{ type: string; count: number }>;
  conversionsByStage: Array<{ stage: string; count: number }>;
  conversionsBySource: Array<{ source: string; count: number }>;
  conversionsByCampaign: Array<{ campaign: string; count: number }>;
  totalRevenue: number;
  timeToConversion: { avg: number; median: number };
}

export function useAdminConversions(startDate?: string, endDate?: string) {
  const { getAccessToken } = useAuth();
  const params = new URLSearchParams();
  if (startDate) params.set('start_date', startDate);
  if (endDate) params.set('end_date', endDate);

  return useQuery({
    queryKey: ['admin', 'analytics', 'conversions', startDate, endDate],
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<AdminConversions>(`/api/admin/analytics/conversions?${params.toString()}`, { token });
    },
  });
}

// User Journey Analytics
export interface AdminUserJourneys {
  flow: Array<{ from: string; to: Array<{ to: string; count: number }> }>;
  dropOffPoints: Array<{ page: string; count: number }>;
  funnel: Array<{ stage: string; count: number; dropOff: number }>;
}

export function useAdminUserJourneys(startDate?: string, endDate?: string) {
  const { getAccessToken } = useAuth();
  const params = new URLSearchParams();
  if (startDate) params.set('start_date', startDate);
  if (endDate) params.set('end_date', endDate);

  return useQuery({
    queryKey: ['admin', 'analytics', 'user-journeys', startDate, endDate],
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<AdminUserJourneys>(`/api/admin/analytics/user-journeys?${params.toString()}`, { token });
    },
  });
}

// User Journey (individual user)
export interface UserJourney {
  timeline: Array<{ type: string; timestamp: string; data: unknown }>;
  events: unknown[];
  sessions: unknown[];
  conversions: unknown[];
  roadmaps: unknown[];
  subscriptionEvents: unknown[];
}

export function useAdminUserJourney(userId: string) {
  const { getAccessToken } = useAuth();
  return useQuery({
    queryKey: ['admin', 'users', userId, 'journey'],
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<UserJourney>(`/api/admin/users/journey/${userId}`, { token });
    },
    enabled: !!userId,
  });
}

// User Notes
export function useAdminUserNotes(userId: string, options?: { enabled?: boolean }) {
  const { getAccessToken } = useAuth();
  return useQuery({
    queryKey: ['admin', 'users', userId, 'notes'],
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<{ notes: string }>(`/api/admin/users/${userId}/notes`, { token });
    },
    enabled: options?.enabled !== false && !!userId,
  });
}

export function useUpdateAdminUserNotes() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, notes }: { userId: string; notes: string }) => {
      const token = await getAccessToken();
      return apiFetch(`/api/admin/users/${userId}/notes`, {
        method: 'POST',
        token,
        body: JSON.stringify({ notes }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', variables.userId, 'notes'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', variables.userId] });
    },
  });
}

// User Tags
export function useAdminUserTags(userId: string, options?: { enabled?: boolean }) {
  const { getAccessToken } = useAuth();
  return useQuery({
    queryKey: ['admin', 'users', userId, 'tags'],
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<{ tags: string[] }>(`/api/admin/users/${userId}/tags`, { token });
    },
    enabled: options?.enabled !== false && !!userId,
  });
}

export function useUpdateAdminUserTags() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, action, tags }: { userId: string; action: 'add' | 'remove'; tags: string[] }) => {
      const token = await getAccessToken();
      return apiFetch<{ success: boolean; tags: string[] }>(`/api/admin/users/${userId}/tags`, {
        method: 'POST',
        token,
        body: JSON.stringify({ action, tags }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', variables.userId, 'tags'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

// Bulk User Actions
export function useBulkUserAction() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user_ids, action, data }: { user_ids: string[]; action: string; data?: Record<string, unknown> }) => {
      const token = await getAccessToken();
      return apiFetch<{ results: Array<{ user_id: string; success: boolean; error?: string }> }>(`/api/admin/users/bulk`, {
        method: 'POST',
        token,
        body: JSON.stringify({ user_ids, action, data }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

// User Export
export function useAdminUsersExport(filters?: {
  startDate?: string;
  endDate?: string;
  tier?: string;
  status?: string;
  tags?: string;
  format?: 'json' | 'csv';
}) {
  const { getAccessToken } = useAuth();
  const params = new URLSearchParams();
  if (filters?.startDate) params.set('start_date', filters.startDate);
  if (filters?.endDate) params.set('end_date', filters.endDate);
  if (filters?.tier) params.set('tier', filters.tier);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.tags) params.set('tags', filters.tags);
  params.set('format', filters?.format || 'json');

  return useQuery({
    queryKey: ['admin', 'users', 'export', filters],
    queryFn: async () => {
      const token = await getAccessToken();
      if (filters?.format === 'csv') {
        const response = await fetch(`/api/admin/users/export?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Path': '/api/admin/users/export',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
          },
        });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return { success: true };
      }
      return apiFetch<{ users: unknown[]; count: number }>(`/api/admin/users/export?${params.toString()}`, { token });
    },
    enabled: false, // Manual trigger only
  });
}

// Subscription Events
export interface SubscriptionEvent {
  id: string;
  subscription_id: string;
  user_id: string;
  event_type: string;
  from_tier?: string;
  to_tier?: string;
  amount?: number;
  reason?: string;
  created_at: string;
}

export function useAdminSubscriptionEvents(subscriptionId: string) {
  const { getAccessToken } = useAuth();
  return useQuery({
    queryKey: ['admin', 'subscriptions', subscriptionId, 'events'],
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<{ events: SubscriptionEvent[] }>(`/api/admin/subscriptions/${subscriptionId}/events`, { token });
    },
    enabled: !!subscriptionId,
  });
}

// Manual Subscription Update
export function useManualSubscriptionUpdate() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ subscriptionId, updates }: { subscriptionId: string; updates: { tier?: string; status?: string; current_period_start?: string; current_period_end?: string; reason?: string } }) => {
      const token = await getAccessToken();
      return apiFetch<{ subscription: AdminSubscription }>(`/api/admin/subscriptions/${subscriptionId}/manual-update`, {
        method: 'POST',
        token,
        body: JSON.stringify(updates),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions', variables.subscriptionId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions', 'revenue'] });
    },
  });
}

// Churn Analysis
export interface ChurnAnalysis {
  period: number;
  churned: number;
  churnRate: number;
  activeAtStart: number;
  newSubscriptions: number;
  activeNow: number;
  churnReasons: Array<{ reason: string; count: number }>;
  retentionCohorts: Array<{ cohort: string; total: number; retained: number; retentionRate: number }>;
}

export function useAdminChurnAnalysis(startDate?: string, endDate?: string) {
  const { getAccessToken } = useAuth();
  const params = new URLSearchParams();
  if (startDate) params.set('start_date', startDate);
  if (endDate) params.set('end_date', endDate);

  return useQuery({
    queryKey: ['admin', 'subscriptions', 'churn-analysis', startDate, endDate],
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<ChurnAnalysis>(`/api/admin/subscriptions/churn-analysis?${params.toString()}`, { token });
    },
  });
}

// Refunds
export function useAdminRefunds() {
  const { getAccessToken } = useAuth();
  return useQuery({
    queryKey: ['admin', 'subscriptions', 'refunds'],
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<{ refunds: SubscriptionEvent[] }>('/api/admin/subscriptions/refunds', { token });
    },
  });
}

export function useProcessRefund() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ subscription_id, amount, reason }: { subscription_id: string; amount?: number; reason?: string }) => {
      const token = await getAccessToken();
      return apiFetch<{ success: boolean }>('/api/admin/subscriptions/refunds', {
        method: 'POST',
        token,
        body: JSON.stringify({ subscription_id, amount, reason }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions', 'refunds'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions', 'revenue'] });
    },
  });
}

// Themes
export interface Theme {
  id: string;
  name: string;
  is_default: boolean;
  is_admin_created: boolean;
  created_by?: string;
  colors: Record<string, string>;
  description?: string;
  created_at: string;
  updated_at: string;
}

export function useAdminThemes() {
  const { getAccessToken } = useAuth();
  return useQuery({
    queryKey: ['admin', 'themes'],
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<{ themes: Theme[] }>('/api/admin/themes', { token });
    },
  });
}

export function useCreateAdminTheme() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, colors, description }: { name: string; colors: Record<string, string>; description?: string }) => {
      const token = await getAccessToken();
      return apiFetch<{ theme: Theme }>('/api/admin/themes', {
        method: 'POST',
        token,
        body: JSON.stringify({ name, colors, description }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'themes'] });
    },
  });
}

export function useUpdateAdminTheme() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ themeId, updates }: { themeId: string; updates: { name?: string; colors?: Record<string, string>; description?: string } }) => {
      const token = await getAccessToken();
      return apiFetch<{ theme: Theme }>(`/api/admin/themes/${themeId}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'themes'] });
    },
  });
}

export function useDeleteAdminTheme() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (themeId: string) => {
      const token = await getAccessToken();
      return apiFetch<{ success: boolean }>(`/api/admin/themes/${themeId}`, {
        method: 'DELETE',
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'themes'] });
    },
  });
}

export function useSetDefaultTheme() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (themeId: string) => {
      const token = await getAccessToken();
      return apiFetch<{ theme: Theme }>(`/api/admin/themes/${themeId}/set-default`, {
        method: 'POST',
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'themes'] });
    },
  });
}
