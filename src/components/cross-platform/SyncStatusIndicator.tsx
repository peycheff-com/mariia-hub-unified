import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Sync, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { crossPlatformSyncService, SyncStatus } from '@/services/cross-platform-sync.service';
import { cn } from '@/lib/utils';

interface SyncStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  className,
  showDetails = false,
  position = 'top-right'
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Subscribe to sync status changes
    const unsubscribe = crossPlatformSyncService.onSyncStatusChange((status) => {
      setSyncStatus(status);
    });

    return () => {
      unsubscribe;
    };
  }, []);

  const getStatusIcon = () => {
    if (!syncStatus) return <Clock className="h-4 w-4" />;

    if (!syncStatus.isOnline) {
      return <WifiOff className="h-4 w-4 text-red-500" />;
    }

    if (syncStatus.pendingOperations > 0) {
      return <Sync className="h-4 w-4 text-yellow-500 animate-spin" />;
    }

    if (syncStatus.conflicts.length > 0) {
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    }

    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!syncStatus) return 'Initializing...';

    if (!syncStatus.isOnline) {
      return 'Offline';
    }

    if (syncStatus.pendingOperations > 0) {
      return `Syncing ${syncStatus.pendingOperations} items`;
    }

    if (syncStatus.conflicts.length > 0) {
      return `${syncStatus.conflicts.length} conflicts`;
    }

    return 'Synced';
  };

  const getStatusColor = () => {
    if (!syncStatus) return 'text-gray-500';

    if (!syncStatus.isOnline) {
      return 'text-red-500';
    }

    if (syncStatus.pendingOperations > 0) {
      return 'text-yellow-500';
    }

    if (syncStatus.conflicts.length > 0) {
      return 'text-orange-500';
    }

    return 'text-green-500';
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  if (!syncStatus || !showDetails) {
    return (
      <div
        className={cn(
          'fixed z-50 flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 cursor-pointer transition-all duration-200',
          getPositionClasses(),
          className
        )}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {getStatusIcon()}
        <span className={cn('text-xs font-medium', getStatusColor())}>
          {getStatusText()}
        </span>

        {showTooltip && (
          <div className="absolute top-full mt-2 right-0 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <span className={cn('text-xs', getStatusColor())}>{getStatusText()}</span>
              </div>

              {syncStatus.lastSyncAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Sync</span>
                  <span className="text-xs text-gray-500">
                    {new Date(syncStatus.lastSyncAt).toLocaleTimeString()}
                  </span>
                </div>
              )}

              {syncStatus.deviceInfo && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Device</span>
                  <span className="text-xs text-gray-500">
                    {syncStatus.deviceInfo.platform.toUpperCase()}
                  </span>
                </div>
              )}

              {syncStatus.pendingOperations > 0 && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-600">
                    {syncStatus.pendingOperations} operations pending
                  </div>
                </div>
              )}

              {syncStatus.conflicts.length > 0 && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs text-orange-600">
                    {syncStatus.conflicts.length} conflicts need resolution
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('fixed z-50', getPositionClasses(), className)}>
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        <div className="flex items-center gap-3 mb-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-sm font-semibold">Sync Status</h3>
            <p className={cn('text-xs', getStatusColor())}>{getStatusText()}</p>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Connection</span>
            <span className={syncStatus.isOnline ? 'text-green-600' : 'text-red-600'}>
              {syncStatus.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {syncStatus.lastSyncAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">Last Sync</span>
              <span className="text-gray-500">
                {new Date(syncStatus.lastSyncAt).toLocaleString()}
              </span>
            </div>
          )}

          {syncStatus.deviceInfo && (
            <div className="flex justify-between">
              <span className="text-gray-600">Device</span>
              <span className="text-gray-500">
                {syncStatus.deviceInfo.device_name} ({syncStatus.deviceInfo.platform.toUpperCase()})
              </span>
            </div>
          )}

          {syncStatus.pendingOperations > 0 && (
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending Operations</span>
                <span className="text-yellow-600 font-medium">
                  {syncStatus.pendingOperations}
                </span>
              </div>
            </div>
          )}

          {syncStatus.conflicts.length > 0 && (
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Conflicts</span>
                <span className="text-orange-600 font-medium">
                  {syncStatus.conflicts.length}
                </span>
              </div>
              <button
                onClick={() => {
                  // Handle conflict resolution
                  window.dispatchEvent(new CustomEvent('openConflictResolution'));
                }}
                className="mt-1 w-full px-2 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 transition-colors"
              >
                Resolve Conflicts
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SyncStatusIndicator;