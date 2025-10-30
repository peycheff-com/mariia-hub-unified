// API ENDPOINT FOR PERFORMANCE REPORTING
// Receives comprehensive performance reports and generates insights

import { NextApiRequest, NextApiResponse } from 'next';

interface PerformanceReport {
  timestamp: string;
  period: string;
  database: {
    avgQueryTime: number;
    slowQueries: number;
    cacheHitRate: number;
    totalQueries: number;
  };
  api: {
    avgResponseTime: number;
    errorRate: number;
    totalRequests: number;
    slowEndpoints: string[];
  };
  userExperience: {
    avgPageLoadTime: number;
    bounceRate: number;
    conversionRate: number;
    coreWebVitals: {
      lcp: number;
      fid: number;
      cls: number;
    };
  };
  system: {
    avgMemoryUsage: number;
    avgCpuUsage: number;
    networkLatency: number;
  };
  alerts: Array<{
    type: string;
    severity: string;
    message: string;
    metric: string;
    value: number;
    threshold: number;
  }>;
  recommendations: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const report: PerformanceReport = req.body;

    // Validate report structure
    if (!report.timestamp || !report.database || !report.api || !report.userExperience) {
      return res.status(400).json({ error: 'Invalid report format' });
    }

    console.log('[PERFORMANCE REPORT]', {
      timestamp: report.timestamp,
      period: report.period,
      avgQueryTime: report.database.avgQueryTime,
      avgResponseTime: report.api.avgResponseTime,
      alertCount: report.alerts.length,
      recommendationCount: report.recommendations.length
    });

    // Store comprehensive report in database for analysis
    if (process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_TRACKING === 'true') {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Store the main report
        await supabase.from('performance_reports').insert({
          timestamp: report.timestamp,
          period: report.period,
          database_metrics: report.database,
          api_metrics: report.api,
          ux_metrics: report.userExperience,
          system_metrics: report.system,
          alert_count: report.alerts.length,
          recommendation_count: report.recommendations.length,
          created_at: new Date().toISOString()
        });

        // Store individual alerts if any
        if (report.alerts.length > 0) {
          await supabase.from('performance_alerts').insert(
            report.alerts.map(alert => ({
              report_timestamp: report.timestamp,
              alert_type: alert.type,
              severity: alert.severity,
              message: alert.message,
              metric: alert.metric,
              value: alert.value,
              threshold: alert.threshold,
              created_at: new Date().toISOString()
            }))
          );
        }

        // Store recommendations
        if (report.recommendations.length > 0) {
          await supabase.from('performance_recommendations').insert(
            report.recommendations.map(recommendation => ({
              report_timestamp: report.timestamp,
              recommendation,
              created_at: new Date().toISOString()
            }))
          );
        }

      } catch (dbError) {
        console.error('[PERFORMANCE REPORT] Failed to store in database:', dbError);
      }
    }

    // Check for critical issues that need immediate attention
    const criticalAlerts = report.alerts.filter(alert => alert.severity === 'critical');
    if (criticalAlerts.length > 0) {
      console.error('[PERFORMANCE CRITICAL ALERTS]', criticalAlerts);

      // Here you could send alerts to your monitoring system
      // await sendCriticalAlerts(criticalAlerts);
    }

    // Generate performance insights
    const insights = generatePerformanceInsights(report);

    return res.status(200).json({
      success: true,
      logged: true,
      insights,
      summary: {
        overallHealth: calculateOverallHealth(report),
        criticalIssues: criticalAlerts.length,
        topRecommendations: report.recommendations.slice(0, 3)
      }
    });

  } catch (error) {
    console.error('[PERFORMANCE REPORT] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function generatePerformanceInsights(report: PerformanceReport): string[] {
  const insights: string[] = [];

  // Database insights
  if (report.database.avgQueryTime > 100) {
    insights.push(`Database queries are averaging ${Math.round(report.database.avgQueryTime)}ms, consider query optimization`);
  }

  if (report.database.cacheHitRate < 0.8) {
    insights.push(`Cache hit rate is ${(report.database.cacheHitRate * 100).toFixed(1)}%, implement better caching strategies`);
  }

  // API insights
  if (report.api.avgResponseTime > 300) {
    insights.push(`API responses are averaging ${Math.round(report.api.avgResponseTime)}ms, consider endpoint optimization`);
  }

  if (report.api.errorRate > 0.05) {
    insights.push(`Error rate is ${(report.api.errorRate * 100).toFixed(1)}%, investigate failing endpoints`);
  }

  // User experience insights
  if (report.userExperience.avgPageLoadTime > 2000) {
    insights.push(`Page load times are averaging ${Math.round(report.userExperience.avgPageLoadTime)}ms, optimize frontend assets`);
  }

  if (report.userExperience.coreWebVitals.lcp > 2500) {
    insights.push(`Largest Contentful Paint is ${Math.round(report.userExperience.coreWebVitals.lcp)}ms, optimize loading performance`);
  }

  if (report.userExperience.coreWebVitals.cls > 0.1) {
    insights.push(`Cumulative Layout Shift is ${report.userExperience.coreWebVitals.cls.toFixed(3)}, improve layout stability`);
  }

  // System insights
  if (report.system.avgMemoryUsage > 80) {
    insights.push(`Memory usage is at ${Math.round(report.system.avgMemoryUsage)}%, optimize memory allocation`);
  }

  if (report.system.networkLatency > 500) {
    insights.push(`Network latency is ${Math.round(report.system.networkLatency)}ms, check network performance`);
  }

  return insights;
}

function calculateOverallHealth(report: PerformanceReport): 'excellent' | 'good' | 'fair' | 'poor' {
  let score = 100;

  // Database performance impact
  score -= Math.min(30, (report.database.avgQueryTime / 100) * 30);
  score -= Math.min(20, (1 - report.database.cacheHitRate) * 20);

  // API performance impact
  score -= Math.min(25, (report.api.avgResponseTime / 300) * 25);
  score -= Math.min(15, report.api.errorRate * 100);

  // User experience impact
  score -= Math.min(20, (report.userExperience.avgPageLoadTime / 2000) * 20);
  score -= Math.min(10, (report.userExperience.coreWebVitals.lcp / 2500) * 10);

  // Alert impact
  score -= report.alerts.filter(a => a.severity === 'critical').length * 10;
  score -= report.alerts.filter(a => a.severity === 'high').length * 5;

  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'fair';
  return 'poor';
}