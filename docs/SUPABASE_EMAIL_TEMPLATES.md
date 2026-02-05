# Supabase Auth Email Templates

Copy these templates into **Supabase Dashboard → Authentication → Email Templates**.

## Confirm Signup

Uses the small logo at `https://shyftcut.com/shyftcut-email-logo.png` (8KB, loads fast). Responsive for mobile. Styled to match the app’s dark glass aesthetic.

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Confirm your signup – Shyftcut</title>
  <style type="text/css">
    @media only screen and (max-width: 480px) {
      .outer { padding: 20px 12px !important; }
      .card { padding: 28px 20px !important; border-radius: 16px !important; }
      .title { font-size: 18px !important; }
      .body { font-size: 14px !important; }
      .btn { padding: 14px 28px !important; font-size: 14px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:linear-gradient(180deg,#0c0c0e 0%,#121214 100%);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="background:linear-gradient(180deg,#0c0c0e 0%,#121214 100%);min-height:100vh;">
    <tr>
      <td class="outer" align="center" style="padding:40px 20px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;margin:0 auto;">
          <tr>
            <td class="card" style="padding:40px 36px;background:linear-gradient(180deg,#1a1a1d 0%,#161618 100%);border-radius:20px;border:1px solid rgba(255,255,255,0.06);box-shadow:0 8px 32px rgba(0,0,0,0.4),0 0 0 1px rgba(99,102,241,0.08);">
              <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <img src="https://shyftcut.com/shyftcut-email-logo.png" alt="Shyftcut" width="48" height="48" style="display:block;margin:0 auto;border-radius:12px;">
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:6px;">
                    <p style="margin:0;font-size:11px;color:#71717a;letter-spacing:0.08em;text-transform:uppercase;font-weight:500;">Your Career Roadmap in 90 Seconds</p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:8px;">
                    <div style="width:40px;height:3px;background:linear-gradient(90deg,transparent,#6366f1,#818cf8,transparent);border-radius:2px;margin:0 auto;"></div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <h1 class="title" style="margin:0;font-size:22px;font-weight:600;color:#fafafa;letter-spacing:-0.02em;">Confirm your signup</h1>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <p class="body" style="margin:0;font-size:15px;line-height:1.6;color:#a1a1aa;max-width:320px;">Click the button below to verify your email and start building your path.</p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:32px;">
                    <a href="{{ .ConfirmationURL }}" class="btn" style="display:inline-block;padding:16px 36px;background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:14px;box-shadow:0 4px 20px rgba(99,102,241,0.45),0 1px 0 rgba(255,255,255,0.1) inset;">Confirm your email</a>
                  </td>
                </tr>
                <tr>
                  <td style="border-top:1px solid rgba(255,255,255,0.06);padding-top:24px;">
                    <p style="margin:0;font-size:12px;color:#71717a;text-align:center;line-height:1.5;">If you didn't create an account, you can safely ignore this email.</p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:20px;">
                    <p style="margin:0;font-size:11px;color:#52525b;">© Shyftcut</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

## Reset Password

Same styling, uses `{{ .ConfirmationURL }}` (Supabase uses this for the reset link).

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
  <style type="text/css">
    @media only screen and (max-width: 480px) {
      .container { width: 100% !important; max-width: 100% !important; padding: 16px !important; }
      .card { padding: 24px 20px !important; }
      .title { font-size: 18px !important; }
      .body { font-size: 14px !important; }
      .btn { padding: 12px 24px !important; font-size: 14px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#0c0c0e;font-family:Inter,system-ui,-apple-system,sans-serif;">
  <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0c0c0e;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table class="container" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:420px;margin:0 auto;">
          <tr>
            <td class="card" style="padding:32px 28px;background:#18181b;border-radius:12px;border:1px solid rgba(255,255,255,0.08);">
              <table width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <img src="https://shyftcut.com/shyftcut-email-logo.png" alt="Shyftcut" width="44" height="44" style="display:block;margin:0 auto;border-radius:10px;">
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:8px;">
                    <p style="margin:0;font-size:13px;color:#a1a1aa;">Your Career Roadmap in 90 Seconds</p>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 class="title" style="margin:0 0 12px;font-size:20px;font-weight:600;color:#fafafa;">Reset your password</h1>
                    <p class="body" style="margin:0 0 24px;font-size:15px;line-height:1.5;color:#a1a1aa;">Click below to set a new password.</p>
                    <a href="{{ .ConfirmationURL }}" class="btn" style="display:inline-block;padding:14px 32px;background:#6366f1;color:#fff;font-size:15px;font-weight:600;text-decoration:none;border-radius:12px;box-shadow:0 4px 20px rgba(99,102,241,0.4);">Reset password</a>
                    <p style="margin:24px 0 0;font-size:12px;color:#71717a;">If you didn't request this, ignore this email.</p>
                    <p style="margin:20px 0 0;font-size:11px;color:#52525b;">© Shyftcut</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

## Magic Link

Used when users sign in via "Email link" (passwordless). Uses `{{ .ConfirmationURL }}` for the login link.

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Log in to Shyftcut</title>
  <style type="text/css">
    @media only screen and (max-width: 480px) {
      .container { width: 100% !important; max-width: 100% !important; padding: 16px !important; }
      .card { padding: 24px 20px !important; }
      .title { font-size: 18px !important; }
      .body { font-size: 14px !important; }
      .btn { padding: 12px 24px !important; font-size: 14px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#0c0c0e;font-family:Inter,system-ui,-apple-system,sans-serif;">
  <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0c0c0e;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table class="container" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:420px;margin:0 auto;">
          <tr>
            <td class="card" style="padding:32px 28px;background:#18181b;border-radius:12px;border:1px solid rgba(255,255,255,0.08);">
              <table width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <img src="https://shyftcut.com/shyftcut-email-logo.png" alt="Shyftcut" width="44" height="44" style="display:block;margin:0 auto;border-radius:10px;">
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:8px;">
                    <p style="margin:0;font-size:13px;color:#a1a1aa;">Your Career Roadmap in 90 Seconds</p>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 class="title" style="margin:0 0 12px;font-size:20px;font-weight:600;color:#fafafa;">Log in to Shyftcut</h1>
                    <p class="body" style="margin:0 0 24px;font-size:15px;line-height:1.5;color:#a1a1aa;">Click below to sign in. No password needed.</p>
                    <a href="{{ .ConfirmationURL }}" class="btn" style="display:inline-block;padding:14px 32px;background:#6366f1;color:#fff;font-size:15px;font-weight:600;text-decoration:none;border-radius:12px;box-shadow:0 4px 20px rgba(99,102,241,0.4);">Log In</a>
                    <p style="margin:24px 0 0;font-size:12px;color:#71717a;">This link expires in 1 hour. If you didn't request it, ignore this email.</p>
                    <p style="margin:20px 0 0;font-size:11px;color:#52525b;">© Shyftcut</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Logo note

The template uses `https://shyftcut.com/shyftcut-email-logo.png` — a small 88×88 PNG (~8KB) in `public/`. Deploy the app so this URL is live. If the logo still doesn’t load, check:

1. The site is deployed and the path is reachable.
2. Your email client is allowed to load images (Gmail/Outlook often block by default; users may need to click “Display images”).
