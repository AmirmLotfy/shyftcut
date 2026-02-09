/**
 * City autocomplete using Open-Meteo Geocoding API (free, no API key).
 * https://open-meteo.com/en/docs/geocoding-api
 */

export interface CityResult {
  id: number;
  name: string;
  country_code: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

const BASE = 'https://geocoding-api.open-meteo.com/v1/search';

export async function searchCities(
  query: string,
  options?: { countryCode?: string; count?: number; signal?: AbortSignal }
): Promise<CityResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const params = new URLSearchParams({
    name: q,
    count: String(options?.count ?? 15),
    language: 'en',
    format: 'json',
  });
  if (options?.countryCode?.trim().length === 2) {
    params.set('country', options.countryCode.trim());
  }
  const res = await fetch(`${BASE}?${params.toString()}`, { signal: options?.signal });
  if (!res.ok) return [];
  const data = (await res.json()) as { results?: Array<{ id: number; name: string; country_code: string; country: string; admin1?: string; latitude: number; longitude: number }> };
  const results = data.results ?? [];
  return results.map((r) => ({
    id: r.id,
    name: r.name,
    country_code: r.country_code,
    country: r.country,
    admin1: r.admin1,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

/** Display label for a city result (e.g. "Berlin, State of Berlin, Germany") */
export function cityLabel(c: CityResult): string {
  const parts = [c.name];
  if (c.admin1) parts.push(c.admin1);
  parts.push(c.country);
  return parts.join(', ');
}
