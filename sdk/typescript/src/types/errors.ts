/**
 * SDK error types and classes
 */

/**
 * Base SDK error class
 */
export abstract class MariiaHubSDKError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly metadata?: Record<string, any>;
  public readonly timestamp: string;
  public readonly requestId?: string;
  public readonly retryable: boolean;

  constructor(
    message: string,
    code: string,
    statusCode?: number,
    metadata?: Record<string, any>,
    requestId?: string,
    retryable: boolean = false
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.metadata = metadata;
    this.timestamp = new Date().toISOString();
    this.requestId = requestId;
    this.retryable = retryable;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      metadata: this.metadata,
      timestamp: this.timestamp,
      requestId: this.requestId,
      retryable: this.retryable,
      stack: this.stack
    };
  }

  /**
   * Check if error matches specific code
   */
  isCode(code: string): boolean {
    return this.code === code;
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return this.retryable;
  }

  /**
   * Get error type category
   */
  getCategory(): ErrorCategory {
    if (this instanceof AuthenticationError) return 'authentication';
    if (this instanceof NetworkError) return 'network';
    if (this instanceof ValidationError) return 'validation';
    if (this instanceof RateLimitError) return 'rate_limit';
    if (this instanceof PaymentError) return 'payment';
    if (this instanceof BookingError) return 'booking';
    if (this instanceof ConfigurationError) return 'configuration';
    if (this instanceof BusinessLogicError) return 'business_logic';
    if (this instanceof ExternalServiceError) return 'external_service';
    return 'unknown';
  }
}

/**
 * Error categories
 */
export type ErrorCategory =
  | 'authentication'
  | 'network'
  | 'validation'
  | 'rate_limit'
  | 'payment'
  | 'booking'
  | 'configuration'
  | 'business_logic'
  | 'external_service'
  | 'unknown';

/**
 * Authentication errors
 */
export class AuthenticationError extends MariiaHubSDKError {
  constructor(
    message: string,
    code: AuthenticationErrorCode,
    statusCode = 401,
    metadata?: Record<string, any>,
    requestId?: string
  ) {
    super(message, code, statusCode, metadata, requestId, false);
  }
}

/**
 * Authentication error codes
 */
export type AuthenticationErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'TOKEN_REVOKED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_SUSPENDED'
  | 'EMAIL_NOT_VERIFIED'
  | 'PHONE_NOT_VERIFIED'
  | 'TWO_FACTOR_REQUIRED'
  | 'TWO_FACTOR_INVALID'
  | 'SESSION_EXPIRED'
  | 'PERMISSION_DENIED'
  | 'SCOPE_INSUFFICIENT'
  | 'API_KEY_INVALID'
  | 'API_KEY_EXPIRED'
  | 'OAUTH_ERROR'
  | 'CSRF_TOKEN_INVALID';

/**
 * Network errors
 */
export class NetworkError extends MariiaHubSDKError {
  constructor(
    message: string,
    code: NetworkErrorCode,
    statusCode?: number,
    metadata?: Record<string, any>,
    requestId?: string
  ) {
    const retryable = !['NETWORK_OFFLINE', 'DNS_RESOLUTION_FAILED'].includes(code);
    super(message, code, statusCode, metadata, requestId, retryable);
  }
}

/**
 * Network error codes
 */
export type NetworkErrorCode =
  | 'NETWORK_ERROR'
  | 'NETWORK_OFFLINE'
  | 'TIMEOUT'
  | 'CONNECTION_REFUSED'
  | 'DNS_RESOLUTION_FAILED'
  | 'SSL_ERROR'
  | 'PROXY_ERROR'
  | 'INVALID_URL'
  | 'MAX_REDIRECTS_EXCEEDED'
  | 'REQUEST_TOO_LARGE'
  | 'RESPONSE_TOO_LARGE'
  | 'INVALID_RESPONSE_FORMAT'
  | 'PROTOCOL_ERROR'
  | 'WEBSOCKET_CONNECTION_FAILED'
  | 'WEBSOCKET_DISCONNECTED'
  | 'WEBSOCKET_ERROR';

