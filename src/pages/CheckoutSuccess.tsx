import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle, CreditCard, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Confetti } from '@/components/common/Confetti';

/** Valid return path: starts with / and contains no protocol (avoid open redirect). */
function isValidReturnTo(value: string | null): value is string {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.startsWith('/') && !trimmed.includes('://');
}

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { t, language } = useLanguage();
  const [showConfetti, setShowConfetti] = useState(true);

  const returnTo = useMemo(() => {
    const raw = searchParams.get('returnTo');
    return isValidReturnTo(raw) ? raw.trim() : '/dashboard';
  }, [searchParams]);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['subscription'] });
    queryClient.invalidateQueries({ queryKey: ['usage-limits'] });
  }, [queryClient]);

  useEffect(() => {
    // Auto redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate(returnTo);
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate, returnTo]);

  return (
    <Layout>
      <Confetti isActive={showConfetti} />
      <div className="container mx-auto flex min-h-[80vh] items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-success/20 bg-gradient-to-b from-success/5 to-background">
            <CardHeader className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/10"
              >
                <CheckCircle className="h-10 w-10 text-success" />
              </motion.div>
              <CardTitle className="text-2xl">
                {t('checkout.success.title')}
              </CardTitle>
              <CardDescription className="text-base">
                {t('checkout.success.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="font-medium">
                    {t('checkout.success.featuresTitle')}
                  </span>
                </div>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>{t('checkout.success.feature1')}</li>
                  <li>{t('checkout.success.feature2')}</li>
                  <li>{t('checkout.success.feature3')}</li>
                  <li>{t('checkout.success.feature4')}</li>
                  <li>{t('checkout.success.feature5')}</li>
                  <li>{t('checkout.success.feature6')}</li>
                  <li>{t('checkout.success.feature7')}</li>
                </ul>
              </div>

              <Button
                onClick={() => navigate(returnTo)}
                className="w-full btn-glow"
              >
                {returnTo === '/dashboard'
                  ? t('checkout.success.goToDashboard')
                  : language === 'ar'
                    ? 'العودة'
                    : 'Return'}
              </Button>

              <Button asChild variant="outline" className="w-full gap-2">
                <Link to="/profile">
                  <CreditCard className="h-4 w-4" />
                  {t('checkout.success.manageBilling')}
                </Link>
              </Button>
              
              <p className="text-center text-xs text-muted-foreground">
                {t('checkout.success.redirecting')}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
