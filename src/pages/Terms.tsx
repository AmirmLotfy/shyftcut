import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Calendar, Gavel, CreditCard, Shield, AlertTriangle, Scale, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { PublicPageMeta } from '@/components/seo/PublicPageMeta';
import { getSeo } from '@/data/seo-content';
import { LegalSection } from '@/components/legal/LegalSection';
import { TableOfContents } from '@/components/legal/TableOfContents';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Terms() {
  const { language } = useLanguage();
  const lastUpdated = 'January 28, 2026';
  const lastUpdatedAr = '٢٨ يناير ٢٠٢٦';

  const tocItems = [
    { id: 'acceptance', title: language === 'ar' ? 'قبول الشروط' : 'Acceptance of Terms', level: 2 },
    { id: 'description', title: language === 'ar' ? 'وصف الخدمة' : 'Description of Service', level: 2 },
    { id: 'accounts', title: language === 'ar' ? 'حسابات المستخدمين' : 'User Accounts', level: 2 },
    { id: 'payments', title: language === 'ar' ? 'الاشتراكات والمدفوعات' : 'Subscriptions and Payments', level: 2 },
    { id: 'acceptable-use', title: language === 'ar' ? 'الاستخدام المقبول' : 'Acceptable Use', level: 2 },
    { id: 'ip', title: language === 'ar' ? 'الملكية الفكرية' : 'Intellectual Property', level: 2 },
    { id: 'disclaimer', title: language === 'ar' ? 'إخلاء المسؤولية' : 'Disclaimer', level: 2 },
    { id: 'contact', title: language === 'ar' ? 'اتصل بنا' : 'Contact Us', level: 2 },
  ];

  return (
    <Layout>
      <PublicPageMeta
        title={getSeo("/terms", language).title}
        description={getSeo("/terms", language).description}
        path="/terms"
      />
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-muted/30 py-16">
          <div className="absolute inset-0 mesh-gradient opacity-20" />
          <div className="container relative mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-3xl text-start rtl:text-end"
            >
              <Button variant="ghost" asChild className="mb-6">
                <Link to="/" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
                </Link>
              </Button>
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h1 className="mb-4 text-4xl font-bold">
                {language === 'ar' ? 'شروط الخدمة' : 'Terms of Service'}
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
                  id="acceptance"
                  title={language === 'ar' ? '1. قبول الشروط' : '1. Acceptance of Terms'}
                  icon={<Gavel className="h-5 w-5" />}
                >
                  {language === 'ar' ? (
                    <p>
                      من خلال الوصول إلى Shyftcut واستخدامه، فإنك توافق على الالتزام بشروط 
                      الخدمة هذه وجميع القوانين واللوائح المعمول بها. إذا كنت لا توافق على 
                      أي من هذه الشروط، فيُحظر عليك استخدام هذه الخدمة.
                    </p>
                  ) : (
                    <p>
                      By accessing and using Shyftcut, you agree to be bound by these Terms of 
                      Service and all applicable laws and regulations. If you do not agree with 
                      any of these terms, you are prohibited from using this service.
                    </p>
                  )}
                </LegalSection>

                <LegalSection
                  id="description"
                  title={language === 'ar' ? '2. وصف الخدمة' : '2. Description of Service'}
                  icon={<FileText className="h-5 w-5" />}
                >
                  {language === 'ar' ? (
                    <>
                      <p>Shyftcut هي منصة توجيه مهني مدعومة بالذكاء الاصطناعي توفر:</p>
                      <ul>
                        <li>خرائط طريق مهنية مخصصة</li>
                        <li>توصيات دورات تعليمية</li>
                        <li>تدريب ذكاء اصطناعي</li>
                        <li>تتبع التقدم والاختبارات</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <p>Shyftcut is an AI-powered career guidance platform that provides:</p>
                      <ul>
                        <li>Personalized career roadmaps</li>
                        <li>Course recommendations</li>
                        <li>AI coaching</li>
                        <li>Progress tracking and quizzes</li>
                      </ul>
                    </>
                  )}
                </LegalSection>

                <LegalSection
                  id="accounts"
                  title={language === 'ar' ? '3. حسابات المستخدمين' : '3. User Accounts'}
                  icon={<Shield className="h-5 w-5" />}
                >
                  {language === 'ar' ? (
                    <p>
                      أنت مسؤول عن الحفاظ على سرية حسابك وكلمة المرور. أنت توافق على 
                      قبول المسؤولية عن جميع الأنشطة التي تحدث تحت حسابك.
                    </p>
                  ) : (
                    <p>
                      You are responsible for maintaining the confidentiality of your account 
                      and password. You agree to accept responsibility for all activities that 
                      occur under your account.
                    </p>
                  )}
                </LegalSection>

                <LegalSection
                  id="payments"
                  title={language === 'ar' ? '4. الاشتراكات والدفعات' : '4. Subscriptions and Payments'}
                  icon={<CreditCard className="h-5 w-5" />}
                >
                  {language === 'ar' ? (
                    <ul>
                      <li>تتم معالجة المدفوعات بشكل آمن عبر Polar.sh</li>
                      <li>يتم تجديد الاشتراكات تلقائياً ما لم يتم إلغاؤها</li>
                      <li>يمكنك إلغاء اشتراكك في أي وقت من ملفك الشخصي</li>
                      <li>جميع المبيعات نهائية (راجع <Link to="/refund" className="text-primary hover:underline">سياسة الاسترداد</Link>)</li>
                    </ul>
                  ) : (
                    <ul>
                      <li>Payments are processed securely through Polar.sh</li>
                      <li>Subscriptions auto-renew unless canceled</li>
                      <li>You may cancel your subscription at any time from your profile</li>
                      <li>All sales are final (see <Link to="/refund" className="text-primary hover:underline">Refund Policy</Link>)</li>
                    </ul>
                  )}
                </LegalSection>

                <LegalSection
                  id="acceptable-use"
                  title={language === 'ar' ? '5. الاستخدام المقبول' : '5. Acceptable Use'}
                  icon={<AlertTriangle className="h-5 w-5" />}
                >
                  {language === 'ar' ? (
                    <>
                      <p>أنت توافق على عدم:</p>
                      <ul>
                        <li>استخدام الخدمة لأي غرض غير قانوني</li>
                        <li>محاولة الوصول غير المصرح به إلى أنظمتنا</li>
                        <li>إساءة استخدام موارد الذكاء الاصطناعي</li>
                        <li>مشاركة بيانات اعتماد حسابك مع الآخرين</li>
                        <li>إعادة بيع أو إعادة توزيع محتوى الخدمة</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <p>You agree not to:</p>
                      <ul>
                        <li>Use the service for any unlawful purpose</li>
                        <li>Attempt to gain unauthorized access to our systems</li>
                        <li>Abuse AI resources</li>
                        <li>Share your account credentials with others</li>
                        <li>Resell or redistribute service content</li>
                      </ul>
                    </>
                  )}
                </LegalSection>

                <LegalSection
                  id="ip"
                  title={language === 'ar' ? '6. الملكية الفكرية' : '6. Intellectual Property'}
                  icon={<Scale className="h-5 w-5" />}
                >
                  {language === 'ar' ? (
                    <p>
                      جميع المحتويات والميزات والوظائف الموجودة على Shyftcut مملوكة لنا 
                      ومحمية بموجب قوانين الملكية الفكرية الدولية.
                    </p>
                  ) : (
                    <p>
                      All content, features, and functionality on Shyftcut are owned by us and 
                      are protected by international intellectual property laws.
                    </p>
                  )}
                </LegalSection>

                <LegalSection
                  id="disclaimer"
                  title={language === 'ar' ? '7. إخلاء المسؤولية' : '7. Disclaimer of Warranties'}
                  icon={<AlertTriangle className="h-5 w-5" />}
                >
                  {language === 'ar' ? (
                    <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
                      <p className="m-0">
                        يتم توفير Shyftcut "كما هي" دون أي ضمانات. نحن لا نضمن أن الخدمة 
                        ستكون خالية من الأخطاء أو متاحة بشكل مستمر. النصائح المهنية المقدمة 
                        من الذكاء الاصطناعي هي للإرشاد فقط وليست بديلاً عن الاستشارة المهنية.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
                      <p className="m-0">
                        Shyftcut is provided "as is" without any warranties. We do not guarantee 
                        that the service will be error-free or continuously available. Career 
                        advice provided by AI is for guidance only and is not a substitute for 
                        professional consultation.
                      </p>
                    </div>
                  )}
                </LegalSection>

                <LegalSection
                  id="contact"
                  title={language === 'ar' ? '8. اتصل بنا' : '8. Contact Us'}
                  icon={<Mail className="h-5 w-5" />}
                >
                  {language === 'ar' ? (
                    <>
                      <p>للأسئلة حول هذه الشروط:</p>
                      <div className="flex items-center gap-2 rounded-lg bg-muted p-4">
                        <Mail className="h-5 w-5 text-primary" />
                        <a href="mailto:legal@shyftcut.com" className="text-primary hover:underline">
                          legal@shyftcut.com
                        </a>
                      </div>
                    </>
                  ) : (
                    <>
                      <p>For questions about these Terms:</p>
                      <div className="flex items-center gap-2 rounded-lg bg-muted p-4">
                        <Mail className="h-5 w-5 text-primary" />
                        <a href="mailto:legal@shyftcut.com" className="text-primary hover:underline">
                          legal@shyftcut.com
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
