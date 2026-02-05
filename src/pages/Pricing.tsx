import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Layout } from '@/components/layout/Layout';
import { PublicPageMeta } from '@/components/seo/PublicPageMeta';
import { getSeo } from '@/data/seo-content';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { CheckoutButton } from '@/components/pricing/CheckoutButton';
import { FeatureComparison } from '@/components/pricing/FeatureComparison';
import { IconCheckCircle, IconSparkle, IconLightning } from '@/lib/icons';
import { POLAR_PRODUCTS } from '@/lib/polar-config';
import type { BillingInterval } from '@/lib/polar-config';

const plans = {
  en: [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      description: 'Get started with basic features',
      icon: IconSparkle,
      features: [
        '1 roadmap (total)',
        '10 AI chat messages per month',
        '3 quizzes per month',
        '1 recommended course per week',
        'Progress tracking & dashboard',
        'Email support',
      ],
      ctaKey: 'Get Started Free',
      ctaKeyAr: 'ابدأ مجاناً',
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 6.99,
      description: 'Unlimited roadmaps and AI',
      icon: IconLightning,
      popular: true,
      features: [
        'Unlimited roadmaps',
        'Unlimited AI chat',
        'Unlimited quizzes',
        'Full course recommendations',
        'CV analysis (paste or upload)',
        'Find jobs for me — 10 real jobs weekly',
        'Progress tracking & analytics',
        'Email support',
      ],
      ctaKey: 'Upgrade Now',
      ctaKeyAr: 'ترقية الآن',
    },
  ],
  ar: [
    {
      id: 'free',
      name: 'مجاني',
      price: 0,
      description: 'ابدأ مع المميزات الأساسية',
      icon: IconSparkle,
      features: [
        'خريطة طريق واحدة (إجمالي)',
        '10 رسائل دردشة ذكاء اصطناعي شهرياً',
        '3 اختبارات شهرياً',
        'دورة موصى بها واحدة أسبوعياً',
        'تتبع التقدم ولوحة التحكم',
        'دعم البريد الإلكتروني',
      ],
      ctaKey: 'Get Started Free',
      ctaKeyAr: 'ابدأ مجاناً',
    },
    {
      id: 'premium',
      name: 'بريميوم',
      price: 6.99,
      description: 'خرائط طريق وذكاء اصطناعي غير محدود',
      icon: IconLightning,
      popular: true,
      features: [
        'خرائط طريق غير محدودة',
        'دردشة ذكاء اصطناعي غير محدودة',
        'اختبارات غير محدودة',
        'توصيات دورات كاملة',
        'تحليل السيرة الذاتية (لصق أو رفع)',
        'اعثر على وظائف لي — 10 وظائف حقيقية أسبوعياً',
        'تتبع التقدم والتحليلات',
        'دعم البريد الإلكتروني',
      ],
      ctaKey: 'Upgrade Now',
      ctaKeyAr: 'ترقية الآن',
    },
  ],
};

const faqs = {
  en: [
    { q: 'Can I change plans later?', a: 'Yes. You can upgrade or downgrade anytime from your subscription settings. Differences are prorated.' },
    { q: 'What payment methods do you accept?', a: 'We accept credit and debit cards (Visa, Mastercard, American Express) through a secure payment processor.' },
    { q: 'Is there a refund policy?', a: 'Yes. See our Refund Policy page for details. We offer refunds within a specified period for new subscribers.' },
    { q: 'Do you offer student discounts?', a: 'We are working on adding student discounts soon. Contact us at support@shyftcut.com for more.' },
  ],
  ar: [
    { q: 'هل يمكنني تغيير الخطة لاحقاً؟', a: 'نعم. يمكنك الترقية أو العودة للخطة المجانية في أي وقت من إعدادات الاشتراك. يتم احتساب الفرق نسبياً.' },
    { q: 'ما هي طرق الدفع المقبولة؟', a: 'نقبل بطاقات الائتمان والخصم المباشر (Visa, Mastercard, American Express) من خلال معالج دفع آمن.' },
    { q: 'هل هناك سياسة استرداد أموال؟', a: 'نعم. راجع صفحة سياسة الاسترداد للتفاصيل. نقدم استرداداً خلال فترة محددة للمشتركين الجدد.' },
    { q: 'هل تقدمون خصومات للطلاب؟', a: 'نعمل على إضافة خصومات للطلاب قريباً. تواصل معنا على support@shyftcut.com للمزيد.' }
  ]
};

