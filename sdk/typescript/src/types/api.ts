import {
  ApiResponse,
  HttpMethod,
  QueryParams,
  RequestConfig,
  FileUploadOptions,
  ListParams
} from './common';

/**
 * Base API client interface
 */
export interface ApiClient {
  /**
   * Make a GET request
   */
  get<T = any>(path: string, params?: QueryParams, config?: RequestConfig): Promise<ApiResponse<T>>;

  /**
   * Make a POST request
   */
  post<T = any>(path: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>>;

  /**
   * Make a PUT request
   */
  put<T = any>(path: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>>;

  /**
   * Make a PATCH request
   */
  patch<T = any>(path: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>>;

  /**
   * Make a DELETE request
   */
  delete<T = any>(path: string, config?: RequestConfig): Promise<ApiResponse<T>>;

  /**
   * Upload a file
   */
  upload<T = any>(path: string, options: FileUploadOptions, config?: RequestConfig): Promise<ApiResponse<T>>;

  /**
   * Download a file
   */
  download(path: string, filename?: string, config?: RequestConfig): Promise<Blob>;

  /**
   * Make a raw request with custom method
   */
  request<T = any>(method: HttpMethod, path: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>>;
}

/**
 * API endpoint configuration
 */
export interface ApiEndpoint {
  method: HttpMethod;
  path: string;
  description?: string;
  parameters?: EndpointParameter[];
  requestBody?: EndpointRequestBody;
  responses?: EndpointResponse[];
  authentication?: AuthenticationRequirement;
  rateLimit?: RateLimitRequirement;
}

/**
 * Endpoint parameter
 */
export interface EndpointParameter {
  name: string;
  in: 'query' | 'path' | 'header';
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  example?: any;
  validation?: ValidationRule;
}

/**
 * Endpoint request body
 */
export interface EndpointRequestBody {
  contentType: string;
  schema: any;
  required: boolean;
  example?: any;
}

/**
 * Endpoint response
 */
export interface EndpointResponse {
  statusCode: number;
  description?: string;
  schema?: any;
  example?: any;
}

/**
 * Validation rule
 */
export interface ValidationRule {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  enum?: string[] | number[];
  format?: string;
}

/**
 * Authentication requirement
 */
export interface AuthenticationRequirement {
  required: boolean;
  types: ('jwt' | 'api_key' | 'oauth')[];
  scopes?: string[];
}

/**
 * Rate limit requirement
 */
export interface RateLimitRequirement {
  requests: number;
  period: number; // in seconds
  burst?: number;
}

/**
 * API client configuration
 */
export interface ApiClientConfig {
  baseURL: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  authentication?: AuthenticationConfig;
  rateLimit?: RateLimitConfig;
  cache?: CacheConfig;
  logging?: LoggingConfig;
}

/**
 * Authentication configuration
 */
export interface AuthenticationConfig {
  type: 'jwt' | 'api_key' | 'oauth';
  credentials: JwtCredentials | ApiKeyCredentials | OAuthCredentials;
  autoRefresh?: boolean;
  refreshBeforeExpiration?: number; // seconds
}

/**
 * JWT credentials
 */
export interface JwtCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

/**
 * API key credentials
 */
export interface ApiKeyCredentials {
  key: string;
  header?: string;
  query?: string;
}

/**
 * OAuth credentials
 */
export interface OAuthCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes?: string[];
  state?: string;
  codeVerifier?: string;
  codeChallenge?: string;
  authorizationCode?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  maxRetries?: number;
  retryDelay?: number;
  burstLimit?: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  enabled: boolean;
  ttl: number; // time to live in seconds
  maxSize?: number; // maximum number of cached items
  strategy?: 'lru' | 'fifo' | 'custom';
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  enabled: boolean;
  level: 'debug' | 'info' | 'warn' | 'error';
  logger?: (level: string, message: string, data?: any) => void;
}

/**
 * API resource interface
 */
export interface ApiResource<T, CreateData = Partial<T>, UpdateData = Partial<T>> {
  /**
   * Get a list of resources
   */
  list(params?: ListParams): Promise<ApiResponse<T[]>>;

  /**
   * Get a single resource by ID
   */
  get(id: string, params?: QueryParams): Promise<ApiResponse<T>>;

  /**
   * Create a new resource
   */
  create(data: CreateData): Promise<ApiResponse<T>>;

  /**
   * Update a resource
   */
  update(id: string, data: UpdateData): Promise<ApiResponse<T>>;

  /**
   * Delete a resource
   */
  delete(id: string): Promise<ApiResponse<void>>;

  /**
   * Search resources
   */
  search(query: string, params?: ListParams): Promise<ApiResponse<T[]>>;
}

/**
 * Cursor-based pagination response
 */
export interface CursorPaginationResponse<T> {
  items: T[];
  cursor?: string;
  hasMore: boolean;
  total?: number;
}

/**
 * GraphQL query interface
 */
export interface GraphQLQuery {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

/**
 * GraphQL response
 */
export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: GraphQLError[];
  extensions?: Record<string, any>;
}

/**
 * GraphQL error
 */
export interface GraphQLError {
  message: string;
  locations?: { line: number; column: number }[];
  path?: (string | number)[];
  extensions?: Record<string, any>;
}

/**
 * Batch request interface
 */
export interface BatchRequest {
  id: string;
  method: HttpMethod;
  path: string;
  data?: any;
}

/**
 * Batch response
 */
export interface BatchResponse {
  id: string;
  status: number;
  data?: any;
  error?: string;
}

/**
 * Bulk operation interface
 */
export interface BulkOperation<T = any> {
  id: string;
  operation: 'create' | 'update' | 'delete';
  data: T[];
  options?: BulkOperationOptions;
}

/**
 * Bulk operation options
 */
export interface BulkOperationOptions {
  skipErrors?: boolean;
  batchSize?: number;
  parallel?: boolean;
  validateOnly?: boolean;
}

/**
 * Bulk operation result
 */
export interface BulkOperationResult<T = any> {
  operationId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  results?: BulkItemResult<T>[];
  errors?: string[];
  startedAt: string;
  completedAt?: string;
}

/**
 * Individual bulk item result
 */
export interface BulkItemResult<T = any> {
  index: number;
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * API metrics
 */
export interface ApiMetrics {
  requestCount: number;
  successCount: number;
  errorCount: number;
  averageResponseTime: number;
  lastRequestTime?: string;
  endpoints: Record<string, EndpointMetrics>;
}

/**
 * Endpoint-specific metrics
 */
export interface EndpointMetrics {
  requests: number;
  successes: number;
  errors: number;
  averageResponseTime: number;
  lastAccessTime?: string;
  statusCodeCounts: Record<number, number>;
}