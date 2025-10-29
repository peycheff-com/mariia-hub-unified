export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  error?: Error;
  stack?: string;
  userAgent?: string;
  url?: string;
  [key: string]: any;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  batchSize: number;
  flushInterval: number;
  maxQueueSize: number;
  includeStackTrace: boolean;
  sanitizeData: boolean;
}

class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private queue: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.config = this.getDefaultConfig();
    this.setupFlushTimer();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private getDefaultConfig(): LoggerConfig {
    const isProduction = import.meta.env.PROD;
    const isDevelopment = import.meta.env.DEV;

    return {
      level: isProduction ? LogLevel.INFO : LogLevel.DEBUG,
      enableConsole: !isProduction,
      enableRemote: isProduction,
      remoteEndpoint: '/api/logs',
      batchSize: 10,
      flushInterval: 5000, // 5 seconds
      maxQueueSize: 100,
      includeStackTrace: isDevelopment,
      sanitizeData: true,
    };
  }

  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart flush timer if interval changed
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.setupFlushTimer();
  }

  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  private setupFlushTimer(): void {
    if (this.config.enableRemote) {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.config.sanitizeData ? this.sanitize(context) : context,
      sessionId: this.sessionId,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.config.includeStackTrace ? error.stack : undefined,
      };
      entry.stack = error.stack;
    }

    return entry;
  }

  private sanitize(data?: Record<string, any>): Record<string, any> | undefined {
    if (!data) return undefined;

    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'key',
      'auth',
      'session',
      'cookie',
      'authorization',
      'credit',
      'card',
      'ssn',
      'social',
    ];

    const sanitized = { ...data };

    const sanitizeValue = (obj: any, path: string = ''): any => {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map((item, index) => sanitizeValue(item, `${path}[${index}]`));
      }

      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key;
        const lowerKey = key.toLowerCase();

        // Check if key contains sensitive information
        const isSensitive = sensitiveKeys.some(sensitive => lowerKey.includes(sensitive));

        if (isSensitive && value) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          result[key] = sanitizeValue(value, fullPath);
        } else {
          result[key] = value;
        }
      }

      return result;
    };

    return sanitizeValue(sanitized);
  }

  private log(entry: LogEntry): void {
    // Add to queue
    this.queue.push(entry);

    // Prevent queue from growing too large
    if (this.queue.length > this.config.maxQueueSize) {
      this.queue.shift();
    }

    // Console logging
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Auto-flush if batch size reached or error level
    if (this.queue.length >= this.config.batchSize || entry.level >= LogLevel.ERROR) {
      this.flush();
    }
  }

  private logToConsole(entry: LogEntry): void {
    const { level, message, context, timestamp } = entry;
    const levelName = LogLevel[level];
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';

    const logMessage = `[${timestamp}] ${levelName}: ${message}${contextStr}`;

    switch (level) {
      case LogLevel.TRACE:
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(logMessage);
        if (entry.error && this.config.includeStackTrace) {
          console.error(entry.error);
        }
        break;
    }
  }

  private async flush(): Promise<void> {
    if (!this.config.enableRemote || this.queue.length === 0) {
      return;
    }

    const entries = [...this.queue];
    this.queue = [];

    try {
      await this.sendLogs(entries);
    } catch (error) {
      // Re-queue logs if send failed
      this.queue.unshift(...entries.slice(0, this.config.batchSize));

      // Fallback to console
      if (this.config.enableConsole) {
        console.error('Failed to send logs to remote endpoint:', error);
      }
    }
  }

  private async sendLogs(entries: LogEntry[]): Promise<void> {
    if (!this.config.remoteEndpoint) return;

    const response = await fetch(this.config.remoteEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        logs: entries,
        metadata: {
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  // Public logging methods
  trace(message: string, context?: Record<string, any>): void {
    if (this.config.level <= LogLevel.TRACE) {
      this.log(this.createLogEntry(LogLevel.TRACE, message, context));
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    if (this.config.level <= LogLevel.DEBUG) {
      this.log(this.createLogEntry(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (this.config.level <= LogLevel.INFO) {
      this.log(this.createLogEntry(LogLevel.INFO, message, context));
    }
  }

  warn(message: string, context?: Record<string, any>): void {
    if (this.config.level <= LogLevel.WARN) {
      this.log(this.createLogEntry(LogLevel.WARN, message, context));
    }
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    if (this.config.level <= LogLevel.ERROR) {
      this.log(this.createLogEntry(LogLevel.ERROR, message, context, error));
    }
  }

  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    if (this.config.level <= LogLevel.FATAL) {
      this.log(this.createLogEntry(LogLevel.FATAL, message, context, error));
    }
  }

  // Component-specific logging
  component(componentName: string, message: string, level: LogLevel = LogLevel.INFO, context?: Record<string, any>): void {
    const entry = this.createLogEntry(level, message, { ...context, component: componentName });
    this.log(entry);
  }

  // Action logging
  action(actionName: string, userId?: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(
      LogLevel.INFO,
      `Action: ${actionName}`,
      { ...context, action: actionName, userId }
    );
    this.log(entry);
  }

  // Performance logging
  performance(operation: string, duration: number, context?: Record<string, any>): void {
    const entry = this.createLogEntry(
      LogLevel.DEBUG,
      `Performance: ${operation} took ${duration}ms`,
      { ...context, operation, duration, type: 'performance' }
    );
    this.log(entry);
  }

  // Business event logging
  business(event: string, data?: Record<string, any>): void {
    const entry = this.createLogEntry(
      LogLevel.INFO,
      `Business Event: ${event}`,
      { ...data, event, type: 'business' }
    );
    this.log(entry);
  }

  // Error boundary logging
  errorBoundary(error: Error, errorInfo: React.ErrorInfo, componentStack?: string): void {
    const entry = this.createLogEntry(
      LogLevel.ERROR,
      'React Error Boundary caught an error',
      {
        errorInfo,
        componentStack,
        type: 'error-boundary',
      },
      error
    );
    this.log(entry);
  }

  // Set user context
  setUserId(userId: string): void {
    // This could be stored and added to all subsequent log entries
    // For now, we'll just log it
    this.info(`User context set: ${userId}`, { userId, type: 'user-context' });
  }

  // Clear the log queue
  clear(): void {
    this.queue = [];
  }

  // Get current configuration
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  // Force flush all logs
  async flushNow(): Promise<void> {
    await this.flush();
  }

  // Cleanup
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flushNow();
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenience methods for backward compatibility
export const trace = (message: string, context?: Record<string, any>) => logger.trace(message, context);
export const debug = (message: string, context?: Record<string, any>) => logger.debug(message, context);
export const info = (message: string, context?: Record<string, any>) => logger.info(message, context);
export const warn = (message: string, context?: Record<string, any>) => logger.warn(message, context);
export const error = (message: string, err?: Error, context?: Record<string, any>) => logger.error(message, err, context);
export const fatal = (message: string, err?: Error, context?: Record<string, any>) => logger.fatal(message, err, context);

// Performance measurement utility
export const measurePerformance = async <T>(
  operation: string,
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> => {
  const start = performance.now();

  try {
    logger.trace(`Starting operation: ${operation}`, { ...context, operation });
    const result = await fn();
    const duration = performance.now() - start;

    logger.performance(operation, duration, { ...context, success: true });
    return result;
  } catch (err) {
    const duration = performance.now() - start;
    const error = err instanceof Error ? err : new Error(String(err));

    logger.performance(operation, duration, { ...context, success: false, error: error.message });
    logger.error(`Operation failed: ${operation}`, error, { ...context, operation });
    throw err;
  }
};

// Higher-order component for logging
export const withLogging = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) => {
  const LoggedComponent = (props: P) => {
    React.useEffect(() => {
      logger.component(componentName, 'Component mounted', { props });
      return () => {
        logger.component(componentName, 'Component unmounted');
      };
    }, [componentName]);

    return <WrappedComponent {...props} />;
  };

  LoggedComponent.displayName = `withLogging(${componentName})`;
  return LoggedComponent;
};