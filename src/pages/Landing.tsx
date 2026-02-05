import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { PublicPageMeta } from '@/components/seo/PublicPageMeta';
import { getSeo } from '@/data/seo-content';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { HeroBlobs } from '@/components/home/HeroBlobs';
import { HeroMarquee } from '@/components/home/HeroMarquee';
import { HeroTrustCard } from '@/components/home/HeroTrustCard';
import { InteractiveGradient } from '@/components/home/InteractiveGradient';
import { CareerDNAMarquee } from '@/components/home/CareerDNAMarquee';
import { IconArrowRight, IconCheckCircle } from '@/lib/icons';
import { LazySection } from '@/components/common/LazySection';
import { BentoGrid } from '@/components/home/BentoGrid';
import { FeatureSpotlight } from '@/components/home/FeatureSpotlight';
import { TestimonialMarquee } from '@/components/home/TestimonialMarquee';
import { PlatformIntegrations } from '@/components/home/PlatformIntegrations';
import { SuccessStories } from '@/components/home/SuccessStories';
import { AIDemo } from '@/components/home/AIDemo';
import { InteractiveTimeline } from '@/components/home/InteractiveTimeline';
import { FeatureComparison } from '@/components/pricing/FeatureComparison';
import { BlogCard } from '@/components/blog/BlogCard';
import { blogPosts } from '@/data/blog-posts';
import { fadeInUp, staggerContainer, blurIn, tNormal } from '@/lib/animations';

