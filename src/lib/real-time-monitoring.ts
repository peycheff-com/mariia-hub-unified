/**
 * Real-Time Monitoring Service
 * Provides real-time monitoring with WebSocket connections and live data streaming
 * for mariiaborysevych platform
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/services/logger.service';

// Real-time monitoring interfaces
export interface RealTimeMetric {
  id: string;
  type: 'performance' | 'business' | 'system' | 'user' | 'error';
  name: string;
  value: number | string | boolean;
  unit?: string;
  timestamp: number;
  metadata: Record<string, any>;
  tags?: Record<string, string>;
}

export interface RealTimeAlert {
  id: string;
  type: 'performance' | 'business' | 'security' | 'system';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: number;
  metadata: Record<string, any>;
}

export interface UserSession {
  id: string;
  userId?: string;
  startTime: number;
  currentPage: string;
  duration: number;
  interactions: number;
  conversionEvents: number;
  bounceRisk: boolean;
  engagementScore: number;
  deviceType: string;
  location?: string;
  errors: number;
  warnings: number;
}

export interface SystemHealth {
  overall: number; // 0-100
  performance: number;
  availability: number;
  errorRate: number;
  responseTime: number;
  timestamp: number;
  services: {
    supabase: boolean;
    stripe: boolean;
    vercel: boolean;
    cdn: boolean;
    monitoring: boolean;
  };
  resources: {
    cpu: number;
    memory: number;
    storage: number;
    bandwidth: number;
  };
}

export interface RealTimeDashboard {
  activeUsers: number;
  currentBookings: number;
  todayRevenue: number;
  conversionRate: number;
  avgResponseTime: number;
  errorRate: number;
  systemHealth: number;
  alerts: RealTimeAlert[];
  topPages: Array<{
    url: string;
    users: number;
    avgDuration: number;
    bounceRate: number;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: number;
    user?: string;
  }>;
}

export interface MonitoringSubscription {
  id: string;
  type: 'metrics' | 'alerts' | 'sessions' | 'health';
  callback: (data: any) => void;
  filters?: Record<string, any>;
}

class RealTimeMonitoringService {
  private static instance: RealTimeMonitoringService;
  private supabase: any;
  private wsConnection: WebSocket | null = null;
  private subscriptions: Map<string, MonitoringSubscription> = new Map();
  private metrics: RealTimeMetric[] = [];
  private alerts: RealTimeAlert[] = [];
  private sessions: Map<string, UserSession> = new Map();
  private systemHealth: SystemHealth | null = null;
  private dashboardData: RealTimeDashboard;
  private isInitialized = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private heartbeatInterval?: NodeJS.Timeout;

  constructor() {
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
    );

    this.dashboardData = {
      activeUsers: 0,
      currentBookings: 0,
      todayRevenue: 0,
      conversionRate: 0,
      avgResponseTime: 0,
      errorRate: 0,
      systemHealth: 100,
      alerts: [],
      topPages: [],
      recentActivity: []
    };
  }

  static getInstance(): RealTimeMonitoringService {
    if (!RealTimeMonitoringService.instance) {
      RealTimeMonitoringService.instance = new RealTimeMonitoringService();
    }
    return RealTimeMonitoringService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize WebSocket connection
      await this.initializeWebSocket();

      // Initialize real-time subscriptions
      await this.initializeSubscriptions();

      // Start heartbeat monitoring
      this.startHeartbeat();

      // Load initial data
      await this.loadInitialData();

      this.isInitialized = true;
      logger.info('Real-time monitoring initialized');

    } catch (error) {
      logger.error('Failed to initialize real-time monitoring', error);
      throw error;
    }
  }

  private async initializeWebSocket(): Promise<void> {
    const wsUrl = import.meta.env.VITE_MONITORING_WS_URL ||
                  `${import.meta.env.VITE_SUPABASE_URL?.replace('https://', 'wss://')}/realtime/v1`;

    try {
      this.wsConnection = new WebSocket(wsUrl);

      this.wsConnection.onopen = () => {
        logger.info('WebSocket connection established');
        this.reconnectAttempts = 0;
        this.authenticateConnection();
      };

      this.wsConnection.onmessage = (event) => {
        this.handleWebSocketMessage(event);
      };

      this.wsConnection.onclose = () => {
        logger.warn('WebSocket connection closed');
        this.handleReconnection();
      };

      this.wsConnection.onerror = (error) => {
        logger.error('WebSocket error', error);
      };

    } catch (error) {
      logger.error('Failed to initialize WebSocket', error);
      throw error;
    }
  }

  private async authenticateConnection(): Promise<void> {
    if (!this.wsConnection) return;

    try {
      // Authenticate with Supabase realtime
      const { data, error } = await this.supabase.auth.getSession();
      if (data.session?.access_token) {
        this.wsConnection.send(JSON.stringify({
          event: 'auth',
          payload: {
            token: data.session.access_token
          }
        }));
      }

      // Subscribe to monitoring channels
      this.wsConnection.send(JSON.stringify({
        event: 'subscribe',
        payload: {
          channel: 'monitoring_metrics',
          schema: 'public',
          table: 'monitoring_metrics'
        }
      }));

      this.wsConnection.send(JSON.stringify({
        event: 'subscribe',
        payload: {
          channel: 'monitoring_alerts',
          schema: 'public',
          table: 'monitoring_alerts'
        }
      }));

    } catch (error) {
      logger.error('Failed to authenticate WebSocket connection', error);
    }
  }

  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);

      switch (message.event) {
        case 'subscription':
          // Handle subscription confirmation
          break;

        case 'broadcast':
          // Handle broadcast messages
          this.handleBroadcastMessage(message.payload);
          break;

        case 'postgres_changes':
          // Handle database changes
          this.handleDatabaseChange(message.payload);
          break;

        default:
          logger.debug('Unknown WebSocket message type', message.event);
      }

    } catch (error) {
      logger.error('Failed to handle WebSocket message', error);
    }
  }

  private handleBroadcastMessage(payload: any): void {
    const { type, data } = payload;

    switch (type) {
      case 'metric':
        this.addMetric(data);
        break;

      case 'alert':
        this.addAlert(data);
        break;

      case 'system_health':
        this.updateSystemHealth(data);
        break;

      default:
        logger.debug('Unknown broadcast type', type);
    }
  }

  private handleDatabaseChange(payload: any): void {
    const { eventType, table, record, old_record } = payload;

    switch (table) {
      case 'monitoring_metrics':
        if (eventType === 'INSERT') {
          this.addMetric(record);
        }
        break;

      case 'monitoring_alerts':
        if (eventType === 'INSERT') {
          this.addAlert(record);
        } else if (eventType === 'UPDATE') {
          this.updateAlert(record);
        }
        break;

      case 'monitoring_sessions':
        if (eventType === 'INSERT') {
          this.startSession(record);
        } else if (eventType === 'UPDATE') {
          this.updateSession(record);
        }
        break;

      default:
        logger.debug('Unknown table change', table);
    }
  }

  private async initializeSubscriptions(): Promise<void> {
    // Subscribe to Supabase realtime for monitoring tables
    const channels = [
      'monitoring_metrics',
      'monitoring_alerts',
      'monitoring_sessions',
      'monitoring_health_checks'
    ];

    for (const channel of channels) {
      this.supabase
        .channel(`monitoring_${channel}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: channel
        }, (payload: any) => {
          this.handleDatabaseChange(payload);
        })
        .subscribe();
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.wsConnection?.readyState === WebSocket.OPEN) {
        this.wsConnection.send(JSON.stringify({
          event: 'heartbeat',
          timestamp: Date.now()
        }));
      }
    }, 30000); // 30 seconds
  }

  private async loadInitialData(): Promise<void> {
    try {
      // Load recent metrics
      const { data: metrics } = await this.supabase
        .from('monitoring_metrics')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
        .order('timestamp', { ascending: false })
        .limit(100);

      if (metrics) {
        this.metrics = metrics.map(m => ({
          id: m.id,
          type: m.metric_type || 'system',
          name: m.name,
          value: m.value,
          unit: m.unit,
          timestamp: new Date(m.timestamp).getTime(),
          metadata: m.metadata || {},
          tags: m.tags || {}
        }));
      }

      // Load active alerts
      const { data: alerts } = await this.supabase
        .from('monitoring_alerts')
        .select('*')
        .eq('status', 'open')
        .order('triggered_at', { ascending: false });

      if (alerts) {
        this.alerts = alerts.map(a => ({
          id: a.id,
          type: a.alert_type,
          severity: a.severity,
          title: a.title,
          message: a.description,
          timestamp: new Date(a.triggered_at).getTime(),
          acknowledged: a.status === 'acknowledged',
          acknowledgedBy: a.acknowledged_by,
          acknowledgedAt: a.acknowledged_at ? new Date(a.acknowledged_at).getTime() : undefined,
          resolved: a.status === 'resolved',
          resolvedBy: a.resolved_by,
          resolvedAt: a.resolved_at ? new Date(a.resolved_at).getTime() : undefined,
          metadata: a.details || {}
        }));
      }

      // Load active sessions
      const { data: sessions } = await this.supabase
        .from('monitoring_sessions')
        .select('*')
        .is('end_time', null)
        .order('start_time', { ascending: false });

      if (sessions) {
        sessions.forEach(session => {
          this.sessions.set(session.id, {
            id: session.id,
            userId: session.user_id,
            startTime: new Date(session.start_time).getTime(),
            currentPage: session.current_page || '/',
            duration: Date.now() - new Date(session.start_time).getTime(),
            interactions: session.interactions || 0,
            conversionEvents: session.conversion_events || 0,
            bounceRisk: session.bounce_risk || false,
            engagementScore: session.engagement_score || 0,
            deviceType: session.device_type || 'unknown',
            location: session.location,
            errors: session.errors || 0,
            warnings: session.warnings || 0
          });
        });
      }

      // Update dashboard data
      await this.updateDashboardData();

    } catch (error) {
      logger.error('Failed to load initial monitoring data', error);
    }
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff

      setTimeout(() => {
        logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.initializeWebSocket();
      }, delay);
    } else {
      logger.error('Max reconnection attempts reached');
      // Could trigger a fallback monitoring mode here
    }
  }

  // Public API methods

  public subscribe(subscription: Omit<MonitoringSubscription, 'id'>): string {
    const id = crypto.randomUUID();
    const fullSubscription: MonitoringSubscription = { ...subscription, id };

    this.subscriptions.set(id, fullSubscription);

    // Send initial data for immediate feedback
    switch (subscription.type) {
      case 'metrics':
        subscription.callback(this.metrics.slice(-50)); // Last 50 metrics
        break;

      case 'alerts':
        subscription.callback(this.alerts);
        break;

      case 'sessions':
        subscription.callback(Array.from(this.sessions.values()));
        break;

      case 'health':
        subscription.callback(this.systemHealth);
        break;
    }

    return id;
  }

  public unsubscribe(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
  }

  private addMetric(metric: RealTimeMetric): void {
    this.metrics.push(metric);

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Notify subscribers
    this.notifySubscribers('metrics', metric);

    // Update dashboard if needed
    this.updateDashboardData();
  }

  private addAlert(alert: RealTimeAlert): void {
    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Notify subscribers
    this.notifySubscribers('alerts', alert);

    // Update dashboard
    this.updateDashboardData();

    // Send notification for critical alerts
    if (alert.severity === 'critical') {
      this.sendCriticalAlertNotification(alert);
    }
  }

  private updateAlert(alert: Partial<RealTimeAlert> & { id: string }): void {
    const index = this.alerts.findIndex(a => a.id === alert.id);
    if (index !== -1) {
      this.alerts[index] = { ...this.alerts[index], ...alert };
      this.notifySubscribers('alerts', this.alerts[index]);
    }
  }

  private updateSystemHealth(health: SystemHealth): void {
    this.systemHealth = health;
    this.notifySubscribers('health', health);
    this.updateDashboardData();
  }

  private startSession(session: any): void {
    const userSession: UserSession = {
      id: session.id,
      userId: session.user_id,
      startTime: new Date(session.start_time).getTime(),
      currentPage: session.current_page || '/',
      duration: 0,
      interactions: session.interactions || 0,
      conversionEvents: session.conversion_events || 0,
      bounceRisk: session.bounce_risk || false,
      engagementScore: session.engagement_score || 0,
      deviceType: session.device_type || 'unknown',
      location: session.location,
      errors: session.errors || 0,
      warnings: session.warnings || 0
    };

    this.sessions.set(session.id, userSession);
    this.notifySubscribers('sessions', userSession);
    this.updateDashboardData();
  }

  private updateSession(session: any): void {
    const existingSession = this.sessions.get(session.id);
    if (existingSession) {
      existingSession.duration = Date.now() - existingSession.startTime;
      existingSession.currentPage = session.current_page || existingSession.currentPage;
      existingSession.interactions = session.interactions || existingSession.interactions;
      existingSession.conversionEvents = session.conversion_events || existingSession.conversionEvents;
      existingSession.bounceRisk = session.bounce_risk || existingSession.bounceRisk;
      existingSession.engagementScore = session.engagement_score || existingSession.engagementScore;
      existingSession.errors = session.errors || existingSession.errors;
      existingSession.warnings = session.warnings || existingSession.warnings;

      this.notifySubscribers('sessions', existingSession);
      this.updateDashboardData();
    }
  }

  private notifySubscribers(type: string, data: any): void {
    this.subscriptions.forEach((subscription, id) => {
      if (subscription.type === type) {
        try {
          subscription.callback(data);
        } catch (error) {
          logger.error(`Error in subscription ${id}`, error);
        }
      }
    });
  }

  private async updateDashboardData(): Promise<void> {
    try {
      const now = Date.now();
      const hourAgo = now - 60 * 60 * 1000;

      // Calculate active users (sessions in last hour)
      this.dashboardData.activeUsers = Array.from(this.sessions.values())
        .filter(s => now - s.startTime < 60 * 60 * 1000).length;

      // Get today's revenue (would need to query bookings table)
      const { data: todayBookings } = await this.supabase
        .from('bookings')
        .select('total_price')
        .gte('created_at', new Date(now - 24 * 60 * 60 * 1000).toISOString())
        .eq('payment_status', 'completed');

      this.dashboardData.todayRevenue = todayBookings?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;

      // Calculate conversion rate
      const totalSessions = Array.from(this.sessions.values()).length;
      const convertedSessions = Array.from(this.sessions.values())
        .filter(s => s.conversionEvents > 0).length;

      this.dashboardData.conversionRate = totalSessions > 0 ? convertedSessions / totalSessions : 0;

      // Get average response time from recent metrics
      const responseTimeMetrics = this.metrics
        .filter(m => m.name === 'api_response_time' && m.timestamp > hourAgo);

      if (responseTimeMetrics.length > 0) {
        this.dashboardData.avgResponseTime = responseTimeMetrics
          .reduce((sum, m) => sum + (m.value as number), 0) / responseTimeMetrics.length;
      }

      // Calculate error rate
      const errorMetrics = this.metrics
        .filter(m => m.name === 'error_count' && m.timestamp > hourAgo);
      const totalRequests = this.metrics
        .filter(m => m.name === 'request_count' && m.timestamp > hourAgo);

      if (totalRequests.length > 0) {
        const totalErrors = errorMetrics.reduce((sum, m) => sum + (m.value as number), 0);
        const totalReqs = totalRequests.reduce((sum, m) => sum + (m.value as number), 0);
        this.dashboardData.errorRate = totalReqs > 0 ? (totalErrors / totalReqs) * 100 : 0;
      }

      // Update system health
      this.dashboardData.systemHealth = this.systemHealth?.overall || 100;

      // Get active alerts
      this.dashboardData.alerts = this.alerts.filter(a => !a.resolved);

      // Update top pages
      this.updateTopPages();

      // Update recent activity
      this.updateRecentActivity();

    } catch (error) {
      logger.error('Failed to update dashboard data', error);
    }
  }

  private updateTopPages(): void {
    const pageStats = new Map<string, { users: number; totalDuration: number; bounces: number }>();

    this.sessions.forEach(session => {
      const page = session.currentPage;
      if (!pageStats.has(page)) {
        pageStats.set(page, { users: 0, totalDuration: 0, bounces: 0 });
      }

      const stats = pageStats.get(page)!;
      stats.users += 1;
      stats.totalDuration += session.duration;
      if (session.bounceRisk) stats.bounces += 1;
    });

    this.dashboardData.topPages = Array.from(pageStats.entries())
      .map(([url, stats]) => ({
        url,
        users: stats.users,
        avgDuration: stats.users > 0 ? stats.totalDuration / stats.users : 0,
        bounceRate: stats.users > 0 ? (stats.bounces / stats.users) * 100 : 0
      }))
      .sort((a, b) => b.users - a.users)
      .slice(0, 10);
  }

  private updateRecentActivity(): void {
    const recentMetrics = this.metrics
      .filter(m => Date.now() - m.timestamp < 10 * 60 * 1000) // Last 10 minutes
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);

    this.dashboardData.recentActivity = recentMetrics.map(metric => ({
      type: metric.type,
      description: `${metric.name}: ${metric.value}${metric.unit || ''}`,
      timestamp: metric.timestamp,
      user: metric.metadata.userId
    }));
  }

  private async sendCriticalAlertNotification(alert: RealTimeAlert): Promise<void> {
    try {
      // Send to alerting service
      await fetch('/api/alerts/critical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      });

      // Send to webhook if configured
      const webhookUrl = import.meta.env.VITE_CRITICAL_ALERTS_WEBHOOK;
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...alert,
            timestamp: new Date(alert.timestamp).toISOString()
          })
        });
      }

    } catch (error) {
      logger.error('Failed to send critical alert notification', error);
    }
  }

  // Getters for real-time data
  public getDashboardData(): RealTimeDashboard {
    return { ...this.dashboardData };
  }

  public getActiveAlerts(): RealTimeAlert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  public getActiveSessions(): UserSession[] {
    return Array.from(this.sessions.values());
  }

  public getSystemHealth(): SystemHealth | null {
    return this.systemHealth;
  }

  public getRecentMetrics(limit = 100): RealTimeMetric[] {
    return this.metrics.slice(-limit);
  }

  // Manual metric reporting
  public reportMetric(metric: Omit<RealTimeMetric, 'id' | 'timestamp'>): void {
    const fullMetric: RealTimeMetric = {
      ...metric,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    this.addMetric(fullMetric);

    // Store in database
    this.supabase.from('monitoring_metrics').insert({
      name: metric.name,
      value: metric.value,
      unit: metric.unit,
      metric_type: metric.type,
      metadata: metric.metadata,
      tags: metric.tags,
      timestamp: new Date().toISOString()
    }).catch(error => {
      logger.error('Failed to store metric', error);
    });
  }

  public triggerAlert(alert: Omit<RealTimeAlert, 'id' | 'timestamp' | 'acknowledged' | 'resolved'>): void {
    const fullAlert: RealTimeAlert = {
      ...alert,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      acknowledged: false,
      resolved: false
    };

    this.addAlert(fullAlert);

    // Store in database
    this.supabase.from('monitoring_alerts').insert({
      alert_type: alert.type,
      severity: alert.severity,
      title: alert.title,
      description: alert.message,
      details: alert.metadata,
      status: 'open',
      triggered_at: new Date(alert.timestamp).toISOString(),
      environment: import.meta.env.MODE
    }).catch(error => {
      logger.error('Failed to store alert', error);
    });
  }

  public acknowledgeAlert(alertId: string, userId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.acknowledged) {
      alert.acknowledged = true;
      alert.acknowledgedAt = Date.now();
      alert.acknowledgedBy = userId;

      this.updateAlert(alert);

      // Update in database
      this.supabase
        .from('monitoring_alerts')
        .update({
          status: 'acknowledged',
          acknowledged_at: new Date(alert.acknowledgedAt).toISOString(),
          acknowledged_by: userId
        })
        .eq('id', alertId)
        .catch(error => {
          logger.error('Failed to acknowledge alert', error);
        });
    }
  }

  public resolveAlert(alertId: string, userId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      alert.resolvedBy = userId;

      this.updateAlert(alert);

      // Update in database
      this.supabase
        .from('monitoring_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date(alert.resolvedAt).toISOString(),
          resolved_by: userId
        })
        .eq('id', alertId)
        .catch(error => {
          logger.error('Failed to resolve alert', error);
        });
    }
  }

  public destroy(): void {
    // Clear intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Close WebSocket
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }

    // Clear subscriptions
    this.subscriptions.clear();

    // Clear data
    this.metrics = [];
    this.alerts = [];
    this.sessions.clear();
    this.systemHealth = null;

    this.isInitialized = false;
  }
}

// Export singleton instance
export const realTimeMonitoringService = RealTimeMonitoringService.getInstance();

// Export convenience functions
export const initializeRealTimeMonitoring = () => realTimeMonitoringService.initialize();
export const subscribeToMonitoring = (subscription: Omit<MonitoringSubscription, 'id'>) =>
  realTimeMonitoringService.subscribe(subscription);
export const unsubscribeFromMonitoring = (subscriptionId: string) =>
  realTimeMonitoringService.unsubscribe(subscriptionId);
export const getDashboardData = () => realTimeMonitoringService.getDashboardData();
export const reportRealTimeMetric = (metric: Omit<RealTimeMetric, 'id' | 'timestamp'>) =>
  realTimeMonitoringService.reportMetric(metric);
export const triggerRealTimeAlert = (alert: Omit<RealTimeAlert, 'id' | 'timestamp' | 'acknowledged' | 'resolved'>) =>
  realTimeMonitoringService.triggerAlert(alert);

// Auto-initialize in production
if (import.meta.env.PROD) {
  initializeRealTimeMonitoring().catch(console.error);
}