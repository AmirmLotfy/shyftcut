/**
 * Allowed course URL hostnames. Only these domains (and subdomains) are accepted for course links.
 * Trusted learning platforms: general MOOCs, coding, data, cloud, and free education.
 */
export const ALLOWED_COURSE_HOSTS = [
  "udemy.com",
  "coursera.org",
  "linkedin.com",
  "youtube.com",
  "pluralsight.com",
  "skillshare.com",
  "edx.org",
  "futurelearn.com",
  "khanacademy.org",
  "codecademy.com",
  "datacamp.com",
  "freecodecamp.org",
  "masterclass.com",
  "cloudskillsboost.google",
  "learn.microsoft.com",
  "aws.amazon.com",
] as const;

const ALLOWED_DOMAINS_LIST =
  "udemy.com, coursera.org, linkedin.com, youtube.com, pluralsight.com, skillshare.com, edx.org, futurelearn.com, khanacademy.org, codecademy.com, datacamp.com, freecodecamp.org, masterclass.com, cloudskillsboost.google, learn.microsoft.com, aws.amazon.com";

/** Human-readable instruction for prompts: only use these domains. */
export const ALLOWED_DOMAINS_INSTRUCTION =
  `Course URLs must be from these domains only: ${ALLOWED_DOMAINS_LIST} (including subdomains like www.udemy.com). URLs from any other domain will be rejected.`;

/** Instruction for prompts: use only direct course URLs, never browse/category pages. */
export const REAL_COURSE_URL_INSTRUCTION =
  `Use ONLY direct course page URLs—never browse or category pages. Examples: coursera.org/learn/..., udemy.com/course/..., youtube.com/watch?v=..., linkedin.com/learning/..., edx.org/courses/.... REJECT: coursera.org/browse/..., udemy.com/topic/..., youtube.com/channel/..., youtube.com/results, any listing or search page.`;

/** Map platform display names to allowed host for validation. */
const PLATFORM_TO_HOST: Record<string, string> = {
  udemy: "udemy.com",
  coursera: "coursera.org",
  "linkedin learning": "linkedin.com",
  linkedin: "linkedin.com",
  youtube: "youtube.com",
  pluralsight: "pluralsight.com",
  skillshare: "skillshare.com",
  edx: "edx.org",
  futurelearn: "futurelearn.com",
  "khan academy": "khanacademy.org",
  khanacademy: "khanacademy.org",
  codecademy: "codecademy.com",
  datacamp: "datacamp.com",
  freecodecamp: "freecodecamp.org",
  "free code camp": "freecodecamp.org",
  masterclass: "masterclass.com",
  "google cloud skills boost": "cloudskillsboost.google",
  "cloud skills boost": "cloudskillsboost.google",
  "microsoft learn": "learn.microsoft.com",
  "ms learn": "learn.microsoft.com",
  aws: "aws.amazon.com",
  "aws training": "aws.amazon.com",
  "amazon web services": "aws.amazon.com",
  "google cloud skills": "cloudskillsboost.google",
};

export function isAllowedCourseHost(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    return ALLOWED_COURSE_HOSTS.some((allowed) => host === allowed || host.endsWith("." + allowed));
  } catch {
    return false;
  }
}

/**
 * Returns true if the URL is a browse/category/listing page, not a specific course.
 * Based on platform-specific URL patterns (Coursera /browse, Udemy /topic, etc.).
 * @see https://www.coursera.org/browse/business/entrepreneurship - example of browse page to reject
 * @see https://support.udemy.com/hc/en-us/articles/229605968 - Udemy course URL format
 */
export function isBrowseOrCategoryPage(url: string): boolean {
  if (!url || typeof url !== "string") return true; // reject empty
  try {
    const u = new URL(url.trim());
    const host = u.hostname.toLowerCase();
    const path = u.pathname.replace(/\/+$/, "") || "/";
    const pathLower = path.toLowerCase();

    // Coursera: /browse = category listing (e.g. coursera.org/browse/business/entrepreneurship)
    if (host.includes("coursera.org") && pathLower.startsWith("/browse")) return true;

    // Udemy: real courses use /course/ only
    if (host.includes("udemy.com") && !pathLower.includes("/course/")) return true;

    // YouTube: reject /results, /feed, /channel/, /c/ (channel pages); accept /watch, /playlist
    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      if (pathLower.startsWith("/results") || pathLower.startsWith("/feed")) return true;
      if (pathLower.startsWith("/channel/") || pathLower.startsWith("/c/")) return true;
      if (pathLower === "/" && !u.searchParams.has("v") && !u.searchParams.has("list")) return true;
    }

    // edX: /courses alone = listing; /courses/xyz = real course
    if (host.includes("edx.org") && (pathLower === "/courses" || pathLower === "/courses/")) return true;

    // LinkedIn Learning: /learning/topics/ = topic browse
    if (host.includes("linkedin.com") && pathLower.includes("/learning/topics")) return true;

    // Skillshare: /browse = category
    if (host.includes("skillshare.com") && pathLower.startsWith("/browse")) return true;

    // FutureLearn, DataCamp: /courses alone = listing; /courses/xyz = real
    if ((host.includes("futurelearn.com") || host.includes("datacamp.com")) &&
        (pathLower === "/courses" || pathLower === "/courses/")) return true;

    // Pluralsight: /product = product page
    if (host.includes("pluralsight.com") && pathLower.startsWith("/product")) return true;

    // Codecademy: /catalog = catalog browse
    if (host.includes("codecademy.com") && pathLower.startsWith("/catalog")) return true;

    // Khan Academy: /courses alone = overview
    if (host.includes("khanacademy.org") && (pathLower === "/courses" || pathLower === "/courses/")) return true;

    // Microsoft Learn: /learn alone = training home
    if (host.includes("learn.microsoft.com") && (pathLower === "/learn" || pathLower === "/learn/")) return true;

    // AWS Training: /training alone = home
    if (host.includes("aws.amazon.com") && (pathLower === "/training" || pathLower === "/training/")) return true;

    // Google Cloud Skills Boost: root only
    if (host.includes("cloudskillsboost.google") && (pathLower === "/" || pathLower === "")) return true;

    return false;
  } catch {
    return true; // invalid URL = reject
  }
}

/** Returns true only if url is a full URL to a specific course page (not browse/category/homepage). */
export function isValidCourseUrl(url: string): boolean {
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

/** Returns allowed host for platform name, or null if platform is not in our allowlist. */
export function getPlatformDomain(platform: string): string | null {
  const key = platform.toLowerCase().trim().replace(/\s+/g, " ");
  return PLATFORM_TO_HOST[key] ?? PLATFORM_TO_HOST[key.replace(/\s/g, "")] ?? null;
}
