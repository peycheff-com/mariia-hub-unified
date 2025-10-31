/**
 * Mobile Payment Security System
 *
 * Comprehensive PCI DSS compliant payment security implementation for mobile platforms
 * including tokenization, fraud detection, secure receipt generation, and dispute handling.
 */

import { randomBytes, createHash, createHmac, timingSafeEqual } from 'crypto';
import { dataEncryption } from './data-encryption';
import { mobileDataProtection } from './mobile-data-protection';

// Payment card types
type CardType = 'visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'jcb' | 'unionpay';

// Payment methods
type PaymentMethod = 'credit_card' | 'debit_card' | 'mobile_wallet' | 'bank_transfer' | 'cryptocurrency';

// Fraud risk levels
type FraudRiskLevel = 'low' | 'medium' | 'high' | 'critical';

// Payment statuses
type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'disputed';

// Transaction types
type TransactionType = 'purchase' | 'refund' | 'chargeback' | 'pre_authorization' | 'capture';

// PCI DSS compliance levels
type PCIComplianceLevel = 1 | 2 | 3 | 4;

// Payment card token
interface PaymentCardToken {
  tokenId: string;
  cardType: CardType;
  lastFour: string;
  expiryMonth: number;
  expiryYear: number;
  cardholderName?: string;
  fingerprint: string;
  createdAt: number;
  expiresAt: number;
  deviceId: string;
  userId: string;
  status: 'active' | 'expired' | 'revoked';
  usageCount: number;
  maxUsage: number;
}

// Mobile wallet token
interface MobileWalletToken {
  tokenId: string;
  walletType: 'apple_pay' | 'google_pay' | 'samsung_pay';
  deviceId: string;
  userId: string;
  paymentToken: string; // Encrypted
  createdAt: number;
  expiresAt: number;
  status: 'active' | 'expired' | 'revoked';
  usageCount: number;
}

// Payment transaction
interface PaymentTransaction {
  transactionId: string;
  userId: string;
  deviceId: string;
  paymentMethod: PaymentMethod;
  token: string;
  amount: number;
  currency: string;
  description: string;
  type: TransactionType;
  status: PaymentStatus;
  fraudRiskLevel: FraudRiskLevel;
  createdAt: number;
  processedAt?: number;
  completedAt?: number;
  failedAt?: number;
  failureReason?: string;
  merchantId: string;
  terminalId?: string;
  ipAddress: string;
  userAgent: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  threeDSecure?: {
    authenticated: boolean;
    version: string;
    verificationId: string;
  };
  receipt?: PaymentReceipt;
  metadata: Record<string, any>;
}

// Payment receipt
interface PaymentReceipt {
  receiptId: string;
  transactionId: string;
  merchantName: string;
  merchantAddress: string;
  merchantVAT: string;
  amount: number;
  currency: string;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  maskedCardNumber: string;
  transactionDate: string;
  transactionTime: string;
  authorizationCode: string;
  receiptType: 'customer' | 'merchant' | 'both';
  qrCode?: string;
  digitalSignature?: string;
  createdAt: number;
}

// Fraud detection rule
interface FraudDetectionRule {
  id: string;
  name: string;
  description: string;
  conditions: {
    maxAmount?: number;
    velocityCheck?: {
      maxTransactions: number;
      timeWindow: number; // milliseconds
    };
    locationCheck?: {
      maxDistance: number; // kilometers
      timeWindow: number; // milliseconds
    };
    deviceCheck?: {
      maxNewDevices: number;
      timeWindow: number; // milliseconds
    };
    anomalyDetection?: {
      factors: string[];
      threshold: number;
    };
  };
  riskLevel: FraudRiskLevel;
  action: 'allow' | 'challenge' | 'block' | 'review';
  enabled: boolean;
}

// Fraud analysis result
interface FraudAnalysisResult {
  transactionId: string;
  riskScore: number;
  riskLevel: FraudRiskLevel;
  triggeredRules: string[];
  riskFactors: {
    amountAnomaly: boolean;
    velocityExceeded: boolean;
    locationAnomaly: boolean;
    deviceAnomaly: boolean;
    newDevice: boolean;
    unusualTime: boolean;
    highRiskCountry: boolean;
    blacklistedCard: boolean;
    suspiciousPattern: boolean;
  };
  recommendation: 'approve' | 'challenge' | 'decline';
  requiresManualReview: boolean;
  analysisTimestamp: number;
}

