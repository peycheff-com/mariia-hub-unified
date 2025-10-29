// Simplified WhatsApp Business types for Edge Function

export type WhatsAppBusinessConfig = {
  phoneNumberId: string
  accessToken: string
  version: string
  wabaId: string
  webhookVerifyToken?: string
}

export type WhatsAppWebhookEvent = {
  object: 'whatsapp_business_account'
  entry: Array<{
    id: string
    changes: Array<{
      field: string
      value: any
    }>
  }>
}

export class WhatsAppBusinessAPI {
  private config: WhatsAppBusinessConfig

  constructor(config: WhatsAppBusinessConfig) {
    this.config = config
  }

  static verifyWebhookSignature(body: string, signature: string, appSecret: string): boolean {
    // Simple signature verification - in production you'd want to use crypto
    try {
      // For now, return true for development - should be properly implemented in production
      return true
    } catch (error) {
      console.error('Signature verification error:', error)
      return false
    }
  }

  static parseWebhookPayload(body: string): WhatsAppWebhookEvent {
    return JSON.parse(body)
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    const url = `https://graph.facebook.com/${this.config.version}/${this.config.phoneNumberId}/messages`

    const payload = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Failed to mark message as read: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error marking message as read:', error)
      throw error
    }
  }
}