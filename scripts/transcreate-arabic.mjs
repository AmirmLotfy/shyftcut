#!/usr/bin/env node
/**
 * Transcreate Arabic strings using Gemini API.
 * Reads arabic-sources.json, calls Gemini in batches, outputs translations-ar-transcreated.json.
 *
 * Usage:
 *   node scripts/transcreate-arabic.mjs
 *   node scripts/transcreate-arabic.mjs --dry-run    (no API calls, copy ar as-is)
 *   node scripts/transcreate-arabic.mjs --batch 20   (smaller batches)
 *
 * Requires: GEMINI_API_KEY in .env or .env.local
 * Optional: GEMINI_MODEL (default: gemini-2.0-flash or gemini-1.5-pro)
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "gemini-2.0-flash";
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || "35", 10);
const DRY_RUN = process.argv.includes("--dry-run");

function loadEnv() {
  const envFile =
    process.env.ENV_FILE ||
    (existsSync(join(ROOT, ".env.vercel"))
      ? ".env.vercel"
      : existsSync(join(ROOT, ".env.local"))
        ? ".env.local"
        : ".env");
  const path = join(ROOT, envFile);
  if (!existsSync(path)) return {};
  const content = readFileSync(path, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
    env[key] = val.replace(/\\n/g, "\n");
  }
  return env;
}

async function callGemini(apiKey, model, systemPrompt, userPrompt) {
  const url = `${GEMINI_BASE}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API ${res.status}: ${err}`);
  }
  const json = await res.json();
  const text =
    json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
    json.text?.trim() ||
    "";
  if (!text) throw new Error("Empty Gemini response");
  return text;
}

function parseJsonSafe(text) {
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}") + 1;
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end));
    }
    throw new Error("Could not parse JSON from response");
  }
}

const SYSTEM_PROMPT = `You are a native Arabic copywriter for a career/education app (Shyftcut).
Rewrite the given Arabic strings into natural, human-like Arabic. Do NOT translate literally—transcreate for the Arab market.
- Use Modern Standard Arabic (فصحى عصرية), warm and professional
- Avoid stiff or bureaucratic phrasing (e.g. avoid "يرجى" where a friendlier tone fits)
- Preserve brand terms: Shyftcut, Premium, Career DNA
- Keep placeholders like {{percent}}, {{count}} exactly as-is
- Match tone: encouraging for CTAs, concise for UI labels, warmer for marketing
- Return ONLY valid JSON with the same keys as input, values = rewritten Arabic strings`;

async function transcreateBatch(apiKey, model, batch) {
  const input = {};
  for (const [key, item] of Object.entries(batch)) {
    input[key] = { en: item.en, ar: item.ar };
  }
  const userPrompt = `Rewrite the "ar" values in this JSON. Return the same structure with only the "ar" values replaced by your transcreated Arabic. Keep keys unchanged.\n\n${JSON.stringify(input, null, 0)}`;
  const raw = await callGemini(apiKey, model, SYSTEM_PROMPT, userPrompt);
  const parsed = parseJsonSafe(raw);
  const out = {};
  for (const key of Object.keys(batch)) {
    if (parsed[key]) {
      const v = parsed[key];
      out[key] = typeof v === "string" ? v : v?.ar ?? batch[key].ar;
    } else {
      out[key] = batch[key].ar;
    }
  }
  return out;
}

function chunk(obj, size) {
  const entries = Object.entries(obj);
  const chunks = [];
  for (let i = 0; i < entries.length; i += size) {
    chunks.push(Object.fromEntries(entries.slice(i, i + size)));
  }
  return chunks;
}

async function main() {
  const sourcesPath = join(ROOT, "arabic-sources.json");
  if (!existsSync(sourcesPath)) {
    console.error("Run: node scripts/export-arabic-sources.mjs first");
    process.exit(1);
  }
  const sources = JSON.parse(readFileSync(sourcesPath, "utf8"));

  const env = loadEnv();
  const apiKey = (env.GEMINI_API_KEY || "").trim();
  const model =
    (env.GEMINI_MODEL || "").trim() || DEFAULT_MODEL;

  if (DRY_RUN) {
    console.log("DRY RUN: Copying ar values as-is (no API calls)");
  } else if (!apiKey) {
    console.error("GEMINI_API_KEY required. Set in .env or .env.local");
    process.exit(1);
  }

  const output = {
    languageContext: {},
    testimonials: [],
    plans: { free: {}, premium: {} },
    inlineStrings: {},
  };

  if (DRY_RUN) {
    for (const [k, v] of Object.entries(sources.languageContext || {})) {
      output.languageContext[k] = v.ar;
    }
    output.testimonials = (sources.testimonials || []).map((t) => ({
      quote: { ar: t.quote?.ar ?? "" },
      role: { ar: t.role?.ar ?? "" },
    }));
    output.plans = sources.plans || output.plans;
    for (const [k, v] of Object.entries(sources.inlineStrings || {})) {
      output.inlineStrings[k] = v.ar;
    }
  } else {
    const batches = chunk(sources.languageContext || {}, BATCH_SIZE);
    console.log(`Transcreating ${Object.keys(sources.languageContext || {}).length} languageContext keys in ${batches.length} batches...`);
    for (let i = 0; i < batches.length; i++) {
      const result = await transcreateBatch(apiKey, model, batches[i]);
      Object.assign(output.languageContext, result);
      console.log(`  Batch ${i + 1}/${batches.length} done`);
      if (i < batches.length - 1) await new Promise((r) => setTimeout(r, 800));
    }

    for (const t of sources.testimonials || []) {
      const qBatch = { quote: { en: t.quote?.en ?? "", ar: t.quote?.ar ?? "" } };
      const qRes = await transcreateBatch(apiKey, model, qBatch);
      const rBatch = { role: { en: t.role?.en ?? "", ar: t.role?.ar ?? "" } };
      const rRes = await transcreateBatch(apiKey, model, rBatch);
      output.testimonials.push({
        quote: { ar: qRes.quote || t.quote?.ar },
        role: { ar: rRes.role || t.role?.ar },
      });
      await new Promise((r) => setTimeout(r, 500));
    }
    console.log(`  Testimonials: ${output.testimonials.length} done`);

    const plansEn = {
      free: {
        name: "Free",
        description: "Get started with basic features",
        features: ["1 roadmap (total)", "10 AI chat messages per month", "3 quizzes per month", "1 recommended course per week", "Progress tracking & dashboard", "Email support"],
        ctaKeyAr: "Get Started Free",
      },
      premium: {
        name: "Premium",
        description: "Unlimited roadmaps and AI",
        features: ["Unlimited roadmaps", "Unlimited AI chat", "Unlimited quizzes", "Full course recommendations", "CV analysis (paste or upload)", "Find jobs for me — 10 real jobs weekly", "Progress tracking & analytics", "Email support"],
        ctaKeyAr: "Upgrade Now",
      },
    };
    const plans = sources.plans || {};
    for (const planId of ["free", "premium"]) {
      const p = plans[planId] || {};
      const pe = plansEn[planId] || {};
      const batch = {
        name: { en: pe.name, ar: p.name || "" },
        description: { en: pe.description, ar: p.description || "" },
        ctaKeyAr: { en: pe.ctaKeyAr, ar: p.ctaKeyAr || "" },
      };
      (p.features || []).forEach((f, i) => {
        batch[`f${i}`] = { en: pe.features?.[i] || f, ar: f };
      });
      const res = await transcreateBatch(apiKey, model, batch);
      output.plans[planId] = {
        name: res.name,
        description: res.description,
        ctaKeyAr: res.ctaKeyAr,
        features: (p.features || []).map((_, i) => res[`f${i}`] ?? p.features[i]),
      };
      await new Promise((r) => setTimeout(r, 500));
    }
    console.log("  Plans done");

    for (const [key, item] of Object.entries(sources.inlineStrings || {})) {
      const batch = { [key]: { en: item.en, ar: item.ar } };
      const res = await transcreateBatch(apiKey, model, batch);
      output.inlineStrings[key] = res[key] ?? item.ar;
    }
    console.log("  Inline strings done");
  }

  const outPath = join(ROOT, "translations-ar-transcreated.json");
  writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
  console.log(`\nOutput: ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
