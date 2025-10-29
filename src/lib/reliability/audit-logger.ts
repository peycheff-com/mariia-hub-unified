import { supabase } from '@/integrations/supabase/client';

import { AuditEvent } from './types';

interface AuditFilter {
  userId?: string;
  action?: string;
  resource?: string;
  outcome?: 'success' | 'failure' | 'error';
  startDate?: string;
  endDate?: string;
  ipAddress?: string;
}

interface AuditStats {
  totalEvents: number;
  eventsByAction: Record<string, number>;
  eventsByResource: Record<string, number>;
  eventsByOutcome: Record<string, number>;
  eventsByHour: Record<string, number>;
  topUsers: Array<{ userId: string; count: number }>;
  failureRate: number;
}

export class AuditLogger {
  private client = supabase;
  private buffer: AuditEvent[] = [];
  private batchSize = 100;
  private flushInterval: NodeJS.Timeout | null = null;
  private isFlushing = false;

  constructor() {
    this.startBatchFlush();
  }

  log(event: Omit<AuditEvent, 'id' | 'timestamp'>): void {
    const auditEvent: AuditEvent = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...event
    };

    // Add to buffer for batch processing
    this.buffer.push(auditEvent);

    // Immediate flush for critical events
    if (this.isCriticalEvent(event)) {
      this.flushSync([auditEvent]);
    }

