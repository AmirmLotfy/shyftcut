import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { initErrorTracking } from "@/lib/error-tracking";
import { initWebVitals } from "@/lib/web-vitals";
import App from "./App.tsx";
import "./index.css";

// Reload on chunk load failure (stale cache after deploy) so user gets fresh assets
// Use cache-busting query to bypass cached index.html and get new asset URLs
function reloadWithFreshAssets() {
  const url = new URL(window.location.href);
  url.searchParams.set("_refresh", String(Date.now()));
  window.location.replace(url.toString());
}
window.addEventListener("unhandledrejection", (event) => {
  const msg = String(event.reason?.message ?? event.reason ?? "");
  if (msg.includes("Failed to fetch dynamically imported module") || msg.includes("Loading chunk") || msg.includes("ChunkLoadError")) {
    event.preventDefault();
    reloadWithFreshAssets();
  }
});

initErrorTracking();
initWebVitals();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <App />
  </ThemeProvider>
);
