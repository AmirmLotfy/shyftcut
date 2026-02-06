import { motion } from 'framer-motion';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { LucideIcon } from 'lucide-react';

export interface LegalPageHeroProps {
  title: string;
  icon: LucideIcon;
  lastUpdatedEn: string;
  lastUpdatedAr: string;
  /** Icon/background accent: primary (default) or destructive for Refund */
  variant?: 'primary' | 'destructive';
}

export function LegalPageHero({ title, icon: Icon, lastUpdatedEn, lastUpdatedAr, variant = 'primary' }: LegalPageHeroProps) {
  const { language } = useLanguage();

  const iconStyles =
    variant === 'destructive'
      ? 'bg-destructive/10 text-destructive'
      : 'bg-primary/10 text-primary';

  return (
    <section
      className="relative overflow-hidden border-b border-border bg-muted/30 py-12 sm:py-16 md:py-20"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="absolute inset-0 mesh-gradient opacity-20" aria-hidden />
      <div className="container relative mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="mx-auto flex max-w-3xl flex-col items-center text-center"
        >
          <Button
            variant="ghost"
            asChild
            className="mb-6 flex w-fit gap-2 text-muted-foreground hover:text-foreground"
          >
            <Link to="/">
              <ArrowLeft className="h-4 w-4 shrink-0 rtl:rotate-180" />
              {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
            </Link>
          </Button>

          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${iconStyles} sm:h-[4.5rem] sm:w-[4.5rem]`}
          >
            <Icon className="h-8 w-8 sm:h-9 sm:w-9" aria-hidden />
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:mt-6 sm:text-4xl md:text-[2.5rem]">
            {title}
          </h1>

          <div
            className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground"
            role="doc-subtitle"
          >
            <Calendar className="h-4 w-4 shrink-0" aria-hidden />
            <span>
              {language === 'ar' ? `آخر تحديث: ${lastUpdatedAr}` : `Last Updated: ${lastUpdatedEn}`}
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
