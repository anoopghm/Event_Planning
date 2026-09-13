import { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";

export function notFound(req: Request, res: Response) {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  return res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(
  error: Error & { status?: number; type?: string },
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error.type === "entity.parse.failed") {
    logger.warn(`Malformed JSON in request body: ${req.method} ${req.originalUrl}`);
    return res.status(400).json({ message: "Malformed JSON request body" });
  }

  logger.error(`Unhandled server error on ${req.method} ${req.originalUrl}:`, error);
  return res.status(500).json({ message: "Internal server error" });
}

