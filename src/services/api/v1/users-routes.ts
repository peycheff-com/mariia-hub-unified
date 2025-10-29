import { Hono } from 'hono';

import { supabase } from '@/integrations/supabase/client';

import {
  ValidationMiddleware,
  RateLimitMiddleware,
  AuthMiddleware,
  RateLimitConfigs,
  Permissions
} from '../middleware';
import { loyaltyProgramService } from '../../loyaltyProgramService';

const app = new Hono();

// Apply rate limiting
app.use('*', RateLimitMiddleware.rateLimit(RateLimitConfigs.api));

/**
 * POST /api/v1/users/register
 * Register a new user
 */
app.post('/register',
  RateLimitMiddleware.rateLimit(RateLimitConfigs.auth),
  ValidationMiddleware.validate({
    body: {
      email: {
        type: 'string',
        format: 'email',
        required: true
      },
      password: {
        type: 'string',
        minLength: 8,
        maxLength: 128,
        required: true,
        custom: (value: string) => {
          if (!/(?=.*[a-z])/.test(value)) {
            return 'Password must contain at least one lowercase letter';
          }
          if (!/(?=.*[A-Z])/.test(value)) {
            return 'Password must contain at least one uppercase letter';
          }
          if (!/(?=.*\d)/.test(value)) {
            return 'Password must contain at least one number';
          }
          return true;
        }
      },
      first_name: {
        type: 'string',
        minLength: 1,
        maxLength: 50,
        required: true
      },
      last_name: {
        type: 'string',
        minLength: 1,
        maxLength: 50,
        required: true
      },
      phone: {
        type: 'string',
        format: 'phone',
        required: false
      },
      accept_terms: {
        type: 'boolean',
        required: true,
        custom: (value: boolean) => value === true || 'You must accept the terms and conditions'
      },
      accept_marketing: {
        type: 'boolean',
        required: false
      }
    }
  }),
  async (c) => {
    try {
      const userData = await c.req.json();

      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', userData.email)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingUser) {
        return c.json({
          success: false,
          error: 'User with this email already exists'
        }, 409);
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            phone: userData.phone
          }
        }
      });

      if (authError) {
        return c.json({
          success: false,
          error: authError.message
        }, 400);
      }

      // Create user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user?.id,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone: userData.phone,
          role: 'user',
          accept_terms: userData.accept_terms,
          accept_marketing: userData.accept_marketing || false,
          is_active: true,
          created_at: new Date().toISOString()
        })
        .select('id, email, role, created_at')
        .single();

      if (profileError) {
        // Rollback auth user creation
        await supabase.auth.admin.deleteUser(authData.user?.id);
        throw profileError;
      }

      return c.json({
        success: true,
        data: {
          user: profile,
          session: authData.session
        }
      }, 201);
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      }, 500);
    }
  }
);

/**
 * POST /api/v1/users/login
 * Login user
 */
app.post('/login',
  RateLimitMiddleware.rateLimit(RateLimitConfigs.auth),
  ValidationMiddleware.validate({
    body: {
      email: {
        type: 'string',
        format: 'email',
        required: true
      },
      password: {
        type: 'string',
        required: true
      }
    }
  }),
  async (c) => {
    try {
      const { email, password } = await c.req.json();

      // Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        return c.json({
          success: false,
          error: 'Invalid email or password'
        }, 401);
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authData.user?.id)
        .single();

      if (profileError || !profile) {
        return c.json({
          success: false,
          error: 'User profile not found'
        }, 404);
      }

      return c.json({
        success: true,
        data: {
          user: profile,
          session: authData.session
        }
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      }, 500);
    }
  }
);

/**
 * POST /api/v1/users/logout
 * Logout user
 */
app.post('/logout',
  AuthMiddleware.authenticate(),
  async (c) => {
    try {
      await supabase.auth.signOut();

      return c.json({
        success: true,
        data: { message: 'Logged out successfully' }
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed'
      }, 500);
    }
  }
);

/**
 * GET /api/v1/users/profile
 * Get current user profile
 */
