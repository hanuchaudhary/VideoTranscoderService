import {
  pgTable,
  pgEnum,
  text,
  varchar,
  boolean,
  timestamp,
  json,
} from "drizzle-orm/pg-core";
import { randomUUID } from "crypto";

// Enums
export const pricingPlanEnum = pgEnum("PricingPlan", [
  "FREE",
  "BASIC",
  "PRO",
  "ENTERPRISE",
]);

export const jobStatusEnum = pgEnum("JobStatus", [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);

export const logLevelEnum = pgEnum("LogLevel", ["INFO", "WARN", "ERROR"]);

// User Table
export const user = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Session Table
export const session = pgTable("session", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

// Account Table
export const account = pgTable("account", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Verification Table
export const verification = pgTable("verification", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Transcoding Jobs Table
export const transcodingJobs = pgTable("transcoding_jobs", {
  id: text("job_id").primaryKey().$defaultFn(() => randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  inputS3Path: varchar("input_s3_path").notNull(),
  outputS3Path: varchar("output_s3_path"),
  status: jobStatusEnum("status").default("PENDING"),
  resolutions: json("resolutions").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  errorMessage: text("error_message"),
});

// Job Logs Table
export const jobLogs = pgTable("job_logs", {
  id: text("log_id").primaryKey().$defaultFn(() => randomUUID()),
  jobId: text("job_id")
    .notNull()
    .references(() => transcodingJobs.id, { onDelete: "cascade" }),
  logMessage: text("log_message").notNull(),
  logLevel: logLevelEnum("log_level").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Export schema for Better Auth
export const schema = {
  user,
  session,
  account,
  verification,
  transcodingJobs,
  jobLogs,
};