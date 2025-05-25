import { Request, Response, NextFunction } from "express";
import { auth } from "./auth";
import { fromNodeHeaders } from "better-auth/node";

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!session || !session.user || !session.session) {
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
