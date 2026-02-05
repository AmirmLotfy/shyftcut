#!/usr/bin/env node
/**
 * Populate Supabase Vault with anon_key and cron_secret so the weekly jobs cron can call the Edge Function.
 * Reads SUPABASE_DB_URL (or builds from SUPABASE_URL + DB password), SUPABASE_ANON_KEY, CRON_SECRET from env.
 *
 * Usage: node scripts/setup-cron-vault.mjs
 * (Ensure .env or .env.local has SUPABASE_DB_URL, SUPABASE_ANON_KEY, CRON_SECRET; or use ENV_FILE=...)
 */

import postgres from "postgres";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

function loadEnv() {
  const envFile =
    process.env.ENV_FILE ||
    (existsSync(".env.vercel") ? ".env.vercel" : existsSync(".env.local") ? ".env.local" : ".env");
  if (!existsSync(envFile)) {
    console.error("No .env file found. Set ENV_FILE or create .env / .env.local");
    process.exit(1);
  }
  const content = readFileSync(envFile, "utf8");
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
    env[key] = val;
  }
  return env;
}

async function main() {
  const env = loadEnv();
  const dbUrl = env.SUPABASE_DB_URL;
  const anonKey = (env.SUPABASE_ANON_KEY ?? "").trim().replace(/\\n/g, "\n");
  const cronSecret = (env.CRON_SECRET ?? "").trim();

  if (!dbUrl) {
    console.error("SUPABASE_DB_URL is required (e.g. from Supabase Dashboard → Settings → Database → Connection string).");
    process.exit(1);
  }
  if (!anonKey) {
    console.error("SUPABASE_ANON_KEY is required (Supabase Dashboard → Settings → API → anon public).");
    process.exit(1);
  }
  if (!cronSecret) {
    console.error("CRON_SECRET is required. Set it in Edge Function secrets and in .env, then run: node scripts/setup-cron-vault.mjs");
    process.exit(1);
  }

  const sql = postgres(dbUrl, { max: 1 });

  try {
    // Upsert: delete by name if exists (vault may not support ON CONFLICT; names are unique)
    await sql.unsafe(`DELETE FROM vault.secrets WHERE name = 'anon_key'`);
    await sql.unsafe(`DELETE FROM vault.secrets WHERE name = 'cron_secret'`);
    await sql`SELECT vault.create_secret(${anonKey}, 'anon_key')`;
    await sql`SELECT vault.create_secret(${cronSecret}, 'cron_secret')`;
    console.log("Vault secrets created: anon_key, cron_secret. Weekly cron can now call the Edge Function.");
  } catch (err) {
    console.error("Vault setup failed:", err.message);
    if (err.message?.includes("relation \"vault.secrets\" does not exist")) {
      console.error("Enable the Vault extension in Supabase: Dashboard → Database → Extensions → vault.");
    }
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
