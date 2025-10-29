import { supabase } from '@/integrations/supabase/client';
import { getAIServiceManager } from './ai.service';
import { SmartReminderConfig, NoShowPrediction } from './schedulingAI';

// Smart Reminder System Types
export interface ReminderTemplate {
  id: string;
  name: string;
  type: 'confirmation' | 'preparation' | 'reminder' | 'follow_up';
  channels: ('email' | 'sms' | 'whatsapp' | 'push')[];
  templates: {
    email?: {
      subject: string;
      body: string;
      html?: string;
    };
    sms?: {
      body: string;
      maxLength?: number;
    };
    whatsapp?: {
      body: string;
      media?: string;
    };
    push?: {
      title: string;
      body: string;
      icon?: string;
      actions?: Array<{
        id: string;
        title: string;
        action: string;
      }>;
    };
  };
  personalization: {
    firstName: boolean;
    serviceName: boolean;
    appointmentTime: boolean;
    location: boolean;
    preparationNotes: boolean;
  };
  timing: {
    defaultOffset: number; // Hours before appointment
    minOffset: number;
    maxOffset: number;
  };
  effectiveness: {
    openRate: number;
    clickRate: number;
    confirmRate: number;
    noShowReduction: number;
  };
}

export interface ReminderSchedule {
  bookingId: string;
  customerId: string;
  reminders: Array<{
    id: string;
    type: string;
    channel: string;
    scheduledAt: string;
    status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed';
    templateId: string;
    content: any;
    metadata?: Record<string, any>;
  }>;
  optimizationScore: number;
  predictedEffectiveness: {
    attendanceProbability: number;
    confirmationRate: number;
    noShowReduction: number;
  };
}

export interface ReminderAnalytics {
  period: string;
  totalReminders: number;
  sentReminders: number;
  deliveredReminders: number;
  openedReminders: number;
  clickedReminders: number;
  confirmedBookings: number;
  noShows: number;
  channelPerformance: {
    channel: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    effectiveness: number;
  }[];
  templatePerformance: {
    templateId: string;
    templateName: string;
    usage: number;
    effectiveness: number;
  }[];
  timingOptimization: {
    hour: number;
    effectiveness: number;
    volume: number;
  }[];
  aBTestResults: Array<{
    testName: string;
    variant: string;
    metrics: Record<string, number>;
    winner: boolean;
  }>;
}

export interface ReminderOptimization {
  bookingId: string;
  currentStrategy: {
    channels: string[];
    timing: string[];
    frequency: string;
  };
  optimizedStrategy: {
    channels: string[];
    timing: string[];
    frequency: string;
    reason: string;
    expectedImprovement: number;
  };
  alternatives: Array<{
    strategy: any;
    expectedImprovement: number;
    confidence: number;
  }>;
}

// Smart Reminder System Class
export class SmartReminderSystem {
  private static instance: SmartReminderSystem;
  private aiService = getAIServiceManager();
  private templates = new Map<string, ReminderTemplate>();
  private defaultTemplates: ReminderTemplate[] = [];

  constructor() {
    this.initializeDefaultTemplates();
  }

  static getInstance(): SmartReminderSystem {
    if (!SmartReminderSystem.instance) {
      SmartReminderSystem.instance = new SmartReminderSystem();
    }
    return SmartReminderSystem.instance;
  }

