import { PrismaClient } from "@prisma/client";

// Add prisma client to express App
declare module "express" {
    interface Express {
        prisma: PrismaClient;
    }
}