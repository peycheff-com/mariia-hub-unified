// Base provider interface and abstract class for communication providers

import {
  CommunicationChannel,
  EmailOptions,
  EmailResult,
  SMSOptions,
  SMSResult,
  WhatsAppOptions,
  WhatsAppResult,
  PushOptions,
  PushResult,
  MessageStatus,
  CommunicationError
} from '@/types/communication';

export abstract class BaseProvider {
  protected config: Record<string, any>;
  protected channel: CommunicationChannel;
  protected retryConfig: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };

  constructor(
    channel: CommunicationChannel,
    config: Record<string, any>,
    retryConfig = { maxRetries: 3, retryDelay: 1000, backoffMultiplier: 2 }
  ) {
    this.channel = channel;
    this.config = config;
    this.retryConfig = retryConfig;
  }

  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain error types
        if (this.shouldNotRetry(error)) {
          throw error;
        }

        if (attempt < this.retryConfig.maxRetries) {
          const delay = this.retryConfig.retryDelay *
            Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
          await this.sleep(delay);

          console.warn(`Attempt ${attempt} failed for ${operationName}, retrying in ${delay}ms:`, error);
        }
      }
    }

    throw new CommunicationError(
      `Operation ${operationName} failed after ${this.retryConfig.maxRetries} attempts. Last error: ${lastError?.message}`,
      'MAX_RETRIES_EXCEEDED',
      this.channel
    );
  }

  protected shouldNotRetry(error: unknown): boolean {
    if (error instanceof CommunicationError) {
      const nonRetriableCodes = [
        'INVALID_RECIPIENT',
        'INVALID_CONTENT',
        'AUTHENTICATION_FAILED',
        'ACCOUNT_SUSPENDED',
        'QUOTA_EXCEEDED'
      ];
      return nonRetriableCodes.includes(error.code);
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      const nonRetriablePatterns = [
        'invalid email',
        'invalid phone number',
        'authentication failed',
        'account suspended',
        'quota exceeded',
        'permission denied'
      ];
      return nonRetriablePatterns.some(pattern => message.includes(pattern));
    }

    return false;
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected validateRecipient(recipient: string): void {
    if (!recipient || typeof recipient !== 'string') {
      throw new CommunicationError(
        'Invalid recipient: recipient must be a non-empty string',
        'INVALID_RECIPIENT',
        this.channel
      );
    }
  }

  protected validateContent(content: string): void {
    if (!content || typeof content !== 'string') {
      throw new CommunicationError(
        'Invalid content: content must be a non-empty string',
        'INVALID_CONTENT',
        this.channel
      );
    }

    // Channel-specific validation
    switch (this.channel) {
      case 'sms':
        if (content.length > 1600) {
          throw new CommunicationError(
            'SMS content too long: maximum 1600 characters allowed',
            'CONTENT_TOO_LONG',
            this.channel
          );
        }
        break;
      case 'email':
        if (content.length > 1048576) { // 1MB limit
          throw new CommunicationError(
            'Email content too large: maximum 1MB allowed',
            'CONTENT_TOO_LARGE',
            this.channel
          );
        }
        break;
    }
  }

  protected logActivity(
    operation: string,
    recipient: string,
    status: MessageStatus,
    metadata: Record<string, any> = {}
  ): void {
    console.log(`[Communication:${this.channel.toUpperCase()}] ${operation}`, {
      recipient: this.maskRecipient(recipient),
      status,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  protected maskRecipient(recipient: string): string {
    if (this.channel === 'email') {
      const [username, domain] = recipient.split('@');
      if (username.length > 2) {
        return `${username.slice(0, 2)}***@${domain}`;
      }
      return `***@${domain}`;
    } else if (this.channel === 'sms' || this.channel === 'whatsapp') {
      if (recipient.length > 4) {
        return recipient.slice(0, -4).replace(/./g, '*') + recipient.slice(-4);
      }
      return recipient.replace(/./g, '*');
    }
    return recipient;
  }

  protected formatError(error: unknown): CommunicationError {
    if (error instanceof CommunicationError) {
      return error;
    }

    if (error instanceof Error) {
      return new CommunicationError(
        error.message,
        'PROVIDER_ERROR',
        this.channel
      );
    }

    return new CommunicationError(
      'Unknown error occurred',
      'UNKNOWN_ERROR',
      this.channel
    );
  }

  protected async trackMetrics(
    operation: string,
    success: boolean,
    duration: number,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    // This would integrate with your analytics system
    // For now, just log the metrics
    console.log(`[Communication:Metrics] ${this.channel}:${operation}`, {
      success,
      duration,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  // Abstract methods that must be implemented by specific providers
  abstract sendEmail(to: string, subject: string, content: string, options?: EmailOptions): Promise<EmailResult>;
  abstract sendSMS(to: string, message: string, options?: SMSOptions): Promise<SMSResult>;
  abstract sendWhatsApp(to: string, message: string, options?: WhatsAppOptions): Promise<WhatsAppResult>;
  abstract sendPush(to: string, title: string, message: string, options?: PushOptions): Promise<PushResult>;
}