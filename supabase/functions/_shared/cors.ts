const ALLOWED_ORIGINS = [
  "https://shyftcut.com",
  "https://www.shyftcut.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

function getAllowedOrigin(req?: Request): string {
  const envOrigin = Deno.env.get("CORS_ORIGIN")?.trim();
  if (envOrigin) return envOrigin;
  const origin = req?.headers.get("Origin") ?? "";
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

/** Use for OPTIONS and any response where req is available. Reflects Origin when allowed. */
export function getCorsHeaders(req?: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": getAllowedOrigin(req),
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, content-type, x-client-info, apikey, x-path, x-user-token",
    "Access-Control-Expose-Headers": "X-Auth-Failure-Code",
  };
}

export const corsHeaders = getCorsHeaders();

export function jsonResponse(
  body: unknown,
  status: number,
  init?: ResponseInit,
  req?: Request
): Response {
  const headers = req ? getCorsHeaders(req) : corsHeaders;
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...(init?.headers as Record<string, string>),
    },
    ...init,
  });
}
