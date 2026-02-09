import { useState } from 'react';
import { Search, MoreVertical, Edit, Trash2, User, Ban, Eye, Download, UserPlus } from 'lucide-react';
import { useAdminUsers, useAdminUserStats, useDeleteAdminUser, useUpdateAdminUser, useCreateAdminUser, useInviteAdminUser, AdminUser } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Checkbox as UICheckbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { UserDetailModal } from '@/components/admin/UserDetailModal';
import { BulkActions } from '@/components/admin/BulkActions';

export default function Users() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { getAccessToken } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createDisplayName, setCreateDisplayName] = useState('');
  const [createTier, setCreateTier] = useState<'free' | 'premium'>('free');
  const [createPeriod, setCreatePeriod] = useState<'1_month' | '1_year'>('1_year');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDisplayName, setInviteDisplayName] = useState('');
  const [inviteTier, setInviteTier] = useState<'free' | 'premium'>('premium');
  const [invitePeriod, setInvitePeriod] = useState<'1_month' | '1_year'>('1_year');

  const { data, isLoading, isError, error } = useAdminUsers({ search, role: roleFilter || undefined, tier: tierFilter || undefined, status: statusFilter || undefined, page, limit: 50 });
  const { data: stats, isError: statsError } = useAdminUserStats();
  const deleteUser = useDeleteAdminUser();
  const updateUser = useUpdateAdminUser();
  const createUser = useCreateAdminUser();
  const inviteUser = useInviteAdminUser();

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

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center flex-1">
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
        <Select value={roleFilter || '_all'} onValueChange={(v) => setRoleFilter(v === '_all' ? '' : v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={language === 'ar' ? 'الدور' : 'Role'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="superadmin">Superadmin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tierFilter || '_all'} onValueChange={(v) => setTierFilter(v === '_all' ? '' : v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={language === 'ar' ? 'الخطة' : 'Tier'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
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
        <div className="flex gap-2">
          <Button onClick={() => setAddUserOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'إضافة مستخدم' : 'Add user'}
          </Button>
          <BulkActions
            selectedUserIds={selectedUserIds}
            onComplete={() => {
              setSelectedUserIds([]);
              setPage(1);
            }}
          />
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const token = await getAccessToken();
                const params = new URLSearchParams();
                if (tierFilter) params.set('tier', tierFilter);
                if (statusFilter) params.set('status', statusFilter);
                params.set('format', 'csv');
                
                const { apiPath, apiHeaders } = await import('@/lib/api');
                const response = await fetch(apiPath(`/api/admin/users/export?${params.toString()}`), {
                  headers: apiHeaders('/api/admin/users/export', token),
                });
                
                if (response.ok) {
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                  toast({
                    title: language === 'ar' ? 'تم التصدير' : 'Exported',
                    description: language === 'ar' ? 'تم تصدير البيانات بنجاح' : 'Data exported successfully',
                  });
                }
              } catch (error) {
                toast({
                  title: language === 'ar' ? 'خطأ' : 'Error',
                  description: (error as Error).message,
                  variant: 'destructive',
                });
              }
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'تصدير' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <UICheckbox
                  checked={selectedUserIds.length === data?.users.length && data.users.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedUserIds(data?.users.map(u => u.user_id) || []);
                    } else {
                      setSelectedUserIds([]);
                    }
                  }}
                />
              </TableHead>
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
                  <TableCell>
                    <UICheckbox
                      checked={selectedUserIds.includes(user.user_id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedUserIds([...selectedUserIds, user.user_id]);
                        } else {
                          setSelectedUserIds(selectedUserIds.filter(id => id !== user.user_id));
                        }
                      }}
                    />
                  </TableCell>
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
                        <DropdownMenuItem onClick={() => setDetailUserId(user.user_id)} className="min-h-[44px]">
                          <Eye className="h-4 w-4 mr-2" />
                          {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                        </DropdownMenuItem>
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
        <DialogContent aria-describedby="users-delete-desc">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}</DialogTitle>
            <DialogDescription id="users-delete-desc">
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

      {/* Add User Dialog */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby="users-add-desc">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'إضافة مستخدم' : 'Add user'}</DialogTitle>
            <DialogDescription id="users-add-desc">
              {language === 'ar' ? 'إنشاء حساب مباشر أو إرسال دعوة بالبريد الإلكتروني.' : 'Create an account directly or send an email invitation.'}
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">{language === 'ar' ? 'إنشاء مباشر' : 'Direct add'}</TabsTrigger>
              <TabsTrigger value="invite">{language === 'ar' ? 'إرسال دعوة' : 'Invite'}</TabsTrigger>
            </TabsList>
            <TabsContent value="create" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                <Input type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} placeholder="user@example.com" />
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'كلمة المرور' : 'Password'}</Label>
                <Input type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} placeholder="••••••••" minLength={6} />
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الاسم (اختياري)' : 'Display name (optional)'}</Label>
                <Input value={createDisplayName} onChange={(e) => setCreateDisplayName(e.target.value)} placeholder={language === 'ar' ? 'الاسم' : 'Name'} />
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الخطة' : 'Tier'}</Label>
                <Select value={createTier} onValueChange={(v) => setCreateTier(v as 'free' | 'premium')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {createTier === 'premium' && (
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'مدة البريميوم' : 'Premium period'}</Label>
                  <Select value={createPeriod} onValueChange={(v) => setCreatePeriod(v as '1_month' | '1_year')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1_month">{language === 'ar' ? 'شهر واحد' : '1 month'}</SelectItem>
                      <SelectItem value="1_year">{language === 'ar' ? 'سنة واحدة' : '1 year'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddUserOpen(false)}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
                <Button
                  disabled={!createEmail.trim() || createPassword.length < 6 || createUser.isPending}
                  onClick={async () => {
                    try {
                      await createUser.mutateAsync({ email: createEmail.trim(), password: createPassword, display_name: createDisplayName.trim() || undefined, tier: createTier, period: createTier === 'premium' ? createPeriod : undefined });
                      toast({ title: language === 'ar' ? 'تم إنشاء المستخدم' : 'User created', description: `${createEmail.trim()} (${createTier}${createTier === 'premium' ? `, ${createPeriod === '1_month' ? (language === 'ar' ? 'شهر' : '1 mo') : language === 'ar' ? 'سنة' : '1 yr'}` : ''})` });
                      setAddUserOpen(false);
                      setCreateEmail(''); setCreatePassword(''); setCreateDisplayName(''); setCreateTier('free'); setCreatePeriod('1_year');
                    } catch (err) {
                      toast({ title: language === 'ar' ? 'خطأ' : 'Error', description: (err as Error).message, variant: 'destructive' });
                    }
                  }}
                >
                  {createUser.isPending ? (language === 'ar' ? 'جاري...' : 'Creating...') : (language === 'ar' ? 'إنشاء' : 'Create')}
                </Button>
              </DialogFooter>
            </TabsContent>
            <TabsContent value="invite" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="user@example.com" />
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الاسم (اختياري)' : 'Display name (optional)'}</Label>
                <Input value={inviteDisplayName} onChange={(e) => setInviteDisplayName(e.target.value)} placeholder={language === 'ar' ? 'الاسم' : 'Name'} />
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الخطة' : 'Tier'}</Label>
                <Select value={inviteTier} onValueChange={(v) => setInviteTier(v as 'free' | 'premium')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {inviteTier === 'premium' && (
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'مدة البريميوم' : 'Premium period'}</Label>
                  <Select value={invitePeriod} onValueChange={(v) => setInvitePeriod(v as '1_month' | '1_year')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1_month">{language === 'ar' ? 'شهر واحد' : '1 month'}</SelectItem>
                      <SelectItem value="1_year">{language === 'ar' ? 'سنة واحدة' : '1 year'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddUserOpen(false)}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
                <Button
                  disabled={!inviteEmail.trim() || inviteUser.isPending}
                  onClick={async () => {
                    try {
                      await inviteUser.mutateAsync({ email: inviteEmail.trim(), tier: inviteTier, display_name: inviteDisplayName.trim() || undefined, period: inviteTier === 'premium' ? invitePeriod : undefined });
                      toast({ title: language === 'ar' ? 'تم إرسال الدعوة' : 'Invitation sent', description: `${language === 'ar' ? 'تم إرسال الدعوة إلى' : 'Invitation sent to'} ${inviteEmail.trim()} (${inviteTier}${inviteTier === 'premium' ? `, ${invitePeriod === '1_month' ? (language === 'ar' ? 'شهر' : '1 mo') : language === 'ar' ? 'سنة' : '1 yr'}` : ''})` });
                      setAddUserOpen(false);
                      setInviteEmail(''); setInviteDisplayName(''); setInviteTier('premium'); setInvitePeriod('1_year');
                    } catch (err) {
                      toast({ title: language === 'ar' ? 'خطأ' : 'Error', description: (err as Error).message, variant: 'destructive' });
                    }
                  }}
                >
                  {inviteUser.isPending ? (language === 'ar' ? 'جاري الإرسال...' : 'Sending...') : (language === 'ar' ? 'إرسال دعوة' : 'Send invite')}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* User Detail Modal */}
      <UserDetailModal
        userId={detailUserId}
        open={!!detailUserId}
        onOpenChange={(open) => !open && setDetailUserId(null)}
      />
    </div>
  );
}
