import { useState } from 'react';
import { useAdminUserJourneys } from '@/hooks/useAdmin';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserFlowDiagram } from '@/components/admin/UserFlowDiagram';
import { DropoffAnalysis } from '@/components/admin/DropoffAnalysis';
import { FunnelAnalysis } from '@/components/admin/FunnelAnalysis';

export function UserJourney() {
  const { language } = useLanguage();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const { data, isLoading, isError, error } = useAdminUserJourneys(startDate || undefined, endDate || undefined);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{language === 'ar' ? 'رحلات المستخدم' : 'User Journeys'}</h1>
        <p className="text-muted-foreground mt-1">{language === 'ar' ? 'تحليل تدفق المستخدمين ونقاط الانقطاع' : 'User flow and drop-off analysis'}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          placeholder={language === 'ar' ? 'تاريخ البدء' : 'Start Date'}
          className="w-full sm:w-[200px]"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          placeholder={language === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}
          className="w-full sm:w-[200px]"
        />
        <Button
          variant="outline"
          onClick={() => {
            setStartDate('');
            setEndDate('');
          }}
          className="min-h-[44px]"
        >
          {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
        </Button>
      </div>

      {/* Error State */}
      {isError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            {language === 'ar' ? 'حدث خطأ في تحميل البيانات' : 'Error loading data'}: {(error as Error)?.message || 'Unknown error'}
          </p>
        </div>
      )}

      {/* Funnel Analysis */}
      {data?.funnel && (
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'تحليل القمع' : 'Funnel Analysis'}</CardTitle>
            <CardDescription>
              {language === 'ar' ? 'عدد المستخدمين ونقاط الانقطاع في كل مرحلة' : 'User count and drop-off points at each stage'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FunnelAnalysis data={data.funnel} />
          </CardContent>
        </Card>
      )}

      {/* User Flow Diagram */}
      {data?.flow && data.flow.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'مخطط التدفق' : 'User Flow Diagram'}</CardTitle>
            <CardDescription>
              {language === 'ar' ? 'المسارات الأكثر شيوعاً بين الصفحات' : 'Most common paths between pages'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserFlowDiagram data={data.flow} />
          </CardContent>
        </Card>
      )}

      {/* Drop-off Analysis */}
      {data?.dropOffPoints && data.dropOffPoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'تحليل نقاط الانقطاع' : 'Drop-off Analysis'}</CardTitle>
            <CardDescription>
              {language === 'ar' ? 'الصفحات التي ينقطع عندها المستخدمون' : 'Pages where users drop off'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DropoffAnalysis data={data.dropOffPoints} />
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[400px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
