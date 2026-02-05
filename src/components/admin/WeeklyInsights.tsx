import { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Minus, AlertTriangle, Info, CheckCircle2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useAdminInsights, WeeklyInsights } from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

const AlertIcon = ({ severity }: { severity: 'critical' | 'warning' | 'info' }) => {
  if (severity === 'critical') return <AlertTriangle className="h-4 w-4 text-destructive" />;
  if (severity === 'warning') return <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
  return <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
};

export function WeeklyInsights() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useAdminInsights();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    insights: true,
    recommendations: false,
    alerts: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleRefresh = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'analytics', 'insights'] });
      await refetch();
      toast({ title: language === 'ar' ? 'تم التحديث' : 'Insights refreshed' });
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data?.insights) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {language === 'ar' ? 'لا توجد رؤى متاحة' : 'No insights available'}
        </CardContent>
      </Card>
    );
  }

  const insights = data.insights as WeeklyInsights;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle>{language === 'ar' ? 'رؤى الأسبوع' : 'Weekly Insights'}</CardTitle>
            {data.cached && (
              <Badge variant="secondary" className="text-xs">
                {language === 'ar' ? 'مخبأ' : 'Cached'}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={handleRefresh} className="h-8 w-8">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          {language === 'ar'
            ? 'ملخص ذكي للأسبوع بناءً على تحليل البيانات'
            : 'AI-powered weekly summary based on data analysis'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Insights */}
        <Collapsible open={expandedSections.insights} onOpenChange={() => toggleSection('insights')}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg p-3 hover:bg-muted/50">
            <h3 className="font-semibold">{language === 'ar' ? 'الرؤى الرئيسية' : 'Key Insights'}</h3>
            {expandedSections.insights ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            {insights.key_insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg bg-background/50 p-3">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm">{insight}</p>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Trends */}
        <div className="rounded-lg border bg-background/50 p-4">
          <h3 className="mb-3 font-semibold">{language === 'ar' ? 'الاتجاهات' : 'Trends'}</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <TrendIcon trend={insights.trends.user_growth} />
              <div>
                <p className="text-xs text-muted-foreground">{language === 'ar' ? 'نمو المستخدمين' : 'User Growth'}</p>
                <p className="text-sm font-medium capitalize">{insights.trends.user_growth}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendIcon trend={insights.trends.revenue} />
              <div>
                <p className="text-xs text-muted-foreground">{language === 'ar' ? 'الإيرادات' : 'Revenue'}</p>
                <p className="text-sm font-medium capitalize">{insights.trends.revenue}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendIcon trend={insights.trends.engagement} />
              <div>
                <p className="text-xs text-muted-foreground">{language === 'ar' ? 'المشاركة' : 'Engagement'}</p>
                <p className="text-sm font-medium capitalize">{insights.trends.engagement}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {insights.recommendations.length > 0 && (
          <Collapsible open={expandedSections.recommendations} onOpenChange={() => toggleSection('recommendations')}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg p-3 hover:bg-muted/50">
              <h3 className="font-semibold">{language === 'ar' ? 'التوصيات' : 'Recommendations'}</h3>
              {expandedSections.recommendations ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {insights.recommendations.map((rec, i) => (
                <div key={i} className="rounded-lg border bg-background/50 p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge
                      variant={
                        rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium mb-1">{rec.action}</p>
                  <p className="text-xs text-muted-foreground">{rec.impact}</p>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Alerts */}
        {insights.alerts.length > 0 && (
          <Collapsible open={expandedSections.alerts} onOpenChange={() => toggleSection('alerts')}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg p-3 hover:bg-muted/50">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{language === 'ar' ? 'التنبيهات' : 'Alerts'}</h3>
                <Badge variant="destructive" className="text-xs">
                  {insights.alerts.length}
                </Badge>
              </div>
              {expandedSections.alerts ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {insights.alerts.map((alert, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 rounded-lg border p-3 ${
                    alert.severity === 'critical'
                      ? 'border-destructive bg-destructive/5'
                      : alert.severity === 'warning'
                      ? 'border-yellow-600 dark:border-yellow-400 bg-yellow-600/5 dark:bg-yellow-400/5'
                      : 'border-blue-600 dark:border-blue-400 bg-blue-600/5 dark:bg-blue-400/5'
                  }`}
                >
                  <AlertIcon severity={alert.severity} />
                  <p className="text-sm flex-1">{alert.message}</p>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Metrics Summary */}
        <div className="rounded-lg border bg-background/50 p-4">
          <h3 className="mb-3 font-semibold">{language === 'ar' ? 'ملخص المقاييس' : 'Metrics Summary'}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {language === 'ar' ? 'النمو أسبوعياً' : 'Week-over-week Growth'}
              </span>
              <span className="font-medium">
                {insights.metrics_summary.week_over_week_growth > 0 ? '+' : ''}
                {insights.metrics_summary.week_over_week_growth.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {language === 'ar' ? 'الميزة الأفضل أداءً' : 'Top Performing Feature'}
              </span>
              <span className="font-medium">{insights.metrics_summary.top_performing_feature}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {language === 'ar' ? 'يحتاج إلى انتباه' : 'Needs Attention'}
              </span>
              <span className="font-medium">{insights.metrics_summary.area_needing_attention}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
