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

export const paymentStatusEnum = pgEnum("PaymentStatus", [
  "ACTIVE",
  "PENDING",
  "EXPIRED",
  "FAILED",
  "CANCELLED",
  "SUCCEEDED",
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
  inputS3Key: text().notNull(),
  outputS3Keys: text().notNull(), // `["key1", "key2"]`
  status: jobStatusEnum(),
  videoId: text().notNull(),
  videoTitle: text().notNull(),
  videoDuration: text().notNull(),
  videoSize: text().notNull(),
  videoType: text().notNull(),
  resolutions: json().notNull(),
  completeDuration: text(),
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

// Payment Table
export const transaction = pgTable("transaction", {
  id: text().primaryKey(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  amount: varchar().notNull(),
  currency: varchar().notNull(),
  status: paymentStatusEnum().notNull(),
  paymentMethod: text().notNull(),
  planId: text()
    .notNull()
    .references(() => subscription.id),
  metadata: json(),
  ...timestamps,
});

// Subscription Table
export const subscription = pgTable("subscription", {
  id: text().primaryKey(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  status: paymentStatusEnum().notNull(),
  startDate: timestamp().notNull(),
  endDate: timestamp().notNull(),
  nextBillingDate: timestamp().notNull(),
});


// Export schema for Better Auth
export const schema = {
  user,
  session,
  account,
  transcodingJobs,
  jobLogs,
  transaction,
  subscription,
  pricingPlanEnum,
};
