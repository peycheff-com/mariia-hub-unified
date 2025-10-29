// VAT Calculation Engine for Polish Tax System
// Implements comprehensive VAT calculation for different service categories and customer types

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export type VATRate = '23' | '8' | '5' | '0' | 'zw' | 'np';
export type CustomerType = 'person' | 'company_polish' | 'company_eu' | 'company_non_eu';
export type ServiceType = 'beauty' | 'fitness' | 'lifestyle';

export interface VATCalculationRequest {
  amount: number;
  serviceType: ServiceType;
  serviceCategory: string;
  customerType: CustomerType;
  customerCountry?: string;
  isReverseCharge?: boolean;
  isExempt?: boolean;
  exemptionReason?: string;
}

export interface VATCalculationResult {
  netAmount: number;
  vatRate: VATRate;
  vatAmount: number;
  grossAmount: number;
  vatRatePercentage: number;
  isReverseCharge: boolean;
  isExempt: boolean;
  legalBasis?: string;
  notes?: string[];
}

export interface VATConfiguration {
  serviceType: ServiceType;
  serviceCategory: string;
  defaultRate: VATRate;
  conditions: {
    rate_23: VATCondition[];
    rate_8: VATCondition[];
    rate_5: VATCondition[];
    rate_0: VATCondition[];
    exempt: VATCondition[];
  };
  legalBasis: string;
  validFrom: string;
  validUntil?: string;
}

export interface VATCondition {
  customerType?: CustomerType[];
  customerCountry?: string[];
  minAmount?: number;
  maxAmount?: number;
  specialConditions?: string[];
  description: string;
}

/**
 * VAT Rate Configuration Service
 * Manages VAT rules and conditions for different services
 */
export class VATConfigurationService {
  private static cache = new Map<string, VATConfiguration>();
  private static cacheExpiry = new Map<string, number>();
  private static readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  /**
   * Get VAT configuration for a service
   */
  static async getVATConfiguration(
    serviceType: ServiceType,
    serviceCategory: string
  ): Promise<VATConfiguration | null> {
    const cacheKey = `${serviceType}-${serviceCategory}`;

    // Check cache first
    const cached = this.getCachedConfiguration(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const { data, error } = await supabase
        .from('vat_rate_configurations')
        .select('*')
        .eq('service_type', serviceType)
        .eq('service_category', serviceCategory)
        .lte('valid_from', new Date().toISOString().split('T')[0])
        .or('valid_until.is.null,valid_until.gte.' + new Date().toISOString().split('T')[0])
        .order('valid_from', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        logger.warn('No VAT configuration found for', { serviceType, serviceCategory });
        return null;
      }

      const configuration: VATConfiguration = {
        serviceType: data.service_type,
        serviceCategory: data.service_category,
        defaultRate: data.default_vat_rate,
        conditions: {
          rate_23: data.conditions_23 || [],
          rate_8: data.conditions_8 || [],
          rate_5: data.conditions_5 || [],
          rate_0: data.conditions_0 || [],
          exempt: data.conditions_exempt || []
        },
        legalBasis: data.legal_basis,
        validFrom: data.valid_from,
        validUntil: data.valid_until
      };

      // Cache the result
      this.cacheConfiguration(cacheKey, configuration);

      return configuration;
    } catch (error) {
      logger.error('Failed to load VAT configuration:', error);
      return null;
    }
  }

  /**
   * Get all VAT configurations
   */
  static async getAllVATConfigurations(): Promise<VATConfiguration[]> {
    try {
      const { data, error } = await supabase
        .from('vat_rate_configurations')
        .select('*')
        .lte('valid_from', new Date().toISOString().split('T')[0])
        .or('valid_until.is.null,valid_until.gte.' + new Date().toISOString().split('T')[0]);

      if (error || !data) {
        return [];
      }

      return data.map(item => ({
        serviceType: item.service_type,
        serviceCategory: item.service_category,
        defaultRate: item.default_vat_rate,
        conditions: {
          rate_23: item.conditions_23 || [],
          rate_8: item.conditions_8 || [],
          rate_5: item.conditions_5 || [],
          rate_0: item.conditions_0 || [],
          exempt: item.conditions_exempt || []
        },
        legalBasis: item.legal_basis,
        validFrom: item.valid_from,
        validUntil: item.valid_until
      }));
    } catch (error) {
      logger.error('Failed to load VAT configurations:', error);
      return [];
    }
  }

