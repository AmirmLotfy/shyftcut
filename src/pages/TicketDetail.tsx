import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { useTicket, useUpdateTicket, useAddComment, Ticket } from '@/hooks/useTickets';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MessageSquare, Send, Clock, User, CheckCircle } from 'lucide-react';
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

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');

  const { data, isLoading } = useTicket(id || '');
  const updateTicket = useUpdateTicket();
  const addComment = useAddComment();

  const ticket = data?.ticket;

  const handleAddComment = async () => {
    if (!commentText.trim() || !id) return;

    try {
      await addComment.mutateAsync({
        ticketId: id,
        content: commentText,
      });
      setCommentText('');
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

  if (isLoading) {
    return (
      <>
        <Helmet><title>Support | Shyftcut</title></Helmet>
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
      </>
    );
  }

  if (!ticket) {
    return (
      <>
        <Helmet><title>Support | Shyftcut</title></Helmet>
        <div className="p-4 sm:p-6">
          <Card>
          <CardContent className="p-12 text-center">
            <p className="text-lg font-semibold mb-2">
              {language === 'ar' ? 'التذكرة غير موجودة' : 'Ticket Not Found'}
            </p>
            <Button onClick={() => navigate('/dashboard/tickets')} variant="outline">
              {language === 'ar' ? 'العودة إلى التذاكر' : 'Back to Tickets'}
            </Button>
          </CardContent>
        </Card>
      </div>
      </>
    );
  }

  return (
    <>
      <Helmet><title>Support | Shyftcut</title></Helmet>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/tickets')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{ticket.subject}</h1>
          <p className="text-muted-foreground mt-1">
            {language === 'ar' ? 'رقم التذكرة' : 'Ticket'} #{ticket.ticket_number}
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
            {ticket.comments && ticket.comments.length > 0 && (
              <Badge variant="secondary">{ticket.comments.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ticket.comments && ticket.comments.length > 0 ? (
            <div className="space-y-4">
              {ticket.comments.map((comment) => (
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
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              {language === 'ar' ? 'لا توجد تعليقات بعد' : 'No comments yet'}
            </p>
          )}

          {/* Add Comment */}
          {ticket.status !== 'closed' && (
            <div className="border-t pt-4 space-y-3">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={language === 'ar' ? 'أضف تعليقاً...' : 'Add a comment...'}
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

      {/* Actions */}
      {ticket.status !== 'closed' && (
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'الإجراءات' : 'Actions'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {ticket.status !== 'waiting_customer' && (
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus('waiting_customer')}
                  disabled={updateTicket.isPending}
                >
                  {language === 'ar' ? 'وضع في انتظار الرد' : 'Mark as Waiting for Response'}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => handleUpdateStatus('closed')}
                disabled={updateTicket.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {language === 'ar' ? 'إغلاق التذكرة' : 'Close Ticket'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </>
  );
}