  private initializeDefaultTemplates(): void {
    this.defaultTemplates = [
      {
        id: 'confirmation',
        name: 'Booking Confirmation',
        type: 'confirmation',
        channels: ['email', 'sms'],
        templates: {
          email: {
            subject: 'Your appointment is confirmed!',
            body: 'Hi {{firstName}},\n\nYour appointment for {{serviceName}} is confirmed for {{appointmentTime}} at {{location}}.\n\nWe\'ll send you reminders closer to the date.\n\nSee you soon!'
          },
          sms: {
            body: 'Hi {{firstName}}! Your {{serviceName}} appointment is confirmed for {{appointmentTime}} at {{location}}. Reply CONFIRM to acknowledge.'
          }
        },
        personalization: {
          firstName: true,
          serviceName: true,
          appointmentTime: true,
          location: true,
          preparationNotes: false
        },
        timing: {
          defaultOffset: 0,
          minOffset: 0,
          maxOffset: 24
        },
        effectiveness: {
          openRate: 0.85,
          clickRate: 0.35,
          confirmRate: 0.75,
          noShowReduction: 0.10
        }
      },
      {
        id: 'preparation',
        name: 'Pre-Appointment Preparation',
        type: 'preparation',
        channels: ['email'],
        templates: {
          email: {
            subject: 'Preparing for your appointment',
            body: 'Hi {{firstName}},\n\nHere\'s how to prepare for your {{serviceName}} appointment:\n\n{{preparationNotes}}\n\nIf you have any questions, please don\'t hesitate to contact us.\n\nSee you at {{appointmentTime}}!'
          }
        },
        personalization: {
          firstName: true,
          serviceName: true,
          appointmentTime: true,
          location: false,
          preparationNotes: true
        },
        timing: {
          defaultOffset: 72,
          minOffset: 48,
          maxOffset: 96
        },
        effectiveness: {
          openRate: 0.75,
          clickRate: 0.45,
          confirmRate: 0.20,
          noShowReduction: 0.15
        }
      },
      {
        id: 'reminder_24h',
        name: '24 Hour Reminder',
        type: 'reminder',
        channels: ['email', 'sms', 'whatsapp'],
        templates: {
          email: {
            subject: 'Reminder: Your appointment tomorrow',
            body: 'Hi {{firstName}},\n\nThis is a friendly reminder about your {{serviceName}} appointment tomorrow at {{appointmentTime}}.\n\nLocation: {{location}}\n\nPlease arrive 10 minutes early. If you need to reschedule, let us know as soon as possible.'
          },
          sms: {
            body: 'Reminder: {{firstName}} - Your {{serviceName}} appointment is tomorrow at {{appointmentTime}}. Reply C to confirm or R to reschedule.'
          },
          whatsapp: {
            body: 'Hi {{firstName}}! 👋 Just a reminder about your {{serviceName}} appointment tomorrow at {{appointmentTime}}. See you at {{location}}! 📍'
          }
        },
        personalization: {
          firstName: true,
          serviceName: true,
          appointmentTime: true,
          location: true,
          preparationNotes: false
        },
        timing: {
          defaultOffset: 24,
          minOffset: 18,
          maxOffset: 30
        },
        effectiveness: {
          openRate: 0.90,
          clickRate: 0.55,
          confirmRate: 0.65,
          noShowReduction: 0.25
        }
      },
      {
        id: 'reminder_2h',
        name: '2 Hour Final Reminder',
        type: 'reminder',
        channels: ['sms', 'whatsapp', 'push'],
        templates: {
          sms: {
            body: 'Hi {{firstName}}! Your {{serviceName}} appointment is in 2 hours at {{appointmentTime}}. See you soon! 📍 {{location}}'
          },
          whatsapp: {
            body: 'Hi {{firstName}}! Your appointment is in 2 hours! ⏰ {{serviceName}} at {{appointmentTime}}. Can\'t wait to see you! 😊'
          },
          push: {
            title: 'Appointment in 2 hours',
            body: 'Your {{serviceName}} appointment is at {{appointmentTime}}',
            actions: [
              { id: 'confirm', title: 'I\'m on my way', action: 'confirm' },
              { id: 'reschedule', title: 'Reschedule', action: 'reschedule' }
            ]
          }
        },
        personalization: {
          firstName: true,
          serviceName: true,
          appointmentTime: true,
          location: true,
          preparationNotes: false
        },
        timing: {
          defaultOffset: 2,
          minOffset: 1,
          maxOffset: 4
        },
        effectiveness: {
          openRate: 0.95,
          clickRate: 0.70,
          confirmRate: 0.80,
          noShowReduction: 0.35
        }
      },
      {
        id: 'follow_up',
        name: 'Post-Appointment Follow-up',
        type: 'follow_up',
        channels: ['email'],
        templates: {
          email: {
            subject: 'How was your appointment?',
            body: 'Hi {{firstName}},\n\nWe hope you enjoyed your {{serviceName}} appointment today!\n\nWe\'d love to hear your feedback. Please take a moment to leave a review.\n\nBook your next appointment and receive 10% off!'
          }
        },
        personalization: {
          firstName: true,
          serviceName: true,
          appointmentTime: false,
          location: false,
          preparationNotes: false
        },
        timing: {
          defaultOffset: -24,
          minOffset: -12,
          maxOffset: -48
        },
        effectiveness: {
          openRate: 0.80,
          clickRate: 0.40,
          confirmRate: 0.15,
          noShowReduction: 0
        }
      }
    ];

    this.defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  // Generate optimized reminder schedule
  async generateReminderSchedule(
    bookingId: string,
    noShowRisk: NoShowPrediction,
    customerPreferences?: {
      preferredChannels?: string[];
      quietHours?: { start: string; end: string };
      timezone?: string;
    }
  ): Promise<ReminderSchedule> {
    try {
      // Fetch booking details
      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services(
            id,
            name,
            category,
            duration_minutes
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;

      const appointmentTime = new Date(booking.start_time);
      const reminders: any[] = [];

      // Determine strategy based on risk level
      const strategy = this.determineReminderStrategy(noShowRisk.riskLevel);

      // Generate reminders based on strategy
      for (const reminderType of strategy.sequence) {
        const template = this.templates.get(reminderType.templateId);
        if (!template) continue;

        // Calculate optimal timing
        const optimalTiming = await this.calculateOptimalTiming(
          appointmentTime,
          template,
          noShowRisk,
          customerPreferences
        );

        // Select best channels
        const channels = await this.selectOptimalChannels(
          template.channels,
          noShowRisk,
          customerPreferences
        );

        // Create reminder for each channel
        for (const channel of channels) {
          reminders.push({
            id: `${bookingId}_${reminderType.templateId}_${channel}`,
            type: reminderType.templateId,
            channel,
            scheduledAt: optimalTiming,
            status: 'pending',
            templateId: template.id,
            content: await this personalizeContent(template, channel, booking, noShowRisk),
            metadata: {
              riskScore: noShowRisk.riskScore,
              priority: reminderType.priority,
              aBTest: reminderType.aBTest
            }
          });
        }
      }

      // Calculate optimization score
      const optimizationScore = this.calculateOptimizationScore(reminders, noShowRisk);

      // Predict effectiveness
      const predictedEffectiveness = await this.predictEffectiveness(reminders, noShowRisk);

      return {
        bookingId,
        customerId: booking.client_id,
        reminders,
        optimizationScore,
        predictedEffectiveness
      };
    } catch (error) {
      console.error('Error generating reminder schedule:', error);
      throw error;
    }
  }

  // Determine reminder strategy based on risk
  private determineReminderStrategy(riskLevel: string): {
    sequence: Array<{
      templateId: string;
      priority: number;
      aBTest?: boolean;
    }>;
    frequency: string;
  } {
    switch (riskLevel) {
      case 'critical':
        return {
          sequence: [
            { templateId: 'confirmation', priority: 1 },
            { templateId: 'preparation', priority: 2 },
            { templateId: 'reminder_24h', priority: 3 },
            { templateId: 'reminder_2h', priority: 4 },
            { templateId: 'reminder_2h', priority: 5, aBTest: true } // Additional reminder
          ],
          frequency: 'aggressive'
        };
      case 'high':
        return {
          sequence: [
            { templateId: 'confirmation', priority: 1 },
            { templateId: 'preparation', priority: 2 },
            { templateId: 'reminder_24h', priority: 3 },
            { templateId: 'reminder_2h', priority: 4 }
          ],
          frequency: 'high'
        };
      case 'medium':
        return {
          sequence: [
            { templateId: 'confirmation', priority: 1 },
            { templateId: 'reminder_24h', priority: 2 },
            { templateId: 'reminder_2h', priority: 3 }
          ],
          frequency: 'standard'
        };
      default:
        return {
          sequence: [
            { templateId: 'confirmation', priority: 1 },
            { templateId: 'reminder_24h', priority: 2 },
            { templateId: 'reminder_2h', priority: 3 }
          ],
          frequency: 'minimal'
        };
    }
  }

  // Calculate optimal timing for reminders
  private async calculateOptimalTiming(
    appointmentTime: Date,
    template: ReminderTemplate,
    noShowRisk: NoShowPrediction,
    customerPreferences?: any
  ): Promise<string> {
    const defaultOffset = template.timing.defaultOffset;
    let optimalOffset = defaultOffset;

    // Adjust based on risk level
    if (noShowRisk.riskLevel === 'critical') {
      optimalOffset *= 1.2; // Send earlier for high risk
    } else if (noShowRisk.riskLevel === 'low') {
      optimalOffset *= 0.8; // Can send later for low risk
    }

    // Consider quiet hours
    if (customerPreferences?.quietHours) {
      const reminderTime = new Date(appointmentTime.getTime() - optimalOffset * 60 * 60 * 1000);
      const [quietStart, quietEnd] = [
        parseInt(customerPreferences.quietHours.start.split(':')[0]),
        parseInt(customerPreferences.quietHours.end.split(':')[0])
      ];

      const reminderHour = reminderTime.getHours();
      if (reminderHour >= quietStart || reminderHour <= quietEnd) {
        // Adjust to outside quiet hours
        optimalOffset += 2; // Add 2 hours
      }
    }

    // Use AI to optimize timing further
    try {
      const optimization = await this.aiService.generateContent({
        type: 'optimization',
        data: {
          prompt: `Optimize reminder timing for:

          Template: ${template.name}
          Default offset: ${defaultOffset} hours
          Risk level: ${noShowRisk.riskLevel}
          Risk score: ${noShowRisk.riskScore}

          Consider:
          1. Customer behavior patterns
          2. Peak engagement times
          3. Service type
          4. Appointment time of day

          Return JSON:
          {
            "optimalOffset": 24,
            "reasoning": "Detailed explanation",
            "confidence": 0.85
          }`,
          type: 'timing_optimization'
        }
      });

      const result = JSON.parse(optimization.content);
      optimalOffset = result.optimalOffset || optimalOffset;
    } catch (error) {
      console.error('Error optimizing timing:', error);
    }

    // Calculate final time
    const reminderTime = new Date(appointmentTime.getTime() - optimalOffset * 60 * 60 * 1000);
    return reminderTime.toISOString();
  }

  // Select optimal channels
  private async selectOptimalChannels(
    availableChannels: string[],
    noShowRisk: NoShowPrediction,
    customerPreferences?: any
  ): Promise<string[]> {
    let channels = [...availableChannels];

    // Filter by customer preferences
    if (customerPreferences?.preferredChannels) {
      channels = channels.filter(c => customerPreferences.preferredChannels.includes(c));
    }

    // Add channels based on risk level
    if (noShowRisk.riskLevel === 'critical') {
      // Add all available channels for critical risk
      channels = ['email', 'sms', 'whatsapp', 'push'].filter(c => availableChannels.includes(c));
    }

    // Use AI to predict best channels
    try {
      const prediction = await this.aiService.generateContent({
        type: 'prediction',
        data: {
          prompt: `Predict best reminder channels:

          Available channels: ${availableChannels.join(', ')}
          Risk level: ${noShowRisk.riskLevel}
          Risk factors: ${noShowRisk.factors.map(f => f.factor).join(', ')}

          Return JSON with channel effectiveness:
          {
            "email": 0.85,
            "sms": 0.90,
            "whatsapp": 0.75,
            "push": 0.65
          }`,
          type: 'channel_prediction'
        }
      });

      const effectiveness = JSON.parse(prediction.content);

      // Sort by effectiveness
      channels.sort((a, b) => (effectiveness[b] || 0) - (effectiveness[a] || 0));
    } catch (error) {
      console.error('Error predicting channels:', error);
    }

    return channels.slice(0, 3); // Return top 3 channels
  }

  // Personalize content
  private async personalizeContent(
    template: ReminderTemplate,
    channel: string,
    booking: any,
    noShowRisk: NoShowPrediction
  ): Promise<any> {
    const content = template.templates[channel as keyof typeof template.templates];
    if (!content) return content;

    // Fetch customer details
    const { data: customer } = await supabase
      .from('profiles')
      .select('first_name, last_name, email, phone')
      .eq('id', booking.client_id)
      .single();

    // Create personalization map
    const personalization: Record<string, string> = {
      firstName: customer?.first_name || 'there',
      lastName: customer?.last_name || '',
      serviceName: booking.services?.name || 'your appointment',
      appointmentTime: new Date(booking.start_time).toLocaleString(),
      location: 'Warsaw', // Would fetch from booking
      preparationNotes: this.getPreparationNotes(booking.services?.category)
    };

    // Add risk-based personalization
    if (noShowRisk.riskLevel === 'critical') {
      personalization.urgencyNote = '\n\n⚠️ Important: Please confirm your attendance to avoid cancellation.';
    }

    // Replace placeholders
    let personalizedContent = JSON.stringify(content);
    for (const [key, value] of Object.entries(personalization)) {
      if (template.personalization[key as keyof typeof template.personalization]) {
        const placeholder = `{{${key}}}`;
        personalizedContent = personalizedContent.replace(
          new RegExp(placeholder, 'g'),
          value
        );
      }
    }

    return JSON.parse(personalizedContent);
  }

  // Get preparation notes for service
  private getPreparationNotes(category?: string): string {
    const notes: Record<string, string> = {
      beauty: '- Arrive 10 minutes early\n- Remove makeup before facial treatments\n- Avoid sun exposure 24h before',
      fitness: '- Wear comfortable clothes\n- Bring water bottle\n- Eat light meal 2h before',
      lifestyle: '- Come relaxed\n- Turn off phone during session'
    };
    return notes[category || 'lifestyle'] || notes.lifestyle;
  }

  // Calculate optimization score
  private calculateOptimizationScore(reminders: any[], noShowRisk: NoShowPrediction): number {
    let score = 0.5; // Base score

    // Channel diversity bonus
    const uniqueChannels = new Set(reminders.map(r => r.channel)).size;
    score += uniqueChannels * 0.1;

    // Timing spread bonus
    const times = reminders.map(r => new Date(r.scheduledAt).getTime()).sort();
    const spread = times[times.length - 1] - times[0];
    score += Math.min(spread / (3 * 24 * 60 * 60 * 1000), 0.2); // Max 0.2 for 3 day spread

    // Risk alignment bonus
    if (noShowRisk.riskLevel === 'critical' && reminders.length >= 5) score += 0.2;
    else if (noShowRisk.riskLevel === 'high' && reminders.length >= 4) score += 0.15;
    else if (noShowRisk.riskLevel === 'medium' && reminders.length >= 3) score += 0.1;

    return Math.min(score, 1.0);
  }

  // Predict effectiveness
  private async predictEffectiveness(
    reminders: any[],
    noShowRisk: NoShowPrediction
  ): Promise<{
    attendanceProbability: number;
    confirmationRate: number;
    noShowReduction: number;
  }> {
    try {
      const prediction = await this.aiService.generateContent({
        type: 'prediction',
        data: {
          prompt: `Predict reminder effectiveness:

          Reminders: ${JSON.stringify(reminders, null, 2)}
          Risk level: ${noShowRisk.riskLevel}
          Risk score: ${noShowRisk.riskScore}

          Return JSON:
          {
            "attendanceProbability": 0.85,
            "confirmationRate": 0.75,
            "noShowReduction": 0.60
          }`,
          type: 'effectiveness_prediction'
        }
      });

      return JSON.parse(prediction.content);
    } catch (error) {
      // Fallback predictions
      const baseEffectiveness = 1 - noShowRisk.riskScore;
      return {
        attendanceProbability: Math.min(baseEffectiveness + 0.2, 1.0),
        confirmationRate: baseEffectiveness,
        noShowReduction: baseEffectiveness * 0.7
      };
    }
  }

  // Execute reminder schedule
  async executeReminderSchedule(schedule: ReminderSchedule): Promise<void> {
    try {
      // Save schedule to database
      await supabase
        .from('reminder_schedules')
        .insert({
          booking_id: schedule.bookingId,
          customer_id: schedule.customerId,
          reminders: schedule.reminders,
          optimization_score: schedule.optimizationScore,
          predicted_effectiveness: schedule.predictedEffectiveness,
          created_at: new Date().toISOString()
        });

      // Schedule reminders for execution
      for (const reminder of schedule.reminders) {
        await this.scheduleReminderExecution(reminder);
      }
    } catch (error) {
      console.error('Error executing reminder schedule:', error);
      throw error;
    }
  }

  // Schedule individual reminder
  private async scheduleReminderExecution(reminder: any): Promise<void> {
    const scheduledTime = new Date(reminder.scheduledTime);
    const now = new Date();

    if (scheduledTime <= now) {
      // Send immediately if scheduled time has passed
      await this.sendReminder(reminder);
    } else {
      // Schedule for future execution
      const delay = scheduledTime.getTime() - now.getTime();
      setTimeout(async () => {
        await this.sendReminder(reminder);
      }, delay);
    }
  }

  // Send reminder
  private async sendReminder(reminder: any): Promise<void> {
    try {
      // Update status to sending
      await this.updateReminderStatus(reminder.id, 'sending');

      // Send based on channel
      let sent = false;
      switch (reminder.channel) {
        case 'email':
          sent = await this.sendEmailReminder(reminder);
          break;
        case 'sms':
          sent = await this.sendSMSReminder(reminder);
          break;
        case 'whatsapp':
          sent = await this.sendWhatsAppReminder(reminder);
          break;
        case 'push':
          sent = await this.sendPushReminder(reminder);
          break;
      }

      // Update status
      await this.updateReminderStatus(
        reminder.id,
        sent ? 'sent' : 'failed',
        sent ? { sentAt: new Date().toISOString() } : { error: 'Send failed' }
      );
    } catch (error) {
      console.error('Error sending reminder:', error);
      await this.updateReminderStatus(reminder.id, 'failed', { error: error.message });
    }
  }

  // Update reminder status
  private async updateReminderStatus(
    reminderId: string,
    status: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await supabase
      .from('reminder_schedules')
      .update({
        [`reminders->>${reminderId}->status`]: status,
        [`reminders->>${reminderId}->metadata`]: metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', reminderId);
  }

  // Send email reminder
  private async sendEmailReminder(reminder: any): Promise<boolean> {
    // Integration with email service (e.g., SendGrid, Resend)
    console.log('Sending email reminder:', reminder.id);
    // Implementation would go here
    return true;
  }

  // Send SMS reminder
  private async sendSMSReminder(reminder: any): Promise<boolean> {
    // Integration with SMS service (e.g., Twilio)
    console.log('Sending SMS reminder:', reminder.id);
    // Implementation would go here
    return true;
  }

  // Send WhatsApp reminder
  private async sendWhatsAppReminder(reminder: any): Promise<boolean> {
    // Integration with WhatsApp API
    console.log('Sending WhatsApp reminder:', reminder.id);
    // Implementation would go here
    return true;
  }

  // Send push notification
  private async sendPushReminder(reminder: any): Promise<boolean> {
    // Integration with push notification service
    console.log('Sending push reminder:', reminder.id);
    // Implementation would go here
    return true;
  }

  // Get reminder analytics
  async getReminderAnalytics(
    period: 'week' | 'month' | 'quarter',
    startDate?: string,
    endDate?: string
  ): Promise<ReminderAnalytics> {
    try {
      const start = startDate || new Date(Date.now() - this.getPeriodMs(period)).toISOString();
      const end = endDate || new Date().toISOString();

      // Fetch analytics data
      const { data: schedules } = await supabase
        .from('reminder_schedules')
        .select('*')
        .gte('created_at', start)
        .lte('created_at', end);

      // Process analytics with AI
      const analytics = await this.aiService.generateContent({
        type: 'analysis',
        data: {
          prompt: `Analyze reminder performance:

          Data: ${JSON.stringify(schedules, null, 2)}

          Calculate:
          1. Total, sent, delivered, opened, clicked rates
          2. Channel performance comparison
          3. Template effectiveness
          4. Timing optimization insights
          5. A/B test results if any

          Return comprehensive analytics matching ReminderAnalytics structure.`,
          type: 'reminder_analytics'
        }
      });

      return JSON.parse(analytics.content);
    } catch (error) {
      console.error('Error getting reminder analytics:', error);
      throw error;
    }
  }

  // Optimize existing reminder strategy
  async optimizeReminderStrategy(bookingId: string): Promise<ReminderOptimization> {
    try {
      // Fetch current reminder schedule
      const { data: currentSchedule } = await supabase
        .from('reminder_schedules')
        .select('*')
        .eq('booking_id', bookingId)
        .single();

      if (!currentSchedule) {
        throw new Error('No reminder schedule found for booking');
      }

      // Generate optimized strategy
      const optimization = await this.aiService.generateContent({
        type: 'optimization',
        data: {
          prompt: `Optimize reminder strategy for booking:

          Current strategy: ${JSON.stringify(currentSchedule.reminders, null, 2)}

          Suggest improvements:
          1. Better timing
          2. Channel optimization
          3. Frequency adjustments
          4. Content improvements

          Provide 3 alternative strategies with expected improvements.

          Return JSON matching ReminderOptimization structure.`,
          type: 'strategy_optimization'
        }
      });

      return JSON.parse(optimization.content);
    } catch (error) {
      console.error('Error optimizing reminder strategy:', error);
      throw error;
    }
  }

  // Helper methods
  private getPeriodMs(period: string): number {
    switch (period) {
      case 'week': return 7 * 24 * 60 * 60 * 1000;
      case 'month': return 30 * 24 * 60 * 60 * 1000;
      case 'quarter': return 90 * 24 * 60 * 60 * 1000;
      default: return 30 * 24 * 60 * 60 * 1000;
    }
  }

  // Get template by ID
  getTemplate(templateId: string): ReminderTemplate | undefined {
    return this.templates.get(templateId);
  }

  // Add custom template
  addTemplate(template: ReminderTemplate): void {
    this.templates.set(template.id, template);
  }

  // Update template
  updateTemplate(templateId: string, updates: Partial<ReminderTemplate>): void {
    const template = this.templates.get(templateId);
    if (template) {
      Object.assign(template, updates);
    }
  }
}

// Export singleton instance
export const smartReminderSystem = SmartReminderSystem.getInstance();

// Export convenience functions
export async function generateSmartReminders(
  bookingId: string,
  noShowRisk: NoShowPrediction,
  customerPreferences?: any
): Promise<ReminderSchedule> {
  return smartReminderSystem.generateReminderSchedule(bookingId, noShowRisk, customerPreferences);
}

export async function executeReminders(schedule: ReminderSchedule): Promise<void> {
  return smartReminderSystem.executeReminderSchedule(schedule);
}

export async function getReminderAnalytics(
  period: 'week' | 'month' | 'quarter',
  startDate?: string,
  endDate?: string
): Promise<ReminderAnalytics> {
  return smartReminderSystem.getReminderAnalytics(period, startDate, endDate);
}