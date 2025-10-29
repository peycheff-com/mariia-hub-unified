import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Twilio configuration
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
const TWILIO_WHATSAPP_NUMBER = Deno.env.get('TWILIO_WHATSAPP_NUMBER') // e.g., 'whatsapp:+14155238886'

interface WhatsAppMessage {
  to: string // Format: 'whatsapp:+48123456789'
  templateName: string
  templateLanguage: string
  templateComponents?: any[]
  customMessage?: string
  type: 'template' | 'custom'
}

const templates = {
  booking_confirmation: {
    name: 'booking_confirmation',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{customer_name}}' },
          { type: 'text', text: '{{service_name}}' },
          { type: 'text', text: '{{date}}' },
          { type: 'text', text: '{{time}}' },
          { type: 'text', text: '{{location}}' }
        ]
      }
    ]
  },
  booking_reminder: {
    name: 'booking_reminder',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{customer_name}}' },
          { type: 'text', text: '{{service_name}}' },
          { type: 'text', text: '{{time}}' }
        ]
      }
    ]
  },
  promotion: {
    name: 'special_offer',
    components: [
      {
        type: 'header',
        parameters: [
          { type: 'image', image: { id: '{{image_id}}' } }
        ]
      },
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{offer_text}}' },
          { type: 'text', text: '{{discount}}' },
          { type: 'text', text: '{{expiry_date}}' }
        ]
      },
      {
        type: 'button',
        sub_type: 'url',
        index: '0',
        parameters: [
          { type: 'text', text: '{{booking_url}}' }
        ]
      }
    ]
  }
}

serve(async (req) => {
  try {
    const { message }: { message: WhatsAppMessage } = await req.json()

    if (!message.to || !TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
      return new Response(
        JSON.stringify({ error: 'Missing required configuration' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Prepare Twilio request
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`

    const body: any = {
      To: message.to,
      From: TWILIO_WHATSAPP_NUMBER,
    }

    if (message.type === 'template' && message.templateName) {
      const template = templates[message.templateName as keyof typeof templates]
      if (template) {
        body.MessagingServiceSid = Deno.env.get('TWILIO_MESSAGING_SERVICE_SID')
        body.ContentSid = Deno.env.get(`TWILIO_TEMPLATE_${message.templateName.toUpperCase()}`)

        // Use Content API for template messages
        const contentVariables: Record<string, any> = {}
        if (message.templateComponents) {
          message.templateComponents.forEach((comp, index) => {
            contentVariables[`${index + 1}`] = comp.parameters || []
          })
        }
        body.ContentVariables = JSON.stringify(contentVariables)
      }
    } else if (message.customMessage) {
      body.Body = message.customMessage
    }

    // Send to Twilio
    const authString = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authString}`
      },
      body: new URLSearchParams(body).toString()
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Twilio error:', data)
      return new Response(
        JSON.stringify({ error: data.message || 'Failed to send WhatsApp message' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Log the message
    await supabase
      .from('communication_logs')
      .insert({
        type: 'whatsapp',
        recipient: message.to.replace('whatsapp:', ''),
        message_id: data.sid,
        status: 'sent',
        provider: 'twilio',
        metadata: {
          template: message.templateName,
          type: message.type
        },
        created_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})