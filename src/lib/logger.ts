/**
 * Structured logging for Mariia Hub
 * Integrates with Loki for log aggregation
 */

import { createClient } from '@supabase/supabase-js';

interface LogContext {
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  stack?: string;
  url?: string;
  userAgent?: string;
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private static instance: Logger;
  private supabase: any;
  private logBuffer: LogEntry[] = [];
  private isProduction: boolean;
  private minLogLevel: LogLevel;

  constructor() {
    this.isProduction = import.meta.env.PROD;
    this.minLogLevel = this.isProduction ? 'info' : 'debug';

    if (this.isProduction) {
      this.supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL!,
        import.meta.env.VITE_SUPABASE_ANON_KEY!
      );

      // Send logs every 30 seconds
      setInterval(() => this.flushLogs(), 30000);

      // Send logs on page unload
      window.addEventListener('beforeunload', () => this.flushLogs());
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };

    return levels[level] >= levels[this.minLogLevel];
  }

  private createLogEntry(level: LogLevel, message: string, context: LogContext = {}, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    };

    if (error) {
      entry.stack = error.stack;
      entry.context.error = {
        name: error.name,
        message: error.message
      };
    }

    return entry;
  }

  private async sendToBackend(logs: LogEntry[]) {
    if (!this.isProduction || logs.length === 0) return;

    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ logs })
      });

      if (!response.ok) {
        console.error('Failed to send logs:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending logs:', error);
    }
  }

  private async flushLogs() {
    if (this.logBuffer.length === 0) return;

    const logs = [...this.logBuffer];
    this.logBuffer = [];

    await this.sendToBackend(logs);
  }

  debug(message: string, context: LogContext = {}) {
    if (!this.shouldLog('debug')) return;

    const entry = this.createLogEntry('debug', message, context);

    if (this.isProduction) {
      this.logBuffer.push(entry);
    } else {
      console.debug(`[DEBUG] ${message}`, context);
    }
  }

  info(message: string, context: LogContext = {}) {
    if (!this.shouldLog('info')) return;

    const entry = this.createLogEntry('info', message, context);

    if (this.isProduction) {
      this.logBuffer.push(entry);
    } else {
      console.info(`[INFO] ${message}`, context);
    }
  }

  warn(message: string, context: LogContext = {}) {
    if (!this.shouldLog('warn')) return;

    const entry = this.createLogEntry('warn', message, context);

    if (this.isProduction) {
      this.logBuffer.push(entry);
    } else {
      console.warn(`[WARN] ${message}`, context);
    }
  }

  error(message: string, context: LogContext = {}, error?: Error) {
    if (!this.shouldLog('error')) return;

    const entry = this.createLogEntry('error', message, context, error);

    if (this.isProduction) {
      this.logBuffer.push(entry);
      // Immediately send errors
      this.flushLogs();
    } else {
      console.error(`[ERROR] ${message}`, context, error);
    }
  }

  // Business event logging
  logBookingEvent(event: string, data: any) {
    this.info(`Booking event: ${event}`, {
      component: 'booking',
      action: event,
      ...data
    });
  }

  logUserAction(action: string, data: any) {
    this.info(`User action: ${action}`, {
      component: 'user-interaction',
      action,
      ...data
    });
  }

  logPerformanceMetric(metric: string, value: number, context: LogContext = {}) {
    this.info(`Performance: ${metric} = ${value}ms`, {
      component: 'performance',
      metric,
      value,
      ...context
    });
  }

  logAPIRequest(method: string, url: string, status: number, duration: number, context: LogContext = {}) {
    const level = status >= 400 ? 'warn' : 'info';

    this[level](`API ${method} ${url} - ${status} (${duration}ms)`, {
      component: 'api',
      method,
      url,
      status,
      duration,
      ...context
    });
  }

  logErrorBoundary(error: Error, errorInfo: any) {
    this.error('React Error Boundary caught an error', {
      component: 'error-boundary',
      errorInfo: errorInfo.componentStack
    }, error);
  }
}

export const logger = Logger.getInstance();

// Export convenience functions
export const log = {
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  error: (message: string, context?: LogContext, error?: Error) => logger.error(message, context, error),
  booking: (event: string, data: any) => logger.logBookingEvent(event, data),
  user: (action: string, data: any) => logger.logUserAction(action, data),
  performance: (metric: string, value: number, context?: LogContext) => logger.logPerformanceMetric(metric, value, context),
  api: (method: string, url: string, status: number, duration: number, context?: LogContext) => logger.logAPIRequest(method, url, status, duration, context),
  errorBoundary: (error: Error, errorInfo: any) => logger.logErrorBoundary(error, errorInfo)
};

export default logger;