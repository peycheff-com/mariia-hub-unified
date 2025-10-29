# Comprehensive Feedback System Guide

This guide explains how to use and integrate the comprehensive feedback collection system implemented for Mariia Hub.

## Overview

The feedback system is designed to collect, analyze, and act upon customer feedback across multiple channels and touchpoints. It includes:

- **Multiple feedback types**: Service ratings, post-booking reviews, bug reports, feature requests, NPS surveys, etc.
- **Automated triggers**: System-initiated feedback requests based on events
- **Real-time analytics**: Comprehensive dashboard for feedback analysis
- **Multi-channel support**: Email, SMS, WhatsApp, in-app notifications
- **Sentiment analysis**: Automatic categorization and sentiment detection
- **Integration capabilities**: External system sync (Zendesk, Jira, Slack)

## Database Schema

### Core Tables

1. **`feedback_entries`** - Main feedback storage
2. **`feedback_attachments`** - File attachments for feedback
3. **`feedback_responses`** - Admin responses to feedback
4. **`nps_surveys`** - Net Promoter Score responses
5. **`feedback_templates`** - Configurable feedback form templates
6. **`feedback_campaigns`** - Automated feedback request campaigns
7. **`feedback_analytics`** - Aggregated analytics data
8. **`feedback_subscriptions`** - User notification preferences
9. **`feedback_integration_logs`** - External system integration logs
10. **`feedback_tags`** - Managed tags for categorization

### Key Enums

- **`feedback_type`**: Types of feedback (service_rating, post_booking_review, bug_report, etc.)
- **`feedback_status`**: Processing status (pending, in_review, addressed, resolved, etc.)
- **`feedback_priority`**: Priority levels (low, medium, high, urgent, critical)
- **`sentiment_analysis`**: Sentiment categories (positive, neutral, negative, mixed)
- **`feedback_channel`**: Communication channels (web, email, sms, whatsapp, etc.)

## Frontend Components

### 1. FeedbackForm

A comprehensive feedback form component that handles all feedback types.

```tsx
import { FeedbackForm } from '@/components/feedback';

<FeedbackForm
  feedbackType="post_booking_review"
  bookingId="booking-123"
  serviceId="service-456"
  onComplete={(feedbackId) => console.log('Feedback submitted:', feedbackId)}
/>
```

**Props:**
- `feedbackType`: Type of feedback to collect
- `bookingId`?: Associated booking ID
- `serviceId`?: Associated service ID
- `title`?: Custom form title
- `description`?: Custom form description
- `trigger`?: Custom trigger element
- `onComplete`?: Callback when feedback is submitted
- `className`?: Additional CSS classes

### 2. PostBookingFeedbackWidget

Automated feedback widget that appears after booking completion.

```tsx
import { PostBookingFeedbackWidget } from '@/components/feedback';

<PostBookingFeedbackWidget
  bookingId="booking-123"
  serviceName="Lip Enhancement"
  bookingDate="2024-01-15"
  compact={true}
  autoShowDelay={30000} // 30 seconds
/>
```

**Props:**
- `bookingId`: Booking ID to associate feedback with
- `serviceName`: Name of the service
- `bookingDate`: Date of the booking
- `autoShowDelay`?: Delay before showing widget (ms)
- `showTrigger`?: Show manual trigger button
- `compact`?: Use compact floating widget style
- `className`?: Additional CSS classes

### 3. NPSSurvey

Net Promoter Score survey component.

```tsx
import { NPSSurvey } from '@/components/feedback';

<NPSSurvey
  surveyType="periodic"
  autoShow={true}
  showDelay={5000}
  showResults={true}
/>
```

**Props:**
- `trigger`?: Custom trigger element
- `autoShow`?: Automatically show survey
- `showDelay`?: Delay before showing (ms)
- `surveyType`?: Type of NPS survey
- `showResults`?: Display NPS statistics
- `compact`?: Use compact style
- `className`?: Additional CSS classes

### 4. BugReportForm

Specialized form for reporting technical issues.

```tsx
import { BugReportForm } from '@/components/feedback';

<BugReportForm
  defaultCategory="Technical Issue"
  defaultSeverity="medium"
  autoFillContext={{
    url: window.location.href,
    userAgent: navigator.userAgent,
    error: "Specific error message"
  }}
/>
```

