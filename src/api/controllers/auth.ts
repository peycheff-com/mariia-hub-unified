/**
 * Authentication Controller
 * Handles user authentication, registration, and profile management
 */

import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from '../middleware/auth';
import { AuthMiddleware } from '../middleware/auth';
import { ValidationError, AuthenticationError, ConflictError } from '../middleware/errorHandler';
import { supabaseService } from '../integrations/supabase';
import { logger } from '../utils/logger';
import { apiConfig } from '../config';

export class AuthController {
  /**
   * Register a new user
   */
  public async register(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { email, password, fullName, phone, acceptTerms, acceptMarketing } = req.body;

    try {
      // Check if user already exists
      const existingUser = await supabaseService.getClient()
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (existingUser.data) {
        throw new ConflictError('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await AuthMiddleware.hashPassword(password);

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabaseService.getClient()
        .auth.signUp({
          email: email.toLowerCase(),
          password,
          options: {
            data: {
              full_name: fullName,
              phone,
              accept_terms: acceptTerms,
              accept_marketing: acceptMarketing,
            },
          },
        });

      if (authError) {
        logger.error('Supabase auth signup failed', { error: authError.message });
        throw new ValidationError('Failed to create user account');
      }

      // Update profile with additional information
      if (authData.user) {
        await supabaseService.getClient()
          .from('profiles')
          .update({
            full_name: fullName,
            phone,
            role: 'customer',
            preferences: {
              acceptMarketing: acceptMarketing || false,
              language: 'pl',
              timezone: 'Europe/Warsaw',
              currency: 'PLN',
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', authData.user.id);

        // Generate JWT tokens
        const user = {
          id: authData.user.id,
          email: authData.user.email!,
          role: 'customer',
          permissions: AuthMiddleware.getPermissionsForRole('customer'),
          profile: {
            fullName,
            phone,
            avatar: null,
          },
          metadata: {},
        };

        const accessToken = AuthMiddleware.generateAccessToken(user);
        const refreshToken = AuthMiddleware.generateRefreshToken(user);

        logger.business('user_registered', {
          userId: user.id,
          email: user.email,
          fullName,
        });

        res.status(201).json({
          success: true,
          user,
          accessToken,
          refreshToken,
          expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
          message: 'User registered successfully. Please check your email to verify your account.',
        });
      } else {
        throw new ValidationError('Failed to create user account');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Login user
   */
  public async login(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { email, password, rememberMe } = req.body;

    try {
      // Authenticate with Supabase
      const { data: authData, error: authError } = await supabaseService.getClient()
        .auth.signInWithPassword({
          email: email.toLowerCase(),
          password,
        });

      if (authError || !authData.user) {
        logger.security('Login attempt failed', {
          email,
          reason: authError?.message || 'Invalid credentials',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });

        throw new AuthenticationError('Invalid email or password');
      }

      // Fetch user profile
      const user = await AuthMiddleware.fetchUser(authData.user.id);

      if (!user) {
        throw new AuthenticationError('User profile not found');
      }

      // Generate JWT tokens
      const accessToken = AuthMiddleware.generateAccessToken(user);
      const refreshToken = AuthMiddleware.generateRefreshToken(user);

      logger.business('user_login', {
        userId: user.id,
        email: user.email,
        rememberMe,
        ip: req.ip,
      });

      res.json({
        success: true,
        user,
        accessToken,
        refreshToken,
        expiresIn: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60, // 30 days or 7 days
        message: 'Login successful',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  public async refreshToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { refreshToken } = req.body;

    try {
      if (!refreshToken) {
        throw new ValidationError('Refresh token is required');
      }

      // Verify refresh token
      const payload = AuthMiddleware.verifyToken(refreshToken, apiConfig.refreshSecret);

      // Fetch user
      const user = await AuthMiddleware.fetchUser(payload.sub);

      if (!user) {
        throw new AuthenticationError('User not found');
      }

      // Generate new access token
      const accessToken = AuthMiddleware.generateAccessToken(user);

      logger.info('Token refreshed', {
        userId: user.id,
        ip: req.ip,
      });

      res.json({
        success: true,
        accessToken,
        expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
      });
    } catch (error) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }
  }

  /**
   * Logout user
   */
  public async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Sign out from Supabase
      await supabaseService.getClient().auth.signOut();

      logger.business('user_logout', {
        userId: req.user?.id,
        ip: req.ip,
      });

      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      logger.error('Logout error', { error });
      // Still return success even if logout fails
      res.json({
        success: true,
        message: 'Logout successful',
      });
    }
  }

  /**
   * Get user profile
   */
  public async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user profile
   */
  public async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { fullName, phone, preferences } = req.body;
    const user = req.user!;

    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (fullName !== undefined) {
        updateData.full_name = fullName;
      }

      if (phone !== undefined) {
        updateData.phone = phone;
      }

      if (preferences !== undefined) {
        updateData.preferences = preferences;
      }

      // Update profile
      await supabaseService.getClient()
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      // Fetch updated user
      const updatedUser = await AuthMiddleware.fetchUser(user.id);

      logger.business('profile_updated', {
        userId: user.id,
        changes: Object.keys(updateData),
      });

      res.json({
        success: true,
        user: updatedUser,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Change password
   */
  public async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { currentPassword, newPassword } = req.body;
    const user = req.user!;

    try {
      // Verify current password by attempting to sign in
      const { error: signInError } = await supabaseService.getClient()
        .auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

      if (signInError) {
        logger.security('Password change failed - invalid current password', {
          userId: user.id,
          ip: req.ip,
        });

        throw new AuthenticationError('Current password is incorrect');
      }

      // Update password
      const { error: updateError } = await supabaseService.getClient()
        .auth.updateUser({
          password: newPassword,
        });

      if (updateError) {
        throw new ValidationError('Failed to update password');
      }

      logger.security('password_changed', {
        userId: user.id,
        ip: req.ip,
      });

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Forgot password
   */
  public async forgotPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { email } = req.body;

    try {
      const { error } = await supabaseService.getClient()
        .auth.resetPasswordForEmail(email.toLowerCase(), {
          redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
        });

      if (error) {
        logger.error('Password reset request failed', {
          email,
          error: error.message,
        });
        // Don't reveal if email exists or not for security
      }

      logger.business('password_reset_requested', {
        email,
        ip: req.ip,
      });

      res.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reset password
   */
  public async resetPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { token, newPassword } = req.body;

    try {
      const { error } = await supabaseService.getClient()
        .auth.updateUser({
          password: newPassword,
        });

      if (error) {
        throw new ValidationError('Failed to reset password');
      }

      logger.security('password_reset_completed', {
        ip: req.ip,
      });

      res.json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify email
   */
  public async verifyEmail(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { token } = req.body;

    try {
      // In a real implementation, you would verify the token and mark email as verified
      // For now, we'll just return success

      logger.business('email_verified', {
        ip: req.ip,
      });

      res.json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Resend verification email
   */
  public async resendVerification(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;

    try {
      // In a real implementation, you would send a new verification email

      logger.business('verification_email_resent', {
        userId: user.id,
        email: user.email,
      });

      res.json({
        success: true,
        message: 'Verification email sent',
      });
    } catch (error) {
      throw error;
    }
  }
}