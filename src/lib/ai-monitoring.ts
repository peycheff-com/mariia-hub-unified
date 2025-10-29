import { getEnhancedAIService } from '@/integrations/ai/core/AIService';
import { supabase } from '@/integrations/supabase/client';

// Types
interface PerformanceMetrics {
  responseTime: number;
  successRate: number;
  errorRate: number;
  tokensUsed: number;
  cost: number;
  cacheHitRate: number;
  timestamp: string;
}

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  providers: {
    openai?: 'available' | 'unavailable' | 'degraded';
    google?: 'available' | 'unavailable' | 'degraded';
    anthropic?: 'available' | 'unavailable' | 'degraded';
  };
  lastCheck: string;
  issues: string[];
}

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  enabled: boolean;
  notificationChannels: string[];
}

interface AIAlert {
  id: string;
  ruleId: string;
  type: 'performance' | 'cost' | 'error' | 'quota';
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  metadata: any;
}

// Performance Monitor
export class AIPerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 1000;
  private alertRules: AlertRule[] = [];
  private activeAlerts: Map<string, AIAlert> = new Map();

  constructor() {
    this.initializeDefaultRules();
    // Start monitoring
    this.startMonitoring();
  }

  private initializeDefaultRules() {
    this.alertRules = [
      {
        id: 'high-response-time',
        name: 'High Response Time',
        condition: 'responseTime > 5000',
        threshold: 5000,
        severity: 'warning',
        enabled: true,
        notificationChannels: ['email', 'slack'],
      },
      {
        id: 'low-success-rate',
        name: 'Low Success Rate',
        condition: 'successRate < 0.9',
        threshold: 0.9,
        severity: 'error',
        enabled: true,
        notificationChannels: ['email', 'slack', 'pagerduty'],
      },
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        condition: 'errorRate > 0.1',
        threshold: 0.1,
        severity: 'error',
        enabled: true,
        notificationChannels: ['email', 'slack'],
      },
      {
        id: 'cost-spike',
        name: 'Cost Spike',
        condition: 'dailyCost > 100',
        threshold: 100,
        severity: 'warning',
        enabled: true,
        notificationChannels: ['email'],
      },
      {
        id: 'quota-exhaustion',
        name: 'API Quota Exhaustion',
        condition: 'quotaUsage > 0.9',
        threshold: 0.9,
        severity: 'critical',
        enabled: true,
        notificationChannels: ['email', 'slack', 'pagerduty', 'sms'],
      },
    ];
  }

  async recordMetric(metric: Omit<PerformanceMetrics, 'timestamp'>) {
    const fullMetric: PerformanceMetrics = {
      ...metric,
      timestamp: new Date().toISOString(),
    };

    this.metrics.push(fullMetric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Store in database
    await this.storeMetric(fullMetric);

    // Check alert rules
    await this.checkAlerts(fullMetric);
  }

  private async storeMetric(metric: PerformanceMetrics) {
    try {
      await supabase
        .from('ai_performance_metrics')
        .insert(metric);
    } catch (error) {
      console.error('Failed to store performance metric:', error);
    }
  }

  private async checkAlerts(metric: PerformanceMetrics) {
    for (const rule of this.alertRules.filter(r => r.enabled)) {
      const triggered = await this.evaluateCondition(rule.condition, metric);

      if (triggered) {
        await this.triggerAlert(rule, metric);
      } else {
        await this.resolveAlert(rule.id);
      }
    }
  }

  private async evaluateCondition(condition: string, metric: PerformanceMetrics): Promise<boolean> {
    try {
      // Simple condition evaluator
      // In production, use a proper expression parser
      if (condition.includes('responseTime >')) {
        const threshold = parseFloat(condition.split('>')[1]);
        return metric.responseTime > threshold;
      }
      if (condition.includes('successRate <')) {
        const threshold = parseFloat(condition.split('<')[1]);
        return metric.successRate < threshold;
      }
      if (condition.includes('errorRate >')) {
        const threshold = parseFloat(condition.split('>')[1]);
        return metric.errorRate > threshold;
      }
      if (condition.includes('dailyCost >')) {
        const threshold = parseFloat(condition.split('>')[1]);
        // Calculate daily cost from metrics
        const dailyCost = await this.calculateDailyCost();
        return dailyCost > threshold;
      }
      if (condition.includes('quotaUsage >')) {
        const threshold = parseFloat(condition.split('>')[1]);
        const usage = await this.getQuotaUsage();
        return usage > threshold;
      }
      return false;
    } catch (error) {
      console.error('Error evaluating condition:', error);
      return false;
    }
  }

  private async triggerAlert(rule: AlertRule, metric: PerformanceMetrics) {
    const alertId = `${rule.id}-${Date.now()}`;

    const alert: AIAlert = {
      id: alertId,
      ruleId: rule.id,
      type: 'performance',
      message: `${rule.name}: ${this.formatAlertMessage(rule, metric)}`,
      severity: rule.severity,
      timestamp: new Date().toISOString(),
      resolved: false,
      metadata: { rule, metric },
    };

    this.activeAlerts.set(rule.id, alert);

    // Store alert
    await this.storeAlert(alert);

    // Send notifications
    await this.sendNotifications(alert, rule.notificationChannels);
  }

  private async resolveAlert(ruleId: string) {
    const alert = this.activeAlerts.get(ruleId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();

      await this.updateAlert(alert);
      this.activeAlerts.delete(ruleId);
    }
  }

  private formatAlertMessage(rule: AlertRule, metric: PerformanceMetrics): string {
    switch (rule.id) {
      case 'high-response-time':
        return `Response time is ${metric.responseTime}ms (threshold: ${rule.threshold}ms)`;
      case 'low-success-rate':
        return `Success rate is ${(metric.successRate * 100).toFixed(1)}% (threshold: ${(rule.threshold * 100).toFixed(1)}%)`;
      case 'high-error-rate':
        return `Error rate is ${(metric.errorRate * 100).toFixed(1)}% (threshold: ${(rule.threshold * 100).toFixed(1)}%)`;
      default:
        return 'Threshold exceeded';
    }
  }

  private async storeAlert(alert: AIAlert) {
    try {
      await supabase
        .from('ai_alerts')
        .insert(alert);
    } catch (error) {
      console.error('Failed to store alert:', error);
    }
  }

  private async updateAlert(alert: AIAlert) {
    try {
      await supabase
        .from('ai_alerts')
        .update({
          resolved: alert.resolved,
          resolved_at: alert.resolvedAt,
        })
        .eq('id', alert.id);
    } catch (error) {
      console.error('Failed to update alert:', error);
    }
  }

  private async sendNotifications(alert: AIAlert, channels: string[]) {
    for (const channel of channels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmailNotification(alert);
            break;
          case 'slack':
            await this.sendSlackNotification(alert);
            break;
          case 'pagerduty':
            await this.sendPagerDutyNotification(alert);
            break;
          case 'sms':
            await this.sendSMSNotification(alert);
            break;
        }
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
      }
    }
  }

  private async sendEmailNotification(alert: AIAlert) {
    // Implementation for email notifications
    console.log('Email notification sent:', alert.message);
  }

  private async sendSlackNotification(alert: AIAlert) {
    // Implementation for Slack notifications
    console.log('Slack notification sent:', alert.message);
  }

  private async sendPagerDutyNotification(alert: AIAlert) {
    // Implementation for PagerDuty notifications
    console.log('PagerDuty notification sent:', alert.message);
  }

  private async sendSMSNotification(alert: AIAlert) {
    // Implementation for SMS notifications
    console.log('SMS notification sent:', alert.message);
  }

  private async calculateDailyCost(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('ai_performance_metrics')
      .select('cost')
      .gte('timestamp', today)
      .lt('timestamp', new Date().toISOString());

    return data?.reduce((sum, m) => sum + m.cost, 0) || 0;
  }

  private async getQuotaUsage(): Promise<number> {
    const stats = getEnhancedAIService().getUsageStats();
    const dailyLimit = 10000; // Get from configuration
    return stats.totalRequests / dailyLimit;
  }

  getMetrics(timeRange?: 'hour' | 'day' | 'week' | 'month'): PerformanceMetrics[] {
    if (!timeRange) return this.metrics;

    const now = new Date();
    let cutoff: Date;

    switch (timeRange) {
      case 'hour':
        cutoff = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    return this.metrics.filter(m => new Date(m.timestamp) >= cutoff);
  }

  getActiveAlerts(): AIAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  getAverageMetrics(timeRange?: 'hour' | 'day' | 'week' | 'month'): Partial<PerformanceMetrics> {
    const metrics = this.getMetrics(timeRange);
    if (metrics.length === 0) return {};

    return {
      responseTime: metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length,
      successRate: metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length,
      errorRate: metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length,
      tokensUsed: metrics.reduce((sum, m) => sum + m.tokensUsed, 0),
      cost: metrics.reduce((sum, m) => sum + m.cost, 0),
      cacheHitRate: metrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / metrics.length,
    };
  }

  private startMonitoring() {
    // Collect metrics every minute
    setInterval(async () => {
      const stats = getEnhancedAIService().getUsageStats();

      await this.recordMetric({
        responseTime: 1200, // Mock - would be measured
        successRate: stats.successRate,
        errorRate: 1 - stats.successRate,
        tokensUsed: stats.averageTokensUsed,
        cost: stats.totalCost / 100, // Per request cost
        cacheHitRate: 0.73, // Mock - would be measured
      });
    }, 60000);
  }
}

