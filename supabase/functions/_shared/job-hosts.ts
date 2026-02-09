/**
 * Allowed job listing URL hostnames. Only these domains (and subdomains) are accepted for job links.
 * Mirrors course-hosts approach: real job boards and known career pages only.
 */
export const ALLOWED_JOB_HOSTS = [
  "indeed.com",
  "linkedin.com",
  "glassdoor.com",
  "glassdoor.co.uk",
  "monster.com",
  "ziprecruiter.com",
  "remotive.io",
  "weworkremotely.com",
  "flexjobs.com",
  "careerbuilder.com",
  "simplyhired.com",
  "angel.co",
  "wellfound.com",
  "greenhouse.io",
  "lever.co",
  "jobs.lever.co",
  "workable.com",
  "smartrecruiters.com",
  "icims.com",
  "jobvite.com",
  "taleo.net",
  "myworkdayjobs.com",
  "boards.greenhouse.io",
  "jobs.ashbyhq.com",
  "applytojob.com",
  "recruit.hirebridge.com",
  "eu.indeed.com",
  "uk.linkedin.com",
  "ca.indeed.com",
  "au.indeed.com",
  "de.indeed.com",
  "fr.indeed.com",
  "remoteok.com",
  "jobspresso.co",
  "dynamitejobs.com",
  "arc.dev",
  "turing.com",
  "toptal.com",
] as const;

const ALLOWED_JOB_DOMAINS_LIST = [
  "indeed.com", "linkedin.com", "glassdoor.com", "monster.com", "ziprecruiter.com",
  "remotive.io", "weworkremotely.com", "flexjobs.com", "careerbuilder.com", "simplyhired.com",
  "angel.co", "wellfound.com", "greenhouse.io", "lever.co", "workable.com", "smartrecruiters.com",
  "remoteok.com", "jobspresso.co", "dynamitejobs.com", "arc.dev", "turing.com", "toptal.com",
  "myworkdayjobs.com", "boards.greenhouse.io", "jobs.ashbyhq.com", "applytojob.com",
].join(", ");

/** Human-readable instruction for prompts: only use these domains for job URLs. */
export const ALLOWED_JOB_DOMAINS_INSTRUCTION =
  `Job URLs must be from real job boards or company career pages only. Prefer these domains: ${ALLOWED_JOB_DOMAINS_LIST} (and their regional variants like eu.indeed.com, uk.linkedin.com). You may also use company career pages (e.g. company.com/careers, jobs.company.com) that return a real job listing page. Do NOT invent or guess URLs. Every URL must come from your Google Search results.`;

/** Instruction: use only direct job listing URLs from search, never homepage or search results page. */
export const REAL_JOB_URL_INSTRUCTION =
  `Return ONLY direct links to a specific job listing page (the page where one can apply). Reject: site homepage, job search results page, category or browse pages. Each url must be a full HTTP/HTTPS link that points to a single job post.`;

export function isAllowedJobHost(url: string): boolean {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.toLowerCase();
    // Exact or subdomain match from list
    if (ALLOWED_JOB_HOSTS.some((allowed) => host === allowed || host.endsWith("." + allowed))) {
      return true;
    }
    // Common company career patterns: jobs.*.com, careers.*.com, *.greenhouse.io, *.lever.co, etc.
    if (host.startsWith("jobs.") && (host.endsWith(".com") || host.endsWith(".io"))) return true;
    if (host.startsWith("careers.") && host.endsWith(".com")) return true;
    if (host.endsWith(".greenhouse.io") || host.endsWith(".lever.co")) return true;
    if (host.endsWith(".workable.com") || host.endsWith(".ashbyhq.com")) return true;
    if (host.endsWith("myworkdayjobs.com")) return true;
    return false;
  } catch {
    return false;
  }
}

/**
 * Returns true only if url is a full URL to a job listing (not homepage, not search results).
 */
export function isValidJobUrl(url: string): boolean {
  if (!url || (typeof url !== "string")) return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return false;
  try {
    const u = new URL(trimmed);
    const path = u.pathname.replace(/\/+$/, "") || "/";
    // Reject bare homepage
    if (path === "/" && !u.searchParams.toString()) return false;
    // Indeed: must have /viewjob or /job/ or similar
    if (u.hostname.includes("indeed.com")) {
      if (path === "/" || path.toLowerCase().startsWith("/jobs") || path.toLowerCase() === "/jobsearch") return false;
    }
    // LinkedIn: job listing has /jobs/view/ or /jobs/collections/; reject /jobs/search (search results)
    if (u.hostname.includes("linkedin.com")) {
      const pl = path.toLowerCase();
      if (!pl.includes("/jobs/")) return false;
      if (pl === "/jobs" || pl.startsWith("/jobs/search")) return false;
    }
    // Glassdoor: /Job/ or /job/
    if (u.hostname.includes("glassdoor.com")) {
      if (path === "/" || path.toLowerCase() === "/job") return false;
    }
    return true;
  } catch {
    return false;
  }
}