export default function Landing() {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const stats = [
    { value: '90', label: t('landing.statSeconds'), sublabel: t('landing.statSecondsSublabel') },
    { value: '12', label: t('landing.statWeeks'), sublabel: t('landing.statWeeksSublabel') },
    { value: '50+', label: t('landing.statPlatforms'), sublabel: t('landing.statPlatformsSublabel') },
    { value: '24/7', label: t('landing.statCoaching'), sublabel: t('landing.statCoachingSublabel') },
  ];

  return (
    <Layout>
      <PublicPageMeta
        title={getSeo("/", language).title}
        description={getSeo("/", language).description}
        path="/"
      />
      <div className="min-w-0 max-w-full overflow-x-clip">
      {/* Hero — unified responsive layout: left column first on mobile */}
      <section
        className="relative z-0 min-w-0 overflow-hidden"
        style={{ paddingTop: 'calc(3.5rem + env(safe-area-inset-top) + 1rem)' }}
      >
        <div className="absolute inset-0 mesh-gradient" />
        <HeroBlobs />
        <InteractiveGradient />
        <img
          src="/images/hero-bg.webp"
          alt=""
          loading="lazy"
          fetchPriority="low"
          decoding="async"
          className="absolute inset-0 z-0 h-full w-full object-cover object-center opacity-[0.12] dark:opacity-[0.08]"
          style={{
            maskImage: 'linear-gradient(180deg, transparent, black 5%, black 75%, transparent)',
            WebkitMaskImage: 'linear-gradient(180deg, transparent, black 5%, black 75%, transparent)',
          }}
          aria-hidden
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-transparent to-background" />

        <div className="container relative z-10 mx-auto grid min-w-0 max-w-full grid-cols-1 items-center gap-10 px-4 pb-16 pt-8 sm:px-5 sm:gap-12 sm:pb-20 sm:pt-10 md:px-6 lg:grid-cols-12 lg:min-h-[calc(100vh-3.5rem)] lg:gap-12 lg:pb-18 lg:px-8 lg:pt-28">
          {/* Left column — first row on mobile, left on desktop */}
          <div className="flex min-h-0 min-w-0 flex-col justify-center text-start lg:col-span-7 lg:max-w-2xl">
            <motion.div
              initial="initial"
              animate="animate"
              variants={staggerContainer}
              transition={tNormal}
            >
              <motion.div
                variants={fadeInUp}
                className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-foreground/5 px-3 py-1.5 text-xs font-medium backdrop-blur-md transition-colors hover:bg-foreground/10 sm:mb-4"
              >
                <img
                  src="https://cdn.simpleicons.org/googlegemini"
                  alt=""
                  width={14}
                  height={14}
                  className="h-3.5 w-3.5 shrink-0 object-contain"
                  aria-hidden
                />
                <span className="text-foreground/90">{t('landing.poweredBy')}</span>
              </motion.div>

              <motion.h1
                variants={blurIn}
                transition={{ ...tNormal, delay: 0.08 }}
                className="mb-3 font-extrabold leading-[1.15] tracking-tight text-balance text-[1.875rem] sm:mb-4 sm:text-5xl md:text-6xl xl:text-7xl xl:leading-[1.05]"
              >
                <span className="gradient-text">{t('hero.title')}</span>
                <br />
                <span className="text-foreground">{t('hero.subtitle')}</span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="mb-2 text-[15px] font-medium leading-snug text-foreground/95 sm:mb-3 sm:text-lg"
              >
                {t('landing.heroTagline')}
              </motion.p>

              <motion.p
                variants={fadeInUp}
                className="mb-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:mb-8"
              >
                {t('hero.description')}
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <Button
                  size="lg"
                  asChild
                  className="btn-glow group min-touch h-12 gap-2 rounded-full px-6 text-base font-semibold hover:scale-[1.02] active:scale-[0.98] sm:h-14 sm:px-8 sm:text-lg"
                >
                  <Link to={user ? '/wizard' : '/signup'}>
                    {t('hero.cta')}
                    <IconArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  asChild
                  className="min-touch h-11 gap-2 rounded-full border border-border/60 bg-foreground/5 px-6 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-foreground/10 hover:border-border sm:h-14 sm:px-8"
                >
                  <a
                    href="#how-it-works"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  >
                    {t('hero.cta.secondary')}
                  </a>
                </Button>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="mt-6 flex flex-wrap items-center justify-start gap-x-4 gap-y-2 text-xs text-muted-foreground sm:mt-10 sm:gap-x-5"
              >
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <IconCheckCircle className="h-4 w-4 shrink-0 text-success" />
                  {t('landing.freeToStart')}
                </span>
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <IconCheckCircle className="h-4 w-4 shrink-0 text-success" />
                  {t('landing.noCreditCard')}
                </span>
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <IconCheckCircle className="h-4 w-4 shrink-0 text-success" />
                  {t('landing.seconds90')}
                </span>
              </motion.div>
            </motion.div>
          </div>

          {/* Right column — second row on mobile, right on desktop */}
          <div className="flex min-h-0 flex-col items-center justify-center gap-6 sm:gap-8 lg:col-span-5 lg:items-end">
            <div className="w-full max-w-lg space-y-8 sm:space-y-10">
              <HeroTrustCard />
              <HeroMarquee />
            </div>
          </div>
        </div>
      </section>

      {/* Career DNA Marquee Banner */}
      <CareerDNAMarquee />

      {/* Stats */}
      <section className="bg-muted/20 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="public-glass-card flex flex-col items-start justify-center p-5 text-start md:p-6"
              >
                <span className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">{stat.value}</span>
                <span className="mt-1 text-sm font-semibold text-foreground">{stat.label}</span>
                <span className="mt-0.5 text-xs text-muted-foreground">{stat.sublabel}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section — lazy loaded for perf */}
      <LazySection className="py-12 sm:py-16 md:py-24 lg:py-32" rootMargin="200px">
        <section id="features">
          <div className="container mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-10 text-start sm:mb-12 md:mb-16"
            >
              <h2 className="mb-3 text-2xl font-bold sm:text-3xl md:text-4xl">
                {t('landing.featuresTitle')}
              </h2>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                {t('landing.featuresSubtitle')}
              </p>
            </motion.div>

            <FeatureSpotlight />

            <BentoGrid />
          </div>
        </section>
      </LazySection>

      <LazySection className="min-h-[180px]" rootMargin="150px">
        <TestimonialMarquee />
      </LazySection>

      <LazySection className="min-h-[200px]" rootMargin="150px">
        <PlatformIntegrations />
      </LazySection>

      <LazySection className="min-h-[300px]" rootMargin="150px">
        <SuccessStories />
      </LazySection>

      <LazySection className="min-h-[400px]" rootMargin="150px">
        <AIDemo />
      </LazySection>

      <LazySection className="min-h-[350px]" rootMargin="150px">
        <InteractiveTimeline />
      </LazySection>

      {/* Pricing */}
      <section id="pricing" className="bg-muted/20 py-10 sm:py-12 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-6 text-start sm:mb-8 md:mb-10"
          >
            <h2 className="mb-2 text-2xl font-bold sm:mb-3 sm:text-3xl md:text-4xl">
              {t('pricing.title')}
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              {t('pricing.subtitle')}
            </p>
          </motion.div>
          <div className="grid gap-6 lg:grid-cols-[1fr,minmax(260px,320px)] lg:items-start">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <FeatureComparison />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex flex-col rounded-2xl border-2 border-primary/40 bg-card/80 p-5 shadow-lg shadow-primary/10 backdrop-blur-xl sm:p-6 lg:sticky lg:top-24"
              >
                <h3 className="mb-2 text-xl font-bold text-foreground">
                  {t('landing.choosePlan')}
                </h3>
                <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                  {t('landing.choosePlanSubtitle')}
                </p>
                <Button size="lg" asChild className="mt-auto w-full gap-2 shadow-md">
                  <Link to="/pricing">
                    {t('landing.viewPlans')}
                    <IconArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </Link>
                </Button>
              </motion.div>
          </div>
        </div>
      </section>

      {/* Blog */}
      <section id="blog" className="bg-muted/30 py-12 sm:py-16 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-start sm:mb-10 md:mb-16"
          >
            <h2 className="mb-3 text-2xl font-bold sm:text-3xl md:text-4xl">
              {t('landing.fromBlog')}
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              {t('landing.fromBlogSubtitle')}
            </p>
          </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            className="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3"
          >
            {blogPosts.slice(0, 3).map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-10 flex justify-start"
          >
            <Button variant="outline" size="lg" asChild className="gap-2">
              <Link to="/blog">
                {t('landing.allPosts')}
                <IconArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-primary/10 to-primary/5 py-12 sm:py-16 md:py-24 lg:py-32">
        <div className="absolute inset-0 mesh-gradient opacity-30" />
        <div className="container relative mx-auto flex flex-col items-stretch gap-6 px-4 sm:gap-8 sm:px-6 md:flex-row md:items-center md:justify-between md:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl text-start"
          >
            <h2 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl md:text-5xl lg:text-6xl">
              {t('landing.ctaReadyTitle')}
            </h2>
            <p className="mb-4 text-base text-muted-foreground sm:mb-6 sm:text-lg">
              {t('landing.ctaReadyDesc')}
            </p>
            <p className="mb-2 text-sm text-muted-foreground">
              {t('landing.footerCta')}
            </p>
            <p className="text-sm text-muted-foreground">
              {language === 'ar' ? (
                <>بريميوم من <Link to="/pricing" className="font-medium text-primary hover:underline">$6.99/شهر</Link> أو <Link to="/pricing" className="font-medium text-primary hover:underline">$59/سنة</Link></>
              ) : (
                <>Premium from <Link to="/pricing" className="font-medium text-primary hover:underline">$6.99/mo</Link> or <Link to="/pricing" className="font-medium text-primary hover:underline">$59/yr</Link></>
              )}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full shrink-0 sm:w-auto"
          >
            <Button size="lg" asChild className="btn-glow group h-12 min-h-[48px] w-full gap-2 text-base shadow-xl shadow-primary/25 sm:min-h-0 sm:w-auto sm:text-lg">
              <Link to={user ? '/wizard' : '/signup'}>
                {t('hero.cta')}
                <IconArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
      </div>
    </Layout>
  );
}