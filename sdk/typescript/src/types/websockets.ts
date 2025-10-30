import { ApiResponse } from './common';

/**
 * WebSocket connection states
 */
export type WebSocketState =
  | 'connecting'
  | 'connected'
  | 'disconnecting'
  | 'disconnected'
  | 'reconnecting'
  | 'error';

/**
 * WebSocket message types
 */
export type WebSocketMessageType =
  | 'connection'
  | 'booking_update'
  | 'availability_update'
  | 'payment_update'
  | 'notification'
  | 'system_message'
  | 'ping'
  | 'pong'
  | 'error'
  | 'auth_required'
  | 'auth_success'
  | 'auth_failed';

/**
 * Base WebSocket message
 */
export interface WebSocketMessage<T = any> {
  id: string;
  type: WebSocketMessageType;
  data: T;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

/**
 * Connection message
 */
export interface ConnectionMessage {
  userId?: string;
  sessionId: string;
  deviceInfo?: string;
  capabilities: string[];
  version: string;
}

/**
 * Booking update message
 */
export interface BookingUpdateMessage {
  bookingId: string;
  status: string;
  updateType: 'created' | 'updated' | 'cancelled' | 'confirmed' | 'completed';
  changes?: Record<string, any>;
  previousStatus?: string;
  newStatus?: string;
  requiresAction: boolean;
  actionUrl?: string;
}

/**
 * Availability update message
 */
export interface AvailabilityUpdateMessage {
  serviceId: string;
  date: string;
  locationType: string;
  availableSlots: TimeSlotUpdate[];
  removedSlots: string[];
  bookingCount: number;
  capacity: number;
  realTime: boolean;
}

/**
 * Time slot update
 */
export interface TimeSlotUpdate {
  id: string;
  time: string;
  available: boolean;
  capacity?: number;
  currentBookings: number;
}

/**
 * Payment update message
 */
export interface PaymentUpdateMessage {
  paymentId: string;
  bookingId: string;
  status: string;
  amount: number;
  currency: string;
  updateType: 'created' | 'succeeded' | 'failed' | 'refunded';
  requiresAction: boolean;
  actionUrl?: string;
  failureReason?: string;
}

/**
 * Notification message
 */
export interface NotificationMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'booking' | 'payment' | 'system' | 'marketing' | 'reminder';
  actionUrl?: string;
  actionText?: string;
  dismissible: boolean;
  expiresAt?: string;
  readAt?: string;
  metadata?: Record<string, any>;
}

/**
 * System message
 */
export interface SystemMessage {
  level: 'info' | 'warning' | 'error' | 'maintenance';
  title: string;
  message: string;
  affectedServices: string[];
  scheduledAt?: string;
  estimatedDuration?: number;
  actionRequired: boolean;
  actionUrl?: string;
}

/**
 * Error message
 */
export interface ErrorMessage {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  requestId?: string;
  retryable: boolean;
}

/**
 * Auth required message
 */
export interface AuthRequiredMessage {
  reason: 'token_expired' | 'invalid_token' | 'session_timeout' | 'permissions_required';
  scopes?: string[];
  authUrl?: string;
  retryAfter?: number;
}

/**
 * Auth success message
 */
export interface AuthSuccessMessage {
  userId: string;
  sessionId: string;
  scopes: string[];
  expiresAt: string;
}

/**
 * Auth failed message
 */
export interface AuthFailedMessage {
  reason: string;
  error: string;
  retryAllowed: boolean;
  retryAfter?: number;
}

/**
 * WebSocket client interface
 */
export interface WebSocketClient {
  /**
   * Connect to WebSocket server
   */
  connect(url?: string, options?: WebSocketOptions): Promise<void>;

  /**
   * Disconnect from WebSocket server
   */
  disconnect(code?: number, reason?: string): void;

  /**
   * Send message to server
   */
  send<T>(type: WebSocketMessageType, data: T): Promise<void>;

  /**
   * Send raw message
   */
  sendRaw(message: WebSocketMessage): Promise<void>;

  /**
   * Subscribe to event type
   */
  subscribe<T>(type: WebSocketMessageType, callback: (message: WebSocketMessage<T>) => void): () => void;

  /**
   * Subscribe to booking updates
   */
  subscribeToBookings(callback: (message: WebSocketMessage<BookingUpdateMessage>) => void): () => void;

  /**
   * Subscribe to availability updates
   */
  subscribeToAvailability(callback: (message: WebSocketMessage<AvailabilityUpdateMessage>) => void): () => void;

