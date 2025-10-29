import { supabase } from '@/integrations/supabase/client'
import { getWhatsAppBusinessAPI, WhatsAppBusinessAPI } from '@/lib/whatsapp-business'

import type { Database } from '@/integrations/supabase/types'

type Tables = Database['public']['Tables']

export interface WhatsAppServiceConfig {
  rateLimitPerHour?: number
  enableAutoReply?: boolean
  businessHours?: {
    start: string // HH:mm format
    end: string // HH:mm format
    timezone: string
  }
  autoReplyDelay?: number // seconds
}

export interface WhatsAppTemplate {
  name: string
  category: 'marketing' | 'utility' | 'authentication'
  language: string
  components: WhatsAppTemplateComponent[]
}

export interface WhatsAppTemplateComponent {
  type: 'header' | 'body' | 'footer' | 'buttons'
  parameters?: WhatsAppTemplateParameter[]
}

export interface WhatsAppTemplateParameter {
  type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video'
  text?: string
  currency?: {
    fallback_value: string
    code: string
    amount_1000: number
  }
  date_time?: {
    fallback_value: string
  }
  image?: {
    id?: string
    link?: string
  }
}

export interface QuickReply {
  id: string
  keywords: string[]
  response: string
  isActive: boolean
  category?: string
}

export interface MessageQueue {
  id: string
  to: string
  type: 'template' | 'text' | 'image' | 'document'
  content: any
  scheduledAt?: Date
  priority: 'low' | 'normal' | 'high' | 'urgent'
  retries: number
  maxRetries: number
  status: 'pending' | 'sent' | 'failed' | 'cancelled'
}

export class WhatsAppService {
  private client = supabase
  private config: WhatsAppServiceConfig
  private api: WhatsAppBusinessAPI
  private messageQueue: Map<string, NodeJS.Timeout> = new Map()
  private rateLimitTracker: Map<string, number[]> = new Map()

  constructor(config?: WhatsAppServiceConfig) {
    this.config = {
      rateLimitPerHour: 1000,
      enableAutoReply: true,
      businessHours: {
        start: '09:00',
        end: '21:00',
        timezone: 'Europe/Warsaw'
      },
      autoReplyDelay: 2,
      ...config
    }
    this.api = getWhatsAppBusinessAPI()
  }

  /**
   * Check if current time is within business hours
   */
  private isWithinBusinessHours(): boolean {
    const now = new Date()
    const timeZone = this.config.businessHours?.timezone || 'Europe/Warsaw'
    const currentTime = new Date(now.toLocaleString("en-US", { timeZone }))

    const [startHour, startMin] = this.config.businessHours?.start.split(':').map(Number) || [9, 0]
    const [endHour, endMin] = this.config.businessHours?.end.split(':').map(Number) || [21, 0]

    const currentHour = currentTime.getHours()
    const currentMin = currentTime.getMinutes()
    const currentMinutes = currentHour * 60 + currentMin
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes
  }

  /**
   * Check rate limit for sending messages
   */
  private async checkRateLimit(): Promise<boolean> {
    const key = 'whatsapp'
    const now = Date.now()
    const oneHour = 60 * 60 * 1000

    if (!this.rateLimitTracker.has(key)) {
      this.rateLimitTracker.set(key, [])
    }

    const timestamps = this.rateLimitTracker.get(key)!
    // Remove old timestamps
    const recent = timestamps.filter(t => now - t < oneHour)

    if (recent.length >= (this.config.rateLimitPerHour || 1000)) {
      return false
    }

    recent.push(now)
    this.rateLimitTracker.set(key, recent)
    return true
  }

