import React, { useState, useEffect } from 'react';
import {
  CrossPlatformProvider,
  OptimisticUpdateProvider,
  useCrossPlatform,
  useOptimisticUpdate,
  SyncStatusIndicator
} from '@/components/cross-platform';
import {
  NotificationManager,
  BackupManager,
  ConflictResolutionDialog,
  UnifiedBookingFlow
} from '@/components/cross-platform';
import {
  crossPlatformSyncService,
  crossPlatformAnalyticsService
} from '@/services';

/**
 * Complete example of cross-platform integration
 * This demonstrates all major features working together
 */
export const CrossPlatformExample: React.FC = () => {
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [showBackupManager, setShowBackupManager] = useState(false);
  const [syncLogs, setSyncLogs] = useState([]);

  return (
    <CrossPlatformProvider>
      <OptimisticUpdateProvider>
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
          {/* Sync Status Indicator */}
          <SyncStatusIndicator showDetails={true} position="top-right" />

          {/* Notification Manager */}
          <NotificationManager />

          {/* Main Content */}
          <div className="container mx-auto px-4 py-8">
            <Header />
            <DemoControls
              onShowBookingFlow={() => setShowBookingFlow(true)}
              onShowBackupManager={() => setShowBackupManager(true)}
              onRefreshLogs={refreshSyncLogs}
            />
            <DeviceInfo />
            <SyncStatusDisplay />
            <SyncLogs logs={syncLogs} />
          </div>

          {/* Modal Overlays */}
          {showBookingFlow && (
            <UnifiedBookingFlow
              initialStep="choose"
              onBookingComplete={(bookingId) => {
                console.log('Booking completed:', bookingId);
                setShowBookingFlow(false);
                showSuccessNotification('Booking completed successfully!');
              }}
              onStepChange={(step) => {
                console.log('Step changed to:', step);
              }}
            />
          )}

          {showBackupManager && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold">Backup & Restore</h2>
                  <button
                    onClick={() => setShowBackupManager(false)}
                    className="mt-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Close
                  </button>
                </div>
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
                  <BackupManager showAdvanced={true} />
                </div>
              </div>
            </div>
          )}

          {/* Global Conflict Resolution */}
          <ConflictResolver />
        </div>
      </OptimisticUpdateProvider>
    </CrossPlatformProvider>
  );
};

