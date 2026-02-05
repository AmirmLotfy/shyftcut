import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { IconMapTrifold, IconArrowRight } from '@/lib/icons';
import { useLanguage } from '@/contexts/LanguageContext';

/** Sticky CTA prompting blog readers to try the AI roadmap generator. Converts well on mobile (sticky bar) and desktop (floating card). */
export function BlogCtaRoadmap() {
  const { language } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const onScroll = () => {
      const y = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      // Show after user scrolls ~25% or 300px
      setVisible(y > 300 || (docHeight > 800 && y > docHeight * 0.25));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [dismissed]);

  const ctaLabel = language === 'ar' ? 'ابنِ خريطة طريقك المجانية' : 'Build your free roadmap';
  const ctaSub = language === 'ar' ? 'خطة تعلم مخصصة في ٩٠ ثانية' : 'Personalized learning plan in 90 seconds';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: 'tween', duration: 0.25 }}
          className="fixed bottom-0 left-0 right-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4"
        >
          <div className="public-glass-card mx-auto max-w-lg rounded-2xl border-primary/30 shadow-xl sm:rounded-2xl sm:shadow-2xl">
            <div className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/20 sm:h-12 sm:w-12">
                <IconMapTrifold className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground truncate">{ctaLabel}</p>
                <p className="text-sm text-muted-foreground truncate">{ctaSub}</p>
              </div>
              <Button asChild className="shrink-0 gap-1.5" size="sm">
                <Link to="/wizard">
                  {language === 'ar' ? 'ابدأ' : 'Start'}
                  <IconArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
