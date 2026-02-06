import { Link, Navigate } from 'react-router-dom';
import { Gift, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { dashboardPaths } from '@/lib/dashboard-routes';
import { useAuth } from '@/contexts/AuthContext';
import { Helmet } from 'react-helmet-async';

const AFFONSO_PORTAL_URL = import.meta.env.VITE_AFFONSO_PORTAL_URL || 'https://shyftcut.affonso.io';

/**
 * In-dashboard affiliate page: for logged-in users only.
 * Shows program summary and link to the external affiliate (Affonso) dashboard.
 * Guests are redirected to the public /earn page.
 */
export default function Affiliate() {
  const { t } = useLanguage();
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Navigate to="/earn" replace />;

  return (
    <>
      <Helmet>
        <title>{t('affiliate.profileTitle')} | Shyftcut</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Gift className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t('affiliate.profileTitle')}</h1>
              <p className="text-muted-foreground text-sm">{t('affiliate.profileDescription')}</p>
            </div>
          </div>

          <Card className="border-muted">
            <CardHeader>
              <CardTitle className="text-base">{t('affiliate.ratesTitle')}</CardTitle>
              <CardDescription>{t('affiliate.ratesDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>15% {t('affiliate.rateFirst')}</p>
              <p>10% {t('affiliate.rateRecurring')}</p>
              <p>$25 {t('affiliate.minPayout')}</p>
              <p className="pt-2">{t('affiliate.howItWorks')}</p>
            </CardContent>
          </Card>

          <Button asChild size="lg" className="gap-2 w-full sm:w-auto">
            <a href={AFFONSO_PORTAL_URL} target="_blank" rel="noopener noreferrer">
              {t('affiliate.openDashboard')}
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>

          <p className="text-sm text-muted-foreground">
            <Link to="/pricing" className="text-primary hover:underline">
              {t('affiliate.viewPricing')}
            </Link>
            {' · '}
            <Link to={dashboardPaths.profile} className="text-primary hover:underline">
              {t('affiliate.ctaProfile')}
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
