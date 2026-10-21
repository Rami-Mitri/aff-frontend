import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  // Dev only: forward /api to the local backend so VITE_API_BASE_URL can stay empty.
  server: { proxy: { "/api": "http://127.0.0.1:8000" } },
});
