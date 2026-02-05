import { useState } from 'react';
import { useAdminSubscriptions, useAdminRevenue, AdminSubscription } from '@/hooks/useAdmin';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';

export function Subscriptions() {
  const { language } = useLanguage();
  const [tierFilter, setTierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useAdminSubscriptions({ tier: tierFilter || undefined, status: statusFilter || undefined, page, limit: 50 });
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={language === 'ar' ? 'الخطة' : 'Tier'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={language === 'ar' ? 'الحالة' : 'Status'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
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
                <TableRow key={sub.id}>
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
    </div>
  );
}