  /**
   * Send a template message with rate limiting
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode = 'en',
    components?: WhatsAppTemplateComponent[],
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Check rate limit
      if (!(await this.checkRateLimit())) {
        // Queue the message if rate limited
        return this.queueMessage({
          to,
          type: 'template',
          content: { templateName, languageCode, components },
          priority
        })
      }

      // Check business hours for non-urgent messages
      if (!this.isWithinBusinessHours() && priority !== 'urgent') {
        const nextBusinessHour = this.getNextBusinessHour()
        return this.queueMessage({
          to,
          type: 'template',
          content: { templateName, languageCode, components },
          priority,
          scheduledAt: nextBusinessHour
        })
      }

      const result = await this.api.sendTemplateMessage(to, templateName, languageCode, components)

      // Log the message
      await this.logMessage({
        to,
        type: 'template',
        templateName,
        status: 'sent',
        externalId: result.messages?.[0]?.id
      })

      return { success: true, messageId: result.messages?.[0]?.id }
    } catch (error) {
      console.error('Failed to send WhatsApp template:', error)
      await this.logMessage({
        to,
        type: 'template',
        templateName,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Send a custom text message
   */
  async sendTextMessage(
    to: string,
    message: string,
    options?: {
      replyToMessageId?: string
      previewUrl?: boolean
      priority?: 'low' | 'normal' | 'high' | 'urgent'
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Check rate limit
      if (!(await this.checkRateLimit())) {
        return this.queueMessage({
          to,
          type: 'text',
          content: { message, options },
          priority: options?.priority || 'normal'
        })
      }

      const result = await this.api.sendTextMessage(to, message, options)

      await this.logMessage({
        to,
        type: 'text',
        content: message,
        status: 'sent',
        externalId: result.messages?.[0]?.id
      })

      return { success: true, messageId: result.messages?.[0]?.id }
    } catch (error) {
      console.error('Failed to send WhatsApp text:', error)
      await this.logMessage({
        to,
        type: 'text',
        content: message,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Send booking confirmation
   */
  async sendBookingConfirmation(
    to: string,
    data: {
      customerName: string
      serviceName: string
      date: string
      time: string
      location?: string
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const components: WhatsAppTemplateComponent[] = [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: data.customerName },
          { type: 'text', text: data.serviceName },
          { type: 'text', text: data.date },
          { type: 'text', text: data.time },
          ...(data.location ? [{ type: 'text', text: data.location }] : [])
        ]
      }
    ]

    return this.sendTemplateMessage(to, 'booking_confirmation', 'en', components, 'high')
  }

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(
    to: string,
    data: {
      customerName: string
      serviceName: string
      time: string
      date?: string
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const components: WhatsAppTemplateComponent[] = [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: data.customerName },
          { type: 'text', text: data.serviceName },
          { type: 'text', text: data.time },
          ...(data.date ? [{ type: 'text', text: data.date }] : [])
        ]
      }
    ]

    return this.sendTemplateMessage(to, 'appointment_reminder', 'en', components, 'high')
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(
    to: string,
    data: {
      customerName: string
      amount: string
      serviceName: string
      paymentId: string
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const components: WhatsAppTemplateComponent[] = [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: data.customerName },
          { type: 'text', text: data.amount },
          { type: 'text', text: data.serviceName },
          { type: 'text', text: data.paymentId }
        ]
      }
    ]