  /**
   * Subscribe to payment updates
   */
  subscribeToPayments(callback: (message: WebSocketMessage<PaymentUpdateMessage>) => void): () => void;

  /**
   * Subscribe to notifications
   */
  subscribeToNotifications(callback: (message: WebSocketMessage<NotificationMessage>) => void): () => void;

  /**
   * Get connection state
   */
  getState(): WebSocketState;

  /**
   * Check if connected
   */
  isConnected(): boolean;

  /**
   * Get session ID
   */
  getSessionId(): string | null;

  /**
   * Get user ID
   */
  getUserId(): string | null;

  /**
   * Enable/disable auto-reconnect
   */
  setAutoReconnect(enabled: boolean): void;

  /**
   * Set heartbeat interval
   */
  setHeartbeatInterval(interval: number): void;

  /**
   * Ping the server
   */
  ping(): Promise<number>;

  /**
   * Get connection statistics
   */
  getStats(): WebSocketStats;
}

/**
 * WebSocket connection options
 */
export interface WebSocketOptions {
  /**
   * Authentication token
   */
  token?: string;

  /**
   * API key for authentication
   */
  apiKey?: string;

  /**
   * Session ID to resume
   */
  sessionId?: string;

  /**
   * Auto reconnect settings
   */
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  reconnectBackoffMultiplier?: number;

  /**
   * Heartbeat settings
   */
  heartbeatInterval?: number;
  heartbeatTimeout?: number;

  /**
   * Connection timeout
   */
  connectionTimeout?: number;

  /**
   * Message queue settings
   */
  messageQueueSize?: number;
  persistMessagesOnDisconnect?: boolean;

  /**
   * Debug mode
   */
  debug?: boolean;

  /**
   * Custom headers
   */
  headers?: Record<string, string>;

  /**
   * Custom protocols
   */
  protocols?: string[];

  /**
   * Connection callback
   */
  onConnect?: () => void;

  /**
   * Disconnection callback
   */
  onDisconnect?: (code: number, reason: string) => void;

  /**
   * Error callback
   */
  onError?: (error: Error) => void;

  /**
   * Message callback
   */
  onMessage?: (message: WebSocketMessage) => void;

  /**
   * Reconnection callback
   */
  onReconnect?: (attempt: number) => void;

  /**
   * Authentication callback
   */
  onAuthRequired?: (message: AuthRequiredMessage) => void;

  /**
   * Custom message validation
   */
  validateMessage?: (message: any) => boolean;
}

/**
 * WebSocket statistics
 */
export interface WebSocketStats {
  connectedAt?: string;
  disconnectedAt?: string;
  connectionDuration?: number;
  messagesSent: number;
  messagesReceived: number;
  bytesReceived: number;
  bytesSent: number;
  reconnectAttempts: number;
  lastPingTime?: number;
  lastPongTime?: number;
  averageLatency: number;
  messageQueueSize: number;
  subscriptions: string[];
}

/**
 * WebSocket subscription manager
 */
export interface WebSocketSubscriptionManager {
  /**
   * Subscribe to specific booking
   */
  subscribeToBooking(bookingId: string): Promise<void>;

  /**
   * Unsubscribe from specific booking
   */
  unsubscribeFromBooking(bookingId: string): Promise<void>;

  /**
   * Subscribe to service availability
   */
  subscribeToService(serviceId: string, date?: string): Promise<void>;

  /**
   * Unsubscribe from service availability
   */
  unsubscribeFromService(serviceId: string): Promise<void>;

  /**
   * Subscribe to user notifications
   */
  subscribeToUserNotifications(userId: string): Promise<void>;

  /**
   * Unsubscribe from user notifications
   */
  unsubscribeFromUserNotifications(userId: string): Promise<void>;

  /**
   * Subscribe to admin updates (admin only)
   */
  subscribeToAdminUpdates(): Promise<void>;

  /**
   * Unsubscribe from admin updates
   */
  unsubscribeFromAdminUpdates(): Promise<void>;

  /**
   * Get all active subscriptions
   */
  getSubscriptions(): WebSocketSubscription[];

  /**
   * Clear all subscriptions
   */
  clearSubscriptions(): Promise<void>;
}

/**
 * WebSocket subscription
 */
export interface WebSocketSubscription {
  id: string;
  type: string;
  resource: string;
  filters?: Record<string, any>;
  createdAt: string;
  lastMessageAt?: string;
  messageCount: number;
}

/**
 * WebSocket authentication manager
 */
