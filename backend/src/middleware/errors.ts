import { NextFunction, Request, Response } from "express";

export function notFound(req: Request, res: Response) {
  return res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(
  error: Error & { status?: number; type?: string },
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Malformed JSON request body" });
  }

  console.error(error);
  return res.status(500).json({ message: "Internal server error" });
}
