/**
 * User Satisfaction Measurement and Sentiment Analysis System
 * for luxury beauty and fitness booking platform
 */

import { trackRUMEvent, trackRUMInteraction } from './rum';
import { reportMessage } from './sentry';

// Satisfaction metrics types
export enum SatisfactionMetric {
  NPS = 'NPS',           // Net Promoter Score (0-10)
  CSAT = 'CSAT',         // Customer Satisfaction (1-5)
  CES = 'CES',           // Customer Effort Score (1-7)
  USAT = 'USAT',         // User Satisfaction (1-5)
  BOOKING_SATISFACTION = 'BOOKING_SATISFACTION', // Booking-specific satisfaction
  SERVICE_QUALITY = 'SERVICE_QUALITY',     // Service quality rating
  LUXURY_EXPERIENCE = 'LUXURY_EXPERIENCE'   // Luxury experience rating
}

// Feedback collection triggers
export enum FeedbackTrigger {
  BOOKING_COMPLETION = 'booking-completion',
  BOOKING_ABANDONMENT = 'booking-abandonment',
  CONTACT_FORM = 'contact-form',
  SESSION_END = 'session-end',
  TIME_BASED = 'time-based',
  ERROR_OCCURRED = 'error-occurred',
  MANUAL = 'manual',
  REPEATED_VISIT = 'repeated-visit'
}

// Sentiment analysis results
interface SentimentAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number; // 0-1
  emotions: {
    joy: number;
    trust: number;
    anticipation: number;
    surprise: number;
    fear: number;
    sadness: number;
    disgust: number;
    anger: number;
  };
  keyPhrases: string[];
  aspects: {
    service: number;
    booking: number;
    pricing: number;
    support: number;
    usability: number;
    design: number;
    performance: number;
  };
  language: string;
  processedAt: number;
}

// User satisfaction response
interface SatisfactionResponse {
  id: string;
  userId?: string;
  sessionId: string;
  metric: SatisfactionMetric;
  score: number;
  trigger: FeedbackTrigger;
  context: {
    pageType: string;
    bookingStep?: string;
    serviceType?: string;
    deviceType: string;
    sessionDuration: number;
    previousInteractions: number;
    errorOccurred?: boolean;
    bookingCompleted?: boolean;
  };
  comment?: string;
  sentimentAnalysis?: SentimentAnalysis;
  timestamp: number;
  location: {
    url: string;
    pageType: string;
    referrer: string;
  };
  deviceInfo: {
    userAgent: string;
    screenResolution: string;
    viewportSize: string;
    isMobile: boolean;
  };
  followUpResponses?: FollowUpResponse[];
}

// Follow-up response
interface FollowUpResponse {
  id: string;
  questionId: string;
  question: string;
  answer: string | number;
  timestamp: number;
  type: 'text' | 'rating' | 'boolean';
}

// Satisfaction survey configuration
interface SatisfactionSurvey {
  id: string;
  title: string;
  description: string;
  metric: SatisfactionMetric;
  scale: {
    min: number;
    max: number;
    labels: Record<number, string>;
  };
  questions: Array<{
    id: string;
    type: 'rating' | 'text' | 'boolean' | 'multiple-choice';
    question: string;
    required: boolean;
    options?: string[];
    conditional?: {
      metric: SatisfactionMetric;
      value: number | number[];
      operator: '=' | '>' | '<' | '>=' | '<=';
    };
  }>;
  triggers: FeedbackTrigger[];
  conditions?: {
    pageTypes?: string[];
    deviceTypes?: string[];
    sessionDuration?: { min?: number; max?: number };
    userSegments?: string[];
    bookingValue?: { min?: number; max?: number };
  };
  followUp?: {
    enabled: boolean;
    delay: number; // seconds
    questions: Array<{
      id: string;
      type: 'rating' | 'text' | 'boolean';
      question: string;
      condition?: {
        metric: SatisfactionMetric;
        score: number | number[];
        operator: '=' | '>' | '<' | '>=' | '<=';
      };
    }>;
  };
}

// Satisfaction analytics
interface SatisfactionAnalytics {
  metric: SatisfactionMetric;
  totalResponses: number;
  averageScore: number;
  distribution: Record<number, number>;
  trend: {
    direction: 'improving' | 'declining' | 'stable';
    changePercentage: number;
    confidence: number;
  };
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
    averageConfidence: number;
  };
  segmentAnalysis: {
    deviceType: Record<string, { count: number; averageScore: number }>;
    pageType: Record<string, { count: number; averageScore: number }>;
    trigger: Record<string, { count: number; averageScore: number }>;
  };
  correlations: {
    bookingConversion: number;
    repeatVisits: number;
    sessionDuration: number;
    errorRate: number;
  };
  recentResponses: SatisfactionResponse[];
  recommendations: string[];
}

class UserSatisfactionMeasurement {
  private static instance: UserSatisfactionMeasurement;
  private responses: SatisfactionResponse[] = [];
  private surveys: Map<string, SatisfactionSurvey> = new Map();
  private currentSurvey: SatisfactionSurvey | null = null;
  private isInitialized = false;
  private sessionId: string = '';
  private sessionStartTime: number = 0;
  private interactionCount: number = 0;
  private errorOccurred: boolean = false;
  private bookingCompleted: boolean = false;
  private lastSurveyTime: number = 0;

  private constructor() {
    this.initializeSurveys();
    this.initializeSession();
  }

  static getInstance(): UserSatisfactionMeasurement {
    if (!UserSatisfactionMeasurement.instance) {
      UserSatisfactionMeasurement.instance = new UserSatisfactionMeasurement();
    }
    return UserSatisfactionMeasurement.instance;
  }

  // Initialize satisfaction measurement
  initialize(): void {
    if (this.isInitialized) return;

    try {
      this.initializeEventTracking();
      this.initializeInteractionTracking();
      this.initializeSessionTracking();
      this.initializeErrorTracking();
      this.initializeBookingTracking();
      this.initializeSurveyPrompts();
      this.initializeSentimentAnalysis();

      this.isInitialized = true;
      console.log('[User Satisfaction] Comprehensive measurement system initialized');
    } catch (error) {
      console.warn('[User Satisfaction] Failed to initialize:', error);
    }
  }

