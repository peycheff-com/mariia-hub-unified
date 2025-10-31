/**
 * Polish Payment Gateway Service
 *
 * Implements payment methods popular in Poland:
 * - BLIK (instant mobile payments)
 * - PayU (Polish payment gateway)
 * - Przelewy24 (traditional bank transfers)
 * - mBank, Pekao, PKO BP integrations
 */

import { PaymentProvider, PaymentMethod, PaymentIntentParams, PaymentResult, RefundParams, RefundResult, PaymentStatus, WebhookResult } from './payment-factory';
import { createClient } from '@supabase/supabase-js';

interface BLIKConfig {
  merchantId: string;
  apiKey: string;
  apiSecret: string;
  environment: 'sandbox' | 'production';
}

interface PayUConfig {
  posId: string;
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'production';
  signatureKey: string;
}

interface Przelewy24Config {
  merchantId: string;
  posId: string;
  apiKey: string;
  crc: string;
  environment: 'sandbox' | 'production';
}

interface BLIKPayment {
  blikCode: string;
  alias?: string;
  registerAlias?: boolean;
  expirationTime: number; // in minutes
}

interface PayUPayment {
  payMethodId?: string;
  description: string;
  customerIp: string;
  continueUrl?: string;
}

interface Przelewy24Payment {
  methodId: number;
  description: string;
  email: string;
  country: string;
  language: string;
  urlReturn: string;
  urlStatus: string;
}

export class PolishPaymentGateway implements PaymentProvider {
  name = 'polish-gateways';
  supportedMethods: PaymentMethod[] = [];
  supportedCurrencies = ['PLN'];

