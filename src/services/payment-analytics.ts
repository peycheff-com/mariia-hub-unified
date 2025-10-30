/**
 * Payment Analytics Service
 *
 * Comprehensive financial reporting and analytics:
 * - Daily settlement reports
 * - Payment method analytics
 * - Revenue tracking by service type
 * - Tax reporting preparation
 * - Integration with accounting systems
 * - Performance metrics and KPIs
 */

import { PaymentAnalytics as PaymentAnalyticsType } from './payment-factory';
import { createClient } from '@supabase/supabase-js';

interface FinancialMetrics {
  totalRevenue: number;
  netRevenue: number;
  grossRevenue: number;
  revenueByMonth: { month: string; revenue: number; change: number }[];
  revenueByServiceType: Record<string, { revenue: number; count: number; averageValue: number }>;
  revenueByPaymentMethod: Record<string, { revenue: number; count: number; fees: number }>;
  revenueByCurrency: Record<string, { revenue: number; count: number; change: number }>;
  customerMetrics: {
    newCustomers: number;
    returningCustomers: number;
    averageLifetimeValue: number;
    customerAcquisitionCost: number;
    churnRate: number;
  };
  conversionMetrics: {
    bookingConversionRate: number;
    paymentConversionRate: number;
    averageTimeToPayment: number;
    abandonedCartRate: number;
  };
}

interface SettlementReport {
  id: string;
  date: string;
  provider: string;
  totalAmount: number;
  currency: string;
  fees: number;
  netAmount: number;
  transactionCount: number;
  successfulTransactions: number;
  failedTransactions: number;
  refunds: number;
  chargebacks: number;
  transactions: SettlementTransaction[];
  metadata: Record<string, any>;
  generatedAt: string;
  status: 'draft' | 'final' | 'exported';
}

interface SettlementTransaction {
  id: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  fee: number;
  netAmount: number;
  status: string;
  paymentMethod: string;
  customerId: string;
  timestamp: string;
  metadata: Record<string, any>;
}

interface PerformanceReport {
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalTransactions: number;
    totalVolume: number;
    successRate: number;
    averageTransactionValue: number;
    totalFees: number;
    netRevenue: number;
  };
  paymentMethods: PaymentMethodPerformance[];
  customerSegments: CustomerSegmentPerformance[];
  trends: {
    daily: { date: string; transactions: number; volume: number }[];
    weekly: { week: string; transactions: number; volume: number }[];
    monthly: { month: string; transactions: number; volume: number }[];
  };
  forecasts: {
    nextMonthRevenue: number;
    nextQuarterRevenue: number;
    confidence: number;
  };
}

interface PaymentMethodPerformance {
  method: string;
  transactions: number;
  volume: number;
  successRate: number;
  averageProcessingTime: number;
  fees: number;
  feePercentage: number;
  chargebackRate: number;
  refundRate: number;
  customerSatisfaction: number;
}

interface CustomerSegmentPerformance {
  segment: string;
  customerCount: number;
  transactions: number;
  volume: number;
  averageTransactionValue: number;
  frequency: number;
  lifetimeValue: number;
  churnRate: number;
}

interface AccountingExport {
  format: 'csv' | 'xml' | 'json' | 'pdf';
  data: any;
  filename: string;
  generatedAt: string;
  type: 'transactions' | 'invoices' | 'refunds' | 'tax_report' | 'settlement';
  provider?: string;
  period: {
    start: string;
    end: string;
  };
}

interface FinancialAlert {
  id: string;
  type: 'revenue_drop' | 'high_failure_rate' | 'chargeback_spike' | 'compliance_issue' | 'fraud_detection';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metrics: Record<string, any>;
  threshold: number;
  currentValue: number;
  triggeredAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

interface ComplianceReport {
  id: string;
  type: 'aml' | 'kyc' | 'psd2' | 'gdpr' | 'audit';
  period: {
    start: string;
    end: string;
  };
  status: 'in_progress' | 'completed' | 'failed';
  findings: ComplianceFinding[];
  recommendations: string[];
  riskScore: number;
  lastUpdated: string;
  dueDate: string;
}

interface ComplianceFinding {
  category: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedRecords: number;
  recommendation: string;
  deadline: string;
  status: 'open' | 'in_progress' | 'resolved';
}

export class PaymentAnalytics {
  private supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
  );

