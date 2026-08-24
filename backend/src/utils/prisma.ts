// src/utils/prisma.ts
import { PrismaClient } from "../generated/client";
import { logger } from "./logger";

let prisma: PrismaClient | undefined;
let shutdownRegistered = false;

export const getPrisma = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
};

export const initPrisma = (): PrismaClient => {
  const client = getPrisma();

  if (!shutdownRegistered) {
    shutdownRegistered = true;
    const shutdown = async () => {
      try {
        if (prisma) {
          await prisma.$disconnect();
          logger.info("Prisma client disconnected");
        }
        process.exit(0);
      } catch (e) {
        logger.error("Error during Prisma disconnect", e);
        process.exit(1);
      }
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  }

  return client;
};

export { prisma };
