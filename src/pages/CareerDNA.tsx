import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, ArrowRight, ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Layout } from '@/components/layout/Layout';
import { PublicPageMeta } from '@/components/seo/PublicPageMeta';
import { useLanguage } from '@/contexts/LanguageContext';
import { getSeo } from '@/data/seo-content';
import { BASE_URL } from '@/lib/seo';
import { useToast } from '@/hooks/use-toast';
import { apiPath, apiHeaders, extractApiErrorMessage } from '@/lib/api';
import { CAREER_FIELDS, CAREER_FIELD_LABELS, QUIZ_QUESTIONS } from '@/data/career-dna-questions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CareerDNA() {
  const [step, setStep] = useState(-1); // -1 = intro, 0-7 = questions
  const [isStudent, setIsStudent] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const squadSlug = searchParams.get('squad') ?? undefined;

  const currentField = answers.q5 as string | undefined;
  const canProceed = step < 0 || (step >= 0 && step < 8 && (step !== 4 ? !!answers[QUIZ_QUESTIONS[step].id] : !!currentField));

  const handleStart = () => {
    setDirection('forward');
    setStep(0);
  };

  const handleNext = () => {
    if (step < 7) {
      setDirection('forward');
      setStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setDirection('backward');
      setStep((s) => s - 1);
    } else {
      setStep(-1);
    }
  };

  const handleSubmit = async () => {
    if (!currentField) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(apiPath('/api/career-dna/analyze'), {
        method: 'POST',
        headers: apiHeaders('/api/career-dna/analyze', null),
        body: JSON.stringify({
          answers: { ...answers, q5: currentField },
          currentField,
          isStudent,
          language: language === 'ar' ? 'ar' : 'en',
          squadSlug,
        }),
      });
      const text = await res.text();
      let data: Record<string, unknown> = {};
      try {
        if (text.trim()) data = JSON.parse(text) as Record<string, unknown>;
      } catch {
        /* ignore */
      }
      if (!res.ok) {
        const msg = extractApiErrorMessage(data, res.statusText || t('common.error'));
        if (res.status === 429) throw new Error(t('careerDna.rateLimit'));
        throw new Error(msg);
      }
      const resultId = data.resultId as string;
      if (resultId) navigate(`/career-dna/result/${resultId}`);
      else throw new Error(t('common.error'));
    } catch (err) {
      toast({
        title: t('common.errorTitle'),
        description: err instanceof Error ? err.message : t('common.error'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const setAnswer = (id: string, value: string | number) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const seo = getSeo('/career-dna', language);

  return (
    <Layout hideFooter={step >= 0}>
      <PublicPageMeta title={seo.title} description={seo.description} path="/career-dna" image={`${BASE_URL}/career-dna-og.png`} />
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background via-background to-primary/5">
        <div className="container mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 md:py-12 lg:px-8 lg:py-16 xl:px-12">
          {/* Intro */}
          <AnimatePresence mode="wait">
            {step < 0 && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mx-auto max-w-2xl text-center"
              >
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 sm:mb-8">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">{t('careerDna.badge')}</span>
                </div>
                <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl lg:mb-6">
                  {t('careerDna.title')}
                </h1>
                <p className="mb-8 text-base text-muted-foreground sm:text-lg md:text-xl lg:mb-10">
                  {t('careerDna.subtitle')}
                </p>
                <div className="mb-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:mb-10">
                  <Label htmlFor="is-student" className="text-sm font-medium text-foreground sm:text-base">
                    {t('careerDna.iAmStudent')}
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      id="is-student"
                      variant={isStudent ? 'default' : 'outline'}
                      size="sm"
                      className="sm:px-4"
                      onClick={() => setIsStudent(true)}
                    >
                      {t('careerDna.yes')}
                    </Button>
                    <Button
                      variant={!isStudent ? 'default' : 'outline'}
                      size="sm"
                      className="sm:px-4"
                      onClick={() => setIsStudent(false)}
                    >
                      {t('careerDna.no')}
                    </Button>
                  </div>
                </div>
                <Button size="lg" className="gap-2 px-8 sm:px-10" onClick={handleStart}>
                  {t('careerDna.start')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {/* Quiz */}
            {step >= 0 && step < 8 && (
              <motion.div
                key={`q${step}`}
                initial={{ opacity: 0, x: direction === 'forward' ? 30 : -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction === 'forward' ? -30 : 30 }}
                transition={{ duration: 0.2 }}
                className="mx-auto w-full"
              >
                <div className="mb-6 lg:mb-8">
                  <div className="mb-2 flex justify-between text-sm font-medium text-muted-foreground sm:text-base">
                    <span>{step + 1} / 8</span>
                  </div>
                  <Progress value={((step + 1) / 8) * 100} className="h-2 lg:h-2.5" />
                </div>
                <Card className="mb-6 lg:mb-8">
                  <CardContent className="p-6 sm:p-8 lg:p-10">
                    <h2 className="mb-6 text-xl font-semibold leading-tight sm:text-2xl lg:text-3xl lg:mb-8">
                      {QUIZ_QUESTIONS[step].type === 'dropdown'
                        ? (isStudent ? t('careerDna.q5Major') : t('careerDna.q5Field'))
                        : t(QUIZ_QUESTIONS[step].questionKey)}
                    </h2>

                    {QUIZ_QUESTIONS[step].type === 'single' && QUIZ_QUESTIONS[step].options && (
                      <div className="space-y-3 sm:space-y-3 lg:space-y-4">
                        {QUIZ_QUESTIONS[step].options!.map((opt) => (
                          <Button
                            key={opt.value}
                            variant={answers[QUIZ_QUESTIONS[step].id] === opt.value ? 'default' : 'outline'}
                            className="h-auto w-full justify-start py-4 text-left text-base sm:py-5 sm:text-lg lg:py-6"
                            onClick={() => setAnswer(QUIZ_QUESTIONS[step].id, opt.value)}
                          >
                            {t(opt.labelKey)}
                          </Button>
                        ))}
                      </div>
                    )}

                    {QUIZ_QUESTIONS[step].type === 'slider' && (
                      <div className="space-y-6 py-2 sm:space-y-8 lg:space-y-10">
                        <div className="flex justify-between text-3xl font-bold sm:text-4xl lg:text-5xl">
                          <span>{answers[QUIZ_QUESTIONS[step].id] ?? 5}</span>
                          <span className="text-muted-foreground">/ 10</span>
                        </div>
                        <Slider
                          value={[(answers[QUIZ_QUESTIONS[step].id] as number) ?? 5]}
                          onValueChange={([v]) => setAnswer(QUIZ_QUESTIONS[step].id, v)}
                          min={1}
                          max={10}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    )}

                    {QUIZ_QUESTIONS[step].type === 'dropdown' && (
                      <Select
                        value={currentField ?? ''}
                        onValueChange={(v) => setAnswer('q5', v)}
                      >
                        <SelectTrigger className="h-12 text-base sm:h-14 sm:text-lg">
                          <SelectValue placeholder={t('careerDna.selectField')} />
                        </SelectTrigger>
                        <SelectContent>
                          {CAREER_FIELDS.map((f) => (
                            <SelectItem key={f} value={f}>
                              {language === 'ar' ? (CAREER_FIELD_LABELS[f]?.ar ?? f) : f}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </CardContent>
                </Card>

                <div className="flex gap-3 sm:gap-4">
                  <Button variant="outline" size="lg" onClick={handleBack} className="min-w-[3rem] sm:min-w-[3.5rem] lg:px-6">
                    <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1 gap-2 sm:px-8 lg:px-10"
                    disabled={!canProceed || isSubmitting}
                    onClick={handleNext}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin sm:h-5 sm:w-5" />
                    ) : step === 7 ? (
                      t('careerDna.seeResults')
                    ) : (
                      <>
                        {t('common.next')}
                        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {step >= 0 && (
            <p className="mt-6 text-center text-sm text-muted-foreground sm:mt-8 lg:mt-10">
              <Link to="/" className="underline hover:text-foreground transition-colors sm:text-base">
                {t('careerDna.backHome')}
              </Link>
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}
