import { supabase } from '@/integrations/supabase/client';
import { AutomationRule, MessageTemplate, ScheduledMessage } from '@/types/messaging-referral';
import { CommunicationService } from '@/lib/communication';
import { sendWhatsAppBusinessAPI } from '@/lib/whatsapp-business';

interface AutomationContext {
  trigger_type: string;
  trigger_data: any;
  user?: any;
  booking?: any;
  metadata?: Record<string, any>;
}

export class AutomationEngine {
  private static instance: AutomationEngine;

  public static getInstance(): AutomationEngine {
    if (!AutomationEngine.instance) {
      AutomationEngine.instance = new AutomationEngine();
    }
    return AutomationEngine.instance;
  }

  // Execute automation based on trigger
  async executeAutomation(trigger: AutomationContext) {
    try {
      // Get active automation rules for this trigger type
      const { data: rules, error } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('is_active', true)
        .eq('trigger_type', trigger.trigger_type)
        .order('priority', { ascending: true });

      if (error) throw error;
      if (!rules || rules.length === 0) return;

      // Execute each rule
      for (const rule of rules) {
        await this.executeRule(rule, trigger);
      }
    } catch (error) {
      console.error('Error executing automation:', error);
    }
  }

  // Execute a single automation rule
  private async executeRule(rule: AutomationRule, context: AutomationContext) {
    try {
      // Check conditions
      const conditionsMet = await this.checkConditions(rule.conditions, context);
      if (!conditionsMet) return;

      // Execute actions
      for (const action of rule.actions) {
        await this.executeAction(action, rule, context);
      }
    } catch (error) {
      console.error(`Error executing rule ${rule.id}:`, error);
    }
  }

  // Check if conditions are met
  private async checkConditions(conditions: any[], context: AutomationContext): Promise<boolean> {
    if (!conditions || conditions.length === 0) return true;

    for (const condition of conditions) {
      const met = await this.evaluateCondition(condition, context);
      if (!met) return false;
    }

    return true;
  }

  // Evaluate a single condition
  private async evaluateCondition(condition: any, context: AutomationContext): Promise<boolean> {
    const { field, operator, value } = condition;
    let actualValue: any;

    // Get actual value from context
    switch (field) {
      case 'user_type':
        actualValue = context.user?.user_type || context.user?.role;
        break;
      case 'service_type':
        actualValue = context.booking?.service_type || context.trigger_data?.service_type;
        break;
      case 'booking_value':
        actualValue = context.booking?.total_amount || context.trigger_data?.total_amount;
        break;
      case 'user_location':
        actualValue = context.user?.location || context.user?.city;
        break;
      case 'is_first_booking':
        actualValue = context.trigger_data?.is_first_booking || false;
        break;
      case 'days_since_last_booking':
        actualValue = context.trigger_data?.days_since_last_booking || 0;
        break;
      case 'preferred_channel':
        actualValue = context.user?.preferred_channel || 'whatsapp';
        break;
      case 'has_opted_in':
        actualValue = context.user?.whatsapp_opt_in || context.user?.sms_opt_in || false;
        break;
      default:
        actualValue = this.getNestedValue(context, field);
    }

    // Evaluate condition
    switch (operator) {
      case 'equals':
        return actualValue === value;
      case 'not_equals':
        return actualValue !== value;
      case 'contains':
        return String(actualValue).toLowerCase().includes(String(value).toLowerCase());
      case 'not_contains':
        return !String(actualValue).toLowerCase().includes(String(value).toLowerCase());
      case 'greater_than':
        return Number(actualValue) > Number(value);
      case 'less_than':
        return Number(actualValue) < Number(value);
      case 'greater_than_or_equal':
        return Number(actualValue) >= Number(value);
      case 'less_than_or_equal':
        return Number(actualValue) <= Number(value);
      case 'in':
        return Array.isArray(value) && value.includes(actualValue);
      case 'not_in':
        return Array.isArray(value) && !value.includes(actualValue);
      default:
        return false;
    }
  }

