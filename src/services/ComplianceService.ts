import { supabase } from '@/integrations/supabase/client';

export interface ComplianceRequirement {
  id: string;
  cityId?: string;
  countryCode: string;
  requirementType: 'data_privacy' | 'consumer_rights' | 'health_safety' | 'age_verification' | 'licensing';
  documentUrl?: string;
  consentRequired: boolean;
  ageRestriction?: number;
  mandatoryDisclaimers: string[];
  integrationConfig: {
    cookieConsent?: boolean;
    gdprCompliance?: boolean;
    healthForm?: boolean;
    consentForm?: boolean;
    ageVerification?: boolean;
  };
  isActive: boolean;
}

export interface TaxConfiguration {
  cityId: string;
  vatRate: number;
  serviceTaxRate: number;
  tourismTaxRate: number;
  localTaxRate: number;
  totalTaxRate: number;
  compoundTaxes: boolean;
  applicableServiceTypes: string[];
  exemptionRules: {
    medicalServices: boolean;
    euVatExemption: boolean;
    touristExemption: boolean;
  };
  reportingRequirements: {
    monthly: boolean;
    quarterly: boolean;
    annual: boolean;
  };
}

export interface ComplianceCheck {
  passed: boolean;
  requirements: Array<{
    type: string;
    required: boolean;
    satisfied: boolean;
    details?: string;
  }>;
  actions: Array<{
    type: 'consent' | 'verification' | 'document' | 'disclosure';
    label: string;
    required: boolean;
    completed: boolean;
  }>;
}

class ComplianceService {
  /**
   * Get compliance requirements for a location
   */
  static async getComplianceRequirements(
    cityId?: string,
    countryCode: string = 'PL'
  ): Promise<ComplianceRequirement[]> {
    try {
      let query = supabase
        .from('legal_requirements')
        .select('*')
        .eq('country_code', countryCode)
        .eq('is_active', true);

      if (cityId) {
        query = query.or(`city_id.eq.${cityId},city_id.is.null`);
      } else {
        query = query.is('city_id', null);
      }

      const { data, error } = await query.order('requirement_type');

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error fetching compliance requirements:', error);
      return [];
    }
  }

  /**
   * Get tax configuration for a city
   */
  static async getTaxConfiguration(cityId: string): Promise<TaxConfiguration> {
    try {
      const { data: taxConfigs } = await supabase
        .from('city_tax_config')
        .select('*')
        .eq('city_id', cityId)
        .eq('is_active', true)
        .lte('effective_date', new Date().toISOString().split('T')[0])
        .or('expires_date.is.null,expires_date.gte.' + new Date().toISOString().split('T')[0]);

      const config: TaxConfiguration = {
        cityId,
        vatRate: 0.23, // Default Polish VAT
        serviceTaxRate: 0,
        tourismTaxRate: 0,
        localTaxRate: 0,
        totalTaxRate: 0.23,
        compoundTaxes: false,
        applicableServiceTypes: [],
        exemptionRules: {
          medicalServices: false,
          euVatExemption: false,
          touristExemption: false
        },
        reportingRequirements: {
          monthly: true,
          quarterly: true,
          annual: true
        }
      };

      if (taxConfigs && taxConfigs.length > 0) {
        taxConfigs.forEach(tax => {
          switch (tax.tax_type) {
            case 'vat':
              config.vatRate = tax.tax_rate;
              config.compoundTaxes = tax.is_compound;
              break;
            case 'service_tax':
              config.serviceTaxRate = tax.tax_rate;
              break;
            case 'tourism_tax':
              config.tourismTaxRate = tax.tax_rate;
              break;
            case 'local_tax':
              config.localTaxRate = tax.tax_rate;
              break;
          }

          if (tax.applicable_service_types) {
            config.applicableServiceTypes = [
              ...config.applicableServiceTypes,
              ...tax.applicable_service_types
            ];
          }

          if (tax.exemption_rules) {
            config.exemptionRules = {
              ...config.exemptionRules,
              ...tax.exemption_rules
            };
          }

          if (tax.reporting_requirements) {
            config.reportingRequirements = {
              ...config.reportingRequirements,
              ...tax.reporting_requirements
            };
          }
        });

        // Remove duplicate service types
        config.applicableServiceTypes = [...new Set(config.applicableServiceTypes)];

        // Calculate total tax rate
        if (config.compoundTaxes) {
          // VAT is applied on top of other taxes
          const baseTaxes = config.serviceTaxRate + config.tourismTaxRate + config.localTaxRate;
          config.totalTaxRate = baseTaxes + (baseTaxes * config.vatRate);
        } else {
          // Simple addition
          config.totalTaxRate = config.vatRate + config.serviceTaxRate + config.tourismTaxRate + config.localTaxRate;
        }
      }

      return config;

    } catch (error) {
      console.error('Error getting tax configuration:', error);
      // Return default configuration
      return {
        cityId,
        vatRate: 0.23,
        serviceTaxRate: 0,
        tourismTaxRate: 0,
        localTaxRate: 0,
        totalTaxRate: 0.23,
        compoundTaxes: false,
        applicableServiceTypes: [],
        exemptionRules: {
          medicalServices: false,
          euVatExemption: false,
          touristExemption: false
        },
        reportingRequirements: {
          monthly: true,
          quarterly: true,
          annual: true
        }
      };
    }
  }

