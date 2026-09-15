import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export function extractAccessToken(req: Request): string | undefined {
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }
  const authorization = req.header("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice(7);
  }
  return undefined;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractAccessToken(req);

  if (!token) {
    return res.status(401).json({
      ok: false,
      message: "Please sign in to continue.",
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
        ok: false,
        message: "Your session has expired. Please sign in again.",
        code: "TOKEN_EXPIRED"
      });
    }

    return res.status(401).json({
      ok: false,
      message: "Your session token is invalid or expired. Please sign in again.",
      code: "INVALID_TOKEN"
    });
  }
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const token = extractAccessToken(req);

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
