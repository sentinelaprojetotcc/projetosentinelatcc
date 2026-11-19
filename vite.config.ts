import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

// TanStack Start (SSR + server functions) rodando diretamente em Workers.
// O banco local abaixo é uma cópia de testes e NÃO acessa o D1 remoto.
export default defineConfig({
  plugins: [
    cloudflare({
      viteEnvironment: { name: "ssr" },
      persistState: { path: ".wrangler/sentinela-teste-v2" },
    }),
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart(),
    react(),
  ],
});
