/**
 * Base Integration Service
 * Abstract base class for all integration services
 * Provides common functionality and interface for third-party integrations
 */

import type {
  IntegrationConfig,
  IntegrationSyncLog,
  IntegrationHealth,
  IntegrationEvent,
  DataMapping,
  SyncFrequency,
  IntegrationTemplate,
  AuthType
} from '@/types/integrations';

export interface SyncResult {
  success: boolean;
  recordsProcessed?: number;
  recordsCreated?: number;
  recordsUpdated?: number;
  recordsDeleted?: number;
  error?: string;
  details?: Record<string, any>;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  success_rate?: number;
  error_rate?: number;
  response_time_ms?: number;
  last_successful_sync?: string;
  issues?: Array<{
    type: 'warning' | 'error' | 'critical';
    message: string;
    details?: string;
    suggested_action?: string;
  }>;
}

export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  signature?: string;
  provider: string;
}

export interface AuthConfig {
  client_id?: string;
  client_secret?: string;
  api_key?: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  webhook_secret?: string;
  [key: string]: any;
}

export abstract class BaseIntegrationService {
  protected config: IntegrationConfig;
  protected rateLimitTracker: Map<string, number[]> = new Map();
  protected lastSyncTime: Map<string, Date> = new Map();

  constructor(config: IntegrationConfig) {
    this.config = config;
  }

  /**
   * Get integration provider name
   */
  abstract getProvider(): string;

  /**
   * Get integration categories this service supports
   */
  abstract getSupportedCategories(): string[];

  /**
   * Test connection to the third-party service
   */
  abstract testConnection(config: IntegrationConfig): Promise<{ success: boolean; error?: string }>;

  /**
   * Perform authentication with the third-party service
   */
  abstract authenticate(authConfig: AuthConfig): Promise<{ success: boolean; access_token?: string; error?: string }>;

  /**
   * Refresh authentication token if needed
   */
  abstract refreshToken(refreshToken: string): Promise<{ success: boolean; access_token?: string; error?: string }>;

  /**
   * Synchronize data with the third-party service
   */
  abstract syncData(
    config: IntegrationConfig,
    entityTypes?: string[]
  ): Promise<SyncResult>;

  /**
   * Perform health check on the integration
   */
  abstract healthCheck?(config: IntegrationConfig): Promise<HealthCheckResult>;

  /**
   * Handle incoming webhooks from the third-party service
   */
  abstract handleWebhook?(payload: WebhookPayload): Promise<{ success: boolean; processed: boolean; error?: string }>;

  /**
   * Get integration template for setup
   */
  abstract getTemplate(): IntegrationTemplate;

  /**
   * Transform data from external format to internal format
   */
  protected transformDataIn(
    data: any,
    mappings: DataMapping[]
  ): Record<string, any> {
    const transformed: Record<string, any> = {};

    mappings.forEach(mapping => {
      const externalValue = this.getNestedValue(data, mapping.external_field);

      if (externalValue !== undefined && externalValue !== null) {
        transformed[mapping.local_field] = this.applyTransformation(
          externalValue,
          mapping.transformation_type,
          mapping.transformation_config
        );
      } else if (mapping.is_required && mapping.default_value !== undefined) {
        transformed[mapping.local_field] = mapping.default_value;
      }
    });

    return transformed;
  }

  /**
   * Transform data from internal format to external format
   */
  protected transformDataOut(
    data: Record<string, any>,
    mappings: DataMapping[]
  ): Record<string, any> {
    const transformed: Record<string, any> = {};

    mappings.forEach(mapping => {
      const internalValue = data[mapping.local_field];

      if (internalValue !== undefined && internalValue !== null) {
        transformed[mapping.external_field] = this.applyTransformation(
          internalValue,
          mapping.transformation_type,
          mapping.transformation_config
        );
      } else if (mapping.is_required && mapping.default_value !== undefined) {
        transformed[mapping.external_field] = mapping.default_value;
      }
    });

    return transformed;
  }

  /**
   * Apply transformation to a value
   */
  protected applyTransformation(
    value: any,
    transformationType: string,
    config?: Record<string, any>
  ): any {
    switch (transformationType) {
      case 'direct':
        return value;

      case 'format':
        return this.formatValue(value, config?.format, config?.options);

      case 'split':
        return typeof value === 'string' ? value.split(config?.separator || ',') : value;

      case 'join':
        return Array.isArray(value) ? value.join(config?.separator || ',') : value;

      case 'calculate':
        return this.calculateValue(value, config?.expression, config?.variables);

      case 'lookup':
        return this.lookupValue(value, config?.lookup_table || {});

      default:
        return value;
    }
  }

