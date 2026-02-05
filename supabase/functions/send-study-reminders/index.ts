// Study reminder emails: run on a schedule (e.g. hourly). Sends Resend email to users who have
// email_reminders=true and have not logged study activity for "today" in their timezone,
// when current hour in their timezone matches their reminder_time.

import { getSupabase } from "../_shared/supabase.ts";
import { sendResendEmail } from "../_shared/resend.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getTodayInTimezone(tz: string): string {
  try {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return fmt.format(now);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function getCurrentHourInTimezone(tz: string): number {
  try {
    const now = new Date();
    const str = now.toLocaleString("en-US", { timeZone: tz || "UTC", hour: "2-digit", hour12: false });
    return parseInt(str, 10) || 0;
  } catch {
    return new Date().getUTCHours();
  }
}

function parseReminderHour(reminderTime: string): number {
  const match = String(reminderTime || "20:00").trim().match(/^(\d{1,2})/);
  return match ? Math.min(23, Math.max(0, parseInt(match[1], 10))) : 20;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = getSupabase();
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("user_id, reminder_time, timezone, unsubscribe_token")
      .eq("email_reminders", true);

    if (!prefs?.length) {
      return new Response(
        JSON.stringify({ ok: true, sent: 0, message: "No users with email reminders" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sent = 0;
    for (const p of prefs) {
      const userId = (p as { user_id: string }).user_id;
      const tz = (p as { timezone?: string }).timezone || "UTC";
      const reminderTime = (p as { reminder_time?: string }).reminder_time || "20:00";
      const reminderHour = parseReminderHour(reminderTime);
      const currentHour = getCurrentHourInTimezone(tz);
      if (currentHour !== reminderHour) continue;

      const todayLocal = getTodayInTimezone(tz);
      const { data: activity } = await supabase
        .from("study_activity")
        .select("id")
        .eq("user_id", userId)
        .eq("activity_date", todayLocal)
        .limit(1);
      if (activity?.length) continue;

      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("user_id", userId)
        .single();
      const email = (profile as { email?: string } | null)?.email?.trim();
      if (!email) continue;

      const unsubscribeToken = (p as { unsubscribe_token?: string }).unsubscribe_token;
      const siteUrl = Deno.env.get("SITE_URL") ?? Deno.env.get("APP_URL") ?? "https://shyftcut.com";
      const unsubscribeUrl = unsubscribeToken
        ? `${siteUrl.replace(/\/$/, "")}/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`
        : "";
      const unsubscribeHtml = unsubscribeUrl
        ? `<p style="font-size:12px;color:#666;"><a href="${unsubscribeUrl}">Unsubscribe from study reminders</a></p>`
        : "";
      const { ok } = await sendResendEmail({
        to: email,
        subject: "Don't break your streak — study today!",
        html: `<p>You haven't logged any study activity today. Open Shyftcut and complete a task or week to keep your streak going.</p><p>— The Shyftcut team</p>${unsubscribeHtml}`,
      });
      if (ok) sent++;
    }

    return new Response(
      JSON.stringify({ ok: true, sent }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-study-reminders error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
