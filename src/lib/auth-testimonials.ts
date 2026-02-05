import { testimonials } from "@/data/testimonials";
import type { AuthTestimonial } from "@/components/ui/auth-testimonial-card";

/** Hero image for auth split-screen. Uses a career/professional theme. Self-hosted WebP for fast load. */
export const AUTH_HERO_IMAGE = "/images/auth-hero.webp";

/** Maps Shyftcut testimonials to AuthLayout format. Uses `lang` for i18n (en/ar). */
export function getAuthTestimonials(lang: "en" | "ar" = "en"): AuthTestimonial[] {
  const fallbackAvatars = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
  ];
  return testimonials.slice(0, 3).map((t, i) => ({
    avatarSrc: t.avatar ?? fallbackAvatars[i] ?? fallbackAvatars[0],
    name: t.author,
    handle: typeof t.role === "object" ? t.role[lang] : t.role,
    text: typeof t.quote === "object" ? t.quote[lang] : t.quote,
  }));
}
