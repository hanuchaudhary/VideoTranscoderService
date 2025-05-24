import { Router } from "express";
import { toNodeHandler } from "better-auth/node";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../config/auth";

export const transcodingRouter = Router();

transcodingRouter.all("/api/auth/*", toNodeHandler(auth));

transcodingRouter.get("/", async (req, res) => {
 	const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
	res.json(session);
    return
});
