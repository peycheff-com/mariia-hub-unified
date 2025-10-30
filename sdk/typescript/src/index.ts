/**
 * Mariia Hub TypeScript/JavaScript SDK
 *
 * A comprehensive SDK for the Mariia Hub beauty and fitness booking platform API.
 * Supports both browser and Node.js environments with TypeScript definitions.
 *
 * @author Mariia Hub Team
 * @version 1.0.0
 * @license MIT
 */

// Export all types
export * from './types';

// Export main client
export { MariiaHubClient } from './client/MariiaHubClient';

// Export HTTP client
export { HttpClient } from './client/HttpClient';

// Export utility classes
export { RateLimitManager, AdvancedRateLimitManager } from './client/RateLimitManager';
export { CacheManager, ResponseCacheManager, MultiLevelCacheManager } from './client/CacheManager';

// Export authentication manager
export { AuthenticationManager } from './auth/AuthenticationManager';

// Export WebSocket client
export { WebSocketClient } from './websockets/WebSocketClient';

// Export metrics collector
export { MetricsCollector } from './client/MetricsCollector';

// Export error classes
export {
  MariiaHubSDKError,
  AuthenticationError,
  NetworkError,
  ValidationError,
  RateLimitError,
  PaymentError,
  BookingError,
  ConfigurationError,
  BusinessLogicError,
  ExternalServiceError,
  PolishMarketError,
  WebSocketError,
  ErrorFactory,
  ErrorHandlerRegistry,
  DefaultErrorHandler
} from './types/errors';

// Export configuration utilities
export { DefaultConfigFactory } from './config/DefaultConfigFactory';

// Re-export for convenience
export type {
  MariiaHubSDKConfig,
  SDKConfig,
  ApiClientConfig,
  WebSocketOptions,
  AuthenticationConfig
} from './types/config';

/**
 * Create and configure a new Mariia Hub SDK client
 *
 * @param config - SDK configuration options
 * @returns Configured SDK client instance
 *
 * @example
 * ```typescript
 * import { createMariiaHubClient } from '@mariia-hub/api-client';
 *
 * const client = createMariiaHubClient({
 *   api: {
 *     apiKey: 'your-api-key'
 *   },
 *   regional: {
 *     language: 'pl',
 *     currency: 'PLN'
 *   }
 * });
 *
 * await client.initialize();
 *
 * // Use the client
 * const services = await client.services.list();
 * ```
 */
export function createMariiaHubClient(config?: Partial<MariiaHubSDKConfig>): MariiaHubClient {
  return new MariiaHubClient(config);
}

/**
 * Create a client optimized for the Polish market
 *
 * @param options - Polish market configuration options
 * @returns SDK client configured for Polish market
 *
 * @example
 * ```typescript
 * import { createPolishMarketClient } from '@mariia-hub/api-client';
 *
 * const client = createPolishMarketClient({
 *   businessAccount: true,
 *   enablePolishPaymentMethods: true,
 *   enablePolishInvoicing: true
 * });
 *
 * await client.initialize();
 * ```
 */
export function createPolishMarketClient(options?: {
  businessAccount?: boolean;
  enablePolishPaymentMethods?: boolean;
  enablePolishInvoicing?: boolean;
  enablePolishVerification?: boolean;
}): MariiaHubClient {
  const config: Partial<MariiaHubSDKConfig> = {
    regional: {
      language: 'pl',
      currency: 'PLN',
      timeZone: 'Europe/Warsaw',
      countryCode: 'PL'
    },
    features: {
      polishMarket: {
        enabled: true,
        polishLanguage: true,
        polishPaymentMethods: options?.enablePolishPaymentMethods ?? true,
        polishInvoicing: options?.enablePolishInvoicing ?? true,
        polishBusinessVerification: options?.enablePolishVerification ?? true,
        polishHolidays: true,
        polishBusinessHours: true
      }
    }
  };

  if (options?.businessAccount) {
    config.regional!.paymentMethods!.companyInvoicesOnly = true;
    config.regional!.paymentMethods!.requireInvoice = true;
  }

  return new MariiaHubClient(config);
}

/**
 * Create a client for mobile applications
 *
 * @param config - Additional configuration options
 * @returns SDK client optimized for mobile apps
 *
 * @example
 * ```typescript
 * import { createMobileClient } from '@mariia-hub/api-client';
 *
 * const client = createMobileClient({
 *   api: {
 *     timeout: 15000, // Shorter timeout for mobile
 *     retries: 2      // Fewer retries for mobile
 *   }
 * });
 *
 * await client.initialize();
 * ```
 */
export function createMobileClient(config?: Partial<MariiaHubSDKConfig>): MariiaHubClient {
  const mobileConfig: Partial<MariiaHubSDKConfig> = {
    api: {
      timeout: 15000,
      retries: 2,
      retryDelay: 500
    },
    sdk: {
      enableMetrics: false, // Disable metrics for mobile
      enableAnalytics: false
    },
    websockets: {
      heartbeatInterval: 30000, // Longer heartbeat for mobile
      autoReconnect: true,
      maxReconnectAttempts: 5
    }
  };

  return new MariiaHubClient({ ...mobileConfig, ...config });
}

/**
 * Create a client for server-side applications
 *
 * @param config - Additional configuration options
 * @returns SDK client optimized for server-side use
 *
 * @example
 * ```typescript
 * import { createServerClient } from '@mariia-hub/api-client';
 *
 * const client = createServerClient({
 *   api: {
 *     timeout: 60000, // Longer timeout for server
 *     retries: 5      // More retries for server
 *   }
 * });
 *
 * await client.initialize();
 * ```
 */
export function createServerClient(config?: Partial<MariiaHubSDKConfig>): MariiaHubClient {
  const serverConfig: Partial<MariiaHubSDKConfig> = {
    api: {
      timeout: 60000,
      retries: 5,
      retryDelay: 2000
    },
    sdk: {
      enableMetrics: true,
      enableAnalytics: true,
      debug: false
    },
    environment: {
      name: 'production',
      logLevel: 'warn',
      errorReporting: {
        enabled: true
      }
    }
  };

  return new MariiaHubClient({ ...serverConfig, ...config });
}

/**
 * SDK version
 */
export const SDK_VERSION = '1.0.0';

/**
 * SDK information
 */
export const SDK_INFO = {
  name: '@mariia-hub/api-client',
  version: SDK_VERSION,
  description: 'Mariia Hub API Client SDK for TypeScript/JavaScript',
  author: 'Mariia Hub Team',
  license: 'MIT',
  homepage: 'https://docs.mariia-hub.com/sdk/typescript',
  repository: 'https://github.com/mariia-hub/sdk',
  bugs: 'https://github.com/mariia-hub/sdk/issues',
  engines: {
    node: '>=16.0.0'
  },
  keywords: [
    'mariia-hub',
    'beauty',
    'fitness',
    'booking',
    'api',
    'sdk',
    'typescript',
    'javascript',
    'client'
  ]
};

/**
 * Default export for convenience
 */
export default createMariiaHubClient;