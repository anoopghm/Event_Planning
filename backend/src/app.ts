import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRouter from "./routes/auth";
import eventsRouter from "./routes/events";
import { errorHandler, notFound } from "./middleware/errors";
import { cookieParserMiddleware } from "./middleware/cookies";
import { requestLogger } from "./utils/logger";

import { setupSwagger } from "./docs/swagger";

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(requestLogger);
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "16kb" }));
app.use(cookieParserMiddleware);

// API Documentation (Swagger UI)
setupSwagger(app);


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    ok: false,
    code: "RATE_LIMIT_EXCEEDED",
    message: "Too many authentication attempts. For your security, please wait 15 minutes before trying again."
  }
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    ok: false,
    code: "RATE_LIMIT_EXCEEDED",
    message: "Too many token refresh requests. Please wait a few minutes before trying again."
  }
});

const resendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    ok: false,
    code: "RATE_LIMIT_EXCEEDED",
    message: "Too many verification requests. Please check your spam folder or wait 15 minutes before requesting again."
  }
});

app.get("/", (_req, res) => res.json({ ok: true }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/resend-verification", resendLimiter);
app.use("/api/auth/refresh", refreshLimiter);
app.use("/api/auth", authRouter);
app.use("/api/events", eventsRouter);


app.use(notFound);
app.use(errorHandler);

export default app;
