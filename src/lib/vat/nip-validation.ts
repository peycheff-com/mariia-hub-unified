// NIP (Polish VAT Number) Validation System
// Implements checksum validation and API verification for Polish VAT numbers

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface NIPValidationResult {
  isValid: boolean;
  nipNumber: string;
  companyName?: string;
  registrationDate?: string;
  status?: string;
  validationSource: 'checksum' | 'api' | 'cache';
  validatedAt: string;
  error?: string;
}

export interface CompanyValidationData {
  nip: string;
  companyName?: string;
  registrationDate?: string;
  status?: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

/**
 * Polish NIP checksum validation
 * Based on official algorithm from Ministry of Finance
 */
export class NIPChecksumValidator {
  private static readonly weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];

  /**
   * Validate NIP format and checksum
   */
  static validate(nip: string): boolean {
    const cleanNip = this.cleanNIP(nip);

    // Check format
    if (!this.isValidFormat(cleanNip)) {
      return false;
    }

    // Calculate checksum
    return this.calculateChecksum(cleanNip) === parseInt(cleanNip[9]);
  }

  /**
   * Clean NIP string - remove hyphens and spaces
   */
  static cleanNIP(nip: string): string {
    return nip.replace(/[-\s]/g, '');
  }

  /**
   * Check if NIP has valid format (10 digits)
   */
  static isValidFormat(nip: string): boolean {
    return /^\d{10}$/.test(nip);
  }

  /**
   * Calculate NIP checksum
   */
  private static calculateChecksum(nip: string): number {
    let sum = 0;

    for (let i = 0; i < 9; i++) {
      sum += parseInt(nip[i]) * this.weights[i];
    }

    const checksum = sum % 11;

    // Special case: if remainder is 10, checksum is 0
    return checksum === 10 ? 0 : checksum;
  }

  /**
   * Format NIP with standard formatting (XXX-XXX-XX-XX)
   */
  static formatNIP(nip: string): string {
    const cleanNip = this.cleanNIP(nip);
    if (!this.isValidFormat(cleanNip)) {
      return nip;
    }

    return `${cleanNip.slice(0, 3)}-${cleanNip.slice(3, 6)}-${cleanNip.slice(6, 8)}-${cleanNip.slice(8, 10)}`;
  }
}

/**
 * VAT-ON API integration for real-time NIP verification
 * Uses Polish Ministry of Finance VAT verification service
 */
export class VATAPIService {
  private static readonly API_BASE_URL = 'https://wl-test.mf.gov.pl/api';
  private static readonly PRODUCTION_API_URL = 'https://api.gov.pl/wl/api';

