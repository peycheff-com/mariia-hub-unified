import { EventEmitter } from 'events';

export enum ErrorCategory {
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  DEPENDENCY = 'dependency',
  RATE_LIMIT = 'rate_limit',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorUrgency {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  IMMEDIATE = 'immediate'
}

export interface ErrorPattern {
  id: string;
  name: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  urgency: ErrorUrgency;
  patterns: string[];
  conditions?: {
    statusCode?: number[];
    source?: string[];
    context?: Record<string, any>;
  };
  retryable: boolean;
  recoveryAction?: string;
  documentation?: string;
}

export interface ErrorClassification {
  error: Error;
  category: ErrorCategory;
  severity: ErrorSeverity;
  urgency: ErrorUrgency;
  pattern?: ErrorPattern;
  confidence: number; // 0-1
  context: Record<string, any>;
  recommendations: string[];
  relatedErrors: string[];
  frequency: number;
  firstSeen: string;
  lastSeen: string;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByUrgency: Record<ErrorUrgency, number>;
  topErrors: Array<{
    message: string;
    count: number;
    category: ErrorCategory;
  }>;
  errorRate: number; // errors per minute
  averageResolutionTime: number; // milliseconds
  recurringErrors: Array<{
    message: string;
    occurrences: number;
    timeSpan: number; // milliseconds
  }>;
}

export interface ErrorAnalyzerConfig {
  enableLearning: boolean;
  retainHistoryFor: number; // hours
  similarErrorThreshold: number; // 0-1
  maxPatterns: number;
  enableAutoClassification: boolean;
  enableRecommendations: boolean;
}

export class ErrorAnalyzer extends EventEmitter {
  private patterns = new Map<string, ErrorPattern>();
  private errorHistory: Array<{
    error: Error;
    classification: ErrorClassification;
    timestamp: number;
  }> = [];
  private errorCounts = new Map<string, number>();
  private errorTimings = new Map<string, number[]>();
  private defaultPatterns: ErrorPattern[] = [
    // Network errors
    {
      id: 'network_failure',
      name: 'Network Failure',
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.HIGH,
      urgency: ErrorUrgency.HIGH,
      patterns: [
        'network',
        'fetch',
        'connection',
        'ECONNREFUSED',
        'ENOTFOUND',
        'ECONNRESET',
        'socket',
        'dns'
      ],
      retryable: true,
      recoveryAction: 'Check network connectivity and retry',
      documentation: 'Network connectivity issues'
    },

    // Timeout errors
    {
      id: 'timeout_error',
      name: 'Request Timeout',
      category: ErrorCategory.TIMEOUT,
      severity: ErrorSeverity.MEDIUM,
      urgency: ErrorUrgency.MEDIUM,
      patterns: [
        'timeout',
        'ETIMEDOUT',
        'aborted',
        'time out'
      ],
      retryable: true,
      recoveryAction: 'Increase timeout value or retry with backoff',
      documentation: 'Request timeout errors'
    },

    // Authentication errors
    {
      id: 'auth_error',
      name: 'Authentication Error',
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      urgency: ErrorUrgency.HIGH,
      patterns: [
        'unauthorized',
        '401',
        'authentication',
        'invalid token',
        'expired token',
        'not authenticated'
      ],
      conditions: { statusCode: [401] },
      retryable: false,
      recoveryAction: 'Refresh authentication token or re-authenticate',
      documentation: 'Authentication failure errors'
    },

    // Authorization errors
    {
      id: 'permission_error',
      name: 'Permission Denied',
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.MEDIUM,
      urgency: ErrorUrgency.MEDIUM,
      patterns: [
        'forbidden',
        '403',
        'permission denied',
        'access denied',
        'insufficient privileges'
      ],
      conditions: { statusCode: [403] },
      retryable: false,
      recoveryAction: 'Check user permissions and access rights',
      documentation: 'Authorization and permission errors'
    },

    // Validation errors
    {
      id: 'validation_error',
      name: 'Validation Error',
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      urgency: ErrorUrgency.LOW,
      patterns: [
        'validation',
        'invalid',
        'malformed',
        'bad request',
        '400',
        'required',
        'constraint'
      ],
      conditions: { statusCode: [400] },
      retryable: false,
      recoveryAction: 'Fix input data and retry request',
      documentation: 'Input validation errors'
    },

    // Rate limiting
    {
      id: 'rate_limit',
      name: 'Rate Limited',
      category: ErrorCategory.RATE_LIMIT,
      severity: ErrorSeverity.MEDIUM,
      urgency: ErrorUrgency.MEDIUM,
      patterns: [
        'rate limit',
        '429',
        'too many requests',
        'quota exceeded',
        'throttled'
      ],
      conditions: { statusCode: [429] },
      retryable: true,
      recoveryAction: 'Wait and retry with exponential backoff',
      documentation: 'Rate limiting errors'
    },

    // Server errors
    {
      id: 'server_error',
      name: 'Server Error',
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.HIGH,
      urgency: ErrorUrgency.HIGH,
      patterns: [
        '500',
        '502',
        '503',
        '504',
        'internal server error',
        'service unavailable',
        'bad gateway',
        'gateway timeout'
      ],
      conditions: { statusCode: [500, 502, 503, 504] },
      retryable: true,
      recoveryAction: 'Contact support or retry later',
      documentation: 'Server-side errors'
    },

    // Database errors
    {
      id: 'database_error',
      name: 'Database Error',
      category: ErrorCategory.DEPENDENCY,
      severity: ErrorSeverity.CRITICAL,
      urgency: ErrorUrgency.IMMEDIATE,
      patterns: [
        'database',
        'connection',
        'sql',
        'query',
        'duplicate key',
        'foreign key',
        'constraint violation'
      ],
      retryable: false,
      recoveryAction: 'Check database connection and query',
      documentation: 'Database dependency errors'
    }
  ];

