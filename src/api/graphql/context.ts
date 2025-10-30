/**
 * GraphQL Context
 * Context setup for GraphQL resolvers
 */

import { Request } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { supabaseService } from '../integrations/supabase';
import { logger } from '../utils/logger';

export interface GraphQLContext {
  req: Request;
  user?: any;
  supabase: any;
  logger: any;
  requestId: string;
}

export const context = async ({ req }: { req: Request }): Promise<GraphQLContext> => {
  const requestId = (req as any).requestId || generateRequestId();

  // Extract user from request if already authenticated
  let user = (req as AuthenticatedRequest).user;

  // If no user but there's an authorization header, try to authenticate
  if (!user && req.headers.authorization) {
    try {
      // Create a mock response object for auth middleware
      const mockRes = {
        status: () => mockRes,
        json: () => mockRes,
      } as any;

      // Run auth middleware
      await new Promise<void>((resolve, reject) => {
        authMiddleware.optional(req, mockRes, (error: any) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      user = (req as AuthenticatedRequest).user;
    } catch (error) {
      logger.debug('GraphQL authentication failed', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    req,
    user,
    supabase: supabaseService,
    logger,
    requestId,
  };
};

function generateRequestId(): string {
  return `gql_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default context;