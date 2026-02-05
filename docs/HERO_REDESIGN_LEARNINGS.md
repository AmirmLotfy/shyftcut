# Hero Redesign – Learnings from Glassmorphism Trust Hero

Design patterns adopted from the reference component and how they were integrated into Shyftcut's landing hero.

---

## Learnings from the Reference

### 1. **Glass Morphism Badge**
- `border border-white/10 bg-white/5 backdrop-blur-md` → Adapted to `border-border/60 bg-foreground/5 backdrop-blur-md` for theme support
- Hover: `hover:bg-white/10` → `hover:bg-foreground/10`

### 2. **Background Image with Gradient Mask**
- Full-bleed background image with vertical mask (transparent top/bottom, visible middle)
- `maskImage: linear-gradient(180deg, transparent, black 5%, black 75%, transparent)`
- Low opacity (12% light / 8% dark) for subtle depth without overpowering

### 3. **Grid Layout**
- 12-column grid: left `lg:col-span-7`, right `lg:col-span-5`
- Right column holds trust/social proof instead of only product preview

### 4. **Stats Card (Glass Morphism)**
- Rounded-3xl, border, bg with opacity, backdrop-blur-xl
- Icon + main stat (e.g. "90+ Roadmaps Generated")
- Progress bar with label
- Mini stats grid with separators
- Tag pills (ACTIVE with ping, AI-POWERED with Crown)

### 5. **Trusted-by Marquee**
- Card with heading + infinite scroll of brand/platform logos
- Mask on edges for fade effect
- CSS marquee: translateX(-50%) with 3× content for seamless loop

### 6. **CTA Buttons**
- Primary: `rounded-full`, scale on hover/active
- Secondary: glass style `border border-border/60 bg-foreground/5 backdrop-blur-sm`

---

## Implementation in Shyftcut

### New Components
| Component | Path | Purpose |
|-----------|------|---------|
| `HeroTrustCard` | `src/components/home/HeroTrustCard.tsx` | Glass stats card with progress bar, mini stats, tag pills |
| `HeroMarquee` | `src/components/home/HeroMarquee.tsx` | Trusted learning platforms marquee with Simple Icons |

### Landing Page Changes
- **Desktop hero**: Grid layout (7 + 5 cols), background image with mask, glass badge, rounded-full CTAs
- **Right column**: HeroTrustCard → HeroProductPreview → HeroMarquee
- **Mobile hero**: Glass badge, rounded-full CTAs

### Assets
- Background: `https://images.unsplash.com/photo-1522071820081-009f0129c71c` (career/team theme)
- Platform logos: Simple Icons via jsDelivr (Udemy, Coursera, edX, etc.)
