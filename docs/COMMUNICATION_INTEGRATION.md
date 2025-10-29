# Communication Integration Guide

This document explains how to set up and use the integrated communication system including WhatsApp, SMS, and advanced analytics.

## Overview

The BM Beauty Studio platform includes a comprehensive communication system that allows you to:

- Send WhatsApp messages for booking confirmations and promotions
- Send SMS messages for reminders and alerts
- Track all communications in one place
- Analyze communication performance
- Use advanced analytics for business insights

## Features

### 1. WhatsApp Integration

- **Booking Confirmations**: Automatic WhatsApp messages for new bookings
- **Appointment Reminders**: Reminder messages before appointments
- **Promotional Messages**: Special offers and marketing campaigns
- **Custom Messages**: Send personalized messages to customers

### 2. SMS Integration

- **Booking Confirmations**: SMS confirmations for appointments
- **Reminders**: SMS reminders 24 hours before appointments
- **Promotional Campaigns**: Marketing messages with special offers
- **Verification Codes**: OTP for user verification
- **Alert Messages**: Important notifications and updates

### 3. Communication Analytics

- **Message Tracking**: Real-time tracking of all sent messages
- **Delivery Reports**: Monitor delivery success rates
- **Performance Metrics**: Track open rates, click rates (for email)
- **Cost Analysis**: Monitor communication costs
- **A/B Testing**: Test different message templates

## Setup Instructions

### 1. Twilio Setup

