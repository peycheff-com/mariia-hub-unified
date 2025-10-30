import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { crossPlatformSyncService, SyncStatus, UserDevice } from '@/services/cross-platform-sync.service';

interface CrossPlatformState {
  // Device information
  currentDevice: UserDevice | null;
  userDevices: UserDevice[];

  // Sync status
  syncStatus: SyncStatus | null;
  isOnline: boolean;

  // Session management
  activeSessionId: string | null;
  sessionDeviceCount: number;
  isPrimaryDevice: boolean;

  // User preferences
  crossPlatformPreferences: {
    enableNotifications: boolean;
    syncBookings: boolean;
    syncPreferences: boolean;
    conflictResolution: 'auto' | 'manual';
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };

  // Platform-specific settings
  platformSettings: {
    platform: 'web' | 'ios' | 'android';
    capabilities: {
      pushNotifications: boolean;
      backgroundSync: boolean;
      offlineMode: boolean;
      biometricAuth: boolean;
    };
    ui: {
      theme: 'light' | 'dark' | 'auto';
      denseMode: boolean;
      animationsEnabled: boolean;
    };
  };
}

interface CrossPlatformContextType extends CrossPlatformState {
  // Actions
  updatePreferences: (preferences: Partial<CrossPlatformState['crossPlatformPreferences']>) => void;
  updatePlatformSettings: (settings: Partial<CrossPlatformState['platformSettings']>) => void;
  setActiveDevice: (deviceId: string) => void;
  removeDevice: (deviceId: string) => void;

  // Sync actions
  triggerSync: () => Promise<void>;
  resolveConflict: (conflictId: string, resolution: any) => void;

  // Session management
  createSession: () => string;
  joinSession: (sessionId: string) => void;
  leaveSession: () => void;

  // Backup and restore
  createBackup: () => Promise<string | null>;
  restoreBackup: (backupId: string) => Promise<boolean>;

  // Notification management
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => void;

  // Platform detection
  getDeviceInfo: () => Promise<UserDevice | null>;
  isNativeApp: () => boolean;
}

const CrossPlatformContext = createContext<CrossPlatformContextType | null>(null);

interface CrossPlatformProviderProps {
  children: ReactNode;
}

