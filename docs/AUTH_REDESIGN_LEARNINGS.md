# Auth Pages Redesign – Learnings & Implementation

This document captures design patterns adopted from the reference SignIn component and how they were integrated into Shyftcut's auth flow.

---

## Learnings from the Reference Component

### 1. **Split-Screen Layout**
- **Desktop**: Form on the left (50%), hero image + testimonials on the right (50%)
- **Mobile**: Form only, full width (hero section hidden via `hidden md:block`)
- Uses `100dvh` / `100dvw` for modern viewport units

### 2. **Glass-Input Wrapper**
- Custom input styling: `rounded-2xl`, `border`, `bg-foreground/5`, `backdrop-blur-sm`
- Focus states: `focus-within:border-primary/70`, `focus-within:bg-primary/5`
- Replaces standard shadcn Input for a softer, more modern look on auth pages

### 3. **Social Proof (Testimonials)**
- Testimonial cards on the hero section with avatar, name, handle, and quote
- Responsive: 1 card on tablet, 2 on xl, 3 on 2xl
- Animations: staggered entrance with `animate-testimonial` and delays

### 4. **Password Visibility Toggle**
- Eye / EyeOff icons from lucide-react for show/hide password
- Improves UX and accessibility

### 5. **Staggered Entrance Animations**
- `animate-element` with `animate-delay-100` through `animate-delay-900` for form elements
- `animate-slide-right-auth` for hero image
- `animate-testimonial` with `animate-delay-1000/1200/1400` for testimonial cards
- Keyframes: `fade-slide-in`, `slide-right-in`, `testimonial-in` (opacity, blur, transform)

### 6. **Google Icon**
- Full-color SVG (multi-path) instead of monochrome for brand recognition

### 7. **Typography & Hierarchy**
- Large headings: `text-4xl md:text-5xl`, `font-semibold`, `leading-tight`
- Light tracking for titles: `font-light tracking-tighter`
- Clear label/description hierarchy with `text-muted-foreground`

---

## Implementation in Shyftcut

### New Components
| Component | Path | Purpose |
|-----------|------|---------|
| `GlassInputWrapper` | `src/components/ui/auth-glass-input.tsx` | Glass-morphism input wrapper for auth forms |
| `AuthTestimonialCard` | `src/components/ui/auth-testimonial-card.tsx` | Testimonial card with avatar, name, handle, text |
| `AuthLayout` | `src/components/auth/AuthLayout.tsx` | Split-screen layout with logo, hero, testimonials |

### New Utilities
| File | Purpose |
|------|---------|
| `src/lib/auth-testimonials.ts` | Maps Shyftcut testimonials to AuthLayout format, provides `AUTH_HERO_IMAGE` |

### Styles Added
- **`src/index.css`**: `animate-element`, `animate-delay-*`, `animate-slide-right-auth`, `animate-testimonial`, keyframes `fade-slide-in`, `slide-right-in`, `testimonial-in`
- **`tailwind.config.ts`**: Keyframes and animation utilities (optional, also defined in CSS)

### Pages Updated
- **Login** – Full redesign with AuthLayout, GlassInputWrapper, password toggle, hero + testimonials
- **Signup** – Same layout and patterns
- **ForgotPassword** – Same layout
- **ResetPassword** – Same layout, plus fix for `hadRecoveryHash.current` bug (was boolean, not ref)

---

## Compatibility

- **shadcn**: Uses existing components (Button, etc.) and `@/components/ui` path
- **Tailwind CSS**: Tailwind 3.x with `tailwindcss-animate`
- **TypeScript**: Full type safety
- **i18n**: Uses `useLanguage()` and existing auth translation keys
- **E2E tests**: Preserved `data-testid` attributes (`login-form`, `login-email`, `login-password`, `signup-form`, etc.)

---

## Hero Image

Uses Unsplash (career/team theme):
`https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=2160&q=80`

To change, update `AUTH_HERO_IMAGE` in `src/lib/auth-testimonials.ts`.

---

## Future Enhancements (Optional)

1. **"Keep me signed in"** – Add checkbox + translation key; wire to Supabase session persistence if needed
2. **Custom checkbox styling** – Reference uses `.custom-checkbox`; could add shadcn Checkbox styling
3. **Different hero per page** – Login vs Signup could use different images
4. **tw-animate-css** – Reference mentioned `@import "tw-animate-css"`; Shyftcut uses `tailwindcss-animate` instead