  /**
   * Format value based on format string
   */
  protected formatValue(value: any, format?: string, options?: any): any {
    if (!format) return value;

    try {
      switch (format) {
        case 'date':
          return new Date(value).toISOString();

        case 'datetime':
          return new Date(value).toISOString();

        case 'currency':
          return new Intl.NumberFormat(options?.locale || 'pl-PL', {
            style: 'currency',
            currency: options?.currency || 'PLN'
          }).format(Number(value));

        case 'number':
          return new Intl.NumberFormat(options?.locale || 'pl-PL').format(Number(value));

        case 'phone':
          return this.formatPhoneNumber(value, options?.country || 'PL');

        case 'email':
          return this.formatEmail(value);

        case 'url':
          return this.formatUrl(value);

        default:
          return value;
      }
    } catch (error) {
      console.warn('Failed to format value:', error);
      return value;
    }
  }

  /**
   * Calculate value based on expression
   */
  protected calculateValue(value: any, expression?: string, variables?: Record<string, any>): any {
    if (!expression) return value;

    try {
      // Simple expression evaluation - in production, use a safer expression evaluator
      const expr = expression
        .replace(/\{value\}/g, String(value))
        .replace(/\{(\w+)\}/g, (match, key) => String(variables?.[key] || ''));

      // WARNING: In production, use a proper expression parser to prevent code injection
      // eslint-disable-next-line no-eval
      return eval(expr);
    } catch (error) {
      console.warn('Failed to calculate value:', error);
      return value;
    }
  }

  /**
   * Lookup value in lookup table
   */
  protected lookupValue(value: any, lookupTable: Record<string, any>): any {
    return lookupTable[String(value)] || value;
  }

  /**
   * Get nested value from object
   */
  protected getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Set nested value in object
   */
  protected setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Check rate limits
   */
  protected async checkRateLimit(
    endpoint: string,
    maxRequests: number,
    windowMs: number = 3600000 // 1 hour default
  ): Promise<boolean> {
    const now = Date.now();
    const key = `${this.getProvider()}:${endpoint}`;

    if (!this.rateLimitTracker.has(key)) {
      this.rateLimitTracker.set(key, []);
    }

    const timestamps = this.rateLimitTracker.get(key)!;

    // Remove old timestamps
    const recent = timestamps.filter(timestamp => now - timestamp < windowMs);

    if (recent.length >= maxRequests) {
      return false;
    }

    recent.push(now);
    this.rateLimitTracker.set(key, recent);
    return true;
  }

