import {
  GetObjectCommand,
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import ffmpeg from "fluent-ffmpeg";
import redis from "ioredis";

const redisClient = new redis(process.env.REDIS_URL);

const publishToRedis = async (data) => {
  const publisher = redisClient.publish("transcoding", JSON.stringify(data));
  if (publisher) {
    console.log("Published to Redis:", data);
  } else {
    console.error("Failed to publish to Redis");
  }
};

dotenv.config();

// S3Client
const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION || "ap-south-1",
});

// Resolutions for transcoding TODO: Add more resolutions like 4K, 8K, 240p etc. ✅
const RESOLUTIONS = [
  { name: "144p", width: 256, height: 144 },
  { name: "240p", width: 426, height: 240 },
  { name: "360p", width: 640, height: 360 },
  { name: "480p", width: 854, height: 480 },
  { name: "720p", width: 1280, height: 720 },
  { name: "1080p", width: 1920, height: 1080 },
  { name: "1440p", width: 2560, height: 1440 },
  { name: "4K", width: 3840, height: 2160 },
];

const init = async () => {
  // Validate environment variables
  const requiredEnvVars = ["BUCKET_NAME", "KEY", "VIDEO_ID", "REDIS_URL", "FINAL_BUCKET_NAME"];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`Missing environment variable: ${envVar}`);
      process.exit(1);
    }
  }

  const inputBucket = process.env.BUCKET_NAME;
  const outputBucket = process.env.FINAL_BUCKET_NAME;
  const videoKey = process.env.KEY;
  const videoId = process.env.VIDEO_ID;

  // Validate the output bucket name
  let originalFilePath;

  try {
    // Step 1: Download the video from S3
    console.log(`Downloading video from s3://${inputBucket}/${videoKey}...`);
    await publishToRedis({
      status: "Downloading",
      message: `Downloading video from s3://${inputBucket}/${videoKey}...`,
    });

    const command = new GetObjectCommand({
      Bucket: inputBucket,
      Key: videoKey,
    });

    const response = await s3Client.send(command);
    if (!response.Body) {
      throw new Error("Failed to download video: Empty response body");
    }

    originalFilePath = path.resolve("/tmp/rawVideo.mp4");
    await fs.writeFile(originalFilePath, response.Body);
    console.log(`Downloaded video to ${originalFilePath}`);

    // Step 2: Transcode the video into multiple resolutions
    console.log("Starting transcoding...");
    await publishToRedis({
      status: "Transcoding",
      message: "Starting transcoding...",
    });

    const promises = RESOLUTIONS.map((resolution) => {
      const outputPath = path.resolve(`/tmp/video-${resolution.name}.mp4`);

      // Save in videos/<videoId>/<resolution>.mp4
      const outputKey = `videos/${videoId}/${resolution.name}.mp4`;

      return new Promise((resolve, reject) => {
        ffmpeg(originalFilePath)
          .output(outputPath)
          .videoCodec("libx264")
          .audioCodec("aac")
          .size(`${resolution.width}x${resolution.height}`)
          .format("mp4")
          .on("start", async () => {
            console.log("Transcoding Started for", resolution.name);
          })
          // .on("progress", (progress) => {
          //   console.log(
          //     `Transcoding ${resolution.name}: ${progress.percent}% complete`
          //   );
          // })
          .on("end", async () => {
            try {
              // Step 3: Save the transcoded video to S3 simultaneously
              console.log(
                `Uploading ${resolution.name} to s3://${outputBucket}/${outputKey}...`
              );

              const uploadCommand = new PutObjectCommand({
                Bucket: outputBucket,
                Key: outputKey,
                Body: await fs.readFile(outputPath),
                ContentType: "video/mp4",
              });

              await s3Client.send(uploadCommand);

              await publishToRedis({
                status: "Transcoding",
                message: `Transcoding ${resolution.name} completed`,
              });

              console.log(
                `Uploaded ${resolution.name} to s3://${outputBucket}/${outputKey}`
              );

              // Remove the temporary transcoded file
              await fs.unlink(outputPath);
              console.log(`Cleaned up temporary file: ${outputPath}`);

              resolve(outputKey);
            } catch (uploadError) {
              console.error(
                `Failed to upload ${resolution.name}:`,
                uploadError
              );
              await publishToRedis({
                status: "Transcoding",
                message: `Failed to upload ${resolution.name}`,
              });
              reject(uploadError);
            }
          })
          .on("error", async (err) => {
            console.error(`Transcoding failed for ${resolution.name}:`, err);
            await publishToRedis({
              status: "Transcoding",
              message: `Transcoding failed for ${resolution.name}`,
            });
            reject(err);
          })
          .run();
      });
    });

    const outputKeys = await Promise.all(promises);
    await publishToRedis({
      status: "Transcoding",
      message: `Transcoding complete. Output keys: ${outputKeys.join(", ")}`,
    });
    console.log("Transcoding complete. Output keys:", outputKeys);

    // Remove the original file after transcoding
    await fs.unlink(originalFilePath);
    console.log(`Cleaned up original file: ${originalFilePath}`);
  } catch (error) {
    console.error("Error in transcoding process:", error);
    // Clean up if the original file exists
    if (originalFilePath) {
      try {
        // Attempt to remove the original file if it exists
        await fs.unlink(originalFilePath);
        console.log(`Cleaned up original file on error: ${originalFilePath}`);
      } catch (cleanupError) {
        console.error("Failed to clean up original file:", cleanupError);
      }
    }
    process.exit(1); // Exit with failure to signal ECS task failure
  }
};

init();
