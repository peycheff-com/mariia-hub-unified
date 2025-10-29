// Polish Invoice Generation System
// Generates compliant invoices according to Polish tax regulations

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

import { VATCalculationResult, VATRate } from '../vat/vat-calculator';

export interface InvoiceData {
  // Invoice metadata
  invoiceType: 'faktura' | 'faktura_proforma' | 'faktura_zaliczkowa' | 'korekta';
  issueDate: Date;
  saleDate: Date;
  dueDate: Date;

  // Related entities
  bookingId?: string;
  corporateAccountId?: string;
  companyProfileId?: string;

  // Customer information
  customerType: 'person' | 'company_polish' | 'company_eu' | 'company_non_eu';
  customerName: string;
  customerAddress: CustomerAddress;
  customerNIP?: string;
  customerEmail?: string;
  customerPhone?: string;

  // Invoice items
  items: InvoiceItem[];

  // Payment details
  paymentMethod: 'card' | 'cash' | 'transfer';
  paymentStatus: 'unpaid' | 'paid' | 'partially_paid' | 'overdue';
  currency: string;
  exchangeRate?: number;

  // Special flags
  reverseCharge?: boolean;
  splitPayment?: boolean;
  exemptFromVAT?: boolean;
  euService?: boolean;
  intraEUSupply?: boolean;

  // Additional information
  notes?: string;
  legalBasis?: string;

  // Correction details (for credit notes)
  correctedInvoiceId?: string;
  correctionReason?: string;
  originalInvoiceNumber?: string;
}

export interface CustomerAddress {
  street: string;
  buildingNumber?: string;
  apartmentNumber?: string;
  city: string;
  postalCode: string;
  country: string;
  countryIso?: string;
}

export interface InvoiceItem {
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: VATRate;
  vatAmount: number;
  totalAmount: number;
  pkwiuCode?: string;
  serviceType?: string;
  discountPercentage?: number;
  discountAmount?: number;
}

export interface GeneratedInvoice {
  id: string;
  invoiceNumber: string;
  invoiceData: InvoiceData;
  totals: InvoiceTotals;
  legalInfo: InvoiceLegalInfo;
  paymentInfo: PaymentInfo;
  qrCode?: string;
  electronicInvoicePath?: string;
  createdAt: Date;
}

export interface InvoiceTotals {
  netTotal: number;
  vatTotal: number;
  grossTotal: number;
  vatBreakdown: Record<VATRate, { base: number; amount: number }>;
  currency: string;
}

export interface InvoiceLegalInfo {
  sellerInfo: SellerInfo;
  legalBasis: string;
  notes: string[];
  isReverseCharge: boolean;
  isSplitPayment: boolean;
  isExempt: boolean;
}

export interface SellerInfo {
  name: string;
  address: CustomerAddress;
  nip: string;
  bankAccount: string;
  email?: string;
  phone?: string;
  website?: string;
}

export interface PaymentInfo {
  method: string;
  status: string;
  dueDate: Date;
  bankAccount?: string;
  transferTitle?: string;
  splitPayment?: {
    enabled: boolean;
    vatAmount: number;
    netAmount: number;
  };
}

/**
 * Polish Invoice Generator
 * Generates invoices compliant with Polish tax regulations
 */
export class PolishInvoiceGenerator {
  private static readonly SELLER_INFO: SellerInfo = {
    name: 'Mariia Hub',
    address: {
      street: 'ul. Jana Pawła II',
      buildingNumber: '43',
      apartmentNumber: '15',
      city: 'Warszawa',
      postalCode: '00-001',
      country: 'Polska',
      countryIso: 'PL'
    },
    nip: '1234567890', // Replace with actual NIP
    bankAccount: 'PL 1234 5678 9012 3456 7890 1234 5678', // Replace with actual account
    email: 'biuro@mariia-hub.pl',
    phone: '+48 123 456 789',
    website: 'www.mariia-hub.pl'
  };

