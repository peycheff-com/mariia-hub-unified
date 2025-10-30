/**
 * Currency Conversion Service
 *
 * Real-time currency conversion with support for:
 * - PLN/EUR/USD main currencies
 * - Polish Złoty as primary currency
 * - Real-time exchange rates
 * - Transparent fee structure
 * - Historical rate tracking
 */

import { ExchangeRate } from './payment-factory';
import { createClient } from '@supabase/supabase-js';

interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  precision: number;
  isActive: boolean;
  flag: string;
  localName: string;
}

interface ConversionQuote {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  amount: number;
  convertedAmount: number;
  fee: {
    percentage: number;
    fixed: number;
    totalFee: number;
    currency: string;
  };
  totalWithFees: number;
  validUntil: string;
  provider: string;
}

interface HistoricalRate {
  date: string;
  rate: number;
  volume: number;
  high: number;
  low: number;
  change: number;
  changePercent: number;
}

interface ConversionHistory {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  fee: number;
  totalFee: number;
  provider: string;
  customerId?: string;
  bookingId?: string;
  createdAt: string;
}

interface ProviderConfig {
  name: string;
  apiKey: string;
  baseUrl: string;
  priority: number;
  rateLimitPerSecond: number;
  supportedPairs: string[];
  feeStructure: {
    percentage: number;
    fixed: number;
    currency: string;
  };
}

