/**
 * Multi-Channel Feedback Distribution Service
 * Intelligent survey distribution across email, SMS, in-app, and physical channels
 */

import { supabase } from '@/integrations/supabase/client';
import {
  FeedbackSurvey,
  SurveyType,
  ServiceType,
  SubmissionSource,
  VIPFeedbackPreferences,
  FeedbackTimingPreferences,
  AvoidPeriod
} from '@/types/feedback';

export interface DistributionConfig {
  surveyId: string;
  clientId?: string;
  targetSegment?: {
    serviceTypes?: ServiceType[];
    clientSegments?: string[];
    dateRange?: { start: string; end: string };
    satisfactionRange?: { min: number; max: number };
  };
  channels: SubmissionSource[];
  timing: {
    sendImmediately?: boolean;
    scheduledAt?: string;
    timezone?: string;
  };
  personalization?: {
    customMessage?: string;
    incentive?: {
      type: string;
      value: number;
      description: string;
    };
    branding?: {
      logo?: string;
      colors?: {
        primary?: string;
        secondary?: string;
      };
    };
  };
}

export interface DistributionResult {
  surveyId: string;
  totalRecipients: number;
  sentCounts: Record<SubmissionSource, number>;
  failedCounts: Record<SubmissionSource, number>;
  deliveryErrors: Array<{
    channel: SubmissionSource;
    recipientId: string;
    error: string;
  }>;
  scheduledFor?: string;
}

export interface QRCodeConfig {
  surveyId: string;
  location: string;
  serviceType?: ServiceType;
  customMessage?: string;
  branding?: {
    logo?: string;
    colors?: string[];
  };
  expiresAt?: string;
}

export class FeedbackDistributionService {
  private static instance: FeedbackDistributionService;

  static getInstance(): FeedbackDistributionService {
    if (!FeedbackDistributionService.instance) {
      FeedbackDistributionService.instance = new FeedbackDistributionService();
    }
    return FeedbackDistributionService.instance;
  }

  // =====================================================
  // MULTI-CHANNEL DISTRIBUTION
  // =====================================================

  /**
   * Distribute survey through multiple channels
   */
  async distributeSurvey(config: DistributionConfig): Promise<DistributionResult> {
    try {
      const result: DistributionResult = {
        surveyId: config.surveyId,
        totalRecipients: 0,
        sentCounts: {} as Record<SubmissionSource, number>,
        failedCounts: {} as Record<SubmissionSource, number>,
        deliveryErrors: []
      };

      // Get target recipients
      const recipients = await this.getTargetRecipients(config);
      result.totalRecipients = recipients.length;

      if (recipients.length === 0) {
        console.log('No recipients found for distribution');
        return result;
      }

      // Get survey details
      const survey = await this.getSurveyDetails(config.surveyId);
      if (!survey) {
        throw new Error('Survey not found');
      }

      // Distribution timing
      if (config.timing.sendImmediately) {
        // Send immediately
        await this.sendToAllChannels(recipients, config, survey, result);
      } else if (config.timing.scheduledAt) {
        // Schedule for later
        await this.scheduleDistribution(recipients, config, survey);
        result.scheduledFor = config.timing.scheduledAt;
      } else {
        // Use optimal timing
        const optimalTime = await this.calculateOptimalSendTime(recipients, config);
        await this.scheduleDistribution(recipients, config, survey, optimalTime);
        result.scheduledFor = optimalTime;
      }

      // Log distribution
      await this.logDistribution(config, result);

      return result;

    } catch (error) {
      console.error('Error distributing survey:', error);
      throw new Error('Failed to distribute survey');
    }
  }

