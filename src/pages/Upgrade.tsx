import { useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Crown, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout/Layout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/hooks/useSubscription";
import { CheckoutButton } from "@/components/pricing/CheckoutButton";
import { POLAR_PRODUCTS } from "@/lib/polar-config";
import type { BillingInterval } from "@/lib/polar-config";
import { getPremiumFeaturesList } from "@/lib/premium-features";

export default function Upgrade() {
  const { language, t } = useLanguage();
  const lang = language === "ar" ? "ar" : "en";
  const premiumFeatures = getPremiumFeaturesList(lang);
  const { isPremium } = useSubscription();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("year");
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? searchParams.get("returnTo") ?? undefined;
  const fromCareerdna = searchParams.get("from") === "careerdna";

  const isAr = language === "ar";
  const premiumOption = billingInterval === "year" ? POLAR_PRODUCTS.premium.yearly : POLAR_PRODUCTS.premium.monthly;

  if (isPremium) {
    return (
      <Layout>
        <div
          className="container mx-auto max-w-2xl px-4 pb-24 pt-6 sm:px-6 sm:py-8"
          style={{ paddingLeft: "max(1rem, env(safe-area-inset-left))", paddingRight: "max(1rem, env(safe-area-inset-right))" }}
        >
          <Card className="rounded-2xl border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                {t('upgrade.alreadyPremium')}
              </CardTitle>
              <CardDescription>
                {t('upgrade.alreadyPremiumDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link to="/profile">{t('upgrade.manageSubscription')}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div
        className="container mx-auto max-w-2xl px-4 pb-24 pt-6 sm:px-6 sm:py-8"
        style={{ paddingLeft: "max(1rem, env(safe-area-inset-left))", paddingRight: "max(1rem, env(safe-area-inset-right))" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Button variant="ghost" size="sm" asChild className="mb-4 gap-2 -ml-2">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              {t('upgrade.backToDashboard')}
            </Link>
          </Button>
          <h1 className="text-xl font-bold leading-tight sm:text-2xl md:text-3xl">
            {t('upgrade.title')}
          </h1>
          <p className="mt-1 text-[15px] text-muted-foreground leading-relaxed">
            {t('upgrade.description')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Tabs
            value={billingInterval}
            onValueChange={(v) => setBillingInterval(v as BillingInterval)}
            className="mb-6"
          >
            <TabsList className="grid h-11 w-full grid-cols-2 rounded-lg bg-muted/80 p-1">
              <TabsTrigger value="month" className="rounded-md text-sm font-semibold">
                {t('upgrade.monthly')}
              </TabsTrigger>
              <TabsTrigger value="year" className="rounded-md text-sm font-semibold">
                {t('upgrade.yearly')}
              </TabsTrigger>
            </TabsList>
            {billingInterval === "year" && (
              <p className="mt-2 text-xs text-primary">
                {t('upgrade.save30')}
              </p>
            )}
            {fromCareerdna && (
              <p className="mt-2 text-xs font-medium text-primary">
                {t('careerDna.result.quizTakersDiscount')}
              </p>
            )}
          </Tabs>

          <Card className="public-glass-card rounded-2xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white">
                  <Crown className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>Premium</CardTitle>
                  <CardDescription>
                    ${premiumOption.price}
                    {billingInterval === "month" ? t('upgrade.perMonth') : t('upgrade.perYear')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-2">
                {premiumFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 shrink-0 text-success" />
                    {feature}
                  </li>
                ))}
              </ul>
              <CheckoutButton
                planId="premium"
                productId={premiumOption.productId}
                className="w-full btn-glow"
                returnTo={returnTo}
                metadata={fromCareerdna ? { from: "careerdna" } : undefined}
              >
                {t('upgrade.upgradeNow')}
              </CheckoutButton>
              <p className="text-center text-xs text-muted-foreground">
                {t('upgrade.noCardRequired')}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
