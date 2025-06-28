import { Request, Response, NextFunction } from "express";
import { auth } from "./auth";
import { fromNodeHeaders } from "better-auth/node";
import { db } from "@repo/database/client";
import { subscription, transcodingJobs } from "@repo/database/schema";
import { and, eq, sql } from "drizzle-orm";

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user || !session.session) {
      console.log("Unauthorized access attempt detected");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    req.user = session.user;
    req.session = session.session;

    next();
  } catch (err) {
    next(err);
  }
};

export const subscriptionMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const FREE_TRANSCODING_JOBS = 5;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized: User ID is required" });
    return;
  }

  try {
    const subs = await db
      .select()
      .from(subscription)
      .limit(1)
      .where(
        and(eq(subscription.status, "ACTIVE"), eq(subscription.userId, userId))
      );

    const completedJobsResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(transcodingJobs)
      .where(
        and(
          eq(transcodingJobs.userId, userId),
          eq(transcodingJobs.status, "COMPLETED")
        )
      );

    const completedJobsCount = Number(completedJobsResult[0]?.count || 0);

    if (subs.length === 0 && completedJobsCount >= FREE_TRANSCODING_JOBS) {
      console.log(
        `User ${userId} blocked: No active subscription and ${completedJobsCount} completed jobs.`
      );
      res.status(403).json({
        error: "Forbidden: No active subscription and free job limit reached.",
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Error in subscription middleware:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