  /**
   * Check compliance for a booking
   */
  static async checkBookingCompliance(
    bookingData: {
      serviceId: string;
      serviceType: string;
      locationId: string;
      cityId: string;
      clientInfo: {
        age?: number;
        email?: string;
        phone?: string;
        country?: string;
      };
    },
    consents?: Record<string, boolean>
  ): Promise<ComplianceCheck> {
    try {
      const requirements = await this.getComplianceRequirements(bookingData.cityId);
      const taxConfig = await this.getTaxConfiguration(bookingData.cityId);

      const check: ComplianceCheck = {
        passed: true,
        requirements: [],
        actions: []
      };

      // Check each requirement
      for (const requirement of requirements) {
        let satisfied = true;
        let details = '';

        switch (requirement.requirementType) {
          case 'age_verification':
            if (requirement.ageRestriction && bookingData.clientInfo.age) {
              satisfied = bookingData.clientInfo.age >= requirement.ageRestriction;
              if (!satisfied) {
                details = `Client must be at least ${requirement.ageRestriction} years old`;
              }
            } else if (requirement.ageRestriction) {
              satisfied = false;
              details = 'Age verification required';
            }
            break;

          case 'data_privacy':
            if (requirement.integrationConfig.gdprCompliance) {
              satisfied = consents?.['privacy_policy'] === true;
              details = satisfied ? 'GDPR consent given' : 'Privacy policy consent required';
            }
            break;

          case 'health_safety':
            if (requirement.integrationConfig.healthForm) {
              satisfied = consents?.['health_declaration'] === true;
              details = satisfied ? 'Health declaration completed' : 'Health declaration required';
            }
            break;

          case 'consumer_rights':
            satisfied = consents?.['cancellation_policy'] === true;
            details = satisfied ? 'Consumer rights acknowledged' : 'Policy acknowledgement required';
            break;
        }

        check.requirements.push({
          type: requirement.requirementType,
          required: requirement.consentRequired,
          satisfied,
          details
        });

        if (!satisfied && requirement.consentRequired) {
          check.passed = false;
        }
      }

      // Determine required actions
      for (const requirement of requirements) {
        if (requirement.requirementType === 'data_privacy' && requirement.integrationConfig.cookieConsent) {
          check.actions.push({
            type: 'consent',
            label: 'Accept privacy policy',
            required: true,
            completed: consents?.['privacy_policy'] === true
          });
        }

        if (requirement.requirementType === 'health_safety' && requirement.integrationConfig.consentForm) {
          check.actions.push({
            type: 'document',
            label: 'Complete health declaration',
            required: true,
            completed: consents?.['health_declaration'] === true
          });
        }

        if (requirement.requirementType === 'age_verification' && requirement.ageRestriction) {
          check.actions.push({
            type: 'verification',
            label: 'Verify age requirement',
            required: true,
            completed: bookingData.clientInfo.age ?
              bookingData.clientInfo.age >= requirement.ageRestriction : false
          });
        }
      }

      return check;

    } catch (error) {
      console.error('Error checking booking compliance:', error);
      return {
        passed: false,
        requirements: [],
        actions: []
      };
    }
  }

  /**
   * Generate compliance documents
   */
  static async generateComplianceDocuments(
    type: 'privacy_policy' | 'terms_of_service' | 'cancellation_policy' | 'health_safety',
    cityId?: string,
    language: string = 'en'
  ): Promise<string> {
    try {
      // Get template for the document type
      const { data: template } = await supabase
        .from('document_templates')
        .select('content')
        .eq('type', type)
        .eq('language', language)
        .single();

      // Get location-specific requirements
      const requirements = await this.getComplianceRequirements(cityId);

      // Customize template based on requirements
      let content = template?.content || '';

      requirements.forEach(req => {
        if (req.requirementType === 'data_privacy' && type === 'privacy_policy') {
          content += '\n\n' + req.mandatoryDisclaimers.join('\n');
        }
        if (req.requirementType === 'consumer_rights' && type === 'cancellation_policy') {
          content += '\n\n' + req.mandatoryDisclaimers.join('\n');
        }
      });

      return content;

    } catch (error) {
      console.error('Error generating compliance document:', error);
      return '';
    }
  }

  /**
   * Log compliance event
   */
  static async logComplianceEvent(
    type: 'consent_given' | 'age_verified' | 'document_signed' | 'policy_accepted',
    details: {
      userId?: string;
      bookingId?: string;
      cityId?: string;
      documentType?: string;
      ipAddress?: string;
      timestamp?: Date;
    }
  ): Promise<void> {
    try {
      await supabase
        .from('compliance_logs')
        .insert({
          event_type: type,
          user_id: details.userId,
          booking_id: details.bookingId,
          city_id: details.cityId,
          document_type: details.documentType,
          ip_address: details.ipAddress,
          event_data: details,
          created_at: details.timestamp || new Date().toISOString()
        });

    } catch (error) {
      console.error('Error logging compliance event:', error);
    }
  }