  /**
   * Get comprehensive payment analytics
   */
  async getAnalytics(startDate?: Date, endDate?: Date): Promise<PaymentAnalyticsType> {
    try {
      const dateRange = this.getDateRange(startDate, endDate);

      // Get payment data
      const payments = await this.getPaymentData(dateRange.start, dateRange.end);

      // Calculate metrics
      const totalVolume = payments.reduce((sum, p) => sum + p.amount, 0);
      const transactionCount = payments.length;
      const successfulPayments = payments.filter(p => p.status === 'succeeded');
      const successRate = transactionCount > 0 ? (successfulPayments.length / transactionCount) * 100 : 0;
      const averageTransactionValue = transactionCount > 0 ? totalVolume / transactionCount : 0;

      // Payment method distribution
      const paymentMethodDistribution: Record<string, number> = {};
      const currencyDistribution: Record<string, number> = {};
      const providerPerformance: Record<string, any> = {};

      payments.forEach(payment => {
        paymentMethodDistribution[payment.paymentMethod || 'unknown'] =
          (paymentMethodDistribution[payment.paymentMethod || 'unknown'] || 0) + 1;

        currencyDistribution[payment.currency || 'PLN'] =
          (currencyDistribution[payment.currency || 'PLN'] || 0) + 1;

        const provider = payment.provider || 'unknown';
        if (!providerPerformance[provider]) {
          providerPerformance[provider] = { volume: 0, transactions: 0, successRate: 0, averageProcessingTime: 0 };
        }
        providerPerformance[provider].volume += payment.amount;
        providerPerformance[provider].transactions += 1;
      });

      // Calculate provider success rates and processing times
      for (const [provider, data] of Object.entries(providerPerformance)) {
        const providerPayments = payments.filter(p => p.provider === provider);
        const successfulProviderPayments = providerPayments.filter(p => p.status === 'succeeded');
        data.successRate = data.transactions > 0 ? (successfulProviderPayments.length / data.transactions) * 100 : 0;
        data.averageProcessingTime = this.calculateAverageProcessingTime(providerPayments);
      }

      // Get top currencies
      const topCurrencies = Object.entries(currencyDistribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([currency]) => currency);

      return {
        totalVolume,
        transactionCount,
        successRate,
        averageTransactionValue,
        paymentMethodDistribution,
        currencyDistribution,
        topCurrencies,
        providerPerformance
      };

    } catch (error) {
      console.error('Error fetching payment analytics:', error);
      return this.getEmptyAnalytics();
    }
  }

  /**
   * Get comprehensive financial metrics
   */
  async getFinancialMetrics(startDate?: Date, endDate?: Date): Promise<FinancialMetrics> {
    try {
      const dateRange = this.getDateRange(startDate, endDate);

      // Get all financial data
      const [payments, refunds, chargebacks, customers] = await Promise.all([
        this.getPaymentData(dateRange.start, dateRange.end),
        this.getRefundData(dateRange.start, dateRange.end),
        this.getChargebackData(dateRange.start, dateRange.end),
        this.getCustomerData(dateRange.start, dateRange.end)
      ]);

      // Calculate revenue metrics
      const grossRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
      const totalRefunds = refunds.reduce((sum, r) => sum + r.amount, 0);
      const totalChargebacks = chargebacks.reduce((sum, c) => sum + c.amount, 0);
      const totalFees = payments.reduce((sum, p) => sum + (p.fees || 0), 0);
      const netRevenue = grossRevenue - totalRefunds - totalChargebacks - totalFees;

      // Revenue by service type
      const revenueByServiceType: Record<string, any> = {};
      payments.forEach(payment => {
        const serviceType = payment.metadata?.serviceType || 'other';
        if (!revenueByServiceType[serviceType]) {
          revenueByServiceType[serviceType] = { revenue: 0, count: 0, averageValue: 0 };
        }
        revenueByServiceType[serviceType].revenue += payment.amount;
        revenueByServiceType[serviceType].count += 1;
      });

      // Calculate average values
      Object.values(revenueByServiceType).forEach((data: any) => {
        data.averageValue = data.count > 0 ? data.revenue / data.count : 0;
      });

      // Revenue by payment method
      const revenueByPaymentMethod: Record<string, any> = {};
      payments.forEach(payment => {
        const method = payment.paymentMethod || 'unknown';
        if (!revenueByPaymentMethod[method]) {
          revenueByPaymentMethod[method] = { revenue: 0, count: 0, fees: 0 };
        }
        revenueByPaymentMethod[method].revenue += payment.amount;
        revenueByPaymentMethod[method].count += 1;
        revenueByPaymentMethod[method].fees += payment.fees || 0;
      });

      // Revenue by currency
      const revenueByCurrency: Record<string, any> = {};
      payments.forEach(payment => {
        const currency = payment.currency || 'PLN';
        if (!revenueByCurrency[currency]) {
          revenueByCurrency[currency] = { revenue: 0, count: 0, change: 0 };
        }
        revenueByCurrency[currency].revenue += payment.amount;
        revenueByCurrency[currency].count += 1;
      });

      // Monthly revenue trend
      const revenueByMonth = await this.calculateMonthlyRevenue(dateRange.start, dateRange.end);

      // Customer metrics
      const customerMetrics = await this.calculateCustomerMetrics(customers, payments, dateRange);

      // Conversion metrics
      const conversionMetrics = await this.calculateConversionMetrics(dateRange);

      return {
        totalRevenue: netRevenue,
        netRevenue,
        grossRevenue,
        revenueByMonth,
        revenueByServiceType,
        revenueByPaymentMethod,
        revenueByCurrency,
        customerMetrics,
        conversionMetrics
      };

    } catch (error) {
      console.error('Error calculating financial metrics:', error);
      throw error;
    }
  }

