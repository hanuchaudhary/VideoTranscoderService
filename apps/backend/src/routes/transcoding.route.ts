import express, { Router, Request, Response } from "express";
import { authenticateUser } from "../config/middleware";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../config/config";
import { db } from "@repo/database/client";
import { transcodingJobs } from "@repo/database/schema";
import { v4 as uuid } from "uuid";
import { z } from "zod";

export const transcodingRouter: Router = Router();
transcodingRouter.use(authenticateUser);
transcodingRouter.use(express.json());

transcodingRouter.get("/", async (req: Request, res: Response) => {
  res.json(req.user.id);
});

export const preSignedUrlSchema = z.object({
  fileType: z.string().min(1, "File type is required"),
  videoId: z.string().min(1, "Video ID is required"),
  resolutions: z.array(z.string()).optional(),
  videoDuration: z.string().min(1, "Video duration is required"),
  videoTitle: z.string().min(1, "Video title is required"),
  videoSize: z.string().min(1, "Video size is required"),
});

transcodingRouter.post("/preSignedUrl", async (req: Request, res: Response) => {
  try {
    const parsedData = preSignedUrlSchema.safeParse(req.body);

    if (!parsedData.success) {
      res.status(400).json({
        error: "Invalid request data",
        details: parsedData.error.errors,
      });
      return;
    }

    const {
      fileType,
      videoId,
      resolutions,
      videoDuration,
      videoTitle,
      videoSize,
    } = parsedData.data;

    const userId = req.user.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User ID is required" });
      return;
    }
    const VideoKey = `uploads/${userId}/${videoId}`;

    // KEY MUST BE VIDEOS/USERID/VIDEOID/FILE_NAME

    const command = new PutObjectCommand({
      Bucket: process.env.RAW_BUCKET_NAME, // Temporary bucket for uploads
      Key: VideoKey,
      ContentType: fileType,
    });

    await db.insert(transcodingJobs).values({
      id: uuid(),
      userId: userId,
      inputS3Path: VideoKey,
      outputS3Path: null, // This will be updated later after transcoding
      status: "PENDING",
      videoDuration,
      videoId,
      videoSize,
      videoTitle,
      videoType: fileType,
      resolutions: resolutions || [],
      errorMessage: null,
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
