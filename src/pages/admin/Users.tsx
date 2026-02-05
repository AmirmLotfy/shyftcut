import { useState } from 'react';
import { Search, Filter, MoreVertical, Edit, Trash2, User, Ban } from 'lucide-react';
import { useAdminUsers, useAdminUserStats, useDeleteAdminUser, useUpdateAdminUser, AdminUser } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';

export function Users() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data, isLoading, isError, error } = useAdminUsers({ search, role: roleFilter || undefined, tier: tierFilter || undefined, status: statusFilter || undefined, page, limit: 50 });
  const { data: stats, isError: statsError } = useAdminUserStats();
  const deleteUser = useDeleteAdminUser();
  const updateUser = useUpdateAdminUser();

  const handleDelete = async (userId: string) => {
    try {
      await deleteUser.mutateAsync({ userId, cascade: true });
      toast({ title: language === 'ar' ? 'تم حذف المستخدم' : 'User deleted' });
      setDeleteUserId(null);
      setDeleteConfirm(false);
    } catch (error) {
      toast({ title: language === 'ar' ? 'خطأ' : 'Error', description: (error as Error).message, variant: 'destructive' });
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{language === 'ar' ? 'إدارة المستخدمين' : 'User Management'}</h1>
        <p className="text-muted-foreground mt-1">{language === 'ar' ? 'إدارة جميع مستخدمي المنصة' : 'Manage all platform users'}</p>
      </div>

      {/* Error State */}
      {isError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            {language === 'ar' ? 'حدث خطأ في تحميل البيانات' : 'Error loading data'}: {(error as Error)?.message || 'Unknown error'}
          </p>
        </div>
      )}

      {/* Stats Cards */}
      {stats && !statsError && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي المستخدمين' : 'Total Users'}</p>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">{language === 'ar' ? 'مستخدمون جدد (30 يوم)' : 'New Users (30d)'}</p>
            <p className="text-2xl font-bold mt-1">{stats.newUsersLast30Days}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">{language === 'ar' ? 'نشطون (7 أيام)' : 'Active (7d)'}</p>
            <p className="text-2xl font-bold mt-1">{stats.activeUsersLast7Days}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">{language === 'ar' ? 'Premium' : 'Premium'}</p>
            <p className="text-2xl font-bold mt-1">{stats.byTier.premium}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={language === 'ar' ? 'الدور' : 'Role'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="superadmin">Superadmin</SelectItem>
          </SelectContent>
        </Select>
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
              <TableHead>{language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
              <TableHead>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</TableHead>
              <TableHead>{language === 'ar' ? 'الدور' : 'Role'}</TableHead>
              <TableHead>{language === 'ar' ? 'الخطة' : 'Tier'}</TableHead>
              <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
              <TableHead>{language === 'ar' ? 'تاريخ الإنشاء' : 'Created'}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                </TableRow>
              ))
            ) : data?.users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {language === 'ar' ? 'لا توجد نتائج' : 'No results found'}
                </TableCell>
              </TableRow>
            ) : (
              data?.users.map((user: AdminUser) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.display_name || '-'}</TableCell>
                  <TableCell>{user.email || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'superadmin' ? 'default' : 'secondary'}>{user.role || 'user'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.subscriptions?.[0]?.tier || 'free'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.subscriptions?.[0]?.status === 'active' ? 'default' : 'secondary'}>
                      {user.subscriptions?.[0]?.status || 'active'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setDeleteUserId(user.user_id)} className="min-h-[44px]">
                          <Trash2 className="h-4 w-4 mr-2" />
                          {language === 'ar' ? 'حذف' : 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm && !!deleteUserId} onOpenChange={setDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}</DialogTitle>
            <DialogDescription>
              {language === 'ar' ? 'هل أنت متأكد من حذف هذا المستخدم؟ سيتم حذف جميع البيانات المرتبطة به.' : 'Are you sure you want to delete this user? All associated data will be deleted.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteConfirm(false); setDeleteUserId(null); }}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button variant="destructive" onClick={() => deleteUserId && handleDelete(deleteUserId)}>
              {language === 'ar' ? 'حذف' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
