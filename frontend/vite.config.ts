import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// During development, proxy API and image requests to the FastAPI backend so the
// frontend can use same-origin relative URLs (no CORS, no hardcoded host).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // Use 127.0.0.1 rather than "localhost": on Windows the latter can resolve to
      // IPv6 (::1) first, where the IPv4-bound backend isn't listening.
      "/api": "http://127.0.0.1:8000",
      "/images": "http://127.0.0.1:8000",
    },
  },
});
