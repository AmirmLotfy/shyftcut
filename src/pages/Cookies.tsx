import { motion } from 'framer-motion';
import { ArrowLeft, Cookie, Calendar, Settings, BarChart3, Shield, Mail, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { PublicPageMeta } from '@/components/seo/PublicPageMeta';
import { getSeo } from '@/data/seo-content';
import { LegalSection } from '@/components/legal/LegalSection';
import { TableOfContents } from '@/components/legal/TableOfContents';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Cookies() {
  const { language } = useLanguage();
  const lastUpdated = 'January 28, 2026';
  const lastUpdatedAr = '٢٨ يناير ٢٠٢٦';

  const tocItems = [
    { id: 'what-are', title: language === 'ar' ? 'ما هي ملفات تعريف الارتباط؟' : 'What Are Cookies?', level: 2 },
    { id: 'types', title: language === 'ar' ? 'أنواع ملفات تعريف الارتباط' : 'Types of Cookies', level: 2 },
    { id: 'third-party', title: language === 'ar' ? 'ملفات تعريف الارتباط للطرف الثالث' : 'Third-Party Cookies', level: 2 },
    { id: 'managing', title: language === 'ar' ? 'إدارة ملفات تعريف الارتباط' : 'Managing Cookies', level: 2 },
    { id: 'contact', title: language === 'ar' ? 'اتصل بنا' : 'Contact Us', level: 2 },
  ];

  const cookieTypes = [
    {
      name: 'sb-auth-token',
      purpose: { en: 'Authentication and session', ar: 'المصادقة والجلسة' },
      duration: { en: 'Session', ar: 'الجلسة' },
      type: 'essential',
    },
    {
      name: 'shyftcut-language',
      purpose: { en: 'Language preference', ar: 'تفضيل اللغة' },
      duration: { en: '1 year', ar: 'سنة واحدة' },
      type: 'functional',
    },
    {
      name: 'theme',
      purpose: { en: 'Dark/light mode preference', ar: 'تفضيل الوضع المظلم/الفاتح' },
      duration: { en: '1 year', ar: 'سنة واحدة' },
      type: 'functional',
    },
    {
      name: 'shyftcut-cookie-consent',
      purpose: { en: 'Cookie consent preference', ar: 'تفضيل الموافقة على الكوكيز' },
      duration: { en: '1 year', ar: 'سنة واحدة' },
      type: 'essential',
    },
  ];

  const getTypeBadge = (type: string) => {
    const styles = {
      essential: 'bg-success/10 text-success border-success/20',
      functional: 'bg-primary/10 text-primary border-primary/20',
      analytics: 'bg-warning/10 text-warning border-warning/20',
    };
    const labels = {
      essential: { en: 'Essential', ar: 'ضروري' },
      functional: { en: 'Functional', ar: 'وظيفي' },
      analytics: { en: 'Analytics', ar: 'تحليلي' },
    };
    return (
      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${styles[type as keyof typeof styles]}`}>
        {labels[type as keyof typeof labels][language]}
      </span>
    );
  };

  return (
    <Layout>
      <PublicPageMeta
        title={getSeo("/cookies", language).title}
        description={getSeo("/cookies", language).description}
        path="/cookies"
      />
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-muted/30 py-16">
          <div className="absolute inset-0 mesh-gradient opacity-20" />
          <div className="container relative mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-3xl text-center"
            >
              <Button variant="ghost" asChild className="mb-6">
                <Link to="/" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
                </Link>
              </Button>
              
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                <Cookie className="h-8 w-8 text-accent" />
              </div>
              
              <h1 className="mb-4 text-4xl font-bold">
                {language === 'ar' ? 'سياسة ملفات تعريف الارتباط' : 'Cookie Policy'}
              </h1>
              
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {language === 'ar' ? `آخر تحديث: ${lastUpdatedAr}` : `Last Updated: ${lastUpdated}`}
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid gap-12 lg:grid-cols-[1fr_280px]">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <LegalSection
                  id="what-are"
                  title={language === 'ar' ? 'ما هي ملفات تعريف الارتباط؟' : 'What Are Cookies?'}
                  icon={<Cookie className="h-5 w-5" />}
                >
                  {language === 'ar' ? (
                    <p>
                      ملفات تعريف الارتباط هي ملفات نصية صغيرة يتم تخزينها على جهازك عند 
                      زيارة موقع ويب. تساعدنا على تذكر تفضيلاتك وتحسين تجربتك.
                    </p>
                  ) : (
                    <p>
                      Cookies are small text files stored on your device when you visit a website. 
                      They help us remember your preferences and improve your experience.
                    </p>
                  )}
                </LegalSection>

                <LegalSection
                  id="types"
                  title={language === 'ar' ? 'أنواع ملفات تعريف الارتباط التي نستخدمها' : 'Types of Cookies We Use'}
                  icon={<Settings className="h-5 w-5" />}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className={`pb-3 ${language === 'ar' ? 'text-right' : 'text-left'} font-semibold`}>
                            {language === 'ar' ? 'الاسم' : 'Name'}
                          </th>
                          <th className={`pb-3 ${language === 'ar' ? 'text-right' : 'text-left'} font-semibold`}>
                            {language === 'ar' ? 'الغرض' : 'Purpose'}
                          </th>
                          <th className={`pb-3 ${language === 'ar' ? 'text-right' : 'text-left'} font-semibold`}>
                            {language === 'ar' ? 'المدة' : 'Duration'}
                          </th>
                          <th className={`pb-3 ${language === 'ar' ? 'text-right' : 'text-left'} font-semibold`}>
                            {language === 'ar' ? 'النوع' : 'Type'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {cookieTypes.map((cookie) => (
                          <tr key={cookie.name}>
                            <td className="py-3 font-mono text-xs">{cookie.name}</td>
                            <td className="py-3 text-muted-foreground">{cookie.purpose[language]}</td>
                            <td className="py-3 text-muted-foreground">{cookie.duration[language]}</td>
                            <td className="py-3">{getTypeBadge(cookie.type)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="flex items-start gap-3 rounded-lg bg-success/5 p-4 border border-success/20">
                      <Shield className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                      <div>
                        <h4 className="font-semibold text-success">
                          {language === 'ar' ? 'ملفات تعريف الارتباط الضرورية' : 'Essential Cookies'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {language === 'ar' 
                            ? 'مطلوبة لكي يعمل الموقع. لا يمكن تعطيلها.'
                            : 'Required for the site to function. Cannot be disabled.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg bg-primary/5 p-4 border border-primary/20">
                      <Settings className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <h4 className="font-semibold text-primary">
                          {language === 'ar' ? 'ملفات تعريف الارتباط الوظيفية' : 'Functional Cookies'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {language === 'ar' 
                            ? 'تتذكر تفضيلاتك مثل اللغة والمظهر.'
                            : 'Remember your preferences like language and theme.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg bg-warning/5 p-4 border border-warning/20">
                      <BarChart3 className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                      <div>
                        <h4 className="font-semibold text-warning">
                          {language === 'ar' ? 'ملفات تعريف الارتباط التحليلية' : 'Analytics Cookies'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {language === 'ar' 
                            ? 'تساعدنا في فهم كيفية استخدام الزوار للموقع.'
                            : 'Help us understand how visitors use the site.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </LegalSection>

                <LegalSection
                  id="third-party"
                  title={language === 'ar' ? 'ملفات تعريف الارتباط للطرف الثالث' : 'Third-Party Cookies'}
                  icon={<Globe className="h-5 w-5" />}
                >
                  {language === 'ar' ? (
                    <>
                      <p>نستخدم خدمات الأطراف الثالثة التالية:</p>
                      <ul>
                        <li><strong>Polar.sh:</strong> معالجة الدفع</li>
                        <li><strong>مزودو الذكاء الاصطناعي:</strong> وظائف التدريب</li>
                      </ul>
                      <p>
                        قد تحدد هذه الخدمات ملفات تعريف الارتباط الخاصة بها. يرجى مراجعة 
                        سياسات الخصوصية الخاصة بها للحصول على المزيد من المعلومات.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>We use the following third-party services:</p>
                      <ul>
                        <li><strong>Polar.sh:</strong> Payment processing</li>
                        <li><strong>AI Providers:</strong> Coaching functionality</li>
                      </ul>
                      <p>
                        These services may set their own cookies. Please review their privacy 
                        policies for more information.
                      </p>
                    </>
                  )}
                </LegalSection>

                <LegalSection
                  id="managing"
                  title={language === 'ar' ? 'إدارة ملفات تعريف الارتباط' : 'Managing Cookies'}
                  icon={<Settings className="h-5 w-5" />}
                >
                  {language === 'ar' ? (
                    <>
                      <p>
                        تقبل معظم متصفحات الويب ملفات تعريف الارتباط تلقائياً، ولكن يمكنك 
                        تعديل إعدادات متصفحك لرفضها. ومع ذلك، قد يؤثر ذلك على قدرتك على 
                        استخدام بعض ميزات خدمتنا.
                      </p>
                      <p>لإدارة ملفات تعريف الارتباط:</p>
                      <ul>
                        <li><strong>Chrome:</strong> الإعدادات {'>'} الخصوصية والأمان {'>'} ملفات تعريف الارتباط</li>
                        <li><strong>Firefox:</strong> الخيارات {'>'} الخصوصية والأمان {'>'} ملفات تعريف الارتباط</li>
                        <li><strong>Safari:</strong> التفضيلات {'>'} الخصوصية {'>'} إدارة بيانات الموقع</li>
                        <li><strong>Edge:</strong> الإعدادات {'>'} ملفات تعريف الارتباط وأذونات الموقع</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <p>
                        Most web browsers automatically accept cookies, but you can modify your 
                        browser settings to decline them. However, this may affect your ability 
                        to use some features of our service.
                      </p>
                      <p>To manage cookies:</p>
                      <ul>
                        <li><strong>Chrome:</strong> Settings {'>'} Privacy and Security {'>'} Cookies</li>
                        <li><strong>Firefox:</strong> Options {'>'} Privacy & Security {'>'} Cookies</li>
                        <li><strong>Safari:</strong> Preferences {'>'} Privacy {'>'} Manage Website Data</li>
                        <li><strong>Edge:</strong> Settings {'>'} Cookies and Site Permissions</li>
                      </ul>
                    </>
                  )}
                </LegalSection>

                <LegalSection
                  id="contact"
                  title={language === 'ar' ? 'اتصل بنا' : 'Contact Us'}
                  icon={<Mail className="h-5 w-5" />}
                >
                  {language === 'ar' ? (
                    <>
                      <p>إذا كانت لديك أسئلة حول استخدامنا لملفات تعريف الارتباط:</p>
                      <div className="flex items-center gap-2 rounded-lg bg-muted p-4">
                        <Mail className="h-5 w-5 text-primary" />
                        <a href="mailto:privacy@shyftcut.com" className="text-primary hover:underline">
                          privacy@shyftcut.com
                        </a>
                      </div>
                    </>
                  ) : (
                    <>
                      <p>If you have questions about our use of cookies:</p>
                      <div className="flex items-center gap-2 rounded-lg bg-muted p-4">
                        <Mail className="h-5 w-5 text-primary" />
                        <a href="mailto:privacy@shyftcut.com" className="text-primary hover:underline">
                          privacy@shyftcut.com
                        </a>
                      </div>
                    </>
                  )}
                </LegalSection>
              </motion.div>

              <aside className="hidden lg:block">
                <TableOfContents items={tocItems} />
              </aside>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
