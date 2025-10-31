import { supabase } from '@/integrations/supabase/client';
import {
  EmailCampaign,
  EmailSequence,
  EmailAnalytics,
  EmailCampaignType,
  EmailScheduleType,
  EmailTriggerType,
  EmailStatus,
  EmailPriority
} from '@/integrations/supabase/types/marketing.types';

// Email template system
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
  template_type: EmailCampaignType;
  variables: string[];
  styles: {
    primary_color: string;
    secondary_color: string;
    font_family: string;
    logo_url: string;
  };
  is_active: boolean;
  usage_count: number;
}

// Personalization variables
interface PersonalizationVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'array';
  description: string;
  default_value?: any;
  required: boolean;
  source: 'user_profile' | 'booking_data' | 'service_data' | 'custom';
}

// Segmentation criteria
interface SegmentCriteria {
  demographics?: {
    age_range?: { min: number; max: number };
    gender?: string[];
    location?: string[];
    language?: string[];
  };
  behavior?: {
    booking_count?: { min: number; max: number };
    total_spent?: { min: number; max: number };
    last_booking_date?: { from: string; to: string };
    preferred_services?: string[];
    engagement_level?: 'high' | 'medium' | 'low';
  };
  preferences?: {
    communication_preferences?: string[];
    preferred_language?: string;
    timezone?: string;
  };
  custom?: Record<string, any>;
}

// Email automation workflows
interface WorkflowStep {
  id: string;
  name: string;
  type: 'email' | 'delay' | 'condition' | 'action';
  template_id?: string;
  delay_minutes?: number;
  conditions?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
  }[];
  actions?: {
    type: 'add_tag' | 'remove_tag' | 'update_field' | 'trigger_sequence';
    parameters: any;
  }[];
  next_step_id?: string;
  alternative_next_step_id?: string;
}

interface EmailCampaignRequest {
  name: string;
  campaign_type: EmailCampaignType;
  subject_template?: string;
  content_template?: string;
  target_segment?: SegmentCriteria;
  schedule_type: EmailScheduleType;
  scheduled_at?: string;
  priority: EmailPriority;
  personalization_variables?: Record<string, any>;
  test_mode?: boolean;
  budget?: number;
}

interface PersonalizedEmail {
  to: string;
  subject: string;
  html_content: string;
  text_content: string;
  variables: Record<string, any>;
  unsubscribe_url: string;
  track_open_url: string;
  track_click_url: string;
}

export class EmailMarketingService {
  private readonly WARSOW_TIMEZONE = 'Europe/Warsaw';
  private readonly BRAND_COLORS = {
    primary: '#8B4513', // Cocoa
    secondary: '#F5DEB3', // Champagne
    accent: '#D4AF37'   // Gold
  };

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Initialize default email templates
   */
  private async initializeDefaultTemplates(): Promise<void> {
    const defaultTemplates = [
      {
        name: 'Welcome Email',
        subject: 'Witaj w mariiaborysevych! Zacznij swoją podróż piękna',
        template_type: 'automated' as EmailCampaignType,
        html_content: this.getWelcomeEmailTemplate(),
        text_content: this.getWelcomeEmailTextTemplate(),
        variables: ['first_name', 'last_name', 'preferred_services', 'booking_url']
      },
      {
        name: 'Booking Confirmation',
        subject: 'Potwierdzenie rezerwacji - {{service_name}}',
        template_type: 'transactional' as EmailCampaignType,
        html_content: this.getBookingConfirmationTemplate(),
        text_content: this.getBookingConfirmationTextTemplate(),
        variables: ['first_name', 'service_name', 'booking_date', 'booking_time', 'location', 'total_amount']
      },
      {
        name: 'Post-Treatment Care',
        subject: 'Instrukcje pielęgnacyjne po zabiegu {{service_name}}',
        template_type: 'automated' as EmailCampaignType,
        html_content: this.getPostTreatmentCareTemplate(),
        text_content: this.getPostTreatmentCareTextTemplate(),
        variables: ['first_name', 'service_name', 'aftercare_instructions', 'next_appointment_date', 'contact_info']
      },
      {
        name: 'Monthly Newsletter',
        subject: 'mariiaborysevych - {{month}} nowości i promocje',
        template_type: 'newsletter' as EmailCampaignType,
        html_content: this.getNewsletterTemplate(),
        text_content: this.getNewsletterTextTemplate(),
        variables: ['first_name', 'month', 'featured_services', 'promotions', 'tips', 'blog_posts']
      },
      {
        name: 'Special Promotion',
        subject: 'Ekskluzywna oferta - {{discount_percentage}}% zniżki!',
        template_type: 'promotional' as EmailCampaignType,
        html_content: this.getPromotionEmailTemplate(),
        text_content: this.getPromotionEmailTextTemplate(),
        variables: ['first_name', 'discount_percentage', 'promotion_code', 'valid_until', 'featured_services']
      },
      {
        name: 'Re-engagement Campaign',
        subject: 'Tęsknimy za Tobą! Odbierz {{discount_percentage}}% zniżki',
        template_type: 'automated' as EmailCampaignType,
        html_content: this.getReengagementTemplate(),
        text_content: this.getReengagementTextTemplate(),
        variables: ['first_name', 'last_booking_date', 'discount_percentage', 'promotion_code', 'popular_services']
      }
    ];

    for (const templateData of defaultTemplates) {
      try {
        const { data: existing } = await supabase
          .from('email_templates')
          .select('id')
          .eq('name', templateData.name)
          .single();

        if (!existing) {
          await supabase
            .from('email_templates')
            .insert({
              ...templateData,
              styles: {
                primary_color: this.BRAND_COLORS.primary,
                secondary_color: this.BRAND_COLORS.secondary,
                font_family: 'Inter, sans-serif',
                logo_url: 'https://mariaborysevych.com/logo.png'
              },
              is_active: true,
              usage_count: 0
            });
        }
      } catch (error) {
        console.error(`Error initializing template ${templateData.name}:`, error);
      }
    }
  }

