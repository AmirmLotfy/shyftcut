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
        <div className="container mx-auto max-w-2xl px-4 py-8 sm:py-12">
          {/* Intro */}
          <AnimatePresence mode="wait">
            {step < 0 && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">{t('careerDna.badge')}</span>
                </div>
                <h1 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  {t('careerDna.title')}
                </h1>
                <p className="mb-8 text-muted-foreground">
                  {t('careerDna.subtitle')}
                </p>
                <div className="mb-8 flex items-center justify-center gap-3">
                  <Label htmlFor="is-student" className="text-sm text-muted-foreground">
                    {t('careerDna.iAmStudent')}
                  </Label>
                  <Button
                    id="is-student"
                    variant={isStudent ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setIsStudent(true)}
                  >
                    {t('careerDna.yes')}
                  </Button>
                  <Button
                    variant={!isStudent ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setIsStudent(false)}
                  >
                    {t('careerDna.no')}
                  </Button>
                </div>
                <Button size="lg" className="gap-2" onClick={handleStart}>
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
              >
                <div className="mb-6">
                  <div className="mb-2 flex justify-between text-sm text-muted-foreground">
                    <span>{step + 1} / 8</span>
                  </div>
                  <Progress value={((step + 1) / 8) * 100} className="h-1.5" />
                </div>
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <h2 className="mb-6 text-lg font-semibold">
                      {QUIZ_QUESTIONS[step].type === 'dropdown'
                        ? (isStudent ? t('careerDna.q5Major') : t('careerDna.q5Field'))
                        : t(QUIZ_QUESTIONS[step].questionKey)}
                    </h2>

                    {QUIZ_QUESTIONS[step].type === 'single' && QUIZ_QUESTIONS[step].options && (
                      <div className="space-y-2">
                        {QUIZ_QUESTIONS[step].options!.map((opt) => (
                          <Button
                            key={opt.value}
                            variant={answers[QUIZ_QUESTIONS[step].id] === opt.value ? 'default' : 'outline'}
                            className="h-auto w-full justify-start gap-2 py-3 text-left"
                            onClick={() => setAnswer(QUIZ_QUESTIONS[step].id, opt.value)}
                          >
                            {opt.emoji && <span>{opt.emoji}</span>}
                            {t(opt.labelKey)}
                          </Button>
                        ))}
                      </div>
                    )}

                    {QUIZ_QUESTIONS[step].type === 'slider' && (
                      <div className="space-y-4">
                        <div className="flex justify-between text-2xl font-bold">
                          <span>{answers[QUIZ_QUESTIONS[step].id] ?? 5}</span>
                          <span className="text-muted-foreground">/ 10</span>
                        </div>
                        <Slider
                          value={[(answers[QUIZ_QUESTIONS[step].id] as number) ?? 5]}
                          onValueChange={([v]) => setAnswer(QUIZ_QUESTIONS[step].id, v)}
                          min={1}
                          max={10}
                          step={1}
                        />
                      </div>
                    )}

                    {QUIZ_QUESTIONS[step].type === 'dropdown' && (
                      <Select
                        value={currentField ?? ''}
                        onValueChange={(v) => setAnswer('q5', v)}
                      >
                        <SelectTrigger>
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

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    disabled={!canProceed || isSubmitting}
                    onClick={handleNext}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : step === 7 ? (
                      t('careerDna.seeResults')
                    ) : (
                      <>
                        {t('common.next')}
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {step >= 0 && (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              <Link to="/" className="underline hover:text-foreground">
                {t('careerDna.backHome')}
              </Link>
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}
