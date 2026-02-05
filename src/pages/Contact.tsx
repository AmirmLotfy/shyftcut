import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, MessageSquare, Send, HelpCircle, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Layout } from '@/components/layout/Layout';
import { PublicPageMeta } from '@/components/seo/PublicPageMeta';
import { getSeo } from '@/data/seo-content';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { apiPath, apiHeaders, extractApiErrorMessage } from '@/lib/api';
import { debugLog, debugError } from '@/lib/debug';
import { captureException } from '@/lib/error-tracking';
import { z } from 'zod';

const TOPIC_VALUES = ['general', 'sales', 'support', 'partnership', 'feedback', 'other'] as const;
type TopicValue = (typeof TOPIC_VALUES)[number];

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().trim().email('Invalid email address').max(255, 'Email is too long'),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  company: z.string().trim().max(150).optional().or(z.literal('')),
  topic: z.enum(TOPIC_VALUES),
  subject: z.string().trim().min(1, 'Subject is required').max(200, 'Subject is too long'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(2000, 'Message is too long'),
});

export default function Contact() {
  const { language, t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    topic: 'general' as TopicValue,
    subject: '',
    message: '',
  });

  const faqs = [
    {
      question: { en: 'How does the AI roadmap work?', ar: 'كيف تعمل خارطة الطريق بالذكاء الاصطناعي؟' },
      answer: {
        en: 'Our AI analyzes your current skills, career goals, and learning preferences to create a personalized 12-week learning path with verified courses from top platforms.',
        ar: 'يحلل ذكاؤنا الاصطناعي مهاراتك الحالية وأهدافك المهنية لإنشاء مسار تعلم مخصص لمدة 12 أسبوعاً مع دورات موثقة من أفضل المنصات.',
      },
    },
    {
      question: { en: 'Can I cancel my subscription anytime?', ar: 'هل يمكنني إلغاء اشتراكي في أي وقت؟' },
      answer: {
        en: "Yes! You can cancel your subscription at any time from your profile. Your access continues until the end of your billing period.",
        ar: 'نعم! يمكنك إلغاء اشتراكك في أي وقت من ملفك الشخصي. يستمر وصولك حتى نهاية فترة الفوترة.',
      },
    },
    {
      question: { en: 'Is there a free trial?', ar: 'ما مدى دقة توصيات الدورات؟' },
      answer: {
        en: 'We offer a free tier that lets you generate one roadmap and access limited features. Upgrade anytime to unlock unlimited roadmaps and AI coaching.',
        ar: 'نقدم مستوى مجانياً يتيح لك إنشاء خارطة واحدة. قم بالترقية في أي وقت لفتح خرائط وتدريب غير محدود.',
      },
    },
    {
      question: { en: 'How accurate are the course recommendations?', ar: 'ما مدى دقة توصيات الدورات؟' },
      answer: {
        en: 'Our recommendations are based on real-time data from major learning platforms, including ratings, reviews, and relevance to your specific goals.',
        ar: 'تعتمد توصياتنا على بيانات الوقت الفعلي من منصات التعلم الكبرى، بما في ذلك التقييمات والمراجعات والصلة بأهدافك المحددة.',
      },
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      phone: formData.phone || undefined,
      company: formData.company || undefined,
    };
    const result = contactSchema.safeParse(payload);
    if (!result.success) {
      toast({
        title: language === 'ar' ? 'خطأ في التحقق' : 'Validation Error',
        description: result.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(apiPath('/api/contact'), {
        method: 'POST',
        headers: apiHeaders('/api/contact', null),
        body: JSON.stringify(result.data),
      });
      const raw = await res.text();
      let data: Record<string, unknown> = {};
      try {
        if (raw.trim()) data = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        debugLog('Contact', 'contact API non-JSON response', res.status, raw?.slice(0, 200));
      }
      if (!res.ok) {
        const msg = extractApiErrorMessage(data, res.statusText);
        debugLog('Contact', 'contact API error', res.status, msg);
        toast({
          title: t('common.errorTitle'),
          description: msg,
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: language === 'ar' ? 'تم إرسال الرسالة!' : 'Message Sent!',
        description: language === 'ar'
          ? 'شكراً لتواصلك. سنرد عليك قريباً.'
          : "Thanks for reaching out. We'll get back to you soon.",
      });
      setFormData({ name: '', email: '', phone: '', company: '', topic: 'general', subject: '', message: '' });
    } catch (err) {
      debugError('Contact', 'contact submit failed', err);
      captureException(err);
      toast({
        title: t('common.errorTitle'),
        description: language === 'ar' ? 'حدث خطأ ما. يرجى المحاولة مرة أخرى.' : 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <PublicPageMeta
        title={getSeo("/contact", language).title}
        description={getSeo("/contact", language).description}
        path="/contact"
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
                <MessageSquare className="h-10 w-10 text-white" />
              </div>
              <h1 className="mb-6 text-4xl font-bold md:text-5xl">
                {language === 'ar' ? 'تواصل معنا' : 'Get in Touch'}
              </h1>
              <p className="text-xl text-muted-foreground">
                {language === 'ar'
                  ? 'لديك سؤال أو ملاحظات؟ نحب أن نسمع منك. فريقنا جاهز لمساعدتك.'
                  : "Have a question or feedback? We'd love to hear from you. Our team is ready to help."}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Options */}
        <section className="border-y border-border bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <div className="grid gap-6 md:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Card className="public-glass-card h-full">
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <Mail className="mb-4 h-8 w-8 text-primary" />
                    <h3 className="mb-2 font-semibold">
                      {language === 'ar' ? 'راسلنا' : 'Email Us'}
                    </h3>
                    <a href="mailto:support@shyftcut.com" className="text-sm text-muted-foreground hover:text-primary">
                      support@shyftcut.com
                    </a>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <Card className="public-glass-card h-full">
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <Clock className="mb-4 h-8 w-8 text-primary" />
                    <h3 className="mb-2 font-semibold">
                      {language === 'ar' ? 'وقت الاستجابة' : 'Response Time'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'عادة خلال 24 ساعة' : 'Usually within 24 hours'}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <Card className="public-glass-card h-full">
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <MapPin className="mb-4 h-8 w-8 text-primary" />
                    <h3 className="mb-2 font-semibold">
                      {language === 'ar' ? 'الموقع' : 'Location'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'فريق عن بُعد، عالمي' : 'Remote team, Global'}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Contact Form & FAQ */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid gap-12 lg:grid-cols-2">
              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="mb-6 text-2xl font-bold">
                  {language === 'ar' ? 'أرسل لنا رسالة' : 'Send Us a Message'}
                </h2>
                <form data-testid="contact-form" onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name">{language === 'ar' ? 'الاسم' : 'Name'}</Label>
                      <Input
                        id="contact-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={language === 'ar' ? 'الاسم الكامل' : 'Full name'}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder={language === 'ar' ? 'بريدك الإلكتروني' : 'you@example.com'}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-phone">{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</Label>
                      <Input
                        id="contact-phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder={language === 'ar' ? 'اختياري' : 'Optional'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-company">{language === 'ar' ? 'الشركة / المؤسسة' : 'Company'}</Label>
                      <Input
                        id="contact-company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder={language === 'ar' ? 'اختياري' : 'Optional'}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-topic">{language === 'ar' ? 'الموضوع' : 'Topic'}</Label>
                    <Select
                      value={formData.topic}
                      onValueChange={(v) => setFormData({ ...formData, topic: v as TopicValue })}
                    >
                      <SelectTrigger id="contact-topic">
                        <SelectValue placeholder={language === 'ar' ? 'اختر' : 'Select'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">{language === 'ar' ? 'عام' : 'General inquiry'}</SelectItem>
                        <SelectItem value="sales">{language === 'ar' ? 'مبيعات' : 'Sales / plans'}</SelectItem>
                        <SelectItem value="support">{language === 'ar' ? 'دعم فني' : 'Technical support'}</SelectItem>
                        <SelectItem value="partnership">{language === 'ar' ? 'شراكة' : 'Partnership'}</SelectItem>
                        <SelectItem value="feedback">{language === 'ar' ? 'ملاحظات/اقتراحات' : 'Feedback'}</SelectItem>
                        <SelectItem value="other">{language === 'ar' ? 'أخرى' : 'Other'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-subject">{language === 'ar' ? 'الموضوع' : 'Subject'}</Label>
                    <Input
                      id="contact-subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder={language === 'ar' ? 'موضوع مختصر' : 'Brief summary of your message'}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-message">{language === 'ar' ? 'الرسالة' : 'Message'}</Label>
                    <Textarea
                      id="contact-message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder={language === 'ar' ? 'صف مشكلتك أو سؤالك (10 أحرف كحد أدنى)...' : 'Write your message here...'}
                      rows={5}
                      required
                    />
                  </div>
                  <Button type="submit" data-testid="contact-submit" className="w-full btn-glow" disabled={isSubmitting}>
                    {isSubmitting ? (
                      language === 'ar' ? 'جاري الإرسال...' : 'Sending...'
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4 rtl:mr-0 rtl:ml-2" />
                        {language === 'ar' ? 'إرسال الرسالة' : 'Send Message'}
                      </>
                    )}
                  </Button>
                </form>
              </motion.div>

              {/* FAQ */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-2 mb-6">
                  <HelpCircle className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">
                    {language === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
                  </h2>
                </div>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-start">
                        {faq.question[language]}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer[language]}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