  /**
   * Generate a new invoice
   */
  static async generateInvoice(data: InvoiceData): Promise<GeneratedInvoice> {
    try {
      // Validate invoice data
      this.validateInvoiceData(data);

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(data.invoiceType);

      // Calculate totals
      const totals = this.calculateTotals(data.items);

      // Prepare legal information
      const legalInfo = this.prepareLegalInfo(data, totals);

      // Prepare payment information
      const paymentInfo = this.preparePaymentInfo(data, totals);

      // Create invoice record in database
      const invoiceId = await this.createInvoiceRecord(data, invoiceNumber, totals);

      // Generate QR code for payment (if applicable)
      const qrCode = await this.generatePaymentQR(data, totals);

      // Generate electronic invoice (if required)
      const electronicInvoicePath = await this.generateElectronicInvoice(
        invoiceId,
        data,
        totals,
        legalInfo
      );

      const generatedInvoice: GeneratedInvoice = {
        id: invoiceId,
        invoiceNumber,
        invoiceData: data,
        totals,
        legalInfo,
        paymentInfo,
        qrCode,
        electronicInvoicePath,
        createdAt: new Date()
      };

      logger.info('Invoice generated successfully', {
        invoiceId,
        invoiceNumber,
        type: data.invoiceType,
        amount: totals.grossTotal
      });

      return generatedInvoice;

    } catch (error) {
      logger.error('Invoice generation failed:', error);
      throw new Error(`Failed to generate invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate invoice number
   */
  private static async generateInvoiceNumber(invoiceType: string): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('generate_invoice_number', {
        p_invoice_type: invoiceType
      });

      if (error || !data) {
        throw new Error(`Failed to generate invoice number: ${error?.message}`);
      }

      return data;
    } catch (error) {
      logger.error('Failed to generate invoice number:', error);
      throw error;
    }
  }

  /**
   * Validate invoice data
   */
  private static validateInvoiceData(data: InvoiceData): void {
    // Check required fields
    if (!data.customerName) {
      throw new Error('Customer name is required');
    }

    if (!data.customerAddress?.city || !data.customerAddress?.postalCode) {
      throw new Error('Customer address is incomplete');
    }

    if (!data.items || data.items.length === 0) {
      throw new Error('Invoice must contain at least one item');
    }

    // Validate items
    data.items.forEach((item, index) => {
      if (!item.name) {
        throw new Error(`Item ${index + 1}: Name is required`);
      }

      if (item.quantity <= 0) {
        throw new Error(`Item ${index + 1}: Quantity must be positive`);
      }

      if (item.unitPrice < 0) {
        throw new Error(`Item ${index + 1}: Unit price cannot be negative`);
      }
    });

    // Validate dates
    if (data.saleDate > data.issueDate) {
      throw new Error('Sale date cannot be after issue date');
    }

    if (data.issueDate > data.dueDate) {
      throw new Error('Issue date cannot be after due date');
    }

    // Validate NIP for companies
    if (data.customerType !== 'person' && !data.customerNIP) {
      throw new Error('NIP is required for company customers');
    }
  }

  /**
   * Calculate invoice totals
   */
  private static calculateTotals(items: InvoiceItem[]): InvoiceTotals {
    const vatBreakdown: Record<VATRate, { base: number; amount: number }> = {
      '23': { base: 0, amount: 0 },
      '8': { base: 0, amount: 0 },
      '5': { base: 0, amount: 0 },
      '0': { base: 0, amount: 0 },
      'zw': { base: 0, amount: 0 },
      'np': { base: 0, amount: 0 }
    };

    let netTotal = 0;
    let vatTotal = 0;

    items.forEach(item => {
      netTotal += item.totalAmount - item.vatAmount;
      vatTotal += item.vatAmount;

      // Update VAT breakdown
      if (!vatBreakdown[item.vatRate]) {
        vatBreakdown[item.vatRate] = { base: 0, amount: 0 };
      }

      vatBreakdown[item.vatRate].base += item.totalAmount - item.vatAmount;
      vatBreakdown[item.vatRate].amount += item.vatAmount;
    });

    return {
      netTotal: Math.round(netTotal * 100) / 100,
      vatTotal: Math.round(vatTotal * 100) / 100,
      grossTotal: Math.round((netTotal + vatTotal) * 100) / 100,
      vatBreakdown,
      currency: 'PLN'
    };
  }

  /**
   * Prepare legal information
   */
  private static prepareLegalInfo(data: InvoiceData, totals: InvoiceTotals): InvoiceLegalInfo {
    const notes: string[] = [];

    // Add standard notes based on invoice type and conditions
    if (data.reverseCharge) {
      notes.push('Odwrotne obciążenie - podatnik jest obowiązany do samobieżnego obliczenia i zapłaty podatku');
    }

    if (data.splitPayment && totals.vatTotal > 15000) {
      notes.push('Mechanizm Podzielonej Płatności (MPP) - obowiązkowy dla transakcji powyżej 15.000 PLN');
    }

    if (data.exemptFromVAT) {
      notes.push('Zwolnienie z VAT na podstawie ' + (data.legalBasis || 'przepisów ustawy o VAT'));
    }

    if (data.euService || data.intraEUSupply) {
      notes.push('Transakcja wewnątrzwspólnotowa');
      if (data.customerType === 'company_eu') {
        notes.push('Numer VAT UE kontrahenta: ' + (data.customerNIP || 'nie podano'));
      }
    }

    // Add currency information
    if (data.currency !== 'PLN' && data.exchangeRate) {
      notes.push(`Kurs wymiany: 1 ${data.currency} = ${data.exchangeRate} PLN z dnia ${data.issueDate.toLocaleDateString('pl-PL')}`);
    }

    // Add custom notes
    if (data.notes) {
      notes.push(data.notes);
    }

    return {
      sellerInfo: this.SELLER_INFO,
      legalBasis: data.legalBasis || 'Art. 41 ust. 1 Ustawy o VAT',
      notes,
      isReverseCharge: data.reverseCharge || false,
      isSplitPayment: data.splitPayment || false,
      isExempt: data.exemptFromVAT || false
    };
  }

  /**
   * Prepare payment information
   */
  private static preparePaymentInfo(data: InvoiceData, totals: InvoiceTotals): PaymentInfo {
    const transferTitle = this.generateTransferTitle(data);

    const paymentInfo: PaymentInfo = {
      method: this.getPaymentMethodLabel(data.paymentMethod),
      status: data.paymentStatus,
      dueDate: data.dueDate,
      bankAccount: data.paymentMethod === 'transfer' ? this.SELLER_INFO.bankAccount : undefined,
      transferTitle
    };

    // Add split payment information
    if (data.splitPayment && totals.vatTotal > 0) {
      paymentInfo.splitPayment = {
        enabled: true,
        vatAmount: totals.vatTotal,
        netAmount: totals.netTotal
      };
    }

    return paymentInfo;
  }

  /**
   * Generate transfer title
   */
  private static generateTransferTitle(data: InvoiceData): string {
    // This would be generated with the actual invoice number
    return `Faktura ${data.invoiceType.toUpperCase()}/${new Date().getFullYear()}`;
  }

  /**
   * Get payment method label
   */
  private static getPaymentMethodLabel(method: string): string {
    const labels = {
      card: 'Płatność kartą',
      cash: 'Płatność gotówką',
      transfer: 'Przelew bankowy'
    };

    return labels[method as keyof typeof labels] || method;
  }

  /**
   * Create invoice record in database
   */
  private static async createInvoiceRecord(
    data: InvoiceData,
    invoiceNumber: string,
    totals: InvoiceTotals
  ): Promise<string> {
    try {
      const invoiceRecord = {
        invoice_number: invoiceNumber,
        invoice_type: data.invoiceType,
        issue_date: data.issueDate.toISOString().split('T')[0],
        sale_date: data.saleDate.toISOString().split('T')[0],
        due_date: data.dueDate.toISOString().split('T')[0],

        booking_id: data.bookingId,
        corporate_account_id: data.corporateAccountId,
        company_profile_id: data.companyProfileId,

        customer_type: data.customerType,
        customer_name: data.customerName,
        customer_address: data.customerAddress,
        customer_nip: data.customerNIP,
        customer_email: data.customerEmail,

        seller_name: this.SELLER_INFO.name,
        seller_address: this.SELLER_INFO.address,
        seller_nip: this.SELLER_INFO.nip,
        seller_bank_account: this.SELLER_INFO.bankAccount,

        currency: data.currency,
        exchange_rate: data.exchangeRate || 1.0,

        vat_basis: totals.netTotal,
        vat_amount: totals.vatTotal,
        vat_rate: '23', // This would need to be calculated properly
        total_amount: totals.grossTotal,

        split_payment: data.splitPayment || false,
        reverse_charge: data.reverseCharge || false,
        eu_service: data.euService || false,
        intra_eu_supply: data.intraEUSupply || false,

        items: data.items,
        notes: data.notes,
        payment_method: data.paymentMethod,
        payment_status: data.paymentStatus,

        corrected_invoice_id: data.correctedInvoiceId,
        reason_for_correction: data.correctionReason,

        metadata: {
          generated_at: new Date().toISOString(),
          version: '1.0'
        }
      };

      const { data: result, error } = await supabase
        .from('invoices')
        .insert(invoiceRecord)
        .select('id')
        .single();

      if (error || !result) {
        throw new Error(`Failed to create invoice record: ${error?.message}`);
      }

      // Create invoice items
      await this.createInvoiceItems(result.id, data.items);

      return result.id;
    } catch (error) {
      logger.error('Failed to create invoice record:', error);
      throw error;
    }
  }

  /**
   * Create invoice items in database
   */
  private static async createInvoiceItems(invoiceId: string, items: InvoiceItem[]): Promise<void> {
    try {
      const itemRecords = items.map(item => ({
        invoice_id: invoiceId,
        item_name: item.name,
        item_description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unitPrice,
        vat_rate: item.vatRate,
        discount_percentage: item.discountPercentage || 0,
        discount_amount: item.discountAmount || 0,
        pkwiu_code: item.pkwiuCode,
        service_type: item.serviceType
      }));

      const { error } = await supabase
        .from('invoice_items')
        .insert(itemRecords);

      if (error) {
        throw new Error(`Failed to create invoice items: ${error.message}`);
      }
    } catch (error) {
      logger.error('Failed to create invoice items:', error);
      throw error;
    }
  }

  /**
   * Generate payment QR code
   */
  private static async generatePaymentQR(
    data: InvoiceData,
    totals: InvoiceTotals
  ): Promise<string | undefined> {
    if (data.paymentMethod !== 'transfer') {
      return undefined;
    }

    try {
      // Generate QR code data for Polish payment systems
      const qrData = this.generatePaymentQRData(data, totals);

      // In a real implementation, you would use a QR code library
      // For now, return a placeholder
      return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77yQAAAABJRU5ErkJggg==`;

    } catch (error) {
      logger.error('Failed to generate payment QR code:', error);
      return undefined;
    }
  }

  /**
   * Generate payment QR code data
   */
  private static generatePaymentQRData(data: InvoiceData, totals: InvoiceTotals): string {
    // Format: |PL|account_number|amount|currency|recipient_name|transfer_title|
    const amount = totals.grossTotal.toFixed(2).replace('.', ',');
    const recipient = this.SELLER_INFO.name.replace(/ /g, '+');
    const title = this.generateTransferTitle(data).replace(/ /g, '+');

    return `|PL|${this.SELLER_INFO.bankAccount.replace(/ /g, '')}|${amount}|${data.currency}|${recipient}|${title}|`;
  }

  /**
   * Generate electronic invoice (JPK)
   */
  private static async generateElectronicInvoice(
    invoiceId: string,
    data: InvoiceData,
    totals: InvoiceTotals,
    legalInfo: InvoiceLegalInfo
  ): Promise<string | undefined> {
    try {
      // Generate JPK_FA (standard invoice) XML file
      const jpkData = this.generateJPKData(invoiceId, data, totals, legalInfo);

      // Store the electronic invoice
      const filePath = `invoices/${invoiceId}/${invoiceId}_jpk_fa.xml`;

      // In a real implementation, you would store this in a file storage service
      // For now, return a placeholder path
      return filePath;

    } catch (error) {
      logger.error('Failed to generate electronic invoice:', error);
      return undefined;
    }
  }

  /**
   * Generate JPK_FA data structure
   */
  private static generateJPKData(
    invoiceId: string,
    data: InvoiceData,
    totals: InvoiceTotals,
    legalInfo: InvoiceLegalInfo
  ): any {
    return {
      // This would generate the full JPK_FA XML structure
      // For Polish tax authority requirements
      xmlns: 'http://crd.gov.pl/wzor/2023/06/29/11059/',
      Naglowek: {
        KodFormularza: {
          _attributes: {
            kodSystemowy: 'JPK_FA (3)',
            wersjaSchemy: '1-0'
          }
        },
        WariantFormularza: '3',
        DataWytworzeniaJPK: new Date().toISOString(),
        DataOd: data.saleDate.toISOString().split('T')[0],
        DataDo: data.saleDate.toISOString().split('T')[0],
        DomyslnyKodWaluty: data.currency,
        KodUrzedu: '1411' // Warsaw tax office code
      },
      Podmiot1: {
        IdentyfikatorPodmiotu: {
          etd: 'NIP',
          NIP: legalInfo.sellerInfo.nip
        },
        AdresPolski: {
          KodKraju: 'PL',
          Wojewodztwo: 'Mazowieckie',
          Powiat: 'm. st. Warszawa',
          Gmina: 'Warszawa-Centrum',
          Ulica: legalInfo.sellerInfo.address.street,
          NrDomu: legalInfo.sellerInfo.address.buildingNumber,
          NrLokalu: legalInfo.sellerInfo.address.apartmentNumber,
          Miejscowosc: legalInfo.sellerInfo.address.city,
          KodPocztowy: legalInfo.sellerInfo.address.postalCode,
          Poczta: legalInfo.sellerInfo.address.city
        }
      },
      Faktura: [{
        P_1: invoiceId,
        P_2A: invoiceId,
        P_3: data.saleDate.toISOString().split('T')[0],
        P_4: data.issueDate.toISOString().split('T')[0],
        P_5: data.dueDate.toISOString().split('T')[0],
        P_6: 'MPP' in legalInfo && legalInfo.isSplitPayment ? 'MPP' : '',
        P_7: legalInfo.sellerInfo.nip,
        P_8: legalInfo.sellerInfo.name,
        P_9: {
          KodKraju: data.customerAddress.countryIso || 'PL',
          NIP: data.customerNIP || '',
          NazwaWlasna: data.customerName,
          Adres: {
            KodKraju: data.customerAddress.countryIso || 'PL',
            Wojewodztwo: '',
            Powiat: '',
            Gmina: '',
            Ulica: data.customerAddress.street,
            NrDomu: data.customerAddress.buildingNumber || '',
            NrLokalu: data.customerAddress.apartmentNumber || '',
            Miejscowosc: data.customerAddress.city,
            KodPocztowy: data.customerAddress.postalCode,
            Poczta: data.customerAddress.city
          }
        },
        P_10: '1',
        P_13: totals.grossTotal,
        P_14: totals.vatTotal,
        P_15: data.currency,
        P_17: totals.netTotal,
        P_20: 'K',
        P_21: legalInfo.legalBasis,
        P_22: 'K',
        P_23: legalInfo.legalBasis
      }]
    };
  }

  /**
   * Generate credit note (faktura korygująca)
   */
  static async generateCreditNote(
    originalInvoiceId: string,
    correctionReason: string,
    correctedItems?: Array<{
      itemId: string;
      originalQuantity: number;
      correctedQuantity: number;
      originalUnitPrice: number;
      correctedUnitPrice: number;
    }>
  ): Promise<GeneratedInvoice> {
    try {
      // Get original invoice
      const { data: originalInvoice, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', originalInvoiceId)
        .single();

      if (error || !originalInvoice) {
        throw new Error(`Original invoice not found: ${error?.message}`);
      }

      // Calculate corrections
      const corrections = this.calculateCorrections(originalInvoice, correctedItems);

      // Create credit note data
      const creditNoteData: InvoiceData = {
        invoiceType: 'korekta',
        issueDate: new Date(),
        saleDate: new Date(originalInvoice.sale_date),
        dueDate: new Date(),
        bookingId: originalInvoice.booking_id,
        corporateAccountId: originalInvoice.corporate_account_id,
        companyProfileId: originalInvoice.company_profile_id,
        customerType: originalInvoice.customer_type as any,
        customerName: originalInvoice.customer_name,
        customerAddress: originalInvoice.customer_address,
        customerNIP: originalInvoice.customer_nip,
        customerEmail: originalInvoice.customer_email,
        items: corrections.items,
        paymentMethod: originalInvoice.payment_method as any,
        paymentStatus: 'unpaid',
        currency: originalInvoice.currency,
        reverseCharge: originalInvoice.reverse_charge,
        splitPayment: originalInvoice.split_payment,
        correctedInvoiceId: originalInvoiceId,
        correctionReason,
        originalInvoiceNumber: originalInvoice.invoice_number,
        notes: `Korekta faktury nr ${originalInvoice.invoice_number}`
      };

      // Generate credit note
      return await this.generateInvoice(creditNoteData);

    } catch (error) {
      logger.error('Failed to generate credit note:', error);
      throw error;
    }
  }

  /**
   * Calculate corrections for credit note
   */
  private static calculateCorrections(
    originalInvoice: any,
    correctedItems?: Array<{
      itemId: string;
      originalQuantity: number;
      correctedQuantity: number;
      originalUnitPrice: number;
      correctedUnitPrice: number;
    }>
  ): { items: InvoiceItem[]; totalCorrection: number } {
    // This would calculate the difference between original and corrected amounts
    // For now, return a simple implementation

    const items: InvoiceItem[] = originalInvoice.items.map((item: any) => {
      const correction = correctedItems?.find(c => c.itemId === item.id);

      const quantity = correction ? correction.correctedQuantity - correction.originalQuantity : 0;
      const unitPrice = correction ? correction.correctedUnitPrice - correction.originalUnitPrice : 0;

      const totalAmount = quantity * (item.unit_price + unitPrice);
      const vatAmount = totalAmount * 0.23; // Simplified VAT calculation

      return {
        name: `Korekta: ${item.item_name}`,
        description: `Korekta pozycji: ${item.item_name}`,
        quantity: Math.abs(quantity),
        unit: item.unit,
        unitPrice: Math.abs(unitPrice),
        vatRate: item.vat_rate,
        vatAmount: Math.abs(vatAmount),
        totalAmount: Math.abs(totalAmount),
        pkwiuCode: item.pkwiu_code,
        serviceType: item.service_type
      };
    }).filter(item => item.totalAmount > 0);

    const totalCorrection = items.reduce((sum, item) => sum + item.totalAmount, 0);

    return { items, totalCorrection };
  }
}

/**
 * React hook for invoice generation
 */
export function useInvoiceGenerator() {
  const generateInvoice = async (data: InvoiceData) => {
    return await PolishInvoiceGenerator.generateInvoice(data);
  };

  const generateCreditNote = async (
    originalInvoiceId: string,
    correctionReason: string,
    correctedItems?: Array<{
      itemId: string;
      originalQuantity: number;
      correctedQuantity: number;
      originalUnitPrice: number;
      correctedUnitPrice: number;
    }>
  ) => {
    return await PolishInvoiceGenerator.generateCreditNote(
      originalInvoiceId,
      correctionReason,
      correctedItems
    );
  };

  return {
    generateInvoice,
    generateCreditNote
  };
}