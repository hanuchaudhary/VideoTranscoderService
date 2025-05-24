import { Request, Response, Router } from "express";
import { db } from "@repo/database/client";
import { user } from "@repo/database/schema";
export const userRouter : Router = Router();

userRouter.post("/sigin", async (req: Request, res: Response) => {});

userRouter.get("/", async (req: Request, res: Response) => {
    const headers = req.headers;
    console.log("Headers:", headers);
    const token = headers.authorization?.split(" ")[1];
    console.log("Token:", token);
    // const users = await db.select().from(user);
    res.json({
        message: "Hello from user route",
        // users: users,
        token: token,
        headers: headers,
    });
});
