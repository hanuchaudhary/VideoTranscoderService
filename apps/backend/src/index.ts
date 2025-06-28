import {
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import type { S3Event } from "aws-lambda";
import { RunTaskCommand } from "@aws-sdk/client-ecs";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import redis from "ioredis";
import { ecsClient, sqsClient } from "./config/config";
import { userRouter } from "./routes/user.route";
import { transcodingRouter } from "./routes/transcoding.route";
import { db } from "@repo/database/client";
import { jobLogs, transcodingJobs } from "@repo/database/schema";
import { Server as SocketIOServer } from "socket.io";
import { Server } from "http";
import { v4 as uuid } from "uuid";
import { eq } from "drizzle-orm";
import { paymentRouter } from "./routes/payment.route";

dotenv.config({ override: true });

const app = express();
const httpServer = new Server(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);
app.use(express.json());
app.use("/api/v1/user", userRouter);
app.use("/api/v1/transcoding", transcodingRouter);
app.use("/api/v1/payment", paymentRouter);

// Redis client
// const redisClient = new redis(process.env.REDIS_URL!);
// redisClient.subscribe("transcoding", (err) => {
//   if (err) {
//     console.error("Failed to subscribe to Redis channel:", err);
//     return;
//   }
//   console.log("Subscribed to transcoding channel");
// });

// redisClient.on("message", async (channel, message) => {
//   console.log(`Received message from channel ${channel}:`, message);

//   const parsedMessage = JSON.parse(message);
//   const { videoId, status, logMessage, logLevel, outputKeys, duration } =
//     parsedMessage;

//   console.log("Parsed", parsedMessage);

//   await db.insert(jobLogs).values({
//     id: uuid(),
//     jobId: videoId,
//     logMessage,
//     logLevel,
//     createdAt: new Date(),
//   });

//   if (status === "STARTED") {
//     await db
//       .update(transcodingJobs)
//       .set({
//         status: "PROCESSING",
//       })
//       .where(eq(transcodingJobs.id, videoId));
//   }
//   if (status === "COMPLETED") {
//     await db
//       .update(transcodingJobs)
//       .set({
//         status: "COMPLETED",
//         outputS3Keys: outputKeys,
//         completeDuration: duration,
//         updatedAt: new Date(),
//       })
//       .where(eq(transcodingJobs.id, videoId));
//   }
//   io.to(`job:${videoId}`).emit("log", parsedMessage);
//   console.log("Log emitted to WebSocket clients for videoId:", videoId);
// });

// io.on("connection", (socket) => {
//   console.log("New WebSocket connection:", socket.id);
//   socket.on("SubscribeToJob", (jobId) => {
//     if (!jobId) {
//       console.error("No jobId provided for subscription");
//       return;
//     }
//     console.log(
//       `Socket ${socket.id} subscribed to job: ${JSON.stringify(jobId)}`
//     );
//     socket.join(`job:${jobId}`);
//   });

//   socket.on("UnsubscribeFromJob", (jobId) => {
//     if (!jobId) {
//       console.error("No jobId provided for unsubscription");
//       return;
//     }
//     console.log(`Socket ${socket.id} unsubscribed from job: ${jobId}`);
//     socket.leave(`job:${jobId}`);
//   });

//   socket.on("disconnect", () => {
//     console.log("WebSocket disconnected:", socket.id);
//   });
// });

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
          //           key: "uploads/6XE1PDLeOq7eQJUGYorGsFf5G6Xl6IiA/f8286d09-dc37-49ca-9245-7c94a20a37e0/video.mp4",
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

            // Extract videoId from the S3 key (e.g., uploads/2pi88wQwqHz2b7eDjlQYuSsDZDkCLMkI/69d25e7b-f5e4-4d50-b6d7-827332b87574/video.mp4)

            // 69d25e7b-f5e4-4d50-b6d7-827332b87574 is the videoId
            const videoIdMatch = key.match(
              /uploads\/[^/]+\/([^/]+)\/video\.mp4$/
            );

            console.log("videoIdMatch:", videoIdMatch);

            if (!videoIdMatch || videoIdMatch.length < 2) {
              console.error(`Failed to extract videoId from S3 key: ${key}`);
              continue;
            }

            const videoId = videoIdMatch[1];
            console.log("Video ID extracted from S3 key:", videoId);

            const job = await db
              .select()
              .from(transcodingJobs)
              .where(eq(transcodingJobs.id, videoId!))
              .limit(1);

            if (!job[0]) {
              console.error(`No transcoding job found for videoId: ${videoId}`);
              continue;
            }

            const resolutions = job[0].resolutions; // e.g., ["720p", "1080p"]
            if (!resolutions || !Array.isArray(resolutions)) {
              console.error(`Invalid resolutions for videoId: ${videoId}`);
              continue;
            }

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
                      name: process.env.ECS_CONTAINER_NAME,
                      environment: [
                        // {name:"USER_ID", value: videoId},
                        { name: "BUCKET_NAME", value: bucket.name },
                        { name: "KEY", value: key },
                        { name: "VIDEO_ID", value: videoId },
                        {
                          name: "RESOLUTIONS",
                          value: JSON.stringify(resolutions),
                        },
                        {
                          name: "FINAL_BUCKET_NAME",
                          value: process.env.FINAL_BUCKET_NAME,
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
                        {
                          name: "REDIS_URL",
                          value: process.env.REDIS_URL,
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
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // pollForMessages();
});
