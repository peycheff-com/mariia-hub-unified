import { createRoute , OpenAPIHono } from '@hono/zod-openapi';
import { z } from 'zod';

import { healthChecker } from '@/lib/reliability/health-checker';

const HealthSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.string(),
  duration: z.number(),
  details: z.record(z.any()),
  checks: z.array(z.object({
    name: z.string(),
    status: z.enum(['pass', 'fail', 'warn']),
    duration: z.number(),
    message: z.string().optional(),
    details: z.record(z.any()).optional()
  }))
});

const DependenciesSchema = z.array(z.object({
  name: z.string(),
  type: z.enum(['database', 'api', 'cache', 'queue', 'external']),
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  responseTime: z.number().optional(),
  error: z.string().optional(),
  lastChecked: z.string()
}));

const HealthScoreSchema = z.object({
  overall: z.number(),
  components: z.record(z.number()),
  timestamp: z.string(),
  trend: z.enum(['improving', 'stable', 'degrading'])
});

const app = new OpenAPIHono();

// Basic health check endpoint
app.openapi(
  createRoute({
    method: 'get',
    path: '/health',
    summary: 'Basic health check',
    description: 'Returns basic health status of the application',
    responses: {
      200: {
        content: {
          'application/json': {
            schema: z.object({
              status: z.enum(['healthy', 'degraded', 'unhealthy']),
              timestamp: z.string()
            })
          }
        },
        description: 'Health status'
      },
      503: {
        description: 'Service unavailable'
      }
    }
  }),
  async (c) => {
    const health = await healthChecker.runHealthChecks();

    return c.json({
      status: health.status,
      timestamp: health.timestamp
    }, health.status === 'unhealthy' ? 503 : 200);
  }
);

// Detailed health check endpoint
app.openapi(
  createRoute({
    method: 'get',
    path: '/health/detailed',
    summary: 'Detailed health check',
    description: 'Returns detailed health status including all component checks',
    responses: {
      200: {
        content: {
          'application/json': {
            schema: HealthSchema
          }
        },
        description: 'Detailed health status'
      }
    }
  }),
  async (c) => {
    const health = await healthChecker.runHealthChecks();

    return c.json(health, health.status === 'unhealthy' ? 503 : 200);
  }
);

// Dependencies health endpoint
app.openapi(
  createRoute({
    method: 'get',
    path: '/health/dependencies',
    summary: 'Check external dependencies',
    description: 'Returns health status of external dependencies',
    responses: {
      200: {
        content: {
          'application/json': {
            schema: DependenciesSchema
          }
        },
        description: 'Dependencies health status'
      }
    }
  }),
  async (c) => {
    const dependencies = await healthChecker.checkDependencies();
    return c.json(dependencies);
  }
);

// Health score endpoint
app.openapi(
  createRoute({
    method: 'get',
    path: '/health/score',
    summary: 'Get health score',
    description: 'Returns calculated health score for all components',
    responses: {
      200: {
        content: {
          'application/json': {
            schema: HealthScoreSchema
          }
        },
        description: 'Health score'
      }
    }
  }),
  async (c) => {
    const score = await healthChecker.calculateHealthScore();
    return c.json(score);
  }
);

// Readiness probe endpoint
app.openapi(
  createRoute({
    method: 'get',
    path: '/ready',
    summary: 'Readiness probe',
    description: 'Kubernetes readiness probe endpoint',
    responses: {
      200: {
        description: 'Service is ready'
      },
      503: {
        description: 'Service is not ready'
      }
    }
  }),
  async (c) => {
    // Check critical services only
    const health = await healthChecker.runHealthChecks();
    const criticalChecks = ['database'];
    const hasFailedCritical = health.checks.some(
      check => criticalChecks.includes(check.name) && check.status === 'fail'
    );

    if (hasFailedCritical) {
      return c.json({
        status: 'not_ready',
        timestamp: health.timestamp
      }, 503);
    }

    return c.json({
      status: 'ready',
      timestamp: health.timestamp
    });
  }
);

// Liveness probe endpoint
app.openapi(
  createRoute({
    method: 'get',
    path: '/live',
    summary: 'Liveness probe',
    description: 'Kubernetes liveness probe endpoint',
    responses: {
      200: {
        description: 'Service is alive'
      },
      503: {
        description: 'Service is not alive'
      }
    }
  }),
  async (c) => {
    // Simple check to see if the process is responding
    return c.json({
      status: 'alive',
      timestamp: new Date().toISOString()
    });
  }
);

export default app;