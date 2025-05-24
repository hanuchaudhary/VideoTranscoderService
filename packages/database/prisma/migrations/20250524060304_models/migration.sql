/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PricingPlan" AS ENUM ('FREE', 'BASIC', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "plan" "PricingPlan" NOT NULL DEFAULT 'FREE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "transcoding_jobs" (
    "job_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "input_s3_path" TEXT NOT NULL,
    "output_s3_path" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "resolutions" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "error_message" TEXT,

    CONSTRAINT "transcoding_jobs_pkey" PRIMARY KEY ("job_id")
);

-- CreateTable
CREATE TABLE "job_logs" (
    "log_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "log_message" TEXT NOT NULL,
    "log_level" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "transcoding_jobs_user_id_idx" ON "transcoding_jobs"("user_id");

-- CreateIndex
CREATE INDEX "job_logs_job_id_idx" ON "job_logs"("job_id");

-- AddForeignKey
ALTER TABLE "transcoding_jobs" ADD CONSTRAINT "transcoding_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_logs" ADD CONSTRAINT "job_logs_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "transcoding_jobs"("job_id") ON DELETE CASCADE ON UPDATE CASCADE;
