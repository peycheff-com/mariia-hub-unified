/**
 * Real-time Monitoring Service
 * Provides WebSocket-based real-time updates for monitoring dashboard
 */

import { io, Socket } from 'socket.io-client';

import { healthCheckService, HealthCheckResult } from '@/lib/health-check';
import { alertingService, Alert } from '@/lib/alerting';
import { logger } from '@/lib/logger';

import { monitoringService } from './monitoringService';

export interface RealtimeEvent {
  type: 'health_update' | 'alert_triggered' | 'alert_resolved' | 'metric_update' | 'system_status';
  timestamp: string;
  data: any;
}

export interface MetricUpdate {
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  unit?: string;
}

export interface SystemStatus {
  healthScore: number;
  activeAlerts: number;
  activeUsers: number;
  errorRate: number;
  avgResponseTime: number;
  timestamp: string;
}

class RealtimeMonitoringService {
  private static instance: RealtimeMonitoringService;
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private subscribers: Map<string, Set<(event: RealtimeEvent) => void>> = new Map();
  private isConnected = false;
  private connectionTimeout?: NodeJS.Timeout;
  private heartbeatInterval?: NodeJS.Timeout;
  private lastHeartbeat = Date.now();

  private constructor() {}

  static getInstance(): RealtimeMonitoringService {
    if (!RealtimeMonitoringService.instance) {
      RealtimeMonitoringService.instance = new RealtimeMonitoringService();
    }
    return RealtimeMonitoringService.instance;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      try {
        // Connect to the monitoring WebSocket server
        const wsUrl = import.meta.env.VITE_MONITORING_WS_URL ||
                     `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/monitoring`;

        this.socket = io(wsUrl, {
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
        });

        this.socket.on('connect', () => {
          logger.info('Real-time monitoring connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit('connection_status', {
            type: 'connection_status',
            timestamp: new Date().toISOString(),
            data: { status: 'connected' }
          });
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          logger.info('Real-time monitoring disconnected:', reason);
          this.isConnected = false;
          this.stopHeartbeat();
          this.emit('connection_status', {
            type: 'connection_status',
            timestamp: new Date().toISOString(),
            data: { status: 'disconnected', reason }
          });
        });

        this.socket.on('connect_error', (error) => {
          logger.error('Real-time monitoring connection error:', error);
          this.reconnectAttempts++;

          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.emit('connection_status', {
              type: 'connection_status',
              timestamp: new Date().toISOString(),
              data: { status: 'failed', error: error.message }
            });
            reject(new Error(`Failed to connect after ${this.maxReconnectAttempts} attempts`));
          }
        });

        // Set up event listeners
        this.setupEventListeners();

