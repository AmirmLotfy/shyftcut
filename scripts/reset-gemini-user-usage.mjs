#!/usr/bin/env node
/**
 * Reset usage counts for Gemini Team test user.
 * Deletes: avatar_generations, chat_history, quiz_results, ai_suggest_calls, notes, tasks
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in env.
 *
 * Usage: node scripts/reset-gemini-user-usage.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const EMAIL = "gemini@shyftcut.com";

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

  // Find user by email
  const { data: authUsers, error: findError } = await supabase.auth.admin.listUsers();
  if (findError) {
    console.error("Failed to list users:", findError.message);
    process.exit(1);
  }

  const user = authUsers.users.find((u) => u.email === EMAIL);
  if (!user) {
    console.error(`User with email ${EMAIL} not found.`);
    process.exit(1);
  }

  const userId = user.id;
  console.log(`Found user: ${EMAIL} (${userId})`);
  console.log("Resetting usage counts...\n");

  // Delete avatar generations
  const { error: avatarErr, count: avatarCount } = await supabase
    .from("avatar_generations")
    .delete()
    .eq("user_id", userId)
    .select("*", { count: "exact", head: true });
  if (avatarErr) {
    console.error("Failed to delete avatar_generations:", avatarErr.message);
  } else {
    console.log(`✓ Deleted ${avatarCount ?? 0} avatar generation(s)`);
  }

  // Delete chat history
  const { error: chatErr, count: chatCount } = await supabase
    .from("chat_history")
    .delete()
    .eq("user_id", userId)
    .select("*", { count: "exact", head: true });
  if (chatErr) {
    console.error("Failed to delete chat_history:", chatErr.message);
  } else {
    console.log(`✓ Deleted ${chatCount ?? 0} chat message(s)`);
  }

  // Delete quiz results
  const { error: quizErr, count: quizCount } = await supabase
    .from("quiz_results")
    .delete()
    .eq("user_id", userId)
    .select("*", { count: "exact", head: true });
  if (quizErr) {
    console.error("Failed to delete quiz_results:", quizErr.message);
  } else {
    console.log(`✓ Deleted ${quizCount ?? 0} quiz result(s)`);
  }

  // Delete AI suggest calls
  const { error: aiErr, count: aiCount } = await supabase
    .from("ai_suggest_calls")
    .delete()
    .eq("user_id", userId)
    .select("*", { count: "exact", head: true });
  if (aiErr) {
    console.error("Failed to delete ai_suggest_calls:", aiErr.message);
  } else {
    console.log(`✓ Deleted ${aiCount ?? 0} AI suggestion call(s)`);
  }

  // Delete notes
  const { error: notesErr, count: notesCount } = await supabase
    .from("notes")
    .delete()
    .eq("user_id", userId)
    .select("*", { count: "exact", head: true });
  if (notesErr) {
    console.error("Failed to delete notes:", notesErr.message);
  } else {
    console.log(`✓ Deleted ${notesCount ?? 0} note(s)`);
  }

  // Delete tasks
  const { error: tasksErr, count: tasksCount } = await supabase
    .from("tasks")
    .delete()
    .eq("user_id", userId)
    .select("*", { count: "exact", head: true });
  if (tasksErr) {
    console.error("Failed to delete tasks:", tasksErr.message);
  } else {
    console.log(`✓ Deleted ${tasksCount ?? 0} task(s)`);
  }

  console.log("\n✓ Usage reset complete for Gemini Team user!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
