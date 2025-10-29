import { supabase } from '@/integrations/supabase/client'
import { getEnvVar } from '@/lib/runtime-env'

export interface WhatsAppBusinessConfig {
  phoneNumberId: string
  accessToken: string
  version: string
  wabaId: string
  webhookVerifyToken?: string
}

export interface WhatsAppMessagePayload {
  messaging_product: 'whatsapp'
  recipient_type: 'individual'
  to: string
  type?: 'text' | 'template' | 'image' | 'document' | 'video' | 'audio'
  text?: {
    body: string
    preview_url?: boolean
  }
  template?: {
    name: string
    language: {
      code: string
    }
    components?: TemplateComponent[]
  }
  image?: {
    id?: string
    link?: string
    caption?: string
  }
  document?: {
    id?: string
    link?: string
    caption?: string
    filename?: string
  }
  video?: {
    id?: string
    link?: string
    caption?: string
  }
  audio?: {
    id?: string
    link?: string
  }
  context?: {
    message_id?: string
  }
}

export interface TemplateComponent {
  type: 'header' | 'body' | 'footer' | 'buttons'
  parameters?: TemplateParameter[]
}

export interface TemplateParameter {
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
  document?: {
    id?: string
    link?: string
    filename?: string
  }
  video?: {
    id?: string
    link?: string
  }
}

export interface WhatsAppWebhookEvent {
  object: 'whatsapp_business_account'
  entry: Array<{
    id: string
    changes: Array<{
      field: 'messages'
      value: {
        messaging_product: 'whatsapp'
        metadata: {
          display_phone_number: string
          phone_number_id: string
        }
        contacts?: Array<{
          profile: {
            name: string
          }
          wa_id: string
        }>
        messages: Array<{
          from: string
          id: string
          timestamp: string
          text?: {
            body: string
          }
          image?: {
            id: string
            caption?: string
            mime_type: string
            sha256: string
          }
          document?: {
            id: string
            caption?: string
            filename: string
            mime_type: string
            sha256: string
          }
          audio?: {
            id: string
            mime_type: string
            sha256: string
            voice?: boolean
          }
          video?: {
            id: string
            caption?: string
            mime_type: string
            sha256: string
          }
          type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'interactive' | 'button' | 'location' | 'contacts' | 'order' | 'system' | 'unsupported'
        }>
        status?: Array<{
          id: string
          status: 'sent' | 'delivered' | 'read' | 'failed'
          timestamp: string
          recipient_id: string
          errors?: Array<{
            code: number
            title: string
            details: string
            href: string
          }>
        }>
      }
    }>
  }>
}

export interface WhatsAppBusinessProfile {
  about?: string
  address?: string
  description?: string
  email?: string
  profile_picture_url?: string
  websites?: Array<{ url: string }>
  vertical?: string
}

export class WhatsAppBusinessAPI {
  private config: WhatsAppBusinessConfig
  private baseUrl = 'https://graph.facebook.com'
  private client = supabase

  constructor(config: WhatsAppBusinessConfig) {
    this.config = config
  }

