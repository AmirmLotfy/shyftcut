/**
 * Course metadata scraper - fetches real pricing and metadata from course URLs
 * Supports: Udemy, Coursera, LinkedIn Learning, YouTube, Pluralsight, Skillshare, edX, etc.
 */

const SCRAPE_TIMEOUT_MS = 8000;
const MAX_HTML_SIZE = 500_000; // 500KB max

interface CourseMetadata {
  price: number | null;
  currency: string;
  rating: number | null;
  instructor: string | null;
  duration: string | null;
  difficulty_level: string | null;
  title: string | null;
}

/**
 * Extract price from HTML using various strategies
 */
function extractPrice(html: string, url: string): { price: number | null; currency: string } {
  let hostname: string;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    hostname = '';
  }
  
  // Try JSON-LD structured data first (most reliable)
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis);
  if (jsonLdMatches) {
    for (const match of jsonLdMatches) {
      try {
        const jsonStr = match.replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>/i, '').replace(/<\/script>/i, '');
        const data = JSON.parse(jsonStr);
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item['@type'] === 'Product' || item['@type'] === 'Course') {
              const offers = item.offers || item.price;
              if (offers) {
                const price = typeof offers === 'object' ? offers.price : offers;
                const currency = typeof offers === 'object' ? (offers.priceCurrency || offers.currency || 'USD') : 'USD';
                if (typeof price === 'number' && price > 0) {
                  return { price, currency };
                }
              }
            }
          }
        } else if (data['@type'] === 'Product' || data['@type'] === 'Course') {
          const offers = data.offers || data.price;
          if (offers) {
            const price = typeof offers === 'object' ? offers.price : offers;
            const currency = typeof offers === 'object' ? (offers.priceCurrency || offers.currency || 'USD') : 'USD';
            if (typeof price === 'number' && price > 0) {
              return { price, currency };
            }
          }
        }
      } catch {
        // Continue to next method
      }
    }
  }

  // Platform-specific extraction
  if (hostname.includes('udemy.com')) {
    // Udemy: Look for price in data attributes and JSON
    const priceMatch = html.match(/data-price=["'](\d+\.?\d*)["']/i) || 
                       html.match(/"price":\s*(\d+\.?\d*)/i) ||
                       html.match(/<span[^>]*class=["'][^"']*price[^"']*["'][^>]*>.*?(\d+\.?\d*)/is);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1]);
      if (price > 0) return { price, currency: 'USD' };
    }
    // Check for "Free" indicators
    if (html.match(/free|gratis|مجاني/i)) {
      return { price: 0, currency: 'USD' };
    }
  }

  if (hostname.includes('coursera.org')) {
    // Coursera: Often in data attributes or JSON
    const priceMatch = html.match(/data-course-price=["'](\d+\.?\d*)["']/i) ||
                       html.match(/"amount":\s*(\d+\.?\d*)/i) ||
                       html.match(/<span[^>]*class=["'][^"']*price[^"']*["'][^>]*>\s*\$?\s*(\d+\.?\d*)/is);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1]);
      if (price > 0) return { price, currency: 'USD' };
    }
    // Check for "Free" or "Audit"
    if (html.match(/free\s+to\s+audit|free\s+course|enroll\s+for\s+free/i)) {
      return { price: 0, currency: 'USD' };
    }
  }

  if (hostname.includes('linkedin.com')) {
    // LinkedIn Learning: Usually subscription-based, but check for individual course prices
    const priceMatch = html.match(/data-price=["'](\d+\.?\d*)["']/i) ||
                       html.match(/"price":\s*(\d+\.?\d*)/i);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1]);
      if (price > 0) return { price, currency: 'USD' };
    }
    // LinkedIn Learning is typically subscription-based (free with trial)
    if (html.match(/try\s+free|free\s+trial|subscription/i)) {
      return { price: 0, currency: 'USD' }; // Free with subscription
    }
  }

  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    // YouTube is always free
    return { price: 0, currency: 'USD' };
  }

  if (hostname.includes('pluralsight.com')) {
    // Pluralsight: Subscription-based
    if (html.match(/free\s+trial|subscription/i)) {
      return { price: 0, currency: 'USD' };
    }
  }

  if (hostname.includes('skillshare.com')) {
    // Skillshare: Subscription-based
    if (html.match(/free\s+trial|subscription|premium/i)) {
      return { price: 0, currency: 'USD' };
    }
  }

  if (hostname.includes('edx.org')) {
    // edX: Check for verified track price
    const priceMatch = html.match(/verified\s+track.*?\$(\d+)/i) ||
                       html.match(/price["']:\s*["']\$(\d+)/i);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1]);
      if (price > 0) return { price, currency: 'USD' };
    }
    // Audit track is free
    if (html.match(/audit\s+track|free/i)) {
      return { price: 0, currency: 'USD' };
    }
  }

  if (hostname.includes('khanacademy.org') || 
      hostname.includes('freecodecamp.org') ||
      hostname.includes('codecademy.com')) {
    // These are typically free
    return { price: 0, currency: 'USD' };
  }

  // Generic fallback: Look for common price patterns
  const genericPricePatterns = [
    /\$(\d+\.?\d*)/g,
    /USD\s*(\d+\.?\d*)/gi,
    /price["']:\s*["']\$?(\d+\.?\d*)/i,
    /<span[^>]*>\s*\$?\s*(\d+\.?\d*)\s*<\/span>/i,
  ];

  for (const pattern of genericPricePatterns) {
    const matches = html.match(pattern);
    if (matches) {
      for (const match of matches) {
        const priceMatch = match.match(/(\d+\.?\d*)/);
        if (priceMatch) {
          const price = parseFloat(priceMatch[1]);
          if (price > 0 && price < 10000) { // Sanity check
            return { price, currency: 'USD' };
          }
        }
      }
    }
  }

  // Check for free indicators
  if (html.match(/\bfree\b|\bgratis\b|no\s+cost|without\s+charge/i)) {
    return { price: 0, currency: 'USD' };
  }

  return { price: null, currency: 'USD' };
}

/**
 * Extract rating from HTML
 */
function extractRating(html: string): number | null {
  // Look for structured data rating
  const ratingMatch = html.match(/"ratingValue":\s*(\d+\.?\d*)/i) ||
                      html.match(/data-rating=["'](\d+\.?\d*)["']/i) ||
                      html.match(/rating["']:\s*["']?(\d+\.?\d*)/i) ||
                      html.match(/<span[^>]*class=["'][^"']*rating[^"']*["'][^>]*>.*?(\d+\.?\d*)/is);
  
  if (ratingMatch) {
    const rating = parseFloat(ratingMatch[1]);
    if (rating >= 0 && rating <= 5) {
      return Math.round(rating * 10) / 10; // Round to 1 decimal
    }
  }

  return null;
}

/**
 * Extract instructor from HTML
 */
function extractInstructor(html: string, url: string): string | null {
  let hostname: string;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    hostname = '';
  }
  
  // Structured data
  const instructorMatch = html.match(/"instructor":\s*["']([^"']+)["']/i) ||
                          html.match(/"author":\s*["']([^"']+)["']/i) ||
                          html.match(/data-instructor=["']([^"']+)["']/i);
  
  if (instructorMatch) {
    return instructorMatch[1].trim().slice(0, 200);
  }

  // Platform-specific
  if (hostname.includes('udemy.com')) {
    const match = html.match(/<a[^>]*class=["'][^"']*instructor[^"']*["'][^>]*>([^<]+)</i) ||
                 html.match(/instructor["']:\s*["']([^"']+)["']/i);
    if (match) return match[1].trim().slice(0, 200);
  }

  if (hostname.includes('coursera.org')) {
    const match = html.match(/<span[^>]*class=["'][^"']*instructor[^"']*["'][^>]*>([^<]+)</i);
    if (match) return match[1].trim().slice(0, 200);
  }

  return null;
}

/**
 * Extract duration from HTML
 */
function extractDuration(html: string): string | null {
  // Look for duration patterns
  const durationPatterns = [
    /(\d+)\s*(?:hour|hr|h)\s*(?:\d+)?\s*(?:min|minute|m)?/i,
    /(\d+)\s*(?:week|wk)s?/i,
    /(\d+)\s*(?:day|d)s?/i,
    /duration["']:\s*["']([^"']+)["']/i,
    /data-duration=["']([^"']+)["']/i,
  ];

  for (const pattern of durationPatterns) {
    const match = html.match(pattern);
    if (match) {
      return match[0].trim().slice(0, 100);
    }
  }

  return null;
}

/**
 * Extract difficulty level from HTML
 */
function extractDifficulty(html: string): string | null {
  const difficultyMatch = html.match(/difficulty["']:\s*["'](beginner|intermediate|advanced)["']/i) ||
                          html.match(/level["']:\s*["'](beginner|intermediate|advanced)["']/i) ||
                          html.match(/<span[^>]*class=["'][^"']*(?:beginner|intermediate|advanced)[^"']*["'][^>]*>/i);
  
  if (difficultyMatch) {
    const level = difficultyMatch[1]?.toLowerCase() || difficultyMatch[0].match(/(beginner|intermediate|advanced)/i)?.[0]?.toLowerCase();
    if (level && ['beginner', 'intermediate', 'advanced'].includes(level)) {
      return level;
    }
  }

  return null;
}

/**
 * Extract title from HTML (fallback if not provided)
 */
function extractTitle(html: string): string | null {
  // Try meta tags first
  const metaTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*name=["']title["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<title>([^<]+)<\/title>/i);
  
  if (metaTitle) {
    return metaTitle[1].trim().slice(0, 500);
  }

  return null;
}

/**
 * Fetch and scrape course metadata from URL
 */
export async function scrapeCourseMetadata(url: string): Promise<CourseMetadata> {
  if (!url || typeof url !== 'string' || url.length > 2048) {
    return { price: null, currency: 'USD', rating: null, instructor: null, duration: null, difficulty_level: null, title: null };
  }

  // Validate URL format before attempting to fetch
  try {
    new URL(url);
  } catch {
    return { price: null, currency: 'USD', rating: null, instructor: null, duration: null, difficulty_level: null, title: null };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { price: null, currency: 'USD', rating: null, instructor: null, duration: null, difficulty_level: null, title: null };
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return { price: null, currency: 'USD', rating: null, instructor: null, duration: null, difficulty_level: null, title: null };
    }

    const text = await response.text();
    if (text.length > MAX_HTML_SIZE) {
      // Truncate to avoid memory issues
      const truncated = text.slice(0, MAX_HTML_SIZE);
      return extractMetadata(truncated, url);
    }

    return extractMetadata(text, url);
  } catch (error) {
    console.warn('[course-metadata] Scrape failed for', url, error);
    return { price: null, currency: 'USD', rating: null, instructor: null, duration: null, difficulty_level: null, title: null };
  }
}

/**
 * Extract all metadata from HTML
 */
function extractMetadata(html: string, url: string): CourseMetadata {
  const { price, currency } = extractPrice(html, url);
  const rating = extractRating(html);
  const instructor = extractInstructor(html, url);
  const duration = extractDuration(html);
  const difficulty_level = extractDifficulty(html);
  const title = extractTitle(html);

  return {
    price,
    currency,
    rating,
    instructor,
    duration,
    difficulty_level,
    title,
  };
}
