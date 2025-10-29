import { Context, Next } from 'hono';
import { getAuth } from '@clerk/fastify';

import { auditLogger } from '@/lib/reliability/audit-logger';
import { sloMonitor } from '@/lib/reliability/slo-monitor';
import { healthChecker } from '@/lib/reliability/health-checker';
import { alertingSystem } from '@/lib/reliability/alerting';

interface ReliabilityConfig {
  enableAuditLogging: boolean;
  enableSLOTracking: boolean;
  enableHealthChecks: boolean;
  enableAlerting: boolean;
}

const defaultConfig: ReliabilityConfig = {
  enableAuditLogging: true,
  enableSLOTracking: true,
  enableHealthChecks: true,
  enableAlerting: true
};

export function reliabilityMiddleware(config: Partial<ReliabilityConfig> = {}) {
  const cfg = { ...defaultConfig, ...config };

  return async (c: Context, next: Next) => {
    const start = Date.now();
    const method = c.req.method;
    const path = c.req.path;
    const userAgent = c.req.header('user-agent') || '';
    const ipAddress = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';

    let userId: string | undefined;
    let outcome: 'success' | 'failure' | 'error' = 'success';
    let statusCode = 200;
    let error: Error | undefined;

    try {
      // Get authenticated user if available
      if (cfg.enableAuditLogging) {
        try {
          const auth = getAuth(c);
          userId = auth?.userId;
        } catch {
          // Continue without auth info
        }
      }

      // Pre-request health check for critical endpoints
      if (cfg.enableHealthChecks && isCriticalEndpoint(path)) {
        const health = await healthChecker.runHealthChecks();
        if (health.status === 'unhealthy') {
          // Don't block requests for health endpoints themselves
          if (!path.startsWith('/api/health')) {
            c.status(503);
            return c.json({
              error: 'Service Unavailable',
              message: 'System is currently experiencing issues',
              timestamp: new Date().toISOString()
            });
          }
        }
      }

      // Continue with the request
      await next();

      // Capture response details
      statusCode = c.res.status;

    } catch (err) {
      error = err as Error;
      outcome = 'error';
      statusCode = 500;

      // Log the error
      console.error('Request error:', error);

      // Continue processing for audit/logging
      await next();
    }

    // Calculate request duration
    const duration = Date.now() - start;

    // Determine outcome based on status code
    if (statusCode >= 400 && statusCode < 500) {
      outcome = 'failure';
    } else if (statusCode >= 500) {
      outcome = 'error';
    }

    // Audit logging
    if (cfg.enableAuditLogging) {
      const action = `${method} ${path}`;
      const details = {
        method,
        path,
        statusCode,
        duration,
        userAgent,
        query: c.req.query(),
        body: isSensitiveEndpoint(path) ? '[REDACTED]' : c.req.body
      };

      auditLogger.logApiEvent(
        action,
        path,
        outcome,
        details
      );

      // Log additional details for authenticated users
      if (userId) {
        auditLogger.log({
          userId,
          sessionId: c.req.header('x-session-id'),
          action,
          resource: path,
          outcome,
          details,
          ipAddress,
          userAgent,
          context: {
            method,
            statusCode,
            duration
          }
        });
      }
    }

    // SLO tracking
    if (cfg.enableSLOTracking) {
      try {
        // Track API availability
        await sloMonitor.recordEvent(
          'api',
          'availability',
          outcome === 'success'
        );

        // Track response time for latency SLO
        await sloMonitor.recordEvent(
          'api',
          'latency_p95',
          outcome === 'success',
          duration
        );

        // Track endpoint-specific SLOs
        if (path.startsWith('/api/bookings')) {
          await sloMonitor.recordEvent(
            'booking',
            'booking_success',
            outcome === 'success'
          );
        } else if (path.startsWith('/api/payments')) {
          await sloMonitor.recordEvent(
            'payments',
            'payment_success',
            outcome === 'success'
          );
        }

        // Track database SLOs
        if (path.includes('/db') || path.includes('/database')) {
          await sloMonitor.recordEvent(
            'database',
            'query_success',
            outcome === 'success'
          );
        }

      } catch (err) {
        console.error('Failed to record SLO event:', err);
      }
    }

    // Health check impact monitoring
    if (cfg.enableHealthChecks && (outcome === 'error' || statusCode >= 500)) {
      try {
        // Trigger immediate health check for critical failures
        const health = await healthChecker.runHealthChecks();

        // Evaluate alert rules if health is degraded
        if (cfg.enableAlerting) {
          await alertingSystem.evaluateRules({
            healthCheck: health,
            timestamp: new Date().toISOString(),
            metrics: {
              errorRate: 1,
              averageResponseTime: duration
            }
          });
        }
      } catch (err) {
        console.error('Failed to evaluate health:', err);
      }
    }

    // Add reliability headers to response
    if (cfg.enableHealthChecks) {
      c.res.headers.set('X-Health-Check-Enabled', 'true');
      c.res.headers.set('X-Request-Duration', duration.toString());
    }

    if (cfg.enableSLOTracking) {
      c.res.headers.set('X-SLO-Tracked', 'true');
    }

    if (cfg.enableAuditLogging) {
      c.res.headers.set('X-Audit-Logged', 'true');
    }
  };
}

function isCriticalEndpoint(path: string): boolean {
  const criticalPaths = [
    '/api/bookings',
    '/api/payments',
    '/api/auth',
    '/api/admin'
  ];

  return criticalPaths.some(criticalPath => path.startsWith(criticalPath));
}

function isSensitiveEndpoint(path: string): boolean {
  const sensitivePaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/payments',
    '/api/admin/users'
  ];

  return sensitivePaths.some(sensitivePath => path.startsWith(sensitivePath));
}

// Export convenience functions for different reliability levels
export function fullReliabilityMiddleware() {
  return reliabilityMiddleware(defaultConfig);
}

export function productionReliabilityMiddleware() {
  return reliabilityMiddleware({
    enableAuditLogging: true,
    enableSLOTracking: true,
    enableHealthChecks: true,
    enableAlerting: true
  });
}

export function developmentReliabilityMiddleware() {
  return reliabilityMiddleware({
    enableAuditLogging: true,
    enableSLOTracking: false,
    enableHealthChecks: false,
    enableAlerting: false
  });
}

export function minimalReliabilityMiddleware() {
  return reliabilityMiddleware({
    enableAuditLogging: false,
    enableSLOTracking: true,
    enableHealthChecks: false,
    enableAlerting: false
  });
}