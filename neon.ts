import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  auth: true,
  // Branches de teste expiram sozinhas em 7 dias; a branch padrão não muda.
  branch: (branch) => (!branch.isDefault && !branch.exists ? { ttl: "7d" } : {}),
});
