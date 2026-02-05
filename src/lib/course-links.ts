/**
 * When course.url is null or invalid, we show "Find on {platform}" linking to platform search.
 */
const SEARCH_URLS: Record<string, string> = {
  udemy: "https://www.udemy.com/courses/search/?q=",
  coursera: "https://www.coursera.org/search?query=",
  "linkedin learning": "https://www.linkedin.com/learning/search?keywords=",
  linkedin: "https://www.linkedin.com/learning/search?keywords=",
  youtube: "https://www.youtube.com/results?search_query=",
  pluralsight: "https://www.pluralsight.com/search?q=",
  skillshare: "https://www.skillshare.com/search?query=",
  edx: "https://www.edx.org/search?q=",
  futurelearn: "https://www.futurelearn.com/courses?q=",
  "khan academy": "https://www.khanacademy.org/search?page_search_query=",
  khanacademy: "https://www.khanacademy.org/search?page_search_query=",
  codecademy: "https://www.codecademy.com/search?query=",
  datacamp: "https://www.datacamp.com/search?q=",
  freecodecamp: "https://www.freecodecamp.org/learn?query=",
  masterclass: "https://www.masterclass.com/search?q=",
  "google cloud skills boost": "https://www.cloudskillsboost.google/search?q=",
  "google cloud skills": "https://www.cloudskillsboost.google/search?q=",
  "microsoft learn": "https://learn.microsoft.com/en-us/training/browse/?search=",
  "aws training": "https://aws.amazon.com/training/?courses-courses_all.sort-by=item.additionalFields.courseSortDate&courses-courses_all.sort-order=desc&q=",
  aws: "https://aws.amazon.com/training/?courses-courses_all.sort-by=item.additionalFields.courseSortDate&courses-courses_all.sort-order=desc&q=",
};

export function getCourseSearchUrl(platform: string, title: string): string {
  const key = platform.toLowerCase().trim().replace(/\s+/g, " ");
  const base = SEARCH_URLS[key] ?? SEARCH_URLS[key.replace(/\s/g, "")] ?? null;
  const query = encodeURIComponent(title || platform);
  if (base) return base + query;
  return `https://www.google.com/search?q=${encodeURIComponent((title ? title + " " : "") + "course " + platform)}`;
}

export function hasValidCourseUrl(url: string | null | undefined): boolean {
  if (url == null || typeof url !== "string") return false;
  const t = url.trim();
  if (!t || (!t.startsWith("http://") && !t.startsWith("https://"))) return false;
  try {
    const u = new URL(t);
    const path = u.pathname.replace(/\/+$/, "") || "/";
    return path !== "/" && path.length > 1;
  } catch {
    return false;
  }
}
