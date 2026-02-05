import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { IconTarget, IconLightning, IconClockTabler, IconArrowRight } from '@/lib/icons';

const steps = [
  {
    icon: IconTarget,
    step: '1',
    titleKey: { en: 'Tell Us About You', ar: 'أخبرنا عن نفسك' },
    descKey: {
      en: 'Complete a 5-step wizard about your current role, skills, and goals.',
      ar: 'أكمل معالجاً من 5 خطوات حول دورك الحالي ومهاراتك وأهدافك.',
    },
  },
  {
    icon: IconLightning,
    step: '2',
    titleKey: { en: 'AI Generates Your Map', ar: 'يولد الذكاء الاصطناعي خريطتك' },
    descKey: {
      en: 'Gemini creates a customized 12-week roadmap with verified courses.',
      ar: 'ينشئ Gemini خريطة طريق مخصصة لـ 12 أسبوعاً مع دورات موثقة.',
    },
  },
  {
    icon: IconClockTabler,
    step: '3',
    titleKey: { en: 'Start Learning', ar: 'ابدأ التعلم' },
    descKey: {
      en: 'Track progress, complete quizzes, and get 24/7 AI coaching support.',
      ar: 'تابع تقدمك، أكمل الاختبارات، واحصل على تدريب من الذكاء الاصطناعي على مدار الساعة.',
    },
  },
];

export function InteractiveTimeline() {
  const { language } = useLanguage();

  return (
    <section id="how-it-works" className="scroll-mt-16 bg-muted/30 py-10 sm:py-12 md:py-20">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-start sm:mb-10"
        >
          <h2 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">
            {language === 'ar' ? 'كيف يعمل' : 'How It Works'}
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            {language === 'ar'
              ? 'ثلاث خطوات بسيطة للحصول على خريطة طريقك المهنية المخصصة.'
              : 'Three simple steps to get your personalized career roadmap.'}
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-3 sm:gap-6 lg:gap-8">
            {steps.map((item, index) => {
              const Icon = item.icon;
              const isLast = index === steps.length - 1;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.12 }}
                  className="relative flex flex-col"
                >
                  {/* Connector arrow — hidden on last and on small screens */}
                  {!isLast && (
                    <div
                      className="absolute left-[calc(50%+4rem)] top-12 hidden text-muted-foreground/40 sm:block rtl:left-auto rtl:right-[calc(50%+4rem)]"
                      aria-hidden
                    >
                      <IconArrowRight className="h-6 w-6 rtl:rotate-180" />
                    </div>
                  )}

                  <div className="relative flex flex-1 flex-col rounded-2xl border-2 border-border/60 bg-card p-5 text-start shadow-sm transition-all hover:border-primary/30 hover:shadow-md sm:p-6 md:p-7">
                    {/* Step badge */}
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-md">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary">
                        {language === 'ar' ? `الخطوة ${item.step}` : `Step ${item.step}`}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold tracking-tight sm:text-2xl">
                      {item.titleKey[language]}
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {item.descKey[language]}
                    </p>
                  </div>
                </motion.div>
              );
            })}
        </div>
      </div>
    </section>
  );
}
