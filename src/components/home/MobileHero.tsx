import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { HeroBlobs } from '@/components/home/HeroBlobs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { IconArrowRight, IconCheckCircle } from '@/lib/icons';
import { fadeInUp, staggerContainer, blurIn, tNormal } from '@/lib/animations';

interface MobileHeroProps {
  /** Renders below CTAs inside the same hero (e.g. Roadmap preview card) */
  bottomContent?: ReactNode;
}

/**
 * Mobile hero — copy, CTAs, and optional roadmap preview in one section.
 * Top-aligned flow with consistent padding; no full-viewport centering.
 */
export function MobileHero({ bottomContent }: MobileHeroProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  return (
    <section
      className="relative z-0 min-w-0 overflow-hidden"
      style={{ paddingTop: 'calc(3.5rem + env(safe-area-inset-top))' }}
    >
      <div className="absolute inset-0 mesh-gradient" />
      <HeroBlobs />
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        aria-hidden
        style={{
          background: 'radial-gradient(circle at 50% 45%, hsl(var(--primary) / 0.12) 0%, transparent 55%)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

      <div
        className="container relative mx-auto flex min-w-0 max-w-full flex-col justify-start gap-5 px-4 pt-5 pb-8 sm:px-5 sm:pt-6 sm:gap-6 sm:pb-10"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        {/* Copy block — compact, no flex-1 spread */}
        <motion.div
          className="flex flex-col text-start"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          transition={tNormal}
        >
          <motion.div
            variants={fadeInUp}
            className="mb-1.5 inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-foreground/5 px-3 py-1.5 text-xs font-medium backdrop-blur-md"
          >
            <img
              src="https://cdn.simpleicons.org/googlegemini"
              alt=""
              width={14}
              height={14}
              className="h-3.5 w-3.5 shrink-0 object-contain"
              aria-hidden
            />
            <span>{language === 'ar' ? 'مدعوم بـ Gemini' : 'Powered by Gemini'}</span>
          </motion.div>

          <motion.h1
            variants={blurIn}
            transition={{ ...tNormal, delay: 0.08 }}
            className="mb-2 text-[1.875rem] font-extrabold leading-[1.15] tracking-tight text-balance"
          >
            <span className="gradient-text">{t('hero.title')}</span>
            <br />
            <span className="text-foreground">{t('hero.subtitle')}</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="mb-4 text-[15px] font-medium leading-snug text-foreground/95"
          >
            {language === 'ar'
              ? 'مسار واضح ١٢ أسبوعاً. دورات موثقة. تدريب ٢٤/٧.'
              : 'Clear 12-week path. Verified courses. 24/7 AI coaching.'}
          </motion.p>
        </motion.div>

        {/* CTAs + trust — thumb zone */}
        <motion.div
          className="flex flex-col gap-3"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={tNormal}
        >
          <Button
            size="lg"
            asChild
            className="btn-glow group min-touch h-12 min-h-[48px] w-full gap-2 rounded-full px-6 text-base font-semibold"
          >
            <Link to={user ? '/wizard' : '/signup'}>
              {t('hero.cta')}
              <IconArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            asChild
            className="min-touch h-11 w-full gap-2 rounded-full border border-border/60 bg-foreground/5 text-muted-foreground backdrop-blur-sm"
          >
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              {t('hero.cta.secondary')}
            </a>
          </Button>

          <div className="flex flex-wrap items-center justify-start gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <IconCheckCircle className="h-4 w-4 shrink-0 text-success" />
              {language === 'ar' ? 'مجاني' : 'Free'}
            </span>
            <span className="flex items-center gap-1.5">
              <IconCheckCircle className="h-4 w-4 shrink-0 text-success" />
              {language === 'ar' ? 'لا بطاقة' : 'No card'}
            </span>
            <span className="flex items-center gap-1.5">
              <IconCheckCircle className="h-4 w-4 shrink-0 text-success" />
              {language === 'ar' ? '٩٠ ثانية' : '90 sec'}
            </span>
          </div>
        </motion.div>

        {/* Roadmap preview — same hero section, clear hierarchy */}
        {bottomContent && (
          <motion.div
            className="mt-6 sm:mt-8 flex justify-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {bottomContent}
          </motion.div>
        )}
      </div>
    </section>
  );
}
