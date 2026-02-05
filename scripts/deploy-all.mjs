#!/usr/bin/env node
/**
 * One-shot: push migrations, set VAPID secrets (if generated), deploy all Edge Functions, deploy frontend.
 * Prerequisites: Supabase project linked (supabase link), Vercel linked, .env or .env.local with required secrets.
 *
 * Usage:
 *   node scripts/deploy-all.mjs
 *   node scripts/deploy-all.mjs --skip-migrations
 *   node scripts/deploy-all.mjs --skip-vercel
 *
 * Optional: Generate VAPID keys first and append to .env:
 *   npx web-push generate-vapid-keys
 *   (add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to .env, then run this script)
 *
 * Or run: npm run supabase:secrets:sync  (after adding VAPID_* and SITE_URL to .env)
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

const skipMigrations = process.argv.includes("--skip-migrations");
const skipVercel = process.argv.includes("--skip-vercel");

const root = join(process.cwd());

function run(cmd, opts = {}) {
  console.log("\n$", cmd);
  try {
    execSync(cmd, { stdio: "inherit", cwd: root, ...opts });
  } catch (e) {
    console.error("Command failed:", cmd);
    process.exit(e.status ?? 1);
  }
}

console.log("=== Deploy All: migrations, secrets (sync), Edge Functions, Vercel ===\n");

if (!skipMigrations) {
  console.log("--- Pushing migrations ---");
  run("npx supabase db push");
}

console.log("\n--- Syncing secrets to Supabase (from .env / .env.local / .env.vercel) ---");
const envFile = existsSync(join(root, ".env.vercel")) ? ".env.vercel" : existsSync(join(root, ".env.local")) ? ".env.local" : ".env";
if (!existsSync(join(root, envFile))) {
  console.warn("No .env file found. Set secrets manually or create .env and run: npm run supabase:secrets:sync");
} else {
  run("npm run supabase:secrets:sync");
}

console.log("\n--- Deploying Edge Functions ---");
const functions = ["api", "webhook-polar", "send-study-reminders", "send-push-reminders", "courses-search"];
for (const fn of functions) {
  const noVerify = fn === "api" || fn === "webhook-polar" ? " --no-verify-jwt" : "";
  run(`npx supabase functions deploy ${fn}${noVerify}`);
}

if (!skipVercel) {
  console.log("\n--- Deploying frontend (Vercel) ---");
  run("npx vercel --prod");
}

console.log("\n=== Done ===");
