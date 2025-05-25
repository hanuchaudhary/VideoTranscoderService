declare namespace Express {
    export interface Request {
        user: {
            id: string;
            email: string;

        },
        session: {
            id: string;
            userId: string;
            expiresAt: Date;
            createdAt: Date;
        }
    }
}