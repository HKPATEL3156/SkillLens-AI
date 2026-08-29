import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    proxy: {
      "/api": "http://localhost:5000",
      "/uploads": "http://localhost:5000",
    },
    allowedHosts: [
      "operates-obtaining-broken-bay.trycloudflare.com",
      "john-slideshow-considering-nominated.trycloudflare.com",
    ],
  },
});
