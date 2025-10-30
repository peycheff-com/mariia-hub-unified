import { ga4Analytics } from './ga4';
import { supabase } from '@/integrations/supabase/client';
import type { ServiceCategory } from './booking-tracker';

// User Behavior Event Types
export interface BehaviorEvent {
  event_type: 'page_view' | 'scroll' | 'click' | 'hover' | 'form_interaction' | 'search' | 'filter' | 'comparison' | 'favorite' | 'share';
  page_path: string;
  element_selector?: string;
  element_text?: string;
  element_type?: string;
  target_url?: string;
  search_query?: string;
  filter_category?: string;
  filter_value?: string;
  service_category?: ServiceCategory;
  service_id?: string;
  session_duration_ms?: number;
  scroll_depth_percentage?: number;
  viewport_size?: string;
  user_agent?: string;
  timestamp: number;
}

// User Journey Interface
export interface UserJourney {
  session_id: string;
  user_id?: string;
  events: BehaviorEvent[];
  start_time: number;
  end_time?: number;
  total_duration_ms: number;
  pages_visited: string[];
  service_categories_viewed: ServiceCategory[];
  interactions_count: number;
  conversion_events: string[];
  device_type: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  language: string;
  referrer: string;
  entry_page: string;
  exit_page?: string;
  bounce_rate: boolean;
  converted: boolean;
  conversion_value?: number;
}

// User Preferences Interface
export interface UserPreferences {
  user_id?: string;
  session_id: string;
  preferred_service_category?: ServiceCategory;
  preferred_time_slots: string[];
  price_range_preference: {
    min: number;
    max: number;
  };
  language_preference: string;
  device_usage_pattern: {
    mobile_sessions: number;
    desktop_sessions: number;
    tablet_sessions: number;
  };
  booking_patterns: {
    preferred_days: string[];
    preferred_times: string[];
    average_lead_time_days: number;
  };
  interaction_preferences: {
    clicks_per_session: number;
    scroll_depth_average: number;
    time_on_service_pages: number;
    comparison_frequency: number;
  };
  last_updated: string;
}

