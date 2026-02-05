#!/usr/bin/env node
/**
 * Add Gemini Team as a Premium test user.
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in env.
 *
 * Usage: node scripts/add-gemini-test-user.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const EMAIL = "gemini@shyftcut.com";
// Use GEMINI_TEST_PASSWORD env var to avoid committing credentials. Fallback for local dev only.
const PASSWORD = process.env.GEMINI_TEST_PASSWORD || "Gemini3@devpost.com";
const DISPLAY_NAME = "Gemini Team";

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
    env[key] = val.replace(/\\n/g, "\n");
  }
  return env;
}

async function main() {
  const env = loadEnv();
  const url = (env.SUPABASE_URL ?? "").trim();
  const serviceKey = (env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

  if (!url || !serviceKey) {
    console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  // Create user via Auth Admin API
  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: DISPLAY_NAME },
  });

  if (createError) {
    if (createError.message?.includes("already been registered") || createError.message?.includes("already exists")) {
      console.log("User already exists. Signing in to update to Premium...");
      const { data: signIn } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
      const userId = signIn?.user?.id;
      if (!userId) {
        console.error("Could not sign in. Wrong password or user not found.");
        process.exit(1);
      }
      await supabase.from("profiles").update({ display_name: DISPLAY_NAME, updated_at: new Date().toISOString() }).eq("user_id", userId);
      const { error: subErr } = await supabase.from("subscriptions").update({ tier: "premium", status: "active", updated_at: new Date().toISOString() }).eq("user_id", userId);
      if (subErr) {
        console.error("Failed to update subscription:", subErr.message);
        process.exit(1);
      }
      console.log("User updated to Premium.");
      console.log("\nTest credentials:");
      console.log("  Email:", EMAIL);
      console.log("  Password:", PASSWORD);
      process.exit(0);
      return;
    }
    console.error("Failed to create user:", createError.message);
    process.exit(1);
  }

  const userId = userData?.user?.id;
  if (!userId) {
    console.error("No user ID returned.");
    process.exit(1);
  }

  // Trigger creates profile + free subscription. Update to premium.
  const { error: profErr } = await supabase
    .from("profiles")
    .update({ display_name: DISPLAY_NAME, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (profErr) console.warn("Profile update warning:", profErr.message);

  const { error: subErr } = await supabase
    .from("subscriptions")
    .update({ tier: "premium", status: "active", updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (subErr) {
    console.error("Failed to set Premium:", subErr.message);
    process.exit(1);
  }

  console.log("Gemini Team user created and set to Premium.");
  console.log("\nTest credentials:");
  console.log("  Email:", EMAIL);
  console.log("  Password:", PASSWORD);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
