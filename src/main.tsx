import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { initErrorTracking } from "@/lib/error-tracking";
import { initWebVitals } from "@/lib/web-vitals";
import App from "./App.tsx";
import "./index.css";

initErrorTracking();
initWebVitals();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <App />
  </ThemeProvider>
);
