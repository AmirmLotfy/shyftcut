import { Link } from 'react-router-dom';
import { Gift, ExternalLink, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

const AFFONSO_PORTAL_URL = import.meta.env.VITE_AFFONSO_PORTAL_URL || 'https://shyftcut.affonso.io';

export default function Affiliate() {
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <Layout>
      <div className="mx-auto max-w-2xl space-y-8 py-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary">
            <Gift className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t('affiliate.title')}</h1>
          <p className="text-muted-foreground text-lg">{t('affiliate.subtitle')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('affiliate.ratesTitle')}</CardTitle>
            <CardDescription>{t('affiliate.ratesDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-primary font-medium">15%</span>
                <span>{t('affiliate.rateFirst')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-medium">10%</span>
                <span>{t('affiliate.rateRecurring')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-medium">$25</span>
                <span>{t('affiliate.minPayout')}</span>
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">{t('affiliate.howItWorks')}</p>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="gap-2">
            <a href={AFFONSO_PORTAL_URL} target="_blank" rel="noopener noreferrer">
              {t('affiliate.openDashboard')}
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          {!user && (
            <>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link to="/signup">
                  {t('affiliate.ctaSignup')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/pricing">{t('affiliate.viewPricing')}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
