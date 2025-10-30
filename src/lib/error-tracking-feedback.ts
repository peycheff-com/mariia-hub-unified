/**
 * Comprehensive Error Tracking and User Feedback System
 * for luxury beauty and fitness booking platform
 */

import { reportError, reportMessage, Sentry } from './sentry';
import { trackRUMEvent } from './rum';

// Error categories and severity levels
export enum ErrorCategory {
  BOOKING = 'booking',
  PAYMENT = 'payment',
  AUTHENTICATION = 'authentication',
  VALIDATION = 'validation',
  NETWORK = 'network',
  PERFORMANCE = 'performance',
  UI = 'ui',
  INTEGRATION = 'integration',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum UserFeedbackType {
  ERROR_REPORT = 'error_report',
  UX_ISSUE = 'ux_issue',
  FEATURE_REQUEST = 'feature_request',
  GENERAL_FEEDBACK = 'general_feedback',
  BOOKING_ISSUE = 'booking_issue',
  PAYMENT_PROBLEM = 'payment_problem'
}

// Error tracking configuration
interface ErrorTrackingConfig {
  enableAutomaticCapture: boolean;
  enableUserFeedback: boolean;
  maxErrorsPerSession: number;
  criticalErrorAlerts: boolean;
  bookingErrorRecovery: boolean;
  paymentErrorTracking: boolean;
  userFeedbackCollection: boolean;
  gdprCompliant: boolean;
}

const DEFAULT_CONFIG: ErrorTrackingConfig = {
  enableAutomaticCapture: true,
  enableUserFeedback: true,
  maxErrorsPerSession: 50,
  criticalErrorAlerts: true,
  bookingErrorRecovery: true,
  paymentErrorTracking: true,
  userFeedbackCollection: true,
  gdprCompliant: true
};

// Error data structure
interface ErrorData {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
  journeyId?: string;
  bookingStep?: string;
  context: Record<string, any>;
  recoverable: boolean;
  recoveryAttempted: boolean;
  recoverySuccessful?: boolean;
  userNotified: boolean;
  feedbackProvided: boolean;
}

// User feedback data structure
interface UserFeedback {
  id: string;
  type: UserFeedbackType;
  errorId?: string;
  rating: number; // 1-5 stars
  comment: string;
  email?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
  context: Record<string, any>;
  consentGiven: boolean;
}

// Error Tracking and Feedback Manager
export class ErrorTrackingFeedbackManager {
  private config: ErrorTrackingConfig;
  private errors: ErrorData[] = [];
  private feedback: UserFeedback[] = [];
  private errorCounts: Map<string, number> = new Map();
  private sessionStartTime: number;
  private sessionId: string;
  private isInitialized = false;
  private recoveryStrategies: Map<string, Function[]> = new Map();

  constructor(config: Partial<ErrorTrackingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionStartTime = Date.now();
    this.sessionId = this.generateSessionId();
  }

  // Initialize error tracking
  initialize(): void {
    if (this.isInitialized) return;

    try {
      if (this.config.enableAutomaticCapture) {
        this.initializeAutomaticErrorCapture();
      }

      if (this.config.enableUserFeedback) {
        this.initializeUserFeedbackCollection();
      }

      this.initializeErrorRecovery();
      this.initializePerformanceErrorTracking();
      this.initializeBookingFlowErrorTracking();
      this.initializePaymentErrorTracking();

      this.isInitialized = true;
      console.log('[Error Tracking] Error tracking and feedback system initialized');
    } catch (error) {
      console.warn('[Error Tracking] Failed to initialize:', error);
    }
  }

  // Initialize automatic error capture
  private initializeAutomaticErrorCapture(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.handleError({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        message: `Unhandled promise rejection: ${event.reason}`,
        error: event.reason
      });
    });

