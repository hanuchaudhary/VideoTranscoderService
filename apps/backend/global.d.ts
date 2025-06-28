declare namespace Express {
  export interface Request {
    user: {
      id: string;
      email: string;
      name: string;
    };
    session: {
      id: string;
      userId: string;
      expiresAt: Date;
      createdAt: Date;
    };
  }
}
