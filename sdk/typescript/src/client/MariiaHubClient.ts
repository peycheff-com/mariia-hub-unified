import {
  ApiClient,
  ApiClientConfig,
  ApiResponse,
  HttpMethod,
  RequestConfig
} from '../types/api';
import {
  MariiaHubSDKConfig,
  SDKConfig,
  RegionalConfig,
  FeatureFlags,
  EnvironmentConfig
} from '../types/config';
import {
  MariiaHubSDKError,
  ErrorFactory,
  ErrorHandlerRegistry,
  DefaultErrorHandler
} from '../types/errors';
import { WebSocketClient } from '../websockets/WebSocketClient';
import { HttpClient } from './HttpClient';
import { AuthenticationManager } from '../auth/AuthenticationManager';
import { RateLimitManager } from './RateLimitManager';
import { CacheManager } from './CacheManager';
import { MetricsCollector } from './MetricsCollector';

/**
 * Main Mariia Hub SDK client
 */
export class MariiaHubClient {
  private config: MariiaHubSDKConfig;
  private httpClient: HttpClient;
  private webSocketClient?: WebSocketClient;
  private authManager: AuthenticationManager;
  private rateLimitManager: RateLimitManager;
  private cacheManager: CacheManager;
  private metricsCollector: MetricsCollector;
  private errorHandler: ErrorHandlerRegistry;
  private isInitialized: boolean = false;

  // API endpoints
  public bookings: any; // Will be initialized with BookingsApi
  public services: any; // Will be initialized with ServicesApi
  public payments: any; // Will be initialized with PaymentsApi
  public auth: any; // Will be initialized with AuthApi
  public users: any; // Will be initialized with UsersApi
  public admin: any; // Will be initialized with AdminApi
  public websockets: any; // Will be initialized with WebSocketApi

  constructor(config: Partial<MariiaHubSDKConfig> = {}) {
    // Merge with default configuration
    this.config = this.mergeWithDefaults(config);

    // Initialize core components
    this.httpClient = new HttpClient(this.config.api);
    this.authManager = new AuthenticationManager(this.config.api.authentication);
    this.rateLimitManager = new RateLimitManager(this.config.api.rateLimit);
    this.cacheManager = new CacheManager(this.config.api.cache);
    this.metricsCollector = new MetricsCollector(this.config.sdk?.enableMetrics || false);
    this.errorHandler = new ErrorHandlerRegistry();

    // Register default error handler
    this.errorHandler.register(new DefaultErrorHandler(this.config.sdk?.debug));

    // Setup HTTP client interceptors
    this.setupHttpClientInterceptors();

    // Initialize API endpoints
    this.initializeApiEndpoints();
  }

