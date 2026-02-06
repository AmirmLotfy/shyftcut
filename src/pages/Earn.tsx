import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, UserPlus, Link2, Share2, ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { PublicPageMeta } from '@/components/seo/PublicPageMeta';
import { getSeo } from '@/data/seo-content';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardPaths } from '@/lib/dashboard-routes';

const AFFONSO_PORTAL_URL = import.meta.env.VITE_AFFONSO_PORTAL_URL || 'https://shyftcut.affonso.io';

const steps = [
  { key: 'step1', icon: UserPlus },
  { key: 'step2', icon: Link2 },
  { key: 'step3', icon: Share2 },
] as const;

export default function Earn() {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  return (
    <Layout>
      <PublicPageMeta
        title={getSeo('/earn', language === 'ar' ? 'ar' : 'en').title}
        description={getSeo('/earn', language === 'ar' ? 'ar' : 'en').description}
        path="/earn"
      />
      <div className="container mx-auto max-w-3xl px-4 py-16 md:py-24">
        {/* Hero */}
        <motion.div
          className="text-center space-y-4 mb-16"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary">
            <Gift className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {t('earn.heroTitle')}
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {t('earn.heroSubtitle')}
          </p>
        </motion.div>

        {/* How it works – 3 steps */}
        <div className="grid gap-6 sm:grid-cols-3 mb-14">
          {steps.map(({ key, icon: Icon }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 * i }}
            >
              <Card className="h-full border-muted/80 bg-card/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">
                      {language === 'ar' ? `الخطوة ${i + 1}` : `Step ${i + 1}`}
                    </span>
                  </div>
                  <CardTitle className="text-lg">
                    {t(`earn.${key}Title`)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t(`earn.${key}Desc`)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Commission rates */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mb-14"
        >
          <Card className="border-muted/80">
            <CardHeader>
              <CardTitle>{t('earn.ratesTitle')}</CardTitle>
              <CardDescription className="sr-only">
                {t('earn.heroSubtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <span className="text-muted-foreground">{t('earn.ratesFirst')}</span>
                <span className="font-semibold text-primary">15%</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <span className="text-muted-foreground">{t('earn.ratesRecurring')}</span>
                <span className="font-semibold text-primary">10%</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <span className="text-muted-foreground">{t('earn.ratesMin')}</span>
                <span className="font-semibold">$25</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          {!user ? (
            <>
              <Button asChild size="lg" className="gap-2 w-full sm:w-auto">
                <Link to={`/signup?returnTo=${encodeURIComponent(dashboardPaths.affiliate)}`}>
                  {t('earn.ctaJoin')}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link to="/pricing">{t('earn.ctaPricing')}</Link>
              </Button>
              <p className="text-sm text-muted-foreground mt-2 sm:mt-0">
                {t('earn.alreadyMember')}{' '}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  {language === 'ar' ? 'تسجيل الدخول' : 'Sign in'}
                </Link>
              </p>
            </>
          ) : (
            <Button asChild size="lg" className="gap-2">
              <a href={AFFONSO_PORTAL_URL} target="_blank" rel="noopener noreferrer">
                {t('earn.goToDashboard')}
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
