import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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
import { dashboardPaths, roadmapPath } from '@/lib/dashboard-routes';
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
      <>
        <Helmet><title>Dashboard | Shyftcut</title></Helmet>
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
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Helmet><title>Dashboard | Shyftcut</title></Helmet>
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
      </>
    );
  }

  // No active roadmap: full dashboard shell with locked features and upgrade focus
  if (!activeRoadmap) {
    const canCreate = usageLimits.canCreateRoadmap();
    return (
      <>
        <Helmet><title>Dashboard | Shyftcut</title></Helmet>
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
            <Card className="dashboard-card overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card/90 via-card/70 to-card/50 glass-card">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-orange-500/20 to-yellow-500/20 sm:h-12 sm:w-12 sm:rounded-xl">
                      <Flame className="h-7 w-7 text-primary sm:h-6 sm:w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold sm:text-base">{t('dashboard.streak')}</h3>
                      <p className="text-2xl font-bold tabular-nums bg-gradient-to-r from-primary via-orange-500 to-yellow-500 bg-clip-text text-transparent sm:text-2xl">
                        {streak.current_streak > 0
                          ? t('dashboard.streakDays').replace('{{count}}', String(streak.current_streak))
                          : t('dashboard.streakDaysZero')}
                      </p>
                      <p className="text-sm text-muted-foreground sm:text-xs">
                        {t('dashboard.longestStreak')}: {streak.longest_streak} {language === 'ar' ? 'أيام' : 'days'}
                      </p>
                    </div>
                  </div>
                  {streak.activity_dates.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 sm:gap-1">
                      {streak.activity_dates.slice(0, 28).map((d) => (
                        <div key={d} className="h-6 w-6 rounded-md bg-primary/20 sm:h-5 sm:w-5 sm:rounded-sm" title={d} aria-hidden />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto rounded-xl border border-dashed border-primary/20 bg-primary/5 px-4 py-3">
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'ادرس اليوم لبدء سلسلتك الأولى!' : 'Study today to start your first streak!'}
                      </p>
                      <Button asChild variant="outline" size="sm" className="shrink-0 border-primary/30 hover:bg-primary/10">
                        <Link to={dashboardPaths.study}>
                          <Target className="h-4 w-4 mr-1.5" />
                          {t('dashboard.thisWeek')}
                        </Link>
                      </Button>
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
                redirectToUpgrade={true}
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
      </>
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
      <Helmet><title>Dashboard | Shyftcut</title></Helmet>
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

        {/* Welcome Hero — Enhanced with larger typography and better gradients */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
            className="relative mb-8 overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-card/90 via-card/70 to-card/50 px-6 py-8 sm:px-8 sm:py-10 md:px-12 md:py-12 backdrop-blur-2xl shadow-2xl shadow-primary/5 hover:shadow-primary/10 transition-shadow duration-300 glass-card"
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-pink-500/5 opacity-50" />
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          
          <div className="relative">
            <h1 className="min-w-0 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl bg-gradient-to-r from-foreground via-primary to-purple-500 bg-clip-text text-transparent">
            <span className="block truncate">{t('dashboard.welcome')}, {(profile as { display_name?: string })?.display_name || user?.email?.split('@')[0]}</span>
          </h1>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed sm:text-lg md:text-xl">
            {language === 'ar'
              ? `الأسبوع ${currentWeek?.week_number || 1} من ${weeks.length} · ${currentWeek?.estimated_hours ?? 0} ساعة هذا الأسبوع`
              : `Week ${currentWeek?.week_number || 1} of ${weeks.length} · ${currentWeek?.estimated_hours ?? 0}h left this week`}
            {progress > 0 && (language === 'ar' ? ` · ${progress}% من الخريطة` : ` · ${t('dashboard.percentThrough').replace('{{percent}}', String(progress))}`)}
          </p>
          </div>
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

        {/* Primary Actions: Study Streak + Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 grid gap-4 lg:grid-cols-[1fr,auto] w-full"
        >
          {/* Study Streak - Compact horizontal layout */}
          <Card className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl shadow-lg shadow-primary/5 hover:shadow-primary/10 hover:border-primary/30 transition-all duration-300 w-full min-w-0 max-w-full glass-card">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-orange-500/5 to-yellow-500/5" />
            <CardContent className="relative p-4 sm:p-5 w-full">
              <div className="flex items-center gap-3 sm:gap-4 w-full min-w-0">
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 via-orange-500/20 to-yellow-500/20 shadow-lg shadow-primary/20">
                  <Flame className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                  </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 truncate">{t('dashboard.streak')}</h3>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold tabular-nums bg-gradient-to-r from-primary via-orange-500 to-yellow-500 bg-clip-text text-transparent break-words">
                      {streak.current_streak > 0
                        ? t('dashboard.streakDays').replace('{{count}}', String(streak.current_streak))
                        : t('dashboard.streakDaysZero')}
                    </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {t('dashboard.longestStreak')}: {streak.longest_streak} {language === 'ar' ? 'أيام' : 'days'}
                    </p>
                  </div>
                </div>
              {streak.activity_dates.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-1 w-full overflow-hidden">
                  {streak.activity_dates.slice(0, 28).map((d) => (
                      <div
                        key={d}
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-md bg-gradient-to-br from-primary/30 to-orange-500/30 shadow-sm"
                        title={d}
                        aria-hidden
                      />
                  ))}
                </div>
              ) : (
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-dashed border-primary/20 bg-primary/5 px-4 py-3">
                  <p className="text-sm text-muted-foreground flex-1">
                    {language === 'ar' ? 'ادرس اليوم لبدء سلسلتك الأولى!' : 'Study today to start your first streak!'}
                  </p>
                  <Button asChild variant="outline" size="sm" className="shrink-0 border-primary/30 hover:bg-primary/10">
                    <Link to={dashboardPaths.study}>
                      <Target className="h-4 w-4 mr-1.5" />
                      {t('dashboard.thisWeek')}
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions - Horizontal row on desktop */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full min-w-0">
            <Card className="group relative overflow-hidden flex-1 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] w-full min-w-0 glass-card">
              <Link to={dashboardPaths.roadmap} className="flex items-center gap-3 p-4 min-h-[44px] w-full">
                <Target className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm font-semibold truncate">{t('dashboard.continueRoadmap')}</span>
              </Link>
            </Card>
            <Card className="group relative overflow-hidden flex-1 rounded-xl border border-accent/20 bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl transition-all duration-300 hover:border-accent/50 hover:shadow-lg hover:scale-[1.02] w-full min-w-0 glass-card">
              <Link to={currentWeek?.week_number ? `${dashboardPaths.courses}?week=${currentWeek.week_number}` : dashboardPaths.courses} className="flex items-center gap-3 p-4 min-h-[44px] w-full">
                <BookOpen className="h-5 w-5 shrink-0 text-accent" />
                <span className="text-sm font-semibold truncate">{t('dashboard.browseCourses')}</span>
              </Link>
            </Card>
            <Card className="group relative overflow-hidden flex-1 rounded-xl border border-warning/20 bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl transition-all duration-300 hover:border-warning/50 hover:shadow-lg hover:scale-[1.02] w-full min-w-0 glass-card">
              <Link to={dashboardPaths.chat} className="flex items-center gap-3 p-4 min-h-[44px] w-full">
                <Brain className="h-5 w-5 shrink-0 text-warning" />
                <span className="text-sm font-semibold truncate">{t('dashboard.talkToCoach')}</span>
              </Link>
            </Card>
          </div>
        </motion.div>

        {/* Main Content Grid: Current Week (hero) + Progress Overview */}
        <div className="grid gap-4 sm:gap-6 mb-8 lg:grid-cols-3">
          {/* Current Week: Hero of the dashboard - Larger, more prominent */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 w-full min-w-0"
          >
            <Card className="relative overflow-hidden h-full rounded-2xl border border-primary/20 bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl shadow-xl shadow-primary/5 w-full max-w-full glass-card">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-pink-500/5" />
              <CardHeader className="relative flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                <div className="flex-1 min-w-0 w-full">
                  <Badge className="mb-3 bg-gradient-to-r from-primary to-purple-500 text-white border-0 shadow-md">
                    {`${t('roadmap.week')} ${currentWeek?.week_number}`}
                  </Badge>
                  <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold mb-2 break-words">{currentWeek?.title}</CardTitle>
                  <CardDescription className="text-sm sm:text-base break-words">{currentWeek?.description}</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm" className="shrink-0 hover:bg-primary/10 hover:border-primary/50 w-full sm:w-auto">
                  <Link to={dashboardPaths.roadmap} className="text-center">
                    {t('dashboard.viewFullRoadmap')}
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="relative px-4 sm:px-6 pb-4 sm:pb-6 space-y-6">
                {/* Recommended Courses - prominent, first section */}
                {currentWeek?.course_recommendations && currentWeek.course_recommendations.length > 0 && (
                  <section className="rounded-xl border-2 border-primary/25 bg-primary/5 p-4">
                    <h4 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary shrink-0" />
                      {t('roadmap.recommendedCourses')}
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {currentWeek.course_recommendations.slice(0, 4).map((course: any) => {
                        const courseUrl = hasValidCourseUrl(course.url) ? course.url : getCourseSearchUrl(course.platform ?? '', course.title ?? '');
                        return (
                          <a
                            key={course.id}
                            href={courseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-3 rounded-lg border border-primary/20 bg-background/80 p-3 transition-all hover:border-primary/50 hover:bg-primary/10 hover:shadow-md"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                              <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <p className="font-semibold text-sm text-primary truncate group-hover:underline">{course.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{course.platform}</p>
                            </div>
                            <span className="shrink-0 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                              {language === 'ar' ? 'فتح' : 'Open'}
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Skills */}
                {currentWeek?.skills_to_learn && currentWeek.skills_to_learn.length > 0 && (
                  <section>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t('roadmap.skillsToLearn')}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {currentWeek.skills_to_learn.map((skill: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs font-normal">{skill}</Badge>
                      ))}
                    </div>
                  </section>
                )}

                {/* Deliverables */}
                {currentWeek?.deliverables && currentWeek.deliverables.length > 0 && (
                  <section>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t('roadmap.deliverables')}
                    </h4>
                    <ul className="space-y-1.5">
                      {currentWeek.deliverables.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm break-words">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Tasks */}
                <section>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('dashboard.thisWeekTasks')}
                  </h4>
                  {currentWeek?.id ? (
                    <WeekTasks roadmapWeekId={currentWeek.id} />
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('dashboard.noTasksYet')}</p>
                  )}
                </section>
              </CardContent>
            </Card>
          </motion.div>

          {/* Progress Overview: Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="w-full min-w-0"
          >
            <Card className="relative overflow-hidden h-full rounded-2xl border border-primary/20 bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl shadow-xl shadow-primary/5 w-full max-w-full glass-card">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5" />
              <CardHeader className="relative px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold">
                  <BarChart3 className="h-5 w-5 text-primary shrink-0" />
                  <span className="truncate">{t('dashboard.progressOverview')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="flex h-32 sm:h-40 min-h-[128px] w-full items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={progressData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={50}
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
                  <p className="text-2xl sm:text-3xl font-bold tabular-nums">{progress}%</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t('dashboard.complete')}
                  </p>
                </div>
                <div className="mt-4 flex gap-1 w-full overflow-hidden">
                  {weeks.slice(0, 12).map((w: any, i: number) => (
                    <div
                      key={i}
                      className="h-5 sm:h-6 flex-1 rounded-sm min-w-0"
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

        {/* Roadmaps: Secondary priority - Only show if multiple */}
        {roadmaps.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent sm:text-2xl">
              <Map className="h-6 w-6 text-primary" />
              {t('dashboard.yourRoadmaps')}
            </h2>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 w-full">
              {roadmaps
                .filter((r: { status?: string }) => r.status !== 'archived')
                .map((r: { id: string; title?: string; progress_percentage?: number; status?: string; difficulty_level?: string }) => {
                  const progress = typeof r.progress_percentage === 'number' ? r.progress_percentage : 0;
                  const isActive = r.status === 'active';
                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                      className="w-full min-w-0 max-w-full"
                    >
                      <Card className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 w-full max-w-full glass-card ${
                        isActive 
                          ? 'border-primary/50 bg-gradient-to-br from-primary/10 via-purple-500/5 to-pink-500/5 shadow-lg shadow-primary/10' 
                          : 'border-border/40 bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl hover:border-primary/30'
                      }`}>
                        {/* Gradient overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 ${
                          isActive 
                            ? 'from-primary/5 via-purple-500/5 to-pink-500/5 opacity-100' 
                            : 'from-primary/5 via-purple-500/5 to-pink-500/5 group-hover:opacity-100'
                        }`} />
                        
                        <div className="relative p-4 sm:p-5 w-full min-w-0 max-w-full overflow-hidden">
                          {/* Header with icon and actions */}
                          <div className="mb-4 flex items-start justify-between gap-2 sm:gap-3 w-full min-w-0">
                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 overflow-hidden">
                              <div className={`flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl transition-all ${
                                isActive 
                                  ? 'bg-gradient-to-br from-primary/20 to-purple-500/20 shadow-lg shadow-primary/20' 
                                  : 'bg-gradient-to-br from-muted/50 to-muted/30 group-hover:from-primary/10 group-hover:to-purple-500/10'
                              }`}>
                                <Map className={`h-5 w-5 sm:h-6 sm:w-6 transition-colors ${
                                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                                }`} />
                      </div>
                              <div className="min-w-0 flex-1 overflow-hidden">
                                <Link to={roadmapPath(r.id)} className="block min-w-0">
                                  <h3 className="font-bold text-sm sm:text-base leading-tight break-words mb-1 group-hover:text-primary transition-colors">
                                    {r.title || t('dashboard.roadmap')}
                                  </h3>
                        </Link>
                                {r.difficulty_level && (
                                  <Badge variant="outline" className="text-xs capitalize mt-1">
                                    {r.difficulty_level}
                                  </Badge>
                                )}
                              </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                              {isActive ? (
                                <Badge className="text-xs bg-gradient-to-r from-primary to-purple-500 text-white border-0 shadow-md shadow-primary/30 whitespace-nowrap">
                                  <Star className="h-3 w-3 mr-1 fill-current rtl:mr-0 rtl:ml-1 shrink-0" />
                                  <span className="hidden sm:inline">{t('dashboard.active')}</span>
                                  <span className="sm:hidden">★</span>
                          </Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                                  className="h-8 px-2 gap-1 text-xs hover:bg-primary/10 shrink-0"
                            disabled={isUpdatingRoadmap}
                            onClick={() => updateRoadmap({ roadmapId: r.id, payload: { status: 'active' } })}
                          >
                                  <Star className="h-3 w-3 shrink-0" />
                                  <span className="hidden sm:inline">{t('dashboard.setActive')}</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          disabled={isDeletingRoadmap}
                          onClick={() => setDeleteConfirmRoadmapId(r.id)}
                          aria-label={language === 'ar' ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                          </div>

                          {/* Progress section */}
                          <div className="space-y-2 w-full min-w-0">
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <span className="text-muted-foreground font-medium truncate">{t('dashboard.progress')}</span>
                              <span className="font-bold text-primary tabular-nums shrink-0 ml-2">{progress}%</span>
                            </div>
                            <div className="relative h-2.5 sm:h-3 overflow-hidden rounded-full bg-muted/50 backdrop-blur-sm w-full">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className={`h-full rounded-full bg-gradient-to-r ${
                                  isActive
                                    ? 'from-primary via-purple-500 to-pink-500 shadow-lg shadow-primary/30'
                                    : 'from-primary/60 to-purple-500/60 group-hover:from-primary group-hover:to-purple-500'
                                }`}
                              />
                            </div>
                          </div>

                          {/* View link */}
                          <Link 
                            to={roadmapPath(r.id)}
                            className="mt-4 flex items-center gap-2 text-xs sm:text-sm font-medium text-primary hover:text-primary/80 transition-colors group/link w-full min-w-0"
                          >
                            <span className="truncate">{language === 'ar' ? 'عرض التفاصيل' : 'View Details'}</span>
                            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 shrink-0 transition-transform group-hover/link:translate-x-1 rtl:rotate-180" />
                          </Link>
                    </div>
                  </Card>
                    </motion.div>
                  );
                })}
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
                        to={roadmapPath(r.id)}
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

        {/* Stats Grid: 4 uniform cards - Progress %, Weeks, Courses, Hours */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 w-full"
        >
          <Card className="group relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl hover:border-primary/40 hover:shadow-lg hover:scale-[1.02] transition-all w-full min-w-0 glass-card">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5" />
            <CardContent className="relative flex flex-col items-center justify-center gap-2 p-4 sm:p-5 text-center w-full">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 shadow-md">
                <Gauge className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
              <p className="text-xs font-medium text-muted-foreground">{t('dashboard.overallProgress')}</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent tabular-nums">{progress}%</p>
              </CardContent>
            </Card>
          <Card className="group relative overflow-hidden rounded-xl border border-success/20 bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl hover:border-success/40 hover:shadow-lg hover:scale-[1.02] transition-all w-full min-w-0 glass-card">
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-green-500/5" />
            <CardContent className="relative flex flex-col items-center justify-center gap-2 p-4 sm:p-5 text-center w-full">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-success/20 to-green-500/20 shadow-md">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
                  </div>
              <p className="text-xs font-medium text-muted-foreground">{t('dashboard.weeksCompleted')}</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold tabular-nums text-success">{completedWeeks}/{weeks.length}</p>
              </CardContent>
            </Card>
          <Card className="group relative overflow-hidden rounded-xl border border-accent/20 bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl hover:border-accent/40 hover:shadow-lg hover:scale-[1.02] transition-all w-full min-w-0 glass-card">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-blue-500/5" />
            <CardContent className="relative flex flex-col items-center justify-center gap-2 p-4 sm:p-5 text-center w-full">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-blue-500/20 shadow-md">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
                  </div>
              <p className="text-xs font-medium text-muted-foreground">{t('dashboard.coursesCompleted')}</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold tabular-nums text-accent">{coursesCompleted}/{totalCourses}</p>
              </CardContent>
            </Card>
          <Card className="group relative overflow-hidden rounded-xl border border-warning/20 bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl hover:border-warning/40 hover:shadow-lg hover:scale-[1.02] transition-all w-full min-w-0 glass-card">
            <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-orange-500/5" />
            <CardContent className="relative flex flex-col items-center justify-center gap-2 p-4 sm:p-5 text-center w-full">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-warning/20 to-orange-500/20 shadow-md">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
                  </div>
              <p className="text-xs font-medium text-muted-foreground">{t('dashboard.thisWeekFocus')}</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold tabular-nums text-warning">{currentWeek?.estimated_hours || 0}h</p>
              </CardContent>
            </Card>
          </motion.div>

        {/* Activity & Analytics: More compact, better chart integration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 grid gap-6 lg:grid-cols-2"
        >
          {/* Activity This Month */}
          <Card className="dashboard-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold">{t('dashboard.activityThisMonth')}</CardTitle>
              <CardDescription className="text-sm">{t('dashboard.progressAtGlance')}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoadingAnalytics ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <HelpCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t('dashboard.quizzesTaken')}</p>
                        <p className="text-xl font-semibold tabular-nums">{analytics?.quizzesTaken ?? 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
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
                    <div className="flex items-center gap-3">
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
                    <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
                      {analytics?.lastQuizAt && (
                        <span>
                          {t('dashboard.lastQuiz')} {new Date(analytics.lastQuizAt).toLocaleDateString(language === 'ar' ? 'ar' : undefined)}
                        </span>
                      )}
                      {analytics?.lastActiveAt && (
                        <span>
                          {t('dashboard.lastActivity')} {formatRelative(analytics.lastActiveAt)}
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

        {/* Weekly Trend Chart */}
          <Card className="dashboard-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold">{t('dashboard.weeklySchedule')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-48 min-h-[192px] w-full sm:h-56">
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

        {/* Subscription & Billing - Less prominent, bottom placement */}
        {!isPremium && (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-6"
          >
            <Card className="dashboard-card border-primary/10">
              <CardHeader className="py-4">
                <CardTitle className="text-base">{t('dashboard.subscriptionBilling')}</CardTitle>
                <CardDescription className="text-sm">{t('dashboard.subscriptionDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                    <p className="text-sm text-muted-foreground">{t('dashboard.currentPlan')}</p>
                    <Badge className="mt-1 capitalize">{tier ?? 'free'}</Badge>
              </div>
          </div>
                <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">{t('dashboard.usageThisMonth')}</p>
                  <ul className="space-y-1 text-sm">
                    <li>
                      {t('dashboard.roadmapsLabel')} {isUnlimitedRoadmaps ? '∞' : `${usage?.roadmapsCreated ?? 0}/${limits.roadmaps}`}
                    </li>
                    <li>
                      {t('dashboard.chatMessages')} {isUnlimitedChat ? '∞' : `${usage?.chatMessagesThisMonth ?? 0}/${limits.chatMessages}`}
                    </li>
                    <li>
                      {t('dashboard.quizzesLabel')} {isUnlimitedQuizzes ? '∞' : `${usage?.quizzesTakenThisMonth ?? 0}/${limits.quizzes}`}
                    </li>
                  </ul>
                </div>
                <CheckoutButton
                  planId="premium"
                  productId={POLAR_PRODUCTS.premium.yearly.productId}
                  returnTo={dashboardPaths.index}
                  redirectToUpgrade={true}
                  variant="default"
                  size="sm"
                  className="w-full min-h-[44px] gap-2"
                >
                  {t('dashboard.upgrade')}
                </CheckoutButton>
              </CardContent>
            </Card>
        </motion.div>
        )}
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