// Header Component
const Header: React.FC = () => {
  const { currentDevice, isOnline } = useCrossPlatform();

  return (
    <div className="text-center mb-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">
        Cross-Platform Beauty Booking
      </h1>
      <p className="text-lg text-gray-600">
        Seamless synchronization across all your devices
      </p>
      <div className="flex items-center justify-center gap-4 mt-4">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
          isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isOnline ? 'bg-green-500' : 'bg-red-500'
          }`} />
          {isOnline ? 'Online' : 'Offline'}
        </div>
        {currentDevice && (
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
            <span className="capitalize">{currentDevice.platform}</span>
            {currentDevice.is_primary && <span className="text-xs">(Primary)</span>}
          </div>
        )}
      </div>
    </div>
  );
};

// Demo Controls Component
const DemoControls: React.FC<{
  onShowBookingFlow: () => void;
  onShowBackupManager: () => void;
  onRefreshLogs: () => void;
}> = ({ onShowBookingFlow, onShowBackupManager, onRefreshLogs }) => {
  const { syncStatus, createBackup, queueNotification } = useCrossPlatform();

  const handleCreateBackup = async () => {
    const backupId = await createBackup();
    if (backupId) {
      showSuccessNotification('Backup created successfully!');
    } else {
      showErrorNotification('Failed to create backup');
    }
  };

  const handleTestNotification = async () => {
    await queueNotification(
      'Test Notification',
      'This is a test cross-platform notification aria-live="polite" aria-atomic="true"',
      'system_update',
      {
        priority: 5,
        data: { test: true, timestamp: Date.now() }
      }
    );
  };

  const handleTriggerConflict = async () => {
    // Simulate a conflict by creating conflicting data
    await crossPlatformSyncService.syncData(
      'booking',
      'test_booking_conflict',
      {
        status: 'confirmed',
        updated_at: new Date().toISOString(),
        conflict_data: true
      },
      'update'
    );

    // Create another conflicting update
    setTimeout(async () => {
      await crossPlatformSyncService.syncData(
        'booking',
        'test_booking_conflict',
        {
          status: 'pending',
          updated_at: new Date(Date.now() + 1000).toISOString(),
          conflict_data: true
        },
        'update'
      );
    }, 100);

    showInfoNotification('Conflict test initiated - check for conflict dialog');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Demo Controls</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={onShowBookingFlow}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start Booking
        </button>
        <button
          onClick={onShowBackupManager}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Backup Manager
        </button>
        <button
          onClick={handleCreateBackup}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Create Backup
        </button>
        <button
          onClick={handleTestNotification}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          Test Notification
        </button>
        <button
          onClick={handleTriggerConflict}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Test Conflict
        </button>
        <button
          onClick={onRefreshLogs}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Refresh Logs
        </button>
        <button
          onClick={() => {
            crossPlatformAnalyticsService.trackEvent('user_action', 'demo_button_clicked', {
              button: 'analytics_test',
              timestamp: Date.now()
            });
            showInfoNotification('Analytics event tracked');
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Track Event
        </button>
        <button
          onClick={() => {
            crossPlatformAnalyticsService.startJourney('demo_journey');
            setTimeout(() => {
              crossPlatformAnalyticsService.addJourneyStep('step_1', { data: 'test' });
              setTimeout(() => {
                crossPlatformAnalyticsService.completeJourney('demo_journey', { value: 100 });
                showSuccessNotification('Demo journey completed');
              }, 1000);
            }, 500);
            showInfoNotification('Demo journey started');
          }}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          Test Journey
        </button>
      </div>

      {syncStatus && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Sync Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Online:</span>
              <span className={`ml-2 font-medium ${syncStatus.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {syncStatus.isOnline ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Pending:</span>
              <span className="ml-2 font-medium">{syncStatus.pendingOperations}</span>
            </div>
            <div>
              <span className="text-gray-600">Conflicts:</span>
              <span className="ml-2 font-medium">{syncStatus.conflicts.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Last Sync:</span>
              <span className="ml-2 font-medium">
                {new Date(syncStatus.lastSyncAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Device Info Component
const DeviceInfo: React.FC = () => {
  const { currentDevice, userDevices, isNativeApp } = useCrossPlatform();

  if (!currentDevice) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Device Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium mb-2">Current Device</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Platform:</span>
              <span className="capitalize font-medium">{currentDevice.platform}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Device Name:</span>
              <span className="font-medium">{currentDevice.device_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">App Version:</span>
              <span className="font-medium">{currentDevice.app_version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">OS Version:</span>
              <span className="font-medium">{currentDevice.os_version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Primary Device:</span>
              <span className={`font-medium ${currentDevice.is_primary ? 'text-green-600' : 'text-gray-500'}`}>
                {currentDevice.is_primary ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Seen:</span>
              <span className="font-medium">
                {new Date(currentDevice.last_seen_at).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Native App:</span>
              <span className={`font-medium ${isNativeApp() ? 'text-green-600' : 'text-blue-600'}`}>
                {isNativeApp() ? 'Yes' : 'No (Web/PWA)'}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">All Devices ({userDevices.length})</h3>
          <div className="space-y-2">
            {userDevices.map((device) => (
              <div
                key={device.id}
                className={`p-3 rounded-lg border ${
                  device.id === currentDevice.id
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      device.is_active ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <span className="font-medium capitalize">{device.platform}</span>
                    {device.is_primary && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        Primary
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(device.last_seen_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {device.device_name} • {device.app_version}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Sync Status Display Component
const SyncStatusDisplay: React.FC = () => {
  const { syncStatus, getPendingUpdates } = useOptimisticUpdate();
  const pendingUpdates = getPendingUpdates();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Sync Activity</h2>

      {pendingUpdates.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-medium text-yellow-800 mb-2">Pending Updates</h3>
          <div className="space-y-2">
            {pendingUpdates.map((update) => (
              <div key={update.id} className="text-sm text-yellow-700">
                <div className="flex items-center justify-between">
                  <span className="capitalize">
                    {update.entityType} - {update.type}
                  </span>
                  <span className={`text-xs ${
                    update.isPending ? 'text-yellow-600' :
                    update.error ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {update.isPending ? 'Pending...' :
                     update.error ? 'Failed' : 'Completed'}
                  </span>
                </div>
                {update.error && (
                  <div className="text-xs text-red-600 mt-1">
                    Error: {update.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            {syncStatus?.isOnline ? '✓' : '✗'}
          </div>
          <div className="text-sm text-gray-600">Connection</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            {syncStatus?.pendingOperations || 0}
          </div>
          <div className="text-sm text-gray-600">Pending Operations</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            {syncStatus?.conflicts.length || 0}
          </div>
          <div className="text-sm text-gray-600">Active Conflicts</div>
        </div>
      </div>
    </div>
  );
};

// Sync Logs Component
const SyncLogs: React.FC<{ logs: any[] }> = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Sync Activity</h2>
        <p className="text-gray-500 text-center py-8">No recent sync activity</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Recent Sync Activity</h2>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {logs.map((log, index) => (
          <div key={index} className="p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  log.status === 'completed' ? 'bg-green-500' :
                  log.status === 'failed' ? 'bg-red-500' :
                  log.status === 'in_progress' ? 'bg-yellow-500' :
                  'bg-gray-500'
                }`} />
                <span className="font-medium capitalize">{log.entityType}</span>
                <span className="text-gray-500">•</span>
                <span className="text-sm capitalize">{log.operation}</span>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
            {log.entityId && (
              <div className="text-xs text-gray-600 mt-1">
                ID: {log.entityId}
              </div>
            )}
            {log.error && (
              <div className="text-xs text-red-600 mt-1">
                Error: {log.error}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Conflict Resolver Component
const ConflictResolver: React.FC = () => {
  const [conflict, setConflict] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const handleConflict = (event: CustomEvent) => {
      setConflict(event.detail);
      setShowDialog(true);
    };

    window.addEventListener('syncConflictResolution', handleConflict as EventListener);
    return () => window.removeEventListener('syncConflictResolution', handleConflict as EventListener);
  }, []);

  return (
    <ConflictResolutionDialog
      isOpen={showDialog}
      conflict={conflict}
      onResolve={(resolution) => {
        console.log('Conflict resolved:', resolution);
        setShowDialog(false);
        setConflict(null);
        showSuccessNotification('Conflict resolved successfully!');
      }}
      onCancel={() => {
        setShowDialog(false);
        setConflict(null);
      }}
    />
  );
};

// Notification helper functions
const showSuccessNotification = (message: string) => {
  // This would integrate with your notification aria-live="polite" aria-atomic="true" system
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Success', {
      body: message,
      icon: '/favicon.ico'
    });
  }
  console.log('✓', message);
};

const showErrorNotification = (message: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Error', {
      body: message,
      icon: '/favicon.ico'
    });
  }
  console.error('✗', message);
};

const showInfoNotification = (message: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Info', {
      body: message,
      icon: '/favicon.ico'
    });
  }
  console.info('ℹ', message);
};

// Helper function to refresh sync logs
const refreshSyncLogs = async () => {
  // This would fetch recent sync logs from your API
  console.log('Refreshing sync logs...');
};

export default CrossPlatformExample;