# Supabase migration checklist (ready for MCP or Dashboard)

Everything in the codebase is wired for Supabase. Use this list with Supabase MCP or the Dashboard.

---

## 1. Project and connection

- [ ] Supabase project exists (or create one).
- [ ] Note: **Project URL**, **anon key**, **service_role key**, **JWT Secret** (Settings → API).
- [ ] Note: **Database connection string** – use **Transaction** pooler, port **6543** (Settings → Database → Connection string).

---

## 2. Apply schema (one-time)

**Done via CLI:** Initial migration `20260201200000_initial_shyftcut_schema.sql` was pushed to the Shyftcut project with `supabase link --project-ref qydmjbiwukwlmblosolb` and `supabase db push`.

Alternatively, run the full contents of **`supabase/schema.sql`** in the Supabase SQL editor (or via MCP).

This creates:

- `subscription_tier` enum
- `profiles` (with `email`), `subscriptions`, `roadmaps`, `roadmap_weeks`, `course_recommendations`, `quiz_results`, `chat_history`, `newsletter_subscribers`
- Triggers and indexes

No `public.users` table; auth uses `auth.users`. All tables use `user_id` = `auth.uid()`.

If the project already has some of these objects, the script may error on duplicates; create missing objects or run on a fresh project.

---

## 3. Auth: Google provider (optional)

- [ ] **Authentication → Providers → Google** → Enable.
- [ ] Add Google OAuth Client ID and Secret (from Google Cloud Console).
- [ ] Redirect URL is: `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback`.

---

## 4. Environment variables

**Vercel:** The following Supabase env vars were added via Vercel CLI for Production, Preview, and Development with placeholder values. Replace them in **Vercel Dashboard → Project → Settings → Environment Variables** with your real Supabase values (Settings → API and Database in Supabase).

Set these in **Vercel** (and in local `.env` for dev):

| Variable | Where to get it |
|----------|------------------|
| `VITE_SUPABASE_URL` | Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Settings → API → anon public |
| `SUPABASE_URL` | Same as Project URL |
| `SUPABASE_ANON_KEY` | Same as anon key |
| `SUPABASE_JWT_SECRET` | Settings → API → JWT Secret |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → service_role |
| `SUPABASE_DB_URL` | Settings → Database → Connection string (Transaction pooler, port 6543) |

---

## 5. After schema + env

- [ ] Redeploy on Vercel (or run locally with `npm run dev` and the env vars above).
- [ ] Test: sign up, sign in, Google sign-in, profile, subscription, roadmap, chat, quiz, checkout.

---

## Using Supabase MCP

**Note:** Supabase MCP is not enabled for this project (only cursor-ide-browser, cursor-browser-extension, user-polar are available). To use Supabase MCP here:

1. Add the Supabase MCP server for this project and set `project_ref` to your Shyftcut Supabase project (see Cursor MCP config).
2. Then use **apply_migration** or **execute_sql** with the full contents of **`supabase/schema.sql`**.

**Without MCP:** Run the full contents of **`supabase/schema.sql`** in the Supabase Dashboard → SQL Editor.

After applying schema:

- Confirm in the Dashboard that the tables and enum exist under **Table Editor** and **Database → Types**.
- No data migration is required for a **new** Supabase project; profile and subscription rows are created lazily on first login.
