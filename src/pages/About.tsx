import { motion } from 'framer-motion';
import { ArrowLeft, Target, Users, Lightbulb, Heart, Rocket, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { PublicPageMeta } from '@/components/seo/PublicPageMeta';
import { getSeo } from '@/data/seo-content';
import { useLanguage } from '@/contexts/LanguageContext';

export default function About() {
  const { language } = useLanguage();

  const values = [
    {
      icon: Target,
      title: { en: 'Clarity First', ar: 'الوضوح أولاً' },
      description: {
        en: 'We believe everyone deserves a clear path to their career goals.',
        ar: 'نؤمن بأن الجميع يستحق مساراً واضحاً لأهدافه المهنية.',
      },
    },
    {
      icon: Users,
      title: { en: 'Accessibility', ar: 'إتاحة الوصول' },
      description: {
        en: 'Career guidance should be available to everyone, not just the privileged few.',
        ar: 'يجب أن يكون التوجيه المهني متاحاً للجميع.',
      },
    },
    {
      icon: Lightbulb,
      title: { en: 'Innovation', ar: 'الابتكار' },
      description: {
        en: 'We leverage cutting-edge AI to deliver personalized guidance at scale.',
        ar: 'نستفيد من أحدث تقنيات الذكاء الاصطناعي لتقديم توجيه مخصص.',
      },
    },
    {
      icon: Heart,
      title: { en: 'Empathy', ar: 'التعاطف' },
      description: {
        en: 'Career transitions are hard. We design with compassion and understanding.',
        ar: 'التحولات المهنية صعبة. نحن نصمم بتعاطف وتفهم.',
      },
    },
  ];

  const milestones = [
    { year: '2024', event: { en: 'Idea conceived', ar: 'ولدت الفكرة' } },
    { year: '2025', event: { en: 'Product built', ar: 'بناء المنتج' } },
    { year: '2026', event: { en: 'Launching February 2026', ar: 'الإطلاق فبراير 2026' } },
  ];

  return (
    <Layout>
      <PublicPageMeta
        title={getSeo("/about", language).title}
        description={getSeo("/about", language).description}
        path="/about"
      />
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 mesh-gradient opacity-30" />
          <div className="container relative mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-3xl text-start rtl:text-end"
            >
              <Button variant="ghost" asChild className="mb-8">
                <Link to="/" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
                </Link>
              </Button>
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                <Rocket className="h-10 w-10 text-white" />
              </div>
              <h1 className="mb-6 text-4xl font-bold md:text-5xl">
                {language === 'ar' ? 'عن Shyftcut' : 'About Shyftcut'}
              </h1>
              <p className="text-xl text-muted-foreground">
                {language === 'ar'
                  ? 'نحن في مهمة لجعل التوجيه المهني متاحاً وشخصياً وقابلاً للتنفيذ للجميع.'
                  : "We're on a mission to make career guidance accessible, personalized, and actionable for everyone."}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="border-y border-border bg-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mx-auto max-w-3xl text-start rtl:text-end"
            >
              <h2 className="mb-6 text-3xl font-bold">
                {language === 'ar' ? 'مهمتنا' : 'Our Mission'}
              </h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
                {language === 'ar'
                  ? 'الكثير من الناس يشعرون بالضياع في مسيرتهم المهنية. التوجيه المهني التقليدي مكلف وبطيء وغالباً ما يكون قديماً. نحن نستخدم الذكاء الاصطناعي لتقديم توجيه مخصص يلبي احتياجاتك الفريدة، في دقائق وليس أشهر.'
                  : 'Too many people feel lost in their careers. Traditional career guidance is expensive, slow, and often outdated. We use AI to deliver personalized guidance that meets your unique needs, in minutes not months.'}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12 text-start rtl:text-end"
            >
              <h2 className="mb-4 text-3xl font-bold">
                {language === 'ar' ? 'قيمنا' : 'Our Values'}
              </h2>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="public-glass-card h-full">
                    <CardContent className="p-6 text-start rtl:text-end">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <value.icon className="h-7 w-7 text-primary" />
                      </div>
                      <h3 className="mb-2 text-lg font-semibold">{value.title[language]}</h3>
                      <p className="text-sm text-muted-foreground">{value.description[language]}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="border-t border-border bg-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12 text-start rtl:text-end"
            >
              <h2 className="mb-4 text-3xl font-bold">
                {language === 'ar' ? 'رحلتنا' : 'Our Journey'}
              </h2>
            </motion.div>

            <div className="mx-auto max-w-2xl text-start rtl:text-end">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-4 pb-8 last:pb-0"
                >
                  <div className="flex flex-col items-center">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                      {milestone.year.slice(-2)}
                    </div>
                    {index < milestones.length - 1 && (
                      <div className="mt-2 h-full w-0.5 bg-border" />
                    )}
                  </div>
                  <div className="pt-2">
                    <span className="text-sm text-muted-foreground">{milestone.year}</span>
                    <p className="font-medium">{milestone.event[language]}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mx-auto max-w-2xl text-start rtl:text-end"
            >
              <Award className="mb-6 h-12 w-12 text-primary" />
              <h2 className="mb-4 text-3xl font-bold">
                {language === 'ar' ? 'جاهز للبدء؟' : 'Ready to Get Started?'}
              </h2>
              <p className="mb-8 text-muted-foreground">
                {language === 'ar'
                  ? 'انضم إلى المحترفين الذين يحولون مسيراتهم المهنية مع Shyftcut. نطلق في فبراير ٢٠٢٦.'
                  : 'Join professionals transforming their careers with Shyftcut. We launch February 2026.'}
              </p>
              <Button size="lg" asChild className="btn-glow">
                <Link to="/signup">
                  {language === 'ar' ? 'ابدأ مجاناً' : 'Start Free'}
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
