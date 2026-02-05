#!/usr/bin/env node
/**
 * Create admin user with superadmin role.
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in env.
 *
 * Usage: node scripts/create-admin-user.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const EMAIL = "ni@shyftcut.com";
const PASSWORD = "13579//Al.com";
const DISPLAY_NAME = "Amir";

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

  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find((u) => u.email === EMAIL);

  if (existingUser) {
    console.log("User already exists. Updating to superadmin...");
    const userId = existingUser.id;

    // Update profile with superadmin role
    const { error: profErr } = await supabase
      .from("profiles")
      .update({ display_name: DISPLAY_NAME, role: "superadmin", updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (profErr) {
      console.error("Failed to update profile:", profErr.message);
      process.exit(1);
    }

    // Ensure subscription exists
    const { error: subErr } = await supabase.from("subscriptions").upsert(
      { user_id: userId, tier: "free", status: "active", updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

    if (subErr) {
      console.error("Failed to update subscription:", subErr.message);
      process.exit(1);
    }

    console.log("User updated to superadmin.");
    console.log("\nAdmin credentials:");
    console.log("  Email:", EMAIL);
    console.log("  Password:", PASSWORD);
    console.log("  User ID:", userId);
    process.exit(0);
    return;
  }

  // Create user via Auth Admin API
  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: DISPLAY_NAME },
  });

  if (createError) {
    console.error("Failed to create user:", createError.message);
    process.exit(1);
  }

  const userId = userData?.user?.id;
  if (!userId) {
    console.error("No user ID returned.");
    process.exit(1);
  }

  // Update profile with superadmin role (trigger creates profile, we update it)
  const { error: profErr } = await supabase
    .from("profiles")
    .update({ display_name: DISPLAY_NAME, role: "superadmin", updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (profErr) {
    console.error("Failed to update profile:", profErr.message);
    process.exit(1);
  }

  // Ensure subscription exists
  const { error: subErr } = await supabase.from("subscriptions").upsert(
    { user_id: userId, tier: "free", status: "active", updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );

  if (subErr) {
    console.error("Failed to create subscription:", subErr.message);
    process.exit(1);
  }

  console.log("Admin user created successfully!");
  console.log("\nAdmin credentials:");
  console.log("  Email:", EMAIL);
  console.log("  Password:", PASSWORD);
  console.log("  User ID:", userId);
  console.log("  Role: superadmin");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
