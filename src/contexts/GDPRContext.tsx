import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import {
  CookieConsent,
  CookieConsentCategory,
  ConsentPreferences,
  GDPRComplianceStatus,
  DataSubjectRequest,
  DataSubjectRequestType,
  CookieBannerConfig,
} from '@/types/gdpr';

interface GDPRContextType {
  // Cookie Consent
  consentPreferences: ConsentPreferences | null;
  hasGivenConsent: boolean;
  showCookieBanner: boolean;
  cookieBannerConfig: CookieBannerConfig;

  // GDPR Compliance Status
  complianceStatus: GDPRComplianceStatus | null;

  // Actions
  acceptAllCookies: () => Promise<void>;
  rejectAllCookies: () => Promise<void>;
  updateConsentPreferences: (preferences: Partial<ConsentPreferences>) => Promise<void>;
  hideCookieBanner: () => void;

  // Data Subject Rights
  submitDataRequest: (type: DataSubjectRequestType, description: string) => Promise<void>;
  exportUserData: () => Promise<void>;
  requestAccountDeletion: () => Promise<void>;

  // Loading states
  isLoading: boolean;
  isUpdating: boolean;
}

const GDPRContext = createContext<GDPRContextType | undefined>(undefined);

interface GDPRProviderProps {
  children: ReactNode;
  config?: Partial<CookieBannerConfig>;
}

const DEFAULT_COOKIE_BANNER_CONFIG: CookieBannerConfig = {
  showBanner: true,
  forceUpdate: false,
  position: 'bottom',
  theme: 'light',
  acceptAllButton: true,
  customizeButton: true,
  necessaryOnlyButton: true,
  privacyPolicyLink: '/privacy-policy',
  cookiePolicyLink: '/cookie-policy',
};

const DEFAULT_CONSENT_PREFERENCES: ConsentPreferences = {
  essential: true, // Essential cookies are always required
  analytics: false,
  marketing: false,
  personalization: false,
  timestamp: new Date().toISOString(),
  version: 1,
};

