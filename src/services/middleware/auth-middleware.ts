import { Context, Next } from 'hono';

import { supabase } from '@/integrations/supabase/client';

import { ApiError } from '../api/base.service';

export interface AuthMiddlewareOptions {
  required?: boolean;
  roles?: string[];
  permissions?: string[];
  skipPaths?: string[];
  allowApiKey?: boolean;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  metadata?: Record<string, any>;
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  permissions: string[];
  userId?: string;
  rateLimitTier?: string;
}

export class AuthMiddleware {
  /**
   * Authentication middleware
   */
  static authenticate(options: AuthMiddlewareOptions = {}) {
    return async (c: Context, next: Next) => {
      const {
        required = true,
        roles = [],
        permissions = [],
        skipPaths = [],
        allowApiKey = false
      } = options;

      // Check if path should be skipped
      if (skipPaths.some(path => c.req.path.startsWith(path))) {
        await next();
        return;
      }

      let user: AuthenticatedUser | null = null;
      let apiKey: ApiKeyInfo | null = null;

      try {
        // Try JWT authentication first
        const authHeader = c.req.header('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          user = await this.verifyJwtToken(token);
        }

        // Try API key authentication if JWT failed and allowed
        if (!user && allowApiKey) {
          const apiKeyHeader = c.req.header('x-api-key');
          if (apiKeyHeader) {
            apiKey = await this.verifyApiKey(apiKeyHeader);
          }
        }

        // If authentication is required and both failed
        if (required && !user && !apiKey) {
          const error: ApiError = {
            message: 'Authentication required',
            code: 'AUTHENTICATION_REQUIRED',
            details: {
              message: 'Please provide valid authentication credentials'
            },
            timestamp: new Date().toISOString()
          };

          c.status(401);
          return c.json(error);
        }

        // Role-based authorization
        if (user && roles.length > 0 && !roles.includes(user.role)) {
          const error: ApiError = {
            message: 'Insufficient permissions',
            code: 'INSUFFICIENT_PERMISSIONS',
            details: {
              requiredRoles: roles,
              userRole: user.role
            },
            timestamp: new Date().toISOString()
          };

          c.status(403);
          return c.json(error);
        }

        // Permission-based authorization
        if (user && permissions.length > 0) {
          const hasPermission = permissions.every(permission =>
            user.permissions.includes(permission)
          );

          if (!hasPermission) {
            const error: ApiError = {
              message: 'Insufficient permissions',
              code: 'INSUFFICIENT_PERMISSIONS',
              details: {
                requiredPermissions: permissions,
                userPermissions: user.permissions
              },
              timestamp: new Date().toISOString()
            };

            c.status(403);
            return c.json(error);
          }
        }

        // API key permission check
        if (apiKey && permissions.length > 0) {
          const hasPermission = permissions.every(permission =>
            apiKey.permissions.includes(permission)
          );

          if (!hasPermission) {
            const error: ApiError = {
              message: 'API key lacks required permissions',
              code: 'INSUFFICIENT_PERMISSIONS',
              details: {
                requiredPermissions: permissions,
                apiKeyPermissions: apiKey.permissions
              },
              timestamp: new Date().toISOString()
            };

            c.status(403);
            return c.json(error);
          }
        }

        // Add user info to context
        if (user) {
          c.set('user', user);
          c.res.headers.set('X-User-ID', user.id);
          c.res.headers.set('X-User-Role', user.role);
        }

        if (apiKey) {
          c.set('apiKey', apiKey);
          c.res.headers.set('X-API-Key-ID', apiKey.id);
        }

        await next();
      } catch (error) {
        const authError: ApiError = {
          message: 'Authentication failed',
          code: 'AUTHENTICATION_FAILED',
          details: {
            originalError: error instanceof Error ? error.message : 'Unknown error'
          },
          timestamp: new Date().toISOString()
        };

        c.status(401);
        return c.json(authError);
      }
    };
  }

  /**
   * Require specific user role
   */
  static requireRole(role: string) {
    return this.authenticate({ roles: [role] });
  }

  /**
   * Require one of multiple roles
   */
  static requireAnyRole(roles: string[]) {
    return this.authenticate({ roles });
  }

  /**
   * Require specific permission
   */
  static requirePermission(permission: string) {
    return this.authenticate({ permissions: [permission] });
  }

  /**
   * Require multiple permissions
   */
  static requirePermissions(permissions: string[]) {
    return this.authenticate({ permissions });
  }

  /**
   * Optional authentication (don't fail if not authenticated)
   */
  static optional() {
    return this.authenticate({ required: false });
  }

