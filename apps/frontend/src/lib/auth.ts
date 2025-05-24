import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prismaClient } from "@repo/database/client";
export const auth = betterAuth({
  database: prismaAdapter(prismaClient, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),
  emailAndPassword: {
    enabled: true,
  },
});
