# Arabic translations audit – public & protected pages

**Summary:** Every page has Arabic support in some form. No page is English-only. The split is between pages that use **centralized** translations (`t()` from `LanguageContext`) and pages that use **inline** bilingual strings (`language === 'ar' ? '...' : '...'`).

---

## Pages with centralized Arabic (use `t()` from LanguageContext)

These pages get Arabic from `LanguageContext`; all user-facing strings use translation keys.

| Route | Page | Access |
|-------|------|--------|
| `/login` | Login | Public |
| `/signup` | Signup | Public |
| `/chat` | Chat | Protected |
| `/upgrade` | Upgrade | Protected |
| `/support` | Support | Protected |
| `/wizard` | Wizard | Public |
| `/dashboard` | Dashboard | Protected |
| `/profile` | Profile | Protected |
| `/roadmap`, `/roadmap/:id` | Roadmap | Protected |
| `/courses` | Courses | Protected |
| `/checkout/cancel` | CheckoutCancel | Protected |
| `/checkout/success` | CheckoutSuccess | Protected (mostly; one link still inline) |

---

## Pages with inline Arabic only (no `t()` for those strings)

Arabic is present via `language === 'ar' ? 'عربي' : 'English'` (or `isAr ?`), but **not** in `LanguageContext`. Moving these to `t()` would centralize copy and keep RTL/consistency in one place.

### Public

| Page | File | Notes |
|------|------|--------|
| **Landing** | `Landing.tsx` | Hero, stats, CTA, pricing teaser, blog section, footer – all inline |
| **About** | `About.tsx` | Title, mission, values, journey, CTA – all inline |
| **Blog** | `Blog.tsx` | Title, search placeholder, empty state, clear filters – inline |
| **BlogPost** | `BlogPost.tsx` | Not found, back link, CTA, related – inline; post content has en/ar in data |
| **Careers** | `Careers.tsx` | Title, why join, open positions, apply, hiring process – inline |
| **Contact** | `Contact.tsx` | Title, form labels, placeholders, toasts, FAQ – inline |
| **Terms** | `Terms.tsx` | TOC, section titles, body – inline en/ar |
| **Privacy** | `Privacy.tsx` | TOC, key points, section titles, body – inline en/ar |
| **Cookies** | `Cookies.tsx` | TOC, section titles, table headers, body – inline en/ar |
| **Refund** | `Refund.tsx` | Title, sections, bullet list, cancellation – inline en/ar |
| **Pricing** | `Pricing.tsx` | Uses local `plans.en` / `plans.ar`; UI labels (Save 30%, Most Popular, FAQ, etc.) – inline `isAr` |
| **NotFound** | `NotFound.tsx` | Title, description, Go Back, Home – inline |
| **Error** | `Error.tsx` | Title, description, quick links, help – inline |

### Protected

| Page | File | Notes |
|------|------|--------|
| **Study** | `Study.tsx` | Pomodoro labels, phase names, settings, tooltips – all inline `isAr` |
| **CareerTools** | `CareerTools.tsx` | Toasts (text short, analysis done, jobs found, errors) – inline |
| **CheckoutSuccess** | `CheckoutSuccess.tsx` | One link text still `language === 'ar' ? '...' : '...'`; rest uses `t()` |

---

## Recommendation

- **No page is missing Arabic.** You can safely assume every listed page is localized for Arabic (and RTL where applied).
- To have **one source of truth** and easier updates:
  - Add keys to `LanguageContext` (en + ar) for the strings used in the "inline only" pages.
  - Replace `language === 'ar' ? '...' : '...'` (and `isAr ? ...`) with `t('section.key')` in:
    - Public: Landing, About, Blog, BlogPost, Careers, Contact, Terms, Privacy, Cookies, Refund, Pricing, NotFound, Error
    - Protected: Study, CareerTools, and the remaining link in CheckoutSuccess.

After that, all pages will use Arabic (and any other languages) from the same translation context.
