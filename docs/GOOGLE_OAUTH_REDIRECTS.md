# Google OAuth: Two Different "Redirects"

There are two different redirects; they are often confused.

---

## 1. Google’s “Authorized redirect URI” (Google Cloud Console)

**What it is:** The URL **Google** sends the user’s browser to **after** they sign in on **Google’s** page.

**What it is not:** It is **not** “where to send the user after they’re logged into your app” (e.g. dashboard). That’s your app’s job.

**Flow:**

1. User is on your app (e.g. `https://shyftcut.com/login`).
2. User clicks “Sign in with Google”.
3. Browser goes to Google; user signs in and consents.
4. **Google** redirects the browser **back to your app** (to one of your “Authorized redirect URIs”). With implicit flow, the token is in the URL fragment; the library reads it and calls your `onSuccess`.
5. Your app (e.g. still on `/login`) runs `onSuccess`, exchanges the token with your API, saves the session, and **your code** then sends the user to dashboard (or wizard).

So “Authorized redirect URIs” in Google Console = “Which URLs of **my site** is Google allowed to send the user back to?”  
That should be your **origins** (and optionally the exact paths where the OAuth flow runs), e.g.:

- `https://shyftcut.com`
- `https://shyftcut.vercel.app`
- `http://localhost:5173` (for local dev)

You do **not** put `https://shyftcut.com/dashboard` there as “where to go after login”. Dashboard is where **your app** navigates after you’ve processed the token.

---

## 2. Your app’s “after sign-in” redirect (dashboard / wizard)

**What it is:** After Google sign-in succeeds, **your app** should send the user somewhere useful (e.g. dashboard, or wizard for new users).

**How we do it today:**

- **Login:** When `user` is set (after Google or email sign-in), `useEffect` runs and does `navigate(from ?? '/dashboard')`. So the user goes back to the page they came from (e.g. protected route) or to dashboard.
- **Signup:** When `user` is set, `useEffect` runs and does `navigate('/dashboard')`. Dashboard shows “Create your roadmap” if they have no roadmap, so new users can go to the wizard from there.

So:

- **Google’s redirect URI** = where **Google** sends the user (your origin, e.g. `https://shyftcut.com`).
- **Our redirect** = where **we** send the user after login (dashboard, or “from” if they hit login from a protected page). That’s already implemented in Login/Signup.

---

## Summary

| Redirect              | Who does it | Meaning |
|-----------------------|------------|--------|
| Authorized redirect URI (Google Console) | Google     | “Where am I allowed to send the user back to?” → Your app’s origin (e.g. `https://shyftcut.com`, `https://shyftcut.vercel.app`). |
| Navigate to dashboard / wizard          | Your app   | “After we have a session, where do we send the user?” → Implemented in Login/Signup with `navigate(from ?? '/dashboard')` or `navigate('/dashboard')`. |

So: keep **Authorized redirect URIs** as your **origins** only. The “redirect to dashboard (or wizard)” is already handled in the app and does not go in Google Console.
