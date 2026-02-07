import { useState } from 'react';
import { useAdminLeads, CareerDnaLead } from '@/hooks/useAdmin';
import { flagEmoji } from '@/lib/country-codes';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { Phone, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Leads() {
  const { language } = useLanguage();
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useAdminLeads({
    source: sourceFilter && sourceFilter !== '_all' ? sourceFilter : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit: 50,
  });

  const pagination = data?.pagination;
  const leads = data?.leads ?? [];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{language === 'ar' ? 'عملاء Career DNA' : 'Career DNA Leads'}</h1>
        <p className="text-muted-foreground mt-1">
          {language === 'ar'
            ? 'أرقام الهواتف المجمعة من صفحات تحدي الأصدقاء ونتائج Career DNA'
            : 'Phone numbers collected from Challenge Friends and Career DNA result pages'}
        </p>
      </div>

      {(isError) && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            {language === 'ar' ? 'حدث خطأ في تحميل البيانات' : 'Error loading data'}: {(error as Error)?.message || 'Unknown error'}
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-wrap">
        <Select value={sourceFilter || '_all'} onValueChange={(v) => { setSourceFilter(v === '_all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={language === 'ar' ? 'المصدر' : 'Source'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
            <SelectItem value="squad">{language === 'ar' ? 'صفحة التحدي' : 'Squad / Challenge'}</SelectItem>
            <SelectItem value="result">{language === 'ar' ? 'صفحة النتيجة' : 'Result Page'}</SelectItem>
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
              <TableHead>{language === 'ar' ? 'الهاتف' : 'Phone'}</TableHead>
              <TableHead>{language === 'ar' ? 'البلد' : 'Country'}</TableHead>
              <TableHead>{language === 'ar' ? 'المصدر' : 'Source'}</TableHead>
              <TableHead>{language === 'ar' ? 'معرّف المصدر' : 'Source ID'}</TableHead>
              <TableHead>{language === 'ar' ? 'موافقة تسويقية' : 'Marketing Consent'}</TableHead>
              <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  {language === 'ar' ? 'لا توجد بيانات' : 'No leads found'}
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead: CareerDnaLead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {lead.phone}
                    </span>
                  </TableCell>
                  <TableCell>
                    {lead.countryCode ? (
                      <span className="flex items-center gap-1.5">
                        <span aria-hidden>{flagEmoji(lead.countryCode)}</span>
                        <span>{lead.countryCode}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={lead.source === 'squad' ? 'default' : 'secondary'}>
                      {lead.source === 'squad'
                        ? (language === 'ar' ? 'تحدي' : 'Squad')
                        : (language === 'ar' ? 'نتيجة' : 'Result')}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {lead.source === 'squad' ? (
                      <Link to={`/career-dna/squad/${lead.sourceId}`} className="text-primary hover:underline">
                        {lead.sourceId}
                      </Link>
                    ) : (
                      lead.sourceId
                    )}
                  </TableCell>
                  <TableCell>
                    {lead.consentMarketing ? (
                      <Badge variant="default">{language === 'ar' ? 'نعم' : 'Yes'}</Badge>
                    ) : (
                      <Badge variant="outline">{language === 'ar' ? 'لا' : 'No'}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(lead.createdAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
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
