#!/usr/bin/env node
/**
 * Test subscription flow: API endpoints, validation, responses.
 * Usage: VITE_API_URL=https://xxx.supabase.co/functions/v1 node scripts/test-subscription-flow.mjs
 * Optional: E2E_TEST_EMAIL, E2E_TEST_PASSWORD for authenticated tests (login first to get token).
 */

const base = process.env.VITE_API_URL?.replace(/\/$/, "");
if (!base) {
  console.log("VITE_API_URL not set. Skipping subscription flow tests.");
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
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
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
  console.log("\nSubscription Flow Tests");
  console.log("========================\n");

  // 1. Subscription – requires auth
  console.log("1. GET /api/subscription (no auth):");
  const subNoAuth = await fetchJson("/api/subscription", { method: "GET" });
  ok("Returns 401", subNoAuth.status === 401, `got ${subNoAuth.status}`);

  // 2. Checkout create – requires auth
  console.log("\n2. POST /api/checkout/create (no auth):");
  const createNoAuth = await fetchJson("/api/checkout/create", {
    method: "POST",
    body: JSON.stringify({ productId: "fb08648d-d92f-4fc9-bb76-f43df88991b4" }),
  });
  ok("Returns 401", createNoAuth.status === 401, `got ${createNoAuth.status}`);

  // 3. Checkout create – 400 without productId
  console.log("\n3. POST /api/checkout/create (invalid payload, with token would need real JWT):");
  const createBad = await fetchJson("/api/checkout/create", {
    method: "POST",
    body: JSON.stringify({}),
  });
  ok("Returns 401 (auth first) or 400", createBad.status === 401 || createBad.status === 400, `got ${createBad.status}`);

  // 4. Checkout portal – requires auth
  console.log("\n4. GET /api/checkout/portal (no auth):");
  const portalNoAuth = await fetchJson("/api/checkout/portal", { method: "GET" });
  ok("Returns 401", portalNoAuth.status === 401, `got ${portalNoAuth.status}`);

  // 5. Method validation (auth checked first, so 401 is acceptable without token)
  console.log("\n5. Method validation (auth required before method check):");
  const createGet = await fetchJson("/api/checkout/create", { method: "GET" });
  ok("GET /api/checkout/create returns 401 or 405", createGet.status === 401 || createGet.status === 405, `got ${createGet.status}`);

  const subPost = await fetchJson("/api/subscription", {
    method: "POST",
    body: JSON.stringify({}),
  });
  ok("POST /api/subscription returns 401 or 405", subPost.status === 401 || subPost.status === 405, `got ${subPost.status}`);

  // 7. Usage – requires auth (uses subscription for limits)
  console.log("\n6. GET /api/usage (no auth):");
  const usageNoAuth = await fetchJson("/api/usage", { method: "GET" });
  ok("Returns 401", usageNoAuth.status === 401, `got ${usageNoAuth.status}`);

  console.log("\n---");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("Test run failed:", err);
  process.exit(1);
});
