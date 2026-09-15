import db from "./db";
import { logger } from "../utils/logger";

export async function initDb() {
  logger.info("Running Knex database migrations...");
  const [batchNo, log] = await db.migrate.latest();
  if (log.length === 0) {
    logger.info("Database schema is up to date (no new migrations).");
  } else {
    logger.info(`Batch ${batchNo} run: ${log.length} migration(s) executed successfully:`);
    log.forEach((file: string) => logger.info(`  - ${file}`));
  }
}
