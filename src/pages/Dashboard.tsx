import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart3, BookOpen, Clock, Target, ArrowRight, Loader2, Brain, Calendar, TrendingUp, AlertCircle, RefreshCw, MessageSquare, HelpCircle, Map, Star, Gauge, CreditCard, Flame, Trash2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRoadmap } from '@/hooks/useRoadmap';
import { useProfile } from '@/hooks/useProfile';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useSubscription } from '@/hooks/useSubscription';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { useStudyStreak } from '@/hooks/useStudyStreak';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';
import { getUnlockSummary } from '@/lib/premium-features';
import { CheckoutButton } from '@/components/pricing/CheckoutButton';
import { FreePlanBanner } from '@/components/common/FreePlanBanner';
import { POLAR_PRODUCTS } from '@/lib/polar-config';
import { hasValidCourseUrl, getCourseSearchUrl } from '@/lib/course-links';
import { dashboardPaths } from '@/lib/dashboard-routes';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { WeekTasks } from '@/components/study/WeekTasks';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export default function Dashboard() {
  const { language, t } = useLanguage();
  const queryClient = useQueryClient();
  const { user, getAccessToken } = useAuth();
  const { roadmaps, activeRoadmap, updateRoadmap, isUpdatingRoadmap, deleteRoadmap, isDeletingRoadmap, isLoading: isLoadingRoadmap, isError: isErrorRoadmap, error: errorRoadmap } = useRoadmap();
  const { profile, isLoading: isLoadingProfile, error: errorProfile } = useProfile();
  const { analytics, isLoading: isLoadingAnalytics } = useAnalytics();
  const { isPremium, tier, periodEnd } = useSubscription();
  const usageLimits = useUsageLimits();
  const { getChatMessagesRemaining, getQuizzesRemaining, getRoadmapsRemaining, getNotesRemaining, getTasksRemaining, getAiSuggestionsRemaining, usage, limits, isUnlimitedChat, isUnlimitedQuizzes, isUnlimitedRoadmaps, isUnlimitedNotes, isUnlimitedTasks, isUnlimitedAiSuggestions } = usageLimits;
  const { streak } = useStudyStreak();
  const { preferences: notifPrefs } = useNotificationPreferences();
  const { toast } = useToast();
  const [portalLoading, setPortalLoading] = useState(false);
  const [deleteConfirmRoadmapId, setDeleteConfirmRoadmapId] = useState<string | null>(null);
  const [streakBannerDismissed, setStreakBannerDismissed] = useState(() => {
    if (typeof sessionStorage === 'undefined') return false;
    return sessionStorage.getItem('shyftcut_streak_banner_dismissed') === '1';
  });

  const todayLocal = new Date().toISOString().slice(0, 10);
  const studiedToday = streak.activity_dates.includes(todayLocal);
  const inAppReminderOn = notifPrefs?.in_app_reminder !== false;
  const showStreakBanner = !studiedToday && !streakBannerDismissed && inAppReminderOn;

  const dismissStreakBanner = () => {
    try {
      sessionStorage.setItem('shyftcut_streak_banner_dismissed', '1');
    } catch {
      /* ignore */
    }
    setStreakBannerDismissed(true);
  };

  const isLoading = isLoadingRoadmap || isLoadingProfile;
  const isError = isErrorRoadmap || !!errorProfile;
  const errorMessage = (errorRoadmap as Error)?.message ?? (errorProfile as Error)?.message;

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-app-content px-4 py-8">
          <Skeleton className="mb-6 h-9 w-64" />
          <Skeleton className="mb-6 h-5 w-72" />
          <Skeleton className="mb-6 h-24 w-full rounded-xl" />
          <div className="mb-8 grid gap-3 grid-cols-1 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="mb-4 h-6 w-40" />
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-24 w-full sm:w-[220px] rounded-xl" />
            <Skeleton className="h-24 w-full sm:w-[220px] rounded-xl" />
          </div>
        </div>
    );
  }

  if (isError) {
    return (
        <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-md text-center"
          >
            <div className="mb-4 flex justify-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">
              {t('dashboard.error')}
            </h2>
            <p className="mb-6 text-muted-foreground">
              {errorMessage || t('dashboard.errorLoad')}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
                  queryClient.invalidateQueries({ queryKey: ['activeRoadmap'] });
                  queryClient.invalidateQueries({ queryKey: ['profile'] });
                  queryClient.invalidateQueries({ queryKey: ['analytics'] });
                }}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                {t('common.retry')}
              </Button>
              <Button asChild>
                <Link to={dashboardPaths.index}>{t('dashboard.backToDashboard')}</Link>
              </Button>
            </div>
          </motion.div>
        </div>
    );
  }

  // No active roadmap: full dashboard shell with locked features and upgrade focus
  if (!activeRoadmap) {
    const canCreate = usageLimits.canCreateRoadmap();
    return (
      <div
        data-testid="dashboard-content"
        className="min-h-full bg-gradient-to-b from-background via-background to-muted/20"
        style={{ paddingLeft: 'max(1rem, env(safe-area-inset-left))', paddingRight: 'max(1rem, env(safe-area-inset-right))' }}
      >
        <div className="container mx-auto max-w-app-content px-4 pb-24 pt-6 sm:px-6 sm:py-8">
          {showStreakBanner && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3"
            >
              <p className="text-sm text-foreground">
                {streak.current_streak > 0 ? t('dashboard.studyTodayToKeepStreak') : t('dashboard.studyTodayStart')}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to={dashboardPaths.study}>{t('dashboard.thisWeek')}</Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={dismissStreakBanner} aria-label={language === 'ar' ? 'إغلاق' : 'Dismiss'}>
                  ×
                </Button>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-2xl border border-border/40 bg-card/50 px-6 py-6 sm:px-8 sm:py-7 backdrop-blur-sm"
          >
            <h1 className="min-w-0 text-xl font-semibold tracking-tight sm:text-2xl md:text-[1.75rem]">
              <span className="block truncate">{t('dashboard.welcome')}, {(profile as { display_name?: string })?.display_name || user?.email?.split('@')[0]}</span>
            </h1>
            <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed">
              {t('dashboard.emptyState.subtitle')}
            </p>
          </motion.div>

          {!isPremium && (
            <FreePlanBanner
              className="mb-6"
              returnTo={dashboardPaths.index}
              ctaText={t('dashboard.emptyState.upgradeCta')}
              usageSummary={
                <>
                  {t('dashboard.freePlan')} · {t('dashboard.roadmapsLabel')}{' '}
                  {isUnlimitedRoadmaps ? '∞' : `${usage?.roadmapsCreated ?? 0}/${limits.roadmaps}`}
                  {' · '}{t('dashboard.chat')} {isUnlimitedChat ? '∞' : getChatMessagesRemaining()}
                  {t('dashboard.quizzes')} {isUnlimitedQuizzes ? '∞' : getQuizzesRemaining()}
                </>
              }
            />
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="dashboard-card overflow-hidden">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 sm:h-12 sm:w-12 sm:rounded-xl">
                      <Flame className="h-7 w-7 text-primary sm:h-6 sm:w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold sm:text-base">{t('dashboard.streak')}</h3>
                      <p className="text-2xl font-bold tabular-nums text-primary sm:text-2xl">
                        {streak.current_streak > 0
                          ? t('dashboard.streakDays').replace('{{count}}', String(streak.current_streak))
                          : t('dashboard.streakDaysZero')}
                      </p>
                      <p className="text-sm text-muted-foreground sm:text-xs">
                        {t('dashboard.longestStreak')}: {streak.longest_streak} {language === 'ar' ? 'أيام' : 'days'}
                      </p>
                    </div>
                  </div>
                  {streak.activity_dates.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 sm:gap-1">
                      {streak.activity_dates.slice(0, 28).map((d) => (
                        <div key={d} className="h-6 w-6 rounded-md bg-primary/20 sm:h-5 sm:w-5 sm:rounded-sm" title={d} aria-hidden />
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {!isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-muted-foreground">
              <Lock className="h-5 w-5" />
              {t('dashboard.emptyState.lockedHint')}
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="dashboard-card flex min-w-0 flex-col opacity-75">
                <CardContent className="flex flex-1 items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Map className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">{t('dashboard.roadmap')}</p>
                    <p className="text-xs text-muted-foreground">{t('dashboard.trackWeekly')}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="dashboard-card flex min-w-0 flex-col opacity-75">
                <CardContent className="flex flex-1 items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">{t('dashboard.browseCourses')}</p>
                    <p className="text-xs text-muted-foreground">{t('dashboard.curatedCourses')}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="dashboard-card flex min-w-0 flex-col opacity-75">
                <CardContent className="flex flex-1 items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">{t('dashboard.talkToCoach')}</p>
                    <p className="text-xs text-muted-foreground">{t('dashboard.aiCoach')}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4"
          >
            {!isPremium && (
              <CheckoutButton
                planId="premium"
                productId={POLAR_PRODUCTS.premium.yearly.productId}
                returnTo={dashboardPaths.index}
                size="lg"
                className="btn-glow min-h-[48px] gap-2"
              >
                {t('dashboard.upgrade')}
                <ArrowRight className="h-5 w-5" />
              </CheckoutButton>
            )}
            {canCreate && (
              <Button asChild variant={isPremium ? 'default' : 'outline'} size="lg" className="btn-glow min-h-[48px] gap-2">
                <Link to="/wizard">
                  {t('dashboard.buildRoadmap')}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  const weeks = activeRoadmap.roadmap_weeks?.sort((a: any, b: any) => a.week_number - b.week_number) || [];
  const completedWeeks = weeks.filter((w: any) => w.is_completed).length;
  const currentWeek = weeks.find((w: any) => !w.is_completed) || weeks[weeks.length - 1];
  const progress = activeRoadmap.progress_percentage || 0;
  const coursesCompleted = weeks.reduce((acc: number, w: any) => acc + (w.course_recommendations?.filter((c: any) => c.is_completed).length || 0), 0);
  const totalCourses = weeks.reduce((acc: number, w: any) => acc + (w.course_recommendations?.length || 0), 0);

  function formatRelative(dateStr: string | null): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    if (diffDays === 0) return t('dashboard.today');
    if (diffDays === 1) return t('dashboard.yesterday');
    if (diffDays < 7) return language === 'ar' ? `منذ ${diffDays} أيام` : `${diffDays} ${t('dashboard.daysAgo')}`;
    if (diffDays < 30) return language === 'ar' ? `منذ ${Math.floor(diffDays / 7)} أسابيع` : `${Math.floor(diffDays / 7)} ${t('dashboard.weeksAgo')}`;
    return d.toLocaleDateString(language === 'ar' ? 'ar' : undefined);
  }

  // Chart data
  const progressData = [
    { name: 'Completed', value: completedWeeks },
    { name: 'Remaining', value: weeks.length - completedWeeks },
  ];
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted))'];

  // Weekly progress trend
  const trendData = weeks.map((week: any) => ({
    week: `W${week.week_number}`,
    hours: week.estimated_hours,
    completed: week.is_completed ? week.estimated_hours : 0,
  }));

  return (
    <>
      <OnboardingTour />
      <div
        data-testid="dashboard-content"
        className="min-h-full bg-gradient-to-b from-background via-background to-muted/20"
        style={{ paddingLeft: 'max(1rem, env(safe-area-inset-left))', paddingRight: 'max(1rem, env(safe-area-inset-right))' }}
      >
        <div className="container mx-auto max-w-app-content px-4 pb-24 pt-6 sm:px-6 sm:py-8">
        {/* Dismissible banner: study today to keep streak */}
        {showStreakBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3"
          >
            <p className="text-sm text-foreground">
              {streak.current_streak > 0 ? t('dashboard.studyTodayToKeepStreak') : t('dashboard.studyTodayStart')}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to={dashboardPaths.study}>{t('dashboard.thisWeek')}</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={dismissStreakBanner} aria-label={language === 'ar' ? 'إغلاق' : 'Dismiss'}>
                ×
              </Button>
            </div>
          </motion.div>
        )}

        {/* Welcome hero — 2026 refined */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-2xl border border-border/40 bg-card/50 px-6 py-6 sm:px-8 sm:py-7 backdrop-blur-sm"
        >
          <h1 className="min-w-0 text-xl font-semibold tracking-tight sm:text-2xl md:text-[1.75rem]">
            <span className="block truncate">{t('dashboard.welcome')}, {(profile as { display_name?: string })?.display_name || user?.email?.split('@')[0]}</span>
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed">
            {language === 'ar'
              ? `الأسبوع ${currentWeek?.week_number || 1} من ${weeks.length} · ${currentWeek?.estimated_hours ?? 0} ساعة هذا الأسبوع`
              : `Week ${currentWeek?.week_number || 1} of ${weeks.length} · ${currentWeek?.estimated_hours ?? 0}h left this week`}
            {progress > 0 && (language === 'ar' ? ` · ${progress}% من الخريطة` : ` · ${t('dashboard.percentThrough').replace('{{percent}}', String(progress))}`)}
          </p>
        </motion.div>

        {/* Free plan: slim inline bar */}
        {!isPremium && (
          <FreePlanBanner
            className="mb-6"
            returnTo={dashboardPaths.index}
            usageSummary={
              <>
                {t('dashboard.freePlan')} · {t('dashboard.chat')}{' '}
                {isUnlimitedChat ? '∞' : getChatMessagesRemaining()}
                {t('dashboard.quizzes')} {isUnlimitedQuizzes ? '∞' : getQuizzesRemaining()}
                {t('dashboard.notes')} {isUnlimitedNotes ? '∞' : getNotesRemaining()}
                {t('dashboard.tasks')} {isUnlimitedTasks ? '∞' : getTasksRemaining()}
                {t('dashboard.aiToday')} {isUnlimitedAiSuggestions ? '∞' : getAiSuggestionsRemaining()}
              </>
            }
          />
        )}

        {/* Study streak - stacked on mobile, horizontal on desktop */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="dashboard-card overflow-hidden">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 sm:h-12 sm:w-12 sm:rounded-xl">
                    <Flame className="h-7 w-7 text-primary sm:h-6 sm:w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold sm:text-base">{t('dashboard.streak')}</h3>
                    <p className="text-2xl font-bold tabular-nums text-primary sm:text-2xl">
                      {streak.current_streak > 0
                        ? t('dashboard.streakDays').replace('{{count}}', String(streak.current_streak))
                        : t('dashboard.streakDaysZero')}
                    </p>
                    <p className="text-sm text-muted-foreground sm:text-xs">
                      {t('dashboard.longestStreak')}: {streak.longest_streak} {language === 'ar' ? 'أيام' : 'days'}
                    </p>
                  </div>
                </div>
                {!studiedToday && (
                  <p className="text-sm text-muted-foreground sm:shrink-0 sm:max-w-[200px]">
                    {streak.current_streak > 0 ? t('dashboard.studyTodayToKeepStreak') : t('dashboard.studyTodayStart')}
                  </p>
                )}
              </div>
              {streak.activity_dates.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-1">
                  {(() => {
                    const dates = streak.activity_dates.slice(0, 28);
                    return dates.map((d) => (
                      <div
                        key={d}
                        className="h-6 w-6 rounded-md bg-primary/20 sm:h-5 sm:w-5 sm:rounded-sm"
                        title={d}
                        aria-hidden
                      />
                    ));
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Roadmaps: card with icon, title, progress bar, Active/Set active */}
        {roadmaps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <Map className="h-5 w-5 text-primary" />
              {t('dashboard.yourRoadmaps')}
            </h2>
            <div className="flex flex-wrap gap-3">
              {roadmaps
                .filter((r: { status?: string }) => r.status !== 'archived')
                .map((r: { id: string; title?: string; progress_percentage?: number; status?: string }) => (
                  <Card key={r.id} className="dashboard-card flex min-w-0 w-full flex-col sm:min-w-[220px] sm:flex-1">
                    <div className="flex items-start gap-3 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Map className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link to={`/roadmap/${r.id}`} className="font-medium hover:underline">
                          <span className="truncate block">{r.title || t('dashboard.roadmap')}</span>
                        </Link>
                        <Progress value={typeof r.progress_percentage === 'number' ? r.progress_percentage : 0} className="mt-2 h-1.5" />
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {r.status === 'active' ? (
                          <Badge variant="default" className="text-xs">
                            {t('dashboard.active')}
                          </Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="min-h-[44px] min-w-[44px] gap-1 text-xs"
                            disabled={isUpdatingRoadmap}
                            onClick={() => updateRoadmap({ roadmapId: r.id, payload: { status: 'active' } })}
                          >
                            <Star className="h-3 w-3" />
                            {t('dashboard.setActive')}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          disabled={isDeletingRoadmap}
                          onClick={() => setDeleteConfirmRoadmapId(r.id)}
                          aria-label={language === 'ar' ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
            {roadmaps.some((r: { status?: string }) => r.status === 'archived') && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  {t('dashboard.archived')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {roadmaps
                    .filter((r: { status?: string }) => r.status === 'archived')
                    .map((r: { id: string; title?: string; progress_percentage?: number }) => (
                      <Link
                        key={r.id}
                        to={`/roadmap/${r.id}`}
                        className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        {r.title || t('dashboard.roadmap')}
                        {typeof r.progress_percentage === 'number' && (
                          <span className="ml-2 text-xs rtl:ml-0 rtl:mr-2">({r.progress_percentage}%)</span>
                        )}
                      </Link>
                    ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Subscription & Billing - compact card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="dashboard-card">
            <CardHeader className="py-4 sm:py-6">
              <CardTitle className="text-base sm:text-lg">
                {t('dashboard.subscriptionBilling')}
              </CardTitle>
              <CardDescription className="text-sm">
                {t('dashboard.subscriptionDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('dashboard.currentPlan')}
                  </p>
                  <Badge className="mt-1 capitalize">{tier ?? 'free'}</Badge>
                </div>
                {isPremium && periodEnd && (
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar'
                      ? `تجديد في ${new Date(periodEnd).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}`
                      : `Renews ${new Date(periodEnd).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`}
                  </p>
                )}
              </div>
              <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  {t('dashboard.usageThisMonth')}
                </p>
                <ul className="space-y-1 text-sm">
                  <li>
                    {t('dashboard.roadmapsLabel')}{' '}
                    {isUnlimitedRoadmaps ? '∞' : `${usage?.roadmapsCreated ?? 0}/${limits.roadmaps}`}
                  </li>
                  <li>
                    {t('dashboard.chatMessages')}{' '}
                    {isUnlimitedChat ? '∞' : `${usage?.chatMessagesThisMonth ?? 0}/${limits.chatMessages}`}
                  </li>
                  <li>
                    {t('dashboard.quizzesLabel')}{' '}
                    {isUnlimitedQuizzes ? '∞' : `${usage?.quizzesTakenThisMonth ?? 0}/${limits.quizzes}`}
                  </li>
                </ul>
              </div>
              <div className="flex flex-wrap gap-2">
                {!isPremium && (
                  <CheckoutButton
                    planId="premium"
                    productId={POLAR_PRODUCTS.premium.yearly.productId}
                    returnTo={dashboardPaths.index}
                    variant="default"
                    size="sm"
                    className="min-h-[44px] gap-2"
                  >
                    {t('dashboard.upgrade')}
                  </CheckoutButton>
                )}
                {isPremium && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-[44px] gap-2"
                    disabled={portalLoading}
                    onClick={async () => {
                      const token = await getAccessToken();
                      if (!token) return;
                      setPortalLoading(true);
                      try {
                        const data = await apiFetch<{ url?: string }>(
                          `/api/checkout/portal?returnUrl=${encodeURIComponent(window.location.href)}`,
                          { token, skipUnauthorizedLogout: true }
                        );
                        if (data?.url) window.location.href = data.url;
                        else throw new Error('No portal URL');
                      } catch {
                        toast({
                          title: t('common.errorTitle'),
                          description: t('profile.couldNotOpenSubscription'),
                          variant: 'destructive',
                        });
                      } finally {
                        setPortalLoading(false);
                      }
                    }}
                  >
                    {portalLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4" />
                    )}
                    {t('profile.manageSubscription')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats: hero stat + compact pills */}
        <div className="mb-8 flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="dashboard-card">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Gauge className="h-7 w-7 text-primary" />
                    </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t('dashboard.overallProgress')}
                    </p>
                      <p className="text-4xl font-bold text-primary tabular-nums">{progress}%</p>
                  </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            <Card className="dashboard-card">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
                  <Calendar className="h-5 w-5 text-success" />
                  </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{t('dashboard.weeksCompleted')}</p>
                  <p className="text-xl font-bold tabular-nums">{completedWeeks}/{weeks.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="dashboard-card">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <BookOpen className="h-5 w-5 text-accent" />
                  </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{t('dashboard.coursesCompleted')}</p>
                  <p className="text-xl font-bold tabular-nums">{coursesCompleted}/{totalCourses}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="dashboard-card">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                  </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{t('dashboard.thisWeekFocus')}</p>
                  <p className="text-xl font-bold tabular-nums">{currentWeek?.estimated_hours || 0}h</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Activity this month — 2x2 grid + context line */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mb-8"
        >
          <h2 className="mb-2 text-lg font-semibold">
            {t('dashboard.activityThisMonth')}
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {t('dashboard.progressAtGlance')}
          </p>
          <Card className="dashboard-card">
            <CardContent className="p-6">
              {isLoadingAnalytics ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center gap-3 border-b border-border pb-4 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4 last:border-0 rtl:border-r-0 rtl:border-l rtl:pr-0 rtl:pl-4 rtl:last:border-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <HelpCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t('dashboard.quizzesTaken')}</p>
                        <p className="text-xl font-semibold tabular-nums">{analytics?.quizzesTaken ?? 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 border-b border-border pb-4 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4 last:border-0 rtl:border-r-0 rtl:border-l rtl:pr-0 rtl:pl-4 rtl:last:border-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
                        <TrendingUp className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t('dashboard.averageQuizScore')}</p>
                        <p className="text-xl font-semibold tabular-nums">
                          {analytics?.averageQuizScore != null ? `${Math.round(Number(analytics.averageQuizScore))}%` : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 border-b border-border pb-4 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4 last:border-0 rtl:border-r-0 rtl:border-l rtl:pr-0 rtl:pl-4 rtl:last:border-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                        <MessageSquare className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t('dashboard.aiMessages')}</p>
                        <p className="text-xl font-semibold tabular-nums">{analytics?.chatMessagesThisMonth ?? 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10">
                        <Target className="h-5 w-5 text-warning" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t('dashboard.roadmapsCreated')}</p>
                        <p className="text-xl font-semibold tabular-nums">{analytics?.roadmapsCreated ?? 0}</p>
                      </div>
                    </div>
                  </div>
                  {(analytics?.lastQuizAt || analytics?.lastActiveAt) && (
                    <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-4 text-sm text-muted-foreground">
                      {analytics?.lastQuizAt && (
                        <span>
                          {t('dashboard.lastQuiz')}
                          {new Date(analytics.lastQuizAt).toLocaleDateString(language === 'ar' ? 'ar' : undefined)}
                        </span>
                      )}
                      {analytics?.lastActiveAt && (
                        <span>
                          {t('dashboard.lastActivity')}
                          {formatRelative(analytics.lastActiveAt)}
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Grid: Current Week two-column + Progress overview */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Current Week: left = title/skills/deliverables, right = courses */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2"
          >
            <Card className="dashboard-card h-full">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <Badge className="mb-2">
                      {`${t('roadmap.week')} ${currentWeek?.week_number}`}
                    </Badge>
                    <CardTitle>{currentWeek?.title}</CardTitle>
                    <CardDescription>{currentWeek?.description}</CardDescription>
                  </div>
                <Button asChild variant="outline" size="sm">
                    <Link to={dashboardPaths.roadmap}>
                    {t('dashboard.viewFullRoadmap')}
                    </Link>
                  </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-[1fr,auto]">
                  <div>
                <div className="mb-4">
                  <h4 className="mb-2 text-sm font-medium">
                    {t('roadmap.skillsToLearn')}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {currentWeek?.skills_to_learn?.map((skill: string, i: number) => (
                      <Badge key={i} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <h4 className="mb-2 text-sm font-medium">
                        {t('dashboard.thisWeekTasks')}
                      </h4>
                      {currentWeek?.id ? (
                        <WeekTasks roadmapWeekId={currentWeek.id} />
                      ) : (
                        <p className="text-sm text-muted-foreground">{t('dashboard.noTasksYet')}</p>
                      )}
                    </div>
                    <div>
                      <h4 className="mb-2 text-sm font-medium">
                        {t('roadmap.deliverables')}
                  </h4>
                  <ul className="space-y-2">
                    {currentWeek?.deliverables?.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                            <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                  </div>
                {currentWeek?.course_recommendations && currentWeek.course_recommendations.length > 0 && (
                    <div className="md:min-w-[240px]">
                    <h4 className="mb-2 text-sm font-medium">
                      {t('roadmap.recommendedCourses')}
                    </h4>
                      <div className="space-y-2">
                      {currentWeek.course_recommendations.slice(0, 4).map((course: any) => {
                        const courseUrl = hasValidCourseUrl(course.url) ? course.url : getCourseSearchUrl(course.platform ?? '', course.title ?? '');
                        return (
                        <a
                          key={course.id}
                          href={courseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <BookOpen className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{course.title}</p>
                            <p className="text-xs text-muted-foreground">{course.platform}</p>
                          </div>
                        </a>
                        );
                      })}
                    </div>
                  </div>
                )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Progress Overview: smaller chart, big %, week bars */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="dashboard-card h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4" />
                  {t('dashboard.progressOverview')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-32 min-h-[128px] w-full items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={progressData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={55}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {progressData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-3xl font-bold tabular-nums">{progress}%</p>
                  <p className="text-sm text-muted-foreground">
                    {t('dashboard.complete')}
                  </p>
                </div>
                <div className="mt-4 flex gap-1">
                  {weeks.slice(0, 12).map((w: any, i: number) => (
                    <div
                      key={i}
                      className="h-6 flex-1 rounded-sm min-w-0"
                      style={{
                        backgroundColor: w.is_completed ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                      }}
                      title={`${t('roadmap.week')} ${w.week_number}`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Weekly Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-6"
        >
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>
                {t('dashboard.weeklySchedule')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 min-h-[192px] w-full sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="hours"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorHours)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions: primary CTA + two secondary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-stretch"
        >
          <Card className="dashboard-card flex-1 transition-all card-glow">
            <Link to={dashboardPaths.roadmap} className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{t('dashboard.continueRoadmap')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('dashboard.trackWeekly')}
              </p>
              </div>
              <ArrowRight className="ml-auto h-5 w-5 shrink-0 text-muted-foreground rtl:mr-auto rtl:ml-0" />
            </Link>
          </Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:max-w-[200px] lg:flex-col">
            <Card className="dashboard-card flex-1 min-w-0 transition-all">
              <Link to={currentWeek?.week_number ? `${dashboardPaths.courses}?week=${currentWeek.week_number}` : dashboardPaths.courses} className="flex min-touch items-center gap-3 p-4">
                <BookOpen className="h-5 w-5 shrink-0 text-accent" />
                <span className="font-medium text-sm">{t('dashboard.browseCourses')}</span>
              </Link>
            </Card>
            <Card className="dashboard-card flex-1 min-w-0 transition-all">
              <Link to={dashboardPaths.chat} className="flex min-touch items-center gap-3 p-4">
                <Brain className="h-5 w-5 shrink-0 text-warning" />
                <span className="font-medium text-sm">{t('dashboard.talkToCoach')}</span>
              </Link>
            </Card>
          </div>
        </motion.div>
        </div>
      </div>

      {/* Delete roadmap confirm dialog */}
      <Dialog open={!!deleteConfirmRoadmapId} onOpenChange={(open) => !open && setDeleteConfirmRoadmapId(null)}>
        <DialogContent className="max-w-md" aria-describedby="dashboard-delete-roadmap-desc">
          <DialogTitle>{t('roadmap.deleteRoadmap')}</DialogTitle>
          <DialogDescription id="dashboard-delete-roadmap-desc" className="text-sm text-muted-foreground">
            {t('roadmap.deleteConfirm')}
          </DialogDescription>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmRoadmapId(null)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="destructive"
              disabled={isDeletingRoadmap || !deleteConfirmRoadmapId}
              onClick={() => {
                if (!deleteConfirmRoadmapId) return;
                deleteRoadmap(deleteConfirmRoadmapId, {
                  onSuccess: () => {
                    setDeleteConfirmRoadmapId(null);
                    toast({ title: language === 'ar' ? 'تم الحذف' : 'Roadmap deleted' });
                  },
                  onError: () => {
                    toast({ title: t('common.errorTitle'), variant: 'destructive' });
                  },
                });
              }}
            >
              {isDeletingRoadmap ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === 'ar' ? 'حذف' : 'Delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
