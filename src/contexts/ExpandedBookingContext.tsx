import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

import { useToast } from '@/components/ui/use-toast aria-live="polite" aria-atomic="true"';
import { logger } from '@/lib/logger';

// Types for booking state
interface BookingStep1Data {
  serviceId: string;
  serviceType: 'beauty' | 'fitness';
  durationMinutes: number;
  locationId: string;
  selectedAddOns: string[];
}

interface BookingStep2Data {
  date: string;
  time: string;
  slotId?: string;
}

interface BookingStep3Data {
  fullName: string;
  email: string;
  phone: string;
  notes?: string;
  consent: boolean;
  marketingConsent: boolean;
}

interface BookingStep4Data {
  paymentMethod: 'card' | 'cash';
  stripePaymentIntentId?: string;
}

interface BookingState {
  currentStep: number;
  step1Data: BookingStep1Data | null;
  step2Data: BookingStep2Data | null;
  step3Data: BookingStep3Data | null;
  step4Data: BookingStep4Data | null;
  isComplete: boolean;
  bookingId?: string;
  errors: Record<string, string>;
  isLoading: boolean;
}

type BookingAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_STEP1_DATA'; payload: BookingStep1Data }
  | { type: 'SET_STEP2_DATA'; payload: BookingStep2Data }
  | { type: 'SET_STEP3_DATA'; payload: BookingStep3Data }
  | { type: 'SET_STEP4_DATA'; payload: BookingStep4Data }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: { field: string; message: string } }
  | { type: 'CLEAR_ERROR'; payload: string }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'COMPLETE_BOOKING'; payload: { bookingId: string } }
  | { type: 'RESET_BOOKING' };

const initialState: BookingState = {
  currentStep: 1,
  step1Data: null,
  step2Data: null,
  step3Data: null,
  step4Data: null,
  isComplete: false,
  errors: {},
  isLoading: false,
};

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };

    case 'SET_STEP1_DATA':
      return {
        ...state,
        step1Data: action.payload,
        errors: { ...state.errors, step1: '' }
      };

    case 'SET_STEP2_DATA':
      return {
        ...state,
        step2Data: action.payload,
        errors: { ...state.errors, step2: '' }
      };

    case 'SET_STEP3_DATA':
      return {
        ...state,
        step3Data: action.payload,
        errors: { ...state.errors, step3: '' }
      };

    case 'SET_STEP4_DATA':
      return {
        ...state,
        step4Data: action.payload,
        errors: { ...state.errors, step4: '' }
      };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.payload.field]: action.payload.message }
      };

    case 'CLEAR_ERROR':
      const newErrors = { ...state.errors };
      delete newErrors[action.payload];
      return { ...state, errors: newErrors };

    case 'CLEAR_ERRORS':
      return { ...state, errors: {} };

    case 'COMPLETE_BOOKING':
      return {
        ...state,
        isComplete: true,
        bookingId: action.payload.bookingId,
        currentStep: 5
      };

    case 'RESET_BOOKING':
      return initialState;

    default:
      return state;
  }
}

// Storage keys
const STORAGE_KEY = 'booking_draft';

// Helper functions for localStorage
const saveToStorage = (state: BookingState) => {
  try {
    const dataToSave = {
      ...state,
      // Don't save loading state or errors
      isLoading: false,
      errors: {},
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    logger.error('Failed to save booking state:', error);
  }
};

const loadFromStorage = (): Partial<BookingState> | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved);
    // Check if saved data is recent (within 24 hours)
    const savedTime = parsed.savedAt;
    if (savedTime && Date.now() - savedTime > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch (error) {
    logger.error('Failed to load booking state:', error);
    return null;
  }
};

const clearStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    logger.error('Failed to clear booking state:', error);
  }
};

// Context
const ExpandedBookingContext = createContext<{
  state: BookingState;
  dispatch: React.Dispatch<BookingAction>;
  actions: {
    nextStep: () => void;
    previousStep: () => void;
    goToStep: (step: number) => void;
    updateStep1: (data: BookingStep1Data) => void;
    updateStep2: (data: BookingStep2Data) => void;
    updateStep3: (data: BookingStep3Data) => void;
    updateStep4: (data: BookingStep4Data) => void;
    setError: (field: string, message: string) => void;
    clearError: (field: string) => void;
    clearAllErrors: () => void;
    resetBooking: () => void;
    isStepValid: (step: number) => boolean;
    canProceed: () => boolean;
    getBookingSummary: () => any;
    saveProgress: () => void;
    loadProgress: () => void;
  };
} | null>(null);

