/**
 * Google Calendar Integration Service
 * Handles two-way synchronization with Google Calendar
 * Supports appointment booking, availability management, and calendar sharing
 */

import { supabase } from '@/integrations/supabase/client';
import { BaseIntegrationService, type SyncResult, type HealthCheckResult, type WebhookPayload } from '../base/base-integration.service';
import type {
  IntegrationConfig,
  CalendarEvent,
  CalendarAttendee,
  CalendarRecurrence,
  DataMapping,
  IntegrationTemplate,
  AuthConfig
} from '@/types/integrations';

export interface GoogleCalendarConfig extends IntegrationConfig {
  calendar_id?: string;
  sync_direction?: 'inbound' | 'outbound' | 'bidirectional';
  sync_availability?: boolean;
  sync_appointments?: boolean;
  buffer_time_minutes?: number;
  working_hours?: {
    start: string; // HH:mm
    end: string;   // HH:mm
    workdays: number[]; // 0-6 (Sunday-Saturday)
  };
  timezone?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus: 'accepted' | 'declined' | 'tentative' | 'needsAction';
    optional?: boolean;
  }>;
  recurrence?: string[];
  status: 'confirmed' | 'tentative' | 'cancelled';
  visibility?: 'default' | 'public' | 'private' | 'confidential';
  transparency?: 'opaque' | 'transparent';
  location?: string;
  hangoutLink?: string;
  conferenceData?: {
    createRequest?: {
      requestId: string;
      conferenceSolutionKey: {
        type: 'hangoutsMeet' | 'addOn';
      };
    };
  };
  extendedProperties?: {
    private?: Record<string, string>;
    shared?: Record<string, string>;
  };
  created: string;
  updated: string;
  iCalUID: string;
  htmlLink: string;
}

export interface GoogleCalendarResponse {
  kind: string;
  etag: string;
  nextSyncToken?: string;
  items: GoogleCalendarEvent[];
  summary?: string;
  description?: string;
  updated: string;
  timeZone: string;
  accessRole: string;
  defaultReminders: Array<{
    method: string;
    minutes: number;
  }>;
  nextPageToken?: string;
  resultType?: string;
}

export interface GoogleCalendarFreeBusy {
  calId: string;
  busy: Array<{
    start: string;
    end: string;
  }>;
}

export interface GoogleCalendarFreeBusyRequest {
  timeMin: string;
  timeMax: string;
  timeZone: string;
  items: Array<{
    id: string;
  }>;
}

export interface GoogleCalendarFreeBusyResponse {
  kind: string;
  timeMin: string;
  timeMax: string;
  calendars: Record<string, GoogleCalendarFreeBusy>;
}

