/**
 * Access Control and Authentication System
 *
 * Comprehensive access control implementation with multi-factor authentication,
 * role-based access control, session management, and account security features.
 */

import { Context, Next } from 'hono';
import { productionSecurityConfig } from '../config/production-security';
import { DataEncryption, encryptPII, decryptPII } from './data-encryption';

interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  permissions: string[];
  mfaEnabled: boolean;
  mfaSecret?: string;
  backupCodes: string[];
  failedLoginAttempts: number;
  lockedUntil?: number;
  passwordChangedAt: number;
  lastLoginAt?: number;
  sessions: UserSession[];
  createdAt: number;
  updatedAt: number;
  status: 'active' | 'suspended' | 'pending' | 'locked';
}

interface UserSession {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  userAgent: string;
  ipAddress: string;
  createdAt: number;
  expiresAt: number;
  lastAccessAt: number;
  mfaVerified: boolean;
  isActive: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  inheritFrom?: string[];
  system: boolean;
  createdAt: number;
  updatedAt: number;
}

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
  system: boolean;
}

interface MFADevice {
  id: string;
  userId: string;
  type: 'totp' | 'sms' | 'email' | 'hardware-key';
  identifier: string;
  secret: string;
  backup: boolean;
  verified: boolean;
  lastUsed?: number;
  createdAt: number;
}

interface SecurityEvent {
  id: string;
  userId?: string;
  sessionId?: string;
  type: 'login' | 'logout' | 'password_change' | 'mfa_enable' | 'mfa_disable' |
        'permission_change' | 'account_lock' | 'account_unlock' | 'suspicious_activity';
  description: string;
  ipAddress: string;
  userAgent: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata: Record<string, any>;
}

type UserRole = 'super_admin' | 'admin' | 'manager' | 'staff' | 'customer';

class AccessControl {
  private users: Map<string, User> = new Map();
  private roles: Map<string, Role> = new Map();
  private permissions: Map<string, Permission> = new Map();
  private sessions: Map<string, UserSession> = new Map();
  private mfaDevices: Map<string, MFADevice> = new Map();
  private securityEvents: SecurityEvent[] = [];
  private readonly config = productionSecurityConfig.authentication;
  private readonly encryption = new DataEncryption();

  constructor() {
    this.initializeAccessControl();
  }

  /**
   * Initialize access control system
   */
  private async initializeAccessControl(): Promise<void> {
    await this.createDefaultRoles();
    await this.createDefaultPermissions();
    await this.createSystemUsers();

    // Start session cleanup
    this.startSessionCleanup();

    console.log('Access control system initialized');
  }

