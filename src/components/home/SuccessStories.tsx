import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { IconArrowRight } from '@/lib/icons';

const stories = [
  {
    before: 'Marketing',
    after: 'Data Analyst',
    lift: '+35%',
    industry: 'Tech',
    descKey: {
      en: '12-week path with verified courses and AI coaching.',
      ar: 'مسار 12 أسبوعاً مع دورات موثقة وتدريب ذكاء اصطناعي.',
    },
  },
  {
    before: 'Support',
    after: 'Product Manager',
    lift: '+42%',
    industry: 'SaaS',
    descKey: {
      en: 'Structured roadmap and 24/7 AI support.',
      ar: 'خريطة منظمة ودعم ذكاء اصطناعي على مدار الساعة.',
    },
  },
  {
    before: 'Design',
    after: 'UX Lead',
    lift: '+28%',
    industry: 'Product',
    descKey: {
      en: 'Focused skill path and progress tracking.',
      ar: 'مسار مهارات واضح وتتبع التقدم.',
    },
  },
];

export function SuccessStories() {
  const { language } = useLanguage();

  return (
    <section className="bg-muted/20 py-12 sm:py-16 md:py-24 lg:py-28">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-start sm:mb-10 md:mb-14"
        >
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-primary/80 sm:text-sm">
            {language === 'ar' ? 'قصص نجاح' : 'Success Stories'}
          </p>
          <h2 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            {language === 'ar'
              ? 'محترفون غيروا مساراتهم المهنية'
              : 'Professionals Who Shifted Careers'}
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            {language === 'ar'
              ? 'خرائط طريق مخصصة في 12 أسبوعاً.'
              : 'Personalized roadmaps in 12 weeks.'}
          </p>
        </motion.div>

        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story, index) => (
            <motion.article
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative flex flex-col rounded-2xl border border-border/60 bg-card p-5 text-start shadow-sm transition-all hover:border-primary/25 hover:shadow-md sm:p-6 md:p-7"
            >
              {/* Accent bar */}
              <div
                className="absolute start-0 top-0 h-full w-1 rounded-s-2xl bg-gradient-to-b from-primary/60 to-primary/30 opacity-0 transition-opacity group-hover:opacity-100 rtl:start-auto rtl:end-0 rtl:rounded-s-none rtl:rounded-e-2xl"
                aria-hidden
              />

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground line-through">
                  {story.before}
                </span>
                <IconArrowRight className="h-4 w-4 shrink-0 text-primary/80 rtl:rotate-180" />
                <span className="text-sm font-semibold text-primary">
                  {story.after}
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-success md:text-3xl">
                  {story.lift}
                </span>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {story.industry}
                </span>
              </div>

              <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                {story.descKey[language]}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
