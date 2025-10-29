# Resend Email Integration Guide

This document explains how Resend is integrated into the BM Beauty Studio platform for sending transactional emails and newsletters.

## Overview

Resend is a modern email API service that makes it easy to send emails from your application. We've integrated Resend for:

1. **Transactional Emails** - Booking confirmations, reminders, etc.
2. **Newsletter Campaigns** - Weekly newsletters, promotional emails
3. **Welcome Emails** - Automatic welcome emails for new subscribers

## Setup Instructions

### 1. Get Resend API Key

1. Sign up at [https://resend.com](https://resend.com)
2. Create a new API key in your dashboard
3. Note your API key (starts with `re_`)

### 2. Configure Supabase Edge Functions

Add the Resend API key as a secret in your Supabase project:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Set the secret
supabase secrets set RESEND_API_KEY=your_actual_api_key
```

### 3. Configure Your Domain

1. In Resend dashboard, add your sending domain (e.g., `bmbeautystudio.pl`)
2. Add the DNS records provided by Resend to your domain registrar
3. Wait for domain verification (usually takes a few minutes)

### 4. Update Environment Variables

Make sure your `.env` file has the necessary variables (see `.env.example`).

## Features

### 1. Newsletter System

The newsletter system automatically:

- Collects email subscriptions
- Sends welcome emails to new subscribers
- Provides an admin interface for creating campaigns
- Tracks sent emails and campaign performance

### 2. Booking Emails

Automatic emails are sent for:

- Booking confirmations
- Appointment reminders
- Booking status changes

### 3. Email Templates

Pre-built templates for:

- Weekly newsletters
- Promotional campaigns
- New service announcements
- Blog post updates

## Usage Examples

### Sending a Newsletter

```typescript
import { ResendService } from '@/lib/resend';

await ResendService.sendNewsletter({
  to: 'customer@example.com',
  template: 'weekly',
  data: {
    content: '<h3>Special Offer!</h3><p>Get 20% off this week...</p>',
    unsubscribe_url: 'https://example.com/unsubscribe',
    manage_url: 'https://example.com/manage'
  }
});
```

### Sending a Booking Confirmation

```typescript
await ResendService.sendBookingConfirmation({
  bookingId: 'booking-uuid',
  userId: 'user-uuid',
  type: 'confirmation'
});
```

## Email Templates

### Weekly Newsletter Template
- Subject: "This Week at BM Beauty Studio"
- Includes updates, promotions, and upcoming events

### Promotional Template
- Subject: "Special Offer at BM Beauty Studio"
- Features a prominent offer with booking button

### New Service Template
- Subject: "New Service Available"
- Showcases new treatments with images and descriptions

### Blog Update Template
- Subject: "New Blog Post: [Title]"
- Shares latest blog content

## Analytics and Tracking

The system tracks:

- Number of subscribers
- Campaigns sent
- Emails delivered
- Open and click rates (via Resend dashboard)

## Admin Panel

Access the Email Management section in the admin panel to:

- View subscriber list
- Create and send campaigns
- Preview emails
- Send test emails
- View campaign analytics

## Best Practices

1. **Always send a test email** before sending to all subscribers
2. **Use meaningful subject lines** that align with your content
3. **Include an unsubscribe link** in all marketing emails
4. **Personalize content** using recipient data when possible
5. **Monitor your email reputation** in the Resend dashboard

## Troubleshooting

### Emails not sending?
- Check if `RESEND_API_KEY` is set correctly in Supabase secrets
- Verify your domain is verified in Resend
- Check Edge Function logs in Supabase dashboard

### Domain not verified?
- Ensure all DNS records are added correctly
- Wait at least 24 hours for DNS propagation
- Use a DNS checker tool to verify records

### Low deliverability?
- Check your spam score in email tester tools
- Ensure SPF/DKIM records are properly configured
- Avoid spam trigger words in subject lines

## Rate Limits

Resend has the following limits (as of 2024):

- Free tier: 100 emails/day
- Pro tier: 50,000 emails/month
- Enterprise: Custom limits

Monitor your usage to avoid hitting limits.

## Support

For Resend-specific issues:
- Resend Documentation: https://resend.com/docs
- Resend Support: support@resend.com

For platform integration issues:
- Check the browser console for errors
- Review Edge Function logs in Supabase
- Contact your development team