  constructor(private config: ErrorAnalyzerConfig) {
    super();

    // Load default patterns
    this.defaultPatterns.forEach(pattern => {
      this.patterns.set(pattern.id, pattern);
    });
  }

  analyze(error: Error, context: Record<string, any> = {}): ErrorClassification {
    const now = new Date().toISOString();
    const errorKey = this.generateErrorKey(error);

    // Update error counts and timings
    const count = (this.errorCounts.get(errorKey) || 0) + 1;
    this.errorCounts.set(errorKey, count);

    const timings = this.errorTimings.get(errorKey) || [];
    timings.push(Date.now());
    this.errorTimings.set(errorKey, timings);

    // Keep only recent timings
    if (timings.length > 100) {
      timings.splice(0, timings.length - 100);
    }

    // Classify error
    const classification = this.classifyError(error, context, now);
    classification.frequency = count;
    classification.firstSeen = timings[0] ? new Date(timings[0]).toISOString() : now;
    classification.lastSeen = now;

    // Store in history
    this.errorHistory.push({
      error,
      classification,
      timestamp: Date.now()
    });

    // Maintain history size
    const maxHistoryAge = this.config.retainHistoryFor * 60 * 60 * 1000;
    const cutoff = Date.now() - maxHistoryAge;
    this.errorHistory = this.errorHistory.filter(h => h.timestamp > cutoff);

    // Learn from new errors if enabled
    if (this.config.enableLearning) {
      this.learnFromError(error, classification);
    }

    this.emit('errorAnalyzed', error, classification);

    return classification;
  }

  private classifyError(
    error: Error,
    context: Record<string, any>,
    timestamp: string
  ): ErrorClassification {
    let bestMatch: ErrorPattern | undefined;
    let bestScore = 0;
    let confidence = 0;

    // Try to match against patterns
    for (const pattern of this.patterns.values()) {
      const score = this.calculateMatchScore(error, pattern, context);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = pattern;
      }
    }

    // Determine confidence based on score
    confidence = Math.min(bestScore, 1);

    // If no good match, classify as unknown
    if (!bestMatch || bestScore < 0.3) {
      return {
        error,
        category: ErrorCategory.UNKNOWN,
        severity: ErrorSeverity.MEDIUM,
        urgency: ErrorUrgency.MEDIUM,
        confidence: 0,
        context,
        recommendations: ['Investigate error details and create appropriate pattern'],
        relatedErrors: this.findRelatedErrors(error),
        frequency: 0,
        firstSeen: timestamp,
        lastSeen: timestamp
      };
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(bestMatch, error, context);

    return {
      error,
      category: bestMatch.category,
      severity: bestMatch.severity,
      urgency: bestMatch.urgency,
      pattern: bestMatch,
      confidence,
      context,
      recommendations,
      relatedErrors: this.findRelatedErrors(error),
      frequency: 0,
      firstSeen: timestamp,
      lastSeen: timestamp
    };
  }

