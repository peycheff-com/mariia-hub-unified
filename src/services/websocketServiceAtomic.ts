import { io, Socket } from 'socket.io-client';

import { logger } from '@/lib/logger';

import { BookingEvent } from './bookingDomainServiceAtomic';
import { cacheServiceAtomic } from './cacheServiceAtomic';

// WebSocket configuration
const WS_CONFIG = {
  url: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
  timeout: 5000,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  autoConnect: true,
};

// WebSocket events
type WSEvent =
  | 'availability:updated'
  | 'slot:reserved'
  | 'slot:released'
  | 'booking:created'
  | 'booking:updated'
  | 'booking:cancelled'
  | 'cache:invalidated'
  | 'lock:acquired'
  | 'lock:released'
  | 'conflict:detected'
  | 'system:heartbeat';

// Event payloads
interface AvailabilityUpdatePayload {
  serviceId: string;
  location: string;
  date: string;
  slots: any[];
  version: number;
  timestamp: Date;
  transactionId?: string;
}

interface SlotEventPayload {
  slotId: string;
  userId: string;
  serviceId: string;
  expiresAt?: Date;
  version: number;
  timestamp: Date;
}

interface BookingEventPayload {
  bookingId: string;
  serviceId: string;
  userId: string;
  status: string;
  timestamp: Date;
  transactionId?: string;
}

interface ConflictPayload {
  type: 'HOLD_CONFLICT' | 'BOOKING_CONFLICT' | 'CACHE_CONFLICT';
  details: any;
  timestamp: Date;
  resolved: boolean;
}

interface LockPayload {
  key: string;
  owner: string;
  expiresAt: Date;
  version: number;
  timestamp: Date;
}

interface CacheInvalidationPayload {
  keys: string[];
  reason: string;
  timestamp: Date;
  transactionId?: string;
}

// WebSocket message types
interface WSMessage {
  id: string;
  type: WSEvent;
  payload: any;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

// Client state
interface ClientState {
  connected: boolean;
  reconnecting: boolean;
  subscriptions: Set<string>;
  lastHeartbeat: Date;
  pendingMessages: WSMessage[];
  messageQueue: WSMessage[];
}

/**
 * Atomic WebSocket Service for Real-time Updates
 *
 * Provides real-time synchronization of:
 * - Availability updates
 * - Slot reservations and releases
 * - Booking events
 * - Cache invalidations
 * - Conflict detection and resolution
 * - Lock status
 */
export class WebSocketServiceAtomic {
  private static instance: WebSocketServiceAtomic;
  private socket: Socket | null = null;
  private state: ClientState = {
    connected: false,
    reconnecting: false,
    subscriptions: new Set(),
    lastHeartbeat: new Date(),
    pendingMessages: [],
    messageQueue: []
  };
  private eventListeners = new Map<WSEvent, Set<Function>>();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageAckTimeout = new Map<string, NodeJS.Timeout>();

  static getInstance(): WebSocketServiceAtomic {
    if (!WebSocketServiceAtomic.instance) {
      WebSocketServiceAtomic.instance = new WebSocketServiceAtomic();
    }
    return WebSocketServiceAtomic.instance;
  }

  // Connection management
  async connect(userId?: string): Promise<void> {
    if (this.socket?.connected) {
      logger.debug('WebSocket already connected');
      return;
    }

    try {
      const socketOptions = {
        ...WS_CONFIG,
        auth: userId ? { userId } : undefined,
        transports: ['websocket', 'polling'],
      };

      this.socket = io(WS_CONFIG.url, socketOptions);
      this.setupEventHandlers();

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
        }, WS_CONFIG.timeout);

        this.socket!.once('connect', () => {
          clearTimeout(timeout);
          resolve();
        });

        this.socket!.once('connect_error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      this.state.connected = true;
      this.state.lastHeartbeat = new Date();

      // Start heartbeat
      this.startHeartbeat();

      // Process message queue
      this.processMessageQueue();

      logger.info('WebSocket connected', { userId });

    } catch (error) {
      logger.error('Failed to connect WebSocket:', error);
      this.state.connected = false;
      throw error;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.state.connected = false;
    this.clearTimers();

    logger.info('WebSocket disconnected');
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.state.connected = true;
      this.state.reconnecting = false;
      this.state.lastHeartbeat = new Date();
      logger.info('WebSocket reconnected');

      // Re-subscribe to previous subscriptions
      this.resubscribeAll();
    });

