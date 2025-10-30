/**
 * User Journey Analytics for Beauty and Fitness Booking Platform
 * Tracks complete booking journeys, drop-off points, and conversion patterns
 */

import { trackRUMEvent, getRUMMetrics } from './rum';
import { reportMessage } from './sentry';

// Journey definitions for the booking funnel
interface JourneyStep {
  id: string;
  name: string;
  path: string;
  type: 'entry' | 'progress' | 'conversion' | 'exit';
  category: 'booking' | 'browsing' | 'content' | 'admin';
  critical: boolean;
  estimatedTime?: number;
}

interface JourneyDefinition {
  id: string;
  name: string;
  description: string;
  steps: JourneyStep[];
  conversionGoal: string;
  luxuryExperience: boolean;
}

// Define critical user journeys
const JOURNEYS: JourneyDefinition[] = [
  {
    id: 'beauty-booking-funnel',
    name: 'Beauty Service Booking Journey',
    description: 'Complete booking journey for beauty services',
    luxuryExperience: true,
    conversionGoal: 'booking-confirmation',
    steps: [
      { id: 'landing', name: 'Landing Page', path: '/', type: 'entry', category: 'browsing', critical: true },
      { id: 'beauty-services', name: 'Beauty Services', path: '/beauty', type: 'progress', category: 'browsing', critical: true },
      { id: 'service-detail', name: 'Service Detail', path: '/beauty/', type: 'progress', category: 'browsing', critical: true, estimatedTime: 30000 },
      { id: 'booking-step1', name: 'Service Selection', path: '/booking/step1', type: 'progress', category: 'booking', critical: true, estimatedTime: 60000 },
      { id: 'booking-step2', name: 'Time Selection', path: '/booking/step2', type: 'progress', category: 'booking', critical: true, estimatedTime: 45000 },
      { id: 'booking-step3', name: 'Details Form', path: '/booking/step3', type: 'progress', category: 'booking', critical: true, estimatedTime: 90000 },
      { id: 'booking-step4', name: 'Payment', path: '/booking/step4', type: 'progress', category: 'booking', critical: true, estimatedTime: 120000 },
      { id: 'booking-confirmation', name: 'Booking Confirmation', path: '/booking/confirmation', type: 'conversion', category: 'booking', critical: true }
    ]
  },
  {
    id: 'fitness-booking-funnel',
    name: 'Fitness Program Booking Journey',
    description: 'Complete booking journey for fitness programs',
    luxuryExperience: true,
    conversionGoal: 'booking-confirmation',
    steps: [
      { id: 'landing', name: 'Landing Page', path: '/', type: 'entry', category: 'browsing', critical: true },
      { id: 'fitness-services', name: 'Fitness Programs', path: '/fitness', type: 'progress', category: 'browsing', critical: true },
      { id: 'program-detail', name: 'Program Detail', path: '/fitness/', type: 'progress', category: 'browsing', critical: true, estimatedTime: 45000 },
      { id: 'booking-step1', name: 'Program Selection', path: '/booking/step1', type: 'progress', category: 'booking', critical: true, estimatedTime: 60000 },
      { id: 'booking-step2', name: 'Schedule Selection', path: '/booking/step2', type: 'progress', category: 'booking', critical: true, estimatedTime: 45000 },
      { id: 'booking-step3', name: 'Client Details', path: '/booking/step3', type: 'progress', category: 'booking', critical: true, estimatedTime: 90000 },
      { id: 'booking-step4', name: 'Payment', path: '/booking/step4', type: 'progress', category: 'booking', critical: true, estimatedTime: 120000 },
      { id: 'booking-confirmation', name: 'Booking Confirmation', path: '/booking/confirmation', type: 'conversion', category: 'booking', critical: true }
    ]
  },
  {
    id: 'content-exploration',
    name: 'Content Exploration Journey',
    description: 'Users exploring blog and educational content',
    luxuryExperience: false,
    conversionGoal: 'newsletter-signup',
    steps: [
      { id: 'landing', name: 'Landing Page', path: '/', type: 'entry', category: 'browsing', critical: false },
      { id: 'blog', name: 'Blog', path: '/blog', type: 'progress', category: 'content', critical: false },
      { id: 'blog-post', name: 'Blog Post', path: '/blog/', type: 'progress', category: 'content', critical: false, estimatedTime: 180000 },
      { id: 'newsletter-signup', name: 'Newsletter Signup', path: null, type: 'conversion', category: 'content', critical: false }
    ]
  }
];

