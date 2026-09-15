import dotenv from "dotenv";
import path from "path";
import knex, { Knex } from "knex";

dotenv.config();

export const db: Knex = knex({
  client: "mysql2",
  connection: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "event",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306
  },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    directory: path.join(__dirname, "../migrations"),
    loadExtensions: [".ts", ".js"]
  }
});

export default db;
