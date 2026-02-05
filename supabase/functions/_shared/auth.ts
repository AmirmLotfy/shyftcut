import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

/** Normalize error for 401 body: safe code for client, full message for logs. */
function authFailureReason(error: { message?: string } | null): { code: string; logMessage: string } {
  const msg = (error?.message ?? "").toLowerCase();
  if (msg.includes("expired") || msg.includes("jwt expired")) return { code: "token_expired", logMessage: error?.message ?? "JWT expired" };
  if (msg.includes("invalid") || msg.includes("jwt")) return { code: "invalid_token", logMessage: error?.message ?? "Invalid JWT" };
  if (msg.includes("malformed")) return { code: "malformed_token", logMessage: error?.message ?? "Malformed token" };
  return { code: "unauthorized", logMessage: error?.message ?? "Unknown auth failure" };
}

export type GetAuthUserResult = { user: AuthUser } | { user: null; reason: string };

/** Verify JWT and return user or null with reason. Uses service role client. Logs failures. */
export async function getAuthUser(authHeader: string | null): Promise<GetAuthUserResult> {
  if (!authHeader?.startsWith("Bearer ")) {
    console.warn("[auth] No Bearer header");
    return { user: null, reason: "missing_auth_header" };
  }
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    console.warn("[auth] Empty token");
    return { user: null, reason: "empty_token" };
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error) {
    const { code, logMessage } = authFailureReason(error);
    console.warn("[auth] getUser failed:", code, logMessage);
    return { user: null, reason: code };
  }
  if (!user) {
    console.warn("[auth] getUser returned no user");
    return { user: null, reason: "no_user" };
  }
  return {
    user: {
      id: user.id,
      email: user.email ?? undefined,
      user_metadata: user.user_metadata as Record<string, unknown> | undefined,
    },
  };
}
