import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
  },
  server: {
    watch: {
      ignored: ["**/.venv/**", "**/CalCOFI Data/**", "**/models/**", "**/*.ipynb"],
    },
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