    this.socket.on('disconnect', (reason) => {
      this.state.connected = false;
      logger.warn('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      logger.error('WebSocket connection error:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      logger.info(`WebSocket reconnected after ${attemptNumber} attempts`);
      this.state.reconnecting = false;
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      this.state.reconnecting = true;
      logger.debug(`WebSocket reconnection attempt ${attemptNumber}`);
    });

    this.socket.on('reconnect_failed', () => {
      logger.error('WebSocket reconnection failed');
      this.state.reconnecting = false;
    });

    // Message handlers
    this.socket.on('message', (message: WSMessage) => {
      this.handleMessage(message);
    });

    this.socket.on('availability:updated', (payload: AvailabilityUpdatePayload) => {
      this.emit('availability:updated', payload);
    });

    this.socket.on('slot:reserved', (payload: SlotEventPayload) => {
      this.emit('slot:reserved', payload);
    });

    this.socket.on('slot:released', (payload: SlotEventPayload) => {
      this.emit('slot:released', payload);
    });

    this.socket.on('booking:created', (payload: BookingEventPayload) => {
      this.emit('booking:created', payload);
    });

    this.socket.on('booking:updated', (payload: BookingEventPayload) => {
      this.emit('booking:updated', payload);
    });

    this.socket.on('booking:cancelled', (payload: BookingEventPayload) => {
      this.emit('booking:cancelled', payload);
    });

    this.socket.on('cache:invalidated', (payload: CacheInvalidationPayload) => {
      this.emit('cache:invalidated', payload);
    });

    this.socket.on('conflict:detected', (payload: ConflictPayload) => {
      this.emit('conflict:detected', payload);
    });

    this.socket.on('system:heartbeat', (payload: { timestamp: Date }) => {
      this.state.lastHeartbeat = new Date(payload.timestamp);
    });
  }

  // Message handling
  private async handleMessage(message: WSMessage): Promise<void> {
    try {
      logger.debug(`Received WebSocket message: ${message.type}`, message);

      // Send acknowledgment
      this.sendAck(message.id);

      // Handle message based on type
      switch (message.type) {
        case 'availability:updated':
          await this.handleAvailabilityUpdate(message.payload);
          break;
        case 'slot:reserved':
          await this.handleSlotReserved(message.payload);
          break;
        case 'slot:released':
          await this.handleSlotReleased(message.payload);
          break;
        case 'booking:created':
        case 'booking:updated':
        case 'booking:cancelled':
          await this.handleBookingEvent(message.payload);
          break;
        case 'cache:invalidated':
          await this.handleCacheInvalidation(message.payload);
          break;
        case 'conflict:detected':
          await this.handleConflictDetected(message.payload);
          break;
        default:
          logger.debug(`Unhandled message type: ${message.type}`);
      }

    } catch (error) {
      logger.error('Error handling WebSocket message:', error);
    }
  }

  private async handleAvailabilityUpdate(payload: AvailabilityUpdatePayload): Promise<void> {
    try {
      // Update local cache with new availability
      const cachedAvailability = await cacheServiceAtomic.getAvailabilityAtomic(
        payload.serviceId,
        payload.location as any,
        new Date(payload.date),
        payload.version
      );

      if (cachedAvailability && cachedAvailability.version < payload.version) {
        // Update cache with newer data
        await cacheServiceAtomic.cacheAvailabilityAtomic(
          payload.serviceId,
          payload.location as any,
          new Date(payload.date),
          payload.slots,
          [],
          [],
          payload.transactionId
        );
      }

    } catch (error) {
      logger.error('Error handling availability update:', error);
    }
  }

  private async handleSlotReserved(payload: SlotEventPayload): Promise<void> {
    try {
      // Invalidate availability cache for the affected service
      const tags = [`availability:${payload.serviceId}`];
      await cacheServiceAtomic.invalidateByTags(
        tags,
        'immediate',
        `Slot reserved: ${payload.slotId}`,
        'slot-reservation'
      );

    } catch (error) {
      logger.error('Error handling slot reservation:', error);
    }
  }

  private async handleSlotReleased(payload: SlotEventPayload): Promise<void> {
    try {
      // Invalidate availability cache for the affected service
      const tags = [`availability:${payload.serviceId}`];
      await cacheServiceAtomic.invalidateByTags(
        tags,
        'immediate',
        `Slot released: ${payload.slotId}`,
        'slot-release'
      );

    } catch (error) {
      logger.error('Error handling slot release:', error);
    }
  }

  private async handleBookingEvent(payload: BookingEventPayload): Promise<void> {
    try {
      // Invalidate relevant caches
      const tags = [
        `availability:${payload.serviceId}`,
        `user_bookings:${payload.userId}`
      ];

      await cacheServiceAtomic.invalidateByTags(
        tags,
        'immediate',
        `Booking ${payload.type}: ${payload.bookingId}`,
        payload.transactionId
      );

    } catch (error) {
      logger.error('Error handling booking event:', error);
    }
  }

  private async handleCacheInvalidation(payload: CacheInvalidationPayload): Promise<void> {
    try {
      await cacheServiceAtomic.invalidateAtomic(
        payload.keys,
        'immediate',
        payload.reason,
        payload.transactionId
      );

    } catch (error) {
      logger.error('Error handling cache invalidation:', error);
    }
  }

