import { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";
import { AppError } from "../utils/AppError";

/**
 * 404 Route Not Found handler
 */
export function notFound(req: Request, res: Response) {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  return res.status(404).json({
    ok: false,
    code: "ROUTE_NOT_FOUND",
    message: `The requested endpoint '${req.method} ${req.originalUrl}' does not exist. Please check the URL or consult the API documentation at /api/docs.`
  });
}

/**
 * Centralized application error handler
 */
export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // 1. Handled Operational Errors (AppError)
  if (error instanceof AppError) {
    logger.warn(`Application error [${error.statusCode}] on ${req.method} ${req.originalUrl}: ${error.message}`);
    return res.status(error.statusCode).json({
      ok: false,
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {})
    });
  }

  // 2. Malformed JSON Request Body
  if (error.type === "entity.parse.failed") {
    logger.warn(`Malformed JSON in request body: ${req.method} ${req.originalUrl}`);
    return res.status(400).json({
      ok: false,
      code: "INVALID_JSON_PAYLOAD",
      message: "The request body contains invalid JSON. Please check your payload syntax and quotation marks."
    });
  }

  // 3. Payload Too Large (exceeds express limit)
  if (error.type === "entity.too.large" || error.status === 413) {
    logger.warn(`Payload too large: ${req.method} ${req.originalUrl}`);
    return res.status(413).json({
      ok: false,
      code: "PAYLOAD_TOO_LARGE",
      message: "The request payload exceeds the allowed 16KB size limit. For event images, please provide an image URL instead."
    });
  }

  // 4. MySQL / Database Specific Errors
  const errCode = error.code || "";
  const errNo = error.errno || 0;

  if (errCode === "ER_DUP_ENTRY" || errNo === 1062) {
    logger.warn(`Database duplicate entry on ${req.method} ${req.originalUrl}:`, error.sqlMessage || error.message);
    return res.status(409).json({
      ok: false,
      code: "DUPLICATE_ENTRY",
      message: "A record with this information already exists in the system."
    });
  }

  if (errCode === "ER_NO_REFERENCED_ROW_2" || errNo === 1452) {
    logger.warn(`Database foreign key violation on ${req.method} ${req.originalUrl}:`, error.sqlMessage || error.message);
    return res.status(400).json({
      ok: false,
      code: "FOREIGN_KEY_VIOLATION",
      message: "The referenced entity (such as user or event) does not exist."
    });
  }

  if (errCode === "ER_ROW_IS_REFERENCED_2" || errNo === 1451) {
    logger.warn(`Database reference constraint on ${req.method} ${req.originalUrl}:`, error.sqlMessage || error.message);
    return res.status(400).json({
      ok: false,
      code: "REFERENCE_CONSTRAINT_ERROR",
      message: "Cannot delete or modify this item because other records are linked to it."
    });
  }

  if (errCode === "ER_DATA_TOO_LONG" || errNo === 1406) {
    logger.warn(`Database column data too long on ${req.method} ${req.originalUrl}:`, error.sqlMessage || error.message);
    return res.status(400).json({
      ok: false,
      code: "DATA_TOO_LONG",
      message: "One or more submitted fields exceed the maximum allowable character length."
    });
  }

  if (
    errCode === "ECONNREFUSED" ||
    errCode === "PROTOCOL_CONNECTION_LOST" ||
    errCode === "ETIMEDOUT" ||
    errCode === "ENOTFOUND"
  ) {
    logger.error(`Database connection unavailable on ${req.method} ${req.originalUrl}:`, error);
    return res.status(503).json({
      ok: false,
      code: "DATABASE_UNAVAILABLE",
      message: "The database service is temporarily unavailable. Please try again shortly."
    });
  }

  // 5. JWT Errors
  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({
      ok: false,
      code: "INVALID_TOKEN",
      message: "The authentication token is invalid or malformed. Please sign in again."
    });
  }

  if (error.name === "TokenExpiredError") {
    return res.status(401).json({
      ok: false,
      code: "TOKEN_EXPIRED",
      message: "Your session token has expired. Please sign in again to continue."
    });
  }

  // 6. Generic unhandled server error
  logger.error(`Unhandled server error on ${req.method} ${req.originalUrl}:`, error);

  const isDev = process.env.NODE_ENV !== "production";
  return res.status(500).json({
    ok: false,
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred while processing your request. Please try again later.",
    ...(isDev && error.message ? { debugMessage: error.message } : {})
  });
}
