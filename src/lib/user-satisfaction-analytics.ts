/**
 * User Satisfaction Measurement and Analytics
 * NPS, CSAT, and satisfaction tracking for luxury beauty and fitness platform
 */

import { trackRUMEvent } from './rum';
import { reportMessage } from './sentry';

// Satisfaction measurement types
export enum SatisfactionType {
  NPS = 'nps',                    // Net Promoter Score
  CSAT = 'csat',                  // Customer Satisfaction
  CES = 'ces',                    // Customer Effort Score
  SERVICE_RATING = 'service_rating',
  BOOKING_EXPERIENCE = 'booking_experience',
  WEBSITE_USABILITY = 'website_usability',
  MOBILE_EXPERIENCE = 'mobile_experience',
  ACCESSIBILITY_EXPERIENCE = 'accessibility_experience',
  LUXURY_EXPERIENCE = 'luxury_experience'
}

// Satisfaction score ranges
interface SatisfactionScore {
  type: SatisfactionType;
  score: number;
  scale: number;
  normalizedScore: number; // 0-100 scale
  timestamp: number;
  context: Record<string, any>;
  userIdentifier?: string;
  sessionId: string;
}

// Survey configuration
interface SurveyConfig {
  type: SatisfactionType;
  title: string;
  description: string;
  scale: number; // 1-5, 1-10, etc.
  lowLabel: string;
  highLabel: string;
  questions: SurveyQuestion[];
  triggerConditions: TriggerCondition[];
  frequency: 'once_per_session' | 'once_per_week' | 'once_per_month' | 'custom';
  enabled: boolean;
}

// Survey question
interface SurveyQuestion {
  id: string;
  type: 'rating' | 'text' | 'multiple' | 'nps';
  text: string;
  required: boolean;
  options?: string[];
  ratingScale?: number;
}

// Trigger condition
interface TriggerCondition {
  event: string;
  parameter?: string;
  value?: any;
  delay?: number; // milliseconds
}

// User response data
interface UserResponse {
  surveyType: SatisfactionType;
  surveyId: string;
  responses: Record<string, any>;
  timestamp: number;
  timeToComplete: number;
  pageType: string;
  deviceInfo: any;
  context: Record<string, any>;
  userIdentifier?: string;
  sessionId: string;
  consentGiven: boolean;
}

