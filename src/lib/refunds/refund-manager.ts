// Credit Notes and Refunds Management System
// Handles refunds, credit notes, and financial adjustments for Polish tax compliance

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useInvoiceGenerator } from '@/lib/invoice/invoice-generator';

export interface RefundRequest {
  invoiceId: string;
  bookingId?: string;
  refundAmount: number;
  refundReason: string;
  refundType: 'full' | 'partial' | 'cancellation_fee';
  refundMethod: 'stripe' | 'bank_transfer' | 'cash' | 'account_credit';
  customerContactInfo: {
    name: string;
    email: string;
    phone: string;
  };
  internalNotes?: string;
  approvedBy?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface RefundResult {
  refundId: string;
  refundNumber: string;
  status: 'initiated' | 'processing' | 'completed' | 'failed' | 'cancelled';
  refundAmount: number;
  refundMethod: string;
  refundReference?: string;
  externalRefundId?: string;
  processedAt?: Date;
  estimatedCompletionDate?: Date;
  creditNoteId?: string;
  creditNoteNumber?: string;
  failureReason?: string;
  createdAt: Date;
}

export interface CreditNoteRequest {
  originalInvoiceId: string;
  correctionReason: string;
  correctionType: 'price' | 'quantity' | 'return' | 'cancellation';
  correctedItems?: Array<{
    itemId: string;
    originalQuantity: number;
    correctedQuantity: number;
    originalUnitPrice: number;
    correctedUnitPrice: number;
    reason: string;
  }>;
  totalCorrectionAmount: number;
  issueDate?: Date;
  notes?: string;
  autoProcessRefund?: boolean;
  refundMethod?: 'stripe' | 'bank_transfer' | 'account_credit';
}

export interface CreditNoteResult {
  creditNoteId: string;
  creditNoteNumber: string;
  status: 'draft' | 'issued' | 'applied' | 'cancelled';
  originalInvoiceNumber: string;
  correctionAmount: number;
  vatCorrectionAmount: number;
  issueDate: Date;
  relatedRefundId?: string;
  createdAt: Date;
}

export interface RefundPolicy {
  serviceType: 'beauty' | 'fitness' | 'lifestyle';
  cancellationPeriodHours: number;
  refundPercentage: number;
  cancellationFeeAmount?: number;
  conditions: string[];
  exceptions: Array<{
    condition: string;
    refundPercentage: number;
    explanation: string;
  }>;
}

/**
 * Refund Policy Manager
 * Manages refund policies for different service types
 */
export class RefundPolicyManager {
  private static policies: Map<string, RefundPolicy> = new Map([
    ['beauty', {
      serviceType: 'beauty',
      cancellationPeriodHours: 48,
      refundPercentage: 100,
      conditions: [
        'Pełny zwrot kosztów przy odwołaniu 48h przed wizytą',
        '50% zwrotu przy odwołaniu 24-48h przed wizytą',
        'Brak zwrotu przy odwołaniu poniżej 24h przed wizytą'
      ],
      exceptions: [
        {
          condition: 'Lekarskie zwolnienie',
          refundPercentage: 100,
          explanation: 'Pełny zwrot przy przedstawieniu zwolnienia lekarskiego'
        },
        {
          condition: 'Siła wyższa',
          refundPercentage: 100,
          explanation: 'Pełny zwrot w przypadku zdarzeń losowych'
        }
      ]
    }],
    ['fitness', {
      serviceType: 'fitness',
      cancellationPeriodHours: 24,
      refundPercentage: 100,
      conditions: [
        'Pełny zwrot kosztów przy odwołaniu 24h przed treningiem',
        'Brak zwrotu przy odwołaniu poniżej 24h przed treningiem'
      ],
      exceptions: [
        {
          condition: 'Karnet jednorazowy',
          refundPercentage: 0,
          explanation: 'Bilety jednorazowe nie podlegają zwrotowi'
        },
        {
          condition: 'Lekarskie zwolnienie',
          refundPercentage: 100,
          explanation: 'Pełny zwrot przy przedstawieniu zwolnienia lekarskiego'
        }
      ]
    }]
  ]);

