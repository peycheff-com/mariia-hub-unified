/**
 * Enhanced Logger Utility
 * Structured logging for the API ecosystem
 */

import { createWriteStream, WriteStream } from 'fs';
import { join } from 'path';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  error?: any;
  metadata?: Record<string, any>;
}

class Logger {
  private logLevel: LogLevel;
  private logFile: WriteStream | null = null;
  private static instance: Logger;

  constructor() {
    this.logLevel = this.getLogLevel();
    this.initializeFileLogging();
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
    return LogLevel[level as keyof typeof LogLevel] || LogLevel.INFO;
  }

  private initializeFileLogging(): void {
    if (process.env.NODE_ENV === 'production' && process.env.LOG_TO_FILE === 'true') {
      try {
        const logPath = join(process.cwd(), 'logs', 'api.log');
        this.logFile = createWriteStream(logPath, { flags: 'a' });
      } catch (error) {
        console.error('Failed to initialize file logging:', error);
      }
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatLog(entry: LogEntry): string {
    const logData = {
      level: LogLevel[entry.level],
      timestamp: entry.timestamp,
      message: entry.message,
      requestId: entry.requestId,
      userId: entry.userId,
      ip: entry.ip,
      method: entry.method,
      url: entry.url,
      statusCode: entry.statusCode,
      responseTime: entry.responseTime,
      ...entry.metadata,
    };

    if (entry.error) {
      logData.error = {
        message: entry.error.message,
        stack: entry.error.stack,
        name: entry.error.name,
      };
    }

    return JSON.stringify(logData);
  }

  private writeLog(entry: LogEntry): void {
    if (entry.level > this.logLevel) return;

    const formattedLog = this.formatLog(entry);

    // Console output
    const consoleMethod = this.getConsoleMethod(entry.level);
    consoleMethod(formattedLog);

    // File output
    if (this.logFile) {
      this.logFile.write(formattedLog + '\n');
    }
  }

  private getConsoleMethod(level: LogLevel): Console['log'] {
    switch (level) {
      case LogLevel.ERROR:
        return console.error;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.DEBUG:
        return console.debug;
      default:
        return console.log;
    }
  }

  public error(message: string, metadata?: Record<string, any>): void {
    this.writeLog({
      level: LogLevel.ERROR,
      message,
      timestamp: new Date().toISOString(),
      metadata,
    });
  }

  public warn(message: string, metadata?: Record<string, any>): void {
    this.writeLog({
      level: LogLevel.WARN,
      message,
      timestamp: new Date().toISOString(),
      metadata,
    });
  }

  public info(message: string, metadata?: Record<string, any>): void {
    this.writeLog({
      level: LogLevel.INFO,
      message,
      timestamp: new Date().toISOString(),
      metadata,
    });
  }

  public debug(message: string, metadata?: Record<string, any>): void {
    this.writeLog({
      level: LogLevel.DEBUG,
      message,
      timestamp: new Date().toISOString(),
      metadata,
    });
  }

  // Request logging
  public request(req: any, res: any, responseTime: number): void {
    this.writeLog({
      level: LogLevel.INFO,
      message: `${req.method} ${req.path}`,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      url: req.path,
      statusCode: res.statusCode,
      responseTime,
    });
  }

  // Error logging with request context
  public errorWithRequest(message: string, error: any, req?: any): void {
    this.writeLog({
      level: LogLevel.ERROR,
      message,
      timestamp: new Date().toISOString(),
      requestId: req?.requestId,
      userId: req?.user?.id,
      ip: req?.ip,
      method: req?.method,
      url: req?.path,
      error,
    });
  }

  // Security logging
  public security(message: string, metadata: Record<string, any>): void {
    this.writeLog({
      level: LogLevel.WARN,
      message: `SECURITY: ${message}`,
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        category: 'security',
      },
    });
  }

  // Performance logging
  public performance(operation: string, duration: number, metadata?: Record<string, any>): void {
    this.writeLog({
      level: LogLevel.INFO,
      message: `Performance: ${operation}`,
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        category: 'performance',
        operation,
        duration,
      },
    });
  }

  // Business logic logging
  public business(event: string, metadata: Record<string, any>): void {
    this.writeLog({
      level: LogLevel.INFO,
      message: `Business Event: ${event}`,
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        category: 'business',
        event,
      },
    });
  }

  // API call logging
  public apiCall(method: string, endpoint: string, userId?: string, duration?: number): void {
    this.writeLog({
      level: LogLevel.INFO,
      message: `API Call: ${method} ${endpoint}`,
      timestamp: new Date().toISOString(),
      userId,
      metadata: {
        category: 'api',
        method,
        endpoint,
        duration,
      },
    });
  }

  // Close file logger
  public close(): void {
    if (this.logFile) {
      this.logFile.end();
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Ensure proper cleanup on process exit
process.on('SIGINT', () => logger.close());
process.on('SIGTERM', () => logger.close());
process.on('SIGUSR2', () => logger.close()); // For nodemon

export default logger;