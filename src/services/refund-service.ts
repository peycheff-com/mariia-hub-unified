/**
 * Refund Service
 *
 * Comprehensive refund and dispute management:
 * - Automated refund processing
 * - Partial refund support
 * - Dispute management workflow
 * - Chargeback handling
 * - Customer service integration
 * - Polish refund regulations compliance
 */

import { createClient } from '@supabase/supabase-js';

interface RefundRequest {
  id: string;
  paymentIntentId: string;
  customerId: string;
  amount: number;
  currency: string;
  reason: RefundReason;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed' | 'failed' | 'cancelled';
  type: 'full' | 'partial';
  requestedAt: string;
  processedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  processor?: string;
  refundId?: string;
  failureReason?: string;
  metadata: Record<string, any>;
  customerNotifications: NotificationRecord[];
  internalNotes: RefundNote[];
}

interface RefundReason {
  code: string;
  name: string;
  description: string;
  category: 'customer' | 'service' | 'technical' | 'fraud' | 'compliance';
  requiresApproval: boolean;
  processingTime: number; // in days
  documentationRequired: string[];
  automaticEligibility: boolean;
}

interface DisputeCase {
  id: string;
  paymentIntentId: string;
  customerId: string;
  disputeId: string; // Provider dispute ID
  amount: number;
  currency: string;
  reason: string;
  status: 'needs_response' | 'under_review' | 'won' | 'lost' | 'resolved';
  evidence: DisputeEvidence[];
  deadlines: DisputeDeadline[];
  communications: DisputeCommunication[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  outcome?: DisputeOutcome;
}

interface DisputeEvidence {
  id: string;
  type: 'document' | 'text' | 'url' | 'screenshot';
  name: string;
  description?: string;
  fileUrl?: string;
  content?: string;
  submittedAt: string;
  submittedBy: string;
}

interface DisputeDeadline {
  type: 'evidence_submission' | 'response' | 'appeal';
  date: string;
  description: string;
  completed: boolean;
  completedAt?: string;
}

interface DisputeCommunication {
  id: string;
  type: 'message' | 'note' | 'evidence_request';
  from: 'customer' | 'provider' | 'merchant';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface DisputeOutcome {
  winner: 'merchant' | 'customer';
  amount?: number;
  reason: string;
  appealDeadline?: string;
}

interface RefundPolicy {
  id: string;
  name: string;
  serviceType: string;
  serviceId?: string;
  timeframes: RefundTimeframe[];
  conditions: RefundCondition[];
  exclusions: string[];
  processingFees: {
    type: 'percentage' | 'fixed' | 'none';
    value: number;
    currency: string;
    minFee?: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RefundTimeframe {
  periodBeforeService: number; // hours before service
  refundPercentage: number;
  condition?: string;
}

interface RefundCondition {
  type: 'documentation' | 'service_status' | 'customer_eligibility' | 'time_based';
  requirement: string;
  mandatory: boolean;
}

interface RefundStatistics {
  totalRefunds: number;
  totalAmount: number;
  averageProcessingTime: number;
  approvalRate: number;
  refundReasons: Record<string, { count: number; amount: number }>;
  monthlyTrend: { month: string; count: number; amount: number }[];
  providerPerformance: Record<string, {
    totalRefunds: number;
    successRate: number;
    averageProcessingTime: number;
  }>;
}

interface NotificationRecord {
  type: 'email' | 'sms' | 'push';
  recipient: string;
  template: string;
  sentAt: string;
  status: 'sent' | 'delivered' | 'failed';
  error?: string;
}

interface RefundNote {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  isInternal: boolean;
  category?: 'processing' | 'approval' | 'communication' | 'investigation';
}

interface ChargebackCase {
  id: string;
  paymentIntentId: string;
  customerId: string;
  chargebackId: string;
  amount: number;
  currency: string;
  reason: string;
  stage: 'notification' | 'first_presentation' | 'second_presentation' | 'arbitration' | 'resolved';
  status: 'pending' | 'under_review' | 'won' | 'lost' | 'settled';
  documents: ChargebackDocument[];
  timeline: ChargebackEvent[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  settlementAmount?: number;
}

interface ChargebackDocument {
  id: string;
  type: 'evidence' | 'correspondence' | 'proof_of_service' | 'customer_communication';
  name: string;
  description: string;
  fileUrl: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface ChargebackEvent {
  type: 'notification_received' | 'evidence_submitted' | 'decision_received' | 'appeal_filed';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export class RefundService {
  private supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
  );

  private refundReasons: RefundReason[] = [
    {
      code: 'DUPLICATE',
      name: 'Podwójna płatność',
      description: 'Klient został obciążony dwukrotnie za tę samą usługę',
      category: 'technical',
      requiresApproval: false,
      processingTime: 1,
      documentationRequired: ['potwierdzenie płatności'],
      automaticEligibility: true
    },
    {
      code: 'FRAUDULENT',
      name: 'Transakcja oszukańcza',
      description: 'Płatność nie została autoryzowana przez właściciela karty',
      category: 'fraud',
      requiresApproval: true,
      processingTime: 5,
      documentationRequired: ['oświadczenie klienta', 'dowód tożsamości'],
      automaticEligibility: false
    },
    {
      code: 'SERVICE_CANCELLED',
      name: 'Odwołana usługa',
      description: 'Usługa została odwołana zgodnie z regulaminem',
      category: 'customer',
      requiresApproval: false,
      processingTime: 2,
      documentationRequired: ['potwierdzenie odwołania'],
      automaticEligibility: true
    },
    {
      code: 'SERVICE_NOT_PROVIDED',
      name: 'Usługa niewykonana',
      description: 'Zapłacona usługa nie została wykonana',
      category: 'service',
      requiresApproval: true,
      processingTime: 3,
      documentationRequired: ['komunikacja z klientem'],
      automaticEligibility: false
    },
    {
      code: 'QUALITY_ISSUE',
      name: 'Problem z jakością',
      description: 'Klient zgłasza problemy z jakością usługi',
      category: 'service',
      requiresApproval: true,
      processingTime: 5,
      documentationRequired: ['dokumentacja problemu', 'zdjęcia'],
      automaticEligibility: false
    },
    {
      code: 'CUSTOMER_REQUEST',
      name: 'Prośba klienta',
      description: 'Klient prosi o zwrot z innych przyczyn',
      category: 'customer',
      requiresApproval: true,
      processingTime: 3,
      documentationRequired: ['uzasadnienie prośby'],
      automaticEligibility: false
    },
    {
      code: 'TECHNICAL_ERROR',
      name: 'Błąd techniczny',
      description: 'Błąd systemu spowodował problem z płatnością',
      category: 'technical',
      requiresApproval: false,
      processingTime: 1,
      documentationRequired: ['logi systemowe'],
      automaticEligibility: true
    },
    {
      code: 'BOOKING_ERROR',
      name: 'Błąd rezerwacji',
      description: 'Błąd w systemie rezerwacji',
      category: 'technical',
      requiresApproval: false,
      processingTime: 2,
      documentationRequired: ['szczegóły rezerwacji'],
      automaticEligibility: true
    }
  ];

  constructor() {
    this.initializeRefundPolicies();
  }

  private async initializeRefundPolicies(): Promise<void> {
    // Check if default policies exist
    const { data: existingPolicies } = await this.supabase
      .from('refund_policies')
      .select('id')
      .limit(1);

    if (!existingPolicies || existingPolicies.length === 0) {
      await this.createDefaultRefundPolicies();
    }
  }

  private async createDefaultRefundPolicies(): Promise<void> {
    const defaultPolicies: Omit<RefundPolicy, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Standardowa polityka zwrotów - Usługi beauty',
        serviceType: 'beauty',
        timeframes: [
          { periodBeforeService: 72, refundPercentage: 100, condition: 'Pełny zwrot przy odwołaniu 72h przed' },
          { periodBeforeService: 48, refundPercentage: 75, condition: '75% zwrotu przy odwołaniu 48h przed' },
          { periodBeforeService: 24, refundPercentage: 50, condition: '50% zwrotu przy odwołaniu 24h przed' },
          { periodBeforeService: 0, refundPercentage: 0, condition: 'Brak zwrotu w dniu usługi' }
        ],
        conditions: [
          { type: 'time_based', requirement: 'Odwołanie przed czasem określonym w polityce', mandatory: true },
          { type: 'documentation', requirement: 'Potwierdzenie odwołania', mandatory: false }
        ],
        exclusions: ['Usługi już rozpoczęte', 'Zabiegi inwazyjne po rozpoczęciu', 'Vouchery i karty podarunkowe'],
        processingFees: {
          type: 'fixed',
          value: 10,
          currency: 'PLN',
          minFee: 0
        },
        isActive: true
      },
      {
        name: 'Standardowa polityka zwrotów - Usługi fitness',
        serviceType: 'fitness',
        timeframes: [
          { periodBeforeService: 48, refundPercentage: 100, condition: 'Pełny zwrot przy odwołaniu 48h przed' },
          { periodBeforeService: 24, refundPercentage: 80, condition: '80% zwrotu przy odwołaniu 24h przed' },
          { periodBeforeService: 2, refundPercentage: 50, condition: '50% zwrotu przy odwołaniu 2h przed' },
          { periodBeforeService: 0, refundPercentage: 0, condition: 'Brak zwrotu w czasie zajęć' }
        ],
        conditions: [
          { type: 'time_based', requirement: 'Odwołanie przed czasem określonym w polityce', mandatory: true }
        ],
        exclusions: ['Zajęcia już rozpoczęte', 'Karnety czasowe po rozpoczęciu okresu'],
        processingFees: {
          type: 'percentage',
          value: 5,
          currency: 'PLN'
        },
        isActive: true
      },
      {
        name: 'Polityka zwrotów - Vouchery',
        serviceType: 'voucher',
        timeframes: [
          { periodBeforeService: 30 * 24, refundPercentage: 90, condition: '90% zwrotu do 30 dni przed ważnością' },
          { periodBeforeService: 14 * 24, refundPercentage: 70, condition: '70% zwrotu do 14 dni przed ważnością' },
          { periodBeforeService: 7 * 24, refundPercentage: 50, condition: '50% zwrotu do 7 dni przed ważnością' },
          { periodBeforeService: 0, refundPercentage: 0, condition: 'Brak zwrotu dla wygasłych voucherów' }
        ],
        conditions: [
          { type: 'time_based', requirement: 'Voucher musi być ważny', mandatory: true },
          { type: 'documentation', requirement: 'Kod vouchera', mandatory: true }
        ],
        exclusions: ['Vouchery wykorzystane', 'Vouchery wygasłe'],
        processingFees: {
          type: 'fixed',
          value: 5,
          currency: 'PLN'
        },
        isActive: true
      }
    ];

    for (const policy of defaultPolicies) {
      await this.supabase
        .from('refund_policies')
        .insert({
          ...policy,
          created_at: new Date(),
          updated_at: new Date()
        });
    }
  }

  /**
   * Request a refund
   */
  async requestRefund(params: {
    paymentIntentId: string;
    customerId: string;
    amount?: number; // If not specified, full refund
    reasonCode: string;
    description?: string;
    documentation?: { type: string; file: File }[];
    metadata?: Record<string, any>;
  }): Promise<RefundRequest> {
    try {
      // Get payment details
      const paymentDetails = await this.getPaymentDetails(params.paymentIntentId);
      if (!paymentDetails) {
        throw new Error('Payment not found');
      }

      // Validate refund request
      const validation = await this.validateRefundRequest(params, paymentDetails);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.reason}`);
      }

      // Get refund reason details
      const refundReason = this.refundReasons.find(r => r.code === params.reasonCode);
      if (!refundReason) {
        throw new Error('Invalid refund reason');
      }

      // Calculate refund amount
      const refundAmount = params.amount || paymentDetails.amount;

      // Determine if automatic approval
      const automaticApproval = refundReason.automaticEligibility &&
                              validation.eligibilityPercentage === 100;

      const refundRequest: Omit<RefundRequest, 'id'> = {
        paymentIntentId: params.paymentIntentId,
        customerId: params.customerId,
        amount: refundAmount,
        currency: paymentDetails.currency,
        reason: refundReason,
        description: params.description,
        status: automaticApproval ? 'approved' : 'pending',
        type: refundAmount === paymentDetails.amount ? 'full' : 'partial',
        requestedAt: new Date().toISOString(),
        approvedAt: automaticApproval ? new Date().toISOString() : undefined,
        approvedBy: automaticApproval ? 'system' : undefined,
        metadata: {
          ...params.metadata,
          eligibilityPercentage: validation.eligibilityPercentage,
          appliedPolicy: validation.appliedPolicy,
          originalAmount: paymentDetails.amount
        },
        customerNotifications: [],
        internalNotes: []
      };

      // Store refund request
      const { data: createdRequest, error } = await this.supabase
        .from('refund_requests')
        .insert(refundRequest)
        .select()
        .single();

      if (error || !createdRequest) {
        throw new Error(`Failed to create refund request: ${error?.message}`);
      }

      // Handle documentation if provided
      if (params.documentation && params.documentation.length > 0) {
        await this.uploadRefundDocumentation(createdRequest.id, params.documentation);
      }

      // Send notifications
      await this.sendRefundNotifications(createdRequest.id, 'requested');

      // Process automatic refunds
      if (automaticApproval) {
        await this.processRefund(createdRequest.id);
      }

      return createdRequest as RefundRequest;

    } catch (error) {
      console.error('Error creating refund request:', error);
      throw error;
    }
  }

  /**
   * Approve refund request
   */
  async approveRefund(
    refundRequestId: string,
    approvedBy: string,
    notes?: string,
    customAmount?: number
  ): Promise<RefundRequest> {
    try {
      // Get refund request
      const refundRequest = await this.getRefundRequest(refundRequestId);
      if (!refundRequest) {
        throw new Error('Refund request not found');
      }

      if (refundRequest.status !== 'pending') {
        throw new Error('Refund request is not in pending status');
      }

      // Update refund request
      const updateData: any = {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy,
        updatedAt: new Date()
      };

      if (customAmount && customAmount !== refundRequest.amount) {
        updateData.amount = customAmount;
        updateData.type = customAmount === (refundRequest.metadata?.originalAmount || 0) ? 'full' : 'partial';
      }

      const { data: updatedRequest, error } = await this.supabase
        .from('refund_requests')
        .update(updateData)
        .eq('id', refundRequestId)
        .select()
        .single();

      if (error || !updatedRequest) {
        throw new Error(`Failed to approve refund request: ${error?.message}`);
      }

      // Add internal note
      if (notes) {
        await this.addRefundNote(refundRequestId, {
          author: approvedBy,
          content: notes,
          isInternal: true,
          category: 'approval'
        });
      }

      // Send notifications
      await this.sendRefundNotifications(refundRequestId, 'approved');

      // Process the refund
      await this.processRefund(refundRequestId);

      return updatedRequest as RefundRequest;

    } catch (error) {
      console.error('Error approving refund request:', error);
      throw error;
    }
  }

  /**
   * Reject refund request
   */
  async rejectRefund(
    refundRequestId: string,
    rejectedBy: string,
    reason: string,
    notes?: string
  ): Promise<RefundRequest> {
    try {
      const refundRequest = await this.getRefundRequest(refundRequestId);
      if (!refundRequest) {
        throw new Error('Refund request not found');
      }

      if (refundRequest.status !== 'pending') {
        throw new Error('Refund request is not in pending status');
      }

      // Update refund request
      const { data: updatedRequest, error } = await this.supabase
        .from('refund_requests')
        .update({
          status: 'rejected',
          approvedBy: rejectedBy,
          metadata: {
            ...refundRequest.metadata,
            rejectionReason: reason,
            rejectedAt: new Date().toISOString()
          },
          updatedAt: new Date()
        })
        .eq('id', refundRequestId)
        .select()
        .single();

      if (error || !updatedRequest) {
        throw new Error(`Failed to reject refund request: ${error?.message}`);
      }

      // Add internal note
      await this.addRefundNote(refundRequestId, {
        author: rejectedBy,
        content: `Rejected: ${reason}${notes ? `\n\n${notes}` : ''}`,
        isInternal: true,
        category: 'approval'
      });

      // Send notifications
      await this.sendRefundNotifications(refundRequestId, 'rejected', { rejectionReason: reason });

      return updatedRequest as RefundRequest;

    } catch (error) {
      console.error('Error rejecting refund request:', error);
      throw error;
    }
  }

  /**
   * Process refund (send to payment provider)
   */
  async processRefund(refundRequestId: string): Promise<void> {
    try {
      const refundRequest = await this.getRefundRequest(refundRequestId);
      if (!refundRequest) {
        throw new Error('Refund request not found');
      }

      if (refundRequest.status !== 'approved') {
        throw new Error('Refund request must be approved before processing');
      }

      // Update status to processing
      await this.supabase
        .from('refund_requests')
        .update({
          status: 'processed',
          processedAt: new Date(),
          updatedAt: new Date()
        })
        .eq('id', refundRequestId);

      // Get payment provider and process refund
      const paymentDetails = await this.getPaymentDetails(refundRequest.paymentIntentId);
      if (paymentDetails?.provider) {
        // This would integrate with the payment factory
        console.log(`Processing refund for ${refundRequest.paymentIntentId} through provider ${paymentDetails.provider}`);

        // Mock refund processing
        const mockRefundId = `refund_${Date.now()}`;

        await this.supabase
          .from('refund_requests')
          .update({
            refundId: mockRefundId,
            processor: paymentDetails.provider,
            metadata: {
              ...refundRequest.metadata,
              providerRefundId: mockRefundId
            },
            updatedAt: new Date()
          })
          .eq('id', refundRequestId);
      }

      // Send notifications
      await this.sendRefundNotifications(refundRequestId, 'processed');

    } catch (error) {
      console.error('Error processing refund:', error);

      // Update status to failed
      await this.supabase
        .from('refund_requests')
        .update({
          status: 'failed',
          failureReason: error instanceof Error ? error.message : 'Unknown error',
          updatedAt: new Date()
        })
        .eq('id', refundRequestId);

      throw error;
    }
  }

  /**
   * Handle dispute from payment provider
   */
  async handleDispute(disputeData: {
    paymentIntentId: string;
    disputeId: string;
    amount: number;
    currency: string;
    reason: string;
    evidenceDueBy: string;
    provider: string;
  }): Promise<DisputeCase> {
    try {
      // Create dispute case
      const disputeCase: Omit<DisputeCase, 'id'> = {
        paymentIntentId: disputeData.paymentIntentId,
        customerId: '', // Would fetch from payment
        disputeId: disputeData.disputeId,
        amount: disputeData.amount,
        currency: disputeData.currency,
        reason: disputeData.reason,
        status: 'needs_response',
        evidence: [],
        deadlines: [
          {
            type: 'evidence_submission',
            date: disputeData.evidenceDueBy,
            description: 'Termin dostarczenia dowodów',
            completed: false
          }
        ],
        communications: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { data: createdDispute, error } = await this.supabase
        .from('dispute_cases')
        .insert(disputeCase)
        .select()
        .single();

      if (error || !createdDispute) {
        throw new Error(`Failed to create dispute case: ${error?.message}`);
      }

      // Send internal notification
      await this.sendDisputeNotification(createdDispute.id, 'created');

      return createdDispute as DisputeCase;

    } catch (error) {
      console.error('Error handling dispute:', error);
      throw error;
    }
  }

  /**
   * Submit evidence for dispute
   */
  async submitDisputeEvidence(
    disputeId: string,
    evidence: {
      type: 'document' | 'text' | 'url' | 'screenshot';
      name: string;
      description?: string;
      content?: string;
      file?: File;
    },
    submittedBy: string
  ): Promise<void> {
    try {
      const dispute = await this.getDisputeCase(disputeId);
      if (!dispute) {
        throw new Error('Dispute case not found');
      }

      // Upload file if provided
      let fileUrl: string | undefined;
      if (evidence.file) {
        fileUrl = await this.uploadDisputeFile(evidence.file);
      }

      // Add evidence
      const evidenceRecord: Omit<DisputeEvidence, 'id'> = {
        type: evidence.type,
        name: evidence.name,
        description: evidence.description,
        fileUrl,
        content: evidence.content,
        submittedAt: new Date().toISOString(),
        submittedBy
      };

      await this.supabase
        .from('dispute_evidence')
        .insert(evidenceRecord);

      // Update dispute status
      await this.supabase
        .from('dispute_cases')
        .update({
          status: 'under_review',
          updatedAt: new Date()
        })
        .eq('id', disputeId);

    } catch (error) {
      console.error('Error submitting dispute evidence:', error);
      throw error;
    }
  }

  /**
   * Handle chargeback
   */
  async handleChargeback(chargebackData: {
    paymentIntentId: string;
    chargebackId: string;
    amount: number;
    currency: string;
    reason: string;
    stage: string;
    provider: string;
  }): Promise<ChargebackCase> {
    try {
      const chargebackCase: Omit<ChargebackCase, 'id'> = {
        paymentIntentId: chargebackData.paymentIntentId,
        customerId: '', // Would fetch from payment
        chargebackId: chargebackData.chargebackId,
        amount: chargebackData.amount,
        currency: chargebackData.currency,
        reason: chargebackData.reason,
        stage: chargebackData.stage as any,
        status: 'pending',
        documents: [],
        timeline: [{
          type: 'notification_received',
          description: 'Chargeback notification received',
          timestamp: new Date().toISOString()
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { data: createdCase, error } = await this.supabase
        .from('chargeback_cases')
        .insert(chargebackCase)
        .select()
        .single();

      if (error || !createdCase) {
        throw new Error(`Failed to create chargeback case: ${error?.message}`);
      }

      // Send urgent notification
      await this.sendChargebackNotification(createdCase.id, 'received');

      return createdCase as ChargebackCase;

    } catch (error) {
      console.error('Error handling chargeback:', error);
      throw error;
    }
  }

  /**
   * Get refund request by ID
   */
  async getRefundRequest(refundRequestId: string): Promise<RefundRequest | null> {
    const { data, error } = await this.supabase
      .from('refund_requests')
      .select(`
        *,
        customer_notifications(*),
        internal_notes(*)
      `)
      .eq('id', refundRequestId)
      .single();

    if (error) {
      return null;
    }

    return data as RefundRequest;
  }

  /**
   * Get refund requests with filters
   */
  async getRefundRequests(filters: {
    customerId?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  } = {}): Promise<{ requests: RefundRequest[]; total: number }> {
    let query = this.supabase
      .from('refund_requests')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.dateFrom) {
      query = query.gte('requested_at', filters.dateFrom.toISOString());
    }
    if (filters.dateTo) {
      query = query.lte('requested_at', filters.dateTo.toISOString());
    }

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    query = query
      .range(offset, offset + limit - 1)
      .order('requested_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching refund requests:', error);
      return { requests: [], total: 0 };
    }

    return {
      requests: (data || []) as RefundRequest[],
      total: count || 0
    };
  }

  /**
   * Get refund statistics
   */
  async getRefundStatistics(startDate?: Date, endDate?: Date): Promise<RefundStatistics> {
    try {
      let query = this.supabase.from('refund_requests').select('*');

      if (startDate) {
        query = query.gte('requested_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('requested_at', endDate.toISOString());
      }

      const { data: refunds, error } = await query;

      if (error || !refunds) {
        return {
          totalRefunds: 0,
          totalAmount: 0,
          averageProcessingTime: 0,
          approvalRate: 0,
          refundReasons: {},
          monthlyTrend: [],
          providerPerformance: {}
        };
      }

      const totalRefunds = refunds.length;
      const totalAmount = refunds.reduce((sum, r) => sum + r.amount, 0);
      const approvedRefunds = refunds.filter(r => r.status === 'approved' || r.status === 'processed').length;
      const approvalRate = totalRefunds > 0 ? (approvedRefunds / totalRefunds) * 100 : 0;

      // Calculate average processing time
      const processedRefunds = refunds.filter(r => r.requestedAt && r.processedAt);
      const averageProcessingTime = processedRefunds.length > 0
        ? processedRefunds.reduce((sum, r) => {
            const processingTime = new Date(r.processedAt!).getTime() - new Date(r.requestedAt).getTime();
            return sum + processingTime;
          }, 0) / processedRefunds.length / (1000 * 60 * 60 * 24) // Convert to days
        : 0;

      // Calculate refund reasons distribution
      const refundReasons: Record<string, { count: number; amount: number }> = {};
      refunds.forEach(refund => {
        const reason = refund.reason.name;
        if (!refundReasons[reason]) {
          refundReasons[reason] = { count: 0, amount: 0 };
        }
        refundReasons[reason].count += 1;
        refundReasons[reason].amount += refund.amount;
      });

      // Calculate monthly trend
      const monthlyTrend: Record<string, { count: number; amount: number }> = {};
      refunds.forEach(refund => {
        const month = refund.requestedAt.substring(0, 7); // YYYY-MM
        if (!monthlyTrend[month]) {
          monthlyTrend[month] = { count: 0, amount: 0 };
        }
        monthlyTrend[month].count += 1;
        monthlyTrend[month].amount += refund.amount;
      });

      const monthlyTrendArray = Object.entries(monthlyTrend)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month));

      return {
        totalRefunds,
        totalAmount,
        averageProcessingTime,
        approvalRate,
        refundReasons,
        monthlyTrend: monthlyTrendArray,
        providerPerformance: {} // Would calculate from actual provider data
      };

    } catch (error) {
      console.error('Error calculating refund statistics:', error);
      throw error;
    }
  }

  // Private helper methods

  private async getPaymentDetails(paymentIntentId: string): Promise<{
    provider: string;
    amount: number;
    currency: string;
    status: string;
    customerId?: string;
  } | null> {
    // This would integrate with the payment factory to get payment details
    // Mock implementation
    return {
      provider: 'stripe',
      amount: 100,
      currency: 'PLN',
      status: 'succeeded'
    };
  }

  private async validateRefundRequest(params: {
    paymentIntentId: string;
    amount?: number;
    reasonCode: string;
  }, paymentDetails: any): Promise<{
    isValid: boolean;
    eligibilityPercentage: number;
    appliedPolicy?: string;
    reason?: string;
  }> {
    // Check if payment is eligible for refund
    if (paymentDetails.status !== 'succeeded') {
      return {
        isValid: false,
        eligibilityPercentage: 0,
        reason: 'Payment is not in succeeded status'
      };
    }

    // Check refund amount
    if (params.amount && params.amount > paymentDetails.amount) {
      return {
        isValid: false,
        eligibilityPercentage: 0,
        reason: 'Refund amount exceeds payment amount'
      };
    }

    // Apply refund policy (simplified)
    const eligibilityPercentage = 100; // Would calculate based on policy and time

    return {
      isValid: true,
      eligibilityPercentage,
      appliedPolicy: 'standard_policy'
    };
  }

  private async uploadRefundDocumentation(
    refundRequestId: string,
    documentation: { type: string; file: File }[]
  ): Promise<void> {
    // Implementation would upload files to storage
    console.log(`Uploading ${documentation.length} documents for refund ${refundRequestId}`);
  }

  private async uploadDisputeFile(file: File): Promise<string> {
    // Implementation would upload file to storage and return URL
    return `/uploads/disputes/${file.name}`;
  }

  private async addRefundNote(
    refundRequestId: string,
    note: {
      author: string;
      content: string;
      isInternal: boolean;
      category?: string;
    }
  ): Promise<void> {
    await this.supabase
      .from('refund_notes')
      .insert({
        refund_request_id: refundRequestId,
        ...note,
        created_at: new Date()
      });
  }

  private async getDisputeCase(disputeId: string): Promise<DisputeCase | null> {
    const { data, error } = await this.supabase
      .from('dispute_cases')
      .select('*')
      .eq('id', disputeId)
      .single();

    if (error) {
      return null;
    }

    return data as DisputeCase;
  }

  // Notification methods
  private async sendRefundNotifications(
    refundRequestId: string,
    type: 'requested' | 'approved' | 'rejected' | 'processed',
    metadata?: Record<string, any>
  ): Promise<void> {
    const templates = {
      requested: 'refund_request_received',
      approved: 'refund_request_approved',
      rejected: 'refund_request_rejected',
      processed: 'refund_processed'
    };

    // Implementation would integrate with notification service
    console.log(`Sending ${type} notification for refund ${refundRequestId}`);
  }

  private async sendDisputeNotification(disputeId: string, type: 'created' | 'updated'): Promise<void> {
    console.log(`Sending ${type} notification for dispute ${disputeId}`);
  }

  private async sendChargebackNotification(chargebackId: string, type: 'received' | 'updated'): Promise<void> {
    console.log(`Sending ${type} notification for chargeback ${chargebackId}`);
  }

  /**
   * Get available refund reasons
   */
  getRefundReasons(): RefundReason[] {
    return this.refundReasons;
  }

  /**
   * Get refund policies
   */
  async getRefundPolicies(serviceType?: string): Promise<RefundPolicy[]> {
    let query = this.supabase
      .from('refund_policies')
      .select('*')
      .eq('is_active', true);

    if (serviceType) {
      query = query.eq('service_type', serviceType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching refund policies:', error);
      return [];
    }

    return data as RefundPolicy[];
  }
}

// Export singleton instance
export const refundService = new RefundService();