/**
 * Compliance Service
 *
 * Polish financial regulations compliance implementation:
 * - KNF (Polish Financial Supervision Authority) compliance
 * - AML (Anti-Money Laundering) checks
 * - Customer due diligence (CDD) procedures
 * - Data retention policies
 * - PSD2 compliance for online payments
 * - GDPR compliance for data protection
 */

import { ComplianceCheck } from './payment-factory';
import { createClient } from '@supabase/supabase-js';

interface AMLCheck {
  id: string;
  customerId: string;
  transactionId?: string;
  checkType: 'transaction_monitoring' | 'customer_screening' | 'sanctions_check' | 'pep_check';
  status: 'pending' | 'in_progress' | 'cleared' | 'flagged' | 'blocked';
  riskScore: number; // 0-100
  flags: AMLFlag[];
  checkedAt: string;
  checkedBy: string;
  validUntil: string;
  metadata: Record<string, any>;
}

interface AMLFlag {
  type: 'high_value' | 'suspicious_pattern' | 'sanctions_match' | 'pep_match' | 'geographic_risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  requiresManualReview: boolean;
  autoBlockTransaction: boolean;
}

interface KYCRecord {
  id: string;
  customerId: string;
  status: 'not_started' | 'in_progress' | 'verified' | 'rejected' | 'requires_additional_info';
  verificationLevel: 'basic' | 'standard' | 'enhanced';
  documents: KYCDocument[];
  verifications: KYCVerification[];
  riskAssessment: KYCRiskAssessment;
  submittedAt?: string;
  verifiedAt?: string;
  nextReviewDate: string;
}

interface KYCDocument {
  id: string;
  type: 'identity_card' | 'passport' | 'driving_license' | 'proof_of_address' | 'tax_id' | 'company_documents';
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  expiresAt?: string;
}

interface KYCVerification {
  type: 'identity' | 'address' | 'phone' | 'email' | 'bank_account';
  method: 'document_upload' | 'electronic_verification' | 'manual_review' | 'third_party';
  status: 'pending' | 'verified' | 'failed';
  verifiedAt?: string;
  details: Record<string, any>;
}

interface KYCRiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  factors: {
    customerType: string;
    transactionPattern: string;
    geographicRisk: string;
    industryRisk: string;
    documentationQuality: string;
  };
  score: number;
  lastAssessed: string;
  nextAssessment: string;
}

interface ComplianceAudit {
  id: string;
  type: 'aml' | 'kyc' | 'psd2' | 'gdpr' | 'data_retention' | 'transaction_monitoring';
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed';
  scope: string;
  startDate: string;
  endDate?: string;
  findings: ComplianceAuditFinding[];
  recommendations: ComplianceRecommendation[];
  auditor: string;
  reportUrl?: string;
  createdAt: string;
}

interface ComplianceAuditFinding {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string[];
  affectedRecords: number;
  complianceGap: string;
  remediationRequired: boolean;
  deadline: string;
  status: 'open' | 'in_progress' | 'resolved';
}

interface ComplianceRecommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  actionItems: string[];
  estimatedCost?: number;
  estimatedTimeline: string;
  responsible: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface TransactionMonitoring {
  id: string;
  transactionId: string;
  customerId: string;
  amount: number;
  currency: string;
  riskScore: number;
  alerts: TransactionAlert[];
  status: 'cleared' | 'under_review' | 'blocked' | 'reported';
  reviewedBy?: string;
  reviewedAt?: string;
  reportedTo?: string;
  reportedAt?: string;
}

interface TransactionAlert {
  type: 'amount_threshold' | 'frequency_pattern' | 'unusual_behavior' | 'high_risk_country' | 'sanctions_match';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  threshold?: number;
  actualValue?: number;
  requiresImmediateAction: boolean;
  autoBlock: boolean;
}

interface DataRetentionPolicy {
  dataType: string;
  retentionPeriod: number; // in days
  retentionReason: string;
  legalBasis: string;
  deletionMethod: 'permanent' | 'anonymize' | 'archive';
  exceptions: string[];
  lastReviewed: string;
}