/**
 * Validation errors
 */
export class ValidationError extends MariiaHubSDKError {
  public readonly field?: string;
  public readonly value?: any;
  public readonly constraint?: string;

  constructor(
    message: string,
    code: ValidationErrorCode,
    field?: string,
    value?: any,
    constraint?: string,
    metadata?: Record<string, any>,
    requestId?: string
  ) {
    super(message, code, 400, { ...metadata, field, value, constraint }, requestId, false);
    this.field = field;
    this.value = value;
    this.constraint = constraint;
  }
}

/**
 * Validation error codes
 */
export type ValidationErrorCode =
  | 'REQUIRED_FIELD_MISSING'
  | 'INVALID_FORMAT'
  | 'INVALID_EMAIL'
  | 'INVALID_PHONE'
  | 'INVALID_POSTAL_CODE'
  | 'INVALID_NIP'
  | 'INVALID_PESEL'
  | 'INVALID_REGON'
  | 'INVALID_KRS'
  | 'INVALID_DATE'
  | 'INVALID_TIME'
  | 'INVALID_CURRENCY'
  | 'INVALID_LANGUAGE'
  | 'INVALID_NUMBER'
  | 'INVALID_BOOLEAN'
  | 'MIN_LENGTH_VIOLATED'
  | 'MAX_LENGTH_VIOLATED'
  | 'MIN_VALUE_VIOLATED'
  | 'MAX_VALUE_VIOLATED'
  | 'PATTERN_MISMATCH'
  | 'ENUM_VIOLATION'
  | 'INVALID_UUID'
  | 'INVALID_JSON'
  | 'DUPLICATE_VALUE'
  | 'INVALID_BUSINESS_RULE'
  | 'POLISH_VALIDATION_FAILED';

/**
 * Rate limit errors
 */
export class RateLimitError extends MariiaHubSDKError {
  public readonly retryAfter?: number;
  public readonly limit?: number;
  public readonly remaining?: number;
  public readonly reset?: number;

  constructor(
    message: string,
    code: RateLimitErrorCode,
    statusCode = 429,
    metadata?: {
      retryAfter?: number;
      limit?: number;
      remaining?: number;
      reset?: number;
    },
    requestId?: string
  ) {
    const retryable = true;
    super(message, code, statusCode, metadata, requestId, retryable);
    this.retryAfter = metadata?.retryAfter;
    this.limit = metadata?.limit;
    this.remaining = metadata?.remaining;
    this.reset = metadata?.reset;
  }
}

/**
 * Rate limit error codes
 */
export type RateLimitErrorCode =
  | 'RATE_LIMIT_EXCEEDED'
  | 'TOO_MANY_REQUESTS'
  | 'QUOTA_EXCEEDED'
  | 'BANDWIDTH_EXCEEDED'
  | 'CONNECTION_LIMIT_EXCEEDED'
  | 'API_CALL_LIMIT_EXCEEDED'
  | 'UPLOAD_LIMIT_EXCEEDED'
  | 'DOWNLOAD_LIMIT_EXCEEDED'
  | 'CONCURRENT_REQUEST_LIMIT_EXCEEDED';

/**
 * Payment errors
 */
export class PaymentError extends MariiaHubSDKError {
  public readonly paymentId?: string;
  public readonly paymentIntentId?: string;
  public readonly gateway?: string;
  public readonly declineCode?: string;

  constructor(
    message: string,
    code: PaymentErrorCode,
    statusCode = 400,
    metadata?: {
      paymentId?: string;
      paymentIntentId?: string;
      gateway?: string;
      declineCode?: string;
    },
    requestId?: string
  ) {
    const retryable = [
      'PAYMENT_GATEWAY_ERROR',
      'PAYMENT_TIMEOUT',
      'INSUFFICIENT_FUNDS',
      'CARD_DECLINED_TEMPORARY'
    ].includes(code);
    super(message, code, statusCode, metadata, requestId, retryable);
    this.paymentId = metadata?.paymentId;
    this.paymentIntentId = metadata?.paymentIntentId;
    this.gateway = metadata?.gateway;
    this.declineCode = metadata?.declineCode;
  }
}

