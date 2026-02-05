#!/usr/bin/env node
/**
 * Verify VITE_HCAPTCHA_SITE_KEY format (no trailing newlines/whitespace).
 * Run from project root. Does not print the key.
 *
 * Usage: node scripts/check-hcaptcha-env.mjs
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";

function parseEnv(content) {
  const out = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const raw = trimmed.slice(eq + 1).trim();
    let value = raw;
    if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
      value = raw.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
    }
    out[key] = value;
  }
  return out;
}

function main() {
  const envFiles = [".env.local", ".env.vercel", ".env"];
  let key = process.env.VITE_HCAPTCHA_SITE_KEY;

  for (const f of envFiles) {
    const p = join(process.cwd(), f);
    if (existsSync(p)) {
      const env = parseEnv(readFileSync(p, "utf8"));
      if (env.VITE_HCAPTCHA_SITE_KEY !== undefined) {
        key = env.VITE_HCAPTCHA_SITE_KEY;
        break;
      }
    }
  }

  if (!key) {
    console.log("VITE_HCAPTCHA_SITE_KEY: not set");
    console.log("  -> Add it to .env or .env.local for local dev");
    console.log("  -> Add it in Vercel Project Settings for production");
    process.exit(1);
  }

  const trimmed = key.trim();
  const hasNewline = key.includes("\n") || key.includes("\r");
  const hasTrailingSpace = key !== trimmed;
  const len = key.length;
  const trimmedLen = trimmed.length;

  if (hasNewline || hasTrailingSpace) {
    console.log("VITE_HCAPTCHA_SITE_KEY: INVALID (has whitespace/newline)");
    console.log(`  Raw length: ${len}, trimmed length: ${trimmedLen}`);
    console.log(`  Trailing/newline chars: ${len - trimmedLen}`);
    console.log("  Fix: Remove any trailing spaces or newlines from the env value");
    console.log("  (AuthCaptcha.tsx now trims at runtime, but fixing the source is better)");
    process.exit(1);
  }

  console.log("VITE_HCAPTCHA_SITE_KEY: OK");
  console.log(`  Length: ${len} chars`);
  process.exit(0);
}

main();
