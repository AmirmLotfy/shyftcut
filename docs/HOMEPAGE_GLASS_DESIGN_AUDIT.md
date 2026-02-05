# Public Homepage — Glass Design Audit (2025/2026)

Audit of the full public homepage design against 2025–2026 glassmorphism and award-winning UI trends.

---

## Part 1: Current Homepage Design Inventory

### Sections (in order)

| Section | Components | Background | Cards/Buttons |
|---------|------------|------------|---------------|
| **Hero** | HeroBlobs, InteractiveGradient, HeroTrustCard, HeroProductPreview, HeroMarquee | mesh-gradient, subtle bg image with mask | Badge (glass), CTAs (rounded-full, btn-glow), trust bullets |
| **Stats** | 4 stat blocks | `bg-muted/20` | Plain text, no cards; borders between items |
| **Features** | FeatureSpotlight, BentoGrid | `bg-background` | BentoCard (border, bg-card/50, backdrop-blur), FeatureSpotlight card (gradient border, backdrop-blur) |
| **Testimonials** | TestimonialMarquee | `border-t` | blockquote cards (rounded-xl, border, bg-card) |
| **Platform Integrations** | PlatformIntegrations | `bg-muted/20` | Grid cards (border-border/50, bg-card/50, hover) |
| **Success Stories** | SuccessStories | — | Likely card-based |
| **AI Demo** | AIDemo | — | Interactive demo |
| **How It Works** | InteractiveTimeline | — | Timeline / steps |
| **Pricing** | FeatureComparison, Choose plan card | `bg-muted/20` | FeatureComparison (border-2, bg-card), sticky card (border-primary/40) |
| **Blog** | BlogCard × 3 | `bg-muted/30` | BlogCard (border-border/50, bg-card/50, backdrop-blur) |
| **CTA** | Final CTA | `bg-gradient from-primary/5 via-primary/10`, mesh-gradient | Primary button (btn-glow) |

### Cards

| Component | Current Styling | Glass Elements |
|-----------|-----------------|----------------|
| **HeroTrustCard** | `rounded-3xl border border-border/60 bg-card/40 backdrop-blur-xl` | ✅ Good: blur, semi-transparent bg |
| **HeroProductPreview** | `border border-border/60 bg-card/90 backdrop-blur-xl` | ✅ Good |
| **HeroMarquee** | `border border-border/60 bg-card/40 backdrop-blur-xl` | ✅ Good |
| **BentoCard** | `border-border/50 bg-card/50 backdrop-blur` | ⚠️ Light glass; could be stronger |
| **FeatureSpotlight card** | `border-border/60 bg-gradient from-card/90 to-card/70 backdrop-blur` | ✅ Good |
| **BlogCard** | `border-border/50 bg-card/50 backdrop-blur` | ⚠️ Light |
| **TestimonialMarquee blockquote** | `rounded-xl border border-border bg-card` | ❌ Solid bg, no blur |
| **PlatformIntegrations** | `border-border/50 bg-card/50` | ❌ No backdrop-blur |
| **FeatureComparison** | `border-2 border-border/60 bg-card` | ❌ Solid, no glass |
| **Pricing sticky card** | `border-2 border-primary/40 bg-card` | ❌ Solid |

### Buttons

| Context | Current Styling |
|---------|-----------------|
| **Hero primary** | `btn-glow rounded-full hover:scale-[1.02]` |
| **Hero secondary** | `rounded-full border border-border/60 bg-foreground/5 backdrop-blur-sm` |
| **FeatureSpotlight** | Standard Button + `shadow-lg shadow-primary/20` |
| **Blog "All posts"** | `variant="outline"` |
| **CTA section** | `btn-glow shadow-xl shadow-primary/25` |
| **Pricing "View plans"** | Standard Button + `shadow-md` |

### Base Design System (index.css)

- **Glass vars**: `--glass-bg`, `--glass-border`
- **Classes**: `glass-card`, `glass-effect`, `content-card`, `dashboard-card`
- **Gradients**: `gradient-text`, `gradient-primary`, `mesh-gradient`
- **Buttons**: `btn-glow` (shadow + hover lift)