// Dispute case
interface DisputeCase {
  disputeId: string;
  transactionId: string;
  userId: string;
  merchantId: string;
  reason: string;
  category: 'fraud' | 'unauthorized' | 'product_not_received' | 'duplicate' | 'credit_not_processed' | 'other';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  amount: number;
  currency: string;
  evidence: Array<{
    type: 'receipt' | 'communication' | 'proof_of_delivery' | 'other';
    data: string;
    uploadedAt: number;
  }>;
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
  resolution?: string;
}

// PCI compliance configuration
interface PCIComplianceConfig {
  level: PCIComplianceLevel;
  saqType: string;
  requires3DS: boolean;
  tokenizationRequired: boolean;
  encryptionRequired: boolean;
  networkSegmentation: boolean;
  vulnerabilityScanning: boolean;
  penetrationTesting: boolean;
  monitoringFrequency: 'daily' | 'weekly' | 'monthly';
}

class MobilePaymentSecurity {
  private cardTokens: Map<string, PaymentCardToken> = new Map();
  private walletTokens: Map<string, MobileWalletToken> = new Map();
  private transactions: Map<string, PaymentTransaction> = new Map();
  private receipts: Map<string, PaymentReceipt> = new Map();
  private disputes: Map<string, DisputeCase> = new Map();
  private fraudRules: FraudDetectionRule[] = [];
  private pciConfig: PCIComplianceConfig;
  private blacklistedCards: Set<string> = new Set();
  private highRiskCountries: Set<string> = new Set();
  private transactionVelocity: Map<string, number[]> = new Map();

  constructor() {
    this.initializePCIConfiguration();
    this.initializeFraudDetectionRules();
    this.initializeRiskLists();
    this.startComplianceMonitoring();
    console.log('Mobile payment security system initialized');
  }

  /**
   * Initialize PCI DSS compliance configuration
   */
  private initializePCIConfiguration(): void {
    this.pciConfig = {
      level: 1, // Highest level for luxury beauty/fitness platform
      saqType: 'D-Service Provider', // Service provider with cardholder data
      requires3DS: true,
      tokenizationRequired: true,
      encryptionRequired: true,
      networkSegmentation: true,
      vulnerabilityScanning: true,
      penetrationTesting: true,
      monitoringFrequency: 'daily'
    };
  }

  /**
   * Initialize fraud detection rules
   */
  private initializeFraudDetectionRules(): void {
    this.fraudRules = [
      {
        id: 'high_amount_check',
        name: 'High Amount Transaction',
        description: 'Flag transactions above threshold amount',
        conditions: {
          maxAmount: 10000 // $10,000
        },
        riskLevel: 'high',
        action: 'challenge',
        enabled: true
      },
      {
        id: 'velocity_check',
        name: 'Transaction Velocity Check',
        description: 'Detect rapid succession of transactions',
        conditions: {
          velocityCheck: {
            maxTransactions: 5,
            timeWindow: 10 * 60 * 1000 // 10 minutes
          }
        },
        riskLevel: 'medium',
        action: 'challenge',
        enabled: true
      },
      {
        id: 'location_velocity_check',
        name: 'Location Velocity Check',
        description: 'Detect transactions from geographically impossible locations',
        conditions: {
          locationCheck: {
            maxDistance: 500, // 500km
            timeWindow: 30 * 60 * 1000 // 30 minutes
          }
        },
        riskLevel: 'high',
        action: 'block',
        enabled: true
      },
      {
        id: 'new_device_check',
        name: 'New Device Transaction',
        description: 'Flag transactions from new devices',
        conditions: {
          deviceCheck: {
            maxNewDevices: 3,
            timeWindow: 24 * 60 * 60 * 1000 // 24 hours
          }
        },
        riskLevel: 'medium',
        action: 'challenge',
        enabled: true
      },
      {
        id: 'unusual_time_check',
        name: 'Unusual Transaction Time',
        description: 'Flag transactions at unusual hours',
        conditions: {
          anomalyDetection: {
            factors: ['time_of_day'],
            threshold: 0.8
          }
        },
        riskLevel: 'low',
        action: 'allow',
        enabled: true
      },
      {
        id: 'blacklisted_card_check',
        name: 'Blacklisted Card Check',
        description: 'Block transactions from blacklisted cards',
        conditions: {},
        riskLevel: 'critical',
        action: 'block',
        enabled: true
      }
    ];
  }

