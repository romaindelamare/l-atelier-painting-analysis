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
      "/api": "http://localhost:8000",
      "/images": "http://localhost:8000",
    },
  },
});
