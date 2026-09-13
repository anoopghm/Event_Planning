import pool from "./db";
import { logger } from "../utils/logger";

export async function initDb() {
  logger.info("Verifying database tables and executing schema migrations if needed...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      is_verified TINYINT(1) NOT NULL DEFAULT 0,
      verification_token VARCHAR(255) DEFAULT NULL,
      verification_token_expires DATETIME DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_users_verification_token (verification_token)
    );
  `);

  // Safe migration for existing users table
  try {
    const [columns] = await pool.query<any[]>(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'`
    );
    const colNames = Array.isArray(columns)
      ? columns.map((c: any) => String(c.COLUMN_NAME).toLowerCase())
      : [];

    if (!colNames.includes("is_verified")) {
      logger.info("Adding 'is_verified' column to 'users' table...");
      // Mark existing users as verified so they are not locked out
      await pool.query(`ALTER TABLE users ADD COLUMN is_verified TINYINT(1) NOT NULL DEFAULT 1`);
      await pool.query(`ALTER TABLE users ALTER COLUMN is_verified SET DEFAULT 0`);
    }
    if (!colNames.includes("verification_token")) {
      logger.info("Adding 'verification_token' column to 'users' table...");
      await pool.query(`ALTER TABLE users ADD COLUMN verification_token VARCHAR(255) DEFAULT NULL`);
    }
    if (!colNames.includes("verification_token_expires")) {
      logger.info("Adding 'verification_token_expires' column to 'users' table...");
      await pool.query(`ALTER TABLE users ADD COLUMN verification_token_expires DATETIME DEFAULT NULL`);
    }
  } catch (migErr) {
    logger.warn("Migration notice for users table:", migErr);
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      date VARCHAR(50) NOT NULL,
      time VARCHAR(50) NOT NULL,
      location VARCHAR(255) DEFAULT NULL,
      image_url VARCHAR(500) DEFAULT NULL,
      tags JSON DEFAULT NULL,
      status VARCHAR(50) DEFAULT 'Upcoming',
      created_by INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_events_created_by (created_by),
      INDEX idx_events_date (date),
      CONSTRAINT fk_events_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Safe migration for events table to add image_url if not present
  try {
    const [eventCols] = await pool.query<any[]>(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'events'`
    );
    const eventColNames = Array.isArray(eventCols)
      ? eventCols.map((c: any) => String(c.COLUMN_NAME).toLowerCase())
      : [];

    if (!eventColNames.includes("image_url")) {
      logger.info("Adding 'image_url' column to 'events' table...");
      await pool.query(`ALTER TABLE events ADD COLUMN image_url VARCHAR(500) DEFAULT NULL`);
    }
  } catch (err) {
    logger.warn("Migration notice for events table:", err);
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_presence (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_id INT NOT NULL,
      user_id INT NOT NULL,
      status ENUM('yes', 'no', 'maybe') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_presence_event (event_id),
      INDEX idx_presence_user (user_id),
      CONSTRAINT fk_presence_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      CONSTRAINT fk_presence_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY uq_event_user (event_id, user_id)
    );
  `);

  try {
    await pool.query(`
      ALTER TABLE event_presence MODIFY COLUMN status ENUM('yes', 'no', 'maybe') NOT NULL
    `);
  } catch {
    // Column may already be updated or table created with the new ENUM
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token_hash VARCHAR(64) NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      revoked TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_refresh_tokens_user (user_id),
      INDEX idx_refresh_tokens_hash (token_hash),
      CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}

