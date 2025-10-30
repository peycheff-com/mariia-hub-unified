/**
 * Microsoft 365 Calendar Integration Service
 * Handles two-way synchronization with Microsoft Outlook/Calendar
 * Supports appointment booking, availability management, and Teams integration
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

export interface Microsoft365Config extends IntegrationConfig {
  calendar_id?: string;
  tenant_id?: string;
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
  enable_teams_integration?: boolean;
  auto_create_meetings?: boolean;
}

export interface Microsoft365Event {
  id: string;
  subject?: string;
  body?: {
    contentType: 'text' | 'html';
    content: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    emailAddress: {
      name?: string;
      address: string;
    };
    status: {
      response: 'accepted' | 'declined' | 'tentativelyAccepted' | 'notResponded';
      time?: string;
    };
    type: 'required' | 'optional' | 'resource';
  }>;
  recurrence?: {
    pattern: {
      type: 'daily' | 'weekly' | 'absoluteMonthly' | 'relativeMonthly' | 'absoluteYearly' | 'relativeYearly';
      interval: number;
      month?: number;
      dayOfMonth?: number;
      daysOfWeek?: ('sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday')[];
      index?: 'first' | 'second' | 'third' | 'fourth' | 'last';
    };
    range: {
      type: 'endDate' | 'noEnd' | 'numbered';
      startDate: string;
      endDate?: string;
      numberOfOccurrences?: number;
    };
  };
  location?: {
    displayName?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      countryOrRegion?: string;
      postalCode?: string;
    };
  };
  showAs?: 'free' | 'tentative' | 'busy' | 'oof' | 'workingElsewhere' | 'unknown';
  sensitivity?: 'normal' | 'personal' | 'private' | 'confidential';
  isAllDay?: boolean;
  isOnlineMeeting?: boolean;
  onlineMeetingProvider?: 'teamsForBusiness' | 'skypeForBusiness' | 'skypeForConsumer';
  onlineMeeting?: {
    joinUrl?: string;
    conferenceId?: string;
    tollNumber?: string;
  };
  responseRequested?: boolean;
  allowNewTimeProposals?: boolean;
  transactionId?: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  iCalUId: string;
  webLink: string;
}

export interface Microsoft365Calendar {
  id: string;
  name?: string;
  color?: string;
  hexColor?: string;
  isDefaultCalendar?: boolean;
  changeKey?: string;
  canShare?: boolean;
  canViewPrivateItems?: boolean;
  canEdit?: boolean;
  owner?: {
    name?: string;
    address?: string;
  };
}

export interface Microsoft365Availability {
  scheduleId: string;
  availabilityView: string;
  scheduleItems: Array<{
    start: {
      dateTime: string;
      timeZone: string;
    };
    end: {
      dateTime: string;
      timeZone: string;
    };
    status: 'free' | 'tentative' | 'busy' | 'oof' | 'workingElsewhere' | 'unknown';
  }>;
  workingHours: {
    daysOfWeek: ('sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday')[];
    startTime: string;
    endTime: string;
    timeZone: {
      name: string;
    };
  };
}

export class Microsoft365CalendarService extends BaseIntegrationService {
  private readonly API_BASE = 'https://graph.microsoft.com/v1.0';
  private readonly OAUTH_BASE = 'https://login.microsoftonline.com';
  private readonly SCOPES = [
    'https://graph.microsoft.com/Calendars.ReadWrite',
    'https://graph.microsoft.com/User.Read',
    'https://graph.microsoft.com/OnlineMeetings.ReadWrite'
  ];

  constructor(config: Microsoft365Config) {
    super(config);
  }

  getProvider(): string {
    return 'microsoft';
  }

  getSupportedCategories(): string[] {
    return ['calendar', 'scheduling', 'communication'];
  }

  getTemplate(): IntegrationTemplate {
    return {
      id: 'microsoft365-calendar-template',
      name: 'Microsoft 365 Calendar Integration',
      description: 'Synchronize appointments and availability with Microsoft Outlook/Calendar',
      provider: 'microsoft',
      category: 'calendar',
      setup_instructions: [
        'Register an application in Azure Active Directory',
        'Enable Microsoft Graph API permissions',
        'Create client secret',
        'Configure redirect URI',
        'Connect your Microsoft 365 account'
      ],
      required_fields: ['client_id', 'client_secret', 'tenant_id', 'calendar_id'],
      optional_fields: ['timezone', 'working_hours', 'buffer_time_minutes', 'enable_teams_integration'],
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
        },
        enable_teams_integration: true,
        auto_create_meetings: false
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
      const msConfig = config as Microsoft365Config;

      if (!msConfig.credentials?.access_token) {
        return { success: false, error: 'Access token not found' };
      }

      // Test connection by fetching user profile
      const response = await this.makeRequest(
        `${this.API_BASE}/me`,
        {
          headers: {
            'Authorization': `Bearer ${msConfig.credentials.access_token}`
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
        `${this.OAUTH_BASE}/${authConfig.tenant_id}/oauth2/v2.0/token`,
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
            redirect_uri: authConfig.redirect_uri!,
            scope: this.SCOPES.join(' ')
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
      const msConfig = this.config as Microsoft365Config;

      const response = await this.makeRequest(
        `${this.OAUTH_BASE}/${msConfig.tenant_id}/oauth2/v2.0/token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            client_id: this.config.credentials.client_id,
            client_secret: this.config.credentials.client_secret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
            scope: this.SCOPES.join(' ')
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
    const msConfig = config as Microsoft365Config;
    const results = {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsDeleted: 0,
      details: {}
    };

    try {
      if (!msConfig.is_enabled || msConfig.status !== 'connected') {
        return { success: false, error: 'Integration is not enabled or connected' };
      }

      // Check if token needs refresh
      if (this.isTokenExpired()) {
        const refreshResult = await this.refreshToken(msConfig.credentials.refresh_token);
        if (!refreshResult.success) {
          return { success: false, error: 'Failed to refresh access token' };
        }
      }

      // Sync direction handling
      if (!entityTypes || entityTypes.includes('events')) {
        if (msConfig.sync_direction === 'inbound' || msConfig.sync_direction === 'bidirectional') {
          const inboundResult = await this.syncEventsFromMicrosoft(msConfig);
          this.mergeResults(results, inboundResult);
        }

        if (msConfig.sync_direction === 'outbound' || msConfig.sync_direction === 'bidirectional') {
          const outboundResult = await this.syncEventsToMicrosoft(msConfig);
          this.mergeResults(results, outboundResult);
        }
      }

      if (!entityTypes || entityTypes.includes('availability')) {
        if (msConfig.sync_availability) {
          const availabilityResult = await this.syncAvailability(msConfig);
          this.mergeResults(results, availabilityResult);
        }
      }

      if (msConfig.enable_teams_integration && (!entityTypes || entityTypes.includes('meetings'))) {
        const meetingsResult = await this.syncTeamsMeetings(msConfig);
        this.mergeResults(results, meetingsResult);
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
      const msConfig = config as Microsoft365Config;

      // Check if integration is enabled
      if (!msConfig.is_enabled) {
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
      const timeSinceLastSync = msConfig.last_sync_at
        ? Date.now() - new Date(msConfig.last_sync_at).getTime()
        : Infinity;

      const maxSyncAge = this.getSyncIntervalMs(msConfig.sync_frequency) * 2;

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
      if (msConfig.error_count > 5) {
        return {
          status: 'degraded',
          response_time_ms: responseTime,
          issues: [{
            type: 'warning',
            message: 'High error count detected',
            details: `${msConfig.error_count} errors recorded`,
            suggested_action: 'Review recent errors and adjust settings'
          }]
        };
      }

      return {
        status: 'healthy',
        response_time_ms: responseTime,
        last_successful_sync: msConfig.last_sync_at
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
      // Microsoft Graph webhooks use validation token and notification format
      if (payload.data.validationToken) {
        // Return validation token for webhook setup
        return { success: true, processed: true };
      }

      // Process actual notifications
      const notifications = payload.data.value || [];

      for (const notification of notifications) {
        await this.processNotification(notification);
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
   * Sync events from Microsoft Calendar to local database
   */
  private async syncEventsFromMicrosoft(config: Microsoft365Config): Promise<SyncResult> {
    const result = {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsDeleted: 0
    };

    try {
      const calendarId = config.calendar_id || 'primary';
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // Last 30 days
      const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // Next 90 days

      const response = await this.makeRequest(
        `${this.API_BASE}/me/calendars/${encodeURIComponent(calendarId)}/calendarView?startDateTime=${startDate}&endDateTime=${endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${config.credentials.access_token}`
          }
        }
      );

      if (!response.success) {
        throw new Error(response.error);
      }

      const msEvents = response.data.value || [];

      for (const msEvent of msEvents) {
        try {
          const localEvent = await this.convertMicrosoftEventToLocal(msEvent);
          const existingEvent = await this.findLocalEvent(msEvent.id);

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
        error: error instanceof Error ? error.message : 'Failed to sync events from Microsoft'
      };
    }
  }

  /**
   * Sync local events to Microsoft Calendar
   */
  private async syncEventsToMicrosoft(config: Microsoft365Config): Promise<SyncResult> {
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
        .or('microsoft_event_id.is.null,last_sync_at.lt.updated_at');

      if (error) throw error;

      for (const localEvent of localEvents || []) {
        try {
          const msEvent = await this.convertLocalEventToMicrosoft(localEvent);

          let msResponse;
          if (localEvent.microsoft_event_id) {
            // Update existing event
            msResponse = await this.updateMicrosoftEvent(config.calendar_id!, localEvent.microsoft_event_id, msEvent);
            result.recordsUpdated++;
          } else {
            // Create new event
            msResponse = await this.createMicrosoftEvent(config.calendar_id!, msEvent);
            if (msResponse.success) {
              // Update local event with Microsoft ID
              await supabase
                .from('calendar_events')
                .update({
                  microsoft_event_id: msResponse.data?.id,
                  last_sync_at: new Date().toISOString()
                })
                .eq('id', localEvent.id);
              result.recordsCreated++;
            }
          }

          result.recordsProcessed++;
        } catch (eventError) {
          console.error('Failed to sync event to Microsoft:', eventError);
        }
      }

      return result;
    } catch (error) {
      return {
        ...result,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync events to Microsoft'
      };
    }
  }

  /**
   * Sync availability information
   */
  private async syncAvailability(config: Microsoft365Config): Promise<SyncResult> {
    const result = {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsDeleted: 0
    };

    try {
      const startTime = new Date().toISOString();
      const endTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Next 30 days

      const response = await this.makeRequest(
        `${this.API_BASE}/me/calendar/getSchedule`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.credentials.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            schedules: [config.calendar_id || 'primary'],
            startTime: { dateTime: startTime, timeZone: config.timezone || 'Europe/Warsaw' },
            endTime: { dateTime: endTime, timeZone: config.timezone || 'Europe/Warsaw' },
            availabilityViewInterval: 30
          })
        }
      );

      if (!response.success) {
        throw new Error(response.error);
      }

      const availabilityData = response.data.value || [];

      for (const availability of availabilityData) {
        // Process availability and update local database
        for (const scheduleItem of availability.scheduleItems || []) {
          await this.updateAvailabilitySlot(config.id, {
            start: scheduleItem.start.dateTime,
            end: scheduleItem.end.dateTime,
            is_available: scheduleItem.status === 'free',
            source: 'microsoft_calendar',
            status: scheduleItem.status
          });
          result.recordsUpdated++;
        }
      }

      result.recordsProcessed = availabilityData.length;
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
   * Sync Teams meetings
   */
  private async syncTeamsMeetings(config: Microsoft365Config): Promise<SyncResult> {
    const result = {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsDeleted: 0
    };

    try {
      if (!config.enable_teams_integration) {
        return result;
      }

      // Get events with Teams meetings
      const response = await this.makeRequest(
        `${this.API_BASE}/me/onlineMeetings?$filter=JoinWebUrl ne null`,
        {
          headers: {
            'Authorization': `Bearer ${config.credentials.access_token}`
          }
        }
      );

      if (!response.success) {
        throw new Error(response.error);
      }

      const meetings = response.data.value || [];

      for (const meeting of meetings) {
        // Process Teams meeting data
        await this.updateTeamsMeeting(config.id, {
          id: meeting.id,
          join_url: meeting.joinUrl,
          subject: meeting.subject,
          participants: meeting.participants
        });
        result.recordsUpdated++;
      }

      result.recordsProcessed = meetings.length;
      return result;
    } catch (error) {
      return {
        ...result,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync Teams meetings'
      };
    }
  }

  /**
   * Convert Microsoft event to local format
   */
  private async convertMicrosoftEventToLocal(msEvent: Microsoft365Event): Promise<Partial<CalendarEvent>> {
    return {
      external_id: msEvent.id,
      title: msEvent.subject,
      description: msEvent.body?.content,
      start_time: msEvent.start.dateTime,
      end_time: msEvent.end.dateTime,
      timezone: msEvent.start.timeZone,
      location: msEvent.location?.displayName,
      attendees: msEvent.attendees?.map(attendee => ({
        email: attendee.emailAddress.address,
        name: attendee.emailAddress.name,
        status: attendee.status.response === 'accepted' ? 'accepted' :
                attendee.status.response === 'declined' ? 'declined' :
                attendee.status.response === 'tentativelyAccepted' ? 'tentative' : 'needs_action',
        is_optional: attendee.type === 'optional'
      })),
      status: 'confirmed', // Microsoft doesn't have the same status concept
      recurrence: msEvent.recurrence ? this.convertMicrosoftRecurrence(msEvent.recurrence) : undefined,
      metadata: {
        web_link: msEvent.webLink,
        show_as: msEvent.showAs,
        sensitivity: msEvent.sensitivity,
        is_all_day: msEvent.isAllDay,
        is_online_meeting: msEvent.isOnlineMeeting,
        online_meeting: msEvent.onlineMeeting,
        response_requested: msEvent.responseRequested
      }
    };
  }

  /**
   * Convert local event to Microsoft format
   */
  private async convertLocalEventToMicrosoft(localEvent: Partial<CalendarEvent>): Promise<Partial<Microsoft365Event>> {
    const msEvent: Partial<Microsoft365Event> = {
      subject: localEvent.title,
      body: {
        contentType: 'html',
        content: localEvent.description || ''
      },
      start: {
        dateTime: localEvent.start_time,
        timeZone: localEvent.timezone || this.config.timezone
      },
      end: {
        dateTime: localEvent.end_time,
        timeZone: localEvent.timezone || this.config.timezone
      },
      location: localEvent.location ? {
        displayName: localEvent.location
      } : undefined,
      attendees: localEvent.attendees?.map(attendee => ({
        emailAddress: {
          name: attendee.name,
          address: attendee.email
        },
        status: {
          response: attendee.status === 'accepted' ? 'accepted' :
                    attendee.status === 'declined' ? 'declined' :
                    attendee.status === 'tentative' ? 'tentativelyAccepted' : 'notResponded'
        },
        type: attendee.is_optional ? 'optional' : 'required'
      })),
      showAs: 'busy',
      sensitivity: 'normal',
      isAllDay: false,
      responseRequested: true
    };

    const msConfig = this.config as Microsoft365Config;
    if (msConfig.auto_create_meetings && localEvent.is_virtual) {
      msEvent.isOnlineMeeting = true;
      msEvent.onlineMeetingProvider = 'teamsForBusiness';
    }

    if (localEvent.recurrence) {
      msEvent.recurrence = this.convertLocalRecurrenceToMicrosoft(localEvent.recurrence);
    }

    return msEvent;
  }

  /**
   * Create event in Microsoft Calendar
   */
  private async createMicrosoftEvent(calendarId: string, event: Partial<Microsoft365Event>): Promise<{ success: boolean; data?: Microsoft365Event; error?: string }> {
    const response = await this.makeRequest(
      `${this.API_BASE}/me/calendars/${encodeURIComponent(calendarId)}/events`,
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
   * Update event in Microsoft Calendar
   */
  private async updateMicrosoftEvent(calendarId: string, eventId: string, event: Partial<Microsoft365Event>): Promise<{ success: boolean; data?: Microsoft365Event; error?: string }> {
    const response = await this.makeRequest(
      `${this.API_BASE}/me/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
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
   * Convert Microsoft recurrence to local format
   */
  private convertMicrosoftRecurrence(msRecurrence: Microsoft365Event['recurrence']): CalendarRecurrence {
    if (!msRecurrence) return {} as CalendarRecurrence;

    const pattern = msRecurrence.pattern;
    const range = msRecurrence.range;

    return {
      frequency: pattern.type === 'daily' ? 'daily' :
                pattern.type === 'weekly' ? 'weekly' :
                pattern.type.includes('monthly') ? 'monthly' : 'yearly',
      interval: pattern.interval,
      end_date: range.type === 'endDate' ? range.endDate : undefined,
      occurrences: range.type === 'numbered' ? range.numberOfOccurrences : undefined,
      days_of_week: pattern.daysOfWeek?.map(day => this.convertMicrosoftDayToNumber(day))
    };
  }

  /**
   * Convert local recurrence to Microsoft format
   */
  private convertLocalRecurrenceToMicrosoft(recurrence: CalendarRecurrence): Microsoft365Event['recurrence'] {
    const pattern: any = {
      type: recurrence.frequency === 'daily' ? 'daily' :
            recurrence.frequency === 'weekly' ? 'weekly' :
            recurrence.frequency === 'monthly' ? 'absoluteMonthly' : 'absoluteYearly',
      interval: recurrence.interval || 1
    };

    if (recurrence.days_of_week) {
      pattern.daysOfWeek = recurrence.days_of_week.map(day => this.convertNumberToMicrosoftDay(day));
    }

    const range: any = {
      type: 'endDate',
      startDate: new Date().toISOString().split('T')[0]
    };

    if (recurrence.end_date) {
      range.endDate = recurrence.end_date;
    } else if (recurrence.occurrences) {
      range.type = 'numbered';
      range.numberOfOccurrences = recurrence.occurrences;
    } else {
      range.type = 'noEnd';
    }

    return { pattern, range };
  }

  /**
   * Convert Microsoft day to number
   */
  private convertMicrosoftDayToNumber(day: string): number {
    const dayMap: Record<string, number> = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    };
    return dayMap[day] || 1;
  }

  /**
   * Convert number to Microsoft day
   */
  private convertNumberToMicrosoftDay(day: number): string {
    const dayMap: Record<number, string> = {
      0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
      4: 'thursday', 5: 'friday', 6: 'saturday'
    };
    return dayMap[day] || 'monday';
  }

  /**
   * Find local event by Microsoft event ID
   */
  private async findLocalEvent(msEventId: string): Promise<any> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('microsoft_event_id', msEventId)
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
    status?: string;
  }): Promise<void> {
    await supabase
      .from('availability_slots')
      .upsert({
        integration_id,
        start_time: slot.start,
        end_time: slot.end,
        is_available: slot.is_available,
        source: slot.source,
        status: slot.status,
        updated_at: new Date().toISOString()
      });
  }

  /**
   * Update Teams meeting
   */
  private async updateTeamsMeeting(integrationId: string, meeting: {
    id: string;
    join_url: string;
    subject?: string;
    participants?: any;
  }): Promise<void> {
    await supabase
      .from('teams_meetings')
      .upsert({
        integration_id,
        meeting_id: meeting.id,
        join_url: meeting.join_url,
        subject: meeting.subject,
        participants: meeting.participants,
        updated_at: new Date().toISOString()
      });
  }

  /**
   * Process webhook notification
   */
  private async processNotification(notification: any): Promise<void> {
    // Process Microsoft Graph notifications
    await this.logEvent('webhook_notification', {
      notification_id: notification.id,
      resource: notification.resource,
      change_type: notification.changeType
    });
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

export default Microsoft365CalendarService;