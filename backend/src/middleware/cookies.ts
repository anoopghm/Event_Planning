import { NextFunction, Request, Response } from "express";

// Extend Express Request interface to include cookies
declare global {
  namespace Express {
    interface Request {
      cookies?: Record<string, string>;
    }
  }
}

/**
 * Parses HTTP cookie header into key-value map
 */
export function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  const items = cookieHeader.split(";");
  for (let i = 0; i < items.length; i++) {
    const pair = items[i];
    const eqIdx = pair.indexOf("=");
    if (eqIdx > 0) {
      const key = pair.slice(0, eqIdx).trim();
      const val = pair.slice(eqIdx + 1).trim();
      try {
        cookies[key] = decodeURIComponent(val);
      } catch {
        cookies[key] = val;
      }
    }
  }
  return cookies;
}

export function cookieParserMiddleware(req: Request, _res: Response, next: NextFunction) {
  req.cookies = parseCookies(req.headers.cookie);
  return next();
}

