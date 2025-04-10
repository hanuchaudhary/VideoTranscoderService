/**
 * This function performs the following steps:
 * 1. Downloads the videos from S3.
 * 2. Starts the transcoding process using FFmpeg.
 * 3. Uploads the transcoded videos back to S3.
 *
 * @param {string} inputBucket - The name of the S3 bucket containing the input videos.
 * @param {string} outputBucket - The name of the S3 bucket where the transcoded videos will be uploaded.
 * @param {string} videoKey - The key of the video file in the input S3 bucket.
 * @param {Object} options - Additional options for the transcoding process.
 * @param {string} options.format - The desired output video format (e.g., mp4, mkv).
 * @param {number} options.resolution - The desired resolution for the output video.
 * @returns {Promise<string>} - A promise that resolves to the key of the uploaded transcoded video in the output S3 bucket.
 * @throws {Error} - Throws an error if any step in the process fails.
 */

import {
  GetObjectCommand,
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "node:path";
import dotnev from "dotenv";
import ffmpeg from "fluent-ffmpeg";
import readFS from "fs"

dotnev.config();

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey:
      process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION || "ap-south-1",
});

const RESOLUTIONS = [
  { name: "360p", height: 480, width: 360 },
  { name: "480p", height: 860, width: 480 },
  { name: "720p", height: 1280, width: 720 },
  { name: "1080p", height: 1920, width: 1080 },
];

const init = async () => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: process.env.KEY,
    });

    console.log("Getting video files...");
    const response = await s3Client.send(command);
    console.log(`Recieved Video file: ${response.Body}`);

    const originalFilePath = `orginalVideo.mp4`;
    await fs.writeFile(originalFilePath, response.Body);

    const originalVideoPath = path.resolve(originalFilePath);

    console.log("Transcoding...");
    const promises = RESOLUTIONS.map((resolution) => {
      const outputPath = `video-${resolution.name}.mp4`;

      return new Promise((resolve) => {
        ffmpeg(originalVideoPath)
          .output(outputPath)
          .withVideoCodec("libx264")
          .withAudioCodec("aac")
          .withSize(`${resolution.width}x${resolution.height}`)
          .format("mp4")
          .on("end", async () => {
            console.log(`Transcoded ${outputPath}`);
            const command = new PutObjectCommand({
              Bucket: process.env.TRANSCODED_VIDEOS_BUCKET_NAME || "final-transcoded-video-bucket",
              Key: outputPath,
              Body : readFS.createReadStream(path.resolve(outputPath))
            });
            
            console.log(`${outputPath} Uploading...`);
            await s3Client.send(command);
            console.log(`${outputPath} Uploaded`);
            console.log(`Saved to final S3 ${outputPath}`);

            resolve(outputPath);
          })
          .run();
      });
    });

    await Promise.all(promises);
  } catch (error) {
    console.log("Error:", error);
  }
};

init();