  private calculateMatchScore(
    error: Error,
    pattern: ErrorPattern,
    context: Record<string, any>
  ): number {
    let score = 0;
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // Check pattern matches in error message and name
    for (const patternStr of pattern.patterns) {
      if (errorMessage.includes(patternStr.toLowerCase()) ||
          errorName.includes(patternStr.toLowerCase())) {
        score += 1;
      }
    }

    // Normalize score by number of patterns
    score = score / pattern.patterns.length;

    // Bonus for status code match
    if (pattern.conditions?.statusCode) {
      const statusCode = (error as any).status || (error as any).statusCode;
      if (statusCode && pattern.conditions.statusCode.includes(statusCode)) {
        score += 0.5;
      }
    }

    // Bonus for source match
    if (pattern.conditions?.source && error.stack) {
      for (const source of pattern.conditions.source) {
        if (error.stack.toLowerCase().includes(source.toLowerCase())) {
          score += 0.3;
          break;
        }
      }
    }

    // Bonus for context conditions
    if (pattern.conditions?.context) {
      for (const [key, value] of Object.entries(pattern.conditions.context)) {
        if (context[key] === value) {
          score += 0.2;
        }
      }
    }

    return score;
  }

  private generateRecommendations(
    pattern: ErrorPattern,
    error: Error,
    context: Record<string, any>
  ): string[] {
    const recommendations: string[] = [];

    // Add pattern-specific recovery action
    if (pattern.recoveryAction) {
      recommendations.push(pattern.recoveryAction);
    }

    // Add general recommendations based on category
    switch (pattern.category) {
      case ErrorCategory.NETWORK:
        recommendations.push('Check internet connection');
        recommendations.push('Verify service availability');
        if (pattern.retryable) {
          recommendations.push('Implement retry with exponential backoff');
        }
        break;

      case ErrorCategory.TIMEOUT:
        recommendations.push('Consider increasing timeout value');
        recommendations.push('Implement request timeout handling');
        if (pattern.retryable) {
          recommendations.push('Retry with longer timeout');
        }
        break;

      case ErrorCategory.AUTHENTICATION:
        recommendations.push('Refresh access token');
        recommendations.push('Verify authentication credentials');
        break;

      case ErrorCategory.RATE_LIMIT:
        recommendations.push('Implement rate limiting in client');
        recommendations.push('Use exponential backoff for retries');
        recommendations.push('Consider queuing requests');
        break;

      case ErrorCategory.DEPENDENCY:
        recommendations.push('Check dependent service health');
        recommendations.push('Implement circuit breaker pattern');
        recommendations.push('Add fallback mechanisms');
        break;

      case ErrorCategory.VALIDATION:
        recommendations.push('Validate input before sending');
        recommendations.push('Check API documentation for required fields');
        break;

      case ErrorCategory.SYSTEM:
        recommendations.push('Monitor system resources');
        recommendations.push('Implement graceful degradation');
        if (pattern.retryable) {
          recommendations.push('Retry with backoff');
        }
        break;
    }

    // Add context-specific recommendations
    if (context.requestId) {
      recommendations.push(`Include request ID ${context.requestId} in support requests`);
    }

    if (context.userId) {
      recommendations.push(`Log user ${context.userId} for support investigation`);
    }

    // Add documentation link
    if (pattern.documentation) {
      recommendations.push(`See documentation: ${pattern.documentation}`);
    }

    return recommendations;
  }

  private findRelatedErrors(error: Error): string[] {
    const related: string[] = [];
    const errorMessage = error.message.toLowerCase();

    // Find similar recent errors
    for (const historyItem of this.errorHistory.slice(-50)) {
      const similarity = this.calculateSimilarity(
        errorMessage,
        historyItem.error.message.toLowerCase()
      );

      if (similarity > this.config.similarErrorThreshold) {
        related.push(historyItem.error.message);
      }
    }

    // Return unique related errors
    return Array.from(new Set(related));
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple similarity calculation based on common words
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]).size;