export class CurrencyConversionService {
  private supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
  );

  private supportedCurrencies: Record<string, CurrencyConfig> = {
    PLN: {
      code: 'PLN',
      symbol: 'zł',
      name: 'Polish Złoty',
      precision: 2,
      isActive: true,
      flag: '🇵🇱',
      localName: 'Złoty polski'
    },
    EUR: {
      code: 'EUR',
      symbol: '€',
      name: 'Euro',
      precision: 2,
      isActive: true,
      flag: '🇪🇺',
      localName: 'Euro'
    },
    USD: {
      code: 'USD',
      symbol: '$',
      name: 'US Dollar',
      precision: 2,
      isActive: true,
      flag: '🇺🇸',
      localName: 'US Dollar'
    },
    GBP: {
      code: 'GBP',
      symbol: '£',
      name: 'British Pound',
      precision: 2,
      isActive: true,
      flag: '🇬🇧',
      localName: 'British Pound Sterling'
    },
    CHF: {
      code: 'CHF',
      symbol: 'CHF',
      name: 'Swiss Franc',
      precision: 2,
      isActive: false, // Disabled by default
      flag: '🇨🇭',
      localName: 'Swiss Franc'
    }
  };

  private providers: ProviderConfig[] = [
    {
      name: 'fixer',
      apiKey: import.meta.env.VITE_FIXER_API_KEY || '',
      baseUrl: 'https://api.fixer.io',
      priority: 1,
      rateLimitPerSecond: 10,
      supportedPairs: ['PLN/EUR', 'PLN/USD', 'EUR/USD', 'EUR/PLN', 'USD/PLN', 'USD/EUR'],
      feeStructure: {
        percentage: 0.5,
        fixed: 0,
        currency: 'PLN'
      }
    },
    {
      name: 'nbp',
      apiKey: '', // NBP API doesn't require key
      baseUrl: 'https://api.nbp.pl',
      priority: 2,
      rateLimitPerSecond: 5,
      supportedPairs: ['PLN/EUR', 'PLN/USD', 'PLN/GBP'],
      feeStructure: {
        percentage: 0.3,
        fixed: 0,
        currency: 'PLN'
      }
    },
    {
      name: 'ecb',
      apiKey: '', // ECB API doesn't require key
      baseUrl: 'https://api.exchangeratesapi.io',
      priority: 3,
      rateLimitPerSecond: 10,
      supportedPairs: ['EUR/PLN', 'EUR/USD', 'EUR/GBP'],
      feeStructure: {
        percentage: 0.7,
        fixed: 0,
        currency: 'PLN'
      }
    }
  ];

  private rateCache: Map<string, { rate: number; timestamp: number; ttl: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeCache();
  }

  private async initializeCache(): Promise<void> {
    // Load recent rates from database
    const { data: cachedRates } = await this.supabase
      .from('exchange_rate_cache')
      .select('*')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    if (cachedRates) {
      cachedRates.forEach(rate => {
        const key = `${rate.from_currency}_${rate.to_currency}`;
        this.rateCache.set(key, {
          rate: rate.rate,
          timestamp: new Date(rate.created_at).getTime(),
          ttl: this.CACHE_TTL
        });
      });
    }
  }

  /**
   * Get supported currencies
   */
  getSupportedCurrencies(): CurrencyConfig[] {
    return Object.values(this.supportedCurrencies).filter(currency => currency.isActive);
  }

  /**
   * Get exchange rates for currency pair
   */
  async getExchangeRates(fromCurrency: string, toCurrency: string): Promise<ExchangeRate[]> {
    const pairs = [`${fromCurrency}/${toCurrency}`];

    // If inverse pair is needed
    if (fromCurrency !== 'PLN' && toCurrency !== 'PLN') {
      pairs.push(`PLN/${fromCurrency}`, `PLN/${toCurrency}`);
    }

    const rates: ExchangeRate[] = [];

    for (const pair of pairs) {
      const [from, to] = pair.split('/');
      const rate = await this.getExchangeRate(from, to);

      if (rate) {
        rates.push(rate);
      }
    }

    return rates;
  }

  /**
   * Convert currency amount
   */
  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<{ amount: number; rate: number; fees: number }> {
    if (fromCurrency === toCurrency) {
      return {
        amount,
        rate: 1,
        fees: 0
      };
    }

    // Get exchange rate
    const exchangeRate = await this.getExchangeRate(fromCurrency, toCurrency);
    if (!exchangeRate) {
      throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
    }

    // Calculate converted amount
    const convertedAmount = amount * exchangeRate.rate;

    // Calculate fees
    const fees = this.calculateConversionFees(convertedAmount, exchangeRate.provider);
    const totalFees = (convertedAmount * fees.percentage) / 100 + fees.fixed;

    // Store conversion in history
    await this.storeConversionHistory({
      fromCurrency,
      toCurrency,
      fromAmount: amount,
      toAmount: convertedAmount - totalFees,
      rate: exchangeRate.rate,
      fee: totalFees,
      totalFee: totalFees,
      provider: exchangeRate.provider,
      createdAt: new Date().toISOString()
    });

    return {
      amount: convertedAmount - totalFees,
      rate: exchangeRate.rate,
      fees: totalFees
    };
  }

  /**
   * Get conversion quote with fees breakdown
   */
  async getConversionQuote(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    customerId?: string
  ): Promise<ConversionQuote> {
    if (fromCurrency === toCurrency) {
      return {
        fromCurrency,
        toCurrency,
        rate: 1,
        amount,
        convertedAmount: amount,
        fee: {
          percentage: 0,
          fixed: 0,
          totalFee: 0,
          currency: fromCurrency
        },
        totalWithFees: amount,
        validUntil: new Date(Date.now() + this.CACHE_TTL).toISOString(),
        provider: 'direct'
      };
    }

    const exchangeRate = await this.getExchangeRate(fromCurrency, toCurrency);
    if (!exchangeRate) {
      throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
    }

    const convertedAmount = amount * exchangeRate.rate;
    const feeStructure = this.getProviderFeeStructure(exchangeRate.provider);
    const percentageFee = (convertedAmount * feeStructure.percentage) / 100;
    const totalFee = percentageFee + feeStructure.fixed;

    return {
      fromCurrency,
      toCurrency,
      rate: exchangeRate.rate,
      amount,
      convertedAmount,
      fee: {
        percentage: feeStructure.percentage,
        fixed: feeStructure.fixed,
        totalFee,
        currency: toCurrency
      },
      totalWithFees: convertedAmount + totalFee,
      validUntil: new Date(Date.now() + this.CACHE_TTL).toISOString(),
      provider: exchangeRate.provider
    };
  }

  /**
   * Get historical rates for currency pair
   */
  async getHistoricalRates(
    fromCurrency: string,
    toCurrency: string,
    startDate: Date,
    endDate: Date
  ): Promise<HistoricalRate[]> {
    const { data, error } = await this.supabase
      .from('exchange_rate_history')
      .select('*')
      .eq('from_currency', fromCurrency)
      .eq('to_currency', toCurrency)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())
      .order('date', { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map(rate => ({
      date: rate.date,
      rate: rate.rate,
      volume: rate.volume || 0,
      high: rate.high || rate.rate,
      low: rate.low || rate.rate,
      change: rate.change || 0,
      changePercent: rate.change_percent || 0
    }));
  }

  /**
   * Check if currency conversion is available
   */
  isConversionAvailable(currency: string): boolean {
    return this.supportedCurrencies[currency]?.isActive || false;
  }

  /**
   * Get currency display information
   */
  getCurrencyInfo(currencyCode: string): CurrencyConfig | null {
    return this.supportedCurrencies[currencyCode] || null;
  }

  /**
   * Format currency amount for display
   */
  formatCurrency(amount: number, currencyCode: string, locale: string = 'pl-PL'): string {
    const currency = this.supportedCurrencies[currencyCode];
    if (!currency) {
      return amount.toString();
    }

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: currency.precision,
      maximumFractionDigits: currency.precision
    }).format(amount);
  }

  /**
   * Get conversion statistics
   */
  async getConversionStatistics(startDate?: Date, endDate?: Date): Promise<{
    totalConversions: number;
    totalVolume: number;
    averageRate: number;
    topCurrencies: { code: string; volume: number; conversions: number }[];
    providerUsage: { provider: string; usage: number; successRate: number }[];
  }> {
    const query = this.supabase
      .from('conversion_history')
      .select('*');

    if (startDate) {
      query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query.lte('created_at', endDate.toISOString());
    }

    const { data: conversions, error } = await query;

    if (error || !conversions) {
      return {
        totalConversions: 0,
        totalVolume: 0,
        averageRate: 0,
        topCurrencies: [],
        providerUsage: []
      };
    }

    const totalConversions = conversions.length;
    const totalVolume = conversions.reduce((sum, conv) => sum + conv.from_amount, 0);
    const averageRate = conversions.reduce((sum, conv) => sum + conv.rate, 0) / totalConversions;

    // Calculate top currencies
    const currencyVolume: Record<string, { volume: number; conversions: number }> = {};
    conversions.forEach(conv => {
      const fromKey = conv.from_currency;
      const toKey = conv.to_currency;

      currencyVolume[fromKey] = currencyVolume[fromKey] || { volume: 0, conversions: 0 };
      currencyVolume[fromKey].volume += conv.from_amount;
      currencyVolume[fromKey].conversions += 1;

      currencyVolume[toKey] = currencyVolume[toKey] || { volume: 0, conversions: 0 };
      currencyVolume[toKey].volume += conv.to_amount;
      currencyVolume[toKey].conversions += 1;
    });

    const topCurrencies = Object.entries(currencyVolume)
      .map(([code, data]) => ({ code, ...data }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);

    // Calculate provider usage
    const providerStats: Record<string, { usage: number; success: number }> = {};
    conversions.forEach(conv => {
      providerStats[conv.provider] = providerStats[conv.provider] || { usage: 0, success: 0 };
      providerStats[conv.provider].usage += 1;
      // Assuming all stored conversions were successful
      providerStats[conv.provider].success += 1;
    });

    const providerUsage = Object.entries(providerStats).map(([provider, stats]) => ({
      provider,
      usage: stats.usage,
      successRate: (stats.success / stats.usage) * 100
    }));

    return {
      totalConversions,
      totalVolume,
      averageRate,
      topCurrencies,
      providerUsage
    };
  }

  // Private helper methods

  private async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<ExchangeRate | null> {
    const cacheKey = `${fromCurrency}_${toCurrency}`;
    const cached = this.rateCache.get(cacheKey);

    // Check cache
    if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
      return {
        from: fromCurrency,
        to: toCurrency,
        rate: cached.rate,
        timestamp: new Date(cached.timestamp).toISOString(),
        provider: 'cache',
        fees: {
          percentage: 0.5,
          fixed: 0,
          currency: 'PLN'
        }
      };
    }

    // Try to get rate from providers
    for (const provider of this.providers.sort((a, b) => a.priority - b.priority)) {
      try {
        const rate = await this.fetchExchangeRate(provider, fromCurrency, toCurrency);
        if (rate) {
          // Cache the rate
          this.rateCache.set(cacheKey, {
            rate: rate.rate,
            timestamp: Date.now(),
            ttl: this.CACHE_TTL
          });

          // Store in database
          await this.storeExchangeRateCache({
            fromCurrency,
            toCurrency,
            rate: rate.rate,
            provider: provider.name,
            expiresAt: new Date(Date.now() + this.CACHE_TTL).toISOString()
          });

          return rate;
        }
      } catch (error) {
        console.warn(`Failed to fetch rate from ${provider.name}:`, error);
        continue;
      }
    }

    return null;
  }

  private async fetchExchangeRate(provider: ProviderConfig, from: string, to: string): Promise<ExchangeRate | null> {
    switch (provider.name) {
      case 'fixer':
        return this.fetchFixerRate(from, to);
      case 'nbp':
        return this.fetchNBPRate(from, to);
      case 'ecb':
        return this.fetchECBRate(from, to);
      default:
        return null;
    }
  }

  private async fetchFixerRate(from: string, to: string): Promise<ExchangeRate | null> {
    try {
      const url = `https://api.fixer.io/latest?base=${from}&symbols=${to}&access_key=${this.providers[0].apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success && data.rates && data.rates[to]) {
        return {
          from,
          to,
          rate: data.rates[to],
          timestamp: data.timestamp ? new Date(data.timestamp * 1000).toISOString() : new Date().toISOString(),
          provider: 'fixer',
          fees: this.providers[0].feeStructure
        };
      }

      return null;
    } catch (error) {
      console.error('Fixer API error:', error);
      return null;
    }
  }

  private async fetchNBPRate(from: string, to: string): Promise<ExchangeRate | null> {
    // NBP API provides rates relative to PLN
    if (from !== 'PLN' && to !== 'PLN') {
      return null; // NBP only handles PLN as base or quote
    }

    try {
      const otherCurrency = from === 'PLN' ? to : from;
      const url = `https://api.nbp.pl/api/exchangerates/rates/a/${otherCurrency}/?format=json`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.rates && data.rates.length > 0) {
        const rate = data.rates[0].mid;
        const finalRate = from === 'PLN' ? 1 / rate : rate;

        return {
          from,
          to,
          rate: finalRate,
          timestamp: data.rates[0].effectiveDate,
          provider: 'nbp',
          fees: this.providers[1].feeStructure
        };
      }

      return null;
    } catch (error) {
      console.error('NBP API error:', error);
      return null;
    }
  }

  private async fetchECBRate(from: string, to: string): Promise<ExchangeRate | null> {
    // ECB API provides rates relative to EUR
    if (from !== 'EUR' && to !== 'EUR') {
      return null; // ECB only handles EUR as base
    }

    try {
      const url = 'https://api.exchangeratesapi.io/latest?base=EUR';
      const response = await fetch(url);
      const data = await response.json();

      if (data.rates) {
        let finalRate = 1;

        if (from === 'EUR' && to !== 'EUR') {
          finalRate = data.rates[to];
        } else if (from !== 'EUR' && to === 'EUR') {
          finalRate = 1 / data.rates[from];
        }

        return {
          from,
          to,
          rate: finalRate,
          timestamp: data.date,
          provider: 'ecb',
          fees: this.providers[2].feeStructure
        };
      }

      return null;
    } catch (error) {
      console.error('ECB API error:', error);
      return null;
    }
  }

  private calculateConversionFees(amount: number, provider: string): { percentage: number; fixed: number } {
    const providerConfig = this.providers.find(p => p.name === provider);
    return providerConfig ? providerConfig.feeStructure : { percentage: 0.5, fixed: 0 };
  }

  private getProviderFeeStructure(provider: string): { percentage: number; fixed: number; currency: string } {
    const providerConfig = this.providers.find(p => p.name === provider);
    return providerConfig ? providerConfig.feeStructure : { percentage: 0.5, fixed: 0, currency: 'PLN' };
  }

  private async storeExchangeRateCache(params: {
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    provider: string;
    expiresAt: string;
  }): Promise<void> {
    await this.supabase
      .from('exchange_rate_cache')
      .upsert({
        from_currency: params.fromCurrency,
        to_currency: params.toCurrency,
        rate: params.rate,
        provider: params.provider,
        expires_at: params.expiresAt,
        created_at: new Date()
      });
  }

  private async storeConversionHistory(history: Omit<ConversionHistory, 'id'>): Promise<void> {
    await this.supabase
      .from('conversion_history')
      .insert(history);
  }

  /**
   * Update historical rates (should be called periodically)
   */
  async updateHistoricalRates(): Promise<void> {
    const activeCurrencies = this.getSupportedCurrencies();
    const today = new Date();

    for (const fromCurrency of activeCurrencies) {
      for (const toCurrency of activeCurrencies) {
        if (fromCurrency.code === toCurrency.code) continue;

        try {
          const rate = await this.getExchangeRate(fromCurrency.code, toCurrency.code);
          if (rate) {
            // Store in historical rates
            await this.supabase
              .from('exchange_rate_history')
              .upsert({
                date: today.toISOString().split('T')[0],
                from_currency: fromCurrency.code,
                to_currency: toCurrency.code,
                rate: rate.rate,
                provider: rate.provider,
                created_at: new Date()
              });
          }
        } catch (error) {
          console.error(`Failed to update historical rate for ${fromCurrency.code}/${toCurrency.code}:`, error);
        }
      }
    }
  }

  /**
   * Refresh rate cache
   */
  async refreshCache(): Promise<void> {
    // Clear expired cache entries
    const now = Date.now();
    for (const [key, cached] of this.rateCache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.rateCache.delete(key);
      }
    }

    // Preload common rates
    const commonPairs = [
      ['PLN', 'EUR'],
      ['PLN', 'USD'],
      ['EUR', 'USD'],
      ['EUR', 'PLN'],
      ['USD', 'PLN'],
      ['USD', 'EUR']
    ];

    for (const [from, to] of commonPairs) {
      await this.getExchangeRate(from, to);
    }
  }
}

// Export singleton instance
export const currencyConversionService = new CurrencyConversionService();