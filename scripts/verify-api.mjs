#!/usr/bin/env node
/**
 * Verify the API Edge Function is deployed and responding.
 * Usage: node scripts/verify-api.mjs
 * Requires VITE_API_URL in .env (or .env.local) pointing to Supabase functions base.
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";

function loadEnv() {
  const out = { apiUrl: "", anonKey: "" };
  for (const f of [".env.local", ".env"]) {
    const p = join(process.cwd(), f);
    if (existsSync(p)) {
      const content = readFileSync(p, "utf8");
      for (const line of content.split("\n")) {
        const m1 = line.match(/^VITE_API_URL=(.+)$/);
        if (m1) out.apiUrl = m1[1].trim().replace(/\/$/, "");
        const m2 = line.match(/^VITE_SUPABASE_ANON_KEY=(.+)$/);
        if (m2) out.anonKey = m2[1].trim();
      }
    }
  }
  out.apiUrl = out.apiUrl || process.env.VITE_API_URL || "";
  out.anonKey = out.anonKey || process.env.VITE_SUPABASE_ANON_KEY || "";
  return out;
}

async function main() {
  const { apiUrl: base, anonKey } = loadEnv();
  if (!base) {
    console.error("VITE_API_URL not set. Add it to .env or .env.local");
    process.exit(1);
  }
  const healthUrl = base + "/api";
  console.log("Checking API at:", healthUrl);
  const headers = { "Content-Type": "application/json", "X-Path": "/api/health" };
  if (anonKey) {
    headers["apikey"] = anonKey;
    headers["Authorization"] = "Bearer " + anonKey;
  }
  try {
    const res = await fetch(healthUrl, {
      method: "GET",
      headers,
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      console.log("OK: API is deployed and responding.", data);
      return;
    }
    console.error("API returned", res.status, res.statusText);
    const text = await res.text();
    if (text) console.error("Response:", text.slice(0, 300));
    process.exit(1);
  } catch (err) {
    console.error("Failed to reach API:", err.message);
    console.error("\nDeploy the API with:");
    console.error("  npx supabase functions deploy api --no-verify-jwt");
    console.error("\nOr run full deploy:");
    console.error("  npm run deploy:all");
    process.exit(1);
  }
}
main();
