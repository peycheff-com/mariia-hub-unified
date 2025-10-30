import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Types for cross-platform sync
export interface UserDevice {
  id: string;
  user_id: string;
  device_id: string;
  platform: 'web' | 'ios' | 'android' | 'watchos' | 'wearos';
  device_name?: string;
  app_version?: string;
  os_version?: string;
  push_token?: string;
  is_active: boolean;
  is_primary: boolean;
  last_seen_at: string;
  preferences: Record<string, any>;
  capabilities: DeviceCapabilities;
  created_at: string;
  updated_at: string;
}

export interface DeviceCapabilities {
  supportsHaptics: boolean;
  supportsComplications: boolean;
  supportsVoiceCommands: boolean;
  supportsHealthTracking: boolean;
  supportsOfflineMode: boolean;
  batteryLevel?: number;
  screenSize?: 'small' | 'medium' | 'large';
  hasCellular?: boolean;
}

export interface SyncLog {
  id: string;
  user_id: string;
  device_id: string;
  entity_type: 'booking' | 'profile' | 'preferences' | 'notification_settings';
  entity_id: string;
  operation: 'create' | 'update' | 'delete' | 'sync';
  sync_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  data_before?: Record<string, any>;
  data_after?: Record<string, any>;
  conflict_detected: boolean;
  conflict_resolution?: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface CrossPlatformNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'booking_reminder' | 'booking_confirmation' | 'payment_received' | 'promotion' | 'system_update';
  priority: number;
  data: Record<string, any>;
  target_devices: string[];
  exclude_devices: string[];
  delivery_status: Record<string, string>;
  scheduled_at?: string;
  expires_at?: string;
  created_at: string;
  sent_at?: string;
}

export interface OfflineOperation {
  id: string;
  device_id: string;
  operation_type: 'create_booking' | 'update_profile' | 'cancel_booking' | 'update_preferences';
  operation_data: Record<string, any>;
  priority: number;
  retry_count: number;
  max_retries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  error_message?: string;
  next_retry_at?: string;
  created_at: string;
  processed_at?: string;
}

export interface SyncConflict {
  entityId: string;
  entityType: string;
  localData: Record<string, any>;
  remoteData: Record<string, any>;
  timestamp: string;
  resolutionStrategy: 'use_local' | 'use_remote' | 'merge' | 'manual';
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncAt: string;
  pendingOperations: number;
  conflicts: SyncConflict[];
  deviceInfo: UserDevice | null;
}

class CrossPlatformSyncService {
  private deviceInfo: UserDevice | null = null;
  private realtimeChannels: Map<string, RealtimeChannel> = new Map();
  private syncQueue: Map<string, any> = new Map();
  private conflictResolver: ConflictResolver;
  private optimisticUpdates: Map<string, any> = new Map();
  private offlineQueue: OfflineOperation[] = [];
  private syncStatusCallback?: (status: SyncStatus) => void;

  constructor() {
    this.conflictResolver = new ConflictResolver();
    this.initializeDevice();
    this.setupRealtimeSubscriptions();
    this.setupNetworkListeners();
  }

  /**
   * Initialize the current device for cross-platform sync
   */
  private async initializeDevice(): Promise<void> {
    try {
      const deviceId = this.generateDeviceId();
      const platform = this.detectPlatform();
      const deviceName = this.getDeviceName();
      const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';
      const osVersion = this.getOSVersion();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('register_device', {
        p_user_id: user.id,
        p_device_id: deviceId,
        p_platform: platform,
        p_device_name: deviceName,
        p_app_version: appVersion,
        p_os_version: osVersion
      });

      if (error) {
        console.error('Failed to register device:', error);
        return;
      }

      this.deviceInfo = await this.getDeviceInfo(data);
      this.updateSyncStatus();
    } catch (error) {
      console.error('Error initializing device:', error);
    }
  }

  /**
   * Generate a unique device identifier
   */
  private generateDeviceId(): string {
    // Try to get existing device ID from localStorage
    const existingId = localStorage.getItem('cross_platform_device_id');
    if (existingId) return existingId;

    // Generate new ID
    const newId = `${this.detectPlatform()}_${uuidv4()}`;
    localStorage.setItem('cross_platform_device_id', newId);
    return newId;
  }

