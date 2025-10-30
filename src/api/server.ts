/**
 * Main API Server Configuration
 * Enterprise-grade API ecosystem for beauty and fitness booking platform
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { ApolloServer } from 'apollo-server-express';
import { graphqlSchema } from './graphql/schema';
import { context as graphqlContext } from './graphql/context';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { validateRequest } from './middleware/validation';
import { setupRoutes } from './routes';
import { setupWebSocket } from './websocket';
import { apiConfig, swaggerConfig } from './config';
import { logger } from './utils/logger';

export class APIServer {
  public app: express.Application;
  public server: any;
  public io: SocketIOServer;
  public apolloServer: ApolloServer;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.apolloServer = new ApolloServer({
      schema: graphqlSchema,
      context: graphqlContext,
      introspection: process.env.NODE_ENV !== 'production',
      plugins: [
        {
          requestDidStart() {
            return {
              didResolveOperation(requestContext) {
                logger.info('GraphQL Operation', {
                  operation: requestContext.request.operationName,
                  variables: requestContext.request.variables,
                });
              },
              didEncounterErrors(requestContext) {
                logger.error('GraphQL Errors', {
                  errors: requestContext.errors,
                  operation: requestContext.request.operationName,
                });
              },
            };
          },
        },
      ],
    });
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: apiConfig.corsOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.initializeMiddlewares();
    this.initializeGraphQL();
    this.initializeSwagger();
    this.initializeRoutes();
    this.initializeWebSocket();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", "wss:", "ws:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: apiConfig.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-API-Key',
        'X-Client-Version',
      ],
    }));

    // Compression
    this.app.use(compression());

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    this.app.use(morgan('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim()),
      },
    }));
    this.app.use(requestLogger);

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: apiConfig.rateLimitMax,
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes',
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Skip rate limiting for health checks and internal requests
        return req.path === '/health' || req.path === '/metrics' ||
               req.ip === '127.0.0.1' || req.ip === '::1';
      },
    });
    this.app.use('/api/', limiter);

    // API versioning
    this.app.use('/api/v1', (req, res, next) => {
      res.setHeader('API-Version', '1.0.0');
      next();
    });
  }

  private initializeGraphQL(): void {
    this.apolloServer.start().then(() => {
      this.app.use('/graphql', authMiddleware.optional);
      this.apolloServer.applyMiddleware({
        app: this.app,
        path: '/graphql',
        cors: false, // Disable Apollo Server's CORS as we handle it ourselves
      });
    });
  }

  private initializeSwagger(): void {
    const specs = swaggerJsdoc(swaggerConfig);
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Mariia Hub API Documentation',
    }));

    // JSON specification
    this.app.get('/api-docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(specs);
    });
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
      });
    });

    // API information endpoint
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'Mariia Hub API',
        version: '1.0.0',
        description: 'Enterprise-grade API for beauty and fitness booking platform',
        endpoints: {
          rest: '/api/v1',
          graphql: '/graphql',
          websocket: '/socket.io/',
          documentation: '/api-docs',
        },
        health: '/health',
        metrics: '/metrics',
      });
    });

    // Metrics endpoint (basic)
    this.app.get('/metrics', (req, res) => {
      res.set('Content-Type', 'text/plain');
      res.send(`
# HELP api_requests_total Total number of API requests
# TYPE api_requests_total counter
api_requests_total ${process.uptime()}

# HELP api_uptime_seconds API uptime in seconds
# TYPE api_uptime_seconds gauge
api_uptime_seconds ${process.uptime()}
      `);
    });

    // Setup API routes
    setupRoutes(this.app);
  }

  private initializeWebSocket(): void {
    setupWebSocket(this.io);
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
      });
    });

    // Global error handler
    this.app.use(errorHandler);
  }

  public async start(port: number = process.env.API_PORT ? parseInt(process.env.API_PORT) : 3001): Promise<void> {
    try {
      await this.apolloServer.start();
      this.server.listen(port, () => {
        logger.info(`🚀 API Server started successfully`, {
          port,
          environment: process.env.NODE_ENV || 'development',
          graphql: `http://localhost:${port}/graphql`,
          rest: `http://localhost:${port}/api/v1`,
          websocket: `ws://localhost:${port}/socket.io/`,
          documentation: `http://localhost:${port}/api-docs`,
          health: `http://localhost:${port}/health`,
        });
      });
    } catch (error) {
      logger.error('Failed to start API server:', error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    logger.info('Shutting down API server...');

    await this.apolloServer.stop();
    this.io.close();
    this.server.close(() => {
      logger.info('API server stopped successfully');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 10000);
  }
}

// Initialize server
const apiServer = new APIServer();

// Graceful shutdown handling
process.on('SIGTERM', () => apiServer.stop());
process.on('SIGINT', () => apiServer.stop());
process.on('SIGUSR2', () => apiServer.stop()); // For nodemon

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server if this file is run directly
if (require.main === module) {
  apiServer.start();
}

export default apiServer;