/**
 * Payment error codes
 */
export type PaymentErrorCode =
  | 'PAYMENT_FAILED'
  | 'PAYMENT_CANCELLED'
  | 'PAYMENT_DECLINED'
  | 'INSUFFICIENT_FUNDS'
  | 'CARD_DECLINED'
  | 'CARD_DECLINED_TEMPORARY'
  | 'INVALID_CARD'
  | 'EXPIRED_CARD'
  | 'INCORRECT_CVC'
  | 'PROCESSING_ERROR'
  | 'FRAUD_DETECTED'
  | 'PAYMENT_GATEWAY_ERROR'
  | 'PAYMENT_TIMEOUT'
  | 'PAYMENT_METHOD_INVALID'
  | 'CURRENCY_NOT_SUPPORTED'
  | 'AMOUNT_TOO_SMALL'
  | 'AMOUNT_TOO_LARGE'
  | 'REFUND_FAILED'
  | 'REFUND_EXPIRED'
  | 'REFUND_PROCESSED'
  | 'POLISH_PAYMENT_FAILED'
  | 'BLIK_ERROR'
  | 'PRZELEWY24_ERROR'
  | 'INSTALLMENT_DECLINED';

/**
 * Booking errors
 */
export class BookingError extends MariiaHubSDKError {
  public readonly bookingId?: string;
  public readonly serviceId?: string;
  public readonly timeSlot?: string;

  constructor(
    message: string,
    code: BookingErrorCode,
    statusCode = 400,
    metadata?: {
      bookingId?: string;
      serviceId?: string;
      timeSlot?: string;
    },
    requestId?: string
  ) {
    const retryable = [
      'SLOT_TEMPORARILY_UNAVAILABLE',
      'CONCURRENT_BOOKING_ATTEMPT',
      'TEMPORARY_SYSTEM_ERROR'
    ].includes(code);
    super(message, code, statusCode, metadata, requestId, retryable);
    this.bookingId = metadata?.bookingId;
    this.serviceId = metadata?.serviceId;
    this.timeSlot = metadata?.timeSlot;
  }
}

/**
 * Booking error codes
 */
export type BookingErrorCode =
  | 'SLOT_UNAVAILABLE'
  | 'SLOT_ALREADY_BOOKED'
  | 'SLOT_TEMPORARILY_UNAVAILABLE'
  | 'SERVICE_UNAVAILABLE'
  | 'SERVICE_NOT_FOUND'
  | 'CAPACITY_EXCEEDED'
  | 'GROUP_SIZE_EXCEEDED'
  | 'MIN_GROUP_SIZE_NOT_MET'
  | 'BOOKING_WINDOW_CLOSED'
  | 'ADVANCE_BOOKING_REQUIRED'
  | 'PAST_DATE_NOT_ALLOWED'
  | 'INVALID_TIME_SLOT'
  | 'CONCURRENT_BOOKING_ATTEMPT'
  | 'BOOKING_NOT_FOUND'
  | 'BOOKING_ALREADY_CONFIRMED'
  | 'BOOKING_ALREADY_CANCELLED'
  | 'BOOKING_ALREADY_COMPLETED'
  | 'CANCELLATION_PERIOD_EXPIRED'
  | 'RESCHEDULE_PERIOD_EXPIRED'
  | 'CANCELLATION_FEE_APPLIES'
  | 'NO_SHOW_FEE_APPLIES'
  | 'WAITLIST_FULL'
  | 'WAITLIST_ENTRY_EXPIRED'
  | 'TEMPORARY_SYSTEM_ERROR';

/**
 * Configuration errors
 */
export class ConfigurationError extends MariiaHubSDKError {
  public readonly configKey?: string;
  public readonly configValue?: any;

