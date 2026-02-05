import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { IconSparkle, IconArrowRight } from '@/lib/icons';

/**
 * One feature in split layout: copy left, roadmap UI mock right. RTL-safe.
 */
export function FeatureSpotlight() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const weeks = language === 'ar' ? ['أ.١', 'أ.٢', 'أ.٣'] : ['W1', 'W2', 'W3'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-12 grid gap-8 sm:gap-10 md:grid-cols-2 md:items-center md:gap-16 md:mb-20"
    >
      {/* Copy — start side (left LTR, right RTL) */}
      <div className="flex flex-col text-start">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-white shadow-lg shadow-primary/25">
          <IconSparkle className="h-7 w-7" />
        </div>
        <h3 className="mb-3 text-xl font-bold sm:text-2xl md:text-3xl">
          {t('features.ai.title')}
        </h3>
        <p className="mb-6 max-w-lg text-sm text-muted-foreground leading-relaxed sm:text-base">
          {t('features.ai.description')}
        </p>
        <Button size="lg" asChild className="w-fit gap-2 shadow-lg shadow-primary/20">
          <Link to={user ? '/wizard' : '/signup'}>
            {t('hero.cta')}
            <IconArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </Button>
      </div>

      {/* Visual — roadmap UI mock (weeks + progress + course tags) */}
      <div className="relative flex justify-center md:justify-end">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="w-full max-w-md overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card/90 to-card/70 p-5 shadow-xl shadow-primary/5 backdrop-blur sm:p-6"
        >
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-primary/10 blur-2xl" aria-hidden />
          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                {language === 'ar' ? 'مسار 12 أسبوعاً' : '12-week path'}
              </span>
              <span className="rounded-full bg-success/20 px-2.5 py-1 text-xs font-medium text-success">
                {language === 'ar' ? '90 ثانية' : '90 sec'}
              </span>
            </div>
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: '33%' }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
              />
            </div>
            <div className="space-y-3">
              {weeks.map((week, i) => (
                <motion.div
                  key={week}
                  initial={{ opacity: 0, x: 8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                    i === 0 ? 'border-primary/30 bg-primary/10' : 'border-border/50 bg-muted/30'
                  }`}
                >
                  <span className={`text-sm font-bold ${i === 0 ? 'text-primary' : 'text-muted-foreground'}`}>{week}</span>
                  <span className="h-1.5 flex-1 rounded-full bg-muted">
                    {i === 0 && (
                      <motion.span
                        initial={{ width: 0 }}
                        whileInView={{ width: '60%' }}
                        viewport={{ once: true }}
                        className="block h-full rounded-full bg-primary"
                      />
                    )}
                  </span>
                  {i === 0 && (
                    <span className="text-xs font-medium text-primary">
                      {language === 'ar' ? 'جاري' : 'Active'}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[1, 2, 3].map((j) => (
                <span
                  key={j}
                  className="rounded-lg bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground"
                >
                  {language === 'ar' ? 'دورة موثقة' : 'Verified'}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
