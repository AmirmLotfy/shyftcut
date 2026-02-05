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

/** Returns true only if url is a full URL to a specific page (not just domain root). */
export function isValidCourseUrl(url: string): boolean {
  if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) return false;
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