export class BehaviorTracker {
  private static instance: BehaviorTracker;
  private sessionId: string;
  private userId: string | null = null;
  private sessionStartTime: number;
  private currentPath: string = '';
  private eventQueue: BehaviorEvent[] = [];
  private journeyEvents: BehaviorEvent[] = [];
  private pageStartTime: number;
  private lastActivityTime: number;
  private scrollDepthTracked: Set<number> = new Set();
  private isTrackingActive: boolean = false;
  private batchProcessing: boolean = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.pageStartTime = Date.now();
    this.lastActivityTime = Date.now();
    this.initializeTracking();
  }

  static getInstance(): BehaviorTracker {
    if (!BehaviorTracker.instance) {
      BehaviorTracker.instance = new BehaviorTracker();
    }
    return BehaviorTracker.instance;
  }

  private generateSessionId(): string {
    return `behavior_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeTracking(): void {
    this.isTrackingActive = true;
    this.currentPath = window.location.pathname;

    // Track initial page view
    this.trackPageView(window.location.pathname, document.title);

    // Set up event listeners
    this.setupEventListeners();

    // Start batch processing
    this.startBatchProcessing();

    // Handle page visibility changes
    this.setupVisibilityTracking();

    // Handle page unload
    this.setupUnloadTracking();
  }

  private setupEventListeners(): void {
    // Click tracking
    document.addEventListener('click', this.handleClick.bind(this), true);

    // Scroll tracking
    window.addEventListener('scroll', this.throttle(this.handleScroll.bind(this), 100));

    // Form interactions
    document.addEventListener('focusin', this.handleFormFocus.bind(this), true);
    document.addEventListener('change', this.handleFormChange.bind(this), true);

    // Search interactions
    document.addEventListener('input', this.throttle(this.handleSearch.bind(this), 500));

    // Mouse movement for hover tracking (throttled)
    document.addEventListener('mousemove', this.throttle(this.handleMouseMove.bind(this), 1000));
  }

  private setupVisibilityTracking(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackPageLeave();
      } else {
        this.trackPageReturn();
      }
    });
  }

  private setupUnloadTracking(): void {
    window.addEventListener('beforeunload', () => {
      this.trackSessionEnd();
      this.processBatch();
    });
  }

  // Page tracking
  trackPageView(path: string, title?: string): void {
    const duration = Date.now() - this.pageStartTime;

    const event: BehaviorEvent = {
      event_type: 'page_view',
      page_path: path,
      session_duration_ms: duration,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      user_agent: navigator.userAgent,
      timestamp: Date.now(),
    };

    this.trackEvent(event);
    this.journeyEvents.push(event);

    // Update current path and reset page timer
    this.currentPath = path;
    this.pageStartTime = Date.now();
    this.lastActivityTime = Date.now();

    // Track to GA4
    ga4Analytics.trackPageView(path, title);

    // Track service category page views
    const serviceCategory = this.extractServiceCategoryFromPath(path);
    if (serviceCategory) {
      this.trackServiceCategoryView(serviceCategory);
    }
  }

  // Click tracking
  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const elementInfo = this.extractElementInfo(target);

    const clickEvent: BehaviorEvent = {
      event_type: 'click',
      page_path: this.currentPath,
      element_selector: elementInfo.selector,
      element_text: elementInfo.text,
      element_type: elementInfo.type,
      target_url: (target as HTMLAnchorElement).href,
      service_category: this.extractServiceCategoryFromElement(target),
      timestamp: Date.now(),
    };

    this.trackEvent(clickEvent);

    // Track specific interaction types
    this.trackSpecificInteraction(target, clickEvent);
  }

  // Scroll tracking
  private handleScroll(): void {
    const scrollDepth = this.calculateScrollDepth();

    // Track scroll depth at 25%, 50%, 75%, and 90%
    const milestones = [25, 50, 75, 90];

    milestones.forEach(milestone => {
      if (scrollDepth >= milestone && !this.scrollDepthTracked.has(milestone)) {
        this.scrollDepthTracked.add(milestone);

        const scrollEvent: BehaviorEvent = {
          event_type: 'scroll',
          page_path: this.currentPath,
          scroll_depth_percentage: milestone,
          timestamp: Date.now(),
        };

        this.trackEvent(scrollEvent);
      }
    });

    this.lastActivityTime = Date.now();
  }

  // Form interaction tracking
  private handleFormFocus(event: FocusEvent): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (!target.form) return;

    const formEvent: BehaviorEvent = {
      event_type: 'form_interaction',
      page_path: this.currentPath,
      element_type: target.type || target.tagName.toLowerCase(),
      element_selector: this.generateSelector(target),
      timestamp: Date.now(),
    };

    this.trackEvent(formEvent);
  }

  private handleFormChange(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    if (!target.form) return;

    const formEvent: BehaviorEvent = {
      event_type: 'form_interaction',
      page_path: this.currentPath,
      element_type: target.type || target.tagName.toLowerCase(),
      element_selector: this.generateSelector(target),
      element_text: target.value,
      timestamp: Date.now(),
    };

    this.trackEvent(formEvent);
  }

  // Search tracking
  private handleSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (!target.value || target.value.length < 3) return;

    const searchEvent: BehaviorEvent = {
      event_type: 'search',
      page_path: this.currentPath,
      search_query: target.value,
      element_selector: this.generateSelector(target),
      timestamp: Date.now(),
    };

    this.trackEvent(searchEvent);
  }

  // Mouse hover tracking (limited to important elements)
  private handleMouseMove(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // Only track hovers on important elements
    const importantSelectors = ['[data-service-id]', '[data-category]', '.service-card', '.booking-button'];
    const isImportant = importantSelectors.some(selector => target.matches(selector));

    if (isImportant) {
      const hoverEvent: BehaviorEvent = {
        event_type: 'hover',
        page_path: this.currentPath,
        element_selector: this.generateSelector(target),
        element_text: target.textContent?.substring(0, 50),
        element_type: target.tagName.toLowerCase(),
        service_category: this.extractServiceCategoryFromElement(target),
        service_id: target.getAttribute('data-service-id') || undefined,
        timestamp: Date.now(),
      };

      this.trackEvent(hoverEvent);
    }
  }

  // Service category specific tracking
  trackServiceCategoryView(category: ServiceCategory): void {
    const event: BehaviorEvent = {
      event_type: 'page_view',
      page_path: this.currentPath,
      service_category: category,
      timestamp: Date.now(),
    };

    this.trackEvent(event);

    // Track to GA4
    ga4Analytics.trackServiceInteraction({
      service_id: category,
      service_category: category,
      interaction_type: 'view_details',
    });
  }

  trackServiceInteraction(interaction: {
    service_id: string;
    service_name: string;
    service_category: ServiceCategory;
    interaction_type: 'view_details' | 'add_favorites' | 'share' | 'compare';
    duration_seconds?: number;
  }): void {
    const event: BehaviorEvent = {
      event_type: 'click',
      page_path: this.currentPath,
      service_category: interaction.service_category,
      service_id: interaction.service_id,
      element_text: interaction.interaction_type,
      element_type: 'service_interaction',
      timestamp: Date.now(),
    };

    this.trackEvent(event);

    // Track to GA4
    ga4Analytics.trackServiceInteraction(interaction);
  }

  trackFilterUsage(filterCategory: string, filterValue: string, serviceCategory?: ServiceCategory): void {
    const event: BehaviorEvent = {
      event_type: 'filter',
      page_path: this.currentPath,
      filter_category: filterCategory,
      filter_value: filterValue,
      service_category: serviceCategory,
      timestamp: Date.now(),
    };

    this.trackEvent(event);
  }

  trackServiceComparison(services: Array<{id: string; name: string; category: ServiceCategory}>): void {
    const event: BehaviorEvent = {
      event_type: 'comparison',
      page_path: this.currentPath,
      element_text: services.map(s => s.id).join(','),
      service_category: services[0]?.category,
      timestamp: Date.now(),
    };

    this.trackEvent(event);

    // Track to GA4
    ga4Analytics.trackCustomEvent({
      event_name: 'service_comparison',
      parameters: {
        service_category: services[0]?.category || 'lifestyle',
        booking_step: 0,
        total_steps: 0,
        currency: 'PLN',
        user_session_id: this.sessionId,
        device_type: this.getDeviceType(),
        language: navigator.language,
        additional_data: {
          services_compared: services.length,
          service_types: services.map(s => s.category).join(','),
        },
      },
    });
  }

  // User preference tracking
  async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<void> {
    try {
      const currentPrefs = await this.getUserPreferences();
      const updatedPrefs = { ...currentPrefs, ...preferences, last_updated: new Date().toISOString() };

      await supabase.from('user_preferences').upsert({
        user_id: this.userId,
        session_id: this.sessionId,
        preferences: updatedPrefs,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to update user preferences:', error);
    }
  }

  async getUserPreferences(): Promise<UserPreferences> {
    try {
      if (this.userId) {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('preferences')
          .eq('user_id', this.userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data?.preferences) {
          return data.preferences;
        }
      }

      // Return default preferences
      return this.getDefaultPreferences();
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      session_id: this.sessionId,
      preferred_time_slots: [],
      price_range_preference: { min: 0, max: 1000 },
      language_preference: navigator.language,
      device_usage_pattern: {
        mobile_sessions: 0,
        desktop_sessions: 0,
        tablet_sessions: 0,
      },
      booking_patterns: {
        preferred_days: [],
        preferred_times: [],
        average_lead_time_days: 7,
      },
      interaction_preferences: {
        clicks_per_session: 0,
        scroll_depth_average: 0,
        time_on_service_pages: 0,
        comparison_frequency: 0,
      },
      last_updated: new Date().toISOString(),
    };
  }

  // Journey analysis
  async generateUserJourney(): Promise<UserJourney> {
    const endTime = Date.now();
    const totalDuration = endTime - this.sessionStartTime;

    const pagesVisited = [...new Set(this.journeyEvents.map(e => e.page_path))];
    const serviceCategoriesViewed = [...new Set(
      this.journeyEvents
        .filter(e => e.service_category)
        .map(e => e.service_category!)
    )] as ServiceCategory[];

    const conversionEvents = this.journeyEvents
      .filter(e => e.element_type === 'booking_complete' || e.element_type === 'purchase')
      .map(e => e.timestamp.toString());

    const isBounce = pagesVisited.length === 1 && totalDuration < 30000; // 30 seconds
    const hasConverted = conversionEvents.length > 0;

    return {
      session_id: this.sessionId,
      user_id: this.userId || undefined,
      events: this.journeyEvents,
      start_time: this.sessionStartTime,
      end_time: endTime,
      total_duration_ms: totalDuration,
      pages_visited: pagesVisited,
      service_categories_viewed: serviceCategoriesViewed,
      interactions_count: this.journeyEvents.length,
      conversion_events: conversionEvents,
      device_type: this.getDeviceType(),
      browser: this.getBrowser(),
      language: navigator.language,
      referrer: document.referrer,
      entry_page: pagesVisited[0] || '',
      exit_page: pagesVisited[pagesVisited.length - 1] || pagesVisited[0] || '',
      bounce_rate: isBounce,
      converted: hasConverted,
    };
  }

  // Analytics and insights
  async generateBehaviorInsights(startDate: string, endDate: string): Promise<{
    user_patterns: {
      average_session_duration: number;
      pages_per_session: number;
      bounce_rate: number;
      return_visitor_rate: number;
    };
    content_insights: {
      most_viewed_categories: Array<{ category: ServiceCategory; views: number }>;
      most_engaging_services: Array<{ service_id: string; interactions: number }>;
      popular_filters: Array<{ filter: string; usage_count: number }>;
    };
    conversion_insights: {
      user_journey_patterns: Array<{ pattern: string; frequency: number; conversion_rate: number }>;
      drop_off_points: Array<{ page: string; drop_off_rate: number }>;
      top_conversion_paths: Array<{ path: string[]; conversion_count: number }>;
    };
  }> {
    try {
      const sessions = await this.fetchBehaviorSessions(startDate, endDate);

      return {
        user_patterns: this.analyzeUserPatterns(sessions),
        content_insights: this.analyzeContentInsights(sessions),
        conversion_insights: this.analyzeConversionInsights(sessions),
      };
    } catch (error) {
      console.error('Failed to generate behavior insights:', error);
      throw error;
    }
  }

  private async fetchBehaviorSessions(startDate: string, endDate: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('behavior_analytics_events')
      .select('*')
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  private analyzeUserPatterns(sessions: any[]): any {
    const sessionDurations = sessions.map(s => s.total_duration_ms || 0);
    const pagesPerSession = sessions.map(s => s.pages_visited?.length || 0);
    const bounceCount = sessions.filter(s => s.bounce_rate).length;
    const uniqueUsers = new Set(sessions.map(s => s.user_id).filter(Boolean)).size;
    const totalSessions = sessions.length;
    const returningSessions = sessions.filter(s => s.user_id).length;

    return {
      average_session_duration: sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length,
      pages_per_session: pagesPerSession.reduce((a, b) => a + b, 0) / pagesPerSession.length,
      bounce_rate: (bounceCount / totalSessions) * 100,
      return_visitor_rate: totalSessions > 0 ? (returningSessions / totalSessions) * 100 : 0,
    };
  }

  private analyzeContentInsights(sessions: any[]): any {
    // Analyze most viewed service categories
    const categoryViews: Record<string, number> = {};
    sessions.forEach(session => {
      session.events?.forEach((event: any) => {
        if (event.service_category) {
          categoryViews[event.service_category] = (categoryViews[event.service_category] || 0) + 1;
        }
      });
    });

    const mostViewedCategories = Object.entries(categoryViews)
      .map(([category, views]) => ({ category: category as ServiceCategory, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // Analyze service interactions
    const serviceInteractions: Record<string, number> = {};
    sessions.forEach(session => {
      session.events?.forEach((event: any) => {
        if (event.service_id && event.event_type === 'click') {
          serviceInteractions[event.service_id] = (serviceInteractions[event.service_id] || 0) + 1;
        }
      });
    });

    const mostEngagingServices = Object.entries(serviceInteractions)
      .map(([service_id, interactions]) => ({ service_id, interactions }))
      .sort((a, b) => b.interactions - a.interactions)
      .slice(0, 10);

    // Analyze filter usage
    const filterUsage: Record<string, number> = {};
    sessions.forEach(session => {
      session.events?.forEach((event: any) => {
        if (event.event_type === 'filter') {
          const filterKey = `${event.filter_category}:${event.filter_value}`;
          filterUsage[filterKey] = (filterUsage[filterKey] || 0) + 1;
        }
      });
    });

    const popularFilters = Object.entries(filterUsage)
      .map(([filter, usage_count]) => ({ filter, usage_count }))
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 10);

    return {
      most_viewed_categories: mostViewedCategories,
      most_engaging_services: mostEngagingServices,
      popular_filters: popularFilters,
    };
  }

  private analyzeConversionInsights(sessions: any[]): any {
    // Analyze user journey patterns
    const journeyPatterns: Record<string, { count: number; conversions: number }> = {};

    sessions.forEach(session => {
      if (session.pages_visited && session.pages_visited.length > 0) {
        const pattern = session.pages_visited.join(' > ');
        if (!journeyPatterns[pattern]) {
          journeyPatterns[pattern] = { count: 0, conversions: 0 };
        }
        journeyPatterns[pattern].count++;
        if (session.converted) {
          journeyPatterns[pattern].conversions++;
        }
      }
    });

    const userJourneyPatterns = Object.entries(journeyPatterns)
      .map(([pattern, data]) => ({
        pattern,
        frequency: data.count,
        conversion_rate: (data.conversions / data.count) * 100,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    return {
      user_journey_patterns: userJourneyPatterns,
      drop_off_points: [], // To be implemented
      top_conversion_paths: [], // To be implemented
    };
  }

  // Helper methods
  private trackEvent(event: BehaviorEvent): void {
    this.eventQueue.push(event);
    this.lastActivityTime = Date.now();
  }

  private async processBatch(): Promise<void> {
    if (this.batchProcessing || this.eventQueue.length === 0) return;

    this.batchProcessing = true;
    const batch = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const formattedEvents = batch.map(event => ({
        session_id: this.sessionId,
        user_id: this.userId,
        ...event,
        created_at: new Date(event.timestamp).toISOString(),
      }));

      await supabase.from('behavior_analytics_events').insert(formattedEvents);
    } catch (error) {
      console.error('Failed to store behavior events:', error);
      this.eventQueue.unshift(...batch);
    } finally {
      this.batchProcessing = false;
    }
  }

  private startBatchProcessing(): void {
    setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.processBatch();
      }
    }, 30000);
  }

  private trackPageLeave(): void {
    const duration = Date.now() - this.pageStartTime;
    const event: BehaviorEvent = {
      event_type: 'page_view',
      page_path: this.currentPath,
      session_duration_ms: duration,
      timestamp: Date.now(),
    };

    this.trackEvent(event);
  }

  private trackPageReturn(): void {
    this.pageStartTime = Date.now();
    this.lastActivityTime = Date.now();
  }

  private trackSessionEnd(): void {
    const totalDuration = Date.now() - this.sessionStartTime;
    const sessionEndEvent: BehaviorEvent = {
      event_type: 'page_view',
      page_path: this.currentPath,
      session_duration_ms: totalDuration,
      timestamp: Date.now(),
    };

    this.trackEvent(sessionEndEvent);
  }

  private trackSpecificInteraction(target: HTMLElement, baseEvent: BehaviorEvent): void {
    // Track service favorites
    if (target.matches('[data-action="favorite"]')) {
      const serviceId = target.getAttribute('data-service-id');
      const serviceName = target.getAttribute('data-service-name');
      const category = target.getAttribute('data-service-category') as ServiceCategory;

      if (serviceId && serviceName && category) {
        this.trackServiceInteraction({
          service_id: serviceId,
          service_name: serviceName,
          service_category: category,
          interaction_type: 'add_favorites',
        });
      }
    }

    // Track service shares
    if (target.matches('[data-action="share"]')) {
      const serviceId = target.getAttribute('data-service-id');
      const serviceName = target.getAttribute('data-service-name');
      const category = target.getAttribute('data-service-category') as ServiceCategory;

      if (serviceId && serviceName && category) {
        this.trackServiceInteraction({
          service_id: serviceId,
          service_name: serviceName,
          service_category: category,
          interaction_type: 'share',
        });
      }
    }
  }

  private extractElementInfo(element: HTMLElement): { selector: string; text: string; type: string } {
    return {
      selector: this.generateSelector(element),
      text: element.textContent?.substring(0, 50) || '',
      type: element.tagName.toLowerCase(),
    };
  }

  private generateSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ').join('.')}`;
    return element.tagName.toLowerCase();
  }

  private extractServiceCategoryFromPath(path: string): ServiceCategory | null {
    if (path.includes('/beauty')) return 'beauty';
    if (path.includes('/fitness')) return 'fitness';
    if (path.includes('/lifestyle')) return 'lifestyle';
    return null;
  }

  private extractServiceCategoryFromElement(element: HTMLElement): ServiceCategory | null {
    const category = element.getAttribute('data-service-category');
    if (category === 'beauty' || category === 'fitness' || category === 'lifestyle') {
      return category;
    }
    return this.extractServiceCategoryFromPath(window.location.pathname);
  }

  private calculateScrollDepth(): number {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    return scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getBrowser(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private throttle(func: Function, limit: number) {
    let inThrottle: boolean;
    return function(this: any) {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Public methods
  setUserId(userId: string): void {
    this.userId = userId;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getCurrentPath(): string {
    return this.currentPath;
  }

  async endSession(): Promise<void> {
    this.trackSessionEnd();
    await this.processBatch();

    // Store complete user journey
    const journey = await this.generateUserJourney();
    try {
      await supabase.from('user_journeys').insert({
        ...journey,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to store user journey:', error);
    }
  }
}

// Export singleton instance
export const behaviorTracker = BehaviorTracker.getInstance();