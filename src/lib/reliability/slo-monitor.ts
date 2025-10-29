import { supabase } from '@/integrations/supabase/client';

import { SLO, ErrorBudgetStatus, ErrorBudgetEvent } from './types';

interface SLIMetrics {
  goodEvents: number;
  badEvents: number;
  totalEvents: number;
  availability: number;
  errorBudget: number;
  burnRate: number;
}

interface TimeSeriesPoint {
  timestamp: string;
  value: number;
  metadata?: Record<string, any>;
}

export class SLOMonitor {
  private supabase = createClient();
  private slos: Map<string, SLO> = new Map();
  private monitoring: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeDefaultSLOs();
  }

  private initializeDefaultSLOs() {
    // API availability SLO
    this.addSLO({
      id: 'api-availability',
      name: 'API Availability',
      description: 'API endpoints should be available and responding successfully',
      service: 'api',
      indicator: 'availability',
      objective: 99.9, // 99.9% availability
      timeWindow: 30, // 30 days
      alertingBurnRate: 2,
      errorBudgetPolicy: {
        fastBurn: 10,
        slowBurn: 2,
        windowShort: 1, // 1 hour
        windowLong: 6 // 6 hours
      }
    });

    // Database reliability SLO
    this.addSLO({
      id: 'database-reliability',
      name: 'Database Reliability',
      description: 'Database queries should complete successfully',
      service: 'database',
      indicator: 'query_success',
      objective: 99.95,
      timeWindow: 30,
      alertingBurnRate: 2,
      errorBudgetPolicy: {
        fastBurn: 14,
        slowBurn: 1,
        windowShort: 1,
        windowLong: 24
      }
    });

    // Booking system SLO
    this.addSLO({
      id: 'booking-success',
      name: 'Booking Success Rate',
      description: 'Booking operations should complete successfully',
      service: 'booking',
      indicator: 'booking_success',
      objective: 99.5,
      timeWindow: 7, // 7 days
      alertingBurnRate: 3,
      errorBudgetPolicy: {
        fastBurn: 5,
        slowBurn: 1.5,
        windowShort: 1,
        windowLong: 12
      }
    });

    // Payment processing SLO
    this.addSLO({
      id: 'payment-success',
      name: 'Payment Processing Success',
      description: 'Payment transactions should process successfully',
      service: 'payments',
      indicator: 'payment_success',
      objective: 99.99,
      timeWindow: 30,
      alertingBurnRate: 1,
      errorBudgetPolicy: {
        fastBurn: 20,
        slowBurn: 2,
        windowShort: 0.5, // 30 minutes
        windowLong: 3
      }
    });

    // Response time SLO (as latency-based SLO)
    this.addSLO({
      id: 'response-time',
      name: 'Response Time',
      description: '95th percentile response time should be under 500ms',
      service: 'api',
      indicator: 'latency_p95',
      objective: 95, // 95% of requests under 500ms
      timeWindow: 7,
      alertingBurnRate: 2,
      errorBudgetPolicy: {
        fastBurn: 5,
        slowBurn: 1,
        windowShort: 1,
        windowLong: 6
      }
    });

    // Page load time SLO
    this.addSLO({
      id: 'page-load-time',
      name: 'Page Load Time',
      description: 'Page load time should be under 2 seconds',
      service: 'frontend',
      indicator: 'page_load',
      objective: 90, // 90% of pages load under 2 seconds
      timeWindow: 7,
      alertingBurnRate: 2,
      errorBudgetPolicy: {
        fastBurn: 3,
        slowBurn: 1,
        windowShort: 2,
        windowLong: 12
      }
    });
  }

  addSLO(slo: SLO) {
    this.slos.set(slo.id, slo);
  }

  async recordEvent(service: string, indicator: string, success: boolean, value?: number): Promise<void> {
    const event = {
      service,
      indicator,
      success,
      value: value || 1,
      timestamp: new Date().toISOString()
    };

    try {
      // Store event for SLO calculation
      await this.supabase
        .from('slo_events')
        .insert(event);

      // Update relevant SLOs
      this.updateSLOs(service, indicator);
    } catch (error) {
      console.error('Failed to record SLO event:', error);
    }
  }

  private async updateSLOs(service: string, indicator: string) {
    for (const [sloId, slo] of this.slos) {
      if (slo.service === service && slo.indicator === indicator) {
        // Recalculate error budget for this SLO
        await this.calculateErrorBudget(sloId);
      }
    }
  }

  async calculateErrorBudget(sloId: string): Promise<ErrorBudgetStatus> {
    const slo = this.slos.get(sloId);
    if (!slo) {
      throw new Error(`SLO ${sloId} not found`);
    }

    const windowStart = new Date(Date.now() - slo.timeWindow * 24 * 60 * 60 * 1000).toISOString();

    try {
      // Get events within SLO window
      const { data: events, error } = await this.supabase
        .from('slo_events')
        .select('*')
        .eq('service', slo.service)
        .eq('indicator', slo.indicator)
        .gte('timestamp', windowStart)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      // Calculate metrics
      const metrics = this.calculateMetrics(events || [], slo);

      // Calculate burn rates
      const burnRates = await this.calculateBurnRates(slo, events || []);

      // Determine status
      const status = this.determineBudgetStatus(metrics.errorBudget);

      // Create error budget status
      const errorBudgetStatus: ErrorBudgetStatus = {
        sloId,
        currentTime: new Date().toISOString(),
        errorBudget: metrics.errorBudget,
        burnRate: burnRates.current,
        status,
        events: []
      };

      // Store error budget status
      await this.storeErrorBudgetStatus(errorBudgetStatus);

      // Check for alerts
      if (status === 'burning' || status === 'exhausted') {
        await this.triggerErrorBudgetAlert(slo, errorBudgetStatus, burnRates);
      }

      return errorBudgetStatus;
    } catch (error) {
      console.error('Failed to calculate error budget:', error);
      throw error;
    }
  }

  private calculateMetrics(events: any[], slo: SLO): SLIMetrics {
    const totalEvents = events.length;
    let goodEvents = 0;
    let badEvents = 0;

    if (slo.indicator === 'latency_p95') {
      // For latency SLOs, good events are those under threshold
      const threshold = 500; // 500ms
      const sorted = events.map(e => e.value).sort((a, b) => a - b);
      const p95Index = Math.floor(sorted.length * 0.95);
      const p95Value = sorted[p95Index] || 0;

      goodEvents = p95Value <= threshold ? totalEvents : Math.floor(totalEvents * (threshold / p95Value));
      badEvents = totalEvents - goodEvents;
    } else if (slo.indicator === 'page_load') {
      // For page load SLOs
      const threshold = 2000; // 2 seconds
      goodEvents = events.filter(e => e.value <= threshold).length;
      badEvents = totalEvents - goodEvents;
    } else {
      // For availability/error rate SLOs
      goodEvents = events.filter(e => e.success).length;
      badEvents = totalEvents - goodEvents;
    }

    const availability = totalEvents > 0 ? (goodEvents / totalEvents) * 100 : 100;
    const errorBudget = Math.max(0, availability - (100 - slo.objective));
    const burnRate = this.calculateCurrentBurnRate(events, slo);

    return {
      goodEvents,
      badEvents,
      totalEvents,
      availability,
      errorBudget,
      burnRate
    };
  }

  private async calculateBurnRates(slo: SLO, events: any[]): Promise<{
    current: number;
    short: number;
    long: number;
  }> {
    const now = Date.now();
    const shortWindow = slo.errorBudgetPolicy.windowShort * 60 * 60 * 1000;
    const longWindow = slo.errorBudgetPolicy.windowLong * 60 * 60 * 1000;

    const recentEvents = events.filter(e =>
      now - new Date(e.timestamp).getTime() <= shortWindow
    );
    const longEvents = events.filter(e =>
      now - new Date(e.timestamp).getTime() <= longWindow
    );

    const currentBurnRate = this.calculateCurrentBurnRate(events, slo);
    const shortBurnRate = this.calculateCurrentBurnRate(recentEvents, slo);
    const longBurnRate = this.calculateCurrentBurnRate(longEvents, slo);

    return {
      current: currentBurnRate,
      short: shortBurnRate,
      long: longBurnRate
    };
  }

  private calculateCurrentBurnRate(events: any[], slo: SLO): number {
    if (events.length === 0) return 0;

    const windowDays = slo.timeWindow;
    const eventsInWindow = events.length;
    const badEventsInWindow = events.filter(e => !e.success).length;

    // Calculate expected bad events per day
    const allowedErrorRate = (100 - slo.objective) / 100;
    const expectedBadEventsPerDay = eventsInWindow * allowedErrorRate / windowDays;

    // Actual bad events per day
    const actualBadEventsPerDay = badEventsInWindow / windowDays;

    // Burn rate
    if (expectedBadEventsPerDay === 0) return actualBadEventsPerDay > 0 ? 999 : 0;
    return actualBadEventsPerDay / expectedBadEventsPerDay;
  }

  private determineBudgetStatus(errorBudget: number): 'healthy' | 'warning' | 'burning' | 'exhausted' {
    if (errorBudget <= 0) return 'exhausted';
    if (errorBudget < 5) return 'burning';
    if (errorBudget < 25) return 'warning';
    return 'healthy';
  }

  private async storeErrorBudgetStatus(status: ErrorBudgetStatus) {
    try {
      await this.supabase
        .from('error_budget_status')
        .upsert({
          slo_id: status.sloId,
          error_budget: status.errorBudget,
          burn_rate: status.burnRate,
          status: status.status,
          timestamp: status.currentTime
        });
    } catch (error) {
      console.error('Failed to store error budget status:', error);
    }
  }

  private async triggerErrorBudgetAlert(slo: SLO, status: ErrorBudgetStatus, burnRates: any) {
    const alertData = {
      sloId: slo.id,
      sloName: slo.name,
      status: status.status,
      errorBudget: status.errorBudget,
      burnRate: burnRates.current,
      fastBurnThreshold: slo.errorBudgetPolicy.fastBurn,
      slowBurnThreshold: slo.errorBudgetPolicy.slowBurn,
      isFastBurning: burnRates.short >= slo.errorBudgetPolicy.fastBurn,
      isSlowBurning: burnRates.long >= slo.errorBudgetPolicy.slowBurn
    };

    // Store alert
    try {
      await this.supabase
        .from('slo_alerts')
        .insert({
          ...alertData,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to store SLO alert:', error);
    }

    console.warn('SLO Alert:', alertData);
  }

  async getAllErrorBudgetStatuses(): Promise<ErrorBudgetStatus[]> {
    const statuses: ErrorBudgetStatus[] = [];

    for (const sloId of this.slos.keys()) {
      try {
        const status = await this.calculateErrorBudget(sloId);
        statuses.push(status);
      } catch (error) {
        console.error(`Failed to get error budget for SLO ${sloId}:`, error);
      }
    }

    return statuses;
  }

  async getSLOHistory(sloId: string, days: number = 30): Promise<TimeSeriesPoint[]> {
    try {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await this.supabase
        .from('error_budget_status')
        .select('*')
        .eq('slo_id', sloId)
        .gte('timestamp', since)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      return (data || []).map(row => ({
        timestamp: row.timestamp,
        value: row.error_budget,
        metadata: {
          burnRate: row.burn_rate,
          status: row.status
        }
      }));
    } catch (error) {
      console.error('Failed to get SLO history:', error);
      return [];
    }
  }

  async getSLOReport(sloId: string): Promise<{
    slo: SLO;
    current: ErrorBudgetStatus;
    history: TimeSeriesPoint[];
    recommendations: string[];
  }> {
    const slo = this.slos.get(sloId);
    if (!slo) {
      throw new Error(`SLO ${sloId} not found`);
    }

    const [current, history] = await Promise.all([
      this.calculateErrorBudget(sloId),
      this.getSLOHistory(sloId)
    ]);

    const recommendations = this.generateRecommendations(slo, current, history);

    return {
      slo,
      current,
      history,
      recommendations
    };
  }

  private generateRecommendations(slo: SLO, current: ErrorBudgetStatus, history: TimeSeriesPoint[]): string[] {
    const recommendations: string[] = [];

    if (current.status === 'exhausted') {
      recommendations.push(`Error budget exhausted for ${slo.name}. Immediate investigation required.`);
    } else if (current.status === 'burning') {
      recommendations.push(`Error budget burning rapidly. Burn rate: ${current.burnRate.toFixed(1)}x`);
      if (current.burnRate > 5) {
        recommendations.push('Critical burn rate detected. Consider immediate response.');
      }
    }

    // Analyze trends
    if (history.length > 10) {
      const recent = history.slice(-10);
      const older = history.slice(-20, -10);

      const recentAvg = recent.reduce((sum, p) => sum + p.value, 0) / recent.length;
      const olderAvg = older.reduce((sum, p) => sum + p.value, 0) / older.length;

      if (recentAvg < olderAvg - 5) {
        recommendations.push('Error budget consumption is accelerating. Review recent changes.');
      }
    }

    // Service-specific recommendations
    if (slo.service === 'api') {
      recommendations.push('Check API endpoint performance and error rates.');
    } else if (slo.service === 'database') {
      recommendations.push('Review database query performance and connection health.');
    } else if (slo.service === 'payments') {
      recommendations.push('Investigate payment gateway integration and transaction failures.');
    }

    return recommendations;
  }

  async getBurnRateReport(sloId: string): Promise<{
    current: number;
    short: number;
    long: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    prediction: {
      daysUntilExhausted: number | null;
      atRisk: boolean;
    };
  }> {
    const slo = this.slos.get(sloId);
    if (!slo) {
      throw new Error(`SLO ${sloId} not found`);
    }

    const windowStart = new Date(Date.now() - slo.timeWindow * 24 * 60 * 60 * 1000).toISOString();

    const { data: events, error } = await this.supabase
      .from('slo_events')
      .select('*')
      .eq('service', slo.service)
      .eq('indicator', slo.indicator)
      .gte('timestamp', windowStart);

    if (error) throw error;

    const burnRates = await this.calculateBurnRates(slo, events || []);

    // Determine trend
    const history = await this.getSLOHistory(sloId, 7);
    const trend = this.determineBurnRateTrend(history);

    // Predict exhaustion
    const currentStatus = await this.calculateErrorBudget(sloId);
    const daysUntilExhausted = this.predictExhaustion(currentStatus.errorBudget, burnRates.current);

    return {
      current: burnRates.current,
      short: burnRates.short,
      long: burnRates.long,
      trend,
      prediction: {
        daysUntilExhausted,
        atRisk: daysUntilExhausted !== null && daysUntilExhausted < 7
      }
    };
  }

  private determineBurnRateTrend(history: TimeSeriesPoint[]): 'increasing' | 'stable' | 'decreasing' {
    if (history.length < 5) return 'stable';

    const recent = history.slice(-5);
    const burnRates = recent.map(p => p.metadata?.burnRate || 0);

    const avg = burnRates.reduce((a, b) => a + b, 0) / burnRates.length;
    const increasing = burnRates.filter(r => r > avg).length;
    const decreasing = burnRates.filter(r => r < avg).length;

    if (increasing > decreasing + 1) return 'increasing';
    if (decreasing > increasing + 1) return 'decreasing';
    return 'stable';
  }

  private predictExhaustion(errorBudget: number, burnRate: number): number | null {
    if (burnRate <= 1) return null;
    return Math.max(0, errorBudget / (burnRate - 1));
  }

  startMonitoring() {
    for (const sloId of this.slos.keys()) {
      // Calculate error budgets every 5 minutes
      const timer = setInterval(async () => {
        try {
          await this.calculateErrorBudget(sloId);
        } catch (error) {
          console.error(`Error monitoring SLO ${sloId}:`, error);
        }
      }, 5 * 60 * 1000);

      this.monitoring.set(sloId, timer);
    }
  }

  stopMonitoring() {
    for (const [sloId, timer] of this.monitoring) {
      clearInterval(timer);
      this.monitoring.delete(sloId);
    }
  }
}

export const sloMonitor = new SLOMonitor();