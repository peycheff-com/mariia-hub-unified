import { io, Socket } from 'socket.io-client';

import { bookingDomainService, BookingEvent } from './bookingDomainService';

// WebSocket events for real-time updates
export interface WebSocketEvents {
  // Booking events
  'booking:created': { bookingId: string; serviceId: string; status: string };
  'booking:updated': { bookingId: string; status: string };
  'booking:cancelled': { bookingId: string; reason: string };
  'booking:confirmed': { bookingId: string };
  'booking:completed': { bookingId: string };

  // Availability events
  'slot:reserved': { slotId: string; userId: string; expiresAt: Date };
  'slot:released': { slotId: string };
  'slot:booked': { slotId: string; bookingId: string };
  'availability:updated': { serviceType: string; dateRange: [Date, Date] };

  // Admin events
  'admin:notification': { type: string; message: string; data?: any };
  'system:maintenance': { message: string; startTime: Date };
}

export class WebSocketService {
  private static instance: WebSocketService;
  private socket: Socket | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners = new Map<string, Set<Function>>();
  private authToken: string | null = null;

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  // Connection management
  async connect(authToken: string): Promise<void> {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    this.authToken = authToken;
    this.isConnecting = true;

    try {
      // Connect to WebSocket server
      const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:3001';

      this.socket = io(wsUrl, {
        auth: {
          token: authToken,
        },
        transports: ['websocket', 'polling'],
        timeout: 5000,
      });

      this.setupEventHandlers();

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 5000);

        this.socket?.once('connect', () => {
          clearTimeout(timeout);
          this.reconnectAttempts = 0;
          console.log('WebSocket connected');
          resolve();
        });

        this.socket?.once('connect_error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    } catch (error) {
      this.isConnecting = false;
      console.error('Failed to connect WebSocket:', error);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected successfully');
      this.reconnectAttempts = 0;
      this.emit('system:connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.emit('system:disconnected', { reason });

      // Auto-reconnect if not intentional
      if (reason !== 'io client disconnect') {
        this.scheduleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.emit('system:error', { error: error.message });
      this.scheduleReconnect();
    });

    // Booking events
    this.socket.on('booking:created', (data) => {
      console.log('Booking created:', data);
      this.emit('booking:created', data);

      // Forward to domain service
      bookingDomainService.emit({
        type: 'booking.created',
        booking: data.booking,
      });
    });

    this.socket.on('booking:updated', (data) => {
      console.log('Booking updated:', data);
      this.emit('booking:updated', data);

      // Forward to domain service
      bookingDomainService.emit({
        type: 'booking.updated',
        bookingId: data.bookingId,
        status: data.status,
      });
    });

    this.socket.on('booking:cancelled', (data) => {
      console.log('Booking cancelled:', data);
      this.emit('booking:cancelled', data);

      // Forward to domain service
      bookingDomainService.emit({
        type: 'booking.cancelled',
        bookingId: data.bookingId,
        reason: data.reason,
      });
    });

    // Availability events
    this.socket.on('slot:reserved', (data) => {
      console.log('Slot reserved:', data);
      this.emit('slot:reserved', data);

      // Forward to domain service
      bookingDomainService.emit({
        type: 'slot.reserved',
        slotId: data.slotId,
        userId: data.userId,
        expiresAt: data.expiresAt,
      });
    });

    this.socket.on('slot:released', (data) => {
      console.log('Slot released:', data);
      this.emit('slot:released', data);

      // Forward to domain service
      bookingDomainService.emit({
        type: 'slot.released',
        slotId: data.slotId,
      });
    });

    this.socket.on('availability:updated', (data) => {
      console.log('Availability updated:', data);
      this.emit('availability:updated', data);
    });

    // Admin events
    this.socket.on('admin:notification', (data) => {
      console.log('Admin notification:', data);
      this.emit('admin:notification', data);

      // Show toast notification
      this.showNotification(data.message, data.type, data.data);
    });

    this.socket.on('system:maintenance', (data) => {
      console.log('System maintenance:', data);
      this.emit('system:maintenance', data);

      // Show maintenance warning
      this.showNotification(
        `Scheduled maintenance: ${data.message}`,
        'warning',
        { startTime: data.startTime }
      );
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('system:reconnect_failed');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(`Scheduling reconnection in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(async () => {
      if (this.authToken && !this.socket?.connected) {
        try {
          await this.connect(this.authToken);
        } catch (error) {
          console.error('Reconnection failed:', error);
        }
      }
    }, delay);
  }

  // Event emission and listening
  on<T extends keyof WebSocketEvents>(
    event: T,
    callback: (data: WebSocketEvents[T]) => void
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit<T extends keyof WebSocketEvents>(
    event: T,
    data?: WebSocketEvents[T]
  ): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data!);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Room management (for admin multi-user support)
  joinRoom(roomId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_room', roomId);
    }
  }

  leaveRoom(roomId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_room', roomId);
    }
  }

  // Sending events to server
  send<T extends keyof WebSocketEvents>(
    event: T,
    data: WebSocketEvents[T]
  ): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket not connected, cannot send event:', event);
    }
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' | 'reconnecting' {
    if (this.socket?.connected) return 'connected';
    if (this.isConnecting) return 'connecting';
    if (this.reconnectAttempts > 0) return 'reconnecting';
    return 'disconnected';
  }

  private showNotification(
    message: string,
    type: 'info' | 'success' | 'warning' | 'error',
    data?: any
  ): void {
    // This would integrate with your notification system
    // For now, just log it
    console.log(`[${type.toUpperCase()}] ${message}`, data);

    // Emit to any notification listeners
    this.emit('notification', { message, type, data });
  }
}

// Export singleton instance
export const webSocketService = WebSocketService.getInstance();

// React hook for WebSocket integration
import { useEffect, useState, useCallback } from 'react';
// import { useAuth } from '@/contexts/AuthContext'; // Commented out - context not available

export function useWebSocket() {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'reconnecting'>('disconnected');
  // const { user } = useAuth(); // Commented out - context not available
  const [user] = useState<any>(null); // Temporary fix

  useEffect(() => {
    if (!user) {
      webSocketService.disconnect();
      setConnectionStatus('disconnected');
      return;
    }

    const connectWebSocket = async () => {
      try {
        setConnectionStatus('connecting');
        const token = await user.getIdToken();
        await webSocketService.connect(token);
        setConnectionStatus('connected');
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setConnectionStatus('disconnected');
      }
    };

    connectWebSocket();

    // Listen for connection status changes
    const unsubscribeConnected = webSocketService.on('system:connected', () => {
      setConnectionStatus('connected');
    });

    const unsubscribeDisconnected = webSocketService.on('system:disconnected', () => {
      setConnectionStatus('disconnected');
    });

    const unsubscribeError = webSocketService.on('system:error', () => {
      setConnectionStatus('disconnected');
    });

    const unsubscribeReconnecting = webSocketService.on('system:reconnect_failed', () => {
      setConnectionStatus('disconnected');
    });

    return () => {
      unsubscribeConnected();
      unsubscribeDisconnected();
      unsubscribeError();
      unsubscribeReconnecting();
      webSocketService.disconnect();
    };
  }, [user]);

  // Return methods for component usage
  const subscribe = useCallback(<T extends keyof WebSocketEvents>(
    event: T,
    callback: (data: WebSocketEvents[T]) => void
  ) => {
    return webSocketService.on(event, callback);
  }, []);

  const send = useCallback(<T extends keyof WebSocketEvents>(
    event: T,
    data: WebSocketEvents[T]
  ) => {
    webSocketService.send(event, data);
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    webSocketService.joinRoom(roomId);
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    webSocketService.leaveRoom(roomId);
  }, []);

  return {
    isConnected: webSocketService.isConnected(),
    connectionStatus,
    subscribe,
    send,
    joinRoom,
    leaveRoom,
  };
}

// Specific hooks for booking real-time updates
export function useBookingRealTime() {
  const { subscribe } = useWebSocket();

  const onBookingCreated = useCallback(
    (callback: (booking: any) => void) => {
      return subscribe('booking:created', callback);
    },
    [subscribe]
  );

  const onBookingUpdated = useCallback(
    (callback: (data: { bookingId: string; status: string }) => void) => {
      return subscribe('booking:updated', callback);
    },
    [subscribe]
  );

  const onBookingCancelled = useCallback(
    (callback: (data: { bookingId: string; reason: string }) => void) => {
      return subscribe('booking:cancelled', callback);
    },
    [subscribe]
  );

  const onSlotReserved = useCallback(
    (callback: (data: { slotId: string; userId: string; expiresAt: Date }) => void) => {
      return subscribe('slot:reserved', callback);
    },
    [subscribe]
  );

  const onSlotReleased = useCallback(
    (callback: (data: { slotId: string }) => void) => {
      return subscribe('slot:released', callback);
    },
    [subscribe]
  );

  return {
    onBookingCreated,
    onBookingUpdated,
    onBookingCancelled,
    onSlotReserved,
    onSlotReleased,
  };
}

// Admin-specific hook for real-time updates
export function useAdminRealTime() {
  const { subscribe, joinRoom, leaveRoom } = useWebSocket();

  const onNotification = useCallback(
    (callback: (data: { type: string; message: string; data?: any }) => void) => {
      return subscribe('admin:notification', callback);
    },
    [subscribe]
  );

  const onMaintenance = useCallback(
    (callback: (data: { message: string; startTime: Date }) => void) => {
      return subscribe('system:maintenance', callback);
    },
    [subscribe]
  );

  // Join admin room for admin-specific events
  useEffect(() => {
    joinRoom('admin');
    return () => leaveRoom('admin');
  }, [joinRoom, leaveRoom]);

  return {
    onNotification,
    onMaintenance,
  };
}