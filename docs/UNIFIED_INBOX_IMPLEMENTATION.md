# Unified Inbox Implementation Guide

## Overview

The Unified Inbox provides a centralized platform for managing all customer communications across multiple channels including email, SMS, WhatsApp, and in-app chat. This implementation enables seamless conversation management, automated responses, and comprehensive analytics.

## Architecture

### Database Schema

The unified messaging system is built on the following core tables:

#### Core Tables

1. **conversations**
   - Stores conversation metadata and status
   - Links to customer profiles and assigned agents
   - Includes tags, priority, and metadata

2. **messages**
   - Individual message records within conversations
   - Supports multiple channels and directions
   - Tracks delivery status and attachments

3. **message_templates**
   - Pre-defined message templates
   - Supports variables and multiple languages
   - Tracks usage statistics

4. **automation_rules**
   - Configurable automation workflows
   - Trigger-based message sending
   - Conditions and actions system

5. **scheduled_messages**
   - Messages scheduled for future delivery
   - Supports automation and manual scheduling
   - Retry logic and error handling

### Component Structure

```
src/components/
├── admin/
│   ├── UnifiedInbox.tsx          # Main inbox interface
│   ├── AutomationRulesEngine.tsx # Automation workflow manager
│   └── CommunicationAnalyticsDashboard.tsx # Analytics dashboard
├── messaging/
│   ├── MessageComposer.tsx       # Message composition UI
│   ├── ConversationView.tsx      # Message thread display
│   └── TemplateSelector.tsx      # Template selection UI
```

### Key Features

#### 1. Multi-Channel Support
- **Email**: SMTP integration with templating
- **SMS**: Twilio API integration
- **WhatsApp**: Business API integration
- **In-App**: Real-time web messaging

#### 2. Real-Time Updates
- WebSocket subscriptions for live updates
- Instant message delivery notifications
- Real-time typing indicators

#### 3. Automation Engine
- Trigger-based workflows
- Conditions and actions system
- Scheduled message delivery
- Template-based responses

#### 4. Analytics & Reporting
- Message volume tracking
- Response time metrics
- Channel performance analytics
- Template effectiveness tracking

## Implementation Details

### Database Migration

The schema is defined in `supabase/migrations/20250125000000_unified_messaging_referral_system.sql`

Key features of the schema:
- UUID-based primary keys
- JSONB for flexible metadata storage
- Foreign key constraints for data integrity
- Check constraints for status fields

### Frontend Components

#### UnifiedInbox Component

The main interface provides:
- Conversation list with search and filtering
- Real-time message updates
- Bulk operations (assign, archive, tag)
- Quick reply templates
- Customer information sidebar

Key props and state management:
```typescript
interface UnifiedInboxProps {
  className?: string
}

// Uses useMessaging hook for state management
const {
  threads,
  selectedThread,
  messages,
  templates,
  loading,
  sendMessage,
  createThread,
  updateThreadStatus
} = useMessaging()
```

#### MessageComposer Component

Features:
- Rich text message composition
- File attachment support
- Voice recording capability
- Template integration
- Draft auto-save

#### AutomationRulesEngine

Configurable automation:
- Multiple trigger types
- Condition-based filtering
- Action sequences
- Scheduling options
- Priority management

### Service Layer

#### useMessaging Hook

Centralized state management:
```typescript
export function useMessaging() {
  // State
  const [threads, setThreads] = useState<MessageThreadWithDetails[]>([])
  const [messages, setMessages] = useState<MessageWithSender[]>([])

  // Actions
  const sendMessage = useCallback(async (...))
  const createThread = useCallback(async (...))
  const updateThreadStatus = useCallback(async (...))

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase.channel('messaging')
      .on('postgres_changes', {...})
      .subscribe()
  }, [])
}
```

## API Integration

### External Services

1. **Email Service (Resend)**
   - Endpoint: `/functions/v1/send-email`
   - Template-based HTML emails
   - Attachment support

2. **SMS Service (Twilio)**
   - Endpoint: `/functions/v1/send-sms`
   - International number support
   - Delivery receipts

3. **WhatsApp Business API**
   - Endpoint: `/functions/v1/send-whatsapp`
   - Template message support
   - Media file sharing

### Webhook Handling

Incoming messages are processed via webhooks:
- Email: Parse incoming emails
- SMS: Twilio webhook integration
- WhatsApp: Meta webhook handling

## Security Considerations

### Data Privacy
- End-to-end encryption for sensitive messages
- PII redaction in logs
- GDPR compliance measures
- Data retention policies

### Access Control
- Role-based access control (RBAC)
- Agent assignment restrictions
- Audit logging for all actions
- Message encryption at rest

## Performance Optimizations

### Database
- Optimized queries with proper indexing
- JSONB for flexible metadata
- Connection pooling
- Query result caching

### Frontend
- Virtual scrolling for message lists
- Image lazy loading
- Message pagination
- Debounced search queries

### Real-Time Features
- WebSocket connection management
- Automatic reconnection logic
- Message queuing for offline mode
- Conflict resolution

## Monitoring & Analytics

### Key Metrics
- Message delivery rates
- Average response times
- Customer satisfaction scores
- Agent performance metrics

### Dashboards
The CommunicationAnalyticsDashboard provides:
- Real-time message statistics
- Channel performance comparison
- Template effectiveness tracking
- Response time distribution

## Deployment

### Environment Variables
```env
# Email Service
RESEND_API_KEY=your_resend_key
EMAIL_FROM=noreply@yourdomain.com

# SMS Service
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=your_number

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=your_id
WHATSAPP_ACCESS_TOKEN=your_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_token
```

### Supabase Configuration
- Enable Row Level Security (RLS)
- Configure storage buckets for attachments
- Set up database functions for automation
- Configure edge functions for API endpoints

## Testing

### Unit Tests
- Component testing with Vitest
- Hook testing with React Testing Library
- Service layer mocking
- Type checking with TypeScript

### Integration Tests
- End-to-end message flow testing
- Webhook processing verification
- Real-time subscription testing
- Multi-channel delivery testing

## Future Enhancements

### Planned Features
1. **AI-Powered Responses**
   - Natural language processing
   - Sentiment analysis
   - Smart reply suggestions

2. **Advanced Analytics**
   - Customer journey mapping
   - Predictive analytics
   - Custom report builder

3. **Enhanced Automation**
   - Visual workflow builder
   - A/B testing for templates
   - Machine learning optimization

4. **Mobile App**
   - Native iOS/Android apps
   - Push notifications
   - Offline message sync

## Troubleshooting

### Common Issues

1. **Messages Not Sending**
   - Check API key configuration
   - Verify webhook endpoints
   - Review error logs in Supabase

2. **Real-Time Updates Not Working**
   - Check WebSocket connection
   - Verify RLS policies
   - Review browser console errors

3. **Slow Performance**
   - Check database query performance
   - Review indexing strategy
   - Optimize component re-renders

### Debug Mode
Enable debug logging by setting:
```env
DEBUG=true
LOG_LEVEL=debug
```

## Support

For technical support:
1. Check the documentation
2. Review GitHub issues
3. Contact the development team
4. Check system status dashboard