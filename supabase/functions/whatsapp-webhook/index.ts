import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { WhatsAppBusinessAPI, WhatsAppWebhookEvent } from "./whatsapp-types.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-whatsapp-signature',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only accept POST requests for webhooks
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      )
    }

    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    // Handle webhook verification
    if (mode && token && challenge) {
      const verifyToken = Deno.env.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN')

      if (mode === 'subscribe' && token === verifyToken) {
        return new Response(challenge, {
          status: 200,
          headers: corsHeaders
        })
      } else {
        return new Response(
          JSON.stringify({ error: 'Invalid verification token' }),
          { status: 403, headers: corsHeaders }
        )
      }
    }

    // Get request body
    const body = await req.text()
    const signature = req.headers.get('x-whatsapp-signature')
    const appSecret = Deno.env.get('WHATSAPP_APP_SECRET')

    // Verify webhook signature for security
    if (appSecret && signature) {
      const isValidSignature = WhatsAppBusinessAPI.verifyWebhookSignature(body, signature, appSecret)

      if (!isValidSignature) {
        console.error('Invalid webhook signature')
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 403, headers: corsHeaders }
        )
      }
    }

    // Parse webhook payload
    let event: WhatsAppWebhookEvent
    try {
      event = WhatsAppBusinessAPI.parseWebhookPayload(body)
    } catch (error) {
      console.error('Failed to parse webhook payload:', error)
      return new Response(
        JSON.stringify({ error: 'Invalid payload' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Initialize WhatsApp API
    const whatsappConfig = {
      phoneNumberId: Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')!,
      accessToken: Deno.env.get('WHATSAPP_ACCESS_TOKEN')!,
      version: Deno.env.get('WHATSAPP_API_VERSION') || 'v18.0',
      wabaId: Deno.env.get('WHATSAPP_WABA_ID')!
    }

    const whatsappAPI = new WhatsAppBusinessAPI(whatsappConfig)

    // Process webhook events
    await processWebhookEvents(event, supabase, whatsappAPI)

    return new Response(
      JSON.stringify({ status: 'success' }),
      { status: 200, headers: corsHeaders }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    )
  }
})

async function processWebhookEvents(
  event: WhatsAppWebhookEvent,
  supabase: any,
  whatsappAPI: WhatsAppBusinessAPI
) {
  for (const entry of event.entry) {
    for (const change of entry.changes) {
      if (change.field === 'messages') {
        await processMessages(change.value, supabase, whatsappAPI)
      } else if (change.field === 'message_template_status_update') {
        await processTemplateStatusUpdate(change.value, supabase)
      } else if (change.field === 'phone_number_name_update') {
        await processPhoneNumberUpdate(change.value, supabase)
      } else if (change.field === 'account_update') {
        await processAccountUpdate(change.value, supabase)
      } else if (change.field === 'message_status') {
        await processMessageStatusUpdate(change.value, supabase)
      }
    }
  }
}

async function processMessages(value: any, supabase: any, whatsappAPI: WhatsAppBusinessAPI) {
  const contacts = value.contacts || []
  const messages = value.messages || []
  const metadata = value.metadata || {}

  console.log(`Processing ${messages.length} messages from ${metadata.display_phone_number}`)

  for (const message of messages) {
    try {
      // Get or create profile for the sender
      let profile = null
      if (contacts.length > 0) {
        const contact = contacts[0]
        profile = await findOrCreateProfile(supabase, contact.wa_id, contact.profile?.name)
      }

      // Get or create message thread
      const threadId = await findOrCreateThread(
        supabase,
        message.from,
        'whatsapp',
        message,
        profile
      )

      // Extract message content and type
      const content = extractMessageContent(message)
      const messageType = message.type === 'text' ? 'text' :
                         message.type === 'image' ? 'image' :
                         message.type === 'document' ? 'document' :
                         message.type === 'audio' ? 'audio' :
                         message.type === 'video' ? 'video' : 'text'

      // Store message in database
      const { error: insertError } = await supabase.from('messages').insert({
        thread_id: threadId,
        sender_id: profile?.id || null,
        content,
        message_type: messageType,
        direction: 'inbound',
        external_id: message.id,
        metadata: {
          raw_message: message,
          wa_id: contacts[0]?.wa_id,
          phone_number_id: metadata.phone_number_id
        },
        sent_at: new Date(parseInt(message.timestamp) * 1000).toISOString()
      })

      if (insertError) {
        console.error('Error inserting message:', insertError)
        continue
      }

      // Update thread last message timestamp
      await supabase
        .from('message_threads')
        .update({
          last_message_at: new Date(parseInt(message.timestamp) * 1000).toISOString()
        })
        .eq('id', threadId)

      // Mark as read in WhatsApp (optional, can be configured)
      if (Deno.env.get('WHATSAPP_AUTO_READ') === 'true') {
        try {
          await whatsappAPI.markMessageAsRead(message.id)
        } catch (error) {
          console.error('Error marking message as read:', error)
        }
      }

      // Handle special message types
      await handleSpecialMessage(message, threadId, supabase)

    } catch (error) {
      console.error('Error processing message:', error)
    }
  }
}

async function processMessageStatusUpdate(value: any, supabase: any) {
  const statuses = value.status || []

  for (const statusUpdate of statuses) {
    try {
      const { data: message } = await supabase
        .from('messages')
        .select('id')
        .eq('external_id', statusUpdate.id)
        .single()

      if (message) {
        const updateData: any = {
          delivery_status: statusUpdate.status
        }

        if (statusUpdate.status === 'read') {
          updateData.read_at = new Date(parseInt(statusUpdate.timestamp) * 1000).toISOString()
        }

        await supabase
          .from('messages')
          .update(updateData)
          .eq('id', message.id)
      }
    } catch (error) {
      console.error('Error processing message status update:', error)
    }
  }
}

async function processTemplateStatusUpdate(value: any, supabase: any) {
  console.log('Template status update:', value)
  // Handle template status updates if needed
}

async function processPhoneNumberUpdate(value: any, supabase: any) {
  console.log('Phone number update:', value)
  // Handle phone number name updates if needed
}

async function processAccountUpdate(value: any, supabase: any) {
  console.log('Account update:', value)
  // Handle account updates if needed
}

async function findOrCreateProfile(supabase: any, waId: string, name?: string): Promise<any> {
  // Remove 'whatsapp:' prefix if present
  const phoneNumber = waId.replace('whatsapp:', '')

  // Try to find existing profile by phone
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('phone', phoneNumber)
    .single()

  if (existingProfile) {
    // Update name if different
    if (name && name !== existingProfile.full_name) {
      await supabase
        .from('profiles')
        .update({ full_name: name })
        .eq('id', existingProfile.id)
    }

    return existingProfile
  }

  // Create new profile
  const { data: newProfile } = await supabase
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

async function findOrCreateThread(
  supabase: any,
  from: string,
  channel: string,
  message: any,
  profile?: any
): Promise<string> {
  // Remove 'whatsapp:' prefix if present
  const phoneNumber = from.replace('whatsapp:', '')

  // Find existing thread
  const { data: existingThread } = await supabase
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
  const { data: newThread } = await supabase
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

function extractMessageContent(message: any): string {
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

  if (message.interactive?.type === 'button_reply') {
    return message.interactive.button_reply.title
  }

  if (message.interactive?.type === 'list_reply') {
    return message.interactive.list_reply.title
  }

  // Return a generic description for media messages
  const type = message.type || 'message'
  return `[${type.charAt(0).toUpperCase() + type.slice(1)} message]`
}

async function handleSpecialMessage(message: any, threadId: string, supabase: any) {
  // Handle interactive messages (button clicks, list selections)
  if (message.interactive) {
    const interactiveData = {
      thread_id: threadId,
      type: message.interactive.type,
      data: message.interactive,
      created_at: new Date().toISOString()
    }

    await supabase.from('message_interactions').insert(interactiveData)
  }

  // Handle location messages
  if (message.location) {
    const locationData = {
      thread_id: threadId,
      latitude: message.location.latitude,
      longitude: message.location.longitude,
      name: message.location.name,
      address: message.location.address,
      created_at: new Date().toISOString()
    }

    await supabase.from('message_locations').insert(locationData)
  }

  // Handle contact messages
  if (message.contacts) {
    const contactData = {
      thread_id: threadId,
      contacts: message.contacts,
      created_at: new Date().toISOString()
    }

    await supabase.from('message_contacts').insert(contactData)
  }
}