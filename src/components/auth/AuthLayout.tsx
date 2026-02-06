import * as React from "react";
import { Link } from "react-router-dom";
import { LOGO_PATH } from "@/lib/seo";
import { AuthTestimonialCard, type AuthTestimonial } from "@/components/ui/auth-testimonial-card";
import { cn } from "@/lib/utils";

const GoogleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 48 48"
    aria-hidden
  >
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z"
    />
    <path
      fill="#FF3D00"
      d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z"
    />
  </svg>
);

export interface AuthLayoutProps {
  children: React.ReactNode;
  /** Hero image URL. When set, shows split-screen with hero on desktop. */
  heroImageSrc?: string;
  /** Testimonials for social proof on the hero section. */
  testimonials?: AuthTestimonial[];
  /** Optional custom logo link content. */
  logoSlot?: React.ReactNode;
  /** Additional class for the outer container. */
  className?: string;
}

export function AuthLayout({
  children,
  heroImageSrc,
  testimonials = [],
  logoSlot,
  className,
}: AuthLayoutProps) {
  return (
    <div
      className={cn(
        "min-h-[100dvh] h-[100dvh] flex flex-col md:flex-row w-[100dvw] font-sans overflow-hidden",
        className
      )}
    >
      {/* Left column: form - fixed height, no scroll, tighter layout on desktop */}
      <section
        className="flex-1 flex items-center justify-center overflow-y-auto overflow-x-hidden py-4 px-4 sm:px-6 md:py-6 md:px-8 min-h-0"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <div className="w-full max-w-md flex flex-col gap-4 md:gap-5">
          {logoSlot ?? (
            <Link
              to="/"
              className="mb-2 md:mb-4 flex items-center justify-center gap-2 shrink-0"
              aria-label="Shyftcut Home"
            >
              <img
                src={LOGO_PATH}
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 object-contain"
                decoding="async"
                fetchPriority="high"
              />
              <span className="text-2xl font-bold gradient-text">Shyftcut</span>
            </Link>
          )}
          {children}
        </div>
      </section>

      {/* Right column: hero image + testimonials (desktop only) */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div
            className="animate-slide-right-auth absolute inset-4 rounded-3xl bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImageSrc})` }}
          />
          {testimonials.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
              <AuthTestimonialCard
                testimonial={testimonials[0]}
                delay="animate-delay-1000"
              />
              {testimonials[1] && (
                <div className="hidden xl:flex">
                  <AuthTestimonialCard
                    testimonial={testimonials[1]}
                    delay="animate-delay-1200"
                  />
                </div>
              )}
              {testimonials[2] && (
                <div className="hidden 2xl:flex">
                  <AuthTestimonialCard
                    testimonial={testimonials[2]}
                    delay="animate-delay-1400"
                  />
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export { GoogleIcon };
