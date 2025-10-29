import { supabase } from '@/integrations/supabase/client'

export interface WhatsAppMessage {
  to: string
  templateName?: string
  templateLanguage?: string
  customMessage?: string
  type: 'template' | 'custom'
  components?: any[]
}

export interface SMSMessage {
  to: string
  message: string
  type: 'appointment' | 'promotion' | 'reminder' | 'verification' | 'alert'
  priority?: 'low' | 'normal' | 'high'
  scheduledAt?: string
}

export interface CommunicationLog {
  id: string
  type: 'whatsapp' | 'sms' | 'email'
  recipient: string
  message_id: string
  status: 'sent' | 'delivered' | 'failed' | 'scheduled'
  provider: 'twilio' | 'resend'
  metadata: Record<string, any>
  created_at: string
}

export class CommunicationService {
  // WhatsApp methods
  static async sendWhatsApp(message: WhatsAppMessage) {
    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: { message }
    })

    if (error) {
      console.error('Error sending WhatsApp message:', error)
      throw error
    }

    return data
  }

  static async sendBookingConfirmationWhatsApp(
    phoneNumber: string,
    customerName: string,
    serviceName: string,
    date: string,
    time: string
  ) {
    return this.sendWhatsApp({
      to: `whatsapp:${phoneNumber}`,
      templateName: 'booking_confirmation',
      templateLanguage: 'en',
      type: 'template'
    })
  }

  static async sendPromotionalWhatsApp(
    phoneNumber: string,
    offerText: string,
    discount: string,
    bookingUrl: string
  ) {
    return this.sendWhatsApp({
      to: `whatsapp:${phoneNumber}`,
      templateName: 'promotion',
      templateLanguage: 'en',
      type: 'template'
    })
  }

  static async sendCustomWhatsApp(phoneNumber: string, message: string) {
    return this.sendWhatsApp({
      to: `whatsapp:${phoneNumber}`,
      customMessage: message,
      type: 'custom'
    })
  }

  // SMS methods
  static async sendSMS(sms: SMSMessage) {
    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: sms
    })

    if (error) {
      console.error('Error sending SMS:', error)
      throw error
    }

    return data
  }

  static async sendBookingConfirmationSMS(
    phoneNumber: string,
    customerName: string,
    serviceName: string,
    date: string,
    time: string
  ) {
    const message = `Hi ${customerName}! Your booking at BM Beauty Studio is confirmed. ${serviceName} on ${date} at ${time}. Reply STOP to unsubscribe.`

    return this.sendSMS({
      to: phoneNumber,
      message,
      type: 'appointment',
      priority: 'high'
    })
  }

  static async sendBookingReminderSMS(
    phoneNumber: string,
    customerName: string,
    serviceName: string,
    time: string
  ) {
    const message = `Hi ${customerName}! Reminder: Your appointment at BM Beauty Studio tomorrow at ${time} for ${serviceName}. See you soon!`

    return this.sendSMS({
      to: phoneNumber,
      message,
      type: 'reminder',
      priority: 'normal'
    })
  }

  static async sendPromotionalSMS(
    phoneNumber: string,
    offerText: string,
    discountCode: string
  ) {
    const message = `🎉 Special Offer from BM Beauty Studio! ${offerText} Use code ${discountCode} for ${discountCode} off. Book now: https://bmbeautystudio.pl/book Reply STOP to unsubscribe`

    return this.sendSMS({
      to: phoneNumber,
      message,
      type: 'promotion',
      priority: 'normal'
    })
  }

  static async sendVerificationCode(phoneNumber: string, code: string) {
    const message = `Your BM Beauty Studio verification code is: ${code}. Valid for 10 minutes.`

    return this.sendSMS({
      to: phoneNumber,
      message,
      type: 'verification',
      priority: 'high'
    })
  }

  // Communication logs
  static async getCommunicationLogs(limit = 100) {
    const { data, error } = await supabase
      .from('communication_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching communication logs:', error)
      throw error
    }

    return data
  }

  static async getCommunicationStats() {
    const { data, error } = await supabase
      .from('communication_logs')
      .select('type, status, provider, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    if (error) {
      console.error('Error fetching communication stats:', error)
      throw error
    }

    const stats = {
      total: data.length,
      whatsapp: data.filter(d => d.type === 'whatsapp').length,
      sms: data.filter(d => d.type === 'sms').length,
      email: data.filter(d => d.type === 'email').length,
      sent: data.filter(d => d.status === 'sent').length,
      delivered: data.filter(d => d.status === 'delivered').length,
      failed: data.filter(d => d.status === 'failed').length,
      byDate: {} as Record<string, number>
    }

    // Group by date
    data.forEach(log => {
      const date = log.created_at.split('T')[0]
      stats.byDate[date] = (stats.byDate[date] || 0) + 1
    })

    return stats
  }
}

// React hook for communication
export const useCommunication = () => {
  const sendWhatsAppMessage = async (message: WhatsAppMessage) => {
    try {
      const result = await CommunicationService.sendWhatsApp(message)
      return { success: true, result }
    } catch (error) {
      return { success: false, error }
    }
  }

  const sendSMSMessage = async (sms: SMSMessage) => {
    try {
      const result = await CommunicationService.sendSMS(sms)
      return { success: true, result }
    } catch (error) {
      return { success: false, error }
    }
  }

  const getLogs = async (limit?: number) => {
    try {
      const logs = await CommunicationService.getCommunicationLogs(limit)
      return { success: true, logs }
    } catch (error) {
      return { success: false, error }
    }
  }

  return {
    sendWhatsAppMessage,
    sendSMSMessage,
    getLogs
  }
}