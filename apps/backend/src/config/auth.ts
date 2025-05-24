import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@repo/database/generated/prisma/client";

const prismaClient = new PrismaClient();

console.log("Initializing BetterAuth with Prisma Adapter");
export const auth = betterAuth({
  database: prismaAdapter(prismaClient, {
    provider: "postgresql",
    debugLogs: true, 
  }),
});