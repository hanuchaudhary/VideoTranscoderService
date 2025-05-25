import { ECSClient } from "@aws-sdk/client-ecs";
import { S3Client } from "@aws-sdk/client-s3";
import { SQSClient } from "@aws-sdk/client-sqs";
import Redis from "ioredis";
import { config } from "dotenv";

config();

const requiredEnvVars = [
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_REGION",
  "SQS_QUEUE_URL",
  "TASK_DEFINITION_ARN",
  "FINAL_BUCKET_NAME",
  "RAW_BUCKET_NAME",
  "ECS_CLUSTER_ARN",
  "ECS_SUBNETS",
  "ECS_SECURITY_GROUPS",
  "REDIS_URL",
];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Redis client
export const redisClient = new Redis(process.env.REDIS_URL!);
redisClient.subscribe("transcoding", (err) => {
  if (err) {
    console.error("Failed to subscribe to Redis channel:", err);
    return;
  }
  console.log("Subscribed to transcoding channel");
});


// SQS Queue client
export const sqsClient = new SQSClient({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  region: process.env.AWS_REGION!,
});

// ECS client
export const ecsClient = new ECSClient({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  region: process.env.AWS_REGION!,
});

// S3 client
export const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  region: process.env.AWS_REGION!,
});