import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import React, { useState } from 'react';

// Feature flag types
export type FeatureFlag =
  | 'ai_content_generation'
  | 'ai_smart_scheduling'
  | 'ai_translation'
  | 'ai_recommendations'
  | 'ai_chatbot'
  | 'advanced_analytics'
  | 'new_booking_flow'
  | 'beta_ui'
  | 'premium_features'
  | 'multi_language'
  | 'online_payments'
  | 'video_consultations'
  | 'mobile_app';

export interface FeatureFlagConfig {
  enabled: boolean;
  rolloutPercentage?: number;
  targetUsers?: string[];
  targetRoles?: string[];
  startDate?: string;
  endDate?: string;
  metadata?: Record<string, any>;
}

export interface FeatureFlagsState {
  flags: Record<FeatureFlag, FeatureFlagConfig>;
  userFeatures: Set<FeatureFlag>;
  isLoading: boolean;
  error: string | null;

  // Actions
  setFlag: (flag: FeatureFlag, config: FeatureFlagConfig) => void;
  enableFlag: (flag: FeatureFlag) => void;
  disableFlag: (flag: FeatureFlag) => void;
  updateFlag: (flag: FeatureFlag, updates: Partial<FeatureFlagConfig>) => void;
  isFlagEnabled: (flag: FeatureFlag, userId?: string, userRole?: string) => boolean;
  loadFlags: () => Promise<void>;
  resetFlags: () => void;
  getUserEnabledFlags: (userId?: string, userRole?: string) => FeatureFlag[];
}

// Default feature flag configurations
const defaultFlags: Record<FeatureFlag, FeatureFlagConfig> = {
  ai_content_generation: {
    enabled: true,
    rolloutPercentage: 100,
    metadata: {
      description: 'AI-powered content generation for blogs and services',
      category: 'ai',
    },
  },
  ai_smart_scheduling: {
    enabled: true,
    rolloutPercentage: 100,
    metadata: {
      description: 'AI-driven scheduling insights and optimization',
      category: 'ai',
    },
  },
  ai_translation: {
    enabled: true,
    rolloutPercentage: 100,
    metadata: {
      description: 'AI translation between English and Polish',
      category: 'ai',
    },
  },
  ai_recommendations: {
    enabled: true,
    rolloutPercentage: 100,
    metadata: {
      description: 'Personalized service recommendations',
      category: 'ai',
    },
  },
  ai_chatbot: {
    enabled: false,
    rolloutPercentage: 0,
    metadata: {
      description: 'AI chatbot for customer support',
      category: 'ai',
    },
  },
  advanced_analytics: {
    enabled: true,
    rolloutPercentage: 100,
    targetRoles: ['admin', 'manager'],
    metadata: {
      description: 'Advanced analytics dashboard',
      category: 'analytics',
    },
  },
  new_booking_flow: {
    enabled: false,
    rolloutPercentage: 10,
    metadata: {
      description: 'New improved booking flow',
      category: 'booking',
    },
  },
  beta_ui: {
    enabled: false,
    rolloutPercentage: 5,
    targetUsers: [], // Specific beta users
    metadata: {
      description: 'Beta UI features',
      category: 'ui',
    },
  },
  premium_features: {
    enabled: true,
    rolloutPercentage: 100,
    targetRoles: ['premium', 'vip'],
    metadata: {
      description: 'Premium only features',
      category: 'premium',
    },
  },
  multi_language: {
    enabled: true,
    rolloutPercentage: 100,
    metadata: {
      description: 'Multi-language support',
      category: 'localization',
    },
  },
  online_payments: {
    enabled: true,
    rolloutPercentage: 100,
    metadata: {
      description: 'Online payment processing',
      category: 'payments',
    },
  },
  video_consultations: {
    enabled: false,
    rolloutPercentage: 0,
    metadata: {
      description: 'Video consultation booking',
      category: 'consultations',
    },
  },
  mobile_app: {
    enabled: false,
    rolloutPercentage: 0,
    metadata: {
      description: 'Mobile app features',
      category: 'mobile',
    },
  },
};

