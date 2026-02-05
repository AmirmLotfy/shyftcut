import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { IconSparkle } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface HeroProductPreviewProps {
  /** Compact variant for mobile / below-fold placement */
  compact?: boolean;
}

/**
 * Roadmap preview for hero — product UI (not form). Progress + week pills + course chips.
 * RTL-safe: parent controls order via flex.
 */
export function HeroProductPreview({ compact = false }: HeroProductPreviewProps) {
  const { language, direction } = useLanguage();
  const weeks = language === 'ar' ? ['أ.١', 'أ.٢', 'أ.٣', 'أ.٤'] : ['W1', 'W2', 'W3', 'W4'];
  const labels = language === 'ar'
    ? ['أساسيات', 'مشروع', 'اختبار', 'مراجعة']
    : ['Basics', 'Project', 'Quiz', 'Review'];

  return (
    <motion.div
      initial={{ opacity: 0, x: direction === 'rtl' ? -24 : 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className={compact
        ? 'relative mx-auto w-full max-w-[min(360px,calc(100%-2rem))]'
        : 'relative w-full max-w-full mx-auto sm:max-w-[340px] lg:max-w-[420px] lg:mx-0'}
      aria-hidden
    >
      <div className={cn(
        'relative overflow-hidden rounded-2xl border border-border/60 bg-card/90 shadow-2xl shadow-primary/5 backdrop-blur-xl',
        compact ? 'p-4' : 'p-6'
      )}>
        {/* Glow accent — flip for RTL so glow stays at visual start */}
        <div className={cn(
          'absolute rounded-full bg-primary/20 blur-3xl rtl:right-auto rtl:-left-20',
          compact ? '-top-12 -right-12 h-24 w-24' : '-top-20 -right-20 h-40 w-40'
        )} aria-hidden />

        <div className="relative">
          {/* Header: product badge */}
          <div className={compact ? 'mb-3 flex items-center justify-between' : 'mb-5 flex items-center justify-between'}>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary">
              <IconSparkle className="h-3.5 w-3.5" />
              {language === 'ar' ? 'خريطة جاهزة' : 'Roadmap ready'}
            </span>
            <span className="text-xs font-medium text-muted-foreground">12 {language === 'ar' ? 'أسبوع' : 'weeks'}</span>
          </div>

          {/* Progress bar */}
          <div className={compact ? 'mb-3' : 'mb-5'}>
            <div className="mb-2 flex justify-between text-xs text-muted-foreground">
              <span>{language === 'ar' ? 'التقدم' : 'Progress'}</span>
              <span className="font-medium text-primary">25%</span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '25%' }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 rtl:ms-auto"
              />
            </div>
          </div>

          {/* Week pills — roadmap UI */}
          <div className="flex flex-wrap gap-2">
            {weeks.map((week, i) => (
              <motion.div
                key={week}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className={`rounded-lg px-3 py-2 text-xs font-medium ${
                  i === 0
                    ? 'bg-primary/20 text-primary ring-1 ring-primary/30'
                    : 'bg-muted/60 text-muted-foreground'
                }`}
              >
                <span className="font-semibold">{week}</span>
                <span className="ms-1.5 opacity-80">· {labels[i]}</span>
              </motion.div>
            ))}
          </div>

          {/* Course chips — product context */}
          <div className={compact ? 'mt-3 flex flex-wrap gap-1.5' : 'mt-4 flex flex-wrap gap-1.5'}>
            {[1, 2, 3].map((i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + i * 0.05 }}
                className="rounded-md bg-muted/50 px-2 py-1 text-[10px] text-muted-foreground"
              >
                {language === 'ar' ? 'دورة موثقة' : 'Verified course'}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