  /**
   * Initialize the SDK client
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize authentication
      await this.authManager.initialize();

      // Initialize WebSocket client if configured
      if (this.config.websockets) {
        this.webSocketClient = new WebSocketClient(
          this.getWebSocketUrl(),
          this.config.websockets
        );
        await this.webSocketClient.connect();
      }

      // Initialize API endpoints
      await this.initializeApiEndpointsAsync();

      this.isInitialized = true;

      // Record initialization metrics
      this.metricsCollector.recordCounter('sdk.initialized', 1);

    } catch (error) {
      this.handleInitializationError(error);
      throw error;
    }
  }

  /**
   * Check if client is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current configuration
   */
  getConfig(): MariiaHubSDKConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MariiaHubSDKConfig>): void {
    this.config = { ...this.config, ...config };

    // Update HTTP client configuration
    this.httpClient.updateConfig(this.config.api);

    // Update other components as needed
    if (config.api?.authentication) {
      this.authManager.updateConfig(config.api.authentication);
    }

    if (config.api?.rateLimit) {
      this.rateLimitManager.updateConfig(config.api.rateLimit);
    }

    if (config.api?.cache) {
      this.cacheManager.updateConfig(config.api.cache);
    }
  }

  /**
   * Get authentication manager
   */
  getAuthManager(): AuthenticationManager {
    return this.authManager;
  }

  /**
   * Get WebSocket client
   */
  getWebSocketClient(): WebSocketClient | undefined {
    return this.webSocketClient;
  }

  /**
   * Get metrics collector
   */
  getMetricsCollector(): MetricsCollector {
    return this.metricsCollector;
  }

  /**
   * Get error handler registry
   */
  getErrorHandler(): ErrorHandlerRegistry {
    return this.errorHandler;
  }

  /**
   * Register custom error handler
   */
  registerErrorHandler(handler: any): void {
    this.errorHandler.register(handler);
  }

  /**
   * Make raw HTTP request
   */
  async request<T = any>(
    method: HttpMethod,
    path: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    this.ensureInitialized();

    const startTime = Date.now();

    try {
      // Apply rate limiting
      await this.rateLimitManager.checkLimit(path);

      // Check cache for GET requests
      if (method === 'GET' && !config?.skipCache) {
        const cached = await this.cacheManager.get(path, config);
        if (cached) {
          this.metricsCollector.recordCounter('cache.hit', 1);
          return cached;
        }
        this.metricsCollector.recordCounter('cache.miss', 1);
      }

      // Make HTTP request
      const response = await this.httpClient.request<T>(method, path, data, config);

      // Cache successful GET responses
      if (method === 'GET' && response.success && !config?.skipCache) {
        await this.cacheManager.set(path, response, config);
      }

      // Record metrics
      const duration = Date.now() - startTime;
      this.metricsCollector.recordHistogram('http.request.duration', duration, {
        method,
        path,
        status: response.success ? 'success' : 'error'
      });
      this.metricsCollector.recordCounter('http.request.total', 1, {
        method,
        path,
        status: response.success ? 'success' : 'error'
      });

      return response;

    } catch (error) {
      // Record error metrics
      const duration = Date.now() - startTime;
      this.metricsCollector.recordHistogram('http.request.duration', duration, {
        method,
        path,
        status: 'error'
      });
      this.metricsCollector.recordCounter('http.request.errors', 1, {
        method,
        path,
        error_type: error.constructor.name
      });

      // Handle error
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Upload file
   */
  async uploadFile<T = any>(
    path: string,
    file: File | Blob,
    options?: {
      filename?: string;
      contentType?: string;
      metadata?: Record<string, any>;
      onProgress?: (progress: number) => void;
    },
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    this.ensureInitialized();

    try {
      return await this.httpClient.upload<T>(path, file, options, config);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Download file
   */
  async downloadFile(
    path: string,
    filename?: string,
    config?: RequestConfig
  ): Promise<Blob> {
    this.ensureInitialized();

    try {
      return await this.httpClient.download(path, filename, config);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Close client and cleanup resources
   */
  async close(): Promise<void> {
    try {
      // Close WebSocket connection
      if (this.webSocketClient) {
        await this.webSocketClient.disconnect();
      }

      // Clear cache
      await this.cacheManager.clear();

      // Reset initialization state
      this.isInitialized = false;

      // Record cleanup metrics
      this.metricsCollector.recordCounter('sdk.closed', 1);

    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get SDK version
   */
  getVersion(): string {
    return this.config.sdk?.version || '1.0.0';
  }

  /**
   * Get API version
   */
  getApiVersion(): string {
    return 'v1';
  }

  /**
   * Get service health
   */
  async getHealth(): Promise<ApiResponse<any>> {
    try {
      return await this.request('GET', '/health');
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get detailed health information
   */
  async getDetailedHealth(): Promise<ApiResponse<any>> {
    try {
      return await this.request('GET', '/health/detailed');
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Merge user config with defaults
   */
  private mergeWithDefaults(config: Partial<MariiaHubSDKConfig>): MariiaHubSDKConfig {
    const defaults = this.createDefaultConfig();
    return this.deepMerge(defaults, config);
  }

  /**
   * Create default configuration
   */
  private createDefaultConfig(): MariiaHubSDKConfig {
    return {
      api: {
        baseURL: this.getApiBaseUrl(),
        timeout: 30000,
        retries: 3,
        retryDelay: 1000,
        headers: {
          'User-Agent': this.getUserAgent(),
          'X-SDK-Version': this.getVersion(),
          'X-SDK-Language': 'typescript'
        },
        authentication: {
          type: 'jwt',
          credentials: {
            accessToken: '',
            refreshToken: ''
          }
        },
        rateLimit: {
          maxRequests: 100,
          windowMs: 60000,
          maxRetries: 3
        },
        cache: {
          enabled: true,
          ttl: 300,
          maxSize: 1000,
          strategy: 'lru'
        },
        logging: {
          enabled: false,
          level: 'error'
        }
      },
      sdk: {
        version: '1.0.0',
        userAgent: this.getUserAgent(),
        timeout: 30000,
        maxRetries: 3,
        retryStrategy: 'exponential',
        retryDelay: 1000,
        debug: false,
        enableMetrics: true,
        enableAnalytics: false,
        errorHandling: {
          classifyErrors: true,
          reportErrors: false,
          userFriendlyMessages: true,
          logErrors: true
        }
      },
      regional: {
        language: 'en',
        currency: 'EUR',
        timeZone: 'Europe/Warsaw',
        countryCode: 'PL',
        locale: {
          dateFormat: 'YYYY-MM-DD',
          timeFormat: '24h',
          numberFormat: {
            decimalSeparator: '.',
            thousandsSeparator: ','
          },
          currencyFormat: {
            symbol: '€',
            symbolPosition: 'before',
            decimalPlaces: 2
          },
          firstDayOfWeek: 1,
          weekendDays: [0, 6],
          workingDays: [1, 2, 3, 4, 5],
          measurementUnits: 'metric'
        },
        paymentMethods: {
          supportedMethods: ['card', 'bank_transfer'],
          defaultMethod: 'card',
          currencyConversion: {
            autoConvert: false,
            preferredCurrency: 'EUR'
          },
          localGateways: [],
          vat: {
            included: false,
            defaultRate: 23,
            showTax: true
          },
          invoiceRequirements: {
            requireInvoice: false,
            companyInvoicesOnly: false,
            electronicInvoices: true,
            proformaInvoices: false
          }
        },
        businessRules: {
          workingHours: {
            standardBusinessHours: true,
            lunchBreakRequired: false,
            weekendWorkAllowed: false,
            holidayWorkAllowed: false
          },
          cancellationPolicies: {
            minimumNoticePeriod: 24,
            cancellationFeePolicy: 'standard',
            refundPolicy: 'full_refund'
          },
          bookingRules: {
            maximumAdvanceBooking: 90,
            minimumAdvanceBooking: 1,
            groupBookingMaximumSize: 20,
            depositRequired: false
          },
          paymentRules: {
            paymentDue: 'on_arrival',
            partialPaymentAllowed: false,
            installmentPlans: false,
            minimumPaymentAmount: 0
          },
          legalRequirements: {
            gdprCompliance: true,
            consumerRights: true,
            termsOfService: true,
            privacyPolicy: true
          }
        },
        compliance: {
          gdpr: {
            enabled: true,
            consentRequired: true,
            dataRetentionPeriod: 2555,
            rightToBeForgotten: true,
            dataProcessingAgreement: false
          },
          localRegulations: {
            businessRegistration: false,
            taxIdentification: false,
            professionalLicenses: false,
            healthAndSafety: false
          },
          financialCompliance: {
            amlKycRequired: false,
            sourceOfFundsVerification: false,
            transactionLimits: false,
            reportingRequirements: false
          },
          industryCompliance: {
            beautyIndustryLicense: false,
            fitnessIndustryCertification: false,
            insuranceRequirements: false,
            healthDepartmentCompliance: false
          }
        },
        holidays: {
          publicHolidays: [],
          workingDayAdjustments: [],
          specialBusinessDays: [],
          seasonalAdjustments: []
        }
      },
      features: {
        polishMarket: {
          enabled: false,
          polishLanguage: false,
          polishPaymentMethods: false,
          polishInvoicing: false,
          polishBusinessVerification: false,
          polishHolidays: false,
          polishBusinessHours: false
        },
        realTime: {
          enabled: true,
          websockets: true,
          liveAvailability: true,
          instantNotifications: true,
          realTimeBooking: true
        },
        advanced: {
          groupBookings: true,
          waitlistManagement: true,
          loyaltyProgram: true,
          referralProgram: true,
          advancedAnalytics: true,
          aiRecommendations: false
        },
        integrations: {
          booksySync: true,
          googleCalendar: true,
          outlookCalendar: false,
          emailMarketing: true,
          socialMedia: false,
          paymentGateways: true
        },
        beta: {
          videoConsultations: false,
          virtualTours: false,
          augmentedReality: false,
          mobileApp: false,
          apiV2: false
        },
        experimental: {
          aiBookingAssistant: false,
          predictiveScheduling: false,
          dynamicPricing: false,
          voiceBooking: false
        }
      },
      environment: {
        name: 'production',
        apiEnvironment: 'production',
        debug: false,
        mockData: false,
        logLevel: 'error',
        analytics: {
          enabled: false,
          debugMode: false
        },
        errorReporting: {
          enabled: false
        },
        performanceMonitoring: {
          enabled: false,
          sampleRate: 0.1,
          trackResources: false,
          trackLongTasks: false
        },
        featureFlags: {
          provider: 'local'
        },
        cache: {
          enabled: true,
          ttl: 300,
          maxSize: 1000,
          strategy: 'memory'
        }
      }
    };
  }

  /**
   * Deep merge two objects
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  /**
   * Get API base URL based on environment
   */
  private getApiBaseUrl(): string {
    const env = this.config.environment?.name || 'production';

    switch (env) {
      case 'development':
        return 'http://localhost:8080/api/v1';
      case 'staging':
        return 'https://staging-api.mariia-hub.com/api/v1';
      case 'production':
      default:
        return 'https://api.mariia-hub.com/api/v1';
    }
  }

  /**
   * Get WebSocket URL
   */
  private getWebSocketUrl(): string {
    const baseUrl = this.getApiBaseUrl();
    return baseUrl.replace('http', 'ws').replace('/api/v1', '/ws');
  }

  /**
   * Get user agent string
   */
  private getUserAgent(): string {
    const version = this.getVersion();
    const appName = this.config.sdk?.applicationName || 'Unknown';
    const appVersion = this.config.sdk?.applicationVersion || '0.0.0';

    return `${appName}/${appVersion} MariiaHubSDK-TypeScript/${version}`;
  }

  /**
   * Setup HTTP client interceptors
   */
  private setupHttpClientInterceptors(): void {
    // Request interceptor for authentication
    this.httpClient.addRequestInterceptor(async (config) => {
      // Add authentication header
      const tokens = await this.authManager.getTokens();
      if (tokens.accessToken) {
        config.headers.Authorization = `Bearer ${tokens.accessToken}`;
      }

      // Add region headers
      config.headers['X-Language'] = this.config.regional.language;
      config.headers['X-Currency'] = this.config.regional.currency;
      config.headers['X-Timezone'] = this.config.regional.timeZone;
      config.headers['X-Country'] = this.config.regional.countryCode;

      return config;
    });

    // Response interceptor for error handling
    this.httpClient.addResponseInterceptor(
      (response) => response,
      async (error) => {
        // Handle authentication errors
        if (error.statusCode === 401 && this.authManager.canRefresh()) {
          try {
            await this.authManager.refreshTokens();
            // Retry the original request
            return this.httpClient.request(error.config);
          } catch (refreshError) {
            // Refresh failed, emit auth required event
            this.emit('auth:required', refreshError);
          }
        }

        throw error;
      }
    );
  }

  /**
   * Initialize API endpoints
   */
  private initializeApiEndpoints(): void {
    // Placeholder for API endpoint initialization
    // These will be properly initialized in initializeApiEndpointsAsync
    this.bookings = null;
    this.services = null;
    this.payments = null;
    this.auth = null;
    this.users = null;
    this.admin = null;
    this.websockets = null;
  }

  /**
   * Initialize API endpoints asynchronously
   */
  private async initializeApiEndpointsAsync(): Promise<void> {
    // Import and initialize API classes lazily to avoid circular dependencies
    const { BookingsApi } = await import('../api/BookingsApi');
    const { ServicesApi } = await import('../api/ServicesApi');
    const { PaymentsApi } = await import('../api/PaymentsApi');
    const { AuthApi } = await import('../api/AuthApi');
    const { UsersApi } = await import('../api/UsersApi');
    const { AdminApi } = await import('../api/AdminApi');
    const { WebSocketApi } = await import('../api/WebSocketApi');

    // Initialize API instances
    this.bookings = new BookingsApi(this);
    this.services = new ServicesApi(this);
    this.payments = new PaymentsApi(this);
    this.auth = new AuthApi(this);
    this.users = new UsersApi(this);
    this.admin = new AdminApi(this);
    this.websockets = new WebSocketApi(this);
  }

  /**
   * Ensure client is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new MariiaHubSDKError(
        'SDK client not initialized. Call initialize() first.',
        'SDK_NOT_INITIALIZED'
      );
    }
  }

  /**
   * Handle initialization error
   */
  private handleInitializationError(error: any): void {
    this.metricsCollector.recordCounter('sdk.initialization.errors', 1);
    this.errorHandler.handle(ErrorFactory.fromApiResponse(error));
  }

  /**
   * Handle errors
   */
  private handleError(error: any): void {
    const sdkError = error instanceof MariiaHubSDKError
      ? error
      : ErrorFactory.fromApiResponse(error);

    this.errorHandler.handle(sdkError);
  }

  /**
   * Emit event (simple event emitter implementation)
   */
  private emit(event: string, data?: any): void {
    // Implementation would use a proper event emitter
    // For now, just log if debug is enabled
    if (this.config.sdk?.debug) {
      console.log(`[SDK Event] ${event}:`, data);
    }
  }
}