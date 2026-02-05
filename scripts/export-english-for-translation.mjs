#!/usr/bin/env node
/**
 * Export English-only JSON for external translation to Arabic.
 * Use the output with a translation service, then apply the resulting
 * arabic-translations.json back via apply-arabic-translations.mjs
 *
 * Usage: node scripts/export-english-for-translation.mjs
 * Output: english-for-translation.json (project root)
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function main() {
  const arabicSourcesPath = join(ROOT, "arabic-sources.json");
  const arabicSources = JSON.parse(readFileSync(arabicSourcesPath, "utf-8"));

  const pricingPath = join(ROOT, "src/pages/Pricing.tsx");
  const pricingRaw = readFileSync(pricingPath, "utf-8");

  const blogPath = join(ROOT, "src/data/blog-posts.ts");
  const blogRaw = readFileSync(blogPath, "utf-8");

  const seoPath = join(ROOT, "src/data/seo-content.ts");
  const seoRaw = readFileSync(seoPath, "utf-8");

  // 1. languageContext: key -> English value only
  const languageContext = {};
  for (const [key, val] of Object.entries(arabicSources.languageContext || {})) {
    if (val.en != null) languageContext[key] = val.en;
  }

  // 2. testimonials: { quote, role } English only
  const testimonials = (arabicSources.testimonials || []).map((t) => ({
    quote: t.quote?.en ?? t.quote,
    role: t.role?.en ?? t.role ?? "",
  }));

  // 3. plans: English from Pricing.tsx
  const plansEnMatch = pricingRaw.match(
    /en:\s*\[\s*\{[\s\S]*?id:\s*['"]free['"][\s\S]*?\},[\s\S]*?id:\s*['"]premium['"][\s\S]*?\}\s*\]/
  );
  const plans = { free: null, premium: null };
  const freeMatch = pricingRaw.match(
    /id:\s*['"]free['"][\s\S]*?name:\s*['"]([^'"]*)['"][\s\S]*?description:\s*['"]([^'"]*)['"][\s\S]*?features:\s*\[([\s\S]*?)\][\s\S]*?ctaKey:\s*['"]([^'"]*)['"]/
  );
  const premiumMatch = pricingRaw.match(
    /id:\s*['"]premium['"][\s\S]*?name:\s*['"]([^'"]*)['"][\s\S]*?description:\s*['"]([^'"]*)['"][\s\S]*?features:\s*\[([\s\S]*?)\][\s\S]*?ctaKey:\s*['"]([^'"]*)['"]/
  );
  function extractFeatures(str) {
    if (!str) return [];
    return [...str.matchAll(/'([^']*(?:\\'[^']*)*)'/g)].map((m) =>
      m[1].replace(/\\'/g, "'")
    );
  }
  if (freeMatch) {
    plans.free = {
      name: freeMatch[1],
      description: freeMatch[2],
      features: extractFeatures(freeMatch[3]),
      ctaKey: freeMatch[4],
    };
  } else {
    plans.free = {
      name: "Free",
      description: "Get started with basic features",
      features: [
        "1 roadmap (total)",
        "10 AI chat messages per month",
        "3 quizzes per month",
        "1 recommended course per week",
        "Progress tracking & dashboard",
        "Email support",
      ],
      ctaKey: "Get Started Free",
    };
  }
  if (premiumMatch) {
    plans.premium = {
      name: premiumMatch[1],
      description: premiumMatch[2],
      features: extractFeatures(premiumMatch[3]),
      ctaKey: premiumMatch[4],
    };
  } else {
    plans.premium = {
      name: "Premium",
      description: "Unlimited roadmaps and AI",
      features: [
        "Unlimited roadmaps",
        "Unlimited AI chat",
        "Unlimited quizzes",
        "Full course recommendations",
        "CV analysis (paste or upload)",
        "Find jobs for me — 10 real jobs weekly",
        "Progress tracking & analytics",
        "Email support",
      ],
      ctaKey: "Upgrade Now",
    };
  }

  // 4. faqs: English from Pricing.tsx
  const faqsEnMatch = pricingRaw.match(
    /faqs\s*=\s*\{[\s\S]*?en:\s*\[([\s\S]*?)\],\s*ar:/
  );
  const faqs = [];
  if (faqsEnMatch) {
    const faqBlock = faqsEnMatch[1];
    const faqRe = /{\s*q:\s*'([^']*(?:\\'[^']*)*)',\s*a:\s*'([^']*(?:\\'[^']*)*)'\s*}/g;
    let m;
    while ((m = faqRe.exec(faqBlock)) !== null) {
      faqs.push({
        q: m[1].replace(/\\'/g, "'"),
        a: m[2].replace(/\\'/g, "'"),
      });
    }
  }
  if (faqs.length === 0) {
    faqs.push(
      { q: "Can I change plans later?", a: "Yes. You can upgrade or downgrade anytime from your subscription settings. Differences are prorated." },
      { q: "What payment methods do you accept?", a: "We accept credit and debit cards (Visa, Mastercard, American Express) through a secure payment processor." },
      { q: "Is there a refund policy?", a: "Yes. See our Refund Policy page for details. We offer refunds within a specified period for new subscribers." },
      { q: "Do you offer student discounts?", a: "We are working on adding student discounts soon. Contact us at support@shyftcut.com for more." }
    );
  }

  // 5. blogPosts: English content from blog-posts.ts
  const blogPosts = [];
  const slugRe = /slug:\s*['"]([^'"]+)['"]/g;
  const slugs = [...blogRaw.matchAll(slugRe)].map((m) => m[1]);

  const postBlocks = blogRaw.split(/slug:\s*['"]/).slice(1);
  for (let i = 0; i < postBlocks.length; i++) {
    const blk = postBlocks[i];
    const slug = blk.match(/^([^'"]+)['"]/)?.[1];
    const titleEn = blk.match(/title:\s*\{\s*en:\s*['"`]([^'"`]*(?:\\.[^'"`]*)*)['"`]/)?.[1]?.replace(/\\'/g, "'");
    const excerptEn = blk.match(/excerpt:\s*\{\s*en:\s*['"`]([^'"`]*(?:\\.[^'"`]*)*)['"`]/)?.[1]?.replace(/\\'/g, "'");
    const contentEnMatch = blk.match(/content:\s*\{\s*en:\s*`([^`]*(?:\\.[^`]*)*)`/s);
    const contentEn = contentEnMatch
      ? contentEnMatch[1].replace(/\\`/g, "`").replace(/\\\$\{/g, "${")
      : "";
    const readingTimeEn = blk.match(/readingTime:\s*\{\s*en:\s*['"`]([^'"`]*)['"`]/)?.[1];
    const categoryEn = blk.match(/category:\s*\{\s*en:\s*['"`]([^'"`]*)['"`]/)?.[1];
    const authorRoleEn = blk.match(/role:\s*\{\s*en:\s*['"`]([^'"`]*)['"`]/)?.[1];
    if (slug && (titleEn || contentEn)) {
      blogPosts.push({
        slug,
        title: titleEn ?? "",
        excerpt: excerptEn ?? "",
        content: contentEn,
        readingTime: readingTimeEn ?? "",
        category: categoryEn ?? "",
        authorRole: authorRoleEn ?? "",
      });
    }
  }

  // 6. seo: English from seo-content.ts (seoByPath only, NOT seoByPathAr)
  const seo = {};
  const seoEnBlock = seoRaw.match(/export const seoByPath[^=]*=\s*\{([\s\S]*?)\n\};\s*\n\/\*\* Arabic/);
  const seoEnContent = seoEnBlock ? seoEnBlock[1] : seoRaw;
  // Match "path": { title: "...", description: "..." } - use " for strings (handles apostrophes)
  const pathRe = /"(\/[^"]*)"\s*:\s*\{[\s\S]*?title:\s*"((?:[^"\\]|\\.)*)"[\s\S]*?description:\s*"((?:[^"\\]|\\.)*)"/g;
  let seoM;
  while ((seoM = pathRe.exec(seoEnContent)) !== null) {
    const path = seoM[1];
    const title = seoM[2].replace(/\\"/g, '"');
    const description = seoM[3].replace(/\\"/g, '"');
    seo[path] = { title, description };
  }
  if (Object.keys(seo).length === 0) {
    const seoEntries = [
      ["/", { title: "Your Career Roadmap in 90 Seconds | Shyftcut", description: "AI-powered career guidance that transforms confusion into a clear 12-week path. Get personalized roadmaps, verified courses, and 24/7 AI coaching." }],
      ["/pricing", { title: "Pricing – Free & Premium Plans | Shyftcut", description: "Simple, transparent pricing. Start free with one roadmap; upgrade to Premium for unlimited roadmaps and AI coaching. Cancel anytime." }],
      ["/about", { title: "About Us – AI Career Guidance | Shyftcut", description: "Shyftcut helps you build a clear 12-week career path with AI-powered roadmaps, verified courses, and 24/7 coaching. Learn how we started." }],
      ["/contact", { title: "Contact Us | Shyftcut", description: "Get in touch with Shyftcut. Questions about career roadmaps, pricing, or support? We're here to help. Reach out via our contact form." }],
      ["/blog", { title: "Career Tips & Guides | Shyftcut Blog", description: "Career tips, transition guides, and insights from the Shyftcut team. How to succeed in your 12-week career journey and land your next role." }],
      ["/login", { title: "Sign In | Shyftcut", description: "Sign in to your Shyftcut account to access your career roadmap, AI coach, and progress tracking." }],
      ["/signup", { title: "Sign Up – Get Your Roadmap | Shyftcut", description: "Create your Shyftcut account and get your personalized 12-week career roadmap in 90 seconds. Free to start." }],
      ["/terms", { title: "Terms of Service | Shyftcut", description: "Terms of Service for Shyftcut. Read about acceptance, service description, accounts, payments, and acceptable use." }],
      ["/privacy", { title: "Privacy Policy | Shyftcut", description: "Privacy Policy for Shyftcut. How we collect, use, and protect your information. Your rights and data security." }],
      ["/cookies", { title: "Cookie Policy | Shyftcut", description: "How Shyftcut uses cookies and similar technologies. Types of cookies we use and how to manage them." }],
      ["/refund", { title: "Refund Policy | Shyftcut", description: "Shyftcut refund policy. Due to the digital nature of our services, all sales are final. Exceptions for duplicate or unauthorized charges." }],
      ["/career-dna", { title: "Career DNA Test | Find Your Perfect Field | Shyftcut", description: "Take the free 90-second Career DNA quiz. See how well your personality fits your field and discover careers that match your strengths." }],
    ];
    for (const [p, v] of seoEntries) seo[p] = v;
  }

  // 7. inlineStrings: key -> English value only
  const inlineStrings = {};
  for (const [key, val] of Object.entries(arabicSources.inlineStrings || {})) {
    if (val.en != null) inlineStrings[key] = val.en;
  }

  // 8. careerFields: Career DNA dropdown options (from career-dna-questions.ts)
  const careerFields = [
    "Software Engineer", "Data Scientist", "Product Manager", "UX Designer",
    "DevOps Engineer", "Cloud Architect", "Machine Learning Engineer", "Frontend Developer",
    "Backend Developer", "Full Stack Developer", "Cybersecurity Analyst", "Business Analyst",
    "Project Manager", "Marketing Manager", "Sales Manager", "HR Manager", "Student", "Other",
  ];

  // 9. careers: Careers page - benefits, openings, hiring steps
  const careersStructured = {
    benefits: [
      { title: "Remote-First", description: "Work from anywhere in the world. We believe in flexibility." },
      { title: "Learning Budget", description: "$1,000/year for courses, books, and conferences." },
      { title: "Health Benefits", description: "Comprehensive health, dental, and vision coverage." },
      { title: "Flexible Hours", description: "Work when you're most productive. No strict 9-5." },
    ],
    openings: [
      { title: "Senior Full-Stack Engineer", department: "Engineering", location: "Remote", type: "Full-time" },
      { title: "AI/ML Engineer", department: "AI Team", location: "Remote", type: "Full-time" },
      { title: "Product Designer", department: "Design", location: "Remote", type: "Full-time" },
      { title: "Content Writer (Arabic)", department: "Marketing", location: "Remote", type: "Contract" },
    ],
    steps: [
      { title: "Apply", description: "Submit your application with resume and cover letter." },
      { title: "Chat", description: "Quick intro call to learn about you and answer questions." },
      { title: "Challenge", description: "Take-home project relevant to the role." },
      { title: "Final Interview", description: "Deep dive with the team you'll be working with." },
    ],
    hero: {
      backToHome: "Back to Home",
      joinShyftcut: "Join Shyftcut",
      openRoles: "Open Roles",
    },
  };

  // 10. contact: FAQs, hero, options, form labels, toasts
  const contactPath = join(ROOT, "src/pages/Contact.tsx");
  const contactRaw = readFileSync(contactPath, "utf-8");
  const contactFaqs = [];
  const faqBlock = contactRaw.match(/const faqs = \[([\s\S]*?)\];/);
  if (faqBlock) {
    const faqRe = /question:\s*\{\s*en:\s*'([^']*(?:\\'[^']*)*)'[\s\S]*?answer:\s*\{\s*en:\s*'([^']*(?:\\'[^']*)*)'/g;
    let fm;
    while ((fm = faqRe.exec(faqBlock[1])) !== null) {
      contactFaqs.push({ question: fm[1].replace(/\\'/g, "'"), answer: fm[2].replace(/\\'/g, "'") });
    }
  }
  const contact = {
    faqs: contactFaqs,
    hero: {
      backToHome: "Back to Home",
      title: "Get in Touch",
      subtitle: "Have a question or feedback? We'd love to hear from you. Our team is ready to help.",
    },
    options: {
      emailUs: "Email Us",
      responseTime: "Response Time",
      responseTimeValue: "Usually within 24 hours",
      location: "Location",
      locationValue: "Remote team, Global",
    },
    form: {
      sendMessage: "Send Us a Message",
      name: "Name",
      namePlaceholder: "Full name",
      email: "Email",
      subject: "Subject",
      subjectPlaceholder: "Brief subject",
      message: "Message",
      messagePlaceholder: "Describe your issue or question (min 10 characters)...",
      topic: "Topic",
      topicGeneral: "General",
      topicSales: "Sales",
      topicSupport: "Support",
      topicPartnership: "Partnership",
      topicFeedback: "Feedback",
      topicOther: "Other",
      submit: "Send message",
    },
    toasts: {
      messageSent: "Message Sent!",
      messageSentDesc: "Thanks for reaching out. We'll get back to you soon.",
      validationError: "Validation Error",
      sendError: "Something went wrong. Please try again.",
    },
    validation: {
      nameRequired: "Name is required",
      nameTooLong: "Name is too long",
      emailInvalid: "Invalid email address",
      subjectRequired: "Subject is required",
      subjectTooLong: "Subject is too long",
      messageMin: "Message must be at least 10 characters",
      messageTooLong: "Message is too long",
    },
  };

  // 11. about: values, timeline
  const about = {
    values: [
      { title: "Clarity First", description: "We believe everyone deserves a clear path to their career goals." },
      { title: "Accessibility", description: "Career guidance should be available to everyone, not just the privileged few." },
      { title: "Innovation", description: "We leverage cutting-edge AI to deliver personalized guidance at scale." },
      { title: "Empathy", description: "Career transitions are hard. We design with compassion and understanding." },
    ],
    timeline: [
      { year: "2024", event: "Idea conceived" },
      { year: "2025", event: "Product built" },
      { year: "2026", event: "Launching February 2026" },
    ],
    hero: { backToHome: "Back to Home" },
  };

  // 12. refund: exceptions, sections
  const refundPath = join(ROOT, "src/pages/Refund.tsx");
  const refundRaw = readFileSync(refundPath, "utf-8");
  const refundExceptions = [];
  const excMatch = refundRaw.match(/const exceptions = \[([\s\S]*?)\];/);
  if (excMatch) {
    const excRe = /title:\s*\{\s*en:\s*'([^']*(?:\\'[^']*)*)'[\s\S]*?description:\s*\{\s*en:\s*'([^']*(?:\\'[^']*)*)'/g;
    let em;
    while ((em = excRe.exec(excMatch[1])) !== null) {
      refundExceptions.push({ title: em[1].replace(/\\'/g, "'"), description: em[2].replace(/\\'/g, "'") });
    }
  }
  const refund = {
    hero: { backToHome: "Back to Home", title: "Refund Policy", lastUpdated: "Last Updated: January 28, 2026" },
    sections: {
      allSalesFinal: "All Sales Are Final",
      allSalesFinalDesc: "Due to the digital nature of our services, we do not offer refunds for any subscriptions or purchases. Once payment is processed, the sale is final.",
      whyNoRefunds: "Why We Don't Offer Refunds",
      whyNoRefundsDesc: "Shyftcut is a digital service that gives you immediate access to AI roadmaps, verified courses, AI coaching, and progress tracking. These cannot be \"returned\" after subscription.",
      whatYouGet: ["AI career roadmaps", "Curated course recommendations", "24/7 AI coaching", "Progress tracking and quizzes"],
      beforeSubscribe: "Before You Subscribe",
      beforeSubscribeEncourage: "We encourage you to:",
      beforeSubscribeItems: ["Explore the free tier to understand the platform", "Review our pricing page carefully", "Contact us if you have any questions"],
      exceptions: "Exceptions",
      exceptionsDesc: "In rare cases we may consider exceptions (e.g. duplicate charges or unauthorized transactions). Review is individual and at our discretion.",
      cancellation: "Cancellation",
      cancellationDesc: "You may cancel anytime. Your access remains active until the end of the current billing period; no refund is issued for the unused portion.",
      contactUs: "Contact Us",
      contactUsDesc: "Questions about this policy or account issues:",
    },
    exceptions: refundExceptions,
  };

  // 13. featureComparison: rows and headers
  const fcPath = join(ROOT, "src/components/pricing/FeatureComparison.tsx");
  const fcRaw = readFileSync(fcPath, "utf-8");
  const fcRows = [];
  const fcRe = /feature:\s*\{\s*en:\s*'([^']*(?:\\'[^']*)*)'/g;
  let fcm;
  while ((fcm = fcRe.exec(fcRaw)) !== null) {
    fcRows.push({ feature: fcm[1].replace(/\\'/g, "'") });
  }
  const featureComparison = {
    headers: { feature: "Feature", free: "Free", premium: "Premium" },
    rows: fcRows.length
      ? fcRows
      : [
          { feature: "Roadmaps" },
          { feature: "AI chat messages" },
          { feature: "Quizzes" },
          { feature: "Notes" },
          { feature: "Tasks" },
          { feature: "AI task suggestions" },
          { feature: "Focus (Pomodoro) timer" },
          { feature: "Course recommendations" },
          { feature: "CV analysis" },
          { feature: "Job recommendations (10/week)" },
          { feature: "Progress tracking" },
          { feature: "Email support" },
        ],
  };

  // 14. legal common + terms, privacy, cookies (section titles and key content)
  const legalCommon = {
    backToHome: "Back to Home",
    lastUpdated: "Last Updated: January 28, 2026",
  };
  const termsSections = [
    { id: "acceptance", title: "1. Acceptance of Terms", content: "By accessing and using Shyftcut, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this service." },
    { id: "description", title: "2. Description of Service", content: "Shyftcut is an AI-powered career guidance platform that provides: Personalized career roadmaps, Course recommendations, AI coaching, Progress tracking and quizzes." },
    { id: "accounts", title: "3. User Accounts", content: "You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account." },
    { id: "payments", title: "4. Subscriptions and Payments", content: "Payments are processed securely through Polar.sh. Subscriptions auto-renew unless canceled. You may cancel your subscription at any time from your profile. All sales are final (see Refund Policy)." },
    { id: "acceptable-use", title: "5. Acceptable Use", content: "You agree not to: Use the service for any unlawful purpose, Attempt to gain unauthorized access to our systems, Abuse AI resources, Share your account credentials with others, Resell or redistribute service content." },
    { id: "ip", title: "6. Intellectual Property", content: "All content, features, and functionality on Shyftcut are owned by us and are protected by international intellectual property laws." },
    { id: "disclaimer", title: "7. Disclaimer of Warranties", content: "Shyftcut is provided \"as is\" without any warranties. We do not guarantee that the service will be error-free or continuously available. Career guidance provided is for informational purposes only." },
    { id: "contact", title: "8. Contact Us", content: "For questions about these terms, contact us at support@shyftcut.com." },
  ];
  const privacySections = [
    { id: "info-collect", title: "1. Information We Collect" },
    { id: "how-use", title: "2. How We Use Your Information" },
    { id: "data-sharing", title: "3. Data Sharing" },
    { id: "data-security", title: "4. Data Security" },
    { id: "your-rights", title: "5. Your Rights" },
    { id: "cookies", title: "6. Cookies" },
    { id: "retention", title: "7. Data Retention" },
    { id: "contact", title: "8. Contact Us" },
  ];
  const privacyKeyPoints = [
    "We only collect what we need to provide our services",
    "Your data is encrypted and protected",
    "We never sell your data",
    "You can access or delete your data anytime",
  ];
  const cookiesSections = [
    { id: "what-are", title: "What Are Cookies?" },
    { id: "types", title: "Types of Cookies" },
    { id: "third-party", title: "Third-Party Cookies" },
    { id: "managing", title: "Managing Cookies" },
    { id: "contact", title: "Contact Us" },
  ];
  const cookieTypes = [
    { name: "sb-auth-token", purpose: "Authentication and session", duration: "Session", type: "essential" },
    { name: "shyftcut-language", purpose: "Language preference", duration: "1 year", type: "functional" },
    { name: "theme", purpose: "Dark/light mode preference", duration: "1 year", type: "functional" },
    { name: "shyftcut-cookie-consent", purpose: "Cookie consent preference", duration: "1 year", type: "essential" },
  ];
  const legalPages = {
    terms: { heroTitle: "Terms of Service", sections: termsSections },
    privacy: { heroTitle: "Privacy Policy", keyPoints: privacyKeyPoints, sections: privacySections },
    cookies: { heroTitle: "Cookie Policy", sections: cookiesSections, cookieTypes },
    common: legalCommon,
  };

  // 15. footer, appSidebar, appMoreSheet link labels
  const footerLinks = [
    { to: "/pricing", label: "Pricing" },
    { to: "/roadmap", label: "Roadmap" },
    { to: "/courses", label: "Courses" },
    { to: "/chat", label: "AI Coach" },
    { to: "/about", label: "About" },
    { to: "/blog", label: "Blog" },
    { to: "/contact", label: "Contact" },
    { to: "/privacy", label: "Privacy" },
    { to: "/terms", label: "Terms" },
    { to: "/cookies", label: "Cookies" },
    { to: "/refund", label: "Refund" },
  ];
  const appSidebarLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/roadmap", label: "Roadmap" },
    { href: "/study", label: "Focus" },
    { href: "/courses", label: "Courses" },
    { href: "/chat", label: "AI Coach" },
    { href: "/career-tools", label: "Career Tools" },
    { href: "/community", label: "Community" },
  ];
  const appMoreSheetLinks = [
    { href: "/courses", label: "Courses" },
    { href: "/career-tools", label: "Career Tools" },
    { href: "/community", label: "Community" },
    { href: "/wizard", label: "Create roadmap" },
    { href: "/support", label: "Support" },
    { href: "/", label: "Home" },
    { href: "upgrade", label: "Upgrade" },
  ];

  // 16. hardcoded toasts and messages
  const hardcodedStrings = {
    checkoutButton: { sessionExpired: "Session expired. Please sign in again." },
    contact: { validationError: "Validation Error" },
  };

  const output = {
    _meta: {
      description: "English-only export for external translation to Arabic. Return a JSON with the same structure, with Arabic values replacing English where applicable.",
      generatedAt: new Date().toISOString(),
    },
    languageContext,
    testimonials,
    plans,
    faqs,
    blogPosts,
    seo,
    inlineStrings,
    careerFields,
    careers: careersStructured,
    contact,
    about,
    refund,
    featureComparison,
    legalPages,
    footerLinks,
    appSidebarLinks,
    appMoreSheetLinks,
    hardcodedStrings,
  };

  const outPath = join(ROOT, "english-for-translation.json");
  writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
  console.log(`Exported to ${outPath}`);
  console.log(`  languageContext: ${Object.keys(languageContext).length} keys`);
  console.log(`  testimonials: ${testimonials.length}`);
  console.log(`  plans: free, premium`);
  console.log(`  faqs: ${faqs.length}`);
  console.log(`  blogPosts: ${blogPosts.length}`);
  console.log(`  seo: ${Object.keys(seo).length} paths`);
  console.log(`  inlineStrings: ${Object.keys(inlineStrings).length}`);
  console.log(`  careerFields: ${careerFields.length}`);
  console.log(`  careers: benefits, openings, steps`);
  console.log(`  contact: faqs, hero, form, toasts`);
  console.log(`  about: values, timeline`);
  console.log(`  refund: sections, exceptions`);
  console.log(`  featureComparison: ${featureComparison.rows.length} rows`);
  console.log(`  legalPages: terms, privacy, cookies`);
  console.log(`  footerLinks: ${footerLinks.length}, appSidebar: ${appSidebarLinks.length}, appMoreSheet: ${appMoreSheetLinks.length}`);
}

main();
