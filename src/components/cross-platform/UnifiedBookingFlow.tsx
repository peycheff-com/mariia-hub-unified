import React, { useState, useEffect, useCallback } from 'react';
import { CrossPlatformProvider, useCrossPlatform } from '@/contexts/CrossPlatformContext';
import { OptimisticUpdateProvider, useOptimisticUpdate } from '@/components/cross-platform/OptimisticUpdateProvider';
import { SyncStatusIndicator } from '@/components/cross-platform/SyncStatusIndicator';
import { CrossPlatformNotification } from '@/components/cross-platform/NotificationManager';
import { ConflictResolutionDialog } from '@/components/cross-platform/ConflictResolutionDialog';
import { BookingStep } from '@/types/booking';

// Import existing booking components
import { Step1Choose } from '@/components/booking/Step1Choose';
import { Step2TimeWithCapacity as Step2Time } from '@/components/booking/Step2TimeWithCapacity';
import { Step3Details } from '@/components/booking/Step3Details';
import { Step4Payment } from '@/components/booking/Step4Payment';

interface UnifiedBookingFlowProps {
  initialStep?: BookingStep;
  sessionId?: string;
  onBookingComplete?: (bookingId: string) => void;
  onStepChange?: (step: BookingStep) => void;
}

const UnifiedBookingFlowContent: React.FC<UnifiedBookingFlowProps> = ({
  initialStep = 'choose',
  sessionId,
  onBookingComplete,
  onStepChange
}) => {
  const {
    currentDevice,
    syncStatus,
    isOnline,
    activeSessionId,
    isPrimaryDevice,
    createSession,
    joinSession,
    queueNotification
  } = useCrossPlatform();

  const { addOptimisticUpdate, getPendingUpdates } = useOptimisticUpdate();

  const [currentStep, setCurrentStep] = useState<BookingStep>(initialStep);
  const [bookingData, setBookingData] = useState<any>({});
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [activeConflict, setActiveConflict] = useState<any>(null);

  // Initialize session
  useEffect(() => {
    if (sessionId) {
      joinSession(sessionId);
    } else if (!activeSessionId && isPrimaryDevice) {
      const newSessionId = createSession();
      console.log('Created new booking session:', newSessionId);
    }
  }, [sessionId, activeSessionId, isPrimaryDevice, createSession, joinSession]);

  // Handle cross-platform events
  useEffect(() => {
    const handleStateUpdate = (event: CustomEvent) => {
      const { entityId, data } = event.detail;

      // Update local booking state if this is booking-related
      if (entityId.startsWith('booking_')) {
        setBookingData(prev => ({ ...prev, ...data }));
      }
    };

    const handleSyncConflict = (event: CustomEvent) => {
      setActiveConflict(event.detail);
      setShowConflictDialog(true);
    };

    window.addEventListener('stateUpdate', handleStateUpdate as EventListener);
    window.addEventListener('syncConflictResolution', handleSyncConflict as EventListener);

    return () => {
      window.removeEventListener('stateUpdate', handleStateUpdate as EventListener);
      window.removeEventListener('syncConflictResolution', handleSyncConflict as EventListener);
    };
  }, []);

  // Sync booking data across devices
  const syncBookingData = useCallback((step: BookingStep, data: any) => {
    const bookingId = bookingData.id || `temp_${Date.now()}`;

    if (isOnline) {
      addOptimisticUpdate('update', 'booking', bookingId, {
        step,
        data,
        updated_at: new Date().toISOString(),
        device_id: currentDevice?.id
      });
    }

    // Emit state update event
    window.dispatchEvent(new CustomEvent('stateUpdate', {
      detail: {
        entityId: `booking_${bookingId}`,
        data: { step, ...data }
      }
    }));
  }, [isOnline, addOptimisticUpdate, bookingData.id, currentDevice?.id]);

  // Handle step changes with cross-platform sync
  const handleStepChange = useCallback((newStep: BookingStep, stepData: any = {}) => {
    const updatedData = { ...bookingData, ...stepData };
    setBookingData(updatedData);
    setCurrentStep(newStep);

    // Sync across devices
    syncBookingData(newStep, updatedData);

    // Notify parent component
    if (onStepChange) {
      onStepChange(newStep);
    }

    // Queue notification aria-live="polite" aria-atomic="true" for other devices if not primary device
    if (!isPrimaryDevice) {
      queueNotification(
        'Booking Progress Updated',
        `Step ${newStep} completed on another device`,
        'booking_confirmation',
        {
          data: { step: newStep, timestamp: new Date().toISOString() },
          priority: 5,
          targetDevices: [], // Send to all devices except current
          excludeDevices: [currentDevice?.id].filter(Boolean)
        }
      );
    }
  }, [bookingData, syncBookingData, onStepChange, isPrimaryDevice, queueNotification, currentDevice?.id]);

  // Handle booking completion
  const handleBookingComplete = useCallback(async (bookingId: string) => {
    // Final sync
    syncBookingData('complete', { id: bookingId, status: 'completed' });

    // Queue success notification aria-live="polite" aria-atomic="true"
    await queueNotification(
      'Booking Confirmed!',
      'Your appointment has been successfully booked.',
      'booking_confirmation',
      {
        data: { bookingId, timestamp: new Date().toISOString() },
        priority: 8
      }
    );

    // Notify parent component
    if (onBookingComplete) {
      onBookingComplete(bookingId);
    }
  }, [syncBookingData, queueNotification, onBookingComplete]);

  // Handle conflict resolution
  const handleConflictResolution = useCallback((resolution: any) => {
    // Apply resolution logic
    if (resolution.action === 'use_local') {
      // Re-apply local changes
      setBookingData(prev => ({ ...prev, ...resolution.data }));
    } else if (resolution.action === 'use_remote') {
      // Accept remote changes
      setBookingData(resolution.data);
    }

    setShowConflictDialog(false);
    setActiveConflict(null);
  }, []);

  // Get step component based on current step
  const renderStepComponent = () => {
    const commonProps = {
      onStepChange: handleStepChange,
      onBookingComplete: handleBookingComplete,
      initialData: bookingData,
      isOnline,
      syncStatus,
      deviceId: currentDevice?.id
    };

    switch (currentStep) {
      case 'choose':
        return <Step1Choose {...commonProps} />;
      case 'time':
        return <Step2Time {...commonProps} />;
      case 'details':
        return <Step3Details {...commonProps} />;
      case 'payment':
        return <Step4Payment {...commonProps} />;
      default:
        return <Step1Choose {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 relative">
      {/* Sync Status Indicator */}
      <SyncStatusIndicator
        showDetails={process.env.NODE_ENV === 'development'}
        position="top-right"
      />

      {/* Session Info */}
      {activeSessionId && (
        <div className="fixed top-4 left-4 z-40">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 px-3 py-2">
            <div className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-gray-600">
                {isPrimaryDevice ? 'Leading session' : 'Following session'}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">
                Step {currentStep}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Pending Operations Indicator */}
      {getPendingUpdates().length > 0 && (
        <div className="fixed bottom-4 left-4 z-40">
          <div className="bg-yellow-500 text-white rounded-lg shadow-lg px-3 py-2">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span>
                Syncing {getPendingUpdates().length} changes...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Booking Content */}
      <div className="relative z-10">
        {renderStepComponent()}
      </div>

      {/* Cross-Platform Notifications */}
      <CrossPlatformNotification />

      {/* Conflict Resolution Dialog */}
      <ConflictResolutionDialog
        isOpen={showConflictDialog}
        conflict={activeConflict}
        onResolve={handleConflictResolution}
        onCancel={() => {
          setShowConflictDialog(false);
          setActiveConflict(null);
        }}
      />

      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed bottom-0 left-0 right-0 bg-red-500 text-white text-center py-2 z-50">
          <p className="text-sm">
            You're offline. Changes will sync when you reconnect.
          </p>
        </div>
      )}
    </div>
  );
};

export const UnifiedBookingFlow: React.FC<UnifiedBookingFlowProps> = (props) => {
  return (
    <CrossPlatformProvider>
      <OptimisticUpdateProvider>
        <UnifiedBookingFlowContent {...props} />
      </OptimisticUpdateProvider>
    </CrossPlatformProvider>
  );
};

export default UnifiedBookingFlow;