# Unified Communication Hub - Setup Guide

## Overview

The Unified Communication Hub centralizes all customer communications across multiple channels: email, SMS, WhatsApp, and in-app messaging. This guide covers the complete setup process.

## Database Setup

The database schema has been created with the migration `20250130000000_unified_communication_hub.sql`. Tables include:

- `message_threads` - Conversation threads per client/channel
- `messages` - Individual messages with rich content support
- `communication_templates` - Reusable message templates
- `campaigns` - Marketing campaigns with segmentation
- `campaign_sends` - Campaign delivery tracking
- `message_attachments` - File attachments for messages
- `communication_settings` - Channel configuration

## External Service Setup

### 1. WhatsApp Business API

1. **Create a WhatsApp Business Account**
   - Go to [Meta for Developers](https://developers.facebook.com/)
   - Create a new app with WhatsApp product

2. **Get Required Credentials**
   ```bash
   # Add to Supabase Edge Function secrets
   supabase secrets set WHATSAPP_PHONE_NUMBER_ID=your_phone_id
   supabase secrets set WHATSAPP_ACCESS_TOKEN=your_access_token
   supabase secrets set WHATSAPP_WABA_ID=your_waba_id
   supabase secrets set WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_verify_token
   supabase secrets set WHATSAPP_APP_SECRET=your_app_secret
   ```

3. **Configure Webhook**
   - Set webhook URL to: `https://your-project.supabase.co/functions/v1/whatsapp-webhook`
   - Subscribe to: `messages`, `message_status`, `message_template_status_update`

4. **Test the Integration**
   ```typescript
   import { WhatsAppBusinessAPI } from '@/lib/whatsapp-business'

   const api = new WhatsAppBusinessAPI({
     phoneNumberId: 'your_phone_id',
     accessToken: 'your_access_token',
     version: 'v18.0',
     wabaId: 'your_waba_id'
   })

   await api.sendTextMessage('48123456789', 'Hello from WhatsApp!')
   ```

### 2. Resend (Email Service)

1. **Create Resend Account**
   - Sign up at [resend.com](https://resend.com)
   - Verify your domain

2. **Get API Key**
   ```bash
   # Add to Supabase Edge Function secrets
   supabase secrets set RESEND_API_KEY=re_your_api_key
   ```

3. **Configure Email Settings**
   ```sql
   INSERT INTO communication_settings (channel, configuration, is_active, provider)
   VALUES (
     'email',
     '{
       "from_email": "noreply@yourdomain.com",
       "reply_to": "support@yourdomain.com",
       "api_key": "re_your_api_key"
     }',
     true,
     'resend'
   );
   ```

### 3. Twilio (SMS Service)

1. **Create Twilio Account**
   - Sign up at [twilio.com](https://twilio.com)
   - Purchase a phone number

2. **Get Credentials**
   ```bash
   # Add to Supabase Edge Function secrets
   supabase secrets set TWILIO_ACCOUNT_SID=your_account_sid
   supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token
   ```

3. **Configure SMS Settings**
   ```sql
   INSERT INTO communication_settings (channel, configuration, is_active, provider)
   VALUES (
     'sms',
     '{
       "from_number": "+48123456789",
       "account_sid": "your_account_sid",
       "auth_token": "your_auth_token"
     }',
     true,
     'twilio'
   );
   ```

## Frontend Integration

### 1. Update Routing

Add the communication routes to your application:

```typescript
// src/routes/index.ts
import { UnifiedInbox } from '@/components/admin/UnifiedInbox'
import { TemplatesManager } from '@/components/admin/TemplatesManager'
import { CampaignManager } from '@/components/admin/CampaignManager'
import { CommunicationAnalytics } from '@/components/admin/CommunicationAnalytics'

export const adminRoutes = [
  // ... existing routes
  {
    path: '/admin/communications',
    component: UnifiedInbox,
    label: 'Communications'
  },
  {
    path: '/admin/communications/templates',
    component: TemplatesManager,
    label: 'Templates'
  },
  {
    path: '/admin/communications/campaigns',
    component: CampaignManager,
    label: 'Campaigns'
  },
  {
    path: '/admin/communications/analytics',
    component: CommunicationAnalytics,
    label: 'Analytics'
  }
]
```

### 2. Initialize the Context

Wrap your app with the MessagingProvider:

```typescript
// src/App.tsx
import { MessagingProvider } from '@/hooks/useMessaging'

function App() {
  return (
    <MessagingProvider>
      {/* Your existing providers */}
      <Router>
        {/* Your routes */}
      </Router>
    </MessagingProvider>
  )
}
```

### 3. Add to Admin Sidebar

Update the admin navigation:

```typescript
// src/components/admin/AdminSidebar.tsx
const menuItems = [
  // ... existing items
  {
    title: 'Communications',
    icon: MessageSquare,
    path: '/admin/communications',
    badge: threads.filter(t => t.status === 'open').length
  },
  {
    title: 'Templates',
    icon: FileText,
    path: '/admin/communications/templates'
  },
  {
    title: 'Campaigns',
    icon: Send,
    path: '/admin/communications/campaigns'
  },
  {
    title: 'Analytics',
    icon: BarChart3,
    path: '/admin/communications/analytics'
  }
]
```

## Usage Examples

### Sending a Message

```typescript
import { useMessaging } from '@/hooks/useMessaging'

function CustomerSupport() {
  const { sendMessage } = useMessaging()

  const handleSend = async () => {
    await sendMessage({
      threadId: 'thread-uuid',
      content: 'Your appointment is confirmed!',
      messageType: 'text',
      channel: 'sms'
    })
  }
}
```

### Using Templates

```typescript
const { sendTemplate } = useMessaging()

await sendTemplate({
  templateId: 'template-uuid',
  to: 'client@example.com',
  channel: 'email',
  variables: {
    client_name: 'John Doe',
    appointment_date: '2025-02-15',
    service_name: 'Lip Enhancement'
  }
})
```

### Creating Campaigns

```typescript
const { createCampaign } = useMessaging()

const campaign = await createCampaign({
  name: 'February Promotions',
  channel: 'email',
  templateId: 'promo-template',
  audienceCriteria: {
    services_used: ['beauty'],
    last_booking_after: '2025-01-01'
  },
  scheduledFor: '2025-02-01T10:00:00Z'
})
```

## Testing

### 1. Test Webhooks

Use ngrok to test webhooks locally:

```bash
# Start ngrok
ngrok http 8080

# Update webhook URLs to use ngrok URL
https://your-ngrok-id.ngrok.io/functions/v1/whatsapp-webhook
```

### 2. Test Message Sending

```typescript
// Test each channel
const testNumbers = {
  whatsapp: '48123456789', // WhatsApp-enabled number
  sms: '48123456789',      // Any mobile number
  email: 'test@example.com'
}

// Send test messages
await sendMessage({
  threadId: 'test-thread',
  content: 'Test message',
  messageType: 'text',
  channel: 'whatsapp'
})
```

## Monitoring

### 1. Check Logs

Monitor Edge Function logs:

```bash
# View WhatsApp webhook logs
supabase functions logs whatsapp-webhook

# View email send logs
supabase functions logs send-email

# View SMS send logs
supabase functions logs send-sms
```

### 2. Analytics Dashboard

Access the Communication Analytics at `/admin/communications/analytics` to monitor:
- Message volume by channel
- Response times
- Campaign performance
- Agent productivity

## Security Considerations

1. **API Keys**: Store all external API keys in Supabase Edge Function secrets
2. **Webhook Security**: Verify webhook signatures using app secret
3. **Rate Limiting**: Implement rate limiting for external APIs
4. **Data Privacy**: Ensure GDPR compliance with message storage

## Troubleshooting

### Common Issues

1. **WhatsApp messages not sending**
   - Check phone number format (include country code)
   - Verify template approval status
   - Check webhook configuration

2. **Emails not delivering**
   - Verify domain is verified in Resend
   - Check SPF/DNS records
   - Review email content for spam triggers

3. **SMS delivery failures**
   - Verify Twilio phone number is SMS-enabled
   - Check number formatting
   - Review account balance

### Debug Mode

Enable debug logging:

```typescript
// In development, set debug mode
localStorage.setItem('messaging-debug', 'true')
```

This will log all messaging operations to the console.

## Production Checklist

- [ ] All external services configured
- [ ] Webhooks verified and working
- [ ] Templates created and approved
- [ ] Rate limiting configured
- [ ] Monitoring setup
- [ ] GDPR compliance checked
- [ ] Backup strategy for messages
- [ ] User training completed