  // Initialize default surveys
  private initializeSurveys(): void {
    const defaultSurveys: SatisfactionSurvey[] = [
      {
        id: 'booking-completion-nps',
        title: 'How likely are you to recommend our beauty services?',
        description: 'Your feedback helps us improve the luxury booking experience',
        metric: SatisfactionMetric.NPS,
        scale: {
          min: 0,
          max: 10,
          labels: {
            0: 'Not at all likely',
            5: 'Neutral',
            10: 'Extremely likely'
          }
        },
        questions: [
          {
            id: 'ease-of-booking',
            type: 'rating',
            question: 'How easy was the booking process?',
            required: true,
          },
          {
            id: 'service-quality',
            type: 'rating',
            question: 'How would you rate the service quality?',
            required: true,
          },
          {
            id: 'comments',
            type: 'text',
            question: 'Any additional comments about your experience?',
            required: false
          }
        ],
        triggers: [FeedbackTrigger.BOOKING_COMPLETION],
        followUp: {
          enabled: true,
          delay: 2,
          questions: [
            {
              id: 'recommendation-improvement',
              type: 'text',
              question: 'What could we do to earn a higher rating?',
              condition: {
                metric: SatisfactionMetric.NPS,
                score: [0, 1, 2, 3, 4, 5, 6, 7],
                operator: '<='
              }
            }
          ]
        }
      },
      {
        id: 'booking-abandonment-csat',
        title: 'How was your booking experience?',
        description: 'We noticed you didn\'t complete your booking. Your feedback helps us improve.',
        metric: SatisfactionMetric.CSAT,
        scale: {
          min: 1,
          max: 5,
          labels: {
            1: 'Very dissatisfied',
            3: 'Neutral',
            5: 'Very satisfied'
          }
        },
        questions: [
          {
            id: 'abandonment-reason',
            type: 'multiple-choice',
            question: 'What was the main reason for not completing your booking?',
            required: true,
            options: [
              'Technical issues',
              'Payment problems',
              'Unclear pricing',
              'Limited availability',
              'Changed my mind',
              'Just browsing',
              'Other'
            ]
          },
          {
            id: 'abandonment-comments',
            type: 'text',
            question: 'Please provide more details about your experience:',
            required: false
          }
        ],
        triggers: [FeedbackTrigger.BOOKING_ABANDONMENT]
      },
      {
        id: 'luxury-experience-csat',
        title: 'How would you rate your luxury experience?',
        description: 'We strive to provide an exceptional beauty and fitness experience',
        metric: SatisfactionMetric.LUXURY_EXPERIENCE,
        scale: {
          min: 1,
          max: 5,
          labels: {
            1: 'Poor luxury experience',
            3: 'Average luxury experience',
            5: 'Exceptional luxury experience'
          }
        },
        questions: [
          {
            id: 'ambiance-quality',
            type: 'rating',
            question: 'How would you rate the ambiance and atmosphere?',
            required: true,
          },
          {
            id: 'service-professionalism',
            type: 'rating',
            question: 'How professional was the service?',
            required: true,
          },
          {
            id: 'value-perception',
            type: 'rating',
            question: 'Did you feel the service provided good value?',
            required: true,
          }
        ],
        triggers: [FeedbackTrigger.TIME_BASED, FeedbackTrigger.SESSION_END],
        conditions: {
          sessionDuration: { min: 300000 }, // 5 minutes
          pageTypes: ['beauty-services', 'fitness-services', 'booking']
        }
      },
      {
        id: 'session-effort-ces',
        title: 'How easy was it to accomplish what you wanted today?',
        description: 'Your feedback helps us make our platform easier to use',
        metric: SatisfactionMetric.CES,
        scale: {
          min: 1,
          max: 7,
          labels: {
            1: 'Very difficult',
            4: 'Moderate difficulty',
            7: 'Very easy'
          }
        },
        questions: [
          {
            id: 'usability-issues',
            type: 'text',
            question: 'What made it difficult to accomplish your goal?',
            required: false,
            conditional: {
              metric: SatisfactionMetric.CES,
              score: [1, 2, 3],
              operator: '<='
            }
          }
        ],
        triggers: [FeedbackTrigger.SESSION_END, FeedbackTrigger.MANUAL]
      }
    ];

    defaultSurveys.forEach(survey => {
      this.surveys.set(survey.id, survey);
    });
  }

