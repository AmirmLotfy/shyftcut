#!/usr/bin/env node
/**
 * One-shot: push migrations, deploy all Edge Functions, deploy frontend.
 * Prerequisites: Supabase project linked (supabase link), Vercel linked.
 *
 * Secrets are NOT synced during deploy. Set Edge Function secrets manually in
 * Supabase Dashboard (Settings → Edge Functions → Secrets).
 *
 * Usage:
 *   node scripts/deploy-all.mjs
 *   node scripts/deploy-all.mjs --skip-migrations
 *   node scripts/deploy-all.mjs --skip-vercel
 */

import { execSync } from "child_process";
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

console.log("=== Deploy All: migrations, Edge Functions, Vercel ===\n");

if (!skipMigrations) {
  console.log("--- Pushing migrations ---");
  run("npx supabase db push");
}

console.log("\n--- Deploying Edge Functions ---");
const functions = ["api", "webhook-polar", "send-study-reminders", "send-push-reminders", "courses-search"];
for (const fn of functions) {
  const noVerify = fn === "api" || fn === "webhook-polar" ? " --no-verify-jwt" : "";
  run(`npx supabase functions deploy ${fn}${noVerify}`);
}

if (!skipVercel) {
  console.log("\n--- Deploying frontend (Vercel) ---");
  run("npx vercel --prod --force");
}

console.log("\n=== Done ===");
