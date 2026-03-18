/**
 * Logger Utility
 * Centralized logging for the entire application
 */

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

export interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private enabled: boolean;

  constructor() {
    this.enabled = typeof __DEV__ !== "undefined" && __DEV__;
  }

  private log(level: LogLevel, tag: string, message: string, context?: LogContext): void {
    if (!this.enabled) return;

    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] [${tag}] ${message}`;

    switch (level) {
      case LogLevel.ERROR:
        console.error(logMessage, context || "");
        break;
      case LogLevel.WARN:
        console.warn(logMessage, context || "");
        break;
      default:
        console.log(logMessage, context || "");
    }
  }

  debug(tag: string, message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, tag, message, context);
  }

  info(tag: string, message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, tag, message, context);
  }

  warn(tag: string, message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, tag, message, context);
  }

  error(tag: string, message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, tag, message, context);
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const logger = new Logger();
