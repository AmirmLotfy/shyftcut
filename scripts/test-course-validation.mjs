#!/usr/bin/env node
/**
 * Unit tests for course URL validation logic (mirrors course-hosts.ts).
 * Run: node scripts/test-course-validation.mjs
 */

const ALLOWED_COURSE_HOSTS = [
  "udemy.com", "coursera.org", "linkedin.com", "youtube.com", "pluralsight.com", "skillshare.com",
  "edx.org", "futurelearn.com", "khanacademy.org", "codecademy.com", "datacamp.com",
  "freecodecamp.org", "masterclass.com", "cloudskillsboost.google", "learn.microsoft.com", "aws.amazon.com",
];

function isAllowedCourseHost(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    return ALLOWED_COURSE_HOSTS.some((allowed) => host === allowed || host.endsWith("." + allowed));
  } catch {
    return false;
  }
}

function isBrowseOrCategoryPage(url) {
  if (!url || typeof url !== "string") return true;
  try {
    const u = new URL(url.trim());
    const host = u.hostname.toLowerCase();
    const path = u.pathname.replace(/\/+$/, "") || "/";
    const pathLower = path.toLowerCase();
    if (host.includes("coursera.org") && pathLower.startsWith("/browse")) return true;
    if (host.includes("udemy.com") && !pathLower.includes("/course/")) return true;
    if ((host.includes("youtube.com") || host.includes("youtu.be")) &&
        (pathLower.startsWith("/results") || pathLower.startsWith("/feed") ||
         pathLower.startsWith("/channel/") || pathLower.startsWith("/c/"))) return true;
    if (host.includes("edx.org") && (pathLower === "/courses" || pathLower === "/courses/")) return true;
    if (host.includes("linkedin.com") && pathLower.includes("/learning/topics")) return true;
    if (host.includes("skillshare.com") && pathLower.startsWith("/browse")) return true;
    if ((host.includes("futurelearn.com") || host.includes("datacamp.com")) &&
        (pathLower === "/courses" || pathLower === "/courses/")) return true;
    if (host.includes("pluralsight.com") && pathLower.startsWith("/product")) return true;
    if (host.includes("codecademy.com") && pathLower.startsWith("/catalog")) return true;
    if (host.includes("khanacademy.org") && (pathLower === "/courses" || pathLower === "/courses/")) return true;
    if (host.includes("learn.microsoft.com") && (pathLower === "/learn" || pathLower === "/learn/")) return true;
    if (host.includes("aws.amazon.com") && (pathLower === "/training" || pathLower === "/training/")) return true;
    if (host.includes("cloudskillsboost.google") && (pathLower === "/" || pathLower === "")) return true;
    return false;
  } catch {
    return true;
  }
}

function isValidCourseUrl(url) {
  if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) return false;
  if (isBrowseOrCategoryPage(url)) return false;
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/+$/, "") || "/";
    return path !== "/" && path.length > 1;
  } catch {
    return false;
  }
}

let passed = 0;
let failed = 0;

function ok(name, cond) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}`);
  }
}

console.log("\n=== Course URL Validation Tests ===\n");

// Valid URLs from allowed hosts
ok("Udemy course URL", isAllowedCourseHost("https://www.udemy.com/course/python-for-beginners/") && isValidCourseUrl("https://www.udemy.com/course/python-for-beginners/"));
ok("Coursera course URL", isAllowedCourseHost("https://www.coursera.org/learn/machine-learning") && isValidCourseUrl("https://www.coursera.org/learn/machine-learning"));
ok("YouTube video URL", isAllowedCourseHost("https://www.youtube.com/watch?v=abc123") && isValidCourseUrl("https://www.youtube.com/watch?v=abc123"));
ok("edX course URL", isAllowedCourseHost("https://www.edx.org/learn/react") && isValidCourseUrl("https://www.edx.org/learn/react"));
ok("freeCodeCamp URL", isAllowedCourseHost("https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/") && isValidCourseUrl("https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/"));
ok("Microsoft Learn URL", isAllowedCourseHost("https://learn.microsoft.com/en-us/training/modules/intro-to-azure/") && isValidCourseUrl("https://learn.microsoft.com/en-us/training/modules/intro-to-azure/"));

// Reject homepage
ok("Reject Udemy homepage", !isValidCourseUrl("https://www.udemy.com/") || !isValidCourseUrl("https://www.udemy.com"));
ok("Reject root path", !isValidCourseUrl("https://www.udemy.com/"));

// Reject browse/category pages (e.g. coursera.org/browse/business/entrepreneurship)
ok("Reject Coursera browse page", !isValidCourseUrl("https://www.coursera.org/browse/business/entrepreneurship"));
ok("Reject Udemy topic page", !isValidCourseUrl("https://www.udemy.com/topic/python/"));
ok("Reject YouTube results page", !isValidCourseUrl("https://www.youtube.com/results?search_query=python"));

// Reject disallowed domains
ok("Reject random domain", !isAllowedCourseHost("https://fake-course-site.com/course/123"));
ok("Reject Khan Academy typo domain", !isAllowedCourseHost("https://khan-academy.org/"));
ok("Reject Skillshare typo", !isAllowedCourseHost("https://skillshare.net/course/abc"));

// Subdomains
ok("Allow www.udemy.com", isAllowedCourseHost("https://www.udemy.com/course/test/"));
ok("Allow learning.linkedin.com", isAllowedCourseHost("https://learning.linkedin.com/content/learning/"));
ok("Allow subdomain", isAllowedCourseHost("https://subdomain.coursera.org/learn/test"));

console.log("\n---");
console.log(`Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
