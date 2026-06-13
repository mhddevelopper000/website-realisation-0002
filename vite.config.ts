import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsConfigPaths(),
  ],
  build: {
    outDir: "out",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './index.html',
      },
      external: [
        '@tanstack/start',
        '@tanstack/start-server-core',
        '@tanstack/react-start',
        '@tanstack/react-start-server',
      ],
    },
  },
});
