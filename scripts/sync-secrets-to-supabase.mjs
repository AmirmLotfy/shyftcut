#!/usr/bin/env node
/**
 * Sync whitelisted env vars to Supabase Edge Function secrets.
 * Source: .env, .env.local, or ENV_FILE. Run from project root.
 *
 * Usage:
 *   node scripts/sync-secrets-to-supabase.mjs
 *   ENV_FILE=.env.vercel node scripts/sync-secrets-to-supabase.mjs
 *
 * After changing env in Vercel: vercel env pull .env.vercel then npm run supabase:secrets:sync
 * (script prefers .env.vercel when it exists.)
 *
 * Do not commit .env or .env.vercel; use only locally or in CI with masked secrets.
 */

import { readFileSync, writeFileSync, unlinkSync, existsSync } from "fs";
import { execSync } from "child_process";
import { tmpdir } from "os";
import { join } from "path";

const WHITELIST = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_ANON_KEY",
  "RESEND_API_KEY",
  "FROM_EMAIL",
  "CONTACT_TO_EMAIL",
  "POLAR_ACCESS_TOKEN",
  "POLAR_WEBHOOK_SECRET",
  "GEMINI_API_KEY",
  "GEMINI_API_KEY_1",
  "GEMINI_API_KEY_2",
  "GEMINI_API_KEY_3",
  "GEMINI_MODEL",
  "GEMINI_ROADMAP_THINKING_LEVEL",
  "GEMINI_AVATAR_IMAGE_SIZE",
  "GEMINI_ROTATION_MAX_RETRIES",
  "GEMINI_ROTATION_COOLDOWN_BASE_MS",
  "GEMINI_ROTATION_COOLDOWN_MAX_MS",
  "ROADMAP_USE_GROUNDING",
  "COMMUNITY_MODERATION_ENABLED",
  "CORS_ORIGIN",
  "CRON_SECRET",
  "ADMIN_SECRET",
  "VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "SITE_URL",
];

function parseEnv(content) {
  const out = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
    }
    out[key] = value;
  }
  return out;
}

function main() {
  const envFile =
    process.env.ENV_FILE ||
    (existsSync(".env.vercel") ? ".env.vercel" : existsSync(".env.local") ? ".env.local" : ".env");
  if (!existsSync(envFile)) {
    console.error(`Env file not found. Set ENV_FILE or create .env / .env.local (or run: vercel env pull .env.vercel)`);
    process.exit(1);
  }
  const content = readFileSync(envFile, "utf8");
  const env = parseEnv(content);
  const filtered = {};
  for (const key of WHITELIST) {
    if (env[key] !== undefined && env[key] !== "") {
      filtered[key] = env[key];
    }
  }
  if (Object.keys(filtered).length === 0) {
    console.error("No whitelisted keys found in", envFile);
    process.exit(1);
  }
  const tmpPath = join(tmpdir(), `supabase-secrets-${Date.now()}.env`);
  try {
    const lines = Object.entries(filtered).map(([k, v]) => {
      const safe = String(v).replace(/\r?\n/g, " ").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return `${k}="${safe}"`;
    });
    writeFileSync(tmpPath, lines.join("\n") + "\n", "utf8");
    execSync(`supabase secrets set --env-file "${tmpPath}"`, { stdio: "inherit" });
    const pushed = Object.keys(filtered).filter((k) => !k.startsWith("SUPABASE_"));
    const supabaseKeys = Object.keys(filtered).filter((k) => k.startsWith("SUPABASE_"));
    if (pushed.length) console.log("Secrets synced:", pushed.join(", "));
    if (supabaseKeys.length) console.log("(SUPABASE_* are auto-injected in production; CLI may skip them.)");
  } finally {
    try {
      unlinkSync(tmpPath);
    } catch {
      /* ignore */
    }
  }
}

main();