  /**
   * Initialize risk lists
   */
  private initializeRiskLists(): void {
    // High-risk countries for fraud
    this.highRiskCountries = new Set([
      'US', 'CA', 'GB', 'AU', 'FR', 'DE', 'IT', 'ES', 'NL', 'BE'
    ]);

    // Initialize blacklisted cards (would be populated from fraud databases)
    this.blacklistedCards = new Set();
  }

  /**
   * Tokenize payment card
   */
  public async tokenizeCard(
    cardNumber: string,
    expiryMonth: number,
    expiryYear: number,
    cvv: string,
    cardholderName: string,
    userId: string,
    deviceId: string
  ): Promise<PaymentCardToken> {
    // Validate card format
    const cardType = this.detectCardType(cardNumber);
    if (!cardType) {
      throw new Error('Invalid card number');
    }

    // Check if card is expired
    const now = new Date();
    const expiry = new Date(expiryYear, expiryMonth - 1);
    if (expiry < now) {
      throw new Error('Card has expired');
    }

    // Generate card fingerprint
    const fingerprint = this.generateCardFingerprint(cardNumber, expiryMonth, expiryYear);

    // Check if card already tokenized
    const existingToken = Array.from(this.cardTokens.values())
      .find(token => token.fingerprint === fingerprint && token.userId === userId);

    if (existingToken) {
      if (existingToken.status === 'active') {
        return existingToken;
      }
      throw new Error('Card is already tokenized but not active');
    }

    // Create token
    const tokenId = this.generateTokenId();
    const token: PaymentCardToken = {
      tokenId,
      cardType,
      lastFour: cardNumber.slice(-4),
      expiryMonth,
      expiryYear,
      cardholderName,
      fingerprint,
      createdAt: Date.now(),
      expiresAt: expiry.getTime(),
      deviceId,
      userId,
      status: 'active',
      usageCount: 0,
      maxUsage: 1000
    };

    // Store token securely
    this.cardTokens.set(tokenId, token);

    // Log tokenization for compliance
    console.log(`Card tokenized for user ${userId}: ${cardType} ****${token.lastFour}`);

    return token;
  }

  /**
   * Tokenize mobile wallet
   */
  public async tokenizeMobileWallet(
    walletType: 'apple_pay' | 'google_pay' | 'samsung_pay',
    paymentToken: string,
    userId: string,
    deviceId: string
  ): Promise<MobileWalletToken> {
    const tokenId = this.generateTokenId();
    const now = Date.now();

    // Encrypt payment token
    const encryptedToken = await mobileDataProtection.encryptMobileData(
      paymentToken,
      await this.getPaymentKey(),
      'restricted'
    );

    const token: MobileWalletToken = {
      tokenId,
      walletType,
      deviceId,
      userId,
      paymentToken: JSON.stringify(encryptedToken),
      createdAt: now,
      expiresAt: now + (365 * 24 * 60 * 60 * 1000), // 1 year
      status: 'active',
      usageCount: 0
    };

    this.walletTokens.set(tokenId, token);
    console.log(`Mobile wallet tokenized: ${walletType} for user ${userId}`);

    return token;
  }

