import { PrismaClient } from "@prisma/client";

// Una sola instancia de Prisma (evita abrir muchas conexiones en desarrollo).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Transacciones: Prisma corta a los 5 s por defecto. Con la base en la nube (Neon) cada paso
// tarda ~100–200 ms, así que un pedido de muchos productos podría pasarse. Damos más margen.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    transactionOptions: { maxWait: 10_000, timeout: 20_000 },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
