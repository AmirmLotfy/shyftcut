/**
 * Centralized SEO copy per route.
 * Title: ~55–60 chars; primary keyword near start; unique per page.
 * Description: ~120–156 chars; user intent, active voice, CTA where appropriate.
 */

export interface SeoEntry {
  /** Page title (~55–60 chars). */
  title: string;
  /** Meta description (~120–156 chars). */
  description: string;
}

export const seoByPath: Record<string, SeoEntry> = {
  "/": {
    title: "Your Career Roadmap in 90 Seconds | Shyftcut",
    description:
      "AI-powered career guidance that transforms confusion into a clear 12-week path. Get personalized roadmaps, verified courses, and 24/7 AI coaching.",
  },
  "/pricing": {
    title: "Pricing – Free & Premium Plans | Shyftcut",
    description:
      "Simple, transparent pricing. Start free with one roadmap; upgrade to Premium for unlimited roadmaps and AI coaching. Cancel anytime.",
  },
  "/about": {
    title: "About Us – AI Career Guidance | Shyftcut",
    description:
      "Shyftcut helps you build a clear 12-week career path with AI-powered roadmaps, verified courses, and 24/7 coaching. Learn how we started.",
  },
  "/contact": {
    title: "Contact Us | Shyftcut",
    description:
      "Get in touch with Shyftcut. Questions about career roadmaps, pricing, or support? We're here to help. Reach out via our contact form.",
  },
  "/blog": {
    title: "Career Tips & Guides | Shyftcut Blog",
    description:
      "Career tips, transition guides, and insights from the Shyftcut team. How to succeed in your 12-week career journey and land your next role.",
  },
  "/careers": {
    title: "Careers – Join Shyftcut | Remote Jobs",
    description:
      "Join Shyftcut. Remote-first roles in product, engineering, and growth. We're building the future of AI-powered career guidance.",
  },
  "/login": {
    title: "Sign In | Shyftcut",
    description:
      "Sign in to your Shyftcut account to access your career roadmap, AI coach, and progress tracking.",
  },
  "/signup": {
    title: "Sign Up – Get Your Roadmap | Shyftcut",
    description:
      "Create your Shyftcut account and get your personalized 12-week career roadmap in 90 seconds. Free to start.",
  },
  "/terms": {
    title: "Terms of Service | Shyftcut",
    description:
      "Terms of Service for Shyftcut. Read about acceptance, service description, accounts, payments, and acceptable use.",
  },
  "/privacy": {
    title: "Privacy Policy | Shyftcut",
    description:
      "Privacy Policy for Shyftcut. How we collect, use, and protect your information. Your rights and data security.",
  },
  "/cookies": {
    title: "Cookie Policy | Shyftcut",
    description:
      "How Shyftcut uses cookies and similar technologies. Types of cookies we use and how to manage them.",
  },
  "/refund": {
    title: "Refund Policy | Shyftcut",
    description:
      "Shyftcut refund policy. Due to the digital nature of our services, all sales are final. Exceptions for duplicate or unauthorized charges.",
  },
  "/career-dna": {
    title: "Career DNA Test | Find Your Perfect Field | Shyftcut",
    description:
      "Take the free 90-second Career DNA quiz. See how well your personality fits your field and discover careers that match your strengths.",
  },
};