// User Satisfaction Analytics Manager
export class UserSatisfactionAnalytics {
  private scores: SatisfactionScore[] = [];
  private responses: UserResponse[] = [];
  private surveyConfigs: Map<SatisfactionType, SurveyConfig> = new Map();
  private isInitialized = false;
  private sessionId: string;
  private surveyHistory: Set<string> = new Set();
  private lastSurveyTimes: Map<SatisfactionType, number> = new Map();
  private satisfactionTrends: Map<SatisfactionType, number[]> = new Map();

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeSurveyConfigs();
  }

  // Initialize satisfaction tracking
  initialize(): void {
    if (this.isInitialized) return;

    try {
      this.initializeSurveyTriggers();
      this.initializeLuxuryExperienceTracking();
      this.initializeBookingExperienceTracking();
      this.initializeMobileExperienceTracking();
      this.initializeAccessibilityExperienceTracking();
      this.initializeContinuousMonitoring();

      this.isInitialized = true;
      console.log('[User Satisfaction] User satisfaction analytics initialized');
    } catch (error) {
      console.warn('[User Satisfaction] Failed to initialize:', error);
    }
  }

  // Initialize survey configurations
  private initializeSurveyConfigs(): void {
    // NPS Survey
    this.surveyConfigs.set(SatisfactionType.NPS, {
      type: SatisfactionType.NPS,
      title: 'How likely are you to recommend our services?',
      description: 'On a scale of 0-10, how likely are you to recommend mariiaborysevych to friends or colleagues?',
      scale: 10,
      lowLabel: 'Not likely',
      highLabel: 'Very likely',
      questions: [
        {
          id: 'nps_score',
          type: 'nps',
          text: 'How likely are you to recommend our services?',
          required: true,
          ratingScale: 10
        },
        {
          id: 'nps_reason',
          type: 'text',
          text: 'What is the primary reason for your score?',
          required: false
        }
      ],
      triggerConditions: [
        { event: 'booking-completed', delay: 60000 }, // 1 minute after booking
        { event: 'page-visit', parameter: 'time_on_page', value: 300000 }, // 5 minutes on page
        { event: 'feedback-requested' }
      ],
      frequency: 'once_per_month',
      enabled: true
    });

    // CSAT Survey
    this.surveyConfigs.set(SatisfactionType.CSAT, {
      type: SatisfactionType.CSAT,
      title: 'How satisfied are you with our service?',
      description: 'Please rate your overall satisfaction with our beauty and fitness services',
      scale: 5,
      lowLabel: 'Very dissatisfied',
      highLabel: 'Very satisfied',
      questions: [
        {
          id: 'csat_score',
          type: 'rating',
          text: 'How satisfied are you with our service?',
          required: true,
          ratingScale: 5
        },
        {
          id: 'csat_experience',
          type: 'multiple',
          text: 'Which aspects of your experience did you like most?',
          required: false,
          options: ['Service quality', 'Booking process', 'Website usability', 'Customer support', 'Mobile experience', 'Value for money']
        }
      ],
      triggerConditions: [
        { event: 'booking-completed', delay: 300000 }, // 5 minutes after booking
        { event: 'support-interaction-completed', delay: 60000 },
        { event: 'service-page-visit', parameter: 'duration', value: 120000 } // 2 minutes on service page
      ],
      frequency: 'once_per_week',
      enabled: true
    });

    // CES Survey
    this.surveyConfigs.set(SatisfactionType.CES, {
      type: SatisfactionType.CES,
      title: 'How easy was it to accomplish your goal?',
      description: 'Please rate the ease of completing your booking or finding information',
      scale: 7,
      lowLabel: 'Very difficult',
      highLabel: 'Very easy',
      questions: [
        {
          id: 'ces_score',
          type: 'rating',
          text: 'How easy was it to accomplish your goal today?',
          required: true,
          ratingScale: 7
        },
        {
          id: 'ces_difficulty',
          type: 'text',
          text: 'What, if anything, made it difficult to accomplish your goal?',
          required: false
        }
      ],
      triggerConditions: [
        { event: 'booking-completed' },
        { event: 'booking-abandoned' },
        { event: 'contact-form-submitted', delay: 30000 }
      ],
      frequency: 'once_per_session',
      enabled: true
    });

    // Service Rating Survey
    this.surveyConfigs.set(SatisfactionType.SERVICE_RATING, {
      type: SatisfactionType.SERVICE_RATING,
      title: 'Rate your service experience',
      description: 'Help us improve by rating your recent service experience',
      scale: 5,
      lowLabel: 'Poor',
      highLabel: 'Excellent',
      questions: [
        {
          id: 'service_rating',
          type: 'rating',
          text: 'Rate your overall service experience',
          required: true,
          ratingScale: 5
        },
        {
          id: 'service_type',
          type: 'multiple',
          text: 'Which service type did you experience?',
          required: true,
          options: ['Beauty Services', 'Fitness Programs', 'Consultation', 'Treatment']
        },
        {
          id: 'service_feedback',
          type: 'text',
          text: 'Any specific feedback about your service?',
          required: false
        }
      ],
      triggerConditions: [
        { event: 'booking-completed', delay: 1800000 } // 30 minutes after booking
      ],
      frequency: 'once_per_month',
      enabled: true
    });

    // Booking Experience Survey
    this.surveyConfigs.set(SatisfactionType.BOOKING_EXPERIENCE, {
      type: SatisfactionType.BOOKING_EXPERIENCE,
      title: 'How was your booking experience?',
      description: 'Rate your experience with our booking process',
      scale: 5,
      lowLabel: 'Very poor',
      highLabel: 'Excellent',
      questions: [
        {
          id: 'booking_rating',
          type: 'rating',
          text: 'How would you rate the booking process?',
          required: true,
          ratingScale: 5
        },
        {
          id: 'booking_steps',
          type: 'multiple',
          text: 'Which booking steps worked well?',
          required: false,
          options: ['Service selection', 'Time slot selection', 'Information form', 'Payment process']
        }
      ],
      triggerConditions: [
        { event: 'booking-completed', delay: 60000 }
      ],
      frequency: 'once_per_session',
      enabled: true
    });

    // Website Usability Survey
    this.surveyConfigs.set(SatisfactionType.WEBSITE_USABILITY, {
      type: SatisfactionType.WEBSITE_USABILITY,
      title: 'How easy is our website to use?',
      description: 'Help us improve by rating the usability of our website',
      scale: 5,
      lowLabel: 'Very difficult',
      highLabel: 'Very easy',
      questions: [
        {
          id: 'usability_rating',
          type: 'rating',
          text: 'How easy is our website to use?',
          required: true,
          ratingScale: 5
        },
        {
          id: 'usability_issues',
          type: 'text',
          text: 'Did you encounter any difficulties?',
          required: false
        }
      ],
      triggerConditions: [
        { event: 'page-visit', parameter: 'page_count', value: 5 }, // After visiting 5 pages
        { event: 'time-on-site', value: 600000 } // 10 minutes on site
      ],
      frequency: 'once_per_week',
      enabled: true
    });

    // Mobile Experience Survey
    this.surveyConfigs.set(SatisfactionType.MOBILE_EXPERIENCE, {
      type: SatisfactionType.MOBILE_EXPERIENCE,
      title: 'How is your mobile experience?',
      description: 'Rate your experience using our services on mobile devices',
      scale: 5,
      lowLabel: 'Very poor',
      highLabel: 'Excellent',
      questions: [
        {
          id: 'mobile_rating',
          type: 'rating',
          text: 'How would you rate your mobile experience?',
          required: true,
          ratingScale: 5
        },
        {
          id: 'mobile_features',
          type: 'multiple',
          text: 'Which mobile features worked well?',
          required: false,
          options: ['Touch interactions', 'Mobile booking', 'Page speed', 'Navigation', 'Forms']
        }
      ],
      triggerConditions: [
        { event: 'mobile-session-start', delay: 120000 }, // 2 minutes into mobile session
        { event: 'mobile-booking-completed' }
      ],
      frequency: 'once_per_month',
      enabled: true
    });

    // Luxury Experience Survey
    this.surveyConfigs.set(SatisfactionType.LUXURY_EXPERIENCE, {
      type: SatisfactionType.LUXURY_EXPERIENCE,
      title: 'How was your luxury experience?',
      description: 'Rate your premium experience with our services',
      scale: 5,
      lowLabel: 'Did not meet expectations',
      highLabel: 'Exceeded expectations',
      questions: [
        {
          id: 'luxury_rating',
          type: 'rating',
          text: 'Did our services meet your luxury expectations?',
          required: true,
          ratingScale: 5
        },
        {
          id: 'luxury_aspects',
          type: 'multiple',
          text: 'Which luxury aspects did you appreciate most?',
          required: false,
          options: ['Service quality', 'Professionalism', 'Ambiance', 'Personalization', 'Attention to detail', 'Communication']
        }
      ],
      triggerConditions: [
        { event: 'premium-service-completed', delay: 1800000 }, // 30 minutes after premium service
        { event: 'luxury-package-booked' }
      ],
      frequency: 'once_per_month',
      enabled: true
    });
  }

  // Initialize survey triggers
  private initializeSurveyTriggers(): void {
    // Listen for custom events that trigger surveys
    window.addEventListener('user-action', (event: any) => {
      this.checkSurveyTriggers(event.detail);
    });

    // Set up automatic triggers based on user behavior
    this.setupBehavioralTriggers();

    // Initialize consent management
    this.initializeConsentManagement();
  }

  // Check survey triggers
  private checkSurveyTriggers(eventData: any): void {
    this.surveyConfigs.forEach((config, type) => {
      if (!config.enabled) return;

      const shouldTrigger = config.triggerConditions.some(condition =>
        this.evaluateTriggerCondition(condition, eventData)
      );

      if (shouldTrigger && this.shouldShowSurvey(type)) {
        setTimeout(() => {
          this.showSurvey(type);
        }, config.triggerConditions.find(c => this.evaluateTriggerCondition(c, eventData))?.delay || 0);
      }
    });
  }

  // Evaluate trigger condition
  private evaluateTriggerCondition(condition: TriggerCondition, eventData: any): boolean {
    if (condition.event !== eventData.event) return false;

    if (condition.parameter && condition.value !== undefined) {
      return eventData[condition.parameter] === condition.value;
    }

    return true;
  }

  // Check if survey should be shown
  private shouldShowSurvey(type: SatisfactionType): boolean {
    const config = this.surveyConfigs.get(type);
    if (!config) return false;

    // Check frequency constraints
    const lastTime = this.lastSurveyTimes.get(type) || 0;
    const now = Date.now();

    switch (config.frequency) {
      case 'once_per_session':
        return this.surveyHistory.has(`${type}_${this.sessionId}`) === false;
      case 'once_per_week':
        return (now - lastTime) > (7 * 24 * 60 * 60 * 1000);
      case 'once_per_month':
        return (now - lastTime) > (30 * 24 * 60 * 60 * 1000);
      default:
        return true;
    }
  }

  // Setup behavioral triggers
  private setupBehavioralTriggers(): void {
    // Track page visits for usability surveys
    let pageVisitCount = 0;
    let sessionStartTime = Date.now();

    const trackPageVisit = () => {
      pageVisitCount++;

      // Trigger usability survey after 5 pages
      if (pageVisitCount === 5) {
        this.checkSurveyTriggers({
          event: 'page-visit',
          page_count: pageVisitCount,
          time_on_site: Date.now() - sessionStartTime
        });
      }
    };

    // Track time on site
    setInterval(() => {
      const timeOnSite = Date.now() - sessionStartTime;

      // Trigger survey after 10 minutes
      if (timeOnSite >= 600000) {
        this.checkSurveyTriggers({
          event: 'time-on-site',
          value: timeOnSite
        });
      }
    }, 60000); // Check every minute

    // Override history to track navigation
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(trackPageVisit, 100);
    };
  }

  // Initialize consent management
  private initializeConsentManagement(): void {
    // Check for existing consent
    const consent = localStorage.getItem('analytics-consent');
    if (consent === 'granted') {
      this.enableFullTracking();
    } else if (consent === 'denied') {
      this.disableTracking();
    } else {
      // Show consent banner
      this.showConsentBanner();
    }
  }

  // Show consent banner
  private showConsentBanner(): void {
    // Create consent banner
    const banner = document.createElement('div');
    banner.id = 'satisfaction-consent-banner';
    banner.innerHTML = `
      <div style="position: fixed; bottom: 0; left: 0; right: 0; background: #8B4513; color: white; padding: 20px; z-index: 10000; font-family: system-ui, sans-serif;">
        <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px;">
          <div>
            <p style="margin: 0; font-weight: bold; margin-bottom: 5px;">Help us improve your experience</p>
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">We'd love to hear your feedback to make our services better for you.</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button id="consent-accept" style="background: white; color: #8B4513; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">Accept</button>
            <button id="consent-deny" style="background: transparent; color: white; border: 1px solid white; padding: 10px 20px; border-radius: 6px; cursor: pointer;">Decline</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Add event listeners
    document.getElementById('consent-accept')?.addEventListener('click', () => {
      localStorage.setItem('analytics-consent', 'granted');
      this.enableFullTracking();
      document.body.removeChild(banner);
    });

    document.getElementById('consent-deny')?.addEventListener('click', () => {
      localStorage.setItem('analytics-consent', 'denied');
      this.disableTracking();
      document.body.removeChild(banner);
    });
  }

  // Enable full tracking
  private enableFullTracking(): void {
    // Enable all surveys
    this.surveyConfigs.forEach(config => {
      config.enabled = true;
    });
  }

  // Disable tracking
  private disableTracking(): void {
    // Disable all surveys
    this.surveyConfigs.forEach(config => {
      config.enabled = false;
    });
  }

  // Show survey
  private showSurvey(type: SatisfactionType): void {
    const config = this.surveyConfigs.get(type);
    if (!config) return;

    const surveyId = this.generateSurveyId();
    this.createSurveyModal(config, surveyId);
  }

  // Create survey modal
  private createSurveyModal(config: SurveyConfig, surveyId: string): void {
    const modal = document.createElement('div');
    modal.id = surveyId;
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
      <div style="background: white; padding: 30px; border-radius: 12px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.2);">
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="margin: 0 0 10px 0; color: #8B4513; font-size: 24px;">${config.title}</h2>
          <p style="margin: 0; color: #666; font-size: 16px; line-height: 1.5;">${config.description}</p>
        </div>

        <form id="survey-form-${surveyId}">
          ${this.renderSurveyQuestions(config.questions, surveyId)}

          <div style="margin-top: 25px; display: flex; gap: 15px; justify-content: center;">
            <button type="button" id="survey-cancel-${surveyId}" style="padding: 12px 24px; border: 1px solid #ddd; background: white; border-radius: 8px; cursor: pointer; font-size: 16px;">Maybe later</button>
            <button type="submit" id="survey-submit-${surveyId}" style="padding: 12px 24px; background: #8B4513; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold;">Submit feedback</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Set up form handling
    this.setupSurveyForm(modal, config, surveyId);
  }

  // Render survey questions
  private renderSurveyQuestions(questions: SurveyQuestion[], surveyId: string): string {
    return questions.map(question => {
      let questionHtml = `<div style="margin-bottom: 20px;">`;
      questionHtml += `<label style="display: block; margin-bottom: 10px; font-weight: bold; color: #333;">`;
      questionHtml += `${question.text}${question.required ? ' *' : ''}</label>`;

      switch (question.type) {
        case 'rating':
        case 'nps':
          questionHtml += this.renderRatingQuestion(question, surveyId);
          break;
        case 'text':
          questionHtml += this.renderTextQuestion(question, surveyId);
          break;
        case 'multiple':
          questionHtml += this.renderMultipleQuestion(question, surveyId);
          break;
      }

      questionHtml += `</div>`;
      return questionHtml;
    }).join('');
  }

  // Render rating question
  private renderRatingQuestion(question: SurveyQuestion, surveyId: string): string {
    const scale = question.ratingScale || 5;
    const isNPS = question.type === 'nps';

    let html = '<div style="display: flex; justify-content: space-between; margin: 15px 0;">';

    for (let i = 1; i <= scale; i++) {
      html += `
        <div style="text-align: center;">
          <input type="radio" name="${question.id}" value="${i}" id="${question.id}-${i}-${surveyId}" required style="display: none;">
          <label for="${question.id}-${i}-${surveyId}" style="display: inline-block; width: 40px; height: 40px; line-height: 40px; text-align: center; border: 2px solid #ddd; border-radius: 50%; cursor: pointer; margin: 0 2px; transition: all 0.3s ease;">${i}</label>
        </div>
      `;
    }

    html += '</div>';

    // Add labels for NPS or regular scale
    if (isNPS) {
      html += '<div style="display: flex; justify-content: space-between; font-size: 12px; color: #666; margin-top: 5px;"><span>Not likely</span><span>Very likely</span></div>';
    }

    // Add styling for hover and selected states
    html += `
      <style>
        input[name="${question.id}"]:checked + label {
          background: #8B4513;
          color: white;
          border-color: #8B4513;
        }
        label[for^="${question.id}"]:hover {
          border-color: #8B4513;
          transform: scale(1.1);
        }
      </style>
    `;

    return html;
  }

  // Render text question
  private renderTextQuestion(question: SurveyQuestion, surveyId: string): string {
    const isMultiline = question.id.includes('reason') || question.id.includes('feedback') || question.id.includes('difficulty');

    if (isMultiline) {
      return `
        <textarea
          id="${question.id}-${surveyId}"
          name="${question.id}"
          rows="4"
          style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; resize: vertical; font-family: inherit;"
          placeholder="Please share your thoughts..."
          ${question.required ? 'required' : ''}
        ></textarea>
      `;
    } else {
      return `
        <input
          type="text"
          id="${question.id}-${surveyId}"
          name="${question.id}"
          style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-family: inherit;"
          placeholder="Your answer..."
          ${question.required ? 'required' : ''}
        >
      `;
    }
  }

  // Render multiple choice question
  private renderMultipleQuestion(question: SurveyQuestion, surveyId: string): string {
    const options = question.options || [];

    return `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${options.map((option, index) => `
          <label style="display: flex; align-items: center; cursor: pointer; padding: 8px; border-radius: 6px; transition: background 0.2s ease;">
            <input type="checkbox" name="${question.id}" value="${option}" id="${question.id}-${index}-${surveyId}" style="margin-right: 10px;">
            <span>${option}</span>
          </label>
        `).join('')}
      </div>
      <style>
        input[name="${question.id}"]:checked + span {
          font-weight: bold;
          color: #8B4513;
        }
        label:hover {
          background: #f5f5f5;
        }
      </style>
    `;
  }

  // Set up survey form handling
  private setupSurveyForm(modal: HTMLElement, config: SurveyConfig, surveyId: string): void {
    const form = modal.querySelector(`#survey-form-${surveyId}`) as HTMLFormElement;
    const cancelBtn = modal.querySelector(`#survey-cancel-${surveyId}`) as HTMLButtonElement;
    const submitBtn = modal.querySelector(`#survey-submit-${surveyId}`) as HTMLButtonElement;

    let startTime = Date.now();

    // Handle form submission
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.handleSurveySubmit(config, surveyId, startTime);
    });

    // Handle cancel
    cancelBtn.addEventListener('click', () => {
      this.handleSurveyCancel(surveyId);
    });

    // Handle modal close on backdrop click
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        this.handleSurveyCancel(surveyId);
      }
    });
  }

  // Handle survey submission
  private handleSurveySubmit(config: SurveyConfig, surveyId: string, startTime: number): void {
    const form = document.querySelector(`#survey-form-${surveyId}`) as HTMLFormElement;
    const formData = new FormData(form);
    const responses: Record<string, any> = {};

    // Collect form responses
    config.questions.forEach(question => {
      if (question.type === 'multiple') {
        const checkboxes = form.querySelectorAll(`input[name="${question.id}"]:checked`);
        responses[question.id] = Array.from(checkboxes).map(cb => (cb as HTMLInputElement).value);
      } else {
        responses[question.id] = formData.get(question.id);
      }
    });

    const completionTime = Date.now() - startTime;

    // Create response object
    const userResponse: UserResponse = {
      surveyType: config.type,
      surveyId: surveyId,
      responses: responses,
      timestamp: Date.now(),
      timeToComplete: completionTime,
      pageType: this.getPageType(),
      deviceInfo: this.getDeviceInfo(),
      context: {
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        url: window.location.href
      },
      userIdentifier: this.getUserIdentifier(),
      sessionId: this.sessionId,
      consentGiven: localStorage.getItem('analytics-consent') === 'granted'
    };

    // Store response
    this.responses.push(userResponse);

    // Process scores
    this.processSatisfactionScores(config, userResponse);

    // Track submission
    trackRUMEvent('satisfaction-survey-completed', {
      surveyType: config.type,
      completionTime: completionTime,
      pageType: this.getPageType(),
      deviceInfo: this.getDeviceInfo()
    });

    // Update survey history
    this.surveyHistory.add(`${config.type}_${this.sessionId}`);
    this.lastSurveyTimes.set(config.type, Date.now());

    // Send to server
    this.sendSurveyResponse(userResponse);

    // Show thank you message
    this.showSurveyThankYou(config.type, surveyId);
  }

  // Process satisfaction scores
  private processSatisfactionScores(config: SurveyConfig, response: UserResponse): void {
    config.questions.forEach(question => {
      if (question.type === 'rating' || question.type === 'nps') {
        const score = parseInt(response.responses[question.id]);
        if (!isNaN(score)) {
          const normalizedScore = this.normalizeScore(score, config.scale, question.type);

          const satisfactionScore: SatisfactionScore = {
            type: config.type,
            score: score,
            scale: config.scale,
            normalizedScore: normalizedScore,
            timestamp: response.timestamp,
            context: {
              questionId: question.id,
              questionText: question.text,
              pageType: response.pageType,
              deviceInfo: response.deviceInfo
            },
            userIdentifier: response.userIdentifier,
            sessionId: response.sessionId
          };

          this.scores.push(satisfactionScore);

          // Update trends
          if (!this.satisfactionTrends.has(config.type)) {
            this.satisfactionTrends.set(config.type, []);
          }
          this.satisfactionTrends.get(config.type)!.push(normalizedScore);

          // Track score
          trackRUMEvent('satisfaction-score-recorded', {
            type: config.type,
            score: score,
            normalizedScore: normalizedScore,
            pageType: response.pageType
          });
        }
      }
    });
  }

  // Normalize score to 0-100 scale
  private normalizeScore(score: number, scale: number, questionType: string): number {
    if (questionType === 'nps') {
      // NPS: 0-6 -> 0-40, 7-8 -> 50-60, 9-10 -> 80-100
      if (score <= 6) return Math.round((score / 6) * 40);
      if (score <= 8) return Math.round(50 + ((score - 7) / 2) * 10);
      return Math.round(80 + ((score - 9) / 1) * 20);
    } else {
      // Regular scale: linear interpolation
      return Math.round((score / scale) * 100);
    }
  }

  // Handle survey cancellation
  private handleSurveyCancel(surveyId: string): void {
    const modal = document.getElementById(surveyId);
    if (modal) {
      document.body.removeChild(modal);
    }

    // Track cancellation
    trackRUMEvent('satisfaction-survey-cancelled', {
      surveyId: surveyId,
      pageType: this.getPageType()
    });
  }

  // Show thank you message
  private showSurveyThankYou(type: SatisfactionType, surveyId: string): void {
    const modal = document.getElementById(surveyId);
    if (!modal) return;

    // Update modal content
    const content = modal.querySelector('div > div') as HTMLElement;
    if (content) {
      content.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
          <div style="font-size: 48px; margin-bottom: 20px;">🙏</div>
          <h2 style="margin: 0 0 10px 0; color: #8B4513; font-size: 24px;">Thank you for your feedback!</h2>
          <p style="margin: 0 0 25px 0; color: #666; font-size: 16px; line-height: 1.5;">Your input helps us provide the best luxury beauty and fitness experience.</p>
          <button onclick="this.closest('#${surveyId}').remove()" style="padding: 12px 24px; background: #8B4513; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold;">Close</button>
        </div>
      `;

      // Auto-close after 3 seconds
      setTimeout(() => {
        const modal = document.getElementById(surveyId);
        if (modal) {
          document.body.removeChild(modal);
        }
      }, 3000);
    }
  }

  // Send survey response to server
  private async sendSurveyResponse(response: UserResponse): Promise<void> {
    try {
      await fetch('/api/satisfaction-survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(response)
      });
    } catch (error) {
      console.warn('Failed to send survey response:', error);
    }
  }

  // Initialize luxury experience tracking
  private initializeLuxuryExperienceTracking(): void {
    // Track premium service interactions
    this.trackPremiumServiceInteractions();

    // Track luxury package bookings
    this.trackLuxuryPackageBookings();

    // Monitor high-value client satisfaction
    this.monitorHighValueClientSatisfaction();
  }

  // Track premium service interactions
  private trackPremiumServiceInteractions(): void {
    // Monitor interactions with premium services
    const premiumLinks = document.querySelectorAll('[data-premium="true"], [data-luxury="true"]');

    premiumLinks.forEach(link => {
      link.addEventListener('click', () => {
        // Track premium service interest
        trackRUMEvent('premium-service-interaction', {
          timestamp: Date.now(),
          serviceType: (link as HTMLElement).dataset.serviceType,
          pageType: this.getPageType()
        });

        // Consider showing luxury experience survey
        setTimeout(() => {
          this.checkSurveyTriggers({
            event: 'premium-service-interaction'
          });
        }, 300000); // 5 minutes later
      });
    });
  }

  // Track luxury package bookings
  private trackLuxuryPackageBookings(): void {
    // Listen for luxury package completion
    window.addEventListener('luxury-package-completed', () => {
      setTimeout(() => {
        this.checkSurveyTriggers({
          event: 'luxury-package-booked'
        });
      }, 1800000); // 30 minutes after completion
    });
  }

  // Monitor high-value client satisfaction
  private monitorHighValueClientSatisfaction(): void {
    // Track clients who book high-value services
    window.addEventListener('high-value-booking-completed', (event: any) => {
      const bookingData = event.detail;

      // High-value clients get priority satisfaction tracking
      trackRUMEvent('high-value-client-satisfaction', {
        timestamp: Date.now(),
        bookingValue: bookingData.value,
        serviceType: bookingData.serviceType,
        clientId: bookingData.clientId
      });

      // Schedule premium satisfaction survey
      setTimeout(() => {
        this.showSurvey(SatisfactionType.LUXURY_EXPERIENCE);
      }, 3600000); // 1 hour after high-value booking
    });
  }

  // Initialize booking experience tracking
  private initializeBookingExperienceTracking(): void {
    // Track booking completion events
    window.addEventListener('booking-completed', () => {
      setTimeout(() => {
        this.checkSurveyTriggers({
          event: 'booking-completed'
        });
      }, 60000); // 1 minute after booking
    });

    // Track booking abandonment
    window.addEventListener('booking-abandoned', (event: any) => {
      const abandonmentData = event.detail;

      trackRUMEvent('booking-abandonment-satisfaction', {
        timestamp: Date.now(),
        abandonedAtStep: abandonmentData.step,
        timeInFunnel: abandonmentData.timeInFunnel,
        pageType: this.getPageType()
      });

      // Consider showing CES survey for abandoned bookings
      setTimeout(() => {
        this.showSurvey(SatisfactionType.CES);
      }, 30000); // 30 seconds after abandonment
    });
  }

  // Initialize mobile experience tracking
  private initializeMobileExperienceTracking(): void {
    // Check if user is on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      // Track mobile session start
      trackRUMEvent('mobile-session-start', {
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        deviceType: this.getMobileDeviceType()
      });

      // Consider showing mobile experience survey
      setTimeout(() => {
        this.checkSurveyTriggers({
          event: 'mobile-session-start'
        });
      }, 120000); // 2 minutes into mobile session
    }
  }

  // Initialize accessibility experience tracking
  private initializeAccessibilityExperienceTracking(): void {
    // Monitor for assistive technology usage
    let screenReaderDetected = false;
    let keyboardNavigationDetected = false;

    // Detect screen reader usage
    if ('speechSynthesis' in window) {
      screenReaderDetected = true;
    }

    // Detect keyboard navigation
    document.addEventListener('keydown', () => {
      keyboardNavigationDetected = true;
    }, { once: true });

    // If assistive technology detected, consider accessibility survey
    setTimeout(() => {
      if (screenReaderDetected || keyboardNavigationDetected) {
        trackRUMEvent('assistive-technology-detected', {
          timestamp: Date.now(),
          screenReader: screenReaderDetected,
          keyboardNavigation: keyboardNavigationDetected
        });

        // Could trigger accessibility experience survey here
      }
    }, 30000);
  }

  // Initialize continuous monitoring
  private initializeContinuousMonitoring(): void {
    // Monitor satisfaction trends
    setInterval(() => {
      this.analyzeSatisfactionTrends();
    }, 300000); // Every 5 minutes

    // Monitor for satisfaction alerts
    setInterval(() => {
      this.checkSatisfactionAlerts();
    }, 60000); // Every minute
  }

  // Analyze satisfaction trends
  private analyzeSatisfactionTrends(): void {
    this.satisfactionTrends.forEach((scores, type) => {
      if (scores.length < 5) return; // Need at least 5 data points

      const recentScores = scores.slice(-10); // Last 10 scores
      const avgRecent = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;

      const previousScores = scores.slice(-20, -10); // Previous 10 scores
      const avgPrevious = previousScores.length > 0
        ? previousScores.reduce((sum, score) => sum + score, 0) / previousScores.length
        : avgRecent;

      const trend = avgRecent - avgPrevious;

      trackRUMEvent('satisfaction-trend-analysis', {
        type: type,
        currentAverage: avgRecent,
        previousAverage: avgPrevious,
        trend: trend,
        sampleSize: recentScores.length,
        timestamp: Date.now()
      });

      // Alert on negative trends
      if (trend < -10 && avgRecent < 70) {
        reportMessage(`Negative satisfaction trend detected: ${type}`, 'warning', {
          type: type,
          currentAverage: avgRecent,
          trend: trend
        });
      }
    });
  }

  // Check satisfaction alerts
  private checkSatisfactionAlerts(): void {
    // Check for very low recent scores
    const recentTime = Date.now() - (24 * 60 * 60 * 1000); // Last 24 hours
    const recentScores = this.scores.filter(score => score.timestamp > recentTime);

    // Group by type
    const scoresByType = new Map<SatisfactionType, number[]>();
    recentScores.forEach(score => {
      if (!scoresByType.has(score.type)) {
        scoresByType.set(score.type, []);
      }
      scoresByType.get(score.type)!.push(score.normalizedScore);
    });

    // Check for low scores
    scoresByType.forEach((scores, type) => {
      if (scores.length >= 3) { // At least 3 responses
        const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;

        if (average < 50) {
          reportMessage(`Very low satisfaction detected: ${type}`, 'error', {
            type: type,
            average: average,
            responseCount: scores.length,
            timeRange: '24 hours'
          });
        }
      }
    });
  }

  // Helper methods

  private generateSessionId(): string {
    return `sat_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSurveyId(): string {
    return `survey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getPageType(): string {
    const path = window.location.pathname;
    if (path.includes('/booking')) return 'booking';
    if (path.includes('/beauty')) return 'beauty-services';
    if (path.includes('/fitness')) return 'fitness-services';
    if (path.includes('/admin')) return 'admin';
    if (path.includes('/blog')) return 'blog';
    if (path === '/') return 'landing';
    return 'other';
  }

  private getDeviceInfo(): any {
    return {
      userAgent: navigator.userAgent,
      isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
      deviceMemory: (navigator as any).deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency,
      connection: (navigator as any).connection?.effectiveType || 'unknown',
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`
    };
  }

  private getMobileDeviceType(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('iphone')) return 'iPhone';
    if (userAgent.includes('ipad')) return 'iPad';
    if (userAgent.includes('android')) {
      return userAgent.includes('mobile') ? 'Android Phone' : 'Android Tablet';
    }
    return 'Unknown Mobile';
  }

  private getUserIdentifier(): string | undefined {
    return localStorage.getItem('user_id') || undefined;
  }

  // Public API methods

  // Trigger satisfaction survey manually
  triggerSatisfactionSurvey(type: SatisfactionType, context?: any): void {
    const consent = localStorage.getItem('analytics-consent');
    if (consent !== 'granted') {
      console.log('Survey not triggered - consent not granted');
      return;
    }

    // Add context to event data
    const eventData = {
      event: 'manual-trigger',
      ...context
    };

    this.checkSurveyTriggers(eventData);
  }

  // Record satisfaction score directly
  recordSatisfactionScore(type: SatisfactionType, score: number, context?: any): void {
    const config = this.surveyConfigs.get(type);
    if (!config) return;

    const normalizedScore = this.normalizeScore(score, config.scale, 'rating');

    const satisfactionScore: SatisfactionScore = {
      type: type,
      score: score,
      scale: config.scale,
      normalizedScore: normalizedScore,
      timestamp: Date.now(),
      context: context || {},
      userIdentifier: this.getUserIdentifier(),
      sessionId: this.sessionId
    };

    this.scores.push(satisfactionScore);

    // Update trends
    if (!this.satisfactionTrends.has(type)) {
      this.satisfactionTrends.set(type, []);
    }
    this.satisfactionTrends.get(type)!.push(normalizedScore);

    trackRUMEvent('satisfaction-score-recorded', {
      type: type,
      score: score,
      normalizedScore: normalizedScore,
      manual: true
    });
  }

  // Get satisfaction analytics
  getSatisfactionAnalytics(): any {
    const now = Date.now();
    const dayAgo = now - (24 * 60 * 60 * 1000);
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const monthAgo = now - (30 * 24 * 60 * 60 * 1000);

    // Filter scores by time period
    const lastDayScores = this.scores.filter(score => score.timestamp > dayAgo);
    const lastWeekScores = this.scores.filter(score => score.timestamp > weekAgo);
    const lastMonthScores = this.scores.filter(score => score.timestamp > monthAgo);

    return {
      totalResponses: this.responses.length,
      totalScores: this.scores.length,
      scoresByType: this.getScoresByType(),
      trendsByType: this.getTrendsByType(),
      recentPerformance: {
        lastDay: this.calculatePeriodStats(lastDayScores),
        lastWeek: this.calculatePeriodStats(lastWeekScores),
        lastMonth: this.calculatePeriodStats(lastMonthScores)
      },
      surveyPerformance: {
        completionRates: this.getSurveyCompletionRates(),
        averageCompletionTimes: this.getAverageCompletionTimes(),
        responseRates: this.getResponseRates()
      },
      deviceBreakdown: this.getDeviceBreakdown(),
      pageTypeBreakdown: this.getPageTypeBreakdown()
    };
  }

  // Get scores by type
  private getScoresByType(): Record<string, any> {
    const scoresByType: Record<string, any> = {};

    this.scores.forEach(score => {
      if (!scoresByType[score.type]) {
        scoresByType[score.type] = [];
      }
      scoresByType[score.type].push(score.normalizedScore);
    });

    // Calculate statistics for each type
    Object.keys(scoresByType).forEach(type => {
      const scores = scoresByType[type];
      scoresByType[type] = {
        count: scores.length,
        average: scores.reduce((sum, score) => sum + score, 0) / scores.length,
        min: Math.min(...scores),
        max: Math.max(...scores),
        median: this.calculateMedian(scores),
        trend: this.calculateTrend(scores)
      };
    });

    return scoresByType;
  }

  // Get trends by type
  private getTrendsByType(): Record<string, any> {
    const trendsByType: Record<string, any> = {};

    this.satisfactionTrends.forEach((scores, type) => {
      if (scores.length >= 2) {
        const recentScores = scores.slice(-10);
        const olderScores = scores.slice(-20, -10);

        const recentAvg = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
        const olderAvg = olderScores.length > 0
          ? olderScores.reduce((sum, score) => sum + score, 0) / olderScores.length
          : recentAvg;

        trendsByType[type] = {
          current: recentAvg,
          trend: recentAvg - olderAvg,
          direction: (recentAvg - olderAvg) > 5 ? 'improving' : (recentAvg - olderAvg) < -5 ? 'declining' : 'stable',
          sampleSize: recentScores.length
        };
      }
    });

    return trendsByType;
  }

  // Calculate period statistics
  private calculatePeriodStats(scores: SatisfactionScore[]): any {
    if (scores.length === 0) return null;

    const values = scores.map(score => score.normalizedScore);
    return {
      count: scores.length,
      average: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      median: this.calculateMedian(values)
    };
  }

  // Calculate median
  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  // Calculate trend
  private calculateTrend(scores: number[]): number {
    if (scores.length < 2) return 0;

    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));

    const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;

    return secondAvg - firstAvg;
  }

  // Get survey completion rates
  private getSurveyCompletionRates(): Record<string, number> {
    // This would require tracking survey displays vs completions
    // For now, return estimated rates
    const rates: Record<string, number> = {};

    this.surveyConfigs.forEach((config, type) => {
      const surveyResponses = this.responses.filter(r => r.surveyType === type);
      const estimatedShows = this.surveyHistory.size; // This is an approximation

      rates[type] = estimatedShows > 0 ? (surveyResponses.length / estimatedShows) * 100 : 0;
    });

    return rates;
  }

  // Get average completion times
  private getAverageCompletionTimes(): Record<string, number> {
    const times: Record<string, number[]> = {};

    this.responses.forEach(response => {
      if (!times[response.surveyType]) {
        times[response.surveyType] = [];
      }
      times[response.surveyType].push(response.timeToComplete);
    });

    const averages: Record<string, number> = {};
    Object.keys(times).forEach(type => {
      const timeArray = times[type];
      averages[type] = timeArray.reduce((sum, time) => sum + time, 0) / timeArray.length;
    });

    return averages;
  }

  // Get response rates
  private getResponseRates(): Record<string, number> {
    const rates: Record<string, number> = {};

    this.surveyConfigs.forEach((config, type) => {
      const responses = this.responses.filter(r => r.surveyType === type);
      const totalOpportunities = this.estimateSurveyOpportunities(type);

      rates[type] = totalOpportunities > 0 ? (responses.length / totalOpportunities) * 100 : 0;
    });

    return rates;
  }

  // Estimate survey opportunities (simplified)
  private estimateSurveyOpportunities(type: SatisfactionType): number {
    // This is a simplified estimation - in practice, you'd track actual survey displays
    const config = this.surveyConfigs.get(type);
    if (!config) return 0;

    // Estimate based on trigger events and frequency
    let opportunities = 0;

    switch (type) {
      case SatisfactionType.NPS:
        opportunities = Math.floor(this.responses.filter(r => r.surveyType === SatisfactionType.BOOKING_EXPERIENCE).length * 0.3);
        break;
      case SatisfactionType.CSAT:
        opportunities = Math.floor(this.responses.filter(r => r.surveyType === SatisfactionType.BOOKING_EXPERIENCE).length * 0.5);
        break;
      default:
        opportunities = this.responses.filter(r => r.surveyType === type).length * 2;
    }

    return Math.max(opportunities, this.responses.filter(r => r.surveyType === type).length);
  }

  // Get device breakdown
  private getDeviceBreakdown(): Record<string, any> {
    const deviceStats: Record<string, { count: number; averageScore: number }> = {};

    this.scores.forEach(score => {
      const deviceType = score.context?.deviceInfo?.isMobile ? 'mobile' : 'desktop';

      if (!deviceStats[deviceType]) {
        deviceStats[deviceType] = { count: 0, averageScore: 0 };
      }

      deviceStats[deviceType].count++;
      deviceStats[deviceType].averageScore += score.normalizedScore;
    });

    // Calculate averages
    Object.keys(deviceStats).forEach(device => {
      deviceStats[device].averageScore = deviceStats[device].averageScore / deviceStats[device].count;
    });

    return deviceStats;
  }

  // Get page type breakdown
  private getPageTypeBreakdown(): Record<string, any> {
    const pageStats: Record<string, { count: number; averageScore: number }> = {};

    this.scores.forEach(score => {
      const pageType = score.context?.pageType || 'unknown';

      if (!pageStats[pageType]) {
        pageStats[pageType] = { count: 0, averageScore: 0 };
      }

      pageStats[pageType].count++;
      pageStats[pageType].averageScore += score.normalizedScore;
    });

    // Calculate averages
    Object.keys(pageStats).forEach(page => {
      pageStats[page].averageScore = pageStats[page].averageScore / pageStats[page].count;
    });

    return pageStats;
  }

  // Get detailed satisfaction report
  getSatisfactionReport(): any {
    return {
      summary: this.getSatisfactionAnalytics(),
      detailedScores: this.scores.map(score => ({
        type: score.type,
        score: score.score,
        normalizedScore: score.normalizedScore,
        timestamp: score.timestamp,
        context: score.context
      })),
      detailedResponses: this.responses.map(response => ({
        type: response.surveyType,
        responses: response.responses,
        timestamp: response.timestamp,
        timeToComplete: response.timeToComplete,
        pageType: response.pageType,
        deviceInfo: response.deviceInfo
      })),
      recommendations: this.generateSatisfactionRecommendations()
    };
  }

  // Generate satisfaction recommendations
  private generateSatisfactionRecommendations(): string[] {
    const recommendations: string[] = [];
    const analytics = this.getSatisfactionAnalytics();

    // Analyze scores by type
    Object.entries(analytics.scoresByType).forEach(([type, stats]) => {
      if (stats.average < 70) {
        switch (type) {
          case SatisfactionType.NPS:
            recommendations.push('Focus on improving customer loyalty and advocacy programs');
            break;
          case SatisfactionType.CSAT:
            recommendations.push('Address overall service quality issues and customer satisfaction gaps');
            break;
          case SatisfactionType.CES:
            recommendations.push('Simplify user processes and reduce customer effort');
            break;
          case SatisfactionType.MOBILE_EXPERIENCE:
            recommendations.push('Optimize mobile user experience and touch interactions');
            break;
          case SatisfactionType.BOOKING_EXPERIENCE:
            recommendations.push('Streamline booking process and reduce friction points');
            break;
          case SatisfactionType.LUXURY_EXPERIENCE:
            recommendations.push('Enhance premium service elements and luxury perception');
            break;
        }
      }

      if (stats.trend < -5) {
        recommendations.push(`Investigate declining satisfaction in ${type} - implement improvement measures`);
      }
    });

    // Device-specific recommendations
    const mobileAvg = analytics.deviceBreakdown.mobile?.averageScore || 0;
    const desktopAvg = analytics.deviceBreakdown.desktop?.averageScore || 0;

    if (mobileAvg > 0 && desktopAvg > 0 && mobileAvg < desktopAvg - 10) {
      recommendations.push('Mobile experience needs improvement compared to desktop');
    }

    // Page-specific recommendations
    Object.entries(analytics.pageTypeBreakdown).forEach(([pageType, stats]) => {
      if (stats.average < 65) {
        recommendations.push(`Improve user experience on ${pageType} pages`);
      }
    });

    return recommendations;
  }

  // Export data
  exportData(): any {
    return {
      scores: this.scores,
      responses: this.responses,
      trends: Object.fromEntries(this.satisfactionTrends),
      analytics: this.getSatisfactionAnalytics(),
      exportedAt: Date.now()
    };
  }

  // Clear data
  clearData(): void {
    this.scores = [];
    this.responses = [];
    this.satisfactionTrends.clear();
    this.surveyHistory.clear();
    this.lastSurveyTimes.clear();
  }
}

// Create and export singleton instance
export const userSatisfactionAnalytics = new UserSatisfactionAnalytics();

// Initialize automatically
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    userSatisfactionAnalytics.initialize();
  } else {
    window.addEventListener('load', () => {
      userSatisfactionAnalytics.initialize();
    });
  }
}

// Export helper functions
export const initializeUserSatisfactionAnalytics = () => userSatisfactionAnalytics.initialize();
export const triggerSatisfactionSurvey = (type: SatisfactionType, context?: any) =>
  userSatisfactionAnalytics.triggerSatisfactionSurvey(type, context);
export const recordSatisfactionScore = (type: SatisfactionType, score: number, context?: any) =>
  userSatisfactionAnalytics.recordSatisfactionScore(type, score, context);
export const getSatisfactionAnalytics = () => userSatisfactionAnalytics.getSatisfactionAnalytics();
export const getSatisfactionReport = () => userSatisfactionAnalytics.getSatisfactionReport();
export const exportSatisfactionData = () => userSatisfactionAnalytics.exportData();