import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';

export interface Ticket {
  id: string;
  user_id: string;
  ticket_number: string;
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'general' | 'account';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
  assigned_to?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  metadata?: Record<string, unknown>;
  profiles?: { display_name?: string; email?: string };
  assigned_profile?: { display_name?: string };
  comments?: TicketComment[];
  attachments?: TicketAttachment[];
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id?: string | null;
  content: string;
  is_internal: boolean;
  created_at: string;
  profiles?: { display_name?: string };
}

export interface TicketAttachment {
  id: string;
  ticket_id: string;
  comment_id?: string | null;
  file_url: string;
  file_name: string;
  file_size?: number | null;
  mime_type?: string | null;
  created_at: string;
}

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  avgResponseTimeHours: number;
  byCategory: Array<{ category: string; count: number }>;
}

export function useTickets(status?: string, category?: string, priority?: string) {
  const { getAccessToken } = useAuth();
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (category) params.set('category', category);
  if (priority) params.set('priority', priority);

  return useQuery({
    queryKey: ['tickets', status, category, priority],
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<{ tickets: Ticket[] }>(`/api/tickets?${params.toString()}`, { token });
    },
    staleTime: 60 * 1000, // 1 min — avoid refetch on every visit to support page
  });
}

export function useTicket(ticketId: string) {
  const { getAccessToken } = useAuth();
  return useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<{ ticket: Ticket }>(`/api/tickets/${ticketId}`, { token });
    },
    enabled: !!ticketId,
  });
}

export function useCreateTicket() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      subject: string;
      description: string;
      category: Ticket['category'];
      priority?: Ticket['priority'];
    }) => {
      const token = await getAccessToken();
      return apiFetch<{ ticket: Ticket }>('/api/tickets', {
        method: 'POST',
        token,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export function useUpdateTicket() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      updates,
    }: {
      ticketId: string;
      updates: {
        status?: Ticket['status'];
        priority?: Ticket['priority'];
        assigned_to?: string | null;
        subject?: string;
        description?: string;
      };
    }) => {
      const token = await getAccessToken();
      return apiFetch<{ ticket: Ticket }>(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(updates),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.ticketId] });
    },
  });
}

export function useAddComment() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      content,
      is_internal,
    }: {
      ticketId: string;
      content: string;
      is_internal?: boolean;
    }) => {
      const token = await getAccessToken();
      return apiFetch<{ comment: TicketComment }>(`/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        token,
        body: JSON.stringify({ content, is_internal }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export function useTicketStats() {
  const { getAccessToken } = useAuth();
  return useQuery({
    queryKey: ['admin', 'tickets', 'stats'],
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<TicketStats>('/api/admin/tickets/stats', { token });
    },
  });
}