export const CrossPlatformProvider: React.FC<CrossPlatformProviderProps> = ({
  children
}) => {
  const [state, setState] = useState<CrossPlatformState>({
    currentDevice: null,
    userDevices: [],
    syncStatus: null,
    isOnline: navigator.onLine,
    activeSessionId: null,
    sessionDeviceCount: 0,
    isPrimaryDevice: false,
    crossPlatformPreferences: {
      enableNotifications: true,
      syncBookings: true,
      syncPreferences: true,
      conflictResolution: 'auto',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    },
    platformSettings: {
      platform: 'web',
      capabilities: {
        pushNotifications: false,
        backgroundSync: true,
        offlineMode: true,
        biometricAuth: false
      },
      ui: {
        theme: 'auto',
        denseMode: false,
        animationsEnabled: true
      }
    }
  });

  // Initialize cross-platform features
  useEffect(() => {
    initializeCrossPlatform();
    setupEventListeners();

    return () => {
      cleanup();
    };
  }, []);

  const initializeCrossPlatform = async () => {
    try {
      // Get device info
      const deviceInfo = await getDeviceInfo();
      if (deviceInfo) {
        setState(prev => ({
          ...prev,
          currentDevice: deviceInfo,
          platform: deviceInfo.platform as any,
          isPrimaryDevice: deviceInfo.is_primary
        }));

        // Load user devices
        await loadUserDevices();
      }

      // Load preferences from storage
      await loadPreferences();

      // Detect platform capabilities
      detectPlatformCapabilities();

      // Subscribe to sync status
      crossPlatformSyncService.onSyncStatusChange((syncStatus) => {
        setState(prev => ({ ...prev, syncStatus }));
      });

      // Initialize notification aria-live="polite" aria-atomic="true"s if enabled
      if (state.crossPlatformPreferences.enableNotifications) {
        await initializeNotifications();
      }
    } catch (error) {
      console.error('Failed to initialize cross-platform features:', error);
    }
  };

  const setupEventListeners = () => {
    // Network status changes
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      triggerSync(); // Trigger sync when coming back online
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cross-platform events
    const handleSyncConflict = (event: CustomEvent) => {
      // Handle conflict resolution
      console.log('Sync conflict detected:', event.detail);
    };

    const handleStateUpdate = (event: CustomEvent) => {
      // Handle state updates from other devices
      console.log('State update received:', event.detail);
    };

    const handleIncomingNotification = (event: CustomEvent) => {
      // Handle incoming notification aria-live="polite" aria-atomic="true"s
      console.log('Notification received:', event.detail);
    };

    window.addEventListener('syncConflictResolution', handleSyncConflict as EventListener);
    window.addEventListener('stateUpdate', handleStateUpdate as EventListener);
    window.addEventListener('crossPlatformNotification', handleIncomingNotification as EventListener);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('syncConflictResolution', handleSyncConflict as EventListener);
      window.removeEventListener('stateUpdate', handleStateUpdate as EventListener);
      window.removeEventListener('crossPlatformNotification', handleIncomingNotification as EventListener);
    };
  };

  const loadUserDevices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_seen_at', { ascending: false });

      if (error) {
        console.error('Failed to load user devices:', error);
        return;
      }

      setState(prev => ({
        ...prev,
        userDevices: data || []
      }));
    } catch (error) {
      console.error('Error loading user devices:', error);
    }
  };

  const loadPreferences = async () => {
    try {
      const stored = localStorage.getItem('cross_platform_preferences');
      if (stored) {
        const preferences = JSON.parse(stored);
        setState(prev => ({
          ...prev,
          crossPlatformPreferences: { ...prev.crossPlatformPreferences, ...preferences }
        }));
      }

      // Load platform-specific settings
      const platformStored = localStorage.getItem('platform_settings');
      if (platformStored) {
        const settings = JSON.parse(platformStored);
        setState(prev => ({
          ...prev,
          platformSettings: { ...prev.platformSettings, ...settings }
        }));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const detectPlatformCapabilities = () => {
    const platform = state.platformSettings.platform;
    const capabilities = { ...state.platformSettings.capabilities };

    // Detect capabilities based on platform
    if (platform === 'web') {
      capabilities.pushNotifications = 'Notification' in window && Notification.permission === 'granted';
      capabilities.backgroundSync = 'serviceWorker' in navigator;
      capabilities.offlineMode = true;
      capabilities.biometricAuth = false;
    } else if (platform === 'ios' || platform === 'android') {
      // Native app capabilities (would be injected by native bridge)
      capabilities.pushNotifications = true; // Assume native apps have this
      capabilities.backgroundSync = true;
      capabilities.offlineMode = true;
      capabilities.biometricAuth = true; // Assume native apps have this
    }

    setState(prev => ({
      ...prev,
      platformSettings: {
        ...prev.platformSettings,
        capabilities
      }
    }));
  };

  const initializeNotifications = async () => {
    if (state.platformSettings.platform === 'web') {
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setState(prev => ({
            ...prev,
            platformSettings: {
              ...prev.platformSettings,
              capabilities: {
                ...prev.platformSettings.capabilities,
                pushNotifications: true
              }
            }
          }));
        }
      }
    }
    // Native apps would handle this differently
  };

  const getDeviceInfo = async (): Promise<UserDevice | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Generate device ID if not exists
      const deviceId = localStorage.getItem('cross_platform_device_id') ||
                     `${state.platformSettings.platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('cross_platform_device_id', deviceId);

      // Get device info from database or register new device
      const { data, error } = await supabase.rpc('register_device', {
        p_user_id: user.id,
        p_device_id: deviceId,
        p_platform: state.platformSettings.platform,
        p_device_name: getDeviceName(),
        p_app_version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        p_os_version: getOSVersion()
      });

      if (error) {
        console.error('Failed to register device:', error);
        return null;
      }

      // Fetch full device info
      const { data: deviceData } = await supabase
        .from('user_devices')
        .select('*')
        .eq('id', data)
        .single();

      return deviceData;
    } catch (error) {
      console.error('Error getting device info:', error);
      return null;
    }
  };

  const getDeviceName = (): string => {
    const userAgent = navigator.userAgent;

    if (/iPhone/.test(userAgent)) return 'iPhone';
    if (/iPad/.test(userAgent)) return 'iPad';
    if (/Android/.test(userAgent)) return 'Android Device';
    if (/Mac/.test(navigator.platform)) return 'Mac';
    if (/Win/.test(navigator.platform)) return 'Windows PC';

    return 'Web Browser';
  };

  const getOSVersion = (): string => {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/(OS|Android|Windows|Mac) ([\d._]+)/);
    return match ? match[2] : 'Unknown';
  };

  const updatePreferences = useCallback((preferences: Partial<CrossPlatformState['crossPlatformPreferences']>) => {
    setState(prev => ({
      ...prev,
      crossPlatformPreferences: { ...prev.crossPlatformPreferences, ...preferences }
    }));

    // Save to localStorage
    localStorage.setItem('cross_platform_preferences', JSON.stringify(preferences));

    // Sync across devices if enabled
    if (state.crossPlatformPreferences.syncPreferences && state.currentDevice) {
      crossPlatformSyncService.syncData(
        'preferences',
        state.currentDevice.id,
        preferences,
        'update'
      );
    }
  }, [state.crossPlatformPreferences.syncPreferences, state.currentDevice]);

  const updatePlatformSettings = useCallback((settings: Partial<CrossPlatformState['platformSettings']>) => {
    setState(prev => ({
      ...prev,
      platformSettings: { ...prev.platformSettings, ...settings }
    }));

    // Save to localStorage
    localStorage.setItem('platform_settings', JSON.stringify(settings));
  }, []);

  const setActiveDevice = useCallback(async (deviceId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update device last seen and make primary
      await supabase
        .from('user_devices')
        .update({
          last_seen_at: new Date().toISOString(),
          is_primary: true
        })
        .eq('id', deviceId)
        .eq('user_id', user.id);

      // Set other devices to non-primary
      await supabase
        .from('user_devices')
        .update({ is_primary: false })
        .eq('user_id', user.id)
        .neq('id', deviceId);

      // Reload devices
      await loadUserDevices();
    } catch (error) {
      console.error('Error setting active device:', error);
    }
  }, []);

  const removeDevice = useCallback(async (deviceId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_devices')
        .update({ is_active: false })
        .eq('id', deviceId)
        .eq('user_id', user.id);

      await loadUserDevices();
    } catch (error) {
      console.error('Error removing device:', error);
    }
  }, []);

  const triggerSync = useCallback(async () => {
    try {
      // Implementation would trigger sync across all entities
      await crossPlatformSyncService.syncData('profile', 'all', {}, 'sync');
    } catch (error) {
      console.error('Error triggering sync:', error);
    }
  }, []);

  const resolveConflict = useCallback((conflictId: string, resolution: any) => {
    // Implementation for conflict resolution
    console.log('Resolving conflict:', conflictId, resolution);
  }, []);

  const createSession = useCallback((): string => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setState(prev => ({
      ...prev,
      activeSessionId: sessionId,
      sessionDeviceCount: 1
    }));

    // Store session ID
    sessionStorage.setItem('cross_platform_session', sessionId);

    return sessionId;
  }, []);

  const joinSession = useCallback((sessionId: string) => {
    setState(prev => ({
      ...prev,
      activeSessionId: sessionId,
      sessionDeviceCount: prev.sessionDeviceCount + 1
    }));

    sessionStorage.setItem('cross_platform_session', sessionId);
  }, []);

  const leaveSession = useCallback(() => {
    setState(prev => ({
      ...prev,
      activeSessionId: null,
      sessionDeviceCount: Math.max(0, prev.sessionDeviceCount - 1)
    }));

    sessionStorage.removeItem('cross_platform_session');
  }, []);

  const createBackup = useCallback(async (): Promise<string | null> => {
    return await crossPlatformSyncService.createBackup();
  }, []);

  const restoreBackup = useCallback(async (backupId: string): Promise<boolean> => {
    return await crossPlatformSyncService.restoreBackup(backupId);
  }, []);

  const enableNotifications = useCallback(async (): Promise<boolean> => {
    if (state.platformSettings.platform === 'web') {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          updatePreferences({ enableNotifications: true });
          setState(prev => ({
            ...prev,
            platformSettings: {
              ...prev.platformSettings,
              capabilities: {
                ...prev.platformSettings.capabilities,
                pushNotifications: true
              }
            }
          }));
          return true;
        }
      }
      return false;
    }

    // Native apps would handle this differently
    updatePreferences({ enableNotifications: true });
    return true;
  }, [state.platformSettings.platform, updatePreferences]);

  const disableNotifications = useCallback(() => {
    updatePreferences({ enableNotifications: false });
    setState(prev => ({
      ...prev,
      platformSettings: {
        ...prev.platformSettings,
        capabilities: {
          ...prev.platformSettings.capabilities,
          pushNotifications: false
        }
      }
    }));
  }, [updatePreferences]);

  const isNativeApp = useCallback((): boolean => {
    return state.platformSettings.platform !== 'web';
  }, [state.platformSettings.platform]);

  const cleanup = () => {
    // Cleanup resources
    crossPlatformSyncService.cleanup();
  };

  const value: CrossPlatformContextType = {
    ...state,
    updatePreferences,
    updatePlatformSettings,
    setActiveDevice,
    removeDevice,
    triggerSync,
    resolveConflict,
    createSession,
    joinSession,
    leaveSession,
    createBackup,
    restoreBackup,
    enableNotifications,
    disableNotifications,
    getDeviceInfo,
    isNativeApp
  };

  return (
    <CrossPlatformContext.Provider value={value}>
      {children}
    </CrossPlatformContext.Provider>
  );
};

export const useCrossPlatform = () => {
  const context = useContext(CrossPlatformContext);
  if (!context) {
    throw new Error('useCrossPlatform must be used within a CrossPlatformProvider');
  }
  return context;
};

export default CrossPlatformContext;