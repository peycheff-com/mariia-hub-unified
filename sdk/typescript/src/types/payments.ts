import {
  ApiResponse,
  Currency,
  PolishPhoneNumber,
  PolishAddress,
  NIP,
  ListParams
} from './common';

/**
 * Payment interface
 */
export interface Payment {
  id: string;
  bookingId: string;
  userId?: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;

  // Payment gateway details
  gateway: PaymentGateway;
  gatewayTransactionId?: string;
  gatewayPaymentIntentId?: string;
  gatewayCustomerId?: string;

  // Payment processing
  processorFee?: number;
  netAmount?: number;
  refundAmount?: number;
  refundStatus?: RefundStatus;

  // Polish market specific
  polishPaymentDetails?: PolishPaymentDetails;
  invoiceRequested: boolean;
  invoiceGenerated: boolean;
  invoiceId?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  refundedAt?: string;
  failedAt?: string;

  // Metadata
  metadata?: Record<string, any>;
  description?: string;
  receiptUrl?: string;
}

/**
 * Payment status
 */
export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'succeeded'
  | 'failed'
  | 'canceled'
  | 'refunded'
  | 'partially_refunded';

/**
 * Refund status
 */
export type RefundStatus =
  | 'pending'
  | 'succeeded'
  | 'failed'
  | 'canceled';

/**
 * Payment method
 */
export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  card?: CardDetails;
  polishBank?: PolishBankDetails;
  billingDetails?: BillingDetails;
  isDefault?: boolean;
  createdAt: string;
}

/**
 * Payment method types
 */
export type PaymentMethodType =
  | 'card'
  | 'polish_bank'
  | 'blik'
  | 'przelewy24'
  | 'cash'
  | 'bank_transfer'
  | 'installment'
  | 'paypal';

/**
 * Card details
 */
export interface CardDetails {
  brand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  fingerprint: string;
  funding: 'credit' | 'debit' | 'prepaid' | 'unknown';
  country?: string;
  threeDSecure?: ThreeDSecureDetails;
}

/**
 * 3D Secure details
 */
export interface ThreeDSecureDetails {
  authenticated: boolean;
  version?: string;
  result?: string;
}

/**
 * Polish bank details
 */
export interface PolishBankDetails {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName?: string;
  swift?: string;
  iban?: string;
}

/**
 * Billing details
 */
export interface BillingDetails {
  name: string;
  email: string;
  phone?: PolishPhoneNumber;
  address: PolishAddress;
  nip?: NIP;
}

/**
 * Polish payment details
 */
export interface PolishPaymentDetails {
  method: PolishPaymentMethodType;
  bankId?: string;
  blikCode?: string;
  installmentProvider?: string;
  installmentCount?: number;
  vatRate?: number;
  taxId?: NIP;
  companyDetails?: PolishCompanyBillingDetails;
}

/**
 * Polish payment method types
 */
export type PolishPaymentMethodType =
  | 'blik'
  | 'przelewy24'
  | 'pbl'
  | 'card'
  | 'bank_transfer'
  | 'installment'
  | 'paypo'
  | 'twisto';

/**
 * Polish company billing details
 */
export interface PolishCompanyBillingDetails {
  companyName: string;
  nip: NIP;
  regon?: string;
  krs?: string;
  address: PolishAddress;
  email?: string;
  phone?: PolishPhoneNumber;
}

/**
 * Payment gateway
 */
export type PaymentGateway =
  | 'stripe'
  | 'przelewy24'
  | 'blik'
  | 'paypal'
  | 'cash'
  | 'manual';

/**
 * Create payment intent request
 */
export interface CreatePaymentIntentRequest {
  amount: number;
  currency: Currency;
  bookingId: string;
  paymentMethod?: PaymentMethodType;
  confirmImmediately?: boolean;
  return_url?: string;
  customer?: {
    email: string;
    name: string;
    phone?: string;
  };
  billingDetails?: BillingDetails;
  polishPaymentDetails?: PolishPaymentDetails;
  metadata?: Record<string, any>;
}

/**
 * Payment intent response
 */
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  paymentMethods: PaymentMethodType[];
  clientSecret?: string;
  nextAction?: NextAction;
  paymentMethodId?: string;
  confirmationMethod: 'automatic' | 'manual';
  captureMethod: 'automatic' | 'manual';
  amountReceived?: number;
  applicationFeeAmount?: number;
  transferData?: TransferData;
  receiptEmail?: string;
  shipping?: ShippingDetails;
  statementDescriptor?: string;
  statementDescriptorSuffix?: string;
  transferGroup?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

/**
 * Next action for payment
 */
