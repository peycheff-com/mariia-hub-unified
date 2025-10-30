import { behaviorTracker } from './behavior-tracker';
import { ga4Analytics } from './ga4';
import { supabase } from '@/integrations/supabase/client';

// Heatmap and Session Recording Configuration
interface HeatmapConfig {
  enabled: boolean;
  sampleRate: number; // Percentage of sessions to record (0-100)
  recordClicks: boolean;
  recordMovements: boolean;
  recordScrolls: boolean;
  recordInputs: boolean;
  maxSessionLength: number; // Maximum session length in minutes
  sensitiveElements: string[]; // CSS selectors to exclude from recording
  consentRequired: boolean;
}

interface SessionRecording {
  id: string;
  session_id: string;
  user_id?: string;
  start_time: number;
  end_time?: number;
  duration_ms: number;
  page_url: string;
  events: SessionEvent[];
  device_info: {
    userAgent: string;
    screenResolution: string;
    viewportSize: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
  };
  user_journey: {
    pages_visited: string[];
    total_clicks: number;
    total_scrolls: number;
    form_interactions: number;
    rage_clicks: number;
    dead_clicks: number;
  };
  conversion_events: Array<{
    type: string;
    timestamp: number;
    value?: number;
  }>;
  privacy_compliance: {
    consent_given: boolean;
    data_masked: boolean;
    sensitive_data_removed: boolean;
  };
}

interface SessionEvent {
  type: 'click' | 'mousemove' | 'scroll' | 'input' | 'focus' | 'blur' | 'resize' | 'page_view';
  timestamp: number;
  x?: number;
  y?: number;
  target?: {
    tagName: string;
    className: string;
    id: string;
    textContent?: string;
    attributes?: Record<string, string>;
  };
  data?: any;
}

interface HeatmapData {
  page_url: string;
  total_clicks: number;
  total_views: number;
  click_points: Array<{
    x: number;
    y: number;
    count: number;
    element_path: string;
  }>;
  scroll_depth: Array<{
    percentage: number;
    users_reached: number;
    drop_off_rate: number;
  }>;
  attention_heatmap: Array<{
    x: number;
    y: number;
    intensity: number;
    duration: number;
  }>;
  element_performance: Array<{
    selector: string;
    clicks: number;
    hover_time: number;
    conversion_rate: number;
  }>;
}

export class HeatmapSessionRecorder {
  private static instance: HeatmapSessionRecorder;
  private config: HeatmapConfig;
  private isRecording: boolean = false;
  private currentRecording: SessionRecording | null = null;
  private eventBuffer: SessionEvent[] = [];
  private recordingStartTime: number = 0;
  private lastMouseMoveTime: number = 0;
  private mouseMoveThrottle: number = 100;
  private scrollTimeout: any = null;
  private clickTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private consentGiven: boolean = false;

  constructor() {
    this.config = this.getDefaultConfig();
    this.initialize();
  }

  static getInstance(): HeatmapSessionRecorder {
    if (!HeatmapSessionRecorder.instance) {
      HeatmapSessionRecorder.instance = new HeatmapSessionRecorder();
    }
    return HeatmapSessionRecorder.instance;
  }

  private getDefaultConfig(): HeatmapConfig {
    return {
      enabled: !!import.meta.env.VITE_HOTJAR_ID,
      sampleRate: 10, // Record 10% of sessions
      recordClicks: true,
      recordMovements: true,
      recordScrolls: true,
      recordInputs: false, // Disable by default for privacy
      maxSessionLength: 30, // 30 minutes max
      sensitiveElements: [
        'input[type="password"]',
        'input[type="email"]',
        'input[type="tel"]',
        'textarea',
        '[data-sensitive="true"]',
        '.cc-number',
        '.cc-expiry',
        '.cc-cvc',
      ],
      consentRequired: true,
    };
  }

  private async initialize(): Promise<void> {
    if (!this.config.enabled) return;

    // Check for consent
    this.consentGiven = await this.checkConsent();

    if (!this.consentGiven && this.config.consentRequired) {
      console.log('Heatmap/Session recording requires user consent');
      return;
    }

    // Sample sessions
    if (Math.random() * 100 > this.config.sampleRate) {
      console.log('Session not selected for recording (sampling)');
      return;
    }

    await this.startRecording();
  }