  /**
   * Generate daily settlement report
   */
  async generateSettlementReport(date: Date, provider?: string): Promise<SettlementReport> {
    try {
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);

      // Get transactions for the date
      const transactions = await this.getSettlementTransactions(dateStart, dateEnd, provider);

      // Calculate totals
      const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
      const totalFees = transactions.reduce((sum, t) => sum + t.fee, 0);
      const netAmount = totalAmount - totalFees;
      const successfulTransactions = transactions.filter(t => t.status === 'succeeded').length;
      const failedTransactions = transactions.filter(t => t.status === 'failed').length;
      const refunds = transactions.filter(t => t.status === 'refunded').length;
      const chargebacks = transactions.filter(t => t.status === 'chargeback').length;

      const report: Omit<SettlementReport, 'id' | 'generatedAt'> = {
        date: date.toISOString().split('T')[0],
        provider: provider || 'all',
        totalAmount,
        currency: 'PLN',
        fees: totalFees,
        netAmount,
        transactionCount: transactions.length,
        successfulTransactions,
        failedTransactions,
        refunds,
        chargebacks,
        transactions,
        metadata: {
          generatedBy: 'system',
          version: '1.0'
        },
        status: 'draft'
      };

      // Store report
      const { data: createdReport, error } = await this.supabase
        .from('settlement_reports')
        .insert({
          ...report,
          generated_at: new Date()
        })
        .select()
        .single();

      if (error || !createdReport) {
        throw new Error(`Failed to create settlement report: ${error?.message}`);
      }

      return createdReport as SettlementReport;

    } catch (error) {
      console.error('Error generating settlement report:', error);
      throw error;
    }
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(
    startDate: Date,
    endDate: Date
  ): Promise<PerformanceReport> {
    try {
      const dateRange = { start: startDate.toISOString(), end: endDate.toISOString() };

      // Get all data needed for performance analysis
      const [payments, customers] = await Promise.all([
        this.getPaymentData(startDate, endDate),
        this.getCustomerData(startDate, endDate)
      ]);

      // Calculate summary metrics
      const totalTransactions = payments.length;
      const totalVolume = payments.reduce((sum, p) => sum + p.amount, 0);
      const successfulPayments = payments.filter(p => p.status === 'succeeded');
      const successRate = totalTransactions > 0 ? (successfulPayments.length / totalTransactions) * 100 : 0;
      const averageTransactionValue = totalTransactions > 0 ? totalVolume / totalTransactions : 0;
      const totalFees = payments.reduce((sum, p) => sum + (p.fees || 0), 0);
      const netRevenue = totalVolume - totalFees;

      // Payment method performance
      const paymentMethods = await this.calculatePaymentMethodPerformance(payments);

      // Customer segment performance
      const customerSegments = await this.calculateCustomerSegmentPerformance(customers, payments);

      // Trends
      const trends = await this.calculateTrends(startDate, endDate, payments);

      // Forecasts
      const forecasts = await this.generateForecasts(payments, startDate, endDate);

      return {
        period: dateRange,
        summary: {
          totalTransactions,
          totalVolume,
          successRate,
          averageTransactionValue,
          totalFees,
          netRevenue
        },
        paymentMethods,
        customerSegments,
        trends,
        forecasts
      };

    } catch (error) {
      console.error('Error generating performance report:', error);
      throw error;
    }
  }