  private async makeRequest(endpoint: string, method: string = 'GET', data?: any) {
    const url = `${this.baseUrl}/${this.config.version}/${endpoint}`
    const headers = {
      Authorization: `Bearer ${this.config.accessToken}`,
      'Content-Type': 'application/json'
    }

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`WhatsApp API Error: ${error.error?.message || 'Unknown error'}`)
    }

    return response.json()
  }

  /**
   * Send a text message
   */
  async sendTextMessage(to: string, message: string, options?: {
    replyToMessageId?: string
    previewUrl?: boolean
  }): Promise<any> {
    const payload: WhatsAppMessagePayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.removePhoneNumberPrefix(to),
      type: 'text',
      text: {
        body: message,
        preview_url: options?.previewUrl || false
      }
    }

    if (options?.replyToMessageId) {
      payload.context = {
        message_id: options.replyToMessageId
      }
    }

    return this.makeRequest(`${this.config.phoneNumberId}/messages`, 'POST', payload)
  }

  /**
   * Send a template message
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode = 'en',
    components?: TemplateComponent[]
  ): Promise<any> {
    const payload: WhatsAppMessagePayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.removePhoneNumberPrefix(to),
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode
        },
        components
      }
    }

    return this.makeRequest(`${this.config.phoneNumberId}/messages`, 'POST', payload)
  }

  /**
   * Send an image message
   */
  async sendImageMessage(to: string, imageId?: string, imageUrl?: string, caption?: string): Promise<any> {
    const payload: WhatsAppMessagePayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.removePhoneNumberPrefix(to),
      type: 'image',
      image: {
        id: imageId,
        link: imageUrl,
        caption
      }
    }

    return this.makeRequest(`${this.config.phoneNumberId}/messages`, 'POST', payload)
  }

  /**
   * Send a document message
   */
  async sendDocumentMessage(
    to: string,
    documentId?: string,
    documentUrl?: string,
    caption?: string,
    filename?: string
  ): Promise<any> {
    const payload: WhatsAppMessagePayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.removePhoneNumberPrefix(to),
      type: 'document',
      document: {
        id: documentId,
        link: documentUrl,
        caption,
        filename
      }
    }

    return this.makeRequest(`${this.config.phoneNumberId}/messages`, 'POST', payload)
  }

  /**
   * Send an audio message
   */
  async sendAudioMessage(to: string, audioId?: string, audioUrl?: string): Promise<any> {
    const payload: WhatsAppMessagePayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.removePhoneNumberPrefix(to),
      type: 'audio',
      audio: {
        id: audioId,
        link: audioUrl
      }
    }

    return this.makeRequest(`${this.config.phoneNumberId}/messages`, 'POST', payload)
  }

  /**
   * Send a video message
   */
  async sendVideoMessage(to: string, videoId?: string, videoUrl?: string, caption?: string): Promise<any> {
    const payload: WhatsAppMessagePayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.removePhoneNumberPrefix(to),
      type: 'video',
      video: {
        id: videoId,
        link: videoUrl,
        caption
      }
    }

    return this.makeRequest(`${this.config.phoneNumberId}/messages`, 'POST', payload)
  }

  /**
   * Upload media to WhatsApp servers
   */
  async uploadMedia(file: File, type: 'image' | 'document' | 'video' | 'audio'): Promise<{ id: string }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('messaging_product', 'whatsapp')
    formData.append('type', type)

    const response = await fetch(
      `${this.baseUrl}/${this.config.version}/${this.config.phoneNumberId}/media`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`
        },
        body: formData
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to upload media: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return { id: data.id }
  }

  /**
   * Get media information
   */
  async getMediaInfo(mediaId: string): Promise<any> {
    return this.makeRequest(mediaId)
  }

  /**
   * Download media from WhatsApp servers
   */
  async downloadMedia(mediaId: string): Promise<Blob> {
    const mediaInfo = await this.getMediaInfo(mediaId)
    const response = await fetch(mediaInfo.url, {
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to download media')
    }

    return response.blob()
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string): Promise<any> {
    const payload = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId
    }

    return this.makeRequest('messages', 'POST', payload)
  }

  /**
   * Get business profile
   */
  async getBusinessProfile(): Promise<WhatsAppBusinessProfile> {
    return this.makeRequest(`${this.config.phoneNumberId}/whatsapp_business_profile`)
  }

  /**
   * Update business profile
   */
  async updateBusinessProfile(profile: Partial<WhatsAppBusinessProfile>): Promise<any> {
    return this.makeRequest(`${this.config.phoneNumberId}/whatsapp_business_profile`, 'POST', profile)
  }

  /**
   * Get all message templates
   */
  async getMessageTemplates(): Promise<any[]> {
    const response = await this.makeRequest(`${this.config.wabaId}/message_templates`)
    return response.data || []
  }

  /**
   * Create message template
   */
  async createMessageTemplate(template: {
    name: string
    category: string
    language: string
    components: any[]
  }): Promise<any> {
    return this.makeRequest(`${this.config.wabaId}/message_templates`, 'POST', template)
  }

  /**
   * Delete message template
   */
  async deleteMessageTemplate(templateName: string): Promise<any> {
    return this.makeRequest(`${this.config.wabaId}/message_templates/${templateName}`, 'DELETE')
  }

  /**
   * Get phone numbers
   */
  async getPhoneNumbers(): Promise<any[]> {
    return this.makeRequest(`${this.config.wabaId}/phone_numbers`)
  }

  /**
   * Verify webhook
   */
  static verifyWebhook(mode: string, token: string, challenge: string, verifyToken: string): string | null {
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge
    }
    return null
  }

  /**
   * Verify webhook signature (for enhanced security)
   */
  static verifyWebhookSignature(
    body: string,
    signature: string,
    appSecret: string
  ): boolean {
    const crypto = require('crypto')
    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', appSecret)
      .update(body)
      .digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  }

  /**
   * Parse webhook payload
   */
  static parseWebhookPayload(body: string): WhatsAppWebhookEvent {
    try {
      return JSON.parse(body)
    } catch (error) {
      throw new Error('Invalid webhook payload')
    }
  }

  /**
   * Send interactive message (buttons, list, etc.)
   */
  async sendInteractiveMessage(to: string, interactive: any): Promise<any> {
    const payload: WhatsAppMessagePayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.removePhoneNumberPrefix(to),
      type: 'interactive',
      interactive
    }

    return this.makeRequest(`${this.config.phoneNumberId}/messages`, 'POST', payload)
  }

  /**
   * Send location message
   */
  async sendLocationMessage(
    to: string,
    latitude: number,
    longitude: number,
    name?: string,
    address?: string
  ): Promise<any> {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.removePhoneNumberPrefix(to),
      type: 'location',
      location: {
        latitude,
        longitude,
        name,
        address
      }
    }

    return this.makeRequest(`${this.config.phoneNumberId}/messages`, 'POST', payload)
  }

  /**
   * Send contact message
   */
  async sendContactMessage(to: string, contacts: any[]): Promise<any> {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.removePhoneNumberPrefix(to),
      type: 'contacts',
      contacts
    }

    return this.makeRequest(`${this.config.phoneNumberId}/messages`, 'POST', payload)
  }

  /**
   * Handle webhook events and store in database
   */
  async handleWebhookEvent(event: WhatsAppWebhookEvent): Promise<void> {
    for (const entry of event.entry) {
      for (const change of entry.changes) {
        if (change.field === 'messages') {
          await this.processMessages(change.value)
        } else if (change.field === 'message_template_status_update') {
          await this.processTemplateStatusUpdate(change.value)
        } else if (change.field === 'phone_number_name_update') {
          await this.processPhoneNumberUpdate(change.value)
        } else if (change.field === 'account_update') {
          await this.processAccountUpdate(change.value)
        }
      }
    }
  }

  /**
   * Process incoming messages
   */
  private async processMessages(value: any): Promise<void> {
    const contacts = value.contacts || []
    const messages = value.messages || []

    for (const message of messages) {
      try {
        // Get or create profile for the sender
        let profile = null
        if (contacts.length > 0) {
          const contact = contacts[0]
          profile = await this.findOrCreateProfile(contact.wa_id, contact.profile?.name)
        }

        // Get or create message thread
        const threadId = await this.findOrCreateThread(
          message.from,
          'whatsapp',
          message
        )

        // Store message in database
        await this.client.from('messages').insert({
          thread_id: threadId,
          sender_id: profile?.id || null,
          content: this.extractMessageContent(message),
          message_type: message.type,
          direction: 'inbound',
          external_id: message.id,
          metadata: {
            raw_message: message,
            wa_id: contacts[0]?.wa_id
          },
          sent_at: new Date(parseInt(message.timestamp) * 1000).toISOString()
        })

        // Update thread last message timestamp
        await this.client
          .from('message_threads')
          .update({
            last_message_at: new Date(parseInt(message.timestamp) * 1000).toISOString()
          })
          .eq('id', threadId)

        // Mark as read in WhatsApp
        await this.markMessageAsRead(message.id)

      } catch (error) {
        console.error('Error processing WhatsApp message:', error)
      }
    }
  }

  /**
   * Process template status updates
   */
  private async processTemplateStatusUpdate(value: any): Promise<void> {
    // Handle template status updates
    console.log('Template status update:', value)
  }

  /**
   * Process phone number name updates
   */
  private async processPhoneNumberUpdate(value: any): Promise<void> {
    // Handle phone number name updates
    console.log('Phone number update:', value)
  }

  /**
   * Process account updates
   */
  private async processAccountUpdate(value: any): Promise<void> {
    // Handle account updates
    console.log('Account update:', value)
  }

  /**
   * Find or create profile from WhatsApp ID
   */
  private async findOrCreateProfile(waId: string, name?: string): Promise<any> {
    // First try to find by phone number (remove 'whatsapp:' prefix if present)
    const phoneNumber = waId.replace('whatsapp:', '')

    const { data: existingProfile } = await this.client
      .from('profiles')
      .select('*')
      .eq('phone', phoneNumber)
      .single()

    if (existingProfile) {
      return existingProfile
    }

    // Create new profile
    const { data: newProfile } = await this.client
      .from('profiles')
      .insert({
        phone: phoneNumber,
        full_name: name || phoneNumber,
        role: 'client'
      })
      .select()
      .single()

    return newProfile
  }

  /**
   * Find or create message thread
   */
  private async findOrCreateThread(from: string, channel: string, message: any): Promise<string> {
    // Remove 'whatsapp:' prefix if present
    const phoneNumber = from.replace('whatsapp:', '')

    // Find existing thread
    const { data: existingThread } = await this.client
      .from('message_threads')
      .select(`
        *,
        client:profiles!message_threads_client_id_fkey (
          id,
          full_name,
          phone
        )
      `)
      .eq('client.phone', phoneNumber)
      .eq('channel', channel)
      .order('last_message_at', { ascending: false })
      .limit(1)
      .single()

    if (existingThread) {
      return existingThread.id
    }

    // Create new thread
    const profile = await this.findOrCreateProfile(phoneNumber)

    const { data: newThread } = await this.client
      .from('message_threads')
      .insert({
        client_id: profile.id,
        channel,
        status: 'open'
      })
      .select()
      .single()

    return newThread.id
  }

  /**
   * Extract content from message
   */
  private extractMessageContent(message: any): string {
    if (message.text?.body) {
      return message.text.body
    }

    if (message.image?.caption) {
      return message.image.caption
    }

    if (message.document?.caption) {
      return message.document.caption
    }

    if (message.video?.caption) {
      return message.video.caption
    }

    // Return a generic description for media messages
    const type = message.type || 'message'
    return `[${type.charAt(0).toUpperCase() + type.slice(1)} message]`
  }

  /**
   * Remove phone number prefix
   */
  private removePhoneNumberPrefix(phoneNumber: string): string {
    if (phoneNumber.startsWith('whatsapp:')) {
      return phoneNumber.substring(9)
    }
    return phoneNumber
  }
}

// Singleton instance
let whatsappBusinessAPI: WhatsAppBusinessAPI | null = null

export function getWhatsAppBusinessAPI(config?: Partial<WhatsAppBusinessConfig>): WhatsAppBusinessAPI {
  if (!whatsappBusinessAPI) {
    const fullConfig: WhatsAppBusinessConfig = {
      phoneNumberId: config?.phoneNumberId || getEnvVar('WHATSAPP_PHONE_NUMBER_ID', ['VITE_WHATSAPP_PHONE_NUMBER_ID']) || '',
      accessToken: config?.accessToken || getEnvVar('WHATSAPP_ACCESS_TOKEN', ['VITE_WHATSAPP_ACCESS_TOKEN']) || '',
      version: config?.version || getEnvVar('WHATSAPP_API_VERSION', ['VITE_WHATSAPP_API_VERSION']) || 'v18.0',
      wabaId: config?.wabaId || getEnvVar('WHATSAPP_WABA_ID', ['VITE_WHATSAPP_WABA_ID']) || '',
      webhookVerifyToken: config?.webhookVerifyToken || getEnvVar('WHATSAPP_WEBHOOK_VERIFY_TOKEN', ['VITE_WHATSAPP_WEBHOOK_VERIFY_TOKEN'])
    }

    if (!fullConfig.accessToken || !fullConfig.phoneNumberId) {
      throw new Error('WhatsApp API credentials not provided')
    }

    whatsappBusinessAPI = new WhatsAppBusinessAPI(fullConfig)
  }

  return whatsappBusinessAPI
}

// Helper functions for common use cases
export async function sendBookingConfirmation(
  to: string,
  customerName: string,
  serviceName: string,
  date: string,
  time: string
): Promise<any> {
  const api = getWhatsAppBusinessAPI()

  return api.sendTemplateMessage(to, 'booking_confirmation', 'en', [
    {
      type: 'body',
      parameters: [
        {
          type: 'text',
          text: customerName
        },
        {
          type: 'text',
          text: serviceName
        },
        {
          type: 'text',
          text: date
        },
        {
          type: 'text',
          text: time
        }
      ]
    }
  ])
}

export async function sendAppointmentReminder(
  to: string,
  customerName: string,
  serviceName: string,
  time: string
): Promise<any> {
  const api = getWhatsAppBusinessAPI()

  // Try to send as template first
  try {
    return await api.sendTemplateMessage(to, 'appointment_reminder', 'en', [
      {
        type: 'body',
        parameters: [
          {
            type: 'text',
            text: customerName
          },
          {
            type: 'text',
            text: serviceName
          },
          {
            type: 'text',
            text: time
          }
        ]
      }
    ])
  } catch (error) {
    // Fallback to text message
    const message = `Hi ${customerName}! Reminder: Your appointment at ${time} for ${serviceName}. We can't wait to see you! 💖`
    return api.sendTextMessage(to, message)
  }
}

export async function sendAftercareTips(
  to: string,
  serviceName: string,
  aftercareTips: string
): Promise<any> {
  const api = getWhatsAppBusinessAPI()
  const message = `After your ${serviceName} treatment, remember to ${aftercareTips}. Contact us if you have any questions!`

  return api.sendTextMessage(to, message)
}

export async function sendReviewRequest(to: string, serviceName: string): Promise<any> {
  const api = getWhatsAppBusinessAPI()
  const message = `How was your ${serviceName} experience? We'd love to hear your feedback! ⭐ Reply with your review.`

  return api.sendTextMessage(to, message)
}

export async function sendReferralInvite(
  to: string,
  referralCode: string,
  reward: string
): Promise<any> {
  const api = getWhatsAppBusinessAPI()
  const message = `Give a friend 10% off their first treatment and get ${reward} for each successful referral! Share your code: ${referralCode}`

  return api.sendTextMessage(to, message)
}

// Initialize WhatsApp API with environment variables
export function initializeWhatsAppAPI(): void {
  try {
    getWhatsAppBusinessAPI()
  } catch (error) {
    console.warn('WhatsApp API not initialized:', error)
  }
}