export default function Pricing() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tier } = useSubscription();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('year');

  // Logged-in users see the in-app upgrade flow instead of the public pricing page
  useEffect(() => {
    if (user) {
      navigate('/upgrade', { replace: true });
    }
  }, [user, navigate]);

  if (user) {
    return null; // redirect in progress to /upgrade
  }

  const currentPlans = plans[language];
  const currentFaqs = faqs[language];
  const premiumOption = billingInterval === 'year' ? POLAR_PRODUCTS.premium.yearly : POLAR_PRODUCTS.premium.monthly;
  const yearlySavings = language === 'ar' ? 'وفر 30%' : 'Save 30%';
  const isAr = language === 'ar';

  return (
    <Layout>
      <PublicPageMeta
        title={getSeo("/pricing", language).title}
        description={getSeo("/pricing", language).description}
        path="/pricing"
      />

      {/* Hero — left-aligned, minimal */}
      <section className="border-b border-border/60 bg-muted/20 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-8"
          >
            <div className="text-start">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary/80">
                {isAr ? 'التسعير' : 'Pricing'}
              </p>
              <h1 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                {isAr ? 'أسعار بسيطة وشفافة' : 'Simple, Transparent Pricing'}
              </h1>
              <p className="max-w-xl text-muted-foreground">
                {isAr
                  ? 'افتح خرائط الطريق والذكاء الاصطناعي والاختبارات بدون حدود. إلغاء في أي وقت.'
                  : 'Unlock unlimited roadmaps, AI chat, and quizzes. Cancel anytime.'}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
              <Tabs
                value={billingInterval}
                onValueChange={(v) => setBillingInterval(v as BillingInterval)}
                className="w-full min-w-[200px] md:w-auto"
              >
                <TabsList className="grid h-11 w-full grid-cols-2 rounded-lg bg-muted/80 p-1 md:w-[240px]">
                  <TabsTrigger
                    value="month"
                    data-testid="billing-tab-monthly"
                    className="rounded-md text-sm font-semibold transition-all data-[state=inactive]:text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  >
                    {isAr ? 'شهري' : 'Monthly'}
                  </TabsTrigger>
                  <TabsTrigger
                    value="year"
                    data-testid="billing-tab-yearly"
                    className="rounded-md text-sm font-semibold transition-all data-[state=inactive]:text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  >
                    {isAr ? 'سنوي' : 'Yearly'}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              {billingInterval === 'year' && (
                <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                  {yearlySavings}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Plan cards — side-by-side, one highlighted */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2 md:gap-8">
            {currentPlans.map((plan, index) => {
              const Icon = plan.icon;
              const isCurrentPlan = tier === plan.id;
              const isPremium = plan.id === 'premium';

              return (
                <motion.article
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className={`relative flex flex-col rounded-2xl border-2 p-6 text-start shadow-sm transition-all md:p-8 ${
                    plan.popular
                      ? 'border-primary/40 bg-card ring-2 ring-primary/10'
                      : 'border-border/60 bg-card/50 backdrop-blur-xl'
                  } ${isCurrentPlan ? 'bg-primary/5' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 start-1/2 -translate-x-1/2 rtl:translate-x-1/2">
                      <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                        {isAr ? 'الأكثر شعبية' : 'Most Popular'}
                      </span>
                    </div>
                  )}

                  <div className="mb-6 flex items-center gap-3">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                        plan.popular
                          ? 'bg-gradient-to-br from-primary to-primary/80 text-white'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{plan.name}</h2>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>

                  <div className="mb-6 flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold tracking-tight md:text-4xl">
                      ${isPremium ? premiumOption.price : plan.price}
                    </span>
                    {isPremium && (
                      <span className="text-muted-foreground">
                        {billingInterval === 'month'
                          ? isAr ? '/شهرياً' : '/month'
                          : isAr ? '/سنوياً' : '/year'}
                      </span>
                    )}
                  </div>

                  <ul className="mb-8 flex-1 space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <IconCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                        <span className="text-sm text-foreground/90">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <Button className="w-full" variant="outline" disabled>
                      {isAr ? 'خطتك الحالية' : 'Current Plan'}
                    </Button>
                  ) : plan.id === 'free' ? (
                    <Button variant="outline" className="w-full" asChild>
                      <Link to={user ? '/dashboard' : '/signup'}>
                        {isAr ? plan.ctaKeyAr : plan.ctaKey}
                      </Link>
                    </Button>
                  ) : (
                    <CheckoutButton
                      planId="premium"
                      productId={premiumOption.productId}
                      className={`w-full ${plan.popular ? 'btn-glow' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {isAr ? plan.ctaKeyAr : plan.ctaKey}
                    </CheckoutButton>
                  )}
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust — one row */}
      <section className="border-y border-border/60 bg-muted/10 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground md:gap-10">
            <span className="flex items-center gap-2">
              <IconCheckCircle className="h-4 w-4 text-success" />
              {isAr ? 'دفع آمن' : 'Secure checkout'}
            </span>
            <span className="flex items-center gap-2">
              <IconCheckCircle className="h-4 w-4 text-success" />
              {isAr ? 'إلغاء في أي وقت' : 'Cancel anytime'}
            </span>
            <span className="flex items-center gap-2">
              <IconCheckCircle className="h-4 w-4 text-success" />
              {isAr ? 'سياسة استرداد' : 'Refund policy'}
            </span>
          </div>
        </div>
      </section>

      {/* Feature comparison */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-start"
          >
            <h2 className="mb-6 text-2xl font-bold md:text-3xl">
              {isAr ? 'مقارنة الميزات' : 'Feature Comparison'}
            </h2>
            <FeatureComparison />
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border/60 bg-muted/20 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-start"
          >
            <h2 className="mb-6 text-2xl font-bold md:text-3xl">
              {isAr ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {currentFaqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-start">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* Footer note */}
      <section className="py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            {isAr
              ? 'جميع الأسعار بالدولار الأمريكي. الإلغاء متاح في أي وقت.'
              : 'All prices in USD. Cancel anytime.'}
          </p>
          <p className="mt-2">
            {isAr
              ? 'لديك سؤال؟ تواصل معنا على support@shyftcut.com'
              : 'Have questions? Contact us at support@shyftcut.com'}
          </p>
        </div>
      </section>
    </Layout>
  );
}
