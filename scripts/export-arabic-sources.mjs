#!/usr/bin/env node
/**
 * Export all Arabic source strings (and English sources) for transcreation.
 * Outputs arabic-sources.json used by transcreate-arabic.mjs.
 *
 * Usage: node scripts/export-arabic-sources.mjs
 * Output: arabic-sources.json (project root)
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function parseTranslationsBlock(content, blockName) {
  const re = new RegExp(
    `${blockName}:\\s*\\{([^}]*(?:\\{[^}]*\\}[^}]*)*)\\}`,
    "s"
  );
  const match = content.match(re);
  if (!match) return {};
  const block = match[1];
  const result = {};
  const lineRe = /^\s*['"]([^'"]+)['"]\s*:\s*['"`](.*?)['"`]\s*,?\s*(?:\/\/.*)?$/gm;
  let m;
  while ((m = lineRe.exec(block)) !== null) {
    const key = m[1];
    let value = m[2].replace(/\\'/g, "'").replace(/\\"/g, '"');
    if (value.includes("${")) continue;
    result[key] = value;
  }
  return result;
}

function extractTranslations(content) {
  const en = parseTranslationsBlock(content, "en");
  const ar = parseTranslationsBlock(content, "ar");
  const out = {};
  for (const key of Object.keys(ar)) {
    if (en[key]) out[key] = { en: en[key], ar: ar[key] };
  }
  return out;
}

function extractTranslationsRegex(content) {
  const en = {};
  const ar = {};
  const keyValueRe = /^\s*['"]([^'"]+)['"]\s*:\s*['"`]((?:[^'"`\\]|\\.)*)['"`]\s*,?\s*$/gm;

  let inEn = false;
  let inAr = false;
  let depth = 0;
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/^\s*en:\s*\{/)) {
      inEn = true;
      inAr = false;
      depth = 1;
      continue;
    }
    if (line.match(/^\s*ar:\s*\{/)) {
      inAr = true;
      inEn = false;
      depth = 1;
      continue;
    }
    if (inEn || inAr) {
      if (line.includes("{")) depth += (line.match(/\{/g) || []).length;
      if (line.includes("}")) depth -= (line.match(/\}/g) || []).length;
      if (depth <= 0) {
        inEn = false;
        inAr = false;
        depth = 0;
        continue;
      }
      const m = line.match(/^\s*['"]([^'"]+)['"]\s*:\s*['"`]((?:[^'"`\\]|\\.)*)['"`]\s*,?\s*$/);
      if (m) {
        const key = m[1];
        let value = m[2].replace(/\\'/g, "'").replace(/\\"/g, '"');
        if (!value.includes("${")) {
          if (inEn) en[key] = value;
          if (inAr) ar[key] = value;
        }
      }
    }
  }

  const out = {};
  for (const key of Object.keys(ar)) {
    if (en[key]) out[key] = { en: en[key], ar: ar[key] };
  }
  return out;
}

function main() {
  const langCtxPath = join(ROOT, "src/contexts/LanguageContext.tsx");
  const langCtx = readFileSync(langCtxPath, "utf-8");
  const languageContext = extractTranslationsRegex(langCtx);

  const testimonialsPath = join(ROOT, "src/data/testimonials.ts");
  const testimonialsRaw = readFileSync(testimonialsPath, "utf-8");
  const testimonials = [];
  const testimonialBlocks = testimonialsRaw.split(/quote:\s*\{/).slice(1);
  for (const blk of testimonialBlocks) {
    const enMatch = blk.match(/en:\s*['"`]([^'"`]*(?:\\.[^'"`]*)*)['"`]/);
    const arMatch = blk.match(/ar:\s*['"`]([^'"`]*(?:\\.[^'"`]*)*)['"`]/);
    const roleEn = blk.match(/role:\s*\{\s*en:\s*['"`]([^'"`]*)['"`]/);
    const roleAr = blk.match(/ar:\s*['"`]([^'"`]*)['"`]\s*\}\s*,?\s*rating/);
    if (enMatch && arMatch) {
      testimonials.push({
        quote: { en: enMatch[1].replace(/\\'/g, "'"), ar: arMatch[1].replace(/\\'/g, "'") },
      });
    }
    if (roleEn) {
      const idx = testimonials.length - 1;
      if (idx >= 0 && !testimonials[idx].role) {
        const roleArMatch = blk.match(/role:\s*\{\s*en:[^,]+,\s*ar:\s*['"`]([^'"`]*)['"`]\s*\}/);
        testimonials[idx].role = {
          en: roleEn[1].replace(/\\'/g, "'"),
          ar: roleArMatch ? roleArMatch[1].replace(/\\'/g, "'") : "",
        };
      }
    }
  }

  const testimonials2 = [];
  const quoteRoleRe = /quote:\s*\{\s*en:\s*'([^']*(?:\\'[^']*)*)',\s*ar:\s*'([^']*(?:\\'[^']*)*)'\s*\}[^}]*role:\s*\{\s*en:\s*'([^']*)',\s*ar:\s*'([^']*(?:\\'[^']*)*)'\s*\}/g;
  let mm;
  while ((mm = quoteRoleRe.exec(testimonialsRaw)) !== null) {
    testimonials2.push({
      quote: { en: mm[1].replace(/\\'/g, "'"), ar: mm[2].replace(/\\'/g, "'") },
      role: { en: mm[3].replace(/\\'/g, "'"), ar: mm[4].replace(/\\'/g, "'") },
    });
  }

  const pricingPath = join(ROOT, "src/pages/Pricing.tsx");
  const pricingRaw = readFileSync(pricingPath, "utf-8");
  const plansArMatch = pricingRaw.match(/ar:\s*\[\s*\{[\s\S]*?id:\s*'free'[\s\S]*?\},[\s\S]*?id:\s*'premium'[\s\S]*?\}\s*\]\s*\}/);
  const plansAr = { free: {}, premium: {} };
  const freeFeaturesAr = pricingRaw.match(/ar:\s*\[[^[]*id:\s*'free'[\s\S]*?features:\s*\[([\s\S]*?)\]/);
  const premiumFeaturesAr = pricingRaw.match(/id:\s*'premium'[\s\S]*?features:\s*\[([\s\S]*?)\]/);
  function extractArStrings(str) {
    if (!str) return [];
    return [...str.matchAll(/'([^']*(?:\\'[^']*)*)'/g)].map((m) => m[1].replace(/\\'/g, "'"));
  }
  const plansArBlock = pricingRaw.match(/ar:\s*\[\s*\{[\s\S]*?\},[\s\S]*?\}\s*\]/);
  const plans = {
    free: {
      name: "مجاني",
      description: "ابدأ مع المميزات الأساسية",
      features: [
        "خريطة طريق واحدة (إجمالي)",
        "10 رسائل دردشة ذكاء اصطناعي شهرياً",
        "3 اختبارات شهرياً",
        "دورة موصى بها واحدة أسبوعياً",
        "تتبع التقدم ولوحة التحكم",
        "دعم البريد الإلكتروني",
      ],
      ctaKeyAr: "ابدأ مجاناً",
    },
    premium: {
      name: "بريميوم",
      description: "خرائط طريق وذكاء اصطناعي غير محدود",
      features: [
        "خرائط طريق غير محدودة",
        "دردشة ذكاء اصطناعي غير محدودة",
        "اختبارات غير محدودة",
        "توصيات دورات كاملة",
        "تحليل السيرة الذاتية (لصق أو رفع)",
        "اعثر على وظائف لي — 10 وظائف حقيقية أسبوعياً",
        "تتبع التقدم والتحليلات",
        "دعم البريد الإلكتروني",
      ],
      ctaKeyAr: "ترقية الآن",
    },
  };

  const blogPath = join(ROOT, "src/data/blog-posts.ts");
  const blogRaw = readFileSync(blogPath, "utf-8");
  const blogArBodies = [];
  const arBlockRe = /ar:\s*`([^`]*(?:\\.[^`]*)*)`/g;
  let blogM;
  while ((blogM = arBlockRe.exec(blogRaw)) !== null) {
    if (blogM[1].length > 100) blogArBodies.push(blogM[1]);
  }

  const inlineStrings = {
    "landing.heroTagline": {
      en: "From confusion to a clear 12-week path—in 90 seconds.",
      ar: "من ارتباك إلى مسار واضح لـ ١٢ أسبوعاً — في ٩٠ ثانية.",
    },
    "pricing.choosePlan": { en: "Choose your plan", ar: "اختر خطتك" },
    "pricing.planDesc": {
      en: "Start free or upgrade to Premium for unlimited roadmaps.",
      ar: "ابدأ مجاناً أو انتقل إلى بريميوم لخرائط غير محدودة.",
    },
    "pricing.viewPlans": { en: "View plans", ar: "عرض الخطط" },
    "blog.fromBlog": { en: "From the Blog", ar: "من المدونة" },
    "blog.allPosts": { en: "All posts", ar: "جميع المقالات" },
    "cta.readyTitle": {
      en: "Ready to Transform Your Career?",
      ar: "جاهز لتحويل مسارك المهني؟",
    },
    "cta.readyDesc": {
      en: "Join thousands of professionals who found their career clarity with Shyftcut.",
      ar: "انضم إلى آلاف المحترفين الذين وجدوا وضوحهم المهني مع Shyftcut.",
    },
    "cta.startFree": { en: "Start free • Cancel anytime", ar: "ابدأ مجاناً • إلغاء في أي وقت" },
    "mobile.poweredBy": { en: "Powered by Gemini", ar: "مدعوم بـ Gemini" },
    "mobile.langSwitch": { en: "English", ar: "العربية" },
    "nav.upgrade": { en: "Upgrade", ar: "ترقية" },
  };

  const output = {
    languageContext,
    testimonials: testimonials2.length ? testimonials2 : testimonials,
    plans,
    blogArBodies: blogArBodies.slice(0, 5),
    inlineStrings,
  };

  const outPath = join(ROOT, "arabic-sources.json");
  writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
  console.log(`Exported to ${outPath}`);
  console.log(`  languageContext: ${Object.keys(languageContext).length} keys`);
  console.log(`  testimonials: ${output.testimonials.length}`);
  console.log(`  plans: 2 plans with features`);
  console.log(`  blogArBodies: ${output.blogArBodies.length}`);
  console.log(`  inlineStrings: ${Object.keys(inlineStrings).length}`);
}

main();