  // Initialize session
  private initializeSession(): void {
    this.sessionId = sessionStorage.getItem('satisfaction-session-id') || '';
    if (!this.sessionId) {
      this.sessionId = `sat_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('satisfaction-session-id', this.sessionId);
    }

    this.sessionStartTime = Date.now();
  }

  // Initialize event tracking
  private initializeEventTracking(): void {
    // Track booking completion
    window.addEventListener('booking-completed', () => {
      this.bookingCompleted = true;
      this.interactionCount++;
      setTimeout(() => {
        this.triggerSurvey(FEEDBACK_TRIGGER.BOOKING_COMPLETION);
      }, 5000); // Show survey 5 seconds after booking completion
    });

    // Track page navigation for session analysis
    this.trackPageNavigation();
  }

  // Initialize interaction tracking
  private initializeInteractionTracking(): void {
    // Track user interactions
    const interactions = ['click', 'scroll', 'keydown', 'touchstart'];

    interactions.forEach(eventType => {
      document.addEventListener(eventType, () => {
        this.interactionCount++;
      }, { passive: true });
    });
  }

  // Initialize session tracking
  private initializeSessionTracking(): void {
    // Track session end
    window.addEventListener('beforeunload', () => {
      this.handleSessionEnd();
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handleSessionPause();
      } else {
        this.handleSessionResume();
      }
    });

    // Track repeated visits
    this.trackRepeatedVisits();
  }

  // Initialize error tracking
  private initializeErrorTracking(): void {
    // Listen for custom error events
    window.addEventListener('error-occurred', () => {
      this.errorOccurred = true;
    });

    // Listen for JavaScript errors
    window.addEventListener('error', () => {
      this.errorOccurred = true;
    });

    window.addEventListener('unhandledrejection', () => {
      this.errorOccurred = true;
    });
  }

  // Initialize booking tracking
  private initializeBookingTracking(): void {
    // Monitor booking steps
    const bookingPaths = ['/booking/step1', '/booking/step2', '/booking/step3', '/booking/step4'];

    const checkBookingProgress = () => {
      const currentPath = window.location.pathname;

      if (bookingPaths.some(path => currentPath.includes(path))) {
        // Check for booking abandonment after inactivity
        this.checkBookingAbandonment();
      }
    };

    // Check booking progress every 30 seconds
    setInterval(checkBookingProgress, 30000);
  }

  // Initialize survey prompts
  private initializeSurveyPrompts(): void {
    // Time-based survey prompts
    setInterval(() => {
      this.checkTimeBasedSurveys();
    }, 60000); // Every minute

    // Manual survey trigger availability
    this.makeManualSurveyAvailable();
  }

  // Initialize sentiment analysis
  private initializeSentimentAnalysis(): void {
    // Process existing responses for sentiment analysis
    setTimeout(() => {
      this.processPendingSentimentAnalysis();
    }, 2000);
  }

  // Track page navigation
  private trackPageNavigation(): void {
    let lastPath = window.location.pathname;

    const checkPathChange = () => {
      const currentPath = window.location.pathname;
      if (currentPath !== lastPath) {
        lastPath = currentPath;
        this.interactionCount++;
      }
    };

    // Override history methods
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      setTimeout(checkPathChange, 0);
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      setTimeout(checkPathChange, 0);
    };

    window.addEventListener('popstate', checkPathChange);
  }

  // Handle session end
  private handleSessionEnd(): void {
    const sessionDuration = Date.now() - this.sessionStartTime;

    // Trigger session-end survey if appropriate
    if (sessionDuration > 300000 && !this.bookingCompleted) { // 5 minutes
      this.triggerSurvey(FEEDBACK_TRIGGER.SESSION_END);
    }

    // Track session analytics
    trackRUMEvent('session-end', {
      sessionId: this.sessionId,
      duration: sessionDuration,
      interactions: this.interactionCount,
      bookingCompleted: this.bookingCompleted,
      errorOccurred: this.errorOccurred,
      pageType: this.getPageType(),
      timestamp: Date.now()
    });
  }

  // Handle session pause
  private handleSessionPause(): void {
    // Track when user leaves the page
    trackRUMEvent('session-pause', {
      sessionId: this.sessionId,
      duration: Date.now() - this.sessionStartTime,
      interactions: this.interactionCount,
      pageType: this.getPageType(),
      timestamp: Date.now()
    });
  }

  // Handle session resume
  private handleSessionResume(): void {
    // Track when user returns to the page
    trackRUMEvent('session-resume', {
      sessionId: this.sessionId,
      pageType: this.getPageType(),
      timestamp: Date.now()
    });
  }

  // Track repeated visits
  private trackRepeatedVisits(): void {
    const visitCount = parseInt(localStorage.getItem('visit-count') || '0') + 1;
    localStorage.setItem('visit-count', visitCount.toString());

    if (visitCount > 1) {
      setTimeout(() => {
        this.triggerSurvey(FEEDBACK_TRIGGER.REPEATED_VISIT);
      }, 10000); // Show survey 10 seconds after page load for returning users
    }
  }

  // Check booking abandonment
  private checkBookingAbandonment(): void {
    const bookingPaths = ['/booking/step1', '/booking/step2', '/booking/step3', '/booking/step4'];
    const currentPath = window.location.pathname;

    if (bookingPaths.some(path => currentPath.includes(path))) {
      // Check for abandonment after 5 minutes of inactivity
      let inactivityTimer: NodeJS.Timeout;

      const resetInactivityTimer = () => {
        clearTimeout(inactivityTimer);

        inactivityTimer = setTimeout(() => {
          this.triggerSurvey(FEEDBACK_TRIGGER.BOOKING_ABANDONMENT);
        }, 5 * 60 * 1000); // 5 minutes
      };

      // Reset timer on user activity
      ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, resetInactivityTimer, { once: true });
      });

      resetInactivityTimer();
    }
  }

  // Check time-based surveys
  private checkTimeBasedSurveys(): void {
    const timeSinceLastSurvey = Date.now() - this.lastSurveyTime;
    const sessionDuration = Date.now() - this.sessionStartTime;

    // Show time-based survey after 10 minutes of active use
    if (sessionDuration > 600000 && timeSinceLastSurvey > 1800000 && this.interactionCount > 5) {
      this.triggerSurvey(FEEDBACK_TRIGGER.TIME_BASED);
    }
  }

  // Make manual survey available
  private makeManualSurveyAvailable(): void {
    // Create feedback widget
    const feedbackWidget = document.createElement('div');
    feedbackWidget.id = 'satisfaction-feedback-widget';
    feedbackWidget.innerHTML = `
      <button id="satisfaction-feedback-trigger" style="
        position: fixed;
        bottom: 80px;
        right: 20px;
        background: #8B4513;
        color: white;
        border: none;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        font-size: 16px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 9999;
        transition: all 0.3s ease;
      " title="Rate your experience">
        💬
      </button>
    `;

    document.body.appendChild(feedbackWidget);

    // Add click handler
    const triggerButton = feedbackWidget.querySelector('#satisfaction-feedback-trigger') as HTMLButtonElement;
    triggerButton.addEventListener('click', () => {
      this.showSurveySelectionModal();
    });

    // Add hover effects
    triggerButton.addEventListener('mouseenter', () => {
      triggerButton.style.transform = 'scale(1.1)';
    });

    triggerButton.addEventListener('mouseleave', () => {
      triggerButton.style.transform = 'scale(1)';
    });
  }

  // Show survey selection modal
  private showSurveySelectionModal(): void {
    const modal = document.createElement('div');
    modal.id = 'satisfaction-survey-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    modal.innerHTML = `
      <div style="
        background: white;
        border-radius: 12px;
        padding: 32px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <h2 style="margin: 0; color: #8B4513; font-size: 24px;">Share Your Feedback</h2>
          <button id="close-survey-selection" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
          ">×</button>
        </div>

        <p style="margin: 0 0 24px 0; color: #666;">Help us improve your luxury beauty and fitness experience</p>

        <div style="display: flex; flex-direction: column; gap: 16px;">
          ${Array.from(this.surveys.values()).map(survey => `
            <button class="survey-option" data-survey-id="${survey.id}" style="
              padding: 16px;
              border: 2px solid #e0e0e0;
              background: white;
              border-radius: 8px;
              cursor: pointer;
              text-align: left;
              transition: all 0.2s ease;
            ">
              <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${survey.title}</div>
              <div style="font-size: 14px; color: #666;">${survey.description}</div>
            </button>
          `).join('')}
        </div>

        <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e0e0e0;">
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #999; text-align: center;">
            Your feedback is valuable and helps us improve our services
          </p>
          <p style="margin: 0; font-size: 12px; color: #999; text-align: center;">
            This should only take a minute of your time
          </p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    this.setupSurveySelectionListeners(modal);
  }

  // Setup survey selection modal listeners
  private setupSurveySelectionListeners(modal: HTMLElement): void {
    const closeBtn = modal.querySelector('#close-survey-selection') as HTMLButtonElement;
    const surveyOptions = modal.querySelectorAll('.survey-option');

    const closeModal = () => {
      document.body.removeChild(modal);
    };

    closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    surveyOptions.forEach(option => {
      option.addEventListener('click', () => {
        const surveyId = option.getAttribute('data-survey-id');
        if (surveyId) {
          this.showSurvey(surveyId);
        }
        closeModal();
      });

      option.addEventListener('mouseenter', () => {
        (option as HTMLButtonElement).style.borderColor = '#8B4513';
        (option as HTMLButtonElement).style.backgroundColor = '#f8f4f0';
      });

      option.addEventListener('mouseleave', () => {
        (option as HTMLButtonElement).style.borderColor = '#e0e0e0';
        (option as HTMLButtonElement).style.backgroundColor = 'white';
      });
    });
  }

  // Trigger survey based on trigger type
  private triggerSurvey(trigger: FeedbackTrigger): void {
    // Find matching surveys for this trigger
    const matchingSurveys = Array.from(this.surveys.values()).filter(survey =>
      survey.triggers.includes(trigger) && this.shouldShowSurvey(survey)
    );

    if (matchingSurveys.length > 0) {
      // Show the most relevant survey
      const survey = matchingSurveys[0];
      this.showSurvey(survey.id);
    }
  }

  // Check if survey should be shown
  private shouldShowSurvey(survey: SatisfactionSurvey): boolean {
    // Check time-based restrictions
    const timeSinceLastSurvey = Date.now() - this.lastSurveyTime;
    if (timeSinceLastSurvey < 300000) { // 5 minutes between surveys
      return false;
    }

    // Check conditions
    if (survey.conditions) {
      const sessionDuration = Date.now() - this.sessionStartTime;

      // Check page type condition
      if (survey.conditions.pageTypes) {
        const currentPageType = this.getPageType();
        if (!survey.conditions.pageTypes.includes(currentPageType)) {
          return false;
        }
      }

      // Check device type condition
      if (survey.conditions.deviceTypes) {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const deviceType = isMobile ? 'mobile' : 'desktop';
        if (!survey.conditions.deviceTypes.includes(deviceType)) {
          return false;
        }
      }

      // Check session duration condition
      if (survey.conditions.sessionDuration) {
        const { min, max } = survey.conditions.sessionDuration;
        if (min && sessionDuration < min) return false;
        if (max && sessionDuration > max) return false;
      }
    }

    return true;
  }

  // Show survey
  private showSurvey(surveyId: string): void {
    const survey = this.surveys.get(surveyId);
    if (!survey) return;

    this.currentSurvey = survey;
    this.lastSurveyTime = Date.now();

    const modal = document.createElement('div');
    modal.id = 'satisfaction-survey-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    modal.innerHTML = `
      <div style="
        background: white;
        border-radius: 12px;
        padding: 32px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <h2 style="margin: 0; color: #8B4513; font-size: 24px;">${survey.title}</h2>
          <button id="close-survey" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
          ">×</button>
        </div>

        <p style="margin: 0 0 32px 0; color: #666; font-size: 16px;">${survey.description}</p>

        <form id="satisfaction-survey-form">
          <input type="hidden" name="survey-id" value="${surveyId}">
          <input type="hidden" name="metric" value="${survey.metric}">

          <div style="margin-bottom: 32px;">
            <label style="display: block; margin-bottom: 16px; font-weight: 600; color: #333;">
              How would you rate your experience?
            </label>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              ${this.generateRatingOptions(survey.scale)}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #999;">
              ${Object.entries(survey.scale.labels).map(([value, label]) =>
                `<span>${value}: ${label}</span>`
              ).join('')}
            </div>
          </div>

          ${survey.questions.map(question => `
            <div style="margin-bottom: 24px;" data-question="${question.id}">
              <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">
                ${question.required ? '* ' : ''}${question.question}
              </label>
              ${this.generateQuestionField(question)}
            </div>
          `).join('')}

          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button type="button" id="skip-survey" style="
              padding: 12px 24px;
              border: 1px solid #ddd;
              background: white;
              border-radius: 8px;
              cursor: pointer;
              font-size: 16px;
            ">Skip</button>
            <button type="submit" style="
              padding: 12px 24px;
              background: #8B4513;
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 16px;
            ">Submit Feedback</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    this.setupSurveyListeners(modal, survey);
  }

  // Generate rating options
  private generateRatingOptions(scale: SatisfactionSurvey['scale']): string {
    let options = '';
    for (let i = scale.min; i <= scale.max; i++) {
      options += `
        <button type="button" class="rating-option" data-value="${i}" style="
          flex: 1;
          padding: 12px 8px;
          border: 2px solid #ddd;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          transition: all 0.2s ease;
          margin: 0 2px;
        ">${i}</button>
      `;
    }
    return options;
  }

  // Generate question field
  private generateQuestionField(question: SatisfactionSurvey['questions'][0]): string {
    switch (question.type) {
      case 'rating':
        return `
          <div style="display: flex; gap: 8px;">
            ${[1, 2, 3, 4, 5].map(i => `
              <button type="button" class="question-rating" data-value="${i}" name="${question.id}" style="
                padding: 8px 16px;
                border: 2px solid #ddd;
                background: white;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
              ">${i}</button>
            `).join('')}
          </div>
        `;

      case 'text':
        return `
          <textarea
            name="${question.id}"
            placeholder="Please share your thoughts..."
            style="
              width: 100%;
              padding: 12px;
              border: 1px solid #ddd;
              border-radius: 8px;
              font-size: 16px;
              resize: vertical;
              min-height: 100px;
            "
            ${question.required ? 'required' : ''}
          ></textarea>
        `;

      case 'boolean':
        return `
          <div style="display: flex; gap: 16px;">
            <label style="display: flex; align-items: center; cursor: pointer;">
              <input type="radio" name="${question.id}" value="true" style="margin-right: 8px;" ${question.required ? 'required' : ''}>
              Yes
            </label>
            <label style="display: flex; align-items: center; cursor: pointer;">
              <input type="radio" name="${question.id}" value="false" style="margin-right: 8px;" ${question.required ? 'required' : ''}>
              No
            </label>
          </div>
        `;

      case 'multiple-choice':
        return `
          <select name="${question.id}" style="
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
          " ${question.required ? 'required' : ''}>
            <option value="">Please select...</option>
            ${question.options?.map(option => `<option value="${option}">${option}</option>`).join('')}
          </select>
        `;

      default:
        return '';
    }
  }

  // Setup survey listeners
  private setupSurveyListeners(modal: HTMLElement, survey: SatisfactionSurvey): void {
    const form = modal.querySelector('#satisfaction-survey-form') as HTMLFormElement;
    const closeBtn = modal.querySelector('#close-survey') as HTMLButtonElement;
    const skipBtn = modal.querySelector('#skip-survey') as HTMLButtonElement;

    // Rating option listeners
    const ratingOptions = modal.querySelectorAll('.rating-option');
    let selectedRating = 0;

    ratingOptions.forEach(option => {
      option.addEventListener('click', () => {
        const value = parseInt(option.getAttribute('data-value')!);
        selectedRating = value;

        // Update visual state
        ratingOptions.forEach(opt => {
          opt.style.borderColor = '#ddd';
          opt.style.backgroundColor = 'white';
          opt.style.color = '#333';
        });

        // Highlight selected
        for (let i = survey.scale.min; i <= value; i++) {
          const btn = modal.querySelector(`.rating-option[data-value="${i}"]`) as HTMLButtonElement;
          if (btn) {
            btn.style.borderColor = '#8B4513';
            btn.style.backgroundColor = '#8B4513';
            btn.style.color = 'white';
          }
        }

        // Store rating value
        (form.elements.namedItem('rating') as HTMLInputElement).value = value.toString();
      });
    });

    // Question field listeners
    const questionRatings = modal.querySelectorAll('.question-rating');
    questionRatings.forEach(rating => {
      rating.addEventListener('click', () => {
        const value = rating.getAttribute('data-value');
        const questionId = rating.getAttribute('name')!;

        // Update visual state
        questionRatings.forEach(r => {
          r.style.borderColor = '#ddd';
          r.style.backgroundColor = 'white';
        });

        rating.style.borderColor = '#8B4513';
        rating.style.backgroundColor = '#f0e6dc';
      });
    });

    // Close handlers
    const closeModal = () => {
      document.body.removeChild(modal);
      this.currentSurvey = null;
    };

    closeBtn.addEventListener('click', closeModal);
    skipBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      if (selectedRating === 0) {
        alert('Please select a rating before submitting');
        return;
      }

      this.submitSurveyResponse(form, survey);
      closeModal();
    });
  }

  // Submit survey response
  private submitSurveyResponse(form: HTMLFormElement, survey: SatisfactionSurvey): void {
    const formData = new FormData(form);
    const rating = parseInt(formData.get('rating') as string);

    const response: SatisfactionResponse = {
      id: this.generateResponseId(),
      userId: this.getUserId(),
      sessionId: this.sessionId,
      metric: survey.metric,
      score: rating,
      trigger: this.determineTrigger(),
      context: {
        pageType: this.getPageType(),
        bookingStep: this.getCurrentBookingStep(),
        serviceType: this.getCurrentServiceType(),
        deviceType: this.getDeviceType(),
        sessionDuration: Date.now() - this.sessionStartTime,
        previousInteractions: this.interactionCount,
        errorOccurred: this.errorOccurred,
        bookingCompleted: this.bookingCompleted
      },
      timestamp: Date.now(),
      location: {
        url: window.location.href,
        pageType: this.getPageType(),
        referrer: document.referrer
      },
      deviceInfo: {
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      }
    };

    // Process additional questions
    survey.questions.forEach(question => {
      const value = formData.get(question.id);
      if (value) {
        if (question.type === 'text') {
          response.comment = value as string;
        }
        // Store follow-up responses
        if (!response.followUpResponses) {
          response.followUpResponses = [];
        }
        response.followUpResponses.push({
          id: this.generateFollowUpId(),
          questionId: question.id,
          question: question.question,
          answer: value as string,
          timestamp: Date.now(),
          type: question.type
        });
      }
    });

    // Store response
    this.responses.push(response);

    // Perform sentiment analysis if comment provided
    if (response.comment) {
      this.performSentimentAnalysis(response);
    }

    // Track response event
    trackRUMEvent('satisfaction-response', {
      responseId: response.id,
      metric: response.metric,
      score: response.score,
      trigger: response.trigger,
      pageType: response.context.pageType,
      hasComment: !!response.comment,
      timestamp: Date.now()
    });

    // Show thank you message
    this.showThankYouMessage();

    // Check for follow-up survey
    this.checkFollowUpSurvey(response, survey);

    // Send to server
    this.sendResponseToServer(response);
  }

  // Determine trigger based on context
  private determineTrigger(): FeedbackTrigger {
    if (this.bookingCompleted) return FeedbackTrigger.BOOKING_COMPLETION;
    if (this.errorOccurred) return FeedbackTrigger.ERROR_OCCURRED;
    const sessionDuration = Date.now() - this.sessionStartTime;
    if (sessionDuration > 600000) return FeedbackTrigger.SESSION_END;
    return FeedbackTrigger.TIME_BASED;
  }

  // Perform sentiment analysis
  private performSentimentAnalysis(response: SatisfactionResponse): void {
    if (!response.comment) return;

    // Simple sentiment analysis (in production, you'd use a proper NLP service)
    const analysis: SentimentAnalysis = this.analyzeSentiment(response.comment);
    response.sentimentAnalysis = analysis;

    // Track sentiment analysis
    trackRUMEvent('sentiment-analysis', {
      responseId: response.id,
      sentiment: analysis.sentiment,
      confidence: analysis.confidence,
      emotions: analysis.emotions,
      keyPhrases: analysis.keyPhrases,
      timestamp: Date.now()
    });
  }

  // Analyze sentiment (simplified version)
  private analyzeSentiment(text: string): SentimentAnalysis {
    const positiveWords = ['excellent', 'amazing', 'great', 'love', 'perfect', 'fantastic', 'wonderful', 'outstanding', 'beautiful', 'luxury', 'professional', 'helpful', 'easy', 'smooth'];
    const negativeWords = ['terrible', 'awful', 'horrible', 'worst', 'bad', 'poor', 'difficult', 'confusing', 'frustrating', 'disappointing', 'slow', 'broken', 'ugly'];
    const serviceWords = ['service', 'booking', 'appointment', 'staff', 'professional', 'quality'];
    const bookingWords = ['booking', 'appointment', 'schedule', 'time', 'availability', 'payment'];
    const designWords = ['design', 'layout', 'appearance', 'look', 'feel', 'interface'];

    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);

    // Count sentiment words
    let positiveCount = 0;
    let negativeCount = 0;
    const foundWords: string[] = [];

    words.forEach(word => {
      if (positiveWords.includes(word)) {
        positiveCount++;
        foundWords.push(word);
      } else if (negativeWords.includes(word)) {
        negativeCount++;
        foundWords.push(word);
      }
    });

    // Determine sentiment
    let sentiment: 'positive' | 'neutral' | 'negative';
    let confidence = 0.5;

    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      confidence = Math.min(0.9, 0.5 + (positiveCount - negativeCount) * 0.1);
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      confidence = Math.min(0.9, 0.5 + (negativeCount - positiveCount) * 0.1);
    } else {
      sentiment = 'neutral';
      confidence = 0.6;
    }

    // Analyze aspects
    const aspects = {
      service: foundWords.filter(w => serviceWords.some(sw => lowerText.includes(sw))).length / words.length,
      booking: foundWords.filter(w => bookingWords.some(bw => lowerText.includes(bw))).length / words.length,
      pricing: 0, // Would need more sophisticated analysis
      support: 0, // Would need more sophisticated analysis
      usability: foundWords.filter(w => ['easy', 'difficult', 'confusing'].includes(w)).length / words.length,
      design: foundWords.filter(w => designWords.some(dw => lowerText.includes(dw))).length / words.length,
      performance: foundWords.filter(w => ['fast', 'slow', 'quick', 'responsive'].includes(w)).length / words.length
    };

    return {
      sentiment,
      confidence,
      emotions: {
        joy: sentiment === 'positive' ? 0.7 : 0.1,
        trust: 0.5,
        anticipation: 0.3,
        surprise: 0.2,
        fear: sentiment === 'negative' ? 0.4 : 0.1,
        sadness: sentiment === 'negative' ? 0.3 : 0.1,
        disgust: sentiment === 'negative' ? 0.2 : 0.05,
        anger: sentiment === 'negative' ? 0.4 : 0.1
      },
      keyPhrases: foundWords.slice(0, 5),
      aspects,
      language: 'en',
      processedAt: Date.now()
    };
  }

  // Check for follow-up survey
  private checkFollowUpSurvey(response: SatisfactionResponse, survey: SatisfactionSurvey): void {
    if (!survey.followUp || !survey.followUp.enabled) return;

    // Check if any follow-up questions should be shown
    const followUpQuestions = survey.followUp.questions.filter(q => {
      if (!q.condition) return true;

      const { metric, score, operator } = q.condition;
      if (operator === '<=') {
        return response.score <= score;
      } else if (operator === '<') {
        return response.score < score;
      } else if (operator === '>=') {
        return response.score >= score;
      } else if (operator === '>') {
        return response.score > score;
      } else if (operator === '=') {
        return response.score === score;
      }

      return false;
    });

    if (followUpQuestions.length > 0) {
      setTimeout(() => {
        this.showFollowUpSurvey(followUpQuestions, response);
      }, survey.followUp.delay * 1000);
    }
  }

  // Show follow-up survey
  private showFollowUpSurvey(questions: SatisfactionSurvey['followUp']['questions'], originalResponse: SatisfactionResponse): void {
    const modal = document.createElement('div');
    modal.id = 'follow-up-survey-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 10002;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    modal.innerHTML = `
      <div style="
        background: white;
        border-radius: 12px;
        padding: 32px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      ">
        <h3 style="margin: 0 0 24px 0; color: #8B4513;">Thank you for your feedback!</h3>
        <p style="margin: 0 0 32px 0; color: #666;">We'd appreciate a bit more detail to help us improve.</p>

        <form id="follow-up-survey-form">
          ${questions.map(question => `
            <div style="margin-bottom: 24px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">
                ${question.question}
              </label>
              ${this.generateQuestionField(question)}
            </div>
          `).join('')}

          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button type="button" id="skip-follow-up" style="
              padding: 12px 24px;
              border: 1px solid #ddd;
              background: white;
              border-radius: 8px;
              cursor: pointer;
              font-size: 16px;
            ">Skip</button>
            <button type="submit" style="
              padding: 12px 24px;
              background: #8B4513;
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 16px;
            ">Submit</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    this.setupFollowUpListeners(modal, questions, originalResponse);
  }

  // Setup follow-up survey listeners
  private setupFollowUpListeners(modal: HTMLElement, questions: any[], originalResponse: SatisfactionResponse): void {
    const form = modal.querySelector('#follow-up-survey-form') as HTMLFormElement;
    const skipBtn = modal.querySelector('#skip-follow-up') as HTMLButtonElement;

    const closeModal = () => {
      document.body.removeChild(modal);
    };

    skipBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Process follow-up responses
      questions.forEach(question => {
        const value = (form.elements.namedItem(question.id) as HTMLInputElement).value;
        if (value && originalResponse.followUpResponses) {
          originalResponse.followUpResponses.push({
            id: this.generateFollowUpId(),
            questionId: question.id,
            question: question.question,
            answer: value,
            timestamp: Date.now(),
            type: question.type
          });
        }
      });

      // Update the original response
      const responseIndex = this.responses.findIndex(r => r.id === originalResponse.id);
      if (responseIndex !== -1) {
        this.responses[responseIndex] = originalResponse;
      }

      // Send updated response to server
      this.sendResponseToServer(originalResponse);

      closeModal();
    });
  }

  // Show thank you message
  private showThankYouMessage(): void {
    const message = document.createElement('div');
    message.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      z-index: 10003;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-family: system-ui, sans-serif;
      font-size: 16px;
      max-width: 300px;
    `;

    message.textContent = 'Thank you for your feedback! We appreciate your input.';

    document.body.appendChild(message);

    setTimeout(() => {
      if (document.body.contains(message)) {
        document.body.removeChild(message);
      }
    }, 4000);
  }

  // Process pending sentiment analysis
  private processPendingSentimentAnalysis(): void {
    const responsesWithoutAnalysis = this.responses.filter(r => r.comment && !r.sentimentAnalysis);

    responsesWithoutAnalysis.forEach(response => {
      this.performSentimentAnalysis(response);
    });
  }

  // Send response to server
  private async sendResponseToServer(response: SatisfactionResponse): Promise<void> {
    try {
      await fetch('/api/satisfaction/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(response)
      });
    } catch (error) {
      console.warn('[User Satisfaction] Failed to send response to server:', error);
      // Store in localStorage as fallback
      this.storeResponseLocally(response);
    }
  }

  // Store response locally
  private storeResponseLocally(response: SatisfactionResponse): void {
    const localResponses = JSON.parse(localStorage.getItem('satisfaction-responses') || '[]');
    localResponses.push(response);

    // Keep only last 100 responses
    if (localResponses.length > 100) {
      localResponses.splice(0, localResponses.length - 100);
    }

    localStorage.setItem('satisfaction-responses', JSON.stringify(localResponses));
  }

  // Helper methods

  // Generate response ID
  private generateResponseId(): string {
    return `satisfaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate follow-up ID
  private generateFollowUpId(): string {
    return `followup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get user ID
  private getUserId(): string | undefined {
    return localStorage.getItem('user-id') || undefined;
  }

  // Get page type
  private getPageType(): string {
    const path = window.location.pathname;
    if (path === '/') return 'landing';
    if (path.includes('/beauty')) return 'beauty-services';
    if (path.includes('/fitness')) return 'fitness-services';
    if (path.includes('/booking')) return 'booking';
    if (path.includes('/admin')) return 'admin';
    if (path.includes('/blog')) return 'blog';
    return 'other';
  }

  // Get current booking step
  private getCurrentBookingStep(): string | undefined {
    const path = window.location.pathname;
    if (path.includes('/booking/step1')) return 'service-selection';
    if (path.includes('/booking/step2')) return 'time-selection';
    if (path.includes('/booking/step3')) return 'details-form';
    if (path.includes('/booking/step4')) return 'payment';
    return undefined;
  }

  // Get current service type
  private getCurrentServiceType(): string | undefined {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('service') || undefined;
  }

  // Get device type
  private getDeviceType(): string {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
  }

  // Public API methods

  // Get satisfaction analytics
  getSatisfactionAnalytics(metric?: SatisfactionMetric): SatisfactionAnalytics | Record<string, SatisfactionAnalytics> {
    if (metric) {
      return this.calculateAnalytics([metric]);
    }

    // Return analytics for all metrics
    const allMetrics = Object.values(SatisfactionMetric);
    const analytics: Record<string, SatisfactionAnalytics> = {};

    allMetrics.forEach(m => {
      analytics[m] = this.calculateAnalytics([m]);
    });

    return analytics;
  }

  // Calculate analytics for specific metrics
  private calculateAnalytics(metrics: SatisfactionMetric[]): SatisfactionAnalytics {
    const responses = this.responses.filter(r => metrics.includes(r.metric));

    if (responses.length === 0) {
      return {
        metric: metrics[0],
        totalResponses: 0,
        averageScore: 0,
        distribution: {},
        trend: { direction: 'stable', changePercentage: 0, confidence: 0 },
        sentimentAnalysis: { positive: 0, neutral: 0, negative: 0, averageConfidence: 0 },
        segmentAnalysis: { deviceType: {}, pageType: {}, trigger: {} },
        correlations: { bookingConversion: 0, repeatVisits: 0, sessionDuration: 0, errorRate: 0 },
        recentResponses: [],
        recommendations: []
      };
    }

    // Calculate basic statistics
    const totalResponses = responses.length;
    const averageScore = responses.reduce((sum, r) => sum + r.score, 0) / totalResponses;

    // Calculate distribution
    const distribution: Record<number, number> = {};
    responses.forEach(r => {
      distribution[r.score] = (distribution[r.score] || 0) + 1;
    });

    // Calculate sentiment analysis
    const sentimentAnalysis = this.calculateSentimentAnalysis(responses);

    // Calculate segment analysis
    const segmentAnalysis = this.calculateSegmentAnalysis(responses);

    // Calculate correlations
    const correlations = this.calculateCorrelations(responses);

    // Calculate trend
    const trend = this.calculateTrend(responses);

    // Generate recommendations
    const recommendations = this.generateRecommendations(responses, averageScore);

    return {
      metric: metrics[0],
      totalResponses,
      averageScore: Math.round(averageScore * 10) / 10,
      distribution,
      trend,
      sentimentAnalysis,
      segmentAnalysis,
      correlations,
      recentResponses: responses.slice(-10),
      recommendations
    };
  }

  // Calculate sentiment analysis
  private calculateSentimentAnalysis(responses: SatisfactionResponse[]): any {
    const responsesWithSentiment = responses.filter(r => r.sentimentAnalysis);

    if (responsesWithSentiment.length === 0) {
      return { positive: 0, neutral: 0, negative: 0, averageConfidence: 0 };
    }

    const total = responsesWithSentiment.length;
    const positive = responsesWithSentiment.filter(r => r.sentimentAnalysis!.sentiment === 'positive').length;
    const negative = responsesWithSentiment.filter(r => r.sentimentAnalysis!.sentiment === 'negative').length;
    const neutral = total - positive - negative;

    const averageConfidence = responsesWithSentiment.reduce((sum, r) => sum + r.sentimentAnalysis!.confidence, 0) / total;

    return {
      positive,
      neutral,
      negative,
      averageConfidence: Math.round(averageConfidence * 100) / 100
    };
  }

  // Calculate segment analysis
  private calculateSegmentAnalysis(responses: SatisfactionResponse[]): any {
    const segmentAnalysis = {
      deviceType: {},
      pageType: {},
      trigger: {}
    };

    responses.forEach(response => {
      // Device type analysis
      const deviceType = response.deviceInfo.isMobile ? 'mobile' : 'desktop';
      if (!segmentAnalysis.deviceType[deviceType]) {
        segmentAnalysis.deviceType[deviceType] = { count: 0, averageScore: 0 };
      }
      segmentAnalysis.deviceType[deviceType].count++;
      segmentAnalysis.deviceType[deviceType].averageScore += response.score;

      // Page type analysis
      const pageType = response.context.pageType;
      if (!segmentAnalysis.pageType[pageType]) {
        segmentAnalysis.pageType[pageType] = { count: 0, averageScore: 0 };
      }
      segmentAnalysis.pageType[pageType].count++;
      segmentAnalysis.pageType[pageType].averageScore += response.score;

      // Trigger analysis
      const trigger = response.trigger;
      if (!segmentAnalysis.trigger[trigger]) {
        segmentAnalysis.trigger[trigger] = { count: 0, averageScore: 0 };
      }
      segmentAnalysis.trigger[trigger].count++;
      segmentAnalysis.trigger[trigger].averageScore += response.score;
    });

    // Calculate averages
    Object.values(segmentAnalysis.deviceType).forEach(segment => {
      segment.averageScore = segment.averageScore / segment.count;
    });

    Object.values(segmentAnalysis.pageType).forEach(segment => {
      segment.averageScore = segment.averageScore / segment.count;
    });

    Object.values(segmentAnalysis.trigger).forEach(segment => {
      segment.averageScore = segment.averageScore / segment.count;
    });

    return segmentAnalysis;
  }

  // Calculate correlations
  private calculateCorrelations(responses: SatisfactionResponse[]): any {
    const bookingConversion = responses.filter(r => r.context.bookingCompleted).length / responses.length;
    const errorRate = responses.filter(r => r.context.errorOccurred).length / responses.length;

    const averageSessionDuration = responses.reduce((sum, r) => sum + r.context.sessionDuration, 0) / responses.length;
    const averageRepeatVisits = this.calculateRepeatVisitRate(responses);

    return {
      bookingConversion: Math.round(bookingConversion * 100) / 100,
      repeatVisits: Math.round(averageRepeatVisits * 100) / 100,
      sessionDuration: Math.round(averageSessionDuration / 1000), // seconds
      errorRate: Math.round(errorRate * 100) / 100
    };
  }

  // Calculate repeat visit rate
  private calculateRepeatVisitRate(responses: SatisfactionResponse[]): number {
    // This is a simplified calculation
    // In a real implementation, you'd track actual repeat visits
    return 0.15; // Placeholder
  }

  // Calculate trend
  private calculateTrend(responses: SatisfactionResponse[]): any {
    if (responses.length < 10) {
      return { direction: 'stable', changePercentage: 0, confidence: 0 };
    }

    const sortedResponses = responses.sort((a, b) => a.timestamp - b.timestamp);
    const recent = sortedResponses.slice(-Math.floor(sortedResponses.length / 2));
    const older = sortedResponses.slice(0, Math.floor(sortedResponses.length / 2));

    const recentAverage = recent.reduce((sum, r) => sum + r.score, 0) / recent.length;
    const olderAverage = older.reduce((sum, r) => sum + r.score, 0) / older.length;

    const changePercentage = ((recentAverage - olderAverage) / olderAverage) * 100;
    const confidence = Math.min(0.9, sortedResponses.length / 100);

    let direction: 'improving' | 'declining' | 'stable' = 'stable';
    if (changePercentage > 5) {
      direction = 'improving';
    } else if (changePercentage < -5) {
      direction = 'declining';
    }

    return { direction, changePercentage, confidence };
  }

  // Generate recommendations
  private generateRecommendations(responses: SatisfactionResponse[], averageScore: number): string[] {
    const recommendations: string[] = [];

    if (averageScore < 3) {
      recommendations.push('Overall satisfaction is low - review all aspects of the user experience');
    }

    // Check for patterns in low scores
    const lowScoreResponses = responses.filter(r => r.score <= 3);
    const negativeComments = lowScoreResponses.filter(r =>
      r.sentimentAnalysis?.sentiment === 'negative' ||
      (r.comment && r.comment.toLowerCase().includes('difficult'))
    );

    if (negativeComments.length > lowScoreResponses.length * 0.5) {
      recommendations.push('Focus on improving ease of use and reducing friction points');
    }

    // Check device-specific issues
    const mobileResponses = responses.filter(r => r.deviceInfo.isMobile);
    if (mobileResponses.length > 0) {
      const mobileAverage = mobileResponses.reduce((sum, r) => sum + r.score, 0) / mobileResponses.length;
      if (mobileAverage < averageScore) {
        recommendations.push('Mobile experience needs improvement - focus on mobile usability');
      }
    }

    // Check booking-specific issues
    const bookingResponses = responses.filter(r => r.context.pageType === 'booking');
    if (bookingResponses.length > 0) {
      const bookingAverage = bookingResponses.reduce((sum, r) => sum + r.score, 0) / bookingResponses.length;
      if (bookingAverage < averageScore) {
        recommendations.push('Booking process needs optimization - streamline the booking flow');
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Satisfaction levels are good - maintain current quality standards');
    }

    return recommendations;
  }

  // Get all responses
  getResponses(metric?: SatisfactionMetric): SatisfactionResponse[] {
    if (metric) {
      return this.responses.filter(r => r.metric === metric);
    }
    return [...this.responses];
  }

  // Add custom survey
  addCustomSurvey(survey: SatisfactionSurvey): void {
    this.surveys.set(survey.id, survey);
  }

  // Export data
  exportData(): any {
    return {
      responses: this.responses,
      surveys: Object.fromEntries(this.surveys),
      analytics: this.getSatisfactionAnalytics(),
      summary: {
        totalResponses: this.responses.length,
        averageScore: this.responses.length > 0 ?
          this.responses.reduce((sum, r) => sum + r.score, 0) / this.responses.length : 0,
        recentResponses: this.responses.filter(r =>
          Date.now() - r.timestamp < 86400000 // Last 24 hours
        ).length
      }
    };
  }
}

// Create and export singleton instance
export const userSatisfactionMeasurement = UserSatisfactionMeasurement.getInstance();

// Initialize automatically
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    userSatisfactionMeasurement.initialize();
  } else {
    window.addEventListener('load', () => {
      userSatisfactionMeasurement.initialize();
    });
  }
}

// Export helper functions
export const initializeUserSatisfactionMeasurement = () => userSatisfactionMeasurement.initialize();
export const getSatisfactionAnalytics = (metric?: SatisfactionMetric) =>
  userSatisfactionMeasurement.getSatisfactionAnalytics(metric);
export const getSatisfactionResponses = (metric?: SatisfactionMetric) =>
  userSatisfactionMeasurement.getResponses(metric);
export const addCustomSatisfactionSurvey = (survey: SatisfactionSurvey) =>
  userSatisfactionMeasurement.addCustomSurvey(survey);
export const exportSatisfactionData = () => userSatisfactionMeasurement.exportData();

// Export types
export { SatisfactionResponse, SentimentAnalysis, SatisfactionSurvey, SatisfactionAnalytics };