  private async handleConflictDetected(payload: ConflictPayload): Promise<void> {
    try {
      logger.warn('Conflict detected via WebSocket:', payload);

      // Invalidate affected caches
      if (payload.details.serviceId) {
        const tags = [`availability:${payload.details.serviceId}`];
        await cacheServiceAtomic.invalidateByTags(
          tags,
          'immediate',
          `Conflict detected: ${payload.type}`,
          'conflict-resolution'
        );
      }

      // Emit conflict event for UI handling
      this.emit('conflict:detected', payload);

    } catch (error) {
      logger.error('Error handling conflict detection:', error);
    }
  }

  // Publishing methods
  publishAvailabilityUpdate(payload: AvailabilityUpdatePayload): void {
    const message: WSMessage = {
      id: this.generateMessageId(),
      type: 'availability:updated',
      payload,
      timestamp: new Date()
    };

    this.sendMessage(message);
  }

  publishSlotEvent(type: 'slot:reserved' | 'slot:released', payload: SlotEventPayload): void {
    const message: WSMessage = {
      id: this.generateMessageId(),
      type,
      payload,
      timestamp: new Date()
    };

    this.sendMessage(message);
  }

  publishBookingEvent(type: 'booking:created' | 'booking:updated' | 'booking:cancelled', payload: BookingEventPayload): void {
    const message: WSMessage = {
      id: this.generateMessageId(),
      type,
      payload,
      timestamp: new Date()
    };

    this.sendMessage(message);
  }

  publishConflictDetected(payload: ConflictPayload): void {
    const message: WSMessage = {
      id: this.generateMessageId(),
      type: 'conflict:detected',
      payload,
      timestamp: new Date()
    };

    this.sendMessage(message);
  }

  publishCacheInvalidation(payload: CacheInvalidationPayload): void {
    const message: WSMessage = {
      id: this.generateMessageId(),
      type: 'cache:invalidated',
      payload,
      timestamp: new Date()
    };

    this.sendMessage(message);
  }

  private sendMessage(message: WSMessage): void {
    if (this.socket?.connected) {
      this.socket.emit('message', message);

      // Set timeout for acknowledgment
      this.messageAckTimeout.set(message.id, setTimeout(() => {
        logger.warn(`Message acknowledgment timeout: ${message.id}`);
        // Could retry or mark as failed
      }, 10000));

    } else {
      // Queue message for later sending
      this.state.messageQueue.push(message);
      logger.debug(`Message queued: ${message.type}`);
    }
  }

  private sendAck(messageId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('ack', { messageId });
    }

    // Clear timeout
    const timeout = this.messageAckTimeout.get(messageId);
    if (timeout) {
      clearTimeout(timeout);
      this.messageAckTimeout.delete(messageId);
    }
  }

  private processMessageQueue(): void {
    while (this.state.messageQueue.length > 0 && this.socket?.connected) {
      const message = this.state.messageQueue.shift()!;
      this.sendMessage(message);
    }
  }

  // Subscription management
  subscribe(pattern: string): void {
    if (this.socket?.connected) {
      this.socket.emit('subscribe', { pattern });
    }

    this.state.subscriptions.add(pattern);
  }

  unsubscribe(pattern: string): void {
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe', { pattern });
    }

    this.state.subscriptions.delete(pattern);
  }

  private resubscribeAll(): void {
    for (const pattern of this.state.subscriptions) {
      this.subscribe(pattern);
    }
  }

  // Heartbeat management
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('heartbeat', { timestamp: new Date() });
      }
    }, 30000); // Every 30 seconds
  }

  // Utility methods
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    for (const timeout of this.messageAckTimeout.values()) {
      clearTimeout(timeout);
    }
    this.messageAckTimeout.clear();
  }

  // Event handling
  on(event: WSEvent, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  off(event: WSEvent, listener: Function): void {
    this.eventListeners.get(event)?.delete(listener);
  }

  private emit(event: WSEvent, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          logger.error(`Error in WebSocket event listener:`, error);
        }
      });
    }
  }

  // Health monitoring
  isHealthy(): boolean {
    const now = new Date();
    const timeSinceLastHeartbeat = now.getTime() - this.state.lastHeartbeat.getTime();

    return this.state.connected &&
           !this.state.reconnecting &&
           timeSinceLastHeartbeat < 120000; // 2 minutes
  }

  getConnectionState(): ClientState {
    return { ...this.state };
  }

  getStats(): any {
    return {
      connected: this.state.connected,
      reconnecting: this.state.reconnecting,
      subscriptions: this.state.subscriptions.size,
      lastHeartbeat: this.state.lastHeartbeat,
      queuedMessages: this.state.messageQueue.length,
      pendingAcknowledgments: this.messageAckTimeout.size
    };
  }
}

// Export singleton instance
export const webSocketServiceAtomic = WebSocketServiceAtomic.getInstance();