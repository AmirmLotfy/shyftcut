#!/usr/bin/env node
/**
 * Audit secrets in Vercel and Supabase to find duplicates and conflicts.
 * 
 * Usage:
 *   node scripts/audit-secrets.mjs
 */

import { execSync } from "child_process";
import { existsSync } from "fs";

const FRONTEND_PREFIX = "VITE_";
const BACKEND_SECRETS = [
  "POLAR_ACCESS_TOKEN",
  "POLAR_WEBHOOK_SECRET",
  "GEMINI_API_KEY",
  "GEMINI_API_KEY_1",
  "GEMINI_API_KEY_2",
  "GEMINI_API_KEY_3",
  "RESEND_API_KEY",
  "FROM_EMAIL",
  "CONTACT_TO_EMAIL",
  "CAREER_DNA_DISCOUNT_ID",
  "CRON_SECRET",
  "ADMIN_SECRET",
  "VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "CORS_ORIGIN",
  "SITE_URL",
];

const AUTO_INJECTED = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_DB_URL",
];

function getVercelSecrets() {
  try {
    const output = execSync("vercel env ls", { encoding: "utf8", stdio: "pipe" });
    const lines = output.split("\n");
    const secrets = new Set();
    
    for (const line of lines) {
      const match = line.match(/^\s+([A-Z_][A-Z0-9_]*)\s+/);
      if (match) {
        secrets.add(match[1]);
      }
    }
    
    return Array.from(secrets).sort();
  } catch (error) {
    console.error("Failed to get Vercel secrets:", error.message);
    return [];
  }
}

function getSupabaseSecrets() {
  try {
    const output = execSync("npx supabase secrets list", { encoding: "utf8", stdio: "pipe" });
    const lines = output.split("\n");
    const secrets = new Set();
    
    for (const line of lines) {
      const match = line.match(/^\s+([A-Z_][A-Z0-9_]*)\s+\|/);
      if (match) {
        secrets.add(match[1]);
      }
    }
    
    return Array.from(secrets).sort();
  } catch (error) {
    console.error("Failed to get Supabase secrets:", error.message);
    return [];
  }
}

function main() {
  console.log("=== Secrets Audit ===\n");
  
  const vercelSecrets = getVercelSecrets();
  const supabaseSecrets = getSupabaseSecrets();
  
  console.log(`Vercel secrets found: ${vercelSecrets.length}`);
  console.log(`Supabase secrets found: ${supabaseSecrets.length}\n`);
  
  // Categorize Vercel secrets
  const vercelFrontend = vercelSecrets.filter(s => s.startsWith(FRONTEND_PREFIX));
  const vercelBackend = vercelSecrets.filter(s => !s.startsWith(FRONTEND_PREFIX));
  
  console.log("📦 VERCEL SECRETS:");
  console.log(`  ✅ Frontend (VITE_*): ${vercelFrontend.length}`);
  vercelFrontend.forEach(s => console.log(`     - ${s}`));
  
  console.log(`\n  ❌ Backend (should NOT be here): ${vercelBackend.length}`);
  vercelBackend.forEach(s => {
    const shouldRemove = BACKEND_SECRETS.includes(s) || AUTO_INJECTED.includes(s);
    console.log(`     - ${s} ${shouldRemove ? "⚠️  REMOVE" : "?"}`);
  });
  
  console.log("\n📦 SUPABASE SECRETS:");
  console.log(`  ✅ Backend secrets: ${supabaseSecrets.length}`);
  supabaseSecrets.forEach(s => {
    const isAutoInjected = AUTO_INJECTED.includes(s);
    console.log(`     - ${s} ${isAutoInjected ? "(auto-injected)" : ""}`);
  });
  
  // Find duplicates
  const duplicates = vercelBackend.filter(s => supabaseSecrets.includes(s));
  
  console.log("\n⚠️  DUPLICATES FOUND:");
  if (duplicates.length === 0) {
    console.log("  ✅ No duplicates!");
  } else {
    console.log(`  ❌ ${duplicates.length} secrets found in BOTH Vercel and Supabase:`);
    duplicates.forEach(s => {
      console.log(`     - ${s}`);
    });
  }
  
  // Find conflicts (backend secrets in Vercel)
  const conflicts = vercelBackend.filter(s => BACKEND_SECRETS.includes(s) || AUTO_INJECTED.includes(s));
  
  console.log("\n🚨 CONFLICTS (Backend secrets in Vercel):");
  if (conflicts.length === 0) {
    console.log("  ✅ No conflicts!");
  } else {
    console.log(`  ❌ ${conflicts.length} backend secrets incorrectly in Vercel:`);
    conflicts.forEach(s => {
      console.log(`     - ${s} (remove from Vercel)`);
    });
  }
  
  // Recommendations
  console.log("\n📋 RECOMMENDATIONS:");
  
  if (conflicts.length > 0) {
    console.log("\n1. Remove backend secrets from Vercel:");
    conflicts.forEach(s => {
      console.log(`   vercel env rm ${s} production preview development`);
    });
  }
  
  console.log("\n2. Verify Vercel only has frontend secrets:");
  console.log("   vercel env ls | grep -E '^\\s+VITE_'");
  
  console.log("\n3. Verify Supabase has all backend secrets:");
  console.log("   npx supabase secrets list");
  
  console.log("\n4. After cleanup, test deployment:");
  console.log("   npm run deploy:all");
  
  console.log("\n=== Audit Complete ===\n");
}

main();