  /**
   * Verify NIP using VAT-ON API
   * Note: This is a mock implementation. In production, you'd need to:
   * 1. Register for API access at Ministry of Finance
   * 2. Handle API authentication
   * 3. Implement proper error handling and rate limiting
   */
  static async verifyNIPWithAPI(nip: string): Promise<NIPValidationResult> {
    const cleanNip = NIPChecksumValidator.cleanNIP(nip);

    try {
      // First validate with checksum
      if (!NIPChecksumValidator.validate(cleanNip)) {
        return {
          isValid: false,
          nipNumber: cleanNip,
          validationSource: 'checksum',
          validatedAt: new Date().toISOString(),
          error: 'Invalid NIP format or checksum'
        };
      }

      // Mock API call - replace with actual API implementation
      // const response = await this.makeAPICall(cleanNip);

      // For now, return a mock result
      const mockResult = await this.mockAPIResponse(cleanNip);

      return {
        isValid: mockResult.isValid,
        nipNumber: cleanNip,
        companyName: mockResult.companyName,
        registrationDate: mockResult.registrationDate,
        status: mockResult.status,
        validationSource: 'api',
        validatedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('NIP API verification failed:', error);

      return {
        isValid: false,
        nipNumber: cleanNip,
        validationSource: 'api',
        validatedAt: new Date().toISOString(),
        error: 'API verification failed'
      };
    }
  }

  /**
   * Make actual API call to VAT-ON service
   * This is a placeholder - implement based on official API documentation
   */
  private static async makeAPICall(nip: string): Promise<any> {
    // Implementation would go here
    // You would need to:
    // 1. Get API token from Ministry of Finance
    // 2. Make proper HTTP request with authentication
    // 3. Handle response format according to API documentation

    const response = await fetch(`${this.API_BASE_URL}/search/nip/${nip}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        // Add authentication headers here
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Mock API response for testing
   */
  private static async mockAPIResponse(nip: string): Promise<{
    isValid: boolean;
    companyName?: string;
    registrationDate?: string;
    status?: string;
  }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock some known valid NIPs for testing
    const knownCompanies: Record<string, any> = {
      '1234567890': {
        isValid: true,
        companyName: 'Test Company Sp. z o.o.',
        registrationDate: '2020-01-15',
        status: 'Czynny podatnik VAT'
      },
      '9876543210': {
        isValid: true,
        companyName: 'Example Business Ltd.',
        registrationDate: '2019-03-22',
        status: 'Czynny podatnik VAT'
      }
    };

    return knownCompanies[nip] || {
      isValid: Math.random() > 0.3, // 70% chance of being valid for unknown NIPs
      companyName: `Company ${nip}`,
      registrationDate: '2021-06-10',
      status: 'Czynny podatnik VAT'
    };
  }
}

/**
 * NIP Validation Service with caching
 * Combines checksum validation, API verification, and database caching
 */
export class NIPValidationService {
  /**
   * Validate NIP with comprehensive checking
   */
  static async validateNIP(nip: string, useAPI: boolean = false): Promise<NIPValidationResult> {
    const cleanNip = NIPChecksumValidator.cleanNIP(nip);

    // Step 1: Check cache first
    const cachedResult = await this.getCachedValidation(cleanNip);
    if (cachedResult && !this.isCacheExpired(cachedResult.validatedAt)) {
      return cachedResult;
    }

    // Step 2: Checksum validation (always performed)
    if (!NIPChecksumValidator.validate(cleanNip)) {
      const result: NIPValidationResult = {
        isValid: false,
        nipNumber: cleanNip,
        validationSource: 'checksum',
        validatedAt: new Date().toISOString(),
        error: 'Invalid NIP format or checksum'
      };

      // Cache invalid result for shorter time
      await this.cacheValidationResult(result, 1); // 1 hour
      return result;
    }

    // Step 3: API verification (if requested)
    if (useAPI) {
      try {
        const apiResult = await VATAPIService.verifyNIPWithAPI(cleanNip);

        // Cache API result for longer
        await this.cacheValidationResult(apiResult, 24); // 24 hours
        return apiResult;
      } catch (error) {
        logger.error('API verification failed, falling back to checksum:', error);
      }
    }

    // Step 4: Return checksum validation result
    const result: NIPValidationResult = {
      isValid: true,
      nipNumber: cleanNip,
      validationSource: 'checksum',
      validatedAt: new Date().toISOString()
    };

    // Cache basic validation
    await this.cacheValidationResult(result, 6); // 6 hours
    return result;
  }

  /**
   * Get cached validation result
   */
  private static async getCachedValidation(nip: string): Promise<NIPValidationResult | null> {
    try {
      const { data, error } = await supabase
        .from('nip_validations')
        .select('*')
        .eq('nip_number', nip)
        .eq('is_valid', true)
        .gte('expires_at', new Date().toISOString())
        .order('validated_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        isValid: data.is_valid,
        nipNumber: data.nip_number,
        companyName: data.company_name || undefined,
        registrationDate: data.registration_date || undefined,
        status: data.status || undefined,
        validationSource: data.validation_source as 'checksum' | 'api' | 'cache',
        validatedAt: data.validated_at
      };
    } catch (error) {
      logger.error('Failed to get cached NIP validation:', error);
      return null;
    }
  }

  /**
   * Cache validation result
   */
  private static async cacheValidationResult(
    result: NIPValidationResult,
    hoursToCache: number
  ): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + hoursToCache);

      const { error } = await supabase
        .from('nip_validations')
        .upsert({
          nip_number: result.nipNumber,
          is_valid: result.isValid,
          company_name: result.companyName,
          registration_date: result.registrationDate,
          status: result.status,
          validation_source: result.validationSource,
          validated_at: result.validatedAt,
          expires_at: expiresAt.toISOString()
        }, {
          onConflict: 'nip_number'
        });

      if (error) {
        logger.error('Failed to cache NIP validation:', error);
      }
    } catch (error) {
      logger.error('Failed to cache NIP validation:', error);
    }
  }

  /**
   * Check if cache entry is expired
   */
  private static isCacheExpired(validatedAt: string): boolean {
    const cachedTime = new Date(validatedAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - cachedTime.getTime()) / (1000 * 60 * 60);

    return hoursDiff > 24; // 24 hours cache expiry
  }

  /**
   * Batch validate multiple NIPs
   */
  static async validateMultipleNIPs(
    nips: string[],
    useAPI: boolean = false
  ): Promise<NIPValidationResult[]> {
    const results = await Promise.allSettled(
      nips.map(nip => this.validateNIP(nip, useAPI))
    );

    return results
      .filter((result): result is PromiseFulfilledResult<NIPValidationResult> =>
        result.status === 'fulfilled'
      )
      .map(result => result.value);
  }

  /**
   * Validate and format NIP for display
   */
  static async validateAndFormatNIP(nip: string): Promise<{
    formattedNIP: string;
    validation: NIPValidationResult;
  }> {
    const validation = await this.validateNIP(nip);
    const formattedNIP = NIPChecksumValidator.formatNIP(nip);

    return {
      formattedNIP,
      validation
    };
  }
}

/**
 * React hook for NIP validation
 */
export function useNIPValidation() {
  const validateNIP = async (nip: string, useAPI: boolean = false) => {
    return await NIPValidationService.validateNIP(nip, useAPI);
  };

  const validateAndFormatNIP = async (nip: string) => {
    return await NIPValidationService.validateAndFormatNIP(nip);
  };

  const validateMultipleNIPs = async (nips: string[], useAPI: boolean = false) => {
    return await NIPValidationService.validateMultipleNIPs(nips, useAPI);
  };

  const formatNIP = (nip: string) => {
    return NIPChecksumValidator.formatNIP(nip);
  };

  const isValidFormat = (nip: string) => {
    return NIPChecksumValidator.isValidFormat(NIPChecksumValidator.cleanNIP(nip));
  };

  return {
    validateNIP,
    validateAndFormatNIP,
    validateMultipleNIPs,
    formatNIP,
    isValidFormat
  };
}

/**
 * Utility functions for NIP handling
 */
export const NIPUtils = {
  /**
   * Extract NIP from text using regex
   */
  extractNIPFromText(text: string): string | null {
    const nipRegex = /\b\d{3}-\d{3}-\d{2}-\d{2}\b|\b\d{10}\b/g;
    const match = text.match(nipRegex);

    if (match) {
      const cleanNip = NIPChecksumValidator.cleanNIP(match[0]);
      return NIPChecksumValidator.isValidFormat(cleanNip) ? cleanNip : null;
    }

    return null;
  },

  /**
   * Generate NIP mask for input fields
   */
  generateNIPMask(): string {
    return '999-999-99-99';
  },

  /**
   * Check if NIP is a test number (shouldn't be used in production)
   */
  isTestNIP(nip: string): boolean {
    const cleanNip = NIPChecksumValidator.cleanNIP(nip);
    const testNIPs = [
      '1234567890',
      '1111111111',
      '2222222222',
      '3333333333',
      '4444444444',
      '5555555555',
      '6666666666',
      '7777777777',
      '8888888888',
      '9999999999'
    ];

    return testNIPs.includes(cleanNip);
  },

  /**
   * Validate NIP and provide helpful error messages
   */
  validateNIPWithMessage(nip: string): {
    isValid: boolean;
    message: string;
  } {
    const cleanNip = NIPChecksumValidator.cleanNIP(nip);

    if (!cleanNip) {
      return {
        isValid: false,
        message: 'NIP jest wymagany'
      };
    }

    if (!NIPChecksumValidator.isValidFormat(cleanNip)) {
      return {
        isValid: false,
        message: 'NIP musi składać się z 10 cyfr'
      };
    }

    if (NIPUtils.isTestNIP(cleanNip)) {
      return {
        isValid: false,
        message: 'Podany NIP jest numerem testowym'
      };
    }

    if (!NIPChecksumValidator.validate(cleanNip)) {
      return {
        isValid: false,
        message: 'Podany NIP ma niepoprawną sumę kontrolną'
      };
    }

    return {
      isValid: true,
      message: 'NIP jest poprawny'
    };
  }
};