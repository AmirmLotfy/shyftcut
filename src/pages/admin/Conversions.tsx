import { useState } from 'react';
import { useAdminConversions } from '@/hooks/useAdmin';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ConversionFunnel } from '@/components/admin/ConversionFunnel';
import { ConversionRates } from '@/components/admin/ConversionRates';
import { ConversionSources } from '@/components/admin/ConversionSources';

export function Conversions() {
  const { language } = useLanguage();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const { data, isLoading, isError, error } = useAdminConversions(startDate || undefined, endDate || undefined);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{language === 'ar' ? 'معدلات التحويل' : 'Conversion Analytics'}</h1>
        <p className="text-muted-foreground mt-1">{language === 'ar' ? 'تحليل قمع التحويل ومعدلات التحويل' : 'Conversion funnel and rate analysis'}</p>
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

      {/* Revenue Summary */}
      {data?.totalRevenue !== undefined && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}</p>
                <p className="text-3xl font-bold mt-1">${data.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversion Funnel */}
      {data?.funnel && (
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'قمع التحويل' : 'Conversion Funnel'}</CardTitle>
            <CardDescription>
              {language === 'ar' ? 'عدد المستخدمين في كل مرحلة من مراحل التحويل' : 'Number of users at each conversion stage'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConversionFunnel data={data.funnel} />
          </CardContent>
        </Card>
      )}

      {/* Conversion Rates */}
      {data?.funnel && (
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'معدلات التحويل' : 'Conversion Rates'}</CardTitle>
            <CardDescription>
              {language === 'ar' ? 'نسبة التحويل لكل مرحلة' : 'Conversion rate by stage'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConversionRates data={data.funnel} />
          </CardContent>
        </Card>
      )}

      {/* Conversions by Type and Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data?.conversionsByType && data.conversionsByType.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'التحويلات حسب النوع' : 'Conversions by Type'}</CardTitle>
              <CardDescription>{language === 'ar' ? 'توزيع أنواع التحويل' : 'Conversion type distribution'}</CardDescription>
            </CardHeader>
            <CardContent>
              <ConversionSources data={data.conversionsByType.map(c => ({ source: c.type, count: c.count }))} />
            </CardContent>
          </Card>
        )}

        {data?.conversionsByStage && data.conversionsByStage.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'التحويلات حسب المرحلة' : 'Conversions by Stage'}</CardTitle>
              <CardDescription>{language === 'ar' ? 'توزيع التحويلات حسب المرحلة' : 'Conversion stage distribution'}</CardDescription>
            </CardHeader>
            <CardContent>
              <ConversionSources data={data.conversionsByStage.map(c => ({ source: c.stage, count: c.count }))} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Conversions by Source and Campaign */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data?.conversionsBySource && data.conversionsBySource.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'التحويلات حسب المصدر' : 'Conversions by Source'}</CardTitle>
              <CardDescription>{language === 'ar' ? 'مصادر التحويل الأكثر فعالية' : 'Most effective conversion sources'}</CardDescription>
            </CardHeader>
            <CardContent>
              <ConversionSources data={data.conversionsBySource.map(c => ({ source: c.source, count: c.count }))} />
            </CardContent>
          </Card>
        )}

        {data?.conversionsByCampaign && data.conversionsByCampaign.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'التحويلات حسب الحملة' : 'Conversions by Campaign'}</CardTitle>
              <CardDescription>{language === 'ar' ? 'أداء الحملات' : 'Campaign performance'}</CardDescription>
            </CardHeader>
            <CardContent>
              <ConversionSources data={data.conversionsByCampaign.map(c => ({ source: c.campaign, count: c.count }))} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