  // Execute an action
  private async executeAction(action: any, rule: AutomationRule, context: AutomationContext) {
    switch (action.type) {
      case 'send_message':
        await this.sendScheduledMessage(action, rule, context);
        break;
      case 'send_email':
        await this.sendEmail(action, rule, context);
        break;
      case 'update_field':
        await this.updateField(action, context);
        break;
      case 'create_task':
        await this.createTask(action, context);
        break;
      case 'delay':
        await this.applyDelay(action, context);
        break;
      case 'schedule_follow_up':
        await this.scheduleFollowUp(action, rule, context);
        break;
      case 'trigger_webhook':
        await this.triggerWebhook(action, context);
        break;
      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }

  // Send scheduled message
  private async sendScheduledMessage(action: any, rule: AutomationRule, context: AutomationContext) {
    const { channel, template_name, delay_minutes = 0, variables } = action;

    // Get recipient
    const recipient = this.getRecipient(context, channel);
    if (!recipient) return;

    // Get template
    const { data: template } = await supabase
      .from('message_templates')
      .select('*')
      .eq('name', template_name)
      .eq('channel', channel)
      .single();

    if (!template) {
      console.error(`Template not found: ${template_name}`);
      return;
    }

    // Prepare content
    let content = template.content;
    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        const actualValue = this.getVariableValue(key, context);
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), String(actualValue));
      }
    }

    // Schedule or send immediately
    const scheduledFor = delay_minutes > 0
      ? new Date(Date.now() + delay_minutes * 60 * 1000).toISOString()
      : new Date().toISOString();

    // Create scheduled message
    await supabase.from('scheduled_messages').insert({
      conversation_id: context.trigger_data?.conversation_id,
      template_id: template.id,
      content,
      channel,
      recipient,
      scheduled_for: scheduledFor,
      automation_rule_id: rule.id,
      status: delay_minutes > 0 ? 'scheduled' : 'sent',
      metadata: {
        automation_rule: rule.id,
        context: context.trigger_data,
      },
    });

    // Send immediately if no delay
    if (delay_minutes === 0) {
      await this.sendMessageNow(channel, recipient, content, context);
    }
  }

  // Send message now
  private async sendMessageNow(channel: string, recipient: string, content: string, context: AutomationContext) {
    try {
      switch (channel) {
        case 'whatsapp':
          await CommunicationService.sendCustomWhatsApp(
            recipient.replace('whatsapp:', ''),
            content
          );
          break;
        case 'sms':
          await CommunicationService.sendSMS({
            to: recipient,
            message: content,
            type: 'appointment',
          });
          break;
        case 'email':
          // Implement email sending
          break;
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  // Send email
  private async sendEmail(action: any, rule: AutomationRule, context: AutomationContext) {
    // Implementation for email sending
    console.log('Sending email:', action);
  }

  // Update field
  private async updateField(action: any, context: AutomationContext) {
    const { table, field, value } = action.config;

    try {
      // Calculate actual value if needed
      const actualValue = this.calculateValue(value, context);

      // Update based on table
      switch (table) {
        case 'profiles':
          await supabase
            .from('profiles')
            .update({ [field]: actualValue })
            .eq('id', context.user?.id);
          break;
        case 'bookings':
          await supabase
            .from('bookings')
            .update({ [field]: actualValue })
            .eq('id', context.booking?.id);
          break;
        // Add other tables as needed
      }
    } catch (error) {
      console.error('Error updating field:', error);
    }
  }

  // Create task
  private async createTask(action: any, context: AutomationContext) {
    // Implementation for creating tasks
    console.log('Creating task:', action);
  }

  // Apply delay
  private async applyDelay(action: any, context: AutomationContext) {
    const { delay_ms } = action.config;
    await new Promise(resolve => setTimeout(resolve, delay_ms));
  }

  // Schedule follow-up
  private async scheduleFollowUp(action: any, rule: AutomationRule, context: AutomationContext) {
    const { delay_hours = 24, follow_up_trigger } = action.config;

    // Create a scheduled automation
    const scheduledTime = new Date(Date.now() + delay_hours * 60 * 60 * 1000).toISOString();

    await supabase.from('scheduled_automations').insert({
      trigger_type: follow_up_trigger,
      trigger_data: context.trigger_data,
      scheduled_for: scheduledTime,
      parent_automation_id: rule.id,
    });
  }

  // Trigger webhook
  private async triggerWebhook(action: any, context: AutomationContext) {
    const { url, method = 'POST', headers = {}, body } = action.config;

    try {
      const payload = {
        ...context,
        ...body,
        timestamp: new Date().toISOString(),
      };

      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Error triggering webhook:', error);
    }
  }

  // Get recipient based on channel
  private getRecipient(context: AutomationContext, channel: string): string | null {
    const user = context.user || context.trigger_data?.user;

    if (!user) return null;

    switch (channel) {
      case 'whatsapp':
        return user.phone ? `whatsapp:${user.phone}` : null;
      case 'sms':
        return user.phone;
      case 'email':
        return user.email;
      default:
        return null;
    }
  }

  // Get variable value
  private getVariableValue(key: string, context: AutomationContext): any {
    switch (key) {
      case 'customer_name':
        return context.user?.first_name || context.trigger_data?.customer_name || 'Customer';
      case 'service_name':
        return context.booking?.service_name || context.trigger_data?.service_name;
      case 'date':
        return context.booking?.date || context.trigger_data?.date;
      case 'time':
        return context.booking?.time || context.trigger_data?.time;
      case 'referral_code':
        return context.trigger_data?.referral_code;
      case 'reward_amount':
        return context.trigger_data?.reward_amount || 50;
      case 'business_name':
        return 'BM Beauty Studio';
      case 'business_phone':
        return '+48123456789';
      case 'business_email':
        return 'info@bmbeautystudio.pl';
      default:
        return this.getNestedValue(context, key);
    }
  }

  // Get nested value from object
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Calculate value
  private calculateValue(value: any, context: AutomationContext): any {
    if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
      const key = value.slice(2, -2);
      return this.getVariableValue(key, context);
    }
    return value;
  }
}

// Singleton instance
export const automationEngine = AutomationEngine.getInstance();

// Trigger functions for common events
export const triggerBookingCreated = async (booking: any, user: any) => {
  await automationEngine.executeAutomation({
    trigger_type: 'booking_created',
    trigger_data: { booking, user, is_first_booking: booking.is_first_booking },
    user,
    booking,
  });
};

export const triggerBookingConfirmed = async (booking: any, user: any) => {
  await automationEngine.executeAutomation({
    trigger_type: 'booking_confirmed',
    trigger_data: { booking, user },
    user,
    booking,
  });
};

export const triggerBookingCompleted = async (booking: any, user: any) => {
  await automationEngine.executeAutomation({
    trigger_type: 'booking_completed',
    trigger_data: {
      booking,
      user,
      service_name: booking.service_name,
      total_amount: booking.total_amount,
    },
    user,
    booking,
  });
};

export const triggerBookingCancelled = async (booking: any, user: any) => {
  await automationEngine.executeAutomation({
    trigger_type: 'booking_cancelled',
    trigger_data: { booking, user },
    user,
    booking,
  });
};

export const triggerPaymentCompleted = async (payment: any, booking: any, user: any) => {
  await automationEngine.executeAutomation({
    trigger_type: 'payment_completed',
    trigger_data: { payment, booking, user, amount: payment.amount },
    user,
    booking,
  });
};

export const triggerAftercarePeriod = async (booking: any, user: any) => {
  await automationEngine.executeAutomation({
    trigger_type: 'aftercare_period',
    trigger_data: { booking, user, service_type: booking.service_type },
    user,
    booking,
  });
};

export const triggerBirthday = async (user: any) => {
  await automationEngine.executeAutomation({
    trigger_type: 'birthday',
    trigger_data: { user },
    user,
  });
};

export const triggerNoActivity = async (user: any, daysInactive: number) => {
  await automationEngine.executeAutomation({
    trigger_type: 'no_activity',
    trigger_data: { user, days_since_last_activity: daysInactive },
    user,
  });
};

export const triggerReferralCreated = async (referral: any, referrer: any) => {
  await automationEngine.executeAutomation({
    trigger_type: 'referral_created',
    trigger_data: { referral, referrer },
    user: referrer,
  });
};

export const triggerReferralCompleted = async (referral: any, referrer: any, referred: any) => {
  await automationEngine.executeAutomation({
    trigger_type: 'referral_completed',
    trigger_data: { referral, referrer, referred },
    user: referrer,
  });
};

// Process scheduled messages (cron job function)
export const processScheduledMessages = async () => {
  try {
    const { data: messages, error } = await supabase
      .from('scheduled_messages')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true });

    if (error) throw error;

    for (const message of messages) {
      try {
        // Send message
        await automationEngine.sendMessageNow(
          message.channel,
          message.recipient,
          message.content,
          message.metadata?.context || {}
        );

        // Update status
        await supabase
          .from('scheduled_messages')
          .update({ status: 'sent' })
          .eq('id', message.id);
      } catch (error) {
        console.error(`Failed to send scheduled message ${message.id}:`, error);

        // Increment retry count
        const retryCount = message.retry_count + 1;
        if (retryCount < 3) {
          await supabase
            .from('scheduled_messages')
            .update({
              status: 'scheduled',
              retry_count: retryCount,
              scheduled_for: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // Retry in 5 mins
              last_retry_at: new Date().toISOString(),
            })
            .eq('id', message.id);
        } else {
          await supabase
            .from('scheduled_messages')
            .update({ status: 'failed' })
            .eq('id', message.id);
        }
      }
    }
  } catch (error) {
    console.error('Error processing scheduled messages:', error);
  }
};

// React hook for automation
export const useAutomation = () => {
  const createRule = async (rule: Partial<AutomationRule>) => {
    const { data, error } = await supabase
      .from('automation_rules')
      .insert(rule)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateRule = async (id: string, updates: Partial<AutomationRule>) => {
    const { data, error } = await supabase
      .from('automation_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const deleteRule = async (id: string) => {
    const { error } = await supabase
      .from('automation_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  };

  const testRule = async (rule: AutomationRule, context: AutomationContext) => {
    // Execute rule in test mode
    const testContext = {
      ...context,
      test_mode: true,
    };

    return await automationEngine.executeRule(rule, testContext);
  };

  return {
    createRule,
    updateRule,
    deleteRule,
    testRule,
    triggers: {
      bookingCreated: triggerBookingCreated,
      bookingConfirmed: triggerBookingConfirmed,
      bookingCompleted: triggerBookingCompleted,
      bookingCancelled: triggerBookingCancelled,
      paymentCompleted: triggerPaymentCompleted,
      aftercarePeriod: triggerAftercarePeriod,
      birthday: triggerBirthday,
      noActivity: triggerNoActivity,
    },
  };
};