// Provider
interface ExpandedBookingProviderProps {
  children: ReactNode;
  autoSave?: boolean;
}

export const ExpandedBookingProvider: React.FC<ExpandedBookingProviderProps> = ({
  children,
  autoSave = true
}) => {
  const [state, dispatch] = useReducer(bookingReducer, initialState);
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  // Load saved progress on mount
  useEffect(() => {
    const saved = loadFromStorage();
    if (saved) {
      // Restore saved state
      Object.entries(saved).forEach(([key, value]) => {
        if (key !== 'isLoading' && key !== 'errors') {
          dispatch({ type: 'SET_' + key.toUpperCase(), payload: value } as any);
        }
      });

      if (saved.savedAt) {
        toast aria-live="polite" aria-atomic="true"({
          title: 'Booking progress restored',
          description: 'Your previous booking progress has been restored.',
        });
      }
    }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    if (autoSave && !state.isComplete) {
      const dataToSave = {
        ...state,
        savedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }
  }, [state, autoSave, state.isComplete]);

  // Clear storage when booking is complete
  useEffect(() => {
    if (state.isComplete) {
      clearStorage();
    }
  }, [state.isComplete]);

  // Actions
  const nextStep = () => {
    if (state.currentStep < 5) {
      dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
    }
  };

  const previousStep = () => {
    if (state.currentStep > 1) {
      dispatch({ type: 'SET_STEP', payload: state.currentStep - 1 });
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= 5) {
      dispatch({ type: 'SET_STEP', payload: step });
    }
  };

  const updateStep1 = (data: BookingStep1Data) => {
    dispatch({ type: 'SET_STEP1_DATA', payload: data });
  };

  const updateStep2 = (data: BookingStep2Data) => {
    dispatch({ type: 'SET_STEP2_DATA', payload: data });
  };

  const updateStep3 = (data: BookingStep3Data) => {
    dispatch({ type: 'SET_STEP3_DATA', payload: data });
  };

  const updateStep4 = (data: BookingStep4Data) => {
    dispatch({ type: 'SET_STEP4_DATA', payload: data });
  };

  const setError = (field: string, message: string) => {
    dispatch({ type: 'SET_ERROR', payload: { field, message } });
  };

  const clearError = (field: string) => {
    dispatch({ type: 'CLEAR_ERROR', payload: field });
  };

  const clearAllErrors = () => {
    dispatch({ type: 'CLEAR_ERRORS' });
  };

  const resetBooking = () => {
    dispatch({ type: 'RESET_BOOKING' });
    clearStorage();
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!state.step1Data && !state.errors.step1;
      case 2:
        return !!state.step2Data && !state.errors.step2;
      case 3:
        return !!state.step3Data && !state.errors.step3;
      case 4:
        return !!state.step4Data && !state.errors.step4;
      default:
        return true;
    }
  };

  const canProceed = (): boolean => {
    return isStepValid(state.currentStep);
  };

  const getBookingSummary = () => {
    if (!state.step1Data || !state.step2Data || !state.step3Data) {
      return null;
    }

    return {
      service: state.step1Data,
      datetime: {
        date: state.step2Data.date,
        time: state.step2Data.time,
      },
      client: state.step3Data,
      payment: state.step4Data,
    };
  };

  const saveProgress = () => {
    saveToStorage(state);
    toast aria-live="polite" aria-atomic="true"({
      title: 'Progress saved',
      description: 'Your booking progress has been saved.',
    });
  };

  const loadProgress = () => {
    const saved = loadFromStorage();
    if (saved) {
      Object.entries(saved).forEach(([key, value]) => {
        if (key !== 'isLoading' && key !== 'errors') {
          dispatch({ type: 'SET_' + key.toUpperCase(), payload: value } as any);
        }
      });
    }
  };

  const value = {
    state,
    dispatch,
    actions: {
      nextStep,
      previousStep,
      goToStep,
      updateStep1,
      updateStep2,
      updateStep3,
      updateStep4,
      setError,
      clearError,
      clearAllErrors,
      resetBooking,
      isStepValid,
      canProceed,
      getBookingSummary,
      saveProgress,
      loadProgress,
    },
  };

  return (
    <ExpandedBookingContext.Provider value={value}>
      {children}
    </ExpandedBookingContext.Provider>
  );
};

// Hook
export const useExpandedBooking = () => {
  const context = useContext(ExpandedBookingContext);
  if (!context) {
    throw new Error('useExpandedBooking must be used within an ExpandedBookingProvider');
  }
  return context;
};