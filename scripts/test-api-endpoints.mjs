#!/usr/bin/env node
/**
 * Test API endpoints (unauthenticated + auth behavior).
 * Usage: VITE_API_URL=https://xxx.supabase.co/functions/v1 node scripts/test-api-endpoints.mjs
 * Skips if VITE_API_URL not set.
 */

const base = process.env.VITE_API_URL?.replace(/\/$/, "");
if (!base) {
  console.log("VITE_API_URL not set. Skipping API endpoint tests.");
  process.exit(0);
}

const isSupabase = base.includes("supabase.co/functions");
const apiUrl = isSupabase ? `${base}/api` : base;

function headers(path, token = null) {
  const h = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  if (isSupabase) h["X-Path"] = path.startsWith("/api") ? path : `/api/${path.replace(/^\//, "")}`;
  return h;
}

function url(path) {
  if (isSupabase) return apiUrl;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

async function fetchJson(path, opts = {}) {
  const u = url(path);
  const res = await fetch(u, {
    ...opts,
    headers: { ...headers(path, opts.token), ...(opts.headers || {}) },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

let passed = 0;
let failed = 0;

function ok(name, cond, detail = "") {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}${detail ? ` (${detail})` : ""}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}${detail ? ` – ${detail}` : ""}`);
  }
}

async function run() {
  console.log("\nAPI Endpoint Tests");
  console.log("==================\n");

  // 1. Unauthenticated endpoints – expect 401 for auth-required, 2xx/4xx for public
  console.log("1. Auth-required endpoints return 401 without token:");
  const authPaths = ["/api/profile", "/api/roadmaps", "/api/subscription", "/api/usage"];
  for (const path of authPaths) {
    const { status } = await fetchJson(path, { method: "GET" });
    ok(path, status === 401, `got ${status}`);
  }

  // 2. vapid-public – no auth, should return 200 or 404
  console.log("\n2. Public endpoint vapid-public:");
  const vapid = await fetchJson("/api/vapid-public", { method: "GET" });
  ok("GET /api/vapid-public", vapid.status === 200 || vapid.status === 404, `got ${vapid.status}`);

  // 3. contact – POST with invalid payload = 400
  console.log("\n3. Contact endpoint validation:");
  const contactBad = await fetchJson("/api/contact", {
    method: "POST",
    body: JSON.stringify({ email: "invalid", message: "short" }),
  });
  ok("POST /api/contact (bad payload)", contactBad.status === 400, `got ${contactBad.status}`);

  // 4. newsletter – POST with invalid email = 400
  console.log("\n4. Newsletter endpoint validation:");
  const newsletterBad = await fetchJson("/api/newsletter", {
    method: "POST",
    body: JSON.stringify({ email: "not-an-email" }),
  });
  ok("POST /api/newsletter (bad email)", newsletterBad.status === 400, `got ${newsletterBad.status}`);

  // 5. roadmap/generate-guest – requires valid payload
  console.log("\n5. Guest roadmap (validation):");
  const guestBad = await fetchJson("/api/roadmap/generate-guest", {
    method: "POST",
    body: JSON.stringify({}),
  });
  // May return 400 (validation) or 500 (Gemini/config) – both mean route is reachable
  ok("POST /api/roadmap/generate-guest", guestBad.status >= 400, `got ${guestBad.status}`);

  // 6. Unknown route = 404
  console.log("\n6. Unknown route returns 404:");
  const notFound = await fetchJson("/api/nonexistent-route-xyz", { method: "GET" });
  ok("GET /api/nonexistent-route-xyz", notFound.status === 404, `got ${notFound.status}`);

  // 7. checkout/create – 401 without token
  console.log("\n7. Checkout endpoint requires auth:");
  const checkout = await fetchJson("/api/checkout/create", {
    method: "POST",
    body: JSON.stringify({ productId: "test" }),
  });
  ok("POST /api/checkout/create", checkout.status === 401, `got ${checkout.status}`);

  // 8. community/groups/:id/join – 401 or 500 (not 404; confirms p3/p4 route fix)
  console.log("\n8. Community join route (p3/p4 fix):");
  const join = await fetchJson("/api/community/groups/00000000-0000-0000-0000-000000000000/join", {
    method: "POST",
  });
  ok("POST /api/community/groups/:id/join", join.status !== 404, `got ${join.status} (404=route bug)`);

  console.log("\n---");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("Test run failed:", err);
  process.exit(1);
});
