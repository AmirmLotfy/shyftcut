import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Check, Clock, BookOpen, ChevronDown, ChevronUp, ExternalLink, Loader2, GraduationCap, AlertCircle, CheckCircle2, Pencil, Archive, Trash2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRoadmap } from '@/hooks/useRoadmap';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';
import { dashboardPaths, roadmapPath } from '@/lib/dashboard-routes';
import { hasValidCourseUrl, getCourseSearchUrl } from '@/lib/course-links';
import { QuizModal } from '@/components/quiz/QuizModal';
import { UpgradePrompt } from '@/components/common/UpgradePrompt';
import { WeekNotes } from '@/components/study/WeekNotes';
import { WeekTasks } from '@/components/study/WeekTasks';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';

export default function Roadmap() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { roadmaps, roadmap, activeRoadmap, updateRoadmap, isUpdatingRoadmap, deleteRoadmap, isDeletingRoadmap, isLoading, isError, error, completeWeek, isCompletingWeek } = useRoadmap(id);
  const { canTakeQuiz, limits, getQuizzesRemaining, isUnlimitedQuizzes } = useUsageLimits();
  const { language, t } = useLanguage();
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [quizWeek, setQuizWeek] = useState<{ id: string; title: string; skills: string[] } | null>(null);
  const [showQuizUpgrade, setShowQuizUpgrade] = useState(false);
  const [togglingCourseId, setTogglingCourseId] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const currentRoadmap = id ? roadmap : activeRoadmap;
  const weeks = currentRoadmap?.roadmap_weeks?.sort((a: any, b: any) => a.week_number - b.week_number) || [];

  useEffect(() => {
    if (weeks.length === 0 || expandedWeeks.size > 0) return;
    const firstUnlockedIncomplete = weeks.find((w: any, i: number) => (i === 0 || !!weeks[i - 1]?.is_completed) && !w.is_completed);
    if (firstUnlockedIncomplete) {
      setExpandedWeeks(new Set([firstUnlockedIncomplete.id]));
    }
  }, [weeks]);
  const nonArchivedRoadmaps = roadmaps.filter((r: { status?: string }) => r.status !== 'archived');

  const toggleWeek = (weekId: string) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekId)) {
      newExpanded.delete(weekId);
    } else {
      newExpanded.add(weekId);
    }
    setExpandedWeeks(newExpanded);
  };

  const handleStartQuiz = (week: any) => {
    if (!canTakeQuiz()) {
      setShowQuizUpgrade(true);
      return;
    }
    setQuizWeek({
      id: week.id,
      title: week.title,
      skills: week.skills_to_learn || [],
    });
  };

  const handleMarkWeekComplete = (weekId: string) => {
    completeWeek(weekId);
  };

  const toggleCourseCompleted = async (courseId: string, currentCompleted: boolean) => {
    const token = await getAccessToken();
    if (!token) return;
    setTogglingCourseId(courseId);
    try {
      await apiFetch(`/api/courses/${courseId}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ is_completed: !currentCompleted }),
      });
      queryClient.invalidateQueries({ queryKey: ['activeRoadmap'] });
      queryClient.invalidateQueries({ queryKey: ['roadmap', id] });
      queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
      toast({
        title: currentCompleted
          ? (language === 'ar' ? 'تم إلغاء الإكمال' : 'Marked incomplete')
          : (language === 'ar' ? 'تم الإكمال!' : 'Marked complete!'),
      });
    } catch {
      toast({
        title: t('common.errorTitle'),
        variant: 'destructive',
      });
    } finally {
      setTogglingCourseId(null);
    }
  };

  const handleQuizComplete = () => {
    if (quizWeek) {
      completeWeek(quizWeek.id);
      queryClient.invalidateQueries({ queryKey: ['usage-limits'] });
    }
    setQuizWeek(null);
  };

  const openEditDialog = () => {
    setEditTitle(currentRoadmap?.title ?? '');
    setEditDescription(currentRoadmap?.description ?? '');
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (!currentRoadmap?.id || !editTitle.trim()) return;
    updateRoadmap(
      { roadmapId: currentRoadmap.id, payload: { title: editTitle.trim(), description: editDescription.trim() || undefined } },
      {
        onSuccess: () => {
          setShowEditDialog(false);
          toast({ title: t('common.saved') });
        },
        onError: () => {
          toast({ title: t('common.errorTitle'), variant: 'destructive' });
        },
      }
    );
  };

  const handleArchiveConfirm = () => {
    if (!currentRoadmap?.id) return;
    updateRoadmap(
      { roadmapId: currentRoadmap.id, payload: { status: 'archived' } },
      {
        onSuccess: () => {
          setShowArchiveConfirm(false);
          toast({ title: language === 'ar' ? 'تم الأرشفة' : 'Roadmap archived' });
          navigate(dashboardPaths.index);
        },
        onError: () => {
          toast({ title: t('common.errorTitle'), variant: 'destructive' });
        },
      }
    );
  };

  const handleDeleteConfirm = () => {
    if (!currentRoadmap?.id) return;
    deleteRoadmap(currentRoadmap.id, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        toast({ title: language === 'ar' ? 'تم الحذف' : 'Roadmap deleted' });
        const other = nonArchivedRoadmaps.find((r: { id: string }) => r.id !== currentRoadmap.id);
        navigate(other ? roadmapPath(other.id) : dashboardPaths.index);
      },
      onError: () => {
        toast({ title: t('common.errorTitle'), variant: 'destructive' });
      },
    });
  };

  if (isLoading) {
    return (
      <>
        <Helmet><title>Roadmap | Shyftcut</title></Helmet>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Helmet><title>Roadmap | Shyftcut</title></Helmet>
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
              {language === 'ar' ? 'حدث خطأ' : 'Something went wrong'}
            </h2>
            <p className="mb-6 text-muted-foreground">
              {(error as Error)?.message || (language === 'ar' ? 'تعذر تحميل خريطة الطريق.' : 'We couldn\'t load the roadmap. Please try again.')}
            </p>
            <Button asChild>
              <Link to={dashboardPaths.index}>{language === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}</Link>
            </Button>
          </motion.div>
        </div>
      </>
    );
  }

  if (!currentRoadmap) {
    return (
      <>
        <Helmet><title>Roadmap | Shyftcut</title></Helmet>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="mb-4 text-2xl font-bold">
            {language === 'ar' ? 'لا توجد خريطة طريق' : 'No Roadmap Found'}
          </h1>
          <p className="mb-8 text-muted-foreground">
            {language === 'ar' 
              ? 'أنشئ خريطة طريقك المهنية للبدء'
              : 'Create your career roadmap to get started'}
          </p>
          <Button asChild>
            <Link to="/wizard">
              {language === 'ar' ? 'إنشاء خريطة الطريق' : 'Create Roadmap'}
            </Link>
          </Button>
        </div>
      </>
    );
  }

  const completedWeeks = weeks.filter((w: any) => w.is_completed).length;
  const progress = Math.round((completedWeeks / weeks.length) * 100);

  const isWeekUnlocked = (index: number) => index === 0 || !!weeks[index - 1]?.is_completed;

  return (
    <>
      <Helmet><title>Roadmap | Shyftcut</title></Helmet>
      <div data-testid="roadmap-list" className="min-h-full bg-gradient-to-b from-background to-muted/20">
        {/* Compact header: sticky on mobile, clean on desktop */}
        <header className="sticky top-0 z-30 border-b border-border/50 bg-background/95 backdrop-blur-xl">
          <div className="container mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-5">
            {/* Switcher + actions row */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              {nonArchivedRoadmaps.length > 1 ? (
                <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-2 overflow-x-auto scrollbar-hide">
                  {nonArchivedRoadmaps.map((r: { id: string; title?: string; status?: string }) => (
                    <Link
                      key={r.id}
                      to={roadmapPath(r.id)}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                        currentRoadmap?.id === r.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/80 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {r.title ? (r.title.length > 24 ? r.title.slice(0, 22) + '…' : r.title) : (language === 'ar' ? 'خريطة الطريق' : 'Roadmap')}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-normal">
                    {currentRoadmap.difficulty_level}
                  </Badge>
                  {currentRoadmap.status === 'active' && (
                    <Badge variant="default" className="bg-primary/90">{language === 'ar' ? 'نشط' : 'Active'}</Badge>
                  )}
                </div>
              )}
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={openEditDialog} disabled={isUpdatingRoadmap} aria-label={language === 'ar' ? 'تعديل' : 'Edit'}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" onClick={() => setShowArchiveConfirm(true)} disabled={isUpdatingRoadmap} aria-label={language === 'ar' ? 'أرشفة' : 'Archive'}>
                  <Archive className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive/80 hover:text-destructive hover:bg-destructive/10" onClick={() => setShowDeleteConfirm(true)} disabled={isDeletingRoadmap} aria-label={language === 'ar' ? 'حذف' : 'Delete'}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Title: one line on mobile, full on desktop */}
            <h1 className="mb-1 truncate text-xl font-bold sm:mb-2 sm:truncate-none sm:text-2xl">
              {currentRoadmap.title}
            </h1>
            <p className="hidden text-sm text-muted-foreground sm:block sm:line-clamp-2">
              {currentRoadmap.description}
            </p>

            {/* Progress: compact bar + label */}
            <div className="mt-3 flex items-center gap-3">
              <Progress value={progress} className="h-2 flex-1" />
              <span className="shrink-0 text-sm font-semibold text-primary tabular-nums">
                {progress}%
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {language === 'ar' ? `${completedWeeks} من ${weeks.length} أسابيع` : `${completedWeeks} of ${weeks.length} weeks`}
            </p>
          </div>
        </header>

        {/* Single-column list of weeks (no timeline) */}
        <div className="container mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6 sm:py-8">
          {weeks.map((week: any, index: number) => {
            const unlocked = isWeekUnlocked(index);
            const isExpanded = expandedWeeks.has(week.id);
            const isCurrentWeek = !week.is_completed && (index === 0 || weeks[index - 1]?.is_completed);
            const previousWeekNumber = index > 0 ? weeks[index - 1]?.week_number : 0;

            if (!unlocked) {
              return (
                <motion.div
                  key={week.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="mb-4 sm:mb-5"
                >
                  <Card className="overflow-hidden rounded-2xl border border-border/60 bg-muted/30 opacity-90 backdrop-blur-xl glass-card">
                    <CardHeader className="py-4 min-h-[44px] sm:py-5 cursor-default">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                              {language === 'ar' ? `الأسبوع ${week.week_number}` : `Week ${week.week_number}`}
                            </span>
                            <Badge variant="secondary" className="gap-1 border-0 bg-muted text-muted-foreground">
                              <Lock className="h-3 w-3" />
                              {language === 'ar' ? 'مقفل' : 'Locked'}
                            </Badge>
                          </div>
                          <CardTitle className="text-base font-semibold leading-tight sm:text-lg text-muted-foreground">
                            {week.title}
                          </CardTitle>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {language === 'ar'
                              ? `أكمل الأسبوع ${previousWeekNumber} لفتح هذا الأسبوع`
                              : `Complete Week ${previousWeekNumber} to unlock`}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={week.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="mb-4 sm:mb-5"
              >
                <Collapsible open={isExpanded} onOpenChange={() => toggleWeek(week.id)}>
                  <Card
                    className={`public-glass-card overflow-hidden rounded-2xl transition-all ${
                      isCurrentWeek ? 'border-primary/50 ring-2 ring-primary/10' : ''
                    } ${week.is_completed ? 'opacity-90' : ''}`}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader
                        id={`week-trigger-${week.id}`}
                        aria-expanded={isExpanded}
                        aria-controls={`week-content-${week.id}`}
                        className="cursor-pointer py-4 min-h-[44px] sm:py-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="mb-1.5 flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                                {language === 'ar' ? `الأسبوع ${week.week_number}` : `Week ${week.week_number}`}
                              </span>
                              {week.is_completed && (
                                <Badge variant="secondary" className="bg-success/15 text-success border-0">
                                  <Check className="mr-1 h-3 w-3 rtl:mr-0 rtl:ml-1" />
                                  {language === 'ar' ? 'مكتمل' : 'Done'}
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-base font-semibold leading-tight sm:text-lg">
                              {week.title}
                            </CardTitle>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {week.estimated_hours}h
                              </span>
                              <span className="flex items-center gap-1">
                                <BookOpen className="h-3.5 w-3.5" />
                                {week.course_recommendations?.length || 0} {language === 'ar' ? 'دورات' : 'courses'}
                              </span>
                              {!isUnlimitedQuizzes && isCurrentWeek && !week.is_completed && getQuizzesRemaining() >= 0 && (
                                <span className="text-primary font-medium">
                                  {language === 'ar' ? `اختبارات: ${getQuizzesRemaining()}` : `Quizzes: ${getQuizzesRemaining()}`}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent id={`week-content-${week.id}`} aria-labelledby={`week-trigger-${week.id}`}>
                      <CardContent className="pt-0 space-y-5">
                          <p className="text-sm text-muted-foreground leading-relaxed">{week.description}</p>

                          {/* Courses - prominent section */}
                          {week.course_recommendations && week.course_recommendations.length > 0 && (
                            <section className="rounded-xl border-2 border-primary/25 bg-primary/5 p-4">
                              <div className="mb-3 flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                  <BookOpen className="h-4 w-4 text-primary shrink-0" />
                                  {language === 'ar' ? 'الدورات الموصى بها' : 'Recommended Courses'}
                                </h4>
                                <Link
                                  to={`${dashboardPaths.courses}?week=${week.week_number}`}
                                  className="text-xs font-medium text-primary hover:underline"
                                >
                                  {language === 'ar' ? 'عرض في المكتبة' : 'View in library'}
                                </Link>
                              </div>
                              <div className="space-y-2">
                                {week.course_recommendations.map((course: any) => {
                                  const courseUrl = hasValidCourseUrl(course.url) ? course.url : getCourseSearchUrl(course.platform ?? '', course.title ?? '');
                                  const isSearchLink = !hasValidCourseUrl(course.url);
                                  return (
                                    <div
                                      key={course.id}
                                      className={`flex items-center gap-3 rounded-lg border border-primary/20 bg-background/80 p-3 transition-all hover:border-primary/40 hover:bg-primary/5 ${course.is_completed ? 'opacity-80' : ''}`}
                                    >
                                      <a
                                        href={courseUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="min-w-0 flex-1 group/link"
                                      >
                                        <p className="font-semibold text-sm text-primary truncate group-hover/link:underline">{course.title}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                          {course.platform} {course.duration && `• ${course.duration}`}
                                          {isSearchLink && ` • ${language === 'ar' ? 'بحث على المنصة' : 'Find on platform'}`}
                                        </p>
                                      </a>
                                      <div className="flex shrink-0 items-center gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8"
                                          disabled={togglingCourseId === course.id}
                                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCourseCompleted(course.id, course.is_completed); }}
                                          aria-label={course.is_completed ? (language === 'ar' ? 'إلغاء الإكمال' : 'Mark incomplete') : (language === 'ar' ? 'تحديد مكتمل' : 'Mark complete')}
                                        >
                                          {togglingCourseId === course.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <CheckCircle2 className={`h-5 w-5 ${course.is_completed ? 'text-success' : 'text-muted-foreground'}`} />
                                          )}
                                        </Button>
                                        <a
                                          href={courseUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                                          aria-label={language === 'ar' ? 'فتح الرابط' : 'Open course'}
                                        >
                                          <ExternalLink className="h-3.5 w-3.5" />
                                          {language === 'ar' ? 'فتح' : 'Open'}
                                        </a>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </section>
                          )}

                          {/* Skills */}
                          {week.skills_to_learn && week.skills_to_learn.length > 0 && (
                            <section>
                              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {language === 'ar' ? 'المهارات للتعلم' : 'Skills to Learn'}
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {week.skills_to_learn.map((skill: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="font-normal">{skill}</Badge>
                                ))}
                              </div>
                            </section>
                          )}

                          {/* Deliverables */}
                          {week.deliverables && week.deliverables.length > 0 && (
                            <section>
                              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {language === 'ar' ? 'المخرجات' : 'Deliverables'}
                              </h4>
                              <ul className="space-y-1.5">
                                {week.deliverables.map((item: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </section>
                          )}

                          {/* Notes & Tasks for this week */}
                          <WeekNotes roadmapWeekId={week.id} />
                          <WeekTasks roadmapWeekId={week.id} showSections />

                          {/* Complete week: quiz + optional mark complete without quiz */}
                          {!week.is_completed && isCurrentWeek && (
                            <div className="flex flex-col gap-2">
                            <Button
                              onClick={() => handleStartQuiz(week)}
                              disabled={isCompletingWeek}
                              className="w-full btn-glow"
                            >
                                <GraduationCap className="mr-2 h-4 w-4 rtl:mr-0 rtl:ml-2" />
                              {t('quiz.takeQuiz')}
                            </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleMarkWeekComplete(week.id)}
                                disabled={isCompletingWeek}
                                className="w-full"
                              >
                                {language === 'ar' ? 'تحديد الأسبوع مكتملاً بدون اختبار' : 'Mark week complete (skip quiz)'}
                              </Button>
                            </div>
                          )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </motion.div>
            );
          })}
        </div>

        {/* Quiz Modal */}
        {quizWeek && (
          <QuizModal
            isOpen={!!quizWeek}
            onClose={() => setQuizWeek(null)}
            weekId={quizWeek.id}
            weekTitle={quizWeek.title}
            skills={quizWeek.skills}
            onComplete={handleQuizComplete}
          />
        )}

        {/* Quiz limit upgrade dialog */}
        <Dialog open={showQuizUpgrade} onOpenChange={setShowQuizUpgrade}>
          <DialogContent className="max-w-md" aria-describedby="quiz-upgrade-desc">
            <DialogTitle className="sr-only">{language === 'ar' ? 'حد الاختبارات' : 'Quiz limit'}</DialogTitle>
            <DialogDescription id="quiz-upgrade-desc" className="sr-only">
              {language === 'ar' ? 'تم الوصول لحد الاختبارات المجانية. ترقية للمزيد.' : 'Free quiz limit reached. Upgrade for more.'}
            </DialogDescription>
            <UpgradePrompt
              feature="quiz"
              remaining={getQuizzesRemaining()}
              limit={limits.quizzes}
            />
          </DialogContent>
        </Dialog>

        {/* Edit roadmap dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md" aria-describedby="edit-roadmap-desc">
            <DialogTitle>{language === 'ar' ? 'تعديل خريطة الطريق' : 'Edit roadmap'}</DialogTitle>
            <DialogDescription id="edit-roadmap-desc" className="sr-only">
              {language === 'ar' ? 'تعديل العنوان والوصف' : 'Edit title and description'}
            </DialogDescription>
            <div className="space-y-4 pt-2">
              <div>
                <Label htmlFor="edit-title">{language === 'ar' ? 'العنوان' : 'Title'}</Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-1"
                  placeholder={language === 'ar' ? 'عنوان خريطة الطريق' : 'Roadmap title'}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">{language === 'ar' ? 'الوصف' : 'Description'}</Label>
                <Textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="mt-1 min-h-[80px]"
                  placeholder={language === 'ar' ? 'وصف اختياري' : 'Optional description'}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button onClick={handleSaveEdit} disabled={!editTitle.trim() || isUpdatingRoadmap}>
                {isUpdatingRoadmap ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === 'ar' ? 'حفظ' : 'Save')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Archive confirm dialog */}
        <Dialog open={showArchiveConfirm} onOpenChange={setShowArchiveConfirm}>
          <DialogContent className="max-w-md" aria-describedby="archive-roadmap-desc">
            <DialogTitle>{language === 'ar' ? 'أرشفة خريطة الطريق' : 'Archive roadmap'}</DialogTitle>
            <DialogDescription id="archive-roadmap-desc" className="text-sm text-muted-foreground">
              {language === 'ar'
                ? 'أرشفة هذه خريطة الطريق؟ يمكنك فتحها لاحقاً من القائمة.'
                : 'Archive this roadmap? You can still open it from your list.'}
            </DialogDescription>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowArchiveConfirm(false)}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button variant="destructive" onClick={handleArchiveConfirm} disabled={isUpdatingRoadmap}>
                {isUpdatingRoadmap ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === 'ar' ? 'أرشفة' : 'Archive')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete confirm dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="max-w-md" aria-describedby="delete-roadmap-desc">
            <DialogTitle>{t('roadmap.deleteRoadmap')}</DialogTitle>
            <DialogDescription id="delete-roadmap-desc" className="text-sm text-muted-foreground">
              {t('roadmap.deleteConfirm')}
            </DialogDescription>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeletingRoadmap}>
                {isDeletingRoadmap ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === 'ar' ? 'حذف' : 'Delete')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
