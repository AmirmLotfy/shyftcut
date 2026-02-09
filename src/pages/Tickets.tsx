import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useTickets, useCreateTicket, Ticket } from '@/hooks/useTickets';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Plus, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

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

export default function Tickets() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('_all');
  const [categoryFilter, setCategoryFilter] = useState<string>('_all');
  const [priorityFilter, setPriorityFilter] = useState<string>('_all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const { data, isLoading } = useTickets(
    statusFilter && statusFilter !== '_all' ? statusFilter : undefined,
    categoryFilter && categoryFilter !== '_all' ? categoryFilter : undefined,
    priorityFilter && priorityFilter !== '_all' ? priorityFilter : undefined
  );
  const createTicket = useCreateTicket();

  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'general' as Ticket['category'],
    priority: 'medium' as Ticket['priority'],
  });

  const handleCreateTicket = async () => {
    if (!formData.subject.trim() || !formData.description.trim()) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'الموضوع والوصف مطلوبان' : 'Subject and description are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await createTicket.mutateAsync(formData);
      toast({
        title: language === 'ar' ? 'تم الإنشاء' : 'Ticket Created',
        description: language === 'ar' ? 'تم إنشاء التذكرة بنجاح' : 'Ticket created successfully',
      });
      setIsCreateDialogOpen(false);
      setFormData({ subject: '', description: '', category: 'general', priority: 'medium' });
      navigate(`/dashboard/tickets/${result.ticket.id}`);
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  const tickets = data?.tickets || [];

  return (
    <>
      <Helmet><title>Support | Shyftcut</title></Helmet>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{language === 'ar' ? 'التذاكر' : 'Support Tickets'}</h1>
          <p className="text-muted-foreground mt-1">
            {language === 'ar' ? 'إدارة تذاكر الدعم الخاصة بك' : 'Manage your support tickets'}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="min-h-[44px]">
              <Plus className="mr-2 h-4 w-4" />
              {language === 'ar' ? 'إنشاء تذكرة جديدة' : 'Create New Ticket'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="tickets-create-desc">
            <DialogHeader>
              <DialogTitle>{language === 'ar' ? 'إنشاء تذكرة جديدة' : 'Create New Ticket'}</DialogTitle>
              <DialogDescription id="tickets-create-desc">
                {language === 'ar' ? 'املأ النموذج أدناه لإنشاء تذكرة دعم جديدة' : 'Fill out the form below to create a new support ticket'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">{language === 'ar' ? 'الموضوع' : 'Subject'}</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder={language === 'ar' ? 'موضوع التذكرة' : 'Ticket subject'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">{language === 'ar' ? 'الفئة' : 'Category'}</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as Ticket['category'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, labels]) => (
                      <SelectItem key={key} value={key}>
                        {language === 'ar' ? labels.ar : labels.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">{language === 'ar' ? 'الأولوية' : 'Priority'}</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as Ticket['priority'] })}
                >
                  <SelectTrigger>
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{language === 'ar' ? 'الوصف' : 'Description'}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={language === 'ar' ? 'وصف مشكلتك بالتفصيل...' : 'Describe your issue in detail...'}
                  rows={6}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleCreateTicket} disabled={createTicket.isPending}>
                  {createTicket.isPending
                    ? language === 'ar' ? 'جاري الإنشاء...' : 'Creating...'
                    : language === 'ar' ? 'إنشاء التذكرة' : 'Create Ticket'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
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
          <SelectTrigger className="w-full sm:w-[180px]">
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
          <SelectTrigger className="w-full sm:w-[180px]">
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

      {/* Tickets List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
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
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">
              {language === 'ar' ? 'لا توجد تذاكر' : 'No Tickets'}
            </p>
            <p className="text-muted-foreground">
              {language === 'ar' ? 'ابدأ بإنشاء تذكرة دعم جديدة' : 'Start by creating a new support ticket'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => navigate(`/dashboard/tickets/${ticket.id}`)}
            >
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                    <CardDescription className="mt-1">
                      {language === 'ar' ? 'رقم التذكرة' : 'Ticket'} #{ticket.ticket_number}
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
                <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
                <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(ticket.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                  </span>
                  {ticket.comments && ticket.comments.length > 0 && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {ticket.comments.length} {language === 'ar' ? 'تعليق' : 'comments'}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