  /**
   * Get tax invoice details
   */
  static async generateTaxInvoiceData(
    bookingId: string,
    cityId: string
  ): Promise<{
    invoiceNumber: string;
    taxDetails: Array<{
      type: string;
      rate: number;
      amount: number;
    }>;
    totalTax: number;
    currency: string;
  }> {
    try {
      const taxConfig = await this.getTaxConfiguration(cityId);

      // Get booking details
      const { data: booking } = await supabase
        .from('bookings')
        .select('amount_paid, currency')
        .eq('id', bookingId)
        .single();

      if (!booking) {
        throw new Error('Booking not found');
      }

      const baseAmount = booking.amount_paid || 0;
      const taxDetails = [];

      // Calculate each tax
      if (taxConfig.serviceTaxRate > 0) {
        taxDetails.push({
          type: 'Service Tax',
          rate: taxConfig.serviceTaxRate,
          amount: baseAmount * taxConfig.serviceTaxRate
        });
      }

      if (taxConfig.tourismTaxRate > 0) {
        taxDetails.push({
          type: 'Tourism Tax',
          rate: taxConfig.tourismTaxRate,
          amount: baseAmount * taxConfig.tourismTaxRate
        });
      }

      if (taxConfig.localTaxRate > 0) {
        taxDetails.push({
          type: 'Local Tax',
          rate: taxConfig.localTaxRate,
          amount: baseAmount * taxConfig.localTaxRate
        });
      }

      // Calculate VAT (may be compound)
      const taxableAmount = taxConfig.compoundTaxes
        ? baseAmount + taxDetails.reduce((sum, tax) => sum + tax.amount, 0)
        : baseAmount;

      if (taxConfig.vatRate > 0) {
        taxDetails.push({
          type: 'VAT',
          rate: taxConfig.vatRate,
          amount: taxableAmount * taxConfig.vatRate
        });
      }

      const totalTax = taxDetails.reduce((sum, tax) => sum + tax.amount, 0);

      return {
        invoiceNumber: `INV-${Date.now()}-${bookingId.slice(-6)}`,
        taxDetails,
        totalTax,
        currency: booking.currency
      };

    } catch (error) {
      console.error('Error generating tax invoice data:', error);
      throw error;
    }
  }

  /**
   * Check if service is tax exempt
   */
  static isServiceTaxExempt(
    serviceType: string,
    clientCountry: string,
    taxConfig: TaxConfiguration
  ): boolean {
    // Medical services exemption
    if (taxConfig.exemptionRules.medicalServices &&
        ['medical', 'therapeutic', 'rehabilitation'].includes(serviceType.toLowerCase())) {
      return true;
    }

    // EU VAT exemption for foreign clients
    if (taxConfig.exemptionRules.euVatExemption &&
        clientCountry !== 'PL' &&
        clientCountry !== '') {
      return true;
    }

    // Tourist exemption
    if (taxConfig.exemptionRules.touristExemption &&
        clientCountry !== 'PL') {
      return true;
    }

    return false;
  }

  /**
   * Update compliance requirement
   */
  static async updateComplianceRequirement(
    requirement: Omit<ComplianceRequirement, 'id'>
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('legal_requirements')
        .upsert({
          city_id: requirement.cityId,
          country_code: requirement.countryCode,
          requirement_type: requirement.requirementType,
          document_url: requirement.documentUrl,
          consent_required: requirement.consentRequired,
          age_restriction: requirement.ageRestriction,
          mandatory_disclaimers: requirement.mandatoryDisclaimers,
          integration_config: requirement.integrationConfig,
          is_active: requirement.isActive
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;

    } catch (error) {
      console.error('Error updating compliance requirement:', error);
      throw error;
    }
  }

  /**
   * Get compliance dashboard data
   */
  static async getComplianceDashboard(cityId?: string) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get compliance logs
      const { data: logs } = await supabase
        .from('compliance_logs')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .eq(cityId ? 'city_id' : 'city_id', cityId || '');

      // Get active requirements
      const requirements = await this.getComplianceRequirements(cityId);

      // Get tax configuration
      const taxConfig = await this.getTaxConfiguration(cityId || '');

      return {
        summary: {
          totalLogs: logs?.length || 0,
          consentGiven: logs?.filter(l => l.event_type === 'consent_given').length || 0,
          documentsSigned: logs?.filter(l => l.event_type === 'document_signed').length || 0,
          ageVerifications: logs?.filter(l => l.event_type === 'age_verified').length || 0
        },
        requirements: {
          total: requirements.length,
          withConsent: requirements.filter(r => r.consentRequired).length,
          withAgeRestriction: requirements.filter(r => r.ageRestriction).length
        },
        taxConfig,
        recentLogs: logs?.slice(0, 10) || []
      };

    } catch (error) {
      console.error('Error getting compliance dashboard:', error);
      return null;
    }
  }
}

export default ComplianceService;