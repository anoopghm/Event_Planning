import crypto from "crypto";
import { NextFunction, Request, Response } from "express";

export enum LogLevel {
  DEBUG = 0,
  HTTP = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4
}

const LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: "DEBUG",
  [LogLevel.HTTP]: "HTTP",
  [LogLevel.INFO]: "INFO",
  [LogLevel.WARN]: "WARN",
  [LogLevel.ERROR]: "ERROR"
};

// ANSI color codes
const COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  bold: "\x1b[1m"
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: COLORS.magenta,
  [LogLevel.HTTP]: COLORS.cyan,
  [LogLevel.INFO]: COLORS.green,
  [LogLevel.WARN]: COLORS.yellow,
  [LogLevel.ERROR]: COLORS.red
};

// Configurable log level via environment variable (default: INFO, or DEBUG if NODE_ENV !== 'production')
function getCurrentLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toUpperCase();
  if (envLevel && envLevel in LogLevel) {
    return (LogLevel as any)[envLevel];
  }
  return process.env.NODE_ENV === "production" ? LogLevel.INFO : LogLevel.DEBUG;
}

function getTimestamp(): string {
  const now = new Date();
  // Format as YYYY-MM-DD HH:mm:ss.SSS
  const pad = (n: number, z = 2) => String(n).padStart(z, "0");
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());
  const ms = pad(now.getMilliseconds(), 3);

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
}

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "accesstoken",
  "refreshtoken",
  "verificationtoken",
  "authorization",
  "cookie"
]);

function sanitize(obj: unknown, depth = 0): unknown {
  if (depth > 4) return "[Max Depth Reached]";
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitize(item, depth + 1));
  }

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      clean[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      clean[key] = sanitize(value, depth + 1);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

function formatMeta(meta?: unknown): string {
  if (meta === undefined || meta === null) return "";
  if (meta instanceof Error) {
    return `\n${meta.stack || meta.message}`;
  }
  try {
    const sanitized = sanitize(meta);
    if (typeof sanitized === "object" && Object.keys(sanitized as object).length === 0) {
      return "";
    }
    return ` ${JSON.stringify(sanitized)}`;
  } catch {
    return ` [Serialization Error]`;
  }
}

class Logger {
  private log(level: LogLevel, message: string, meta?: unknown) {
    if (level < getCurrentLogLevel()) return;

    const timestamp = getTimestamp();
    const levelName = LEVEL_NAMES[level].padEnd(5);
    const color = LEVEL_COLORS[level];
    const metaStr = formatMeta(meta);

    const output = `${COLORS.dim}[${timestamp}]${COLORS.reset} ${color}[${levelName}]${COLORS.reset} ${message}${metaStr}`;

    if (level === LogLevel.ERROR) {
      console.error(output);
    } else if (level === LogLevel.WARN) {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  public debug(message: string, meta?: unknown) {
    this.log(LogLevel.DEBUG, message, meta);
  }

  public http(message: string, meta?: unknown) {
    this.log(LogLevel.HTTP, message, meta);
  }

  public info(message: string, meta?: unknown) {
    this.log(LogLevel.INFO, message, meta);
  }

  public warn(message: string, meta?: unknown) {
    this.log(LogLevel.WARN, message, meta);
  }

  public error(message: string, error?: unknown, meta?: unknown) {
    let combinedMeta: unknown = meta;
    if (error) {
      if (error instanceof Error) {
        combinedMeta = meta ? { error: error.stack || error.message, ...((meta as object) || {}) } : error;
      } else {
        combinedMeta = meta ? { error, ...((meta as object) || {}) } : error;
      }
    }
    this.log(LogLevel.ERROR, message, combinedMeta);
  }
}

export const logger = new Logger();

export interface CustomRequest extends Request {
  id?: string;
  startTime?: number;
}

/**
 * Express middleware that logs incoming HTTP requests and response performance
 */
export function requestLogger(req: CustomRequest, res: Response, next: NextFunction) {
  const reqId = (req.header("x-request-id") || crypto.randomUUID()).toString();
  req.id = reqId;
  res.setHeader("x-request-id", reqId);

  const startTime = Date.now();
  req.startTime = startTime;

  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "-";

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Color code status
    let statusColor = COLORS.green;
    if (statusCode >= 500) statusColor = COLORS.red;
    else if (statusCode >= 400) statusColor = COLORS.yellow;
    else if (statusCode >= 300) statusColor = COLORS.cyan;

    const logMsg = `${req.method} ${req.originalUrl || req.url} ${statusColor}${statusCode}${COLORS.reset} - ${duration}ms [ip: ${clientIp}] [reqId: ${reqId.slice(0, 8)}]`;

    if (statusCode >= 500) {
      logger.error(`[HTTP] ${logMsg}`);
    } else if (statusCode >= 400) {
      logger.warn(`[HTTP] ${logMsg}`);
    } else {
      logger.http(logMsg);
    }
  });

  next();
}

