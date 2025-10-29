import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface RegionalPricing {
  id: string;
  serviceId: string;
  cityId?: string;
  locationId?: string;
  basePrice: number;
  currency: string;
  taxRate: number;
  validFrom: Date;
  validUntil?: Date;
  priceAdjustments: {
    weekendSurcharge?: number;
    eveningSurcharge?: number;
    holidaySurcharge?: number;
    seasonalMultiplier?: number;
    [key: string]: number | undefined;
  };
  isActive: boolean;
}

export interface PriceCalculationParams {
  serviceId: string;
  locationId: string;
  cityId?: string;
  date?: Date;
  time?: string;
  addOns?: Array<{
    id: string;
    quantity: number;
  }>;
  promoCode?: string;
}

export interface PriceCalculationResult {
  basePrice: number;
  adjustments: Array<{
    type: string;
    label: string;
    amount: number;
    isPercentage: boolean;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  breakdown: {
    service: {
      name: string;
      price: number;
      quantity: number;
    };
    addOns?: Array<{
      name: string;
      price: number;
      quantity: number;
    }>;
    discounts?: Array<{
      code: string;
      amount: number;
      type: 'percentage' | 'fixed';
    }>;
  };
}

export interface PriceRange {
  min: number;
  max: number;
  currency: string;
  locationId: string;
  locationName: string;
}

class PricingService {
  /**
   * Calculate price for a service at a specific location
   */
  static async calculatePrice(params: PriceCalculationParams): Promise<PriceCalculationResult> {
    try {
      // Get base pricing
      const pricing = await this.getServicePricing(
        params.serviceId,
        params.locationId,
        params.cityId
      );

      if (!pricing) {
        throw new Error('Pricing not found for service');
      }

      // Get service details
      const { data: service } = await supabase
        .from('services')
        .select('title, add_ons')
        .eq('id', params.serviceId)
        .single();

      if (!service) {
        throw new Error('Service not found');
      }

      // Initialize calculation
      let currentPrice = pricing.basePrice;
      const adjustments: PriceCalculationResult['adjustments'] = [];
      const breakdown: PriceCalculationResult['breakdown'] = {
        service: {
          name: service.title,
          price: pricing.basePrice,
          quantity: 1
        }
      };

      // Apply time-based adjustments
      if (params.date && params.time) {
        const timeAdjustments = this.calculateTimeAdjustments(
          params.date,
          params.time,
          pricing.priceAdjustments
        );

        for (const adj of timeAdjustments) {
          currentPrice = this.applyAdjustment(currentPrice, adj);
          adjustments.push(adj);
        }
      }

      // Apply seasonal adjustments
      if (params.date) {
        const seasonalAdj = this.calculateSeasonalAdjustment(
          params.date,
          pricing.priceAdjustments
        );

        if (seasonalAdj) {
          currentPrice = this.applyAdjustment(currentPrice, seasonalAdj);
          adjustments.push(seasonalAdj);
        }
      }

      // Process add-ons
      if (params.addOns && params.addOns.length > 0) {
        const addOnPricing = await this.calculateAddOnsPricing(
          params.addOns,
          service.add_ons,
          pricing
        );

        if (addOnPricing.total > 0) {
          currentPrice += addOnPricing.total;
          breakdown.addOns = addOnPricing.items;
        }
      }

      // Apply promo code
      let discountAmount = 0;
      if (params.promoCode) {
        const discount = await this.applyPromoCode(
          params.promoCode,
          currentPrice,
          params.serviceId,
          params.locationId
        );

        if (discount) {
          discountAmount = discount.amount;
          currentPrice -= discountAmount;
          adjustments.push({
            type: 'discount',
            label: `Promo: ${params.promoCode}`,
            amount: -discountAmount,
            isPercentage: discount.type === 'percentage'
          });

          breakdown.discounts = [{
            code: params.promoCode,
            amount: discountAmount,
            type: discount.type
          }];
        }
      }

      // Calculate tax
      const subtotal = currentPrice;
      const tax = subtotal * pricing.taxRate;
      const total = subtotal + tax;

      return {
        basePrice: pricing.basePrice,
        adjustments,
        subtotal,
        tax,
        total,
        currency: pricing.currency,
        breakdown
      };

    } catch (error) {
      logger.error('Error calculating price:', error);
      throw error;
    }
  }

