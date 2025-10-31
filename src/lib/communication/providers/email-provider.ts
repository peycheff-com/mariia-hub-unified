// Email provider implementation using Resend

import { BaseProvider } from './base-provider';
import {
  EmailProvider,
  EmailOptions,
  EmailResult,
  MessageStatus,
  CommunicationError
} from '@/types/communication';

export class ResendEmailProvider extends BaseProvider implements EmailProvider {
  private resend: any; // Resend client
  private fromEmail: string;
  private replyTo: string;

  constructor(config: {
    apiKey: string;
    fromEmail: string;
    replyTo?: string;
  }) {
    super('email', config);

    if (!config.apiKey) {
      throw new CommunicationError(
        'Resend API key is required',
        'MISSING_API_KEY',
        'email'
      );
    }

    this.fromEmail = config.fromEmail;
    this.replyTo = config.replyTo || config.fromEmail;

    // Initialize Resend client
    try {
      this.resend = this.initializeResend(config.apiKey);
    } catch (error) {
      throw new CommunicationError(
        `Failed to initialize Resend client: ${error}`,
        'PROVIDER_INIT_FAILED',
        'email'
      );
    }
  }

  private initializeResend(apiKey: string) {
    // Dynamic import to avoid SSR issues
    try {
      const Resend = require('resend');
      return new Resend.Resend(apiKey);
    } catch (error) {
      // Fallback for environments where Resend is not available
      console.warn('Resend package not available, using mock implementation');
      return {
        emails: {
          send: async (params: any) => {
            console.log('Mock Resend email send:', params);
            return { data: { id: 'mock-' + Date.now() }, error: null };
          }
        }
      };
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    content: string,
    options: EmailOptions = {}
  ): Promise<EmailResult> {
    const startTime = Date.now();

    try {
      this.validateRecipient(to);
      this.validateContent(content);

      if (!subject || typeof subject !== 'string') {
        throw new CommunicationError(
          'Invalid subject: subject must be a non-empty string',
          'INVALID_SUBJECT',
          'email'
        );
      }

      const result = await this.executeWithRetry(
        () => this.sendEmailInternal(to, subject, content, options),
        'sendEmail'
      );

      const duration = Date.now() - startTime;
      await this.trackMetrics('sendEmail', result.success, duration, {
        recipient: this.maskRecipient(to),
        hasAttachments: options.attachments && options.attachments.length > 0
      });

      this.logActivity('sendEmail', to, result.success ? MessageStatus.SENT : MessageStatus.FAILED, {
        messageId: result.messageId,
        subject
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      await this.trackMetrics('sendEmail', false, duration, {
        recipient: this.maskRecipient(to),
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      this.logActivity('sendEmail', to, MessageStatus.FAILED, {
        error: error instanceof Error ? error.message : 'Unknown error',
        subject
      });

      throw this.formatError(error);
    }
  }

  async sendTemplate(
    to: string,
    templateId: string,
    variables: Record<string, any>
  ): Promise<EmailResult> {
    const startTime = Date.now();

    try {
      this.validateRecipient(to);

      if (!templateId) {
        throw new CommunicationError(
          'Template ID is required',
          'MISSING_TEMPLATE_ID',
          'email'
        );
      }

      const result = await this.executeWithRetry(
        () => this.sendTemplateInternal(to, templateId, variables),
        'sendTemplate'
      );

      const duration = Date.now() - startTime;
      await this.trackMetrics('sendTemplate', result.success, duration, {
        recipient: this.maskRecipient(to),
        templateId
      });

      this.logActivity('sendTemplate', to, result.success ? MessageStatus.SENT : MessageStatus.FAILED, {
        messageId: result.messageId,
        templateId
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      await this.trackMetrics('sendTemplate', false, duration, {
        recipient: this.maskRecipient(to),
        templateId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      this.logActivity('sendTemplate', to, MessageStatus.FAILED, {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateId
      });

      throw this.formatError(error);
    }
  }

  private async sendEmailInternal(
    to: string,
    subject: string,
    content: string,
    options: EmailOptions
  ): Promise<EmailResult> {
    try {
      const emailData: any = {
        from: options.from || this.fromEmail,
        to: [to],
        subject: subject,
        html: content,
        replyTo: options.replyTo || this.replyTo
      };

      // Add attachments if provided
      if (options.attachments && options.attachments.length > 0) {
        emailData.attachments = options.attachments.map(att => ({
          filename: att.filename,
          content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : att.content,
          type: att.contentType || 'application/octet-stream'
        }));
      }

      // Add custom headers
      if (options.headers) {
        emailData.headers = options.headers;
      }

      const response = await this.resend.emails.send(emailData);

      if (response.error) {
        throw new CommunicationError(
          `Resend API error: ${response.error.message}`,
          'PROVIDER_API_ERROR',
          'email',
          'resend'
        );
      }

      return {
        success: true,
        messageId: response.data?.id,
        provider: 'resend'
      };

    } catch (error) {
      if (error instanceof CommunicationError) {
        throw error;
      }

      // Handle specific Resend errors
      if (error instanceof Error) {
        if (error.message.includes('invalid email')) {
          throw new CommunicationError(
            'Invalid email address',
            'INVALID_RECIPIENT',
            'email',
            'resend'
          );
        }

        if (error.message.includes('unauthorized') || error.message.includes('401')) {
          throw new CommunicationError(
            'Authentication failed with Resend API',
            'AUTHENTICATION_FAILED',
            'email',
            'resend'
          );
        }

        if (error.message.includes('rate limit') || error.message.includes('429')) {
          throw new CommunicationError(
            'Rate limit exceeded',
            'RATE_LIMIT_EXCEEDED',
            'email',
            'resend'
          );
        }

        if (error.message.includes('quota exceeded') || error.message.includes('402')) {
          throw new CommunicationError(
            'Quota exceeded',
            'QUOTA_EXCEEDED',
            'email',
            'resend'
          );
        }
      }

      throw new CommunicationError(
        `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SEND_FAILED',
        'email',
        'resend'
      );
    }
  }

  private async sendTemplateInternal(
    to: string,
    templateId: string,
    variables: Record<string, any>
  ): Promise<EmailResult> {
    try {
      const templateData: any = {
        from: this.fromEmail,
        to: [to],
        templateId: templateId,
        replyTo: this.replyTo
      };

      // Add template variables
      if (variables && Object.keys(variables).length > 0) {
        templateData.variables = variables;
      }

      const response = await this.resend.emails.send(templateData);

      if (response.error) {
        throw new CommunicationError(
          `Resend template error: ${response.error.message}`,
          'PROVIDER_TEMPLATE_ERROR',
          'email',
          'resend'
        );
      }

      return {
        success: true,
        messageId: response.data?.id,
        provider: 'resend'
      };

    } catch (error) {
      if (error instanceof CommunicationError) {
        throw error;
      }

      throw new CommunicationError(
        `Failed to send template email: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TEMPLATE_SEND_FAILED',
        'email',
        'resend'
      );
    }
  }

  // Helper methods for email formatting
  static generateHTMLContent(content: string, theme: 'luxury' | 'minimal' = 'luxury'): string {
    const luxuryStyles = `
      <style>
        body { font-family: 'Georgia', serif; color: #2c2c2c; }
        .header { background: linear-gradient(135deg, #8B4513, #D4AF37); color: white; padding: 30px; text-align: center; }
        .content { padding: 40px 30px; background: #fafafa; }
        .footer { background: #2c2c2c; color: white; padding: 20px; text-align: center; font-size: 12px; }
        .button { background: #8B4513; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; }
        .signature { font-style: italic; color: #666; margin-top: 30px; }
      </style>
    `;

    const minimalStyles = `
      <style>
        body { font-family: 'Inter', sans-serif; color: #333; line-height: 1.6; }
        .header { border-bottom: 2px solid #8B4513; padding: 20px 0; text-align: center; }
        .content { padding: 30px 20px; }
        .footer { border-top: 1px solid #eee; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { background: #8B4513; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 15px 0; }
      </style>
    `;

    const styles = theme === 'luxury' ? luxuryStyles : minimalStyles;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>mariiaborysevych</title>
        ${styles}
      </head>
      <body>
        <div class="header">
          <h1>mariiaborysevych</h1>
          <p>Luxury Beauty & Fitness Services</p>
        </div>
        <div class="content">
          ${content}
          <div class="signature">
            <p>Best regards,<br>The mariiaborysevych Team</p>
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2024 mariiaborysevych. All rights reserved.</p>
          <p>If you no longer wish to receive these emails, please <a href="{{unsubscribe_url}}">unsubscribe</a>.</p>
        </div>
      </body>
      </html>
    `;
  }

  static generatePlainTextContent(content: string): string {
    return `
mariiaborysevych - Luxury Beauty & Fitness Services
===============================================

${content}

Best regards,
The mariiaborysevych Team

---
© 2024 mariiaborysevych. All rights reserved.
    `.trim();
  }
}