import { motion } from 'framer-motion';
import { XCircle, Mail, AlertTriangle, HelpCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { LegalPageHero } from '@/components/legal/LegalPageHero';
import { PublicPageMeta } from '@/components/seo/PublicPageMeta';
import { getSeo } from '@/data/seo-content';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Refund() {
  const { language } = useLanguage();
  const lastUpdated = 'January 28, 2026';
  const lastUpdatedAr = '٢٨ يناير ٢٠٢٦';

  const exceptions = [
    {
      icon: AlertTriangle,
      title: { en: 'Duplicate Charges', ar: 'رسوم مكررة' },
      description: { en: 'Due to technical errors only', ar: 'بسبب أخطاء تقنية فقط' },
    },
    {
      icon: HelpCircle,
      title: { en: 'Unauthorized Transactions', ar: 'معاملات غير مصرح بها' },
      description: { en: 'With proper verification', ar: 'مع التحقق المناسب' },
    },
  ];

  return (
    <Layout>
      <PublicPageMeta
        title={getSeo("/refund", language).title}
        description={getSeo("/refund", language).description}
        path="/refund"
      />
      <div className="min-h-screen bg-background">
        <LegalPageHero
          title={language === 'ar' ? 'سياسة الاسترداد' : 'Refund Policy'}
          icon={XCircle}
          lastUpdatedEn={lastUpdated}
          lastUpdatedAr={lastUpdatedAr}
          variant="destructive"
        />

        {/* Single content block — all policy content in one scroll */}
        <section className="py-10 md:py-14">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mx-auto max-w-2xl space-y-10 text-start rtl:text-end"
            >
              {/* Main policy */}
              <div className="rounded-2xl border-2 border-destructive/30 bg-gradient-to-br from-destructive/10 to-destructive/5 p-6 md:p-8">
                <h2 className="mb-3 text-xl font-bold text-destructive md:text-2xl">
                  {language === 'ar' ? 'جميع المبيعات نهائية' : 'All Sales Are Final'}
                </h2>
                <p className="text-muted-foreground">
                  {language === 'ar'
                    ? 'نظراً للطبيعة الرقمية لخدماتنا، لا نقدم استردادات لأي اشتراكات أو مشتريات. بمجرد معالجة الدفع، يكون البيع نهائياً.'
                    : 'Due to the digital nature of our services, we do not offer refunds for any subscriptions or purchases. Once payment is processed, the sale is final.'}
                </p>
              </div>

              {/* Why no refunds + what you get */}
              <div>
                <h2 className="mb-3 text-xl font-bold md:text-2xl">
                  {language === 'ar' ? 'لماذا لا نقدم استرداداً؟' : 'Why We Don\'t Offer Refunds'}
                </h2>
                <p className="mb-4 text-muted-foreground">
                  {language === 'ar'
                    ? 'Shyftcut خدمة رقمية توفر وصولاً فورياً إلى خرائط طريق بالذكاء الاصطناعي، دورات موثقة، مدرب ذكي، وتتبع التقدم. لا يمكن "إرجاع" هذه الخدمات بعد الاشتراك.'
                    : 'Shyftcut is a digital service that gives you immediate access to AI roadmaps, verified courses, AI coaching, and progress tracking. These cannot be "returned" after subscription.'}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { icon: '🎯', text: language === 'ar' ? 'خرائط طريق مهنية بالذكاء الاصطناعي' : 'AI career roadmaps' },
                    { icon: '📚', text: language === 'ar' ? 'توصيات دورات منتقاة' : 'Curated course recommendations' },
                    { icon: '🤖', text: language === 'ar' ? 'تدريب ذكي 24/7' : '24/7 AI coaching' },
                    { icon: '📊', text: language === 'ar' ? 'تتبع التقدم والاختبارات' : 'Progress tracking and quizzes' },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-sm">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Before you subscribe */}
              <div>
                <h2 className="mb-3 text-xl font-bold md:text-2xl">
                  {language === 'ar' ? 'قبل الاشتراك' : 'Before You Subscribe'}
                </h2>
                <p className="mb-4 text-muted-foreground">
                  {language === 'ar' ? 'نشجعك على:' : 'We encourage you to:'}
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="font-medium text-foreground">1.</span>
                    {language === 'ar' ? 'استكشاف المستوى المجاني لفهم المنصة' : 'Explore the free tier to understand the platform'}
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium text-foreground">2.</span>
                    {language === 'ar' ? 'مراجعة صفحة الأسعار بعناية' : 'Review our pricing page carefully'}
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium text-foreground">3.</span>
                    {language === 'ar' ? 'التواصل معنا إذا كان لديك أي أسئلة' : 'Contact us if you have any questions'}
                  </li>
                </ul>
              </div>

              {/* Exceptions */}
              <div>
                <h2 className="mb-3 text-xl font-bold md:text-2xl">
                  {language === 'ar' ? 'استثناءات' : 'Exceptions'}
                </h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  {language === 'ar'
                    ? 'في حالات نادرة قد نعتبر استثناءات (مثل رسوم مكررة أو معاملات غير مصرح بها). المراجعة فردية وفق تقديرنا.'
                    : 'In rare cases we may consider exceptions (e.g. duplicate charges or unauthorized transactions). Review is individual and at our discretion.'}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {exceptions.map((item, index) => (
                    <Card key={index} className="public-glass-card">
                      <CardContent className="flex items-start gap-3 p-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning/10">
                          <item.icon className="h-4 w-4 text-warning" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{item.title[language]}</h3>
                          <p className="text-xs text-muted-foreground">{item.description[language]}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Cancellation */}
              <div className="flex items-start gap-4 rounded-xl border border-primary/20 bg-primary/5 p-5">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h3 className="mb-1 font-semibold">
                    {language === 'ar' ? 'الإلغاء' : 'Cancellation'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar'
                      ? 'يمكنك إلغاء اشتراكك في أي وقت. وصولك يبقى نشطاً حتى نهاية فترة الفوترة، ولا نصدّر استرداداً للفترة غير المستخدمة.'
                      : 'You may cancel anytime. Your access remains active until the end of the current billing period; no refund is issued for the unused portion.'}
                  </p>
                </div>
              </div>

              {/* Contact */}
              <div className="pt-2">
                <h2 className="mb-3 text-xl font-bold md:text-2xl">
                  {language === 'ar' ? 'اتصل بنا' : 'Contact Us'}
                </h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  {language === 'ar'
                    ? 'أسئلة حول سياسة الاسترداد أو مشاكل في حسابك:'
                    : 'Questions about this policy or account issues:'}
                </p>
                <a
                  href="mailto:support@shyftcut.com"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-muted"
                >
                  <Mail className="h-4 w-4" />
                  support@shyftcut.com
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