---

## Part 2: 2025/2026 Glass Design Trends & Best Practices

### Core 2025–2026 Glass Principles

1. **Opacity & transparency** — Semi-transparent fills (0.2–0.5 alpha typical)
2. **Background blur** — `backdrop-filter: blur()` essential; “more blur is better” on busy backgrounds (NN Group)
3. **Subtle borders** — Light strokes (often white/10 or similar) to define edges
4. **Layered depth** — Glass elements connect foreground to background
5. **Restraint** — Used sparingly for hierarchy; overuse harms usability

### Apple Liquid Glass (WWDC 2025)

- Real-time lensing, refraction, adaptive contrast
- Motion responsiveness
- Elevated beyond static frosted glass

### NN Group Best Practices

- **Contrast**: Ensure text meets WCAG over translucent areas
- **More blur on complex backgrounds** — Reduces distraction, improves focus
- **User control**: Respect `prefers-reduced-motion` and allow transparency/contrast adjustments

### Award-Winning Examples (e.g. Apple Design Awards)

- Tide Guide, Crumbl, GrowPal, Lumy, Sky Guide — redesigned with Liquid Glass
- Consistent glass materials across surfaces
- Clear hierarchy and restrained use

---

## Part 3: Gap Analysis & Recommendations

### Strengths

- Hero badge, secondary CTA, HeroTrustCard, HeroProductPreview, HeroMarquee use glass well
- Rounded-full CTAs and `btn-glow` match current trends
- Design tokens (--glass-bg, --glass-border) exist
- Staggered animations and gradient text add polish

### Gaps vs 2025/2026 Glass

| Area | Gap | Recommendation |
|------|-----|----------------|
| **Stats section** | Flat, no glass | Add `backdrop-blur` + semi-transparent cards or use `glass-card` |
| **BentoCard** | Light glass (bg-card/50) | Increase blur (`backdrop-blur-xl`), consider `bg-card/40` for stronger effect |
| **TestimonialMarquee** | Solid bg | Add `backdrop-blur-xl` and `bg-card/60` or `glass-card` |
| **PlatformIntegrations** | No blur | Add `backdrop-blur-md` or `backdrop-blur-xl` |
| **FeatureComparison** | Solid | Add `backdrop-blur` and semi-transparent bg for pricing section consistency |
| **BlogCard** | Light glass | Consider `backdrop-blur-xl` and slightly lower opacity |
| **Pricing sticky card** | Solid | Add `backdrop-blur-xl` and `bg-card/80` for glass feel |
| **Section backgrounds** | `bg-muted/20`, `bg-muted/30` | Consider subtle gradient or mesh overlays for more depth behind glass |
| **Buttons** | Most are solid | Secondary/ghost buttons already use glass; primary can stay solid for contrast |
| **Reduced motion** | — | Confirm `prefers-reduced-motion` is respected (index.css has rules) |

### Consistency Suggestions

1. **Card glass formula** — Standardize: `rounded-2xl border border-border/60 bg-card/50 backdrop-blur-xl` for public cards
2. **Border** — Use `border-border/60` or `border-white/10` (dark) for glass edges
3. **Blur** — Prefer `backdrop-blur-xl` (16–24px) for cards on complex backgrounds
4. **Hover** — Subtle border/glow on hover (as in `dashboard-card`)

### Accessibility Checklist

- [ ] Verify text contrast over all glass surfaces (WCAG AA)
- [ ] Test with `prefers-reduced-motion: reduce`
- [ ] Consider optional “reduce transparency” setting for users who need it

---

## Summary

The homepage already uses glass on the hero and some key cards. To align with 2025/2026 award-winning glass design:

1. Add `backdrop-blur` to Stats, Testimonials, PlatformIntegrations, FeatureComparison, and Pricing cards
2. Strengthen glass on BentoCard and BlogCard
3. Standardize a public “glass card” class similar to `dashboard-card`
4. Keep primary buttons solid for clarity; use glass for secondary/ghost and card containers
