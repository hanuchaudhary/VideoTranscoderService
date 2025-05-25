import { Request, Response, NextFunction } from "express";
import { auth } from "./auth";
import { fromNodeHeaders } from "better-auth/node";

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        // console.log("Session data:", session);
        
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