export function GDPRProvider({ children, config = {} }: GDPRProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [consentPreferences, setConsentPreferences] = useState<ConsentPreferences | null>(null);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [cookieBannerConfig] = useState<CookieBannerConfig>({
    ...DEFAULT_COOKIE_BANNER_CONFIG,
    ...config,
  });
  const [complianceStatus, setComplianceStatus] = useState<GDPRComplianceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Initialize user authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    };

    initializeAuth();
  }, []);

  // Load consent preferences on mount or user change
  useEffect(() => {
    loadConsentPreferences();
  }, [user]);

  // Check if we should show cookie banner
  useEffect(() => {
    if (!isLoading) {
      shouldShowCookieBanner();
    }
  }, [consentPreferences, isLoading, cookieBannerConfig]);

  const loadConsentPreferences = async () => {
    try {
      setIsLoading(true);

      // Check for existing consent in localStorage (for anonymous users)
      const localConsent = localStorage.getItem('cookie-consent');
      if (localConsent) {
        const parsed = JSON.parse(localConsent);
        setConsentPreferences(parsed);
      }

      // If user is authenticated, load from database
      if (user) {
        const { data: consentRecords } = await supabase
          .from('cookie_consents')
          .select('*')
          .eq('user_id', user.id)
          .order('consent_timestamp', { ascending: false })
          .limit(1);

        if (consentRecords && consentRecords.length > 0) {
          const latestConsent = consentRecords[0];
          setConsentPreferences(latestConsent.consent_data as ConsentPreferences);
        }
      }

      // Load compliance status
      await loadComplianceStatus();
    } catch (error) {
      console.error('Error loading consent preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadComplianceStatus = async () => {
    if (!user) return;

    try {
      // Load pending data subject requests
      const { data: pendingRequests } = await supabase
        .from('data_subject_requests')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'processing']);

      // Load processing activities
      const { data: processingActivities } = await supabase
        .from('processing_activities')
        .select('name, description, lawful_basis, retention_period');

      // Load retention policies
      const { data: retentionPolicies } = await supabase
        .from('retention_policies')
        .select('*');

      setComplianceStatus({
        hasConsent: !!consentPreferences,
        consentCategories: consentPreferences ? {
          essential: consentPreferences.essential,
          analytics: consentPreferences.analytics,
          marketing: consentPreferences.marketing,
          personalization: consentPreferences.personalization,
        } : {
          essential: false,
          analytics: false,
          marketing: false,
          personalization: false,
        },
        lastConsentUpdate: consentPreferences?.timestamp,
        consentVersion: consentPreferences?.version || 1,
        pendingRequests: pendingRequests || [],
        dataRetentionPolicies: retentionPolicies || [],
        canDeleteAccount: !(pendingRequests?.some(req => req.request_type === 'erasure' && req.status !== 'completed')),
        hasOutstandingRequests: (pendingRequests?.length || 0) > 0,
      });
    } catch (error) {
      console.error('Error loading compliance status:', error);
    }
  };

  const shouldShowCookieBanner = () => {
    const hasConsent = !!consentPreferences;
    const needsUpdate = cookieBannerConfig.forceUpdate ||
      (consentPreferences && consentPreferences.version < 1);

    setShowCookieBanner(!hasConsent || needsUpdate);
  };

  const saveConsentPreferences = async (preferences: ConsentPreferences) => {
    try {
      setIsUpdating(true);

      const consentData = {
        ...preferences,
        timestamp: new Date().toISOString(),
        version: 1,
      };

      // Save to localStorage for anonymous users
      localStorage.setItem('cookie-consent', JSON.stringify(consentData));

      // If user is authenticated, save to database
      if (user) {
        const { error } = await supabase
          .from('cookie_consents')
          .insert({
            user_id: user.id,
            consent_data: consentData,
            ip_address: await getClientIP(),
            user_agent: navigator.userAgent,
            consent_timestamp: new Date().toISOString(),
            version: 1,
          });

        if (error) throw error;
      }

      setConsentPreferences(consentData);
      setShowCookieBanner(false);

      // Log the consent activity
      await logProcessingActivity('Cookie Consent Management', 'consent_given', {
        consent_data: consentData,
      });

    } catch (error) {
      console.error('Error saving consent preferences:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const acceptAllCookies = async () => {
    const allConsents: ConsentPreferences = {
      ...DEFAULT_CONSENT_PREFERENCES,
      analytics: true,
      marketing: true,
      personalization: true,
    };
    await saveConsentPreferences(allConsents);
  };

  const rejectAllCookies = async () => {
    const minimalConsents: ConsentPreferences = {
      ...DEFAULT_CONSENT_PREFERENCES,
      analytics: false,
      marketing: false,
      personalization: false,
    };
    await saveConsentPreferences(minimalConsents);
  };

  const updateConsentPreferences = async (preferences: Partial<ConsentPreferences>) => {
    if (!consentPreferences) {
      await saveConsentPreferences({ ...DEFAULT_CONSENT_PREFERENCES, ...preferences });
    } else {
      await saveConsentPreferences({ ...consentPreferences, ...preferences });
    }
  };

  const hideCookieBanner = () => {
    setShowCookieBanner(false);
  };

  const submitDataRequest = async (type: DataSubjectRequestType, description: string) => {
    if (!user) {
      throw new Error('User must be authenticated to submit data subject requests');
    }

    try {
      const { error } = await supabase
        .from('data_subject_requests')
        .insert({
          request_type: type,
          user_id: user.id,
          email: user.email!,
          description,
          status: 'pending',
        });

      if (error) throw error;

      // Reload compliance status
      await loadComplianceStatus();

      // Log the request
      await logProcessingActivity('Data Subject Rights', 'data_request_submitted', {
        request_type: type,
        description,
      });

    } catch (error) {
      console.error('Error submitting data request:', error);
      throw error;
    }
  };

  const exportUserData = async () => {
    if (!user) {
      throw new Error('User must be authenticated to export data');
    }

    try {
      // Collect user data from various tables
      const [profile, bookings, consents, requests] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('bookings').select('*').eq('user_id', user.id),
        supabase.from('cookie_consents').select('*').eq('user_id', user.id),
        supabase.from('data_subject_requests').select('*').eq('user_id', user.id),
      ]);

      const exportData = {
        personalData: {
          profile: profile.data,
          bookings: bookings.data || [],
        },
        consentRecords: consents.data || [],
        dataRequests: requests.data || [],
        exportDate: new Date().toISOString(),
        format: 'json',
      };

      // Create blob and download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-export-${user.id}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Log the export
      await logProcessingActivity('Data Subject Rights', 'data_exported', {
        format: 'json',
        recordCounts: {
          bookings: bookings.data?.length || 0,
          consents: consents.data?.length || 0,
          requests: requests.data?.length || 0,
        },
      });

    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  };

  const requestAccountDeletion = async () => {
    if (!user) {
      throw new Error('User must be authenticated to request account deletion');
    }

    try {
      await submitDataRequest('erasure', 'User has requested complete account deletion and removal of all personal data');
    } catch (error) {
      console.error('Error requesting account deletion:', error);
      throw error;
    }
  };

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  const logProcessingActivity = async (
    activityName: string,
    action: string,
    dataAffected: Record<string, any>
  ) => {
    try {
      const { error } = await supabase.rpc('log_processing_activity', {
        activity_name: activityName,
        user_action: action,
        user_uuid: user?.id,
        data_affected: dataAffected,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging processing activity:', error);
    }
  };

  const value: GDPRContextType = {
    consentPreferences,
    hasGivenConsent: !!consentPreferences,
    showCookieBanner,
    cookieBannerConfig,
    complianceStatus,
    acceptAllCookies,
    rejectAllCookies,
    updateConsentPreferences,
    hideCookieBanner,
    submitDataRequest,
    exportUserData,
    requestAccountDeletion,
    isLoading,
    isUpdating,
  };

  return <GDPRContext.Provider value={value}>{children}</GDPRContext.Provider>;
}

export function useGDPR() {
  const context = useContext(GDPRContext);
  if (context === undefined) {
    throw new Error('useGDPR must be used within a GDPRProvider');
  }
  return context;
}

// Helper hooks for specific consent categories
export function useCookieConsent(category: CookieConsentCategory) {
  const { consentPreferences } = useGDPR();
  return consentPreferences?.[category] ?? false;
}

export function useAnalyticsConsent() {
  return useCookieConsent('analytics');
}

export function useMarketingConsent() {
  return useCookieConsent('marketing');
}