#!/usr/bin/env node
/**
 * Test roadmap generation and course URL finding.
 * Usage: VITE_API_URL=https://xxx.supabase.co/functions/v1 SUPABASE_ANON_KEY=xxx node scripts/test-course-links.mjs
 */

const base = process.env.VITE_API_URL?.replace(/\/$/, "");
const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

if (!base || !anonKey) {
  console.error("Set VITE_API_URL and SUPABASE_ANON_KEY (or VITE_SUPABASE_ANON_KEY)");
  process.exit(1);
}

const isSupabase = base.includes("supabase.co/functions");
const apiBase = isSupabase ? `${base}/api` : base;
const coursesSearchUrl = `${base}/courses-search`;

function headers(path, extra = {}) {
  const h = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${anonKey}`,
    ...extra,
  };
  if (isSupabase && path) h["X-Path"] = path.startsWith("/api") ? path : `/api${path.startsWith("/") ? path : "/" + path}`;
  return h;
}

function apiUrl(path) {
  return isSupabase ? apiBase : `${base}${path.startsWith("/") ? path : "/" + path}`;
}

const ALLOWED_HOSTS = [
  "udemy.com", "coursera.org", "linkedin.com", "youtube.com", "pluralsight.com", "skillshare.com",
  "edx.org", "futurelearn.com", "khanacademy.org", "codecademy.com", "datacamp.com",
  "freecodecamp.org", "masterclass.com", "cloudskillsboost.google", "learn.microsoft.com", "aws.amazon.com",
];

function isAllowedHost(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return ALLOWED_HOSTS.some((h) => host === h || host.endsWith("." + h));
  } catch {
    return false;
  }
}

function isValidCourseUrl(url) {
  if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) return false;
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/+$/, "") || "/";
    return path !== "/" && path.length > 1;
  } catch {
    return false;
  }
}

async function main() {
  console.log("\n=== Course Links & Roadmap Test ===\n");
  console.log("API base:", apiBase);
  console.log("courses-search:", coursesSearchUrl);

  // 1. Test courses-search directly
  console.log("\n1. Testing courses-search (Udemy, Python)...");
  const csRes = await fetch(coursesSearchUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
    body: JSON.stringify({ platform: "Udemy", query: "Python programming beginner", language: "en" }),
  });
  const csData = await csRes.json().catch(() => ({}));
  const csOk = csRes.ok && (csData.url || csData.error);
  console.log("   Status:", csRes.status, csOk ? "OK" : "FAIL");
  if (csData.url) {
    const valid = isValidCourseUrl(csData.url) && isAllowedHost(csData.url);
    console.log("   URL:", csData.url);
    console.log("   Valid & allowed:", valid ? "YES" : "NO");
    if (!valid && csData.url) {
      console.log("   -> URL would be rejected by allowed-hosts filter");
    }
  } else if (csData.error) {
    console.log("   Error:", csData.error);
  }

  // 2. Test courses-search for YouTube
  console.log("\n2. Testing courses-search (YouTube, React tutorial)...");
  const cs2Res = await fetch(coursesSearchUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
    body: JSON.stringify({ platform: "YouTube", query: "React tutorial", language: "en" }),
  });
  const cs2Data = await cs2Res.json().catch(() => ({}));
  console.log("   Status:", cs2Res.status);
  if (cs2Data.url) {
    console.log("   URL:", cs2Data.url);
    console.log("   Valid & allowed:", isValidCourseUrl(cs2Data.url) && isAllowedHost(cs2Data.url) ? "YES" : "NO");
  } else if (cs2Data.error) {
    console.log("   Error:", cs2Data.error);
  }

  // 3. Test guest roadmap generation (full flow with grounding)
  console.log("\n3. Testing guest roadmap generation...");
  const guestPayload = {
    profileData: {
      targetCareer: "Frontend Developer",
      jobTitle: "Marketing Manager",
      industry: "Tech",
      experienceLevel: "Mid",
      skills: ["JavaScript", "HTML"],
      learningStyle: "video",
      preferredPlatforms: ["Udemy", "YouTube", "Coursera"],
      weeklyHours: 10,
      budget: "up_to_50",
      timeline: "12",
      preferredLanguage: "en",
    },
  };

  const guestRes = await fetch(apiUrl("/roadmap/generate-guest"), {
    method: "POST",
    headers: headers("/api/roadmap/generate-guest"),
    body: JSON.stringify(guestPayload),
  });

  const guestBody = await guestRes.json().catch(() => ({}));
  console.log("   Status:", guestRes.status);

  if (guestRes.ok && guestBody?.roadmap_id) {
    console.log("   Roadmap ID:", guestBody.roadmap_id);
    if (guestBody.teaser) {
      const weeks = guestBody.teaser.weeks || [];
      let totalCourses = 0;
      let withUrl = 0;
      const invalidHosts = [];
      for (const w of weeks) {
        const courses = w.courses || [];
        for (const c of courses) {
          totalCourses++;
          const url = c?.url;
          if (url && typeof url === "string" && url.trim()) {
            if (isValidCourseUrl(url) && isAllowedHost(url)) {
              withUrl++;
            } else if (url.trim()) {
              invalidHosts.push({ title: c.title, platform: c.platform, url });
            }
          }
        }
      }
      console.log("   Courses in teaser:", totalCourses);
      console.log("   With valid allowed URL:", withUrl);
      if (invalidHosts.length) {
        console.log("   Rejected (invalid or disallowed):", invalidHosts.length);
        invalidHosts.slice(0, 3).forEach((x) => console.log("     -", x.platform, x.url?.slice(0, 60) + "..."));
      }
      // Sample a few course links
      let sampled = 0;
      for (const w of weeks) {
        for (const c of w.courses || []) {
          if (c?.url && isValidCourseUrl(c.url) && isAllowedHost(c.url) && sampled < 3) {
            console.log("   Sample OK:", c.platform, "->", c.url.slice(0, 80) + "...");
            sampled++;
          }
        }
      }
    }
  } else {
    console.log("   Error:", guestBody?.error || guestRes.statusText);
    if (guestRes.status === 500) {
      console.log("   (May need GEMINI_API_KEY and ROADMAP_USE_GROUNDING in Edge Function secrets)");
    }
  }

  console.log("\n=== Done ===\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