  /**
   * API key authentication only
   */
  static apiKeyOnly(permissions: string[] = []) {
    return this.authenticate({ allowApiKey: true, permissions });
  }

  /**
   * Verify JWT token and return user info
   */
  private static async verifyJwtToken(token: string): Promise<AuthenticatedUser | null> {
    try {
      const { data: user, error } = await supabase.auth.getUser(token);

      if (error || !user?.user) {
        return null;
      }

      // Get user role and permissions from database
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select(`
          role,
          permissions,
          metadata
        `)
        .eq('id', user.user.id)
        .single();

      if (profileError || !userProfile) {
        // Return basic user info if profile not found
        return {
          id: user.user.id,
          email: user.user.email || '',
          role: 'user',
          permissions: []
        };
      }

      return {
        id: user.user.id,
        email: user.user.email || '',
        role: userProfile.role,
        permissions: userProfile.permissions || [],
        metadata: userProfile.metadata
      };
    } catch (error) {
      console.error('JWT verification error:', error);
      return null;
    }
  }

  /**
   * Verify API key and return key info
   */
  private static async verifyApiKey(apiKey: string): Promise<ApiKeyInfo | null> {
    try {
      const { data: keyData, error } = await supabase
        .from('api_keys')
        .select(`
          id,
          name,
          permissions,
          user_id,
          rate_limit_tier,
          is_active,
          expires_at
        `)
        .eq('key_hash', this.hashApiKey(apiKey))
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .single();

      if (error || !keyData) {
        return null;
      }

      // Log API key usage
      await supabase
        .from('api_key_usage')
        .insert({
          api_key_id: keyData.id,
          endpoint: '',
          method: '',
          ip_address: '', // Would be set from context
          user_agent: '',
          created_at: new Date().toISOString()
        });

      return {
        id: keyData.id,
        name: keyData.name,
        permissions: keyData.permissions || [],
        userId: keyData.user_id,
        rateLimitTier: keyData.rate_limit_tier
      };
    } catch (error) {
      console.error('API key verification error:', error);
      return null;
    }
  }

  /**
   * Hash API key for storage/comparison
   */
  private static hashApiKey(apiKey: string): string {
    // In a real implementation, use a proper hashing algorithm
    // This is just for demonstration
    return Buffer.from(apiKey).toString('base64');
  }

  /**
   * Get current user from context
   */
  static getCurrentUser(c: Context): AuthenticatedUser | null {
    return c.get('user') || null;
  }

  /**
   * Get current API key info from context
   */
  static getCurrentApiKey(c: Context): ApiKeyInfo | null {
    return c.get('apiKey') || null;
  }

  /**
   * Check if user has specific permission
   */
  static hasPermission(user: AuthenticatedUser, permission: string): boolean {
    return user.permissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  static hasAnyPermission(user: AuthenticatedUser, permissions: string[]): boolean {
    return permissions.some(permission => user.permissions.includes(permission));
  }

  /**
   * Check if user has all specified permissions
   */
  static hasAllPermissions(user: AuthenticatedUser, permissions: string[]): boolean {
    return permissions.every(permission => user.permissions.includes(permission));
  }

  /**
   * Check if user has specific role
   */
  static hasRole(user: AuthenticatedUser, role: string): boolean {
    return user.role === role;
  }
}

// Common role definitions
export const Roles = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
  USER: 'user'
};

// Common permission definitions
export const Permissions = {
  // User management
  USER_READ: 'user:read',
  USER_WRITE: 'user:write',
  USER_DELETE: 'user:delete',

  // Booking management
  BOOKING_READ: 'booking:read',
  BOOKING_WRITE: 'booking:write',
  BOOKING_DELETE: 'booking:delete',
  BOOKING_MANAGE_ALL: 'booking:manage_all',

  // Service management
  SERVICE_READ: 'service:read',
  SERVICE_WRITE: 'service:write',
  SERVICE_DELETE: 'service:delete',

  // Analytics
  ANALYTICS_READ: 'analytics:read',
  ANALYTICS_EXPORT: 'analytics:export',

  // System administration
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_LOGS: 'system:logs',
  SYSTEM_HEALTH: 'system:health',

  // Payment processing
  PAYMENT_READ: 'payment:read',
  PAYMENT_WRITE: 'payment:write',
  PAYMENT_REFUND: 'payment:refund',

  // Content management
  CONTENT_READ: 'content:read',
  CONTENT_WRITE: 'content:write',
  CONTENT_DELETE: 'content:delete',
  CONTENT_PUBLISH: 'content:publish'
};