  static getPolicy(serviceType: string): RefundPolicy | null {
    return this.policies.get(serviceType) || null;
  }

  static calculateRefundAmount(
    serviceType: string,
    originalAmount: number,
    cancellationHours: number,
    hasMedicalCertificate: boolean = false,
    isForceMajeure: boolean = false
  ): { refundAmount: number; refundPercentage: number; policy: RefundPolicy } {
    const policy = this.getPolicy(serviceType);
    if (!policy) {
      return {
        refundAmount: 0,
        refundPercentage: 0,
        policy: {
          serviceType: 'beauty',
          cancellationPeriodHours: 48,
          refundPercentage: 100,
          conditions: [],
          exceptions: []
        }
      };
    }

    let refundPercentage = 0;

    // Check exceptions first
    if (hasMedicalCertificate || isForceMajeure) {
      refundPercentage = 100;
    } else if (cancellationHours >= policy.cancellationPeriodHours) {
      refundPercentage = policy.refundPercentage;
    } else if (cancellationHours >= policy.cancellationPeriodHours / 2) {
      refundPercentage = policy.refundPercentage / 2;
    } else {
      refundPercentage = 0;
    }

    const refundAmount = Math.round(originalAmount * (refundPercentage / 100) * 100) / 100;

    return {
      refundAmount,
      refundPercentage,
      policy
    };
  }

  static updatePolicy(policy: RefundPolicy): void {
    this.policies.set(policy.serviceType, policy);
  }
}

/**
 * Refund Manager
 * Main service for processing refunds and generating credit notes
 */
export class RefundManager {
  private static readonly REFUND_PREFIX = 'RF';
  private static readonly CREDIT_NOTE_PREFIX = 'CN';