## React Hooks

### useFeedback

Main hook for managing feedback entries.

```tsx
import { useFeedback } from '@/hooks/useFeedback';

const {
  feedback,
  loading,
  error,
  submitFeedback,
  updateFeedback,
  deleteFeedback,
  respondToFeedback,
  refresh
} = useFeedback({
  bookingId: 'booking-123',
  feedbackType: 'post_booking_review'
});
```

### useNPSSurvey

Hook for NPS survey functionality.

```tsx
import { useNPSSurvey } from '@/hooks/useFeedback';

const {
  submitNPSSurvey,
  getNPSScore,
  loading
} = useNPSSurvey();
```

### useFeedbackAnalytics

Hook for analytics data.

```tsx
import { useFeedbackAnalytics } from '@/hooks/useFeedback';

const {
  analytics,
  loading,
  refresh,
  getSummaryStats
} = useFeedbackAnalytics('month');
```

### useFeedbackTemplates

Hook for managing feedback templates.

```tsx
import { useFeedbackTemplates } from '@/hooks/useFeedback';

const {
  templates,
  loading,
  getTemplate
} = useFeedbackTemplates();
```

## Backend Functions

### 1. process-feedback

Automated processing of feedback entries including sentiment analysis and categorization.

```typescript
// Call via Supabase client
const { data, error } = await supabase.functions.invoke('process-feedback', {
  body: {
    feedbackId: 'feedback-123',
    autoCategorize: true,
    sentimentAnalysis: true,
    keywordExtraction: true
  }
});
```

### 2. send-feedback-request

Schedule automated feedback requests via email, SMS, or WhatsApp.

```typescript
const { data, error } = await supabase.functions.invoke('send-feedback-request', {
  body: {
    userId: 'user-123',
    bookingId: 'booking-456',
    feedbackType: 'post_booking_review',
    channel: 'email',
    delay: 60, // minutes
    customMessage: 'Custom message content'
  }
});
```

### 3. generate-feedback-analytics

Generate comprehensive analytics reports.

```typescript
const { data, error } = await supabase.functions.invoke('generate-feedback-analytics', {
  body: {
    timeframe: 'month',
    feedbackType: 'service_rating',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    includeSentiment: true,
    includeTrends: true
  }
});
```

### 4. trigger-feedback-requests

Process automated trigger events for feedback requests.

```typescript
const { data, error } = await supabase.functions.invoke('trigger-feedback-requests', {
  body: {
    type: 'booking_completed',
    bookingId: 'booking-123',
    userId: 'user-456',
    timestamp: '2024-01-15T10:00:00Z'
  }
});
```

## Integration Examples

### 1. Post-Booking Integration

The Success page automatically shows a feedback widget:

```tsx
// src/pages/Success.tsx
{booking && (
  <PostBookingFeedbackWidget
    bookingId={booking.id}
    serviceName={booking.services?.title || 'your appointment'}
    bookingDate={booking.booking_date}
    compact={true}
    autoShowDelay={10000}
  />
)}
```

### 2. Admin Dashboard Integration

Add feedback analytics to the admin panel:

```tsx
// src/pages/Admin.tsx
case "feedback":
  return <FeedbackAnalyticsDashboard />;
```

### 3. Manual Feedback Button

Add feedback buttons anywhere in the app:

```tsx
import { FeedbackForm, BugReportForm, NPSSurvey } from '@/components/feedback';

// General feedback button
<FeedbackForm
  feedbackType="general_feedback"
  trigger={
    <Button variant="outline">
      Share Feedback
    </Button>
  }
/>

// Bug report button
<BugReportForm
  trigger={
    <Button variant="outline" size="sm">
      Report Bug
    </Button>
  }
/>

// NPS Survey
<NPSSurvey
  trigger={
    <Button variant="ghost" size="sm">
      Take Survey
    </Button>
  }
/>
```

## Automated Triggers

### Booking Completion

When a booking is marked as completed, the system automatically:

1. Schedules a post-booking review request (1 hour later)
2. Schedules an NPS survey (24 hours later)
3. For high-value services, schedules additional feedback (48 hours later)

### Payment Completion