interface ComplianceReport {
  id: string;
  type: 'aml' | 'kyc' | 'transaction_monitoring' | 'gdpr';
  period: {
    start: string;
    end: string;
  };
  generatedAt: string;
  metrics: Record<string, any>;
  findings: ComplianceFinding[];
  recommendations: string[];
  status: 'draft' | 'final' | 'submitted';
  submittedTo?: string;
  submittedAt?: string;
}

interface ComplianceFinding {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  count: number;
  description: string;
  impact: string;
  remediation: string;
}

export class ComplianceService {
  private supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
  );

  // Polish compliance thresholds
  private readonly amlThresholds = {
    cashTransaction: 15000, // 15,000 PLN
    suspiciousTransaction: 10000, // 10,000 PLN
    highValueTransaction: 50000, // 50,000 PLN
    reportableTransaction: 15000 // 15,000 PLN (Generalnie to 15,000 EUR w PLN)
  };

  private readonly psd2Thresholds = {
    contactlessPayment: 100, // 100 PLN without PIN
    strongAuthentication: 250, // 250 EUR ~ 1,100 PLN
    remotePayment: 50, // 50 EUR ~ 220 PLN
    transactionMonitoring: 1000 // 1,000 PLN for enhanced monitoring
  };

  constructor() {
    this.initializeComplianceFramework();
  }

  private async initializeComplianceFramework(): Promise<void> {
    // Initialize data retention policies
    await this.initializeDataRetentionPolicies();

    // Set up transaction monitoring rules
    await this.initializeTransactionMonitoring();

    // Initialize compliance schedules
    await this.initializeComplianceSchedules();
  }

  private async initializeDataRetentionPolicies(): Promise<void> {
    const policies: Omit<DataRetentionPolicy, 'lastReviewed'>[] = [
      {
        dataType: 'transaction_records',
        retentionPeriod: 365 * 10, // 10 years for financial records
        retentionReason: 'Podatkowe i prawne wymagania',
        legalBasis: 'Ustawa o rachunkowości, przepisy podatkowe',
        deletionMethod: 'archive',
        exceptions: ['transakcje w toku', 'sporne transakcje']
      },
      {
        dataType: 'customer_data',
        retentionPeriod: 365 * 5, // 5 years for customer data
        retentionReason: 'Wymogi RODO i AML',
        legalBasis: 'RODO, ustawa o przeciwdziałaniu praniu pieniędzy',
        deletionMethod: 'anonymize',
        exceptions: ['dane związane ze śledztwami', 'dane wymagane prawem']
      },
      {
        dataType: 'kyc_documents',
        retentionPeriod: 365 * 10, // 10 years for KYC documents
        retentionReason: 'Wymogi AML i KYC',
        legalBasis: 'Ustawa o przeciwdziałaniu praniu pieniędzy',
        deletionMethod: 'permanent',
        exceptions: ['dokumenty w toku weryfikacji', 'dokumenty związane z dochodzeniami']
      },
      {
        dataType: 'compliance_reports',
        retentionPeriod: 365 * 7, // 7 years for compliance reports
        retentionReason: 'Wymogi audytowe i prawne',
        legalBasis: 'Przepisy KNF, wymogi audytowe',
        deletionMethod: 'archive',
        exceptions: ['raporty w toku postępowania']
      },
      {
        dataType: 'audit_logs',
        retentionPeriod: 365 * 2, // 2 years for audit logs
        retentionReason: 'Bezpieczeństwo systemu i śledzenie',
        legalBasis: 'RODO, wymogi bezpieczeństwa',
        deletionMethod: 'permanent',
        exceptions: ['logi związane z incydentami bezpieczeństwa']
      }
    ];

    for (const policy of policies) {
      await this.supabase
        .from('data_retention_policies')
        .upsert({
          ...policy,
          last_reviewed: new Date().toISOString(),
          created_at: new Date(),
          updated_at: new Date()
        });
    }
  }

  private async initializeTransactionMonitoring(): Promise<void> {
    // Set up monitoring rules
    const monitoringRules = [
      {
        name: 'High value transaction monitoring',
        type: 'amount_threshold',
        threshold: this.amlThresholds.highValueTransaction,
        currency: 'PLN',
        action: 'flag_for_review',
        severity: 'high',
        description: 'Monitor transakcje powyżej 50,000 PLN'
      },
      {
        name: 'Frequent transaction pattern',
        type: 'frequency_pattern',
        threshold: 10, // transactions per day
        timeframe: '24h',
        action: 'flag_for_review',
        severity: 'medium',
        description: 'Monitor częste transakcje w ciągu 24 godzin'
      },
      {
        name: 'Unusual transaction amount',
        type: 'unusual_behavior',
        baseline: 'customer_average',
        deviation: 500, // percentage
        action: 'flag_for_review',
        severity: 'medium',
        description: 'Monitor transakcje odbiegające od średniej klienta'
      },
      {
        name: 'Cross-border transaction monitoring',
        type: 'geographic_risk',
        highRiskCountries: ['XX', 'YY', 'ZZ'], // Would contain actual high-risk jurisdictions
        action: 'enhanced_review',
        severity: 'high',
        description: 'Monitor transakcje z krajów wysokiego ryzyka'
      },
      {
        name: 'PSD2 strong authentication',
        type: 'psd2_compliance',
        threshold: this.psd2Thresholds.strongAuthentication,
        currency: 'PLN',
        action: 'require_sca',
        severity: 'medium',
        description: 'Wymagaj silnego uwierzytelniania powyżej 1,100 PLN'
      }
    ];

    for (const rule of monitoringRules) {
      await this.supabase
        .from('transaction_monitoring_rules')
        .upsert({
          ...rule,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        });
    }
  }

  private async initializeComplianceSchedules(): Promise<void> {
    // Schedule regular compliance checks
    const schedules = [
      {
        name: 'Dzienne monitorowanie transakcji',
        type: 'transaction_monitoring',
        frequency: 'daily',
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        isActive: true
      },
      {
        name: 'Tygodniowy przegląd AML',
        type: 'aml_review',
        frequency: 'weekly',
        nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true
      },
      {
        name: 'Miesięczny audyt KYC',
        type: 'kyc_audit',
        frequency: 'monthly',
        nextRun: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true
      },
      {
        name: 'Kwartalny raport zgodności',
        type: 'compliance_report',
        frequency: 'quarterly',
        nextRun: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true
      },
      {
        name: 'Roczny audyt zewnętrzny',
        type: 'external_audit',
        frequency: 'yearly',
        nextRun: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true
      }
    ];

    for (const schedule of schedules) {
      await this.supabase
        .from('compliance_schedules')
        .upsert({
          ...schedule,
          created_at: new Date(),
          updated_at: new Date()
        });
    }
  }

  /**
   * Check transaction compliance
   */
  async checkTransaction(params: {
    amount: number;
    currency: string;
    customerId: string;
    paymentMethodId: string;
    metadata?: Record<string, any>;
  }): Promise<ComplianceCheck> {
    try {
      let overallRiskScore = 0;
      const checks = {
        aml: true,
        kyc: true,
        sanctions: true,
        transactionLimits: true,
        documentation: true
      };
      const requiredActions: string[] = [];

      // AML Check
      const amlResult = await this.performAMLCheck({
        customerId: params.customerId,
        amount: params.amount,
        currency: params.currency,
        transactionType: 'payment'
      });
      overallRiskScore += amlResult.riskScore * 0.4; // 40% weight for AML
      checks.aml = amlResult.status !== 'flagged' && amlResult.status !== 'blocked';

      if (!checks.aml) {
        requiredActions.push('manual_aml_review');
      }

      // KYC Check
      const kycStatus = await this.getCustomerKYCStatus(params.customerId);
      checks.kyc = kycStatus.status === 'verified';
      overallRiskScore += kycStatus.riskAssessment.score * 0.3; // 30% weight for KYC

      if (!checks.kyc) {
        requiredActions.push('complete_kyc_verification');
      }

      // Sanctions Check
      const sanctionsCheck = await this.performSanctionsCheck(params.customerId);
      checks.sanctions = sanctionsCheck.cleared;
      overallRiskScore += sanctionsCheck.riskScore * 0.2; // 20% weight for sanctions

      if (!checks.sanctions) {
        requiredActions.push('sanctions_review');
      }

      // Transaction Limits Check
      const limitsCheck = await this.checkTransactionLimits(params.customerId, params.amount, params.currency);
      checks.transactionLimits = limitsCheck.allowed;
      overallRiskScore += limitsCheck.riskScore * 0.1; // 10% weight for limits

      if (!checks.transactionLimits) {
        requiredActions.push('verify_transaction_source');
      }

      // Documentation Check
      const documentationCheck = await this.checkDocumentationRequirements(params);
      checks.documentation = documentationCheck.sufficient;
      overallRiskScore += documentationCheck.riskScore * 0.0; // Documentation doesn't affect risk score directly

      if (!checks.documentation) {
        requiredActions.push('provide_additional_documentation');
      }

      const isValid = Object.values(checks).every(check => check);
      const blockedReason = !isValid ? `Compliance checks failed: ${requiredActions.join(', ')}` : undefined;

      // Determine validity period based on risk score
      let validUntil: string | undefined;
      if (overallRiskScore < 30) {
        validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
      } else if (overallRiskScore < 60) {
        validUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
      }

      return {
        isValid,
        riskScore: Math.round(overallRiskScore),
        checks,
        requiredActions: requiredActions.length > 0 ? requiredActions : undefined,
        blockedReason,
        validUntil
      };

    } catch (error) {
      console.error('Error checking transaction compliance:', error);
      return {
        isValid: false,
        riskScore: 100,
        checks: {
          aml: false,
          kyc: false,
          sanctions: false,
          transactionLimits: false,
          documentation: false
        },
        requiredActions: ['system_error_contact_support'],
        blockedReason: 'Compliance check system error'
      };
    }
  }

  /**
   * Check refund compliance
   */
  async checkRefund(params: {
    paymentIntentId: string;
    amount?: number;
    reason?: string;
    requesterId?: string;
  }): Promise<ComplianceCheck> {
    try {
      let overallRiskScore = 0;
      const checks = {
        aml: true,
        kyc: true,
        sanctions: true,
        transactionLimits: true,
        documentation: true
      };
      const requiredActions: string[] = [];

      // Get original transaction details
      const originalTransaction = await this.getTransactionDetails(params.paymentIntentId);
      if (!originalTransaction) {
        return {
          isValid: false,
          riskScore: 100,
          checks,
          requiredActions: ['original_transaction_not_found'],
          blockedReason: 'Original transaction not found'
        };
      }

      // Check if refund amount exceeds original
      if (params.amount && params.amount > originalTransaction.amount) {
        checks.transactionLimits = false;
        requiredActions.push('refund_amount_exceeds_original');
      }

      // Check refund timing (suspicious if immediate)
      const transactionAge = Date.now() - new Date(originalTransaction.createdAt).getTime();
      const hoursSinceTransaction = transactionAge / (1000 * 60 * 60);

      if (hoursSinceTransaction < 1) {
        overallRiskScore += 30;
        requiredActions.push('immediate_refund_review');
      }

      // Check refund patterns
      const refundPattern = await this.analyzeRefundPattern(originalTransaction.customerId);
      if (refundPattern.suspicious) {
        checks.aml = false;
        overallRiskScore += 40;
        requiredActions.push('suspicious_refund_pattern');
      }

      // Check refund reason
      if (params.reason && this.isSuspiciousRefundReason(params.reason)) {
        overallRiskScore += 20;
        requiredActions.push('verify_refund_reason');
      }

      const isValid = Object.values(checks).every(check => check) && overallRiskScore < 70;
      const blockedReason = !isValid ? `Refund compliance check failed: ${requiredActions.join(', ')}` : undefined;

      return {
        isValid,
        riskScore: Math.round(overallRiskScore),
        checks,
        requiredActions: requiredActions.length > 0 ? requiredActions : undefined,
        blockedReason
      };

    } catch (error) {
      console.error('Error checking refund compliance:', error);
      return {
        isValid: false,
        riskScore: 100,
        checks: {
          aml: false,
          kyc: false,
          sanctions: false,
          transactionLimits: false,
          documentation: false
        },
        requiredActions: ['system_error_contact_support'],
        blockedReason: 'Refund compliance check system error'
      };
    }
  }

  /**
   * Get transaction limits for customer
   */
  async getTransactionLimits(customerId: string): Promise<{
    dailyLimit: number;
    weeklyLimit: number;
    monthlyLimit: number;
    perTransactionLimit: number;
    currency: string;
    remainingDaily: number;
    remainingWeekly: number;
    remainingMonthly: number;
  }> {
    // Get customer's KYC level to determine limits
    const kycStatus = await this.getCustomerKYCStatus(customerId);

    // Default limits based on KYC level
    const limits = {
      dailyLimit: kycStatus.verificationLevel === 'enhanced' ? 50000 : 15000,
      weeklyLimit: kycStatus.verificationLevel === 'enhanced' ? 150000 : 45000,
      monthlyLimit: kycStatus.verificationLevel === 'enhanced' ? 300000 : 90000,
      perTransactionLimit: kycStatus.verificationLevel === 'enhanced' ? 25000 : 10000,
      currency: 'PLN'
    };

    // Calculate current usage
    const now = new Date();
    const dailyStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weeklyStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthlyStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [dailyUsage, weeklyUsage, monthlyUsage] = await Promise.all([
      this.calculateTransactionUsage(customerId, dailyStart, now),
      this.calculateTransactionUsage(customerId, weeklyStart, now),
      this.calculateTransactionUsage(customerId, monthlyStart, now)
    ]);

    return {
      ...limits,
      remainingDaily: Math.max(0, limits.dailyLimit - dailyUsage),
      remainingWeekly: Math.max(0, limits.weeklyLimit - weeklyUsage),
      remainingMonthly: Math.max(0, limits.monthlyLimit - monthlyUsage)
    };
  }

  /**
   * Initialize customer KYC process
   */
  async initializeCustomerKYC(customerId: string, verificationLevel: 'basic' | 'standard' | 'enhanced' = 'standard'): Promise<KYCRecord> {
    try {
      // Check if KYC already exists
      const existingKYC = await this.getCustomerKYCStatus(customerId);
      if (existingKYC && existingKYC.status !== 'rejected') {
        throw new Error('KYC process already initiated for this customer');
      }

      // Create KYC record
      const kycRecord: Omit<KYCRecord, 'id'> = {
        customerId,
        status: 'not_started',
        verificationLevel,
        documents: [],
        verifications: [],
        riskAssessment: {
          overallRisk: 'medium',
          factors: {
            customerType: 'individual',
            transactionPattern: 'normal',
            geographicRisk: 'low',
            industryRisk: 'low',
            documentationQuality: 'pending'
          },
          score: 50,
          lastAssessed: new Date().toISOString(),
          nextAssessment: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        },
        nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      };

      const { data, error } = await this.supabase
        .from('kyc_records')
        .insert(kycRecord)
        .select()
        .single();

      if (error || !data) {
        throw new Error(`Failed to create KYC record: ${error?.message}`);
      }

      return data as KYCRecord;

    } catch (error) {
      console.error('Error initializing customer KYC:', error);
      throw error;
    }
  }

  /**
   * Upload KYC document
   */
  async uploadKYCDocument(
    kycRecordId: string,
    documentType: KYCDocument['type'],
    file: File,
    expiresAt?: string
  ): Promise<KYCDocument> {
    try {
      // Upload file to storage
      const fileUrl = await this.uploadKYCFile(file);

      const document: Omit<KYCDocument, 'id'> = {
        type: documentType,
        status: 'pending',
        fileName: file.name,
        fileUrl,
        uploadedAt: new Date().toISOString(),
        expiresAt
      };

      const { data, error } = await this.supabase
        .from('kyc_documents')
        .insert({
          ...document,
          kyc_record_id: kycRecordId
        })
        .select()
        .single();

      if (error || !data) {
        throw new Error(`Failed to upload KYC document: ${error?.message}`);
      }

      // Update KYC record status
      await this.supabase
        .from('kyc_records')
        .update({
          status: 'in_progress',
          updated_at: new Date()
        })
        .eq('id', kycRecordId);

      return data as KYCDocument;

    } catch (error) {
      console.error('Error uploading KYC document:', error);
      throw error;
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    type: ComplianceReport['type'],
    startDate: Date,
    endDate: Date
  ): Promise<ComplianceReport> {
    try {
      const reportData = await this.collectComplianceData(type, startDate, endDate);
      const findings = await this.identifyComplianceFindings(type, reportData);
      const recommendations = this.generateRecommendations(findings);

      const report: Omit<ComplianceReport, 'id'> = {
        type,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        generatedAt: new Date().toISOString(),
        metrics: reportData,
        findings,
        recommendations,
        status: 'draft'
      };

      const { data, error } = await this.supabase
        .from('compliance_reports')
        .insert(report)
        .select()
        .single();

      if (error || !data) {
        throw new Error(`Failed to create compliance report: ${error?.message}`);
      }

      return data as ComplianceReport;

    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw error;
    }
  }

  /**
   * Run scheduled compliance tasks
   */
  async runScheduledComplianceTasks(): Promise<void> {
    try {
      const now = new Date();

      // Get tasks that need to run
      const { data: tasks, error } = await this.supabase
        .from('compliance_schedules')
        .select('*')
        .eq('is_active', true)
        .lte('next_run', now.toISOString());

      if (error || !tasks) {
        return;
      }

      for (const task of tasks) {
        try {
          await this.executeComplianceTask(task);
        } catch (error) {
          console.error(`Error executing compliance task ${task.name}:`, error);
        }

        // Schedule next run
        await this.scheduleNextRun(task);
      }

    } catch (error) {
      console.error('Error running scheduled compliance tasks:', error);
    }
  }

  // Private helper methods

  private async performAMLCheck(params: {
    customerId: string;
    amount: number;
    currency: string;
    transactionType: string;
  }): Promise<{ status: string; riskScore: number; flags: AMLFlag[] }> {
    let riskScore = 0;
    const flags: AMLFlag[] = [];

    // Amount-based checks
    if (params.amount > this.amlThresholds.highValueTransaction) {
      riskScore += 40;
      flags.push({
        type: 'high_value',
        severity: 'high',
        description: 'High-value transaction detected',
        requiresManualReview: true,
        autoBlockTransaction: false
      });
    }

    if (params.amount > this.amlThresholds.suspiciousTransaction) {
      riskScore += 20;
      flags.push({
        type: 'suspicious_pattern',
        severity: 'medium',
        description: 'Suspicious transaction amount',
        requiresManualReview: true,
        autoBlockTransaction: false
      });
    }

    // Frequency checks
    const frequencyCheck = await this.checkTransactionFrequency(params.customerId);
    if (frequencyCheck.suspicious) {
      riskScore += 30;
      flags.push({
        type: 'suspicious_pattern',
        severity: 'medium',
        description: 'Unusual transaction frequency',
        requiresManualReview: true,
        autoBlockTransaction: false
      });
    }

    let status = 'cleared';
    if (riskScore > 70) {
      status = 'blocked';
    } else if (riskScore > 40) {
      status = 'flagged';
    }

    return { status, riskScore, flags };
  }

  private async getCustomerKYCStatus(customerId: string): Promise<KYCRecord> {
    const { data, error } = await this.supabase
      .from('kyc_records')
      .select(`
        *,
        kyc_documents(*),
        kyc_verifications(*)
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      // Return default KYC record
      return {
        id: '',
        customerId,
        status: 'not_started',
        verificationLevel: 'basic',
        documents: [],
        verifications: [],
        riskAssessment: {
          overallRisk: 'high',
          factors: {
            customerType: 'unknown',
            transactionPattern: 'unknown',
            geographicRisk: 'unknown',
            industryRisk: 'unknown',
            documentationQuality: 'none'
          },
          score: 100,
          lastAssessed: new Date().toISOString(),
          nextAssessment: new Date().toISOString()
        },
        nextReviewDate: new Date().toISOString()
      };
    }

    return data as KYCRecord;
  }

  private async performSanctionsCheck(customerId: string): Promise<{ cleared: boolean; riskScore: number }> {
    // Mock implementation - would check against sanctions lists
    return {
      cleared: true,
      riskScore: 0
    };
  }

  private async checkTransactionLimits(customerId: string, amount: number, currency: string): Promise<{ allowed: boolean; riskScore: number }> {
    const limits = await this.getTransactionLimits(customerId);
    const amountInPLN = currency === 'PLN' ? amount : await this.convertToPLN(amount, currency);

    let riskScore = 0;
    let allowed = true;

    if (amountInPLN > limits.perTransactionLimit) {
      allowed = false;
      riskScore = 80;
    } else if (amountInPLN > limits.perTransactionLimit * 0.8) {
      riskScore = 40;
    }

    return { allowed, riskScore };
  }

  private async checkDocumentationRequirements(params: {
    amount: number;
    currency: string;
    customerId: string;
    metadata?: Record<string, any>;
  }): Promise<{ sufficient: boolean; riskScore: number }> {
    // Check if additional documentation is required based on amount and customer profile
    const kycStatus = await this.getCustomerKYCStatus(params.metadata?.customerId || '');

    if (params.amount > 10000 && kycStatus.verificationLevel !== 'enhanced') {
      return { sufficient: false, riskScore: 20 };
    }

    return { sufficient: true, riskScore: 0 };
  }

  private async getTransactionDetails(paymentIntentId: string): Promise<any> {
    // Mock implementation - would get actual transaction details
    return {
      id: paymentIntentId,
      amount: 100,
      currency: 'PLN',
      status: 'succeeded',
      customerId: 'customer_123',
      createdAt: new Date().toISOString()
    };
  }

  private async analyzeRefundPattern(customerId: string): Promise<{ suspicious: boolean }> {
    // Mock implementation - would analyze refund patterns
    return { suspicious: false };
  }

  private isSuspiciousRefundReason(reason: string): boolean {
    const suspiciousReasons = [
      'fraud',
      'unauthorized',
      'disputed',
      'technical_error'
    ];
    return suspiciousReasons.some(suspicious => reason.toLowerCase().includes(suspicious));
  }

  private async calculateTransactionUsage(customerId: string, startDate: Date, endDate: Date): Promise<number> {
    // Mock implementation - would calculate actual transaction usage
    return 0;
  }

  private async convertToPLN(amount: number, currency: string): Promise<number> {
    // Mock implementation - would use actual exchange rates
    return amount;
  }

  private async uploadKYCFile(file: File): Promise<string> {
    // Mock implementation - would upload to storage
    return `/kyc-documents/${file.name}`;
  }

  private async collectComplianceData(type: string, startDate: Date, endDate: Date): Promise<Record<string, any>> {
    // Mock implementation - would collect actual compliance data
    return {};
  }

  private async identifyComplianceFindings(type: string, data: Record<string, any>): Promise<ComplianceFinding[]> {
    // Mock implementation
    return [];
  }

  private generateRecommendations(findings: ComplianceFinding[]): string[] {
    // Mock implementation
    return [];
  }

  private async checkTransactionFrequency(customerId: string): Promise<{ suspicious: boolean }> {
    // Mock implementation
    return { suspicious: false };
  }

  private async executeComplianceTask(task: any): Promise<void> {
    console.log(`Executing compliance task: ${task.name}`);
    // Implementation would execute the specific compliance task
  }

  private async scheduleNextRun(task: any): Promise<void> {
    let nextRun: Date;

    switch (task.frequency) {
      case 'daily':
        nextRun = new Date(Date.now() + 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        nextRun = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        nextRun = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarterly':
        nextRun = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        break;
      case 'yearly':
        nextRun = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        nextRun = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    await this.supabase
      .from('compliance_schedules')
      .update({
        next_run: nextRun.toISOString(),
        updated_at: new Date()
      })
      .eq('id', task.id);
  }
}

// Export singleton instance
export const complianceService = new ComplianceService();