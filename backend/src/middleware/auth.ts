import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";

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
    return res.status(401).json({
      message: "Authentication is required",
      code: "AUTH_REQUIRED"
    });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.id,
      name: payload.name,
      email: payload.email
    };
    return next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Access token has expired",
        code: "TOKEN_EXPIRED"
      });
    }

    return res.status(401).json({
      message: "Invalid or expired authentication token",
      code: "INVALID_TOKEN"
    });
  }
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const authorization = req.header("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;

  if (!token) {
    return next();
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.id,
      name: payload.name,
      email: payload.email
    };
  } catch {
    // Proceed as unauthenticated
  }

  return next();
}
