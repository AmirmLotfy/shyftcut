import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTickets, useUpdateTicket, useTicketStats, Ticket } from '@/hooks/useTickets';
import { useAdminUsers } from '@/hooks/useAdmin';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Search, Filter, User, Clock, CheckCircle } from 'lucide-react';

const statusColors = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  waiting_customer: 'bg-purple-100 text-purple-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const categoryLabels: Record<Ticket['category'], { en: string; ar: string }> = {
  technical: { en: 'Technical', ar: 'تقني' },
  billing: { en: 'Billing', ar: 'الفوترة' },
  feature_request: { en: 'Feature Request', ar: 'طلب ميزة' },
  bug_report: { en: 'Bug Report', ar: 'تقرير خطأ' },
  general: { en: 'General', ar: 'عام' },
  account: { en: 'Account', ar: 'الحساب' },
};

const statusLabels: Record<Ticket['status'], { en: string; ar: string }> = {
  open: { en: 'Open', ar: 'مفتوح' },
  in_progress: { en: 'In Progress', ar: 'قيد التنفيذ' },
  waiting_customer: { en: 'Waiting for Customer', ar: 'في انتظار العميل' },
  resolved: { en: 'Resolved', ar: 'تم الحل' },
  closed: { en: 'Closed', ar: 'مغلق' },
};

const priorityLabels: Record<Ticket['priority'], { en: string; ar: string }> = {
  low: { en: 'Low', ar: 'منخفض' },
  medium: { en: 'Medium', ar: 'متوسط' },
  high: { en: 'High', ar: 'عالي' },
  urgent: { en: 'Urgent', ar: 'عاجل' },
};