After successful payment, sends a payment experience feedback request.

### Cancellation

When a booking is cancelled, sends a cancellation feedback request to understand reasons.

### Service Delivery

When services are marked as delivered, sends immediate service rating requests.

## Analytics Dashboard

The feedback analytics dashboard provides:

- **Overview**: Total feedback, average ratings, response rates
- **NPS Score**: Net Promoter Score with promoter/detractor breakdown
- **Trends**: Daily, weekly, and monthly feedback patterns
- **Breakdown**: By type, status, priority, sentiment, and channel
- **Top Issues**: Most frequently mentioned categories
- **Real-time Updates**: Live feedback stream

Access via: Admin Panel → Feedback Analytics

## Email Templates

The system includes predefined email templates for different feedback types:

- Post-booking review requests
- NPS surveys
- Payment experience feedback
- Cancellation feedback

Templates are customizable via the `feedback_templates` table.

## Configuration

### 1. User Consent

Feedback requests respect user communication preferences stored in `user_consents`:

- `email_marketing_opt_in` for email requests
- `sms_opt_in` for SMS requests
- `whatsapp_opt_in` for WhatsApp requests

### 2. Feedback Templates

Configure feedback forms via the `feedback_templates` table:

```sql
INSERT INTO feedback_templates (
  name,
  feedback_type,
  template_config
) VALUES (
  'Post-Booking Review',
  'post_booking_review',
  '{
    "questions": [
      {
        "id": "rating",
        "type": "rating",
        "label": "Rate your experience",
        "min": 1,
        "max": 5
      },
      {
        "id": "comments",
        "type": "textarea",
        "label": "Additional comments"
      }
    ]
  }'::jsonb
);
```

### 3. Automated Campaigns

Set up automated feedback campaigns:

```sql
INSERT INTO feedback_campaigns (
  name,
  campaign_type,
  target_criteria,
  template_id,
  trigger_conditions
) VALUES (
  'Post-Booking Reviews',
  'email',
  '{"event": "booking_completed"}',
  'template-id',
  '{"delay_hours": 1}'
);
```

## Best Practices

### 1. Timing

- **Immediate feedback**: For service delivery and payment experience
- **Short delay (1-2 hours)**: For post-booking reviews
- **Longer delay (24-48 hours)**: For NPS surveys and detailed feedback

### 2. Channel Selection

- **Email**: Detailed feedback, NPS surveys, post-booking reviews
- **SMS**: Quick ratings, urgent feedback requests
- **In-app**: Real-time feedback, bug reports
- **WhatsApp**: Personal follow-ups, high-priority issues

### 3. Frequency Management

- Limit feedback requests to avoid survey fatigue
- Respect user preferences and consent
- Use smart scheduling based on user behavior

### 4. Response Management

- Respond to feedback within 24 hours
- Use sentiment analysis to prioritize responses
- Escalate negative feedback quickly
- Close the loop with customers

## Security Considerations

- All feedback requests require user consent
- RLS policies protect feedback data
- File attachments are stored securely
- PII is handled according to GDPR requirements
- Admin access requires appropriate roles

## Monitoring and Maintenance

### 1. Analytics Monitoring

- Monitor response rates and completion rates
- Track NPS score trends
- Identify emerging issues from feedback patterns
- Monitor sentiment changes over time

### 2. System Health

- Monitor function execution performance
- Track failed feedback requests
- Monitor storage usage for attachments
- Check integration sync status

### 3. Regular Maintenance

- Clean up old scheduled messages
- Archive resolved feedback entries
- Update templates and campaigns
- Review and update consent policies

## Troubleshooting

### Common Issues

1. **Feedback not showing**: Check user consent settings
2. **Low response rates**: Review timing and messaging
3. **Analytics not updating**: Check function execution logs
4. **Email delivery issues**: Verify email templates and sending configuration

### Debugging

- Check browser console for frontend errors
- Review Supabase function logs
- Verify database RLS policies
- Test user consent configurations

## Future Enhancements

- AI-powered feedback categorization
- Advanced sentiment analysis with emotion detection
- Predictive analytics for customer satisfaction
- Multi-language feedback support
- Integration with more external systems
- Advanced reporting and export capabilities
- Feedback-driven improvement recommendations