    // React error boundary integration
    if (typeof window !== 'undefined' && (window as any).__REACT_ERROR_BOUNDARY__) {
      (window as any).__REACT_ERROR_BOUNDARY__.setErrorHandler((error: Error, errorInfo: any) => {
        this.handleError({
          message: error.message,
          error: error,
          context: { ...errorInfo, componentStack: errorInfo.componentStack }
        });
      });
    }
  }

  // Initialize user feedback collection
  private initializeUserFeedbackCollection(): void {
    // Create feedback UI components
    this.createFeedbackUI();

    // Listen for custom feedback events
    window.addEventListener('user-feedback', (event: any) => {
      this.collectUserFeedback(event.detail);
    });

    // Auto-prompt for feedback after errors
    this.initializeFeedbackPrompts();
  }

  // Create feedback UI components
  private createFeedbackUI(): void {
    // Create feedback button
    const feedbackButton = document.createElement('button');
    feedbackButton.id = 'ux-feedback-button';
    feedbackButton.innerHTML = '💬 Feedback';
    feedbackButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      background: #8B4513;
      color: white;
      border: none;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      font-size: 20px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
    `;

    feedbackButton.addEventListener('click', () => {
      this.showFeedbackModal();
    });

    feedbackButton.addEventListener('mouseenter', () => {
      feedbackButton.style.transform = 'scale(1.1)';
    });

    feedbackButton.addEventListener('mouseleave', () => {
      feedbackButton.style.transform = 'scale(1)';
    });

    document.body.appendChild(feedbackButton);

    // Create feedback modal
    this.createFeedbackModal();
  }

  // Create feedback modal
  private createFeedbackModal(): void {
    const modal = document.createElement('div');
    modal.id = 'ux-feedback-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 10000;
      display: none;
      align-items: center;
      justify-content: center;
    `;

    modal.innerHTML = `
      <div style="background: white; padding: 30px; border-radius: 12px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
        <h2 style="margin: 0 0 20px 0; color: #8B4513;">Share Your Feedback</h2>
        <p style="margin: 0 0 20px 0; color: #666;">Help us improve your luxury booking experience</p>

        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold;">Feedback Type:</label>
          <select id="feedback-type" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
            <option value="general_feedback">General Feedback</option>
            <option value="ux_issue">UX Issue</option>
            <option value="booking_issue">Booking Issue</option>
            <option value="payment_problem">Payment Problem</option>
            <option value="feature_request">Feature Request</option>
            <option value="error_report">Error Report</option>
          </select>
        </div>

        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold;">How would you rate your experience?</label>
          <div id="rating-stars" style="font-size: 24px; cursor: pointer;">
            <span data-rating="1">⭐</span>
            <span data-rating="2">⭐</span>
            <span data-rating="3">⭐</span>
            <span data-rating="4">⭐</span>
            <span data-rating="5">⭐</span>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold;">Tell us more (optional):</label>
          <textarea id="feedback-comment" rows="4" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; resize: vertical;" placeholder="Your feedback helps us improve..."></textarea>
        </div>

        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold;">Email (optional):</label>
          <input type="email" id="feedback-email" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;" placeholder="your@email.com">
        </div>

        <div style="margin-bottom: 20px;">
          <label style="display: flex; align-items: center; cursor: pointer;">
            <input type="checkbox" id="feedback-consent" checked style="margin-right: 8px;">
            <span style="font-size: 14px;">I consent to providing feedback for UX improvement purposes</span>
          </label>
        </div>

        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button id="feedback-cancel" style="padding: 10px 20px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer;">Cancel</button>
          <button id="feedback-submit" style="padding: 10px 20px; background: #8B4513; color: white; border: none; border-radius: 6px; cursor: pointer;">Submit Feedback</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    this.setupFeedbackModalListeners(modal);
  }

  // Setup feedback modal event listeners
  private setupFeedbackModalListeners(modal: HTMLElement): void {
    const close = () => {
      modal.style.display = 'none';
    };

    // Close handlers
    modal.querySelector('#feedback-cancel')?.addEventListener('click', close);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });

    // Rating stars
    let selectedRating = 0;
    const stars = modal.querySelectorAll('#rating-stars span');
    stars.forEach((star, index) => {
      star.addEventListener('click', () => {
        selectedRating = index + 1;
        this.updateStarDisplay(stars, selectedRating);
      });

      star.addEventListener('mouseenter', () => {
        this.updateStarDisplay(stars, index + 1);
      });
    });

    modal.querySelector('#rating-stars')?.addEventListener('mouseleave', () => {
      this.updateStarDisplay(stars, selectedRating);
    });

    // Submit feedback
    modal.querySelector('#feedback-submit')?.addEventListener('click', () => {
      const feedbackType = (modal.querySelector('#feedback-type') as HTMLSelectElement).value;
      const comment = (modal.querySelector('#feedback-comment') as HTMLTextAreaElement).value;
      const email = (modal.querySelector('#feedback-email') as HTMLInputElement).value;
      const consent = (modal.querySelector('#feedback-consent') as HTMLInputElement).checked;

      if (selectedRating === 0) {
        alert('Please select a rating');
        return;
      }

      const feedbackData: any = {
        type: feedbackType,
        rating: selectedRating,
        comment: comment,
        email: email,
        consentGiven: consent
      };

      this.collectUserFeedback(feedbackData);
      close();
    });
  }

  // Update star display
  private updateStarDisplay(stars: NodeListOf<Element>, rating: number): void {
    stars.forEach((star, index) => {
      star.textContent = index < rating ? '⭐' : '☆';
    });
  }

  // Show feedback modal
  private showFeedbackModal(type?: UserFeedbackType, errorId?: string): void {
    const modal = document.getElementById('ux-feedback-modal');
    if (!modal) return;

    // Pre-fill type if provided
    if (type) {
      const typeSelect = modal.querySelector('#feedback-type') as HTMLSelectElement;
      if (typeSelect) {
        typeSelect.value = type;
      }
    }

    modal.style.display = 'flex';
  }

  // Initialize feedback prompts
  private initializeFeedbackPrompts(): void {
    // Prompt for feedback after errors
    let errorPromptShown = false;

    setInterval(() => {
      const recentErrors = this.errors.filter(e =>
        Date.now() - e.timestamp < 60000 && // Last minute
        e.severity === ErrorSeverity.HIGH &&
        !e.feedbackProvided
      );

      if (recentErrors.length > 0 && !errorPromptShown) {
        errorPromptShown = true;
        setTimeout(() => {
          if (recentErrors.some(e => !e.feedbackProvided)) {
            this.showFeedbackModal(UserFeedbackType.ERROR_REPORT, recentErrors[0].id);
          }
          errorPromptShown = false;
        }, 30000); // Wait 30 seconds after error
      }
    }, 10000);

    // Prompt for feedback after booking completion
    this.trackBookingCompletionForFeedback();
  }

  // Track booking completion for feedback
  private trackBookingCompletionForFeedback(): void {
    const checkBookingCompletion = () => {
      if (window.location.pathname === '/booking/confirmation') {
        // Show feedback prompt after 5 minutes
        setTimeout(() => {
          if (!this.feedback.some(f => f.type === UserFeedbackType.BOOKING_ISSUE)) {
            this.showFeedbackModal(UserFeedbackType.GENERAL_FEEDBACK);
          }
        }, 5 * 60 * 1000);
      }
    };

    checkBookingCompletion();
    setInterval(checkBookingCompletion, 5000);
  }

  // Initialize error recovery
  private initializeErrorRecovery(): void {
    // Register recovery strategies
    this.registerRecoveryStrategies();

    // Monitor for booking-specific errors
    this.monitorBookingErrors();
  }

  // Register recovery strategies
  private registerRecoveryStrategies(): void {
    // Network error recovery
    this.recoveryStrategies.set('network', [
      () => this.retryFailedRequest(),
      () => this.clearCacheAndReload(),
      () => this.showOfflineMode()
    ]);

    // Booking error recovery
    this.recoveryStrategies.set('booking', [
      () => this.restoreBookingState(),
      () => this.retryBookingStep(),
      () => this.redirectToBookingStart()
    ]);

    // Payment error recovery
    this.recoveryStrategies.set('payment', [
      () => this.retryPayment(),
      () => this.offerAlternativePayment(),
      () => this.saveBookingForLater()
    ]);
  }

  // Initialize performance error tracking
  private initializePerformanceErrorTracking(): void {
    // Monitor performance violations
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        entries.forEach(entry => {
          if (entry.entryType === 'longtask' && entry.duration > 5000) {
            this.handleError({
              message: `Extremely long task detected: ${entry.duration}ms`,
              error: new Error(`Performance issue: ${entry.name}`),
              context: { duration: entry.duration, startTime: entry.startTime }
            });
          }
        });
      });

      observer.observe({ entryTypes: ['longtask'] });
    }
  }

  // Initialize booking flow error tracking
  private initializeBookingFlowErrorTracking(): void {
    // Monitor booking step failures
    const bookingPaths = ['/booking/step1', '/booking/step2', '/booking/step3', '/booking/step4'];

    const monitorBookingStep = () => {
      const currentPath = window.location.pathname;
      if (bookingPaths.some(path => currentPath.includes(path))) {
        // Track booking step errors
        this.trackBookingStepErrors(currentPath);
      }
    };

    monitorBookingStep();
    setInterval(monitorBookingStep, 1000);
  }

  // Track booking step errors
  private trackBookingStepErrors(path: string): void {
    // Monitor for form validation errors
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('invalid', (event) => {
        this.handleError({
          message: `Form validation error on ${path}`,
          error: new Error(`Validation failed`),
          context: { path: path, formId: form.id, fieldName: (event.target as HTMLElement).id }
        });
      }, true);
    });
  }

  // Initialize payment error tracking
  private initializePaymentErrorTracking(): void {
    // Monitor Stripe errors
    window.addEventListener('stripe-error', (event: any) => {
      this.handleError({
        message: `Stripe payment error: ${event.detail.message}`,
        error: new Error(event.detail.message),
        context: { stripeError: event.detail, type: 'payment' }
      });
    });

    // Monitor payment form errors
    const paymentForms = document.querySelectorAll('[data-payment-form]');
    paymentForms.forEach(form => {
      form.addEventListener('error', (event: any) => {
        this.handleError({
          message: `Payment form error: ${event.detail.message}`,
          error: new Error(event.detail.message),
          context: { paymentForm: true, type: 'payment' }
        });
      });
    });
  }

  // Handle errors
  private handleError(errorData: any): void {
    // Check rate limiting
    if (this.shouldRateLimit(errorData.message)) {
      return;
    }

    // Categorize error
    const category = this.categorizeError(errorData);
    const severity = this.assessSeverity(errorData, category);

    // Create error record
    const error: ErrorData = {
      id: this.generateErrorId(),
      category: category,
      severity: severity,
      message: errorData.message,
      stack: errorData.error?.stack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.getUserId(),
      sessionId: this.sessionId,
      journeyId: this.getCurrentJourneyId(),
      bookingStep: this.getCurrentBookingStep(),
      context: errorData.context || {},
      recoverable: this.isRecoverable(category, severity),
      recoveryAttempted: false,
      userNotified: false,
      feedbackProvided: false
    };

    // Store error
    this.errors.push(error);
    this.errorCounts.set(errorData.message, (this.errorCounts.get(errorData.message) || 0) + 1);

    // Track error
    trackRUMEvent('error-occurred', {
      errorId: error.id,
      category: error.category,
      severity: error.severity,
      message: error.message,
      bookingStep: error.bookingStep,
      journeyId: error.journeyId
    });

    // Report to Sentry
    this.reportToSentry(error);

    // Attempt recovery
    if (error.recoverable && this.config.bookingErrorRecovery) {
      this.attemptErrorRecovery(error);
    }

    // Notify user
    if (this.shouldNotifyUser(error)) {
      this.notifyUser(error);
    }

    // Clean up old errors
    this.cleanupOldErrors();
  }

  // Categorize error
  private categorizeError(errorData: any): ErrorCategory {
    const message = errorData.message?.toLowerCase() || '';
    const stack = errorData.error?.stack?.toLowerCase() || '';

    if (message.includes('payment') || message.includes('stripe') || stack.includes('stripe')) {
      return ErrorCategory.PAYMENT;
    }
    if (message.includes('booking') || message.includes('appointment') || message.includes('slot')) {
      return ErrorCategory.BOOKING;
    }
    if (message.includes('auth') || message.includes('login') || message.includes('unauthorized')) {
      return ErrorCategory.AUTHENTICATION;
    }
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return ErrorCategory.VALIDATION;
    }
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return ErrorCategory.NETWORK;
    }
    if (message.includes('performance') || message.includes('timeout') || message.includes('memory')) {
      return ErrorCategory.PERFORMANCE;
    }
    if (message.includes('react') || message.includes('render') || message.includes('dom')) {
      return ErrorCategory.UI;
    }
    if (message.includes('supabase') || message.includes('api') || message.includes('integration')) {
      return ErrorCategory.INTEGRATION;
    }

    return ErrorCategory.UNKNOWN;
  }

  // Assess error severity
  private assessSeverity(errorData: any, category: ErrorCategory): ErrorSeverity {
    // Critical categories
    if (category === ErrorCategory.PAYMENT) return ErrorSeverity.CRITICAL;
    if (category === ErrorCategory.BOOKING) return ErrorSeverity.HIGH;
    if (category === ErrorCategory.AUTHENTICATION) return ErrorSeverity.HIGH;

    // Check error patterns
    const message = errorData.message?.toLowerCase() || '';
    if (message.includes('critical') || message.includes('fatal')) return ErrorSeverity.CRITICAL;
    if (message.includes('failed') || message.includes('error')) return ErrorSeverity.HIGH;
    if (message.includes('warning') || message.includes('deprecated')) return ErrorSeverity.MEDIUM;

    return ErrorSeverity.LOW;
  }

  // Check if error is recoverable
  private isRecoverable(category: ErrorCategory, severity: ErrorSeverity): boolean {
    if (severity === ErrorSeverity.CRITICAL) return false;
    if (category === ErrorCategory.NETWORK) return true;
    if (category === ErrorCategory.BOOKING) return true;
    if (category === ErrorCategory.PAYMENT) return true;
    if (category === ErrorCategory.VALIDATION) return true;

    return false;
  }

  // Attempt error recovery
  private attemptErrorRecovery(error: ErrorData): void {
    const strategies = this.recoveryStrategies.get(error.category);
    if (!strategies) return;

    error.recoveryAttempted = true;

    strategies.forEach(async (strategy, index) => {
      try {
        await strategy();
        error.recoverySuccessful = true;

        trackRUMEvent('error-recovery-success', {
          errorId: error.id,
          category: error.category,
          strategyIndex: index
        });

        // Notify user of successful recovery
        this.notifyRecoverySuccess(error);
      } catch (recoveryError) {
        console.warn(`Recovery strategy ${index} failed for error ${error.id}:`, recoveryError);

        // Try next strategy
        if (index === strategies.length - 1) {
          error.recoverySuccessful = false;
          trackRUMEvent('error-recovery-failed', {
            errorId: error.id,
            category: error.category,
            strategiesAttempted: strategies.length
          });
        }
      }
    });
  }

  // Recovery strategies implementation
  private async retryFailedRequest(): Promise<void> {
    // Implementation for retrying failed requests
    console.log('Retrying failed request...');
  }

  private async clearCacheAndReload(): Promise<void> {
    // Clear cache and reload
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    window.location.reload();
  }

  private async showOfflineMode(): Promise<void> {
    // Show offline mode message
    const message = document.createElement('div');
    message.textContent = 'You appear to be offline. Some features may not be available.';
    message.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #ff6b6b;
      color: white;
      padding: 10px 20px;
      border-radius: 6px;
      z-index: 10000;
    `;
    document.body.appendChild(message);

    setTimeout(() => {
      document.body.removeChild(message);
    }, 5000);
  }

  private async restoreBookingState(): Promise<void> {
    // Restore booking state from local storage
    const bookingState = localStorage.getItem('booking-state');
    if (bookingState) {
      console.log('Restoring booking state...');
      // Implementation for state restoration
    }
  }

  private async retryBookingStep(): Promise<void> {
    // Retry current booking step
    console.log('Retrying booking step...');
  }

  private async redirectToBookingStart(): Promise<void> {
    // Redirect to booking start
    window.location.href = '/booking/step1';
  }

  private async retryPayment(): Promise<void> {
    // Retry payment
    console.log('Retrying payment...');
  }

  private async offerAlternativePayment(): Promise<void> {
    // Offer alternative payment methods
    console.log('Offering alternative payment methods...');
  }

  private async saveBookingForLater(): Promise<void> {
    // Save booking for later completion
    console.log('Saving booking for later...');
  }

  // Monitor booking errors
  private monitorBookingErrors(): void {
    // Monitor for booking-specific error patterns
    window.addEventListener('booking-error', (event: any) => {
      this.handleError({
        message: event.detail.message,
        error: new Error(event.detail.message),
        context: { ...event.detail, type: 'booking' }
      });
    });
  }

  // Report to Sentry
  private reportToSentry(error: ErrorData): void {
    if (!import.meta.env.PROD) return;

    const sentryError = new Error(error.message);
    sentryError.stack = error.stack;

    reportError(sentryError, {
      category: error.category,
      severity: error.severity,
      bookingStep: error.bookingStep,
      journeyId: error.journeyId,
      userId: error.userId,
      sessionId: error.sessionId,
      recoverable: error.recoverable,
      context: error.context
    });
  }

  // Check if should rate limit
  private shouldRateLimit(message: string): boolean {
    const count = this.errorCounts.get(message) || 0;
    return count > this.config.maxErrorsPerSession;
  }

  // Check if should notify user
  private shouldNotifyUser(error: ErrorData): boolean {
    if (error.userNotified) return false;
    if (error.severity === ErrorSeverity.LOW) return false;
    if (error.category === ErrorCategory.PERFORMANCE) return false;
    return true;
  }

  // Notify user of error
  private notifyUser(error: ErrorData): void {
    error.userNotified = true;

    const message = this.getErrorMessage(error);
    this.showUserNotification(message, error.severity);

    trackRUMEvent('error-user-notified', {
      errorId: error.id,
      category: error.category,
      severity: error.severity,
      message: message
    });
  }

  // Get user-friendly error message
  private getErrorMessage(error: ErrorData): string {
    switch (error.category) {
      case ErrorCategory.PAYMENT:
        return 'Payment processing failed. Please check your payment details and try again.';
      case ErrorCategory.BOOKING:
        return 'Booking system encountered an issue. Please try again or contact support.';
      case ErrorCategory.AUTHENTICATION:
        return 'Authentication required. Please log in to continue.';
      case ErrorCategory.NETWORK:
        return 'Connection issue. Please check your internet connection and try again.';
      case ErrorCategory.VALIDATION:
        return 'Please check the form and correct any errors.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  // Show user notification
  private showUserNotification(message: string, severity: ErrorSeverity): void {
    const notification = document.createElement('div');
    notification.textContent = message;

    const colors = {
      [ErrorSeverity.LOW]: '#4CAF50',
      [ErrorSeverity.MEDIUM]: '#FF9800',
      [ErrorSeverity.HIGH]: '#F44336',
      [ErrorSeverity.CRITICAL]: '#D32F2F'
    };

    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[severity]};
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      max-width: 400px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-family: system-ui, sans-serif;
      font-size: 14px;
      line-height: 1.4;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  // Notify recovery success
  private notifyRecoverySuccess(error: ErrorData): void {
    const message = 'The issue has been resolved automatically. You can continue with your booking.';
    this.showUserNotification(message, ErrorSeverity.LOW);
  }

  // Collect user feedback
  private collectUserFeedback(feedbackData: any): void {
    if (!this.config.gdprCompliant || !feedbackData.consentGiven) {
      console.log('Feedback not collected - consent not given');
      return;
    }

    const feedback: UserFeedback = {
      id: this.generateFeedbackId(),
      type: feedbackData.type,
      rating: feedbackData.rating,
      comment: feedbackData.comment,
      email: feedbackData.email,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.getUserId(),
      sessionId: this.sessionId,
      context: {
        currentPath: window.location.pathname,
        bookingStep: this.getCurrentBookingStep(),
        journeyId: this.getCurrentJourneyId(),
        recentErrors: this.errors.slice(-5)
      },
      consentGiven: feedbackData.consentGiven
    };

    this.feedback.push(feedback);

    // Track feedback
    trackRUMEvent('user-feedback-submitted', {
      feedbackId: feedback.id,
      type: feedback.type,
      rating: feedback.rating,
      hasComment: !!feedback.comment,
      hasEmail: !!feedback.email,
      context: feedback.context
    });

    // Report to Sentry
    reportMessage(`User feedback submitted: ${feedback.type}`, 'info', feedback);

    // Link feedback to error if applicable
    if (feedback.type === UserFeedbackType.ERROR_REPORT && this.errors.length > 0) {
      const latestError = this.errors[this.errors.length - 1];
      latestError.feedbackProvided = true;

      trackRUMEvent('error-feedback-linked', {
        errorId: latestError.id,
        feedbackId: feedback.id,
        rating: feedback.rating
      });
    }

    // Show thank you message
    this.showFeedbackThankYou();

    // Send to server
    this.sendFeedbackToServer(feedback);
  }

  // Show feedback thank you message
  private showFeedbackThankYou(): void {
    const message = document.createElement('div');
    message.textContent = 'Thank you for your feedback! We appreciate your input in improving our service.';
    message.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #4CAF50;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-family: system-ui, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      max-width: 400px;
      text-align: center;
    `;

    document.body.appendChild(message);

    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 4000);
  }

  // Send feedback to server
  private async sendFeedbackToServer(feedback: UserFeedback): Promise<void> {
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback)
      });
    } catch (error) {
      console.warn('Failed to send feedback to server:', error);
    }
  }

  // Clean up old errors
  private cleanupOldErrors(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.errors = this.errors.filter(error => error.timestamp > oneHourAgo);
  }

  // Helper methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFeedbackId(): string {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUserId(): string | undefined {
    return localStorage.getItem('user_id') || undefined;
  }

  private getCurrentJourneyId(): string | undefined {
    // This would integrate with the user journey analytics
    return localStorage.getItem('current-journey-id') || undefined;
  }

  private getCurrentBookingStep(): string | undefined {
    const path = window.location.pathname;
    if (path.includes('/booking/step1')) return 'service-selection';
    if (path.includes('/booking/step2')) return 'time-selection';
    if (path.includes('/booking/step3')) return 'details-form';
    if (path.includes('/booking/step4')) return 'payment';
    return undefined;
  }

  // Public API methods

  // Manual error reporting
  reportError(message: string, category: ErrorCategory = ErrorCategory.UNKNOWN, context?: any): void {
    this.handleError({
      message: message,
      error: new Error(message),
      context: { ...context, reportedManually: true }
    });
  }

  // Manual feedback collection
  collectFeedback(type: UserFeedbackType, context?: any): void {
    this.showFeedbackModal(type);
  }

  // Get error analytics
  getErrorAnalytics(): any {
    const categoryCounts = new Map<ErrorCategory, number>();
    const severityCounts = new Map<ErrorSeverity, number>();
    const recoverableErrors = this.errors.filter(e => e.recoverable).length;
    const recoveredErrors = this.errors.filter(e => e.recoverySuccessful).length;
    const feedbackProvidedErrors = this.errors.filter(e => e.feedbackProvided).length;

    this.errors.forEach(error => {
      categoryCounts.set(error.category, (categoryCounts.get(error.category) || 0) + 1);
      severityCounts.set(error.severity, (severityCounts.get(error.severity) || 0) + 1);
    });

    return {
      totalErrors: this.errors.length,
      categoryBreakdown: Object.fromEntries(categoryCounts),
      severityBreakdown: Object.fromEntries(severityCounts),
      recoverableErrors,
      recoveredErrors,
      recoveryRate: recoverableErrors > 0 ? recoveredErrors / recoverableErrors : 0,
      feedbackProvidedErrors,
      feedbackRate: this.errors.length > 0 ? feedbackProvidedErrors / this.errors.length : 0,
      sessionDuration: Date.now() - this.sessionStartTime
    };
  }

  // Get feedback analytics
  getFeedbackAnalytics(): any {
    const typeCounts = new Map<UserFeedbackType, number>();
    const ratingSum = this.feedback.reduce((sum, f) => sum + f.rating, 0);
    const averageRating = this.feedback.length > 0 ? ratingSum / this.feedback.length : 0;

    this.feedback.forEach(feedback => {
      typeCounts.set(feedback.type, (typeCounts.get(feedback.type) || 0) + 1);
    });

    return {
      totalFeedback: this.feedback.length,
      typeBreakdown: Object.fromEntries(typeCounts),
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution: this.getRatingDistribution(),
      commentRate: this.feedback.filter(f => f.comment).length / (this.feedback.length || 1),
      emailProvidedRate: this.feedback.filter(f => f.email).length / (this.feedback.length || 1),
      consentRate: this.feedback.filter(f => f.consentGiven).length / (this.feedback.length || 1)
    };
  }

  // Get rating distribution
  private getRatingDistribution(): Record<number, number> {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    this.feedback.forEach(feedback => {
      distribution[feedback.rating] = (distribution[feedback.rating] || 0) + 1;
    });
    return distribution;
  }

  // Export data for analysis
  exportData(): any {
    return {
      errors: this.errors,
      feedback: this.feedback,
      errorAnalytics: this.getErrorAnalytics(),
      feedbackAnalytics: this.getFeedbackAnalytics(),
      sessionData: {
        sessionId: this.sessionId,
        startTime: this.sessionStartTime,
        duration: Date.now() - this.sessionStartTime
      }
    };
  }
}

// Create and export singleton instance
export const errorTrackingFeedbackManager = new ErrorTrackingFeedbackManager();

// Initialize automatically
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    errorTrackingFeedbackManager.initialize();
  } else {
    window.addEventListener('load', () => {
      errorTrackingFeedbackManager.initialize();
    });
  }
}

// Export helper functions
export const initializeErrorTracking = () => errorTrackingFeedbackManager.initialize();
export const reportCustomError = (message: string, category?: ErrorCategory, context?: any) =>
  errorTrackingFeedbackManager.reportError(message, category, context);
export const collectUserFeedback = (type?: UserFeedbackType, context?: any) =>
  errorTrackingFeedbackManager.collectFeedback(type || UserFeedbackType.GENERAL_FEEDBACK, context);
export const getErrorAnalytics = () => errorTrackingFeedbackManager.getErrorAnalytics();
export const getFeedbackAnalytics = () => errorTrackingFeedbackManager.getFeedbackAnalytics();
export const exportErrorTrackingData = () => errorTrackingFeedbackManager.exportData();