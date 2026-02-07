import { useState } from 'react';
import { useAdminAuditLog, AdminAuditLog } from '@/hooks/useAdmin';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AuditLog() {
  const { language } = useLanguage();
  const [actionFilter, setActionFilter] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useAdminAuditLog({
    action: actionFilter || undefined,
    resourceType: resourceTypeFilter || undefined,
    page,
    limit: 50,
  });

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{language === 'ar' ? 'سجل التدقيق' : 'Audit Log'}</h1>
        <p className="text-muted-foreground mt-1">{language === 'ar' ? 'سجل جميع إجراءات المسؤولين' : 'Log of all admin actions'}</p>
      </div>

      {/* Error State */}
      {isError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            {language === 'ar' ? 'حدث خطأ في تحميل البيانات' : 'Error loading data'}: {(error as Error)?.message || 'Unknown error'}
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <Select value={actionFilter || '_all'} onValueChange={(v) => setActionFilter(v === '_all' ? '' : v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={language === 'ar' ? 'الإجراء' : 'Action'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
            <SelectItem value="list_users">List Users</SelectItem>
            <SelectItem value="update_user">Update User</SelectItem>
            <SelectItem value="delete_user">Delete User</SelectItem>
            <SelectItem value="view_subscription">View Subscription</SelectItem>
            <SelectItem value="update_subscription">Update Subscription</SelectItem>
            <SelectItem value="view_analytics">View Analytics</SelectItem>
            <SelectItem value="update_setting">Update Setting</SelectItem>
          </SelectContent>
        </Select>
        <Select value={resourceTypeFilter || '_all'} onValueChange={(v) => setResourceTypeFilter(v === '_all' ? '' : v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={language === 'ar' ? 'نوع المورد' : 'Resource Type'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
            <SelectItem value="users">Users</SelectItem>
            <SelectItem value="subscriptions">Subscriptions</SelectItem>
            <SelectItem value="settings">Settings</SelectItem>
            <SelectItem value="analytics">Analytics</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === 'ar' ? 'التاريخ والوقت' : 'Date & Time'}</TableHead>
              <TableHead>{language === 'ar' ? 'المسؤول' : 'Admin'}</TableHead>
              <TableHead>{language === 'ar' ? 'الإجراء' : 'Action'}</TableHead>
              <TableHead>{language === 'ar' ? 'نوع المورد' : 'Resource Type'}</TableHead>
              <TableHead>{language === 'ar' ? 'المعرف' : 'Resource ID'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                </TableRow>
              ))
            ) : data?.logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {language === 'ar' ? 'لا توجد نتائج' : 'No results found'}
                </TableCell>
              </TableRow>
            ) : (
              data?.logs.map((log: AdminAuditLog) => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    {(log.profiles as { display_name?: string; email?: string })?.display_name ||
                      (log.profiles as { email?: string })?.email ||
                      '-'}
                  </TableCell>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell>{log.resource_type}</TableCell>
                  <TableCell className="font-mono text-xs">{log.resource_id?.slice(0, 8) || '-'}</TableCell>
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