  /**
   * Export data for accounting systems
   */
  async exportForAccounting(params: {
    format: 'csv' | 'xml' | 'json' | 'pdf';
    type: 'transactions' | 'invoices' | 'refunds' | 'tax_report' | 'settlement';
    startDate: Date;
    endDate: Date;
    provider?: string;
  }): Promise<AccountingExport> {
    try {
      let data: any;

      switch (params.type) {
        case 'transactions':
          data = await this.getTransactionExportData(params.startDate, params.endDate, params.provider);
          break;
        case 'invoices':
          data = await this.getInvoiceExportData(params.startDate, params.endDate);
          break;
        case 'refunds':
          data = await this.getRefundExportData(params.startDate, params.endDate);
          break;
        case 'tax_report':
          data = await this.getTaxReportData(params.startDate, params.endDate);
          break;
        case 'settlement':
          data = await this.getSettlementExportData(params.startDate, params.endDate, params.provider);
          break;
        default:
          throw new Error(`Unsupported export type: ${params.type}`);
      }

      const filename = this.generateFilename(params.format, params.type, params.startDate, params.endDate);

      const exportData: AccountingExport = {
        format: params.format,
        data,
        filename,
        generatedAt: new Date().toISOString(),
        type: params.type,
        provider: params.provider,
        period: {
          start: params.startDate.toISOString(),
          end: params.endDate.toISOString()
        }
      };

      // Store export record
      await this.supabase
        .from('accounting_exports')
        .insert({
          format: params.format,
          type: params.type,
          filename,
          data,
          provider: params.provider,
          period_start: params.startDate.toISOString(),
          period_end: params.endDate.toISOString(),
          generated_at: new Date()
        });

      return exportData;

    } catch (error) {
      console.error('Error exporting accounting data:', error);
      throw error;
    }
  }

  /**
   * Get financial alerts
   */
  async getFinancialAlerts(): Promise<FinancialAlert[]> {
    const { data, error } = await this.supabase
      .from('financial_alerts')
      .select('*')
      .eq('resolved', false)
      .order('triggered_at', { ascending: false });

    if (error) {
      console.error('Error fetching financial alerts:', error);
      return [];
    }

    return data as FinancialAlert[];
  }

  /**
   * Check for financial alerts and create if thresholds are exceeded
   */
  async checkFinancialAlerts(): Promise<void> {
    try {
      const alerts: Omit<FinancialAlert, 'id' | 'triggeredAt'>[] = [];

      // Check for revenue drop
      const revenueDrop = await this.checkRevenueDrop();
      if (revenueDrop) alerts.push(revenueDrop);

      // Check for high failure rate
      const highFailureRate = await this.checkHighFailureRate();
      if (highFailureRate) alerts.push(highFailureRate);

      // Check for chargeback spike
      const chargebackSpike = await this.checkChargebackSpike();
      if (chargebackSpike) alerts.push(chargebackSpike);

      // Check for fraud detection
      const fraudDetection = await this.checkFraudDetection();
      if (fraudDetection) alerts.push(fraudDetection);

      // Create alerts
      for (const alert of alerts) {
        await this.supabase
          .from('financial_alerts')
          .insert({
            ...alert,
            triggered_at: new Date()
          });
      }

    } catch (error) {
      console.error('Error checking financial alerts:', error);
    }
  }

  // Private helper methods

  private getDateRange(startDate?: Date, endDate?: Date): { start: Date; end: Date } {
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days
    return { start, end };
  }

  private async getPaymentData(startDate: Date, endDate: Date): Promise<any[]> {
    // Mock implementation - would query actual payment data
    return [];
  }

  private async getRefundData(startDate: Date, endDate: Date): Promise<any[]> {
    // Mock implementation
    return [];
  }

  private async getChargebackData(startDate: Date, endDate: Date): Promise<any[]> {
    // Mock implementation
    return [];
  }

  private async getCustomerData(startDate: Date, endDate: Date): Promise<any[]> {
    // Mock implementation
    return [];
  }

  private getEmptyAnalytics(): PaymentAnalyticsType {
    return {
      totalVolume: 0,
      transactionCount: 0,
      successRate: 0,
      averageTransactionValue: 0,
      paymentMethodDistribution: {},
      currencyDistribution: {},
      topCurrencies: [],
      providerPerformance: {}
    };
  }

  private calculateAverageProcessingTime(payments: any[]): number {
    // Calculate average processing time in minutes
    if (payments.length === 0) return 0;

    const totalTime = payments.reduce((sum, payment) => {
      if (payment.createdAt && payment.processedAt) {
        const processingTime = new Date(payment.processedAt).getTime() - new Date(payment.createdAt).getTime();
        return sum + processingTime;
      }
      return sum;
    }, 0);

    return totalTime / payments.length / (1000 * 60); // Convert to minutes
  }

  private async calculateMonthlyRevenue(startDate: Date, endDate: Date): Promise<{ month: string; revenue: number; change: number }[]> {
    // Mock implementation
    return [];
  }