  private supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
  );

  private blikConfig: BLIKConfig;
  private payuConfig: PayUConfig;
  private przelewy24Config: Przelewy24Config;

  constructor() {
    this.initializeConfig();
    this.setupPaymentMethods();
  }

  private initializeConfig() {
    // BLIK Configuration
    this.blikConfig = {
      merchantId: import.meta.env.VITE_BLIK_MERCHANT_ID || '',
      apiKey: import.meta.env.VITE_BLIK_API_KEY || '',
      apiSecret: import.meta.env.VITE_BLIK_API_SECRET || '',
      environment: (import.meta.env.VITE_BLIK_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
    };

    // PayU Configuration
    this.payuConfig = {
      posId: import.meta.env.VITE_PAYU_POS_ID || '',
      clientId: import.meta.env.VITE_PAYU_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_PAYU_CLIENT_SECRET || '',
      environment: (import.meta.env.VITE_PAYU_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
      signatureKey: import.meta.env.VITE_PAYU_SIGNATURE_KEY || ''
    };

    // Przelewy24 Configuration
    this.przelewy24Config = {
      merchantId: import.meta.env.VITE_PRZELEWY24_MERCHANT_ID || '',
      posId: import.meta.env.VITE_PRZELEWY24_POS_ID || '',
      apiKey: import.meta.env.VITE_PRZELEWY24_API_KEY || '',
      crc: import.meta.env.VITE_PRZELEWY24_CRC || '',
      environment: (import.meta.env.VITE_PRZELEWY24_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
    };
  }

  private setupPaymentMethods() {
    this.supportedMethods = [
      {
        id: 'blik',
        name: 'BLIK',
        displayName: 'BLIK - Szybka płatność mobilna',
        type: 'mobile',
        provider: 'polish-gateways',
        icon: '/icons/blik-logo.svg',
        description: 'Natychmiastowa płatność za pomocą kodu BLIK z aplikacji bankowej',
        fees: {
          type: 'fixed',
          fixed: 0,
          currency: 'PLN',
          description: 'Darmowa płatność dla klientów'
        },
        limits: {
          minAmount: 1,
          maxAmount: 25000, // 250 PLN limit per transaction
          currency: 'PLN',
          dailyLimit: 50000, // 500 PLN daily limit
          monthlyLimit: 100000 // 1000 PLN monthly limit
        },
        availableCountries: ['PL'],
        verificationRequired: false,
        processingTime: {
          type: 'instant',
          value: 0,
          description: 'Płatność natychmiastowa'
        },
        metadata: {
          popularInPoland: true,
          userFriendly: true,
          mobileFirst: true
        }
      },
      {
        id: 'payu',
        name: 'PayU',
        displayName: 'PayU - Płatności online',
        type: 'bank_transfer',
        provider: 'polish-gateways',
        icon: '/icons/payu-logo.svg',
        description: 'Tradycyjny przelew online dostępny w polskich bankach',
        fees: {
          type: 'percentage',
          percentage: 1.0,
          currency: 'PLN',
          description: '1% opłata transakcyjna'
        },
        limits: {
          minAmount: 1,
          maxAmount: 50000, // 500 PLN
          currency: 'PLN'
        },
        availableCountries: ['PL'],
        verificationRequired: false,
        processingTime: {
          type: 'minutes',
          value: 15,
          description: 'Do 15 minut'
        },
        metadata: {
          supportedBanks: [
            'PKO BP', 'mBank', 'Bank Pekao', 'ING Bank Śląski',
            'Bank Millennium', 'Alior Bank', 'Santander', 'Getin Bank'
          ]
        }
      },
      {
        id: 'przelewy24',
        name: 'Przelewy24',
        displayName: 'Przelewy24 - Szybkie przelewy',
        type: 'bank_transfer',
        provider: 'polish-gateways',
        icon: '/icons/przelewy24-logo.svg',
        description: 'Najszybsze przelewy online z polskich banków',
        fees: {
          type: 'percentage',
          percentage: 1.2,
          currency: 'PLN',
          description: '1.2% opłata transakcyjna'
        },
        limits: {
          minAmount: 1,
          maxAmount: 250000, // 2500 PLN
          currency: 'PLN'
        },
        availableCountries: ['PL'],
        verificationRequired: false,
        processingTime: {
          type: 'minutes',
          value: 10,
          description: 'Do 10 minut'
        },
        metadata: {
          instantBanking: true,
          supportedMethods: [
            'mTransfer', 'Przelew na telefon', 'Blik', 'Płacę z iPKO',
            'Płać z ING', 'e-Płatności', 'Płacę z Aliora'
          ]
        }
      },
      {
        id: 'cash_on_delivery',
        name: 'Płatność przy odbiorze',
        displayName: 'Gotówka przy odbiorze',
        type: 'cash',
        provider: 'polish-gateways',
        icon: '/icons/cash-icon.svg',
        description: 'Zapłać gotówką podczas wizyty w salonie',
        fees: {
          type: 'fixed',
          fixed: 0,
          currency: 'PLN',
          description: 'Bez opłat'
        },
        limits: {
          minAmount: 50,
          maxAmount: 2000, // 20 PLN
          currency: 'PLN'
        },
        availableCountries: ['PL'],
        verificationRequired: false,
        processingTime: {
          type: 'instant',
          value: 0,
          description: 'Płatność przy odbiorze'
        },
        metadata: {
          inPersonPayment: true,
          requiresAppointment: true
        }
      },
      {
        id: 'bank_transfer',
        name: 'Przelew bankowy',
        displayName: 'Tradycyjny przelew',
        type: 'bank_transfer',
        provider: 'polish-gateways',
        icon: '/icons/bank-transfer-icon.svg',
        description: 'Przelew tradycyjny na konto bankowe',
        fees: {
          type: 'fixed',
          fixed: 0,
          currency: 'PLN',
          description: 'Bez opłat'
        },
        limits: {
          minAmount: 1,
          maxAmount: 1000000, // 10000 PLN
          currency: 'PLN'
        },
        availableCountries: ['PL'],
        verificationRequired: false,
        processingTime: {
          type: 'hours',
          value: 24,
          description: 'Do 24 godzin'
        },
        metadata: {
          accountDetails: {
            bank: 'mBank S.A.',
            accountNumber: 'PL 1234 5678 9012 3456 7890 1234 5678',
            recipient: 'mariiaborysevych Sp. z o.o.',
            address: 'ul. Jana Pawła II 43/15, 00-001 Warszawa'
          }
        }
      }
    ];
  }

  async initialize(): Promise<boolean> {
    try {
      // Test configurations
      const configsValid = await this.validateConfigurations();
      if (!configsValid) {
        console.warn('Some Polish payment gateway configurations are invalid');
      }

      console.log('Polish payment gateways initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Polish payment gateways:', error);
      return false;
    }
  }

  private async validateConfigurations(): Promise<boolean> {
    const validations = await Promise.allSettled([
      this.validateBLIKConfig(),
      this.validatePayUConfig(),
      this.validatePrzelewy24Config()
    ]);

    return validations.some(validation => validation.status === 'fulfilled');
  }

  private async validateBLIKConfig(): Promise<boolean> {
    if (!this.blikConfig.merchantId || !this.blikConfig.apiKey) {
      return false;
    }

    try {
      // Test BLIK connectivity
      const response = await this.makeBLIKRequest('/test', {}, 'GET');
      return response.success;
    } catch {
      return false;
    }
  }

  private async validatePayUConfig(): Promise<boolean> {
    if (!this.payuConfig.posId || !this.payuConfig.clientId) {
      return false;
    }

    try {
      // Test PayU connectivity
      const response = await this.makePayURequest('/oauth/authorize', {
        grant_type: 'client_credentials',
        client_id: this.payuConfig.clientId,
        client_secret: this.payuConfig.clientSecret
      }, 'POST');

      return response.success;
    } catch {
      return false;
    }
  }

  private async validatePrzelewy24Config(): Promise<boolean> {
    if (!this.przelewy24Config.merchantId || !this.przelewy24Config.apiKey) {
      return false;
    }

    try {
      // Test Przelewy24 connectivity
      const response = await this.makePrzelewy24Request('/testConnection', {}, 'GET');
      return response.success;
    } catch {
      return false;
    }
  }

  async createPaymentIntent(params: PaymentIntentParams): Promise<PaymentResult> {
    try {
      const paymentMethod = this.supportedMethods.find(m => m.id === params.paymentMethodId);
      if (!paymentMethod) {
        return {
          success: false,
          status: { status: 'failed', paid: false, amount: params.amount, currency: params.currency, createdAt: new Date().toISOString() },
          error: {
            code: 'UNSUPPORTED_PAYMENT_METHOD',
            message: `Payment method ${params.paymentMethodId} is not supported`,
            type: 'validation',
            retryPossible: false
          },
          provider: this.name
        };
      }

      // Validate amount against limits
      if (params.amount < paymentMethod.limits.minAmount || params.amount > paymentMethod.limits.maxAmount) {
        return {
          success: false,
          status: { status: 'failed', paid: false, amount: params.amount, currency: params.currency, createdAt: new Date().toISOString() },
          error: {
            code: 'AMOUNT_OUT_OF_RANGE',
            message: `Amount must be between ${paymentMethod.limits.minAmount} and ${paymentMethod.limits.maxAmount} ${params.currency}`,
            type: 'validation',
            retryPossible: false
          },
          provider: this.name
        };
      }

      // Route to appropriate payment provider
      let result: PaymentResult;

      switch (params.paymentMethodId) {
        case 'blik':
          result = await this.createBLIKPayment(params);
          break;
        case 'payu':
          result = await this.createPayUPayment(params);
          break;
        case 'przelewy24':
          result = await this.createPrzelewy24Payment(params);
          break;
        case 'cash_on_delivery':
          result = await this.createCashOnDeliveryPayment(params);
          break;
        case 'bank_transfer':
          result = await this.createBankTransferPayment(params);
          break;
        default:
          return {
            success: false,
            status: { status: 'failed', paid: false, amount: params.amount, currency: params.currency, createdAt: new Date().toISOString() },
            error: {
              code: 'UNSUPPORTED_PAYMENT_METHOD',
              message: 'Payment method not implemented',
              type: 'validation',
              retryPossible: false
            },
            provider: this.name
          };
      }

      // Store payment attempt
      await this.storePaymentAttempt({
        paymentIntentId: result.paymentIntentId,
        method: params.paymentMethodId,
        amount: params.amount,
        currency: params.currency,
        status: result.status.status,
        customerId: params.customerId,
        bookingId: params.bookingId,
        metadata: params.metadata
      });

      return result;

    } catch (error) {
      console.error('Polish payment gateway error:', error);
      return {
        success: false,
        status: { status: 'failed', paid: false, amount: params.amount, currency: params.currency, createdAt: new Date().toISOString() },
        error: {
          code: 'PAYMENT_PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          type: 'provider',
          retryPossible: true
        },
        provider: this.name
      };
    }
  }

  async confirmPayment(paymentIntentId: string, params?: any): Promise<PaymentResult> {
    try {
      // Get payment details
      const paymentDetails = await this.getPaymentDetails(paymentIntentId);
      if (!paymentDetails) {
        return {
          success: false,
          status: { status: 'failed', paid: false, amount: 0, currency: 'PLN', createdAt: new Date().toISOString() },
          error: {
            code: 'PAYMENT_NOT_FOUND',
            message: 'Payment not found',
            type: 'validation',
            retryPossible: false
          },
          provider: this.name
        };
      }

      // Confirm based on payment method
      let result: PaymentResult;

      switch (paymentDetails.method) {
        case 'blik':
          result = await this.confirmBLIKPayment(paymentIntentId, params);
          break;
        case 'payu':
          result = await this.confirmPayUPayment(paymentIntentId, params);
          break;
        case 'przelewy24':
          result = await this.confirmPrzelewy24Payment(paymentIntentId, params);
          break;
        default:
          result = {
            success: true,
            paymentIntentId,
            status: { status: 'succeeded', paid: true, amount: paymentDetails.amount, currency: paymentDetails.currency, createdAt: paymentDetails.createdAt, processedAt: new Date().toISOString() },
            provider: this.name
          };
      }

      // Update payment status
      await this.updatePaymentStatus(paymentIntentId, result.status.status);

      return result;

    } catch (error) {
      console.error('Payment confirmation error:', error);
      return {
        success: false,
        status: { status: 'failed', paid: false, amount: 0, currency: 'PLN', createdAt: new Date().toISOString() },
        error: {
          code: 'PAYMENT_CONFIRMATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          type: 'provider',
          retryPossible: true
        },
        provider: this.name
      };
    }
  }

  async refundPayment(paymentIntentId: string, params?: RefundParams): Promise<RefundResult> {
    try {
      const paymentDetails = await this.getPaymentDetails(paymentIntentId);
      if (!paymentDetails) {
        return {
          success: false,
          status: 'failed',
          error: {
            code: 'PAYMENT_NOT_FOUND',
            message: 'Payment not found',
            type: 'validation',
            retryPossible: false
          }
        };
      }

      // Handle refunds based on payment method
      // Note: Some Polish payment methods like cash on delivery don't support refunds
      if (paymentDetails.method === 'cash_on_delivery') {
        return {
          success: false,
          status: 'failed',
          error: {
            code: 'REFUND_NOT_SUPPORTED',
            message: 'Refunds not supported for cash payments',
            type: 'validation',
            retryPossible: false
          }
        };
      }

      // Process refund based on provider
      let refundResult: RefundResult;

      switch (paymentDetails.method) {
        case 'payu':
          refundResult = await this.processPayURefund(paymentIntentId, params);
          break;
        case 'przelewy24':
          refundResult = await this.processPrzelewy24Refund(paymentIntentId, params);
          break;
        default:
          refundResult = {
            success: true,
            refundId: `refund_${Date.now()}`,
            status: 'succeeded',
            amount: params?.amount || paymentDetails.amount,
            currency: paymentDetails.currency,
            reason: params?.reason || 'requested_by_customer',
            processingTime: {
              type: 'days',
              value: 7,
              description: 'Do 7 dni roboczych'
            }
          };
      }

      // Store refund record
      if (refundResult.success) {
        await this.storeRefundRecord({
          refundId: refundResult.refundId,
          paymentIntentId,
          amount: refundResult.amount,
          reason: refundResult.reason,
          status: refundResult.status
        });
      }

      return refundResult;

    } catch (error) {
      console.error('Refund processing error:', error);
      return {
        success: false,
        status: 'failed',
        error: {
          code: 'REFUND_PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          type: 'provider',
          retryPossible: true
        }
      };
    }
  }

  async getPaymentStatus(paymentIntentId: string): Promise<PaymentStatus> {
    const paymentDetails = await this.getPaymentDetails(paymentIntentId);

    if (!paymentDetails) {
      return {
        status: 'failed',
        paid: false,
        amount: 0,
        currency: 'PLN',
        createdAt: new Date().toISOString()
      };
    }

    return {
      status: paymentDetails.status as any,
      paid: paymentDetails.status === 'succeeded',
      amount: paymentDetails.amount,
      currency: paymentDetails.currency,
      createdAt: paymentDetails.createdAt,
      updatedAt: paymentDetails.updated_at,
      processedAt: paymentDetails.processed_at
    };
  }

  async handleWebhook(payload: string, signature: string): Promise<WebhookResult> {
    try {
      const event = JSON.parse(payload);
      const eventType = event.type || 'unknown';
      const eventId = event.id || `event_${Date.now()}`;

      // Process webhook based on provider
      switch (event.provider) {
        case 'payu':
          await this.handlePayUWebhook(event);
          break;
        case 'przelewy24':
          await this.handlePrzelewy24Webhook(event);
          break;
        case 'blik':
          await this.handleBLIKWebhook(event);
          break;
        default:
          console.warn(`Unhandled webhook provider: ${event.provider}`);
      }

      // Store webhook log
      await this.storeWebhookLog({
        provider: event.provider,
        eventType,
        eventId,
        payload,
        processed: true
      });

      return {
        processed: true,
        eventType,
        eventId,
        processedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Webhook processing error:', error);
      return {
        processed: false,
        eventType: 'unknown',
        eventId: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown webhook error',
        processedAt: new Date().toISOString()
      };
    }
  }

  // BLIK Implementation
  private async createBLIKPayment(params: PaymentIntentParams): Promise<PaymentResult> {
    try {
      const blikPayment: BLIKPayment = {
        blikCode: params.metadata?.blikCode,
        alias: params.metadata?.blikAlias,
        registerAlias: params.metadata?.registerAlias || false,
        expirationTime: 5 // 5 minutes
      };

      const response = await this.makeBLIKRequest('/payment/create', {
        merchantId: this.blikConfig.merchantId,
        amount: params.amount,
        currency: params.currency,
        description: params.description || 'Płatność za usługę',
        blikCode: blikPayment.blikCode,
        returnUrl: params.returnUrl,
        transactionId: `blik_${Date.now()}`,
        metadata: params.metadata
      });

      if (!response.success) {
        return {
          success: false,
          status: { status: 'failed', paid: false, amount: params.amount, currency: params.currency, createdAt: new Date().toISOString() },
          error: {
            code: 'BLIK_PAYMENT_FAILED',
            message: response.error || 'BLIK payment failed',
            type: 'provider',
            retryPossible: true
          },
          provider: this.name
        };
      }

      return {
        success: true,
        paymentIntentId: response.data.transactionId,
        clientSecret: response.data.clientSecret,
        status: { status: 'pending', paid: false, amount: params.amount, currency: params.currency, createdAt: new Date().toISOString() },
        requiresAction: true,
        nextAction: {
          type: 'use_stripe_sdk',
          description: 'Wprowadź kod BLIK w aplikacji bankowej',
          expiresIn: 300 // 5 minutes
        },
        provider: this.name,
        metadata: response.data
      };

    } catch (error) {
      return {
        success: false,
        status: { status: 'failed', paid: false, amount: params.amount, currency: params.currency, createdAt: new Date().toISOString() },
        error: {
          code: 'BLIK_ERROR',
          message: error instanceof Error ? error.message : 'BLIK service error',
          type: 'provider',
          retryPossible: true
        },
        provider: this.name
      };
    }
  }

  private async confirmBLIKPayment(paymentIntentId: string, params: any): Promise<PaymentResult> {
    try {
      const response = await this.makeBLIKRequest('/payment/confirm', {
        transactionId: paymentIntentId,
        blikCode: params.blikCode,
        confirmationCode: params.confirmationCode
      });

      if (response.success && response.data.status === 'CONFIRMED') {
        return {
          success: true,
          paymentIntentId,
          status: { status: 'succeeded', paid: true, amount: response.data.amount, currency: response.data.currency, createdAt: response.data.createdAt, processedAt: new Date().toISOString() },
          provider: this.name
        };
      }

      return {
        success: false,
        status: { status: 'failed', paid: false, amount: 0, currency: 'PLN', createdAt: new Date().toISOString() },
        error: {
          code: 'BLIK_CONFIRMATION_FAILED',
          message: 'BLIK payment confirmation failed',
          type: 'provider',
          retryPossible: true
        },
        provider: this.name
      };

    } catch (error) {
      return {
        success: false,
        status: { status: 'failed', paid: false, amount: 0, currency: 'PLN', createdAt: new Date().toISOString() },
        error: {
          code: 'BLIK_CONFIRMATION_ERROR',
          message: error instanceof Error ? error.message : 'BLIK confirmation error',
          type: 'provider',
          retryPossible: true
        },
        provider: this.name
      };
    }
  }

  // PayU Implementation
  private async createPayUPayment(params: PaymentIntentParams): Promise<PaymentResult> {
    try {
      // First, get OAuth token
      const authResponse = await this.makePayURequest('/oauth/authorize', {
        grant_type: 'client_credentials',
        client_id: this.payuConfig.clientId,
        client_secret: this.payuConfig.clientSecret
      }, 'POST');

      if (!authResponse.success) {
        throw new Error('Failed to authenticate with PayU');
      }

      const accessToken = authResponse.data.access_token;

      // Create payment
      const paymentData: PayUPayment = {
        payMethodId: params.metadata?.payMethodId,
        description: params.description || 'Płatność za usługę w mariiaborysevych',
        customerIp: params.metadata?.customerIp || '127.0.0.1',
        continueUrl: params.returnUrl
      };

      const response = await this.makePayURequest('/api/v2_1/orders', {
        notifyUrl: `${window.location.origin}/api/webhooks/payu`,
        customerIp: paymentData.customerIp,
        merchantPosId: this.payuConfig.posId,
        description: paymentData.description,
        currencyCode: params.currency,
        totalAmount: params.amount * 100, // PayU uses cents
        products: [{
          name: params.description || 'Usługa',
          unitPrice: params.amount * 100,
          quantity: 1
        }],
        buyer: {
          email: params.metadata?.customerEmail,
          phone: params.metadata?.customerPhone
        },
        settings: {
          invoiceDisabled: true
        },
        payMethod: paymentData.payMethodId ? {
          type: 'PBL',
          value: paymentData.payMethodId
        } : undefined,
        continueUrl: paymentData.continueUrl
      }, 'POST', accessToken);

      if (!response.success) {
        return {
          success: false,
          status: { status: 'failed', paid: false, amount: params.amount, currency: params.currency, createdAt: new Date().toISOString() },
          error: {
            code: 'PAYU_PAYMENT_FAILED',
            message: response.error || 'PayU payment failed',
            type: 'provider',
            retryPossible: true
          },
          provider: this.name
        };
      }

      const redirectUri = response.data.redirectUri;
      const orderId = response.data.orderId;

      return {
        success: true,
        paymentIntentId: orderId,
        status: { status: 'pending', paid: false, amount: params.amount, currency: params.currency, createdAt: new Date().toISOString() },
        requiresAction: true,
        nextAction: {
          type: 'redirect_to_url',
          url: redirectUri,
          description: 'Przekierowanie do strony płatności PayU'
        },
        provider: this.name,
        metadata: response.data
      };

    } catch (error) {
      return {
        success: false,
        status: { status: 'failed', paid: false, amount: params.amount, currency: params.currency, createdAt: new Date().toISOString() },
        error: {
          code: 'PAYU_ERROR',
          message: error instanceof Error ? error.message : 'PayU service error',
          type: 'provider',
          retryPossible: true
        },
        provider: this.name
      };
    }
  }

  private async confirmPayUPayment(paymentIntentId: string, params: any): Promise<PaymentResult> {
    // PayU doesn't require confirmation - payment status is updated via webhooks
    return {
      success: true,
      paymentIntentId,
      status: { status: 'processing', paid: false, amount: 0, currency: 'PLN', createdAt: new Date().toISOString() },
      provider: this.name
    };
  }

  private async processPayURefund(paymentIntentId: string, params?: RefundParams): Promise<RefundResult> {
    try {
      // Get OAuth token
      const authResponse = await this.makePayURequest('/oauth/authorize', {
        grant_type: 'client_credentials',
        client_id: this.payuConfig.clientId,
        client_secret: this.payuConfig.clientSecret
      }, 'POST');

      if (!authResponse.success) {
        throw new Error('Failed to authenticate with PayU');
      }

      const accessToken = authResponse.data.access_token;

      const response = await this.makePayURequest(`/api/v2_1/orders/${paymentIntentId}/refund`, {
        refund: {
          amount: params?.amount || undefined, // If not specified, full refund
          description: params?.reason || 'Zwrot płatności'
        }
      }, 'POST', accessToken);

      if (response.success) {
        return {
          success: true,
          refundId: response.data.refundId,
          status: 'pending',
          amount: params?.amount,
          currency: 'PLN',
          reason: params?.reason || 'requested_by_customer',
          processingTime: {
            type: 'days',
            value: 3,
            description: 'Do 3 dni roboczych'
          }
        };
      }

      return {
        success: false,
        status: 'failed',
        error: {
          code: 'PAYU_REFUND_FAILED',
          message: response.error || 'PayU refund failed',
          type: 'provider',
          retryPossible: true
        }
      };

    } catch (error) {
      return {
        success: false,
        status: 'failed',
        error: {
          code: 'PAYU_REFUND_ERROR',
          message: error instanceof Error ? error.message : 'PayU refund error',
          type: 'provider',
          retryPossible: true
        }
      };
    }
  }

  // Przelewy24 Implementation
  private async createPrzelewy24Payment(params: PaymentIntentParams): Promise<PaymentResult> {
    try {
      const paymentData: Przelewy24Payment = {
        methodId: params.metadata?.methodId || 0, // Default to bank transfer selection
        description: params.description || 'Płatność za usługę w mariiaborysevych',
        email: params.metadata?.customerEmail,
        country: 'PL',
        language: 'pl',
        urlReturn: params.returnUrl,
        urlStatus: `${window.location.origin}/api/webhooks/przelewy24`
      };

      // Register transaction
      const registerResponse = await this.makePrzelewy24Request('/transaction/register', {
        merchantId: this.przelewy24Config.merchantId,
        posId: this.przelewy24Config.posId,
        sessionId: `p24_${Date.now()}`,
        amount: params.amount * 100, // Przelewy24 uses grosz
        currency: params.currency,
        description: paymentData.description,
        email: paymentData.email,
        country: paymentData.country,
        language: paymentData.language,
        url: paymentData.urlReturn,
        urlStatus: paymentData.urlStatus,
        method: paymentData.methodId,
        sign: this.generatePrzelewy24Signature({
          sessionId: `p24_${Date.now()}`,
          merchantId: this.przelewy24Config.merchantId,
          amount: params.amount * 100,
          currency: params.currency,
          crc: this.przelewy24Config.crc
        })
      }, 'POST');

      if (!registerResponse.success) {
        return {
          success: false,
          status: { status: 'failed', paid: false, amount: params.amount, currency: params.currency, createdAt: new Date().toISOString() },
          error: {
            code: 'PRZELEWY24_REGISTER_FAILED',
            message: registerResponse.error || 'Failed to register Przelewy24 transaction',
            type: 'provider',
            retryPossible: true
          },
          provider: this.name
        };
      }

      const paymentDataResponse = await this.makePrzelewy24Request('/transaction/payment', {
        token: registerResponse.data.token,
        language: 'pl'
      }, 'POST');

      if (!paymentDataResponse.success) {
        return {
          success: false,
          status: { status: 'failed', paid: false, amount: params.amount, currency: params.currency, createdAt: new Date().toISOString() },
          error: {
            code: 'PRZELEWY24_PAYMENT_FAILED',
            message: paymentDataResponse.error || 'Failed to create Przelewy24 payment',
            type: 'provider',
            retryPossible: true
          },
          provider: this.name
        };
      }

      return {
        success: true,
        paymentIntentId: registerResponse.data.token,
        status: { status: 'pending', paid: false, amount: params.amount, currency: params.currency, createdAt: new Date().toISOString() },
        requiresAction: true,
        nextAction: {
          type: 'redirect_to_url',
          url: paymentDataResponse.data.url,
          description: 'Przekierowanie do strony płatności Przelewy24'
        },
        provider: this.name,
        metadata: {
          token: registerResponse.data.token,
          sessionId: `p24_${Date.now()}`
        }
      };

    } catch (error) {
      return {
        success: false,
        status: { status: 'failed', paid: false, amount: params.amount, currency: params.currency, createdAt: new Date().toISOString() },
        error: {
          code: 'PRZELEWY24_ERROR',
          message: error instanceof Error ? error.message : 'Przelewy24 service error',
          type: 'provider',
          retryPossible: true
        },
        provider: this.name
      };
    }
  }

  private async confirmPrzelewy24Payment(paymentIntentId: string, params: any): Promise<PaymentResult> {
    // Przelewy24 doesn't require confirmation - payment status is updated via webhooks
    return {
      success: true,
      paymentIntentId,
      status: { status: 'processing', paid: false, amount: 0, currency: 'PLN', createdAt: new Date().toISOString() },
      provider: this.name
    };
  }

  private async processPrzelewy24Refund(paymentIntentId: string, params?: RefundParams): Promise<RefundResult> {
    try {
      // Przelewy24 refund implementation
      const response = await this.makePrzelewy24Request('/transaction/refund', {
        requestId: paymentIntentId,
        refoundUuid: `refund_${Date.now()}`,
        amount: params?.amount ? params.amount * 100 : undefined,
        mode: 'full'
      }, 'POST');

      if (response.success) {
        return {
          success: true,
          refundId: response.data.refundId,
          status: 'pending',
          amount: params?.amount,
          currency: 'PLN',
          reason: params?.reason || 'requested_by_customer',
          processingTime: {
            type: 'days',
            value: 5,
            description: 'Do 5 dni roboczych'
          }
        };
      }

      return {
        success: false,
        status: 'failed',
        error: {
          code: 'PRZELEWY24_REFUND_FAILED',
          message: response.error || 'Przelewy24 refund failed',
          type: 'provider',
          retryPossible: true
        }
      };

    } catch (error) {
      return {
        success: false,
        status: 'failed',
        error: {
          code: 'PRZELEWY24_REFUND_ERROR',
          message: error instanceof Error ? error.message : 'Przelewy24 refund error',
          type: 'provider',
          retryPossible: true
        }
      };
    }
  }

  // Cash on delivery implementation
  private async createCashOnDeliveryPayment(params: PaymentIntentParams): Promise<PaymentResult> {
    return {
      success: true,
      paymentIntentId: `cod_${Date.now()}`,
      status: { status: 'succeeded', paid: false, amount: params.amount, currency: params.currency, createdAt: new Date().toISOString() },
      provider: this.name,
      metadata: {
        paymentType: 'cash_on_delivery',
        instructions: 'Zapłać gotówką podczas wizyty w salonie',
        appointmentRequired: true
      }
    };
  }

  // Bank transfer implementation
  private async createBankTransferPayment(params: PaymentIntentParams): Promise<PaymentResult> {
    const bankTransferMethod = this.supportedMethods.find(m => m.id === 'bank_transfer');

    return {
      success: true,
      paymentIntentId: `transfer_${Date.now()}`,
      status: { status: 'pending', paid: false, amount: params.amount, currency: params.currency, createdAt: new Date().toISOString() },
      requiresAction: true,
      nextAction: {
        type: 'redirect_to_url',
        description: 'Dokonaj przelewu na podane konto bankowe'
      },
      provider: this.name,
      metadata: {
        paymentType: 'bank_transfer',
        accountDetails: bankTransferMethod?.metadata?.accountDetails,
        reference: `mariiaborysevych - Rezerwacja ${params.bookingId}`,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }
    };
  }

  // API Helper Methods
  private async makeBLIKRequest(endpoint: string, data: any, method: string = 'POST'): Promise<any> {
    const baseUrl = this.blikConfig.environment === 'production'
      ? 'https://api.blik.pl'
      : 'https://api.sandbox.blik.pl';

    const url = `${baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.blikConfig.apiKey}`
        },
        body: method === 'POST' ? JSON.stringify(data) : undefined
      });

      const result = await response.json();
      return {
        success: response.ok,
        data: result,
        error: response.ok ? null : result.error || 'BLIK API error'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  private async makePayURequest(endpoint: string, data: any, method: string = 'POST', accessToken?: string): Promise<any> {
    const baseUrl = this.payuConfig.environment === 'production'
      ? 'https://secure.payu.com'
      : 'https://secure.snd.payu.com';

    const url = `${baseUrl}${endpoint}`;

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(url, {
        method,
        headers,
        body: method === 'POST' ? JSON.stringify(data) : undefined
      });

      const result = await response.json();
      return {
        success: response.ok,
        data: result,
        error: response.ok ? null : result.error?.description || 'PayU API error'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  private async makePrzelewy24Request(endpoint: string, data: any, method: string = 'POST'): Promise<any> {
    const baseUrl = this.przelewy24Config.environment === 'production'
      ? 'https://api.przelewy24.pl'
      : 'https://sandbox.przelewy24.pl';

    const url = `${baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: method === 'POST' ? JSON.stringify(data) : undefined
      });

      const result = await response.json();
      return {
        success: response.ok,
        data: result,
        error: response.ok ? null : result.error || 'Przelewy24 API error'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  private generatePrzelewy24Signature(data: any): string {
    // Simple signature generation (in production, use proper crypto)
    const dataString = `${data.sessionId}|${data.merchantId}|${data.amount}|${data.currency}|${data.crc}`;
    return btoa(dataString); // In production, use SHA-256 or similar
  }

  // Webhook handlers
  private async handlePayUWebhook(event: any): Promise<void> {
    const { order: { orderId, status }, type } = event;

    if (type === 'order.status.changed') {
      await this.updatePaymentStatus(orderId, status === 'COMPLETED' ? 'succeeded' : 'failed');

      if (status === 'COMPLETED') {
        await this.handleSuccessfulPayment(orderId);
      }
    }
  }

  private async handlePrzelewy24Webhook(event: any): Promise<void> {
    const { sessionId, status } = event;

    if (status === 'success') {
      await this.updatePaymentStatus(sessionId, 'succeeded');
      await this.handleSuccessfulPayment(sessionId);
    } else if (status === 'error') {
      await this.updatePaymentStatus(sessionId, 'failed');
    }
  }

  private async handleBLIKWebhook(event: any): Promise<void> {
    const { transactionId, status } = event;

    if (status === 'CONFIRMED') {
      await this.updatePaymentStatus(transactionId, 'succeeded');
      await this.handleSuccessfulPayment(transactionId);
    } else if (status === 'REJECTED') {
      await this.updatePaymentStatus(transactionId, 'failed');
    }
  }

  // Database methods
  private async storePaymentAttempt(params: {
    paymentIntentId?: string;
    method: string;
    amount: number;
    currency: string;
    status: string;
    customerId?: string;
    bookingId?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.supabase
      .from('polish_payment_attempts')
      .insert({
        payment_intent_id: params.paymentIntentId,
        method: params.method,
        amount: params.amount,
        currency: params.currency,
        status: params.status,
        customer_id: params.customerId,
        booking_id: params.bookingId,
        metadata: params.metadata,
        created_at: new Date()
      });
  }

  private async getPaymentDetails(paymentIntentId: string): Promise<any> {
    const { data } = await this.supabase
      .from('polish_payment_attempts')
      .select('*')
      .eq('payment_intent_id', paymentIntentId)
      .single();

    return data;
  }

  private async updatePaymentStatus(paymentIntentId: string, status: string): Promise<void> {
    await this.supabase
      .from('polish_payment_attempts')
      .update({
        status,
        updated_at: new Date(),
        processed_at: status === 'succeeded' ? new Date() : null
      })
      .eq('payment_intent_id', paymentIntentId);
  }

  private async handleSuccessfulPayment(paymentIntentId: string): Promise<void> {
    const paymentDetails = await this.getPaymentDetails(paymentIntentId);

    if (paymentDetails?.booking_id) {
      // Update booking status
      await this.supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          paid: true,
          updated_at: new Date()
        })
        .eq('id', paymentDetails.booking_id);
    }
  }

  private async storeRefundRecord(params: {
    refundId?: string;
    paymentIntentId: string;
    amount?: number;
    reason?: string;
    status: string;
  }): Promise<void> {
    await this.supabase
      .from('polish_payment_refunds')
      .insert({
        refund_id: params.refundId,
        payment_intent_id: params.paymentIntentId,
        amount: params.amount,
        reason: params.reason,
        status: params.status,
        created_at: new Date()
      });
  }

  private async storeWebhookLog(params: {
    provider: string;
    eventType: string;
    eventId: string;
    payload: string;
    processed: boolean;
    error?: string;
  }): Promise<void> {
    await this.supabase
      .from('polish_webhook_logs')
      .insert({
        provider: params.provider,
        event_type: params.eventType,
        event_id: params.eventId,
        payload: params.payload,
        processed: params.processed,
        error: params.error,
        created_at: new Date()
      });
  }
}