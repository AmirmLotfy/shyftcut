import { useState } from 'react';
import { useAdminContactRequests, ContactRequest } from '@/hooks/useAdmin';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { Phone, Mail, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { flagEmoji } from '@/lib/country-codes';

const TOPIC_LABELS: Record<string, { en: string; ar: string }> = {
  general: { en: 'General', ar: 'عام' },
  sales: { en: 'Sales', ar: 'مبيعات' },
  support: { en: 'Support', ar: 'دعم' },
  partnership: { en: 'Partnership', ar: 'شراكة' },
  feedback: { en: 'Feedback', ar: 'ملاحظات' },
  other: { en: 'Other', ar: 'آخر' },
};

export default function ContactRequests() {
  const { language } = useLanguage();
  const [topicFilter, setTopicFilter] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useAdminContactRequests({
    topic: topicFilter && topicFilter !== '_all' ? topicFilter : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit: 50,
  });

  const pagination = data?.pagination;
  const requests = data?.requests ?? [];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{language === 'ar' ? 'طلبات التواصل' : 'Contact Submissions'}</h1>
        <p className="text-muted-foreground mt-1">
          {language === 'ar'
            ? 'جميع الرسائل المرسلة من نموذج التواصل العام'
            : 'All messages submitted from the public contact form'}
        </p>
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            {language === 'ar' ? 'حدث خطأ في تحميل البيانات' : 'Error loading data'}: {(error as Error)?.message || 'Unknown error'}
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-wrap">
        <Select value={topicFilter || '_all'} onValueChange={(v) => { setTopicFilter(v === '_all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={language === 'ar' ? 'الموضوع' : 'Topic'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
            {Object.entries(TOPIC_LABELS).map(([value, labels]) => (
              <SelectItem key={value} value={value}>
                {labels[language as 'en' | 'ar']}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
              <TableHead>{language === 'ar' ? 'البريد' : 'Email'}</TableHead>
              <TableHead>{language === 'ar' ? 'الهاتف' : 'Phone'}</TableHead>
              <TableHead>{language === 'ar' ? 'البلد' : 'Country'}</TableHead>
              <TableHead>{language === 'ar' ? 'الموضوع' : 'Topic'}</TableHead>
              <TableHead>{language === 'ar' ? 'الموضوع' : 'Subject'}</TableHead>
              <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
              <TableHead className="w-[80px]">{language === 'ar' ? 'الرسالة' : 'Message'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                </TableRow>
              ))
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                  {language === 'ar' ? 'لا توجد طلبات' : 'No contact requests found'}
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req: ContactRequest) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.name}</TableCell>
                  <TableCell>
                    <a href={`mailto:${req.email}`} className="text-primary hover:underline flex items-center gap-1.5">
                      <Mail className="h-4 w-4 shrink-0" />
                      {req.email}
                    </a>
                  </TableCell>
                  <TableCell>
                    {req.phone ? (
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {req.phone}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {req.phoneCountryCode ? (
                      <span className="flex items-center gap-1.5">
                        <span aria-hidden>{flagEmoji(req.phoneCountryCode)}</span>
                        <span>{req.phoneCountryCode}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {TOPIC_LABELS[req.topic]?.[language as 'en' | 'ar'] ?? req.topic}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate" title={req.subject}>{req.subject}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(req.createdAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span className="sr-only">{language === 'ar' ? 'عرض الرسالة' : 'View message'}</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" aria-describedby="contact-request-detail-desc">
                        <DialogHeader>
                          <DialogTitle>{req.subject}</DialogTitle>
                          <DialogDescription id="contact-request-detail-desc" className="sr-only">
                            {language === 'ar' ? 'تفاصيل طلب التواصل' : 'Contact request details'}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 text-sm">
                          <div>
                            <strong>{language === 'ar' ? 'من' : 'From'}:</strong> {req.name} ({req.email})
                          </div>
                          {req.phone && (
                            <div>
                              <strong>{language === 'ar' ? 'الهاتف' : 'Phone'}:</strong> {req.phone}
                              {req.phoneCountryCode && (
                                <span className="ml-1">({flagEmoji(req.phoneCountryCode)} {req.phoneCountryCode})</span>
                              )}
                            </div>
                          )}
                          {req.company && (
                            <div>
                              <strong>{language === 'ar' ? 'الشركة' : 'Company'}:</strong> {req.company}
                            </div>
                          )}
                          <div>
                            <strong>{language === 'ar' ? 'الموضوع' : 'Topic'}:</strong>{' '}
                            {TOPIC_LABELS[req.topic]?.[language as 'en' | 'ar'] ?? req.topic}
                          </div>
                          <div>
                            <strong>{language === 'ar' ? 'الرسالة' : 'Message'}:</strong>
                            <p className="mt-2 whitespace-pre-wrap rounded bg-muted p-3">{req.message}</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {language === 'ar' ? 'صفحة' : 'Page'} {pagination.page} {language === 'ar' ? 'من' : 'of'} {pagination.totalPages}
            {' '}({pagination.total} {language === 'ar' ? 'إجمالي' : 'total'})
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
