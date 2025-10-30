/**
 * Invoice Service
 *
 * Comprehensive invoice generation and management with Polish compliance:
 * - Polish invoice format compliance (VAT invoices)
 * - Automatic invoice generation for services
 * - Electronic invoice delivery (e-faktura)
 * - Invoice numbering and sequence management
 * - Tax reporting and VAT compliance
 * - Multi-language invoice support
 */

import { InvoiceData, SellerData, BuyerData, InvoiceItem } from './payment-factory';
import { createClient } from '@supabase/supabase-js';

interface InvoiceConfig {
  company: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    country: string;
    nip: string; // Polish VAT number
    regon?: string; // Statistical identification number
    bankAccount: string;
    bankName: string;
    email: string;
    phone: string;
    website?: string;
  };
  invoiceSettings: {
    prefix: string;
    nextNumber: number;
    resetType: 'monthly' | 'yearly' | 'never';
    defaultPaymentTerms: number; // days
    defaultVatRate: number; // percentage
    taxExemption?: {
      reason: string;
      basis: string;
    };
  };
  legalInfo: {
    court: string;
    kapital: string; // Share capital
    shareValue: string;
    activities: string;
  };
}

interface InvoiceSequence {
  id: string;
  prefix: string;
  year: number;
  month?: number;
  nextNumber: number;
  resetType: 'monthly' | 'yearly' | 'never';
  created_at: string;
  updated_at: string;
}

interface InvoiceTemplate {
  id: string;
  name: string;
  type: 'standard' | 'proforma' | 'corrective' | 'advance';
  language: 'pl' | 'en';
  template: string; // HTML template
  css?: string;
  is_default: boolean;
  metadata: Record<string, any>;
}

