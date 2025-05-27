// Enums
export enum PricingPlan {
  FREE = "FREE",
  BASIC = "BASIC",
  PRO = "PRO",
  ENTERPRISE = "ENTERPRISE",
}

export enum JobStatus {
  QUEUED = "QUEUED",
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export enum LogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

// Common
interface Timestamps {
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
}

// User
export interface User extends Timestamps {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
}

// Session
export interface Session extends Timestamps {
  id: string;
  expiresAt: Date;
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  userId: string;
}

// Account
export interface Account extends Timestamps {
  id: string;
  accountId: string;
  providerId: string;
  userId: string;
  accessToken?: string | null;
  refreshToken?: string | null;
  idToken?: string | null;
  accessTokenExpiresAt?: Date | null;
  refreshTokenExpiresAt?: Date | null;
  scope?: string | null;
  password?: string | null;
}

// Transcoding Job
export interface TranscodingJob extends Timestamps {
  id: string;
  userId: string;
  inputS3Key: string;
  outputS3Keys?: string;
  status: JobStatus;
  videoId: string;
  videoTitle: string;
  videoDuration: string;
  videoSize: string;
  videoType: string;
  resolutions: string[];
  completeDuration?: string;
  errorMessage?: string | null;
}

// Job Log
export interface JobLog {
  id: string;
  jobId: string;
  logMessage: string;
  logLevel: LogLevel;
  createdAt: Date;
}
