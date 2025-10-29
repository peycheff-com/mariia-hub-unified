import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TriggerEvent {
  type: 'booking_completed' | 'booking_cancelled' | 'payment_completed' | 'service_delivered'
  bookingId: string
  userId?: string
  timestamp?: string
  metadata?: Record<string, any>
}

serve(async (req) => {
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

    const event: TriggerEvent = await req.json()

    if (!event.bookingId) {
      throw new Error('Booking ID is required')
    }

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select(`
        *,
        services(title, service_type),
        profiles!bookings_user_id_fkey(email, full_name, phone, preferred_language)
      `)
      .eq('id', event.bookingId)
      .single()

    if (bookingError || !booking) {
      throw new Error('Booking not found')
    }

    // Get user consent preferences
    const { data: consents } = await supabaseClient
      .from('user_consents')
      .select('*')
      .eq('user_id', booking.user_id)
      .single()

    const userId = event.userId || booking.user_id

    // Process different trigger types
    switch (event.type) {
      case 'booking_completed':
        await handleBookingCompleted(supabaseClient, booking, consents)
        break
      case 'booking_cancelled':
        await handleBookingCancelled(supabaseClient, booking, consents)
        break
      case 'payment_completed':
        await handlePaymentCompleted(supabaseClient, booking, consents)
        break
      case 'service_delivered':
        await handleServiceDelivered(supabaseClient, booking, consents)
        break
      default:
        console.log(`Unknown trigger type: ${event.type}`)
    }

    // Log the trigger event
    await logTriggerEvent(supabaseClient, event, booking)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Feedback triggers processed successfully',
        bookingId: event.bookingId,
        eventType: event.type,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Trigger processing error:', error)
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

async function handleBookingCompleted(supabaseClient: any, booking: any, consents: any) {
  // Schedule post-booking review request
  await scheduleFeedbackRequest(supabaseClient, {
    userId: booking.user_id,
    bookingId: booking.id,
    feedbackType: 'post_booking_review',
    channel: 'email',
    delay: 60, // 1 hour after completion
    priority: 'medium',
  }, consents)

  // Schedule NPS survey for completed bookings
  await scheduleFeedbackRequest(supabaseClient, {
    userId: booking.user_id,
    bookingId: booking.id,
    feedbackType: 'nps_survey',
    channel: 'email',
    delay: 1440, // 24 hours after completion
    priority: 'low',
  }, consents)

  // If it's a high-value service, schedule additional feedback
  if (booking.services?.service_type === 'beauty' || booking.amount_paid > 200) {
    await scheduleFeedbackRequest(supabaseClient, {
      userId: booking.user_id,
      bookingId: booking.id,
      feedbackType: 'service_rating',
      channel: 'email',
      delay: 2880, // 48 hours after completion
      priority: 'high',
    }, consents)
  }
}

async function handleBookingCancelled(supabaseClient: any, booking: any, consents: any) {
  // Schedule cancellation feedback request
  await scheduleFeedbackRequest(supabaseClient, {
    userId: booking.user_id,
    bookingId: booking.id,
    feedbackType: 'general_feedback',
    channel: 'email',
    delay: 30, // 30 minutes after cancellation
    priority: 'medium',
    customMessage: generateCancellationMessage(booking),
  }, consents)
}

async function handlePaymentCompleted(supabaseClient: any, booking: any, consents: any) {
  // Schedule payment experience feedback
  await scheduleFeedbackRequest(supabaseClient, {
    userId: booking.user_id,
    bookingId: booking.id,
    feedbackType: 'payment_experience',
    channel: 'email',
    delay: 15, // 15 minutes after payment
    priority: 'low',
  }, consents)
}

async function handleServiceDelivered(supabaseClient: any, booking: any, consents: any) {
  // This would be triggered when the actual service is marked as delivered
  // Schedule immediate feedback request for service delivery
  await scheduleFeedbackRequest(supabaseClient, {
    userId: booking.user_id,
    bookingId: booking.id,
    feedbackType: 'service_rating',
    channel: 'sms',
    delay: 5, // 5 minutes after service delivery
    priority: 'high',
  }, consents)
}

async function scheduleFeedbackRequest(
  supabaseClient: any,
  request: {
    userId: string
    bookingId: string
    feedbackType: string
    channel: string
    delay: number
    priority: string
    customMessage?: string
  },
  consents: any
) {
  // Check user consent for the channel
  const hasConsent = checkChannelConsent(request.channel, consents)
  if (!hasConsent) {
    console.log(`User ${request.userId} has not consented to ${request.channel} communications`)
    return
  }

  // Calculate scheduled time
  const scheduledFor = new Date(Date.now() + request.delay * 60 * 1000).toISOString()

  // Get user contact information
  const { data: user } = await supabaseClient
    .from('profiles')
    .select('email, phone, full_name, preferred_language')
    .eq('id', request.userId)
    .single()

  if (!user) {
    console.error(`User not found: ${request.userId}`)
    return
  }

  const recipient = request.channel === 'email' ? user.email : user.phone

  // Generate message content
  const messageContent = generateFeedbackMessage(
    request.feedbackType,
    user,
    request.bookingId,
    request.customMessage
  )

  // Create scheduled message
  const { error: scheduleError } = await supabaseClient
    .from('scheduled_messages')
    .insert({
      recipient,
      channel: request.channel,
      content: messageContent,
      scheduled_for: scheduledFor,
      metadata: {
        feedback_type: request.feedbackType,
        user_id: request.userId,
        booking_id: request.bookingId,
        priority: request.priority,
        language: user.preferred_language || 'en',
      },
      status: 'scheduled',
    })

  if (scheduleError) {
    console.error(`Failed to schedule feedback request: ${scheduleError.message}`)
  } else {
    console.log(`Feedback request scheduled for ${request.feedbackType} to ${request.userId} at ${scheduledFor}`)
  }
}

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
  bookingId: string,
  customMessage?: string
): string {
  const userName = user.full_name || 'there'
  const feedbackUrl = `${Deno.env.get('SITE_URL')}/feedback?booking=${bookingId}&type=${feedbackType}`

  if (customMessage) {
    return `${customMessage}\n\nShare your feedback: ${feedbackUrl}`
  }

  switch (feedbackType) {
    case 'post_booking_review':
      return `Hi ${userName},

Thank you for choosing Mariia Hub! We'd love to hear about your recent experience.

Your feedback helps us improve our services and ensure we're providing the best possible care.

Click here to share your experience: ${feedbackUrl}

It only takes 2-3 minutes and your input is incredibly valuable to us.

Thank you for helping us grow!
The Mariia Hub Team`

    case 'nps_survey':
      return `Hi ${userName},

At Mariia Hub, we're committed to providing exceptional service. Your opinion matters to us!

On a scale of 0-10, how likely are you to recommend Mariia Hub to friends and colleagues?

Click here to answer: ${feedbackUrl}

Thank you for your time!
The Mariia Hub Team`

    case 'service_rating':
      return `Hi ${userName},

We hope you enjoyed your experience with Mariia Hub!

Could you take a moment to rate our services? Your ratings help us maintain our quality standards.

Rate our services: ${feedbackUrl}

Thank you for being a valued client!
The Mariia Hub Team`

    case 'payment_experience':
      return `Hi ${userName},

Thank you for your recent payment with Mariia Hub.

We'd love to hear about your payment experience to help us improve our billing process.

Share your feedback: ${feedbackUrl}

Your input is valuable to us!
The Mariia Hub Team`

    default:
      return `Hi ${userName},

We'd love to hear your feedback about your experience with Mariia Hub.

Share your thoughts: ${feedbackUrl}

Thank you for helping us improve!
The Mariia Hub Team`
  }
}

function generateCancellationMessage(booking: any): string {
  return `Hi ${booking.profiles?.full_name || 'there'},

We're sorry to see your recent booking was cancelled. We understand that plans change, and we'd appreciate your feedback to help us improve our service.

If you have a moment, could you let us know about your experience? Your input helps us understand what we can do better.

Thank you for your understanding.
The Mariia Hub Team`
}

async function logTriggerEvent(supabaseClient: any, event: TriggerEvent, booking: any) {
  try {
    await supabaseClient
      .from('booking_event_log')
      .insert({
        booking_id: event.bookingId,
        event_type: `feedback_trigger_${event.type}`,
        event_data: {
          triggerEvent: event,
          bookingDetails: {
            service_type: booking.services?.service_type,
            service_title: booking.services?.title,
            booking_date: booking.booking_date,
            amount_paid: booking.amount_paid,
          },
        },
        created_at: new Date().toISOString(),
      })
  } catch (error) {
    console.error('Failed to log trigger event:', error)
  }
}