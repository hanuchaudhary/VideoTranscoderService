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

import { GetObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "node:path";
import { transcodeVideoService } from "./utils";
import { s3Client } from "./config";

const init = async () => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: process.env.KEY,
    });

    const response = await s3Client.send(command);
    const originalFilePath = `videos/orginalVideo.mp4`;
    await fs.writeFile(originalFilePath, response.Body);

    const originalVideoPath = path.resolve(originalFilePath);

    await transcodeVideoService(originalVideoPath);
  } catch (error) {
    console.log("Error:", error);
  }
};

init();
