import { Link } from "react-router-dom";
import { LOGO_PATH } from "@/lib/seo";

/**
 * Minimal auth layout for mobile — form only, no hero or testimonials.
 * Keeps bundle small and load fast on mobile.
 */
export function AuthLayoutMobile({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center overflow-y-auto px-4 py-6 font-sans"
      style={{ paddingTop: "max(1.5rem, calc(1.5rem + env(safe-area-inset-top)))" }}
    >
      <div className="w-full max-w-sm">
        <Link
          to="/"
          className="mb-6 flex items-center justify-center gap-2"
          aria-label="Shyftcut Home"
        >
          <img
            src={LOGO_PATH}
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
            decoding="async"
            fetchPriority="high"
          />
          <span className="text-xl font-bold gradient-text">Shyftcut</span>
        </Link>
        {children}
      </div>
    </div>
  );
}