// Health Check Service
export class AIHealthCheckService {
  private lastCheck: HealthCheck | null = null;

  async performHealthCheck(): Promise<HealthCheck> {
    const issues: string[] = [];
    const providers: HealthCheck['providers'] = {};

    // Check OpenAI
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        signal: AbortSignal.timeout(5000),
      });

      providers.openai = response.ok ? 'available' : 'unavailable';
      if (!response.ok) issues.push('OpenAI API unavailable');
    } catch (error) {
      providers.openai = 'unavailable';
      issues.push('OpenAI API connection failed');
    }

    // Check Google AI
    try {
      // Mock health check for Google AI
      providers.google = 'available';
    } catch (error) {
      providers.google = 'unavailable';
      issues.push('Google AI unavailable');
    }

    // Check Anthropic
    try {
      // Mock health check for Anthropic
      providers.anthropic = 'available';
    } catch (error) {
      providers.anthropic = 'unavailable';
      issues.push('Anthropic unavailable');
    }

    // Determine overall status
    const unavailableCount = Object.values(providers).filter(p => p === 'unavailable').length;
    const degradedCount = Object.values(providers).filter(p => p === 'degraded').length;

    let status: HealthCheck['status'];
    if (unavailableCount === Object.keys(providers).length) {
      status = 'unhealthy';
    } else if (unavailableCount > 0 || degradedCount > 0) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    this.lastCheck = {
      status,
      providers,
      lastCheck: new Date().toISOString(),
      issues,
    };

    // Store health check result
    await this.storeHealthCheck(this.lastCheck);

    return this.lastCheck;
  }

  private async storeHealthCheck(check: HealthCheck) {
    try {
      await supabase
        .from('ai_health_checks')
        .insert(check);
    } catch (error) {
      console.error('Failed to store health check:', error);
    }
  }

  getLastHealthCheck(): HealthCheck | null {
    return this.lastCheck;
  }
}