export interface NextAction {
  type: 'redirect_to_url' | 'use_stripe_sdk' | 'verify_with_microdeposits';
  redirectToUrl?: {
    url: string;
    returnUrl?: string;
  };
  useStripeSdk?: {
    type: string;
    merchantCountry?: string;
  };
}

/**
 * Transfer data
 */
export interface TransferData {
  destination: string;
  amount?: number;
  currency?: Currency;
  transferGroup?: string;
}

/**
 * Shipping details
 */
export interface ShippingDetails {
  name: string;
  address: PolishAddress;
  phone?: PolishPhoneNumber;
  trackingNumber?: string;
  carrier?: string;
  status?: 'pending' | 'shipped' | 'delivered' | 'returned';
}

/**
 * Refund request
 */
export interface CreateRefundRequest {
  paymentId: string;
  amount?: number;
  reason?: RefundReason;
  metadata?: Record<string, any>;
}

/**
 * Refund reason
 */
export type RefundReason =
  | 'duplicate'
  | 'fraudulent'
  | 'requested_by_customer'
  | 'service_cancelled'
  | 'service_not_provided'
  | 'quality_issue'
  | 'other';

/**
 * Refund response
 */
export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  currency: Currency;
  status: RefundStatus;
  reason?: string;
  receiptNumber?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  processedAt?: string;
}

/**
 * Payment method creation request
 */
export interface CreatePaymentMethodRequest {
  type: PaymentMethodType;
  card?: CreateCardRequest;
  polishBank?: CreatePolishBankRequest;
  billingDetails?: BillingDetails;
  metadata?: Record<string, any>;
}

/**
 * Create card request
 */
export interface CreateCardRequest {
  number: string;
  expiryMonth: number;
  expiryYear: number;
  cvc: string;
  name?: string;
}

/**
 * Create Polish bank request
 */
export interface CreatePolishBankRequest {
  bankCode: string;
  accountNumber: string;
  accountName?: string;
}

/**
 * Payment analytics
 */
export interface PaymentAnalytics {
  totalRevenue: number;
  revenueByCurrency: Record<Currency, number>;
  revenueByPaymentMethod: Record<PaymentMethodType, number>;
  paymentMethodsDistribution: Record<PaymentMethodType, number>;
  averageTransactionValue: number;
  refundRate: number;
  failedPaymentRate: number;
  paymentStatusDistribution: Record<PaymentStatus, number>;
  polishMarketMetrics: PolishPaymentMetrics;
  monthlyRevenue: MonthlyRevenue[];
  popularPaymentMethods: PopularPaymentMethod[];
}

/**
 * Polish payment metrics
 */
export interface PolishPaymentMetrics {
  polishRevenue: number;
  blikTransactions: number;
  przelewy24Transactions: number;
  pblTransactions: number;
  installmentTransactions: number;
  averageTransactionPLN: number;
  polishPaymentMethodUsage: Record<PolishPaymentMethodType, number>;
  companyPayments: number;
  individualPayments: number;
  invoiceRequests: number;
  vatCollected: number;
}

/**
 * Monthly revenue
 */
export interface MonthlyRevenue {
  month: string;
  revenue: number;
  transactions: number;
  averageValue: number;
  currency: Currency;
}

/**
 * Popular payment method
 */
export interface PopularPaymentMethod {
  method: PaymentMethodType;
  usage: number;
  percentage: number;
  revenue: number;
  averageTransactionValue: number;
}

/**
 * Payment configuration
 */
export interface PaymentConfiguration {
  enabledGateways: PaymentGateway[];
  supportedMethods: PaymentMethodType[];
  defaultCurrency: Currency;
  supportedCurrencies: Currency[];
  polishPaymentMethods: PolishPaymentConfiguration;
  feeConfiguration: FeeConfiguration;
  installmentConfiguration: InstallmentConfiguration;
  refundConfiguration: RefundConfiguration;
}

/**
 * Polish payment configuration
 */
export interface PolishPaymentConfiguration {
  blikEnabled: boolean;
  przelewy24Enabled: boolean;
  pblBanks: PolishBank[];
  installmentProviders: InstallmentProvider[];
  autoInvoiceGeneration: boolean;
  vatRates: VatRate[];
  polishLanguageSupport: boolean;
}

/**
 * Polish bank
 */
export interface PolishBank {
  code: string;
  name: string;
  namePl: string;
  logoUrl?: string;
  supported: boolean;
  pblAvailable: boolean;
  installmentAvailable: boolean;
}

/**
 * Installment provider
 */
export interface InstallmentProvider {
  name: string;
  displayName: string;
  displayNamePl: string;
  minAmount: number;
  maxAmount: number;
  maxInstallments: number;
  interestRates: InstallmentInterestRate[];
  enabled: boolean;
}