  private async calculateCustomerMetrics(customers: any[], payments: any[], dateRange: { start: Date; end: Date }): Promise<any> {
    // Mock implementation
    return {
      newCustomers: 0,
      returningCustomers: 0,
      averageLifetimeValue: 0,
      customerAcquisitionCost: 0,
      churnRate: 0
    };
  }

  private async calculateConversionMetrics(dateRange: { start: Date; end: Date }): Promise<any> {
    // Mock implementation
    return {
      bookingConversionRate: 0,
      paymentConversionRate: 0,
      averageTimeToPayment: 0,
      abandonedCartRate: 0
    };
  }

  private async getSettlementTransactions(startDate: Date, endDate: Date, provider?: string): Promise<SettlementTransaction[]> {
    // Mock implementation
    return [];
  }

  private async calculatePaymentMethodPerformance(payments: any[]): Promise<PaymentMethodPerformance[]> {
    // Mock implementation
    return [];
  }

  private async calculateCustomerSegmentPerformance(customers: any[], payments: any[]): Promise<CustomerSegmentPerformance[]> {
    // Mock implementation
    return [];
  }

  private async calculateTrends(startDate: Date, endDate: Date, payments: any[]): Promise<any> {
    // Mock implementation
    return {
      daily: [],
      weekly: [],
      monthly: []
    };
  }

  private async generateForecasts(payments: any[], startDate: Date, endDate: Date): Promise<any> {
    // Mock implementation
    return {
      nextMonthRevenue: 0,
      nextQuarterRevenue: 0,
      confidence: 0
    };
  }

  private async getTransactionExportData(startDate: Date, endDate: Date, provider?: string): Promise<any> {
    // Mock implementation
    return [];
  }

  private async getInvoiceExportData(startDate: Date, endDate: Date): Promise<any> {
    // Mock implementation
    return [];
  }

  private async getRefundExportData(startDate: Date, endDate: Date): Promise<any> {
    // Mock implementation
    return [];
  }

  private async getTaxReportData(startDate: Date, endDate: Date): Promise<any> {
    // Mock implementation
    return {};
  }

  private async getSettlementExportData(startDate: Date, endDate: Date, provider?: string): Promise<any> {
    // Mock implementation
    return {};
  }

  private generateFilename(format: string, type: string, startDate: Date, endDate: Date): string {
    const dateStr = startDate.toISOString().split('T')[0];
    return `${type}_${dateStr}.${format}`;
  }

  // Alert checking methods
  private async checkRevenueDrop(): Promise<Omit<FinancialAlert, 'id' | 'triggeredAt'> | null> {
    // Implementation would compare current revenue with previous period
    return null;
  }

  private async checkHighFailureRate(): Promise<Omit<FinancialAlert, 'id' | 'triggeredAt'> | null> {
    // Implementation would check payment failure rates
    return null;
  }

  private async checkChargebackSpike(): Promise<Omit<FinancialAlert, 'id' | 'triggeredAt'> | null> {
    // Implementation would check for unusual chargeback activity
    return null;
  }

  private async checkFraudDetection(): Promise<Omit<FinancialAlert, 'id' | 'triggeredAt'> | null> {
    // Implementation would run fraud detection algorithms
    return null;
  }

  /**
   * Record successful payment for analytics
   */
  async recordSuccessfulPayment(params: {
    paymentIntentId: string;
    amount: number;
    currency: string;
    provider: string;
    customerId?: string;
  }): Promise<void> {
    await this.supabase
      .from('payment_analytics')
      .insert({
        payment_intent_id: params.paymentIntentId,
        amount: params.amount,
        currency: params.currency,
        provider: params.provider,
        customer_id: params.customerId,
        status: 'succeeded',
        processed_at: new Date(),
        created_at: new Date()
      });
  }

  /**
   * Get real-time dashboard data
   */
  async getDashboardData(): Promise<{
    todayRevenue: number;
    todayTransactions: number;
    weekRevenue: number;
    weekTransactions: number;
    monthRevenue: number;
    monthTransactions: number;
    successRate: number;
    averageOrderValue: number;
    topPaymentMethods: { method: string; count: number; percentage: number }[];
    recentTransactions: any[];
    alerts: FinancialAlert[];
  }> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Mock implementation - would query real data
    return {
      todayRevenue: 0,
      todayTransactions: 0,
      weekRevenue: 0,
      weekTransactions: 0,
      monthRevenue: 0,
      monthTransactions: 0,
      successRate: 0,
      averageOrderValue: 0,
      topPaymentMethods: [],
      recentTransactions: [],
      alerts: []
    };
  }
}

// Export singleton instance
export const paymentAnalytics = new PaymentAnalytics();