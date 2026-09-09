import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authorization = req.header("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;

  if (!token) {
    return res.status(401).json({ message: "Authentication is required" });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ message: "Server authentication is not configured" });
  }

  try {
    const payload = jwt.verify(token, secret);
    if (
      typeof payload === "string" ||
      typeof payload.id !== "number" ||
      typeof payload.name !== "string" ||
      typeof payload.email !== "string"
    ) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }

    const user = payload as JwtPayload;
    req.user = { id: user.id as number, name: user.name as string, email: user.email as string };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired authentication token" });
  }
}