  private async checkConsent(): Promise<boolean> {
    // Check for existing consent
    const existingConsent = localStorage.getItem('analytics_consent');
    if (existingConsent) {
      return existingConsent === 'granted';
    }

    // Check if user has previously declined
    const declined = localStorage.getItem('analytics_consent_declined');
    if (declined) {
      return false;
    }

    // For demo purposes, auto-grant consent in development
    if (import.meta.env.DEV) {
      return true;
    }

    return false;
  }

  async requestConsent(): Promise<boolean> {
    return new Promise((resolve) => {
      // Create consent modal
      const modal = this.createConsentModal();
      document.body.appendChild(modal);

      const handleAccept = () => {
        localStorage.setItem('analytics_consent', 'granted');
        this.consentGiven = true;
        document.body.removeChild(modal);
        this.startRecording();
        resolve(true);
      };

      const handleDecline = () => {
        localStorage.setItem('analytics_consent_declined', 'true');
        document.body.removeChild(modal);
        resolve(false);
      };

      modal.querySelector('#consent-accept')?.addEventListener('click', handleAccept);
      modal.querySelector('#consent-decline')?.addEventListener('click', handleDecline);
    });
  }

  private createConsentModal(): HTMLElement {
    const modal = document.createElement('div');
    modal.id = 'heatmap-consent-modal';
    modal.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;">
        <div style="background: white; padding: 2rem; border-radius: 8px; max-width: 400px; text-align: center;">
          <h3 style="margin: 0 0 1rem 0;">Help Us Improve</h3>
          <p style="margin: 0 0 1.5rem 0; color: #666;">
            We'd like to record your session to understand how you use our site and improve your experience. This data is anonymous and used only for analytics purposes.
          </p>
          <div style="display: flex; gap: 1rem; justify-content: center;">
            <button id="consent-accept" style="background: #8B4513; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
              Accept
            </button>
            <button id="consent-decline" style="background: #e5e5e5; color: #333; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
              Decline
            </button>
          </div>
        </div>
      </div>
    `;
    return modal;
  }

  private async startRecording(): Promise<void> {
    if (this.isRecording || !this.config.enabled || !this.consentGiven) return;

    this.isRecording = true;
    this.recordingStartTime = Date.now();
    this.eventBuffer = [];

    // Initialize recording session
    this.currentRecording = {
      id: this.generateRecordingId(),
      session_id: behaviorTracker.getSessionId(),
      start_time: this.recordingStartTime,
      duration_ms: 0,
      page_url: window.location.href,
      events: [],
      device_info: {
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        deviceType: this.getDeviceType(),
      },
      user_journey: {
        pages_visited: [window.location.pathname],
        total_clicks: 0,
        total_scrolls: 0,
        form_interactions: 0,
        rage_clicks: 0,
        dead_clicks: 0,
      },
      conversion_events: [],
      privacy_compliance: {
        consent_given: this.consentGiven,
        data_masked: true,
        sensitive_data_removed: true,
      },
    };

    // Set up event listeners
    this.setupEventListeners();

    // Start session timer
    this.startSessionTimer();

    // Record initial page view
    this.recordEvent({
      type: 'page_view',
      timestamp: Date.now(),
    });

    console.log('Started session recording:', this.currentRecording.id);

    // Track to GA4
    await ga4Analytics.trackCustomEvent({
      event_name: 'session_recording_start',
      parameters: {
        recording_id: this.currentRecording.id,
        booking_step: 0,
        total_steps: 0,
        currency: 'PLN',
        user_session_id: this.currentRecording.session_id,
        device_type: this.currentRecording.device_info.deviceType,
        language: navigator.language,
      },
    });
  }

  private setupEventListeners(): void {
    if (this.config.recordClicks) {
      document.addEventListener('click', this.handleClick.bind(this), true);
    }

    if (this.config.recordMovements) {
      document.addEventListener('mousemove', this.throttle(this.handleMouseMove.bind(this), this.mouseMoveThrottle));
    }

    if (this.config.recordScrolls) {
      window.addEventListener('scroll', this.handleScroll.bind(this));
    }

    if (this.config.recordInputs) {
      document.addEventListener('focus', this.handleFocus.bind(this), true);
      document.addEventListener('blur', this.handleBlur.bind(this), true);
      document.addEventListener('input', this.handleInput.bind(this), true);
    }

    window.addEventListener('resize', this.handleResize.bind(this));
    window.addEventListener('beforeunload', this.handlePageUnload.bind(this));
  }

  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // Skip sensitive elements
    if (this.isSensitiveElement(target)) return;

    const clickEvent: SessionEvent = {
      type: 'click',
      timestamp: Date.now(),
      x: event.clientX,
      y: event.clientY,
      target: this.extractTargetInfo(target),
    };

    this.recordEvent(clickEvent);
    this.currentRecording!.user_journey.total_clicks++;

    // Check for rage clicks (multiple clicks in same area)
    this.detectRageClick(clickEvent);

    // Track to behavior tracker
    behaviorTracker.trackServiceInteraction({
      service_id: target.getAttribute('data-service-id') || '',
      service_name: target.getAttribute('data-service-name') || '',
      service_category: (target.getAttribute('data-service-category') as any) || 'lifestyle',
      interaction_type: 'view_details',
    });
  }

  private handleMouseMove(event: MouseEvent): void {
    if (Date.now() - this.lastMouseMoveTime < this.mouseMoveThrottle) return;
    this.lastMouseMoveTime = Date.now();

    const moveEvent: SessionEvent = {
      type: 'mousemove',
      timestamp: Date.now(),
      x: event.clientX,
      y: event.clientY,
    };

    this.recordEvent(moveEvent);
  }

  private handleScroll(): void {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    this.scrollTimeout = setTimeout(() => {
      const scrollEvent: SessionEvent = {
        type: 'scroll',
        timestamp: Date.now(),
        data: {
          scrollY: window.pageYOffset,
          scrollX: window.pageXOffset,
          scrollHeight: document.documentElement.scrollHeight,
          viewportHeight: window.innerHeight,
          scrollPercentage: (window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight)) * 100,
        },
      };

      this.recordEvent(scrollEvent);
      this.currentRecording!.user_journey.total_scrolls++;
    }, 100);
  }

  private handleFocus(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    if (this.isSensitiveElement(target)) return;

    const focusEvent: SessionEvent = {
      type: 'focus',
      timestamp: Date.now(),
      target: this.extractTargetInfo(target),
    };

    this.recordEvent(focusEvent);
    this.currentRecording!.user_journey.form_interactions++;
  }

  private handleBlur(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    if (this.isSensitiveElement(target)) return;

    const blurEvent: SessionEvent = {
      type: 'blur',
      timestamp: Date.now(),
      target: this.extractTargetInfo(target),
    };

    this.recordEvent(blurEvent);
  }

  private handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.isSensitiveElement(target)) return;

    const inputEvent: SessionEvent = {
      type: 'input',
      timestamp: Date.now(),
      target: this.extractTargetInfo(target),
      data: {
        inputType: target.type,
        hasValue: target.value.length > 0,
      },
    };

    this.recordEvent(inputEvent);
  }

  private handleResize(): void {
    const resizeEvent: SessionEvent = {
      type: 'resize',
      timestamp: Date.now(),
      data: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };

    this.recordEvent(resizeEvent);
  }

  private handlePageUnload(): void {
    this.stopRecording();
  }

  private recordEvent(event: SessionEvent): void {
    if (!this.isRecording || !this.currentRecording) return;

    this.eventBuffer.push(event);

    // Buffer events and send in batches
    if (this.eventBuffer.length >= 50) {
      this.flushEventBuffer();
    }
  }

  private async flushEventBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    if (this.currentRecording) {
      this.currentRecording.events.push(...events);
    }

    // Store events in database
    try {
      await supabase.from('session_recording_events').insert(
        events.map(event => ({
          recording_id: this.currentRecording?.id,
          session_id: this.currentRecording?.session_id,
          event_data: event,
          created_at: new Date(event.timestamp).toISOString(),
        }))
      );
    } catch (error) {
      console.error('Failed to store session events:', error);
    }
  }

  private detectRageClick(clickEvent: SessionEvent): void {
    const clickKey = `${Math.floor(clickEvent.x! / 50)}_${Math.floor(clickEvent.y! / 50)}`;

    if (this.clickTimeouts.has(clickKey)) {
      clearTimeout(this.clickTimeouts.get(clickKey)!);
      this.currentRecording!.user_journey.rage_clicks++;
    }

    this.clickTimeouts.set(clickKey, setTimeout(() => {
      this.clickTimeouts.delete(clickKey);
    }, 500));
  }

  private isSensitiveElement(element: HTMLElement): boolean {
    return this.config.sensitiveElements.some(selector => {
      try {
        return element.matches(selector) || element.closest(selector);
      } catch {
        return false;
      }
    });
  }

  private extractTargetInfo(element: HTMLElement): SessionEvent['target'] {
    const targetInfo: SessionEvent['target'] = {
      tagName: element.tagName.toLowerCase(),
      className: element.className,
      id: element.id,
    };

    // Include limited text content for non-sensitive elements
    if (!this.isSensitiveElement(element) && element.textContent) {
      targetInfo.textContent = element.textContent.substring(0, 50);
    }

    // Include important attributes
    const importantAttributes = ['data-service-id', 'data-category', 'href', 'type', 'name'];
    targetInfo.attributes = {};
    importantAttributes.forEach(attr => {
      const value = element.getAttribute(attr);
      if (value) {
        targetInfo.attributes![attr] = value;
      }
    });

    return targetInfo;
  }

  private startSessionTimer(): void {
    setInterval(() => {
      if (this.isRecording && this.currentRecording) {
        const duration = Date.now() - this.recordingStartTime;

        // Stop recording if max duration reached
        if (duration > this.config.maxSessionLength * 60 * 1000) {
          this.stopRecording();
        }

        // Update current recording duration
        this.currentRecording.duration_ms = duration;

        // Flush events periodically
        this.flushEventBuffer();
      }
    }, 30000); // Every 30 seconds
  }

  async stopRecording(): Promise<void> {
    if (!this.isRecording || !this.currentRecording) return;

    this.isRecording = false;
    const endTime = Date.now();
    this.currentRecording.end_time = endTime;
    this.currentRecording.duration_ms = endTime - this.recordingStartTime;

    // Flush remaining events
    await this.flushEventBuffer();

    // Store complete recording
    try {
      await supabase.from('session_recordings').insert({
        id: this.currentRecording.id,
        session_id: this.currentRecording.session_id,
        user_id: null, // Would be populated if user is logged in
        start_time: new Date(this.currentRecording.start_time).toISOString(),
        end_time: new Date(this.currentRecording.end_time!).toISOString(),
        duration_ms: this.currentRecording.duration_ms,
        page_url: this.currentRecording.page_url,
        device_info: this.currentRecording.device_info,
        user_journey: this.currentRecording.user_journey,
        conversion_events: this.currentRecording.conversion_events,
        privacy_compliance: this.currentRecording.privacy_compliance,
        created_at: new Date().toISOString(),
      });

      console.log('Session recording completed:', this.currentRecording.id);

      // Track to GA4
      await ga4Analytics.trackCustomEvent({
        event_name: 'session_recording_complete',
        parameters: {
          recording_id: this.currentRecording.id,
          duration_seconds: Math.round(this.currentRecording.duration_ms / 1000),
          total_events: this.currentRecording.events.length,
          booking_step: 0,
          total_steps: 0,
          currency: 'PLN',
          user_session_id: this.currentRecording.session_id,
          device_type: this.currentRecording.device_info.deviceType,
          language: navigator.language,
        },
      });
    } catch (error) {
      console.error('Failed to store session recording:', error);
    }

    // Clean up
    this.currentRecording = null;
    this.eventBuffer = [];
    this.removeEventListeners();
  }

  private removeEventListeners(): void {
    document.removeEventListener('click', this.handleClick.bind(this), true);
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    window.removeEventListener('scroll', this.handleScroll.bind(this));
    document.removeEventListener('focus', this.handleFocus.bind(this), true);
    document.removeEventListener('blur', this.handleBlur.bind(this), true);
    document.removeEventListener('input', this.handleInput.bind(this), true);
    window.removeEventListener('resize', this.handleResize.bind(this));
    window.removeEventListener('beforeunload', this.handlePageUnload.bind(this));
  }

  // Heatmap Generation
  async generateHeatmap(pageUrl: string, startDate: string, endDate: string): Promise<HeatmapData> {
    try {
      const { data: recordings, error } = await supabase
        .from('session_recordings')
        .select('*')
        .eq('page_url', pageUrl)
        .gte('start_time', startDate)
        .lte('start_time', endDate);

      if (error) throw error;

      const { data: events, error: eventsError } = await supabase
        .from('session_recording_events')
        .select('*')
        .in('recording_id', recordings?.map(r => r.id) || [])
        .eq('event_data->>type', 'click');

      if (eventsError) throw eventsError;

      return this.processHeatmapData(recordings || [], events || []);
    } catch (error) {
      console.error('Failed to generate heatmap:', error);
      throw error;
    }
  }

  private processHeatmapData(recordings: any[], events: any[]): HeatmapData {
    const clickPoints: Map<string, { x: number; y: number; count: number; element_path: string }> = new Map();

    // Process click events
    events.forEach(event => {
      const clickData = event.event_data;
      const key = `${Math.floor(clickData.x / 10)}_${Math.floor(clickData.y / 10)}`;

      if (clickPoints.has(key)) {
        const point = clickPoints.get(key)!;
        point.count++;
      } else {
        clickPoints.set(key, {
          x: clickData.x,
          y: clickData.y,
          count: 1,
          element_path: clickData.target?.className || '',
        });
      }
    });

    // Calculate scroll depth
    const scrollDepths = this.calculateScrollDepths(recordings);

    // Calculate element performance
    const elementPerformance = this.calculateElementPerformance(events);

    return {
      page_url: recordings[0]?.page_url || '',
      total_clicks: events.length,
      total_views: recordings.length,
      click_points: Array.from(clickPoints.values()),
      scroll_depth: scrollDepths,
      attention_heatmap: [], // Would need more complex processing
      element_performance: elementPerformance,
    };
  }

  private calculateScrollDepths(recordings: any[]): HeatmapData['scroll_depth'] {
    const depthData = [
      { percentage: 25, users_reached: 0, drop_off_rate: 0 },
      { percentage: 50, users_reached: 0, drop_off_rate: 0 },
      { percentage: 75, users_reached: 0, drop_off_rate: 0 },
      { percentage: 90, users_reached: 0, drop_off_rate: 0 },
      { percentage: 100, users_reached: 0, drop_off_rate: 0 },
    ];

    recordings.forEach(recording => {
      const maxScrollPercentage = this.getMaxScrollPercentage(recording);

      depthData.forEach(depth => {
        if (maxScrollPercentage >= depth.percentage) {
          depth.users_reached++;
        }
      });
    });

    // Calculate drop-off rates
    const totalUsers = recordings.length;
    depthData.forEach((depth, index) => {
      if (index === 0) {
        depth.drop_off_rate = ((totalUsers - depth.users_reached) / totalUsers) * 100;
      } else {
        const previousDepth = depthData[index - 1];
        depth.drop_off_rate = ((previousDepth.users_reached - depth.users_reached) / previousDepth.users_reached) * 100;
      }
    });

    return depthData;
  }

  private calculateElementPerformance(events: any[]): HeatmapData['element_performance'] {
    const elementStats: Map<string, { clicks: number; hover_time: number; conversions: number }> = new Map();

    events.forEach(event => {
      const clickData = event.event_data;
      const elementPath = clickData.target?.className || clickData.target?.tagName || 'unknown';

      if (!elementStats.has(elementPath)) {
        elementStats.set(elementPath, { clicks: 0, hover_time: 0, conversions: 0 });
      }

      const stats = elementStats.get(elementPath)!;
      stats.clicks++;
    });

    return Array.from(elementStats.entries()).map(([selector, stats]) => ({
      selector,
      clicks: stats.clicks,
      hover_time: stats.hover_time,
      conversion_rate: stats.clicks > 0 ? (stats.conversions / stats.clicks) * 100 : 0,
    }));
  }

  private getMaxScrollPercentage(recording: any): number {
    // This would need to be calculated from scroll events
    // For now, return a placeholder
    return 75;
  }

  // Helper methods
  private generateRecordingId(): string {
    return `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
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

  // Public API
  async getSessionRecordings(
    startDate: string,
    endDate: string,
    filters?: {
      device_type?: string;
      min_duration?: number;
      converted_only?: boolean;
    }
  ): Promise<SessionRecording[]> {
    try {
      let query = supabase
        .from('session_recordings')
        .select('*')
        .gte('start_time', startDate)
        .lte('start_time', endDate)
        .order('start_time', { ascending: false });

      if (filters?.device_type) {
        query = query.contains('device_info', { deviceType: filters.device_type });
      }

      if (filters?.min_duration) {
        query = query.gte('duration_ms', filters.min_duration * 1000);
      }

      if (filters?.converted_only) {
        query = query.not('conversion_events', 'eq', '[]');
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to get session recordings:', error);
      return [];
    }
  }

  isRecordingActive(): boolean {
    return this.isRecording;
  }

  getCurrentRecordingId(): string | null {
    return this.currentRecording?.id || null;
  }

  async pauseRecording(): Promise<void> {
    if (this.isRecording) {
      this.removeEventListeners();
    }
  }

  async resumeRecording(): Promise<void> {
    if (this.currentRecording && !this.isRecording) {
      this.setupEventListeners();
    }
  }
}

// Export singleton instance
export const heatmapSessionRecorder = HeatmapSessionRecorder.getInstance();