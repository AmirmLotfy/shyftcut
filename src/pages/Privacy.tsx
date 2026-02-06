import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Mail, ChevronDown, Database, Share2, Lock, User, Globe, Cookie, Bell, FileText } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { PublicPageMeta } from '@/components/seo/PublicPageMeta';
import { getSeo } from '@/data/seo-content';
import { LegalSection } from '@/components/legal/LegalSection';
import { LegalPageHero } from '@/components/legal/LegalPageHero';
import { TableOfContents } from '@/components/legal/TableOfContents';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Privacy() {
  const { language } = useLanguage();
  const lastUpdated = 'January 28, 2026';
  const lastUpdatedAr = '٢٨ يناير ٢٠٢٦';

  const tocItems = [
    { id: 'info-collect', title: language === 'ar' ? 'المعلومات التي نجمعها' : 'Information We Collect', level: 2 },
    { id: 'how-use', title: language === 'ar' ? 'كيف نستخدم معلوماتك' : 'How We Use Your Information', level: 2 },
    { id: 'data-sharing', title: language === 'ar' ? 'مشاركة البيانات' : 'Data Sharing', level: 2 },
    { id: 'data-security', title: language === 'ar' ? 'أمان البيانات' : 'Data Security', level: 2 },
    { id: 'your-rights', title: language === 'ar' ? 'حقوقك' : 'Your Rights', level: 2 },
    { id: 'cookies', title: language === 'ar' ? 'ملفات تعريف الارتباط' : 'Cookies', level: 2 },
    { id: 'retention', title: language === 'ar' ? 'الاحتفاظ بالبيانات' : 'Data Retention', level: 2 },
    { id: 'contact', title: language === 'ar' ? 'اتصل بنا' : 'Contact Us', level: 2 },
  ];

  return (
    <Layout>
      <PublicPageMeta
        title={getSeo("/privacy", language).title}
        description={getSeo("/privacy", language).description}
        path="/privacy"
      />
      <div className="min-h-screen bg-background">
        <LegalPageHero
          title={language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
          icon={Shield}
          lastUpdatedEn={lastUpdated}
          lastUpdatedAr={lastUpdatedAr}
        />

        {/* Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid gap-12 lg:grid-cols-[1fr_280px]">
              {/* Main Content */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                {/* Key Points */}
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-6">
                  <h3 className="mb-3 font-semibold text-primary">
                    {language === 'ar' ? 'النقاط الرئيسية' : 'Key Points'}
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Database className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{language === 'ar' ? 'نجمع فقط ما نحتاجه لتقديم خدماتنا' : 'We only collect what we need to provide our services'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{language === 'ar' ? 'بياناتك مشفرة ومحمية' : 'Your data is encrypted and protected'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Share2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{language === 'ar' ? 'لا نبيع بياناتك أبداً' : 'We never sell your data'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <User className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{language === 'ar' ? 'يمكنك الوصول لبياناتك أو حذفها في أي وقت' : 'You can access or delete your data anytime'}</span>
                    </li>
                  </ul>
                </div>

                <LegalSection
                  id="info-collect"
                  title={language === 'ar' ? '1. المعلومات التي نجمعها' : '1. Information We Collect'}
                  icon={<Database className="h-5 w-5" />}
                >
                  {language === 'ar' ? (
                    <>
                      <h4 className="font-semibold">المعلومات الشخصية</h4>
                      <p>عند إنشاء حساب، نجمع:</p>
                      <ul>
                        <li>عنوان البريد الإلكتروني</li>
                        <li>الاسم (اختياري)</li>
                        <li>صورة الملف الشخصي (اختياري)</li>
                        <li>المسمى الوظيفي ومعلومات المهنة</li>
                        <li>تفضيلات التعلم</li>
                      </ul>
                      <h4 className="font-semibold mt-4">بيانات الاستخدام</h4>
                      <p>نجمع تلقائياً:</p>
                      <ul>
                        <li>تقدم التعلم ونتائج الاختبارات</li>
                        <li>سجل المحادثات مع مدرب الذكاء الاصطناعي</li>
                        <li>أنماط الاستخدام والتفضيلات</li>
                        <li>معلومات الجهاز والمتصفح</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <h4 className="font-semibold">Personal Information</h4>
                      <p>When you create an account, we collect:</p>
                      <ul>
                        <li>Email address</li>
                        <li>Name (optional)</li>
                        <li>Profile picture (optional)</li>
                        <li>Job title and career information</li>
                        <li>Learning preferences</li>
                      </ul>
                      <h4 className="font-semibold mt-4">Usage Data</h4>
                      <p>We automatically collect:</p>
                      <ul>
                        <li>Learning progress and quiz results</li>
                        <li>Chat history with AI coach</li>
                        <li>Usage patterns and preferences</li>
                        <li>Device and browser information</li>
                      </ul>
                    </>
                  )}
                </LegalSection>

                <LegalSection
                  id="how-use"
                  title={language === 'ar' ? '2. كيف نستخدم معلوماتك' : '2. How We Use Your Information'}
                  icon={<FileText className="h-5 w-5" />}
                >
                  {language === 'ar' ? (
                    <>
                      <p>نستخدم بياناتك لـ:</p>
                      <ul>
                        <li>إنشاء خرائط طريق مهنية مخصصة</li>
                        <li>تقديم توصيات دورات ذات صلة</li>
                        <li>تشغيل تجارب التدريب بالذكاء الاصطناعي</li>
                        <li>تتبع تقدمك وتقديم رؤى</li>
                        <li>معالجة المدفوعات والاشتراكات</li>
                        <li>إرسال تحديثات مهمة للخدمة</li>
                        <li>تحسين خدماتنا</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <p>We use your data to:</p>
                      <ul>
                        <li>Generate personalized career roadmaps</li>
                        <li>Provide relevant course recommendations</li>
                        <li>Power AI coaching experiences</li>
                        <li>Track your progress and provide insights</li>
                        <li>Process payments and subscriptions</li>
                        <li>Send important service updates</li>
                        <li>Improve our services</li>
                      </ul>
                    </>
                  )}
                </LegalSection>

                <LegalSection
                  id="data-sharing"
                  title={language === 'ar' ? '3. مشاركة البيانات' : '3. Data Sharing'}
                  icon={<Share2 className="h-5 w-5" />}
                >
                  {language === 'ar' ? (
                    <>
                      <p>نشارك بياناتك مع:</p>
                      <ul>
                        <li><strong>مزودو خدمات الذكاء الاصطناعي:</strong> لتشغيل ميزات التدريب (بيانات مجهولة الهوية)</li>
                        <li><strong>Polar.sh:</strong> لمعالجة المدفوعات</li>
                        <li><strong>مزودو التحليلات:</strong> لفهم أنماط الاستخدام</li>
                      </ul>
                      <div className="mt-4 rounded-lg bg-success/10 p-4 border border-success/20">
                        <p className="m-0 text-success font-medium">نحن لا نبيع بياناتك الشخصية أبداً لأطراف ثالثة.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p>We share your data with:</p>
                      <ul>
                        <li><strong>AI Service Providers:</strong> To power coaching features (anonymized data)</li>
                        <li><strong>Polar.sh:</strong> For payment processing</li>
                        <li><strong>Analytics Providers:</strong> To understand usage patterns</li>
                      </ul>
                      <div className="mt-4 rounded-lg bg-success/10 p-4 border border-success/20">
                        <p className="m-0 text-success font-medium">We never sell your personal data to third parties.</p>
                      </div>
                    </>
                  )}
                </LegalSection>

                <LegalSection
                  id="data-security"
                  title={language === 'ar' ? '4. أمن البيانات' : '4. Data Security'}
                  icon={<Lock className="h-5 w-5" />}
                >
                  {language === 'ar' ? (
                    <>
                      <p>نحمي بياناتك من خلال:</p>
                      <ul>
                        <li>تشفير البيانات أثناء النقل والتخزين</li>
                        <li>المصادقة الآمنة وإدارة الجلسات</li>
                        <li>عمليات تدقيق أمنية منتظمة</li>
                        <li>ضوابط وصول للموظفين</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <p>We protect your data through:</p>
                      <ul>
                        <li>Encryption in transit and at rest</li>
                        <li>Secure authentication and session management</li>
                        <li>Regular security audits</li>
                        <li>Employee access controls</li>
                      </ul>
                    </>
                  )}
                </LegalSection>

                <LegalSection
                  id="your-rights"
                  title={language === 'ar' ? '5. حقوقك' : '5. Your Rights'}
                  icon={<User className="h-5 w-5" />}
                >
                  {language === 'ar' ? (
                    <>
                      <p>لديك الحق في:</p>
                      <ul>
                        <li>الوصول إلى بياناتك الشخصية</li>
                        <li>تصحيح البيانات غير الدقيقة</li>
                        <li>حذف حسابك وبياناتك</li>
                        <li>تصدير بياناتك</li>
                        <li>إلغاء الاشتراك في الاتصالات التسويقية</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <p>You have the right to:</p>
                      <ul>
                        <li>Access your personal data</li>
                        <li>Correct inaccurate data</li>
                        <li>Delete your account and data</li>
                        <li>Export your data</li>
                        <li>Opt out of marketing communications</li>
                      </ul>
                    </>
                  )}
                </LegalSection>

                <LegalSection
                  id="cookies"
                  title={language === 'ar' ? '6. ملفات تعريف الارتباط (Cookies)' : '6. Cookies'}
                  icon={<Cookie className="h-5 w-5" />}
                >
                  {language === 'ar' ? (
                    <p>
                      نستخدم ملفات تعريف الارتباط للمصادقة وتفضيلات المستخدم والتحليلات. 
                      راجع <Link to="/cookies" className="text-primary hover:underline">سياسة ملفات تعريف الارتباط</Link> للتفاصيل.
                    </p>
                  ) : (
                    <p>
                      We use cookies for authentication, user preferences, and analytics. 
                      See our <Link to="/cookies" className="text-primary hover:underline">Cookie Policy</Link> for details.
                    </p>
                  )}
                </LegalSection>

                <LegalSection
                  id="retention"
                  title={language === 'ar' ? '7. الاحتفاظ بالبيانات' : '7. Data Retention'}
                  icon={<Bell className="h-5 w-5" />}
                >
                  {language === 'ar' ? (
                    <p>
                      نحتفظ ببياناتك طالما أن حسابك نشط. عند حذف حسابك، نحذف بياناتك 
                      الشخصية خلال 30 يوماً، باستثناء ما هو مطلوب قانونياً للاحتفاظ به.
                    </p>
                  ) : (
                    <p>
                      We retain your data as long as your account is active. Upon account 
                      deletion, we delete your personal data within 30 days, except as 
                      required by law.
                    </p>
                  )}
                </LegalSection>

                <LegalSection
                  id="contact"
                  title={language === 'ar' ? '8. اتصل بنا' : '8. Contact Us'}
                  icon={<Mail className="h-5 w-5" />}
                >
                  {language === 'ar' ? (
                    <>
                      <p>للأسئلة المتعلقة بالخصوصية:</p>
                      <div className="flex items-center gap-2 rounded-lg bg-muted p-4">
                        <Mail className="h-5 w-5 text-primary" />
                        <a href="mailto:privacy@shyftcut.com" className="text-primary hover:underline">
                          privacy@shyftcut.com
                        </a>
                      </div>
                    </>
                  ) : (
                    <>
                      <p>For privacy-related questions:</p>
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

              {/* Sidebar TOC */}
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
