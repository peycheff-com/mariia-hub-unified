// Tax Reporting System for Polish VAT Compliance
// Generates comprehensive tax reports and JPK files for Polish tax authorities

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface VATRegisterData {
  periodType: 'monthly' | 'quarterly';
  periodStart: Date;
  periodEnd: Date;

  // Sales data (sprzedaż)
  salesDomestic23: number;  // 23% rate domestic sales
  salesDomestic8: number;   // 8% rate domestic sales
  salesDomestic5: number;   // 5% rate domestic sales
  salesDomestic0: number;   // 0% rate domestic sales
  salesDomesticExempt: number; // Exempt domestic sales
  salesEUGoods: number;     // EU goods sales
  salesEUServices: number;  // EU services sales
  salesExport: number;      // Export sales

  // Purchase data (zakupy)
  purchaseDomestic23: number;  // 23% rate domestic purchases
  purchaseDomestic8: number;   // 8% rate domestic purchases
  purchaseDomestic5: number;   // 5% rate domestic purchases
  purchaseDomestic0: number;   // 0% rate domestic purchases
  purchaseDomesticExempt: number; // Exempt domestic purchases
  purchaseEUGoods: number;     // EU goods purchases
  purchaseEUServices: number;  // EU services purchases
  purchaseImport: number;      // Import purchases

  // Tax calculations
  vatPayable: number;     // VAT to pay (sales)
  vatDeductible: number;  // VAT to deduct (purchases)
  vatDifference: number;  // VAT difference

  // Status
  status: 'draft' | 'submitted' | 'verified';
  submittedAt?: Date;
  verifiedAt?: Date;
}

export interface JPK_FA_Data {
  // JPK_FA header information
  header: {
    formCode: string;
    variant: string;
    creationDate: string;
    periodFrom: string;
    periodTo: string;
    defaultCurrency: string;
    taxOfficeCode: string;
  };

  // Company information
  company: {
    nip: string;
    name: string;
    address: {
      country: string;
      voivodeship: string;
      county: string;
      commune: string;
      street: string;
      buildingNumber: string;
      apartmentNumber?: string;
      city: string;
      postalCode: string;
      postOffice: string;
    };
  };

  // Invoice data
  invoices: Array<{
    invoiceId: string;
    invoiceNumber: string;
    issueDate: string;
    saleDate: string;
    dueDate: string;
    splitPayment?: string;
    sellerNIP: string;
    sellerName: string;
    buyerNIP?: string;
    buyerName: string;
    buyerAddress: {
      country: string;
      voivodeship?: string;
      county?: string;
      commune?: string;
      street?: string;
      buildingNumber?: string;
      apartmentNumber?: string;
      city: string;
      postalCode: string;
      postOffice?: string;
    };
    productType: 'goods' | 'services';
    grossAmount: number;
    vatAmount: number;
    currency: string;
    netAmount: number;
    vatRate: '23' | '8' | '5' | '0' | 'ZW' | 'NP';
    exemptFromVAT: string;
    groundsForExemption: string;
    reverseCharge?: string;
    importProcedures?: string;
  }>;

  // Summary data
  summary: {
    totalInvoices: number;
    totalGrossAmount: number;
    totalVATAmount: number;
    totalNetAmount: number;
    vatBreakdown: {
      rate23: { base: number; tax: number };
      rate8: { base: number; tax: number };
      rate5: { base: number; tax: number };
      rate0: { base: number; tax: number };
      exempt: { base: number };
    };
  };
}

export interface TaxReportOptions {
  periodType: 'monthly' | 'quarterly';
  year: number;
  month?: number; // For monthly reports
  quarter?: number; // For quarterly reports
  format: 'json' | 'xml' | 'pdf';
  includeDetailed: boolean;
  includeAttachments: boolean;
}

export interface TaxReportResult {
  reportId: string;
  reportType: string;
  period: {
    start: Date;
    end: Date;
    type: string;
  };
  data: VATRegisterData | JPK_FA_Data;
  format: string;
  filePath?: string;
  generatedAt: Date;
  status: 'generated' | 'error';
  errorMessage?: string;
}

/**
 * VAT Register Service
 * Manages VAT registers for tax reporting
 */
