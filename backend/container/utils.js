import { PutObjectCommand } from "@aws-sdk/client-s3";
import ffmpeg from "fluent-ffmpeg";
import { s3Client } from "./config";

const RESOLUTIONS = [
  { name: "360p", height: 480, width: 360 },
  { name: "480p", height: 860, width: 480 },
  { name: "720p", height: 1280, width: 720 },
  { name: "1080p", height: 1920, width: 1080 },
];

export const transcodeVideoService = async (originalVideoPath) => {
  const promises = RESOLUTIONS.map((resolution) => {
    const outputPath = `transcoded/video-${resolution.name}.mp4`;

    return new Promise((resolve) => {
      ffmpeg(originalVideoPath)
        .output(outputPath)
        .withVideoCodec("libx264")
        .withAudioCodec("aac")
        .withSize(`${resolution.width}x${resolution.height}`)
        .format("mp4")
        .on("end", async () => {
          const command = new PutObjectCommand({
            Bucket: process.env.TRANSCODED_VIDEOS_BUCKET_NAME,
            Key: outputPath,
          });

          console.log(`${outputPath} Uploading...`);
          await s3Client.send(command);
          console.log(`${outputPath} Uploaded`);

          resolve(outputPath);
        })
        .run();
    });
  });

  const transcodedVideoFiles = await Promise.all(promises);
  return transcodedVideoFiles;
};
