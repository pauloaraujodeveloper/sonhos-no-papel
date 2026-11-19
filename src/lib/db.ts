import { PrismaClient } from "@prisma/client";

/**
 * Cliente Prisma único por processo (evita múltiplas conexões em desenvolvimento
 * com hot reload). Importe somente em código de servidor (Server Components,
 * Server Actions, Route Handlers). Nunca importe este módulo em componentes cliente.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