export class GoogleCalendarService extends BaseIntegrationService {
  private readonly API_BASE = 'https://www.googleapis.com/calendar/v3';
  private readonly OAUTH_BASE = 'https://accounts.google.com/o/oauth2';
  private readonly SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly'
  ];

  constructor(config: GoogleCalendarConfig) {
    super(config);
  }

  getProvider(): string {
    return 'google';
  }

  getSupportedCategories(): string[] {
    return ['calendar', 'scheduling'];
  }

  getTemplate(): IntegrationTemplate {
    return {
      id: 'google-calendar-template',
      name: 'Google Calendar Integration',
      description: 'Synchronize appointments and availability with Google Calendar',
      provider: 'google',
      category: 'calendar',
      setup_instructions: [
        'Create a Google Cloud Project',
        'Enable Calendar API',
        'Create OAuth 2.0 credentials',
        'Configure redirect URI',
        'Connect your calendar account'
      ],
      required_fields: ['client_id', 'client_secret', 'calendar_id'],
      optional_fields: ['timezone', 'working_hours', 'buffer_time_minutes'],
      default_settings: {
        sync_direction: 'bidirectional',
        sync_availability: true,
        sync_appointments: true,
        buffer_time_minutes: 15,
        timezone: 'Europe/Warsaw',
        working_hours: {
          start: '09:00',
          end: '17:00',
          workdays: [1, 2, 3, 4, 5] // Monday-Friday
        }
      },
      webhook_events: ['event.created', 'event.updated', 'event.deleted'],
      rate_limits: {
        requests_per_hour: 10000,
        requests_per_day: 1000000,
        current_usage: {
          hour: 0,
          day: 0,
          last_reset: {
            hour: new Date().toISOString(),
            day: new Date().toISOString()
          }
        }
      },
      is_recommended: true
    };
  }

  async testConnection(config: IntegrationConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const calendarConfig = config as GoogleCalendarConfig;

      if (!calendarConfig.credentials?.access_token) {
        return { success: false, error: 'Access token not found' };
      }

      // Test connection by fetching calendar list
      const response = await this.makeRequest(
        `${this.API_BASE}/users/me/calendarList`,
        {
          headers: {
            'Authorization': `Bearer ${calendarConfig.credentials.access_token}`
          }
        }
      );

      if (!response.success) {
        return { success: false, error: response.error };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  async authenticate(authConfig: AuthConfig): Promise<{ success: boolean; access_token?: string; error?: string }> {
    try {
      // Exchange authorization code for access token
      const response = await this.makeRequest(
        `${this.OAUTH_BASE}/token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            client_id: authConfig.client_id!,
            client_secret: authConfig.client_secret!,
            code: authConfig.code!,
            grant_type: 'authorization_code',
            redirect_uri: authConfig.redirect_uri!
          })
        }
      );

      if (response.success && response.data) {
        const tokenData = response.data as any;
        return {
          success: true,
          access_token: tokenData.access_token
        };
      }

      return { success: false, error: response.error };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  async refreshToken(refreshToken: string): Promise<{ success: boolean; access_token?: string; error?: string }> {
    try {
      const response = await this.makeRequest(
        `${this.OAUTH_BASE}/token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            client_id: this.config.credentials.client_id,
            client_secret: this.config.credentials.client_secret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token'
          })
        }
      );

      if (response.success && response.data) {
        const tokenData = response.data as any;

        // Update stored credentials
        await supabase
          .from('integrations')
          .update({
            credentials: {
              ...this.config.credentials,
              access_token: tokenData.access_token,
              refresh_token: tokenData.refresh_token || refreshToken,
              token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
            }
          })
          .eq('id', this.config.id);

        return {
          success: true,
          access_token: tokenData.access_token
        };
      }

      return { success: false, error: response.error };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed'
      };
    }
  }

  async syncData(config: IntegrationConfig, entityTypes?: string[]): Promise<SyncResult> {
    const calendarConfig = config as GoogleCalendarConfig;
    const results = {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsDeleted: 0,
      details: {}
    };

    try {
      if (!calendarConfig.is_enabled || calendarConfig.status !== 'connected') {
        return { success: false, error: 'Integration is not enabled or connected' };
      }

      // Check if token needs refresh
      if (this.isTokenExpired()) {
        const refreshResult = await this.refreshToken(calendarConfig.credentials.refresh_token);
        if (!refreshResult.success) {
          return { success: false, error: 'Failed to refresh access token' };
        }
      }

      // Sync direction handling
      if (!entityTypes || entityTypes.includes('events')) {
        if (calendarConfig.sync_direction === 'inbound' || calendarConfig.sync_direction === 'bidirectional') {
          const inboundResult = await this.syncEventsFromGoogle(calendarConfig);
          this.mergeResults(results, inboundResult);
        }

        if (calendarConfig.sync_direction === 'outbound' || calendarConfig.sync_direction === 'bidirectional') {
          const outboundResult = await this.syncEventsToGoogle(calendarConfig);
          this.mergeResults(results, outboundResult);
        }
      }

      if (!entityTypes || entityTypes.includes('availability')) {
        if (calendarConfig.sync_availability) {
          const availabilityResult = await this.syncAvailability(calendarConfig);
          this.mergeResults(results, availabilityResult);
        }
      }

      await this.logEvent('sync_completed', {
        records_processed: results.recordsProcessed,
        records_created: results.recordsCreated,
        records_updated: results.recordsUpdated,
        records_deleted: results.recordsDeleted
      });

      return results;
    } catch (error) {
      await this.logEvent('sync_failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'error');

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
        ...results
      };
    }
  }

  async healthCheck(config: IntegrationConfig): Promise<HealthCheckResult> {
    try {
      const calendarConfig = config as GoogleCalendarConfig;

      // Check if integration is enabled
      if (!calendarConfig.is_enabled) {
        return {
          status: 'degraded',
          issues: [{
            type: 'warning',
            message: 'Integration is disabled',
            suggested_action: 'Enable the integration in settings'
          }]
        };
      }

      // Check if token is expired
      if (this.isTokenExpired()) {
        return {
          status: 'degraded',
          issues: [{
            type: 'warning',
            message: 'Access token is expired',
            suggested_action: 'Refresh authentication'
          }]
        };
      }

      // Test API connectivity
      const startTime = Date.now();
      const connectionTest = await this.testConnection(config);
      const responseTime = Date.now() - startTime;

      if (!connectionTest.success) {
        return {
          status: 'unhealthy',
          response_time_ms: responseTime,
          issues: [{
            type: 'error',
            message: 'API connection failed',
            details: connectionTest.error,
            suggested_action: 'Check authentication credentials'
          }]
        };
      }

      // Check sync status
      const timeSinceLastSync = calendarConfig.last_sync_at
        ? Date.now() - new Date(calendarConfig.last_sync_at).getTime()
        : Infinity;

      const maxSyncAge = this.getSyncIntervalMs(calendarConfig.sync_frequency) * 2;

      if (timeSinceLastSync > maxSyncAge) {
        return {
          status: 'degraded',
          response_time_ms: responseTime,
          issues: [{
            type: 'warning',
            message: 'Last sync was too long ago',
            suggested_action: 'Trigger manual sync'
          }]
        };
      }

      // Check error count
      if (calendarConfig.error_count > 5) {
        return {
          status: 'degraded',
          response_time_ms: responseTime,
          issues: [{
            type: 'warning',
            message: 'High error count detected',
            details: `${calendarConfig.error_count} errors recorded`,
            suggested_action: 'Review recent errors and adjust settings'
          }]
        };
      }

      return {
        status: 'healthy',
        response_time_ms: responseTime,
        last_successful_sync: calendarConfig.last_sync_at
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        issues: [{
          type: 'error',
          message: 'Health check failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        }]
      };
    }
  }

  async handleWebhook(payload: WebhookPayload): Promise<{ success: boolean; processed: boolean; error?: string }> {
    try {
      // Verify webhook signature
      if (!this.verifyWebhookSignature(payload)) {
        return { success: false, processed: false, error: 'Invalid webhook signature' };
      }

      const eventData = payload.data;

      switch (payload.event) {
        case 'event.created':
        case 'event.updated':
          await this.processEventChange(eventData);
          break;

        case 'event.deleted':
          await this.processEventDeletion(eventData);
          break;

        default:
          return { success: true, processed: false };
      }

      return { success: true, processed: true };
    } catch (error) {
      return {
        success: false,
        processed: false,
        error: error instanceof Error ? error.message : 'Webhook processing failed'
      };
    }
  }

  /**
   * Sync events from Google Calendar to local database
   */
  private async syncEventsFromGoogle(config: GoogleCalendarConfig): Promise<SyncResult> {
    const result = {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsDeleted: 0
    };

    try {
      const calendarId = config.calendar_id || 'primary';
      const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // Last 30 days
      const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // Next 90 days

      const response = await this.makeRequest(
        `${this.API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          headers: {
            'Authorization': `Bearer ${config.credentials.access_token}`
          }
        }
      );

      if (!response.success) {
        throw new Error(response.error);
      }

      const calendarData = response.data as GoogleCalendarResponse;
      const googleEvents = calendarData.items;

      for (const googleEvent of googleEvents) {
        try {
          const localEvent = await this.convertGoogleEventToLocal(googleEvent);
          const existingEvent = await this.findLocalEvent(googleEvent.id);

          if (existingEvent) {
            // Update existing event
            await this.updateLocalEvent(existingEvent.id, localEvent);
            result.recordsUpdated++;
          } else {
            // Create new event
            await this.createLocalEvent(localEvent);
            result.recordsCreated++;
          }

          result.recordsProcessed++;
        } catch (eventError) {
          console.error('Failed to process event:', eventError);
        }
      }

      return result;
    } catch (error) {
      return {
        ...result,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync events from Google'
      };
    }
  }

  /**
   * Sync local events to Google Calendar
   */
  private async syncEventsToGoogle(config: GoogleCalendarConfig): Promise<SyncResult> {
    const result = {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsDeleted: 0
    };

    try {
      // Get local events that need syncing
      const { data: localEvents, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('integration_id', config.id)
        .is('google_event_id', null) // Events not yet synced
        .or('updated_at.gt.last_sync_at');

      if (error) throw error;

      for (const localEvent of localEvents || []) {
        try {
          const googleEvent = await this.convertLocalEventToGoogle(localEvent);

          let googleResponse;
          if (localEvent.google_event_id) {
            // Update existing event
            googleResponse = await this.updateGoogleEvent(config.calendar_id!, localEvent.google_event_id, googleEvent);
            result.recordsUpdated++;
          } else {
            // Create new event
            googleResponse = await this.createGoogleEvent(config.calendar_id!, googleEvent);
            if (googleResponse.success) {
              // Update local event with Google ID
              await supabase
                .from('calendar_events')
                .update({
                  google_event_id: googleResponse.data?.id,
                  last_sync_at: new Date().toISOString()
                })
                .eq('id', localEvent.id);
              result.recordsCreated++;
            }
          }

          result.recordsProcessed++;
        } catch (eventError) {
          console.error('Failed to sync event to Google:', eventError);
        }
      }

      return result;
    } catch (error) {
      return {
        ...result,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync events to Google'
      };
    }
  }

  /**
   * Sync availability information
   */
  private async syncAvailability(config: GoogleCalendarConfig): Promise<SyncResult> {
    const result = {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsDeleted: 0
    };

    try {
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Next 30 days

      const freeBusyRequest: GoogleCalendarFreeBusyRequest = {
        timeMin,
        timeMax,
        timeZone: config.timezone || 'Europe/Warsaw',
        items: [{
          id: config.calendar_id || 'primary'
        }]
      };

      const response = await this.makeRequest(
        `${this.API_BASE}/freeBusy`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.credentials.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(freeBusyRequest)
        }
      );

      if (!response.success) {
        throw new Error(response.error);
      }

      const freeBusyData = response.data as GoogleCalendarFreeBusyResponse;
      const busySlots = freeBusyData.calendars[config.calendar_id || 'primary']?.busy || [];

      // Process busy slots and update availability in local database
      for (const busySlot of busySlots) {
        await this.updateAvailabilitySlot(config.id, {
          start: busySlot.start,
          end: busySlot.end,
          is_available: false,
          source: 'google_calendar'
        });
        result.recordsUpdated++;
      }

      result.recordsProcessed = busySlots.length;
      return result;
    } catch (error) {
      return {
        ...result,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync availability'
      };
    }
  }

  /**
   * Convert Google Calendar event to local format
   */
  private async convertGoogleEventToLocal(googleEvent: GoogleCalendarEvent): Promise<Partial<CalendarEvent>> {
    return {
      external_id: googleEvent.id,
      title: googleEvent.summary,
      description: googleEvent.description,
      start_time: googleEvent.start.dateTime || googleEvent.start.date,
      end_time: googleEvent.end.dateTime || googleEvent.end.date,
      timezone: googleEvent.start.timeZone || this.config.timezone,
      location: googleEvent.location,
      attendees: googleEvent.attendees?.map(attendee => ({
        email: attendee.email,
        name: attendee.displayName,
        status: attendee.responseStatus === 'accepted' ? 'accepted' :
                attendee.responseStatus === 'declined' ? 'declined' :
                attendee.responseStatus === 'tentative' ? 'tentative' : 'needs_action',
        is_optional: attendee.optional
      })),
      status: googleEvent.status === 'confirmed' ? 'confirmed' :
              googleEvent.status === 'tentative' ? 'tentative' : 'cancelled',
      recurrence: googleEvent.recurrence ? this.parseGoogleRecurrence(googleEvent.recurrence) : undefined,
      metadata: {
        html_link: googleEvent.htmlLink,
        hangout_link: googleEvent.hangoutLink,
        visibility: googleEvent.visibility,
        transparency: googleEvent.transparency,
        extended_properties: googleEvent.extendedProperties
      }
    };
  }

  /**
   * Convert local event to Google Calendar format
   */
  private async convertLocalEventToGoogle(localEvent: Partial<CalendarEvent>): Promise<Partial<GoogleCalendarEvent>> {
    const googleEvent: Partial<GoogleCalendarEvent> = {
      summary: localEvent.title,
      description: localEvent.description,
      start: {
        dateTime: localEvent.start_time,
        timeZone: localEvent.timezone || this.config.timezone
      },
      end: {
        dateTime: localEvent.end_time,
        timeZone: localEvent.timezone || this.config.timezone
      },
      location: localEvent.location,
      attendees: localEvent.attendees?.map(attendee => ({
        email: attendee.email,
        displayName: attendee.name,
        responseStatus: attendee.status === 'accepted' ? 'accepted' :
                      attendee.status === 'declined' ? 'declined' :
                      attendee.status === 'tentative' ? 'tentative' : 'needsAction',
        optional: attendee.is_optional
      })),
      status: localEvent.status === 'confirmed' ? 'confirmed' :
              localEvent.status === 'tentative' ? 'tentative' : 'cancelled',
      extendedProperties: {
        private: {
          integration_id: this.config.id,
          local_event_id: localEvent.id
        }
      }
    };

    if (localEvent.recurrence) {
      googleEvent.recurrence = this.formatGoogleRecurrence(localEvent.recurrence);
    }

    return googleEvent;
  }

  /**
   * Create event in Google Calendar
   */
  private async createGoogleEvent(calendarId: string, event: Partial<GoogleCalendarEvent>): Promise<{ success: boolean; data?: GoogleCalendarEvent; error?: string }> {
    const response = await this.makeRequest(
      `${this.API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.credentials.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      }
    );

    return response;
  }

  /**
   * Update event in Google Calendar
   */
  private async updateGoogleEvent(calendarId: string, eventId: string, event: Partial<GoogleCalendarEvent>): Promise<{ success: boolean; data?: GoogleCalendarEvent; error?: string }> {
    const response = await this.makeRequest(
      `${this.API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.config.credentials.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      }
    );

    return response;
  }

  /**
   * Find local event by Google event ID
   */
  private async findLocalEvent(googleEventId: string): Promise<any> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('google_event_id', googleEventId)
      .single();

    return data;
  }

  /**
   * Create local event
   */
  private async createLocalEvent(event: Partial<CalendarEvent>): Promise<void> {
    await supabase
      .from('calendar_events')
      .insert({
        ...event,
        integration_id: this.config.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
  }

  /**
   * Update local event
   */
  private async updateLocalEvent(eventId: string, event: Partial<CalendarEvent>): Promise<void> {
    await supabase
      .from('calendar_events')
      .update({
        ...event,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId);
  }

  /**
   * Update availability slot
   */
  private async updateAvailabilitySlot(integrationId: string, slot: {
    start: string;
    end: string;
    is_available: boolean;
    source: string;
  }): Promise<void> {
    await supabase
      .from('availability_slots')
      .upsert({
        integration_id,
        start_time: slot.start,
        end_time: slot.end,
        is_available: slot.is_available,
        source: slot.source,
        updated_at: new Date().toISOString()
      });
  }

  /**
   * Parse Google recurrence rule
   */
  private parseGoogleRecurrence(recurrence: string[]): CalendarRecurrence | undefined {
    // Parse RRULE format (simplified)
    const rrule = recurrence.find(rule => rule.startsWith('RRULE:'));
    if (!rrule) return undefined;

    const params = rrule.substring(6).split(';');
    const recurrenceRule: CalendarRecurrence = {
      frequency: 'weekly',
      interval: 1
    };

    params.forEach(param => {
      const [key, value] = param.split('=');
      switch (key) {
        case 'FREQ':
          recurrenceRule.frequency = value.toLowerCase() as any;
          break;
        case 'INTERVAL':
          recurrenceRule.interval = parseInt(value);
          break;
        case 'UNTIL':
          recurrenceRule.end_date = value;
          break;
        case 'COUNT':
          recurrenceRule.occurrences = parseInt(value);
          break;
        case 'BYDAY':
          recurrenceRule.days_of_week = this.parseByDay(value);
          break;
      }
    });

    return recurrenceRule;
  }

  /**
   * Format recurrence rule for Google
   */
  private formatGoogleRecurrence(recurrence: CalendarRecurrence): string[] {
    const parts = ['RRULE:FREQ=' + recurrence.frequency.toUpperCase()];

    if (recurrence.interval && recurrence.interval > 1) {
      parts.push('INTERVAL=' + recurrence.interval);
    }

    if (recurrence.end_date) {
      parts.push('UNTIL=' + recurrence.end_date);
    } else if (recurrence.occurrences) {
      parts.push('COUNT=' + recurrence.occurrences);
    }

    if (recurrence.days_of_week && recurrence.days_of_week.length > 0) {
      parts.push('BYDAY=' + this.formatByDay(recurrence.days_of_week));
    }

    return [parts.join(';')];
  }

  /**
   * Parse BYDAY parameter
   */
  private parseByDay(byDay: string): number[] {
    const dayMap: Record<string, number> = {
      'MO': 1, 'TU': 2, 'WE': 3, 'TH': 4, 'FR': 5, 'SA': 6, 'SU': 0
    };

    return byDay.split(',').map(day => dayMap[day] || 0);
  }

  /**
   * Format BYDAY parameter
   */
  private formatByDay(days: number[]): string {
    const dayMap: Record<number, string> = {
      0: 'SU', 1: 'MO', 2: 'TU', 3: 'WE', 4: 'TH', 5: 'FR', 6: 'SA'
    };

    return days.map(day => dayMap[day]).join(',');
  }

  /**
   * Check if access token is expired
   */
  private isTokenExpired(): boolean {
    const expiresAt = this.config.credentials.token_expires_at;
    if (!expiresAt) return false;

    return new Date(expiresAt).getTime() <= Date.now() + 60000; // 1 minute buffer
  }

  /**
   * Verify webhook signature
   */
  private verifyWebhookSignature(payload: WebhookPayload): boolean {
    // Implement signature verification based on Google's webhook requirements
    return true; // Placeholder
  }

  /**
   * Process event change from webhook
   */
  private async processEventChange(eventData: any): Promise<void> {
    // Process incoming event changes
  }

  /**
   * Process event deletion from webhook
   */
  private async processEventDeletion(eventData: any): Promise<void> {
    // Process event deletions
  }

  /**
   * Merge sync results
   */
  private mergeResults(target: SyncResult, source: SyncResult): void {
    target.recordsProcessed = (target.recordsProcessed || 0) + (source.recordsProcessed || 0);
    target.recordsCreated = (target.recordsCreated || 0) + (source.recordsCreated || 0);
    target.recordsUpdated = (target.recordsUpdated || 0) + (source.recordsUpdated || 0);
    target.recordsDeleted = (target.recordsDeleted || 0) + (source.recordsDeleted || 0);

    if (source.details) {
      target.details = { ...target.details, ...source.details };
    }
  }
}

export default GoogleCalendarService;