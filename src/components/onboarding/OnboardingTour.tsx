import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Brain, Map, BookOpen, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';

interface TourStep {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: React.ReactNode;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    titleEn: 'Your 12-week plan, ready in minutes',
    titleAr: 'خطة 12 أسبوعاً جاهزة في دقائق',
    descriptionEn: 'Answer 5 short steps and get a personalized roadmap built for your goal and schedule.',
    descriptionAr: 'أجب عن 5 خطوات قصيرة واحصل على خريطة طريق مخصصة لهدفك وجدولك.',
    icon: <Brain className="h-10 w-10" />,
  },
  {
    id: 'roadmap',
    titleEn: 'One roadmap, all your weeks',
    titleAr: 'خريطة واحدة، كل أسابيعك',
    descriptionEn: 'Weekly milestones, skills to learn, and clear deliverables so you always know what to do next.',
    descriptionAr: 'معالم أسبوعية ومهارات للتعلم ومخرجات واضحة لتعرف دائماً ما التالي.',
    icon: <Map className="h-10 w-10" />,
  },
  {
    id: 'courses',
    titleEn: 'Courses picked for you',
    titleAr: 'دورات منتقاة لك',
    descriptionEn: 'We match the best courses from top platforms to each week of your journey.',
    descriptionAr: 'نطابق أفضل الدورات من أفضل المنصات مع كل أسبوع من رحلتك.',
    icon: <BookOpen className="h-10 w-10" />,
  },
  {
    id: 'coach',
    titleEn: 'Your AI coach, anytime',
    titleAr: 'مدربك الذكي في أي وقت',
    descriptionEn: 'Questions about interviews, skills, or salary? Your AI coach is here to help.',
    descriptionAr: 'أسئلة عن المقابلات أو المهارات أو الراتب؟ مدربك الذكي هنا لمساعدتك.',
    icon: <MessageCircle className="h-10 w-10" />,
  },
];

interface OnboardingTourProps {
  onComplete?: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const { language } = useLanguage();
  const { user, session, getAccessToken } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user || !session) {
        setIsLoading(false);
        return;
      }
      try {
        const token = await getAccessToken();
        if (!token) {
          setIsLoading(false);
          return;
        }
        const profile = await apiFetch<{ onboarding_completed?: boolean } | null>(
          '/api/profile',
          { token }
        );

        if (profile && !profile.onboarding_completed) {
          setIsVisible(true);
        }
      } catch (err) {
        console.error('Error checking onboarding status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [user, session, getAccessToken]);

  useEffect(() => {
    if (!isVisible || !modalRef.current) return;
    const focusable = modalRef.current.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && primaryButtonRef.current) {
      primaryButtonRef.current.focus();
    }
  }, [currentStep, isVisible]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleSkip();
      return;
    }
    if (e.key !== 'Tab' || !modalRef.current) return;
    const focusable = Array.from(
      modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const handleComplete = async () => {
    const token = await getAccessToken();
    if (!token) {
      setIsVisible(false);
      onComplete?.();
      return;
    }
    try {
      await apiFetch('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ onboarding_completed: true }),
        token,
      });
    } catch (err) {
      console.error('Error updating onboarding status:', err);
    }

    setIsVisible(false);
    onComplete?.();
  };

  const handleSkip = () => {
    handleComplete();
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (isLoading || !isVisible) return null;

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={handleSkip}
          />

          {/* Modal: on mobile use safe-area, max-height, and top positioning so it stays in view */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] justify-center pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[85vh] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:pt-0 sm:pb-0 rtl:sm:left-auto rtl:sm:right-1/2 rtl:sm:translate-x-1/2"
          >
            <div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="onboarding-tour-title"
              aria-describedby="onboarding-tour-description"
              onKeyDown={handleKeyDown}
              className="relative mx-3 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:mx-4 sm:max-h-[inherit]"
            >
              {/* Progress bar at top + step counter — sticky on scroll */}
              <div className="shrink-0 border-b border-border px-4 pt-4 pb-3 sm:px-6 sm:pt-6">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-medium text-muted-foreground" aria-live="polite">
                    {currentStep + 1} / {tourSteps.length}
                  </span>
                </div>
                <Progress value={((currentStep + 1) / tourSteps.length) * 100} className="h-1.5" />
              </div>

              {/* Close button — larger touch target on mobile */}
              <button
                type="button"
                onClick={handleSkip}
                className="absolute right-3 top-3 z-10 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground rtl:right-auto rtl:left-3 min-w-[44px] min-h-[44px] flex items-center justify-center sm:right-4 sm:top-4 sm:min-w-0 sm:min-h-0 sm:p-1"
                aria-label={language === 'ar' ? 'تخطي الجولة' : 'Skip tour'}
              >
                <X className="h-5 w-5" />
              </button>

              {/* Content: scrollable on mobile so modal stays in view */}
              <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-6 text-left"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      {step.icon}
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <h2 id="onboarding-tour-title" className="mb-2 text-xl font-bold">
                        {language === 'ar' ? step.titleAr : step.titleEn}
                      </h2>
                      <p id="onboarding-tour-description" className="text-muted-foreground text-sm">
                        {language === 'ar' ? step.descriptionAr : step.descriptionEn}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Navigation — comfortable touch targets on mobile */}
                <div className="mt-6 flex items-center justify-between gap-3 sm:mt-8 sm:gap-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="min-h-[44px] gap-1 px-4 sm:min-h-0"
                    aria-label={language === 'ar' ? 'السابق' : 'Previous step'}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {language === 'ar' ? 'السابق' : 'Back'}
                  </Button>

                  <Button
                    ref={primaryButtonRef}
                    type="button"
                    onClick={nextStep}
                    className="btn-glow min-h-[44px] gap-1 px-5 sm:min-h-0 sm:px-4"
                    aria-label={isLastStep ? (language === 'ar' ? 'ابدأ الآن' : 'Get started') : (language === 'ar' ? 'التالي' : 'Next step')}
                  >
                    {isLastStep
                      ? language === 'ar'
                        ? 'ابدأ الآن'
                        : 'Get Started'
                      : language === 'ar'
                      ? 'التالي'
                      : 'Next'}
                    {!isLastStep && <ChevronRight className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Skip link — full-width tap area on mobile */}
              <div className="shrink-0 border-t border-border bg-muted/50 px-4 py-3 text-center sm:px-6">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="min-h-[44px] w-full text-sm text-muted-foreground transition-colors hover:text-foreground sm:min-h-0 sm:w-auto"
                  aria-label={language === 'ar' ? 'تخطي الجولة' : 'Skip tour'}
                >
                  {language === 'ar' ? 'تخطي الجولة' : 'Skip tour'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
