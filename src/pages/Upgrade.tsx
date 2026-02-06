import { useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Crown, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/hooks/useSubscription";
import { CheckoutButton } from "@/components/pricing/CheckoutButton";
import { dashboardPaths } from "@/lib/dashboard-routes";
import { POLAR_PRODUCTS } from "@/lib/polar-config";
import type { BillingInterval } from "@/lib/polar-config";
import { getPremiumFeaturesList } from "@/lib/premium-features";

const PAGE_CONTAINER = "container mx-auto max-w-2xl px-4 pb-24 pt-6 sm:px-6 sm:py-8";
const PAGE_PADDING = {
  paddingLeft: "max(1rem, env(safe-area-inset-left))",
  paddingRight: "max(1rem, env(safe-area-inset-right))",
};

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

  const premiumOption = billingInterval === "year" ? POLAR_PRODUCTS.premium.yearly : POLAR_PRODUCTS.premium.monthly;

  if (isPremium) {
    return (
      <div className={PAGE_CONTAINER} style={PAGE_PADDING}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="dashboard-card border-primary/20 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-transparent">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {t('upgrade.alreadyPremium')}
                  </CardTitle>
                  <CardDescription>
                    {t('upgrade.alreadyPremiumDesc')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link to={dashboardPaths.profile}>{t('upgrade.manageSubscription')}</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={PAGE_CONTAINER} style={PAGE_PADDING}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Button variant="ghost" size="sm" asChild className="mb-4 gap-2 -ml-2">
          <Link to={dashboardPaths.index}>
            <ArrowLeft className="h-4 w-4" />
            {t('upgrade.backToDashboard')}
          </Link>
        </Button>
        <h1 className="flex items-center gap-2 text-xl font-bold leading-tight sm:text-2xl md:text-3xl">
          <Crown className="h-6 w-6 text-primary shrink-0" aria-hidden />
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
          <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl bg-muted/80 p-1">
            <TabsTrigger value="month" className="rounded-lg text-sm font-semibold">
              {t('upgrade.monthly')}
            </TabsTrigger>
            <TabsTrigger value="year" className="rounded-lg text-sm font-semibold">
              {t('upgrade.yearly')}
            </TabsTrigger>
          </TabsList>
          {billingInterval === "year" && (
            <p className="mt-2 text-xs font-medium text-primary">
              {t('upgrade.save30')}
            </p>
          )}
          {fromCareerdna && (
            <p className="mt-2 text-xs font-medium text-primary">
              {t('careerDna.result.quizTakersDiscount')}
            </p>
          )}
        </Tabs>

        <Card className="dashboard-card overflow-hidden border-primary/20 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-transparent">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/25">
                <Crown className="h-7 w-7" />
              </div>
              <div>
                <CardTitle className="text-xl">Premium</CardTitle>
                <CardDescription className="text-base">
                  ${premiumOption.price}
                  {billingInterval === "month" ? t('upgrade.perMonth') : t('upgrade.perYear')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-2.5">
              {premiumFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm">
                  <CheckCircle className="h-4 w-4 shrink-0 text-success" />
                  {feature}
                </li>
              ))}
            </ul>
            <CheckoutButton
              planId="premium"
              productId={premiumOption.productId}
              className="w-full btn-glow min-h-[48px]"
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
  );
}
