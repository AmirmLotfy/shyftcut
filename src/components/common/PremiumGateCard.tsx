import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getUpgradePath } from '@/lib/upgrade-link';
import { cn } from '@/lib/utils';

export interface PremiumGateCardProps {
  /** Feature title (e.g. "Community", "Career Tools") */
  title: string;
  /** Description of what Premium unlocks */
  description: string;
  /** Optional list of benefits to show as bullets */
  benefits?: string[];
  /** Optional icon override (default: Crown) */
  icon?: React.ElementType;
  /** Optional className for the container */
  className?: string;
  /** Optional variant: 'full' (centered card) or 'inline' (fits in flow) */
  variant?: 'full' | 'inline';
  /** CTA button text override */
  ctaText?: string;
}

const DEFAULT_ICON = Crown;

/**
 * Unified premium gate card for sub-dashboards. Shown when a free user
 * visits a premium-only feature (Community, Career Tools, etc.).
 */
export function PremiumGateCard({
  title,
  description,
  benefits = [],
  icon: Icon = DEFAULT_ICON,
  className,
  variant = 'full',
  ctaText,
}: PremiumGateCardProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const upgradeLabel = ctaText ?? (language === 'ar' ? 'ترقية إلى بريميوم' : 'Upgrade to Premium');

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        variant === 'full' && 'mx-auto max-w-md',
        className
      )}
    >
      <Card className="dashboard-card overflow-hidden border-primary/20 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-transparent">
        <CardHeader className="text-center sm:text-start">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-4">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25"
            >
              <Icon className="h-7 w-7 text-white" />
            </motion.div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <Crown className="h-4 w-4 text-primary shrink-0" aria-hidden />
                <CardTitle className="text-xl">{title}</CardTitle>
              </div>
              <CardDescription className="text-base leading-relaxed">
                {description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {benefits.length > 0 && (
            <ul className="space-y-2 text-sm text-muted-foreground">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  {b}
                </li>
              ))}
            </ul>
          )}
          <Button asChild className="w-full btn-glow gap-2 min-h-[44px]">
            <Link to={getUpgradePath(user)}>
              <Crown className="h-4 w-4 shrink-0" />
              {upgradeLabel}
            </Link>
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            {language === 'ar'
              ? 'من $6.99/شهر أو $59/سنة — وفر 30٪ مع الخطة السنوية'
              : 'From $6.99/month or $59/year — Save 30% with yearly'}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (variant === 'full') {
    return (
      <div
        className="min-h-[60vh] flex flex-col items-center justify-start pt-8 pb-24"
        style={{
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))',
        }}
      >
        <div className="container mx-auto max-w-app-content px-4">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
