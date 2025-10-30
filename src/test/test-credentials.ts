/**
 * Secure Test Credentials Management
 *
 * Provides secure credential management for testing environments.
 * All credentials are loaded from environment variables with fallbacks.
 */

export interface TestCredentials {
  email: string;
  password: string;
  name?: string;
  role?: string;
}

export interface TestAPIKeys {
  stripe: string;
  resend: string;
  googleMaps: string;
  openAI: string;
  lovable: string;
}

/**
 * Get test credentials for different user types
 */
export const getTestCredentials = (): Record<string, TestCredentials> => {
  return {
    basicUser: {
      email: process.env.TEST_USER_EMAIL || 'test@example.com',
      password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
      name: 'Test User',
      role: 'client'
    },
    adminUser: {
      email: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
      password: process.env.TEST_ADMIN_PASSWORD || 'AdminPassword123!',
      name: 'Admin User',
      role: 'admin'
    },
    providerUser: {
      email: process.env.TEST_PROVIDER_EMAIL || 'provider@example.com',
      password: process.env.TEST_PROVIDER_PASSWORD || 'ProviderPassword123!',
      name: 'Provider User',
      role: 'provider'
    },
    previewUser: {
      email: process.env.TEST_PREVIEW_EMAIL || 'preview@example.com',
      password: process.env.TEST_PREVIEW_PASSWORD || 'PreviewPassword123!',
      name: 'Preview User',
      role: 'client'
    },
    stagingUser: {
      email: process.env.TEST_STAGING_EMAIL || 'staging@example.com',
      password: process.env.TEST_STAGING_PASSWORD || 'StagingPassword123!',
      name: 'Staging User',
      role: 'client'
    },
    clientUser: {
      email: process.env.TEST_CLIENT_EMAIL || 'client@example.com',
      password: process.env.TEST_CLIENT_PASSWORD || 'ClientPassword123!',
      name: 'Client User',
      role: 'client'
    }
  };
};

/**
 * Get test API keys
 */
export const getTestAPIKeys = (): TestAPIKeys => {
  return {
    stripe: process.env.TEST_STRIPE_KEY || 'sk_test_mock_key_for_testing',
    resend: process.env.TEST_RESEND_KEY || 'resend_mock_key_for_testing',
    googleMaps: process.env.TEST_GOOGLE_MAPS_KEY || 'google_maps_mock_key_for_testing',
    openAI: process.env.TEST_OPENAI_KEY || 'sk-openai_mock_key_for_testing',
    lovable: process.env.TEST_LOVABLE_KEY || 'lovable_mock_key_for_testing'
  };
};

/**
 * Get invalid/wrong credentials for negative testing
 */
export const getInvalidCredentials = (): TestCredentials[] => {
  return [
    {
      email: 'invalid@example.com',
      password: 'wrongpassword'
    },
    {
      email: 'test@example.com',
      password: 'wrongpassword'
    },
    {
      email: 'nonexistent@example.com',
      password: 'password123'
    }
  ];
};

/**
 * Get weak passwords for testing password validation
 */
export const getWeakPasswords = (): string[] => {
  return [
    '123', // Too short
    'password', // Too common
    'weak', // Too weak
    'NOLOWERCASE123!', // Missing lowercase
    'nouppercase123!', // Missing uppercase
    'NoNumbers!', // Missing numbers
    'NoSymbols123' // Missing symbols
  ];
};

/**
 * Environment validation helper
 */
export const validateTestEnvironment = (): void => {
  const requiredEnvVars = [
    'NODE_ENV',
    'VITE_SUPABASE_URL'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.warn(`Missing environment variables: ${missingVars.join(', ')}`);
  }
};

/**
 * Secure credential generation for tests
 */
export const generateSecureTestPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';

  // Ensure password meets all requirements
  const requirements = [
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ', // Uppercase
    'abcdefghijklmnopqrstuvwxyz', // Lowercase
    '0123456789', // Numbers
    '!@#$%^&*' // Symbols
  ];

  // Add at least one character from each requirement
  requirements.forEach(req => {
    password += req.charAt(Math.floor(Math.random() * req.length));
  });

  // Fill remaining length
  for (let i = password.length; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Test data sanitization helper
 */
export const sanitizeTestData = (data: any): any => {
  if (typeof data === 'string') {
    // Remove any potential sensitive information
    return data.replace(/password/i, '***').replace(/secret/i, '***');
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeTestData);
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (key.toLowerCase().includes('password') || key.toLowerCase().includes('secret')) {
        sanitized[key] = '***';
      } else {
        sanitized[key] = sanitizeTestData(value);
      }
    }
    return sanitized;
  }

  return data;
};

// Export singleton instances
export const testCredentials = getTestCredentials();
export const testAPIKeys = getTestAPIKeys();
export const invalidCredentials = getInvalidCredentials();
export const weakPasswords = getWeakPasswords();

// Validate environment on import
validateTestEnvironment();