    return commonWords.length / totalWords;
  }

  private learnFromError(error: Error, classification: ErrorClassification): void {
    // Auto-generate new patterns if confidence is low
    if (classification.confidence < 0.5 && this.config.enableAutoClassification) {
      // This would implement machine learning to create new patterns
      // For now, we'll just log potential new patterns
      console.log('Potential new error pattern:', {
        message: error.message,
        name: error.name,
        category: classification.category
      });
    }
  }

  private generateErrorKey(error: Error): string {
    // Create a key for grouping similar errors
    const base = `${error.name}:${error.message.substring(0, 50)}`;
    return require('crypto')
      .createHash('md5')
      .update(base)
      .digest('hex')
      .substring(0, 8);
  }

  // Public methods
  addPattern(pattern: ErrorPattern): void {
    this.patterns.set(pattern.id, pattern);
    this.emit('patternAdded', pattern);
  }

  removePattern(id: string): boolean {
    const removed = this.patterns.delete(id);
    if (removed) {
      this.emit('patternRemoved', id);
    }
    return removed;
  }

  getPatterns(): ErrorPattern[] {
    return Array.from(this.patterns.values());
  }

  getPattern(id: string): ErrorPattern | undefined {
    return this.patterns.get(id);
  }

  updatePattern(id: string, updates: Partial<ErrorPattern>): boolean {
    const pattern = this.patterns.get(id);
    if (pattern) {
      Object.assign(pattern, updates);
      this.emit('patternUpdated', id, updates);
      return true;
    }
    return false;
  }

  getMetrics(): ErrorMetrics {
    const totalErrors = this.errorHistory.length;
    const errorsByCategory: Record<ErrorCategory, number> = {} as any;
    const errorsBySeverity: Record<ErrorSeverity, number> = {} as any;
    const errorsByUrgency: Record<ErrorUrgency, number> = {} as any;

    // Initialize counters
    Object.values(ErrorCategory).forEach(cat => {
      errorsByCategory[cat] = 0;
    });
    Object.values(ErrorSeverity).forEach(sev => {
      errorsBySeverity[sev] = 0;
    });
    Object.values(ErrorUrgency).forEach(urg => {
      errorsByUrgency[urg] = 0;
    });

    // Count errors by classification
    this.errorHistory.forEach(({ classification }) => {
      errorsByCategory[classification.category]++;
      errorsBySeverity[classification.severity]++;
      errorsByUrgency[classification.urgency]++;
    });

    // Find top errors
    const errorCounts = new Map<string, number>();
    this.errorHistory.forEach(({ error }) => {
      const count = (errorCounts.get(error.message) || 0) + 1;
      errorCounts.set(error.message, count);
    });

    const topErrors = Array.from(errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([message, count]) => ({
        message,
        count,
        category: this.analyze(new Error(message)).category
      }));

    // Calculate error rate (errors per minute in last hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentErrors = this.errorHistory.filter(h => h.timestamp > oneHourAgo);
    const errorRate = recentErrors.length / 60;

    // Find recurring errors
    const recurringErrors: Array<{
      message: string;
      occurrences: number;
      timeSpan: number;
    }> = [];

    for (const [key, timings] of this.errorTimings) {
      if (timings.length > 3) {
        const timeSpan = timings[timings.length - 1] - timings[0];
        recurringErrors.push({
          message: key,
          occurrences: timings.length,
          timeSpan
        });
      }
    }

    return {
      totalErrors,
      errorsByCategory,
      errorsBySeverity,
      errorsByUrgency,
      topErrors,
      errorRate,
      averageResolutionTime: 0, // Would need tracking of resolution times
      recurringErrors
    };
  }

  getRecentErrors(count: number = 10): Array<{
    error: Error;
    classification: ErrorClassification;
    timestamp: number;
  }> {
    return this.errorHistory
      .slice(-count)
      .reverse();
  }

  clearHistory(): void {
    this.errorHistory = [];
    this.errorCounts.clear();
    this.errorTimings.clear();
    this.emit('historyCleared');
  }
}