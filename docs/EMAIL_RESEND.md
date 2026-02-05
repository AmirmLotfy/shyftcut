# Resend email setup (Shyftcut)

All transactional email (contact form, newsletter, subscription lifecycle) is sent via [Resend](https://resend.com) using the shared module `server/lib/email.ts`.

## Supabase Auth vs Resend

- **Confirmation and reset emails** are sent by **Supabase Auth**, not Resend. The app uses `signUp` with `emailRedirectTo` and `resetPasswordForEmail` with `redirectTo`; Supabase sends the actual emails.
- **⚠️ Required for production: Custom SMTP**  
  Supabase's default mailer is very limited and often fails. You **must** configure Custom SMTP in Supabase to use Resend for auth emails. See **[EMAIL_CONFIRMATION_SETUP.md](./EMAIL_CONFIRMATION_SETUP.md)** for step-by-step instructions (Project Settings → Auth → SMTP, host `smtp.resend.com`, port 465, username `resend`, password = your Resend API key).
- **Welcome email after signup**  
  There is no code in the repo that sends a welcome email on signup. To add it you can:
  - Use **Supabase Auth Hook** or **Database Webhook** on `auth.users` insert to call an Edge Function that uses Resend to send a welcome email, or
  - Rely on Supabase’s “Confirm signup” email template and skip a separate welcome email.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| **RESEND_API_KEY** | Yes (for sending) | API key from [Resend Dashboard](https://resend.com/api-keys). Without it, `sendEmail` no-ops and logs a warning. |
| **FROM_EMAIL** | No | Sender address. Default: `onboarding@resend.dev`. For production, use a verified domain (e.g. `support@shyftcut.com`). |
| **CONTACT_TO_EMAIL** | No | Where contact form submissions are delivered. Default: `support@shyftcut.com`. |

## Resend dashboard

1. **API key**: Create an API key at [resend.com/api-keys](https://resend.com/api-keys) and set `RESEND_API_KEY` in Vercel (and locally in `.env`).
2. **Domain (production)**: In [Resend → Domains](https://resend.com/domains), add and verify your domain (e.g. `shyftcut.com`) so you can send from `support@shyftcut.com` or `noreply@shyftcut.com`. Until then, Resend’s onboarding domain (`onboarding@resend.dev`) works for testing.

## What sends email

- **Contact form** (`POST /api/contact`): Sends to `CONTACT_TO_EMAIL` and an auto-reply to the submitter.
- **Newsletter** (`POST /api/newsletter`): Stores email in `newsletter_subscribers` and sends “Thanks for subscribing.”
- **Polar webhook**: “Welcome to Shyftcut Premium” on subscription active; “Sorry to see you go” on subscription canceled.

## Vercel

Add the same vars in the project’s Environment Variables (Production, Preview, Development):

- `RESEND_API_KEY`
- `FROM_EMAIL` (optional)
- `CONTACT_TO_EMAIL` (optional)

Then redeploy so new serverless functions use them.
