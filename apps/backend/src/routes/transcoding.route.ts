import express, { Router, Request, Response } from "express";
import { authenticateUser } from "../config/middleware";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../config/config";
import { db } from "@repo/database/client";
import { jobLogs, transcodingJobs } from "@repo/database/schema";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { and, asc, desc, eq } from "drizzle-orm";

export const transcodingRouter: Router = Router();
transcodingRouter.use(authenticateUser);
transcodingRouter.use(express.json());

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

    console.log({
      fileType,
      resolutions,
      videoDuration,
      videoTitle,
      videoSize,
    });

    const userId = req.user.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User ID is required" });
      return;
    }
    const VideoKey = `uploads/${userId}/${videoId}`;

    // KEY MUST BE VIDEOS/USERID/VIDEOID/FILE_NAME
    const job = await db
      .insert(transcodingJobs)
      .values({
        id: uuid(),
        userId: userId,
        inputS3Path: VideoKey,
        outputS3Path: null, // This will be updated later after transcoding
        status: "QUEUED",
        videoDuration,
        videoId,
        videoSize,
        videoTitle,
        videoType: fileType,
        resolutions: resolutions,
        errorMessage: null,
      })
      .returning({ id: transcodingJobs.id });

    const command = new PutObjectCommand({
      Bucket: process.env.RAW_BUCKET_NAME, // Temporary bucket for uploads
      Key: VideoKey,
      ContentType: fileType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    res.json({ url: signedUrl, method: "PUT", jobId: job[0]?.id });
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    res.status(500).json({ error: "Failed to generate pre-signed URL" });
  }
});

transcodingRouter.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User ID is required" });
      return;
    }

    const videoJobs = await db
      .select()
      .from(transcodingJobs)
      .where(eq(transcodingJobs.userId, userId))
      .orderBy(desc(transcodingJobs.createdAt));

    if (videoJobs.length === 0) {
      res
        .status(404)
        .json({ error: "No transcoding jobs found for this user." });
      return;
    }

    res.json(videoJobs);
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    res.status(500).json({ error: "Failed to fetch transcoding jobs." });
  }
});

transcodingRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User ID is required" });
      return;
    }

    const jobId = req.params.id;
    if (!jobId) {
      res.status(400).json({ error: "Job ID is required" });
      return;
    }
    const result = await db
      .select()
      .from(transcodingJobs)
      .where(eq(transcodingJobs.id, jobId));

    const logs = await db
      .select()
      .from(jobLogs)
      .where(eq(jobLogs.jobId, jobId))
      .orderBy(asc(jobLogs.createdAt));

    const jobWithLogs = {
      ...result[0],
      logs: logs,
    };

    res.json(jobWithLogs);
    return;
  } catch (error) {
    console.error("Error fetching transcoding job:", error);
    res.status(500).json({ error: "Failed to fetch transcoding job." });
  }
});

transcodingRouter.put("/status/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User ID is required" });
      return;
    }

    const jobId = req.params.id;
    if (!jobId) {
      res.status(400).json({ error: "Job ID is required" });
      return;
    }

    const { status, outputS3Path, errorMessage } = req.body;

    if (
      !status ||
      !["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELED"].includes(
        status
      )
    ) {
      res.status(400).json({ error: "Invalid status provided." });
      return;
    }

    await db
      .update(transcodingJobs)
      .set({
        status,
        outputS3Path: outputS3Path || null,
        errorMessage: errorMessage || null,
      })
      .where(eq(transcodingJobs.id, jobId));

    res.json({ message: "Transcoding job status updated successfully." });
  } catch (error) {
    console.error("Error updating transcoding job status:", error);
    res.status(500).json({ error: "Failed to update transcoding job status." });
  }
});

transcodingRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User ID is required" });
      return;
    }

    const jobId = req.params.id;
    if (!jobId) {
      res.status(400).json({ error: "Job ID is required" });
      return;
    }

    await db.delete(transcodingJobs).where(eq(transcodingJobs.id, jobId));
    res.json({ message: "Transcoding job deleted successfully." });
  } catch (error) {
    console.error("Error deleting transcoding job:", error);
    res.status(500).json({ error: "Failed to delete transcoding job." });
  }
});

transcodingRouter.get("/:jobId/download/:resolution", async (req, res) => {
  try {
    const { jobId, resolution } = req.params;
    const userId = req.user.id;

    const job = await db
      .select()
      .from(transcodingJobs)
      .where(
        and(eq(transcodingJobs.id, jobId), eq(transcodingJobs.userId, userId))
      )
      .limit(1);

    if (!job[0] || !job[0].outputS3Path) {
      res.status(404).json({ error: "Job or output not found" });
      return;
    }

    const outputS3Path = JSON.parse(job[0].outputS3Path);
    const s3Path = outputS3Path[resolution];
    if (!s3Path) {
      res.status(404).json({ error: `Resolution ${resolution} not found` });
      return;
    }

    const url = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: process.env.FINAL_S3_BUCKET,
        Key: s3Path.replace(`s3://${process.env.FINAL_S3_BUCKET}/`, ""),
      }),
      { expiresIn: 24 * 60 * 60 } // 24 hours
    );

    res.json({ downloadUrl: url });
  } catch (error) {
    console.error("Error generating download URL:", error);
    res.status(500).json({ error: "Failed to generate download URL" });
  }
});
