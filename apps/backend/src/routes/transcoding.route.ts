import { Router, Request, Response } from "express";
import { authenticateUser, subscriptionMiddleware } from "../config/middleware";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as cloudfrontGetSignedUrl } from "@aws-sdk/cloudfront-signer";
import { s3Client } from "../config/config";
import { db } from "@repo/database/client";
import { jobLogs, transcodingJobs } from "@repo/database/schema";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { and, asc, desc, eq } from "drizzle-orm";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const transcodingRouter: Router = Router();
transcodingRouter.use(authenticateUser);
transcodingRouter.use(subscriptionMiddleware);


export const preSignedUrlSchema = z.object({
  fileType: z.string().min(1, "File type is required"),
  videoId: z.string().min(1, "Video ID is required"),
  resolutions: z.array(z.string()).optional(),
  videoDuration: z.string().min(1, "Video duration is required"),
  videoTitle: z.string().min(1, "Video title is required"),
  videoSize: z.string().min(1, "Video size is required"),
});

// Endpoint to generate pre-signed URL for video upload
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

    // KEY MUST BE VIDEOS/USERID/VIDEOID/FILE_NAME
    const job = await db
      .insert(transcodingJobs)
      .values({
        id: uuid(),
        userId: userId,
        inputS3Key: "",
        outputS3Keys: "", // This will be updated later after transcoding
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

    const VideoKey = `uploads/${userId}/${job[0]?.id}/video.${fileType.split("/")[1]}`;

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

// Endpoint to fetch all transcoding jobs
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

// Endpoint to fetch a specific transcoding job by ID
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

// Endpoint to update the status of a transcoding job
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

    const { status, errorMessage } = req.body;

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
        errorMessage: errorMessage || null,
      })
      .where(eq(transcodingJobs.id, jobId));

    res.json({ message: "Transcoding job status updated successfully." });
  } catch (error) {
    console.error("Error updating transcoding job status:", error);
    res.status(500).json({ error: "Failed to update transcoding job status." });
  }
});

// Endpoint to delete a transcoding job
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

// Endpoint to download a specific resolution of a transcoding job
transcodingRouter.get(
  "/download/:jobId",
  async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const { resolutionKey } = req.query;
      const userId = req.user.id;

      if (!userId) {
        res.status(401).json({ error: "Unauthorized: User ID is required" });
        return;
      }

      if (!jobId || !resolutionKey) {
        res
          .status(400)
          .json({ error: "Job ID and resolution key are required" });
        return;
      }

      // Check job ownership
      const job = await db
        .select()
        .from(transcodingJobs)
        .where(
          and(eq(transcodingJobs.id, jobId), eq(transcodingJobs.userId, userId))
        );
      if (job.length === 0) {
        res.status(404).json({ error: "Transcoding job not found." });
        return;
      }

      const cloudfrontDomain = process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN;
      const resourceUrl = `${cloudfrontDomain}/${resolutionKey}`;
      const privateKey = process.env.CLOUDFRONT_PRIVATE_KEY!.replace(
        /\\n/g,
        "\n"
      );
      const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID!;

      // Generate signed URL
      const signedUrl = cloudfrontGetSignedUrl({
        keyPairId,
        privateKey,
        url: resourceUrl,
        dateGreaterThan: new Date(Date.now() - 1000), // Allow some leeway
        dateLessThan: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiration
      });

      await db.insert(jobLogs).values({
        id: uuid(),
        jobId,
        logMessage: `User ${userId} downloaded ${resolutionKey} video`,
        logLevel: "INFO",
      });

      console.log("Generated signed URL:", signedUrl);
      res.json({ downloadUrl: signedUrl });
      return;
    } catch (error) {
      console.error("Error generating download URL:", error);
      res.status(500).json({ error: "Failed to generate download URL" });
    }
  }
);
