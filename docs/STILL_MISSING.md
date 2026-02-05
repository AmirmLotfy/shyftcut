# What's Still Missing (Shyftcut)

Quick checklist of optional items. **Authoritative deployment guide:** [docs/DEPLOYMENT.md](DEPLOYMENT.md).

---

## Assets

| Item | Status | Action |
|------|--------|--------|
| **og-image.png** | OK | `public/og-image.png` present (copy of logo). For optimal social previews, replace with a 1200×630 image. |
| Favicon / PWA icons | OK | `public/Shyftcut-logo.png`, `public/icons/`, `public/manifest.json` present. |

---

## Polar Webhook

**URL:** `https://<project-ref>.supabase.co/functions/v1/webhook-polar`

(Not Vercel. The webhook is handled by the Supabase Edge Function `webhook-polar`.)

---

## Optional Improvements

1. **Error tracking:** Set `VITE_SENTRY_DSN` and integrate Sentry in ErrorBoundary.
2. **Chunk size:** Consider code-splitting for heavy routes (e.g. recharts on Dashboard).
3. **Browserslist:** Run `npx update-browserslist-db@latest` occasionally.
