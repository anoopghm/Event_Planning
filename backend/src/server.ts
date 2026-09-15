import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import db from "./models/db";
import { initDb } from "./models/initDb";
import { logger } from "./utils/logger";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

async function start() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required. Copy .env.example to .env and set it.");
  }

  logger.info("Connecting to database and verifying connection pool...");
  await db.raw("SELECT 1");
  logger.info("Database connection established. Running Knex migrations...");
  await initDb();
  logger.info("Database initialization completed successfully.");

  const server = app.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT} [env: ${process.env.NODE_ENV || "development"}]`);
  });

  const shutdown = (signal: string) => {
    logger.warn(`${signal} signal received: closing HTTP server...`);
    server.close(() => {
      logger.info("HTTP server closed. Terminating database connection pool...");
      db.destroy()
        .then(() => logger.info("Database pool closed cleanly."))
        .catch((error: Error) => logger.error("Unable to close database pool:", error))
        .finally(() => {
          logger.info("Shutdown complete. Exiting process.");
          process.exit(0);
        });
    });
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((error) => {
  logger.error("Unable to start server:", error);
  process.exit(1);
});
