/**
 * Authentication & Authorization Middleware
 * JWT-based authentication with role-based access control
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { apiConfig } from '../config';
import { logger } from '../utils/logger';
import { supabase } from '../integrations/supabase';

export interface AuthenticatedRequest extends Request {
  user?: User;
  requestId?: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  profile?: {
    fullName: string;
    phone?: string;
    avatar?: string;
  };
  metadata?: Record<string, any>;
}

export interface JWTPayload {
  sub: string; // user id
  email: string;
  role: string;
  permissions: string[];
  iat?: number;
  exp?: number;
  jti?: string;
}

export class AuthMiddleware {
  /**
   * Generate JWT access token
   */
  static generateAccessToken(user: User): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp' | 'jti'> = {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    };

    return jwt.sign(payload, apiConfig.jwtSecret, {
      expiresIn: apiConfig.jwtExpiresIn,
      issuer: 'mariia-hub-api',
      audience: 'mariia-hub-client',
      jwtid: this.generateTokenId(),
    });
  }

  /**
   * Generate JWT refresh token
   */
  static generateRefreshToken(user: User): string {
    const payload = {
      sub: user.id,
      type: 'refresh',
    };

    return jwt.sign(payload, apiConfig.refreshSecret, {
      expiresIn: apiConfig.refreshExpiresIn,
      issuer: 'mariia-hub-api',
      audience: 'mariia-hub-client',
      jwtid: this.generateTokenId(),
    });
  }

  /**
   * Verify and decode JWT token
   */
  static verifyToken(token: string, secret: string): JWTPayload {
    try {
      return jwt.verify(token, secret, {
        issuer: 'mariia-hub-api',
        audience: 'mariia-hub-client',
      }) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  /**
   * Extract token from request headers
   */
  static extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Also check for API key
    const apiKey = req.headers['x-api-key'] as string;
    if (apiKey) {
      return this.verifyApiKey(apiKey);
    }

    return null;
  }

  /**
   * Verify API key and return user token
   */
  static verifyApiKey(apiKey: string): string | null {
    // In a real implementation, you would verify the API key against your database
    // For now, we'll return null to force JWT authentication
    return null;
  }

  /**
   * Generate unique token ID
   */
  private static generateTokenId(): string {
    return require('crypto').randomUUID();
  }

  /**
   * Hash password
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, apiConfig.bcryptRounds);
  }

  /**
   * Verify password
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Fetch user from database
   */
  static async fetchUser(userId: string): Promise<User | null> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        logger.warn('User not found', { userId, error: error?.message });
        return null;
      }

      // Get user permissions based on role
      const permissions = this.getPermissionsForRole(profile.role);

      return {
        id: profile.id,
        email: profile.email || '',
        role: profile.role || 'user',
        permissions,
        profile: {
          fullName: profile.full_name || '',
          phone: profile.phone,
          avatar: profile.avatar_url,
        },
        metadata: profile.preferences as Record<string, any>,
      };
    } catch (error) {
      logger.error('Error fetching user', { userId, error });
      return null;
    }
  }

  /**
   * Get permissions for a role
   */
  private static getPermissionsForRole(role: string): string[] {
    const rolePermissions: Record<string, string[]> = {
      admin: [
        'read:all',
        'write:all',
        'delete:all',
        'manage:users',
        'manage:services',
        'manage:bookings',
        'manage:payments',
        'view:analytics',
        'manage:system',
      ],
      staff: [
        'read:services',
        'read:bookings',
        'write:bookings',
        'manage:availability',
        'view:analytics',
      ],
      customer: [
        'read:services',
        'write:own_bookings',
        'read:own_bookings',
        'write:own_profile',
        'read:own_profile',
      ],
      user: [
        'read:services',
        'write:own_bookings',
        'read:own_bookings',
        'write:own_profile',
        'read:own_profile',
      ],
    };

    return rolePermissions[role] || rolePermissions.user;
  }

  /**
   * Check if user has required permission
   */
  static hasPermission(user: User, permission: string): boolean {
    return user.permissions.includes(permission) || user.permissions.includes('write:all');
  }

  /**
   * Middleware to authenticate user (required)
   */
  static required = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = this.extractToken(req);

      if (!token) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'No authentication token provided',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const payload = this.verifyToken(token, apiConfig.jwtSecret);
      const user = await this.fetchUser(payload.sub);

      if (!user) {
        res.status(401).json({
          error: 'Authentication failed',
          message: 'User not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      req.user = user;
      logger.info('User authenticated', {
        userId: user.id,
        email: user.email,
        role: user.role,
        requestId: req.requestId,
      });

      next();
    } catch (error) {
      logger.security('Authentication failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: req.requestId,
        ip: req.ip,
      });

      res.status(401).json({
        error: 'Authentication failed',
        message: error instanceof Error ? error.message : 'Authentication error',
        timestamp: new Date().toISOString(),
      });
    }
  };

  /**
   * Middleware to authenticate user (optional)
   */
  static optional = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = this.extractToken(req);

      if (token) {
        const payload = this.verifyToken(token, apiConfig.jwtSecret);
        const user = await this.fetchUser(payload.sub);

        if (user) {
          req.user = user;
          logger.debug('Optional authentication successful', {
            userId: user.id,
            requestId: req.requestId,
          });
        }
      }

      next();
    } catch (error) {
      // For optional auth, we just continue without user
      logger.debug('Optional authentication failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: req.requestId,
      });
      next();
    }
  };

  /**
   * Middleware to check permissions
   */
  static requirePermission = (permission: string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (!this.hasPermission(req.user, permission)) {
        logger.security('Permission denied', {
          userId: req.user.id,
          requiredPermission: permission,
          userPermissions: req.user.permissions,
          requestId: req.requestId,
          ip: req.ip,
        });

        res.status(403).json({
          error: 'Permission denied',
          message: `Insufficient permissions. Required: ${permission}`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      logger.debug('Permission check passed', {
        userId: req.user.id,
        permission,
        requestId: req.requestId,
      });

      next();
    };
  };

  /**
   * Middleware to check role
   */
  static requireRole = (role: string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (req.user.role !== role) {
        logger.security('Role access denied', {
          userId: req.user.id,
          userRole: req.user.role,
          requiredRole: role,
          requestId: req.requestId,
          ip: req.ip,
        });

        res.status(403).json({
          error: 'Access denied',
          message: `Required role: ${role}`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      next();
    };
  };

  /**
   * Middleware to check if user owns the resource
   */
  static requireOwnership = (resourceIdParam: string = 'id') => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const resourceId = req.params[resourceIdParam];
      const userId = req.user.id;

      // Admin users can access any resource
      if (req.user.role === 'admin') {
        next();
        return;
      }

      // Check if user owns the resource
      if (resourceId === userId) {
        next();
        return;
      }

      logger.security('Ownership check failed', {
        userId,
        resourceId,
        requestId: req.requestId,
        ip: req.ip,
      });

      res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own resources',
        timestamp: new Date().toISOString(),
      });
    };
  };
}

export const authMiddleware = AuthMiddleware;
export default authMiddleware;