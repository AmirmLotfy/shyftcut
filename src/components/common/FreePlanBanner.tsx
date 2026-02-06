import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { getUnlockSummary } from '@/lib/premium-features';
import { CheckoutButton } from '@/components/pricing/CheckoutButton';
import { POLAR_PRODUCTS } from '@/lib/polar-config';
import { dashboardPaths } from '@/lib/dashboard-routes';
import { cn } from '@/lib/utils';

export interface FreePlanBannerProps {
  /** Usage summary line (e.g. "Chat 5 · Quizzes 2 · Notes ∞") */
  usageSummary: React.ReactNode;
  /** Optional className */
  className?: string;
  /** Where to return after checkout */
  returnTo?: string;
  /** CTA button text */
  ctaText?: string;
}

/**
 * Unified slim upgrade banner for free users on Dashboard and sub-pages.
 * Shows usage limits and upgrade CTA in a compact bar.
 */
export function FreePlanBanner({
  usageSummary,
  className,
  returnTo = dashboardPaths.index,
  ctaText,
}: FreePlanBannerProps) {
  const { language, t } = useLanguage();
  const lang = language === 'ar' ? 'ar' : 'en';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/[0.02] px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2 sm:py-2.5',
        className
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Zap className="h-3.5 w-3.5 shrink-0 text-primary/80" aria-hidden />
          {usageSummary}
        </span>
        <Link
          to={`${dashboardPaths.upgrade}?returnTo=${encodeURIComponent(returnTo)}`}
          state={{ returnTo }}
          className="text-xs font-medium text-primary hover:underline w-fit"
        >
          {getUnlockSummary(lang)}
        </Link>
      </div>
      <CheckoutButton
        planId="premium"
        productId={POLAR_PRODUCTS.premium.yearly.productId}
        returnTo={returnTo}
        size="sm"
        className="min-h-[44px] shrink-0 btn-glow"
      >
        {ctaText ?? t('dashboard.upgrade')}
      </CheckoutButton>
    </motion.div>
  );
}
