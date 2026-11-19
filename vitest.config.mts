import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Variáveis do banco (Neon) para os testes de integração; sem .env eles são ignorados.
try {
  process.loadEnvFile(".env");
} catch {}

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/**/*.test.ts"], environment: "node" },
});
