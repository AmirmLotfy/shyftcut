import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTicket, useUpdateTicket, useAddComment, Ticket } from '@/hooks/useTickets';
import { useAdminUsers } from '@/hooks/useAdmin';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, MessageSquare, Send, Clock, User, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { enUS, arSA } from 'date-fns/locale';

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

export default function AdminTicketDetail() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  const { data, isLoading, refetch } = useTicket(id || '');
  const { data: usersData } = useAdminUsers();
  const updateTicket = useUpdateTicket();
  const addComment = useAddComment();

  const ticket = data?.ticket;

  const handleAddComment = async () => {
    if (!commentText.trim() || !id) return;

    try {
      await addComment.mutateAsync({
        ticketId: id,
        content: commentText,
        is_internal: isInternal,
      });
      setCommentText('');
      setIsInternal(false);
      refetch();
      toast({
        title: language === 'ar' ? 'تم الإضافة' : 'Comment Added',
        description: language === 'ar' ? 'تم إضافة التعليق بنجاح' : 'Comment added successfully',
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async (status: Ticket['status']) => {
    if (!id) return;

    try {
      await updateTicket.mutateAsync({
        ticketId: id,
        updates: { status },
      });
      refetch();
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

  const handleUpdatePriority = async (priority: Ticket['priority']) => {
    if (!id) return;

    try {
      await updateTicket.mutateAsync({
        ticketId: id,
        updates: { priority },
      });
      refetch();
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

  const handleAssignTicket = async (userId: string | null) => {
    if (!id) return;

    try {
      await updateTicket.mutateAsync({
        ticketId: id,
        updates: { assigned_to: userId },
      });
      refetch();
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

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-4 sm:p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-lg font-semibold mb-2">
              {language === 'ar' ? 'التذكرة غير موجودة' : 'Ticket Not Found'}
            </p>
            <Button onClick={() => navigate('/admin/tickets')} variant="outline">
              {language === 'ar' ? 'العودة إلى التذاكر' : 'Back to Tickets'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allComments = ticket.comments || [];
  const publicComments = allComments.filter(c => !c.is_internal);
  const internalComments = allComments.filter(c => c.is_internal);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/tickets')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{ticket.subject}</h1>
          <p className="text-muted-foreground mt-1">
            {language === 'ar' ? 'رقم التذكرة' : 'Ticket'} #{ticket.ticket_number} •{' '}
            {ticket.profiles?.display_name || ticket.profiles?.email || (language === 'ar' ? 'مستخدم' : 'User')}
          </p>
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

      {/* Admin Controls */}
      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'إدارة التذكرة' : 'Ticket Management'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'الحالة' : 'Status'}</Label>
              <Select
                value={ticket.status}
                onValueChange={(value) => handleUpdateStatus(value as Ticket['status'])}
              >
                <SelectTrigger>
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
            </div>
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'الأولوية' : 'Priority'}</Label>
              <Select
                value={ticket.priority}
                onValueChange={(value) => handleUpdatePriority(value as Ticket['priority'])}
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
              <Label>{language === 'ar' ? 'تعيين إلى' : 'Assign To'}</Label>
              <Select
                value={ticket.assigned_to || '_unassigned'}
                onValueChange={(value) => handleAssignTicket(value === '_unassigned' ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'غير مخصص' : 'Unassigned'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_unassigned">{language === 'ar' ? 'غير مخصص' : 'Unassigned'}</SelectItem>
                  {usersData?.users.map((user) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      {user.display_name || user.email || user.user_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ticket Details */}
      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'تفاصيل التذكرة' : 'Ticket Details'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">{language === 'ar' ? 'الوصف' : 'Description'}</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm font-medium mb-1">{language === 'ar' ? 'تاريخ الإنشاء' : 'Created'}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(ticket.created_at).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
              </p>
            </div>
            {ticket.resolved_at && (
              <div>
                <p className="text-sm font-medium mb-1">{language === 'ar' ? 'تاريخ الحل' : 'Resolved'}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(ticket.resolved_at).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {language === 'ar' ? 'التعليقات' : 'Comments'}
            {allComments.length > 0 && (
              <Badge variant="secondary">{allComments.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Public Comments */}
          {publicComments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">{language === 'ar' ? 'تعليقات عامة' : 'Public Comments'}</h3>
              {publicComments.map((comment) => (
                <div key={comment.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {comment.profiles?.display_name || (language === 'ar' ? 'مستخدم' : 'User')}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { 
                        addSuffix: true,
                        locale: language === 'ar' ? arSA : enUS
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Internal Comments */}
          {internalComments.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {language === 'ar' ? 'ملاحظات داخلية' : 'Internal Notes'}
              </h3>
              {internalComments.map((comment) => (
                <div key={comment.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50/50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-900">
                        {comment.profiles?.display_name || (language === 'ar' ? 'مدير' : 'Admin')}
                      </span>
                      <Badge variant="outline" className="text-xs">Internal</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { 
                        addSuffix: true,
                        locale: language === 'ar' ? arSA : enUS
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}
            </div>
          )}

          {allComments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {language === 'ar' ? 'لا توجد تعليقات بعد' : 'No comments yet'}
            </p>
          )}

          {/* Add Comment */}
          {ticket.status !== 'closed' && (
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="internal-comment"
                  checked={isInternal}
                  onCheckedChange={setIsInternal}
                />
                <Label htmlFor="internal-comment" className="text-sm">
                  {language === 'ar' ? 'ملاحظة داخلية (غير مرئية للمستخدم)' : 'Internal note (not visible to user)'}
                </Label>
              </div>
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={
                  isInternal
                    ? language === 'ar' ? 'أضف ملاحظة داخلية...' : 'Add an internal note...'
                    : language === 'ar' ? 'أضف رداً...' : 'Add a reply...'
                }
                rows={4}
              />
              <div className="flex justify-end">
                <Button onClick={handleAddComment} disabled={!commentText.trim() || addComment.isPending}>
                  <Send className="mr-2 h-4 w-4" />
                  {addComment.isPending
                    ? language === 'ar' ? 'جاري الإرسال...' : 'Sending...'
                    : language === 'ar' ? 'إرسال' : 'Send'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
