import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2, Briefcase, Target, Brain, BookOpen, Clock, Lightbulb, CheckCircle2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { WizardStep, StepIndicator } from '@/components/wizard/WizardStep';
import { RoadmapTeaser, type RoadmapTeaserData } from '@/components/wizard/RoadmapTeaser';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { UpgradePrompt } from '@/components/common/UpgradePrompt';
import { apiPath, apiHeaders, extractApiErrorMessage } from '@/lib/api';
import { playRoadmapReadySound } from '@/lib/sounds';
import { debugLog, debugError } from '@/lib/debug';
import { captureException } from '@/lib/error-tracking';

const industries = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Marketing', 
  'Sales', 'Manufacturing', 'Retail', 'Consulting', 'Media', 
  'Non-profit', 'Government', 'Other'
];

const experienceLevels = ['entry', 'junior', 'mid', 'senior', 'executive'];

/** Current role options (reused for job title select — no free text). */
const currentJobTitles = [
  'Software Engineer', 'Data Scientist', 'Product Manager', 'UX Designer',
  'DevOps Engineer', 'Cloud Architect', 'Machine Learning Engineer',
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Cybersecurity Analyst', 'Business Analyst', 'Project Manager',
  'Marketing Manager', 'Sales Manager', 'HR Manager', 'Student', 'Other',
];

const targetCareers = [
  'Software Engineer', 'Data Scientist', 'Product Manager', 'UX Designer',
  'DevOps Engineer', 'Cloud Architect', 'Machine Learning Engineer',
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Cybersecurity Analyst', 'Business Analyst', 'Project Manager',
  'Marketing Manager', 'Sales Manager', 'HR Manager', 'Other'
];

/** Preset motivation options for career change (no free text). */
const careerReasonPresets: { value: string; labelEn: string; labelAr: string }[] = [
  { value: 'Career growth', labelEn: 'Career growth', labelAr: 'نمو مهني' },
  { value: 'Switch industry', labelEn: 'Switch industry', labelAr: 'تغيير المجال' },
  { value: 'Upskill', labelEn: 'Upskill', labelAr: 'تطوير المهارات' },
  { value: 'New challenge', labelEn: 'New challenge', labelAr: 'تحدٍ جديد' },
  { value: 'Other', labelEn: 'Other', labelAr: 'أخرى' },
];

const learningStyles = ['video', 'reading', 'hands-on', 'mixed'];
const platforms = [
  'Coursera', 'Udemy', 'LinkedIn Learning', 'YouTube', 'Pluralsight', 'Skillshare',
  'edX', 'FutureLearn', 'Khan Academy', 'Codecademy', 'DataCamp', 'freeCodeCamp',
  'MasterClass', 'Microsoft Learn', 'AWS Training', 'Google Cloud Skills',
];
const budgetOptions = ['free', 'up_to_50', 'up_to_200', 'unlimited'];

const commonSkills = [
  'JavaScript', 'Python', 'Java', 'SQL', 'React', 'Node.js', 'AWS', 'Docker',
  'Git', 'Agile', 'Project Management', 'Data Analysis', 'Excel', 'Communication',
  'Leadership', 'Problem Solving', 'Machine Learning', 'TypeScript', 'HTML/CSS'
];

const GUEST_PROFILE_KEY = 'guest_roadmap_profile';
const GUEST_TEASER_KEY = 'guest_roadmap_teaser';