/**
 * Installment interest rate
 */
export interface InstallmentInterestRate {
  installments: number;
  interestRate: number;
  apr: number;
  monthlyPayment: number;
}

/**
 * VAT rate
 */
export interface VatRate {
  rate: number;
  description: string;
  descriptionPl: string;
  applicableServices: string[];
}

/**
 * Fee configuration
 */
export interface FeeConfiguration {
  processingFees: ProcessingFee[];
  platformFee: {
    type: 'fixed' | 'percentage';
    value: number;
    currency: Currency;
  };
  currencyConversionFees: CurrencyConversionFee[];
}

/**
 * Processing fee
 */
export interface ProcessingFee {
  gateway: PaymentGateway;
  paymentMethod: PaymentMethodType;
  type: 'fixed' | 'percentage';
  value: number;
  currency?: Currency;
  conditions?: string[];
}

/**
 * Currency conversion fee
 */
export interface CurrencyConversionFee {
  fromCurrency: Currency;
  toCurrency: Currency;
  fee: number;
  feeType: 'percentage' | 'fixed';
}

/**
 * Installment configuration
 */
export interface InstallmentConfiguration {
  enabledProviders: string[];
  defaultProvider?: string;
  minAmountForInstallments: number;
  maxInstallments: number;
  gracePeriod: number; // days
}

/**
 * Refund configuration
 */
export interface RefundConfiguration {
  autoRefundEnabled: boolean;
  refundPeriod: number; // days
  refundReasons: RefundReason[];
  partialRefundAllowed: boolean;
  refundFeePolicy: RefundFeePolicy;
}

/**
 * Refund fee policy
 */
export interface RefundFeePolicy {
  chargeFee: boolean;
  feeType: 'fixed' | 'percentage';
  feeValue: number;
  feeCurrency: Currency;
  exemptConditions: string[];
}

/**
 * Payment method update request
 */
export interface UpdatePaymentMethodRequest {
  isDefault?: boolean;
  billingDetails?: BillingDetails;
  metadata?: Record<string, any>;
}

/**
 * Payment intent confirmation request
 */
export interface ConfirmPaymentIntentRequest {
  paymentIntentId: string;
  paymentMethodId?: string;
  savePaymentMethod?: boolean;
  receiptEmail?: string;
  shipping?: ShippingDetails;
  return_url?: string;
}

/**
 * Payment setup intent
 */
export interface SetupIntent {
  id: string;
  clientSecret?: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'canceled' | 'succeeded';
  usage: 'on_session' | 'off_session';
  paymentMethods: PaymentMethodType[];
  paymentMethod?: PaymentMethod;
  nextAction?: NextAction;
  createdAt: string;
}

/**
 * Create setup intent request
 */
export interface CreateSetupIntentRequest {
  customerId?: string;
  usage?: 'on_session' | 'off_session';
  paymentMethodTypes?: PaymentMethodType[];
  confirmImmediately?: boolean;
  return_url?: string;
  metadata?: Record<string, any>;
}

/**
 * Payment method usage
 */
export interface PaymentMethodUsage {
  paymentMethodId: string;
  usageCount: number;
  totalAmount: number;
  lastUsed: string;
  isDefault: boolean;
}

/**
 * Payment API interface
 */
export interface PaymentsApi {
  /**
   * Create a payment intent
   */
  createPaymentIntent(request: CreatePaymentIntentRequest): Promise<ApiResponse<PaymentIntent>>;

  /**
   * Get a payment intent
   */
  getPaymentIntent(paymentIntentId: string): Promise<ApiResponse<PaymentIntent>>;

  /**
   * Confirm a payment intent
   */
  confirmPaymentIntent(request: ConfirmPaymentIntentRequest): Promise<ApiResponse<PaymentIntent>>;

  /**
   * Cancel a payment intent
   */
  cancelPaymentIntent(paymentIntentId: string): Promise<ApiResponse<PaymentIntent>>;

  /**
   * Get a payment
   */
  getPayment(paymentId: string): Promise<ApiResponse<Payment>>;

  /**
   * Get user's payments
   */
  listPayments(params?: ListPaymentsParams): Promise<ApiResponse<Payment[]>>;

  /**
   * Create a refund
   */
  createRefund(request: CreateRefundRequest): Promise<ApiResponse<Refund>>;

  /**
   * Get a refund
   */
  getRefund(refundId: string): Promise<ApiResponse<Refund>>;

  /**
   * Get refunds for a payment
   */
  listRefunds(paymentId: string, params?: ListParams): Promise<ApiResponse<Refund[]>>;