  /**
   * Make HTTP request with retry logic
   */
  protected async makeRequest<T = any>(
    url: string,
    options: RequestInit = {},
    retryConfig: { attempts: number; delay: number } = { attempts: 3, delay: 1000 }
  ): Promise<{ success: boolean; data?: T; error?: string; status?: number }> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retryConfig.attempts; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mariia-Hub-Integrations/1.0',
            ...options.headers
          }
        });

        if (response.ok) {
          const data = await response.json();
          return { success: true, data, status: response.status };
        } else {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt < retryConfig.attempts) {
          // Exponential backoff
          await this.delay(retryConfig.delay * Math.pow(2, attempt - 1));
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Request failed after retries'
    };
  }

  /**
   * Delay execution
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Format phone number
   */
  protected formatPhoneNumber(phone: string, country: string = 'PL'): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Apply country-specific formatting
    switch (country) {
      case 'PL':
        if (cleaned.startsWith('48')) {
          return `+${cleaned}`;
        }
        return `+48${cleaned}`;
      default:
        return `+${cleaned}`;
    }
  }

  /**
   * Format email address
   */
  protected formatEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  /**
   * Format URL
   */
  protected formatUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  }

  /**
   * Generate random string for state/nonce
   */
  protected generateRandomString(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Validate Polish-specific data
   */
  protected validatePolishData(data: Record<string, any>): { isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate NIP (Tax Identification Number)
    if (data.nip && !this.validateNIP(data.nip)) {
      errors.push('Invalid NIP format');
    }

    // Validate REGON (Statistical Identification Number)
    if (data.regon && !this.validateREGON(data.regon)) {
      errors.push('Invalid REGON format');
    }

    // Validate PESEL (Universal Electronic System for Registration of the Population)
    if (data.pesel && !this.validatePESEL(data.pesel)) {
      errors.push('Invalid PESEL format');
    }

    // Validate postal code
    if (data.postal_code && !this.validatePolishPostalCode(data.postal_code)) {
      errors.push('Invalid Polish postal code format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate NIP number
   */
  private validateNIP(nip: string): boolean {
    const cleanNip = nip.replace(/[^0-9]/g, '');
    if (cleanNip.length !== 10) return false;

    const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
    const sum = weights.reduce((acc, weight, index) => {
      return acc + weight * parseInt(cleanNip[index]);
    }, 0);

    const checkDigit = sum % 11;
    return checkDigit === parseInt(cleanNip[9]);
  }

  /**
   * Validate REGON number
   */
  private validateREGON(regon: string): boolean {
    const cleanRegon = regon.replace(/[^0-9]/g, '');
    if (cleanRegon.length !== 9 && cleanRegon.length !== 14) return false;

    const weights = cleanRegon.length === 9
      ? [8, 9, 2, 3, 4, 5, 6, 7]
      : [2, 4, 8, 5, 0, 9, 7, 3, 6, 1, 2, 4, 8];

    const sum = weights.reduce((acc, weight, index) => {
      return acc + weight * parseInt(cleanRegon[index]);
    }, 0);

    const checkDigit = sum % 11;
    return checkDigit === parseInt(cleanRegon[cleanRegon.length - 1]);
  }

  /**
   * Validate PESEL number
   */
  private validatePESEL(pesel: string): boolean {
    const cleanPesel = pesel.replace(/[^0-9]/g, '');
    if (cleanPesel.length !== 11) return false;

    const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
    const sum = weights.reduce((acc, weight, index) => {
      return acc + weight * parseInt(cleanPesel[index]);
    }, 0);

    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(cleanPesel[10]);
  }

  /**
   * Validate Polish postal code
   */
  private validatePolishPostalCode(postalCode: string): boolean {
    const cleanCode = postalCode.replace(/[^0-9-]/g, '');
    return /^\d{2}-\d{3}$/.test(cleanCode);
  }

  /**
   * Get Polish business hours for current time
   */
  protected isPolishBusinessHours(date: Date = new Date()): boolean {
    // Check if it's weekend
    if (date.getDay() === 0 || date.getDay() === 6) {
      return false;
    }

    // Check if it's within business hours (9:00 - 17:00)
    const hour = date.getHours();
    return hour >= 9 && hour < 17;
  }

  /**
   * Check if date is Polish holiday
   */
  protected isPolishHoliday(date: Date): boolean {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // Fixed Polish holidays
    const fixedHolidays = [
      { month: 1, day: 1 },   // New Year's Day
      { month: 1, day: 6 },   // Epiphany
      { month: 5, day: 1 },   // Labor Day
      { month: 5, day: 3 },   // Constitution Day
      { month: 8, day: 15 },  // Assumption of Mary
      { month: 11, day: 1 },  // All Saints' Day
      { month: 11, day: 11 }, // Independence Day
      { month: 12, day: 25 }, // Christmas Day
      { month: 12, day: 26 }  // Boxing Day
    ];

    const isFixedHoliday = fixedHolidays.some(holiday =>
      holiday.month === month && holiday.day === day
    );

    if (isFixedHoliday) return true;

    // Easter-related holidays (simplified calculation)
    // In production, use a proper Easter calculation library
    const easter = this.calculateEaster(year);
    const easterMonday = new Date(easter);
    easterMonday.setDate(easter.getDate() + 1);
    const corpusChristi = new Date(easter);
    corpusChristi.setDate(easter.getDate() + 60);

    return (
      this.isSameDay(date, easter) ||
      this.isSameDay(date, easterMonday) ||
      this.isSameDay(date, corpusChristi)
    );
  }

  /**
   * Calculate Easter Sunday (simplified)
   */
  private calculateEaster(year: number): Date {
    // Anonymous Gregorian algorithm
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(year, month - 1, day);
  }

  /**
   * Check if two dates are the same day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  /**
   * Log integration event
   */
  protected async logEvent(
    eventType: string,
    data: Record<string, any>,
    level: 'info' | 'warn' | 'error' = 'info'
  ): Promise<void> {
    try {
      await supabase
        .from('integration_events')
        .insert({
          integration_id: this.config.id,
          event_type: eventType,
          provider: this.getProvider(),
          entity_type: data.entity_type || 'system',
          entity_id: data.entity_id,
          data: {
            level,
            ...data,
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString(),
          processed: false
        });
    } catch (error) {
      console.error('Failed to log integration event:', error);
    }
  }

  /**
   * Update integration status
   */
  protected async updateStatus(
    status: IntegrationConfig['status'],
    error?: string
  ): Promise<void> {
    try {
      await supabase
        .from('integrations')
        .update({
          status,
          last_error: error,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.config.id);

      this.config.status = status;
      if (error) {
        this.config.last_error = error;
      }
    } catch (updateError) {
      console.error('Failed to update integration status:', updateError);
    }
  }

  /**
   * Get sync interval in milliseconds
   */
  protected getSyncIntervalMs(frequency: SyncFrequency): number {
    switch (frequency) {
      case 'realtime': return 60000; // 1 minute minimum
      case 'every_5_minutes': return 5 * 60 * 1000;
      case 'every_15_minutes': return 15 * 60 * 1000;
      case 'every_30_minutes': return 30 * 60 * 1000;
      case 'hourly': return 60 * 60 * 1000;
      case 'daily': return 24 * 60 * 60 * 1000;
      case 'weekly': return 7 * 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000; // Default to hourly
    }
  }
}

export default BaseIntegrationService;