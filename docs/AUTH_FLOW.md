# Auth system (front + back)

Shyftcut uses **Supabase Auth** on the frontend and **Vercel serverless** on the backend. Session is synced via `/api/auth/session`.

---

## 1. Frontend

### Config

- **`src/lib/supabase.ts`** – Supabase client from `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`. Used for sign up, sign in, OAuth, and session.

### Auth context

- **`src/contexts/AuthContext.tsx`**
  - On load: `supabase.auth.getSession()` then, if there’s a session, `fetchSessionUser(access_token)` → `GET /api/auth/session` with `Authorization: Bearer <token>`.
  - `onAuthStateChange`: on sign in/out/refresh, calls `syncSessionFromSupabase(access_token)` (same session fetch) or `clearSession()`.
  - **Sign up**: `supabase.auth.signUp({ email, password, options: { data: { display_name } } })` then sync session.
  - **Sign in**: `supabase.auth.signInWithPassword({ email, password })` then sync session.
  - **Google**: `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: origin + pathname } })` – user is sent to Google then back to that URL with `#access_token=...` in the hash. Supabase client parses the hash and sets the session; context then calls `/api/auth/session` to get app user.

### Routes

- **`/login`**, **`/signup`** – public; use `useAuth()` and redirect to `/dashboard` when already logged in.
- **Protected routes** – wrapped in `ProtectedRoute` (redirect to `/login` when no user): `/wizard`, `/dashboard`, `/roadmap`, `/courses`, `/chat`, `/profile`, `/checkout/success`, `/checkout/cancel`.

### API calls

- **`src/lib/api.ts`** – `apiPath(path)` (same-origin when `VITE_API_URL` is unset), `apiFetch(path, { token })` sends `Authorization: Bearer <token>`.
- Session user is loaded only via `GET /api/auth/session` with the Supabase access token.

---

## 2. Backend

### JWT verification

- **`server/lib/auth.ts`**
  - **`getAuthUser(authHeader)`** – returns `{ id, email, user_metadata }` or `null`.
  - Verifies **Supabase JWT** via:
    1. **JWKS** (preferred): `SUPABASE_URL/auth/v1/.well-known/jwks.json` (ES256). No `SUPABASE_JWT_SECRET` needed for access tokens.
    2. **Legacy**: if JWKS fails and `SUPABASE_JWT_SECRET` is set, uses HS256.

### Session endpoint

- **`api/auth/session.ts`** (dedicated route so Vercel serves `/api/auth/session` directly).
- **`server/handlers/auth/session.ts`**:
  - **GET** only; expects `Authorization: Bearer <access_token>`.
  - `getAuthUser(authHeader)` → 401 if invalid/missing.
  - `ensureProfileAndSubscription(userId, email, display_name)` – upserts `profiles`, inserts `subscriptions` if missing.
  - Loads profile from DB; uses Supabase Admin to get `auth_methods` (has_password, has_google).
  - Returns `{ user: { id, email, user_metadata, avatar_url, auth_methods } }`.

### Other auth-related handlers

- **`server/handlers/auth/sync.ts`** – same as session (ensure profile + subscription, return user).
- **`server/handlers/auth/account.ts`** – delete account (password check + Supabase Admin delete user + delete app data).
- **`server/handlers/auth/set-password.ts`** – set password (Supabase Admin).
- **`server/handlers/auth/change-password.ts`** – change password (verify current via token endpoint, then Admin).

All protected handlers call `getAuthUser(req.headers.authorization)` and return 401 when null.

### DB / Supabase Admin

- **`server/lib/ensureUser.ts`** – `ensureProfileAndSubscription(userId, email, displayName)` upserts `profiles`, inserts `subscriptions` with tier `free` if missing.
- **`server/lib/supabaseAdmin.ts`** – Supabase client with `SUPABASE_SERVICE_ROLE_KEY` for Admin API (getUserById, updateUserById, deleteUser).
- **`server/lib/db.ts`** – Postgres via `SUPABASE_DB_URL` (or `DATABASE_URL`).

---

## 3. OAuth (Google) flow

1. User clicks “Sign in with Google” → `signInWithOAuth({ provider: 'google', redirectTo: origin + pathname })`.
2. Redirect to Supabase → Google → Supabase callback.
3. Supabase redirects to `redirectTo` with hash `#access_token=...&refresh_token=...&...`.
4. App loads (e.g. `/login`); Supabase client parses hash and sets session.
5. `onAuthStateChange` fires → `syncSessionFromSupabase(access_token)` → `GET /api/auth/session` with Bearer token.
6. Backend verifies JWT (JWKS), ensures profile/subscription, returns user; frontend stores user and token.

**First-time Google sign-in (no prior sign-up)**  
There is no separate sign-up step. Supabase creates the user in `auth.users` on first Google sign-in. The first call to `/api/auth/session` runs `ensureProfileAndSubscription`, which creates the `profiles` row (and `subscriptions` free tier) if missing. Display name comes from `user_metadata.full_name` / `name` (Google) or `display_name` (email sign-up), else email prefix or `"User"`.

**Supabase Dashboard**

- **Authentication → URL Configuration**: set **Site URL** (e.g. `https://shyftcut.com`) and add **Redirect URLs** (e.g. `https://shyftcut.com`, `https://shyftcut.com/login`, and preview URLs if needed).
- **Authentication → Providers → Google**: enable and set Google OAuth client ID/secret; redirect URI is `https://<project_ref>.supabase.co/auth/v1/callback`.

---

## 4. Env (summary)

| Env | Where | Purpose |
|-----|--------|--------|
| `VITE_SUPABASE_URL` | Frontend | Supabase client |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Supabase client |
| `SUPABASE_URL` | Server | JWKS URL + Supabase Admin |
| `SUPABASE_ANON_KEY` | Server | Optional (e.g. password verify) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Admin API (session auth_methods, set/change password, delete user) |
| `SUPABASE_JWT_SECRET` | Server | Optional; only for legacy HS256 tokens |
| `SUPABASE_DB_URL` | Server | Postgres (profiles, subscriptions, etc.) |

---

## 5. Fixes applied

- **`/api/auth/session` 404**: Added **`api/auth/session.ts`** so Vercel routes `/api/auth/session` to a dedicated function instead of the catch-all (avoids path parsing issues with custom domains/full URLs).
- **CSP**: Allowed `https://www.googletagmanager.com` and `https://www.google-analytics.com` in `script-src` and `connect-src` in `vercel.json` for gtag.
- **Login hash**: OAuth redirect to e.g. `/login#access_token=...` is correct; Supabase client parses the hash and the context then calls `/api/auth/session`; the dedicated session route ensures that call succeeds.
