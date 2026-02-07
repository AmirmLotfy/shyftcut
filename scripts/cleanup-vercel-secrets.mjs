#!/usr/bin/env node
/**
 * Remove duplicate backend secrets from Vercel.
 * Only removes secrets that are confirmed to be in Supabase.
 * 
 * Usage:
 *   node scripts/cleanup-vercel-secrets.mjs [--dry-run]
 * 
 * Use --dry-run to see what would be removed without actually removing.
 */

import { execSync } from "child_process";

const DRY_RUN = process.argv.includes("--dry-run");

// Secrets that should be removed from Vercel (they're in Supabase)
const SECRETS_TO_REMOVE = [
  "CAREER_DNA_DISCOUNT_ID",
  "CONTACT_TO_EMAIL",
  "FROM_EMAIL",
  "GEMINI_API_KEY",
  "POLAR_ACCESS_TOKEN",
  "POLAR_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "SUPABASE_ANON_KEY",
  "SUPABASE_DB_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_URL",
];

const ENVIRONMENTS = ["production", "preview", "development"];

function removeSecret(name, env) {
  try {
    const cmd = `vercel env rm ${name} ${env} --yes`;
    if (DRY_RUN) {
      console.log(`[DRY RUN] Would run: ${cmd}`);
      return true;
    } else {
      execSync(cmd, { stdio: "inherit" });
      return true;
    }
  } catch (error) {
    console.error(`Failed to remove ${name} from ${env}:`, error.message);
    return false;
  }
}

function main() {
  console.log("=== Vercel Secrets Cleanup ===\n");
  
  if (DRY_RUN) {
    console.log("🔍 DRY RUN MODE - No changes will be made\n");
  } else {
    console.log("⚠️  LIVE MODE - Secrets will be removed from Vercel\n");
  }
  
  console.log(`Removing ${SECRETS_TO_REMOVE.length} duplicate secrets from Vercel...\n`);
  
  let removed = 0;
  let failed = 0;
  
  for (const secret of SECRETS_TO_REMOVE) {
    console.log(`\n📦 ${secret}:`);
    for (const env of ENVIRONMENTS) {
      const success = removeSecret(secret, env);
      if (success) {
        removed++;
        console.log(`   ✅ ${env}`);
      } else {
        failed++;
        console.log(`   ❌ ${env} (failed)`);
      }
    }
  }
  
  console.log("\n=== Cleanup Summary ===");
  console.log(`✅ Removed: ${removed} secret/environment combinations`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed} secret/environment combinations`);
  }
  
  if (DRY_RUN) {
    console.log("\n💡 Run without --dry-run to actually remove these secrets.");
  } else {
    console.log("\n✅ Cleanup complete!");
    console.log("\nNext steps:");
    console.log("1. Verify Vercel only has frontend secrets:");
    console.log("   vercel env ls | grep -E '^\\s+VITE_'");
    console.log("\n2. Verify Supabase has all backend secrets:");
    console.log("   npx supabase secrets list");
    console.log("\n3. Test deployment:");
    console.log("   npm run deploy:all");
  }
  
  console.log();
}

main();
