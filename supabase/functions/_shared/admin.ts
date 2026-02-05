import { getSupabase } from "./supabase.ts";

export type SupabaseClient = ReturnType<typeof getSupabase>;

/**
 * Check if a user has superadmin role
 */
export async function checkSuperadmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single();
  
  if (error || !data) {
    console.warn("[admin] Failed to check superadmin role:", error);
    return false;
  }
  
  return data.role === "superadmin";
}

/**
 * Log an admin action to the audit log
 */
export async function logAdminAction(
  supabase: SupabaseClient,
  adminUserId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, unknown>,
  req?: Request
): Promise<void> {
  try {
    const ipAddress = req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const userAgent = req?.headers.get("user-agent");
    
    await supabase.from("admin_audit_log").insert({
      admin_user_id: adminUserId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details: details ?? {},
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  } catch (error) {
    console.error("[admin] Failed to log admin action:", error);
    // Don't throw - audit logging failure shouldn't break the operation
  }
}

/**
 * Require superadmin role or return 403
 */
export async function requireSuperadmin(
  supabase: SupabaseClient,
  userId: string | null,
  req?: Request
): Promise<{ authorized: boolean; error?: Response }> {
  if (!userId) {
    return {
      authorized: false,
      error: new Response(
        JSON.stringify({ error: "Unauthorized", code: "missing_auth" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      ),
    };
  }
  
  const isSuperadmin = await checkSuperadmin(supabase, userId);
  if (!isSuperadmin) {
    return {
      authorized: false,
      error: new Response(
        JSON.stringify({ error: "Forbidden", code: "superadmin_required" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      ),
    };
  }
  
  return { authorized: true };
}