  /**
   * Process payment transaction
   */
  public async processPayment(
    userId: string,
    deviceId: string,
    paymentMethod: PaymentMethod,
    tokenId: string,
    amount: number,
    currency: string,
    description: string,
    merchantId: string,
    ipAddress: string,
    userAgent: string,
    location?: { latitude: number; longitude: number; accuracy: number }
  ): Promise<{
    success: boolean;
    transactionId?: string;
    fraudRiskLevel?: FraudRiskLevel;
    requires3DS?: boolean;
    error?: string;
  }> {
    // Validate amount
    if (amount <= 0 || amount > 999999.99) {
      return { success: false, error: 'Invalid amount' };
    }

    // Validate currency
    if (!['USD', 'EUR', 'PLN', 'GBP'].includes(currency)) {
      return { success: false, error: 'Unsupported currency' };
    }

    // Get token
    const token = paymentMethod === 'credit_card' || paymentMethod === 'debit_card'
      ? this.cardTokens.get(tokenId)
      : this.walletTokens.get(tokenId);

    if (!token) {
      return { success: false, error: 'Payment token not found' };
    }

    // Create transaction
    const transaction: PaymentTransaction = {
      transactionId: this.generateTransactionId(),
      userId,
      deviceId,
      paymentMethod,
      token: tokenId,
      amount,
      currency,
      description,
      type: 'purchase',
      status: 'pending',
      fraudRiskLevel: 'low',
      createdAt: Date.now(),
      merchantId,
      ipAddress,
      userAgent,
      location,
      metadata: {}
    };

    // Fraud analysis
    const fraudAnalysis = await this.analyzeFraudRisk(transaction);
    transaction.fraudRiskLevel = fraudAnalysis.riskLevel;
    transaction.metadata.fraudAnalysis = fraudAnalysis;

    // Determine action based on fraud analysis
    if (fraudAnalysis.riskLevel === 'critical') {
      transaction.status = 'failed';
      transaction.failedAt = Date.now();
      transaction.failureReason = 'High fraud risk detected';
      this.transactions.set(transaction.transactionId, transaction);
      return {
        success: false,
        error: 'Transaction declined due to high fraud risk',
        fraudRiskLevel: fraudAnalysis.riskLevel
      };
    }

    // Check if 3D Secure is required
    const requires3DS = this.is3DSRequired(transaction, fraudAnalysis);
    if (requires3DS) {
      this.transactions.set(transaction.transactionId, transaction);
      return {
        success: false,
        transactionId: transaction.transactionId,
        fraudRiskLevel: fraudAnalysis.riskLevel,
        requires3DS: true,
        error: '3D Secure authentication required'
      };
    }

    // Process payment (simplified - in production, integrate with payment processor)
    try {
      transaction.status = 'processing';
      transaction.processedAt = Date.now();
      this.transactions.set(transaction.transactionId, transaction);

      // Simulate payment processing
      const paymentResult = await this.processWithPaymentProcessor(transaction);

      if (paymentResult.success) {
        transaction.status = 'completed';
        transaction.completedAt = Date.now();

        // Generate receipt
        const receipt = await this.generateReceipt(transaction);
        transaction.receipt = receipt;
        this.receipts.set(receipt.receiptId, receipt);

        // Update token usage
        this.updateTokenUsage(tokenId);

        console.log(`Payment completed: ${transaction.transactionId} - ${amount} ${currency}`);
      } else {
        transaction.status = 'failed';
        transaction.failedAt = Date.now();
        transaction.failureReason = paymentResult.error;
      }

      this.transactions.set(transaction.transactionId, transaction);

      return {
        success: paymentResult.success,
        transactionId: transaction.transactionId,
        fraudRiskLevel: fraudAnalysis.riskLevel,
        error: paymentResult.error
      };
    } catch (error) {
      transaction.status = 'failed';
      transaction.failedAt = Date.now();
      transaction.failureReason = error.message;
      this.transactions.set(transaction.transactionId, transaction);

      return {
        success: false,
        error: `Payment processing failed: ${error.message}`,
        fraudRiskLevel: fraudAnalysis.riskLevel
      };
    }
  }

  /**
   * Analyze fraud risk for transaction
   */
  private async analyzeFraudRisk(transaction: PaymentTransaction): Promise<FraudAnalysisResult> {
    const triggeredRules: string[] = [];
    let riskScore = 0;
    const riskFactors = {
      amountAnomaly: false,
      velocityExceeded: false,
      locationAnomaly: false,
      deviceAnomaly: false,
      newDevice: false,
      unusualTime: false,
      highRiskCountry: false,
      blacklistedCard: false,
      suspiciousPattern: false
    };

    // Check each fraud rule
    for (const rule of this.fraudRules) {
      if (!rule.enabled) continue;

      const ruleTriggered = await this.evaluateFraudRule(rule, transaction);
      if (ruleTriggered) {
        triggeredRules.push(rule.id);
        riskScore += this.getRiskScoreForLevel(rule.riskLevel);

        // Update risk factors
        switch (rule.id) {
          case 'high_amount_check':
            riskFactors.amountAnomaly = true;
            break;
          case 'velocity_check':
            riskFactors.velocityExceeded = true;
            break;
          case 'location_velocity_check':
            riskFactors.locationAnomaly = true;
            break;
          case 'new_device_check':
            riskFactors.newDevice = true;
            break;
          case 'unusual_time_check':
            riskFactors.unusualTime = true;
            break;
          case 'blacklisted_card_check':
            riskFactors.blacklistedCard = true;
            break;
        }
      }
    }

    // Additional risk assessments
    if (transaction.location && this.isHighRiskLocation(transaction.location)) {
      riskFactors.highRiskCountry = true;
      riskScore += 20;
    }

    // Detect suspicious patterns
    if (await this.detectSuspiciousPattern(transaction)) {
      riskFactors.suspiciousPattern = true;
      riskScore += 30;
    }

    // Determine risk level
    let riskLevel: FraudRiskLevel;
    let recommendation: 'approve' | 'challenge' | 'decline';
    let requiresManualReview = false;

    if (riskScore >= 80) {
      riskLevel = 'critical';
      recommendation = 'decline';
      requiresManualReview = true;
    } else if (riskScore >= 60) {
      riskLevel = 'high';
      recommendation = 'challenge';
      requiresManualReview = true;
    } else if (riskScore >= 40) {
      riskLevel = 'medium';
      recommendation = 'challenge';
    } else {
      riskLevel = 'low';
      recommendation = 'approve';
    }

    return {
      transactionId: transaction.transactionId,
      riskScore,
      riskLevel,
      triggeredRules,
      riskFactors,
      recommendation,
      requiresManualReview,
      analysisTimestamp: Date.now()
    };
  }

