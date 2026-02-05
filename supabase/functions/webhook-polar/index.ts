// Supabase Edge Function: Polar webhook. Set POLAR_WEBHOOK_SECRET, RESEND_API_KEY, FROM_EMAIL.
// Webhook URL: https://<project-ref>.supabase.co/functions/v1/webhook-polar

import { corsHeaders } from "../_shared/cors.ts";
import { getSupabase } from "../_shared/supabase.ts";
import { logError, safeErrorMessage } from "../_shared/log.ts";

async function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secret: string
): Promise<boolean> {
  if (!signatureHeader || !secret) return false;
  const parts = signatureHeader.split(",").map((s) => s.trim());
  const sigPart = parts.find((p) => p.startsWith("v1,"));
  if (!sigPart) return false;
  const receivedSig = sigPart.slice(3);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(rawBody)
  );
  const expectedHex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (receivedSig.length !== expectedHex.length) return false;
  let same = true;
  for (let i = 0; i < receivedSig.length; i++) {
    if (receivedSig[i] !== expectedHex[i]) same = false;
  }
  return same;
}

async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<{ ok: boolean }> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "onboarding@resend.dev";
  if (!RESEND_API_KEY) return { ok: false };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: FROM_EMAIL, to: opts.to, subject: opts.subject, html: opts.html }),
  });
  return { ok: res.ok };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const rawBody = await req.text();
    const secret = Deno.env.get("POLAR_WEBHOOK_SECRET") ?? "";
    const signatureHeader = req.headers.get("webhook-signature") ?? req.headers.get("x-webhook-signature") ?? "";

    if (!(await verifyWebhookSignature(rawBody, signatureHeader, secret))) {
      logError("webhook-polar", "invalid signature", undefined);
      return new Response(JSON.stringify({ error: "Invalid webhook signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let payload: {
      type?: string;
      data?: {
        id?: string;
        customer_id?: string;
        metadata?: { user_id?: string; plan_id?: string };
        current_period_start?: string;
        current_period_end?: string;
        status?: string;
      };
    };
    try {
      payload = JSON.parse(rawBody || "{}") as typeof payload;
    } catch (parseErr) {
      logError("webhook-polar", "payload parse failed", parseErr);
      return new Response(
        JSON.stringify({ error: "Invalid JSON payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const eventType = payload.type;
    const supabase = getSupabase();

    switch (eventType) {
      case "checkout.created":
        // Checkout object, not subscription; activation happens on subscription.created / subscription.active.
        break;

      case "subscription.created":
      case "subscription.active": {
        const sub = payload.data;
        if (!sub) break;
        const metadata = sub.metadata ?? {};
        const userId = metadata.user_id;
        const planId = metadata.plan_id;
        const tier = planId === "pro" ? "pro" : "premium";
        if (userId) {
          await supabase.from("subscriptions").update({
            tier,
            status: "active",
            polar_subscription_id: sub.id ?? null,
            polar_customer_id: sub.customer_id ?? null,
            current_period_start: sub.current_period_start ?? null,
            current_period_end: sub.current_period_end ?? null,
            updated_at: new Date().toISOString(),
          }).eq("user_id", userId);
          const { data: profile } = await supabase.from("profiles").select("email").eq("user_id", userId).single();
          const userEmail = profile?.email;
          if (userEmail) {
            await sendEmail({
              to: userEmail,
              subject: "Welcome to Shyftcut Premium",
              html: "<p>Welcome to Shyftcut Premium! You now have unlimited roadmaps, AI chat, and quizzes. Enjoy the full experience.</p><p>— The Shyftcut team</p>",
            });
          }
        }
        break;
      }

      case "subscription.updated": {
        const sub = payload.data;
        if (!sub?.id) break;
        const metadata = sub.metadata ?? {};
        const userId = metadata.user_id;
        const status = sub.status === "active" ? "active" : (sub.status ?? "active");
        if (userId) {
          await supabase.from("subscriptions").update({
            current_period_start: sub.current_period_start ?? null,
            current_period_end: sub.current_period_end ?? null,
            status,
            updated_at: new Date().toISOString(),
          }).eq("user_id", userId);
        } else {
          await supabase.from("subscriptions").update({
            current_period_start: sub.current_period_start ?? null,
            current_period_end: sub.current_period_end ?? null,
            status,
            updated_at: new Date().toISOString(),
          }).eq("polar_subscription_id", sub.id);
        }
        break;
      }

      case "subscription.canceled":
      case "subscription.revoked": {
        const sub = payload.data;
        if (!sub?.id) break;
        const { data: subRow } = await supabase.from("subscriptions").select("user_id").eq("polar_subscription_id", sub.id).single();
        await supabase.from("subscriptions").update({
          tier: "free",
          status: "canceled",
          updated_at: new Date().toISOString(),
        }).eq("polar_subscription_id", sub.id);
        if (subRow?.user_id) {
          const { data: profile } = await supabase.from("profiles").select("email").eq("user_id", subRow.user_id).single();
          if (profile?.email) {
            await sendEmail({
              to: profile.email,
              subject: "Your Shyftcut subscription has been canceled",
              html: "<p>We're sorry to see you go. Your Shyftcut Premium subscription has been canceled. You can resubscribe anytime from your profile.</p><p>— The Shyftcut team</p>",
            });
          }
        }
        break;
      }

      default:
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    logError("webhook-polar", "webhook processing failed", err);
    return new Response(
      JSON.stringify({ error: safeErrorMessage(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