  constructor(
    message: string,
    code: ConfigurationErrorCode,
    configKey?: string,
    configValue?: any,
    metadata?: Record<string, any>,
    requestId?: string
  ) {
    super(message, code, 500, { ...metadata, configKey, configValue }, requestId, false);
    this.configKey = configKey;
    this.configValue = configValue;
  }
}

/**
 * Configuration error codes
 */
export type ConfigurationErrorCode =
  | 'INVALID_CONFIGURATION'
  | 'MISSING_CONFIGURATION'
  | 'INVALID_API_KEY'
  | 'INVALID_BASE_URL'
  | 'INVALID_TIMEOUT'
  | 'INVALID_RETRY_CONFIG'
  | 'INVALID_AUTH_CONFIG'
  | 'INVALID_CACHE_CONFIG'
  | 'INVALID_LOG_LEVEL'
  | 'INVALID_FEATURE_FLAG'
  | 'POLISH_CONFIG_INVALID'
  | 'REGION_CONFIG_INVALID';

/**
 * Business logic errors
 */
export class BusinessLogicError extends MariiaHubSDKError {
  public readonly businessRule?: string;
  public readonly entity?: string;
  public readonly entityId?: string;

  constructor(
    message: string,
    code: BusinessLogicErrorCode,
    statusCode = 422,
    metadata?: {
      businessRule?: string;
      entity?: string;
      entityId?: string;
    },
    requestId?: string
  ) {
    super(message, code, statusCode, metadata, requestId, false);
    this.businessRule = metadata?.businessRule;
    this.entity = metadata?.entity;
    this.entityId = metadata?.entityId;
  }
}

/**
 * Business logic error codes
 */
export type BusinessLogicErrorCode =
  | 'BUSINESS_RULE_VIOLATION'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'RESOURCE_LIMIT_EXCEEDED'
  | 'OPERATION_NOT_ALLOWED'
  | 'DEPENDENCY_NOT_MET'
  | 'INVALID_STATE_TRANSITION'
  | 'DUPLICATE_RESOURCE'
  | 'RESOURCE_LOCKED'
  | 'ACCOUNT_SUSPENDED'
  | 'SERVICE_UNAVAILABLE_FOR_USER'
  | 'POLISH_BUSINESS_RULE_VIOLATION'
  | 'VAT_RULE_VIOLATION'
  | 'INVOICE_RULE_VIOLATION'
  | 'CONSUMER_RIGHTS_VIOLATION';

/**
 * External service errors
 */
export class ExternalServiceError extends MariiaHubSDKError {
  public readonly service?: string;
  public readonly externalError?: string;
  public readonly externalCode?: string;

  constructor(
    message: string,
    code: ExternalServiceErrorCode,
    statusCode = 502,
    metadata?: {
      service?: string;
      externalError?: string;
      externalCode?: string;
    },
    requestId?: string
  ) {
    const retryable = [
      'SERVICE_UNAVAILABLE',
      'SERVICE_TIMEOUT',
      'RATE_LIMITED',
      'TEMPORARY_FAILURE'
    ].includes(code);
    super(message, code, statusCode, metadata, requestId, retryable);
    this.service = metadata?.service;
    this.externalError = metadata?.externalError;
    this.externalCode = metadata?.externalCode;
  }
}

/**
 * External service error codes
 */
export type ExternalServiceErrorCode =
  | 'SERVICE_UNAVAILABLE'
  | 'SERVICE_TIMEOUT'
  | 'SERVICE_ERROR'
  | 'SERVICE_MAINTENANCE'
  | 'SERVICE_DEPRECATED'
  | 'SERVICE_RATE_LIMITED'
  | 'SERVICE_QUOTA_EXCEEDED'
  | 'SERVICE_AUTH_FAILED'
  | 'SERVICE_INVALID_RESPONSE'
  | 'SERVICE_CONNECTION_FAILED'
  | 'BOOKSY_API_ERROR'
  | 'BOOKSY_SYNC_FAILED'
  | 'STRIPE_API_ERROR'
  | 'EMAIL_SERVICE_ERROR'
  | 'SMS_SERVICE_ERROR'
  | 'CALENDAR_SERVICE_ERROR'
  | 'POLISH_SERVICE_ERROR';