    return this.sendTemplateMessage(to, 'payment_confirmation', 'en', components, 'normal')
  }

  /**
   * Send promotional message
   */
  async sendPromotionalMessage(
    to: string,
    data: {
      title: string
      description: string
      discount?: string
      validUntil?: string
      bookingUrl?: string
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const components: WhatsAppTemplateComponent[] = [
      ...(data.title ? [{
        type: 'header' as const,
        parameters: [{ type: 'text' as const, text: data.title }]
      }] : []),
      {
        type: 'body',
        parameters: [
          { type: 'text', text: data.description },
          ...(data.discount ? [{ type: 'text', text: data.discount }] : []),
          ...(data.validUntil ? [{ type: 'text', text: data.validUntil }] : [])
        ]
      },
      ...(data.bookingUrl ? [{
        type: 'buttons' as const,
        parameters: [{
          type: 'text' as const,
          text: 'Book Now',
          url: data.bookingUrl
        }]
      }] : [])
    ]

    return this.sendTemplateMessage(to, 'promotional_message', 'en', components, 'low')
  }

  /**
   * Handle incoming message with auto-reply
   */
  async handleIncomingMessage(
    from: string,
    message: any,
    contactInfo?: { name?: string; wa_id: string }
  ): Promise<void> {
    // Store the message
    await this.storeIncomingMessage(from, message, contactInfo)

    // Process auto-reply if enabled
    if (this.config.enableAutoReply && this.isWithinBusinessHours()) {
      setTimeout(async () => {
        await this.processAutoReply(from, message)
      }, (this.config.autoReplyDelay || 2) * 1000)
    }
  }

  /**
   * Process auto-reply based on message content
   */
  private async processAutoReply(from: string, message: any): Promise<void> {
    try {
      const messageText = this.extractMessageText(message)
      if (!messageText) return

      // Get quick replies
      const { data: quickReplies } = await this.client
        .from('whatsapp_quick_replies')
        .select('*')
        .eq('is_active', true)

      if (!quickReplies || quickReplies.length === 0) return

      // Find matching quick reply
      const matchingReply = quickReplies.find(reply =>
        reply.keywords.some(keyword =>
          messageText.toLowerCase().includes(keyword.toLowerCase())
        )
      )

      if (matchingReply) {
        await this.sendTextMessage(from, matchingReply.response, {
          priority: 'normal'
        })
      }
    } catch (error) {
      console.error('Error processing auto-reply:', error)
    }
  }

  /**
   * Extract text from message object
   */
  private extractMessageText(message: any): string | null {
    if (message.text?.body) return message.text.body
    if (message.interactive?.button_reply?.title) return message.interactive.button_reply.title
    if (message.interactive?.list_reply?.title) return message.interactive.list_reply.title
    return null
  }

  /**
   * Store incoming message in database
   */
  private async storeIncomingMessage(
    from: string,
    message: any,
    contactInfo?: { name?: string; wa_id: string }
  ): Promise<void> {
    try {
      // Find or create profile
      let profile = null
      if (contactInfo?.wa_id) {
        const { data } = await this.client
          .from('profiles')
          .select('*')
          .eq('phone', contactInfo.wa_id.replace('whatsapp:', ''))
          .single()

        if (!data && contactInfo.name) {
          const { data: newProfile } = await this.client
            .from('profiles')
            .insert({
              phone: contactInfo.wa_id.replace('whatsapp:', ''),
              full_name: contactInfo.name,
              role: 'client'
            })
            .select()
            .single()
          profile = newProfile
        } else {
          profile = data
        }
      }

      // Find or create thread
      let thread = null
      if (profile) {
        const { data: existingThread } = await this.client
          .from('message_threads')
          .select('*')
          .eq('client_id', profile.id)
          .eq('channel', 'whatsapp')
          .order('last_message_at', { ascending: false })
          .limit(1)
          .single()

        if (!existingThread) {
          const { data: newThread } = await this.client
            .from('message_threads')
            .insert({
              client_id: profile.id,
              channel: 'whatsapp',
              status: 'open'
            })
            .select()
            .single()
          thread = newThread
        } else {
          thread = existingThread
        }
      }

      // Store message
      const content = this.extractMessageText(message) || `[${message.type} message]`
      await this.client.from('messages').insert({
        thread_id: thread?.id,
        sender_id: profile?.id,
        content,
        message_type: message.type === 'text' ? 'text' :
                     message.type === 'image' ? 'image' :
                     message.type === 'document' ? 'document' : 'text',
        direction: 'inbound',
        external_id: message.id,
        metadata: { raw_message: message },
        sent_at: new Date(parseInt(message.timestamp) * 1000).toISOString()
      })
    } catch (error) {
      console.error('Error storing incoming message:', error)
    }
  }

  /**
   * Queue message for later sending
   */
  private async queueMessage(messageData: Partial<MessageQueue>): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const queueId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Store in database
    await this.client.from('whatsapp_message_queue').insert({
      id: queueId,
      to: messageData.to!,
      type: messageData.type!,
      content: messageData.content!,
      scheduled_at: messageData.scheduledAt?.toISOString() || null,
      priority: messageData.priority || 'normal',
      retries: 0,
      max_retries: 3,
      status: 'pending'
    })

    // Schedule sending if needed
    if (messageData.scheduledAt && messageData.scheduledAt > new Date()) {
      const delay = messageData.scheduledAt.getTime() - Date.now()
      const timeout = setTimeout(() => {
        this.processQueuedMessage(queueId)
      }, delay)
      this.messageQueue.set(queueId, timeout)
    } else {
      // Process immediately in next tick
      setTimeout(() => this.processQueuedMessage(queueId), 0)
    }

    return { success: true, messageId: queueId }
  }

  /**
   * Process queued message
   */
  private async processQueuedMessage(queueId: string): Promise<void> {
    try {
      const { data: queuedMessage } = await this.client
        .from('whatsapp_message_queue')
        .select('*')
        .eq('id', queueId)
        .single()

      if (!queuedMessage || queuedMessage.status !== 'pending') return

      // Send the message
      let result
      if (queuedMessage.type === 'template') {
        const { templateName, languageCode, components } = queuedMessage.content
        result = await this.api.sendTemplateMessage(
          queuedMessage.to,
          templateName,
          languageCode,
          components
        )
      } else if (queuedMessage.type === 'text') {
        const { message, options } = queuedMessage.content
        result = await this.api.sendTextMessage(queuedMessage.to, message, options)
      }

      // Update queue status
      await this.client
        .from('whatsapp_message_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', queueId)

      // Clean up timeout
      const timeout = this.messageQueue.get(queueId)
      if (timeout) {
        clearTimeout(timeout)
        this.messageQueue.delete(queueId)
      }
    } catch (error) {
      console.error('Error processing queued message:', error)

      // Update retry count
      const { data: queuedMessage } = await this.client
        .from('whatsapp_message_queue')
        .select('*')
        .eq('id', queueId)
        .single()

      if (queuedMessage) {
        const newRetries = queuedMessage.retries + 1
        if (newRetries >= queuedMessage.max_retries) {
          await this.client
            .from('whatsapp_message_queue')
            .update({
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error'
            })
            .eq('id', queueId)
        } else {
          await this.client
            .from('whatsapp_message_queue')
            .update({
              retries: newRetries,
              scheduled_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // Retry in 5 minutes
            })
            .eq('id', queueId)

          // Schedule retry
          const timeout = setTimeout(() => {
            this.processQueuedMessage(queueId)
          }, 5 * 60 * 1000)
          this.messageQueue.set(queueId, timeout)
        }
      }
    }
  }

  /**
   * Get next business hour
   */
  private getNextBusinessHour(): Date {
    const now = new Date()
    const timeZone = this.config.businessHours?.timezone || 'Europe/Warsaw'
    const currentTime = new Date(now.toLocaleString("en-US", { timeZone }))

    const [endHour, endMin] = this.config.businessHours?.end.split(':').map(Number) || [21, 0]
    const nextBusinessDate = new Date(currentTime)

    // If after business hours, schedule for next day
    if (currentTime.getHours() > endHour ||
        (currentTime.getHours() === endHour && currentTime.getMinutes() > endMin)) {
      nextBusinessDate.setDate(nextBusinessDate.getDate() + 1)
    }

    const [startHour, startMin] = this.config.businessHours?.start.split(':').map(Number) || [9, 0]
    nextBusinessDate.setHours(startHour, startMin, 0, 0)

    return nextBusinessDate
  }

  /**
   * Log message to database
   */
  private async logMessage(data: {
    to: string
    type: string
    content?: string
    templateName?: string
    status: string
    externalId?: string
    error?: string
  }): Promise<void> {
    await this.client.from('whatsapp_message_logs').insert({
      to: data.to.replace('whatsapp:', ''),
      type: data.type,
      content: data.content,
      template_name: data.templateName,
      status: data.status,
      external_id: data.externalId,
      error_message: data.error,
      created_at: new Date().toISOString()
    })
  }

  /**
   * Get WhatsApp analytics
   */
  async getAnalytics(dateRange?: { start: Date; end: Date }) {
    const query = this.client
      .from('whatsapp_message_logs')
      .select('*')
      .gte('created_at', dateRange?.start.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .lte('created_at', dateRange?.end.toISOString() || new Date().toISOString())
      .order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) throw error

    const analytics = {
      totalSent: data?.filter(m => m.status === 'sent').length || 0,
      totalFailed: data?.filter(m => m.status === 'failed').length || 0,
      byType: {
        template: data?.filter(m => m.type === 'template').length || 0,
        text: data?.filter(m => m.type === 'text').length || 0,
        image: data?.filter(m => m.type === 'image').length || 0
      },
      byTemplate: data?.reduce((acc: any, msg) => {
        if (msg.template_name) {
          acc[msg.template_name] = (acc[msg.template_name] || 0) + 1
        }
        return acc
      }, {}) || {},
      dailyStats: data?.reduce((acc: any, msg) => {
        const date = new Date(msg.created_at).toISOString().split('T')[0]
        if (!acc[date]) {
          acc[date] = { sent: 0, failed: 0 }
        }
        acc[date][msg.status]++
        return acc
      }, {}) || {}
    }

    return analytics
  }

  /**
   * Create quick reply template
   */
  async createQuickReply(data: {
    keywords: string[]
    response: string
    category?: string
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.client
        .from('whatsapp_quick_replies')
        .insert({
          keywords: data.keywords,
          response: data.response,
          category: data.category || 'general',
          is_active: true
        })

      if (error) throw error

      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Handle opt-out request
   */
  async handleOptOut(from: string): Promise<void> {
    // Store opt-out preference
    await this.client
      .from('profiles')
      .update({ whatsapp_opt_out: true })
      .eq('phone', from.replace('whatsapp:', ''))

    // Send confirmation message
    await this.sendTextMessage(
      from,
      'You have been opted out from WhatsApp messages. Reply START to opt back in.',
      { priority: 'normal' }
    )
  }

  /**
   * Handle opt-in request
   */
  async handleOptIn(from: string): Promise<void> {
    // Update opt-out preference
    await this.client
      .from('profiles')
      .update({ whatsapp_opt_out: false })
      .eq('phone', from.replace('whatsapp:', ''))

    // Send welcome message
    await this.sendTextMessage(
      from,
      'Welcome back! You will now receive WhatsApp messages for your appointments and updates.',
      { priority: 'normal' }
    )
  }
}

// Singleton instance
let whatsappService: WhatsAppService | null = null

export function getWhatsAppService(config?: WhatsAppServiceConfig): WhatsAppService {
  if (!whatsappService) {
    whatsappService = new WhatsAppService(config)
  }
  return whatsappService
}

// Export helper functions for common use cases
export async function sendWhatsAppBookingConfirmation(
  to: string,
  data: {
    customerName: string
    serviceName: string
    date: string
    time: string
    location?: string
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const service = getWhatsAppService()
  return service.sendBookingConfirmation(to, data)
}

export async function sendWhatsAppAppointmentReminder(
  to: string,
  data: {
    customerName: string
    serviceName: string
    time: string
    date?: string
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const service = getWhatsAppService()
  return service.sendAppointmentReminder(to, data)
}

export async function sendWhatsAppPaymentConfirmation(
  to: string,
  data: {
    customerName: string
    amount: string
    serviceName: string
    paymentId: string
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const service = getWhatsAppService()
  return service.sendPaymentConfirmation(to, data)
}