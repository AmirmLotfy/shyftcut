import { motion } from 'framer-motion';
import { ArrowLeft, Briefcase, Globe, GraduationCap, Heart, Clock, Users, MapPin, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { PublicPageMeta } from '@/components/seo/PublicPageMeta';
import { getSeo } from '@/data/seo-content';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Careers() {
  const { language } = useLanguage();

  const benefits = [
    {
      icon: Globe,
      title: { en: 'Remote-First', ar: 'عن بُعد أولاً' },
      description: {
        en: 'Work from anywhere in the world. We believe in flexibility.',
        ar: 'اعمل من أي مكان في العالم. نحن نؤمن بالمرونة.',
      },
    },
    {
      icon: GraduationCap,
      title: { en: 'Learning Budget', ar: 'ميزانية تعلم' },
      description: {
        en: '$1,000/year for courses, books, and conferences.',
        ar: '1000 دولار/سنة للدورات والكتب والمؤتمرات.',
      },
    },
    {
      icon: Heart,
      title: { en: 'Health Benefits', ar: 'مزايا صحية' },
      description: {
        en: 'Comprehensive health, dental, and vision coverage.',
        ar: 'تغطية صحية شاملة.',
      },
    },
    {
      icon: Clock,
      title: { en: 'Flexible Hours', ar: 'ساعات مرنة' },
      description: {
        en: "Work when you're most productive. No strict 9-5.",
        ar: 'اعمل عندما تكون أكثر إنتاجية. لا يوجد جدول صارم.',
      },
    },
  ];

  const openings = [
    {
      title: { en: 'Senior Full-Stack Engineer', ar: 'مهندس Full-Stack أول' },
      department: { en: 'Engineering', ar: 'الهندسة' },
      location: { en: 'Remote', ar: 'عن بُعد' },
      type: { en: 'Full-time', ar: 'دوام كامل' },
    },
    {
      title: { en: 'AI/ML Engineer', ar: 'مهندس ذكاء اصطناعي/تعلم آلي' },
      department: { en: 'AI Team', ar: 'فريق الذكاء الاصطناعي' },
      location: { en: 'Remote', ar: 'عن بُعد' },
      type: { en: 'Full-time', ar: 'دوام كامل' },
    },
    {
      title: { en: 'Product Designer', ar: 'مصمم منتج' },
      department: { en: 'Design', ar: 'التصميم' },
      location: { en: 'Remote', ar: 'عن بُعد' },
      type: { en: 'Full-time', ar: 'دوام كامل' },
    },
    {
      title: { en: 'Content Writer (Arabic)', ar: 'كاتب محتوى (عربي)' },
      department: { en: 'Marketing', ar: 'التسويق' },
      location: { en: 'Remote', ar: 'عن بُعد' },
      type: { en: 'Contract', ar: 'عقد' },
    },
  ];

  const steps = [
    {
      step: '1',
      title: { en: 'Apply', ar: 'قدّم' },
      description: { en: 'Submit your application with resume and cover letter.', ar: 'اعمل في الوقت الذي تكون فيه أكثر إنتاجية. لا يوجد دوام صارم من 9-5.' },
    },
    {
      step: '2',
      title: { en: 'Chat', ar: 'محادثة' },
      description: { en: 'Quick intro call to learn about you and answer questions.', ar: 'أرسل طلبك مع السيرة الذاتية وخطاب التغطية.' },
    },
    {
      step: '3',
      title: { en: 'Challenge', ar: 'التحدي' },
      description: { en: 'Take-home project relevant to the role.', ar: 'مكالمة تعارف سريعة للتعرف عليك والإجابة عن الأسئلة.' },
    },
    {
      step: '4',
      title: { en: 'Final Interview', ar: 'المقابلة النهائية' },
      description: { en: "Deep dive with the team you'll be working with.", ar: 'غوص عميق مع الفريق الذي ستعمل معه.' },
    },
  ];

  return (
    <Layout>
      <PublicPageMeta
        title={getSeo("/careers", language).title}
        description={getSeo("/careers", language).description}
        path="/careers"
      />
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 mesh-gradient opacity-30" />
          <div className="container relative mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-3xl text-center"
            >
              <Button variant="ghost" asChild className="mb-8">
                <Link to="/" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
                </Link>
              </Button>
              
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                <Users className="h-10 w-10 text-white" />
              </div>
              
              <h1 className="mb-6 text-4xl font-bold md:text-5xl">
                {language === 'ar' ? 'انضم لـ Shyftcut' : 'Join Our Team'}
              </h1>
              
              <p className="text-xl text-muted-foreground">
                {language === 'ar'
                  ? 'ساعدنا في بناء مستقبل التوجيه المهني. نبحث عن أشخاص شغوفين يريدون إحداث تأثير.'
                  : "Help us build the future of career guidance. We're looking for passionate people who want to make an impact."}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="border-y border-border bg-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12 text-center"
            >
              <h2 className="mb-4 text-3xl font-bold">
                {language === 'ar' ? 'لماذا تنضم إلينا؟' : 'Why Join Us?'}
              </h2>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="public-glass-card h-full">
                    <CardContent className="p-6 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <benefit.icon className="h-7 w-7 text-primary" />
                      </div>
                      <h3 className="mb-2 text-lg font-semibold">{benefit.title[language]}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description[language]}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Open Positions */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12 text-center"
            >
              <h2 className="mb-4 text-3xl font-bold">
                {language === 'ar' ? 'الوظائف المتاحة' : 'Open Positions'}
              </h2>
              <p className="text-muted-foreground">
                {language === 'ar'
                  ? 'لم تجد ما تبحث عنه؟ أرسل لنا طلباً عاماً على careers@shyftcut.com'
                  : "Don't see what you're looking for? Send a general application to careers@shyftcut.com"}
              </p>
            </motion.div>

            <div className="mx-auto max-w-3xl space-y-4">
              {openings.map((job, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="public-glass-card group transition-all">
                    <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="mb-2 text-lg font-semibold group-hover:text-primary">
                          {job.title[language]}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">
                            <Briefcase className="mr-1 h-3 w-3 rtl:mr-0 rtl:ml-1" />
                            {job.department[language]}
                          </Badge>
                          <Badge variant="outline">
                            <MapPin className="mr-1 h-3 w-3 rtl:mr-0 rtl:ml-1" />
                            {job.location[language]}
                          </Badge>
                          <Badge variant="outline">{job.type[language]}</Badge>
                        </div>
                      </div>
                      <Button className="shrink-0">
                        <Send className="mr-2 h-4 w-4 rtl:mr-0 rtl:ml-2" />
                        {language === 'ar' ? 'تقدم الآن' : 'Apply Now'}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Hiring Process */}
        <section className="border-t border-border bg-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12 text-center"
            >
              <h2 className="mb-4 text-3xl font-bold">
                {language === 'ar' ? 'عملية التوظيف' : 'Hiring Process'}
              </h2>
            </motion.div>

            <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-4">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                    {step.step}
                  </div>
                  <h3 className="mb-2 font-semibold">{step.title[language]}</h3>
                  <p className="text-sm text-muted-foreground">{step.description[language]}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
