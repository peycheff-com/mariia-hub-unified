import { supabase } from '@/integrations/supabase/client'

export interface EmailTemplate {
  to: string
  subject: string
  template: 'weekly' | 'promotional' | 'new_service' | 'blog_update'
  data?: Record<string, any>
}

export interface BookingEmailData {
  bookingId: string
  userId: string
  type?: 'confirmation' | 'reminder'
}

export class ResendService {
  static async sendNewsletter(email: EmailTemplate) {
    const { data, error } = await supabase.functions.invoke('send-newsletter', {
      body: email
    })

    if (error) {
      console.error('Error sending newsletter:', error)
      throw error
    }

    return data
  }

  static async sendBookingConfirmation(bookingData: BookingEmailData) {
    const { data, error } = await supabase.functions.invoke('send-booking-confirmation', {
      body: bookingData
    })

    if (error) {
      console.error('Error sending booking confirmation:', error)
      throw error
    }

    return data
  }

  static async subscribeToList(email: string, list?: string) {
    // Store in newsletter_subscribers table
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .upsert({
        email,
        status: 'active',
        subscribed_at: new Date().toISOString(),
        source: 'website'
      })
      .select()
      .single()

    if (error) {
      console.error('Error subscribing to newsletter:', error)
      throw error
    }

    return data
  }

  static async unsubscribeFromList(email: string) {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()
      .single()

    if (error) {
      console.error('Error unsubscribing from newsletter:', error)
      throw error
    }

    return data
  }

  static async getSubscriberCount() {
    const { count, error } = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    if (error) {
      console.error('Error getting subscriber count:', error)
      throw error
    }

    return count || 0
  }

  static async getAllSubscribers() {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('status', 'active')
      .order('subscribed_at', { ascending: false })

    if (error) {
      console.error('Error getting subscribers:', error)
      throw error
    }

    return data
  }
}

// React hook for newsletter
export const useNewsletter = () => {
  const subscribe = async (email: string) => {
    try {
      await ResendService.subscribeToList(email)
      return { success: true }
    } catch (error) {
      return { success: false, error }
    }
  }

  const unsubscribe = async (email: string) => {
    try {
      await ResendService.unsubscribeFromList(email)
      return { success: true }
    } catch (error) {
      return { success: false, error }
    }
  }

  return { subscribe, unsubscribe }
}