/**
 * Polish market specific errors
 */
export class PolishMarketError extends BusinessLogicError {
  public readonly polishRule?: string;
  public readonly polishRequirement?: string;

  constructor(
    message: string,
    code: PolishMarketErrorCode,
    statusCode = 422,
    metadata?: {
      polishRule?: string;
      polishRequirement?: string;
    },
    requestId?: string
  ) {
    super(message, code, statusCode, metadata, requestId);
    this.polishRule = metadata?.polishRule;
    this.polishRequirement = metadata?.polishRequirement;
  }
}

/**
 * Polish market error codes
 */
export type PolishMarketErrorCode =
  | 'POLISH_BUSINESS_HOURS_VIOLATION'
  | 'POLISH_HOLIDAY_VIOLATION'
  | 'NIP_VALIDATION_FAILED'
  | 'REGON_VALIDATION_FAILED'
  | 'KRS_VALIDATION_FAILED'
  | 'PESEL_VALIDATION_FAILED'
  | 'POLISH_POSTAL_CODE_INVALID'
  | 'POLISH_PHONE_INVALID'
  | 'POLISH_BANK_ACCOUNT_INVALID'
  | 'VAT_RULE_VIOLATION'
  | 'INVOICE_REQUIREMENT_VIOLATION'
  | 'CONSUMER_RIGHTS_VIOLATION'
  | 'GDPR_COMPLIANCE_VIOLATION'
  | 'POLISH_PAYMENT_METHOD_ERROR'
  | 'JPK_REPORTING_ERROR'
  | 'POLISH_TAX_REGULATION_VIOLATION';

/**
 * WebSocket errors
 */
export class WebSocketError extends MariiaHubSDKError {
  public readonly wsCode?: number;
  public readonly wsReason?: string;

  constructor(
    message: string,
    code: WebSocketErrorCode,
    wsCode?: number,
    wsReason?: string,
    metadata?: Record<string, any>,
    requestId?: string
  ) {
    const retryable = [
      'WEBSOCKET_CONNECTION_LOST',
      'WEBSOCKET_TIMEOUT',
      'WEBSOCKET_SERVER_ERROR'
    ].includes(code);
    super(message, code, 1000, { ...metadata, wsCode, wsReason }, requestId, retryable);
    this.wsCode = wsCode;
    this.wsReason = wsReason;
  }
}

/**
 * WebSocket error codes
 */
export type WebSocketErrorCode =
  | 'WEBSOCKET_CONNECTION_FAILED'
  | 'WEBSOCKET_CONNECTION_LOST'
  | 'WEBSOCKET_TIMEOUT'
  | 'WEBSOCKET_SERVER_ERROR'
  | 'WEBSOCKET_AUTH_FAILED'
  | 'WEBSOCKET_RATE_LIMITED'
  | 'WEBSOCKET_MESSAGE_TOO_LARGE'
  | 'WEBSOCKET_INVALID_MESSAGE'
  | 'WEBSOCKET_PROTOCOL_ERROR'
  | 'WEBSOCKET_POLICY_VIOLATION';

/**
 * Error factory
 */
