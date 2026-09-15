import type { Knex } from "knex";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const config: { [key: string]: Knex.Config } = {
  development: {
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
      directory: path.join(__dirname, "src", "migrations"),
      extension: "ts",
      loadExtensions: [".ts", ".js"]
    }
  },
  production: {
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
      directory: path.join(__dirname, "dist", "migrations"),
      extension: "js",
      loadExtensions: [".js"]
    }
  }
};

export default config;
module.exports = config;

