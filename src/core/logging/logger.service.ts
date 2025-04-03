import { ensureDir, exists } from "@std/fs";

export enum LogLevel {
  LOG = "LOG",
  WARN = "WARN",
  ERROR = "ERROR",
}

export class LoggerService {
  private logDirectory = "./logs";
  private maxLinesPerFile = 200;
  private currentLogFile: string | null = null;
  private currentLineCount = 0;

  constructor() {
    this.initializeLogFile();
  }

  private async initializeLogFile(): Promise<void> {
    await ensureDir(this.logDirectory);

    this.currentLogFile = `${this.logDirectory}/app_${
      new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
    }.log`;
    this.currentLineCount = 0;

    try {
      if (await exists(this.currentLogFile)) {
        const content = await Deno.readTextFile(this.currentLogFile);
        this.currentLineCount = content.split("\n").length;
      }
    } catch (error) {
      console.error("Error reading log file:", error);
    }
  }

  private rolloverLogFile() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    this.currentLogFile = `${this.logDirectory}/app_${timestamp}.log`;
    this.currentLineCount = 0;
  }

  log(message: string): void {
    this.writeLog(LogLevel.LOG, message);
  }

  warn(message: string): void {
    this.writeLog(LogLevel.WARN, message);
  }

  error(message: string, error?: unknown): void {
    this.writeLog(LogLevel.ERROR, message);
    if (error instanceof Error) {
      console.error(error.stack);
    } else if (error) {
      console.error(error);
    }
  }

  private async writeLog(level: LogLevel, message: string): Promise<void> {
    const timestamp = new Date().toLocaleTimeString(
      "pt-BR",
      { timeZone: "America/Sao_Paulo" },
    );
    const logEntry = `[${timestamp}][${level}]: ${message}\n`;

    console.log(logEntry.trimEnd()); // Keep the console output

    if (!this.currentLogFile) {
      await this.initializeLogFile();
    }

    try {
      await Deno.writeTextFile(this.currentLogFile!, logEntry, { append: true });
      this.currentLineCount++;

      if (this.currentLineCount >= this.maxLinesPerFile) {
        this.rolloverLogFile();
      }
    } catch (error) {
      console.error("Error writing to log file:", error);
    }
  }
}