  /**
   * Get service pricing for a location
   */
  static async getServicePricing(
    serviceId: string,
    locationId: string,
    cityId?: string
  ): Promise<RegionalPricing | null> {
    try {
      // Try location-specific pricing first
      const { data: locationPricing } = await supabase
        .from('regional_pricing')
        .select('*')
        .eq('service_id', serviceId)
        .eq('location_id', locationId)
        .eq('is_active', true)
        .lte('valid_from', new Date().toISOString().split('T')[0])
        .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString().split('T')[0]}`)
        .order('valid_from', { ascending: false })
        .limit(1)
        .single();

      if (locationPricing) {
        return {
          id: locationPricing.id,
          serviceId: locationPricing.service_id,
          cityId: locationPricing.city_id,
          locationId: locationPricing.location_id,
          basePrice: locationPricing.base_price,
          currency: locationPricing.currency,
          taxRate: locationPricing.tax_rate,
          validFrom: new Date(locationPricing.valid_from),
          validUntil: locationPricing.valid_until ? new Date(locationPricing.valid_until) : undefined,
          priceAdjustments: locationPricing.price_adjustments || {},
          isActive: locationPricing.is_active
        };
      }

      // Fallback to city pricing
      if (cityId) {
        const { data: cityPricing } = await supabase
          .from('regional_pricing')
          .select('*')
          .eq('service_id', serviceId)
          .eq('city_id', cityId)
          .eq('is_active', true)
          .is('location_id', null)
          .lte('valid_from', new Date().toISOString().split('T')[0])
          .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString().split('T')[0]}`)
          .order('valid_from', { ascending: false })
          .limit(1)
          .single();

        if (cityPricing) {
          return {
            id: cityPricing.id,
            serviceId: cityPricing.service_id,
            cityId: cityPricing.city_id,
            locationId: cityPricing.location_id,
            basePrice: cityPricing.base_price,
            currency: cityPricing.currency,
            taxRate: cityPricing.tax_rate,
            validFrom: new Date(cityPricing.valid_from),
            validUntil: cityPricing.valid_until ? new Date(cityPricing.valid_until) : undefined,
            priceAdjustments: cityPricing.price_adjustments || {},
            isActive: cityPricing.is_active
          };
        }
      }

      // Fallback to service default pricing
      const { data: service } = await supabase
        .from('services')
        .select('price_from, price_to')
        .eq('id', serviceId)
        .single();

      if (service) {
        return {
          id: 'default',
          serviceId,
          basePrice: service.price_from || 0,
          currency: 'PLN',
          taxRate: 0.23,
          validFrom: new Date(),
          priceAdjustments: {},
          isActive: true
        };
      }

