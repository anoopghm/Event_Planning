import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import pool from "./models/db";
import { initDb } from "./models/initDb";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

async function start() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required. Copy .env.example to .env and set it.");
  }

  await pool.query("SELECT 1");
  await initDb();

  const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} received; shutting down.`);
    server.close(() => {
      pool.end()
        .catch((error: Error) => console.error("Unable to close database pool:", error.message))
        .finally(() => process.exit(0));
    });
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((error) => {
  console.error("Unable to start server:", error.message);
  process.exit(1);
});
