import { useState } from 'react';
import { useBulkUserAction } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Trash2, Tag, CreditCard } from 'lucide-react';

interface BulkActionsProps {
  selectedUserIds: string[];
  onComplete: () => void;
}

export function BulkActions({ selectedUserIds, onComplete }: BulkActionsProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [action, setAction] = useState<string>('');
  const [actionData, setActionData] = useState<Record<string, unknown>>({});
  const [open, setOpen] = useState(false);
  const bulkAction = useBulkUserAction();

  const handleExecute = async () => {
    if (!action || selectedUserIds.length === 0) return;

    try {
      const result = await bulkAction.mutateAsync({
        user_ids: selectedUserIds,
        action,
        data: actionData,
      });

      const successCount = result.results.filter(r => r.success).length;
      const failCount = result.results.filter(r => !r.success).length;

      toast({
        title: language === 'ar' ? 'اكتمل' : 'Complete',
        description: language === 'ar'
          ? `نجح ${successCount}، فشل ${failCount}`
          : `${successCount} succeeded, ${failCount} failed`,
      });

      setOpen(false);
      setAction('');
      setActionData({});
      onComplete();
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={selectedUserIds.length === 0}
      >
        {language === 'ar' ? 'إجراءات مجمعة' : 'Bulk Actions'}
        {selectedUserIds.length > 0 && ` (${selectedUserIds.length})`}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'إجراءات مجمعة' : 'Bulk Actions'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar'
                ? `تطبيق إجراء على ${selectedUserIds.length} مستخدم`
                : `Apply action to ${selectedUserIds.length} users`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'ar' ? 'اختر الإجراء' : 'Select action'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="delete">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    {language === 'ar' ? 'حذف' : 'Delete'}
                  </div>
                </SelectItem>
                <SelectItem value="update_tier">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    {language === 'ar' ? 'تحديث الخطة' : 'Update Tier'}
                  </div>
                </SelectItem>
                <SelectItem value="add_tags">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    {language === 'ar' ? 'إضافة علامات' : 'Add Tags'}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {action === 'update_tier' && (
              <Select
                value={actionData.tier as string || ''}
                onValueChange={(v) => setActionData({ ...actionData, tier: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'اختر الخطة' : 'Select tier'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            )}

            {action === 'add_tags' && (
              <Input
                placeholder={language === 'ar' ? 'علامات مفصولة بفواصل' : 'Tags separated by commas'}
                value={(actionData.tags as string[])?.join(',') || ''}
                onChange={(e) => setActionData({
                  ...actionData,
                  tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean),
                })}
              />
            )}

            {action === 'delete' && (
              <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                <p className="text-sm text-destructive">
                  {language === 'ar'
                    ? 'سيتم حذف جميع المستخدمين المحددين وبياناتهم المرتبطة'
                    : 'All selected users and their associated data will be deleted'}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleExecute}
              disabled={!action || bulkAction.isPending}
              variant={action === 'delete' ? 'destructive' : 'default'}
            >
              {language === 'ar' ? 'تنفيذ' : 'Execute'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