export interface WebSocketAuthManager {
  /**
   * Authenticate with JWT token
   */
  authenticateWithToken(token: string): Promise<void>;

  /**
   * Authenticate with API key
   */
  authenticateWithApiKey(apiKey: string): Promise<void>;

  /**
   * Refresh authentication
   */
  refreshAuth(): Promise<void>;

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean;

  /**
   * Get auth scopes
   */
  getAuthScopes(): string[];

  /**
   * Check if has scope
   */
  hasScope(scope: string): boolean;

  /**
   * Handle auth challenge
   */
  handleAuthChallenge(message: AuthRequiredMessage): Promise<void>;
}

/**
 * WebSocket message queue
 */
export interface WebSocketMessageQueue {
  /**
   * Add message to queue
   */
  enqueue(message: WebSocketMessage): void;

  /**
   * Get next message from queue
   */
  dequeue(): WebSocketMessage | null;

  /**
   * Peek at next message
   */
  peek(): WebSocketMessage | null;

  /**
   * Get queue size
   */
  size(): number;

  /**
   * Clear queue
   */
  clear(): void;

  /**
   * Get queued messages count by type
   */
  getCountByType(type: WebSocketMessageType): number;

  /**
   * Remove messages by type
   */
  removeByType(type: WebSocketMessageType): number;

  /**
   * Get queued messages
   */
  getMessages(): WebSocketMessage[];
}

/**
 * WebSocket event emitter
 */
export interface WebSocketEventEmitter {
  /**
   * Add event listener
   */
  on<T>(event: string, listener: (data: T) => void): void;

  /**
   * Add one-time event listener
   */
  once<T>(event: string, listener: (data: T) => void): void;

  /**
   * Remove event listener
   */
  off<T>(event: string, listener: (data: T) => void): void;

  /**
   * Remove all listeners
   */
  removeAllListeners(event?: string): void;

  /**
   * Emit event
   */
  emit<T>(event: string, data: T): void;

  /**
   * Get listener count
   */
  listenerCount(event: string): number;

  /**
   * Get event names
   */
  eventNames(): string[];
}

/**
 * WebSocket API interface
 */
export interface WebSocketApi {
  /**
   * Create WebSocket client
   */
  createClient(options?: WebSocketOptions): WebSocketClient;

  /**
   * Get existing client
   */
  getClient(): WebSocketClient | null;

  /**
   * Close all clients
   */
  closeAllClients(): void;

  /**
   * Get connection status
   */
  getConnectionStatus(): WebSocketState;

  /**
   * Test WebSocket connection
   */
  testConnection(): Promise<ApiResponse<boolean>>;

  /**
   * Get server information
   */
  getServerInfo(): Promise<ApiResponse<WebSocketServerInfo>>;

  /**
   * Get available subscriptions
   */
  getAvailableSubscriptions(): Promise<ApiResponse<WebSocketSubscription[]>>;

  /**
   * Get WebSocket usage statistics
   */
  getUsageStats(params?: UsageStatsParams): Promise<ApiResponse<WebSocketUsageStats>>;
}

/**
 * WebSocket server information
 */
export interface WebSocketServerInfo {
  version: string;
  supportedMessageTypes: WebSocketMessageType[];
  maxConnections: number;
  currentConnections: number;
  uptime: number;
  features: string[];
  rateLimits: WebSocketRateLimits;
}

/**
 * WebSocket rate limits
 */
export interface WebSocketRateLimits {
  messagesPerMinute: number;
  connectionsPerHour: number;
  subscriptionsPerConnection: number;
  messageSize: number;
}

/**
 * Usage statistics parameters
 */
export interface UsageStatsParams {
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  messageType?: WebSocketMessageType;
  groupBy?: 'hour' | 'day' | 'type' | 'user';
}

/**
 * WebSocket usage statistics
 */
export interface WebSocketUsageStats {
  totalConnections: number;
  activeConnections: number;
  totalMessages: number;
  messagesByType: Record<WebSocketMessageType, number>;
  averageMessagesPerConnection: number;
  connectionDuration: {
    average: number;
    median: number;
    p95: number;
    p99: number;
  };
  messageLatency: {
    average: number;
    median: number;
    p95: number;
    p99: number;
  };
  errorRate: number;
  reconnectionRate: number;
  subscriptionStats: Record<string, number>;
  timeSeriesData: WebSocketTimeSeriesData[];
}

/**
 * WebSocket time series data
 */
export interface WebSocketTimeSeriesData {
  timestamp: string;
  connections: number;
  messages: number;
  errors: number;
  reconnections: number;
}