import {
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import type { S3Event } from "aws-lambda";
import { RunTaskCommand } from "@aws-sdk/client-ecs";
import {
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import cors from "cors";
import redis from "ioredis";
import { ecsClient, s3Client, sqsClient } from "./config/config";
import { userRouter } from "./routes/user.route";
import { transcodingRouter } from "./routes/transcoding.route";

dotenv.config({ path: ".env" });

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/v1/user", userRouter);
app.use("/api/v1/transcoding", transcodingRouter);

// Redis client
const redisClient = new redis(process.env.REDIS_URL!);
redisClient.subscribe("transcoding", (err) => {
  if (err) {
    console.error("Failed to subscribe to Redis channel:", err);
    return;
  }
  console.log("Subscribed to transcoding channel");
});

redisClient.on("message", async (channel, message) => {
  console.log(`Received message from channel ${channel}:`, message);

  // TODO: Process the message
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

    console.log("conegt", Contents);

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
const pollForMessages = async () => {
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
        // if no messages then loop again
        console.log("No messages found");
        continue;
      }

      await Promise.all(
        Messages.map(async (message) => {
          if (!message.Body) {
            console.warn("Empty message body, skipping");
            return;
          }

          // Example Event
          // {
          //   Records: [
          //     {
          //       eventVersion: "2.1",
          //       eventSource: "aws:s3",
          //       awsRegion: "ap-south-1",
          //       eventTime: "2025-05-23T17:49:23.037Z",
          //       eventName: "ObjectCreated:CompleteMultipartUpload",
          //       userIdentity: { principalId: "A3M50BBDHU5YJN" },
          //       requestParameters: { sourceIPAddress: "157.49.181.4" },
          //       responseElements: {
          //         "x-amz-request-id": "HTWBXX43NDVY4W4N",
          //         "x-amz-id-2":
          //           "R1YFnmGrRn/Go2EJngTAvnrHcNkC7Gc+oObNIBMFF/9Cw4Xo5djE3kQdBUcgrrlyJEyDMI3aK9+ap5Yd4sQuWiKKLF3RcK8s",
          //       },
          //       s3: {
          //         s3SchemaVersion: "1.0",
          //         configurationId: "S3CreateEventToSQS",
          //         bucket: {
          //           name: "raw-transcoder-videos",
          //           ownerIdentity: { principalId: "A3M50BBDHU5YJN" },
          //           arn: "arn:aws:s3:::raw-transcoder-videos",
          //         },
          //         object: {
          //           key: "ZENITSU.webm",
          //           size: 50248332,
          //           eTag: "97b818b70a0d3d2936d9580de65c2e2c-3",
          //           sequencer: "006830B4C79941E3D6",
          //         },
          //       },
          //     },
          //   ];
          // }

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
            }
          }
        })
      );
    }
  } catch (error) {
    console.error("Error in SQS polling loop:", error);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    pollForMessages(); // Retry
  }
};

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // pollForMessages();
});
