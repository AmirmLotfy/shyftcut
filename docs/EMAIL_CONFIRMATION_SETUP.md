# Fix Email Confirmation & Password Reset (Supabase Auth)

Signup confirmation and password reset emails are sent by **Supabase Auth**, not Resend. Supabase's default mailer is very limited (only a few emails/hour and may not deliver reliably). To fix:

## 1. Enable Custom SMTP in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project **qydmjbiwukwlmblosolb**
2. **Project Settings** (gear icon) → **Authentication**
3. Scroll to **SMTP Settings**
4. Toggle **Enable Custom SMTP** ON

## 2. Configure Resend SMTP

Use your existing Resend API key:

| Field | Value |
|-------|-------|
| **Sender email** | `noreply@shyftcut.com` or `onboarding@resend.dev` (for testing) |
| **Sender name** | `Shyftcut` |
| **Host** | `smtp.resend.com` |
| **Port** | `465` |
| **Username** | `resend` |
| **Password** | Your `RESEND_API_KEY` (same key used in Edge secrets) |

> **Domain:** For production, verify `shyftcut.com` in [Resend → Domains](https://resend.com/domains) so you can send from `noreply@shyftcut.com`. Until then, use `onboarding@resend.dev` for testing (Resend’s default).

## 3. Check Auth URL Settings

Under **Authentication → URL Configuration**:

- **Site URL:** `https://shyftcut.com`
- **Redirect URLs:** Include `https://shyftcut.com`, `https://shyftcut.com/login`, `https://shyftcut.com/reset-password`

Confirmation and reset links use these URLs.

## 4. Email Templates

Under **Authentication → Email Templates** you can customize:

- **Confirm signup** – message users receive to verify their email
- **Reset password** – message for password reset

Ready-to-use templates (responsive, app branding, small logo) are in **[SUPABASE_EMAIL_TEMPLATES.md](./SUPABASE_EMAIL_TEMPLATES.md)**. Copy the HTML into each template in the Supabase Dashboard.

---

## What sends what

| Email type | Sent by | Notes |
|------------|---------|-------|
| Signup confirmation | Supabase Auth | Needs Custom SMTP (above) |
| Password reset | Supabase Auth | Needs Custom SMTP (above) |
| Contact form | Resend (Edge API) | Uses `RESEND_API_KEY` in Edge secrets |
| Newsletter | Resend (Edge API) | Same |
| Welcome / cancel (Polar) | Resend (webhook-polar) | Same |

Resend is already used for contact, newsletter, and Polar lifecycle emails. Auth emails require the SMTP setup in Supabase.
