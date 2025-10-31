import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCrossPlatform } from '@/contexts/CrossPlatformContext';
import { crossPlatformSyncService, CrossPlatformNotification } from '@/services/cross-platform-sync.service';
import { Bell, X, Settings, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationToast extends CrossPlatformNotification {
  id: string;
  read: boolean;
  createdAt: Date;
}

interface NotificationManagerProps {
  className?: string;
  maxVisible?: number;
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({
  className,
  maxVisible = 5,
  duration = 5000,
  position = 'top-right'
}) => {
  const {
    currentDevice,
    crossPlatformPreferences,
    updatePreferences,
    enableNotifications,
    disableNotifications
  } = useCrossPlatform();

  const [notification aria-live="polite" aria-atomic="true"s, setNotifications] = useState<NotificationToast[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Check notification aria-live="polite" aria-atomic="true" permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  // Listen for cross-platform notification aria-live="polite" aria-atomic="true"s
  useEffect(() => {
    const handleIncomingNotification = (event: CustomEvent) => {
      const notification aria-live="polite" aria-atomic="true" = event.detail as CrossPlatformNotification;

      // Check if notification aria-live="polite" aria-atomic="true"s are enabled and within quiet hours
      if (shouldShowNotification(notification)) {
        addNotification(notification);
      }
    };

    window.addEventListener('crossPlatformNotification', handleIncomingNotification as EventListener);

    return () => {
      window.removeEventListener('crossPlatformNotification', handleIncomingNotification as EventListener);
      // Clear all timeouts
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    };
  }, [crossPlatformPreferences]);

  const shouldShowNotification = (notification: CrossPlatformNotification): boolean => {
    // Check if notification aria-live="polite" aria-atomic="true"s are enabled
    if (!crossPlatformPreferences.enableNotifications) {
      return false;
    }

    // Check quiet hours
    if (crossPlatformPreferences.quietHours.enabled) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [startHour, startMin] = crossPlatformPreferences.quietHours.start.split(':').map(Number);
      const [endHour, endMin] = crossPlatformPreferences.quietHours.end.split(':').map(Number);

      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;

      if (startTime <= endTime) {
        // Same day range (e.g., 22:00 to 08:00)
        if (currentTime >= startTime || currentTime <= endTime) {
          return false;
        }
      } else {
        // Cross midnight range (e.g., 22:00 to 08:00 next day)
        if (currentTime >= startTime || currentTime <= endTime) {
          return false;
        }
      }
    }

    return true;
  };

  const addNotification = useCallback((notification: CrossPlatformNotification) => {
    const toast: NotificationToast = {
      ...notification aria-live="polite" aria-atomic="true",
      id: `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      read: false,
      createdAt: new Date()
    };

    setNotifications(prev => {
      const updated = [toast, ...prev].slice(0, maxVisible);
      return updated;
    });

    // Auto-remove after duration
    const timeout = setTimeout(() => {
      removeNotification(toast.id);
    }, duration);

    timeoutRefs.current.set(toast.id, timeout);

    // Show native notification aria-live="polite" aria-atomic="true" if supported and permitted
    if (permissionStatus === 'granted') {
      showNativeNotification(notification);
    }
  }, [maxVisible, duration, permissionStatus]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));

    // Clear timeout if exists
    const timeout = timeoutRefs.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(id);
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current.clear();
  }, []);

  const showNativeNotification = (notification: CrossPlatformNotification) => {
    if ('Notification' in window && permissionStatus === 'granted') {
      const nativeNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        badge: '/favicon.ico',
        requireInteraction: notification.priority >= 7,
        actions: notification.type === 'booking_reminder' ? [
          { action: 'confirm', title: 'Confirm' },
          { action: 'reschedule', title: 'Reschedule' }
        ] : undefined
      });

      nativeNotification.onclick = () => {
        // Handle notification aria-live="polite" aria-atomic="true" click
        window.focus();
        nativeNotification.close();

        // Mark as read in our system
        const toast = notifications.find(n => n.id === notification.id);
        if (toast) {
          markAsRead(toast.id);
        }
      };

      // Auto-close after 10 seconds
      setTimeout(() => {
        nativeNotification.close();
      }, 10000);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission === 'granted') {
        enableNotifications();
      } else {
        disableNotifications();
      }

      return permission;
    }
    return 'denied';
  };

  const getNotificationIcon = (type: CrossPlatformNotification['type']) => {
    switch (type) {
      case 'booking_reminder':
        return <Bell className="h-5 w-5 text-blue-500" />;
      case 'booking_confirmation':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'payment_received':
        return <Check className="h-5 w-5 text-emerald-500" />;
      case 'promotion':
        return <Bell className="h-5 w-5 text-purple-500" />;
      case 'system_update':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: CrossPlatformNotification['type']) => {
    switch (type) {
      case 'booking_reminder':
        return 'border-blue-200 bg-blue-50';
      case 'booking_confirmation':
        return 'border-green-200 bg-green-50';
      case 'payment_received':
        return 'border-emerald-200 bg-emerald-50';
      case 'promotion':
        return 'border-purple-200 bg-purple-50';
      case 'system_update':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
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

  return (
    <>
      {/* Notification Container */}
      <div className={cn('fixed z-50 space-y-2', getPositionClasses(), className)}>
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              'relative w-80 rounded-lg border shadow-lg backdrop-blur-sm transition-all duration-300 transform',
              getNotificationColor(notification.type),
              notification.read ? 'opacity-75' : 'opacity-100'
            )}
            onMouseEnter={() => markAsRead(notification.id)}
          >
            {/* Close Button */}
            <button
              onClick={() => removeNotification(notification.id)}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 transition-colors"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>

            {/* Notification Content */}
            <div className="p-4 pr-10">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {notification.title}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.message}
                  </p>

                  {/* Timestamp */}
                  <p className="text-xs text-gray-500 mt-2">
                    {notification.createdAt.toLocaleTimeString()}
                  </p>

                  {/* Priority Indicator */}
                  {notification.priority >= 7 && (
                    <div className="flex items-center gap-1 mt-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-xs text-red-600">High Priority</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {notification.type === 'booking_reminder' && !notification.read && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      // Handle confirm action
                      removeNotification(notification.id);
                    }}
                    className="flex-1 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => {
                      // Handle reschedule action
                      removeNotification(notification.id);
                    }}
                    className="flex-1 px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors"
                  >
                    Reschedule
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Notification Settings Button */}
      <div className={cn('fixed z-40', getPositionClasses())}>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={cn(
            'p-2 rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors',
            position.includes('top') ? 'mt-16' : 'mb-16',
            position.includes('right') ? 'mr-0' : 'ml-0'
          )}
        >
          <Bell className="h-5 w-5 text-gray-600" />
          {notifications.length > 0 && !notifications.every(n => n.read) && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {notifications.filter(n => !n.read).length}
            </span>
          )}
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className={cn('fixed z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4', getPositionClasses())}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Notification Settings</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Permission Status */}
          <div className="space-y-4">
            {permissionStatus === 'default' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Enable browser notification aria-live="polite" aria-atomic="true"s to receive updates even when the tab is not active.
                </p>
                <button
                  onClick={requestNotificationPermission}
                  className="mt-2 w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                >
                  Enable Notifications
                </button>
              </div>
            )}

            {permissionStatus === 'denied' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  Browser notification aria-live="polite" aria-atomic="true"s are blocked. Please enable them in your browser settings.
                </p>
              </div>
            )}

            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Enable Notifications</span>
              <button
                onClick={() => {
                  if (crossPlatformPreferences.enableNotifications) {
                    disableNotifications();
                  } else {
                    enableNotifications();
                  }
                }}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  crossPlatformPreferences.enableNotifications ? 'bg-blue-600' : 'bg-gray-200'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    crossPlatformPreferences.enableNotifications ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            {/* Quiet Hours */}
            <div>
              <label className="flex items-center justify-between">
                <span className="text-sm font-medium">Quiet Hours</span>
                <input
                  type="checkbox"
                  checked={crossPlatformPreferences.quietHours.enabled}
                  onChange={(e) => updatePreferences({
                    quietHours: {
                      ...crossPlatformPreferences.quietHours,
                      enabled: e.target.checked
                    }
                  })}
                  className="rounded border-gray-300"
                />
              </label>

              {crossPlatformPreferences.quietHours.enabled && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="time"
                    value={crossPlatformPreferences.quietHours.start}
                    onChange={(e) => updatePreferences({
                      quietHours: {
                        ...crossPlatformPreferences.quietHours,
                        start: e.target.value
                      }
                    })}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-500 self-center">to</span>
                  <input
                    type="time"
                    value={crossPlatformPreferences.quietHours.end}
                    onChange={(e) => updatePreferences({
                      quietHours: {
                        ...crossPlatformPreferences.quietHours,
                        end: e.target.value
                      }
                    })}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
              )}
            </div>

            {/* Clear All Button */}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
              >
                Clear All Notifications
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationManager;