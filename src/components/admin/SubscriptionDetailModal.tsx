import { useState } from 'react';
import { useAdminSubscriptionEvents, useManualSubscriptionUpdate, AdminSubscription } from '@/hooks/useAdmin';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { SubscriptionEventsTimeline } from './SubscriptionEventsTimeline';
import { ManualSubscriptionUpdate } from './ManualSubscriptionUpdate';
import { useLanguage } from '@/contexts/LanguageContext';

interface SubscriptionDetailModalProps {
  subscription: AdminSubscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionDetailModal({ subscription, open, onOpenChange }: SubscriptionDetailModalProps) {
  const { language } = useLanguage();
  const { data: eventsData, isLoading: eventsLoading } = useAdminSubscriptionEvents(subscription?.id || '');

  if (!subscription) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="subscription-detail-desc">
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? 'تفاصيل الاشتراك' : 'Subscription Details'}
          </DialogTitle>
          <DialogDescription id="subscription-detail-desc">
            {subscription.profiles?.display_name || subscription.profiles?.email || 'User'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">{language === 'ar' ? 'نظرة عامة' : 'Overview'}</TabsTrigger>
            <TabsTrigger value="events">{language === 'ar' ? 'الأحداث' : 'Events'}</TabsTrigger>
            <TabsTrigger value="update">{language === 'ar' ? 'تحديث يدوي' : 'Manual Update'}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الخطة' : 'Tier'}</p>
                <Badge variant="outline">{subscription.tier}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الحالة' : 'Status'}</p>
                <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                  {subscription.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'تاريخ البدء' : 'Period Start'}</p>
                <p>{subscription.current_period_start ? new Date(subscription.current_period_start).toLocaleString() : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'تاريخ الانتهاء' : 'Period End'}</p>
                <p>{subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleString() : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'تاريخ الإنشاء' : 'Created'}</p>
                <p>{new Date(subscription.created_at).toLocaleString()}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="events" className="mt-4">
            {eventsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : eventsData ? (
              <SubscriptionEventsTimeline events={eventsData.events} />
            ) : (
              <p className="text-muted-foreground text-center py-8">
                {language === 'ar' ? 'لا توجد أحداث' : 'No events'}
              </p>
            )}
          </TabsContent>

          <TabsContent value="update" className="mt-4">
            <ManualSubscriptionUpdate subscription={subscription} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