  /**
   * Create a payment method
   */
  createPaymentMethod(request: CreatePaymentMethodRequest): Promise<ApiResponse<PaymentMethod>>;

  /**
   * Get a payment method
   */
  getPaymentMethod(paymentMethodId: string): Promise<ApiResponse<PaymentMethod>>;

  /**
   * Get user's payment methods
   */
  listPaymentMethods(params?: ListPaymentMethodsParams): Promise<ApiResponse<PaymentMethod[]>>;

  /**
   * Update a payment method
   */
  updatePaymentMethod(paymentMethodId: string, request: UpdatePaymentMethodRequest): Promise<ApiResponse<PaymentMethod>>;

  /**
   * Delete a payment method
   */
  deletePaymentMethod(paymentMethodId: string): Promise<ApiResponse<void>>;

  /**
   * Create a setup intent
   */
  createSetupIntent(request?: CreateSetupIntentRequest): Promise<ApiResponse<SetupIntent>>;

  /**
   * Get a setup intent
   */
  getSetupIntent(setupIntentId: string): Promise<ApiResponse<SetupIntent>>;

  /**
   * Get payment analytics
   */
  getAnalytics(params?: AnalyticsParams): Promise<ApiResponse<PaymentAnalytics>>;

  /**
   * Get payment configuration
   */
  getConfiguration(): Promise<ApiResponse<PaymentConfiguration>>;

  /**
   * Get Polish banks
   */
  getPolishBanks(): Promise<ApiResponse<PolishBank[]>>;

  /**
   * Calculate installment options
   */
  calculateInstallments(amount: number, provider?: string): Promise<ApiResponse<InstallmentOption[]>>;

  /**
   * Get payment method usage statistics
   */
  getPaymentMethodUsage(params?: ListParams): Promise<ApiResponse<PaymentMethodUsage[]>>;

  /**
   * Create invoice for payment
   */
  createInvoice(paymentId: string, invoiceData: CreateInvoiceRequest): Promise<ApiResponse<Invoice>>;

  /**
   * Get invoice
   */
  getInvoice(invoiceId: string): Promise<ApiResponse<Invoice>>;

  /**
   * Download invoice
   */
  downloadInvoice(invoiceId: string): Promise<ApiResponse<Blob>>;

  /**
   * Process webhook
   */
  processWebhook(webhookData: any, signature: string): Promise<ApiResponse<WebhookProcessingResult>>;
}

/**
 * List payments parameters
 */
export interface ListPaymentsParams extends ListParams {
  status?: PaymentStatus;
  paymentMethod?: PaymentMethodType;
  gateway?: PaymentGateway;
  bookingId?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

/**
 * List payment methods parameters
 */
export interface ListPaymentMethodsParams extends ListParams {
  type?: PaymentMethodType;
  isDefault?: boolean;
}

/**
 * Analytics parameters
 */
export interface AnalyticsParams {
  dateFrom: string;
  dateTo: string;
  currency?: Currency;
  paymentMethod?: PaymentMethodType;
  gateway?: PaymentGateway;
  groupBy?: 'day' | 'week' | 'month' | 'payment_method' | 'gateway';
  includePolishMetrics?: boolean;
}

/**
 * Installment option
 */
export interface InstallmentOption {
  provider: string;
  installments: number;
  monthlyPayment: number;
  totalAmount: number;
  interestRate: number;
  apr: number;
  firstPaymentDate: string;
}

/**
 * Create invoice request
 */
export interface CreateInvoiceRequest {
  type: 'proforma' | 'vat' | 'corrective';
  issueDate: string;
  dueDate?: string;
  sellerDetails: PolishCompanyBillingDetails;
  buyerDetails: PolishCompanyBillingDetails;
  items: InvoiceItem[];
  notes?: string;
  paymentMethod?: string;
  paymentDue?: number;
}

/**
 * Invoice item
 */
export interface InvoiceItem {
  name: string;
  namePl?: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  totalNet: number;
  totalGross: number;
}

/**
 * Invoice
 */
export interface Invoice {
  id: string;
  number: string;
  type: 'proforma' | 'vat' | 'corrective';
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate?: string;
  paidDate?: string;
  sellerDetails: PolishCompanyBillingDetails;
  buyerDetails: PolishCompanyBillingDetails;
  items: InvoiceItem[];
  totalNet: number;
  totalVat: number;
  totalGross: number;
  currency: Currency;
  paymentStatus: 'unpaid' | 'partially_paid' | 'paid' | 'overdue';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  downloadUrl?: string;
}

/**
 * Webhook processing result
 */
export interface WebhookProcessingResult {
  processed: boolean;
  eventType: string;
  data: any;
  errors?: string[];
}