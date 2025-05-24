import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prismaClient } from "@repo/database/client";
import bcryptjs from "bcryptjs";

console.log("Initializing BetterAuth with Prisma Adapter");
export const auth = betterAuth({
  database: prismaAdapter(prismaClient, {
    provider: "postgresql",
    debugLogs: true, 
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    password: {
      hash: async (password: string) => {
        const salt = await bcryptjs.genSalt(10);
        return await bcryptjs.hash(password, salt);
      },
      verify: async ({
        password,
        hash,
      }: {
        password: string;
        hash: string;
      }) => {
        // Verify the password using bcryptjs
        const verifyPassword = await bcryptjs.compare(password, hash);
        if (!verifyPassword) {
          return false;
        }
        return true;
      },
    },
  },
});

console.log("BetterAuth initialized with Prisma Adapter");
