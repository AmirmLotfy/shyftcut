import { useAdminChurnAnalysis } from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChurnAnalysisProps {
  startDate?: string;
  endDate?: string;
}

export function ChurnAnalysis({ startDate, endDate }: ChurnAnalysisProps) {
  const { language } = useLanguage();
  const { data, isLoading } = useAdminChurnAnalysis(startDate, endDate);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{language === 'ar' ? 'معدل التسرب' : 'Churn Rate'}</p>
            <p className="text-2xl font-bold mt-1">{data.churnRate.toFixed(2)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{language === 'ar' ? 'المتسربون' : 'Churned'}</p>
            <p className="text-2xl font-bold mt-1">{data.churned}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{language === 'ar' ? 'نشطون في البداية' : 'Active at Start'}</p>
            <p className="text-2xl font-bold mt-1">{data.activeAtStart}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{language === 'ar' ? 'اشتراكات جديدة' : 'New Subscriptions'}</p>
            <p className="text-2xl font-bold mt-1">{data.newSubscriptions}</p>
          </CardContent>
        </Card>
      </div>

      {data.retentionCohorts && data.retentionCohorts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'أفواج الاحتفاظ' : 'Retention Cohorts'}</CardTitle>
            <CardDescription>
              {language === 'ar' ? 'معدل الاحتفاظ حسب شهر التسجيل' : 'Retention rate by signup month'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.retentionCohorts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="cohort"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  label={{ value: 'Rate (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="retentionRate" fill="hsl(var(--primary))" name="Retention Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {data.churnReasons && data.churnReasons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'أسباب التسرب' : 'Churn Reasons'}</CardTitle>
            <CardDescription>
              {language === 'ar' ? 'التوزيع حسب السبب' : 'Distribution by reason'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.churnReasons.map((reason) => (
                <div key={reason.reason} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">{reason.reason || language === 'ar' ? 'غير محدد' : 'Unknown'}</span>
                  <Badge variant="secondary">{reason.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
