// Prisma client singleton. Cached on globalThis so Next.js dev HMR and the
// route-handler/server-component boundaries reuse one client (avoids exhausting
// Postgres connections). Import { prisma } everywhere for DB access.
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
