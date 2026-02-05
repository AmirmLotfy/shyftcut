# Magic Link Setup (Supabase)

Magic link lets users sign in by clicking a link sent to their email — no password needed.

## 1. Enable Magic Link in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. **Authentication** → **Providers** → **Email**
3. Ensure **Enable Email Provider** is ON
4. **Enable Email OTP** (or **Magic Link**) — this is usually ON by default

## 2. Add Magic Link Email Template

1. **Authentication** → **Email Templates**
2. Find **Magic Link** (or **Login with magic link**)
3. Replace the default template with the one from **[SUPABASE_EMAIL_TEMPLATES.md](./SUPABASE_EMAIL_TEMPLATES.md)** (Magic Link section)
4. The template must include `{{ .ConfirmationURL }}` — that’s the one-time login link

## 3. Redirect URLs

1. **Authentication** → **URL Configuration**
2. Add to **Redirect URLs** (if not already present):
   - `https://shyftcut.com/login`
   - `https://shyftcut.com`
   - `http://localhost:5173/login` (for local dev)

## 4. Custom SMTP (recommended)

Supabase’s default mailer is limited. For reliable delivery:

- Configure **Custom SMTP** (e.g. Resend) — see [EMAIL_CONFIRMATION_SETUP.md](./EMAIL_CONFIRMATION_SETUP.md)

Magic link uses the same SMTP settings as signup confirmation and password reset.

## 5. Test

1. Go to `/login`
2. Switch to the **Email link** tab
3. Enter your email and click **Send login link**
4. Check your inbox and click the link
5. You should be signed in and redirected to the dashboard
