import { createRoute , OpenAPIHono } from '@hono/zod-openapi';
import { z } from 'zod';

import { healthChecker } from '@/lib/reliability/health-checker';
import { dependencyMonitor } from '@/lib/reliability/dependency-monitor';
import { healthScorer } from '@/lib/reliability/health-scorer';
import { automatedRecovery } from '@/lib/reliability/automated-recovery';
import { alertingSystem } from '@/lib/reliability/alerting';
import { auditLogger } from '@/lib/reliability/audit-logger';
import { sloMonitor } from '@/lib/reliability/slo-monitor';

const app = new OpenAPIHono();

// Health endpoints
app.get('/health', async (c) => {
  const health = await healthChecker.runHealthChecks();
  return c.json({
    status: health.status,
    timestamp: health.timestamp,
    score: health.score
  }, health.status === 'unhealthy' ? 503 : 200);
});

app.get('/health/score', async (c) => {
  const score = await healthScorer.calculateOverallHealthScore();
  return c.json(score);
});

app.get('/health/report', async (c) => {
  const report = await healthScorer.generateHealthReport();
  return c.json(report);
});

// Dependency monitoring endpoints
app.get('/dependencies', async (c) => {
  const dependencies = await dependencyMonitor.checkAllDependencies();
  const metrics = dependencyMonitor.getAllMetrics();

  return c.json({
    dependencies,
    metrics,
    critical: dependencyMonitor.getCriticalDependencies()
  });
});

app.get('/dependencies/:name/history', async (c) => {
  const name = c.req.param('name');
  const hours = parseInt(c.req.query('hours') || '24');

  const history = await dependencyMonitor.getHistoricalMetrics(name, hours);
  return c.json(history);
});

// Automated recovery endpoints
app.get('/recovery/attempts', async (c) => {
  const attempts = automatedRecovery.getAttempts();
  return c.json(attempts);
});

app.get('/recovery/stats', async (c) => {
  const hours = parseInt(c.req.query('hours') || '24');
  const stats = await automatedRecovery.getRecoveryStats(hours);
  return c.json(stats);
});

app.post('/recovery/trigger', async (c) => {
  const results = await automatedRecovery.runRecovery();
  return c.json(results);
});

// Alerting endpoints
app.get('/alerts', async (c) => {
  const alerts = alertingSystem.getActiveAlerts();
  return c.json(alerts);
});

app.post('/alerts/:alertId/acknowledge', async (c) => {
  const alertId = c.req.param('alertId');
  const userId = c.req.query('userId') || 'unknown';

  await alertingSystem.acknowledgeAlert(alertId, userId);
  return c.json({ success: true });
});

app.get('/alerts/stats', async (c) => {
  const hours = parseInt(c.req.query('hours') || '24');
  const stats = await alertingSystem.getAlertStats(hours);
  return c.json(stats);
});

// Audit logging endpoints
app.get('/audit/events', async (c) => {
  const limit = parseInt(c.req.query('limit') || '100');
  const offset = parseInt(c.req.query('offset') || '0');

  const filter = {
    userId: c.req.query('userId'),
    action: c.req.query('action'),
    resource: c.req.query('resource'),
    outcome: c.req.query('outcome') as 'success' | 'failure' | 'error',
    startDate: c.req.query('startDate'),
    endDate: c.req.query('endDate')
  };

  const events = await auditLogger.queryEvents(filter, limit, offset);
  return c.json(events);
});

app.get('/audit/events/:id', async (c) => {
  const id = c.req.param('id');
  const event = await auditLogger.getEventById(id);

  if (!event) {
    return c.json({ error: 'Event not found' }, 404);
  }

  return c.json(event);
});

app.get('/audit/stats', async (c) => {
  const hours = parseInt(c.req.query('hours') || '24');
  const stats = await auditLogger.getAuditStats(hours);
  return c.json(stats);
});

