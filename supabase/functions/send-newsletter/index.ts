import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "https://esm.sh/resend@2.0.0"

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

interface NewsletterEmail {
  to: string
  subject: string
  template: 'weekly' | 'promotional' | 'new_service' | 'blog_update'
  data?: Record<string, any>
}

const templates = {
  weekly: {
    subject: 'This Week at BM Beauty Studio & Fitness',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>BM Beauty Studio Weekly Newsletter</title>
          <style>
            body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #D4A574; }
            .content { padding: 30px 0; }
            .footer { padding-top: 30px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
            .btn { display: inline-block; padding: 12px 30px; background: #D4A574; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
            .btn:hover { background: #C19660; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✨ BM Beauty Studio & Fitness</h1>
              <p>Your Weekly Beauty & Wellness Update</p>
            </div>
            <div class="content">
              {{content}}
            </div>
            <div class="footer">
              <p>You're receiving this email because you subscribed to our newsletter.</p>
              <p><a href="{{unsubscribe_url}}">Unsubscribe</a> | <a href="{{manage_url}}">Manage Preferences</a></p>
              <p>© 2024 Mariia Borysevych. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  },
  promotional: {
    subject: 'Special Offer at BM Beauty Studio',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Special Offer at BM Beauty Studio</title>
          <style>
            body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .offer { background: linear-gradient(135deg, #D4A574, #8B4513); color: white; padding: 40px; text-align: center; border-radius: 12px; margin: 30px 0; }
            .btn { display: inline-block; padding: 15px 40px; background: white; color: #D4A574; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="offer">
              <h1>{{offer_title}}</h1>
              <p>{{offer_description}}</p>
              <a href="{{book_url}}" class="btn">Book Now</a>
              <p>Valid until: {{expiry_date}}</p>
            </div>
          </div>
        </body>
      </html>
    `
  },
  new_service: {
    subject: 'New Service Available at BM Beauty Studio',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Service at BM Beauty Studio</title>
          <style>
            body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #333; }
            .service-card { border: 1px solid #ddd; border-radius: 12px; padding: 20px; margin: 20px 0; }
            .service-image { width: 100%; max-width: 400px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Introducing Our New Service</h2>
            <div class="service-card">
              <h3>{{service_name}}</h3>
              <img src="{{service_image}}" alt="{{service_name}}" class="service-image">
              <p>{{service_description}}</p>
              <p><strong>Duration:</strong> {{duration}}</p>
              <p><strong>Price:</strong> {{price}}</p>
              <a href="{{book_url}}" style="background: #D4A574; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">Book This Service</a>
            </div>
          </div>
        </body>
      </html>
    `
  },
  blog_update: {
    subject: 'New Blog Post: {{blog_title}}',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Blog Post</title>
          <style>
            body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #333; }
            .blog-preview { border-left: 4px solid #D4A574; padding-left: 20px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>New Blog Post Published</h2>
            <div class="blog-preview">
              <h3>{{blog_title}}</h3>
              <p>{{blog_excerpt}}</p>
              <a href="{{blog_url}}" style="color: #D4A574; font-weight: bold;">Read Full Article →</a>
            </div>
          </div>
        </body>
      </html>
    `
  }
}

serve(async (req) => {
  try {
    const { email, template, data }: NewsletterEmail = await req.json()

    if (!email || !template) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, template' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const emailTemplate = templates[template]
    if (!emailTemplate) {
      return new Response(
        JSON.stringify({ error: 'Invalid template' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Replace template variables
    let htmlContent = emailTemplate.html
    let subjectContent = emailTemplate.subject

    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        htmlContent = htmlContent.replace(new RegExp(`{{${key}}}`, 'g'), value)
        subjectContent = subjectContent.replace(new RegExp(`{{${key}}}`, 'g'), value)
      })
    }

    const { data: emailData, error } = await resend.emails.send({
      from: 'BM Beauty Studio <newsletter@bmbeautystudio.pl>',
      to: [email],
      subject: subjectContent,
      html: htmlContent,
    })

    if (error) {
      console.error('Resend error:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, data: emailData }),
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