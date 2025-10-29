# Communication Hub API Reference

## Core Components

### useMessaging Hook

Central state management for all communication features.

```typescript
import { useMessaging } from '@/hooks/useMessaging'

const {
  // Thread management
  threads,
  selectedThread,
  loadingThreads,

  // Message management
  messages,
  loadingMessages,

  // Templates
  templates,
  loadingTemplates,

  // Campaigns
  campaigns,
  loadingCampaigns,

  // Actions
  fetchThreads,
  selectThread,
  sendMessage,
  sendTemplate,
  createCampaign,

  // Real-time
  subscribeToThread
} = useMessaging()
```

## Database Functions

### Thread Management

```sql
-- Create new thread
SELECT create_message_thread(
  p_client_id => 'client-uuid',
  p_channel => 'email',
  p_subject => 'Appointment Confirmation',
  p_priority => 'normal',
  p_assigned_to => 'agent-uuid',
  p_tags => ARRAY['appointment', 'confirmed']
);

-- Update thread status
SELECT update_thread_status(
  p_thread_id => 'thread-uuid',
  p_status => 'closed'
);

-- Assign thread to agent
SELECT assign_thread(
  p_thread_id => 'thread-uuid',
  p_agent_id => 'agent-uuid'
);
```

### Message Operations

```sql
-- Send message
SELECT send_message(
  p_thread_id => 'thread-uuid',
  p_sender_id => 'agent-uuid',
  p_content => 'Your message',
  p_message_type => 'text',
  p_direction => 'outbound',
  p_channel => 'email',
  p_metadata => '{}'::jsonb
);

-- Mark message as read
SELECT mark_message_read('message-uuid');

-- Update delivery status
SELECT update_message_status(
  p_message_id => 'message-uuid',
  p_status => 'delivered',
  p_external_id => 'ext-id'
);
```

### Template Functions

```sql
-- Render template with variables
SELECT render_template(
  p_template_id => 'template-uuid',
  p_variables => '{"client_name": "John", "date": "2025-02-15"}'::jsonb
);

-- Get templates by channel
SELECT * FROM get_templates_by_channel('email');

-- Track template usage
SELECT track_template_usage(
  p_template_id => 'template-uuid',
  p_message_id => 'message-uuid'
);
```

## Edge Functions

### Send Email

**Endpoint**: `/functions/v1/send-email`

```typescript
// Request
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

// Response
{
  success: true,
  messageId: "email-uuid",
  status: "sent"
}
```

### Send SMS

**Endpoint**: `/functions/v1/send-sms`

```typescript
// Request
interface SMSRequest {
  to: string
  message: string
  messageId?: string
  threadId?: string
  templateId?: string
  variables?: Record<string, string>
}

// Response
{
  success: true,
  messageId: "twilio-sid",
  status: "sent"
}
```

### WhatsApp Webhook

**Endpoint**: `/functions/v1/whatsapp-webhook`

Handles incoming WhatsApp messages and status updates.

#### Webhook Events

```typescript
// Message received
{
  object: "whatsapp_business_account",
  entry: [{
    id: "waba-id",
    changes: [{
      field: "messages",
      value: {
        messaging_product: "whatsapp",
        metadata: {
          display_phone_number: "48123456789",
          phone_number_id: "phone-id"
        },
        contacts: [{
          wa_id: "48123456789",
          profile: { name: "John Doe" }
        }],
        messages: [{
          from: "48123456789",
          id: "message-id",
          timestamp: "1678940400",
          type: "text",
          text: { body: "Hello!" }
        }]
      }
    }]
  }]
}

// Message status update
{
  status: "read",
  id: "message-id",
  timestamp: "1678940400",
  recipient_id: "48123456789"
}
```

## Component Props

### UnifiedInbox

```typescript
interface UnifiedInboxProps {
  className?: string
}

// Usage
<UnifiedInbox className="h-full" />
```

### ConversationView

```typescript
interface ConversationViewProps {
  thread: MessageThreadWithDetails
  messages: MessageWithSender[]
  loading?: boolean
  className?: string
}
```

### MessageComposer