  /**
   * Send survey through all configured channels
   */
  private async sendToAllChannels(
    recipients: any[],
    config: DistributionConfig,
    survey: FeedbackSurvey,
    result: DistributionResult
  ): Promise<void> {
    const channelPromises = config.channels.map(async (channel) => {
      try {
        const sent = await this.sendViaChannel(channel, recipients, config, survey);
        result.sentCounts[channel] = sent;

        // Track failed sends for this channel
        const failed = recipients.length - sent;
        if (failed > 0) {
          result.failedCounts[channel] = failed;
        }

      } catch (error) {
        console.error(`Error sending via ${channel}:`, error);
        result.failedCounts[channel] = recipients.length;
        result.deliveryErrors.push({
          channel,
          recipientId: 'batch',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    await Promise.all(channelPromises);
  }

  /**
   * Send survey via specific channel
   */
  private async sendViaChannel(
    channel: SubmissionSource,
    recipients: any[],
    config: DistributionConfig,
    survey: FeedbackSurvey
  ): Promise<number> {
    switch (channel) {
      case 'email':
        return this.sendViaEmail(recipients, config, survey);
      case 'sms':
        return this.sendViaSMS(recipients, config, survey);
      case 'in_app':
        return this.sendViaInApp(recipients, config, survey);
      case 'qr_code':
        return this.generateQRCodes(recipients, config, survey);
      case 'tablet':
        return this.setupTabletSurvey(recipients, config, survey);
      case 'mobile_app':
        return this.sendViaMobileApp(recipients, config, survey);
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }

  /**
   * Send survey via email
   */
  private async sendViaEmail(
    recipients: any[],
    config: DistributionConfig,
    survey: FeedbackSurvey
  ): Promise<number> {
    let sentCount = 0;

    for (const recipient of recipients) {
      try {
        // Get VIP preferences if applicable
        const vipPrefs = await this.getVIPPreferences(recipient.id);
        const personalizedConfig = this.personalizeForVIP(config, vipPrefs, 'email');

        // Generate personalized email content
        const emailContent = await this.generateEmailContent(
          recipient,
          survey,
          personalizedConfig
        );

        // Send email (integrate with your email service)
        await this.sendEmail({
          to: recipient.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
          tracking: {
            campaignId: `survey_${survey.id}`,
            recipientId: recipient.id,
            channel: 'email'
          }
        });

        sentCount++;

        // Log email sent
        await this.logEmailSent(recipient.id, survey.id, emailContent);

      } catch (error) {
        console.error(`Error sending email to ${recipient.email}:`, error);
      }
    }

    return sentCount;
  }

  /**
   * Send survey via SMS
   */
  private async sendViaSMS(
    recipients: any[],
    config: DistributionConfig,
    survey: FeedbackSurvey
  ): Promise<number> {
    let sentCount = 0;

    for (const recipient of recipients) {
      try {
        if (!recipient.phone) continue;

        const vipPrefs = await this.getVIPPreferences(recipient.id);
        const personalizedConfig = this.personalizeForVIP(config, vipPrefs, 'sms');

        // Generate SMS content
        const smsContent = await this.generateSMSContent(
          recipient,
          survey,
          personalizedConfig
        );

        // Send SMS (integrate with your SMS service)
        await this.sendSMS({
          to: recipient.phone,
          message: smsContent,
          tracking: {
            campaignId: `survey_${survey.id}`,
            recipientId: recipient.id,
            channel: 'sms'
          }
        });

        sentCount++;

      } catch (error) {
        console.error(`Error sending SMS to ${recipient.phone}:`, error);
      }
    }

    return sentCount;
  }

  /**
   * Send survey via in-app notifications
   */
  private async sendViaInApp(
    recipients: any[],
    config: DistributionConfig,
    survey: FeedbackSurvey
  ): Promise<number> {
    let sentCount = 0;

    for (const recipient of recipients) {
      try {
        const vipPrefs = await this.getVIPPreferences(recipient.id);
        const personalizedConfig = this.personalizeForVIP(config, vipPrefs, 'in_app');

        // Create in-app notification
        await this.createInAppNotification({
          userId: recipient.id,
          type: 'survey_invitation',
          title: this.getNotificationTitle(survey, personalizedConfig),
          message: this.getNotificationMessage(survey, personalizedConfig),
          data: {
            surveyId: survey.id,
            source: 'in_app'
          },
          priority: vipPrefs?.white_glove_service ? 'high' : 'normal',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });

        sentCount++;

      } catch (error) {
        console.error(`Error creating in-app notification for ${recipient.id}:`, error);
      }
    }

    return sentCount;
  }

  /**
   * Generate QR codes for physical locations
   */
  private async generateQRCodes(
    recipients: any[],
    config: DistributionConfig,
    survey: FeedbackSurvey
  ): Promise<number> {
    try {
      const qrConfig: QRCodeConfig = {
        surveyId: config.surveyId,
        location: config.targetSegment?.serviceTypes?.join(',') || 'general',
        serviceType: config.targetSegment?.serviceTypes?.[0],
        customMessage: config.personalization?.customMessage,
        branding: config.personalization?.branding,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      };

      // Generate QR code (integrate with QR code service)
      const qrCodeData = await this.generateQRCode(qrConfig);

      // Store QR code for location
      await this.storeLocationQRCode(qrConfig, qrCodeData);

      return 1; // QR codes are generated per location, not per recipient

    } catch (error) {
      console.error('Error generating QR codes:', error);
      return 0;
    }
  }

  /**
   * Setup tablet surveys for reception areas
   */
  private async setupTabletSurvey(
    recipients: any[],
    config: DistributionConfig,
    survey: FeedbackSurvey
  ): Promise<number> {
    try {
      // Create tablet survey configuration
      const tabletConfig = {
        surveyId: config.surveyId,
        location: 'reception',
        autoReset: true,
        timeoutMinutes: 5,
        branding: config.personalization?.branding,
        customWelcome: config.personalization?.customMessage
      };

      // Store tablet configuration
      await this.storeTabletConfiguration(tabletConfig);

      return 1; // One setup per location

    } catch (error) {
      console.error('Error setting up tablet survey:', error);
      return 0;
    }
  }

  /**
   * Send via mobile app push notifications
   */
  private async sendViaMobileApp(
    recipients: any[],
    config: DistributionConfig,
    survey: FeedbackSurvey
  ): Promise<number> {
    let sentCount = 0;

    for (const recipient of recipients) {
      try {
        // Get device tokens for recipient
        const deviceTokens = await this.getDeviceTokens(recipient.id);

        if (deviceTokens.length === 0) continue;

        const vipPrefs = await this.getVIPPreferences(recipient.id);
        const personalizedConfig = this.personalizeForVIP(config, vipPrefs, 'mobile_app');

        // Send push notification
        await this.sendPushNotification({
          tokens: deviceTokens,
          title: this.getNotificationTitle(survey, personalizedConfig),
          message: this.getNotificationMessage(survey, personalizedConfig),
          data: {
            surveyId: survey.id,
            source: 'mobile_app'
          },
          priority: vipPrefs?.white_glove_service ? 'high' : 'normal'
        });

        sentCount++;

      } catch (error) {
        console.error(`Error sending push notification to ${recipient.id}:`, error);
      }
    }

    return sentCount;
  }

  // =====================================================
  // TIMING OPTIMIZATION
  // =====================================================

  /**
   * Calculate optimal send time based on client preferences and engagement patterns
   */
  private async calculateOptimalSendTime(
    recipients: any[],
    config: DistributionConfig
  ): Promise<string> {
    const timingScores: Record<string, number> = {};

    // Analyze each hour of the next 7 days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      for (let hour = 0; hour < 24; hour++) {
        const candidateTime = new Date();
        candidateTime.setDate(candidateTime.getDate() + dayOffset);
        candidateTime.setHours(hour, 0, 0, 0);

        const score = await this.calculateTimingScore(candidateTime, recipients, config);
        const timeKey = candidateTime.toISOString();
        timingScores[timeKey] = score;
      }
    }

    // Find the time with highest score
    const optimalTime = Object.entries(timingScores).reduce((best, [time, score]) =>
      score > best.score ? { time, score } : best,
      { time: new Date().toISOString(), score: 0 }
    );

    return optimalTime.time;
  }

  /**
   * Calculate timing score for a specific datetime
   */
  private async calculateTimingScore(
    dateTime: Date,
    recipients: any[],
    config: DistributionConfig
  ): Promise<number> {
    let score = 0;

    const hour = dateTime.getHours();
    const dayOfWeek = dateTime.getDay();
    const timezone = config.timing.timezone || 'Europe/Warsaw';

    // Business hours preference (9 AM - 6 PM)
    if (hour >= 9 && hour <= 18) {
      score += 20;
    }

    // Avoid early morning and late evening
    if (hour < 8 || hour > 20) {
      score -= 10;
    }

    // Weekday vs weekend preferences
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      score += 15; // Weekdays
    } else {
      score += 5;  // Weekends
    }

    // Individual client preferences
    for (const recipient of recipients) {
      const vipPrefs = await this.getVIPPreferences(recipient.id);
      if (vipPrefs?.feedback_timing) {
        const clientScore = this.calculateClientTimingScore(
          dateTime,
          vipPrefs.feedback_timing,
          timezone
        );
        score += clientScore / recipients.length;
      }
    }

    // Historical engagement patterns
    const historicalScore = await this.getHistoricalEngagementScore(dateTime, recipients);
    score += historicalScore;

    return score;
  }

  /**
   * Calculate timing score based on VIP preferences
   */
  private calculateClientTimingScore(
    dateTime: Date,
    preferences: FeedbackTimingPreferences,
    timezone: string
  ): number {
    let score = 0;

    const hour = dateTime.getHours();
    const dayOfWeek = dateTime.getDay();

    // Preferred days
    if (preferences.preferred_days.includes(dayOfWeek)) {
      score += 30;
    }

    // Preferred times
    const timeMatches = preferences.preferred_times.some(preferredTime => {
      const [preferredHour] = preferredTime.split(':').map(Number);
      return Math.abs(hour - preferredHour) <= 1; // Within 1 hour
    });

    if (timeMatches) {
      score += 40;
    }

    // Avoid periods
    const isInAvoidPeriod = preferences.avoid_periods.some(period => {
      const start = new Date(period.start_date);
      const end = new Date(period.end_date);
      return dateTime >= start && dateTime <= end;
    });

    if (isInAvoidPeriod) {
      score -= 100; // Heavy penalty for avoid periods
    }

    return score;
  }

  /**
   * Get historical engagement patterns for specific time
   */
  private async getHistoricalEngagementScore(
    dateTime: Date,
    recipients: any[]
  ): Promise<number> {
    try {
      const hour = dateTime.getHours();
      const dayOfWeek = dateTime.getDay();

      // Query historical engagement data
      const { data: engagementData } = await supabase
        .from('feedback_engagement_history')
        .select('engagement_rate')
        .eq('hour', hour)
        .eq('day_of_week', dayOfWeek);

      if (engagementData && engagementData.length > 0) {
        const avgEngagement = engagementData.reduce((sum, data) => sum + data.engagement_rate, 0) / engagementData.length;
        return avgEngagement * 10; // Scale to 0-100 range
      }

      return 0; // No historical data available

    } catch (error) {
      console.error('Error getting historical engagement score:', error);
      return 0;
    }
  }

  // =====================================================
  // PERSONALIZATION
  // =====================================================

  /**
   * Personalize distribution config for VIP clients
   */
  private personalizeForVIP(
    config: DistributionConfig,
    vipPrefs: VIPFeedbackPreferences | null,
    channel: SubmissionSource
  ): DistributionConfig {
    if (!vipPrefs) return config;

    const personalized = { ...config };

    // Use preferred channels
    if (vipPrefs.preferred_contact_methods.includes(channel)) {
      // This channel is preferred - apply VIP enhancements
      personalized.personalization = {
        ...config.personalization,
        customMessage: vipPrefs.white_glove_service
          ? this.generateVIPMessage(vipPrefs, channel)
          : config.personalization?.customMessage,
        incentive: vipPrefs.incentive_preferences.prefers_offers
          ? {
              type: vipPrefs.incentive_preferences.offer_types[0] || 'discount',
              value: vipPrefs.incentive_preferences.minimum_value_threshold || 20,
              description: 'Exclusive offer for valued clients'
            }
          : config.personalization?.incentive
      };
    }

    return personalized;
  }

  /**
   * Generate VIP-specific message
   */
  private generateVIPMessage(vipPrefs: VIPFeedbackPreferences, channel: SubmissionSource): string {
    const baseMessages = {
      email: 'As a valued VIP client, your feedback is incredibly important to us. Your insights help us continuously improve our premium services.',
      sms: 'VIP Feedback Request: Your opinion matters! Help us enhance your luxury experience.',
      in_app: 'Exclusive VIP Feedback - Your voice shapes our premium service experience.',
      mobile_app: 'VIP Client Survey - Share your thoughts on your luxury experience.'
    };

    return baseMessages[channel] || baseMessages.email;
  }

  // =====================================================
  // CONTENT GENERATION
  // =====================================================

  /**
   * Generate email content
   */
  private async generateEmailContent(
    recipient: any,
    survey: FeedbackSurvey,
    config: DistributionConfig
  ): Promise<{ subject: string; html: string; text: string }> {
    const subject = `Your Feedback Matters - ${survey.title_en}`;

    const surveyUrl = this.generateSurveyURL(survey.id, recipient.id, 'email');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Feedback Request</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          ${config.personalization?.branding?.logo
            ? `<img src="${config.personalization.branding.logo}" alt="Logo" style="max-height: 60px;">`
            : ''}
        </div>

        <h1 style="color: #333; margin-bottom: 20px;">
          Hello ${recipient.first_name || 'Valued Client'},
        </h1>

        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          ${config.personalization?.customMessage || 'We would love to hear about your recent experience with us.'}
        </p>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #333;">${survey.title_en}</h3>
          <p style="color: #666; margin-bottom: 20px;">${survey.description_en || 'Your feedback helps us improve.'}</p>

          <a href="${surveyUrl}"
             style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Take Survey
          </a>
        </div>

        ${config.personalization?.incentive ? `
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
          <p style="margin: 0; color: #856404;">
            <strong>Special Offer:</strong> Complete the survey and receive a ${config.personalization.incentive.description}!
          </p>
        </div>
        ` : ''}

        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          This survey should take approximately 2-3 minutes to complete. Your responses are confidential and will help us improve our services.
        </p>
      </body>
      </html>
    `;

    const text = `
      Hello ${recipient.first_name || 'Valued Client'},

      ${config.personalization?.customMessage || 'We would love to hear about your recent experience with us.'}

      ${survey.title_en}
      ${survey.description_en || 'Your feedback helps us improve.'}

      Take the survey here: ${surveyUrl}

      ${config.personalization?.incentive ? `Special Offer: Complete the survey and receive a ${config.personalization.incentive.description}!` : ''}

      This survey should take approximately 2-3 minutes to complete. Your responses are confidential and will help us improve our services.
    `;

    return { subject, html, text };
  }

  /**
   * Generate SMS content
   */
  private async generateSMSContent(
    recipient: any,
    survey: FeedbackSurvey,
    config: DistributionConfig
  ): Promise<string> {
    const surveyUrl = this.generateSurveyURL(survey.id, recipient.id, 'sms');

    let message = `Hi ${recipient.first_name || 'there'}! We'd love your feedback about your recent experience. `;
    message += config.personalization?.customMessage || 'Your opinion matters to us.';
    message += ` Take our quick survey: ${surveyUrl}`;

    if (config.personalization?.incentive) {
      message += ` Get a ${config.personalization.incentive.description} for completing it!`;
    }

    message += ' Reply STOP to unsubscribe.';

    return message;
  }

  /**
   * Generate survey URL
   */
  private generateSurveyURL(surveyId: string, recipientId: string, source: SubmissionSource): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mariaborysevych.com';
    return `${baseUrl}/feedback/${surveyId}?recipient=${recipientId}&source=${source}`;
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  private async getTargetRecipients(config: DistributionConfig): Promise<any[]> {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          bookings!bookings_client_id_fkey (id, service_id, created_at),
          satisfaction_metrics!satisfaction_metrics_client_id_fkey (score, measurement_date)
        `);

      // Apply service type filter
      if (config.targetSegment?.serviceTypes?.length) {
        query = query.in('bookings.service_id', config.targetSegment.serviceTypes);
      }

      // Apply client segment filter
      if (config.targetSegment?.clientSegments?.length) {
        // Would need to implement client segmentation logic
      }

      // Apply date range filter
      if (config.targetSegment?.dateRange) {
        query = query
          .gte('bookings.created_at', config.targetSegment.dateRange.start)
          .lte('bookings.created_at', config.targetSegment.dateRange.end);
      }

      // Apply satisfaction range filter
      if (config.targetSegment?.satisfactionRange) {
        query = query
          .gte('satisfaction_metrics.score', config.targetSegment.satisfactionRange.min)
          .lte('satisfaction_metrics.score', config.targetSegment.satisfactionRange.max);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('Error getting target recipients:', error);
      return [];
    }
  }

  private async getSurveyDetails(surveyId: string): Promise<FeedbackSurvey | null> {
    try {
      const { data, error } = await supabase
        .from('feedback_surveys')
        .select('*')
        .eq('id', surveyId)
        .single();

      if (error) return null;
      return data as FeedbackSurvey;

    } catch (error) {
      console.error('Error getting survey details:', error);
      return null;
    }
  }

  private async getVIPPreferences(clientId: string): Promise<VIPFeedbackPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('vip_feedback_preferences')
        .select('*')
        .eq('client_id', clientId)
        .single();

      if (error) return null;
      return data as VIPFeedbackPreferences;

    } catch (error) {
      console.error('Error getting VIP preferences:', error);
      return null;
    }
  }

  private async getDeviceTokens(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('user_device_tokens')
        .select('token')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) return [];
      return data?.map(d => d.token) || [];

    } catch (error) {
      console.error('Error getting device tokens:', error);
      return [];
    }
  }

  // These methods would integrate with your actual services
  private async sendEmail(params: any): Promise<void> {
    // Integrate with your email service (SendGrid, AWS SES, etc.)
    console.log('Sending email:', params);
  }

  private async sendSMS(params: any): Promise<void> {
    // Integrate with your SMS service (Twilio, etc.)
    console.log('Sending SMS:', params);
  }

  private async createInAppNotification(params: any): Promise<void> {
    // Store in-app notification in database
    await supabase.from('notifications').insert(params);
  }

  private async sendPushNotification(params: any): Promise<void> {
    // Integrate with push notification service (Firebase, etc.)
    console.log('Sending push notification:', params);
  }

  private async generateQRCode(config: QRCodeConfig): Promise<string> {
    // Integrate with QR code generation service
    return `qr_code_data_${config.surveyId}_${Date.now()}`;
  }

  private async storeLocationQRCode(config: QRCodeConfig, data: string): Promise<void> {
    // Store QR code in database
    await supabase.from('location_qr_codes').insert({
      survey_id: config.surveyId,
      location: config.location,
      qr_data: data,
      expires_at: config.expiresAt,
      created_at: new Date().toISOString()
    });
  }

  private async storeTabletConfiguration(config: any): Promise<void> {
    // Store tablet configuration
    await supabase.from('tablet_surveys').insert(config);
  }

  private getNotificationTitle(survey: FeedbackSurvey, config: any): string {
    return config.personalization?.customMessage
      ? 'Personal Feedback Request'
      : survey.title_en;
  }

  private getNotificationMessage(survey: FeedbackSurvey, config: any): string {
    return `We'd love to hear about your recent experience. This survey takes just 2-3 minutes.`;
  }

  private async logEmailSent(recipientId: string, surveyId: string, content: any): Promise<void> {
    await supabase.from('email_logs').insert({
      recipient_id: recipientId,
      survey_id: surveyId,
      subject: content.subject,
      sent_at: new Date().toISOString()
    });
  }

  private async scheduleDistribution(
    recipients: any[],
    config: DistributionConfig,
    survey: FeedbackSurvey,
    scheduledTime?: string
  ): Promise<void> {
    const scheduleData = {
      survey_id: config.surveyId,
      recipients: recipients.map(r => r.id),
      channels: config.channels,
      config: config,
      scheduled_for: scheduledTime || config.timing.scheduledAt,
      status: 'scheduled',
      created_at: new Date().toISOString()
    };

    await supabase.from('scheduled_distributions').insert(scheduleData);
  }

  private async logDistribution(config: DistributionConfig, result: DistributionResult): Promise<void> {
    await supabase.from('distribution_logs').insert({
      survey_id: config.surveyId,
      config: config,
      result: result,
      created_at: new Date().toISOString()
    });
  }
}

// Export singleton instance
export const feedbackDistributionService = FeedbackDistributionService.getInstance();