app.get('/profile',
  AuthMiddleware.authenticate(),
  async (c) => {
    try {
      const user = AuthMiddleware.getCurrentUser(c);

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          customer_points (
            current_balance,
            total_earned,
            total_redeemed,
            loyalty_tiers (
              id,
              name,
              benefits
            )
          )
        `)
        .eq('id', user!.id)
        .single();

      if (error || !profile) {
        return c.json({
          success: false,
          error: 'User profile not found'
        }, 404);
      }

      return c.json({
        success: true,
        data: profile
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch profile'
      }, 500);
    }
  }
);

/**
 * PUT /api/v1/users/profile
 * Update user profile
 */
app.put('/profile',
  AuthMiddleware.authenticate(),
  ValidationMiddleware.validate({
    body: {
      first_name: {
        type: 'string',
        minLength: 1,
        maxLength: 50,
        required: false
      },
      last_name: {
        type: 'string',
        minLength: 1,
        maxLength: 50,
        required: false
      },
      phone: {
        type: 'string',
        format: 'phone',
        required: false
      },
      accept_marketing: {
        type: 'boolean',
        required: false
      }
    }
  }),
  async (c) => {
    try {
      const user = AuthMiddleware.getCurrentUser(c);
      const updateData = await c.req.json();

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', user!.id)
        .select('id, email, first_name, last_name, phone, accept_marketing, updated_at')
        .single();

      if (error) {
        return c.json({
          success: false,
          error: error.message
        }, 400);
      }

      return c.json({
        success: true,
        data: profile
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Profile update failed'
      }, 500);
    }
  }
);

/**
 * GET /api/v1/users/loyalty
 * Get user loyalty status
 */
app.get('/loyalty',
  AuthMiddleware.authenticate(),
  async (c) => {
    try {
      const user = AuthMiddleware.getCurrentUser(c);

      const loyaltyStatus = await loyaltyProgramService.getCustomerLoyaltyStatus(user!.id);

      if (loyaltyStatus.success) {
        return c.json({
          success: true,
          data: loyaltyStatus.data
        });
      } else {
        return c.json({
          success: false,
          error: loyaltyStatus.error?.message || 'Failed to fetch loyalty status'
        }, 404);
      }
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch loyalty status'
      }, 500);
    }
  }
);

/**
 * GET /api/v1/users/bookings
 * Get user's bookings
 */
app.get('/bookings',
  AuthMiddleware.authenticate(),
  ValidationMiddleware.validate({
    query: CommonSchemas.pagination.query
  }),
  async (c) => {
    try {
      const user = AuthMiddleware.getCurrentUser(c);
      const { page = 1, limit = 20, status } = c.req.query();

      let query = supabase
        .from('bookings')
        .select(`
          *,
          services (
            id,
            title,
            service_type,
            price_from,
            duration_minutes,
            image_url
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .range((parseInt(page) - 1) * parseInt(limit), parseInt(page) * parseInt(limit) - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data: bookings, error, count } = await query;

      if (error) {
        throw error;
      }

      return c.json({
        success: true,
        data: {
          bookings: bookings || [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count || 0,
            pages: Math.ceil((count || 0) / parseInt(limit))
          }
        }
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bookings'
      }, 500);
    }
  }
);

/**
 * GET /api/v1/users/referrals
 * Get user's referral status and codes
 */
app.get('/referrals',
  AuthMiddleware.authenticate(),
  async (c) => {
    try {
      const user = AuthMiddleware.getCurrentUser(c);

      const referralStatus = await loyaltyProgramService.getReferralStatus(user!.id);

      if (referralStatus.success) {
        return c.json({
          success: true,
          data: referralStatus.data
        });
      } else {
        return c.json({
          success: false,
          error: referralStatus.error?.message || 'Failed to fetch referral status'
        });
      }
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch referral status'
      }, 500);
    }
  }
);

/**
 * POST /api/v1/users/referrals
 * Generate a new referral code
 */
app.post('/referrals',
  AuthMiddleware.authenticate(),
  ValidationMiddleware.validate({
    body: {
      custom_code: {
        type: 'string',
        minLength: 4,
        maxLength: 20,
        pattern: /^[A-Z0-9]+$/,
        required: false
      },
      expires_in: {
        type: 'number',
        min: 1,
        max: 730, // 2 years max
        required: false
      }
    }
  }),
  async (c) => {
    try {
      const user = AuthMiddleware.getCurrentUser(c);
      const { custom_code, expires_in } = await c.req.json();

      const result = await loyaltyProgramService.generateReferralCode({
        referrerId: user!.id,
        customCode: custom_code,
        expiresIn: expires_in
      });

      if (result.success) {
        return c.json({
          success: true,
          data: result.data
        }, 201);
      } else {
        return c.json({
          success: false,
          error: result.error?.message || 'Failed to generate referral code'
        }, 400);
      }
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate referral code'
      }, 500);
    }
  }
);

/**
 * POST /api/v1/users/referrals/complete
 * Complete a referral (used when someone signs up with a referral code)
 */
app.post('/referrals/complete',
  ValidationMiddleware.validate({
    body: {
      referral_code: {
        type: 'string',
        required: true,
        minLength: 4,
        maxLength: 20
      }
    }
  }),
  async (c) => {
    try {
      const { referral_code } = await c.req.json();
      const user = AuthMiddleware.getCurrentUser(c);

      const result = await loyaltyProgramService.completeReferral(referral_code, user!.id);

      if (result.success) {
        return c.json({
          success: true,
          data: result.data
        });
      } else {
        return c.json({
          success: false,
          error: result.error?.message || 'Failed to complete referral'
        }, 400);
      }
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete referral'
      }, 500);
    }
  }
);

export default app;