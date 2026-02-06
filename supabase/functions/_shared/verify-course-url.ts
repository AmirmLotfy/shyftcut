/**
 * Verify that a course URL actually exists and is accessible.
 * - YouTube: uses oEmbed API (returns 200 only if video exists)
 * - Other platforms: HEAD request with short timeout
 */
const VERIFY_TIMEOUT_MS = 5000;

export function isYouTubeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    return host === "youtube.com" || host.endsWith(".youtube.com") || host === "www.youtube.com";
  } catch {
    return false;
  }
}

/** YouTube oEmbed: returns 200 only if video exists. */
async function verifyYouTubeUrl(url: string): Promise<boolean> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);
    const res = await fetch(oembedUrl, {
      method: "GET",
      signal: controller.signal,
      headers: { "User-Agent": "Shyftcut-Course-Verifier/1.0" },
    });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}

/** HEAD request to check if URL returns 2xx. */
async function verifyUrlWithHead(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "Shyftcut-Course-Verifier/1.0" },
    });
    clearTimeout(timeoutId);
    return res.ok && res.status >= 200 && res.status < 400;
  } catch {
    return false;
  }
}

/**
 * Verify that the course URL exists and is accessible.
 * Returns true only if the resource is reachable.
 */
export async function verifyCourseUrl(url: string): Promise<boolean> {
  if (!url || typeof url !== "string" || url.length > 2048) return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return false;

  if (isYouTubeUrl(trimmed)) {
    return verifyYouTubeUrl(trimmed);
  }
  return verifyUrlWithHead(trimmed);
}
