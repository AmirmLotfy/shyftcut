import { useState } from 'react';
import { useAdminTraffic } from '@/hooks/useAdmin';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TrafficChart } from '@/components/admin/TrafficChart';
import { TopPagesTable } from '@/components/admin/TopPagesTable';
import { ReferrerChart } from '@/components/admin/ReferrerChart';
import { SessionMetrics } from '@/components/admin/SessionMetrics';

export default function Traffic() {
  const { language } = useLanguage();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupBy, setGroupBy] = useState('day');
  
  const { data, isLoading, isError, error } = useAdminTraffic(startDate || undefined, endDate || undefined);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{language === 'ar' ? 'حركة المرور' : 'Traffic Analytics'}</h1>
        <p className="text-muted-foreground mt-1">{language === 'ar' ? 'تحليل حركة المرور والجلسات' : 'Traffic and session analysis'}</p>
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
        <Select value={groupBy} onValueChange={setGroupBy}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hour">{language === 'ar' ? 'ساعة' : 'Hour'}</SelectItem>
            <SelectItem value="day">{language === 'ar' ? 'يوم' : 'Day'}</SelectItem>
            <SelectItem value="week">{language === 'ar' ? 'أسبوع' : 'Week'}</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => {
            setStartDate('');
            setEndDate('');
            setGroupBy('day');
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

      {/* Session Metrics */}
      {data?.sessionMetrics && (
        <SessionMetrics metrics={data.sessionMetrics} />
      )}

      {/* Traffic Chart */}
      {data?.timeSeries && (
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'حركة المرور بمرور الوقت' : 'Traffic Over Time'}</CardTitle>
            <CardDescription>
              {language === 'ar' ? 'عدد مشاهدات الصفحة حسب الفترة الزمنية' : 'Page views by time period'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TrafficChart data={data.timeSeries} />
          </CardContent>
        </Card>
      )}

      {/* Top Pages and Referrers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data?.topPages && (
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'أهم الصفحات' : 'Top Pages'}</CardTitle>
              <CardDescription>{language === 'ar' ? 'الصفحات الأكثر زيارة' : 'Most visited pages'}</CardDescription>
            </CardHeader>
            <CardContent>
              <TopPagesTable data={data.topPages} />
            </CardContent>
          </Card>
        )}

        {data?.referrers && (
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'مصادر الإحالة' : 'Referrer Sources'}</CardTitle>
              <CardDescription>{language === 'ar' ? 'المصادر الأكثر شيوعاً' : 'Most common referrers'}</CardDescription>
            </CardHeader>
            <CardContent>
              <ReferrerChart data={data.referrers} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* UTM Campaigns and Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data?.utmSources && data.utmSources.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'مصادر UTM' : 'UTM Sources'}</CardTitle>
              <CardDescription>{language === 'ar' ? 'أداء الحملات حسب المصدر' : 'Campaign performance by source'}</CardDescription>
            </CardHeader>
            <CardContent>
              <ReferrerChart data={data.utmSources.map(s => ({ domain: s.source, count: s.count }))} />
            </CardContent>
          </Card>
        )}

        {data?.utmCampaigns && data.utmCampaigns.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'حملات UTM' : 'UTM Campaigns'}</CardTitle>
              <CardDescription>{language === 'ar' ? 'أداء الحملات' : 'Campaign performance'}</CardDescription>
            </CardHeader>
            <CardContent>
              <ReferrerChart data={data.utmCampaigns.map(c => ({ domain: c.campaign, count: c.count }))} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Devices and Browsers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data?.devices && data.devices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'الأجهزة' : 'Devices'}</CardTitle>
              <CardDescription>{language === 'ar' ? 'توزيع الأجهزة' : 'Device distribution'}</CardDescription>
            </CardHeader>
            <CardContent>
              <ReferrerChart data={data.devices.map(d => ({ domain: d.device, count: d.count }))} />
            </CardContent>
          </Card>
        )}

        {data?.browsers && data.browsers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'المتصفحات' : 'Browsers'}</CardTitle>
              <CardDescription>{language === 'ar' ? 'توزيع المتصفحات' : 'Browser distribution'}</CardDescription>
            </CardHeader>
            <CardContent>
              <ReferrerChart data={data.browsers.map(b => ({ domain: b.browser, count: b.count }))} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Countries */}
      {data?.countries && data.countries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'الدول' : 'Countries'}</CardTitle>
            <CardDescription>{language === 'ar' ? 'توزيع الزوار حسب الدولة' : 'Visitor distribution by country'}</CardDescription>
          </CardHeader>
          <CardContent>
            <ReferrerChart data={data.countries.map(c => ({ domain: c.country, count: c.count }))} />
          </CardContent>
        </Card>
      )}

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
