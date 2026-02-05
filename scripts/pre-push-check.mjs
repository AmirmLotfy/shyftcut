#!/usr/bin/env node
/**
 * Pre-push security check. Ensures no secrets are staged/committed.
 * Run before: git push
 * Usage: node scripts/pre-push-check.mjs
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const SECRET_PATTERNS = [
  /VITE_SUPABASE_ANON_KEY=.+[^=]\s*$/m,
  /SUPABASE_SERVICE_ROLE_KEY=.+/m,
  /GEMINI_API_KEY=.+/m,
  /POLAR_ACCESS_TOKEN=.+/m,
  /POLAR_WEBHOOK_SECRET=.+/m,
  /RESEND_API_KEY=.+/m,
  /GOOGLE_CLIENT_SECRET=.+/m,
  /PGPASSWORD=.+/m,
  /POSTGRES_PASSWORD=.+/m,
  /VAPID_PRIVATE_KEY=.+/m,
  /sk-[a-zA-Z0-9]{20,}/,
  /ghp_[a-zA-Z0-9]{36}/,
  /AIza[SY][a-zA-Z0-9_-]{35}/,
];

const IGNORED_FILES = [".env.example", "pre-push-check.mjs"];

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: "utf-8", cwd: ROOT, ...opts });
  } catch (e) {
    return null;
  }
}

function getStagedAndTrackedFiles() {
  const staged = run("git diff --cached --name-only")?.trim().split("\n").filter(Boolean) || [];
  const tracked = run("git ls-files")?.trim().split("\n").filter(Boolean) || [];
  return [...new Set([...staged, ...tracked])];
}

function checkFile(filePath) {
  const fullPath = join(ROOT, filePath);
  if (!existsSync(fullPath)) return [];
  const content = readFileSync(fullPath, "utf-8");
  const issues = [];
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(content)) {
      issues.push(`Secret pattern matched in ${filePath}`);
    }
  }
  return issues;
}

function main() {
  const isGit = run("git rev-parse --git-dir");
  if (!isGit) {
    console.log("Not a git repo. Skipping pre-push check.");
    process.exit(0);
  }

  const files = getStagedAndTrackedFiles();
  const envLike = files.filter((f) => f.match(/\.env(\.|$)/) && !f.endsWith(".example"));
  if (envLike.length > 0) {
    console.error("\n❌ BLOCKED: .env files must not be committed:");
    envLike.forEach((f) => console.error(`   ${f}`));
    process.exit(1);
  }

  const SKIP_PATHS = ["docs/"];
  let hasIssues = false;
  for (const f of files) {
    if (IGNORED_FILES.some((ig) => f.includes(ig))) continue;
    if (SKIP_PATHS.some((p) => f.startsWith(p) || f.includes(p))) continue;
    const issues = checkFile(f);
    if (issues.length > 0) {
      console.error("\n❌ Potential secrets detected:");
      issues.forEach((m) => console.error(`   ${m}`));
      hasIssues = true;
    }
  }

  if (hasIssues) {
    console.error("\nRemove secrets before pushing.\n");
    process.exit(1);
  }

  console.log("✓ Pre-push check passed. No secrets detected.");
}

main();
