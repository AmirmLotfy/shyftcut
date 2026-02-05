# Footer Redesign – Learnings from Reference Component

Design patterns adopted from the footer-section component and how they were integrated into Shyftcut's Footer.

---

## Learnings from the Reference

### 1. **4-Column Grid Layout**
- `grid gap-12 md:grid-cols-2 lg:grid-cols-4` for responsive columns
- Columns: Stay Connected (newsletter) | Quick Links | Contact Us | Follow Us

### 2. **Newsletter with Inline Send Button**
- Input with `pr-12` to make room for button
- Button `absolute right-1 top-1` with `size="icon"` and `rounded-full`
- Send icon (lucide-react) instead of text label
- `hover:scale-105` on submit button

### 3. **Glow Effect**
- `absolute -right-4 top-0 h-24 w-24 rounded-full bg-primary/10 blur-2xl` on newsletter column

### 4. **Social Icons as Buttons with Tooltips**
- `Button variant="outline" size="icon" className="rounded-full"`
- Each wrapped in `Tooltip` + `TooltipTrigger` + `TooltipContent`
- Descriptive hover text ("Follow us on Instagram", etc.)

### 5. **Theme Toggle (Sun/Moon + Switch)**
- Sun and Moon icons with Switch between them
- Wired to next-themes via `useTheme()` and `setTheme()`
- Label with `sr-only` for accessibility

### 6. **Footer Styling**
- `bg-background` instead of muted
- `transition-colors duration-300` for theme transitions
- `border-t` for top border

### 7. **Bottom Bar**
- `flex flex-col md:flex-row` with `border-t pt-8`
- Copyright left, nav links right
- Links: Privacy Policy, Terms of Service, Cookie Settings

---

## Implementation in Shyftcut

### NewsletterSignup Changes
- Footer variant: Input with Send icon button inside (absolute positioned)
- Loading state: Loader2 spinner
- Success state: Check icon
- RTL support: `rtl:right-auto rtl:left-1` for button position

### Footer Changes
- 4-column grid on desktop (Newsletter | Product | Company | Follow Us)
- Newsletter section with glow effect
- Social icons as Button outline rounded-full with Tooltips
- Theme toggle: Sun/Moon + Switch wired to next-themes
- Bottom bar: copyright + Privacy, Terms, Cookie Settings, Frameless link
- Mobile: Accordion for Product/Company links (legal moved to bottom bar)
- Preserved i18n (EN/AR) and existing link structure
