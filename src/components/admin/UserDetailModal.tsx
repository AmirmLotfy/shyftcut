import { useState } from 'react';
import { useAdminUser, useAdminUserJourney, useAdminUserNotes, useAdminUserTags, useUpdateAdminUserNotes, useUpdateAdminUserTags } from '@/hooks/useAdmin';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { UserActivityTimeline } from './UserActivityTimeline';
import { UserNotesEditor } from './UserNotesEditor';
import { UserTagsManager } from './UserTagsManager';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserDetailModalProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailModal({ userId, open, onOpenChange }: UserDetailModalProps) {
  const { language } = useLanguage();
  const { data: userData, isLoading: userLoading } = useAdminUser(userId || '');
  const { data: journeyData, isLoading: journeyLoading } = useAdminUserJourney(userId || '');
  const { data: notesData } = useAdminUserNotes(userId || '', { enabled: !!userId && open });
  const { data: tagsData } = useAdminUserTags(userId || '', { enabled: !!userId && open });

  if (!userId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="user-detail-desc">
        <DialogHeader>
          <DialogTitle>
            {userLoading ? (
              <Skeleton className="h-6 w-48" />
            ) : (
              userData?.profile?.display_name || userData?.profile?.email || 'User'
            )}
          </DialogTitle>
          <DialogDescription id="user-detail-desc">
            {language === 'ar' ? 'تفاصيل المستخدم والأنشطة' : 'User details and activity'}
          </DialogDescription>
        </DialogHeader>

        {userLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : userData ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">{language === 'ar' ? 'نظرة عامة' : 'Overview'}</TabsTrigger>
              <TabsTrigger value="journey">{language === 'ar' ? 'الرحلة' : 'Journey'}</TabsTrigger>
              <TabsTrigger value="notes">{language === 'ar' ? 'ملاحظات' : 'Notes'}</TabsTrigger>
              <TabsTrigger value="tags">{language === 'ar' ? 'العلامات' : 'Tags'}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</p>
                  <p className="font-medium">{userData.profile?.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الدور' : 'Role'}</p>
                  <Badge>{userData.profile?.role || 'user'}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الخطة' : 'Tier'}</p>
                  <Badge variant="outline">{userData.subscription?.tier || 'free'}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الحالة' : 'Status'}</p>
                  <Badge variant={userData.subscription?.status === 'active' ? 'default' : 'secondary'}>
                    {userData.subscription?.status || 'active'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'تاريخ الإنشاء' : 'Created'}</p>
                  <p>{new Date(userData.profile?.created_at || '').toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'خارطة الطريق' : 'Roadmaps'}</p>
                  <p>{userData.roadmaps?.length || 0}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="journey" className="mt-4">
              {journeyLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : journeyData ? (
                <UserActivityTimeline timeline={journeyData.timeline} />
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  {language === 'ar' ? 'لا توجد بيانات' : 'No journey data'}
                </p>
              )}
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <UserNotesEditor userId={userId} initialNotes={notesData?.notes || ''} />
            </TabsContent>

            <TabsContent value="tags" className="mt-4">
              <UserTagsManager userId={userId} initialTags={tagsData?.tags || []} />
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