export const useFeatureFlagsStore = create<FeatureFlagsState>()(
  devtools(
    persist(
      (set, get) => ({
        flags: defaultFlags,
        userFeatures: new Set(),
        isLoading: false,
        error: null,

        setFlag: (flag, config) => {
          set((state) => ({
            flags: {
              ...state.flags,
              [flag]: config,
            },
          }));
        },

        enableFlag: (flag) => {
          set((state) => ({
            flags: {
              ...state.flags,
              [flag]: {
                ...state.flags[flag],
                enabled: true,
              },
            },
          }));
        },

        disableFlag: (flag) => {
          set((state) => ({
            flags: {
              ...state.flags,
              [flag]: {
                ...state.flags[flag],
                enabled: false,
              },
            },
          }));
        },

        updateFlag: (flag, updates) => {
          set((state) => ({
            flags: {
              ...state.flags,
              [flag]: {
                ...state.flags[flag],
                ...updates,
              },
            },
          }));
        },

        isFlagEnabled: (flag, userId?: string, userRole?: string) => {
          const config = get().flags[flag];

          if (!config.enabled) {
            return false;
          }

          // Check date constraints
          const now = new Date();
          if (config.startDate && new Date(config.startDate) > now) {
            return false;
          }
          if (config.endDate && new Date(config.endDate) < now) {
            return false;
          }

          // Check target roles
          if (config.targetRoles && userRole) {
            if (!config.targetRoles.includes(userRole)) {
              return false;
            }
          } else if (config.targetRoles && !userRole) {
            return false;
          }

          // Check target users
          if (config.targetUsers && userId) {
            if (!config.targetUsers.includes(userId)) {
              return false;
            }
          } else if (config.targetUsers && !userId) {
            return false;
          }

          // Check rollout percentage
          if (config.rolloutPercentage !== undefined && config.rolloutPercentage < 100) {
            if (!userId) {
              return false;
            }

            // Consistent hash for user ID
            const hash = hashCode(userId);
            const threshold = (config.rolloutPercentage / 100) * 4294967295; // Max 32-bit unsigned

            if (hash > threshold) {
              return false;
            }
          }

          return true;
        },

        loadFlags: async () => {
          set({ isLoading: true, error: null });

          try {
            // In production, this would fetch from your API
            // const response = await fetch('/api/feature-flags');
            // const flags = await response.json();

            // For now, just use defaults
            set({ isLoading: false });
          } catch (error) {
            set({
              isLoading: false,
              error: error.message || 'Failed to load feature flags',
            });
          }
        },

        resetFlags: () => {
          set({
            flags: defaultFlags,
            userFeatures: new Set(),
            error: null,
          });
        },

        getUserEnabledFlags: (userId?: string, userRole?: string) => {
          const { flags, isFlagEnabled } = get();
          const enabled: FeatureFlag[] = [];

          for (const flag in flags) {
            if (isFlagEnabled(flag as FeatureFlag, userId, userRole)) {
              enabled.push(flag as FeatureFlag);
            }
          }

          return enabled;
        },
      }),
      {
        name: 'feature-flags-storage',
        version: 1,
      }
    ),
    { name: 'feature-flags' }
  )
);

// Utility functions
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Hook for easier feature flag checking
export function useFeatureFlag(flag: FeatureFlag, userId?: string, userRole?: string) {
  const isEnabled = useFeatureFlagsStore((state) =>
    state.isFlagEnabled(flag, userId, userRole)
  );

  return isEnabled;
}

// Hook for multiple feature flags
export function useFeatureFlags(flags: FeatureFlag[], userId?: string, userRole?: string) {
  const isFlagEnabled = useFeatureFlagsStore((state) => state.isFlagEnabled);

  const results = flags.reduce((acc, flag) => {
    acc[flag] = isFlagEnabled(flag, userId, userRole);
    return acc;
  }, {} as Record<FeatureFlag, boolean>);

  return results;
}

// Hook for all enabled flags
export function useEnabledFeatureFlags(userId?: string, userRole?: string) {
  return useFeatureFlagsStore((state) =>
    state.getUserEnabledFlags(userId, userRole)
  );
}

// Admin hook for managing flags
export function useFeatureFlagAdmin() {
  const store = useFeatureFlagsStore();

  return {
    // Getters
    flags: store.flags,
    isLoading: store.isLoading,
    error: store.error,

    // Actions
    setFlag: store.setFlag,
    enableFlag: store.enableFlag,
    disableFlag: store.disableFlag,
    updateFlag: store.updateFlag,
    loadFlags: store.loadFlags,
    resetFlags: store.resetFlags,

    // Helper methods
    isFlagEnabled: store.isFlagEnabled,
    getUserEnabledFlags: store.getUserEnabledFlags,
  };
}

// Component for feature-gated content
export interface FeatureGateProps {
  flag: FeatureFlag;
  userId?: string;
  userRole?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

export function FeatureGate({
  flag,
  userId,
  userRole,
  children,
  fallback = null,
  loadingComponent = null
}: FeatureGateProps) {
  const isEnabled = useFeatureFlag(flag, userId, userRole);
  const isLoading = useFeatureFlagsStore((state) => state.isLoading);

  if (isLoading && loadingComponent) {
    return <>{loadingComponent}</>;
  }

  if (isEnabled) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// Higher-order component for feature gating
export function withFeatureGate<P extends object>(
  Component: React.ComponentType<P>,
  flag: FeatureFlag,
  fallback?: React.ReactNode
) {
  return function FeatureGateComponent(props: P) {
    return (
      <FeatureGate flag={flag} fallback={fallback}>
        <Component {...props} />
      </FeatureGate>
    );
  };
}

// Server-side flag checking (for SSR/SSG)
export function getServerSideFlags(
  userId?: string,
  userRole?: string
): Record<FeatureFlag, boolean> {
  const flags: Record<FeatureFlag, boolean> = {} as any;

  for (const flag in defaultFlags) {
    const config = defaultFlags[flag as FeatureFlag];

    let enabled = config.enabled;

    // Apply same logic as client-side
    if (enabled && config.targetRoles && userRole) {
      enabled = config.targetRoles.includes(userRole);
    }

    if (enabled && config.rolloutPercentage && config.rolloutPercentage < 100 && userId) {
      const hash = hashCode(userId);
      const threshold = (config.rolloutPercentage / 100) * 4294967295;
      enabled = hash <= threshold;
    }

    flags[flag as FeatureFlag] = enabled;
  }

  return flags;
}

// Export all flags for type checking
export const ALL_FLAGS: FeatureFlag[] = [
  'ai_content_generation',
  'ai_smart_scheduling',
  'ai_translation',
  'ai_recommendations',
  'ai_chatbot',
  'advanced_analytics',
  'new_booking_flow',
  'beta_ui',
  'premium_features',
  'multi_language',
  'online_payments',
  'video_consultations',
  'mobile_app',
] as const;