export class ErrorFactory {
  /**
   * Create error from API response
   */
  static fromApiResponse(
    error: any,
    requestId?: string
  ): MariiaHubSDKError {
    const code = error.code || 'UNKNOWN_ERROR';
    const message = error.message || 'An unknown error occurred';
    const statusCode = error.statusCode;
    const metadata = error.metadata || {};

    switch (statusCode) {
      case 401:
      case 403:
        return new AuthenticationError(
          message,
          code as AuthenticationErrorCode,
          statusCode,
          metadata,
          requestId
        );

      case 400:
        if (code.startsWith('VALIDATION_')) {
          return new ValidationError(
            message,
            code as ValidationErrorCode,
            metadata.field,
            metadata.value,
            metadata.constraint,
            metadata,
            requestId
          );
        }
        if (code.startsWith('BOOKING_')) {
          return new BookingError(
            message,
            code as BookingErrorCode,
            statusCode,
            metadata,
            requestId
          );
        }
        if (code.startsWith('PAYMENT_')) {
          return new PaymentError(
            message,
            code as PaymentErrorCode,
            statusCode,
            metadata,
            requestId
          );
        }
        break;

      case 429:
        return new RateLimitError(
          message,
          code as RateLimitErrorCode,
          statusCode,
          metadata,
          requestId
        );

      case 500:
        if (code.startsWith('CONFIGURATION_')) {
          return new ConfigurationError(
            message,
            code as ConfigurationErrorCode,
            metadata.configKey,
            metadata.configValue,
            metadata,
            requestId
          );
        }
        if (code.startsWith('EXTERNAL_')) {
          return new ExternalServiceError(
            message,
            code as ExternalServiceErrorCode,
            statusCode,
            metadata,
            requestId
          );
        }
        break;

      case 422:
        if (code.startsWith('POLISH_')) {
          return new PolishMarketError(
            message,
            code as PolishMarketErrorCode,
            statusCode,
            metadata,
            requestId
          );
        }
        return new BusinessLogicError(
          message,
          code as BusinessLogicErrorCode,
          statusCode,
          metadata,
          requestId
        );
    }

    // Default error
    return new MariiaHubSDKError(
      message,
      code,
      statusCode,
      metadata,
      requestId,
      false
    );
  }

  /**
   * Create network error
   */
  static networkError(
    message: string,
    code: NetworkErrorCode,
    statusCode?: number,
    metadata?: Record<string, any>
  ): NetworkError {
    return new NetworkError(message, code, statusCode, metadata);
  }

  /**
   * Create WebSocket error
   */
  static webSocketError(
    message: string,
    code: WebSocketErrorCode,
    wsCode?: number,
    wsReason?: string,
    metadata?: Record<string, any>
  ): WebSocketError {
    return new WebSocketError(message, code, wsCode, wsReason, metadata);
  }
}

/**
 * Error handler interface
 */
export interface ErrorHandler {
  /**
   * Handle error
   */
  handle(error: MariiaHubSDKError): void;

  /**
   * Check if error should be handled
   */
  canHandle(error: MariiaHubSDKError): boolean;
}

/**
 * Default error handler
 */
export class DefaultErrorHandler implements ErrorHandler {
  constructor(private logger?: (level: string, message: string, data?: any) => void) {}

  handle(error: MariiaHubSDKError): void {
    if (this.logger) {
      this.logger('error', error.message, {
        code: error.code,
        statusCode: error.statusCode,
        category: error.getCategory(),
        retryable: error.isRetryable(),
        metadata: error.metadata,
        stack: error.stack
      });
    } else {
      console.error('Mariia Hub SDK Error:', error);
    }
  }

  canHandle(error: MariiaHubSDKError): boolean {
    return true; // Default handler handles all errors
  }
}

/**
 * Error handler registry
 */
export class ErrorHandlerRegistry {
  private handlers: ErrorHandler[] = [];

  /**
   * Register error handler
   */
  register(handler: ErrorHandler): void {
    this.handlers.push(handler);
  }

  /**
   * Unregister error handler
   */
  unregister(handler: ErrorHandler): void {
    const index = this.handlers.indexOf(handler);
    if (index > -1) {
      this.handlers.splice(index, 1);
    }
  }

  /**
   * Handle error with registered handlers
   */
  handle(error: MariiaHubSDKError): void {
    for (const handler of this.handlers) {
      if (handler.canHandle(error)) {
        handler.handle(error);
        break; // Stop at first handler that can handle the error
      }
    }
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this.handlers = [];
  }
}