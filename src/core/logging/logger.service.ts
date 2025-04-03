export enum LogLevel {
  LOG = "LOG",
  WARN = "WARN",
  ERROR = "ERROR",
}

export class LoggerService {
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

  private writeLog(level: LogLevel, message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}][${level}]: ${message}`);
  }
}