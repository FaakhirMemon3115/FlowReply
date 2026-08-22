// src/utils/prisma.ts
import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

let prisma: PrismaClient;

export const initPrisma = () => {
  if (!prisma) {
    prisma = new PrismaClient();
    // Graceful shutdown
    const shutdown = async () => {
      try {
        await prisma.$disconnect();
        logger.info("Prisma client disconnected");
        process.exit(0);
      } catch (e) {
        logger.error("Error during Prisma disconnect", e);
        process.exit(1);
      }
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  }
  return prisma;
};

export { prisma };
