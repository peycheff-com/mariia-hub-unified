import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SMSRequest {
  to: string
  message: string
  messageId?: string
  threadId?: string
  templateId?: string
  variables?: Record<string, string>
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      )
    }

    // Parse request body
    const body: SMSRequest = await req.json()

    // Validate required fields
    if (!body.to || !body.message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, message' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get SMS settings from database
    const { data: smsSettings } = await supabase
      .from('communication_settings')
      .select('*')
      .eq('channel', 'sms')
      .single()

    if (!smsSettings || !smsSettings.configuration?.from_number) {
      console.error('SMS settings not configured')
      return new Response(
        JSON.stringify({ error: 'SMS service not configured' }),
        { status: 500, headers: corsHeaders }
      )
    }

    const twilioAccountSid = smsSettings.configuration.account_sid || Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = smsSettings.configuration.auth_token || Deno.env.get('TWILIO_AUTH_TOKEN')
    const fromNumber = smsSettings.configuration.from_number

    if (!twilioAccountSid || !twilioAuthToken) {
      console.error('Twilio credentials not found')
      return new Response(
        JSON.stringify({ error: 'SMS service credentials not configured' })
      )
    }

    // Format phone number (remove any non-numeric characters except +)
    const formattedTo = body.to.replace(/[^\d\+]/g, '')

    // Prepare Twilio request data
    const twilioData = new URLSearchParams()
    twilioData.append('To', formattedTo)
    twilioData.append('From', fromNumber)
    twilioData.append('Body', body.message)

    // Send SMS using Twilio API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: twilioData,
    })

    if (!twilioResponse.ok) {
      const errorData = await twilioResponse.text()
      console.error('Twilio API error:', errorData)
      return new Response(
        JSON.stringify({
          error: 'Failed to send SMS',
          details: errorData
        }),
        { status: 500, headers: corsHeaders }
      )
    }

    const twilioResult = await twilioResponse.json()

    // Update message status in database if messageId provided
    if (body.messageId) {
      try {
        await supabase
          .from('messages')
          .update({
            delivery_status: 'sent',
            external_id: twilioResult.sid
          })
          .eq('id', body.messageId)
      } catch (error) {
        console.error('Error updating message status:', error)
      }
    }

    // Log the SMS for analytics
    try {
      await supabase.from('sms_logs').insert({
        to: formattedTo,
        from: fromNumber,
        message: body.message,
        message_sid: twilioResult.sid,
        status: 'sent',
        thread_id: body.threadId,
        template_id: body.templateId,
        created_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error logging SMS:', error)
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: twilioResult.sid,
        status: 'sent'
      }),
      { status: 200, headers: corsHeaders }
    )

  } catch (error) {
    console.error('SMS service error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    )
  }
})