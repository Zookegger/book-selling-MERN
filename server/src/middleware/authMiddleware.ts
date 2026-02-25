import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const token = authHeader.replace("Bearer ", "");
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not set");
    }

    const payload = jwt.verify(token, secret) as {
      id?: string;
      sub?: string;
    };

    req.userId = payload.id ?? payload.sub ?? "";
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized" });
  }
};