1. **Create a Twilio Account**
   - Sign up at [https://www.twilio.com](https://www.twilio.com)
   - Choose the WhatsApp Business API plan

2. **Get Your Credentials**
   - Account SID: Available in your Twilio console
   - Auth Token: Available in your Twilio console
   - WhatsApp Sender Number: Provided by Twilio (e.g., `whatsapp:+14155238886`)
   - SMS Sender Number: Purchase from Twilio or port your number

3. **Configure WhatsApp Templates**
   - Create message templates in Twilio console
   - Templates need approval before use
   - Examples:
     - `booking_confirmation`
     - `booking_reminder`
     - `special_offer`

4. **Set Up Supabase Edge Functions**
   ```bash
   # Set your Twilio credentials
   supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxxxx
   supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token
   supabase secrets set TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   supabase secrets set TWILIO_SMS_NUMBER=+1234567890
   supabase secrets set TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxx
   supabase secrets set TWILIO_HIGH_PRIORITY_SERVICE_SID=MGxxxxxxx
   ```

### 2. Google Analytics 4 Setup

1. **Create a GA4 Property**
   - Go to [Google Analytics](https://analytics.google.com)
   - Create a new property for your website
   - Get your Measurement ID (e.g., `G-XXXXXXXXXX`)

2. **Add to Your Website**
   ```typescript
   // In your main.tsx or App.tsx
   import { AnalyticsService } from '@/lib/analytics';

   AnalyticsService.initialize('G-XXXXXXXXXX');
   ```

3. **Configure Environment Variables**
   ```bash
   # Add to .env
   VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

## Usage Examples

### Sending WhatsApp Messages

```typescript
import { CommunicationService } from '@/lib/communication';

// Send booking confirmation
await CommunicationService.sendBookingConfirmationWhatsApp(
  '+48123456789',
  'John Doe',
  'Lip Enhancement',
  '2024-01-25',
  '14:30'
);

// Send promotional message
await CommunicationService.sendPromotionalWhatsApp(
  '+48123456789',
  'Get 20% off your next beauty treatment!',
  '20%',
  'https://bmbeautystudio.pl/book'
);
```

### Sending SMS Messages

```typescript
// Send booking reminder
await CommunicationService.sendBookingReminderSMS(
  '+48123456789',
  'Jane Smith',
  'Brow Lamination',
  '14:30'
);

// Send promotional SMS
await CommunicationService.sendPromotionalSMS(
  '+48123456789',
  'Special offer this weekend only!',
  'SAVE20'
);
```

### Tracking Events

```typescript
import { AnalyticsService } from '@/lib/analytics';

// Track booking start
AnalyticsService.trackBookingStart('service-123', 'Lip Enhancement', 'beauty');

// Track purchase
AnalyticsService.trackBookingComplete('booking-456', 250, 'PLN', [
  {
    item_id: 'service-123',
    item_name: 'Lip Enhancement',
    category: 'beauty',
    quantity: 1,
    price: 250
  }
]);

// Track custom event
AnalyticsService.track({
  action: 'custom_event',
  category: 'engagement',
  parameters: {
    custom_param: 'value'
  }
});
```

## Admin Panel

### Communication Hub

Access the Communication Hub in your admin panel to:

1. **Send Messages**
   - Send custom WhatsApp messages
   - Send SMS messages
   - Choose message types and priorities

2. **View Logs**
   - See all sent messages
   - Filter by type, status, date
   - View delivery status

3. **Configure Settings**
   - Enable/disable WhatsApp
   - Enable/disable SMS
   - Configure automatic reminders
   - Set promotional preferences

### Advanced Analytics

The Advanced Analytics dashboard provides:

- **Traffic Analysis**: Sources, devices, pages
- **Booking Analytics**: Trends, service performance, funnel analysis
- **Communication Analytics**: Message performance by channel
- **Real-time Data**: Active users, current sessions
- **Export Features**: Download data as CSV

## Best Practices

### WhatsApp Best Practices

1. **Template Approval**
   - Submit templates well in advance
   - Follow WhatsApp's template guidelines
   - Avoid promotional content in transactional templates

2. **Message Timing**
   - Send messages during business hours (9 AM - 6 PM)
   - Respect time zones
   - Avoid sending messages too frequently

3. **Content Guidelines**
   - Keep messages concise and clear
   - Include relevant information only
   - Provide opt-out instructions

### SMS Best Practices

1. **Compliance**
   - Include your business name
   - Provide opt-out instructions (Reply STOP)
   - Follow local regulations

2. **Timing**
   - Send during appropriate hours
   - Consider time zones
   - Avoid late-night messages

3. **Content**
   - Keep under 160 characters when possible
   - Use clear, simple language
   - Include call-to-action when relevant

### Analytics Best Practices

1. **Event Tracking**
   - Track meaningful events
   - Use consistent naming conventions
   - Include relevant parameters

2. **Privacy**
   - Don't track personal information
   - Follow GDPR requirements
   - Allow users to opt-out

## Troubleshooting

### WhatsApp Issues

1. **Template Not Approved**
   - Check template status in Twilio console
   - Ensure template follows guidelines
   - Resubmit if rejected

2. **Messages Not Sending**
   - Verify credentials are correct
   - Check if recipient has opted out
   - Review message content

### SMS Issues

1. **Delivery Failures**
   - Check phone number format (include country code)
   - Verify number is not on DNC list
   - Check carrier restrictions

2. **High Costs**
   - Monitor SMS volume
   - Use shorter messages
   - Consider WhatsApp for rich content

### Analytics Issues

1. **Data Not Showing**
   - Check GA4 configuration
   - Verify Measurement ID
   - Check browser console for errors

2. **E-commerce Tracking**
   - Ensure proper event structure
   - Check currency format
   - Verify item data structure

## API Reference

### WhatsApp API

```typescript
interface WhatsAppMessage {
  to: string; // 'whatsapp:+48123456789'
  templateName?: string;
  templateLanguage?: string;
  customMessage?: string;
  type: 'template' | 'custom';
  components?: any[];
}
```

### SMS API

```typescript
interface SMSMessage {
  to: string; // '+48123456789'
  message: string;
  type: 'appointment' | 'promotion' | 'reminder' | 'verification' | 'alert';
  priority?: 'low' | 'normal' | 'high';
  scheduledAt?: string; // ISO datetime
}
```

### Analytics API

```typescript
interface GA4Event {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  parameters?: Record<string, any>;
}
```

## Support

For integration support:
- Check the browser console for errors
- Review Edge Function logs in Supabase
- Verify API credentials
- Check Twilio and Google documentation
- Contact support with specific error messages