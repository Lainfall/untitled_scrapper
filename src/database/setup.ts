import { Database } from "@db/sqlite";
import { ensureFile } from "@std/fs";
import { APP_CONFIG } from "../config/app.config.ts";
import { LoggerService } from "../core/logging/logger.service.ts";

const dbPath = APP_CONFIG.DB_PATH!;
const dbSettings = ["PRAGMA journal_mode=WAL;", "PRAGMA foreign_keys = ON;"];
const dbTables = [
  `
  CREATE TABLE IF NOT EXISTS
  apps (
  id    INTEGER PRIMARY KEY,
  name TEXT
  );`,
  `
  CREATE TABLE IF NOT EXISTS
  app_data (
  id      INTEGER PRIMARY KEY,
  chance  NUMBER  NOT NULL,
  date    NUMBER  NOT NULL,
  app_id  INTEGER NOT NULL,
  FOREIGN KEY(app_id) REFERENCES apps(id)
  );`,
];

async function setupDatabase() {
  const logger = new LoggerService();
  try {
    await ensureFile(dbPath);
    const db = new Database(dbPath);

    dbSettings.forEach((sql) => db.run(sql));
    dbTables.forEach((sql) => db.run(sql));

    const createdTables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table'",
    ).values<string[]>();

    logger.log(
      "Tables created:\n" +
        createdTables.flat().reduce((last, str) => last + str + "\n", "\n"),
    );

    db.close();
  } catch (error) {
    logger.error("Error setting up database:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await setupDatabase();
}
