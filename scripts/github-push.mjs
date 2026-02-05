#!/usr/bin/env node
/**
 * Initialize git (if needed), run security check, and push to GitHub.
 * Creates repo at github.com/<user>/shyftcut if it doesn't exist.
 *
 * Prerequisites:
 *   - GitHub CLI installed and authenticated: gh auth login
 *
 * Usage:
 *   node scripts/github-push.mjs              # create shyftcut repo and push
 *   node scripts/github-push.mjs <org/repo>   # use custom org/repo
 */

import { execSync, spawnSync } from "child_process";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const REPO = process.argv[2] || "shyftcut";

function run(cmd, opts = {}) {
  return execSync(cmd, { encoding: "utf-8", cwd: ROOT, ...opts });
}

function runSpawn(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit", ...opts });
  return r.status;
}

function main() {
  console.log("=== Shyftcut GitHub Push ===\n");

  // 1. Pre-push security check
  console.log("1. Running security check...");
  const checkStatus = runSpawn("node", ["scripts/pre-push-check.mjs"]);
  if (checkStatus !== 0) {
    console.error("\nAborted. Fix security issues first.");
    process.exit(1);
  }

  // 2. Init git if needed
  if (!existsSync(join(ROOT, ".git"))) {
    console.log("2. Initializing git...");
    run("git init");
    run('git branch -M main');
  } else {
    console.log("2. Git already initialized.");
  }

  // 3. Add files and commit if needed
  const status = run("git status --porcelain");
  if (status.trim()) {
    console.log("3. Staging and committing...");
    run("git add -A");
    run('git commit -m "Initial commit: Shyftcut – AI career roadmap platform"');
  } else if (!run("git rev-parse HEAD 2>/dev/null")) {
    console.log("3. No changes to commit.");
  } else {
    console.log("3. Working tree clean.");
  }

  // 4. Create GitHub repo and push
  const remote = run("git remote get-url origin 2>/dev/null")?.trim();
  const targetRepo = REPO.includes("/") ? REPO : `shyftcut/${REPO}`;

  if (!remote) {
    console.log("4. Creating GitHub repo and pushing...");
    const createStatus = runSpawn("gh", [
      "repo", "create", REPO,
      "--public",
      "--source", ".",
      "--remote", "origin",
      "--push",
    ]);
    if (createStatus !== 0) {
      console.error("\nFailed to create/push. Ensure:");
      console.error("  - gh auth login");
      console.error("  - Repo name is available (or use: node scripts/github-push.mjs youruser/shyftcut)");
      process.exit(1);
    }
  } else {
    console.log("4. Pushing to origin...");
    const pushStatus = runSpawn("git", ["push", "-u", "origin", "main"]);
    if (pushStatus !== 0) process.exit(1);
  }

  const url = run("git remote get-url origin 2>/dev/null")?.trim();
  console.log("\n✓ Done. Repo:", url || "github.com/shyftcut/shyftcut");
}

main();
