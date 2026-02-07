import { useState, useEffect } from 'react';
import { useAdminFeatureFlags, useUpdateAdminFeatureFlags, useAdminMetaPixel, useUpdateAdminSetting } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function Settings() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { data, isLoading } = useAdminFeatureFlags();
  const updateFeatureFlags = useUpdateAdminFeatureFlags();
  const { data: metaPixelData, isLoading: isLoadingMetaPixel } = useAdminMetaPixel();
  const updateSetting = useUpdateAdminSetting();

  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({
    maintenance_mode: false,
    signups_enabled: true,
  });
  const [metaPixelId, setMetaPixelId] = useState('');

  // Update state when data loads
  useEffect(() => {
    if (data && !isLoading) {
      const newFlags: Record<string, boolean> = {};
      Object.keys(data.featureFlags).forEach((key) => {
        if (typeof data.featureFlags[key] === 'boolean') {
          newFlags[key] = data.featureFlags[key] as boolean;
        }
      });
      if (Object.keys(newFlags).length > 0) {
        setFeatureFlags(newFlags);
      }
    }
  }, [data, isLoading]);

  useEffect(() => {
    if (metaPixelData && !isLoadingMetaPixel) {
      setMetaPixelId(metaPixelData.metaPixelId || '');
    }
  }, [metaPixelData, isLoadingMetaPixel]);

  const handleSave = async () => {
    try {
      await updateFeatureFlags.mutateAsync(featureFlags);
      toast({ title: language === 'ar' ? 'تم الحفظ' : 'Settings saved' });
    } catch (error) {
      toast({ title: language === 'ar' ? 'خطأ' : 'Error', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleSaveMetaPixel = async () => {
    try {
      await updateSetting.mutateAsync({
        key: 'meta_pixel_id',
        value: metaPixelId.trim(),
        description: 'Meta Pixel (Facebook Pixel) ID for tracking',
      });
      toast({ title: language === 'ar' ? 'تم حفظ Meta Pixel ID' : 'Meta Pixel ID saved' });
      // Reload page to reinitialize pixel
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast({ title: language === 'ar' ? 'خطأ' : 'Error', description: (error as Error).message, variant: 'destructive' });
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{language === 'ar' ? 'الإعدادات' : 'Settings'}</h1>
        <p className="text-muted-foreground mt-1">{language === 'ar' ? 'إعدادات النظام والميزات' : 'System and feature settings'}</p>
      </div>

      <div className="space-y-6">
        {/* Feature Flags */}
        <div className="border rounded-lg p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold">{language === 'ar' ? 'علامات الميزات' : 'Feature Flags'}</h2>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="maintenance_mode">{language === 'ar' ? 'وضع الصيانة' : 'Maintenance Mode'}</Label>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'تعطيل الوصول العام للمنصة' : 'Disable public access to the platform'}
                  </p>
                </div>
                <Switch
                  id="maintenance_mode"
                  checked={featureFlags.maintenance_mode}
                  onCheckedChange={(checked) => setFeatureFlags((prev) => ({ ...prev, maintenance_mode: checked }))}
                  className="shrink-0"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="signups_enabled">{language === 'ar' ? 'تفعيل التسجيلات' : 'Enable Signups'}</Label>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'السماح للمستخدمين الجدد بالتسجيل' : 'Allow new users to sign up'}
                  </p>
                </div>
                <Switch
                  id="signups_enabled"
                  checked={featureFlags.signups_enabled}
                  onCheckedChange={(checked) => setFeatureFlags((prev) => ({ ...prev, signups_enabled: checked }))}
                  className="shrink-0"
                />
              </div>
            </>
          )}
        </div>

        {/* Rate Limits */}
        <div className="border rounded-lg p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold">{language === 'ar' ? 'حدود المعدل' : 'Rate Limits'}</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="guest_roadmaps">{language === 'ar' ? 'خارطة الطريق للضيوف (في الساعة)' : 'Guest Roadmaps (per hour)'}</Label>
              <Input id="guest_roadmaps" type="number" defaultValue={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chat_messages">{language === 'ar' ? 'رسائل الدردشة (في الدقيقة)' : 'Chat Messages (per minute)'}</Label>
              <Input id="chat_messages" type="number" defaultValue={10} />
            </div>
          </div>
        </div>

        {/* Meta Pixel Configuration */}
        <div className="border rounded-lg p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold">{language === 'ar' ? 'Meta Pixel' : 'Meta Pixel Configuration'}</h2>
          {isLoadingMetaPixel ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta_pixel_id">{language === 'ar' ? 'Meta Pixel ID' : 'Meta Pixel ID'}</Label>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' 
                    ? 'أدخل معرف Meta Pixel الخاص بك لتتبع الأحداث والتحويلات' 
                    : 'Enter your Meta Pixel ID to track events and conversions'}
                </p>
                <Input
                  id="meta_pixel_id"
                  type="text"
                  placeholder={language === 'ar' ? 'مثال: 123456789012345' : 'e.g., 123456789012345'}
                  value={metaPixelId}
                  onChange={(e) => setMetaPixelId(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleSaveMetaPixel} 
                disabled={updateSetting.isPending} 
                className="min-h-[44px]"
              >
                {updateSetting.isPending 
                  ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
                  : (language === 'ar' ? 'حفظ Meta Pixel ID' : 'Save Meta Pixel ID')}
              </Button>
            </div>
          )}
        </div>

        <Button onClick={handleSave} disabled={updateFeatureFlags.isPending} className="min-h-[44px]">
          {updateFeatureFlags.isPending ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ' : 'Save')}
        </Button>
      </div>
    </div>
  );
}