export default function AdminTickets() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('_all');
  const [categoryFilter, setCategoryFilter] = useState<string>('_all');
  const [priorityFilter, setPriorityFilter] = useState<string>('_all');
  const [assignedToFilter, setAssignedToFilter] = useState<string>('_all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useTickets(
    statusFilter && statusFilter !== '_all' ? statusFilter : undefined,
    categoryFilter && categoryFilter !== '_all' ? categoryFilter : undefined,
    priorityFilter && priorityFilter !== '_all' ? priorityFilter : undefined
  );
  const { data: statsData } = useTicketStats();
  const { data: usersData } = useAdminUsers();
  const updateTicket = useUpdateTicket();

  const tickets = data?.tickets || [];
  const filteredTickets = tickets.filter((ticket) => {
    if (assignedToFilter && assignedToFilter !== '_all' && ticket.assigned_to !== assignedToFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        ticket.subject.toLowerCase().includes(query) ||
        ticket.description.toLowerCase().includes(query) ||
        ticket.ticket_number.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handleAssignTicket = async (ticketId: string, userId: string | null) => {
    try {
      await updateTicket.mutateAsync({
        ticketId,
        updates: { assigned_to: userId },
      });
      toast({
        title: language === 'ar' ? 'تم التعيين' : 'Ticket Assigned',
        description: language === 'ar' ? 'تم تعيين التذكرة بنجاح' : 'Ticket assigned successfully',
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: Ticket['status']) => {
    try {
      await updateTicket.mutateAsync({
        ticketId,
        updates: { status },
      });
      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Status Updated',
        description: language === 'ar' ? 'تم تحديث حالة التذكرة' : 'Ticket status updated',
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePriority = async (ticketId: string, priority: Ticket['priority']) => {
    try {
      await updateTicket.mutateAsync({
        ticketId,
        updates: { priority },
      });
      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Priority Updated',
        description: language === 'ar' ? 'تم تحديث أولوية التذكرة' : 'Ticket priority updated',
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{language === 'ar' ? 'إدارة التذاكر' : 'Ticket Management'}</h1>
        <p className="text-muted-foreground mt-1">
          {language === 'ar' ? 'إدارة جميع تذاكر الدعم' : 'Manage all support tickets'}
        </p>
      </div>

      {/* Stats */}
      {statsData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي' : 'Total'}</p>
              <p className="text-2xl font-bold mt-1">{statsData.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{language === 'ar' ? 'مفتوحة' : 'Open'}</p>
              <p className="text-2xl font-bold mt-1 text-blue-600">{statsData.open}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</p>
              <p className="text-2xl font-bold mt-1 text-yellow-600">{statsData.inProgress}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{language === 'ar' ? 'تم الحل' : 'Resolved'}</p>
              <p className="text-2xl font-bold mt-1 text-green-600">{statsData.resolved}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {language === 'ar' ? 'الفلاتر' : 'Filters'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <Input
                placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'ar' ? 'جميع الحالات' : 'All Statuses'} />
              </SelectTrigger>
                <SelectContent>
                <SelectItem value="_all">{language === 'ar' ? 'جميع الحالات' : 'All Statuses'}</SelectItem>
                {Object.entries(statusLabels).map(([key, labels]) => (
                  <SelectItem key={key} value={key}>
                    {language === 'ar' ? labels.ar : labels.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'ar' ? 'جميع الفئات' : 'All Categories'} />
              </SelectTrigger>
                <SelectContent>
                <SelectItem value="_all">{language === 'ar' ? 'جميع الفئات' : 'All Categories'}</SelectItem>
                {Object.entries(categoryLabels).map(([key, labels]) => (
                  <SelectItem key={key} value={key}>
                    {language === 'ar' ? labels.ar : labels.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'ar' ? 'جميع الأولويات' : 'All Priorities'} />
              </SelectTrigger>
                <SelectContent>
                <SelectItem value="_all">{language === 'ar' ? 'جميع الأولويات' : 'All Priorities'}</SelectItem>
                {Object.entries(priorityLabels).map(([key, labels]) => (
                  <SelectItem key={key} value={key}>
                    {language === 'ar' ? labels.ar : labels.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {usersData && (
            <div className="mt-4">
              <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
                <SelectTrigger className="w-full sm:w-[300px]">
                  <SelectValue placeholder={language === 'ar' ? 'جميع المخصصين' : 'All Assignees'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">{language === 'ar' ? 'جميع المخصصين' : 'All Assignees'}</SelectItem>
                  {usersData.users.map((user) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      {user.display_name || user.email || user.user_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tickets List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">
              {language === 'ar' ? 'لا توجد تذاكر' : 'No Tickets'}
            </p>
            <p className="text-muted-foreground">
              {language === 'ar' ? 'لا توجد تذاكر تطابق الفلاتر المحددة' : 'No tickets match the selected filters'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="hover:bg-accent/50 transition-colors">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-lg cursor-pointer" onClick={() => navigate(`/admin/tickets/${ticket.id}`)}>
                      {ticket.subject}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {language === 'ar' ? 'رقم التذكرة' : 'Ticket'} #{ticket.ticket_number} •{' '}
                      {ticket.profiles?.display_name || ticket.profiles?.email || (language === 'ar' ? 'مستخدم' : 'User')}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={statusColors[ticket.status]}>
                      {language === 'ar' ? statusLabels[ticket.status].ar : statusLabels[ticket.status].en}
                    </Badge>
                    <Badge className={priorityColors[ticket.priority]}>
                      {language === 'ar' ? priorityLabels[ticket.priority].ar : priorityLabels[ticket.priority].en}
                    </Badge>
                    <Badge variant="outline">
                      {language === 'ar' ? categoryLabels[ticket.category].ar : categoryLabels[ticket.category].en}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{ticket.description}</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-4 border-t">
                  <div className="flex-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(ticket.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                    </span>
                    {ticket.assigned_profile && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {language === 'ar' ? 'مخصص إلى' : 'Assigned to'} {ticket.assigned_profile.display_name}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {usersData && (
                      <Select
                        value={ticket.assigned_to || '_unassigned'}
                        onValueChange={(value) => handleAssignTicket(ticket.id, value === '_unassigned' ? null : value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder={language === 'ar' ? 'تعيين إلى' : 'Assign to'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_unassigned">{language === 'ar' ? 'غير مخصص' : 'Unassigned'}</SelectItem>
                          {usersData.users.map((user) => (
                            <SelectItem key={user.user_id} value={user.user_id}>
                              {user.display_name || user.email || user.user_id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Select
                      value={ticket.status}
                      onValueChange={(value) => handleUpdateStatus(ticket.id, value as Ticket['status'])}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([key, labels]) => (
                          <SelectItem key={key} value={key}>
                            {language === 'ar' ? labels.ar : labels.en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={ticket.priority}
                      onValueChange={(value) => handleUpdatePriority(ticket.id, value as Ticket['priority'])}
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(priorityLabels).map(([key, labels]) => (
                          <SelectItem key={key} value={key}>
                            {language === 'ar' ? labels.ar : labels.en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                    >
                      {language === 'ar' ? 'عرض والرد' : 'View & Reply'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
