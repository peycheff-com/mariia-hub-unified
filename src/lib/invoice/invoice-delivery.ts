// Automated Invoice Delivery System
// Handles automated delivery of invoices via email and integrates with Polish tax requirements

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { GeneratedInvoice } from '@/lib/invoice/invoice-generator';

export interface InvoiceDeliveryConfig {
  // Delivery methods
  emailDelivery: boolean;
  electronicInvoice: boolean;
  smsNotification: boolean;

  // Delivery timing
  deliverImmediately: boolean;
  scheduledDelivery?: Date;

  // Customer preferences
  customerEmail?: string;
  customerPhone?: string;
  preferredLanguage: 'pl' | 'en';

  // Additional options
  ccEmails?: string[];
  bccEmails?: string[];
  includePaymentLink: boolean;
  includeQRCode: boolean;
  attachPDF: boolean;
}

export interface DeliveryResult {
  success: boolean;
  deliveryId: string;
  deliveryMethods: {
    email?: {
      sent: boolean;
      messageId?: string;
      error?: string;
    };
    electronic?: {
      uploaded: boolean;
      path?: string;
      error?: string;
    };
    sms?: {
      sent: boolean;
      messageId?: string;
      error?: string;
    };
  };
  deliveredAt: Date;
  nextRetry?: Date;
  error?: string;
}

/**
 * Invoice Delivery Service
 * Manages automated delivery of invoices through multiple channels
 */
export class InvoiceDeliveryService {
  private static readonly RETRY_INTERVALS = [1, 3, 7, 24]; // Hours between retries
  private static readonly MAX_RETRIES = 4;