  /**
   * Create email campaign
   */
  async createCampaign(request: EmailCampaignRequest): Promise<EmailCampaign> {
    try {
      // Validate campaign data
      this.validateCampaignRequest(request);

      // Create campaign record
      const { data, error } = await supabase
        .from('email_campaigns')
        .insert({
          name: request.name,
          campaign_type: request.campaign_type,
          subject_template: request.subject_template,
          content_template: request.content_template,
          target_segment: request.target_segment || {},
          schedule_type: request.schedule_type,
          scheduled_at: request.scheduled_at,
          send_timezone: this.WARSOW_TIMEZONE,
          priority: request.priority,
          budget: request.budget,
          target_metrics: this.getDefaultTargetMetrics(request.campaign_type),
          personalization_vars: request.personalization_variables || {},
          status: this.getInitialCampaignStatus(request.schedule_type, request.scheduled_at)
        })
        .select()
        .single();

      if (error) throw error;

      // If test mode, send test email
      if (request.test_mode) {
        await this.sendTestCampaign(data.id);
      }

      // If scheduled, queue for sending
      if (data.status === 'scheduled') {
        await this.queueCampaignForSending(data.id);
      }

      return data;
    } catch (error) {
      console.error('Error creating email campaign:', error);
      throw error;
    }
  }