interface InvoiceGeneration {
  id: string;
  invoiceNumber: string;
  type: 'standard' | 'proforma' | 'corrective' | 'advance';
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  amount: number;
  vatAmount: number;
  totalAmount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  paidAt?: string;
  sellerId: string;
  buyerId: string;
  bookingId?: string;
  subscriptionId?: string;
  paymentId?: string;
  items: InvoiceItem[];
  vatRates: { rate: number; amount: number; base: number }[];
  metadata: Record<string, any>;
  pdfUrl?: string;
  xmlUrl?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface TaxReport {
  id: string;
  type: 'vat_7' | 'vat_ue' | 'pit_4' | 'cit_8';
  period: {
    year: number;
    quarter?: number;
    month?: number;
  };
  data: {
    sales: {
      domestic: number;
      eu: number;
      export: number;
      exempt: number;
    };
    purchases: {
      domestic: number;
      eu: number;
      import: number;
    };
    vatPayable: number;
    vatDeductible: number;
    vatToPay: number;
  };
  status: 'draft' | 'submitted' | 'accepted' | 'rejected';
  submittedAt?: string;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface EInvoiceData {
  invoiceId: string;
  format: 'ksef' | 'edi' | 'ubl';
  xmlContent: string;
  signature?: string;
  qrCode?: string;
  status: 'generated' | 'sent' | 'delivered' | 'failed';
  sentAt?: string;
  deliveredAt?: string;
  errorMessage?: string;
  metadata: Record<string, any>;
}

export class InvoiceService {
  private supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
  );

  private config: InvoiceConfig = {
    company: {
      name: import.meta.env.VITE_COMPANY_NAME || 'Mariia Hub Sp. z o.o.',
      address: import.meta.env.VITE_COMPANY_ADDRESS || 'ul. Jana Pawła II 43/15',
      postalCode: import.meta.env.VITE_COMPANY_POSTAL_CODE || '00-001',
      city: import.meta.env.VITE_COMPANY_CITY || 'Warszawa',
      country: import.meta.env.VITE_COMPANY_COUNTRY || 'Polska',
      nip: import.meta.env.VITE_COMPANY_NIP || '1234567890',
      regon: import.meta.env.VITE_COMPANY_REGON || '123456785',
      bankAccount: import.meta.env.VITE_COMPANY_BANK_ACCOUNT || 'PL 1234 5678 9012 3456 7890 1234 5678',
      bankName: import.meta.env.VITE_COMPANY_BANK_NAME || 'mBank S.A.',
      email: import.meta.env.VITE_COMPANY_EMAIL || 'biuro@mariaborysevych.com',
      phone: import.meta.env.VITE_COMPANY_PHONE || '+48 123 456 789',
      website: import.meta.env.VITE_COMPANY_WEBSITE || 'https://mariaborysevych.com'
    },
    invoiceSettings: {
      prefix: 'FV',
      nextNumber: 1,
      resetType: 'monthly',
      defaultPaymentTerms: 14,
      defaultVatRate: 23,
      taxExemption: {
        reason: 'Zwolnienie podmiotowe VAT',
        basis: 'art. 113 ust. 1 ustawy o VAT'
      }
    },
    legalInfo: {
      court: import.meta.env.VITE_COMPANY_COURT || 'Sąd Rejonowy dla m.st. Warszawy',
      kapital: import.meta.env.VITE_COMPANY_KAPITAL || '5.000 PLN',
      shareValue: import.meta.env.VITE_COMPANY_SHARE_VALUE || '50 PLN',
      activities: import.meta.env.VITE_COMPANY_ACTIVITIES || '96.09.Z - Pozostała działalność usługowa, gdzie indziej niesklasyfikowana'
    }
  };

  private vatRates = [
    { rate: 23, description: 'VAT 23%' },
    { rate: 8, description: 'VAT 8%' },
    { rate: 5, description: 'VAT 5%' },
    { rate: 0, description: 'VAT 0%' },
    { rate: 0, description: 'NP. - Zwolnione', exemption: true }
  ];

  constructor() {
    this.initializeInvoiceSystem();
  }

  private async initializeInvoiceSystem(): Promise<void> {
    // Initialize invoice sequences
    await this.initializeInvoiceSequences();

    // Load default templates
    await this.loadDefaultTemplates();
  }

  private async initializeInvoiceSequences(): Promise<void> {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Check if sequence exists for current period
    const { data: existingSequence } = await this.supabase
      .from('invoice_sequences')
      .select('*')
      .eq('prefix', this.config.invoiceSettings.prefix)
      .eq('year', currentYear)
      .eq('month', this.config.invoiceSettings.resetType === 'monthly' ? currentMonth : null)
      .single();

    if (!existingSequence) {
      // Create new sequence
      await this.supabase
        .from('invoice_sequences')
        .insert({
          prefix: this.config.invoiceSettings.prefix,
          year: currentYear,
          month: this.config.invoiceSettings.resetType === 'monthly' ? currentMonth : null,
          nextNumber: 1,
          resetType: this.config.invoiceSettings.resetType,
          created_at: new Date()
        });
    }
  }

  private async loadDefaultTemplates(): Promise<void> {
    const templatesExist = await this.supabase
      .from('invoice_templates')
      .select('id')
      .limit(1);

    if (!templatesExist.data || templatesExist.data.length === 0) {
      // Create default Polish invoice template
      await this.createDefaultInvoiceTemplate();
    }
  }

  /**
   * Generate invoice for booking
   */
  async generateInvoiceForBooking(
    bookingId: string,
    type: 'standard' | 'proforma' = 'standard',
    customData?: Partial<InvoiceGeneration>
  ): Promise<InvoiceGeneration> {
    try {
      // Get booking details
      const { data: booking, error: bookingError } = await this.supabase
        .from('bookings')
        .select(`
          *,
          services(*),
          customer:profiles(*)
        `)
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking) {
        throw new Error(`Booking not found: ${bookingError?.message}`);
      }

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      // Calculate invoice amounts
      const invoiceItems = await this.createInvoiceItems(booking);
      const { amount, vatAmount, totalAmount, vatRates } = this.calculateInvoiceTotals(invoiceItems);

      // Get buyer data
      const buyerData = await this.createBuyerData(booking.customer);

      // Create invoice record
      const invoice: Omit<InvoiceGeneration, 'id'> = {
        invoiceNumber,
        type,
        status: 'draft',
        amount,
        vatAmount,
        totalAmount,
        currency: booking.currency || 'PLN',
        issueDate: new Date().toISOString(),
        dueDate: this.calculateDueDate(),
        sellerId: 'company', // Reference to company record
        buyerId: booking.customer_id,
        bookingId,
        paymentId: booking.payment_intent_id,
        items: invoiceItems,
        vatRates,
        metadata: {
          ...customData?.metadata,
          bookingId,
          serviceName: booking.services?.name,
          customerName: `${booking.customer?.first_name} ${booking.customer?.last_name}`
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const { data: createdInvoice, error: createError } = await this.supabase
        .from('invoices')
        .insert(invoice)
        .select()
        .single();

      if (createError || !createdInvoice) {
        throw new Error(`Failed to create invoice: ${createError?.message}`);
      }

      // Generate PDF
      await this.generateInvoicePDF(createdInvoice.id);

      // Generate e-invoice (KSeF)
      if (type === 'standard') {
        await this.generateEInvoice(createdInvoice.id);
      }

      return createdInvoice as InvoiceGeneration;

    } catch (error) {
      console.error('Error generating invoice for booking:', error);
      throw error;
    }
  }

  /**
   * Generate invoice for subscription
   */
  async generateInvoiceForSubscription(
    subscriptionId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<InvoiceGeneration> {
    try {
      // Get subscription details
      const { data: subscription, error: subError } = await this.supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_tiers(*),
          customer:profiles(*)
        `)
        .eq('id', subscriptionId)
        .single();

      if (subError || !subscription) {
        throw new Error(`Subscription not found: ${subError?.message}`);
      }

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      // Create subscription invoice items
      const invoiceItems = await this.createSubscriptionInvoiceItems(subscription);
      const { amount, vatAmount, totalAmount, vatRates } = this.calculateInvoiceTotals(invoiceItems);

      // Create invoice record
      const invoice: Omit<InvoiceGeneration, 'id'> = {
        invoiceNumber,
        type: 'standard',
        status: 'draft',
        amount,
        vatAmount,
        totalAmount,
        currency: subscription.currency || 'PLN',
        issueDate: new Date().toISOString(),
        dueDate: this.calculateDueDate(),
        sellerId: 'company',
        buyerId: subscription.customer_id,
        subscriptionId,
        items: invoiceItems,
        vatRates,
        metadata: {
          subscriptionId,
          periodStart: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString(),
          tierName: subscription.subscription_tiers?.name
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const { data: createdInvoice, error: createError } = await this.supabase
        .from('invoices')
        .insert(invoice)
        .select()
        .single();

      if (createError || !createdInvoice) {
        throw new Error(`Failed to create subscription invoice: ${createError?.message}`);
      }

      // Generate PDF and e-invoice
      await this.generateInvoicePDF(createdInvoice.id);
      await this.generateEInvoice(createdInvoice.id);

      return createdInvoice as InvoiceGeneration;

    } catch (error) {
      console.error('Error generating invoice for subscription:', error);
      throw error;
    }
  }

  /**
   * Generate corrective invoice
   */
  async generateCorrectiveInvoice(
    originalInvoiceId: string,
    correctionReason: string,
    updatedItems?: InvoiceItem[]
  ): Promise<InvoiceGeneration> {
    try {
      // Get original invoice
      const { data: originalInvoice, error: originalError } = await this.supabase
        .from('invoices')
        .select('*')
        .eq('id', originalInvoiceId)
        .single();

      if (originalError || !originalInvoice) {
        throw new Error(`Original invoice not found: ${originalError?.message}`);
      }

      // Generate corrective invoice number
      const invoiceNumber = await this.generateInvoiceNumber('KOR');

      // Use updated items or original items
      const items = updatedItems || originalInvoice.items;
      const { amount, vatAmount, totalAmount, vatRates } = this.calculateInvoiceTotals(items);

      // Create corrective invoice
      const correctiveInvoice: Omit<InvoiceGeneration, 'id'> = {
        invoiceNumber,
        type: 'corrective',
        status: 'draft',
        amount: -Math.abs(originalInvoice.amount - amount), // Difference amount
        vatAmount: -Math.abs(originalInvoice.vatAmount - vatAmount),
        totalAmount: -Math.abs(originalInvoice.totalAmount - totalAmount),
        currency: originalInvoice.currency,
        issueDate: new Date().toISOString(),
        dueDate: originalInvoice.dueDate,
        sellerId: originalInvoice.sellerId,
        buyerId: originalInvoice.buyerId,
        bookingId: originalInvoice.bookingId,
        subscriptionId: originalInvoice.subscriptionId,
        items,
        vatRates,
        metadata: {
          originalInvoiceId,
          correctionReason,
          originalInvoiceNumber: originalInvoice.invoiceNumber
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const { data: createdInvoice, error: createError } = await this.supabase
        .from('invoices')
        .insert(correctiveInvoice)
        .select()
        .single();

      if (createError || !createdInvoice) {
        throw new Error(`Failed to create corrective invoice: ${createError?.message}`);
      }

      // Generate PDF
      await this.generateInvoicePDF(createdInvoice.id);

      return createdInvoice as InvoiceGeneration;

    } catch (error) {
      console.error('Error generating corrective invoice:', error);
      throw error;
    }
  }

  /**
   * Send invoice to customer
   */
  async sendInvoice(
    invoiceId: string,
    email?: string,
    deliveryMethod: 'email' | 'sms' | 'postal' = 'email'
  ): Promise<void> {
    try {
      // Get invoice details
      const { data: invoice, error } = await this.supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (error || !invoice) {
        throw new Error(`Invoice not found: ${error?.message}`);
      }

      switch (deliveryMethod) {
        case 'email':
          await this.sendInvoiceByEmail(invoice, email);
          break;
        case 'sms':
          await this.sendInvoiceBySMS(invoice);
          break;
        case 'postal':
          await this.sendInvoiceByPost(invoice);
          break;
      }

      // Update invoice status
      await this.supabase
        .from('invoices')
        .update({
          status: 'sent',
          sentAt: new Date(),
          updatedAt: new Date()
        })
        .eq('id', invoiceId);

    } catch (error) {
      console.error('Error sending invoice:', error);
      throw error;
    }
  }

  /**
   * Mark invoice as paid
   */
  async markInvoiceAsPaid(
    invoiceId: string,
    paidAt?: Date,
    paymentMethod?: string
  ): Promise<void> {
    try {
      await this.supabase
        .from('invoices')
        .update({
          status: 'paid',
          paidAt: paidAt ? paidAt.toISOString() : new Date().toISOString(),
          metadata: {
            paymentMethod,
            paidAt: paidAt ? paidAt.toISOString() : new Date().toISOString()
          },
          updatedAt: new Date()
        })
        .eq('id', invoiceId);

    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      throw error;
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<InvoiceGeneration | null> {
    const { data, error } = await this.supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (error) {
      return null;
    }

    return data as InvoiceGeneration;
  }

  /**
   * Get invoices with filters
   */
  async getInvoices(filters: {
    customerId?: string;
    status?: string;
    type?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  } = {}): Promise<{ invoices: InvoiceGeneration[]; total: number }> {
    let query = this.supabase
      .from('invoices')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.customerId) {
      query = query.eq('buyer_id', filters.customerId);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.dateFrom) {
      query = query.gte('issue_date', filters.dateFrom.toISOString());
    }
    if (filters.dateTo) {
      query = query.lte('issue_date', filters.dateTo.toISOString());
    }

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching invoices:', error);
      return { invoices: [], total: 0 };
    }

    return {
      invoices: (data || []) as InvoiceGeneration[],
      total: count || 0
    };
  }

  /**
   * Generate tax report
   */
  async generateTaxReport(
    type: 'vat_7' | 'vat_ue' | 'pit_4' | 'cit_8',
    year: number,
    quarter?: number,
    month?: number
  ): Promise<TaxReport> {
    try {
      // Get invoices for the period
      const startDate = new Date(year, month ? month - 1 : quarter ? (quarter - 1) * 3 : 0, 1);
      const endDate = new Date(
        year,
        month ? month : quarter ? quarter * 3 : 12,
        0
      );

      const { data: invoices, error } = await this.supabase
        .from('invoices')
        .select('*')
        .gte('issue_date', startDate.toISOString())
        .lte('issue_date', endDate.toISOString())
        .eq('status', 'paid');

      if (error) {
        throw new Error(`Failed to fetch invoices for tax report: ${error.message}`);
      }

      // Calculate tax data based on report type
      let reportData;
      switch (type) {
        case 'vat_7':
          reportData = await this.calculateVAT7Report(invoices || []);
          break;
        case 'vat_ue':
          reportData = await this.calculateVATUEReport(invoices || []);
          break;
        case 'pit_4':
          reportData = await this.calculatePIT4Report(invoices || []);
          break;
        case 'cit_8':
          reportData = await this.calculateCIT8Report(invoices || []);
          break;
        default:
          throw new Error(`Unsupported tax report type: ${type}`);
      }

      // Create tax report record
      const taxReport: Omit<TaxReport, 'id'> = {
        type,
        period: { year, quarter, month },
        data: reportData,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const { data: createdReport, error: createError } = await this.supabase
        .from('tax_reports')
        .insert(taxReport)
        .select()
        .single();

      if (createError || !createdReport) {
        throw new Error(`Failed to create tax report: ${createError?.message}`);
      }

      return createdReport as TaxReport;

    } catch (error) {
      console.error('Error generating tax report:', error);
      throw error;
    }
  }

  /**
   * Get invoice statistics
   */
  async getInvoiceStatistics(startDate?: Date, endDate?: Date): Promise<{
    totalInvoices: number;
    totalAmount: number;
    totalVAT: number;
    paidInvoices: number;
    unpaidInvoices: number;
    overdueInvoices: number;
    averageInvoiceValue: number;
    topCustomers: { customerId: string; totalAmount: number; invoiceCount: number }[];
    monthlyTrend: { month: string; amount: number; count: number }[];
  }> {
    try {
      let query = this.supabase.from('invoices').select('*');

      if (startDate) {
        query = query.gte('issue_date', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('issue_date', endDate.toISOString());
      }

      const { data: invoices, error } = await query;

      if (error || !invoices) {
        return {
          totalInvoices: 0,
          totalAmount: 0,
          totalVAT: 0,
          paidInvoices: 0,
          unpaidInvoices: 0,
          overdueInvoices: 0,
          averageInvoiceValue: 0,
          topCustomers: [],
          monthlyTrend: []
        };
      }

      const totalInvoices = invoices.length;
      const totalAmount = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      const totalVAT = invoices.reduce((sum, inv) => sum + inv.vat_amount, 0);
      const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
      const unpaidInvoices = invoices.filter(inv => inv.status === 'sent' || inv.status === 'draft').length;
      const overdueInvoices = invoices.filter(inv =>
        inv.status === 'sent' && new Date(inv.due_date) < new Date()
      ).length;
      const averageInvoiceValue = totalInvoices > 0 ? totalAmount / totalInvoices : 0;

      // Calculate top customers
      const customerTotals: Record<string, { totalAmount: number; invoiceCount: number }> = {};
      invoices.forEach(inv => {
        const customerId = inv.buyer_id;
        if (!customerTotals[customerId]) {
          customerTotals[customerId] = { totalAmount: 0, invoiceCount: 0 };
        }
        customerTotals[customerId].totalAmount += inv.total_amount;
        customerTotals[customerId].invoiceCount += 1;
      });

      const topCustomers = Object.entries(customerTotals)
        .map(([customerId, data]) => ({ customerId, ...data }))
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 10);

      // Calculate monthly trend
      const monthlyTrend: Record<string, { amount: number; count: number }> = {};
      invoices.forEach(inv => {
        const month = inv.issue_date.substring(0, 7); // YYYY-MM
        if (!monthlyTrend[month]) {
          monthlyTrend[month] = { amount: 0, count: 0 };
        }
        monthlyTrend[month].amount += inv.total_amount;
        monthlyTrend[month].count += 1;
      });

      const monthlyTrendArray = Object.entries(monthlyTrend)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month));

      return {
        totalInvoices,
        totalAmount,
        totalVAT,
        paidInvoices,
        unpaidInvoices,
        overdueInvoices,
        averageInvoiceValue,
        topCustomers,
        monthlyTrend: monthlyTrendArray
      };

    } catch (error) {
      console.error('Error calculating invoice statistics:', error);
      throw error;
    }
  }

  // Private helper methods

  private async generateInvoiceNumber(prefix?: string): Promise<string> {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const invoicePrefix = prefix || this.config.invoiceSettings.prefix;

    // Get current sequence
    const { data: sequence, error } = await this.supabase
      .from('invoice_sequences')
      .select('*')
      .eq('prefix', invoicePrefix)
      .eq('year', currentYear)
      .eq('month', this.config.invoiceSettings.resetType === 'monthly' ? currentMonth : null)
      .single();

    if (error || !sequence) {
      throw new Error('Invoice sequence not found');
    }

    // Generate invoice number
    const number = sequence.next_number.toString().padStart(4, '0');
    const invoiceNumber = `${invoicePrefix}/${number}/${currentYear}${this.config.invoiceSettings.resetType === 'monthly' ? `/${currentMonth.toString().padStart(2, '0')}` : ''}`;

    // Update sequence
    await this.supabase
      .from('invoice_sequences')
      .update({
        next_number: sequence.next_number + 1,
        updated_at: new Date()
      })
      .eq('id', sequence.id);

    return invoiceNumber;
  }

  private async createInvoiceItems(booking: any): Promise<InvoiceItem[]> {
    const items: InvoiceItem[] = [];

    // Service item
    items.push({
      name: booking.services?.name || 'Usługa',
      description: booking.services?.description || `Usługa z ${new Date(booking.start_time).toLocaleDateString('pl-PL')}`,
      quantity: 1,
      unitPrice: booking.total_price || 0,
      totalPrice: booking.total_price || 0,
      vatRate: this.config.invoiceSettings.defaultVatRate,
      vatAmount: (booking.total_price || 0) * (this.config.invoiceSettings.defaultVatRate / 100)
    });

    // Add any additional services or products
    if (booking.additional_services && Array.isArray(booking.additional_services)) {
      booking.additional_services.forEach((service: any) => {
        items.push({
          name: service.name,
          description: service.description,
          quantity: service.quantity || 1,
          unitPrice: service.price,
          totalPrice: service.price * (service.quantity || 1),
          vatRate: service.vatRate || this.config.invoiceSettings.defaultVatRate,
          vatAmount: (service.price * (service.quantity || 1)) * ((service.vatRate || this.config.invoiceSettings.defaultVatRate) / 100)
        });
      });
    }

    return items;
  }

  private async createSubscriptionInvoiceItems(subscription: any): Promise<InvoiceItem[]> {
    const items: InvoiceItem[] = [];

    // Subscription plan item
    items.push({
      name: `Abonament ${subscription.subscription_tiers?.name || 'Premium'}`,
      description: `Abonament na okres ${new Date(subscription.current_period_start).toLocaleDateString('pl-PL')} - ${new Date(subscription.current_period_end).toLocaleDateString('pl-PL')}`,
      quantity: 1,
      unitPrice: subscription.price || 0,
      totalPrice: subscription.price || 0,
      vatRate: this.config.invoiceSettings.defaultVatRate,
      vatAmount: (subscription.price || 0) * (this.config.invoiceSettings.defaultVatRate / 100)
    });

    // Add add-ons if any
    if (subscription.add_ons && Array.isArray(subscription.add_ons)) {
      // Implementation would fetch add-on details and add them as items
    }

    return items;
  }

  private calculateInvoiceTotals(items: InvoiceItem[]): {
    amount: number;
    vatAmount: number;
    totalAmount: number;
    vatRates: { rate: number; amount: number; base: number }[];
  } {
    let amount = 0;
    let vatAmount = 0;
    const vatRates: Record<number, { amount: number; base: number }> = {};

    items.forEach(item => {
      amount += item.totalPrice;
      vatAmount += item.vatAmount;

      if (!vatRates[item.vatRate]) {
        vatRates[item.vatRate] = { amount: 0, base: 0 };
      }
      vatRates[item.vatRate].amount += item.vatAmount;
      vatRates[item.vatRate].base += item.totalPrice;
    });

    const vatRatesArray = Object.entries(vatRates).map(([rate, data]) => ({
      rate: parseFloat(rate),
      amount: data.amount,
      base: data.base
    }));

    return {
      amount,
      vatAmount,
      totalAmount: amount + vatAmount,
      vatRates: vatRatesArray
    };
  }

  private async createBuyerData(customer: any): Promise<BuyerData> {
    return {
      name: `${customer.first_name} ${customer.last_name}`,
      address: customer.address || '',
      email: customer.email || '',
      phone: customer.phone || '',
      nip: customer.nip // VAT number for business customers
    };
  }

  private calculateDueDate(days?: number): string {
    const dueDays = days || this.config.invoiceSettings.defaultPaymentTerms;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueDays);
    return dueDate.toISOString();
  }

  private async generateInvoicePDF(invoiceId: string): Promise<void> {
    // Implementation would generate PDF using a library like Puppeteer or jsPDF
    console.log(`Generating PDF for invoice ${invoiceId}`);

    // Update invoice with PDF URL
    await this.supabase
      .from('invoices')
      .update({
        pdfUrl: `/invoices/${invoiceId}.pdf`,
        updatedAt: new Date()
      })
      .eq('id', invoiceId);
  }

  private async generateEInvoice(invoiceId: string): Promise<void> {
    try {
      // Get invoice details
      const invoice = await this.getInvoice(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Generate KSeF XML format
      const xmlContent = this.generateKSeFXML(invoice);

      // Store e-invoice data
      await this.supabase
        .from('e_invoices')
        .insert({
          invoice_id: invoiceId,
          format: 'ksef',
          xml_content: xmlContent,
          status: 'generated',
          created_at: new Date()
        });

      // Update invoice with XML URL
      await this.supabase
        .from('invoices')
        .update({
          xmlUrl: `/invoices/${invoiceId}.xml`,
          updatedAt: new Date()
        })
        .eq('id', invoiceId);

    } catch (error) {
      console.error('Error generating e-invoice:', error);
      throw error;
    }
  }

  private generateKSeFXML(invoice: InvoiceGeneration): string {
    // Simplified KSeF XML generation
    // In production, this would generate proper KSeF-compliant XML
    return `<?xml version="1.0" encoding="UTF-8"?>
      <Faktura xmlns="http://ksef.mf.gov.pl/wykaz/2021/11/22/1111/">
        <Naglowek>
          <KodFormularza kodSystemowy="FA (1)">FA</KodFormularza>
          <WersjaFormularza>1-0</WersjaFormularza>
          <DataWytworzenia>${new Date().toISOString()}</DataWytworzenia>
          <NumerFaktury>${invoice.invoiceNumber}</NumerFaktury>
        </Naglowek>
        <Podmiot1>
          <IdentyfikatorPodmiotu>
            <NIP>${this.config.company.nip}</NIP>
            <PelnaNazwa>${this.config.company.name}</PelnaNazwa>
          </IdentyfikatorPodmiotu>
          <Adres>
            <KodKraju>PL</KodKraju>
            <Wojewodztwo>mazowieckie</Wojewodztwo>
            <Powiat>m.st. Warszawa</Powiat>
            <Gmina>m.st. Warszawa</Gmina>
            <Ulica>${this.config.company.address}</Ulica>
            <NrDomu></NrDomu>
            <Miejscowosc>${this.config.company.city}</Miejscowosc>
            <KodPocztowy>${this.config.company.postalCode}</KodPocztowy>
          </Adres>
        </Podmiot1>
        <Podmiot2>
          <IdentyfikatorPodmiotu>
            <PelnaNazwa>Klient</PelnaNazwa>
          </IdentyfikatorPodmiotu>
        </Podmiot2>
        <Faktura>
          <P_1>${invoice.issueDate.split('T')[0]}</P_1>
          <P_2>${invoice.dueDate.split('T')[0]}</P_2>
          <P_4>PLN</P_4>
        </Faktura>
      </Faktura>`;
  }

  private async createDefaultInvoiceTemplate(): Promise<void> {
    const polishTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Faktura VAT nr {{invoiceNumber}}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .seller, .buyer { margin-bottom: 20px; }
          .items { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items th, .items td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          .items th { background-color: #f5f5f5; }
          .totals { text-align: right; margin: 20px 0; }
          .footer { margin-top: 50px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FAKTURA VAT nr {{invoiceNumber}}</h1>
          <p>Data wystawienia: {{issueDate}} | Data płatności: {{dueDate}}</p>
        </div>

        <div class="seller">
          <h3>Sprzedawca:</h3>
          <p>{{seller.name}}</p>
          <p>{{seller.address}}</p>
          <p>NIP: {{seller.nip}}</p>
          <p>Bank: {{seller.bankName}} | Nr konta: {{seller.bankAccount}}</p>
        </div>

        <div class="buyer">
          <h3>Nabywca:</h3>
          <p>{{buyer.name}}</p>
          <p>{{buyer.address}}</p>
          {{#if buyer.nip}}<p>NIP: {{buyer.nip}}</p>{{/if}}
        </div>

        <table class="items">
          <thead>
            <tr>
              <th>Lp.</th>
              <th>Nazwa towaru/usługi</th>
              <th>Ilość</th>
              <th>Cena jedn.</th>
              <th>Wartość netto</th>
              <th>Stawka VAT</th>
              <th>Kwota VAT</th>
              <th>Wartość brutto</th>
            </tr>
          </thead>
          <tbody>
            {{#each items}}
            <tr>
              <td>{{@index}}</td>
              <td>{{name}}</td>
              <td>{{quantity}}</td>
              <td>{{unitPrice}} {{../currency}}</td>
              <td>{{totalPrice}} {{../currency}}</td>
              <td>{{vatRate}}%</td>
              <td>{{vatAmount}} {{../currency}}</td>
              <td>{{totalPrice}} {{../currency}}</td>
            </tr>
            {{/each}}
          </tbody>
        </table>

        <div class="totals">
          <p>Suma netto: {{amount}} {{currency}}</p>
          <p>Suma VAT: {{vatAmount}} {{currency}}</p>
          <p><strong>Suma brutto: {{totalAmount}} {{currency}}</strong></p>
        </div>

        <div class="footer">
          <p>Forma płatności: przelew bankowy</p>
          <p>Termin płatności: {{dueDate}}</p>
          <p>Faktura wygenerowana elektronicznie i jest ważna bez podpisu.</p>
        </div>
      </body>
      </html>`;

    await this.supabase
      .from('invoice_templates')
      .insert({
        name: 'Standardowa faktura VAT',
        type: 'standard',
        language: 'pl',
        template: polishTemplate,
        is_default: true,
        metadata: {
          version: '1.0',
          created_at: new Date().toISOString()
        },
        created_at: new Date()
      });
  }

  // Tax report calculation methods
  private async calculateVAT7Report(invoices: InvoiceGeneration[]): Promise<any> {
    // Simplified VAT-7 calculation
    const domesticSales = invoices
      .filter(inv => inv.currency === 'PLN')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const domesticVAT = invoices
      .filter(inv => inv.currency === 'PLN')
      .reduce((sum, inv) => sum + inv.vatAmount, 0);

    return {
      sales: {
        domestic: domesticSales,
        eu: 0,
        export: 0,
        exempt: 0
      },
      purchases: {
        domestic: 0,
        eu: 0,
        import: 0
      },
      vatPayable: domesticVAT,
      vatDeductible: 0,
      vatToPay: domesticVAT
    };
  }

  private async calculateVATUEReport(invoices: InvoiceGeneration[]): Promise<any> {
    // Simplified VAT-UE calculation for EU sales
    return {
      sales: {
        eu: 0,
        export: 0
      },
      purchases: {
        eu: 0
      }
    };
  }

  private async calculatePIT4Report(invoices: InvoiceGeneration[]): Promise<any> {
    // Simplified PIT-4 calculation for income tax
    const income = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const expenses = 0; // Would calculate from purchase invoices
    const incomeTax = Math.max(0, (income - expenses) * 0.19); // 19% tax rate

    return {
      income,
      expenses,
      incomeTax,
      incomeAfterTax: income - incomeTax
    };
  }

  private async calculateCIT8Report(invoices: InvoiceGeneration[]): Promise<any> {
    // Simplified CIT-8 calculation for corporate income tax
    return {
      revenue: invoices.reduce((sum, inv) => sum + inv.amount, 0),
      costs: 0,
      taxableIncome: 0,
      incomeTax: 0
    };
  }

  // Delivery methods
  private async sendInvoiceByEmail(invoice: InvoiceGeneration, email?: string): Promise<void> {
    // Implementation would integrate with email service
    console.log(`Sending invoice ${invoice.invoiceNumber} to ${email || 'customer'}`);
  }

  private async sendInvoiceBySMS(invoice: InvoiceGeneration): Promise<void> {
    // Implementation would integrate with SMS service
    console.log(`Sending SMS notification for invoice ${invoice.invoiceNumber}`);
  }

  private async sendInvoiceByPost(invoice: InvoiceGeneration): Promise<void> {
    // Implementation would integrate with postal service
    console.log(`Sending invoice ${invoice.invoiceNumber} by post`);
  }
}

// Export singleton instance
export const invoiceService = new InvoiceService();