// SMS provider implementation using Twilio

import { BaseProvider } from './base-provider';
import {
  SMSProvider,
  SMSOptions,
  SMSResult,
  MessageStatus,
  CommunicationError
} from '@/types/communication';

export class TwilioSMSProvider extends BaseProvider implements SMSProvider {
  private twilio: any; // Twilio client
  private fromNumber: string;

  constructor(config: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  }) {
    super('sms', config);

    if (!config.accountSid) {
      throw new CommunicationError(
        'Twilio Account SID is required',
        'MISSING_ACCOUNT_SID',
        'sms'
      );
    }

    if (!config.authToken) {
      throw new CommunicationError(
        'Twilio Auth Token is required',
        'MISSING_AUTH_TOKEN',
        'sms'
      );
    }

    if (!config.fromNumber) {
      throw new CommunicationError(
        'Twilio From Number is required',
        'MISSING_FROM_NUMBER',
        'sms'
      );
    }

    this.fromNumber = config.fromNumber;

    // Initialize Twilio client
    try {
      this.twilio = this.initializeTwilio(config.accountSid, config.authToken);
    } catch (error) {
      throw new CommunicationError(
        `Failed to initialize Twilio client: ${error}`,
        'PROVIDER_INIT_FAILED',
        'sms'
      );
    }
  }

  private initializeTwilio(accountSid: string, authToken: string) {
    // Dynamic import to avoid SSR issues
    try {
      const twilio = require('twilio');
      return twilio(accountSid, authToken);
    } catch (error) {
      // Fallback for environments where Twilio is not available
      console.warn('Twilio package not available, using mock implementation');
      return {
        messages: {
          create: async (params: any) => {
            console.log('Mock Twilio SMS send:', params);
            return { sid: 'mock-' + Date.now(), status: 'sent' };
          }
        }
      };
    }
  }

  async sendSMS(
    to: string,
    message: string,
    options: SMSOptions = {}
  ): Promise<SMSResult> {
    const startTime = Date.now();

    try {
      to = this.formatPhoneNumber(to);
      this.validateRecipient(to);
      this.validateContent(message);

      const result = await this.executeWithRetry(
        () => this.sendSMSInternal(to, message, options),
        'sendSMS'
      );

      const duration = Date.now() - startTime;
      await this.trackMetrics('sendSMS', result.success, duration, {
        recipient: this.maskRecipient(to),
        messageLength: message.length,
        hasMedia: options.mediaUrl && options.mediaUrl.length > 0
      });

      this.logActivity('sendSMS', to, result.success ? MessageStatus.SENT : MessageStatus.FAILED, {
        messageId: result.messageId,
        messageLength: message.length
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      await this.trackMetrics('sendSMS', false, duration, {
        recipient: this.maskRecipient(to),
        messageLength: message.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      this.logActivity('sendSMS', to, MessageStatus.FAILED, {
        error: error instanceof Error ? error.message : 'Unknown error',
        messageLength: message.length
      });

      throw this.formatError(error);
    }
  }

  private async sendSMSInternal(
    to: string,
    message: string,
    options: SMSOptions
  ): Promise<SMSResult> {
    try {
      const smsData: any = {
        body: message,
        from: options.from || this.fromNumber,
        to: to
      };

      // Add media URLs if provided
      if (options.mediaUrl && options.mediaUrl.length > 0) {
        smsData.mediaUrl = options.mediaUrl;
      }

      // Add status callback if provided
      if (options.statusCallback) {
        smsData.statusCallback = options.statusCallback;
      }

      const response = await this.twilio.messages.create(smsData);

      // Check if the message was successfully queued
      if (response.status === 'failed' || response.status === 'undelivered') {
        throw new CommunicationError(
          `SMS failed to queue: ${response.errorMessage || 'Unknown error'}`,
          'SMS_QUEUE_FAILED',
          'sms',
          'twilio'
        );
      }

      return {
        success: true,
        messageId: response.sid,
        provider: 'twilio'
      };

    } catch (error) {
      if (error instanceof CommunicationError) {
        throw error;
      }

      // Handle specific Twilio errors
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        if (errorMessage.includes('invalid phone number') || errorMessage.includes('e212')) {
          throw new CommunicationError(
            'Invalid phone number',
            'INVALID_RECIPIENT',
            'sms',
            'twilio'
          );
        }

        if (errorMessage.includes('unauthorized') || errorMessage.includes('20003')) {
          throw new CommunicationError(
            'Authentication failed with Twilio API',
            'AUTHENTICATION_FAILED',
            'sms',
            'twilio'
          );
        }

        if (errorMessage.includes('rate limit') || errorMessage.includes('21629')) {
          throw new CommunicationError(
            'Rate limit exceeded',
            'RATE_LIMIT_EXCEEDED',
            'sms',
            'twilio'
          );
        }

        if (errorMessage.includes('quota exceeded') || errorMessage.includes('21614')) {
          throw new CommunicationError(
            'Account quota exceeded',
            'QUOTA_EXCEEDED',
            'sms',
            'twilio'
          );
        }

        if (errorMessage.includes('message too long') || errorMessage.includes('21612')) {
          throw new CommunicationError(
            'Message too long: SMS maximum 1600 characters',
            'CONTENT_TOO_LONG',
            'sms',
            'twilio'
          );
        }
      }

      throw new CommunicationError(
        `Failed to send SMS: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SEND_FAILED',
        'sms',
        'twilio'
      );
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');

    // Handle Polish phone numbers
    if (cleaned.startsWith('48') && cleaned.length === 12) {
      return '+' + cleaned;
    }

    // Handle numbers without country code (assume Poland)
    if (cleaned.length === 9) {
      return '+48' + cleaned;
    }

    // Handle numbers starting with + but missing country code
    if (cleaned.startsWith('+') && cleaned.length === 10) {
      return '+48' + cleaned.slice(1);
    }

    // Return as-is if it looks like a full international number
    if (cleaned.startsWith('+') && cleaned.length >= 10) {
      return cleaned;
    }

    throw new CommunicationError(
      `Invalid phone number format: ${phoneNumber}`,
      'INVALID_PHONE_FORMAT',
      'sms'
    );
  }

  // Helper methods for SMS content formatting
  static formatBookingReminder(
    clientName: string,
    serviceTitle: string,
    bookingTime: string,
    location: string,
    language: 'en' | 'pl' = 'en'
  ): string {
    if (language === 'pl') {
      return `Cześć ${clientName}! Przypomnienie: Twoja wizyta na ${serviceTitle} dziś o ${bookingTime}. Do zobaczenia w ${location}! 🎉`;
    }

    return `Hi ${clientName}! Reminder: Your appointment for ${serviceTitle} is today at ${bookingTime}. See you at ${location}! 🎉`;
  }

  static formatBookingConfirmation(
    clientName: string,
    serviceTitle: string,
    bookingDate: string,
    bookingTime: string,
    location: string,
    language: 'en' | 'pl' = 'en'
  ): string {
    if (language === 'pl') {
      return `Dzień dobry ${clientName}! Twoja wizyta na ${serviceTitle} została potwierdzona na ${bookingDate} o ${bookingTime}. Lokalizacja: ${location}. Do zobaczenia!`;
    }

    return `Hello ${clientName}! Your appointment for ${serviceTitle} is confirmed for ${bookingDate} at ${bookingTime}. Location: ${location}. See you soon!`;
  }

  static formatCancellationMessage(
    clientName: string,
    serviceTitle: string,
    language: 'en' | 'pl' = 'en'
  ): string {
    if (language === 'pl') {
      return `Witaj ${clientName}. Niestety Twoja wizyta na ${serviceTitle} została odwołana. Skontaktuj się z nami w celu rezerwacji nowego terminu. Przepraszamy za niedogodności.`;
    }

    return `Hi ${clientName}. Unfortunately, your appointment for ${serviceTitle} has been cancelled. Please contact us to reschedule. We apologize for any inconvenience.`;
  }

  static formatPromotionMessage(
    clientName: string,
    promotionTitle: string,
    promotionDetails: string,
    bookingUrl?: string,
    language: 'en' | 'pl' = 'en'
  ): string {
    if (language === 'pl') {
      let message = `Cześć ${clientName}! 🌟 Specjalna oferta: ${promotionTitle}. ${promotionDetails}`;
      if (bookingUrl) {
        message += ` Zarezerwuj teraz: ${bookingUrl}`;
      }
      return message;
    }

    let message = `Hi ${clientName}! 🌟 Special offer: ${promotionTitle}. ${promotionDetails}`;
    if (bookingUrl) {
      message += ` Book now: ${bookingUrl}`;
    }
    return message;
  }

  // SMS length optimization
  static optimizeSMSLength(message: string): string {
    // Replace common words with shorter alternatives
    const replacements: { [key: string]: string } = {
      'your': 'ur',
      'you': 'u',
      'are': 'r',
      'see': 'c',
      'today': '2day',
      'tomorrow': '2moro',
      'for': '4',
      'to': '2',
      'appointment': 'appt',
      'please': 'pls',
      'thank you': 'ty',
      'welcome': 'wlcm',
      'time': 't',
      'hour': 'hr',
      'minutes': 'min'
    };

    let optimized = message;
    Object.entries(replacements).forEach(([long, short]) => {
      const regex = new RegExp(`\\b${long}\\b`, 'gi');
      optimized = optimized.replace(regex, short);
    });

    return optimized;
  }

  // Unicode character handling for SMS
  static sanitizeForSMS(text: string): string {
    // Replace non-GSM characters with GSM-compatible alternatives
    const replacements: { [key: string]: string } = {
      'ą': 'a',
      'ć': 'c',
      'ę': 'e',
      'ł': 'l',
      'ń': 'n',
      'ó': 'o',
      'ś': 's',
      'ź': 'z',
      'ż': 'z',
      'Ą': 'A',
      'Ć': 'C',
      'Ę': 'E',
      'Ł': 'L',
      'Ń': 'N',
      'Ó': 'O',
      'Ś': 'S',
      'Ź': 'Z',
      'Ż': 'Z',
      '"': "'",
      ''': "'",
      '…': '...',
      '–': '-',
      '—': '-',
      ''': "'"
    };

    let sanitized = text;
    Object.entries(replacements).forEach(([unicode, gsm]) => {
      sanitized = sanitized.replace(new RegExp(unicode, 'g'), gsm);
    });

    return sanitized;
  }
}