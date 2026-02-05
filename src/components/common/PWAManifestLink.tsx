import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const APP_ROUTES = [
  "/dashboard",
  "/login",
  "/signup",
  "/wizard",
  "/roadmap",
  "/courses",
  "/chat",
  "/profile",
  "/checkout",
];

function isAppRoute(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, "") || "/";
  return APP_ROUTES.some(
    (route) => normalized === route || normalized.startsWith(route + "/")
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
