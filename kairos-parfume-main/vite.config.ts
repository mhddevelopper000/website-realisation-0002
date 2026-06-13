import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import router from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsConfigPaths(),
    router(),
  ],
  build: {
    outDir: "out",
    emptyOutDir: true,
  },
});
