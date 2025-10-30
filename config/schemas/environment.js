import Joi from 'joi';

/**
 * Environment Configuration Schema
 * Defines validation rules for environment configurations
 */

const environmentSchema = Joi.object({
  // Basic environment information
  name: Joi.string()
    .pattern(/^[a-z0-9-]+$/)
    .min(3)
    .max(50)
    .required()
    .description('Environment name (lowercase letters, numbers, and hyphens only)'),

  type: Joi.string()
    .valid('development', 'staging', 'production', 'feature', 'ephemeral')
    .required()
    .description('Environment type'),

  description: Joi.string()
    .max(500)
    .optional()
    .description('Environment description'),

  // Network configuration
  namespace: Joi.string()
    .pattern(/^[a-z0-9-]+$/)
    .required()
    .description('Kubernetes namespace or Docker network name'),

  domain: Joi.string()
    .domain()
    .required()
    .description('Primary domain for the environment'),

  domains: Joi.array()
    .items(Joi.string().domain())
    .optional()
    .description('Additional domains for the environment'),

  // Resource configuration
  resources: Joi.object({
    cpu: Joi.string()
      .pattern(/^\d+m$/)
      .required()
      .description('CPU allocation in millicores (e.g., 1000m)'),

    memory: Joi.string()
      .pattern(/^\d+[KMGT]?i$/)
      .required()
      .description('Memory allocation (e.g., 512Mi, 2Gi)'),

    storage: Joi.string()
      .pattern(/^\d+[KMGT]?i$/)
      .required()
      .description('Storage allocation (e.g., 5Gi, 20Gi)'),

    replicas: Joi.number()
      .integer()
      .min(1)
      .max(10)
      .required()
      .description('Number of replicas'),

    maxReplicas: Joi.number()
      .integer()
      .min(1)
      .max(50)
      .optional()
      .description('Maximum replicas for auto-scaling'),

    priority: Joi.number()
      .integer()
      .min(0)
      .max(100)
      .default(50)
      .description('Priority for resource allocation')
  }).required(),

  // Service configuration
  services: Joi.object({
    app: Joi.object({
      image: Joi.string()
        .required()
        .description('Docker image name'),

      port: Joi.number()
        .integer()
        .min(1)
        .max(65535)
        .default(3000)
        .description('Application port'),

      env: Joi.object()
        .pattern(Joi.string(), Joi.string())
        .optional()
        .description('Environment variables'),

      command: Joi.array()
        .items(Joi.string())
        .optional()
        .description('Container command'),

      args: Joi.array()
        .items(Joi.string())
        .optional()
        .description('Container arguments'),

      workingDir: Joi.string()
        .optional()
        .description('Container working directory'),

      user: Joi.string()
        .optional()
        .description('Container user'),

      healthCheck: Joi.object({
        path: Joi.string()
          .default('/api/health')
          .description('Health check path'),

        interval: Joi.number()
          .integer()
          .min(5)
          .max(300)
          .default(30)
          .description('Health check interval in seconds'),

        timeout: Joi.number()
          .integer()
          .min(1)
          .max(60)
          .default(10)
          .description('Health check timeout in seconds'),

        retries: Joi.number()
          .integer()
          .min(1)
          .max(10)
          .default(3)
          .description('Health check retry count'),

        startPeriod: Joi.number()
          .integer()
          .min(0)
          .max(300)
          .default(60)
          .description('Startup grace period'),

        successThreshold: Joi.number()
          .integer()
          .min(1)
          .max(10)
          .default(1)
          .description('Consecutive successes required'),

        failureThreshold: Joi.number()
          .integer()
          .min(1)
          .max(10)
          .default(3)
          .description('Consecutive failures tolerated')
      }).default(),

      resources: Joi.object({
        limits: Joi.object({
          cpu: Joi.string().optional(),
          memory: Joi.string().optional()
        }).optional(),
        requests: Joi.object({
          cpu: Joi.string().optional(),
          memory: Joi.string().optional()
        }).optional()
      }).optional(),

      volumes: Joi.array()
        .items(Joi.object({
          name: Joi.string().required(),
          path: Joi.string().required(),
          type: Joi.string().valid('bind', 'volume', 'tmpfs').default('volume'),
          source: Joi.string().optional(),
          readOnly: Joi.boolean().default(false)
        }))
        .optional()
        .description('Volume mounts'),

      ports: Joi.array()
        .items(Joi.object({
          containerPort: Joi.number().integer().required(),
          hostPort: Joi.number().integer().optional(),
          protocol: Joi.string().valid('TCP', 'UDP').default('TCP'),
          name: Joi.string().optional()
        }))
        .optional()
        .description('Port mappings')
    }).required(),

    database: Joi.object({
      type: Joi.string()
        .valid('postgresql', 'mysql', 'mongodb')
        .default('postgresql')
        .description('Database type'),

      version: Joi.string()
        .default('15')
        .description('Database version'),

      size: Joi.string()
        .valid('small', 'medium', 'large', 'xlarge')
        .default('medium')
        .description('Database size tier'),

      backup: Joi.boolean()
        .default(false)
        .description('Enable automatic backups'),

      backupSchedule: Joi.string()
        .pattern(/^(\d{1,2}|\*) (\d{1,2}|\*) (\d{1,2}|\*) (\d{1,2}|\*) (\d{1,2}|\*)$/)
        .optional()
        .description('Backup schedule in cron format'),

      retention: Joi.number()
        .integer()
        .min(1)
        .max(365)
        .default(7)
        .description('Backup retention period in days'),

      replicas: Joi.number()
        .integer()
        .min(0)
        .max(5)
        .default(0)
        .description('Number of read replicas'),

      encryption: Joi.boolean()
        .default(false)
        .description('Enable encryption at rest'),

      performanceInsights: Joi.boolean()
        .default(false)
        .description('Enable performance monitoring')
    }).optional(),

    redis: Joi.object({
      enabled: Joi.boolean().default(false),
      size: Joi.string().valid('small', 'medium', 'large').default('small'),
      version: Joi.string().default('7'),
      persistence: Joi.boolean().default(true),
      backup: Joi.boolean().default(false),
      clustering: Joi.boolean().default(false),
      evictionPolicy: Joi.string()
        .valid('noeviction', 'allkeys-lru', 'volatile-lru', 'allkeys-random', 'volatile-random', 'volatile-ttl')
        .default('noeviction')
    }).optional(),

    cdn: Joi.object({
      enabled: Joi.boolean().default(false),
      provider: Joi.string()
        .valid('vercel', 'cloudflare', 'aws-cloudfront', 'fastly')
        .default('vercel'),
      cacheTTL: Joi.number()
        .integer()
        .min(60)
        .max(86400)
        .default(3600)
        .description('Cache TTL in seconds'),
      compression: Joi.boolean().default(true),
      minification: Joi.boolean().default(true)
    }).optional()
  }).required(),

  // Security configuration
  security: Joi.object({
    ssl: Joi.boolean()
      .default(false)
      .description('Enable SSL/TLS'),

    sslCertificate: Joi.object({
      type: Joi.string()
        .valid('letsencrypt', 'custom', 'self-signed')
        .default('letsencrypt'),
      certificate: Joi.string().when('type', {
        is: 'custom',
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
      privateKey: Joi.string().when('type', {
        is: 'custom',
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
      caCertificate: Joi.string().optional()
    }).when('ssl', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional()
    }),

    firewall: Joi.boolean()
      .default(false)
      .description('Enable firewall rules'),

    firewallRules: Joi.array()
      .items(Joi.object({
        protocol: Joi.string().valid('TCP', 'UDP', 'ICMP').default('TCP'),
        port: Joi.number().integer().optional(),
        portRange: Joi.string().optional(),
        source: Joi.string().default('0.0.0.0/0'),
        action: Joi.string().valid('allow', 'deny').default('allow'),
        description: Joi.string().optional()
      }))
      .when('firewall', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional()
      }),

    rateLimit: Joi.object({
      enabled: Joi.boolean().default(true),
      requests: Joi.number()
        .integer()
        .min(1)
        .max(10000)
        .default(100)
        .description('Requests per window'),

      windowMs: Joi.number()
        .integer()
        .min(1000)
        .max(3600000)
        .default(60000)
        .description('Window duration in milliseconds'),

      skipSuccessfulRequests: Joi.boolean().default(false),
      skipFailedRequests: Joi.boolean().default(false),
      max: Joi.number().integer().optional(),
      standardHeaders: Joi.boolean().default(true),
      legacyHeaders: Joi.boolean().default(false)
    }).required(),

    cors: Joi.object({
      enabled: Joi.boolean().default(true),
      origins: Joi.array()
        .items(Joi.string())
        .default(['http://localhost:3000']),
      methods: Joi.array()
        .items(Joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'))
        .default(['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
      allowedHeaders: Joi.array()
        .items(Joi.string())
        .default(['Content-Type', 'Authorization']),
      exposedHeaders: Joi.array()
        .items(Joi.string())
        .default([]),
      credentials: Joi.boolean().default(false),
      maxAge: Joi.number()
        .integer()
        .min(0)
        .max(86400)
        .default(86400)
        .description('CORS max age in seconds'),
      preflightContinue: Joi.boolean().default(false),
      optionsSuccessStatus: Joi.number()
        .integer()
        .valid(204, 200)
        .default(204)
    }).required(),

    authentication: Joi.object({
      enabled: Joi.boolean().default(false),
      type: Joi.string()
        .valid('oauth', 'jwt', 'basic', 'apikey')
        .default('jwt'),
      providers: Joi.array()
        .items(Joi.string())
        .when('type', {
          is: 'oauth',
          then: Joi.required().min(1),
          otherwise: Joi.optional()
        }),
      sessionTimeout: Joi.number()
        .integer()
        .min(300)
        .max(86400)
        .default(3600)
        .description('Session timeout in seconds')
    }).optional()
  }).required(),

  // Monitoring configuration
  monitoring: Joi.object({
    enabled: Joi.boolean().default(true),
    metrics: Joi.object({
      enabled: Joi.boolean().default(true),
      port: Joi.number().integer().default(9090),
      path: Joi.string().default('/metrics'),
      interval: Joi.number()
        .integer()
        .min(1)
        .max(300)
        .default(15)
        .description('Metrics collection interval in seconds')
    }).default(),

    logging: Joi.object({
      enabled: Joi.boolean().default(true),
      level: Joi.string()
        .valid('error', 'warn', 'info', 'debug', 'trace')
        .default('info'),
      format: Joi.string()
        .valid('json', 'text', 'structured')
        .default('json'),
      destination: Joi.string()
        .valid('console', 'file', 'elasticsearch', 'cloudwatch')
        .default('console'),
      retention: Joi.number()
        .integer()
        .min(1)
        .max(365)
        .default(30)
        .description('Log retention in days')
    }).default(),

    tracing: Joi.object({
      enabled: Joi.boolean().default(false),
      jaeger: Joi.object({
        endpoint: Joi.string().optional(),
        service: Joi.string().default('mariaborysevych-app'),
        samplingRate: Joi.number()
          .min(0)
          .max(1)
          .default(0.1)
      }).when('enabled', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional()
      })
    }).default(),

    alerts: Joi.object({
      enabled: Joi.boolean().default(false),
      channels: Joi.array()
        .items(Joi.string().valid('email', 'slack', 'pagerduty', 'webhook'))
        .default(['email']),
      rules: Joi.array()
        .items(Joi.object({
          name: Joi.string().required(),
          condition: Joi.string().required(),
          threshold: Joi.number().required(),
          duration: Joi.number().integer().default(300),
          severity: Joi.string()
            .valid('critical', 'warning', 'info')
            .default('warning')
        }))
        .default([])
    }).default()
  }).required(),

  // Backup configuration
  backup: Joi.object({
    enabled: Joi.boolean().default(false),
    schedule: Joi.string()
      .pattern(/^(\d{1,2}|\*) (\d{1,2}|\*) (\d{1,2}|\*) (\d{1,2}|\*) (\d{1,2}|\*)$/)
      .when('enabled', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional()
      })
      .description('Backup schedule in cron format'),

    retention: Joi.number()
      .integer()
      .min(1)
      .max(365)
      .default(7)
      .description('Backup retention period in days'),

    destination: Joi.object({
      type: Joi.string()
        .valid('s3', 'gcs', 'azure', 'local')
        .default('local'),
      bucket: Joi.string().when('type', {
        is: Joi.not('local'),
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
      path: Joi.string().default('./backups'),
      encryption: Joi.boolean().default(true),
      compression: Joi.boolean().default(true)
    }).when('enabled', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional()
    }),

    exclude: Joi.array()
      .items(Joi.string())
      .default([])
      .description('Patterns to exclude from backups')
  }).default(),

  // Auto-scaling configuration
  autoscaling: Joi.object({
    enabled: Joi.boolean().default(false),
    minReplicas: Joi.number()
      .integer()
      .min(1)
      .default(1),
    maxReplicas: Joi.number()
      .integer()
      .min(2)
      .max(50)
      .default(5),
    targetCPUUtilization: Joi.number()
      .min(10)
      .max(90)
      .default(70),
    targetMemoryUtilization: Joi.number()
      .min(10)
      .max(90)
      .default(80),
    scaleUpPeriod: Joi.number()
      .integer()
      .min(60)
      .max(3600)
      .default(60)
      .description('Scale up cooldown in seconds'),
    scaleDownPeriod: Joi.number()
      .integer()
      .min(60)
      .max(3600)
      .default(300)
      .description('Scale down cooldown in seconds'),
    metrics: Joi.array()
      .items(Joi.string().valid('cpu', 'memory', 'custom'))
      .default(['cpu', 'memory'])
  }).default(),

  // Environment-specific settings
  environmentVariables: Joi.object()
    .pattern(Joi.string(), Joi.alternatives().try(
      Joi.string(),
      Joi.number(),
      Joi.boolean(),
      Joi.object()
    ))
    .optional()
    .description('Additional environment variables'),

  labels: Joi.object()
    .pattern(Joi.string(), Joi.string())
    .optional()
    .description('Resource labels'),

  annotations: Joi.object()
    .pattern(Joi.string(), Joi.string())
    .optional()
    .description('Resource annotations'),

  // Lifecycle settings
  lifecycle: Joi.object({
    ttl: Joi.number()
      .integer()
      .min(300)
      .max(2592000)
      .optional()
      .description('Time to live in seconds for ephemeral environments'),

    sleepSchedule: Joi.object({
      enabled: Joi.boolean().default(false),
      timezone: Joi.string().default('Europe/Warsaw'),
      sleepTime: Joi.string()
        .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .default('22:00'),
      wakeTime: Joi.string()
        .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .default('08:00'),
      timezone: Joi.string().default('Europe/Warsaw'),
      weekends: Joi.boolean().default(false)
    }).optional(),

    cleanup: Joi.object({
      enabled: Joi.boolean().default(false),
      schedule: Joi.string()
        .pattern(/^(\d{1,2}|\*) (\d{1,2}|\*) (\d{1,2}|\*) (\d{1,2}|\*) (\d{1,2}|\*)$/)
        .when('enabled', {
          is: true,
          then: Joi.required(),
          otherwise: Joi.optional()
        }),
      retention: Joi.number()
        .integer()
        .min(1)
        .max(365)
        .default(30)
    }).optional()
  }).optional(),

  // Integration settings
  integrations: Joi.object({
    git: Joi.object({
      branch: Joi.string().default('main'),
      commit: Joi.string().optional(),
      deployOnPush: Joi.boolean().default(true),
      webhookSecret: Joi.string().optional()
    }).optional(),

    ci_cd: Joi.object({
      enabled: Joi.boolean().default(false),
      provider: Joi.string()
        .valid('github-actions', 'gitlab-ci', 'jenkins', 'circleci')
        .default('github-actions'),
      pipeline: Joi.string().optional(),
      artifacts: Joi.boolean().default(true)
    }).optional(),

    monitoring: Joi.object({
      provider: Joi.string()
        .valid('prometheus', 'datadog', 'newrelic', 'grafana')
        .default('prometheus'),
      endpoint: Joi.string().optional(),
      apiKey: Joi.string().optional()
    }).optional()
  }).optional(),

  // Feature flags
  features: Joi.object({
    debug: Joi.boolean().default(false),
    hotReload: Joi.boolean().default(false),
    verboseLogs: Joi.boolean().default(false),
    profiling: Joi.boolean().default(false),
    maintenanceMode: Joi.boolean().default(false),
    canaryDeployments: Joi.boolean().default(false),
    blueGreenDeployments: Joi.boolean().default(false),
    a_b_testing: Joi.boolean().default(false)
  }).default(),

  // Metadata
  metadata: Joi.object({
    owner: Joi.string().optional(),
    team: Joi.string().optional(),
    project: Joi.string().optional(),
    costCenter: Joi.string().optional(),
    environment: Joi.string().optional(),
    purpose: Joi.string().optional(),
    sla: Joi.string().optional(),
    compliance: Joi.array().items(Joi.string()).optional(),
    tags: Joi.array().items(Joi.string()).optional()
  }).optional()
});

export default environmentSchema;