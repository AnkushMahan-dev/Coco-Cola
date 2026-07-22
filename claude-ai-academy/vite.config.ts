import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("src/content/modules")) return "content";
          if (id.includes("node_modules")) {
            if (id.includes("framer-motion")) return "motion";
            return "vendor";
          }
          return undefined;
        },
      },
    },
  },
});