export default function Wizard() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [isGenerating, setIsGenerating] = useState(false);
  const { t, language, setLanguage } = useLanguage();
  const { user, getAccessToken } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { canCreateRoadmap, getRoadmapsRemaining, limits, isLoading: isLoadingLimits } = useUsageLimits();
  const [previewData, setPreviewData] = useState<RoadmapTeaserData | null>(null);
  const guestRestoreDone = useRef(false);

  // Form state (no text inputs: jobTitle, careerReason, skills from selects/chips only)
  const [formData, setFormData] = useState({
    jobTitle: '',
    industry: '',
    experienceLevel: '',
    targetCareer: '',
    careerReason: '',
    timeline: '12',
    skills: [] as string[],
    learningStyle: '',
    preferredPlatforms: [] as string[],
    weeklyHours: 10,
    budget: '',
  });

  const totalSteps = 6;
  const stepLabels = [
    t('wizard.stepLabel0'),
    t('wizard.stepLabel1'),
    t('wizard.stepLabel2'),
    t('wizard.stepLabel3'),
    t('wizard.stepLabel4'),
    t('wizard.stepLabel5'),
  ];

  const stepIcons = [Globe, Briefcase, Target, Brain, BookOpen, Clock];

  const GENERATING_STATEMENT_KEYS = [
    'wizard.generating.statement1',
    'wizard.generating.statement2',
    'wizard.generating.statement3',
    'wizard.generating.statement4',
    'wizard.generating.statement5',
    'wizard.generating.statement6',
  ];
  const FUN_FACT_KEYS = [
    'wizard.generating.funFact1',
    'wizard.generating.funFact2',
    'wizard.generating.funFact3',
    'wizard.generating.funFact4',
    'wizard.generating.funFact5',
    'wizard.generating.funFact6',
    'wizard.generating.funFact7',
    'wizard.generating.funFact8',
  ];
  const [generatingStatementIndex, setGeneratingStatementIndex] = useState(0);
  const [funFactIndex, setFunFactIndex] = useState(0);
  const [skillFilter, setSkillFilter] = useState('');
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setGeneratingStatementIndex((prev) => (prev + 1) % GENERATING_STATEMENT_KEYS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isGenerating]);

  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setFunFactIndex((prev) => (prev + 1) % FUN_FACT_KEYS.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const updateForm = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const togglePlatform = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      preferredPlatforms: prev.preferredPlatforms.includes(platform)
        ? prev.preferredPlatforms.filter(p => p !== platform)
        : [...prev.preferredPlatforms, platform],
    }));
  };

  const nextStep = () => {
    if (step < totalSteps - 1) {
      setDirection('forward');
      setStep(step + 1);
      setTimeout(() => nextButtonRef.current?.focus(), 100);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setDirection('backward');
      setStep(step - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.defaultPrevented) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.tagName === 'BUTTON' || target.getAttribute('role') === 'combobox') return;
      if (!isStepValid()) return;
      e.preventDefault();
      if (step < totalSteps - 1) nextStep();
      else generateRoadmap();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, totalSteps, formData]);

  // After signup/login from guest teaser: restore guest profile and generate full roadmap
  useEffect(() => {
    if (!user || searchParams.get('from') !== 'guest' || guestRestoreDone.current) return;
    const stored = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(GUEST_PROFILE_KEY) : null;
    if (!stored) return;

    guestRestoreDone.current = true;
    let profileData: Record<string, unknown>;
    try {
      profileData = JSON.parse(stored) as Record<string, unknown>;
    } catch {
      sessionStorage.removeItem(GUEST_PROFILE_KEY);
      sessionStorage.removeItem(GUEST_TEASER_KEY);
      return;
    }

    const run = async () => {
      const token = await getAccessToken();
      if (!token) return;
      try {
        const res = await fetch(apiPath('/api/roadmap/generate'), {
          method: 'POST',
          headers: apiHeaders('/api/roadmap/generate', token),
          body: JSON.stringify({ profileData }),
        });
        const responseText = await res.text();
        sessionStorage.removeItem(GUEST_PROFILE_KEY);
        sessionStorage.removeItem(GUEST_TEASER_KEY);
        if (!res.ok) {
          let data: Record<string, unknown> = {};
          try {
            if (responseText.trim()) data = JSON.parse(responseText) as Record<string, unknown>;
          } catch {
            /* ignore */
          }
          const msg = extractApiErrorMessage(data, res.statusText || t('wizard.serverError'));
          toast({ title: t('common.errorTitle'), description: msg, variant: 'destructive' });
          return;
        }
        let data: { roadmapId: string };
        try {
          data = JSON.parse(responseText) as { roadmapId: string };
        } catch {
          toast({ title: t('common.errorTitle'), description: t('wizard.invalidResponse'), variant: 'destructive' });
          return;
        }
        toast({ title: t('wizard.roadmapGenerated'), description: t('wizard.roadmapGeneratedDesc') });
        await queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
        await queryClient.invalidateQueries({ queryKey: ['activeRoadmap'] });
        queryClient.invalidateQueries({ queryKey: ['roadmap', data.roadmapId] });
        navigate(`/roadmap/${data.roadmapId}`);
      } catch (err) {
        sessionStorage.removeItem(GUEST_PROFILE_KEY);
        sessionStorage.removeItem(GUEST_TEASER_KEY);
        debugError('Wizard', 'guest restore generate failed', err);
        captureException(err);
        toast({ title: t('common.errorTitle'), description: t('wizard.failedToGenerate'), variant: 'destructive' });
      }
    };
    void run();
  }, [user, searchParams, getAccessToken, navigate, queryClient, t, toast]);

  const profilePayload = {
    jobTitle: formData.jobTitle,
    industry: formData.industry,
    experienceLevel: formData.experienceLevel,
    targetCareer: formData.targetCareer,
    timeline: formData.timeline,
    skills: formData.skills,
    learningStyle: formData.learningStyle,
    preferredPlatforms: formData.preferredPlatforms,
    weeklyHours: formData.weeklyHours,
    budget: formData.budget,
    careerReason: formData.careerReason || undefined,
    preferredLanguage: language,
  };

  const generateRoadmap = async () => {
    setIsGenerating(true);
    try {
      if (!user) {
        const res = await fetch(apiPath('/api/roadmap/generate-guest'), {
          method: 'POST',
          headers: apiHeaders('/api/roadmap/generate-guest', null),
          body: JSON.stringify({ profileData: profilePayload }),
        });
        const responseText = await res.text();
        if (!res.ok) {
          let data: Record<string, unknown> = {};
          try {
            if (responseText.trim()) data = JSON.parse(responseText) as Record<string, unknown>;
          } catch {
            /* non-JSON error body */
          }
          let msg = extractApiErrorMessage(data, res.statusText || t('wizard.serverError'));
          if (res.status === 429) {
            msg = t('wizard.rateLimitPreview');
          }
          throw new Error(msg);
        }
        let data: RoadmapTeaserData;
        try {
          data = JSON.parse(responseText) as RoadmapTeaserData;
        } catch {
          throw new Error(t('wizard.invalidResponse'));
        }
        try {
          sessionStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profilePayload));
          sessionStorage.setItem(GUEST_TEASER_KEY, JSON.stringify({ title: data.title, description: data.description ?? '' }));
        } catch {
          /* ignore storage errors */
        }
        playRoadmapReadySound();
        setPreviewData(data);
        return;
      }

      const token = await getAccessToken();
      if (!token) {
        setIsGenerating(false);
        return;
      }
      const res = await fetch(apiPath('/api/roadmap/generate'), {
        method: 'POST',
        headers: apiHeaders('/api/roadmap/generate', token),
        body: JSON.stringify({ profileData: profilePayload }),
      });

      const responseText = await res.text();
      if (!res.ok) {
        let data: Record<string, unknown> = {};
        try {
          if (responseText.trim()) data = JSON.parse(responseText) as Record<string, unknown>;
        } catch {
          /* non-JSON error body (e.g. HTML or plain text) */
        }
        let msg = extractApiErrorMessage(data, res.statusText || t('wizard.serverError'));
        if (res.status === 429) {
          msg = t('wizard.rateLimit');
        } else if (res.status === 402) {
          msg = msg || t('wizard.roadmapLimit');
        }
        throw new Error(msg);
      }

      let data: { roadmapId: string };
      try {
        data = JSON.parse(responseText) as { roadmapId: string };
      } catch {
        throw new Error(t('wizard.invalidResponse'));
      }

      playRoadmapReadySound();
      toast({
        title: t('wizard.roadmapGenerated'),
        description: t('wizard.roadmapGeneratedDesc'),
      });

      await queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
      await queryClient.invalidateQueries({ queryKey: ['activeRoadmap'] });
      queryClient.invalidateQueries({ queryKey: ['roadmap', data.roadmapId] });
      navigate(`/roadmap/${data.roadmapId}`);
    } catch (error) {
      debugError('Wizard', 'generateRoadmap failed', error);
      captureException(error);
      toast({
        title: t('common.errorTitle'),
        description: error instanceof Error ? error.message : t('wizard.failedToGenerate'),
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 0:
        return true; // Language step: valid once they see it; choice advances via buttons
      case 1:
        return formData.jobTitle && formData.industry && formData.experienceLevel;
      case 2:
        return formData.targetCareer;
      case 3:
        return formData.skills.length >= 2;
      case 4:
        return formData.learningStyle && formData.preferredPlatforms.length > 0;
      case 5:
        return formData.weeklyHours > 0 && formData.budget;
      default:
        return false;
    }
  };

  const validationMessageKey = (): string | null => {
    if (isStepValid()) return null;
    switch (step) {
      case 0: return null;
      case 1: return 'wizard.validation.about';
      case 2: return 'wizard.validation.goals';
      case 3: return 'wizard.validation.skills';
      case 4: return 'wizard.validation.platforms';
      case 5: return 'wizard.validation.availability';
      default: return null;
    }
  };

  const handleLanguageChoose = (lang: 'en' | 'ar') => {
    setLanguage(lang);
    setDirection('forward');
    setStep(1);
    setTimeout(() => nextButtonRef.current?.focus(), 100);
  };

  const CurrentIcon = stepIcons[step];

  /** Display label for wizard option; value sent to API stays in English. */
  const getOptionLabel = (type: 'industry' | 'level' | 'jobTitle' | 'platform' | 'learningStyle', value: string) => {
    const key = `wizard.label.${type}.${value}`;
    const out = t(key);
    return out === key ? value : out;
  };

  // Dedicated generating screen: progress, step indicators, current statement, rotating fun facts
  if (isGenerating) {
    const genProgress = ((generatingStatementIndex + 1) / GENERATING_STATEMENT_KEYS.length) * 100;
    return (
      <Layout hideFooter>
        <div
          className="flex min-h-[calc(100vh-4rem)] flex-col bg-gradient-to-b from-background via-background to-primary/5"
          style={{ minHeight: 'calc(100vh - 4rem)' }}
        >
          <div className="container mx-auto w-full max-w-2xl flex-1 flex flex-col px-4 py-6 sm:py-10">
            {/* Progress and step dots */}
            <div className="mb-6 sm:mb-8">
              <Progress value={genProgress} className="h-2 mb-4" />
              <div className="flex justify-between">
                {GENERATING_STATEMENT_KEYS.map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{
                      scale: 1,
                      opacity: i <= generatingStatementIndex ? 1 : 0.4,
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary/30 bg-background text-xs font-medium transition-colors sm:h-9 sm:w-9"
                    style={{
                      backgroundColor: i <= generatingStatementIndex ? 'hsl(var(--primary) / 0.15)' : 'transparent',
                      borderColor: i <= generatingStatementIndex ? 'hsl(var(--primary))' : undefined,
                    }}
                  >
                    {i < generatingStatementIndex ? (
                      <CheckCircle2 className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
                    ) : (
                      i + 1
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Current step: statement + title */}
            <motion.div
              key={generatingStatementIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="public-glass-card flex flex-col items-center justify-center rounded-2xl px-6 py-8 shadow-sm sm:px-10 sm:py-10"
            >
              <div className="flex items-center gap-3 mb-3">
                <Brain className="h-7 w-7 animate-pulse text-primary sm:h-8 sm:w-8" />
                <p className="text-lg font-medium text-foreground sm:text-xl">
                  {t(GENERATING_STATEMENT_KEYS[generatingStatementIndex])}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">{t('wizard.generating.title')}</p>
            </motion.div>

            {/* Did you know? — rotating fun facts */}
            <motion.div
              key={funFactIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="mt-6 flex-1 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-5 sm:mt-8 sm:px-6 sm:py-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                <span className="text-sm font-semibold text-primary sm:text-base">
                  {t('wizard.generating.didYouKnow')}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed sm:text-base">
                {t(FUN_FACT_KEYS[funFactIndex])}
              </p>
            </motion.div>

            {/* Subtle reassurance */}
            <p className="mt-6 text-center text-xs text-muted-foreground/80 sm:mt-8">
              {t('wizard.generating.usuallyUnderMinute')}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // Guest: show teaser after preview generation
  if (!user && previewData) {
    return (
      <Layout hideFooter>
        <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-start pt-8">
          <RoadmapTeaser data={previewData} />
        </div>
      </Layout>
    );
  }

  // Logged-in user: show upgrade prompt if at roadmap limit
  if (user && !isLoadingLimits && !canCreateRoadmap()) {
    return (
      <Layout hideFooter>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-8">
          <div className="container mx-auto px-4">
            <UpgradePrompt 
              feature="roadmap" 
              remaining={getRoadmapsRemaining()} 
              limit={limits.roadmaps} 
            />
          </div>
        </div>
      </Layout>
    );
  }

  const filteredSkills = skillFilter.trim()
    ? commonSkills.filter((s) => s.toLowerCase().includes(skillFilter.trim().toLowerCase()))
    : commonSkills;

  return (
    <Layout hideFooter>
      <div data-testid="wizard-form" className="min-h-[calc(100vh-4rem)] py-8">
        <div className="container mx-auto max-w-5xl px-4">
          {/* Hero: two-zone layout (desktop) */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 grid gap-8 md:grid-cols-[1fr,auto] md:items-start"
          >
            <div>
              <h1 className="mb-2 text-2xl font-bold sm:text-3xl">
                {t('wizard.pageTitle')}
              </h1>
              <p className="text-muted-foreground">
                {t('wizard.pageSubtitle')}
              </p>
            </div>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground md:min-w-[180px]">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {t('wizard.bullet12Week')}
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {t('wizard.bulletCourses')}
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {t('wizard.bulletCoach')}
              </li>
            </ul>
          </motion.div>

          {/* Step indicator (mobile pill) + desktop rail + form card */}
          <div className="flex flex-col md:flex-row md:gap-8">
            <div className="md:pt-2">
              <StepIndicator
                currentStep={step}
                totalSteps={totalSteps}
                labels={stepLabels}
                stepIcons={stepIcons}
              />
            </div>

            <Card className="public-glass-card mt-4 flex-1 min-w-0 shadow-lg shadow-primary/5 md:mt-0 md:max-w-2xl">
              <CardContent className="p-6 md:p-8">
                <div className="mb-6 flex items-center gap-2">
                  <CurrentIcon className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <h2 className="text-lg font-semibold">
                      {step + 1} — {step === 0 ? t('wizard.step0.title') : t(`wizard.step${step}.title`)}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {step === 0 ? t('wizard.step0.subtitle') : t(`wizard.step${step}.subtitle`)}
                    </p>
                  </div>
                </div>

              {/* Step 0: Language */}
              <WizardStep isActive={step === 0} direction={direction}>
                <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="flex-1 h-auto py-6 flex flex-col gap-2 border-2 hover:border-primary hover:bg-primary/5"
                    onClick={() => handleLanguageChoose('en')}
                  >
                    <span className="text-lg font-semibold">{t('wizard.english')}</span>
                    <span className="text-sm text-muted-foreground font-normal">{t('wizard.continueEnglish')}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="flex-1 h-auto py-6 flex flex-col gap-2 border-2 hover:border-primary hover:bg-primary/5"
                    onClick={() => handleLanguageChoose('ar')}
                  >
                    <span className="text-lg font-semibold">{t('wizard.arabic')}</span>
                    <span className="text-sm text-muted-foreground font-normal">{t('wizard.continueArabic')}</span>
                  </Button>
                </div>
              </WizardStep>

              {/* Step 1: About You — split: form left, "Why we ask" right */}
              <WizardStep isActive={step === 1} direction={direction}>
                <div className="grid gap-6 md:grid-cols-[1fr,auto]">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t('wizard.currentJobTitle')}</Label>
                      <Select value={formData.jobTitle} onValueChange={(v) => updateForm('jobTitle', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('wizard.selectJobTitle')} />
                        </SelectTrigger>
                        <SelectContent>
                          {currentJobTitles.map((title) => (
                            <SelectItem key={title} value={title}>{getOptionLabel('jobTitle', title)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('wizard.industry')}</Label>
                      <Select value={formData.industry} onValueChange={(v) => updateForm('industry', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('wizard.selectIndustry')} />
                        </SelectTrigger>
                        <SelectContent>
                          {industries.map((ind) => (
                            <SelectItem key={ind} value={ind}>{getOptionLabel('industry', ind)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('wizard.experienceLevel')}</Label>
                      <Select value={formData.experienceLevel} onValueChange={(v) => updateForm('experienceLevel', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('wizard.selectLevel')} />
                        </SelectTrigger>
                        <SelectContent>
                          {experienceLevels.map((level) => (
                            <SelectItem key={level} value={level}>
                              {getOptionLabel('level', level)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <p className="hidden text-sm text-muted-foreground md:block md:max-w-[180px] md:pt-8">
                    {t('wizard.whyWeAskAbout')}
                  </p>
                </div>
              </WizardStep>

              {/* Step 2: Career Goals */}
              <WizardStep isActive={step === 2} direction={direction}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('wizard.targetCareer')}</Label>
                    <Select value={formData.targetCareer} onValueChange={(v) => updateForm('targetCareer', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('wizard.selectCareer')} />
                      </SelectTrigger>
                      <SelectContent>
                        {targetCareers.map((career) => (
                          <SelectItem key={career} value={career}>{getOptionLabel('jobTitle', career)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('wizard.whyChange')}</Label>
                    <div className="flex flex-wrap gap-2" role="group" aria-label={t('wizard.reasonAria')}>
                      {careerReasonPresets.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          aria-pressed={formData.careerReason === preset.value}
                          onClick={() => updateForm('careerReason', formData.careerReason === preset.value ? '' : preset.value)}
                          className={`rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                            formData.careerReason === preset.value
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          {preset.value === 'Career growth' ? t('wizard.reasonGrowth') : preset.value === 'Switch industry' ? t('wizard.reasonSwitch') : preset.value === 'Upskill' ? t('wizard.reasonUpskill') : preset.value === 'New challenge' ? t('wizard.reasonChallenge') : t('wizard.reasonOther')}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('wizard.timeline')}</Label>
                    <Select value={formData.timeline} onValueChange={(v) => updateForm('timeline', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">{t('wizard.timeline12')}</SelectItem>
                        <SelectItem value="24">{t('wizard.timeline24')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </WizardStep>

              {/* Step 3: Skills — filter strip + grid of chips */}
              <WizardStep isActive={step === 3} direction={direction}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('wizard.yourCurrentSkills')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('wizard.selectAtLeast2')}
                    </p>
                    <Input
                      type="search"
                      placeholder={t('wizard.searchSkills')}
                      value={skillFilter}
                      onChange={(e) => setSkillFilter(e.target.value)}
                      className="max-w-xs"
                    />
                    <div className="flex flex-wrap gap-2" role="group" aria-label={t('wizard.selectSkillsAria')}>
                      {filteredSkills.map((skill) => {
                        const selected = formData.skills.includes(skill);
                        return (
                          <Badge
                            key={skill}
                            variant={selected ? 'default' : 'outline'}
                            role="button"
                            tabIndex={0}
                            aria-pressed={selected}
                            className="cursor-pointer px-4 py-2 text-sm transition-all hover:opacity-90"
                            onClick={() => toggleSkill(skill)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSkill(skill); } }}
                          >
                            {selected ? '✓ ' : ''}{skill}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('wizard.skillsSelected').replace('{{count}}', String(formData.skills.length))}
                  </p>
                </div>
              </WizardStep>

              {/* Step 4: Learning Preferences */}
              <WizardStep isActive={step === 4} direction={direction}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('wizard.preferredLearningStyle')}</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {learningStyles.map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => updateForm('learningStyle', style)}
                          className={`rounded-lg border-2 p-4 text-center transition-all ${
                            formData.learningStyle === style
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <span className="block font-medium">{getOptionLabel('learningStyle', style)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('wizard.preferredPlatforms')}</Label>
                    <div className="flex flex-wrap gap-2">
                      {platforms.map((platform) => (
                        <Badge
                          key={platform}
                          variant={formData.preferredPlatforms.includes(platform) ? 'default' : 'outline'}
                          className="cursor-pointer px-4 py-2"
                          onClick={() => togglePlatform(platform)}
                        >
                          {getOptionLabel('platform', platform)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </WizardStep>

              {/* Step 5: Availability — side-by-side with big number focal */}
              <WizardStep isActive={step === 5} direction={direction}>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>{t('wizard.weeklyHours')}</Label>
                      <span className="text-3xl font-bold text-primary tabular-nums">{formData.weeklyHours}h/week</span>
                    </div>
                    <Slider
                      value={[formData.weeklyHours]}
                      onValueChange={([v]) => updateForm('weeklyHours', v)}
                      min={5}
                      max={40}
                      step={1}
                      className="py-4"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>5h</span>
                      <span>20h</span>
                      <span>40h</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('wizard.monthlyBudget')}</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {budgetOptions.map((option) => {
                        const labels: Record<string, string> = {
                          free: t('wizard.budgetFree'),
                          up_to_50: t('wizard.budgetUpTo50'),
                          up_to_200: t('wizard.budgetUpTo200'),
                          unlimited: t('wizard.budgetUnlimited'),
                        };
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => updateForm('budget', option)}
                            className={`rounded-lg border-2 p-3 text-center transition-all ${
                              formData.budget === option
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            {labels[option]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </WizardStep>

              {/* Validation: compact banner under nav */}
              {validationMessageKey() && (
                <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
                  {t(validationMessageKey()!)}
                </p>
              )}

              {/* Navigation */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                <div className="order-2 sm:order-1">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={step === 0}
                    className="min-touch gap-2"
                    data-testid="wizard-back"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {t('wizard.back')}
                  </Button>
                </div>
                <div className="order-1 sm:order-2 flex items-center gap-4">
                  {isStepValid() && (
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {t('wizard.pressEnter')}
                    </span>
                  )}
                  {step === 0 ? null : step < totalSteps - 1 ? (
                    <Button
                      ref={nextButtonRef}
                      onClick={nextStep}
                      disabled={!isStepValid()}
                      className="min-touch btn-glow gap-2"
                      data-testid="wizard-next"
                    >
                      {t('wizard.next')}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={generateRoadmap}
                      disabled={!isStepValid() || isGenerating}
                      className="min-touch btn-glow gap-2"
                      data-testid="wizard-generate"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t('wizard.generating')}
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4" />
                          {t('wizard.generate')}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </Layout>
  );
}
