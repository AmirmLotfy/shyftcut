import { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Briefcase, Loader2, ExternalLink, Upload } from 'lucide-react';
import { extractTextFromCvFile } from '@/lib/cv-extract';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiFetch, extractApiErrorMessage } from '@/lib/api';
import { dashboardPaths } from '@/lib/dashboard-routes';
import { PremiumGateCard } from '@/components/common/PremiumGateCard';
import { Skeleton } from '@/components/ui/skeleton';
import { getCareerToolsBenefits } from '@/lib/premium-features';

type CVAnalysis = {
  headline?: string;
  experience_summary?: string;
  education_summary?: string;
  sections_detected?: string[];
  strengths?: string[];
  gaps?: string[];
  recommendations?: string[];
  skill_keywords?: string[];
};

type JobRow = {
  id?: string;
  title: string;
  company: string | null;
  url: string;
  location_type: string;
  location: string | null;
  match_score: number | null;
  fetched_at?: string;
};


export default function CareerTools() {
  const { language } = useLanguage();
  const { user, getAccessToken } = useAuth();
  const { isPremium, isLoading: isLoadingSubscription } = useSubscription();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [cvPaste, setCvPaste] = useState('');
  const [cvAnalyzing, setCvAnalyzing] = useState(false);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvResult, setCvResult] = useState<CVAnalysis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [jobsFinding, setJobsFinding] = useState(false);

  const { data: jobsList = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs-list'],
    queryFn: async () => {
      const token = await getAccessToken();
      const data = await apiFetch<JobRow[]>('/api/jobs/list', { token });
      return Array.isArray(data) ? data : [];
    },
    enabled: !!isPremium,
  });

  const handleAnalyzeCv = async () => {
    const text = cvPaste.trim();
    if (text.length < 50) {
      toast({
        title: language === 'ar' ? 'نص قصير' : 'Text too short',
        description: language === 'ar' ? 'الصق 50 حرفاً على الأقل من سيرتك' : 'Paste at least 50 characters of your CV.',
        variant: 'destructive',
      });
      return;
    }
    setCvAnalyzing(true);
    setCvResult(null);
    try {
      const token = await getAccessToken();
      const res = await apiFetch<{ analysis?: CVAnalysis }>('/api/cv/analyze', {
        method: 'POST',
        token,
        body: JSON.stringify({ pasteText: text }),
      });
      setCvResult(res?.analysis ?? null);
      toast({
        title: language === 'ar' ? 'تم التحليل' : 'Analysis done',
        description: language === 'ar' ? 'تم تحليل سيرتك الذاتية' : 'Your CV has been analyzed.',
      });
    } catch (err: unknown) {
      const msg = extractApiErrorMessage(err as object, language === 'ar' ? 'فشل التحليل' : 'Analysis failed');
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setCvAnalyzing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCvUploading(true);
    setCvResult(null);
    try {
      const text = await extractTextFromCvFile(file);
      if (text.length < 50) {
        toast({
          title: language === 'ar' ? 'نص قصير جداً' : 'Text too short',
          description: language === 'ar' ? 'لم يتم استخراج نص كافٍ. جرّب PDF نصي أو أضف المزيد يدوياً.' : 'Not enough text extracted. Try a text-based PDF or add more manually.',
          variant: 'destructive',
        });
        return;
      }
      setCvPaste(text);
      toast({
        title: language === 'ar' ? 'تم التحميل' : 'File loaded',
        description: language === 'ar' ? `تم استخراج ${text.length.toLocaleString()} حرفاً من الملف` : `Extracted ${text.length.toLocaleString()} characters from file`,
      });
    } catch (err) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: err instanceof Error ? err.message : (language === 'ar' ? 'تعذر قراءة الملف. استخدم PDF أو TXT.' : 'Could not read file. Use PDF or TXT.'),
        variant: 'destructive',
      });
    } finally {
      setCvUploading(false);
      e.target.value = '';
    }
  };

  const handleFindJobs = async () => {
    setJobsFinding(true);
    try {
      const token = await getAccessToken();
      await apiFetch<{ jobs?: JobRow[]; saved?: number }>('/api/jobs/find', {
        method: 'POST',
        token,
        body: JSON.stringify({}),
      });
      queryClient.invalidateQueries({ queryKey: ['jobs-list'] });
      toast({
        title: language === 'ar' ? 'تم البحث' : 'Jobs found',
        description: language === 'ar' ? 'تم حفظ الوظائف في قائمتك' : 'Jobs have been saved to your list.',
      });
    } catch (err: unknown) {
      const msg = extractApiErrorMessage(err as object, language === 'ar' ? 'فشل البحث' : 'Find jobs failed');
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setJobsFinding(false);
    }
  };

  const isAr = language === 'ar';

  if (isLoadingSubscription) {
    return (
      <>
        <Helmet><title>Career Tools | Shyftcut</title></Helmet>
        <div className="container mx-auto max-w-app-content space-y-8 px-4 py-8 pb-24">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-72" />
          <div className="grid gap-6 sm:grid-cols-2">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </>
    );
  }

  if (!isPremium) {
    return (
      <>
        <Helmet><title>Career Tools | Shyftcut</title></Helmet>
        <PremiumGateCard
        variant="full"
        title={isAr ? 'أدوات المهنة' : 'Career Tools'}
        description={
          isAr
            ? 'تحليل السيرة الذاتية واقتراح 10 وظائف أسبوعياً متاحة لمشتركي بريميوم.'
            : 'CV analysis and weekly job recommendations are available for Premium subscribers.'
        }
        benefits={getCareerToolsBenefits(isAr ? 'ar' : 'en')        }
      />
      </>
    );
  }

  return (
    <>
      <Helmet><title>Career Tools | Shyftcut</title></Helmet>
      <div className="container mx-auto max-w-app-content space-y-8 px-4 py-8 pb-24">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isAr ? 'أدوات المهنة' : 'Career Tools'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAr ? 'تحليل سيرتك الذاتية والحصول على أفضل الوظائف المناسبة لك' : 'Analyze your CV and get the best job matches'}
          </p>
        </div>

        {/* CV Analysis */}
        <Card className="public-glass-card rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {isAr ? 'تحليل السيرة الذاتية' : 'CV Analysis'}
            </CardTitle>
            <CardDescription>
              {isAr ? 'الصق نص سيرتك الذاتية أو ارفع ملف PDF/TXT واحصل على نقاط القوة والفجوات والتوصيات' : 'Paste your CV text or upload a PDF/TXT file and get strengths, gaps, and recommendations'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              className="sr-only"
              aria-hidden
              onChange={handleFileUpload}
            />
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="cv-paste">{isAr ? 'نص السيرة الذاتية' : 'CV text'}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={cvUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  {cvUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {cvUploading ? (isAr ? 'جاري الاستخراج...' : 'Extracting...') : (isAr ? 'رفع PDF أو TXT' : 'Upload PDF or TXT')}
                </Button>
              </div>
              <Textarea
                id="cv-paste"
                value={cvPaste}
                onChange={(e) => setCvPaste(e.target.value)}
                placeholder={isAr ? 'الصق 50 حرفاً على الأقل من سيرتك الذاتية...' : 'Paste at least 50 characters of your CV...'}
                className="min-h-[160px] resize-y"
              />
            </div>
            <Button onClick={handleAnalyzeCv} disabled={cvAnalyzing} className="gap-2">
              {cvAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {cvAnalyzing ? (isAr ? 'جاري التحليل...' : 'Analyzing...') : (isAr ? 'تحليل السيرة' : 'Analyze CV')}
            </Button>

            {cvResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-border bg-muted/30 p-4 space-y-4"
              >
                {cvResult.headline ? (
                  <p className="text-sm font-medium border-b border-border pb-2">{cvResult.headline}</p>
                ) : null}
                {cvResult.experience_summary ? (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">{isAr ? 'ملخص الخبرة' : 'Experience summary'}</h4>
                    <p className="text-sm">{cvResult.experience_summary}</p>
                  </div>
                ) : null}
                {cvResult.education_summary ? (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">{isAr ? 'ملخص التعليم' : 'Education summary'}</h4>
                    <p className="text-sm">{cvResult.education_summary}</p>
                  </div>
                ) : null}
                {cvResult.sections_detected?.length ? (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">{isAr ? 'أقسام السيرة' : 'Sections detected'}</h4>
                    <div className="flex flex-wrap gap-1">
                      {cvResult.sections_detected.map((s, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
                {cvResult.strengths?.length ? (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">{isAr ? 'نقاط القوة' : 'Strengths'}</h4>
                    <ul className="list-disc list-inside space-y-0.5 text-sm">
                      {cvResult.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {cvResult.gaps?.length ? (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">{isAr ? 'فجوات للتطوير' : 'Gaps to develop'}</h4>
                    <ul className="list-disc list-inside space-y-0.5 text-sm">
                      {cvResult.gaps.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {cvResult.recommendations?.length ? (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">{isAr ? 'توصيات' : 'Recommendations'}</h4>
                    <ul className="list-disc list-inside space-y-0.5 text-sm">
                      {cvResult.recommendations.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {cvResult.skill_keywords?.length ? (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">{isAr ? 'كلمات المهارات' : 'Skill keywords'}</h4>
                    <div className="flex flex-wrap gap-1">
                      {cvResult.skill_keywords.map((s, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Find jobs */}
        <Card className="public-glass-card rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              {isAr ? 'اعثر على وظائف لي' : 'Find jobs for me'}
            </CardTitle>
            <CardDescription>
              {isAr ? 'احصل على 10 وظائف حقيقية مفتوحة الآن بناءً على موقعك ونوع العمل (عن بُعد / هجين / في المكتب)' : 'Get 10 real open jobs based on your location and work type (remote / hybrid / on-site)'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {isAr ? 'اضبط الموقع ونوع العمل من' : 'Set your location and work type in'}{' '}
              <Link to={dashboardPaths.profile} className="text-primary underline">{isAr ? 'الملف الشخصي' : 'Profile'}</Link>.
            </p>
            <Button onClick={handleFindJobs} disabled={jobsFinding} className="gap-2">
              {jobsFinding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Briefcase className="h-4 w-4" />
              )}
              {jobsFinding ? (isAr ? 'جاري البحث...' : 'Finding jobs...') : (isAr ? 'اعثر على 10 وظائف الآن' : 'Find 10 jobs now')}
            </Button>

            {jobsLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{isAr ? 'جاري التحميل...' : 'Loading...'}</span>
              </div>
            ) : jobsList.length > 0 ? (
              <ul className="space-y-3">
                {jobsList.slice(0, 20).map((job, i) => (
                  <li key={job.id ?? i} className="rounded-lg border border-border p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{job.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{job.company ?? '—'}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="outline" className="text-xs capitalize">{job.location_type?.replace('_', '-')}</Badge>
                        {job.match_score != null && (
                          <Badge variant="secondary" className="text-xs">{job.match_score}% match</Badge>
                        )}
                      </div>
                    </div>
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {isAr ? 'فتح' : 'Open'}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                {isAr ? 'اضغط "اعثر على 10 وظائف الآن" لملء القائمة. يتم إرسال 10 وظائف أسبوعياً إذا قمت بتفعيل ذلك في الملف الشخصي.' : 'Click "Find 10 jobs now" to fill your list. We send 10 jobs weekly if you enable it in Profile.'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