  /**
   * Update VAT configuration
   */
  static async updateVATConfiguration(
    config: Partial<VATConfiguration>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('vat_rate_configurations')
        .upsert({
          service_type: config.serviceType,
          service_category: config.serviceCategory,
          default_vat_rate: config.defaultRate,
          conditions_23: config.conditions?.rate_23 || [],
          conditions_8: config.conditions?.rate_8 || [],
          conditions_5: config.conditions?.rate_5 || [],
          conditions_0: config.conditions?.rate_0 || [],
          conditions_exempt: config.conditions?.exempt || [],
          legal_basis: config.legalBasis,
          valid_from: config.validFrom,
          valid_until: config.validUntil
        });

      if (error) {
        logger.error('Failed to update VAT configuration:', error);
        return false;
      }

      // Clear cache
      this.clearCache();

      return true;
    } catch (error) {
      logger.error('Failed to update VAT configuration:', error);
      return false;
    }
  }

  private static getCachedConfiguration(key: string): VATConfiguration | null {
    const cached = this.cache.get(key);
    const expiry = this.cacheExpiry.get(key);

    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }

    return null;
  }

  private static cacheConfiguration(key: string, config: VATConfiguration): void {
    this.cache.set(key, config);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  private static clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}

/**
 * VAT Calculation Engine
 * Main service for calculating VAT amounts
 */
export class VATCalculator {
  /**
   * Calculate VAT for a transaction
   */
  static async calculateVAT(request: VATCalculationRequest): Promise<VATCalculationResult> {
    try {
      // Step 1: Get VAT configuration
      const config = await VATConfigurationService.getVATConfiguration(
        request.serviceType,
        request.serviceCategory
      );

      // Step 2: Determine applicable VAT rate
      const vatRate = this.determineVATRate(request, config);

      // Step 3: Calculate amounts
      const vatAmount = this.calculateVATAmount(request.amount, vatRate);
      const grossAmount = request.amount + vatAmount;

      // Step 4: Determine legal basis and notes
      const { legalBasis, notes } = this.getLegalBasisAndNotes(
        request,
        vatRate,
        config
      );

      return {
        netAmount: request.amount,
        vatRate,
        vatAmount,
        grossAmount,
        vatRatePercentage: this.getVATRatePercentage(vatRate),
        isReverseCharge: request.isReverseCharge || this.isReverseChargeApplicable(request),
        isExempt: request.isExempt || this.isExemptApplicable(vatRate),
        legalBasis,
        notes
      };
    } catch (error) {
      logger.error('VAT calculation failed:', error);

      // Fallback to standard 23% rate
      return this.fallbackCalculation(request);
    }
  }

  /**
   * Determine applicable VAT rate based on conditions
   */
  private static determineVATRate(
    request: VATCalculationRequest,
    config: VATConfiguration | null
  ): VATRate {
    // Check for explicit exemption
    if (request.isExempt) {
      return 'zw';
    }

    // Check for reverse charge
    if (request.isReverseCharge || this.isReverseChargeApplicable(request)) {
      return 'np';
    }

    // If no configuration, use default rates
    if (!config) {
      return this.getDefaultVATRate(request);
    }

    // Check conditions for each rate
    const conditions = [
      { rate: '0' as VATRate, list: config.conditions.rate_0 },
      { rate: '5' as VATRate, list: config.conditions.rate_5 },
      { rate: '8' as VATRate, list: config.conditions.rate_8 },
      { rate: '23' as VATRate, list: config.conditions.rate_23 },
      { rate: 'zw' as VATRate, list: config.conditions.exempt }
    ];

    for (const { rate, list } of conditions) {
      if (this.matchesConditions(request, list)) {
        return rate;
      }
    }

    return config.defaultRate;
  }

  /**
   * Check if transaction matches any conditions
   */
  private static matchesConditions(
    request: VATCalculationRequest,
    conditions: VATCondition[]
  ): boolean {
    return conditions.some(condition => {
      // Check customer type
      if (condition.customerType && !condition.customerType.includes(request.customerType)) {
        return false;
      }

      // Check customer country
      if (condition.customerCountry &&
          (!request.customerCountry || !condition.customerCountry.includes(request.customerCountry))) {
        return false;
      }

      // Check amount range
      if (condition.minAmount && request.amount < condition.minAmount) {
        return false;
      }

      if (condition.maxAmount && request.amount > condition.maxAmount) {
        return false;
      }

      // Check special conditions (would need to be implemented based on business rules)
      if (condition.specialConditions && condition.specialConditions.length > 0) {
        // Implement special condition checking logic here
      }

      return true;
    });
  }

  /**
   * Get default VAT rate based on service and customer type
   */
  private static getDefaultVATRate(request: VATCalculationRequest): VATRate {
    // EU B2B - reverse charge
    if (request.customerType === 'company_eu' || request.customerType === 'company_non_eu') {
      return 'np';
    }

    // Default to 23% for all other cases
    return '23';
  }