        // Set connection timeout
        this.connectionTimeout = setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    this.stopHeartbeat();
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnected = false;
    logger.info('Real-time monitoring disconnected');
  }

  /**
   * Check if connected
   */
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected || false;
  }

  /**
   * Setup event listeners for monitoring events
   */
  private setupEventListeners() {
    if (!this.socket) return;

    // Health check updates
    this.socket.on('health_update', (data: HealthCheckResult) => {
      this.emit('health_update', {
        type: 'health_update',
        timestamp: new Date().toISOString(),
        data
      });
    });

    // Alert events
    this.socket.on('alert_triggered', (alert: Alert) => {
      this.emit('alert_triggered', {
        type: 'alert_triggered',
        timestamp: new Date().toISOString(),
        data: alert
      });

      // Also trigger local alert handling
      this.handleAlertTriggered(alert);
    });

    this.socket.on('alert_resolved', (alert: Alert) => {
      this.emit('alert_resolved', {
        type: 'alert_resolved',
        timestamp: new Date().toISOString(),
        data: alert
      });
    });

    // Metric updates
    this.socket.on('metric_update', (update: MetricUpdate) => {
      this.emit('metric_update', {
        type: 'metric_update',
        timestamp: new Date().toISOString(),
        data: update
      });
    });

    // System status updates
    this.socket.on('system_status', (status: SystemStatus) => {
      this.emit('system_status', {
        type: 'system_status',
        timestamp: new Date().toISOString(),
        data: status
      });
    });

    // Performance alerts
    this.socket.on('performance_alert', (data: any) => {
      this.emit('performance_alert', {
        type: 'performance_alert',
        timestamp: new Date().toISOString(),
        data
      });
    });

    // Error events
    this.socket.on('error_event', (error: any) => {
      this.emit('error_event', {
        type: 'error_event',
        timestamp: new Date().toISOString(),
        data: error
      });
    });

    // Business metrics updates
    this.socket.on('business_metric', (metric: any) => {
      this.emit('business_metric', {
        type: 'business_metric',
        timestamp: new Date().toISOString(),
        data: metric
      });
    });

    // User activity updates
    this.socket.on('user_activity', (activity: any) => {
      this.emit('user_activity', {
        type: 'user_activity',
        timestamp: new Date().toISOString(),
        data: activity
      });
    });
  }

  /**
   * Subscribe to specific event types
   */
  subscribe(eventType: string, callback: (event: RealtimeEvent) => void): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }

    const subscribers = this.subscribers.get(eventType)!;
    subscribers.add(callback);

    // Return unsubscribe function
    return () => {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        this.subscribers.delete(eventType);
      }
    };
  }

  /**
   * Emit event to subscribers
   */
  private emit(eventType: string, event: RealtimeEvent) {
    const subscribers = this.subscribers.get(eventType);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          logger.error(`Error in realtime event subscriber for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Send health check results to server
   */
  async sendHealthUpdate(results: HealthCheckResult) {
    if (this.socket?.connected) {
      this.socket.emit('health_check_complete', results);
    }
  }

  /**
   * Send metric update to server
   */
  sendMetricUpdate(metric: MetricUpdate) {
    if (this.socket?.connected) {
      this.socket.emit('metric_update', metric);
    }
  }

  /**
   * Send system status to server
   */
  sendSystemStatus(status: SystemStatus) {
    if (this.socket?.connected) {
      this.socket.emit('system_status', status);
    }
  }

  /**
   * Handle alert triggered
   */
  private handleAlertTriggered(alert: Alert) {
    // Update local alerting service
    if (alertingService) {
      // This would update the local alerting service state
      logger.info('Real-time alert received:', alert);
    }

    // Send notification if it's critical
    if (alert.severity === 'critical') {
      this.sendBrowserNotification(alert);
    }
  }

  /**
   * Send browser notification for critical alerts
   */
  private sendBrowserNotification(alert: Alert) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Critical Alert: ' + alert.title, {
        body: alert.message,
        icon: '/favicon.ico',
        tag: alert.id,
        requireInteraction: true
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.sendBrowserNotification(alert);
        }
      });
    }
  }

  /**
   * Start heartbeat to maintain connection
   */
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('heartbeat', { timestamp: Date.now() });
        this.lastHeartbeat = Date.now();
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      lastHeartbeat: this.lastHeartbeat,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id
    };
  }

  /**
   * Request historical data
   */
  requestHistoricalData(type: string, timeRange: string) {
    if (this.socket?.connected) {
      this.socket.emit('request_history', { type, timeRange });
    }
  }

  /**
   * Join monitoring room
   */
  joinMonitoringRoom(room: string) {
    if (this.socket?.connected) {
      this.socket.emit('join_room', room);
    }
  }

  /**
   * Leave monitoring room
   */
  leaveMonitoringRoom(room: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave_room', room);
    }
  }

  /**
   * Subscribe to specific metric updates
   */
  subscribeToMetrics(metrics: string[]) {
    if (this.socket?.connected) {
      this.socket.emit('subscribe_metrics', metrics);
    }
  }

  /**
   * Unsubscribe from specific metrics
   */
  unsubscribeFromMetrics(metrics: string[]) {
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe_metrics', metrics);
    }
  }
}

// Export singleton instance
export const realtimeMonitoringService = RealtimeMonitoringService.getInstance();

// Export convenience functions
export const connectRealtimeMonitoring = () => realtimeMonitoringService.connect();
export const disconnectRealtimeMonitoring = () => realtimeMonitoringService.disconnect();
export const subscribeToRealtimeEvents = (eventType: string, callback: (event: RealtimeEvent) => void) =>
  realtimeMonitoringService.subscribe(eventType, callback);

// React hook for real-time monitoring
import { useEffect, useState, useCallback } from 'react';

export function useRealtimeMonitoring() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [latestEvent, setLatestEvent] = useState<RealtimeEvent | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeMonitoring = async () => {
      try {
        await realtimeMonitoringService.connect();
        setIsConnected(true);

        // Subscribe to connection status updates
        unsubscribe = realtimeMonitoringService.subscribe('connection_status', (event) => {
          setConnectionStatus(event.data);
          setIsConnected(event.data.status === 'connected');
        });

      } catch (error) {
        logger.error('Failed to initialize real-time monitoring:', error);
        setIsConnected(false);
      }
    };

    initializeMonitoring();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const subscribeToEvent = useCallback((eventType: string, callback: (event: RealtimeEvent) => void) => {
    return realtimeMonitoringService.subscribe(eventType, (event) => {
      setLatestEvent(event);
      callback(event);
    });
  }, []);

  const subscribeToHealthUpdates = useCallback((callback: (event: RealtimeEvent) => void) => {
    return subscribeToEvent('health_update', callback);
  }, [subscribeToEvent]);

  const subscribeToAlerts = useCallback((callback: (event: RealtimeEvent) => void) => {
    const unsubscribeAlerts = subscribeToEvent('alert_triggered', callback);
    const unsubscribeResolved = subscribeToEvent('alert_resolved', callback);

    return () => {
      unsubscribeAlerts();
      unsubscribeResolved();
    };
  }, [subscribeToEvent]);

  const subscribeToMetrics = useCallback((callback: (event: RealtimeEvent) => void) => {
    return subscribeToEvent('metric_update', callback);
  }, [subscribeToEvent]);

  const subscribeToSystemStatus = useCallback((callback: (event: RealtimeEvent) => void) => {
    return subscribeToEvent('system_status', callback);
  }, [subscribeToEvent]);

  return {
    isConnected,
    connectionStatus,
    latestEvent,
    subscribeToEvent,
    subscribeToHealthUpdates,
    subscribeToAlerts,
    subscribeToMetrics,
    subscribeToSystemStatus,
    sendHealthUpdate: (results: HealthCheckResult) => realtimeMonitoringService.sendHealthUpdate(results),
    sendMetricUpdate: (metric: MetricUpdate) => realtimeMonitoringService.sendMetricUpdate(metric),
    requestHistoricalData: (type: string, timeRange: string) => realtimeMonitoringService.requestHistoricalData(type, timeRange),
    joinRoom: (room: string) => realtimeMonitoringService.joinMonitoringRoom(room),
    leaveRoom: (room: string) => realtimeMonitoringService.leaveMonitoringRoom(room),
  };
}

// Export types for use in components
export type { RealtimeEvent, MetricUpdate, SystemStatus };