  /**
   * Create default roles
   */
  private async createDefaultRoles(): Promise<void> {
    const defaultRoles: Role[] = [
      {
        id: 'super_admin',
        name: 'Super Administrator',
        description: 'Full system access with all permissions',
        permissions: [],
        system: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'admin',
        name: 'Administrator',
        description: 'Administrative access to most system features',
        permissions: [],
        inheritFrom: ['super_admin'],
        system: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'manager',
        name: 'Manager',
        description: 'Management access to business operations',
        permissions: [],
        inheritFrom: ['admin'],
        system: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'staff',
        name: 'Staff',
        description: 'Staff access to operational features',
        permissions: [],
        inheritFrom: ['manager'],
        system: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'customer',
        name: 'Customer',
        description: 'Customer access to booking and personal information',
        permissions: [],
        system: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];

    defaultRoles.forEach(role => {
      this.roles.set(role.id, role);
    });
  }

  /**
   * Create default permissions
   */
  private async createDefaultPermissions(): Promise<void> {
    const defaultPermissions: Permission[] = [
      // User management
      { id: 'users.read', name: 'Read Users', resource: 'users', action: 'read', system: true },
      { id: 'users.create', name: 'Create Users', resource: 'users', action: 'create', system: true },
      { id: 'users.update', name: 'Update Users', resource: 'users', action: 'update', system: true },
      { id: 'users.delete', name: 'Delete Users', resource: 'users', action: 'delete', system: true },

      // Booking management
      { id: 'bookings.read', name: 'Read Bookings', resource: 'bookings', action: 'read', system: true },
      { id: 'bookings.create', name: 'Create Bookings', resource: 'bookings', action: 'create', system: true },
      { id: 'bookings.update', name: 'Update Bookings', resource: 'bookings', action: 'update', system: true },
      { id: 'bookings.delete', name: 'Delete Bookings', resource: 'bookings', action: 'delete', system: true },

      // Service management
      { id: 'services.read', name: 'Read Services', resource: 'services', action: 'read', system: true },
      { id: 'services.create', name: 'Create Services', resource: 'services', action: 'create', system: true },
      { id: 'services.update', name: 'Update Services', resource: 'services', action: 'update', system: true },
      { id: 'services.delete', name: 'Delete Services', resource: 'services', action: 'delete', system: true },

      // Analytics and reporting
      { id: 'analytics.read', name: 'Read Analytics', resource: 'analytics', action: 'read', system: true },
      { id: 'reports.read', name: 'Read Reports', resource: 'reports', action: 'read', system: true },
      { id: 'reports.create', name: 'Create Reports', resource: 'reports', action: 'create', system: true },

      // System administration
      { id: 'system.config', name: 'System Configuration', resource: 'system', action: 'configure', system: true },
      { id: 'system.logs', name: 'Read System Logs', resource: 'system', action: 'read_logs', system: true },
      { id: 'system.backup', name: 'System Backup', resource: 'system', action: 'backup', system: true },
      { id: 'system.security', name: 'Security Management', resource: 'system', action: 'manage_security', system: true },

      // Content management
      { id: 'content.read', name: 'Read Content', resource: 'content', action: 'read', system: true },
      { id: 'content.create', name: 'Create Content', resource: 'content', action: 'create', system: true },
      { id: 'content.update', name: 'Update Content', resource: 'content', action: 'update', system: true },
      { id: 'content.delete', name: 'Delete Content', resource: 'content', action: 'delete', system: true },

      // Customer specific
      { id: 'profile.read', name: 'Read Own Profile', resource: 'profile', action: 'read', system: true },
      { id: 'profile.update', name: 'Update Own Profile', resource: 'profile', action: 'update', system: true },
      { id: 'bookings.own', name: 'Manage Own Bookings', resource: 'bookings', action: 'manage_own', system: true }
    ];

    defaultPermissions.forEach(permission => {
      this.permissions.set(permission.id, permission);
    });
  }

  /**
   * Create system users
   */
  private async createSystemUsers(): Promise<void> {
    // Create super admin user
    const superAdminUser: User = {
      id: 'super_admin_001',
      email: 'admin@mariaborysevych.com',
      password: await this.hashPassword('ChangeMe123!'),
      name: 'System Administrator',
      role: 'super_admin',
      permissions: Array.from(this.permissions.keys()),
      mfaEnabled: true,
      mfaSecret: await this.generateTOTPSecret(),
      backupCodes: await this.generateBackupCodes(),
      failedLoginAttempts: 0,
      passwordChangedAt: Date.now(),
      sessions: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'active'
    };

    this.users.set(superAdminUser.id, superAdminUser);
  }

  /**
   * Authentication middleware
   */
  async authenticate(c: Context, next: Next): Promise<void> {
    const authHeader = c.req.header('Authorization');
    const path = c.req.path;
    const method = c.req.method;

    // Skip authentication for public endpoints
    if (this.isPublicEndpoint(path, method)) {
      await next();
      return;
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      await this.handleUnauthorized(c, 'Missing or invalid authorization header');
      return;
    }

    const token = authHeader.substring(7);
    const session = this.validateToken(token);

    if (!session) {
      await this.handleUnauthorized(c, 'Invalid or expired token');
      return;
    }

    const user = this.users.get(session.userId);
    if (!user) {
      await this.handleUnauthorized(c, 'User not found');
      return;
    }

    // Check if user is active
    if (user.status !== 'active') {
      await this.handleUnauthorized(c, 'Account is not active');
      return;
    }

    // Check if account is locked
    if (user.lockedUntil && Date.now() < user.lockedUntil) {
      await this.handleUnauthorized(c, 'Account is temporarily locked');
      return;
    }

    // Update session access time
    session.lastAccessAt = Date.now();
    this.sessions.set(session.id, session);

    // Add user to context
    c.set('user', user);
    c.set('session', session);

    await next();
  }

  /**
   * Authorization middleware
   */
  async authorize(permission: string) {
    return async (c: Context, next: Next) => {
      const user = c.get('user') as User;

      if (!user) {
        await this.handleForbidden(c, 'Authentication required');
        return;
      }

      // Super admin has all permissions
      if (user.role === 'super_admin') {
        await next();
        return;
      }

      // Check user permissions
      if (!this.hasPermission(user, permission)) {
        await this.handleForbidden(c, 'Insufficient permissions');
        return;
      }

      await next();
    };
  }

  /**
   * Multi-factor authentication middleware
   */
  async requireMFA(c: Context, next: Next): Promise<void> {
    const user = c.get('user') as User;
    const session = c.get('session') as UserSession;

    if (user.mfaEnabled && !session.mfaVerified) {
      c.status(401);
      c.json({
        error: 'MFA Required',
        message: 'Multi-factor authentication is required',
        requiresMFA: true
      });
      return;
    }

    await next();
  }

  /**
   * Role-based access control middleware
   */
  async requireRole(roles: UserRole[]) {
    return async (c: Context, next: Next) => {
      const user = c.get('user') as User;

      if (!user || !roles.includes(user.role)) {
        await this.handleForbidden(c, 'Insufficient role privileges');
        return;
      }

      await next();
    };
  }

  /**
   * Handle user login
   */
  public async login(email: string, password: string, mfaCode?: string, context?: {
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{
    success: boolean;
    token?: string;
    refreshToken?: string;
    requiresMFA?: boolean;
    user?: any;
    error?: string;
  }> {
    const user = this.findUserByEmail(email);
    if (!user) {
      await this.logSecurityEvent({
        type: 'login',
        description: `Failed login attempt for unknown email: ${email}`,
        ipAddress: context?.ipAddress || 'unknown',
        userAgent: context?.userAgent || 'unknown',
        severity: 'medium'
      });
      return { success: false, error: 'Invalid credentials' };
    }

    // Check if account is locked
    if (user.lockedUntil && Date.now() < user.lockedUntil) {
      return { success: false, error: 'Account is temporarily locked' };
    }

    // Check if account is active
    if (user.status !== 'active') {
      return { success: false, error: 'Account is not active' };
    }

    // Verify password
    const passwordValid = await this.verifyPassword(password, user.password);
    if (!passwordValid) {
      await this.handleFailedLogin(user, context);
      return { success: false, error: 'Invalid credentials' };
    }

    // Check MFA if enabled
    if (user.mfaEnabled && !mfaCode) {
      return {
        success: false,
        requiresMFA: true,
        error: 'MFA code required'
      };
    }

    if (user.mfaEnabled && mfaCode) {
      const mfaValid = await this.verifyMFACode(user, mfaCode);
      if (!mfaValid) {
        await this.handleFailedLogin(user, context);
        return { success: false, error: 'Invalid MFA code' };
      }
    }

    // Create session
    const session = await this.createSession(user, context);

    // Reset failed login attempts
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    user.lastLoginAt = Date.now();

    // Log successful login
    await this.logSecurityEvent({
      userId: user.id,
      type: 'login',
      description: `Successful login for user: ${user.email}`,
      ipAddress: context?.ipAddress || 'unknown',
      userAgent: context?.userAgent || 'unknown',
      severity: 'low'
    });

    return {
      success: true,
      token: session.token,
      refreshToken: session.refreshToken,
      user: this.sanitizeUser(user)
    };
  }

  /**
   * Handle user logout
   */
  public async logout(token: string, context?: {
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const session = this.validateToken(token);
    if (session) {
      session.isActive = false;
      this.sessions.set(session.id, session);

      const user = this.users.get(session.userId);
      if (user) {
        await this.logSecurityEvent({
          userId: user.id,
          sessionId: session.id,
          type: 'logout',
          description: `User logged out: ${user.email}`,
          ipAddress: context?.ipAddress || 'unknown',
          userAgent: context?.userAgent || 'unknown',
          severity: 'low'
        });
      }
    }
  }

  /**
   * Create new user
   */
  public async createUser(userData: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
  }): Promise<{
    success: boolean;
    user?: User;
    error?: string;
  }> {
    // Validate email uniqueness
    if (this.findUserByEmail(userData.email)) {
      return { success: false, error: 'Email already exists' };
    }

    // Validate password strength
    if (!this.validatePasswordStrength(userData.password)) {
      return { success: false, error: 'Password does not meet requirements' };
    }

    const user: User = {
      id: this.generateUserId(),
      email: userData.email,
      password: await this.hashPassword(userData.password),
      name: userData.name,
      role: userData.role,
      permissions: await this.getRolePermissions(userData.role),
      mfaEnabled: false,
      backupCodes: [],
      failedLoginAttempts: 0,
      passwordChangedAt: Date.now(),
      sessions: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'active'
    };

    this.users.set(user.id, user);

    return { success: true, user: this.sanitizeUser(user) };
  }

  /**
   * Change user password
   */
  public async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    const user = this.users.get(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Verify current password
    const currentValid = await this.verifyPassword(currentPassword, user.password);
    if (!currentValid) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Validate new password strength
    if (!this.validatePasswordStrength(newPassword)) {
      return { success: false, error: 'New password does not meet requirements' };
    }

    // Check password history
    if (await this.isPasswordInHistory(userId, newPassword)) {
      return { success: false, error: 'Password has been used recently' };
    }

    // Update password
    user.password = await this.hashPassword(newPassword);
    user.passwordChangedAt = Date.now();
    user.updatedAt = Date.now();

    // Invalidate all existing sessions
    await this.invalidateUserSessions(userId);

    await this.logSecurityEvent({
      userId,
      type: 'password_change',
      description: `Password changed for user: ${user.email}`,
      ipAddress: 'system',
      userAgent: 'system',
      severity: 'medium'
    });

    return { success: true };
  }

  /**
   * Enable MFA for user
   */
  public async enableMFA(userId: string, type: 'totp' | 'sms' | 'email'): Promise<{
    success: boolean;
    secret?: string;
    backupCodes?: string[];
    qrCode?: string;
    error?: string;
  }> {
    const user = this.users.get(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (type === 'totp') {
      const secret = await this.generateTOTPSecret();
      const backupCodes = await this.generateBackupCodes();
      const qrCode = await this.generateTOTPQRCode(user.email, secret);

      // Temporarily store MFA setup data (not enabled until verified)
      user.mfaSecret = secret;
      user.backupCodes = backupCodes;

      return {
        success: true,
        secret,
        backupCodes,
        qrCode
      };
    }

    return { success: false, error: 'MFA type not supported' };
  }

  /**
   * Verify and activate MFA
   */
  public async verifyAndActivateMFA(
    userId: string,
    code: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    const user = this.users.get(userId);
    if (!user || !user.mfaSecret) {
      return { success: false, error: 'MFA setup not initiated' };
    }

    const valid = await this.verifyTOTPCode(user.mfaSecret, code);
    if (!valid) {
      return { success: false, error: 'Invalid verification code' };
    }

    user.mfaEnabled = true;
    user.updatedAt = Date.now();

    await this.logSecurityEvent({
      userId,
      type: 'mfa_enable',
      description: `MFA enabled for user: ${user.email}`,
      ipAddress: 'system',
      userAgent: 'system',
      severity: 'medium'
    });

    return { success: true };
  }

  /**
   * Helper methods
   */
  private isPublicEndpoint(path: string, method: string): boolean {
    const publicEndpoints = [
      { path: '/api/auth/login', method: 'POST' },
      { path: '/api/auth/register', method: 'POST' },
      { path: '/api/auth/forgot-password', method: 'POST' },
      { path: '/api/auth/reset-password', method: 'POST' },
      { path: '/api/health', method: 'GET' },
      { path: '/api/services', method: 'GET' },
      { path: '/api/availability', method: 'GET' },
      { path: '/api/booking', method: 'GET' }, // Public booking info
    ];

    return publicEndpoints.some(endpoint =>
      path.startsWith(endpoint.path) && method === endpoint.method
    );
  }

  private validateToken(token: string): UserSession | undefined {
    for (const session of this.sessions.values()) {
      if (session.token === token && session.isActive && session.expiresAt > Date.now()) {
        return session;
      }
    }
    return undefined;
  }

  private hasPermission(user: User, permission: string): boolean {
    // Check direct permissions
    if (user.permissions.includes(permission)) {
      return true;
    }

    // Check role permissions
    const role = this.roles.get(user.role);
    if (role) {
      // Check inherited permissions
      const inheritedPermissions = this.getInheritedPermissions(role);
      if (inheritedPermissions.includes(permission)) {
        return true;
      }
    }

    return false;
  }

  private getInheritedPermissions(role: Role): string[] {
    let permissions: string[] = [];

    // Add role's direct permissions
    permissions.push(...role.permissions.map(p => p.id));

    // Recursively add inherited permissions
    if (role.inheritFrom) {
      for (const inheritedRoleId of role.inheritFrom) {
        const inheritedRole = this.roles.get(inheritedRoleId);
        if (inheritedRole) {
          permissions.push(...this.getInheritedPermissions(inheritedRole));
        }
      }
    }

    return permissions;
  }

  private async createSession(user: User, context?: {
    ipAddress?: string;
    userAgent?: string;
  }): Promise<UserSession> {
    const session: UserSession = {
      id: this.generateSessionId(),
      userId: user.id,
      token: await this.generateJWT(user),
      refreshToken: await this.generateRefreshToken(),
      userAgent: context?.userAgent || 'unknown',
      ipAddress: context?.ipAddress || 'unknown',
      createdAt: Date.now(),
      expiresAt: Date.now() + (this.config.sessionTimeout * 60 * 1000),
      lastAccessAt: Date.now(),
      mfaVerified: true,
      isActive: true
    };

    this.sessions.set(session.id, session);
    user.sessions.push(session);

    return session;
  }

  private async generateJWT(user: User): Promise<string> {
    // In a real implementation, use a proper JWT library
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor((Date.now() + (this.config.sessionTimeout * 60 * 1000)) / 1000)
    };

    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  private async generateRefreshToken(): Promise<string> {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private findUserByEmail(email: string): User | undefined {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  private async hashPassword(password: string): Promise<string> {
    // In a real implementation, use bcrypt or argon2
    return `hashed_${password}_${Date.now()}`;
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    // In a real implementation, use bcrypt or argon2
    return hash.startsWith('hashed_') && hash.includes(password);
  }

  private validatePasswordStrength(password: string): boolean {
    const policy = this.config.passwordPolicy;

    if (password.length < policy.minLength) return false;
    if (policy.requireUppercase && !/[A-Z]/.test(password)) return false;
    if (policy.requireLowercase && !/[a-z]/.test(password)) return false;
    if (policy.requireNumbers && !/\d/.test(password)) return false;
    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;

    return true;
  }

  private async isPasswordInHistory(userId: string, newPassword: string): Promise<boolean> {
    // In a real implementation, check against password history
    return false;
  }

  private async generateTOTPSecret(): Promise<string> {
    // In a real implementation, use a proper TOTP library
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private async generateBackupCodes(): Promise<string[]> {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  }

  private async generateTOTPQRCode(email: string, secret: string): Promise<string> {
    // In a real implementation, generate QR code for TOTP
    return `otpauth://totp/MariiaHub:${email}?secret=${secret}&issuer=MariiaHub`;
  }

  private async verifyMFACode(user: User, code: string): Promise<boolean> {
    if (!user.mfaEnabled) return true;

    // Check backup codes first
    if (user.backupCodes.includes(code)) {
      // Remove used backup code
      user.backupCodes = user.backupCodes.filter(c => c !== code);
      return true;
    }

    // Check TOTP code
    if (user.mfaSecret) {
      return await this.verifyTOTPCode(user.mfaSecret, code);
    }

    return false;
  }

  private async verifyTOTPCode(secret: string, code: string): Promise<boolean> {
    // In a real implementation, verify TOTP code
    return code.length === 6 && /^\d+$/.test(code);
  }

  private async handleFailedLogin(user: User, context?: {
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    user.failedLoginAttempts++;

    if (user.failedLoginAttempts >= this.config.passwordPolicy.lockoutThreshold) {
      user.lockedUntil = Date.now() + (this.config.passwordPolicy.lockoutDuration * 1000);

      await this.logSecurityEvent({
        userId: user.id,
        type: 'account_lock',
        description: `Account locked due to failed login attempts: ${user.email}`,
        ipAddress: context?.ipAddress || 'unknown',
        userAgent: context?.userAgent || 'unknown',
        severity: 'high'
      });
    }

    await this.logSecurityEvent({
      userId: user.id,
      type: 'login',
      description: `Failed login attempt for user: ${user.email}`,
      ipAddress: context?.ipAddress || 'unknown',
      userAgent: context?.userAgent || 'unknown',
      severity: 'medium'
    });
  }

  private async invalidateUserSessions(userId: string): Promise<void> {
    for (const session of this.sessions.values()) {
      if (session.userId === userId) {
        session.isActive = false;
      }
    }
  }

  private sanitizeUser(user: User): any {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mfaEnabled: user.mfaEnabled,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt
    };
  }

  private async logSecurityEvent(event: Partial<SecurityEvent>): Promise<void> {
    const securityEvent: SecurityEvent = {
      id: this.generateEventId(),
      userId: event.userId,
      sessionId: event.sessionId,
      type: event.type || 'suspicious_activity',
      description: event.description || 'Security event',
      ipAddress: event.ipAddress || 'unknown',
      userAgent: event.userAgent || 'unknown',
      timestamp: Date.now(),
      severity: event.severity || 'medium',
      metadata: event.metadata || {}
    };

    this.securityEvents.push(securityEvent);

    // Keep only last 10000 events
    if (this.securityEvents.length > 10000) {
      this.securityEvents = this.securityEvents.slice(-10000);
    }

    console.warn('Security Event:', securityEvent);
  }

  private async handleUnauthorized(c: Context, message: string): Promise<void> {
    c.status(401);
    c.json({ error: 'Unauthorized', message });
  }

  private async handleForbidden(c: Context, message: string): Promise<void> {
    c.status(403);
    c.json({ error: 'Forbidden', message });
  }

  private startSessionCleanup(): void {
    // Clean up expired sessions every hour
    setInterval(() => {
      const now = Date.now();
      for (const [sessionId, session] of this.sessions.entries()) {
        if (session.expiresAt < now) {
          session.isActive = false;
        }
      }
    }, 60 * 60 * 1000);
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private async getRolePermissions(roleId: UserRole): Promise<string[]> {
    const role = this.roles.get(roleId);
    if (!role) return [];

    return this.getInheritedPermissions(role);
  }

  /**
   * Public API methods
   */
  public getSecurityStatistics(): {
    totalUsers: number;
    activeUsers: number;
    lockedUsers: number;
    usersWithMFA: number;
    activeSessions: number;
    recentSecurityEvents: number;
  } {
    const users = Array.from(this.users.values());
    const sessions = Array.from(this.sessions.values());
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'active').length,
      lockedUsers: users.filter(u => u.lockedUntil && u.lockedUntil > now).length,
      usersWithMFA: users.filter(u => u.mfaEnabled).length,
      activeSessions: sessions.filter(s => s.isActive && s.expiresAt > now).length,
      recentSecurityEvents: this.securityEvents.filter(e => e.timestamp > oneDayAgo).length
    };
  }

  public getRecentSecurityEvents(limit: number = 100): SecurityEvent[] {
    return this.securityEvents
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
}

// Singleton instance
const accessControl = new AccessControl();

// Export middleware
export const authenticate = accessControl.authenticate.bind(accessControl);
export const authorize = (permission: string) => accessControl.authorize(permission);
export const requireMFA = accessControl.requireMFA.bind(accessControl);
export const requireRole = (roles: UserRole[]) => accessControl.requireRole(roles);

// Export class and utilities
export { AccessControl, User, UserSession, Role, Permission, SecurityEvent };

// Export API methods
export const loginUser = (email: string, password: string, mfaCode?: string, context?: any) =>
  accessControl.login(email, password, mfaCode, context);

export const logoutUser = (token: string, context?: any) =>
  accessControl.logout(token, context);

export const createUser = (userData: any) =>
  accessControl.createUser(userData);

export const changeUserPassword = (userId: string, currentPassword: string, newPassword: string) =>
  accessControl.changePassword(userId, currentPassword, newPassword);

export const enableUserMFA = (userId: string, type: 'totp' | 'sms' | 'email') =>
  accessControl.enableMFA(userId, type);

export const verifyAndActivateMFA = (userId: string, code: string) =>
  accessControl.verifyAndActivateMFA(userId, code);

export const getAccessControlStatistics = () => accessControl.getSecurityStatistics();
export const getRecentSecurityEvents = (limit?: number) => accessControl.getRecentSecurityEvents(limit);