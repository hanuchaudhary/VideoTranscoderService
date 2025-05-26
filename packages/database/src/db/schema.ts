import {
  pgTable,
  pgEnum,
  text,
  varchar,
  boolean,
  timestamp,
  json,
} from "drizzle-orm/pg-core";

// Enums
export const pricingPlanEnum = pgEnum("PricingPlan", [
  "FREE",
  "BASIC",
  "PRO",
  "ENTERPRISE",
]);

export const jobStatusEnum = pgEnum("JobStatus", [
  "QUEUED",
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "CANCELED",
]);

export const logLevelEnum = pgEnum("LogLevel", ["INFO", "WARN", "ERROR"]);

const timestamps = {
  updatedAt: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
  deletedAt: timestamp(),
};

// User Table
export const user = pgTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  ...timestamps,
});

// Session Table
export const session = pgTable("session", {
  id: text().primaryKey(),
  expiresAt: timestamp().notNull(),
  token: text().notNull(),
  ipAddress: text(),
  userAgent: text(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  ...timestamps,
});

// Account Table
export const account = pgTable("account", {
  id: text().primaryKey(),
  accountId: text().notNull(),
  providerId: text().notNull(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text(),
  refreshToken: text(),
  idToken: text(),
  accessTokenExpiresAt: timestamp(),
  refreshTokenExpiresAt: timestamp(),
  scope: text(),
  password: text(),
  ...timestamps,
});

// Transcoding Jobs Table
export const transcodingJobs = pgTable("transcoding_jobs", {
  id: text().primaryKey(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  inputS3Path: varchar().notNull(),
  outputS3Path: varchar(),
  status: jobStatusEnum(),
  videoId: text().notNull(),
  videoTitle: text().notNull(),
  videoDuration: text().notNull(),
  videoSize: text().notNull(),
  videoType: text().notNull(),
  resolutions: json().notNull(),
  errorMessage: text(),
  ...timestamps,
});

// Job Logs Table
export const jobLogs = pgTable("job_logs", {
  id: text().primaryKey(),
  jobId: text()
    .notNull()
    .references(() => transcodingJobs.id, { onDelete: "cascade" }),
  logMessage: text().notNull(),
  logLevel: logLevelEnum(),
  createdAt: timestamp().defaultNow(),
});

// Export schema for Better Auth
export const schema = {
  user,
  session,
  account,
  transcodingJobs,
  jobLogs,
};