  /**
   * Check if reverse charge mechanism applies
   */
  private static isReverseChargeApplicable(request: VATCalculationRequest): boolean {
    // EU companies - reverse charge applies
    if (request.customerType === 'company_eu' || request.customerType === 'company_non_eu') {
      return true;
    }

    // Special services that may qualify for reverse charge
    const reverseChargeServices = [
      'consulting',
      'legal_services',
      'marketing_services'
    ];

    return reverseChargeServices.some(service =>
      request.serviceCategory.toLowerCase().includes(service)
    );
  }

  /**
   * Check if exemption applies
   */
  private static isExemptApplicable(vatRate: VATRate): boolean {
    return vatRate === 'zw' || vatRate === 'np';
  }

  /**
   * Calculate VAT amount
   */
  private static calculateVATAmount(netAmount: number, vatRate: VATRate): number {
    const rate = this.getVATRatePercentage(vatRate);
    return Math.round(netAmount * rate * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get VAT rate as percentage
   */
  private static getVATRatePercentage(vatRate: VATRate): number {
    switch (vatRate) {
      case '23': return 0.23;
      case '8': return 0.08;
      case '5': return 0.05;
      case '0': return 0.0;
      case 'zw': return 0.0;
      case 'np': return 0.0;
      default: return 0.23;
    }
  }

  /**
   * Get legal basis and notes for the transaction
   */
  private static getLegalBasisAndNotes(
    request: VATCalculationRequest,
    vatRate: VATRate,
    config: VATConfiguration | null
  ): { legalBasis?: string; notes: string[] } {
    const notes: string[] = [];

    let legalBasis = config?.legalBasis || 'Art. 41 ust. 1 Ustawy o VAT';

    switch (vatRate) {
      case '0':
        if (this.isReverseChargeApplicable(request)) {
          legalBasis = 'Art. 17 ust. 1 pkt 8 Ustawy o VAT';
          notes.push('Odwrotne obciążenie - podatnik jest obowiązany do samobieżnego obliczenia i zapłaty podatku');
        } else {
          legalBasis = 'Art. 43 ust. 1 Ustawy o VAT';
          notes.push('Stawka 0% - Towary/usługi objęte preferencyjną stawką VAT');
        }
        break;

      case '8':
        legalBasis = 'Art. 41 ust. 2 Ustawie o VAT';
        notes.push('Stawka 8% - Preferencyjna stawka VAT dla niektórych towarów i usług');
        break;

      case '5':
        legalBasis = 'Art. 41 ust. 2a Ustawy o VAT';
        notes.push('Stawka 5% - Preferencyjna stawka VAT dla wybranych towarów i usług');
        break;

      case 'zw':
        legalBasis = 'Art. 43 ust. 1 Ustawy o VAT';
        notes.push('Zwolnienie z VAT - Usługa zwolniona od podatku');
        break;

      case 'np':
        legalBasis = 'Art. 5 ust. 1 pkt 2 Ustawy o VAT';
        notes.push('Nie podlega opodatkowaniu VAT - Poza zakresem podatku');
        break;
    }

    // Add EU specific notes
    if (request.customerType === 'company_eu') {
      notes.push('Transakcja wewnątrzwspólnotowa - WDT/WNT');
      notes.push('Numer VAT UE kontrahenta wymagany');
    }

    return { legalBasis, notes };
  }

  /**
   * Fallback calculation if main calculation fails
   */
  private static fallbackCalculation(request: VATCalculationRequest): VATCalculationResult {
    const vatRate = this.getDefaultVATRate(request);
    const vatAmount = this.calculateVATAmount(request.amount, vatRate);
    const grossAmount = request.amount + vatAmount;

    return {
      netAmount: request.amount,
      vatRate,
      vatAmount,
      grossAmount,
      vatRatePercentage: this.getVATRatePercentage(vatRate),
      isReverseCharge: this.isReverseChargeApplicable(request),
      isExempt: false,
      legalBasis: 'Art. 41 ust. 1 Ustawy o VAT',
      notes: ['Wyliczenie standardowe - wystąpił błąd podczas obliczania']
    };
  }

  /**
   * Calculate VAT for multiple items
   */
  static async calculateVATForItems(
    items: Array<{
      amount: number;
      serviceType: ServiceType;
      serviceCategory: string;
    }>,
    customerType: CustomerType,
    customerCountry?: string
  ): Promise<Array<VATCalculationResult & { itemId: string }>> {
    const results = await Promise.all(
      items.map(async (item, index) => {
        const result = await this.calculateVAT({
          amount: item.amount,
          serviceType: item.serviceType,
          serviceCategory: item.serviceCategory,
          customerType,
          customerCountry
        });

        return {
          ...result,
          itemId: `item_${index}`
        };
      })
    );

    return results;
  }

  /**
   * Calculate VAT reverse charge details
   */
  static calculateReverseChargeDetails(
    netAmount: number,
    customerType: CustomerType,
    customerCountry?: string
  ): {
    domesticVAT: VATCalculationResult;
    reverseCharge: {
      domesticVAT: number;
      foreignVAT: number;
      totalTax: number;
    };
  } {
    const domesticVAT = this.calculateVATAmount(netAmount, '23');

    return {
      domesticVAT: {
        netAmount,
        vatRate: '23',
        vatAmount: domesticVAT,
        grossAmount: netAmount + domesticVAT,
        vatRatePercentage: 0.23,
        isReverseCharge: true,
        isExempt: false,
        legalBasis: 'Art. 17 ust. 1 pkt 8 Ustawy o VAT',
        notes: ['Odwrotne obciążenie']
      },
      reverseCharge: {
        domesticVAT,
        foreignVAT: domesticVAT, // Same amount, calculated by customer
        totalTax: domesticVAT
      }
    };
  }
}

/**
 * React hook for VAT calculation
 */
export function useVATCalculator() {
  const calculateVAT = async (request: VATCalculationRequest) => {
    return await VATCalculator.calculateVAT(request);
  };

  const calculateVATForItems = async (
    items: Array<{
      amount: number;
      serviceType: ServiceType;
      serviceCategory: string;
    }>,
    customerType: CustomerType,
    customerCountry?: string
  ) => {
    return await VATCalculator.calculateVATForItems(items, customerType, customerCountry);
  };

  const getVATConfiguration = async (serviceType: ServiceType, serviceCategory: string) => {
    return await VATConfigurationService.getVATConfiguration(serviceType, serviceCategory);
  };

  return {
    calculateVAT,
    calculateVATForItems,
    getVATConfiguration
  };
}

/**
 * Utility functions for VAT calculations
 */
export const VATUtils = {
  /**
   * Format VAT amount for display
   */
  formatVATAmount(amount: number, currency: string = 'PLN'): string {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    }).format(amount);
  },

