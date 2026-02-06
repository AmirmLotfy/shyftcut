import { useState } from 'react';
import { useManualSubscriptionUpdate, AdminSubscription } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Save } from 'lucide-react';

interface ManualSubscriptionUpdateProps {
  subscription: AdminSubscription;
}

export function ManualSubscriptionUpdate({ subscription }: ManualSubscriptionUpdateProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [tier, setTier] = useState(subscription.tier);
  const [status, setStatus] = useState(subscription.status);
  const [currentPeriodStart, setCurrentPeriodStart] = useState(
    subscription.current_period_start ? new Date(subscription.current_period_start).toISOString().split('T')[0] : ''
  );
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState(
    subscription.current_period_end ? new Date(subscription.current_period_end).toISOString().split('T')[0] : ''
  );
  const [reason, setReason] = useState('');
  const updateSubscription = useManualSubscriptionUpdate();

  const handleSave = async () => {
    try {
      await updateSubscription.mutateAsync({
        subscriptionId: subscription.id,
        updates: {
          tier: tier !== subscription.tier ? tier : undefined,
          status: status !== subscription.status ? status : undefined,
          current_period_start: currentPeriodStart || undefined,
          current_period_end: currentPeriodEnd || undefined,
          reason: reason || undefined,
        },
      });
      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Updated',
        description: language === 'ar' ? 'تم تحديث الاشتراك بنجاح' : 'Subscription updated successfully',
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{language === 'ar' ? 'الخطة' : 'Tier'}</Label>
          <Select value={tier} onValueChange={setTier}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{language === 'ar' ? 'الحالة' : 'Status'}</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
              <SelectItem value="past_due">Past Due</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{language === 'ar' ? 'تاريخ بدء الفترة' : 'Period Start'}</Label>
          <Input
            type="date"
            value={currentPeriodStart}
            onChange={(e) => setCurrentPeriodStart(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>{language === 'ar' ? 'تاريخ انتهاء الفترة' : 'Period End'}</Label>
          <Input
            type="date"
            value={currentPeriodEnd}
            onChange={(e) => setCurrentPeriodEnd(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>{language === 'ar' ? 'السبب (اختياري)' : 'Reason (Optional)'}</Label>
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={language === 'ar' ? 'سبب التحديث...' : 'Update reason...'}
        />
      </div>
      <Button onClick={handleSave} disabled={updateSubscription.isPending}>
        <Save className="h-4 w-4 mr-2" />
        {language === 'ar' ? 'حفظ' : 'Save'}
      </Button>
    </div>
  );
}
