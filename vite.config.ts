import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Single React instance for all chunks; avoids "createContext of undefined" in app/page chunks.
    dedupe: ["react", "react-dom"],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: false,
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectManifest: {
        globPatterns: ["**/*.{js,css,ico,png,webp,woff2}", "index.html"],
      },
    }),
    ...(process.env.ANALYZE ? [visualizer({ open: true, gzipSize: true, filename: "dist/stats.html" })] : []),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Keep React + Radix + UI utils in ONE chunk to avoid "Ie is not a function"
          // (Slot/mergeProps minification and chunk boundaries cause production-only errors).
          const isReact =
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/react-router");
          const isRadixOrUi =
            id.includes("node_modules/@radix-ui") ||
            id.includes("node_modules/lucide-react") ||
            id.includes("node_modules/tailwind-merge") ||
            id.includes("node_modules/class-variance-authority") ||
            id.includes("node_modules/clsx");
          // Framer-motion/motion must be with React (uses createContext); separate chunk causes "reading 'createContext' of undefined".
          const isMotion =
            id.includes("node_modules/framer-motion") || id.includes("node_modules/motion");
          // Recharts must be with React; separate chunk causes "Cannot access 'S' before initialization" (React/victory refs).
          const isRecharts = id.includes("node_modules/recharts");
          if (isReact || isRadixOrUi || isMotion || isRecharts) return "vendor-react-ui";
          // Do NOT put app pages in a separate manual chunk: that chunk can run before
          // vendor-react-ui is ready, causing "Cannot read properties of undefined (reading 'createContext')".
          // Let Rollup handle page chunks via lazy() so load order stays correct.
        },
      },
    },
  },
});
