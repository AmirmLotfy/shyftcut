const ALLOW_ORIGIN = Deno.env.get("CORS_ORIGIN") ?? "*";

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": ALLOW_ORIGIN,
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, content-type, x-client-info, apikey, x-path, x-user-token",
  "Access-Control-Expose-Headers": "X-Auth-Failure-Code",
};

export function jsonResponse(
  body: unknown,
  status: number,
  init?: ResponseInit
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...(init?.headers as Record<string, string>),
    },
    ...init,
  });
}
