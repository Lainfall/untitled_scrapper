import { Database } from "@db/sqlite";
import { exists } from "@std/fs/exists";
import { APP_CONFIG } from "../../config/app.config.ts";
import { LoggerService } from "../logging/logger.service.ts";

export class DatabaseService {
  private dbPath: string;
  private database: Database | null = null;
  private logger: LoggerService;

  constructor(logger: LoggerService) {
    this.dbPath = APP_CONFIG.DB_PATH!;
    this.logger = logger;
  }

  async initialize(): Promise<void> {
    if (!(await exists(this.dbPath))) {
      this.logger.error(`Database file does not exist at ${this.dbPath}.`);
      Deno.exit(1);
    }
    this.database = new Database(this.dbPath);
    this.logger.log(`💾 Database initialized at ${this.dbPath}`);
  }

  getDb(): Database {
    if (!this.database) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
    return this.database;
  }

  close(): void {
    if (this.database) {
      this.database.close();
      this.database = null;
      this.logger.log("💾 Database connection closed.");
    }
  }
}