/** Arabic SEO copy per route (in-app title/description when language is ar). */
export const seoByPathAr: Record<string, SeoEntry> = {
  "/": {
    title: "خارطة طريقك المهنية في 90 ثانية | Shyftcut",
    description:
      "توجيه مهني مدعوم بالذكاء الاصطناعي يحول الحيرة إلى مسار واضح لمدة 12 أسبوعاً. احصل على خرائط مخصصة، دورات موثقة، وتدريب ذكي 24/7.",
  },
  "/pricing": {
    title: "الأسعار – خطط مجانية وبريميوم | Shyftcut",
    description:
      "تسعير بسيط وشفاف. ابدأ مجاناً بخارطة واحدة؛ أو رَقِّ لبريميوم للحصول على خرائط وتدريب ذكي غير محدود. إلغاء في أي وقت.",
  },
  "/about": {
    title: "عنّا – توجيه مهني بالذكاء الاصطناعي | Shyftcut",
    description:
      "تساعدك Shyftcut في بناء مسار مهني واضح لمدة 12 أسبوعاً بخرائط مدعومة بالذكاء الاصطناعي ودورات موثقة. تعرف على قصتنا.",
  },
  "/contact": {
    title: "اتصل بنا | Shyftcut",
    description:
      "تواصل مع Shyftcut. أسئلة حول خرائط الطريق المهنية، الأسعار، أو الدعم؟ نحن هنا للمساعدة.",
  },
  "/blog": {
    title: "نصائح وأدلة مهنية | مدونة Shyftcut",
    description:
      "نصائح مهنية، أدلة للتحول الوظيفي، ورؤى من فريق Shyftcut. كيف تنجح في رحلتك المهنية وتحصل على دورك القادم.",
  },
  "/careers": {
    title: "وظائف – انضم لـ Shyftcut | عمل عن بُعد",
    description:
      "انضم لـ Shyftcut. أدوار عن بُعد في المنتج والهندسة والنمو. نحن نبني مستقبل التوجيه المهني المدعوم بالذكاء الاصطناعي.",
  },
  "/login": {
    title: "تسجيل الدخول | Shyftcut",
    description:
      "سجل الدخول لحساب Shyftcut للوصول إلى خارطتك المهنية، المدرب الذكي، وتتبع التقدم.",
  },
  "/signup": {
    title: "تسجيل – احصل على خارطتك | Shyftcut",
    description:
      "أنشئ حساب Shyftcut واحصل على خارطة طريقك المهنية المخصصة في 90 ثانية. البداية مجانية.",
  },
  "/terms": {
    title: "شروط الخدمة | Shyftcut",
    description:
      "شروط الخدمة لـ Shyftcut. اقرأ حول القبول، وصف الخدمة، الحسابات، الدفعات، والاستخدام المقبول.",
  },
  "/privacy": {
    title: "سياسة الخصوصية | Shyftcut",
    description:
      "سياسة الخصوصية لـ Shyftcut. كيف نجمع ونستخدم ونحمي معلوماتك. حقوقك وأمن البيانات.",
  },
  "/cookies": {
    title: "سياسة ملفات تعريف الارتباط | Shyftcut",
    description:
      "كيف تستخدم Shyftcut ملفات تعريف الارتباط والتقنيات المشابهة. أنواع الكوكيز وكيفية إدارتها.",
  },
  "/refund": {
    title: "سياسة الاسترداد | Shyftcut",
    description:
      "سياسة استرداد الأموال في Shyftcut. نظراً للطبيعة الرقمية لخدماتنا، جميع المبيعات نهائية. استثناءات للرسوم المكررة.",
  },
  "/career-dna": {
    title: "اختبار الحمض النووي المهني | جد مجالك المثالي | Shyftcut",
    description:
      "خض اختبار الـ 90 ثانية المجاني. اكتشف مدى توافق شخصيتك مع مجالك وتعرف على المسارات التي تناسب نقاط قوتك.",
  },
};

/** Default title/description for index (fallback before React). */
export const defaultSeo: SeoEntry = seoByPath["/"];

/**
 * Get SEO entry for a path. Normalize path (trailing slash) for lookup.
 */
export function getSeoForPath(path: string): SeoEntry | undefined {
  const normalized = path === "" ? "/" : path.startsWith("/") ? path : `/${path}`;
  return seoByPath[normalized];
}

export type Language = "en" | "ar";

/**
 * Get localized SEO entry for a path and language. Falls back to English if Arabic missing.
 */
export function getSeo(path: string, language: Language): SeoEntry {
  const normalized = path === "" ? "/" : path.startsWith("/") ? path : `/${path}`;
  if (language === "ar" && seoByPathAr[normalized]) {
    return seoByPathAr[normalized];
  }
  return seoByPath[normalized] ?? defaultSeo;
}

/** Truncate text for meta description (~120–156 chars). */
export function truncateMetaDescription(text: string, max = 156): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max - 3);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.7 ? cut.slice(0, lastSpace) : cut) + "...";
}