    // Auto-flush if buffer is full
    if (this.buffer.length >= this.batchSize) {
      this.flush();
    }
  }

  async logAsync(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    return new Promise((resolve) => {
      this.log(event);
      resolve();
    });
  }

  logAuthEvent(userId: string, action: string, outcome: 'success' | 'failure' | 'error', details?: Record<string, any>) {
    this.log({
      userId,
      action: `auth.${action}`,
      resource: 'auth',
      outcome,
      details: details || {},
      context: {
        category: 'authentication',
        sensitive: true
      }
    });
  }

  logDataEvent(userId: string, action: string, resource: string, outcome: 'success' | 'failure' | 'error', details?: Record<string, any>) {
    this.log({
      userId,
      action: `data.${action}`,
      resource,
      outcome,
      details: details || {},
      context: {
        category: 'data_access'
      }
    });
  }

  logSystemEvent(action: string, resource: string, outcome: 'success' | 'failure' | 'error', details?: Record<string, any>) {
    this.log({
      action: `system.${action}`,
      resource,
      outcome,
      details: details || {},
      context: {
        category: 'system',
        automated: true
      }
    });
  }

  logApiEvent(action: string, resource: string, outcome: 'success' | 'failure' | 'error', details?: Record<string, any>) {
    this.log({
      action: `api.${action}`,
      resource,
      outcome,
      details: details || {},
      context: {
        category: 'api'
      }
    });
  }

  logSecurityEvent(action: string, resource: string, outcome: 'success' | 'failure' | 'error', details?: Record<string, any>) {
    this.log({
      action: `security.${action}`,
      resource,
      outcome,
      details: details || {},
      context: {
        category: 'security',
        sensitive: true,
        priority: 'high'
      }
    });
  }

  logBusinessEvent(userId: string, action: string, resource: string, outcome: 'success' | 'failure' | 'error', details?: Record<string, any>) {
    this.log({
      userId,
      action: `business.${action}`,
      resource,
      outcome,
      details: details || {},
      context: {
        category: 'business'
      }
    });
  }

  private isCriticalEvent(event: any): boolean {
    const criticalActions = [
      'auth.login',
      'auth.logout',
      'auth.password_reset',
      'data.delete',
      'security.breach',
      'security.block'
    ];

    return criticalActions.includes(event.action) ||
           event.outcome === 'error' ||
           event.context?.priority === 'high';
  }

  private generateId(): string {
    return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private startBatchFlush() {
    // Flush every 30 seconds
    this.flushInterval = setInterval(() => {
      if (this.buffer.length > 0) {
        this.flush();
      }
    }, 30000);
  }

  private async flush(): Promise<void> {
    if (this.isFlushing || this.buffer.length === 0) {
      return;
    }

    this.isFlushing = true;
    const events = this.buffer.splice(0, this.batchSize);

    try {
      await this.flushSync(events);
    } catch (error) {
      console.error('Failed to flush audit events:', error);
      // Re-add events to buffer for retry
      this.buffer.unshift(...events);
    } finally {
      this.isFlushing = false;
    }
  }

  private async flushSync(events: AuditEvent[]): Promise<void> {
    try {
      // Sanitize events for storage
      const sanitizedEvents = events.map(event => ({
        ...event,
        // Remove sensitive details from non-critical events
        details: event.context?.sensitive
          ? this.sanitizeDetails(event.details)
          : event.details
      }));

      // Store in database
      const { error } = await this.client
        .from('audit_logs')
        .insert(sanitizedEvents);

      if (error) {
        throw error;
      }

      // Store in archive table for long-term retention
      await this.client
        .from('audit_logs_archive')
        .insert(sanitizedEvents);

    } catch (error) {
      console.error('Failed to store audit events:', error);
      throw error;
    }
  }

  private sanitizeDetails(details: Record<string, any>): Record<string, any> {
    const sensitive = ['password', 'token', 'secret', 'key', 'credit_card', 'ssn'];
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(details)) {
      const isSensitive = sensitive.some(s => key.toLowerCase().includes(s));
      sanitized[key] = isSensitive ? '[REDACTED]' : value;
    }

    return sanitized;
  }

  async queryEvents(filter: AuditFilter = {}, limit: number = 100, offset: number = 0): Promise<AuditEvent[]> {
    try {
      let query = this.client
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (filter.userId) {
        query = query.eq('user_id', filter.userId);
      }

      if (filter.action) {
        query = query.like('action', `%${filter.action}%`);
      }

      if (filter.resource) {
        query = query.eq('resource', filter.resource);
      }

      if (filter.outcome) {
        query = query.eq('outcome', filter.outcome);
      }

      if (filter.startDate) {
        query = query.gte('timestamp', filter.startDate);
      }

      if (filter.endDate) {
        query = query.lte('timestamp', filter.endDate);
      }

      if (filter.ipAddress) {
        query = query.eq('ip_address', filter.ipAddress);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to query audit events:', error);
      return [];
    }
  }

  async getEventById(id: string): Promise<AuditEvent | null> {
    try {
      const { data, error } = await this.client
        .from('audit_logs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to get audit event:', error);
      return null;
    }
  }

  async getAuditStats(hours: number = 24): Promise<AuditStats> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      const { data, error } = await this.client
        .from('audit_logs')
        .select('*')
        .gte('timestamp', since);

      if (error) throw error;

      const events = data || [];
      const totalEvents = events.length;

      // Stats by category
      const eventsByAction = events.reduce((acc, event) => {
        const category = event.action.split('.')[0];
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const eventsByResource = events.reduce((acc, event) => {
        acc[event.resource] = (acc[event.resource] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const eventsByOutcome = events.reduce((acc, event) => {
        acc[event.outcome] = (acc[event.outcome] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Events by hour
      const eventsByHour = events.reduce((acc, event) => {
        const hour = new Date(event.timestamp).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Top users
      const userCounts = events.reduce((acc, event) => {
        if (event.userId) {
          acc[event.userId] = (acc[event.userId] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const topUsers = Object.entries(userCounts)
        .map(([userId, count]) => ({ userId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Failure rate
      const failureCount = events.filter(e => e.outcome === 'failure' || e.outcome === 'error').length;
      const failureRate = totalEvents > 0 ? (failureCount / totalEvents) * 100 : 0;

      return {
        totalEvents,
        eventsByAction,
        eventsByResource,
        eventsByOutcome,
        eventsByHour,
        topUsers,
        failureRate
      };
    } catch (error) {
      console.error('Failed to get audit stats:', error);
      return {
        totalEvents: 0,
        eventsByAction: {},
        eventsByResource: {},
        eventsByOutcome: {},
        eventsByHour: {},
        topUsers: [],
        failureRate: 0
      };
    }
  }

  async createComplianceReport(startDate: string, endDate: string): Promise<{
    period: { start: string; end: string };
    summary: {
      totalEvents: number;
      uniqueUsers: number;
      sensitiveEvents: number;
      failures: number;
    };
    categories: Record<string, number>;
    topActivities: Array<{ action: string; count: number; users: number }>;
    securityEvents: AuditEvent[];
  }> {
    try {
      // Query events for the period
      const events = await this.queryEvents({
        startDate,
        endDate
      }, 10000);

      // Summary statistics
      const totalEvents = events.length;
      const uniqueUsers = new Set(events.filter(e => e.userId).map(e => e.userId)).size;
      const sensitiveEvents = events.filter(e => e.context?.sensitive).length;
      const failures = events.filter(e => e.outcome === 'failure' || e.outcome === 'error').length;

      // Events by category
      const categories = events.reduce((acc, event) => {
        const category = event.action.split('.')[0];
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Top activities
      const actionCounts = events.reduce((acc, event) => {
        if (!acc[event.action]) {
          acc[event.action] = { count: 0, users: new Set() };
        }
        acc[event.action].count++;
        if (event.userId) {
          acc[event.action].users.add(event.userId);
        }
        return acc;
      }, {} as Record<string, { count: number; users: Set<string> }>);

      const topActivities = Object.entries(actionCounts)
        .map(([action, data]) => ({
          action,
          count: data.count,
          users: data.users.size
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      // Security events
      const securityEvents = events.filter(e =>
        e.action.includes('security') || e.context?.category === 'security'
      );

      return {
        period: { start: startDate, end: endDate },
        summary: {
          totalEvents,
          uniqueUsers,
          sensitiveEvents,
          failures
        },
        categories,
        topActivities,
        securityEvents
      };
    } catch (error) {
      console.error('Failed to create compliance report:', error);
      throw error;
    }
  }

  async exportEvents(filter: AuditFilter = {}, format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const events = await this.queryEvents(filter, 10000);

      if (format === 'csv') {
        return this.convertToCSV(events);
      } else {
        return JSON.stringify(events, null, 2);
      }
    } catch (error) {
      console.error('Failed to export audit events:', error);
      throw error;
    }
  }

  private convertToCSV(events: AuditEvent[]): string {
    if (events.length === 0) return '';

    const headers = ['ID', 'Timestamp', 'User ID', 'Action', 'Resource', 'Outcome', 'IP Address', 'Details'];
    const rows = events.map(event => [
      event.id,
      event.timestamp,
      event.userId || '',
      event.action,
      event.resource,
      event.outcome,
      event.ipAddress || '',
      JSON.stringify(event.details || {})
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csvContent;
  }

  async cleanup(retentionDays: number = 365): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

      // Move old events to archive (if not already)
      await this.client.rpc('archive_audit_logs', { cutoff_date: cutoffDate });

      // Delete very old events from archive if needed
      const archiveCutoff = new Date(Date.now() - (retentionDays * 2) * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await this.client
        .from('audit_logs_archive')
        .delete()
        .lt('timestamp', archiveCutoff);

      if (error) throw error;

      console.log(`Cleaned up audit events older than ${retentionDays} days`);
    } catch (error) {
      console.error('Failed to cleanup audit events:', error);
      throw error;
    }
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    // Flush remaining events
    if (this.buffer.length > 0) {
      this.flush();
    }
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();