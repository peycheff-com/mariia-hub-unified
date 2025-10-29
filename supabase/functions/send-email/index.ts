import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  content: string
  messageId?: string
  threadId?: string
  templateId?: string
  variables?: Record<string, string>
  attachments?: Array<{
    filename: string
    content: string
    type: string
  }>
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

    const {
      method,
      url,
      headers,
    } = req

    // Parse request body
    const body: EmailRequest = await req.json()

    // Validate required fields
    if (!body.to || !body.subject || !body.content) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, content' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get Resend API key from environment or database
    const { data: emailSettings } = await supabase
      .from('communication_settings')
      .select('*')
      .eq('channel', 'email')
      .single()

    if (!emailSettings || !emailSettings.configuration?.from_email) {
      console.error('Email settings not configured')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: corsHeaders }
      )
    }

    const resendApiKey = emailSettings.configuration.api_key || Deno.env.get('RESEND_API_KEY')
    const fromEmail = emailSettings.configuration.from_email
    const replyToEmail = emailSettings.configuration.reply_to || fromEmail

    if (!resendApiKey) {
      console.error('Resend API key not found')
      return new Response(
        JSON.stringify({ error: 'Email service API key not configured' })
      )
    }

    // Prepare email data
    const emailData: any = {
      from: fromEmail,
      to: [body.to],
      subject: body.subject,
      html: body.content
    }

    // Add reply-to if different
    if (replyToEmail !== fromEmail) {
      emailData.replyTo = replyToEmail
    }

    // Handle attachments
    if (body.attachments && body.attachments.length > 0) {
      const attachments = await Promise.all(
        body.attachments.map(async (attachment) => {
          // For now, we'll just include the filename and content as base64
          // In a real implementation, you might want to store attachments in Supabase Storage
          return {
            filename: attachment.filename,
            content: attachment.content
          }
        })
      )
      emailData.attachments = attachments
    }

    // Send email using Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json()
      console.error('Resend API error:', errorData)
      return new Response(
        JSON.stringify({
          error: 'Failed to send email',
          details: errorData
        }),
        { status: 500, headers: corsHeaders }
      )
    }

    const emailResult = await emailResponse.json()

    // Update message status in database if messageId provided
    if (body.messageId) {
      try {
        await supabase
          .from('messages')
          .update({
            delivery_status: 'sent',
            external_id: emailResult.id
          })
          .eq('id', body.messageId)
      } catch (error) {
        console.error('Error updating message status:', error)
      }
    }

    // Log the email for analytics
    try {
      await supabase.from('email_logs').insert({
        to: body.to,
        subject: body.subject,
        message_id: emailResult.id,
        status: 'sent',
        thread_id: body.threadId,
        template_id: body.templateId,
        created_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error logging email:', error)
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: emailResult.id,
        status: 'sent'
      }),
      { status: 200, headers: corsHeaders }
    )

  } catch (error) {
    console.error('Email service error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    )
  }
})