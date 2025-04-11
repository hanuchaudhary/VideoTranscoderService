/**
 * This script runs in an ECS task to transcode a video into multiple resolutions.
 * It performs the following steps:
 * 1. Downloads the video from S3 using the provided bucket and key.
 * 2. Transcodes the video into multiple resolutions using FFmpeg.
 * 3. Uploads the transcoded videos back to S3 in the videos/<videoId>/<resolution>.mp4 structure.
 *
 * Environment Variables:
 * - BUCKET_NAME: The S3 bucket containing the input video.
 * - KEY: The S3 key of the input video (e.g., videos/<videoId>/<videoId>.mp4).
 * - VIDEO_ID: The unique video ID passed from the backend.
 * - TRANSCODED_VIDEOS_BUCKET_NAME: The S3 bucket for transcoded videos (optional, defaults to BUCKET_NAME).
 */

import {
  GetObjectCommand,
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import ffmpeg from "fluent-ffmpeg";

dotenv.config();

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION || "ap-south-1",
});

const RESOLUTIONS = [
  { name: "360p", width: 640, height: 360 }, // Fixed aspect ratio
  { name: "480p", width: 854, height: 480 }, // Fixed aspect ratio
  { name: "720p", width: 1280, height: 720 },
  { name: "1080p", width: 1920, height: 1080 },
];

const init = async () => {
  // Validate environment variables
  const requiredEnvVars = ["BUCKET_NAME", "KEY", "VIDEO_ID"];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`Missing environment variable: ${envVar}`);
      process.exit(1);
    }
  }

  const inputBucket = process.env.BUCKET_NAME;
  const outputBucket = process.env.TRANSCODED_VIDEOS_BUCKET_NAME;
  const videoKey = process.env.KEY;
  const videoId = process.env.VIDEO_ID;

  let originalFilePath;

  try {
    // Step 1: Download the video from S3
    console.log(`Downloading video from s3://${inputBucket}/${videoKey}...`);
    const command = new GetObjectCommand({
      Bucket: inputBucket,
      Key: videoKey,
    });

    const response = await s3Client.send(command);
    if (!response.Body) {
      throw new Error("Failed to download video: Empty response body");
    }

    originalFilePath = path.resolve("/tmp/originalVideo.mp4");
    await fs.writeFile(originalFilePath, response.Body);
    console.log(`Downloaded video to ${originalFilePath}`);

    // Step 2: Transcode the video into multiple resolutions
    console.log("Starting transcoding...");
    const promises = RESOLUTIONS.map((resolution) => {
      const outputPath = path.resolve(`/tmp/video-${resolution.name}.mp4`);
      const outputKey = `videos/${videoId}/${resolution.name}.mp4`; // Save in videos/<videoId>/<resolution>.mp4

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
          .on("progress", (progress) => {
            console.log(
              `Transcoding ${resolution.name}: ${progress.percent}% complete`
            );
          })
          .on("end", async () => {
            try {
              // Step 3: Upload the transcoded video to S3
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
              console.log(
                `Uploaded ${resolution.name} to s3://${outputBucket}/${outputKey}`
              );

              // Clean up temporary file
              await fs.unlink(outputPath);
              console.log(`Cleaned up temporary file: ${outputPath}`);

              resolve(outputKey);
            } catch (uploadError) {
              console.error(
                `Failed to upload ${resolution.name}:`,
                uploadError
              );
              reject(uploadError);
            }
          })
          .on("error", (err) => {
            console.error(`Transcoding failed for ${resolution.name}:`, err);
            reject(err);
          })
          .run();
      });
    });

    const outputKeys = await Promise.all(promises);
    console.log("Transcoding complete. Output keys:", outputKeys);

    // Clean up the original file
    await fs.unlink(originalFilePath);
    console.log(`Cleaned up original file: ${originalFilePath}`);
  } catch (error) {
    console.error("Error in transcoding process:", error);
    // Clean up if the original file exists
    if (originalFilePath) {
      try {
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
