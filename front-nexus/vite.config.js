import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    host: true, // expose on LAN
    port: 5173, // optional: your preferred port
    strictPort: false, // if 5173 is busy, pick another
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