      return null;

    } catch (error) {
      logger.error('Error getting service pricing:', error);
      return null;
    }
  }

  /**
   * Get price range for a service across locations
   */
  static async getServicePriceRange(
    serviceId: string,
    cityId?: string
  ): Promise<PriceRange[]> {
    try {
      let query = supabase
        .from('regional_pricing')
        .select(`
          *,
          locations!inner(name, city)
        `)
        .eq('service_id', serviceId)
        .eq('is_active', true)
        .lte('valid_from', new Date().toISOString().split('T')[0])
        .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString().split('T')[0]}`);

      if (cityId) {
        query = query.eq('city_id', cityId);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        return [];
      }

      // Group by location and calculate min/max
      const locationPrices = new Map<string, PriceRange>();

      for (const pricing of data) {
        const locationId = pricing.location_id;
        const existing = locationPrices.get(locationId);

        const adjustedPrice = pricing.base_price;

        // Apply maximum possible adjustments
        const maxSurcharge = Object.values(pricing.price_adjustments || {})
          .filter(adj => adj && adj > 0)
          .reduce((sum, adj) => sum + adj, 0);

        const maxPrice = adjustedPrice * (1 + maxSurcharge);

        if (existing) {
          existing.min = Math.min(existing.min, pricing.base_price);
          existing.max = Math.max(existing.max, maxPrice);
        } else {
          locationPrices.set(locationId, {
            min: pricing.base_price,
            max: maxPrice,
            currency: pricing.currency,
            locationId: pricing.location_id,
            locationName: pricing.locations.name
          });
        }
      }

      return Array.from(locationPrices.values())
        .sort((a, b) => a.min - b.min);

    } catch (error) {
      logger.error('Error getting service price range:', error);
      return [];
    }
  }

  /**
   * Calculate time-based price adjustments
   */
  private static calculateTimeAdjustments(
    date: Date,
    time: string,
    adjustments: Record<string, number>
  ): Array<{ type: string; label: string; amount: number; isPercentage: boolean }> {
    const results: Array<{ type: string; label: string; amount: number; isPercentage: boolean }> = [];

    const dateTime = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    dateTime.setHours(hours, minutes);

    // Weekend surcharge
    const dayOfWeek = dateTime.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
      const weekendSurcharge = adjustments.weekendSurcharge;
      if (weekendSurcharge && weekendSurcharge > 0) {
        results.push({
          type: 'weekend',
          label: 'Weekend surcharge',
          amount: weekendSurcharge,
          isPercentage: true
        });
      }
    }

    // Evening surcharge
    if (hours >= 18 || hours < 6) {
      const eveningSurcharge = adjustments.eveningSurcharge;
      if (eveningSurcharge && eveningSurcharge > 0) {
        results.push({
          type: 'evening',
          label: 'Evening surcharge',
          amount: eveningSurcharge,
          isPercentage: true
        });
      }
    }

    return results;
  }

  /**
   * Calculate seasonal price adjustments
   */
  private static calculateSeasonalAdjustment(
    date: Date,
    adjustments: Record<string, number>
  ): { type: string; label: string; amount: number; isPercentage: boolean } | null {
    const month = date.getMonth() + 1; // 1-12

    // Summer season (June-August)
    if (month >= 6 && month <= 8) {
      const summerMultiplier = adjustments.summerSurcharge || 1.1;
      if (summerMultiplier !== 1) {
        return {
          type: 'seasonal',
          label: 'Summer season',
          amount: summerMultiplier - 1,
          isPercentage: true
        };
      }
    }

    // Holiday season (December)
    if (month === 12) {
      const holidaySurcharge = adjustments.holidaySurcharge;
      if (holidaySurcharge && holidaySurcharge > 0) {
        return {
          type: 'holiday',
          label: 'Holiday season',
          amount: holidaySurcharge,
          isPercentage: true
        };
      }
    }

    return null;
  }

  /**
   * Apply price adjustment
   */
  private static applyAdjustment(
    basePrice: number,
    adjustment: { amount: number; isPercentage: boolean }
  ): number {
    if (adjustment.isPercentage) {
      return basePrice * (1 + adjustment.amount);
    } else {
      return basePrice + adjustment.amount;
    }
  }

  /**
   * Calculate add-ons pricing
   */
  private static async calculateAddOnsPricing(
    addOns: Array<{ id: string; quantity: number }>,
    serviceAddOns: any,
    pricing: RegionalPricing
  ): Promise<{ total: number; items: Array<{ name: string; price: number; quantity: number }> }> {
    const items: Array<{ name: string; price: number; quantity: number }> = [];
    let total = 0;

    if (!serviceAddOns || !Array.isArray(serviceAddOns)) {
      return { total: 0, items: [] };
    }

    for (const addOn of addOns) {
      const serviceAddOn = serviceAddOns.find((a: any) => a.id === addOn.id);
      if (serviceAddOn) {
        const price = serviceAddOn.price || 0;
        const totalPrice = price * addOn.quantity;

        items.push({
          name: serviceAddOn.name || 'Add-on',
          price,
          quantity: addOn.quantity
        });

        total += totalPrice;
      }
    }

    return { total, items };
  }

  /**
   * Apply promo code
   */
  private static async applyPromoCode(
    code: string,
    amount: number,
    serviceId: string,
    locationId: string
  ): Promise<{ amount: number; type: 'percentage' | 'fixed' } | null> {
    try {
      // Check if promo code exists and is valid
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (!promo) {
        return null;
      }

      // Check expiration
      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        return null;
      }

      // Check usage limits
      if (promo.max_uses && promo.used_count >= promo.max_uses) {
        return null;
      }

      // Check if promo applies to this service/location
      if (promo.applicable_services && !promo.applicable_services.includes(serviceId)) {
        return null;
      }

      if (promo.applicable_locations && !promo.applicable_locations.includes(locationId)) {
        return null;
      }

      // Check minimum order amount
      if (promo.min_order_amount && amount < promo.min_order_amount) {
        return null;
      }

      // Calculate discount
      let discountAmount = 0;
      let discountType: 'percentage' | 'fixed' = 'percentage';

      if (promo.discount_type === 'percentage') {
        discountAmount = amount * (promo.discount_value / 100);
        discountType = 'percentage';
      } else {
        discountAmount = Math.min(promo.discount_value, amount);
        discountType = 'fixed';
      }

      // Apply maximum discount limit
      if (promo.max_discount_amount && discountAmount > promo.max_discount_amount) {
        discountAmount = promo.max_discount_amount;
      }

      return {
        amount: discountAmount,
        type: discountType
      };

    } catch (error) {
      logger.error('Error applying promo code:', error);
      return null;
    }
  }

  /**
   * Format price for display
   */
  static formatPrice(
    amount: number,
    currency: string = 'PLN',
    locale: string = 'pl-PL'
  ): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Create or update regional pricing
   */
  static async updateRegionalPricing(
    pricing: Omit<RegionalPricing, 'id'>
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('regional_pricing')
        .upsert({
          service_id: pricing.serviceId,
          city_id: pricing.cityId,
          location_id: pricing.locationId,
          base_price: pricing.basePrice,
          currency: pricing.currency,
          tax_rate: pricing.taxRate,
          valid_from: pricing.validFrom.toISOString().split('T')[0],
          valid_until: pricing.validUntil?.toISOString().split('T')[0],
          price_adjustments: pricing.priceAdjustments,
          is_active: pricing.isActive
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;

    } catch (error) {
      logger.error('Error updating regional pricing:', error);
      throw error;
    }
  }

  /**
   * Get tax configuration for a city
   */
  static async getTaxConfiguration(cityId: string): Promise<{
    vatRate: number;
    serviceTaxRate: number;
    tourismTaxRate: number;
    totalTaxRate: number;
  }> {
    try {
      const { data: taxConfigs } = await supabase
        .from('city_tax_config')
        .select('*')
        .eq('city_id', cityId)
        .eq('is_active', true)
        .lte('effective_date', new Date().toISOString().split('T')[0])
        .or('expires_date.is.null,expires_date.gte.' + new Date().toISOString().split('T')[0]);

      const config = {
        vatRate: 0.23, // Default Polish VAT
        serviceTaxRate: 0,
        tourismTaxRate: 0,
        totalTaxRate: 0.23
      };

      if (taxConfigs && taxConfigs.length > 0) {
        taxConfigs.forEach(tax => {
          switch (tax.tax_type) {
            case 'vat':
              config.vatRate = tax.tax_rate;
              break;
            case 'service_tax':
              config.serviceTaxRate = tax.tax_rate;
              break;
            case 'tourism_tax':
              config.tourismTaxRate = tax.tax_rate;
              break;
          }
        });

        // Calculate total tax (considering compound taxes)
        config.totalTaxRate = config.vatRate;
        if (!taxConfigs.find(t => t.tax_type === 'vat' && t.is_compound)) {
          config.totalTaxRate += config.serviceTaxRate + config.tourismTaxRate;
        }
      }

      return config;

    } catch (error) {
      logger.error('Error getting tax configuration:', error);
      return {
        vatRate: 0.23,
        serviceTaxRate: 0,
        tourismTaxRate: 0,
        totalTaxRate: 0.23
      };
    }
  }
}

export default PricingService;