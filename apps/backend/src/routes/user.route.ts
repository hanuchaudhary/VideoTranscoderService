import { Request, Response, Router } from "express";
import { authenticateUser } from "../config/middleware";
export const userRouter: Router = Router();

userRouter.get("/", authenticateUser, async (req: Request, res: Response) => {
  res.json(req.user);
});