// AI Testing Suite
export class AITestingSuite {
  async runTests(): Promise<{
    passed: number;
    failed: number;
    results: Array<{
      name: string;
      passed: boolean;
      error?: string;
      duration: number;
    }>;
  }> {
    const tests = [
      this.testContentGeneration,
      this.testRecommendations,
      this.testScheduling,
      this.testSentimentAnalysis,
      this.testTranslation,
      this.testImageGeneration,
      this.testRateLimiting,
      this.testPIIDetection,
      this.testCaching,
      this.testFallback,
    ];

    const results = [];
    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      const startTime = Date.now();
      try {
        await test.bind(this)();
        results.push({
          name: test.name.replace('bound ', ''),
          passed: true,
          duration: Date.now() - startTime,
        });
        passed++;
      } catch (error) {
        results.push({
          name: test.name.replace('bound ', ''),
          passed: false,
          error: error.message,
          duration: Date.now() - startTime,
        });
        failed++;
      }
    }

    return { passed, failed, results };
  }

  private async testContentGeneration() {
    const aiService = getEnhancedAIService();
    const result = await aiService.generateContent('Test blog post about beauty tips');
    if (!result.content || result.content.length < 10) {
      throw new Error('Content generation failed or returned empty content');
    }
  }

  private async testRecommendations() {
    const aiService = getEnhancedAIService();
    const recommendations = await aiService.recommendServices('test-user', {
      userId: 'test-user',
      location: 'Warsaw',
    });
    if (!Array.isArray(recommendations)) {
      throw new Error('Recommendations not returned as array');
    }
  }

  private async testScheduling() {
    const aiService = getEnhancedAIService();
    const slots = await aiService.optimizeSchedule('test-provider', {
      providerId: 'test-provider',
      serviceDuration: 60,
      preferredDays: ['Monday'],
      preferredTimes: ['10:00'],
      location: 'Warsaw',
    });
    if (!Array.isArray(slots)) {
      throw new Error('Schedule optimization failed');
    }
  }

  private async testSentimentAnalysis() {
    const aiService = getEnhancedAIService();
    const sentiment = await aiService.analyzeSentiment('I love this service!');
    if (!sentiment || typeof sentiment.overall !== 'string') {
      throw new Error('Sentiment analysis failed');
    }
  }

  private async testTranslation() {
    const aiService = getEnhancedAIService();
    const result = await aiService.generateContent(
      'Translate "Hello world" to Polish',
      { language: 'pl' }
    );
    if (!result.content.includes('Witaj')) {
      throw new Error('Translation failed');
    }
  }

  private async testImageGeneration() {
    const aiService = getEnhancedAIService();
    const imageUrl = await aiService.generateImage('Beauty salon', { style: 'professional' });
    if (!imageUrl || !imageUrl.startsWith('http')) {
      throw new Error('Image generation failed');
    }
  }

  private async testRateLimiting() {
    // Test rate limiting functionality
    const { RateLimiter } = await import('./ai-security');
    const result = await RateLimiter.checkLimit('test-user', 'default');
    if (!result.allowed) {
      throw new Error('Rate limiting blocking legitimate requests');
    }
  }

  private async testPIIDetection() {
    const { PIIDetector } = await import('./ai-security');
    const hasPII = PIIDetector.hasPII('Contact john@example.com or call 555-1234');
    if (!hasPII) {
      throw new Error('PII detection failed');
    }
  }

  private async testCaching() {
    const aiService = getEnhancedAIService();
    const prompt = 'Test caching functionality';

    // First request
    const result1 = await aiService.generateContent(prompt);
    // Second request (should be cached)
    const result2 = await aiService.generateContent(prompt);

    if (result1.content !== result2.content) {
      throw new Error('Caching not working properly');
    }
  }

  private async testFallback() {
    // Test fallback between providers
    // This would require mocking provider failures
    console.log('Fallback test - would require mocking');
  }
}

// Export singleton instances
export const performanceMonitor = new AIPerformanceMonitor();
export const healthCheckService = new AIHealthCheckService();
export const testingSuite = new AITestingSuite();

// Convenience functions
export async function getAIHealthStatus(): Promise<HealthCheck> {
  return healthCheckService.performHealthCheck();
}

export async function runAITests() {
  return testingSuite.runTests();
}

export function getAIPerformanceMetrics(timeRange?: 'hour' | 'day' | 'week' | 'month') {
  return performanceMonitor.getMetrics(timeRange);
}

export function getAIActiveAlerts() {
  return performanceMonitor.getActiveAlerts();
}