  /**
   * Send campaign to target audience
   */
  async sendCampaign(campaignId: string): Promise<{ success: boolean; sent_count: number; errors: string[] }> {
    try {
      // Get campaign details
      const { data: campaign, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error || !campaign) {
        throw new Error('Campaign not found');
      }

      // Get target audience based on segmentation
      const targetRecipients = await this.getTargetRecipients(campaign.target_segment);

      if (targetRecipients.length === 0) {
        return { success: true, sent_count: 0, errors: ['No recipients found for target segment'] };
      }

      // Get email template
      const template = await this.getEmailTemplate(campaign.campaign_type);
      if (!template) {
        throw new Error('Email template not found');
      }

      let sentCount = 0;
      const errors: string[] = [];

      // Process recipients in batches
      const batchSize = 50;
      for (let i = 0; i < targetRecipients.length; i += batchSize) {
        const batch = targetRecipients.slice(i, i + batchSize);

        for (const recipient of batch) {
          try {
            // Personalize email
            const personalizedEmail = await this.personalizeEmail(
              template,
              recipient,
              campaign.personalization_vars || {}
            );

            // Send email
            const sendResult = await this.sendEmail(personalizedEmail);

            if (sendResult.success) {
              sentCount++;

              // Track analytics
              await supabase
                .from('email_analytics')
                .insert({
                  campaign_id: campaignId,
                  recipient_id: recipient.id,
                  email: recipient.email,
                  sent_at: new Date().toISOString(),
                  status: EmailStatus.SENT,
                  device_type: 'unknown',
                  client_type: 'email'
                });
            } else {
              errors.push(`Failed to send to ${recipient.email}: ${sendResult.error}`);
            }
          } catch (error) {
            errors.push(`Error processing ${recipient.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        // Add delay between batches to avoid rate limiting
        if (i + batchSize < targetRecipients.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Update campaign status
      await supabase
        .from('email_campaigns')
        .update({
          status: EmailStatus.SENT,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId);

      return {
        success: errors.length === 0,
        sent_count: sentCount,
        errors
      };
    } catch (error) {
      console.error('Error sending campaign:', error);
      throw error;
    }
  }

  /**
   * Create automated email sequence
   */
  async createEmailSequence(
    name: string,
    triggerType: EmailTriggerType,
    triggerConditions: Record<string, any>,
    steps: WorkflowStep[]
  ): Promise<EmailSequence> {
    try {
      const { data, error } = await supabase
        .from('email_sequences')
        .insert({
          name,
          trigger_type: triggerType,
          trigger_conditions: triggerConditions,
          steps: steps,
          is_active: true,
          priority: this.calculateSequencePriority(triggerType)
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating email sequence:', error);
      throw error;
    }
  }

  /**
   * Trigger email sequence based on event
   */
  async triggerSequence(
    triggerType: EmailTriggerType,
    triggerData: Record<string, any>,
    recipientId: string
  ): Promise<void> {
    try {
      // Find active sequences for this trigger type
      const { data: sequences } = await supabase
        .from('email_sequences')
        .select('*')
        .eq('trigger_type', triggerType)
        .eq('is_active', true);

      if (!sequences || sequences.length === 0) return;

      // Get recipient data
      const { data: recipient } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', recipientId)
        .single();

      if (!recipient) return;

      // Process each sequence
      for (const sequence of sequences) {
        // Check if trigger conditions are met
        if (this.evaluateTriggerConditions(sequence.trigger_conditions, triggerData)) {
          await this.executeSequenceSteps(sequence, recipient, triggerData);
        }
      }
    } catch (error) {
      console.error('Error triggering sequence:', error);
    }
  }

  /**
   * Get email analytics and performance metrics
   */
  async getEmailAnalytics(
    campaignId?: string,
    dateRange?: { start: string; end: string }
  ): Promise<{
    total_sent: number;
    total_delivered: number;
    total_opened: number;
    total_clicked: number;
    total_unsubscribed: number;
    total_bounced: number;
    open_rate: number;
    click_rate: number;
    click_to_open_rate: number;
    unsubscribe_rate: number;
    bounce_rate: number;
    top_performing_campaigns: Array<{
      campaign_id: string;
      campaign_name: string;
      sent_count: number;
      open_rate: number;
      click_rate: number;
    }>;
    device_breakdown: Record<string, number>;
    time_series: Array<{
      date: string;
      sent: number;
      opened: number;
      clicked: number;
    }>;
  }> {
    try {
      let query = supabase
        .from('email_analytics')
        .select('*');

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);
      }

      const { data, error } = await query;

      if (error || !data) {
        throw new Error('Failed to fetch email analytics');
      }

      // Calculate metrics
      const totalSent = data.filter(a => a.status === 'sent').length;
      const totalDelivered = data.filter(a => a.delivered_at).length;
      const totalOpened = data.filter(a => a.opened_at).length;
      const totalClicked = data.filter(a => a.clicked_at).length;
      const totalUnsubscribed = data.filter(a => a.unsubscribed_at).length;
      const totalBounced = data.filter(a => a.bounced_at).length;

      const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
      const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
      const clickToOpenRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;
      const unsubscribeRate = totalSent > 0 ? (totalUnsubscribed / totalSent) * 100 : 0;
      const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;

      // Device breakdown
      const deviceBreakdown: Record<string, number> = {};
      data.forEach(analytics => {
        const device = analytics.device_type || 'unknown';
        deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;
      });

      // Time series data
      const timeSeries = this.generateTimeSeriesData(data);

      // Top performing campaigns
      const campaignStats: Record<string, {
        campaign_id: string;
        campaign_name: string;
        sent_count: number;
        open_count: number;
        click_count: number;
      }> = {};

      data.forEach(analytics => {
        const campaignId = analytics.campaign_id || 'unknown';
        if (!campaignStats[campaignId]) {
          campaignStats[campaignId] = {
            campaign_id: campaignId,
            campaign_name: `Campaign ${campaignId}`,
            sent_count: 0,
            open_count: 0,
            click_count: 0
          };
        }

        if (analytics.status === 'sent') campaignStats[campaignId].sent_count++;
        if (analytics.opened_at) campaignStats[campaignId].open_count++;
        if (analytics.clicked_at) campaignStats[campaignId].click_count++;
      });

      const topPerformingCampaigns = Object.values(campaignStats)
        .map(campaign => ({
          campaign_id: campaign.campaign_id,
          campaign_name: campaign.campaign_name,
          sent_count: campaign.sent_count,
          open_rate: campaign.sent_count > 0 ? (campaign.open_count / campaign.sent_count) * 100 : 0,
          click_rate: campaign.sent_count > 0 ? (campaign.click_count / campaign.sent_count) * 100 : 0
        }))
        .sort((a, b) => b.open_rate - a.open_rate)
        .slice(0, 10);

      return {
        total_sent: totalSent,
        total_delivered: totalDelivered,
        total_opened: totalOpened,
        total_clicked: totalClicked,
        total_unsubscribed: totalUnsubscribed,
        total_bounced: totalBounced,
        open_rate: Math.round(openRate * 100) / 100,
        click_rate: Math.round(clickRate * 100) / 100,
        click_to_open_rate: Math.round(clickToOpenRate * 100) / 100,
        unsubscribe_rate: Math.round(unsubscribeRate * 100) / 100,
        bounce_rate: Math.round(bounceRate * 100) / 100,
        top_performing_campaigns: topPerformingCampaigns,
        device_breakdown: deviceBreakdown,
        time_series: timeSeries
      };
    } catch (error) {
      console.error('Error getting email analytics:', error);
      throw error;
    }
  }

  /**
   * Personalize email content for recipient
   */
  private async personalizeEmail(
    template: EmailTemplate,
    recipient: any,
    additionalVariables: Record<string, any> = {}
  ): Promise<PersonalizedEmail> {
    try {
      // Combine all variables
      const variables = {
        first_name: recipient.first_name || recipient.full_name?.split(' ')[0] || 'Klientko',
        last_name: recipient.last_name || recipient.full_name?.split(' ').slice(1).join(' ') || '',
        email: recipient.email,
        ...additionalVariables
      };

      // Replace variables in subject
      let subject = template.subject;
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, String(value));
      });

      // Replace variables in HTML content
      let htmlContent = template.html_content;
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        htmlContent = htmlContent.replace(regex, String(value));
      });

      // Replace variables in text content
      let textContent = template.text_content;
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        textContent = textContent.replace(regex, String(value));
      });

      // Add tracking pixels and links
      const trackingDomain = 'https://track.mariaborysevych.com';
      const unsubscribeUrl = `${trackingDomain}/unsubscribe?email=${encodeURIComponent(recipient.email)}`;
      const trackOpenUrl = `${trackingDomain}/open?email=${encodeURIComponent(recipient.email)}&campaign=${template.id}`;

      return {
        to: recipient.email,
        subject,
        html_content: this.addTrackingToHTML(htmlContent, trackOpenUrl),
        text_content: textContent,
        variables,
        unsubscribe_url: unsubscribeUrl,
        track_open_url: trackOpenUrl,
        track_click_url: trackingDomain
      };
    } catch (error) {
      console.error('Error personalizing email:', error);
      throw error;
    }
  }

  /**
   * Send email via email service provider
   */
  private async sendEmail(email: PersonalizedEmail): Promise<{ success: boolean; error?: string }> {
    try {
      // In production, this would integrate with an email service like SendGrid, Mailchimp, etc.
      // For now, we'll simulate the sending process

      console.log(`Sending email to ${email.to}: ${email.subject}`);

      // Simulate email sending with 95% success rate
      const success = Math.random() > 0.05;

      if (success) {
        return { success: true };
      } else {
        return { success: false, error: 'Simulated sending failure' };
      }
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Template methods
  private getWelcomeEmailTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Witaj w mariiaborysevych</title>
      </head>
      <body style="font-family: Inter, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 30px; text-align: center; border-bottom: 1px solid #f0f0f0;">
                    <h1 style="color: ${this.BRAND_COLORS.primary}; margin: 0; font-size: 32px;">Witaj {{first_name}}!</h1>
                    <p style="color: #666; margin: 10px 0 0; font-size: 18px;">Dziękujemy za dołączenie do mariiaborysevych</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 30px;">
                    <p style="color: #333; line-height: 1.6; font-size: 16px;">Jesteśmy szczęśliwi, że możesz stać się częścią naszej społeczności skupionej na pięknie i dobrym samopoczuciu.</p>

                    <h2 style="color: ${this.BRAND_COLORS.primary}; margin: 25px 0 15px;">Co czeka na Ciebie?</h2>
                    <ul style="color: #333; line-height: 1.8;">
                      <li>Profesjonalne usługi kosmetyczne i fitness</li>
                      <li>Indywidualne podejście do każdego klienta</li>
                      <li>Ekskluzywne promocje dla subskrybentów</li>
                      <li>Porady ekspertów w dziedzinie urody</li>
                    </ul>

                    <div style="text-align: center; margin: 30px 0;">
                      <a href="{{booking_url}}" style="background-color: ${this.BRAND_COLORS.primary}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Umów pierwszą wizytę</a>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; text-align: center; border-top: 1px solid #f0f0f0; color: #666; font-size: 14px;">
                    <p>mariiaborysevych<br>ul. Jana Pawła II 43/15, 00-001 Warszawa</p>
                    <p style="margin: 15px 0 0;">Do zobaczenia wkrótce!</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  private getWelcomeEmailTextTemplate(): string {
    return `
Witaj {{first_name}}!

Dziękujemy za dołączenie do mariiaborysevych. Jesteśmy szczęśliwi, że możesz stać się częścią naszej społeczności skupionej na pięknie i dobrym samopoczuciu.

Co czeka na Ciebie?
- Profesjonalne usługi kosmetyczne i fitness
- Indywidualne podejście do każdego klienta
- Ekskluzywne promocje dla subskrybentów
- Porady ekspertów w dziedzinie urody

Umów swoją pierwszą wizytę już dziś: {{booking_url}}

Do zobaczenia wkrótce!
Zespół mariiaborysevych
    `;
  }

  private getBookingConfirmationTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Potwierdzenie rezerwacji</title>
      </head>
      <body style="font-family: Inter, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 30px; text-align: center; border-bottom: 1px solid #f0f0f0;">
                    <h1 style="color: ${this.BRAND_COLORS.primary}; margin: 0; font-size: 28px;">Potwierdzenie rezerwacji</h1>
                    <p style="color: #666; margin: 10px 0 0; font-size: 16px;">Twoja wizyta została pomyślnie zarezerwowana</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 30px;">
                    <h2 style="color: ${this.BRAND_COLORS.primary}; margin: 0 0 20px;">Szczegóły rezerwacji</h2>

                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <p style="margin: 0 0 10px; color: #333;"><strong>Usługa:</strong> {{service_name}}</p>
                      <p style="margin: 0 0 10px; color: #333;"><strong>Data:</strong> {{booking_date}}</p>
                      <p style="margin: 0 0 10px; color: #333;"><strong>Godzina:</strong> {{booking_time}}</p>
                      <p style="margin: 0 0 10px; color: #333;"><strong>Lokalizacja:</strong> {{location}}</p>
                      <p style="margin: 0; color: #333;"><strong>Koszt:</strong> {{total_amount}} PLN</p>
                    </div>

                    <h3 style="color: ${this.BRAND_COLORS.primary}; margin: 25px 0 15px;">Ważne informacje</h3>
                    <ul style="color: #333; line-height: 1.6;">
                      <li>Prosimy przybyć 5 minut przed umówioną godziną</li>
                      <li>W przypadku konieczności odwołania wizyty, prosimy o kontakt co najmniej 24 godziny wcześniej</li>
                      <li>Płatność można uregulować gotówką lub kartą w dniu wizyty</li>
                    </ul>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; text-align: center; border-top: 1px solid #f0f0f0; color: #666; font-size: 14px;">
                    <p>Czekamy na Ciebie!</p>
                    <p style="margin: 10px 0;">Zespół mariiaborysevych</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  private getBookingConfirmationTextTemplate(): string {
    return `
Potwierdzenie rezerwacji - {{service_name}}

Cześć {{first_name}},

Twoja wizyta została pomyślnie zarezerwowana!

Szczegóły rezerwacji:
Usługa: {{service_name}}
Data: {{booking_date}}
Godzina: {{booking_time}}
Lokalizacja: {{location}}
Koszt: {{total_amount}} PLN

Ważne informacje:
- Prosimy przybyć 5 minut przed umówioną godziną
- W przypadku konieczności odwołania wizyty, prosimy o kontakt co najmniej 24 godziny wcześniej
- Płatność można uregulować gotówką lub kartą w dniu wizyty

Czekamy na Ciebie!
Zespół mariiaborysevych
    `;
  }

  private getPostTreatmentCareTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pielęgnacja po zabiegu</title>
      </head>
      <body style="font-family: Inter, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 30px; text-align: center; border-bottom: 1px solid #f0f0f0;">
                    <h1 style="color: ${this.BRAND_COLORS.primary}; margin: 0; font-size: 28px;">Instrukcje pielęgnacyjne</h1>
                    <p style="color: #666; margin: 10px 0 0; font-size: 16px;">Po zabiegu {{service_name}}</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 30px;">
                    <h2 style="color: ${this.BRAND_COLORS.primary}; margin: 0 0 20px;">Jak dbać o skórę po zabiegu?</h2>

                    <div style="background-color: #fff3cd; border-left: 4px solid ${this.BRAND_COLORS.accent}; padding: 15px; margin: 20px 0;">
                      <p style="margin: 0; color: #856404;"><strong>{{aftercare_instructions}}</strong></p>
                    </div>

                    <h3 style="color: ${this.BRAND_COLORS.primary}; margin: 25px 0 15px;">Zalecenia</h3>
                    <ul style="color: #333; line-height: 1.6;">
                      <li>Unikaj gorących kąpieli przez 24 godziny</li>
                      <li>Stosuj delikatne kosmetyki nawilżające</li>
                      <li>Chron skórę przed słońcem (SPF 30+)</li>
                      <li>Unikaj intensywnego wysiłku fizycznego przez 48 godzin</li>
                    </ul>

                    {{#next_appointment_date}}
                    <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
                      <p style="margin: 0; color: #155724;"><strong>Następna wizyta:</strong> {{next_appointment_date}}</p>
                    </div>
                    {{/next_appointment_date}}
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; text-align: center; border-top: 1px solid #f0f0f0; color: #666; font-size: 14px;">
                    <p>Masz pytania? Skontaktuj się z nami!</p>
                    <p style="margin: 10px 0;">{{contact_info}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  private getPostTreatmentCareTextTemplate(): string {
    return `
Instrukcje pielęgnacyjne po zabiegu {{service_name}}

Cześć {{first_name}},

Oto instrukcje pielęgnacyjne po Twoim zabiegu:

{{aftercare_instructions}}

Zalecenia:
- Unikaj gorących kąpieli przez 24 godziny
- Stosuj delikatne kosmetyki nawilżające
- Chron skórę przed słońcem (SPF 30+)
- Unikaj intensywnego wysiłku fizycznego przez 48 godzin

{{#next_appointment_date}}
Następna wizyta: {{next_appointment_date}}
{{/next_appointment_date}}

Masz pytania? Skontaktuj się z nami!
{{contact_info}}

Zespół mariiaborysevych
    `;
  }

  private getNewsletterTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>mariiaborysevych - {{month}} Newsletter</title>
      </head>
      <body style="font-family: Inter, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 30px; text-align: center; border-bottom: 1px solid #f0f0f0;">
                    <h1 style="color: ${this.BRAND_COLORS.primary}; margin: 0; font-size: 32px;">{{month}} w mariiaborysevych</h1>
                    <p style="color: #666; margin: 10px 0 0; font-size: 18px;">Nowości, promocje i porady ekspertów</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 30px;">
                    <h2 style="color: ${this.BRAND_COLORS.primary}; margin: 0 0 20px;">W tym miesiącu</h2>

                    <!-- Featured Services -->
                    <div style="margin: 30px 0;">
                      <h3 style="color: ${this.BRAND_COLORS.secondary}; margin: 0 0 15px;">Wyróżnione usługi</h3>
                      <p style="color: #333; line-height: 1.6;">{{featured_services}}</p>
                    </div>

                    <!-- Promotions -->
                    <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 30px 0;">
                      <h3 style="color: #856404; margin: 0 0 10px;">🔥 Specjalne promocje</h3>
                      <p style="margin: 0; color: #856404;">{{promotions}}</p>
                    </div>

                    <!-- Tips -->
                    <div style="margin: 30px 0;">
                      <h3 style="color: ${this.BRAND_COLORS.secondary}; margin: 0 0 15px;">Porady ekspertów</h3>
                      <p style="color: #333; line-height: 1.6;">{{tips}}</p>
                    </div>

                    <!-- Blog Posts -->
                    <div style="margin: 30px 0;">
                      <h3 style="color: ${this.BRAND_COLORS.secondary}; margin: 0 0 15px;">Nowości na blogu</h3>
                      <p style="color: #333; line-height: 1.6;">{{blog_posts}}</p>
                    </div>

                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://mariaborysevych.com/booking" style="background-color: ${this.BRAND_COLORS.primary}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Umów wizytę</a>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; text-align: center; border-top: 1px solid #f0f0f0; color: #666; font-size: 14px;">
                    <p>Do zobaczenia wkrótce!</p>
                    <p style="margin: 10px 0;">Zespół mariiaborysevych</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  private getNewsletterTextTemplate(): string {
    return `
mariiaborysevych - {{month}} Newsletter

Cześć {{first_name}},

Witaj w naszym {{month}} newsletterze! Oto co przygotowaliśmy dla Ciebie:

Wyróżnione usługi:
{{featured_services}}

🔥 Specjalne promocje:
{{promotions}}

Porady ekspertów:
{{tips}}

Nowości na blogu:
{{blog_posts}}

Umów swoją wizytę już dziś: https://mariaborysevych.com/booking

Do zobaczenia wkrótce!
Zespół mariiaborysevych
    `;
  }

  private getPromotionEmailTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0;">
        <title>Ekskluzywna oferta</title>
      </head>
      <body style="font-family: Inter, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 30px; text-align: center; background-color: ${this.BRAND_COLORS.primary}; border-top-left-radius: 12px; border-top-right-radius: 12px;">
                    <h1 style="color: white; margin: 0; font-size: 36px;">{{discount_percentage}}% ZNIŻKI!</h1>
                    <p style="color: ${this.BRAND_COLORS.secondary}; margin: 10px 0 0; font-size: 20px;">Ekskluzywna oferta tylko dla Ciebie</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 30px;">
                    <h2 style="color: ${this.BRAND_COLORS.primary}; margin: 0 0 20px;">Ograniczona czasowo oferta</h2>

                    <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 8px;">
                      <p style="margin: 0; color: #155724; font-size: 18px;"><strong>Kod rabatowy:</strong> {{promotion_code}}</p>
                      <p style="margin: 10px 0 0; color: #155724;"><strong>Ważny do:</strong> {{valid_until}}</p>
                    </div>

                    <h3 style="color: ${this.BRAND_COLORS.secondary}; margin: 25px 0 15px;">Usługi objęte promocją</h3>
                    <p style="color: #333; line-height: 1.6;">{{featured_services}}</p>

                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://mariaborysevych.com/booking?promo={{promotion_code}}" style="background-color: ${this.BRAND_COLORS.accent}; color: white; padding: 18px 35px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 18px; display: inline-block;">Wykorzystaj rabat</a>
                    </div>

                    <p style="color: #666; font-style: italic; text-align: center;">*Oferta ważna do wyczerpania miejsc. Nie łączy się z innymi promocjami.</p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; text-align: center; border-top: 1px solid #f0f0f0; color: #666; font-size: 14px;">
                    <p>Nie przegap tej okazji!</p>
                    <p style="margin: 10px 0;">Zespół mariiaborysevych</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  private getPromotionEmailTextTemplate(): string {
    return `
EKSKLUZYWNA OFERTA - {{discount_percentage}}% ZNIŻKI!

Cześć {{first_name}},

Mamy dla Ciebie specjalną ofertę!

Kod rabatowy: {{promotion_code}}
Ważny do: {{valid_until}}

Usługi objęte promocją:
{{featured_services}}

Nie przegap tej okazji! Odbierz swój rabat już dziś:
https://mariaborysevych.com/booking?promo={{promotion_code}}

*Oferta ważna do wyczerpania miejsc. Nie łączy się z innymi promocjami.

Zespół mariiaborysevych
    `;
  }

  private getReengagementTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0;">
        <title>Tęsknimy za Tobą!</title>
      </head>
      <body style="font-family: Inter, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 30px; text-align: center; border-bottom: 1px solid #f0f0f0;">
                    <h1 style="color: ${this.BRAND_COLORS.primary}; margin: 0; font-size: 32px;">Tęsknimy za Tobą! 💕</h1>
                    <p style="color: #666; margin: 10px 0 0; font-size: 18px;">Czas na odnowę i relaks w mariiaborysevych</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 30px;">
                    <h2 style="color: ${this.BRAND_COLORS.primary}; margin: 0 0 20px;">Specjalna oferta just dla Ciebie</h2>

                    <p style="color: #333; line-height: 1.6; font-size: 16px;">Minęło już trochę czasu od Twojej ostatniej wizyty ({{last_booking_date}}), dlatego przygotowaliśmy coś specjalnie dla Ciebie!</p>

                    <div style="background-color: #fff3cd; border-left: 4px solid ${this.BRAND_COLORS.accent}; padding: 20px; margin: 25px 0; border-radius: 8px;">
                      <p style="margin: 0; color: #856404; font-size: 18px;"><strong>{{discount_percentage}}% zniżki</strong> na następny zabieg!</p>
                      <p style="margin: 10px 0 0; color: #856404;">Użyj kodu: <strong>{{promotion_code}}</strong></p>
                    </div>

                    <h3 style="color: ${this.BRAND_COLORS.secondary}; margin: 25px 0 15px;">Popularne usługi</h3>
                    <p style="color: #333; line-height: 1.6;">{{popular_services}}</p>

                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://mariaborysevych.com/booking?welcome_back={{promotion_code}}" style="background-color: ${this.BRAND_COLORS.primary}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Umów wizytę teraz</a>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; text-align: center; border-top: 1px solid #f0f0f0; color: #666; font-size: 14px;">
                    <p>Czekamy na Ciebie z niecierpliwością!</p>
                    <p style="margin: 10px 0;">Zespół mariiaborysevych</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  private getReengagementTextTemplate(): string {
    return `
Tęsknimy za Tobą! - Specjalna oferta

Cześć {{first_name}},

Minęło już trochę czasu od Twojej ostatniej wizyty ({{last_booking_date}), dlatego przygotowaliśmy coś specjalnie dla Ciebie!

{{discount_percentage}}% zniżki na następny zabieg!
Użyj kodu: {{promotion_code}}

Popularne usługi:
{{popular_services}}

Nie czekaj太久! Umów wizytę już dziś:
https://mariaborysevych.com/booking?welcome_back={{promotion_code}}

Czekamy na Ciebie z niecierpliwością!
Zespół mariiaborysevych
    `;
  }

  // Helper methods
  private validateCampaignRequest(request: EmailCampaignRequest): void {
    if (!request.name) {
      throw new Error('Campaign name is required');
    }

    if (!request.campaign_type) {
      throw new Error('Campaign type is required');
    }

    if (request.schedule_type === 'scheduled' && !request.scheduled_at) {
      throw new Error('Scheduled date is required for scheduled campaigns');
    }
  }

  private getDefaultTargetMetrics(campaignType: EmailCampaignType): Record<string, number> {
    const metrics = {
      newsletter: { open_rate: 25, click_rate: 3, unsubscribe_rate: 1 },
      promotional: { open_rate: 20, click_rate: 5, conversion_rate: 2 },
      automated: { open_rate: 30, click_rate: 8, conversion_rate: 3 },
      transactional: { open_rate: 40, click_rate: 10 },
      survey: { open_rate: 35, click_rate: 15, completion_rate: 20 }
    };

    return metrics[campaignType] || metrics.newsletter;
  }

  private getInitialCampaignStatus(scheduleType: EmailScheduleType, scheduledAt?: string): EmailStatus {
    if (scheduleType === 'immediate') return EmailStatus.PENDING;
    if (scheduleType === 'scheduled' && scheduledAt && new Date(scheduledAt) > new Date()) {
      return 'scheduled';
    }
    return EmailStatus.PENDING;
  }

  private async sendTestCampaign(campaignId: string): Promise<void> {
    console.log(`Sending test email for campaign ${campaignId}`);
    // Implementation for sending test emails
  }

  private async queueCampaignForSending(campaignId: string): Promise<void> {
    console.log(`Queuing campaign ${campaignId} for sending`);
    // Implementation for queueing campaigns
  }

  private async getTargetRecipients(segmentCriteria: SegmentCriteria): Promise<any[]> {
    try {
      // Build query based on segment criteria
      let query = supabase.from('profiles').select('*');

      // Apply demographic filters
      if (segmentCriteria.demographics) {
        if (segmentCriteria.demographics.location?.length) {
          query = query.in('location', segmentCriteria.demographics.location);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting target recipients:', error);
      return [];
    }
  }

  private async getEmailTemplate(campaignType: EmailCampaignType): Promise<EmailTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_type', campaignType)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      console.error('Error getting email template:', error);
      return null;
    }
  }

  private addTrackingToHTML(html: string, trackOpenUrl: string): string {
    // Add tracking pixel
    const trackingPixel = `<img src="${trackOpenUrl}" width="1" height="1" style="display:none;" />`;
    return html.replace('</body>', `${trackingPixel}</body>`);
  }

  private calculateSequencePriority(triggerType: EmailTriggerType): number {
    const priorities = {
      booking_completed: 10,
      booking_cancelled: 9,
      new_customer: 8,
      abandoned_cart: 7,
      re_engagement: 5,
      birthday: 3,
      seasonal: 2,
      behavior_based: 1
    };

    return priorities[triggerType] || 1;
  }

  private evaluateTriggerConditions(conditions: Record<string, any>, triggerData: Record<string, any>): boolean {
    // Simple condition evaluation
    return true; // Placeholder for actual condition logic
  }

  private async executeSequenceSteps(sequence: EmailSequence, recipient: any, triggerData: Record<string, any>): Promise<void> {
    // Execute workflow steps
    console.log(`Executing sequence ${sequence.id} for recipient ${recipient.id}`);
    // Implementation for executing workflow steps
  }

  private generateTimeSeriesData(data: any[]): Array<{ date: string; sent: number; opened: number; clicked: number }> {
    const timeSeries: Record<string, { sent: number; opened: number; clicked: number }> = {};

    data.forEach(analytics => {
      const date = analytics.created_at?.split('T')[0] || new Date().toISOString().split('T')[0];

      if (!timeSeries[date]) {
        timeSeries[date] = { sent: 0, opened: 0, clicked: 0 };
      }

      if (analytics.status === 'sent') timeSeries[date].sent++;
      if (analytics.opened_at) timeSeries[date].opened++;
      if (analytics.clicked_at) timeSeries[date].clicked++;
    });

    return Object.entries(timeSeries)
      .map(([date, metrics]) => ({ date, ...metrics }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

// Export singleton instance
export const emailMarketing = new EmailMarketingService();