// User Journey Analytics Class
export class UserJourneyAnalytics {
  private currentJourney: JourneyDefinition | null = null;
  private journeySteps: JourneyStep[] = [];
  private stepTimings: Map<string, number> = new Map();
  private journeyStartTime: number = 0;
  private sessionData: any = {};
  private isInitialized = false;

  constructor() {
    this.initializeSessionData();
  }

  // Initialize journey tracking
  initialize(): void {
    if (this.isInitialized) return;

    try {
      this.initializeJourneyDetection();
      this.initializeStepTracking();
      this.initializeAbandonmentTracking();
      this.initializeConversionTracking();
      this.initializeLanguageSwitchingTracking();

      this.isInitialized = true;
      console.log('[User Journey Analytics] Journey tracking initialized');
    } catch (error) {
      console.warn('[User Journey Analytics] Failed to initialize:', error);
    }
  }

  // Initialize session data
  private initializeSessionData(): void {
    this.sessionData = {
      sessionId: this.generateSessionId(),
      startTime: Date.now(),
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      language: navigator.language,
      landingPage: window.location.pathname,
      isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
      consentGiven: localStorage.getItem('analytics-consent') === 'true'
    };
  }

  // Initialize journey detection
  private initializeJourneyDetection(): void {
    // Detect journey based on current path
    this.detectCurrentJourney();

    // Monitor route changes
    this.monitorRouteChanges();

    // Monitor service category preferences
    this.monitorServicePreferences();
  }

  // Detect current journey based on path
  private detectCurrentJourney(): void {
    const currentPath = window.location.pathname;

    for (const journey of JOURNEYS) {
      const matchingStep = journey.steps.find(step =>
        step.path && (currentPath === step.path || currentPath.startsWith(step.path))
      );

      if (matchingStep) {
        this.setCurrentJourney(journey);
        this.recordStepVisit(matchingStep);
        break;
      }
    }
  }

  // Set current journey
  private setCurrentJourney(journey: JourneyDefinition): void {
    if (this.currentJourney?.id !== journey.id) {
      // New journey detected
      if (this.currentJourney) {
        this.trackJourneyExit(this.currentJourney);
      }

      this.currentJourney = journey;
      this.journeySteps = [];
      this.stepTimings.clear();
      this.journeyStartTime = Date.now();

      trackRUMEvent('journey-started', {
        journeyId: journey.id,
        journeyName: journey.name,
        luxuryExperience: journey.luxuryExperience,
        sessionData: this.sessionData
      });
    }
  }