export class VATRegisterService {
  /**
   * Generate VAT register for a period
   */
  static async generateVATRegister(
    periodType: 'monthly' | 'quarterly',
    startDate: Date,
    endDate: Date
  ): Promise<VATRegisterData> {
    try {
      logger.info('Generating VAT register', { periodType, startDate, endDate });

      // Get all invoices for the period
      const invoices = await this.getInvoicesForPeriod(startDate, endDate);

      // Calculate sales data
      const salesData = this.calculateSalesData(invoices);

      // Calculate purchase data (from expense records or purchase invoices)
      const purchaseData = await this.calculatePurchaseData(startDate, endDate);

      // Calculate VAT difference
      const vatPayable = Object.values(salesData).reduce((sum, amount) => sum + amount, 0);
      const vatDeductible = Object.values(purchaseData).reduce((sum, amount) => sum + amount, 0);

      const vatRegisterData: VATRegisterData = {
        periodType,
        periodStart: startDate,
        periodEnd: endDate,
        ...salesData,
        ...purchaseData,
        vatPayable,
        vatDeductible,
        vatDifference: vatPayable - vatDeductible,
        status: 'draft'
      };

      // Save to database
      await this.saveVATRegister(vatRegisterData);

      return vatRegisterData;

    } catch (error) {
      logger.error('Failed to generate VAT register:', error);
      throw new Error(`Failed to generate VAT register: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get invoices for period
   */
  private static async getInvoicesForPeriod(startDate: Date, endDate: Date) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .gte('issue_date', startDate.toISOString().split('T')[0])
      .lte('issue_date', endDate.toISOString().split('T')[0])
      .neq('invoice_type', 'korekta'); // Exclude credit notes

    if (error) {
      throw new Error(`Failed to fetch invoices: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Calculate sales data from invoices
   */
  private static calculateSalesData(invoices: any[]) {
    const salesData = {
      salesDomestic23: 0,
      salesDomestic8: 0,
      salesDomestic5: 0,
      salesDomestic0: 0,
      salesDomesticExempt: 0,
      salesEUGoods: 0,
      salesEUServices: 0,
      salesExport: 0
    };

    invoices.forEach(invoice => {
      const netAmount = invoice.vat_basis;
      const vatRate = invoice.vat_rate;

      // Classify based on VAT rate and customer type
      if (invoice.customer_type === 'company_eu' || invoice.customer_type === 'company_non_eu') {
        if (invoice.eu_service || invoice.intra_eu_supply) {
          if (invoice.eu_service) {
            salesData.salesEUServices += netAmount;
          } else {
            salesData.salesEUGoods += netAmount;
          }
        } else {
          salesData.salesExport += netAmount;
        }
      } else {
        // Domestic sales
        switch (vatRate) {
          case '23':
            salesData.salesDomestic23 += netAmount;
            break;
          case '8':
            salesData.salesDomestic8 += netAmount;
            break;
          case '5':
            salesData.salesDomestic5 += netAmount;
            break;
          case '0':
            salesData.salesDomestic0 += netAmount;
            break;
          case 'zw':
          case 'np':
            salesData.salesDomesticExempt += netAmount;
            break;
        }
      }
    });

    return salesData;
  }

  /**
   * Calculate purchase data
   */
  private static async calculatePurchaseData(startDate: Date, endDate: Date) {
    // In a real implementation, you would have expense records or purchase invoices
    // For now, return mock data
    return {
      purchaseDomestic23: 1000.00,
      purchaseDomestic8: 500.00,
      purchaseDomestic5: 200.00,
      purchaseDomestic0: 0.00,
      purchaseDomesticExempt: 300.00,
      purchaseEUGoods: 800.00,
      purchaseEUServices: 400.00,
      purchaseImport: 200.00
    };
  }

  /**
   * Save VAT register to database
   */
  private static async saveVATRegister(data: VATRegisterData): Promise<void> {
    const { error } = await supabase
      .from('vat_registers')
      .upsert({
        period_type: data.periodType,
        period_start: data.periodStart.toISOString().split('T')[0],
        period_end: data.periodEnd.toISOString().split('T')[0],
        sales_domestic_23: data.salesDomestic23,
        sales_domestic_8: data.salesDomestic8,
        sales_domestic_5: data.salesDomestic5,
        sales_domestic_0: data.salesDomestic0,
        sales_domestic_exempt: data.salesDomesticExempt,
        sales_eu_goods: data.salesEUGoods,
        sales_eu_services: data.salesEUServices,
        sales_export: data.salesExport,
        purchase_domestic_23: data.purchaseDomestic23,
        purchase_domestic_8: data.purchaseDomestic8,
        purchase_domestic_5: data.purchaseDomestic5,
        purchase_domestic_0: data.purchaseDomestic0,
        purchase_domestic_exempt: data.purchaseDomesticExempt,
        purchase_eu_goods: data.purchaseEUGoods,
        purchase_eu_services: data.purchaseEUServices,
        purchase_import: data.purchaseImport,
        vat_payable: data.vatPayable,
        vat_deductible: data.vatDeductible,
        vat_difference: data.vatDifference,
        status: data.status,
        metadata: {
          generated_at: new Date().toISOString(),
          version: '1.0'
        }
      });

    if (error) {
      throw new Error(`Failed to save VAT register: ${error.message}`);
    }
  }

  /**
   * Get existing VAT register
   */
  static async getVATRegister(
    periodType: 'monthly' | 'quarterly',
    startDate: Date,
    endDate: Date
  ): Promise<VATRegisterData | null> {
    const { data, error } = await supabase
      .from('vat_registers')
      .select('*')
      .eq('period_type', periodType)
      .eq('period_start', startDate.toISOString().split('T')[0])
      .eq('period_end', endDate.toISOString().split('T')[0])
      .single();

    if (error || !data) {
      return null;
    }

    return {
      periodType: data.period_type,
      periodStart: new Date(data.period_start),
      periodEnd: new Date(data.period_end),
      salesDomestic23: data.sales_domestic_23,
      salesDomestic8: data.sales_domestic_8,
      salesDomestic5: data.sales_domestic_5,
      salesDomestic0: data.sales_domestic_0,
      salesDomesticExempt: data.sales_domestic_exempt,
      salesEUGoods: data.sales_eu_goods,
      salesEUServices: data.sales_eu_services,
      salesExport: data.sales_export,
      purchaseDomestic23: data.purchase_domestic_23,
      purchaseDomestic8: data.purchase_domestic_8,
      purchaseDomestic5: data.purchase_domestic_5,
      purchaseDomestic0: data.purchase_domestic_0,
      purchaseDomesticExempt: data.purchase_domestic_exempt,
      purchaseEUGoods: data.purchase_eu_goods,
      purchaseEUServices: data.purchase_eu_services,
      purchaseImport: data.purchase_import,
      vatPayable: data.vat_payable,
      vatDeductible: data.vat_deductible,
      vatDifference: data.vat_difference,
      status: data.status as any,
      submittedAt: data.submitted_at ? new Date(data.submitted_at) : undefined,
      verifiedAt: data.verified_at ? new Date(data.verified_at) : undefined
    };
  }

  /**
   * Submit VAT register to tax authorities
   */
  static async submitVATRegister(
    periodType: 'monthly' | 'quarterly',
    startDate: Date,
    endDate: Date
  ): Promise<boolean> {
    try {
      // Update status
      const { error } = await supabase
        .from('vat_registers')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('period_type', periodType)
        .eq('period_start', startDate.toISOString().split('T')[0])
        .eq('period_end', endDate.toISOString().split('T')[0]);

      if (error) {
        throw new Error(`Failed to submit VAT register: ${error.message}`);
      }

      logger.info('VAT register submitted', { periodType, startDate, endDate });
      return true;

    } catch (error) {
      logger.error('Failed to submit VAT register:', error);
      return false;
    }
  }
}

/**
 * JPK (Jednolity Plik Kontrolny) Generator
 * Generates XML files for Polish tax authorities
 */
export class JPKGenerator {
  /**
   * Generate JPK_FA (invoices) file
   */
  static async generateJPK_FA(options: TaxReportOptions): Promise<JPK_FA_Data> {
    try {
      logger.info('Generating JPK_FA', options);

      // Determine period dates
      const { startDate, endDate } = this.getPeriodDates(options);

      // Get invoices for the period
      const invoices = await this.getInvoicesForPeriod(startDate, endDate);

      // Generate JPK structure
      const jpkData: JPK_FA_Data = {
        header: {
          formCode: 'JPK_FA',
          variant: '3',
          creationDate: new Date().toISOString(),
          periodFrom: startDate.toISOString().split('T')[0],
          periodTo: endDate.toISOString().split('T')[0],
          defaultCurrency: 'PLN',
          taxOfficeCode: '1411' // Warsaw tax office code
        },
        company: {
          nip: '1234567890', // Replace with actual company NIP
          name: 'Mariia Hub',
          address: {
            country: 'PL',
            voivodeship: 'Mazowieckie',
            county: 'm. st. Warszawa',
            commune: 'Warszawa-Centrum',
            street: 'ul. Jana Pawła II',
            buildingNumber: '43',
            apartmentNumber: '15',
            city: 'Warszawa',
            postalCode: '00-001',
            postOffice: 'Warszawa'
          }
        },
        invoices: invoices.map(invoice => this.formatInvoiceForJPK(invoice)),
        summary: this.calculateJPKSummary(invoices)
      };

      return jpkData;

    } catch (error) {
      logger.error('Failed to generate JPK_FA:', error);
      throw new Error(`Failed to generate JPK_FA: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert JPK data to XML
   */
  static generateJPK_XML(jpkData: JPK_FA_Data): string {
    // Generate XML structure for JPK_FA
    // This is a simplified version - in production, you would use a proper XML library

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<JPK xmlns="${jpkData.header.defaultCurrency}">
  <Naglowek>
    <KodFormularza kodSystemowy="JPK_FA (3)" wersjaSchemy="1-0">JPK_FA</KodFormularza>
    <WariantFormularza>3</WariantFormularza>
    <DataWytworzeniaJPK>${jpkData.header.creationDate}</DataWytworzeniaJPK>
    <DataOd>${jpkData.header.periodFrom}</DataOd>
    <DataDo>${jpkData.header.periodTo}</DataDo>
    <DomyslnyKodWaluty>${jpkData.header.defaultCurrency}</DomyslnyKodWaluty>
    <KodUrzedu>${jpkData.header.taxOfficeCode}</KodUrzedu>
  </Naglowek>

  <Podmiot1>
    <IdentyfikatorPodmiotu>
      <etd>NIP</etd>
      <NIP>${jpkData.company.nip}</NIP>
    </IdentyfikatorPodmiotu>
    <AdresPolski>
      <KodKraju>${jpkData.company.address.country}</KodKraju>
      <Wojewodztwo>${jpkData.company.address.voivodeship}</Wojewodztwo>
      <Powiat>${jpkData.company.address.county}</Powiat>
      <Gmina>${jpkData.company.address.commune}</Gmina>
      <Ulica>${jpkData.company.address.street}</Ulica>
      <NrDomu>${jpkData.company.address.buildingNumber}</NrDomu>
      ${jpkData.company.address.apartmentNumber ? `<NrLokalu>${jpkData.company.address.apartmentNumber}</NrLokalu>` : ''}
      <Miejscowosc>${jpkData.company.address.city}</Miejscowosc>
      <KodPocztowy>${jpkData.company.address.postalCode}</KodPocztowy>
      <Poczta>${jpkData.company.address.postOffice}</Poczta>
    </AdresPolski>
  </Podmiot1>

  <Faktura>
    ${jpkData.invoices.map(invoice => this.formatInvoiceAsXML(invoice)).join('\n    ')}
  </Faktura>

  <FakturaCtrl>
    <LiczbaFaktur>${jpkData.summary.totalInvoices}</LiczbaFaktur>
    <WartoscFaktur>${jpkData.summary.totalGrossAmount.toFixed(2)}</WartoscFaktur>
    <PodatekVAT>${jpkData.summary.totalVATAmount.toFixed(2)}</PodatekVAT>
  </FakturaCtrl>
</JPK>`;

    return xml;
  }

  /**
   * Get period dates from options
   */
  private static getPeriodDates(options: TaxReportOptions): { startDate: Date; endDate: Date } {
    const year = options.year;
    let startDate: Date;
    let endDate: Date;

    if (options.periodType === 'monthly' && options.month) {
      startDate = new Date(year, options.month - 1, 1);
      endDate = new Date(year, options.month, 0); // Last day of month
    } else if (options.periodType === 'quarterly' && options.quarter) {
      const startMonth = (options.quarter - 1) * 3;
      startDate = new Date(year, startMonth, 1);
      endDate = new Date(year, startMonth + 3, 0); // Last day of quarter
    } else {
      throw new Error('Invalid period options');
    }

    return { startDate, endDate };
  }

  /**
   * Get invoices for period
   */
  private static async getInvoicesForPeriod(startDate: Date, endDate: Date) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items (*)
      `)
      .gte('issue_date', startDate.toISOString().split('T')[0])
      .lte('issue_date', endDate.toISOString().split('T')[0])
      .neq('invoice_type', 'korekta');

    if (error) {
      throw new Error(`Failed to fetch invoices for JPK: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Format invoice for JPK
   */
  private static formatInvoiceForJPK(invoice: any): any {
    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      issueDate: invoice.issue_date,
      saleDate: invoice.sale_date,
      dueDate: invoice.due_date,
      splitPayment: invoice.split_payment ? 'MPP' : '',
      sellerNIP: invoice.seller_nip,
      sellerName: invoice.seller_name,
      buyerNIP: invoice.customer_nip || '',
      buyerName: invoice.customer_name,
      buyerAddress: {
        country: invoice.customer_address?.countryIso || 'PL',
        street: invoice.customer_address?.street || '',
        buildingNumber: invoice.customer_address?.buildingNumber || '',
        city: invoice.customer_address?.city || '',
        postalCode: invoice.customer_address?.postalCode || ''
      },
      productType: 'services', // Default to services for beauty/fitness
      grossAmount: invoice.total_amount,
      vatAmount: invoice.vat_amount,
      currency: invoice.currency,
      netAmount: invoice.vat_basis,
      vatRate: this.mapVATRateForJPK(invoice.vat_rate),
      exemptFromVAT: invoice.vat_rate === 'zw' || invoice.vat_rate === 'np' ? 'true' : 'false',
      groundsForExemption: invoice.vat_rate === 'zw' ? 'zwolnienie' : invoice.vat_rate === 'np' ? 'nie podlega' : '',
      reverseCharge: invoice.reverse_charge ? 'true' : 'false'
    };
  }

  /**
   * Map VAT rate for JPK format
   */
  private static mapVATRateForJPK(vatRate: string): '23' | '8' | '5' | '0' | 'ZW' | 'NP' {
    switch (vatRate) {
      case '23': return '23';
      case '8': return '8';
      case '5': return '5';
      case '0': return '0';
      case 'zw': return 'ZW';
      case 'np': return 'NP';
      default: return '23';
    }
  }

  /**
   * Calculate JPK summary
   */
  private static calculateJPKSummary(invoices: any[]) {
    const summary = {
      totalInvoices: invoices.length,
      totalGrossAmount: 0,
      totalVATAmount: 0,
      totalNetAmount: 0,
      vatBreakdown: {
        rate23: { base: 0, tax: 0 },
        rate8: { base: 0, tax: 0 },
        rate5: { base: 0, tax: 0 },
        rate0: { base: 0, tax: 0 },
        exempt: { base: 0 }
      }
    };

    invoices.forEach(invoice => {
      summary.totalGrossAmount += invoice.total_amount;
      summary.totalVATAmount += invoice.vat_amount;
      summary.totalNetAmount += invoice.vat_basis;

      const vatRate = invoice.vat_rate;
      const netAmount = invoice.vat_basis;
      const vatAmount = invoice.vat_amount;

      switch (vatRate) {
        case '23':
          summary.vatBreakdown.rate23.base += netAmount;
          summary.vatBreakdown.rate23.tax += vatAmount;
          break;
        case '8':
          summary.vatBreakdown.rate8.base += netAmount;
          summary.vatBreakdown.rate8.tax += vatAmount;
          break;
        case '5':
          summary.vatBreakdown.rate5.base += netAmount;
          summary.vatBreakdown.rate5.tax += vatAmount;
          break;
        case '0':
          summary.vatBreakdown.rate0.base += netAmount;
          break;
        case 'zw':
        case 'np':
          summary.vatBreakdown.exempt.base += netAmount;
          break;
      }
    });

    return summary;
  }

  /**
   * Format invoice as XML
   */
  private static formatInvoiceAsXML(invoice: any): string {
    return `
    <Faktura>
      <P_1>${invoice.invoiceId}</P_1>
      <P_2A>${invoice.invoiceNumber}</P_2A>
      <P_3>${invoice.saleDate}</P_3>
      <P_4>${invoice.issueDate}</P_4>
      <P_5>${invoice.dueDate}</P_5>
      <P_6>${invoice.splitPayment}</P_6>
      <P_7>${invoice.sellerNIP}</P_7>
      <P_8>${invoice.sellerName}</P_8>
      <P_9>
        <KodKraju>${invoice.buyerAddress.country}</KodKraju>
        <NIP>${invoice.buyerNIP}</NIP>
        <NazwaWlasna>${invoice.buyerName}</NazwaWlasna>
        <Adres>
          <KodKraju>${invoice.buyerAddress.country}</KodKraju>
          <Ulica>${invoice.buyerAddress.street}</Ulica>
          <NrDomu>${invoice.buyerAddress.buildingNumber}</NrDomu>
          <Miejscowosc>${invoice.buyerAddress.city}</Miejscowosc>
          <KodPocztowy>${invoice.buyerAddress.postalCode}</KodPocztowy>
        </Adres>
      </P_9>
      <P_10>${invoice.productType === 'goods' ? 'G' : 'S'}</P_10>
      <P_13>${invoice.grossAmount.toFixed(2)}</P_13>
      <P_14>${invoice.vatAmount.toFixed(2)}</P_14>
      <P_15>${invoice.currency}</P_15>
      <P_17>${invoice.netAmount.toFixed(2)}</P_17>
      <P_20>${invoice.vatRate}</P_20>
      <P_21>${invoice.exemptFromVAT}</P_21>
      <P_22>${invoice.exemptFromVAT}</P_22>
      <P_23>${invoice.groundsForExemption}</P_23>
    </Faktura>`;
  }
}

/**
 * Tax Reporting Service
 * Main service for generating tax reports
 */
export class TaxReportingService {
  /**
   * Generate tax report
   */
  static async generateTaxReport(options: TaxReportOptions): Promise<TaxReportResult> {
    try {
      logger.info('Generating tax report', options);

      let data: VATRegisterData | JPK_FA_Data;
      let reportType: string;

      // Generate appropriate report based on options
      if (options.includeDetailed) {
        // Generate JPK_FA for detailed reporting
        data = await JPKGenerator.generateJPK_FA(options);
        reportType = 'JPK_FA';
      } else {
        // Generate VAT register summary
        const { startDate, endDate } = JPKGenerator['getPeriodDates'](options);
        data = await VATRegisterService.generateVATRegister(
          options.periodType,
          startDate,
          endDate
        );
        reportType = 'VAT_Register';
      }

      const result: TaxReportResult = {
        reportId: `report_${Date.now()}`,
        reportType,
        period: {
          start: JPKGenerator['getPeriodDates'](options).startDate,
          end: JPKGenerator['getPeriodDates'](options).endDate,
          type: options.periodType
        },
        data,
        format: options.format,
        generatedAt: new Date(),
        status: 'generated'
      };

      return result;

    } catch (error) {
      logger.error('Failed to generate tax report:', error);
      return {
        reportId: `report_${Date.now()}`,
        reportType: 'error',
        period: {
          start: new Date(),
          end: new Date(),
          type: options.periodType
        },
        data: {} as any,
        format: options.format,
        generatedAt: new Date(),
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Export report to file
   */
  static async exportReportToFile(
    report: TaxReportResult,
    format: 'json' | 'xml' | 'pdf'
  ): Promise<string> {
    try {
      let content: string;
      let fileName: string;

      switch (format) {
        case 'json':
          content = JSON.stringify(report.data, null, 2);
          fileName = `${report.reportType}_${report.period.start.toISOString().split('T')[0]}.json`;
          break;

        case 'xml':
          if (report.reportType === 'JPK_FA') {
            content = JPKGenerator.generateJPK_XML(report.data as JPK_FA_Data);
            fileName = `JPK_FA_${report.period.start.toISOString().split('T')[0]}.xml`;
          } else {
            throw new Error('XML export only supported for JPK_FA reports');
          }
          break;

        case 'pdf':
          // PDF generation would require a PDF library
          throw new Error('PDF export not implemented yet');

        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // In a real implementation, you would save this to cloud storage
      // For now, return the file path
      const filePath = `reports/${fileName}`;

      return filePath;

    } catch (error) {
      logger.error('Failed to export report to file:', error);
      throw error;
    }
  }

  /**
   * Get available reporting periods
   */
  static async getAvailablePeriods(): Promise<Array<{
    type: 'monthly' | 'quarterly';
    year: number;
    period: number;
    startDate: Date;
    endDate: Date;
    hasData: boolean;
  }>> {
    try {
      const currentYear = new Date().getFullYear();
      const periods: Array<{
        type: 'monthly' | 'quarterly';
        year: number;
        period: number;
        startDate: Date;
        endDate: Date;
        hasData: boolean;
      }> = [];

      // Generate periods for current and previous year
      for (let year = currentYear - 1; year <= currentYear; year++) {
        // Monthly periods
        for (let month = 1; month <= 12; month++) {
          const startDate = new Date(year, month - 1, 1);
          const endDate = new Date(year, month, 0);

          // Check if there's data for this period
          const hasData = await this.checkPeriodHasData(startDate, endDate);

          if (year < currentYear || month <= new Date().getMonth() + 1) {
            periods.push({
              type: 'monthly',
              year,
              period: month,
              startDate,
              endDate,
              hasData
            });
          }
        }

        // Quarterly periods
        for (let quarter = 1; quarter <= 4; quarter++) {
          const startMonth = (quarter - 1) * 3;
          const startDate = new Date(year, startMonth, 1);
          const endDate = new Date(year, startMonth + 3, 0);

          const hasData = await this.checkPeriodHasData(startDate, endDate);

          if (year < currentYear || quarter <= Math.ceil((new Date().getMonth() + 1) / 3)) {
            periods.push({
              type: 'quarterly',
              year,
              period: quarter,
              startDate,
              endDate,
              hasData
            });
          }
        }
      }

      return periods;

    } catch (error) {
      logger.error('Failed to get available periods:', error);
      return [];
    }
  }

  /**
   * Check if period has data
   */
  private static async checkPeriodHasData(startDate: Date, endDate: Date): Promise<boolean> {
    const { count, error } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .gte('issue_date', startDate.toISOString().split('T')[0])
      .lte('issue_date', endDate.toISOString().split('T')[0]);

    if (error) {
      return false;
    }

    return (count || 0) > 0;
  }
}

/**
 * React hook for tax reporting
 */
export function useTaxReporting() {
  const generateVATRegister = async (
    periodType: 'monthly' | 'quarterly',
    startDate: Date,
    endDate: Date
  ) => {
    return await VATRegisterService.generateVATRegister(periodType, startDate, endDate);
  };

  const generateJPK_FA = async (options: TaxReportOptions) => {
    return await JPKGenerator.generateJPK_FA(options);
  };

  const generateTaxReport = async (options: TaxReportOptions) => {
    return await TaxReportingService.generateTaxReport(options);
  };

  const exportReportToFile = async (report: TaxReportResult, format: 'json' | 'xml' | 'pdf') => {
    return await TaxReportingService.exportReportToFile(report, format);
  };

  const getAvailablePeriods = async () => {
    return await TaxReportingService.getAvailablePeriods();
  };

  const submitVATRegister = async (
    periodType: 'monthly' | 'quarterly',
    startDate: Date,
    endDate: Date
  ) => {
    return await VATRegisterService.submitVATRegister(periodType, startDate, endDate);
  };

  return {
    generateVATRegister,
    generateJPK_FA,
    generateTaxReport,
    exportReportToFile,
    getAvailablePeriods,
    submitVATRegister
  };
}