```typescript
interface MessageComposerProps {
  threadId: string
  onMessageSent?: (message: Message) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}
```

### TemplatesManager

```typescript
interface TemplatesManagerProps {
  className?: string
  channel?: 'email' | 'sms' | 'whatsapp'
  onTemplateSelect?: (template: CommunicationTemplate) => void
}
```

### CampaignManager

```typescript
interface CampaignManagerProps {
  className?: string
  onCampaignCreated?: (campaign: Campaign) => void
}
```

### CommunicationAnalytics

```typescript
interface CommunicationAnalyticsProps {
  className?: string
  dateRange?: {
    start: Date
    end: Date
  }
}
```

## Type Definitions

### Message Thread

```typescript
interface MessageThread {
  id: string
  client_id: string
  channel: 'email' | 'sms' | 'whatsapp' | 'in-app'
  subject?: string
  last_message_at?: string
  status: 'open' | 'closed' | 'archived' | 'spam'
  assigned_to?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  tags: string[]
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

interface MessageThreadWithDetails extends MessageThread {
  client: {
    id: string
    full_name: string
    email: string
    phone: string
    avatar_url?: string
  }
  assigned_to_profile?: {
    id: string
    full_name: string
    avatar_url?: string
  }
  last_message?: Message
  unread_count: number
}
```

### Message

```typescript
interface Message {
  id: string
  thread_id: string
  sender_id?: string
  content: string
  message_type: 'text' | 'image' | 'document' | 'audio' | 'video'
  direction: 'inbound' | 'outbound'
  channel: 'email' | 'sms' | 'whatsapp' | 'in-app'
  delivery_status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  external_id?: string
  metadata: Record<string, any>
  sent_at: string
  read_at?: string
}

interface MessageWithSender extends Message {
  sender?: {
    id: string
    full_name: string
    role: string
    avatar_url?: string
  }
  attachments: MessageAttachment[]
}
```

### Template

```typescript
interface CommunicationTemplate {
  id: string
  name: string
  channel: 'email' | 'sms' | 'whatsapp'
  category?: string
  subject?: string
  content: string
  variables: string[]
  is_active: boolean
  usage_count: number
  created_at: string
  updated_at: string
}
```

### Campaign

```typescript
interface Campaign {
  id: string
  name: string
  channel: 'email' | 'sms' | 'whatsapp'
  template_id: string
  audience_criteria: Record<string, any>
  scheduled_for?: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled'
  send_count: number
  open_count: number
  click_count: number
  created_at: string
  updated_at: string
}
```

## Real-time Subscriptions

### Message Updates

```typescript
// Subscribe to thread messages
const subscription = supabase
  .channel(`thread:${threadId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `thread_id=eq.${threadId}`
  }, (payload) => {
    console.log('New message:', payload.new)
  })
  .subscribe()
```

### Thread Status Updates

```typescript
// Subscribe to thread updates
supabase
  .channel('threads')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'message_threads',
    filter: 'assigned_to=eq.user-id'
  }, (payload) => {
    console.log('Thread updated:', payload.new)
  })
  .subscribe()
```

## Error Handling

### Common Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `CHANNEL_NOT_CONFIGURED` | Channel not set up in settings | Configure channel in communication_settings |
| `TEMPLATE_NOT_FOUND` | Template doesn't exist | Check template ID and ensure it's active |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Implement backoff and retry logic |
| `INVALID_PHONE_NUMBER` | Phone number format invalid | Include country code and format correctly |
| `WHATSAPP_TEMPLATE_REJECTED` | Template not approved | Submit template for approval |

### Error Response Format

```typescript
{
  error: {
    code: "CHANNEL_NOT_CONFIGURED",
    message: "Email channel is not configured",
    details: {
      channel: "email",
      settings: null
    }
  }
}
```

## Best Practices

1. **Message Threading**: Always reply to existing threads when possible
2. **Template Variables**: Validate required variables before sending
3. **Rate Limiting**: Respect API limits for external services
4. **Error Handling**: Always handle failures gracefully
5. **Real-time Updates**: Use subscriptions for live updates
6. **File Uploads**: Validate file types and sizes before upload
7. **GDPR**: Ensure proper consent for marketing communications