  // Monitor route changes
  private monitorRouteChanges(): void {
    let lastPath = window.location.pathname;

    const checkPathChange = () => {
      const currentPath = window.location.pathname;

      if (currentPath !== lastPath) {
        lastPath = currentPath;

        // Detect if this is a new journey
        this.detectCurrentJourney();

        // Track page transitions
        this.trackPageTransition(lastPath, currentPath);
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

  // Track page transitions
  private trackPageTransition(from: string, to: string): void {
    const transition = {
      from: from,
      to: to,
      timestamp: Date.now(),
      journeyId: this.currentJourney?.id,
      sessionDuration: Date.now() - this.sessionData.startTime
    };

    trackRUMEvent('page-transition', transition);

    // Check for abandonment patterns
    this.checkForAbandonment(from, to);
  }

  // Check for abandonment patterns
  private checkForAbandonment(from: string, to: string): void {
    if (!this.currentJourney) return;

    // Check if user is leaving booking funnel
    if (from.includes('/booking') && !to.includes('/booking')) {
      const lastStep = this.journeySteps[this.journeySteps.length - 1];

      trackRUMEvent('booking-funnel-abandonment', {
        journeyId: this.currentJourney.id,
        abandonedAtStep: lastStep?.id || 'unknown',
        timeInJourney: Date.now() - this.journeyStartTime,
        destinationPath: to,
        sessionData: this.sessionData
      });

      // Report abandonment if in critical booking steps
      if (lastStep?.critical && this.currentJourney.luxuryExperience) {
        reportMessage('Critical booking funnel abandonment detected', 'warning', {
          journeyId: this.currentJourney.id,
          abandonedAtStep: lastStep.id,
          timeInJourney: Date.now() - this.journeyStartTime,
          destinationPath: to
        });
      }
    }
  }

  // Monitor service category preferences
  private monitorServicePreferences(): void {
    // Track service category interactions
    const serviceLinks = document.querySelectorAll('a[href*="/beauty"], a[href*="/fitness"]');

    serviceLinks.forEach(link => {
      link.addEventListener('click', (event) => {
        const target = event.target as HTMLAnchorElement;
        const category = target.href.includes('/beauty') ? 'beauty' : 'fitness';

        trackRUMEvent('service-category-preference', {
          category: category,
          sourcePath: window.location.pathname,
          timestamp: Date.now()
        });
      });
    });
  }

  // Initialize step tracking
  private initializeStepTracking(): void {
    // Track time spent on each step
    let currentStep: JourneyStep | null = null;
    let stepStartTime = 0;

    const trackStepDuration = () => {
      if (currentStep && stepStartTime > 0) {
        const duration = Date.now() - stepStartTime;

        this.stepTimings.set(currentStep.id, duration);

        trackRUMEvent('step-duration', {
          stepId: currentStep.id,
          stepName: currentStep.name,
          duration: duration,
          estimatedTime: currentStep.estimatedTime,
          withinExpectedTime: currentStep.estimatedTime ? duration <= currentStep.estimatedTime : true,
          journeyId: this.currentJourney?.id
        });

        // Check for unusually long/short step times
        if (currentStep.estimatedTime) {
          const ratio = duration / currentStep.estimatedTime;
          if (ratio > 2) {
            reportMessage(`Unusually long time spent on ${currentStep.name}`, 'warning', {
              stepId: currentStep.id,
              duration: duration,
              estimatedTime: currentStep.estimatedTime,
              ratio: ratio
            });
          } else if (ratio < 0.3 && currentStep.critical) {
            reportMessage(`Unusually short time spent on critical step ${currentStep.name}`, 'warning', {
              stepId: currentStep.id,
              duration: duration,
              estimatedTime: currentStep.estimatedTime,
              ratio: ratio
            });
          }
        }
      }
    };

    // Monitor for step changes
    setInterval(() => {
      const newStep = this.getCurrentStep();

      if (newStep !== currentStep) {
        trackStepDuration();

        currentStep = newStep;
        stepStartTime = Date.now();

        if (currentStep) {
          this.recordStepVisit(currentStep);
        }
      }
    }, 1000);
  }

  // Get current step based on path
  private getCurrentStep(): JourneyStep | null {
    if (!this.currentJourney) return null;

    const currentPath = window.location.pathname;
    return this.currentJourney.steps.find(step =>
      step.path && (currentPath === step.path || currentPath.startsWith(step.path))
    ) || null;
  }

  // Record step visit
  private recordStepVisit(step: JourneyStep): void {
    if (!this.journeySteps.find(s => s.id === step.id)) {
      this.journeySteps.push(step);

      trackRUMEvent('step-visit', {
        stepId: step.id,
        stepName: step.name,
        stepType: step.type,
        stepCategory: step.category,
        critical: step.critical,
        journeyId: this.currentJourney?.id,
        timeInJourney: Date.now() - this.journeyStartTime
      });
    }
  }

  // Initialize abandonment tracking
  private initializeAbandonmentTracking(): void {
    // Track inactivity abandonment
    let inactivityTimer: NodeJS.Timeout;
    let lastActivity = Date.now();

    const resetInactivityTimer = () => {
      lastActivity = Date.now();
      clearTimeout(inactivityTimer);

      if (this.currentJourney && this.currentJourney.steps.some(s => s.category === 'booking')) {
        inactivityTimer = setTimeout(() => {
          this.trackInactivityAbandonment();
        }, 10 * 60 * 1000); // 10 minutes
      }
    };

    // Track user activity
    ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'].forEach(event => {
      document.addEventListener(event, resetInactivityTimer);
    });

    resetInactivityTimer();

    // Track tab switching abandonment
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackTabSwitch();
      }
    });

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.trackPageUnloadAbandonment();
    });
  }

  // Track inactivity abandonment
  private trackInactivityAbandonment(): void {
    if (!this.currentJourney) return;

    const timeSinceLastActivity = Date.now() - lastActivity;

    trackRUMEvent('inactivity-abandonment', {
      journeyId: this.currentJourney.id,
      lastStepId: this.journeySteps[this.journeySteps.length - 1]?.id || 'unknown',
      timeInJourney: Date.now() - this.journeyStartTime,
      inactivityDuration: timeSinceLastActivity,
      stepsCompleted: this.journeySteps.length
    });
  }

  // Track tab switching
  private trackTabSwitch(): void {
    if (!this.currentJourney) return;

    trackRUMEvent('tab-switch', {
      journeyId: this.currentJourney.id,
      currentStepId: this.journeySteps[this.journeySteps.length - 1]?.id || 'unknown',
      timeInJourney: Date.now() - this.journeyStartTime,
      stepsCompleted: this.journeySteps.length
    });
  }

  // Track page unload abandonment
  private trackPageUnloadAbandonment(): void {
    if (!this.currentJourney) return;

    // Send data to server before unload
    const data = {
      journeyId: this.currentJourney.id,
      lastStepId: this.journeySteps[this.journeySteps.length - 1]?.id || 'unknown',
      timeInJourney: Date.now() - this.journeyStartTime,
      stepsCompleted: this.journeySteps.length,
      stepTimings: Object.fromEntries(this.stepTimings),
      sessionData: this.sessionData
    };

    // Use sendBeacon for reliable delivery during unload
    if ('sendBeacon' in navigator) {
      navigator.sendBeacon('/api/analytics/journey-abandonment', JSON.stringify(data));
    }
  }

  // Initialize conversion tracking
  private initializeConversionTracking(): void {
    // Track booking completions
    this.trackBookingConversion();

    // Track newsletter signups
    this.trackNewsletterConversion();

    // Track contact form submissions
    this.trackContactConversion();
  }

  // Track booking conversion
  private trackBookingConversion(): void {
    // Monitor for booking confirmation
    const checkBookingConfirmation = () => {
      if (window.location.pathname === '/booking/confirmation') {
        this.trackJourneyConversion('booking-confirmation');
      }
    };

    // Check on load and route changes
    checkBookingConfirmation();
    setInterval(checkBookingConfirmation, 1000);
  }

  // Track newsletter signup conversion
  private trackNewsletterConversion(): void {
    // Monitor for newsletter signup forms
    const newsletterForms = document.querySelectorAll('form[data-newsletter="true"]');

    newsletterForms.forEach(form => {
      form.addEventListener('submit', () => {
        this.trackJourneyConversion('newsletter-signup');
      });
    });
  }

  // Track contact form conversion
  private trackContactConversion(): void {
    // Monitor for contact form submissions
    const contactForms = document.querySelectorAll('form[data-contact="true"]');

    contactForms.forEach(form => {
      form.addEventListener('submit', () => {
        this.trackJourneyConversion('contact-form');
      });
    });
  }

  // Track journey conversion
  private trackJourneyConversion(conversionType: string): void {
    if (!this.currentJourney) return;

    const conversionData = {
      journeyId: this.currentJourney.id,
      conversionType: conversionType,
      timeToConversion: Date.now() - this.journeyStartTime,
      stepsCompleted: this.journeySteps.length,
      totalSteps: this.currentJourney.steps.length,
      stepTimings: Object.fromEntries(this.stepTimings),
      conversionRate: this.journeySteps.length / this.currentJourney.steps.length,
      sessionData: this.sessionData,
      luxuryExperience: this.currentJourney.luxuryExperience
    };

    trackRUMEvent('journey-conversion', conversionData);

    // Report successful conversion for luxury journeys
    if (this.currentJourney.luxuryExperience && conversionType === this.currentJourney.conversionGoal) {
      reportMessage('Luxury journey conversion completed', 'info', conversionData);
    }
  }

  // Initialize language switching tracking
  private initializeLanguageSwitchingTracking(): void {
    // Monitor for language changes
    const languageSelectors = document.querySelectorAll('[data-language-switcher]');

    languageSelectors.forEach(selector => {
      selector.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        const newLanguage = target.dataset.language || target.textContent?.trim();

        trackRUMEvent('language-switch', {
          fromLanguage: this.sessionData.language,
          toLanguage: newLanguage,
          currentJourney: this.currentJourney?.id,
          currentStep: this.journeySteps[this.journeySteps.length - 1]?.id || 'unknown',
          timeInJourney: this.currentJourney ? Date.now() - this.journeyStartTime : 0
        });
      });
    });
  }

  // Track journey exit
  private trackJourneyExit(journey: JourneyDefinition): void {
    const exitData = {
      journeyId: journey.id,
      journeyName: journey.name,
      timeInJourney: Date.now() - this.journeyStartTime,
      stepsCompleted: this.journeySteps.length,
      totalSteps: journey.steps.length,
      completed: this.journeySteps.some(s => s.type === 'conversion'),
      stepTimings: Object.fromEntries(this.stepTimings),
      sessionData: this.sessionData
    };

    trackRUMEvent('journey-exit', exitData);
  }

  // Track custom events
  trackCustomEvent(eventName: string, data?: any): void {
    const eventData = {
      eventName: eventName,
      data: data || {},
      currentJourney: this.currentJourney?.id,
      currentStep: this.journeySteps[this.journeySteps.length - 1]?.id || 'unknown',
      timeInJourney: this.currentJourney ? Date.now() - this.journeyStartTime : 0,
      timestamp: Date.now(),
      sessionData: this.sessionData
    };

    trackRUMEvent('custom-event', eventData);
  }

  // Public API methods

  // Get journey analytics
  getJourneyAnalytics(): any {
    return {
      currentJourney: this.currentJourney,
      journeySteps: this.journeySteps,
      stepTimings: Object.fromEntries(this.stepTimings),
      journeyDuration: Date.now() - this.journeyStartTime,
      sessionData: this.sessionData,
      completedSteps: this.journeySteps.filter(s => s.type !== 'exit').length,
      isConversionPath: this.currentJourney ?
        this.journeySteps.some(s => s.type === 'conversion') : false
    };
  }

  // Get funnel analysis
  getFunnelAnalysis(journeyId?: string): any {
    const journey = journeyId ?
      JOURNEYS.find(j => j.id === journeyId) :
      this.currentJourney;

    if (!journey) return null;

    const analysis = {
      journeyId: journey.id,
      journeyName: journey.name,
      totalSteps: journey.steps.length,
      completedSteps: this.journeySteps.length,
      stepAnalysis: journey.steps.map(step => {
        const completed = this.journeySteps.some(s => s.id === step.id);
        const timing = this.stepTimings.get(step.id);
        const withinExpectedTime = step.estimatedTime ?
          (timing ? timing <= step.estimatedTime : false) : true;

        return {
          stepId: step.id,
          stepName: step.name,
          critical: step.critical,
          completed: completed,
          timing: timing,
          estimatedTime: step.estimatedTime,
          withinExpectedTime: withinExpectedTime,
          conversionRate: completed ? 1 : 0
        };
      }),
      overallConversionRate: this.journeySteps.length / journey.steps.length,
      criticalStepsCompleted: journey.steps
        .filter(s => s.critical)
        .filter(s => this.journeySteps.some(completed => completed.id === s.id)).length,
      totalCriticalSteps: journey.steps.filter(s => s.critical).length
    };

    return analysis;
  }

  // Get user behavior patterns
  getUserBehaviorPatterns(): any {
    const metrics = getRUMMetrics();
    const patterns = {
      serviceCategoryPreference: this.analyzeServicePreference(metrics),
      mobileVsDesktop: this.analyzeDeviceUsage(metrics),
      languageSwitchingImpact: this.analyzeLanguageSwitching(metrics),
      timeOfDayPatterns: this.analyzeTimeOfDayPatterns(metrics),
      abandonmentPatterns: this.analyzeAbandonmentPatterns(metrics)
    };

    return patterns;
  }

  // Analyze service preference
  private analyzeServicePreference(metrics: any): any {
    const serviceEvents = metrics['custom-events']?.filter((e: any) =>
      e.data.category === 'beauty' || e.data.category === 'fitness'
    ) || [];

    const beautyCount = serviceEvents.filter((e: any) => e.data.category === 'beauty').length;
    const fitnessCount = serviceEvents.filter((e: any) => e.data.category === 'fitness').length;

    return {
      beauty: beautyCount,
      fitness: fitnessCount,
      preference: beautyCount > fitnessCount ? 'beauty' : fitnessCount > beautyCount ? 'fitness' : 'balanced',
      totalInteractions: beautyCount + fitnessCount
    };
  }

  // Analyze device usage
  private analyzeDeviceUsage(metrics: any): any {
    const events = Object.values(metrics).flat() as any[];
    const mobileEvents = events.filter(e => e.deviceInfo?.isMobile).length;
    const desktopEvents = events.filter(e => !e.deviceInfo?.isMobile).length;

    return {
      mobile: mobileEvents,
      desktop: desktopEvents,
      primaryDevice: mobileEvents > desktopEvents ? 'mobile' : 'desktop'
    };
  }

  // Analyze language switching impact
  private analyzeLanguageSwitching(metrics: any): any {
    const languageEvents = metrics['custom-events']?.filter((e: any) =>
      e.eventName === 'language-switch'
    ) || [];

    return {
      totalSwitches: languageEvents.length,
      averageTimeInJourneyBeforeSwitch: languageEvents.reduce((sum: number, e: any) =>
        sum + (e.timeInJourney || 0), 0) / (languageEvents.length || 1),
      conversionAfterSwitch: languageEvents.filter((e: any) =>
        e.data?.conversionCompleted).length
    };
  }

  // Analyze time of day patterns
  private analyzeTimeOfDayPatterns(metrics: any): any {
    const allEvents = Object.values(metrics).flat() as any[];
    const hourCounts = new Array(24).fill(0);

    allEvents.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      hourCounts[hour]++;
    });

    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

    return {
      hourlyDistribution: hourCounts,
      peakHour: peakHour,
      peakHourCount: hourCounts[peakHour],
      totalEvents: allEvents.length
    };
  }

  // Analyze abandonment patterns
  private analyzeAbandonmentPatterns(metrics: any): any {
    const abandonmentEvents = metrics['custom-events']?.filter((e: any) =>
      e.eventName?.includes('abandonment')
    ) || [];

    const abandonmentSteps = abandonmentEvents.map((e: any) => e.data?.abandonedAtStep);
    const stepCounts = abandonmentSteps.reduce((acc: any, step: string) => {
      acc[step] = (acc[step] || 0) + 1;
      return acc;
    }, {});

    const mostCommonStep = Object.keys(stepCounts).reduce((a, b) =>
      stepCounts[a] > stepCounts[b] ? a : b, '');

    return {
      totalAbandonments: abandonmentEvents.length,
      abandonmentByStep: stepCounts,
      mostCommonAbandonmentStep: mostCommonStep,
      abandonmentRate: abandonmentEvents.length / (Object.values(metrics).flat().length || 1)
    };
  }

  // Helper method to generate session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Create and export singleton instance
export const userJourneyAnalytics = new UserJourneyAnalytics();

// Initialize automatically
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    userJourneyAnalytics.initialize();
  } else {
    window.addEventListener('load', () => {
      userJourneyAnalytics.initialize();
    });
  }
}

// Export helper functions
export const initializeUserJourneyAnalytics = () => userJourneyAnalytics.initialize();
export const getJourneyAnalytics = () => userJourneyAnalytics.getJourneyAnalytics();
export const getFunnelAnalysis = (journeyId?: string) => userJourneyAnalytics.getFunnelAnalysis(journeyId);
export const getUserBehaviorPatterns = () => userJourneyAnalytics.getUserBehaviorPatterns();
export const trackJourneyEvent = (eventName: string, data?: any) =>
  userJourneyAnalytics.trackCustomEvent(eventName, data);

// Export types
export interface JourneyAnalytics {
  currentJourney: JourneyDefinition | null;
  journeySteps: JourneyStep[];
  stepTimings: Record<string, number>;
  journeyDuration: number;
  sessionData: any;
  completedSteps: number;
  isConversionPath: boolean;
}