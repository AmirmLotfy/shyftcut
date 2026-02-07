import { useAdminAnalytics, useAdminInsights } from '@/hooks/useAdmin';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WeeklyInsights as WeeklyInsightsComponent } from '@/components/admin/WeeklyInsights';
import { UserGrowthChart } from '@/components/admin/UserGrowthChart';
import { SubscriptionPieChart } from '@/components/admin/SubscriptionPieChart';
import { RevenueAreaChart } from '@/components/admin/RevenueAreaChart';
import { EngagementBarChart } from '@/components/admin/EngagementBarChart';

export default function Analytics() {
  const { language } = useLanguage();
  const { data, isLoading, isError, error } = useAdminAnalytics();
  const { data: insightsData, isError: insightsError } = useAdminInsights();

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{language === 'ar' ? 'التحليلات' : 'Analytics'}</h1>
        <p className="text-muted-foreground mt-1">{language === 'ar' ? 'نظرة عامة على أداء المنصة' : 'Platform performance overview'}</p>
      </div>

      {/* Error State */}
      {(isError || insightsError) && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            {language === 'ar' ? 'حدث خطأ في تحميل البيانات' : 'Error loading data'}: {(error as Error)?.message || 'Unknown error'}
          </p>
        </div>
      )}

      {/* Weekly Insights */}
      {insightsData && !insightsError && <WeeklyInsightsComponent />}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 border rounded-lg">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))
        ) : data ? (
          <>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي المستخدمين' : 'Total Users'}</p>
                <p className="text-2xl font-bold mt-1">{data.users.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'مستخدمون جدد (30 يوم)' : 'New Users (30d)'}</p>
                <p className="text-2xl font-bold mt-1">{data.users.newLast30Days}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'المستخدمون النشطون يومياً' : 'Daily Active Users'}</p>
                <p className="text-2xl font-bold mt-1">{data.users.dau}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الاشتراكات النشطة' : 'Active Subscriptions'}</p>
                <p className="text-2xl font-bold mt-1">{data.subscriptions.active}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'خارطة الطريق' : 'Roadmaps'}</p>
                <p className="text-2xl font-bold mt-1">{data.content.roadmaps}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'رسائل الدردشة' : 'Chat Messages'}</p>
                <p className="text-2xl font-bold mt-1">{data.content.chatMessages}</p>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* Charts */}
      {data?.timeSeries && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'نمو المستخدمين' : 'User Growth'}</CardTitle>
              <CardDescription>{language === 'ar' ? 'المستخدمون الجدد يومياً (آخر 30 يوم)' : 'Daily new users (last 30 days)'}</CardDescription>
            </CardHeader>
            <CardContent>
              <UserGrowthChart data={data.timeSeries.userGrowth} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'توزيع الاشتراكات' : 'Subscription Distribution'}</CardTitle>
              <CardDescription>{language === 'ar' ? 'توزيع المستخدمين حسب الخطة' : 'User distribution by tier'}</CardDescription>
            </CardHeader>
            <CardContent>
              {data.subscriptions.distribution ? (
                <SubscriptionPieChart data={data.subscriptions.distribution} />
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  {language === 'ar' ? 'لا توجد بيانات' : 'No data'}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'اتجاه الإيرادات' : 'Revenue Trend'}</CardTitle>
              <CardDescription>{language === 'ar' ? 'الإيرادات اليومية (آخر 30 يوم)' : 'Daily revenue (last 30 days)'}</CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueAreaChart data={data.timeSeries.revenue} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'المستخدمون النشطون' : 'Active Users'}</CardTitle>
              <CardDescription>{language === 'ar' ? 'المستخدمون النشطون يومياً (آخر 30 يوم)' : 'Daily active users (last 30 days)'}</CardDescription>
            </CardHeader>
            <CardContent>
              <EngagementBarChart data={data.timeSeries.activeUsers} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