  /**
   * Deliver invoice automatically based on configuration
   */
  static async deliverInvoice(
    invoice: GeneratedInvoice,
    config: InvoiceDeliveryConfig
  ): Promise<DeliveryResult> {
    try {
      const deliveryId = `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      logger.info('Starting invoice delivery', {
        deliveryId,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        methods: {
          email: config.emailDelivery,
          electronic: config.electronicInvoice,
          sms: config.smsNotification
        }
      });

      const results: DeliveryResult['deliveryMethods'] = {};

      // Initialize delivery record
      await this.initializeDeliveryRecord(deliveryId, invoice.id, config);

      // Email delivery
      if (config.emailDelivery && config.customerEmail) {
        results.email = await this.deliverByEmail(invoice, config);
      }

      // Electronic invoice (KAP/FA_E) delivery
      if (config.electronicInvoice) {
        results.electronic = await this.deliverElectronicInvoice(invoice, config);
      }

      // SMS notification
      if (config.smsNotification && config.customerPhone) {
        results.sms = await this.deliverBySMS(invoice, config);
      }

      // Check if any delivery method succeeded
      const hasSuccessfulDelivery = Object.values(results).some(r => r.sent || r.uploaded);

      const deliveryResult: DeliveryResult = {
        success: hasSuccessfulDelivery,
        deliveryId,
        deliveryMethods: results,
        deliveredAt: new Date(),
        nextRetry: hasSuccessfulDelivery ? undefined : this.calculateNextRetry(0)
      };

      // Update delivery record
      await this.updateDeliveryRecord(deliveryId, deliveryResult);

      logger.info('Invoice delivery completed', {
        deliveryId,
        success: deliveryResult.success,
        methods: Object.keys(results).filter(key =>
          results[key as keyof typeof results].sent || results[key as keyof typeof results].uploaded
        )
      });

      return deliveryResult;

    } catch (error) {
      logger.error('Invoice delivery failed:', error);
      throw new Error(`Failed to deliver invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Schedule invoice delivery for later
   */
  static async scheduleInvoiceDelivery(
    invoice: GeneratedInvoice,
    config: InvoiceDeliveryConfig & { scheduledDelivery: Date }
  ): Promise<string> {
    const deliveryId = `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await supabase
      .from('scheduled_deliveries')
      .insert({
        id: deliveryId,
        invoice_id: invoice.id,
        delivery_config: config,
        scheduled_for: config.scheduledDelivery.toISOString(),
        status: 'scheduled',
        created_at: new Date().toISOString()
      });

    logger.info('Invoice delivery scheduled', {
      deliveryId,
      invoiceId: invoice.id,
      scheduledFor: config.scheduledDelivery
    });

    return deliveryId;
  }

  /**
   * Process scheduled deliveries
   */
  static async processScheduledDeliveries(): Promise<void> {
    try {
      const { data: scheduledDeliveries, error } = await supabase
        .from('scheduled_deliveries')
        .select('*')
        .eq('status', 'scheduled')
        .lte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch scheduled deliveries: ${error.message}`);
      }

      for (const scheduled of scheduledDeliveries || []) {
        try {
          // Get invoice details
          const { data: invoice } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', scheduled.invoice_id)
            .single();

          if (!invoice) {
            throw new Error('Invoice not found');
          }

          // Convert to GeneratedInvoice format
          const generatedInvoice: GeneratedInvoice = {
            id: invoice.id,
            invoiceNumber: invoice.invoice_number,
            invoiceData: invoice, // Simplified - would need proper conversion
            totals: {
              netTotal: invoice.vat_basis,
              vatTotal: invoice.vat_amount,
              grossTotal: invoice.total_amount,
              vatBreakdown: {},
              currency: invoice.currency
            },
            legalInfo: {
              sellerInfo: {
                name: invoice.seller_name,
                address: invoice.seller_address,
                nip: invoice.seller_nip,
                bankAccount: invoice.seller_bank_account
              },
              legalBasis: '',
              notes: [],
              isReverseCharge: invoice.reverse_charge,
              isSplitPayment: invoice.split_payment,
              isExempt: false
            },
            paymentInfo: {
              method: invoice.payment_method || 'transfer',
              status: invoice.payment_status,
              dueDate: new Date(invoice.due_date),
              bankAccount: invoice.seller_bank_account
            },
            createdAt: new Date(invoice.created_at)
          };

          // Process delivery
          const result = await this.deliverInvoice(generatedInvoice, scheduled.delivery_config);

          // Update scheduled delivery status
          await supabase
            .from('scheduled_deliveries')
            .update({
              status: result.success ? 'delivered' : 'failed',
              delivered_at: result.deliveredAt.toISOString(),
              error: result.error,
              updated_at: new Date().toISOString()
            })
            .eq('id', scheduled.id);

        } catch (error) {
          logger.error('Failed to process scheduled delivery:', {
            deliveryId: scheduled.id,
            error: error instanceof Error ? error.message : error
          });

          // Update status to failed
          await supabase
            .from('scheduled_deliveries')
            .update({
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error',
              updated_at: new Date().toISOString()
            })
            .eq('id', scheduled.id);
        }
      }

    } catch (error) {
      logger.error('Failed to process scheduled deliveries:', error);
    }
  }

  /**
   * Retry failed deliveries
   */
  static async retryFailedDeliveries(): Promise<void> {
    try {
      const { data: failedDeliveries, error } = await supabase
        .from('invoice_deliveries')
        .select('*')
        .eq('status', 'failed')
        .lt('retry_count', this.MAX_RETRIES)
        .lte('next_retry_at', new Date().toISOString());

      if (error) {
        throw new Error(`Failed to fetch failed deliveries: ${error.message}`);
      }

      for (const delivery of failedDeliveries || []) {
        try {
          const nextRetryCount = (delivery.retry_count || 0) + 1;

          // Get invoice details
          const { data: invoice } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', delivery.invoice_id)
            .single();

          if (!invoice) {
            continue;
          }

          // Retry delivery
          const result = await this.deliverInvoice(
            { id: invoice.id } as GeneratedInvoice,
            delivery.delivery_config
          );

          // Update delivery record
          await supabase
            .from('invoice_deliveries')
            .update({
              status: result.success ? 'delivered' : 'failed',
              retry_count: nextRetryCount,
              delivered_at: result.deliveredAt.toISOString(),
              next_retry_at: result.success ? null : this.calculateNextRetry(nextRetryCount),
              last_error: result.error,
              updated_at: new Date().toISOString()
            })
            .eq('id', delivery.id);

        } catch (error) {
          logger.error('Failed to retry delivery:', {
            deliveryId: delivery.id,
            error: error instanceof Error ? error.message : error
          });
        }
      }

    } catch (error) {
      logger.error('Failed to retry deliveries:', error);
    }
  }

  /**
   * Deliver invoice by email
   */
  private static async deliverByEmail(
    invoice: GeneratedInvoice,
    config: InvoiceDeliveryConfig
  ): Promise<{ sent: boolean; messageId?: string; error?: string }> {
    try {
      // Generate email content
      const emailContent = this.generateEmailContent(invoice, config);

      // Generate PDF attachment if requested
      let pdfBase64: string | undefined;
      if (config.attachPDF) {
        pdfBase64 = await this.generateInvoicePDF(invoice);
      }

      // In a real implementation, you would use an email service like SendGrid, Resend, etc.
      // For now, simulate the email sending
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      logger.info('Invoice sent by email', {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        recipient: config.customerEmail,
        messageId
      });

      return {
        sent: true,
        messageId
      };

    } catch (error) {
      return {
        sent: false,
        error: error instanceof Error ? error.message : 'Email delivery failed'
      };
    }
  }

  /**
   * Deliver electronic invoice (KAP/FA_E)
   */
  private static async deliverElectronicInvoice(
    invoice: GeneratedInvoice,
    config: InvoiceDeliveryConfig
  ): Promise<{ uploaded: boolean; path?: string; error?: string }> {
    try {
      // Generate JPK_FA XML file
      const jpkData = await this.generateJPK_FA(invoice);

      // Upload to storage or government system
      const path = `invoices/${invoice.id}/${invoice.invoiceNumber}_jpk_fa.xml`;

      // In a real implementation, you would upload to appropriate storage
      // For now, simulate the upload
      await new Promise(resolve => setTimeout(resolve, 300));

      logger.info('Electronic invoice uploaded', {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        path
      });

      return {
        uploaded: true,
        path
      };

    } catch (error) {
      return {
        uploaded: false,
        error: error instanceof Error ? error.message : 'Electronic invoice delivery failed'
      };
    }
  }

  /**
   * Send SMS notification
   */
  private static async deliverBySMS(
    invoice: GeneratedInvoice,
    config: InvoiceDeliveryConfig
  ): Promise<{ sent: boolean; messageId?: string; error?: string }> {
    try {
      const message = this.generateSMSMessage(invoice, config);

      // In a real implementation, you would use an SMS service like Twilio, MessageBird, etc.
      // For now, simulate the SMS sending
      const messageId = `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));

      logger.info('SMS notification sent', {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        recipient: config.customerPhone,
        messageId
      });

      return {
        sent: true,
        messageId
      };

    } catch (error) {
      return {
        sent: false,
        error: error instanceof Error ? error.message : 'SMS delivery failed'
      };
    }
  }

  /**
   * Generate email content
   */
  private static generateEmailContent(
    invoice: GeneratedInvoice,
    config: InvoiceDeliveryConfig
  ): { subject: string; html: string; text: string } {
    const isPolish = config.preferredLanguage === 'pl';
    const currency = invoice.totals.currency;

    const subject = isPolish
      ? `Faktura nr ${invoice.invoiceNumber} od Mariia Hub`
      : `Invoice #${invoice.invoiceNumber} from Mariia Hub`;

    const paymentDueDate = invoice.paymentInfo.dueDate.toLocaleDateString(
      isPolish ? 'pl-PL' : 'en-US'
    );

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: #8B4513; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .invoice-details { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .payment-info { background: #e8f5e8; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .total { font-size: 18px; font-weight: bold; color: #8B4513; }
          .btn { display: inline-block; padding: 12px 24px; background: #8B4513; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Mariia Hub</h1>
          <p>${isPolish ? 'Piękno i fitness w luksusowym wydaniu' : 'Beauty and fitness in luxury'}</p>
        </div>

        <div class="content">
          <h2>${isPolish ? 'Faktura' : 'Invoice'} #${invoice.invoiceNumber}</h2>
          <p>${isPolish ? 'Dziękujemy za zaufanie. Poniżej znajdują się szczegóły faktury.' : 'Thank you for your business. Below are your invoice details.'}</p>

          <div class="invoice-details">
            <h3>${isPolish ? 'Szczegóły faktury' : 'Invoice Details'}</h3>
            <p><strong>${isPolish ? 'Numer faktury' : 'Invoice Number'}:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>${isPolish ? 'Data wystawienia' : 'Issue Date'}:</strong> ${new Date().toLocaleDateString(isPolish ? 'pl-PL' : 'en-US')}</p>
            <p><strong>${isPolish ? 'Termin płatności' : 'Due Date'}:</strong> ${paymentDueDate}</p>
            <p class="total"><strong>${isPolish ? 'Do zapłaty' : 'Total Amount'}:</strong> ${invoice.totals.grossTotal.toFixed(2)} ${currency}</p>
          </div>

          ${config.includePaymentLink ? `
          <div class="payment-info">
            <h3>${isPolish ? 'Płatność online' : 'Online Payment'}</h3>
            <p>${isPolish ? 'Dokonaj płatności szybko i bezpiecznie online:' : 'Make a quick and secure online payment:'}</p>
            <a href="#" class="btn">${isPolish ? 'Zapłać online' : 'Pay Online'}</a>
          </div>
          ` : ''}

          <div class="payment-info">
            <h3>${isPolish ? 'Dane przelewu' : 'Transfer Details'}</h3>
            <p><strong>${isPolish ? 'Odbiorca' : 'Recipient'}:</strong> ${invoice.legalInfo.sellerInfo.name}</p>
            <p><strong>${isPolish ? 'Numer konta' : 'Account Number'}:</strong> ${invoice.legalInfo.sellerInfo.bankAccount}</p>
            <p><strong>${isPolish ? 'Tytuł' : 'Reference'}:</strong> Faktura ${invoice.invoiceNumber}</p>
          </div>
        </div>

        <div class="footer">
          <p>${isPolish ? 'Ta wiadomość została wygenerowana automatycznie.' : 'This message was generated automatically.'}</p>
          <p>© 2024 Mariia Hub. ${isPolish ? 'Wszelkie prawa zastrzeżone.' : 'All rights reserved.'}</p>
        </div>
      </body>
      </html>
    `;

    const text = `
      ${subject}

      ${isPolish ? 'Dziękujemy za zaufanie.' : 'Thank you for your business.'}

      ${isPolish ? 'Szczegóły faktury:' : 'Invoice Details:'}
      ${isPolish ? 'Numer faktury' : 'Invoice Number'}: ${invoice.invoiceNumber}
      ${isPolish ? 'Data wystawienia' : 'Issue Date'}: ${new Date().toLocaleDateString(isPolish ? 'pl-PL' : 'en-US')}
      ${isPolish ? 'Termin płatności' : 'Due Date'}: ${paymentDueDate}
      ${isPolish ? 'Do zapłaty' : 'Total Amount'}: ${invoice.totals.grossTotal.toFixed(2)} ${currency}

      ${isPolish ? 'Dane przelewu:' : 'Transfer Details:'}
      ${isPolish ? 'Odbiorca' : 'Recipient'}: ${invoice.legalInfo.sellerInfo.name}
      ${isPolish ? 'Numer konta' : 'Account Number'}: ${invoice.legalInfo.sellerInfo.bankAccount}
      ${isPolish ? 'Tytuł' : 'Reference'}: Faktura ${invoice.invoiceNumber}

      ${isPolish ? 'Ta wiadomość została wygenerowana automatycznie.' : 'This message was generated automatically.'}
      © 2024 Mariia Hub. ${isPolish ? 'Wszelkie prawa zastrzeżone.' : 'All rights reserved.'}
    `;

    return { subject, html, text };
  }

  /**
   * Generate SMS message
   */
  private static generateSMSMessage(
    invoice: GeneratedInvoice,
    config: InvoiceDeliveryConfig
  ): string {
    const isPolish = config.preferredLanguage === 'pl';
    const currency = invoice.totals.currency;

    return isPolish
      ? `Mariia Hub: Faktura nr ${invoice.invoiceNumber} na kwotę ${invoice.totals.grossTotal.toFixed(2)} ${currency}. Termin płatności: ${invoice.paymentInfo.dueDate.toLocaleDateString('pl-PL')}. Faktura została wysłana na email.`
      : `Mariia Hub: Invoice #${invoice.invoiceNumber} for ${invoice.totals.grossTotal.toFixed(2)} ${currency}. Due: ${invoice.paymentInfo.dueDate.toLocaleDateString('en-US')}. Invoice sent to your email.`;
  }

  /**
   * Generate invoice PDF (mock implementation)
   */
  private static async generateInvoicePDF(invoice: GeneratedInvoice): Promise<string> {
    // In a real implementation, you would use a PDF generation library
    // For now, return a placeholder
    return 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgo3MCA1ODAgVGQKKChGYWt0dXJhICkpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDIyIDAwMDAwIG4gCjAwMDAwMDA3NyAwMDAwMCBuIAowMDAwMDAwMTc1IDAwMDAwIG4gCjAwMDAwMDAyMDkgMDAwMDAgbiAKMDAwMDAwMDM2NiAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDYKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQ0MgolJUVPRg==';
  }

  /**
   * Generate JPK_FA file (mock implementation)
   */
  private static async generateJPK_FA(invoice: GeneratedInvoice): Promise<any> {
    // In a real implementation, you would generate proper XML structure
    return {
      xmlns: 'http://crd.gov.pl/wzor/2023/06/29/11059/',
      Faktura: [{
        P_1: invoice.id,
        P_2A: invoice.invoiceNumber,
        P_13: invoice.totals.grossTotal,
        P_14: invoice.totals.vatTotal,
        P_15: invoice.totals.currency
      }]
    };
  }

  /**
   * Initialize delivery record
   */
  private static async initializeDeliveryRecord(
    deliveryId: string,
    invoiceId: string,
    config: InvoiceDeliveryConfig
  ): Promise<void> {
    await supabase
      .from('invoice_deliveries')
      .insert({
        id: deliveryId,
        invoice_id: invoiceId,
        delivery_config: config,
        status: 'processing',
        created_at: new Date().toISOString()
      });
  }

  /**
   * Update delivery record
   */
  private static async updateDeliveryRecord(
    deliveryId: string,
    result: DeliveryResult
  ): Promise<void> {
    await supabase
      .from('invoice_deliveries')
      .update({
        status: result.success ? 'delivered' : 'failed',
        delivery_methods: result.deliveryMethods,
        delivered_at: result.deliveredAt.toISOString(),
        next_retry_at: result.nextRetry?.toISOString(),
        error: result.error,
        updated_at: new Date().toISOString()
      })
      .eq('id', deliveryId);
  }

  /**
   * Calculate next retry time
   */
  private static calculateNextRetry(retryCount: number): Date {
    if (retryCount >= this.RETRY_INTERVALS.length) {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 7); // Try again in a week
      return nextDate;
    }

    const hours = this.RETRY_INTERVALS[Math.min(retryCount, this.RETRY_INTERVALS.length - 1)];
    const nextDate = new Date();
    nextDate.setHours(nextDate.getHours() + hours);
    return nextDate;
  }
}

/**
 * React hook for invoice delivery
 */
export function useInvoiceDelivery() {
  const deliverInvoice = async (
    invoice: GeneratedInvoice,
    config: InvoiceDeliveryConfig
  ) => {
    return await InvoiceDeliveryService.deliverInvoice(invoice, config);
  };

  const scheduleDelivery = async (
    invoice: GeneratedInvoice,
    config: InvoiceDeliveryConfig & { scheduledDelivery: Date }
  ) => {
    return await InvoiceDeliveryService.scheduleInvoiceDelivery(invoice, config);
  };

  const processScheduledDeliveries = async () => {
    return await InvoiceDeliveryService.processScheduledDeliveries();
  };

  const retryFailedDeliveries = async () => {
    return await InvoiceDeliveryService.retryFailedDeliveries();
  };

  return {
    deliverInvoice,
    scheduleDelivery,
    processScheduledDeliveries,
    retryFailedDeliveries
  };
}

// Export singleton instance
export const invoiceDeliveryService = InvoiceDeliveryService;