app.get('/audit/compliance', async (c) => {
  const startDate = c.req.query('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const endDate = c.req.query('endDate') || new Date().toISOString();

  const report = await auditLogger.createComplianceReport(startDate, endDate);
  return c.json(report);
});

app.get('/audit/export', async (c) => {
  const format = c.req.query('format') as 'json' | 'csv' || 'json';

  const filter = {
    userId: c.req.query('userId'),
    action: c.req.query('action'),
    resource: c.req.query('resource'),
    outcome: c.req.query('outcome') as 'success' | 'failure' | 'error',
    startDate: c.req.query('startDate'),
    endDate: c.req.query('endDate')
  };

  const exportData = await auditLogger.exportEvents(filter, format);

  if (format === 'csv') {
    return c.text(exportData, 200, {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="audit-export-${new Date().toISOString().split('T')[0]}.csv"`
    });
  }

  return c.json(JSON.parse(exportData));
});

// SLO monitoring endpoints
app.get('/slo/status', async (c) => {
  const statuses = await sloMonitor.getAllErrorBudgetStatuses();
  return c.json(statuses);
});

app.get('/slo/:sloId', async (c) => {
  const sloId = c.req.param('sloId');
  const report = await sloMonitor.getSLOReport(sloId);
  return c.json(report);
});

app.get('/slo/:sloId/history', async (c) => {
  const sloId = c.req.param('sloId');
  const days = parseInt(c.req.query('days') || '30');

  const history = await sloMonitor.getSLOHistory(sloId, days);
  return c.json(history);
});

app.get('/slo/:sloId/burn-rate', async (c) => {
  const sloId = c.req.param('sloId');
  const report = await sloMonitor.getBurnRateReport(sloId);
  return c.json(report);
});

app.post('/slo/events', async (c) => {
  const { service, indicator, success, value } = await c.req.json();

  await sloMonitor.recordEvent(service, indicator, success, value);
  return c.json({ success: true });
});

// Dashboard endpoint - combines all reliability data
app.get('/dashboard', async (c) => {
  const [
    healthScore,
    dependencies,
    activeAlerts,
    sloStatuses,
    auditStats,
    alertStats,
    recoveryStats
  ] = await Promise.all([
    healthScorer.calculateOverallHealthScore(),
    dependencyMonitor.checkAllDependencies(),
    alertingSystem.getActiveAlerts(),
    sloMonitor.getAllErrorBudgetStatuses(),
    auditLogger.getAuditStats(24),
    alertingSystem.getAlertStats(24),
    automatedRecovery.getRecoveryStats(24)
  ]);

  return c.json({
    timestamp: new Date().toISOString(),
    health: {
      score: healthScore.overall,
      status: healthScorer.getHealthStatus(healthScore.overall),
      trend: healthScore.trend,
      components: healthScore.components
    },
    dependencies: {
      total: dependencies.length,
      healthy: dependencies.filter(d => d.status === 'healthy').length,
      degraded: dependencies.filter(d => d.status === 'degraded').length,
      unhealthy: dependencies.filter(d => d.status === 'unhealthy').length
    },
    alerts: {
      active: activeAlerts.length,
      critical: activeAlerts.filter(a => a.severity === 'critical').length,
      high: activeAlerts.filter(a => a.severity === 'high').length,
      medium: activeAlerts.filter(a => a.severity === 'medium').length,
      low: activeAlerts.filter(a => a.severity === 'low').length
    },
    slos: {
      total: sloStatuses.length,
      healthy: sloStatuses.filter(s => s.status === 'healthy').length,
      warning: sloStatuses.filter(s => s.status === 'warning').length,
      burning: sloStatuses.filter(s => s.status === 'burning').length,
      exhausted: sloStatuses.filter(s => s.status === 'exhausted').length
    },
    audit: auditStats,
    recovery: recoveryStats,
    metrics: {
      mttr: alertStats.mttr,
      failureRate: auditStats.failureRate,
      successRate: 100 - auditStats.failureRate
    }
  });
});

// Start monitoring endpoints
app.post('/monitoring/start', async (c) => {
  dependencyMonitor.startMonitoring();
  automatedRecovery.runRecovery();
  alertingSystem.startEvaluation();
  sloMonitor.startMonitoring();

  return c.json({
    success: true,
    message: 'All monitoring systems started'
  });
});

app.post('/monitoring/stop', async (c) => {
  dependencyMonitor.stopMonitoring();
  alertingSystem.stopEvaluation();
  sloMonitor.stopMonitoring();

  return c.json({
    success: true,
    message: 'Monitoring systems stopped'
  });
});

export default app;