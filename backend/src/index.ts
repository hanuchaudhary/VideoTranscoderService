import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import type { S3Event } from "aws-lambda";
import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";
import dotenv from "dotenv";

dotenv.config({
  path: ".env",
});

const sqsClient = new SQSClient({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  region: process.env.AWS_REGION!,
});

const ecsClient = new ECSClient({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  region: process.env.AWS_REGION!,
});

const init = async () => {
  try {
    const command = new ReceiveMessageCommand({
      QueueUrl: process.env.SQS_QUEUE_URL,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 20,
    });

    while (true) {
      const { Messages } = await sqsClient.send(command);

      // If not message in Queue
      if (!Messages) {
        console.log("No message found");
        continue;
      }

      for (const message of Messages) {
        console.log("message:", message);
        // If no message body!
        if (!message.Body) continue;

        const event = JSON.parse(message.Body) as S3Event;

        // If Message Event is of type test event
        if ("Service" in event && "Event" in message) {
          if (message.Event === "s2:TestEvent") {
            await sqsClient.send(
              new DeleteMessageCommand({
                QueueUrl: process.env.SQS_QUEUE_URL,
                ReceiptHandle: message.ReceiptHandle,
              })
            );
            continue;
          }
        }

        // Docker spin
        for (const record of event.Records) {
          const { s3 } = record;
          const {
            bucket,
            object: { key},
          } = s3;

          const runTaskCommand = new RunTaskCommand({
            taskDefinition: process.env.TASK_DEFINITION_ARN,
            cluster: "arn:aws:ecs:ap-south-1:202533500926:cluster/Dev",
            launchType: "FARGATE",
            networkConfiguration: {
              awsvpcConfiguration: {
                subnets: [
                  "subnet-0fbc30ffc49ff3a46",
                  "subnet-0d4c176843822ba67",
                  "subnet-037165a880b9f2be4",
                ],
                securityGroups: ["sg-032c64c6d79c083d6"],
                assignPublicIp: "ENABLED",
              },
            },
            overrides: {
              containerOverrides: [
                {
                  name: "video-transcoder",
                  environment: [
                    {
                      name: "BUCKET_NAME",
                      value: bucket.name,
                    },
                    {
                      name: "KEY",
                      value: key,
                    },
                  ],
                },
              ],
            },
          });
          await ecsClient.send(runTaskCommand);

          await sqsClient.send(
            new DeleteMessageCommand({
              QueueUrl: process.env.SQS_QUEUE_URL,
              ReceiptHandle: message.ReceiptHandle,
            })
          );
        }
      }
    }
  } catch (error) {
    console.log("Error while fetching messages", { error });
  }
};

init();
