#!/usr/bin/env node
/**
 * Apply Arabic translations from ara.json to the codebase.
 *
 * Usage: node scripts/apply-arabic-translations.mjs
 * Requires: ara.json in project root
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function escape(str) {
  if (typeof str !== "string") return str;
  return str.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n");
}

function formatArBlock(obj) {
  const lines = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue;
    lines.push(`    '${k.replace(/'/g, "\\'")}': '${escape(String(v))}'`);
  }
  return lines.join(",\n");
}

function main() {
  const araPath = join(ROOT, "ara.json");
  const ara = JSON.parse(readFileSync(araPath, "utf-8"));

  // 1. LanguageContext.tsx — replace ar block (merge hardcodedStrings into ar)
  const langCtxPath = join(ROOT, "src/contexts/LanguageContext.tsx");
  let langCtx = readFileSync(langCtxPath, "utf-8");
  const langCtxAr = { ...(ara.languageContext || {}), ...(ara.inlineStrings || {}) };
  if (ara.hardcodedStrings?.checkoutButton?.sessionExpired) {
    langCtxAr["auth.sessionExpired"] = ara.hardcodedStrings.checkoutButton.sessionExpired;
  }
  const arBlock = formatArBlock(langCtxAr);
  langCtx = langCtx.replace(
    /  ar: \{\s*[\s\S]*?\n  \},\s*\n\};/,
    `  ar: {\n${arBlock}\n  },\n};`
  );
  writeFileSync(langCtxPath, langCtx, "utf-8");
  console.log("Updated LanguageContext.tsx");

  // 2. testimonials.ts — replace ar quote/role (replace i-th occurrence on i-th iteration)
  const testPath = join(ROOT, "src/data/testimonials.ts");
  let testRaw = readFileSync(testPath, "utf-8");
  const testimonials = ara.testimonials || [];
  testimonials.forEach((t, i) => {
    const quoteAr = (t.quote || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    const roleAr = (t.role || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    let occ = 0;
    testRaw = testRaw.replace(/ar: '[^']*(?:\\'[^']*)*'(\s*\},\s*author:)/g, (m, g1) => {
      if (occ++ === i) return `ar: '${quoteAr}'${g1}`;
      return m;
    });
    occ = 0;
    testRaw = testRaw.replace(/(role: \{\s*en: '[^']*',\s*)ar: '[^']*(?:\\'[^']*)*'/g, (m, g1) => {
      if (occ++ === i) return `${g1}ar: '${roleAr}'`;
      return m;
    });
  });
  writeFileSync(testPath, testRaw, "utf-8");
  console.log("Updated testimonials.ts");

  // 3. Pricing.tsx — replace ar plans and faqs
  const pricingPath = join(ROOT, "src/pages/Pricing.tsx");
  let pricingRaw = readFileSync(pricingPath, "utf-8");
  const plans = ara.plans || {};
  const faqs = ara.faqs || [];
  if (plans.free && plans.premium) {
    const freeFeat = (plans.free.features || []).map((x) => `        '${escape(x)}'`).join(",\n");
    const premFeat = (plans.premium.features || []).map((x) => `        '${escape(x)}'`).join(",\n");
    const newArPlans = `ar: [
    {
      id: 'free',
      name: '${escape(plans.free.name)}',
      price: 0,
      description: '${escape(plans.free.description)}',
      icon: IconSparkle,
      features: [
${freeFeat}
      ],
      ctaKey: 'Get Started Free',
      ctaKeyAr: '${escape(plans.free.ctaKey || "ابدأ مجاناً")}',
    },
    {
      id: 'premium',
      name: '${escape(plans.premium.name)}',
      price: 6.99,
      description: '${escape(plans.premium.description)}',
      icon: IconLightning,
      popular: true,
      features: [
${premFeat}
      ],
      ctaKey: 'Upgrade Now',
      ctaKeyAr: '${escape(plans.premium.ctaKey || "ترقية الآن")}',
    },
  ]`;
    pricingRaw = pricingRaw.replace(/  ar: \[\s*\{[\s\S]*?id: 'free'[\s\S]*?id: 'premium'[\s\S]*?\}\s*\],/, newArPlans + ",");
  }
  if (faqs.length >= 4) {
    const faqAr = faqs.map((f) => `    { q: '${escape(f.q)}', a: '${escape(f.a)}' }`).join(",\n");
    const newFaqAr = `ar: [\n${faqAr}\n  ]`;
    pricingRaw = pricingRaw.replace(
      /(const faqs = \{\s*en: \[[\s\S]*?\],\s*)ar: \[[\s\S]*?\](?=\s*[\},])/,
      `$1${newFaqAr}`
    );
  }
  writeFileSync(pricingPath, pricingRaw, "utf-8");
  console.log("Updated Pricing.tsx");

  // 4. seo-content.ts — replace seoByPathAr block
  const seoPath = join(ROOT, "src/data/seo-content.ts");
  let seoRaw = readFileSync(seoPath, "utf-8");
  const seoAr = ara.seo || {};
  let newSeoBlock = "export const seoByPathAr: Record<string, SeoEntry> = {\n";
  for (const [path, entry] of Object.entries(seoAr)) {
    if (!entry) continue;
    newSeoBlock += `  "${path}": {\n    title: "${escape(entry.title)}",\n    description:\n      "${escape(entry.description || "")}",\n  },\n`;
  }
  newSeoBlock += "};\n\n/** Default";
  seoRaw = seoRaw.replace(
    /export const seoByPathAr: Record<string, SeoEntry> = \{[\s\S]*?\n\};\s*\n\/\*\* Default/,
    newSeoBlock
  );
  writeFileSync(seoPath, seoRaw, "utf-8");
  console.log("Updated seo-content.ts");

  // 5. blog-posts.ts — replace ar content for each post (by slug)
  const blogPath = join(ROOT, "src/data/blog-posts.ts");
  let blogOut = readFileSync(blogPath, "utf-8");
  const blogPosts = ara.blogPosts || [];
  for (const post of blogPosts) {
    if (!post.slug || !post.content) continue;
    const contentAr = post.content.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
    const idx = blogOut.indexOf("slug: '" + post.slug + "'");
    if (idx < 0) continue;
    const arStart = blogOut.indexOf("ar: `", idx);
    if (arStart < 0) continue;
    const afterAr = arStart + 5;
    let end = afterAr;
    for (let i = afterAr; i < blogOut.length; i++) {
      const c = blogOut[i];
      if (c === "`") {
        let backslashCount = 0;
        for (let j = i - 1; j >= afterAr && blogOut[j] === "\\"; j--) backslashCount++;
        if (backslashCount % 2 === 0) {
          end = i;
          break;
        }
      }
    }
    blogOut = blogOut.slice(0, afterAr) + contentAr + blogOut.slice(end);
  }
  writeFileSync(blogPath, blogOut, "utf-8");
  console.log("Updated blog-posts.ts");

  // 6. Careers.tsx — benefits, openings, steps ar (by block to preserve order)
  const careersPath = join(ROOT, "src/pages/Careers.tsx");
  let careersRaw = readFileSync(careersPath, "utf-8");
  const careers = ara.careers || {};
  const replaceAr = (key, idx, val) => {
    let occ = 0;
    careersRaw = careersRaw.replace(
      new RegExp(`(${key}: \\{\\s*en: '[^']*',\\s*)ar: '[^']*(?:\\\\'[^']*)*'`, "g"),
      (m, g1) => (occ++ === idx ? `${g1}ar: '${escape(val)}'` : m)
    );
  };
  (careers.benefits || []).forEach((b, i) => {
    if (typeof b.title === "string") replaceAr("title", i, b.title);
    if (typeof b.description === "string") replaceAr("description", i, b.description);
  });
  (careers.openings || []).forEach((o, i) => {
    if (typeof o.title === "string") replaceAr("title", (careers.benefits?.length || 0) + i, o.title);
    if (typeof o.department === "string") replaceAr("department", i, o.department);
    if (typeof o.location === "string") replaceAr("location", i, o.location);
    if (typeof o.type === "string") replaceAr("type", i, o.type);
  });
  (careers.steps || []).forEach((s, i) => {
    if (typeof s.title === "string") replaceAr("title", (careers.benefits?.length || 0) + (careers.openings?.length || 0) + i, s.title);
    if (typeof s.description === "string") replaceAr("description", (careers.benefits?.length || 0) + i, s.description);
  });
  const careersHero = careers.hero || {};
  const replaceCareersAr = (en, ar) => {
    if (typeof ar !== "string") return;
    const enEsc = en.replace(/'/g, "\\'").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const arEsc = escape(ar);
    careersRaw = careersRaw.replace(
      new RegExp(`(language === 'ar' \\? )'[^']*(?:\\\\'[^']*)*'(?= : '${enEsc}')`, "g"),
      `$1'${arEsc}'`
    );
  };
  replaceCareersAr("Back to Home", careersHero.backToHome);
  replaceCareersAr("Join Our Team", careersHero.joinShyftcut);
  replaceCareersAr("Help us build the future of career guidance. We're looking for passionate people who want to make an impact.", careersHero.subtitle);
  replaceCareersAr("Open Positions", careersHero.openRoles);
  writeFileSync(careersPath, careersRaw, "utf-8");
  console.log("Updated Careers.tsx");

  // 7. Contact.tsx — faqs ar
  const contactPath = join(ROOT, "src/pages/Contact.tsx");
  let contactRaw = readFileSync(contactPath, "utf-8");
  const contactFaqs = ara.contact?.faqs || [];
  contactFaqs.forEach((faq, i) => {
    const qAr = escape(faq.question || "");
    const aAr = escape(faq.answer || "");
    let occ = 0;
    contactRaw = contactRaw.replace(
      /(question: \{\s*en: '[^']*',\s*)ar: '[^']*(?:\\'[^']*)*'/g,
      (m, g1) => {
        if (occ++ === i) return `${g1}ar: '${qAr}'`;
        return m;
      }
    );
    occ = 0;
    contactRaw = contactRaw.replace(
      /(answer: \{\s*en: '[^']*',[\s\n]*\s*)ar: '[^']*(?:\\'[^']*)*'/g,
      (m, g1) => {
        if (occ++ === i) return `${g1}ar: '${aAr}'`;
        return m;
      }
    );
  });
  // Contact hero, options, form, toasts
  const contactData = ara.contact || {};
  const replaceContactAr = (en, ar) => {
    if (typeof ar !== "string") return;
    const enEsc = en.replace(/'/g, "\\'").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const arEsc = escape(ar);
    contactRaw = contactRaw.replace(
      new RegExp(`(language === 'ar' \\? )'[^']*(?:\\\\'[^']*)*'(?= : '${enEsc}')`, "g"),
      `$1'${arEsc}'`
    );
  };
  const h = contactData.hero || {};
  const o = contactData.options || {};
  const f = contactData.form || {};
  const t = contactData.toasts || {};
  replaceContactAr("Back to Home", h.backToHome);
  replaceContactAr("Get in Touch", h.title);
  replaceContactAr("Have a question or feedback? We'd love to hear from you. Our team is ready to help.", h.subtitle);
  replaceContactAr("Email Us", o.emailUs);
  replaceContactAr("Response Time", o.responseTime);
  replaceContactAr("Usually within 24 hours", o.responseTimeValue);
  replaceContactAr("Location", o.location);
  replaceContactAr("Remote team, Global", o.locationValue);
  replaceContactAr("Send Us a Message", f.sendMessage);
  replaceContactAr("Name", f.name);
  replaceContactAr("Full name", f.namePlaceholder);
  replaceContactAr("Email", f.email);
  replaceContactAr("Subject", f.subject);
  replaceContactAr("Brief summary of your message", f.subjectPlaceholder);
  replaceContactAr("Message", f.message);
  replaceContactAr("Write your message here...", f.messagePlaceholder);
  replaceContactAr("Topic", f.topic);
  replaceContactAr("General inquiry", f.topicGeneral);
  replaceContactAr("Sales / plans", f.topicSales);
  replaceContactAr("Technical support", f.topicSupport);
  replaceContactAr("Partnership", f.topicPartnership);
  replaceContactAr("Feedback", f.topicFeedback);
  replaceContactAr("Other", f.topicOther);
  replaceContactAr("Send Message", f.submit);
  replaceContactAr("Validation Error", t.validationError);
  replaceContactAr("Message Sent!", t.messageSent);
  replaceContactAr("Thanks for reaching out. We'll get back to you soon.", t.messageSentDesc);
  replaceContactAr("Something went wrong. Please try again.", t.sendError);
  writeFileSync(contactPath, contactRaw, "utf-8");
  console.log("Updated Contact.tsx");

  // 8. About.tsx — values (title, description) and timeline (event) ar
  const aboutPath = join(ROOT, "src/pages/About.tsx");
  let aboutRaw = readFileSync(aboutPath, "utf-8");
  const about = ara.about || {};
  (about.values || []).forEach((v, i) => {
    if (typeof v.title === "string") {
      let occ = 0;
      aboutRaw = aboutRaw.replace(
        /(title: \{\s*en: '[^']*',\s*)ar: '[^']*(?:\\'[^']*)*'(?=\s*\},\s*description:)/g,
        (m, g1) => (occ++ === i ? `${g1}ar: '${escape(v.title)}'` : m)
      );
    }
    if (typeof v.description === "string") {
      let occ = 0;
      aboutRaw = aboutRaw.replace(
        /(description: \{\s*en: '[^']*',[\s\n]*\s*)ar: '[^']*(?:\\'[^']*)*'/g,
        (m, g1) => (occ++ === i ? `${g1}ar: '${escape(v.description)}'` : m)
      );
    }
  });
  (about.timeline || []).forEach((t, i) => {
    const ev = escape(t.event || "");
    let occ = 0;
    aboutRaw = aboutRaw.replace(
      /(event: \{\s*en: '[^']*',\s*)ar: '[^']*(?:\\'[^']*)*'/g,
      (m, g1) => (occ++ === i ? `${g1}ar: '${ev}'` : m)
    );
  });
  writeFileSync(aboutPath, aboutRaw, "utf-8");
  console.log("Updated About.tsx");

  // 9. Refund.tsx — exceptions ar
  const refundPath = join(ROOT, "src/pages/Refund.tsx");
  let refundRaw = readFileSync(refundPath, "utf-8");
  const refundExcs = ara.refund?.exceptions || [];
  refundExcs.forEach((exc, i) => {
    let occ = 0;
    refundRaw = refundRaw.replace(
      /(title: \{\s*en: '[^']*',\s*)ar: '[^']*(?:\\'[^']*)*'/g,
      (m, g1) => {
        if (occ++ === i) return `${g1}ar: '${escape(exc.title || "")}'`;
        return m;
      }
    );
    occ = 0;
    refundRaw = refundRaw.replace(
      /(description: \{\s*en: '[^']*',\s*)ar: '[^']*(?:\\'[^']*)*'/g,
      (m, g1) => {
        if (occ++ === i) return `${g1}ar: '${escape(exc.description || "")}'`;
        return m;
      }
    );
  });
  // Refund hero + sections (inline ternary replacements)
  const refundData = ara.refund || {};
  const refundHero = refundData.hero || {};
  const refundSections = refundData.sections || {};
  const replaceRefundAr = (en, ar) => {
    if (typeof ar !== "string") return;
    const enEsc = en.replace(/'/g, "\\'").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const arEsc = escape(ar);
    refundRaw = refundRaw.replace(
      new RegExp(`(language === 'ar' \\? )'[^']*(?:\\\\'[^']*)*'(?= : '${enEsc}')`, "g"),
      `$1'${arEsc}'`
    );
  };
  replaceRefundAr("Back to Home", refundHero.backToHome);
  replaceRefundAr("Refund Policy", refundHero.title);
  replaceRefundAr("All Sales Are Final", refundSections.allSalesFinal);
  replaceRefundAr("Due to the digital nature of our services, we do not offer refunds for any subscriptions or purchases. Once payment is processed, the sale is final.", refundSections.allSalesFinalDesc);
  replaceRefundAr("Why We Don't Offer Refunds", refundSections.whyNoRefunds);
  replaceRefundAr("Shyftcut is a digital service that gives you immediate access to AI roadmaps, verified courses, AI coaching, and progress tracking. These cannot be \"returned\" after subscription.", refundSections.whyNoRefundsDesc);
  replaceRefundAr("AI career roadmaps", refundSections.whatYouGet?.[0]);
  replaceRefundAr("Curated course recommendations", refundSections.whatYouGet?.[1]);
  replaceRefundAr("24/7 AI coaching", refundSections.whatYouGet?.[2]);
  replaceRefundAr("Progress tracking and quizzes", refundSections.whatYouGet?.[3]);
  replaceRefundAr("Before You Subscribe", refundSections.beforeSubscribe);
  replaceRefundAr("We encourage you to:", refundSections.beforeSubscribeEncourage);
  replaceRefundAr("Explore the free tier to understand the platform", refundSections.beforeSubscribeItems?.[0]);
  replaceRefundAr("Review our pricing page carefully", refundSections.beforeSubscribeItems?.[1]);
  replaceRefundAr("Contact us if you have any questions", refundSections.beforeSubscribeItems?.[2]);
  replaceRefundAr("Exceptions", refundSections.exceptions);
  replaceRefundAr("In rare cases we may consider exceptions (e.g. duplicate charges or unauthorized transactions). Review is individual and at our discretion.", refundSections.exceptionsDesc);
  replaceRefundAr("Cancellation", refundSections.cancellation);
  replaceRefundAr("You may cancel anytime. Your access remains active until the end of the current billing period; no refund is issued for the unused portion.", refundSections.cancellationDesc);
  replaceRefundAr("Contact Us", refundSections.contactUs);
  replaceRefundAr("Questions about this policy or account issues:", refundSections.contactUsDesc);
  writeFileSync(refundPath, refundRaw, "utf-8");
  console.log("Updated Refund.tsx");

  // 10. FeatureComparison.tsx — rows feature.ar
  const fcPath = join(ROOT, "src/components/pricing/FeatureComparison.tsx");
  let fcRaw = readFileSync(fcPath, "utf-8");
  const fcRows = ara.featureComparison?.rows || [];
  fcRows.forEach((row, i) => {
    const featAr = escape(row.feature || "");
    let occ = 0;
    fcRaw = fcRaw.replace(
      /(feature: \{\s*en: '[^']*',\s*)ar: '[^']*(?:\\'[^']*)*'/g,
      (m, g1) => {
        if (occ++ === i) return `${g1}ar: '${featAr}'`;
        return m;
      }
    );
  });
  writeFileSync(fcPath, fcRaw, "utf-8");
  console.log("Updated FeatureComparison.tsx");

  // 11. Footer.tsx — productLinks, companyLinks, legalLinks labelKey.ar
  const footerPath = join(ROOT, "src/components/layout/Footer.tsx");
  let footerRaw = readFileSync(footerPath, "utf-8");
  const footerLinksMap = {};
  (ara.footerLinks || []).forEach((l) => {
    footerLinksMap[l.to] = l.label;
  });
  for (const [to, label] of Object.entries(footerLinksMap)) {
    const esc = escape(label);
    footerRaw = footerRaw.replace(
      new RegExp(`(to: '${to.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}',\\s*labelKey:\\s*\\{\\s*en:[^,]+,\\s*)ar: '[^']*'`, "g"),
      `$1ar: '${esc}'`
    );
  }
  writeFileSync(footerPath, footerRaw, "utf-8");
  console.log("Updated Footer.tsx");

  // 12. AppSidebar.tsx — appNavItems labelKey.ar
  const sidebarPath = join(ROOT, "src/components/layout/AppSidebar.tsx");
  let sidebarRaw = readFileSync(sidebarPath, "utf-8");
  const sidebarMap = {};
  (ara.appSidebarLinks || []).forEach((l) => {
    sidebarMap[l.href] = l.label;
  });
  for (const [href, label] of Object.entries(sidebarMap)) {
    const esc = escape(label);
    const hrefEsc = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    sidebarRaw = sidebarRaw.replace(
      new RegExp(`(href: '${hrefEsc}',\\s*labelKey:\\s*\\{\\s*en:[^,]+,\\s*)ar: '[^']*'`, "g"),
      `$1ar: '${esc}'`
    );
  }
  writeFileSync(sidebarPath, sidebarRaw, "utf-8");
  console.log("Updated AppSidebar.tsx");

  // 13. AppMoreSheet.tsx — labelKey.ar (sequential by index)
  const moreSheetPath = join(ROOT, "src/components/layout/AppMoreSheet.tsx");
  let moreSheetRaw = readFileSync(moreSheetPath, "utf-8");
  const moreSheetLabels = (ara.appMoreSheetLinks || []).map((l) => escape(l.label || ""));
  let occ = 0;
  moreSheetRaw = moreSheetRaw.replace(
    /(labelKey:\s*\{\s*en:[^,]+,\s*)ar: '[^']*'(?=\s*,?\s*icon:)/g,
    (m, g1) => {
      const idx = occ++;
      const label = moreSheetLabels[idx];
      return label != null ? `${g1}ar: '${label}'` : m;
    }
  );
  writeFileSync(moreSheetPath, moreSheetRaw, "utf-8");
  console.log("Updated AppMoreSheet.tsx");

  // 14. career-dna-questions.ts — add CAREER_FIELD_LABELS for i18n
  const careerFieldsPath = join(ROOT, "src/data/career-dna-questions.ts");
  let careerFieldsRaw = readFileSync(careerFieldsPath, "utf-8");
  const enFields = [
    "Software Engineer", "Data Scientist", "Product Manager", "UX Designer",
    "DevOps Engineer", "Cloud Architect", "Machine Learning Engineer", "Frontend Developer",
    "Backend Developer", "Full Stack Developer", "Cybersecurity Analyst", "Business Analyst",
    "Project Manager", "Marketing Manager", "Sales Manager", "HR Manager", "Student", "Other",
  ];
  const arFields = ara.careerFields || [];
  let addedCareerFieldLabels = false;
  if (arFields.length === enFields.length && !careerFieldsRaw.includes("CAREER_FIELD_LABELS")) {
    const labelEntries = enFields.map((enF, i) => `  '${enF}': { en: '${enF}', ar: '${escape(arFields[i] || enF)}' }`).join(",\n");
    const newExport = `\n/** Career field display labels (value -> { en, ar }) for i18n */\nexport const CAREER_FIELD_LABELS: Record<string, { en: string; ar: string }> = {\n${labelEntries}\n};\n`;
    const insertPos = careerFieldsRaw.indexOf("] as const;");
    careerFieldsRaw = careerFieldsRaw.slice(0, insertPos + 11) + newExport + careerFieldsRaw.slice(insertPos + 11);
    writeFileSync(careerFieldsPath, careerFieldsRaw, "utf-8");
    addedCareerFieldLabels = true;
    console.log("Updated career-dna-questions.ts (added CAREER_FIELD_LABELS)");
  }

  // 10. CareerDNA.tsx — use CAREER_FIELD_LABELS and t() for dropdown
  const careerDnaPath = join(ROOT, "src/pages/CareerDNA.tsx");
  let careerDnaRaw = readFileSync(careerDnaPath, "utf-8");
  if (careerDnaRaw.includes("CAREER_FIELDS.map") && addedCareerFieldLabels) {
    careerDnaRaw = careerDnaRaw.replace(
      "import { CAREER_FIELDS, QUIZ_QUESTIONS } from '@/data/career-dna-questions';",
      "import { CAREER_FIELDS, CAREER_FIELD_LABELS, QUIZ_QUESTIONS } from '@/data/career-dna-questions';"
    );
    careerDnaRaw = careerDnaRaw.replace(
      "{CAREER_FIELDS.map((f) => (\n                            <SelectItem key={f} value={f}>\n                              {f}\n                            </SelectItem>\n                          ))}",
      "{CAREER_FIELDS.map((f) => (\n                            <SelectItem key={f} value={f}>\n                              {language === 'ar' ? (CAREER_FIELD_LABELS[f]?.ar ?? f) : f}\n                            </SelectItem>\n                          ))}"
    );
    writeFileSync(careerDnaPath, careerDnaRaw, "utf-8");
    console.log("Updated CareerDNA.tsx (dropdown i18n)");
  }

  // 15. Legal pages — hero titles, section titles, key points
  const replaceLegalAr = (raw, en, ar) => {
    if (typeof ar !== "string") return raw;
    const enEsc = en.replace(/'/g, "\\'").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const arEsc = escape(ar);
    return raw.replace(
      new RegExp(`(language === 'ar' \\? )'[^']*(?:\\\\'[^']*)*'(?= : '${enEsc}')`, "g"),
      `$1'${arEsc}'`
    );
  };
  const legal = ara.legalPages || {};

  const termsPath = join(ROOT, "src/pages/Terms.tsx");
  let termsRaw = readFileSync(termsPath, "utf-8");
  const termsData = legal.terms || {};
  termsRaw = replaceLegalAr(termsRaw, "Terms of Service", termsData.heroTitle);
  const termsEnTitles = ["1. Acceptance of Terms", "2. Description of Service", "3. User Accounts", "4. Subscriptions and Payments", "5. Acceptable Use", "6. Intellectual Property", "7. Disclaimer", "8. Contact Us"];
  (termsData.sections || []).forEach((s, i) => {
    if (s.title && termsEnTitles[i]) termsRaw = replaceLegalAr(termsRaw, termsEnTitles[i], s.title);
  });
  writeFileSync(termsPath, termsRaw, "utf-8");
  console.log("Updated Terms.tsx");

  const privacyPath = join(ROOT, "src/pages/Privacy.tsx");
  let privacyRaw = readFileSync(privacyPath, "utf-8");
  const privacyData = legal.privacy || {};
  privacyRaw = replaceLegalAr(privacyRaw, "Privacy Policy", privacyData.heroTitle);
  privacyRaw = replaceLegalAr(privacyRaw, "Key Points", "النقاط الرئيسية");
  (privacyData.keyPoints || []).forEach((kp, i) => {
    const enKeys = [
      "We only collect what we need to provide our services",
      "Your data is encrypted and protected",
      "We never sell your data",
      "You can access or delete your data anytime",
    ];
    if (enKeys[i]) privacyRaw = replaceLegalAr(privacyRaw, enKeys[i], kp);
  });
  (privacyData.sections || []).forEach((s) => {
    if (s.title) {
      const enMap = { "info-collect": "1. Information We Collect", "how-use": "2. How We Use Your Information", "data-sharing": "3. Data Sharing", "data-security": "4. Data Security", "your-rights": "5. Your Rights", "cookies": "6. Cookies", "retention": "7. Data Retention", "contact": "8. Contact Us" };
      if (enMap[s.id]) privacyRaw = replaceLegalAr(privacyRaw, enMap[s.id], s.title);
    }
  });
  writeFileSync(privacyPath, privacyRaw, "utf-8");
  console.log("Updated Privacy.tsx");

  const cookiesPath = join(ROOT, "src/pages/Cookies.tsx");
  let cookiesRaw = readFileSync(cookiesPath, "utf-8");
  const cookiesData = legal.cookies || {};
  cookiesRaw = replaceLegalAr(cookiesRaw, "Cookie Policy", cookiesData.heroTitle);
  const cookieEnTitles = ["What Are Cookies?", "Types of Cookies", "Third-Party Cookies", "Managing Cookies", "Contact Us"];
  (cookiesData.sections || []).forEach((s, i) => {
    if (s.title && cookieEnTitles[i]) cookiesRaw = replaceLegalAr(cookiesRaw, cookieEnTitles[i], s.title);
  });
  const cookieTypesAr = cookiesData.cookieTypes || [];
  const enPurposes = ["Authentication and session", "Language preference", "Dark/light mode preference", "Cookie consent preference"];
  cookieTypesAr.forEach((ct, i) => {
    if (ct.purpose && enPurposes[i]) {
      cookiesRaw = cookiesRaw.replace(
        new RegExp(`(purpose: \\{ en: '${enPurposes[i].replace(/'/g, "\\'")}',\\s*)ar: '[^']*'`),
        `$1ar: '${escape(ct.purpose)}'`
      );
    }
  });
  if (cookieTypesAr[0]?.duration) {
    cookiesRaw = cookiesRaw.replace(/(duration: \{ en: 'Session',\s*)ar: '[^']*'/, `$1ar: '${escape(cookieTypesAr[0].duration)}'`);
  }
  const yearDur = cookieTypesAr[1]?.duration || cookieTypesAr[2]?.duration;
  if (yearDur) {
    cookiesRaw = cookiesRaw.replace(/(duration: \{ en: '1 year',\s*)ar: '[^']*'/g, `$1ar: '${escape(yearDur)}'`);
  }
  if (cookieTypesAr.some((ct) => ct.type === "ضروري")) cookiesRaw = replaceLegalAr(cookiesRaw, "Essential", "ضروري");
  if (cookieTypesAr.some((ct) => ct.type === "وظيفي")) cookiesRaw = replaceLegalAr(cookiesRaw, "Functional", "وظيفي");
  writeFileSync(cookiesPath, cookiesRaw, "utf-8");
  console.log("Updated Cookies.tsx");

  console.log("\nDone. Run: npm run build");
}

main();