  /**
   * Process a refund request
   */
  static async processRefund(request: RefundRequest): Promise<RefundResult> {
    try {
      logger.info('Processing refund request', {
        invoiceId: request.invoiceId,
        amount: request.refundAmount,
        type: request.refundType
      });

      // Validate request
      await this.validateRefundRequest(request);

      // Generate refund number
      const refundNumber = await this.generateRefundNumber();

      // Create refund record
      const refundId = await this.createRefundRecord(request, refundNumber);

      // Process refund based on method
      const processResult = await this.processRefundByMethod(request, refundId);

      // Generate credit note if applicable
      let creditNoteResult: CreditNoteResult | undefined;
      if (this.shouldGenerateCreditNote(request)) {
        creditNoteResult = await this.generateCreditNoteForRefund(request, refundId);
      }

      const result: RefundResult = {
        refundId,
        refundNumber,
        status: processResult.status,
        refundAmount: request.refundAmount,
        refundMethod: request.refundMethod,
        refundReference: processResult.reference,
        externalRefundId: processResult.externalId,
        processedAt: processResult.processedAt,
        estimatedCompletionDate: processResult.estimatedCompletionDate,
        creditNoteId: creditNoteResult?.creditNoteId,
        creditNoteNumber: creditNoteResult?.creditNoteNumber,
        failureReason: processResult.failureReason,
        createdAt: new Date()
      };

      // Update refund record with results
      await this.updateRefundRecord(refundId, result);

      logger.info('Refund processed successfully', {
        refundId,
        refundNumber,
        status: result.status
      });

      return result;

    } catch (error) {
      logger.error('Refund processing failed:', error);
      throw new Error(`Failed to process refund: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate credit note
   */
  static async generateCreditNote(request: CreditNoteRequest): Promise<CreditNoteResult> {
    try {
      logger.info('Generating credit note', {
        originalInvoiceId: request.originalInvoiceId,
        correctionAmount: request.totalCorrectionAmount
      });

      // Validate request
      await this.validateCreditNoteRequest(request);

      // Get original invoice
      const originalInvoice = await this.getOriginalInvoice(request.originalInvoiceId);
      if (!originalInvoice) {
        throw new Error('Original invoice not found');
      }

      // Generate credit note number
      const creditNoteNumber = await this.generateCreditNoteNumber();

      // Create credit note record
      const creditNoteId = await this.createCreditNoteRecord(request, creditNoteNumber, originalInvoice);

      // Process related refund if auto-process is enabled
      let relatedRefundId: string | undefined;
      if (request.autoProcessRefund && request.totalCorrectionAmount > 0) {
        const refundRequest: RefundRequest = {
          invoiceId: request.originalInvoiceId,
          refundAmount: request.totalCorrectionAmount,
          refundReason: request.correctionReason,
          refundType: 'partial',
          refundMethod: request.refundMethod || 'bank_transfer',
          customerContactInfo: {
            name: originalInvoice.customer_name,
            email: originalInvoice.customer_email || '',
            phone: ''
          },
          approvedBy: 'system'
        };

        const refundResult = await this.processRefund(refundRequest);
        relatedRefundId = refundResult.refundId;
      }

      const result: CreditNoteResult = {
        creditNoteId,
        creditNoteNumber,
        status: 'issued',
        originalInvoiceNumber: originalInvoice.invoice_number,
        correctionAmount: request.totalCorrectionAmount,
        vatCorrectionAmount: request.totalCorrectionAmount * 0.23, // Simplified calculation
        issueDate: request.issueDate || new Date(),
        relatedRefundId,
        createdAt: new Date()
      };

      // Update credit note record
      await this.updateCreditNoteRecord(creditNoteId, result);

      logger.info('Credit note generated successfully', {
        creditNoteId,
        creditNoteNumber
      });

      return result;

    } catch (error) {
      logger.error('Credit note generation failed:', error);
      throw new Error(`Failed to generate credit note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get refund status
   */
  static async getRefundStatus(refundId: string): Promise<RefundResult | null> {
    try {
      const { data, error } = await supabase
        .from('refunds')
        .select('*')
        .eq('id', refundId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        refundId: data.id,
        refundNumber: data.refund_reference || 'RF-' + data.id,
        status: data.status as any,
        refundAmount: data.refund_amount,
        refundMethod: data.refund_method,
        refundReference: data.refund_reference,
        externalRefundId: data.external_refund_id,
        processedAt: data.completed_at ? new Date(data.completed_at) : undefined,
        failureReason: data.failure_reason,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      logger.error('Failed to get refund status:', error);
      return null;
    }
  }

  /**
   * Cancel refund
   */
  static async cancelRefund(refundId: string, reason: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('refunds')
        .update({
          status: 'cancelled',
          failure_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', refundId)
        .eq('status', 'initiated'); // Can only cancel initiated refunds

      if (error) {
        throw new Error(`Failed to cancel refund: ${error.message}`);
      }

      logger.info('Refund cancelled', { refundId, reason });
      return true;

    } catch (error) {
      logger.error('Failed to cancel refund:', error);
      return false;
    }
  }

  /**
   * Validate refund request
   */
  private static async validateRefundRequest(request: RefundRequest): Promise<void> {
    // Check if invoice exists
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', request.invoiceId)
      .single();

    if (error || !invoice) {
      throw new Error('Invoice not found');
    }

    // Check if refund amount is valid
    if (request.refundAmount <= 0 || request.refundAmount > invoice.total_amount) {
      throw new Error('Invalid refund amount');
    }

    // Check if there's already a refund for this invoice
    const { data: existingRefund } = await supabase
      .from('refunds')
      .select('*')
      .eq('invoice_id', request.invoiceId)
      .eq('status', 'completed')
      .single();

    if (existingRefund) {
      throw new Error('Refund already processed for this invoice');
    }
  }

  /**
   * Validate credit note request
   */
  private static async validateCreditNoteRequest(request: CreditNoteRequest): Promise<void> {
    // Check if original invoice exists
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', request.originalInvoiceId)
      .single();

    if (error || !invoice) {
      throw new Error('Original invoice not found');
    }

    // Validate correction amount
    if (request.totalCorrectionAmount <= 0 || request.totalCorrectionAmount > invoice.total_amount) {
      throw new Error('Invalid correction amount');
    }
  }

  /**
   * Generate refund number
   */
  private static async generateRefundNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    return `${this.REFUND_PREFIX}/${year}/${timestamp}`;
  }

  /**
   * Generate credit note number
   */
  private static async generateCreditNoteNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    return `${this.CREDIT_NOTE_PREFIX}/${year}/${timestamp}`;
  }

  /**
   * Create refund record
   */
  private static async createRefundRecord(
    request: RefundRequest,
    refundNumber: string
  ): Promise<string> {
    const { data, error } = await supabase
      .from('refunds')
      .insert({
        invoice_id: request.invoiceId,
        booking_id: request.bookingId,
        refund_amount: request.refundAmount,
        refund_reason: request.refundReason,
        refund_type: request.refundType,
        refund_method: request.refundMethod,
        refund_reference: refundNumber,
        status: 'initiated',
        initiated_at: new Date().toISOString(),
        metadata: {
          customerContactInfo: request.customerContactInfo,
          internalNotes: request.internalNotes,
          approvedBy: request.approvedBy,
          priority: request.priority
        }
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create refund record: ${error?.message}`);
    }

    return data.id;
  }

  /**
   * Create credit note record
   */
  private static async createCreditNoteRecord(
    request: CreditNoteRequest,
    creditNoteNumber: string,
    originalInvoice: any
  ): Promise<string> {
    const { data, error } = await supabase
      .from('credit_notes')
      .insert({
        original_invoice_id: request.originalInvoiceId,
        credit_note_number: creditNoteNumber,
        issue_date: (request.issueDate || new Date()).toISOString().split('T')[0],
        correction_reason: request.correctionReason,
        correction_type: request.correctionType,
        total_reduction_amount: request.totalCorrectionAmount,
        vat_reduction_amount: request.totalCorrectionAmount * 0.23, // Simplified
        status: 'issued',
        metadata: {
          correctedItems: request.correctedItems,
          notes: request.notes,
          autoProcessRefund: request.autoProcessRefund,
          refundMethod: request.refundMethod
        }
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create credit note record: ${error?.message}`);
    }

    return data.id;
  }

  /**
   * Process refund by method
   */
  private static async processRefundByMethod(
    request: RefundRequest,
    refundId: string
  ): Promise<{
    status: string;
    reference?: string;
    externalId?: string;
    processedAt?: Date;
    estimatedCompletionDate?: Date;
    failureReason?: string;
  }> {
    switch (request.refundMethod) {
      case 'stripe':
        return await this.processStripeRefund(request, refundId);
      case 'bank_transfer':
        return await this.processBankTransferRefund(request, refundId);
      case 'cash':
        return await this.processCashRefund(request, refundId);
      case 'account_credit':
        return await this.processAccountCreditRefund(request, refundId);
      default:
        throw new Error(`Unsupported refund method: ${request.refundMethod}`);
    }
  }

  /**
   * Process Stripe refund
   */
  private static async processStripeRefund(
    request: RefundRequest,
    refundId: string
  ): Promise<any> {
    try {
      // In a real implementation, you would use Stripe SDK
      // For now, simulate the process

      const stripeRefundId = `re_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        status: 'completed',
        reference: stripeRefundId,
        externalId: stripeRefundId,
        processedAt: new Date()
      };

    } catch (error) {
      return {
        status: 'failed',
        failureReason: error instanceof Error ? error.message : 'Stripe processing failed'
      };
    }
  }

  /**
   * Process bank transfer refund
   */
  private static async processBankTransferRefund(
    request: RefundRequest,
    refundId: string
  ): Promise<any> {
    try {
      // Bank transfers are processed manually
      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() + 3); // 3 business days

      return {
        status: 'processing',
        reference: `BT-${Date.now()}`,
        estimatedCompletionDate: estimatedDate
      };

    } catch (error) {
      return {
        status: 'failed',
        failureReason: error instanceof Error ? error.message : 'Bank transfer setup failed'
      };
    }
  }

  /**
   * Process cash refund
   */
  private static async processCashRefund(
    request: RefundRequest,
    refundId: string
  ): Promise<any> {
    try {
      // Cash refunds are processed at the location
      return {
        status: 'processing',
        reference: `CASH-${Date.now()}`,
        estimatedCompletionDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };

    } catch (error) {
      return {
        status: 'failed',
        failureReason: error instanceof Error ? error.message : 'Cash refund setup failed'
      };
    }
  }

  /**
   * Process account credit refund
   */
  private static async processAccountCreditRefund(
    request: RefundRequest,
    refundId: string
  ): Promise<any> {
    try {
      // Account credits are processed immediately
      return {
        status: 'completed',
        reference: `CREDIT-${Date.now()}`,
        processedAt: new Date()
      };

    } catch (error) {
      return {
        status: 'failed',
        failureReason: error instanceof Error ? error.message : 'Account credit processing failed'
      };
    }
  }

  /**
   * Check if credit note should be generated
   */
  private static shouldGenerateCreditNote(request: RefundRequest): boolean {
    // Generate credit note for all refunds except cash refunds
    return request.refundMethod !== 'cash' && request.refundType !== 'cancellation_fee';
  }

  /**
   * Generate credit note for refund
   */
  private static async generateCreditNoteForRefund(
    request: RefundRequest,
    refundId: string
  ): Promise<CreditNoteResult> {
    const creditNoteRequest: CreditNoteRequest = {
      originalInvoiceId: request.invoiceId,
      correctionReason: request.refundReason,
      correctionType: request.refundType === 'cancellation_fee' ? 'cancellation' : 'return',
      totalCorrectionAmount: request.refundAmount,
      autoProcessRefund: false, // Already processed
      notes: `Automatycznie wygenerowana faktura korygująca dla zwrotu ${request.refundMethod}`
    };

    return await this.generateCreditNote(creditNoteRequest);
  }

  /**
   * Get original invoice
   */
  private static async getOriginalInvoice(invoiceId: string): Promise<any> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (error || !data) {
      throw new Error('Original invoice not found');
    }

    return data;
  }

  /**
   * Update refund record
   */
  private static async updateRefundRecord(refundId: string, result: RefundResult): Promise<void> {
    const { error } = await supabase
      .from('refunds')
      .update({
        status: result.status,
        refund_reference: result.refundReference,
        external_refund_id: result.externalRefundId,
        completed_at: result.processedAt?.toISOString(),
        failure_reason: result.failureReason,
        updated_at: new Date().toISOString()
      })
      .eq('id', refundId);

    if (error) {
      logger.error('Failed to update refund record:', error);
    }
  }

  /**
   * Update credit note record
   */
  private static async updateCreditNoteRecord(
    creditNoteId: string,
    result: CreditNoteResult
  ): Promise<void> {
    const { error } = await supabase
      .from('credit_notes')
      .update({
        status: result.status,
        applied_at: result.createdAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', creditNoteId);

    if (error) {
      logger.error('Failed to update credit note record:', error);
    }
  }
}

/**
 * React hook for refund management
 */
export function useRefundManager() {
  const processRefund = async (request: RefundRequest) => {
    return await RefundManager.processRefund(request);
  };

  const generateCreditNote = async (request: CreditNoteRequest) => {
    return await RefundManager.generateCreditNote(request);
  };

  const getRefundStatus = async (refundId: string) => {
    return await RefundManager.getRefundStatus(refundId);
  };

  const cancelRefund = async (refundId: string, reason: string) => {
    return await RefundManager.cancelRefund(refundId, reason);
  };

  const calculateRefundAmount = (
    serviceType: string,
    originalAmount: number,
    cancellationHours: number,
    hasMedicalCertificate?: boolean,
    isForceMajeure?: boolean
  ) => {
    return RefundPolicyManager.calculateRefundAmount(
      serviceType,
      originalAmount,
      cancellationHours,
      hasMedicalCertificate,
      isForceMajeure
    );
  };

  return {
    processRefund,
    generateCreditNote,
    getRefundStatus,
    cancelRefund,
    calculateRefundAmount
  };
}