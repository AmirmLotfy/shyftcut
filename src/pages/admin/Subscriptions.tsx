import { useState } from 'react';
import { useAdminSubscriptions, useAdminRevenue, AdminSubscription } from '@/hooks/useAdmin';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { SubscriptionDetailModal } from '@/components/admin/SubscriptionDetailModal';
import { ChurnAnalysis } from '@/components/admin/ChurnAnalysis';

export default function Subscriptions() {
  const { language } = useLanguage();
  const [tierFilter, setTierFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [detailSubscription, setDetailSubscription] = useState<AdminSubscription | null>(null);
  const [churnStartDate, setChurnStartDate] = useState('');
  const [churnEndDate, setChurnEndDate] = useState('');

  const { data, isLoading, isError, error } = useAdminSubscriptions({ 
    tier: tierFilter && tierFilter !== '_all' && tierFilter !== '_paid' ? tierFilter : undefined, 
    status: statusFilter && statusFilter !== '_all' ? statusFilter : undefined, 
    includeAll: tierFilter === '_all',
    page, 
    limit: 50 
  });
  const { data: revenue, isError: revenueError } = useAdminRevenue();

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{language === 'ar' ? 'إدارة الاشتراكات' : 'Subscription Management'}</h1>
        <p className="text-muted-foreground mt-1">{language === 'ar' ? 'إدارة جميع اشتراكات المستخدمين' : 'Manage all user subscriptions'}</p>
      </div>

      {/* Error State */}
      {(isError || revenueError) && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            {language === 'ar' ? 'حدث خطأ في تحميل البيانات' : 'Error loading data'}: {(error as Error)?.message || 'Unknown error'}
          </p>
        </div>
      )}

      {/* Revenue Cards */}
      {revenue && !revenueError && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الإيرادات الشهرية المتكررة' : 'Monthly Recurring Revenue'}</p>
            <p className="text-2xl font-bold mt-1">${revenue.mrr.toFixed(2)}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الإيرادات السنوية المتكررة' : 'Annual Recurring Revenue'}</p>
            <p className="text-2xl font-bold mt-1">${revenue.arr.toFixed(2)}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الاشتراكات النشطة' : 'Active Subscriptions'}</p>
            <p className="text-2xl font-bold mt-1">{revenue.activeSubscriptions}</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="subscriptions" className="w-full">
        <TabsList>
          <TabsTrigger value="subscriptions">{language === 'ar' ? 'الاشتراكات' : 'Subscriptions'}</TabsTrigger>
          <TabsTrigger value="churn">{language === 'ar' ? 'تحليل التسرب' : 'Churn Analysis'}</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-4 sm:space-y-6 mt-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <Select value={tierFilter || '_paid'} onValueChange={(v) => setTierFilter(v === '_paid' ? '' : v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={language === 'ar' ? 'الخطة' : 'Tier'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_paid">{language === 'ar' ? 'المدفوع فقط' : 'Paid Only'}</SelectItem>
            <SelectItem value="_all">{language === 'ar' ? 'الكل (بما في ذلك مجاني)' : 'All (Including Free)'}</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter || '_all'} onValueChange={(v) => setStatusFilter(v === '_all' ? '' : v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={language === 'ar' ? 'الحالة' : 'Status'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === 'ar' ? 'المستخدم' : 'User'}</TableHead>
              <TableHead>{language === 'ar' ? 'الخطة' : 'Tier'}</TableHead>
              <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
              <TableHead>{language === 'ar' ? 'تاريخ البدء' : 'Start Date'}</TableHead>
              <TableHead>{language === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))
            ) : data?.subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {language === 'ar' ? 'لا توجد نتائج' : 'No results found'}
                </TableCell>
              </TableRow>
            ) : (
              data?.subscriptions.map((sub: AdminSubscription) => (
                <TableRow
                  key={sub.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setDetailSubscription(sub)}
                >
                  <TableCell className="font-medium">
                    {(sub.profiles as { display_name?: string; email?: string })?.display_name || (sub.profiles as { email?: string })?.email || '-'}
                  </TableCell>
                  <TableCell><Badge variant="outline">{sub.tier}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>{sub.status}</Badge>
                  </TableCell>
                  <TableCell>{sub.current_period_start ? new Date(sub.current_period_start).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {language === 'ar' ? 'عرض' : 'Showing'} {((page - 1) * 50) + 1} - {Math.min(page * 50, data.pagination.total)} {language === 'ar' ? 'من' : 'of'} {data.pagination.total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)} className="min-h-[44px]">
              {language === 'ar' ? 'السابق' : 'Previous'}
            </Button>
            <Button variant="outline" size="sm" disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)} className="min-h-[44px]">
              {language === 'ar' ? 'التالي' : 'Next'}
            </Button>
          </div>
        </div>
      )}
        </TabsContent>

        <TabsContent value="churn" className="mt-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <input
                type="date"
                value={churnStartDate}
                onChange={(e) => setChurnStartDate(e.target.value)}
                className="px-3 py-2 border rounded-md"
                placeholder={language === 'ar' ? 'تاريخ البدء' : 'Start Date'}
              />
              <input
                type="date"
                value={churnEndDate}
                onChange={(e) => setChurnEndDate(e.target.value)}
                className="px-3 py-2 border rounded-md"
                placeholder={language === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}
              />
            </div>
            <ChurnAnalysis
              startDate={churnStartDate || undefined}
              endDate={churnEndDate || undefined}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Subscription Detail Modal */}
      <SubscriptionDetailModal
        subscription={detailSubscription}
        open={!!detailSubscription}
        onOpenChange={(open) => !open && setDetailSubscription(null)}
      />
    </div>
  );
}
