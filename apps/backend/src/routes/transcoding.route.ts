import { Router, Request, Response } from "express";
import { authenticateUser } from "../config/middleware";


export const transcodingRouter: Router = Router();
transcodingRouter.get("/", authenticateUser, async (req: Request, res: Response) => {
  res.json(req.user.id);
});

transcodingRouter.get("/:id", (req: Request, res: Response) => {
  res.send("Hello World");
});