  /**
   * Format VAT rate for display
   */
  formatVATRate(rate: VATRate): string {
    switch (rate) {
      case '23': return '23%';
      case '8': return '8%';
      case '5': return '5%';
      case '0': return '0%';
      case 'zw': return 'zw.';
      case 'np': return 'np.';
      default: return `${rate}%`;
    }
  },

  /**
   * Get all available VAT rates
   */
  getAvailableVATRates(): Array<{ value: VATRate; label: string; description: string }> {
    return [
      {
        value: '23',
        label: '23%',
        description: 'Podstawowa stawka VAT'
      },
      {
        value: '8',
        label: '8%',
        description: 'Obniżona stawka VAT (książki, restauracje)'
      },
      {
        value: '5',
        label: '5%',
        description: 'Obniżona stawka VAT (niektóre produkty żywnościowe)'
      },
      {
        value: '0',
        label: '0%',
        description: 'Stawka 0% (eksport, WNT)'
      },
      {
        value: 'zw',
        label: 'zw.',
        description: 'Zwolnienie z VAT'
      },
      {
        value: 'np',
        label: 'np.',
        description: 'Nie podlega opodatkowaniu'
      }
    ];
  },

  /**
   * Validate VAT calculation result
   */
  validateVATCalculation(result: VATCalculationResult): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (result.netAmount < 0) {
      errors.push('Kwota netto nie może być ujemna');
    }

    if (result.vatAmount < 0) {
      errors.push('Kwota VAT nie może być ujemna');
    }

    if (result.grossAmount < result.netAmount) {
      errors.push('Kwota brutto nie może być mniejsza od kwoty netto');
    }

    const expectedGross = result.netAmount + result.vatAmount;
    if (Math.abs(result.grossAmount - expectedGross) > 0.01) {
      errors.push('Nieprawidłowe wyliczenie kwoty brutto');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Round VAT amount according to Polish regulations
   */
  roundVATAmount(amount: number): number {
    return Math.round(amount * 100) / 100;
  },

  /**
   * Check if service qualifies for reduced VAT rate
   */
  qualifiesForReducedRate(serviceCategory: string): boolean {
    const reducedRateCategories = [
      'books',
      'restaurant_services',
      'catering',
      'accommodation',
      'transport',
      'newspapers',
      'medical_services'
    ];

    return reducedRateCategories.some(category =>
      serviceCategory.toLowerCase().includes(category)
    );
  }
};