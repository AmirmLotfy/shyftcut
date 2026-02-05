import { motion } from 'framer-motion';
import { Target, Crown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const StatItem = ({
  value,
  label,
}: {
  value: string;
  label: string;
}) => (
  <div
    className="flex flex-1 flex-col items-center justify-center transition-transform hover:-translate-y-0.5 cursor-default"
    role="presentation"
  >
    <span className="text-lg font-bold text-foreground sm:text-xl">{value}</span>
    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium sm:text-xs">
      {label}
    </span>
  </div>
);

export function HeroTrustCard() {
  const { t, language } = useLanguage();

  const mainStat = {
    value: '90',
    label: language === 'ar' ? 'خريطة طريق' : 'Roadmaps',
    sublabel: language === 'ar' ? 'منشأة' : 'Generated',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/40 p-4 backdrop-blur-xl shadow-2xl dark:bg-card/60 sm:p-5"
    >
      {/* Card glow */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/20">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {mainStat.value}+
            </div>
            <div className="text-xs text-muted-foreground">{mainStat.label} {mainStat.sublabel}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4 space-y-2">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">
              {language === 'ar' ? 'رضا المستخدمين' : 'User Satisfaction'}
            </span>
            <span className="font-medium text-foreground">98%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '98%' }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
            />
          </div>
        </div>

        <div className="mb-4 h-px w-full bg-border/60" aria-hidden />

        {/* Mini stats: single row, compact */}
        <div className="flex items-center gap-3 text-center">
          <StatItem value="12" label={t('landing.statWeeks')} />
          <div className="h-8 w-px shrink-0 bg-border/60" aria-hidden />
          <StatItem value="24/7" label={t('landing.statCoaching')} />
          <div className="h-8 w-px shrink-0 bg-border/60" aria-hidden />
          <StatItem value="50+" label={t('landing.statPlatforms')} />
        </div>

        {/* Tag pills */}
        <div className="mt-4 flex flex-wrap gap-2">
          <div
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-foreground/90"
            role="status"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            {language === 'ar' ? 'نشط' : 'ACTIVE'}
          </div>
          <div
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-foreground/90"
            role="presentation"
          >
            <Crown className="h-3 w-3 text-primary" />
            {language === 'ar' ? 'مدعوم بالذكاء الاصطناعي' : 'AI-POWERED'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