  /**
   * Detect the current platform
   */
  private detectPlatform(): 'web' | 'ios' | 'android' | 'watchos' | 'wearos' {
    const userAgent = navigator.userAgent.toLowerCase();

    if (/watchos|apple.*watch/.test(userAgent)) {
      return 'watchos';
    } else if (/wear.*os|android.*wear/.test(userAgent)) {
      return 'wearos';
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'ios';
    } else if (/android/.test(userAgent)) {
      return 'android';
    }

    return 'web';
  }

  /**
   * Get device-friendly name
   */
  private getDeviceName(): string {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;

    if (/iphone/.test(userAgent)) {
      return 'iPhone';
    } else if (/ipad/.test(userAgent)) {
      return 'iPad';
    } else if (/android/.test(userAgent)) {
      return 'Android Device';
    } else if (/mac/.test(platform)) {
      return 'Mac';
    } else if (/win/.test(platform)) {
      return 'Windows PC';
    } else {
      return 'Web Browser';
    }
  }

  /**
   * Get OS version information
   */
  private getOSVersion(): string {
    const userAgent = navigator.userAgent;

    // Extract version from user agent
    const match = userAgent.match(/(OS|Android|Windows|Mac) ([\d._]+)/);
    return match ? match[2] : 'Unknown';
  }

  /**
   * Get device information from database
   */
  private async getDeviceInfo(deviceId: string): Promise<UserDevice | null> {
    const { data, error } = await supabase
      .from('user_devices')
      .select('*')
      .eq('id', deviceId)
      .single();

    if (error) {
      console.error('Failed to get device info:', error);
      return null;
    }

    return data;
  }

  /**
   * Setup real-time subscriptions for sync events
   */
  private setupRealtimeSubscriptions(): void {
    if (!this.deviceInfo) return;

    // Subscribe to sync logs
    const syncChannel = supabase
      .channel('sync_logs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sync_logs',
          filter: `user_id=eq.${this.deviceInfo.user_id}`
        },
        (payload) => this.handleSyncLogChange(payload)
      )
      .subscribe();

    this.realtimeChannels.set('sync_logs', syncChannel);

