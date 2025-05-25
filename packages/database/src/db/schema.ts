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
]);

const timestamps = {
  updatedAt: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
  deletedAt: timestamp(),
};

export const logLevelEnum = pgEnum("LogLevel", ["INFO", "WARN", "ERROR"]);

// User Table
export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    ...timestamps,
  }
);

// Session Table
export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  }
);

// Account Table
export const account = pgTable("account", {
  id: text("id").primaryKey(),
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
  ...timestamps,
});


// Transcoding Jobs Table
export const transcodingJobs = pgTable("transcoding_jobs", {
  id: text("job_id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  inputS3Path: varchar("input_s3_path").notNull(),
  outputS3Path: varchar("output_s3_path"),
  status: jobStatusEnum("status").default("PENDING"),
  videoId: text("video_id").notNull(),
  videoTitle: text("video_title").notNull(),
  videoDuration: text("video_duration").notNull(),
  videoSize: text("video_size").notNull(),
  videoType: text("file_type").notNull(),
  resolutions: json("resolutions").notNull(),
  errorMessage: text("error_message"),
  ...timestamps,
});

// Job Logs Table
export const jobLogs = pgTable("job_logs", {
  id: text("log_id").primaryKey(),
  jobId: text("job_id")
    .notNull()
    .references(() => transcodingJobs.id, { onDelete: "cascade" }),
  logMessage: text("log_message").notNull(),
  logLevel: logLevelEnum("log_level").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Export schema for Better Auth
export const schema = {
  user,
  session,
  account,
  transcodingJobs,
  jobLogs,
};