# API 404 Troubleshooting

If you see `GET https://xxx.supabase.co/functions/v1/api 404 (Not Found)` in the browser console, the Supabase Edge Function `api` is either not deployed or not reachable.

## Fix: Deploy the API function

```bash
npx supabase functions deploy api --no-verify-jwt
```

Or deploy all functions (migrations + Edge Functions + Vercel):

```bash
npm run deploy:all
```

## Verify deployment

```bash
npm run verify:api
```

This calls `/api/health` and confirms the API is responding. If you get a network error or 404, the function is not deployed.

## 500 errors

If the API returns 500, check:

1. **Supabase Edge Function logs** — Dashboard → Edge Functions → `api` → Logs
2. **Migrations applied** — Run `npx supabase db push` to create all tables (badges, study_groups, etc.)
3. **Secrets set** — GEMINI_API_KEY, SUPABASE_SERVICE_ROLE_KEY, etc. in Edge Function secrets

## Common causes

| Cause | Solution |
|-------|----------|
| Function not deployed | Run `npx supabase functions deploy api --no-verify-jwt` |
| Wrong VITE_API_URL | Set in Vercel → Project → Settings → Environment Variables |
| Supabase project not linked | Run `npx supabase link` and select the correct project |
| Function name mismatch | The function folder must be `supabase/functions/api/` |
| Migrations not applied | Run `npx supabase db push` |
