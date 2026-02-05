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
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/") || id.includes("node_modules/react-router")) {
            return "vendor-react";
          }
          if (id.includes("node_modules/@radix-ui") || id.includes("node_modules/lucide-react") || id.includes("node_modules/tailwind-merge") || id.includes("node_modules/class-variance-authority") || id.includes("node_modules/clsx")) {
            return "vendor-ui";
          }
          if (id.includes("node_modules/recharts")) return "vendor-recharts";
          if (id.includes("node_modules/framer-motion") || id.includes("node_modules/motion")) return "vendor-motion";
        },
      },
    },
  },
});
