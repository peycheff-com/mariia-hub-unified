import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FeedbackRequestRequest {
  userId?: string
  bookingId?: string
  feedbackType: 'post_booking_review' | 'nps_survey' | 'service_rating'
  channel: 'email' | 'sms' | 'whatsapp'
  delay?: number // minutes
  customMessage?: string
  templateId?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const {
      userId,
      bookingId,
      feedbackType,
      channel,
      delay = 0,
      customMessage,
      templateId
    }: FeedbackRequestRequest = await req.json()

    if (!userId && !bookingId) {
      throw new Error('Either userId or bookingId is required')
    }

    // Get user and booking details
    let user, booking, service

    if (bookingId) {
      const { data: bookingData } = await supabaseClient
        .from('bookings')
        .select(`
          *,
          services(title, service_type),
          profiles!bookings_user_id_fkey(email, full_name, phone)
        `)
        .eq('id', bookingId)
        .single()

      if (!bookingData) {
        throw new Error('Booking not found')
      }

      booking = bookingData
      user = bookingData.profiles
      service = bookingData.services
    } else {
      const { data: userData } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!userData) {
        throw new Error('User not found')
      }

      user = userData
    }

    // Get user consent preferences
    const { data: consents } = await supabaseClient
      .from('user_consents')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Check consent for the channel
    const hasConsent = checkChannelConsent(channel, consents)
    if (!hasConsent) {
      throw new Error(`User has not consented to ${channel} communications`)
    }

    // Get feedback template
    let template
    if (templateId) {
      const { data: templateData } = await supabaseClient
        .from('feedback_templates')
        .select('*')
        .eq('id', templateId)
        .single()
      template = templateData
    } else {
      const { data: templateData } = await supabaseClient
        .from('feedback_templates')
        .select('*')
        .eq('feedback_type', feedbackType)
        .eq('is_active', true)
        .single()
      template = templateData
    }

    // Create the feedback request
    const scheduledFor = new Date(Date.now() + delay * 60 * 1000).toISOString()

    const { data: scheduledMessage, error: scheduleError } = await supabaseClient
      .from('scheduled_messages')
      .insert({
        recipient: channel === 'email' ? user.email : user.phone,
        channel,
        content: generateFeedbackMessage(feedbackType, user, booking, service, customMessage, template),
        scheduled_for: scheduledFor,
        metadata: {
          feedback_type: feedbackType,
          user_id: user.id,
          booking_id: bookingId,
          service_id: service?.id,
          template_id: templateId,
        },
        status: 'scheduled',
      })
      .select()
      .single()

    if (scheduleError) {
      throw new Error(`Failed to schedule feedback request: ${scheduleError.message}`)
    }

    // Log the campaign
    await logFeedbackCampaign(supabaseClient, {
      userId: user.id,
      bookingId,
      feedbackType,
      channel,
      scheduledMessageId: scheduledMessage.id,
      scheduledFor,
    })

    return new Response(
      JSON.stringify({
        success: true,
        scheduledMessageId: scheduledMessage.id,
        scheduledFor,
        message: `Feedback request scheduled for ${channel}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Feedback request scheduling error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

function checkChannelConsent(channel: string, consents: any): boolean {
  if (!consents) return false

  switch (channel) {
    case 'email':
      return consents.email_marketing_opt_in === true
    case 'sms':
      return consents.sms_opt_in === true
    case 'whatsapp':
      return consents.whatsapp_opt_in === true
    default:
      return false
  }
}

function generateFeedbackMessage(
  feedbackType: string,
  user: any,
  booking: any,
  service: any,
  customMessage?: string,
  template?: any
): string {
  const userName = user.full_name || 'there'
  const serviceName = service?.title || 'your recent service'
  const bookingDate = booking ? new Date(booking.booking_date).toLocaleDateString() : ''

  if (customMessage) {
    return customMessage
  }

  switch (feedbackType) {
    case 'post_booking_review':
      return `Hi ${userName},

Thank you for choosing Mariia Hub for your ${serviceName} appointment on ${bookingDate}!

We'd love to hear about your experience. Your feedback helps us improve our services and ensure we're providing the best possible care to all our clients.

Click here to share your experience: [FEEDBACK_LINK]

It only takes 2-3 minutes and your input is incredibly valuable to us.

Thank you for helping us grow!
The Mariia Hub Team`

    case 'nps_survey':
      return `Hi ${userName},

At Mariia Hub, we're committed to providing exceptional service and experiences. Your opinion matters to us!

Would you take a moment to answer one quick question?

On a scale of 0-10, how likely are you to recommend Mariia Hub to friends and colleagues?

Click here to answer: [NPS_LINK]

Your feedback helps us understand what we're doing well and where we can improve.

Thank you for your time!
The Mariia Hub Team`

    case 'service_rating':
      return `Hi ${userName},

We hope you're enjoying your experience with Mariia Hub!

Could you take a moment to rate our services? Your ratings help us maintain our quality standards and identify areas for improvement.

Rate our services: [RATING_LINK]

Thank you for being a valued client!
The Mariia Hub Team`

    default:
      return `Hi ${userName},

We'd love to hear your feedback about your experience with Mariia Hub.

Share your thoughts: [FEEDBACK_LINK]

Thank you for helping us improve!
The Mariia Hub Team`
  }
}

async function logFeedbackCampaign(supabaseClient: any, data: {
  userId: string
  bookingId?: string
  feedbackType: string
  channel: string
  scheduledMessageId: string
  scheduledFor: string
}) {
  try {
    await supabaseClient
      .from('feedback_campaigns')
      .insert({
        name: `Automated ${data.feedbackType} Request`,
        description: `Scheduled ${data.channel} feedback request`,
        campaign_type: data.channel,
        target_criteria: { user_id: data.userId, booking_id: data.bookingId },
        trigger_conditions: { feedback_type: data.feedbackType },
        start_date: data.scheduledFor,
        is_active: true,
        metadata: {
          scheduled_message_id: data.scheduledMessageId,
          user_id: data.userId,
          booking_id: data.bookingId,
        },
      })
  } catch (error) {
    console.error('Failed to log feedback campaign:', error)
  }
}