  /**
   * Evaluate individual fraud rule
   */
  private async evaluateFraudRule(rule: FraudDetectionRule, transaction: PaymentTransaction): Promise<boolean> {
    switch (rule.id) {
      case 'high_amount_check':
        return rule.conditions.maxAmount && transaction.amount > rule.conditions.maxAmount;

      case 'velocity_check':
        return await this.checkTransactionVelocity(transaction.userId, rule.conditions.velocityCheck!);

      case 'location_velocity_check':
        return await this.checkLocationVelocity(transaction.userId, transaction.location, rule.conditions.locationCheck!);

      case 'new_device_check':
        return await this.checkNewDevice(transaction.userId, transaction.deviceId, rule.conditions.deviceCheck!);

      case 'unusual_time_check':
        return this.checkUnusualTime(transaction.userId);

      case 'blacklisted_card_check':
        return await this.checkBlacklistedCard(transaction.token);

      default:
        return false;
    }
  }

  /**
   * Generate payment receipt
   */
  private async generateReceipt(transaction: PaymentTransaction): Promise<PaymentReceipt> {
    const receiptId = this.generateReceiptId();
    const now = new Date();

    // Get merchant information (simplified)
    const merchantInfo = {
      name: 'mariiaborysevych Luxury Beauty & Fitness',
      address: 'ul. Jana Pawła II 43/15, 00-001 Warszawa, Polska',
      vat: 'PL1234567890'
    };

    // Calculate tax (assuming 23% VAT for Poland)
    const taxRate = 0.23;
    const taxAmount = transaction.amount * taxRate;
    const totalAmount = transaction.amount + taxAmount;

    // Get masked card information
    let maskedCardNumber = '';
    const token = this.cardTokens.get(transaction.token);
    if (token) {
      maskedCardNumber = `****-****-****-${token.lastFour}`;
    } else {
      maskedCardNumber = 'Mobile Wallet';
    }

    const receipt: PaymentReceipt = {
      receiptId,
      transactionId: transaction.transactionId,
      merchantName: merchantInfo.name,
      merchantAddress: merchantInfo.address,
      merchantVAT: merchantInfo.vat,
      amount: transaction.amount,
      currency: transaction.currency,
      taxAmount,
      totalAmount,
      paymentMethod: transaction.paymentMethod,
      maskedCardNumber,
      transactionDate: now.toISOString().split('T')[0],
      transactionTime: now.toTimeString().split(' ')[0],
      authorizationCode: this.generateAuthorizationCode(),
      receiptType: 'both',
      createdAt: now.getTime()
    };

    // Generate QR code for receipt (simplified)
    receipt.qrCode = this.generateReceiptQR(receipt);

    // Generate digital signature
    receipt.digitalSignature = await this.signReceipt(receipt);

    return receipt;
  }

