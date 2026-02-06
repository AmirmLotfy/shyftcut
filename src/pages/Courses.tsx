import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, ExternalLink, Filter, Search, Star, Clock, DollarSign, Check, Bookmark, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRoadmap } from '@/hooks/useRoadmap';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { dashboardPaths } from '@/lib/dashboard-routes';
import { hasValidCourseUrl, getCourseSearchUrl } from '@/lib/course-links';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export default function Courses() {
  const { language, t } = useLanguage();
  const { getAccessToken } = useAuth();
  const { activeRoadmap, isLoading, isError, error } = useRoadmap();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [weekFilter, setWeekFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState('relevance');

  // Sorted weeks (same order as Roadmap)
  const weeks = useMemo(() => {
    if (!activeRoadmap?.roadmap_weeks) return [];
    return [...activeRoadmap.roadmap_weeks].sort((a: any, b: any) => a.week_number - b.week_number);
  }, [activeRoadmap]);

  // Unlocked week numbers: Week 1 always, then Week N when Week N-1 is completed (matches Roadmap)
  const unlockedWeekNumbers = useMemo(() => {
    const nums: number[] = [];
    for (let i = 0; i < weeks.length; i++) {
      const w = weeks[i];
      const prev = weeks[i - 1];
      if (i === 0 || prev?.is_completed) {
        nums.push(w.week_number);
      }
    }
    return nums;
  }, [weeks]);

  const unlockedSet = useMemo(() => new Set(unlockedWeekNumbers), [unlockedWeekNumbers]);

  // Only courses from unlocked weeks (matches Roadmap progression)
  const allCourses = useMemo(() => {
    return weeks.flatMap((week: any) =>
      (week.course_recommendations || []).map((course: any) => ({
        ...course,
        weekNumber: week.week_number,
        weekTitle: week.title,
      }))
    ).filter((c: any) => unlockedSet.has(c.weekNumber));
  }, [weeks, unlockedSet]);

  // Total courses (all weeks) for locked-week hint
  const totalCourseCount = useMemo(() => {
    return weeks.reduce((acc: number, w: any) => acc + (w.course_recommendations?.length || 0), 0);
  }, [weeks]);

  // Sync week filter from URL (?week=3) when navigating from Dashboard/Roadmap
  useEffect(() => {
    const w = searchParams.get('week');
    if (w) {
      const n = parseInt(w, 10);
      if (!isNaN(n) && n >= 1 && unlockedSet.has(n)) setWeekFilter(String(n));
    }
  }, [searchParams, unlockedSet]);

  // Reset week filter if selected week is locked (e.g. user navigated away and back)
  useEffect(() => {
    if (weekFilter !== 'all') {
      const n = parseInt(weekFilter, 10);
      if (!isNaN(n) && !unlockedSet.has(n)) setWeekFilter('all');
    }
  }, [weekFilter, unlockedSet]);

  // Week numbers for filter (only unlocked)
  const weekNumbers = useMemo(() => [...unlockedWeekNumbers], [unlockedWeekNumbers]);

  // Unique platforms from unlocked courses
  const platforms = useMemo(() => {
    const byLower = new Map<string, string>();
    for (const c of allCourses) {
      const p = String(c.platform || '').trim();
      if (!p) continue;
      const key = p.toLowerCase();
      if (!byLower.has(key)) byLower.set(key, p);
    }
    return Array.from(byLower.values()).sort((a, b) => a.localeCompare(b));
  }, [allCourses]);

  // Normalize difficulty for comparison (AI may return "Beginner" vs "beginner")
  const norm = (s: string | null | undefined) => String(s || '').toLowerCase().trim();

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    let filtered = allCourses;

    // Week filter (align with week-by-week view)
    if (weekFilter !== 'all') {
      const weekNum = parseInt(weekFilter, 10);
      if (!isNaN(weekNum)) {
        filtered = filtered.filter((c: any) => c.weekNumber === weekNum);
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((c: any) =>
        (c.title && c.title.toLowerCase().includes(query)) ||
        (c.platform && c.platform.toLowerCase().includes(query)) ||
        (c.instructor && c.instructor.toLowerCase().includes(query))
      );
    }

    // Platform filter (case-insensitive)
    if (platformFilter !== 'all') {
      const pf = platformFilter.toLowerCase();
      filtered = filtered.filter((c: any) => norm(c.platform) === pf);
    }

    // Difficulty filter (case-insensitive, normalizes AI variants like "Beginner")
    if (difficultyFilter !== 'all') {
      const df = difficultyFilter.toLowerCase();
      filtered = filtered.filter((c: any) => norm(c.difficulty_level) === df);
    }

    // Status filter (to do / completed / saved)
    if (statusFilter === 'completed') {
      filtered = filtered.filter((c: any) => c.is_completed);
    } else if (statusFilter === 'todo') {
      filtered = filtered.filter((c: any) => !c.is_completed);
    } else if (statusFilter === 'saved') {
      filtered = filtered.filter((c: any) => c.is_saved);
    }

    // Sort
    switch (sortBy) {
      case 'relevance':
        filtered = [...filtered].sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
        break;
      case 'rating':
        filtered = [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'price_low':
        filtered = [...filtered].sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price_high':
        filtered = [...filtered].sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'week':
        filtered = [...filtered].sort((a, b) => a.weekNumber - b.weekNumber);
        break;
    }

    return filtered;
  }, [allCourses, searchQuery, weekFilter, platformFilter, difficultyFilter, statusFilter, sortBy]);

  const toggleSaved = async (courseId: string, currentSaved: boolean) => {
    const token = await getAccessToken();
    try {
      await apiFetch(`/api/courses/${courseId}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ is_saved: !currentSaved }),
      });
      queryClient.invalidateQueries({ queryKey: ['activeRoadmap'] });
    } catch (error) {
      toast({
        title: t('common.errorTitle'),
        description: language === 'ar' ? 'فشل في الحفظ' : 'Failed to save',
        variant: 'destructive',
      });
    }
  };

  const toggleCompleted = async (courseId: string, currentCompleted: boolean) => {
    const token = await getAccessToken();
    try {
      await apiFetch(`/api/courses/${courseId}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ is_completed: !currentCompleted }),
      });
      queryClient.invalidateQueries({ queryKey: ['activeRoadmap'] });
      toast({
        title: currentCompleted 
          ? (language === 'ar' ? 'تم إلغاء الإكمال' : 'Marked incomplete')
          : (language === 'ar' ? 'تم الإكمال!' : 'Marked complete!'),
      });
    } catch (error) {
      toast({
        title: t('common.errorTitle'),
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
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
              {(error as Error)?.message || (language === 'ar' ? 'تعذر تحميل الدورات.' : 'We couldn\'t load your courses. Please try again.')}
            </p>
            <Button asChild>
              <Link to={dashboardPaths.index}>{language === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}</Link>
            </Button>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="container mx-auto max-w-app-content px-4 pb-24 pt-6 sm:px-6 sm:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="mb-2 text-2xl font-bold sm:text-3xl">
            {language === 'ar' ? 'مكتبة الدورات' : 'Course Library'}
          </h1>
          <p className="text-muted-foreground">
            {filteredCourses.length !== allCourses.length
              ? (language === 'ar'
                ? `عرض ${filteredCourses.length} من ${allCourses.length} دورة`
                : `Showing ${filteredCourses.length} of ${allCourses.length} courses`)
              : (language === 'ar'
                ? `${allCourses.length} دورة متاحة (حسب تقدمك في خريطة الطريق)`
                : `${allCourses.length} courses available (follows your roadmap progress)`)}
          </p>
          {totalCourseCount > allCourses.length && (
            <p className="mt-1 text-sm text-muted-foreground/80">
              {language === 'ar'
                ? `أكمل الأسابيع الحالية لفتح ${totalCourseCount - allCourses.length} دورة إضافية`
                : `Complete current weeks to unlock ${totalCourseCount - allCourses.length} more courses`}
            </p>
          )}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 flex flex-wrap gap-4"
        >
          <div className="relative min-w-0 w-full flex-1 sm:min-w-[200px] sm:w-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
            <Input
              placeholder={language === 'ar' ? 'ابحث عن دورة...' : 'Search courses...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rtl:pl-0 rtl:pr-10"
            />
          </div>

          <Select value={weekFilter} onValueChange={setWeekFilter}>
            <SelectTrigger className="min-touch w-full min-w-0 sm:w-[140px]">
              <SelectValue placeholder={language === 'ar' ? 'الأسبوع' : 'Week'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'ar' ? 'كل الأسابيع' : 'All Weeks'}</SelectItem>
              {weekNumbers.map((wn) => (
                <SelectItem key={wn} value={String(wn)}>
                  {language === 'ar' ? `الأسبوع ${wn}` : `Week ${wn}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="min-touch w-full min-w-0 sm:w-[160px]">
              <Filter className="mr-2 h-4 w-4 shrink-0 rtl:mr-0 rtl:ml-2" />
              <SelectValue placeholder={language === 'ar' ? 'المنصة' : 'Platform'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'ar' ? 'كل المنصات' : 'All Platforms'}</SelectItem>
              {platforms.filter((p) => p && p.trim()).map((platform) => (
                <SelectItem key={platform} value={platform}>{platform}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="min-touch w-full min-w-0 sm:w-[160px]">
              <SelectValue placeholder={language === 'ar' ? 'المستوى' : 'Difficulty'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'ar' ? 'كل المستويات' : 'All Levels'}</SelectItem>
              <SelectItem value="beginner">{language === 'ar' ? 'مبتدئ' : 'Beginner'}</SelectItem>
              <SelectItem value="intermediate">{language === 'ar' ? 'متوسط' : 'Intermediate'}</SelectItem>
              <SelectItem value="advanced">{language === 'ar' ? 'متقدم' : 'Advanced'}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="min-touch w-full min-w-0 sm:w-[140px]">
              <SelectValue placeholder={language === 'ar' ? 'الحالة' : 'Status'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
              <SelectItem value="todo">{language === 'ar' ? 'للمراجعة' : 'To Do'}</SelectItem>
              <SelectItem value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</SelectItem>
              <SelectItem value="saved">{language === 'ar' ? 'محفوظ' : 'Saved'}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="min-touch w-full min-w-0 sm:w-[180px]">
              <SelectValue placeholder={language === 'ar' ? 'ترتيب' : 'Sort by'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">{language === 'ar' ? 'الأكثر صلة' : 'Most Relevant'}</SelectItem>
              <SelectItem value="rating">{language === 'ar' ? 'التقييم' : 'Highest Rated'}</SelectItem>
              <SelectItem value="price_low">{language === 'ar' ? 'السعر (الأقل)' : 'Price: Low to High'}</SelectItem>
              <SelectItem value="price_high">{language === 'ar' ? 'السعر (الأعلى)' : 'Price: High to Low'}</SelectItem>
              <SelectItem value="week">{language === 'ar' ? 'الأسبوع' : 'By Week'}</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Course Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course: any, index: number) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`public-glass-card h-full rounded-2xl transition-all ${
                course.is_completed ? 'opacity-60' : ''
              }`}>
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="mb-3 flex items-start justify-between">
                    <Badge variant="outline" className="text-xs">
                      {language === 'ar' ? `الأسبوع ${course.weekNumber}` : `Week ${course.weekNumber}`}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleSaved(course.id, course.is_saved)}
                      >
                        <Bookmark className={`h-4 w-4 ${course.is_saved ? 'fill-current text-primary' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleCompleted(course.id, course.is_completed)}
                      >
                        <Check className={`h-4 w-4 ${course.is_completed ? 'text-success' : ''}`} />
                      </Button>
                    </div>
                  </div>

                  {/* Platform badge */}
                  <Badge className="mb-2" variant="secondary">
                    {course.platform}
                  </Badge>

                  {/* Title */}
                  <h3 className="mb-2 line-clamp-2 font-semibold leading-tight">
                    {course.title}
                  </h3>

                  {/* Instructor */}
                  {course.instructor && (
                    <p className="mb-3 text-sm text-muted-foreground">
                      {language === 'ar' ? 'بواسطة' : 'by'} {course.instructor}
                    </p>
                  )}

                  {/* Meta info */}
                  <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    {course.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.duration}
                      </span>
                    )}
                    {course.rating && (
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        {course.rating}
                      </span>
                    )}
                    {course.price !== undefined && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {course.price === 0 ? (language === 'ar' ? 'مجاني' : 'Free') : `$${course.price}`}
                      </span>
                    )}
                  </div>

                  {/* Difficulty */}
                  {course.difficulty_level && (
                    <Badge variant="outline" className="mb-4 capitalize">
                      {course.difficulty_level}
                    </Badge>
                  )}

                  {/* Action */}
                  <Button asChild className="w-full gap-2" variant={course.is_completed ? 'outline' : 'default'}>
                    <a href={hasValidCourseUrl(course.url) ? course.url : getCourseSearchUrl(course.platform ?? '', course.title ?? '')} target="_blank" rel="noopener noreferrer">
                      <BookOpen className="h-4 w-4" />
                      {course.is_completed 
                        ? (language === 'ar' ? 'مراجعة' : 'Review')
                        : (language === 'ar' ? 'بدء التعلم' : 'Start Learning')}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="py-20 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">
              {language === 'ar' ? 'لم يتم العثور على دورات' : 'No courses found'}
            </h3>
            <p className="text-muted-foreground">
              {language === 'ar' ? 'حاول تغيير معايير البحث' : 'Try adjusting your search filters'}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
