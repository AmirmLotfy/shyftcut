/**
 * Verify that a job listing URL is reachable (returns 2xx).
 * Same approach as verify-course-url: HEAD request with short timeout.
 * Some job boards may block HEAD; we fall back to GET with no body if needed.
 */
const VERIFY_TIMEOUT_MS = 6000;

async function verifyWithHead(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Shyftcut-Job-Verifier/1.0; +https://shyftcut.com)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    clearTimeout(timeoutId);
    return res.ok && res.status >= 200 && res.status < 400;
  } catch {
    return false;
  }
}

async function verifyWithGet(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Shyftcut-Job-Verifier/1.0; +https://shyftcut.com)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    clearTimeout(timeoutId);
    return res.ok && res.status >= 200 && res.status < 400;
  } catch {
    return false;
  }
}

/**
 * Verify that the job URL exists and is accessible.
 * Tries HEAD first; if it fails (405 or blocked), tries GET.
 */
export async function verifyJobUrl(url: string): Promise<boolean> {
  if (!url || typeof url !== "string" || url.length > 2048) return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return false;

  const headOk = await verifyWithHead(trimmed);
  if (headOk) return true;
  // Some sites return 405 Method Not Allowed for HEAD
  return verifyWithGet(trimmed);
}
