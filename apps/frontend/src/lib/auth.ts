import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import bcryptjs from "bcryptjs";
import { db } from "@repo/database/client";
import { schema } from "@repo/database/schema";
import { randomUUID } from "crypto";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    debugLogs: true,
    schema: schema, // Pass the schema object directly
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    generateUserId: async () => randomUUID(), // Ensure valid UUID strings for user IDs
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
        const verifyPassword = await bcryptjs.compare(password, hash);
        return verifyPassword;
      },
    },
  },
});