    // Subscribe to cross-platform notifications
    const notificationChannel = supabase
      .channel('cross_platform_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cross_platform_notifications',
          filter: `user_id=eq.${this.deviceInfo.user_id}`
        },
        (payload) => this.handleIncomingNotification(payload)
      )
      .subscribe();

    this.realtimeChannels.set('notifications', notificationChannel);
  }

  /**
   * Setup network status listeners
   */
  private setupNetworkListeners(): void {
    const handleOnline = () => {
      this.processOfflineQueue();
      this.updateSyncStatus();
    };

    const handleOffline = () => {
      this.updateSyncStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  /**
   * Handle sync log changes from real-time subscription
   */
  private handleSyncLogChange(payload: any): void {
    const syncLog = payload.new as SyncLog;

    if (syncLog.conflict_detected) {
      this.handleConflict(syncLog);
    }

    if (syncLog.sync_status === 'completed') {
      this.removeOptimisticUpdate(syncLog.entity_id);
    }

    this.updateSyncStatus();
  }

  /**
   * Handle incoming cross-platform notifications
   */
  private handleIncomingNotification(payload: any): void {
    const notification = payload.new as CrossPlatformNotification;

    // Check if this device should receive the notification
    if (notification.target_devices.length > 0 &&
        !notification.target_devices.includes(this.deviceInfo?.id || '')) {
      return;
    }

    if (notification.exclude_devices.includes(this.deviceInfo?.id || '')) {
      return;
    }

    // Show notification based on platform
    this.showNotification(notification);
  }

  /**
   * Show notification to user
   */
  private showNotification(notification: CrossPlatformNotification): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        data: notification.data
      });
    } else if ('serviceWorker' in navigator) {
      // Use service worker for notification
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.id,
          data: notification.data
        });
      });
    }

    // Also trigger custom event for app handling
    window.dispatchEvent(new CustomEvent('crossPlatformNotification', {
      detail: notification
    }));
  }

  /**
   * Handle sync conflicts
   */
  private async handleConflict(syncLog: SyncLog): Promise<void> {
    const conflict: SyncConflict = {
      entityId: syncLog.entity_id,
      entityType: syncLog.entity_type,
      localData: syncLog.data_before || {},
      remoteData: syncLog.data_after || {},
      timestamp: syncLog.created_at,
      resolutionStrategy: await this.conflictResolver.resolveConflict(syncLog)
    };

    // Add to sync status conflicts
    const currentStatus = this.getSyncStatus();
    currentStatus.conflicts.push(conflict);

    if (this.syncStatusCallback) {
      this.syncStatusCallback(currentStatus);
    }

    // Apply resolution
    await this.applyConflictResolution(conflict);
  }

  /**
   * Apply conflict resolution
   */
  private async applyConflictResolution(conflict: SyncConflict): Promise<void> {
    try {
      switch (conflict.resolutionStrategy) {
        case 'use_local':
          // Re-apply local changes
          await this.reapplyLocalChanges(conflict);
          break;

        case 'use_remote':
          // Accept remote changes and update local state
          await this.acceptRemoteChanges(conflict);
          break;

        case 'merge':
          // Merge changes if possible
          await this.mergeChanges(conflict);
          break;

        case 'manual':
          // Trigger user intervention
          this.requestManualResolution(conflict);
          break;
      }
    } catch (error) {
      console.error('Failed to apply conflict resolution:', error);
    }
  }

  /**
   * Re-apply local changes after conflict
   */
  private async reapplyLocalChanges(conflict: SyncConflict): Promise<void> {
    // Implementation depends on entity type
    switch (conflict.entityType) {
      case 'booking':
        await this.reapplyBookingChanges(conflict);
        break;
      case 'profile':
        await this.reapplyProfileChanges(conflict);
        break;
      // Add other entity types as needed
    }
  }

  /**
   * Accept remote changes and update local state
   */
  private async acceptRemoteChanges(conflict: SyncConflict): Promise<void> {
    // Update local state with remote data
    this.updateLocalState(conflict.entityId, conflict.remoteData);
  }

  /**
   * Merge local and remote changes
   */
  private async mergeChanges(conflict: SyncConflict): Promise<void> {
    const mergedData = this.conflictResolver.mergeData(conflict.localData, conflict.remoteData);
    this.updateLocalState(conflict.entityId, mergedData);
  }

  /**
   * Request manual conflict resolution from user
   */
  private requestManualResolution(conflict: SyncConflict): void {
    // Trigger UI event for manual resolution
    window.dispatchEvent(new CustomEvent('syncConflictResolution', {
      detail: conflict
    }));
  }

  /**
   * Process offline operations queue when back online
   */
  private async processOfflineQueue(): Promise<void> {
    if (!this.deviceInfo || this.offlineQueue.length === 0) return;

    for (const operation of this.offlineQueue) {
      try {
        await this.executeOfflineOperation(operation);
      } catch (error) {
        console.error('Failed to execute offline operation:', error);
      }
    }

    // Clear processed operations
    this.offlineQueue = this.offlineQueue.filter(op => op.status !== 'completed');
    this.updateSyncStatus();
  }

  /**
   * Execute an offline operation
   */
  private async executeOfflineOperation(operation: OfflineOperation): Promise<void> {
    operation.status = 'processing';

    try {
      switch (operation.operation_type) {
        case 'create_booking':
          await this.createBookingFromOffline(operation.operation_data);
          break;
        case 'update_profile':
          await this.updateProfileFromOffline(operation.operation_data);
          break;
        case 'cancel_booking':
          await this.cancelBookingFromOffline(operation.operation_data);
          break;
        case 'update_preferences':
          await this.updatePreferencesFromOffline(operation.operation_data);
          break;
      }

      operation.status = 'completed';
      operation.processed_at = new Date().toISOString();
    } catch (error) {
      operation.status = 'failed';
      operation.error_message = error instanceof Error ? error.message : 'Unknown error';
      operation.retry_count++;

      if (operation.retry_count < operation.max_retries) {
        operation.next_retry_at = new Date(
          Date.now() + Math.pow(2, operation.retry_count) * 60000
        ).toISOString();
      }
    }
  }

  /**
   * Add operation to offline queue
   */
  private addOfflineOperation(
    operationType: OfflineOperation['operation_type'],
    operationData: Record<string, any>,
    priority: number = 0
  ): void {
    if (!this.deviceInfo) return;

    const operation: OfflineOperation = {
      id: uuidv4(),
      device_id: this.deviceInfo.id,
      operation_type: operationType,
      operation_data: operationData,
      priority,
      retry_count: 0,
      max_retries: 3,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    this.offlineQueue.push(operation);
    this.updateSyncStatus();

    // Try to execute immediately if online
    if (navigator.onLine) {
      this.processOfflineQueue();
    }
  }

  /**
   * Add optimistic update
   */
  private addOptimisticUpdate(entityId: string, data: any): void {
    this.optimisticUpdates.set(entityId, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Remove optimistic update
   */
  private removeOptimisticUpdate(entityId: string): void {
    this.optimisticUpdates.delete(entityId);
  }

  /**
   * Get optimistic update for entity
   */
  public getOptimisticUpdate(entityId: string): any {
    return this.optimisticUpdates.get(entityId);
  }

  /**
   * Update local state with new data
   */
  private updateLocalState(entityId: string, data: any): void {
    // This would integrate with your state management system
    // For example, updating React Context, Redux store, etc.
    window.dispatchEvent(new CustomEvent('stateUpdate', {
      detail: { entityId, data }
    }));
  }

  /**
   * Get current sync status
   */
  public getSyncStatus(): SyncStatus {
    return {
      isOnline: navigator.onLine,
      lastSyncAt: new Date().toISOString(),
      pendingOperations: this.offlineQueue.filter(op => op.status === 'pending').length,
      conflicts: [],
      deviceInfo: this.deviceInfo
    };
  }

  /**
   * Update sync status and notify listeners
   */
  private updateSyncStatus(): void {
    const status = this.getSyncStatus();
    if (this.syncStatusCallback) {
      this.syncStatusCallback(status);
    }
  }

  /**
   * Subscribe to sync status changes
   */
  public onSyncStatusChange(callback: (status: SyncStatus) => void): void {
    this.syncStatusCallback = callback;
    callback(this.getSyncStatus());
  }

  /**
   * Sync data across platforms
   */
  public async syncData(
    entityType: string,
    entityId: string,
    data: any,
    operation: 'create' | 'update' | 'delete'
  ): Promise<void> {
    if (!this.deviceInfo) return;

    // Add optimistic update
    if (operation === 'update' || operation === 'create') {
      this.addOptimisticUpdate(entityId, data);
    }

    if (navigator.onLine) {
      // Sync immediately if online
      try {
        const { error } = await supabase
          .from('sync_logs')
          .insert({
            user_id: this.deviceInfo.user_id,
            device_id: this.deviceInfo.id,
            entity_type: entityType as any,
            entity_id: entityId,
            operation: operation,
            sync_status: 'in_progress',
            data_after: data
          });

        if (error) {
          console.error('Failed to sync data:', error);
          this.addOfflineOperation(`update_${entityType}` as any, data);
        }
      } catch (error) {
        console.error('Error syncing data:', error);
        this.addOfflineOperation(`update_${entityType}` as any, data);
      }
    } else {
      // Queue for offline sync
      this.addOfflineOperation(`update_${entityType}` as any, data);
    }
  }

  /**
   * Queue cross-platform notification
   */
  public async queueNotification(
    title: string,
    message: string,
    type: CrossPlatformNotification['type'],
    options: {
      priority?: number;
      data?: Record<string, any>;
      targetDevices?: string[];
      excludeDevices?: string[];
      scheduledAt?: Date;
    } = {}
  ): Promise<string | null> {
    if (!this.deviceInfo) return null;

    try {
      const { data, error } = await supabase.rpc('queue_cross_platform_notification', {
        p_user_id: this.deviceInfo.user_id,
        p_title: title,
        p_message: message,
        p_type: type,
        p_priority: options.priority || 0,
        p_data: options.data || {},
        p_target_devices: options.targetDevices || [],
        p_exclude_devices: options.excludeDevices || [],
        p_scheduled_at: options.scheduledAt?.toISOString()
      });

      if (error) {
        console.error('Failed to queue notification:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error queuing notification:', error);
      return null;
    }
  }

  /**
   * Create user preferences backup
   */
  public async createBackup(backupVersion?: string): Promise<string | null> {
    if (!this.deviceInfo) return null;

    try {
      const version = backupVersion || `backup_${Date.now()}`;

      const { data, error } = await supabase.rpc('create_preferences_backup', {
        p_user_id: this.deviceInfo.user_id,
        p_backup_version: version,
        p_device_source: this.deviceInfo.device_id
      });

      if (error) {
        console.error('Failed to create backup:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating backup:', error);
      return null;
    }
  }

  /**
   * Restore user preferences from backup
   */
  public async restoreBackup(backupId: string): Promise<boolean> {
    if (!this.deviceInfo) return false;

    try {
      const { data, error } = await supabase.rpc('restore_preferences_backup', {
        p_user_id: this.deviceInfo.user_id,
        p_backup_id: backupId
      });

      if (error) {
        console.error('Failed to restore backup:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error restoring backup:', error);
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    // Unsubscribe from real-time channels
    this.realtimeChannels.forEach(channel => {
      supabase.removeChannel(channel);
    });
    this.realtimeChannels.clear();

    // Clear listeners
    window.removeEventListener('online', () => {});
    window.removeEventListener('offline', () => {});
  }

  // Placeholder methods for specific entity operations
  private async reapplyBookingChanges(conflict: SyncConflict): Promise<void> {
    // Implementation for reapplying booking changes
  }

  private async reapplyProfileChanges(conflict: SyncConflict): Promise<void> {
    // Implementation for reapplying profile changes
  }

  private async createBookingFromOffline(data: Record<string, any>): Promise<void> {
    // Implementation for creating booking from offline data
  }

  private async updateProfileFromOffline(data: Record<string, any>): Promise<void> {
    // Implementation for updating profile from offline data
  }

  private async cancelBookingFromOffline(data: Record<string, any>): Promise<void> {
    // Implementation for canceling booking from offline data
  }

  private async updatePreferencesFromOffline(data: Record<string, any>): Promise<void> {
    // Implementation for updating preferences from offline data
  }
}

/**
 * Conflict resolution strategies
 */
class ConflictResolver {
  /**
   * Resolve sync conflict based on entity type and data
   */
  async resolveConflict(syncLog: SyncLog): Promise<SyncConflict['resolutionStrategy']> {
    // Default conflict resolution strategies
    switch (syncLog.entity_type) {
      case 'booking':
        return this.resolveBookingConflict(syncLog);
      case 'profile':
        return this.resolveProfileConflict(syncLog);
      case 'preferences':
        return this.resolvePreferencesConflict(syncLog);
      default:
        return 'use_remote'; // Default to remote for unknown types
    }
  }

  private resolveBookingConflict(syncLog: SyncLog): SyncConflict['resolutionStrategy'] {
    // For bookings, prefer the most recent update
    if (syncLog.data_before && syncLog.data_after) {
      const localTime = new Date(syncLog.data_before.updated_at).getTime();
      const remoteTime = new Date(syncLog.data_after.updated_at).getTime();

      return remoteTime > localTime ? 'use_remote' : 'use_local';
    }

    return 'use_remote';
  }

  private resolveProfileConflict(syncLog: SyncLog): SyncConflict['resolutionStrategy'] {
    // For profiles, try to merge if possible
    return 'merge';
  }

  private resolvePreferencesConflict(syncLog: SyncLog): SyncConflict['resolutionStrategy'] {
    // For preferences, merge is usually safe
    return 'merge';
  }

  /**
   * Merge two data objects
   */
  mergeData(localData: Record<string, any>, remoteData: Record<string, any>): Record<string, any> {
    const merged = { ...localData };

    for (const [key, value] of Object.entries(remoteData)) {
      if (key in merged) {
        // If both have the key, prefer the one with the most recent timestamp
        if (this.hasTimestamp(value) && this.hasTimestamp(merged[key])) {
          const remoteTime = new Date(value.updated_at).getTime();
          const localTime = new Date(merged[key].updated_at).getTime();

          if (remoteTime > localTime) {
            merged[key] = value;
          }
        } else {
          // No timestamp, prefer remote
          merged[key] = value;
        }
      } else {
        // Key only exists in remote
        merged[key] = value;
      }
    }

    return merged;
  }

  private hasTimestamp(obj: any): boolean {
    return obj && typeof obj === 'object' && 'updated_at' in obj;
  }
}

// Export singleton instance
export const crossPlatformSyncService = new CrossPlatformSyncService();

// Export types for use in components
export type { CrossPlatformSyncService };