// Feature Flag Service
// Manages feature flags for gradual rollout and A/B testing

import { logger } from '@/lib/logger';

interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  conditions?: {
    users?: string[]; // Specific user IDs
    percentage?: number; // Percentage of users (0-100)
    startDate?: string; // ISO date string
    endDate?: string; // ISO date string
    environments?: string[]; // Environment names
    metadata?: Record<string, any>;
  };
}

interface FeatureFlagContext {
  userId?: string;
  sessionId: string;
  environment: string;
  userAgent: string;
  timestamp: number;
}

class FeatureFlagService {
  private static instance: FeatureFlagService;
  private flags: Map<string, FeatureFlag> = new Map();
  private context: FeatureFlagContext;
  private storageKey = 'feature_flags';
  private refreshInterval = 5 * 60 * 1000; // 5 minutes

  static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
      FeatureFlagService.instance.initialize();
    }
    return FeatureFlagService.instance;
  }

  private constructor() {
    this.context = {
      sessionId: this.getOrCreateSessionId(),
      environment: import.meta.env.MODE || 'development',
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    };
  }

  // Get or create session ID for consistent hashing
  private getOrCreateSessionId(): string {
    // Try to get from session storage first
    if (typeof sessionStorage !== 'undefined') {
      let sessionId = sessionStorage.getItem('ff_session_id');
      if (!sessionId) {
        sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        sessionStorage.setItem('ff_session_id', sessionId);
      }
      return sessionId;
    }

    // Fallback for environments without sessionStorage
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  private async initialize(): Promise<void> {
    // Load cached flags
    this.loadCachedFlags();

    // Fetch fresh flags
    await this.fetchFlags();

    // Set up periodic refresh
    setInterval(() => {
      this.fetchFlags();
    }, this.refreshInterval);

    // Listen for storage changes (for multi-tab sync)
    window.addEventListener('storage', (e) => {
      if (e.key === this.storageKey) {
        this.loadCachedFlags();
      }
    });
  }

  // Default feature flags
  private getDefaultFlags(): FeatureFlag[] {
    return [
      {
        key: 'new-booking-flow',
        enabled: false,
        description: 'Enable new booking flow architecture',
        conditions: {
          percentage: 10, // Roll out to 10% initially
          environments: ['production', 'staging'],
        },
      },
      {
        key: 'websocket-availability',
        enabled: false,
        description: 'Enable real-time availability updates',
        conditions: {
          percentage: 5,
          environments: ['production'],
        },
      },
      {
        key: 'redis-caching',
        enabled: true,
        description: 'Enable Redis caching layer',
        conditions: {
          environments: ['production', 'staging'],
        },
      },
      {
        key: 'batch-requests',
        enabled: true,
        description: 'Enable API request batching',
        conditions: {
          environments: ['production', 'staging', 'development'],
        },
      },
      {
        key: 'lazy-loading',
        enabled: false,
        description: 'Enable code splitting and lazy loading',
        conditions: {
          percentage: 20,
          environments: ['production'],
        },
      },
      {
        key: 'error-monitoring',
        enabled: true,
        description: 'Enable comprehensive error monitoring',
        conditions: {
          environments: ['production', 'staging'],
        },
      },
      {
        key: 'analytics-v2',
        enabled: false,
        description: 'Enable new analytics system',
        conditions: {
          percentage: 15,
          startDate: '2024-01-01T00:00:00Z',
          environments: ['production'],
        },
      },
      {
        key: 'payment-stripe-3ds',
        enabled: false,
        description: 'Enable Stripe 3D Secure payments',
        conditions: {
          percentage: 5,
          environments: ['production'],
        },
      },
      {
        key: 'admin-redesign',
        enabled: false,
        description: 'Enable new admin dashboard design',
        conditions: {
          users: ['admin-user-id-1', 'admin-user-id-2'], // Specific admins
          environments: ['production', 'staging'],
        },
      },
      {
        key: 'booking-reminders',
        enabled: false,
        description: 'Enable automated booking reminders',
        conditions: {
          percentage: 50,
          environments: ['production'],
        },
      },
    ];
  }

  // Fetch flags from remote service
  private async fetchFlags(): Promise<void> {
    try {
      const response = await fetch('/api/feature-flags', {
        headers: {
          'X-Session-ID': this.context.sessionId,
          'X-Environment': this.context.environment,
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.updateFlags(data.flags);
      }
    } catch (error) {
      logger.warn('Failed to fetch feature flags:', error);
      // Use default flags on failure
      this.updateFlags(this.getDefaultFlags());
    }
  }

  // Load flags from localStorage
  private loadCachedFlags(): void {
    try {
      const cached = localStorage.getItem(this.storageKey);
      if (cached) {
        const { flags, timestamp } = JSON.parse(cached);
        const now = Date.now();

        // Use cached flags if they're less than 5 minutes old
        if (now - timestamp < 5 * 60 * 1000) {
          this.updateFlags(flags);
        }
      }
    } catch (error) {
      logger.warn('Failed to load cached flags:', error);
    }
  }

  // Save flags to localStorage
  private saveCachedFlags(): void {
    try {
      const flags = Array.from(this.flags.values());
      localStorage.setItem(this.storageKey, JSON.stringify({
        flags,
        timestamp: Date.now(),
      }));
    } catch (error) {
      logger.warn('Failed to save cached flags:', error);
    }
  }

  // Update internal flags map
  private updateFlags(flags: FeatureFlag[]): void {
    this.flags.clear();
    flags.forEach(flag => {
      this.flags.set(flag.key, flag);
    });
    this.saveCachedFlags();
  }

  // Check if a feature is enabled
  isEnabled(key: string, userId?: string): boolean {
    const flag = this.flags.get(key);
    if (!flag) return false;

    // If flag is explicitly disabled, return false
    if (!flag.enabled) return false;

    // Check environment condition
    if (flag.conditions?.environments &&
        !flag.conditions.environments.includes(this.context.environment)) {
      return false;
    }

    // Check date range
    if (flag.conditions?.startDate || flag.conditions?.endDate) {
      const now = new Date();
      if (flag.conditions.startDate) {
        const startDate = new Date(flag.conditions.startDate);
        if (now < startDate) return false;
      }
      if (flag.conditions.endDate) {
        const endDate = new Date(flag.conditions.endDate);
        if (now > endDate) return false;
      }
    }

    // Check specific users
    if (userId && flag.conditions?.users?.includes(userId)) {
      return true;
    }

    // Check percentage rollout
    if (flag.conditions?.percentage) {
      return this.isUserInPercentageRollout(key, flag.conditions.percentage);
    }

    return true;
  }

  // Check if user is in percentage rollout using consistent hashing
  private isUserInPercentageRollout(key: string, percentage: number): boolean {
    // Create a hash from user ID, session ID, and feature key
    const input = `${this.context.sessionId}:${key}`;
    let hash = 0;

    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Convert hash to positive number and get modulo 100
    const hashPositive = Math.abs(hash);
    const userScore = hashPositive % 100;

    return userScore < percentage;
  }

  // Get all enabled flags
  getEnabledFlags(userId?: string): Record<string, boolean> {
    const enabled: Record<string, boolean> = {};

    this.flags.forEach((flag, key) => {
      enabled[key] = this.isEnabled(key, userId);
    });

    return enabled;
  }

  // Get flag value with type safety
  getValue<T = boolean>(key: string, defaultValue: T, userId?: string): T {
    const flag = this.flags.get(key);
    if (!flag || !this.isEnabled(key, userId)) {
      return defaultValue;
    }

    // Return metadata value if it exists and matches type
    if (flag.conditions?.metadata && flag.conditions.metadata.value !== undefined) {
      return flag.conditions.metadata.value as T;
    }

    return defaultValue;
  }

  // Get all flags for debugging
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  // Force refresh flags
  async refresh(): Promise<void> {
    await this.fetchFlags();
  }

  // Update user context
  setUserId(userId: string): void {
    this.context.userId = userId;
  }

  // Analytics: Track feature flag usage
  trackUsage(key: string, action: string, properties?: Record<string, any>): void {
    // Send to analytics service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'feature_flag_used', {
        feature_key: key,
        action,
        user_id: this.context.userId,
        session_id: this.context.sessionId,
        ...properties,
      });
    }
  }

  // Remote configuration for admin
  async updateFlag(key: string, updates: Partial<FeatureFlag>): Promise<boolean> {
    try {
      const response = await fetch(`/api/feature-flags/${key}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await this.fetchFlags();
        return true;
      }
    } catch (error) {
      logger.error('Failed to update feature flag:', error);
    }
    return false;
  }

  // Create experiment (A/B test)
  createExperiment(key: string, variants: Record<string, any>, weights?: number[]): void {
    const flag: FeatureFlag = {
      key,
      enabled: true,
      description: `A/B test: ${key}`,
      conditions: {
        percentage: 100,
        metadata: {
          variants,
          weights: weights || Object.keys(variants).map(() => 100 / Object.keys(variants).length),
          isExperiment: true,
        },
      },
    };

    this.flags.set(key, flag);
    this.saveCachedFlags();
  }

  // Get experiment variant for user
  getExperimentVariant(key: string, userId?: string): string | null {
    const flag = this.flags.get(key);
    if (!flag || !this.isEnabled(key, userId) || !flag.conditions?.metadata?.isExperiment) {
      return null;
    }

    const variants = flag.conditions.metadata.variants;
    const weights = flag.conditions.metadata.weights;
    const variantKeys = Object.keys(variants);

    // Use consistent hashing to assign variant
    const input = `${this.context.sessionId}:${key}:experiment`;
    let hash = 0;

    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    const hashPositive = Math.abs(hash);
    const userScore = hashPositive % 100;

    // Calculate which variant based on weights
    let cumulative = 0;
    for (let i = 0; i < variantKeys.length; i++) {
      cumulative += weights[i];
      if (userScore < cumulative) {
        return variantKeys[i];
      }
    }

    return variantKeys[0];
  }
}

// Export singleton instance
export const featureFlagService = FeatureFlagService.getInstance();

// React hook for feature flags
import { useEffect, useState, useMemo } from 'react';

export function useFeatureFlag(key: string, defaultValue: boolean = false) {
  const [userId, setUserId] = useState<string | undefined>();

  // Get user ID from auth context
  useEffect(() => {
    // This would come from your auth context
    // const { user } = useAuth();
    // setUserId(user?.id);
  }, []);

  const isEnabled = useMemo(() => {
    return featureFlagService.isEnabled(key, userId);
  }, [key, userId]);

  const trackUsage = (action: string, properties?: Record<string, any>) => {
    featureFlagService.trackUsage(key, action, properties);
  };

  return { isEnabled, trackUsage };
}

// Hook for multiple flags
export function useFeatureFlags(keys: string[]): Record<string, boolean> {
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    // Get user ID from auth context
  }, []);

  return useMemo(() => {
    return featureFlagService.getEnabledFlags(userId);
  }, [keys, userId]);
}

// Hook for experiments
export function useExperiment(key: string, variants: Record<string, any>, weights?: number[]) {
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    // Get user ID from auth context
  }, []);

  // Create experiment if it doesn't exist
  useEffect(() => {
    if (!featureFlagService.getAllFlags().find(f => f.key === key)) {
      featureFlagService.createExperiment(key, variants, weights);
    }
  }, [key, variants, weights]);

  const variant = useMemo(() => {
    return featureFlagService.getExperimentVariant(key, userId);
  }, [key, userId]);

  const trackExperiment = (action: string, properties?: Record<string, any>) => {
    featureFlagService.trackUsage(key, action, {
      variant,
      ...properties,
    });
  };

  return { variant, trackExperiment };
}

// Convenience exports
export const isNewBookingFlowEnabled = (userId?: string) =>
  featureFlagService.isEnabled('new-booking-flow', userId);

export const isWebSocketEnabled = (userId?: string) =>
  featureFlagService.isEnabled('websocket-availability', userId);

export const isRedisCachingEnabled = () =>
  featureFlagService.isEnabled('redis-caching');

export const isBatchRequestsEnabled = () =>
  featureFlagService.isEnabled('batch-requests');

export const isLazyLoadingEnabled = (userId?: string) =>
  featureFlagService.isEnabled('lazy-loading', userId);

// Initialize feature flags
if (typeof window !== 'undefined') {
  // Set up development mode flags
  if (import.meta.env.DEV) {
    // Enable all flags in development
    window.featureFlags = {
      enabled: true,
      flags: featureFlagService.getAllFlags(),
      service: featureFlagService,
    };
  }

  // Expose for debugging in production
  if (import.meta.env.PROD) {
    window.featureFlags = {
      service: featureFlagService,
      getEnabledFlags: () => featureFlagService.getEnabledFlags(),
      isEnabled: (key: string, userId?: string) => featureFlagService.isEnabled(key, userId),
    };
  }
}