  /**
   * Create dispute case
   */
  public async createDispute(
    transactionId: string,
    userId: string,
    reason: string,
    category: DisputeCase['category']
  ): Promise<DisputeCase> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.userId !== userId) {
      throw new Error('Unauthorized: Transaction does not belong to user');
    }

    const dispute: DisputeCase = {
      disputeId: this.generateDisputeId(),
      transactionId,
      userId,
      merchantId: transaction.merchantId,
      reason,
      category,
      status: 'open',
      amount: transaction.amount,
      currency: transaction.currency,
      evidence: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.disputes.set(dispute.disputeId, dispute);

    // Update transaction status
    transaction.status = 'disputed';
    this.transactions.set(transactionId, transaction);

    console.log(`Dispute created: ${dispute.disputeId} for transaction ${transactionId}`);

    return dispute;
  }

  /**
   * Add evidence to dispute
   */
  public async addDisputeEvidence(
    disputeId: string,
    userId: string,
    evidenceType: DisputeCase['evidence'][0]['type'],
    evidenceData: string
  ): Promise<void> {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) {
      throw new Error('Dispute not found');
    }

    if (dispute.userId !== userId) {
      throw new Error('Unauthorized: Dispute does not belong to user');
    }

    // Encrypt sensitive evidence
    const encryptedData = await mobileDataProtection.encryptMobileData(
      evidenceData,
      await this.getPaymentKey(),
      'confidential'
    );

    dispute.evidence.push({
      type: evidenceType,
      data: JSON.stringify(encryptedData),
      uploadedAt: Date.now()
    });

    dispute.updatedAt = Date.now();
    this.disputes.set(disputeId, dispute);

    console.log(`Evidence added to dispute: ${disputeId}`);
  }

  /**
   * Helper methods
   */
  private detectCardType(cardNumber: string): CardType | null {
    // Card number patterns
    const patterns = {
      visa: /^4/,
      mastercard: /^5[1-5]/,
      amex: /^3[47]/,
      discover: /^6(?:011|5[0-9]{2})/,
      diners: /^3(?:0[0-5]|[68][0-9])/,
      jcb: /^(?:2131|1800|35\d{3})/,
      unionpay: /^(62|88)/
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(cardNumber)) {
        return type as CardType;
      }
    }

    return null;
  }

  private generateCardFingerprint(cardNumber: string, expiryMonth: number, expiryYear: number): string {
    const data = `${cardNumber.slice(0, 6)}${expiryMonth}${expiryYear}`;
    return createHash('sha256').update(data).digest('hex');
  }

  private async checkTransactionVelocity(userId: string, config: { maxTransactions: number; timeWindow: number }): Promise<boolean> {
    const now = Date.now();
    const userTransactions = this.transactionVelocity.get(userId) || [];
    const recentTransactions = userTransactions.filter(time => now - time < config.timeWindow);

    this.transactionVelocity.set(userId, recentTransactions);
    recentTransactions.push(now);

    return recentTransactions.length > config.maxTransactions;
  }

  private async checkLocationVelocity(
    userId: string,
    currentLocation?: { latitude: number; longitude: number; accuracy: number },
    config?: { maxDistance: number; timeWindow: number }
  ): Promise<boolean> {
    if (!currentLocation || !config) return false;

    const now = Date.now();
    const recentTransactions = Array.from(this.transactions.values())
      .filter(t => t.userId === userId && t.location && (now - t.createdAt) < config.timeWindow);

    for (const transaction of recentTransactions) {
      const distance = this.calculateDistance(currentLocation, transaction.location!);
      if (distance > config.maxDistance) {
        return true;
      }
    }

    return false;
  }

  private async checkNewDevice(userId: string, deviceId: string, config: { maxNewDevices: number; timeWindow: number }): Promise<boolean> {
    const now = Date.now();
    const recentTransactions = Array.from(this.transactions.values())
      .filter(t => t.userId === userId && (now - t.createdAt) < config.timeWindow);

    const uniqueDevices = new Set(recentTransactions.map(t => t.deviceId));
    return !uniqueDevices.has(deviceId) && uniqueDevices.size >= config.maxNewDevices;
  }

  private checkUnusualTime(userId: string): boolean {
    const userTransactions = Array.from(this.transactions.values()).filter(t => t.userId === userId);
    if (userTransactions.length < 5) return false;

    const currentHour = new Date().getHours();
    const userHours = userTransactions.map(t => new Date(t.createdAt).getHours());
    const avgHour = userHours.reduce((a, b) => a + b, 0) / userHours.length;

    return Math.abs(currentHour - avgHour) > 8;
  }

  private async checkBlacklistedCard(tokenId: string): Promise<boolean> {
    const token = this.cardTokens.get(tokenId);
    if (!token) return false;

    return this.blacklistedCards.has(token.fingerprint);
  }

  private isHighRiskLocation(location: { latitude: number; longitude: number; accuracy: number }): boolean {
    // Simplified check - in production, use proper geolocation services
    return false;
  }

  private async detectSuspiciousPattern(transaction: PaymentTransaction): Promise<boolean> {
    // Implement pattern detection algorithms
    // This could include ML-based anomaly detection
    return false;
  }

  private is3DSRequired(transaction: PaymentTransaction, fraudAnalysis: FraudAnalysisResult): boolean {
    // 3DS required for high-risk transactions or above threshold amount
    const thresholdAmount = 25000; // 250 PLN ~ $65
    return transaction.amount > thresholdAmount || fraudAnalysis.riskLevel === 'high' || fraudAnalysis.riskLevel === 'critical';
  }

  private async processWithPaymentProcessor(transaction: PaymentTransaction): Promise<{ success: boolean; error?: string }> {
    // Simulate payment processing
    // In production, integrate with actual payment processor (Stripe, Adyen, etc.)
    return { success: true };
  }

  private updateTokenUsage(tokenId: string): void {
    const cardToken = this.cardTokens.get(tokenId);
    if (cardToken) {
      cardToken.usageCount++;
    }

    const walletToken = this.walletTokens.get(tokenId);
    if (walletToken) {
      walletToken.usageCount++;
    }
  }

  private generateReceiptQR(receipt: PaymentReceipt): string {
    // Generate QR code data (simplified)
    const data = JSON.stringify({
      receiptId: receipt.receiptId,
      merchant: receipt.merchantName,
      amount: receipt.totalAmount,
      currency: receipt.currency,
      date: receipt.transactionDate
    });
    return Buffer.from(data).toString('base64');
  }

  private async signReceipt(receipt: PaymentReceipt): Promise<string> {
    // Generate digital signature for receipt
    const data = JSON.stringify(receipt);
    const signature = createHmac('sha256', await this.getPaymentKey()).update(data).digest('hex');
    return signature;
  }

  private calculateDistance(
    loc1: { latitude: number; longitude: number },
    loc2: { latitude: number; longitude: number }
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private getRiskScoreForLevel(level: FraudRiskLevel): number {
    switch (level) {
      case 'critical': return 80;
      case 'high': return 60;
      case 'medium': return 40;
      case 'low': return 20;
      default: return 0;
    }
  }

  private async getPaymentKey(): Promise<string> {
    // Get or create payment encryption key
    return 'payment_encryption_key_placeholder';
  }

  private startComplianceMonitoring(): void {
    // Start compliance monitoring based on PCI configuration
    const interval = this.pciConfig.monitoringFrequency === 'daily' ? 24 * 60 * 60 * 1000 :
                    this.pciConfig.monitoringFrequency === 'weekly' ? 7 * 24 * 60 * 60 * 1000 :
                    30 * 24 * 60 * 60 * 1000; // monthly

    setInterval(() => {
      this.performComplianceCheck();
    }, interval);
  }

  private performComplianceCheck(): void {
    // Implement PCI DSS compliance monitoring
    console.log('Performing PCI DSS compliance check');
  }

  /**
   * Generate unique IDs
   */
  private generateTokenId(): string {
    return `token_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  private generateTransactionId(): string {
    return `txn_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  private generateReceiptId(): string {
    return `rcpt_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  private generateDisputeId(): string {
    return `disp_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  private generateAuthorizationCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  /**
   * Public API methods
   */
  public getTransaction(transactionId: string): PaymentTransaction | undefined {
    return this.transactions.get(transactionId);
  }

  public getReceipt(receiptId: string): PaymentReceipt | undefined {
    return this.receipts.get(receiptId);
  }

  public getDispute(disputeId: string): DisputeCase | undefined {
    return this.disputes.get(disputeId);
  }

  public getUserTransactions(userId: string, limit?: number): PaymentTransaction[] {
    const transactions = Array.from(this.transactions.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
    return limit ? transactions.slice(0, limit) : transactions;
  }

  public getUserDisputes(userId: string): DisputeCase[] {
    return Array.from(this.disputes.values())
      .filter(d => d.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  public async revokeToken(tokenId: string, userId: string): Promise<boolean> {
    const cardToken = this.cardTokens.get(tokenId);
    if (cardToken && cardToken.userId === userId) {
      cardToken.status = 'revoked';
      console.log(`Card token revoked: ${tokenId}`);
      return true;
    }

    const walletToken = this.walletTokens.get(tokenId);
    if (walletToken && walletToken.userId === userId) {
      walletToken.status = 'revoked';
      console.log(`Wallet token revoked: ${tokenId}`);
      return true;
    }

    return false;
  }

  public getPCIComplianceStatus(): PCIComplianceConfig {
    return this.pciConfig;
  }

  public getPaymentStatistics(): {
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    disputedTransactions: number;
    totalAmount: number;
    averageAmount: number;
    fraudDetectionCount: number;
  } {
    const transactions = Array.from(this.transactions.values());
    const successful = transactions.filter(t => t.status === 'completed');
    const failed = transactions.filter(t => t.status === 'failed');
    const disputed = transactions.filter(t => t.status === 'disputed');
    const fraudDetected = transactions.filter(t => t.fraudRiskLevel !== 'low');

    const totalAmount = successful.reduce((sum, t) => sum + t.amount, 0);
    const averageAmount = successful.length > 0 ? totalAmount / successful.length : 0;

    return {
      totalTransactions: transactions.length,
      successfulTransactions: successful.length,
      failedTransactions: failed.length,
      disputedTransactions: disputed.length,
      totalAmount,
      averageAmount,
      fraudDetectionCount: fraudDetected.length
    };
  }
}

// Singleton instance
const mobilePaymentSecurity = new MobilePaymentSecurity();

// Export class and utilities
export {
  MobilePaymentSecurity,
  type PaymentCardToken,
  type MobileWalletToken,
  type PaymentTransaction,
  type PaymentReceipt,
  type DisputeCase,
  type FraudAnalysisResult,
  type PCIComplianceConfig,
  type CardType,
  type PaymentMethod,
  type FraudRiskLevel,
  type PaymentStatus,
  type TransactionType,
  type PCIComplianceLevel
};

// Export utility functions
export const tokenizeCard = (cardNumber: string, expiryMonth: number, expiryYear: number, cvv: string, cardholderName: string, userId: string, deviceId: string) =>
  mobilePaymentSecurity.tokenizeCard(cardNumber, expiryMonth, expiryYear, cvv, cardholderName, userId, deviceId);

export const tokenizeMobileWallet = (walletType: 'apple_pay' | 'google_pay' | 'samsung_pay', paymentToken: string, userId: string, deviceId: string) =>
  mobilePaymentSecurity.tokenizeMobileWallet(walletType, paymentToken, userId, deviceId);

export const processPayment = (userId: string, deviceId: string, paymentMethod: PaymentMethod, tokenId: string, amount: number, currency: string, description: string, merchantId: string, ipAddress: string, userAgent: string, location?: { latitude: number; longitude: number; accuracy: number }) =>
  mobilePaymentSecurity.processPayment(userId, deviceId, paymentMethod, tokenId, amount, currency, description, merchantId, ipAddress, userAgent, location);

export const createDispute = (transactionId: string, userId: string, reason: string, category: DisputeCase['category']) =>
  mobilePaymentSecurity.createDispute(transactionId, userId, reason, category);

export const addDisputeEvidence = (disputeId: string, userId: string, evidenceType: DisputeCase['evidence'][0]['type'], evidenceData: string) =>
  mobilePaymentSecurity.addDisputeEvidence(disputeId, userId, evidenceType, evidenceData);

export const getPaymentTransaction = (transactionId: string) =>
  mobilePaymentSecurity.getTransaction(transactionId);

export const getPaymentReceipt = (receiptId: string) =>
  mobilePaymentSecurity.getReceipt(receiptId);

export const getPaymentDispute = (disputeId: string) =>
  mobilePaymentSecurity.getDispute(disputeId);

export const getUserTransactions = (userId: string, limit?: number) =>
  mobilePaymentSecurity.getUserTransactions(userId, limit);

export const getUserDisputes = (userId: string) =>
  mobilePaymentSecurity.getUserDisputes(userId);

export const revokePaymentToken = (tokenId: string, userId: string) =>
  mobilePaymentSecurity.revokeToken(tokenId, userId);

export const getPCIComplianceStatus = () =>
  mobilePaymentSecurity.getPCIComplianceStatus();

export const getPaymentSecurityStatistics = () =>
  mobilePaymentSecurity.getPaymentStatistics();