#!/usr/bin/env node
/**
 * Remove unused legacy secrets from Vercel.
 * These are old database/auth secrets that are no longer used.
 * 
 * Usage:
 *   node scripts/cleanup-legacy-vercel-secrets.mjs [--dry-run]
 */

import { execSync } from "child_process";

const DRY_RUN = process.argv.includes("--dry-run");

// Legacy secrets that are NOT used in the codebase
const LEGACY_SECRETS_TO_REMOVE = [
  // Database-related (legacy Postgres/Neon)
  "DATABASE_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_URL_NO_SSL",
  "POSTGRES_DATABASE",
  "POSTGRES_HOST",
  "POSTGRES_PASSWORD",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_USER",
  "PGDATABASE",
  "PGHOST",
  "PGHOST_UNPOOLED",
  "PGPASSWORD",
  "PGUSER",
  
  // Neon-related (legacy)
  "NEON_AUTH_BASE_URL",
  "NEON_PROJECT_ID",
  
  // Auth-related (legacy/unused)
  "GOOGLE_CLIENT_ID", // Has VITE_GOOGLE_CLIENT_ID instead
  "GOOGLE_CLIENT_SECRET", // Configured in Supabase Dashboard
  "SUPABASE_JWT_SECRET", // Legacy/optional
  "JWT_SECRET", // Legacy
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
    // If secret doesn't exist, that's fine
    if (error.message.includes("not found") || error.message.includes("Environment Variable was not found")) {
      return true; // Consider it "removed" (already gone)
    }
    console.error(`Failed to remove ${name} from ${env}:`, error.message);
    return false;
  }
}

function main() {
  console.log("=== Legacy Vercel Secrets Cleanup ===\n");
  
  if (DRY_RUN) {
    console.log("🔍 DRY RUN MODE - No changes will be made\n");
  } else {
    console.log("⚠️  LIVE MODE - Legacy secrets will be removed from Vercel\n");
  }
  
  console.log(`Removing ${LEGACY_SECRETS_TO_REMOVE.length} unused legacy secrets from Vercel...\n`);
  
  let removed = 0;
  let failed = 0;
  let notFound = 0;
  
  for (const secret of LEGACY_SECRETS_TO_REMOVE) {
    console.log(`\n📦 ${secret}:`);
    for (const env of ENVIRONMENTS) {
      const success = removeSecret(secret, env);
      if (success) {
        removed++;
        if (!DRY_RUN) {
          // Check if it was actually removed or just didn't exist
          try {
            execSync(`vercel env ls ${secret} ${env}`, { stdio: "pipe" });
          } catch (e) {
            notFound++;
          }
        }
        console.log(`   ✅ ${env}`);
      } else {
        failed++;
        console.log(`   ❌ ${env} (failed)`);
      }
    }
  }
  
  console.log("\n=== Cleanup Summary ===");
  console.log(`✅ Processed: ${removed} secret/environment combinations`);
  if (notFound > 0 && !DRY_RUN) {
    console.log(`ℹ️  Already removed: ${notFound} (didn't exist)`);
  }
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
    console.log("\n2. Run full audit:");
    console.log("   npm run secrets:audit");
  }
  
  console.log();
}

main();
