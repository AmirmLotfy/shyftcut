// Push reminder: run on a schedule (e.g. hourly). Sends Web Push to users who have
// push_enabled, have not studied today (in their timezone), and are in their reminder window.

import { getSupabase } from "../_shared/supabase.ts";
import webpush from "npm:web-push";

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
    const str = new Date().toLocaleString("en-US", { timeZone: tz || "UTC", hour: "2-digit", hour12: false });
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

  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY")?.trim();
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY")?.trim();
  if (!vapidPublic || !vapidPrivate) {
    return new Response(
      JSON.stringify({ ok: true, sent: 0, message: "VAPID keys not configured" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    webpush.setVapidDetails("mailto:support@shyftcut.com", vapidPublic, vapidPrivate);

    const supabase = getSupabase();
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("user_id, reminder_time, timezone")
      .eq("push_enabled", true);

    if (!prefs?.length) {
      return new Response(
        JSON.stringify({ ok: true, sent: 0, message: "No users with push enabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userIds = (prefs as { user_id: string }[]).map((p) => p.user_id);
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("user_id, endpoint, p256dh, auth")
      .in("user_id", userIds);

    let sent = 0;
    for (const p of prefs as { user_id: string; reminder_time?: string; timezone?: string }[]) {
      const userId = p.user_id;
      const tz = p.timezone || "UTC";
      const reminderTime = p.reminder_time || "20:00";
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

      const userSubs = (subs ?? []).filter((s: { user_id: string }) => s.user_id === userId);
      const payload = JSON.stringify({
        title: "Shyftcut",
        body: "Don't break your streak — study today!",
        icon: "/pwa.png",
      });
      for (const sub of userSubs) {
        try {
          await webpush.sendNotification(
            {
              endpoint: (sub as { endpoint: string }).endpoint,
              keys: {
                p256dh: (sub as { p256dh: string }).p256dh,
                auth: (sub as { auth: string }).auth,
              },
            },
            payload
          );
          sent++;
        } catch (err) {
          console.warn("Push send failed for subscription:", (sub as { endpoint: string }).endpoint?.slice(0, 50), err);
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, sent }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-push-reminders error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
