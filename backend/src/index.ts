import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import type { S3Event } from "aws-lambda";
import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import cors from "cors";

dotenv.config({ path: ".env" });

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

// Validate environment variables
const requiredEnvVars = [
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_REGION",
  "SQS_QUEUE_URL",
  "TASK_DEFINITION_ARN",
  "TRANSCODED_VIDEOS_BUCKET_NAME",
  "S3_BUCKET_NAME",
  "ECS_CLUSTER_ARN",
  "ECS_SUBNETS",
  "ECS_SECURITY_GROUPS",
];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing environment variable: ${envVar}`);
    process.exit(1);
  }
}

// SQS Queue client
const sqsClient = new SQSClient({
  credentials: {  
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  region: process.env.AWS_REGION!,
});

// ECS client
const ecsClient = new ECSClient({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  region: process.env.AWS_REGION!,
});

// S3 client
const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  region: process.env.AWS_REGION!,
});

// Pre-signed URL endpoint
app.post("/preSignedUrl", async (req: Request, res: Response) => {
  try {
    const { fileName, fileType, videoId } = req.body;
    if (!fileName || !fileType || !videoId) {
      res
        .status(400)
        .json({ error: "fileName, fileType, and videoId are required" });
      return;
    }

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME, // Temporary bucket for uploads
      Key: `videos/${videoId}/${fileName}`,
      ContentType: fileType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });
    res.json({ url: signedUrl, method: "PUT" });
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    res.status(500).json({ error: "Failed to generate pre-signed URL" });
  }
});

// Fetch transcoded formats
app.get("/videos/:videoId", async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const prefix = `videos/${videoId}/`;

    // List objects in the videoId folder
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.TRANSCODED_VIDEOS_BUCKET_NAME,
      Prefix: prefix,
    });
    const { Contents } = await s3Client.send(listCommand);

    console.log(
      "conegt" , Contents
    );
    

    if (!Contents || Contents.length === 0) {
      res.status(404).json({ error: "No videos found for the given videoId" });
      return;
    }

    // Generate signed URLs for all objects in the folder
    const urls = await Promise.all(
      Contents.map(async (obj) => {
        const key = obj.Key!;
        const command = new GetObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: key,
        });
        const url = await getSignedUrl(s3Client, command, {
          expiresIn: 3600,
        });
        return { key, url };
      })
    );

    res.json({ urls });
  } catch (error) {
    console.error("Error fetching video URLs:", error);
    res.status(500).json({ error: "Failed to fetch video URLs" });
  }
});

// SQS Polling
const init = async () => {
  try {
    const command = new ReceiveMessageCommand({
      QueueUrl: process.env.SQS_QUEUE_URL,
      MaxNumberOfMessages: 5,
      WaitTimeSeconds: 20,
    });

    // Poll the SQS queue for messages
    console.log("Polling SQS queue for messages...");
    while (true) {
      const { Messages } = await sqsClient.send(command);

      if (!Messages) {
        console.log("No messages found");
        continue;
      }

      // Process messages in parallel
      await Promise.all(
        Messages.map(async (message) => {
          if (!message.Body) {
            console.warn("Empty message body, skipping");
            return;
          }

          const event = JSON.parse(message.Body) as S3Event;

          // Skip test events
          if ("Service" in event && "Event" in message) {
            if (message.Event === "s2:TestEvent") {
              await sqsClient.send(
                new DeleteMessageCommand({
                  QueueUrl: process.env.SQS_QUEUE_URL,
                  ReceiptHandle: message.ReceiptHandle,
                })
              );
              return;
            }
          }

          // Process S3 records
          for (const record of event.Records) {
            const { s3 } = record;
            const {
              bucket,
              object: { key },
            } = s3;

            // Extract videoId from the S3 key (e.g., videos/<videoId>/original.mp4)
            const videoIdMatch = key.match(/videos\/([^/]+)\//);
            if (!videoIdMatch) {
              console.error(`Invalid S3 key format: ${key}`);
              continue;
            }
            const videoId = videoIdMatch[1];

            // Trigger ECS task for transcoding
            try {
              const runTaskCommand = new RunTaskCommand({
                taskDefinition: process.env.TASK_DEFINITION_ARN,
                cluster: process.env.ECS_CLUSTER_ARN,
                launchType: "FARGATE",
                networkConfiguration: {
                  awsvpcConfiguration: {
                    subnets: process.env.ECS_SUBNETS!.split(","),
                    securityGroups: process.env.ECS_SECURITY_GROUPS!.split(","),
                    assignPublicIp: "ENABLED",
                  },
                },
                overrides: {
                  containerOverrides: [
                    {
                      name: "video-transcoder",
                      environment: [
                        { name: "BUCKET_NAME", value: bucket.name },
                        { name: "KEY", value: key },
                        { name: "VIDEO_ID", value: videoId },
                        {
                          name: "TRANSCODED_VIDEOS_BUCKET_NAME",
                          value: process.env.TRANSCODED_VIDEOS_BUCKET_NAME,
                        },
                        {
                          name: "AWS_ACCESS_KEY_ID",
                          value: process.env.AWS_ACCESS_KEY_ID,
                        },
                        {
                          name: "AWS_SECRET_ACCESS_KEY",
                          value: process.env.AWS_SECRET_ACCESS_KEY,
                        },
                        {
                          name: "AWS_REGION",
                          value: process.env.AWS_REGION,
                        },
                      ],
                    },
                  ],
                },
              });

              await ecsClient.send(runTaskCommand);
              console.log(`Triggered ECS task for s3://${bucket.name}/${key}`);

              // Delete message after successful task trigger
              await sqsClient.send(
                new DeleteMessageCommand({
                  QueueUrl: process.env.SQS_QUEUE_URL,
                  ReceiptHandle: message.ReceiptHandle,
                })
              );
            } catch (taskError) {
              console.error(
                `Failed to process s3://${bucket.name}/${key}:`,
                taskError
              );
              // Skip deletion to allow retry via SQS visibility timeout
            }
          }
        })
      );
    }
  } catch (error) {
    console.error("Error in SQS polling loop:", error);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    init(); // Retry
  }
};

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  init();
});
