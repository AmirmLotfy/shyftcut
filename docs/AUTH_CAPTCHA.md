# hCaptcha for Auth (Supabase)

When hCaptcha is enabled in Supabase (Authentication → Bot and Abuse Protection), the frontend must provide a CAPTCHA token for sign up, sign in, and password reset.

## Setup

1. **Supabase Dashboard** (you've done this): Authentication → Bot and Abuse Protection → Enable CAPTCHA → select hCaptcha, enter Secret key.

2. **hCaptcha dashboard**: Get your **Site key** from [hCaptcha Settings](https://dashboard.hcaptcha.com/sites) (it's public, used in the frontend).

3. **Environment variable**: Set `VITE_HCAPTCHA_SITE_KEY` with your Site key:
   - Local: `.env` or `.env.local`
   - Vercel: Project Settings → Environment Variables (add for Production, Preview, Development)
   - Redeploy the frontend after adding.

## Behavior

- **Signup, Login, Forgot Password**: Show hCaptcha widget; user must complete it before submitting.
- **Backend**: No changes. Supabase Auth verifies the token server-side.
- **If site key is missing**: CAPTCHA is hidden. Auth will fail with `captcha_failed` if Supabase requires it.
