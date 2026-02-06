import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { DASHBOARD_BASE } from "@/lib/dashboard-routes";

function isAppRoute(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, "") || "/";
  return (
    normalized === DASHBOARD_BASE ||
    normalized.startsWith(DASHBOARD_BASE + "/") ||
    normalized === "/login" ||
    normalized === "/signup" ||
    normalized.startsWith("/wizard")
  );
}

/**
 * Injects the PWA manifest link only when the user is on an app route,
 * so the marketing site (/, /pricing, /blog, etc.) is not installable as a PWA.
 */
export function PWAManifestLink() {
  const { pathname } = useLocation();
  if (!isAppRoute(pathname)) return null;
  return (
    <Helmet>
      <link rel="manifest" href="/manifest.json" />
    </Helmet>
  );
}
