# WhatsApp Business API Compliance Guide

This document outlines the compliance requirements and best practices for using WhatsApp Business API at Mariia Hub.

## Overview

The WhatsApp Business API is a powerful tool for customer communication, but it comes with strict compliance requirements that must be followed to maintain account health and avoid suspension.

## 1. WhatsApp Business Policies

### 1.1 Permitted Use Cases

✅ **Allowed:**
- Appointment confirmations and reminders
- Customer support and service inquiries
- Transactional notifications (payments, bookings)
- Aftercare instructions and follow-ups
- Opt-in promotional messages
- Service inquiries and responses

❌ **Prohibited:**
- Spam or unsolicited messages
- Misleading or false information
- Inappropriate content
- Political messaging
- Alcohol, tobacco, or drug promotion
- Weapons or ammunition sales
- Adult content
- Hate speech or discriminatory content

### 1.2 Message Categories

#### Utility Messages
- Transactional in nature
- Must be customer-initiated or directly related to a transaction
- Examples: booking confirmations, appointment reminders, payment confirmations
- No pre-approval required

#### Authentication Messages
- One-time passwords (OTPs)
- Account verification codes
- Must be customer-initiated
- No pre-approval required

#### Marketing Messages
- Promotional content
- Requires explicit opt-in from customer
- Templates must be pre-approved by WhatsApp
- Examples: special offers, promotions, newsletters

## 2. Opt-In Requirements

### 2.1 Explicit Consent

Before sending any WhatsApp messages to customers, you must obtain explicit consent:

```html
<!-- Example consent checkbox -->
<label>
  <input type="checkbox" name="whatsapp_consent" />
  I agree to receive appointment reminders and updates via WhatsApp
</label>
```

### 2.2 Consent Language Requirements

Consent must be:
- **Clear and unambiguous**: No pre-checked boxes
- **Specific**: Mention WhatsApp explicitly
- **Freely given**: No coercion or negative consequences for not opting in
- **Documented**: Keep records of when and how consent was obtained

### 2.3 Consent Methods

Acceptable consent methods include:
- Web form checkboxes (not pre-checked)
- Written agreements
- Verbal consent (with documentation)
- SMS opt-in with clear terms
- QR code scans with clear disclosure

## 3. Template Message Guidelines

### 3.1 Template Categories

1. **Marketing** (24-hour window)
   - Promotional content
   - Sales and special offers
   - Product launches

2. **Utility** (24-hour window)
   - Transactional updates
   - Account notifications
   - Booking confirmations

3. **Authentication** (15-minute window)
   - OTP codes
   - Verification codes

### 3.2 Template Structure

```json
{
  "name": "booking_confirmation",
  "category": "utility",
  "language": "en",
  "components": [
    {
      "type": "header",
      "parameters": [
        {
          "type": "text",
          "text": "Appointment Confirmed"
        }
      ]
    },
    {
      "type": "body",
      "parameters": [
        {
          "type": "text",
          "text": "{{customer_name}}"
        },
        {
          "type": "text",
          "text": "{{service_name}}"
        },
        {
          "type": "text",
          "text": "{{date}}"
        },
        {
          "type": "text",
          "text": "{{time}}"
        }
      ]
    },
    {
      "type": "footer",
      "text": "Reply STOP to unsubscribe"
    }
  ]
}
```

### 3.3 Template Best Practices

- Keep messages concise and relevant
- Use personalization variables appropriately
- Include opt-out instructions
- Avoid misleading claims
- Follow WhatsApp's formatting guidelines
- Test templates before submitting for approval

## 4. Rate Limiting and Sending Rules

### 4.1 Rate Limits

- **Free Tier**: 1,000 conversations per month
- **Business Hours**: 9:00 - 21:00 (Warsaw timezone)
- **Message Frequency**: Maximum 1 message per customer per hour for marketing
- **Queue System**: Automatic queueing for rate-limited messages

### 4.2 Conversation Windows

- **24-hour window**: Must reply within 24 hours of last customer message
- **Free-form messages**: Only within the 24-hour window
- **Template messages**: Can be sent anytime but count towards conversation limits

### 4.3 Quality Rating

WhatsApp monitors message quality based on:
- **Block rate**: Percentage of users who block your number
- **Report rate**: Percentage of messages reported as spam
- **Response rate**: How often users reply to your messages

Quality ratings:
- 🟢 **Green**: Good performance
- 🟡 **Yellow**: Needs improvement
- 🔴 **Red**: At risk of restriction

## 5. Data Privacy and Security

### 5.1 GDPR Compliance

- **Lawful basis**: Explicit consent for processing
- **Data minimization**: Collect only necessary information
- **Purpose limitation**: Use data only for stated purposes
- **Storage limitation**: Retain data only as long as necessary
- **Security**: Implement appropriate technical and organizational measures

### 5.2 Data Handling

```typescript
// Example of secure data handling
class WhatsAppService {
  private async logMessage(data: MessageData) {
    // Remove sensitive data before logging
    const sanitizedData = {
      ...data,
      content: data.content.replace(/\d{11}/g, '***-***-***'), // Mask phone numbers
      metadata: this.sanitizeMetadata(data.metadata)
    }

    await this.supabase.from('message_logs').insert(sanitizedData)
  }
}
```

### 5.3 Data Retention

- **Message logs**: Retain for 90 days
- **Consent records**: Retain for 2 years
- **Analytics data**: Aggregate after 30 days
- **Opt-out requests**: Retain indefinitely

## 6. Opt-Out and Unsubscribe

### 6.1 Required Opt-Out Methods

Must provide at least one of:
- **STOP keyword**: Users can reply "STOP" to opt-out
- **URL**: Link to unsubscribe page
- **Contact info**: Phone number or email to opt-out

### 6.2 Opt-Out Handling

```typescript
async handleOptOut(from: string): Promise<void> {
  // 1. Update database immediately
  await this.supabase
    .from('profiles')
    .update({ whatsapp_opt_out: true })
    .eq('phone', from.replace('whatsapp:', ''))

  // 2. Send confirmation message
  await this.sendTextMessage(
    from,
    'You have been opted out from WhatsApp messages. Reply START to opt back in.'
  )

  // 3. Log the opt-out
  await this.logOptOut(from, new Date())
}
```

### 6.3 Opt-In After Opt-Out

- Must obtain new explicit consent
- Wait at least 30 days before re-engaging
- Document the new consent separately

## 7. Monitoring and Reporting

### 7.1 Key Metrics to Monitor

- **Delivery rate**: Percentage of messages successfully delivered
- **Read rate**: Percentage of delivered messages read
- **Block rate**: Percentage of users who block the number
- **Report rate**: Percentage of messages reported
- **Opt-out rate**: Percentage of users who opt-out

### 7.2 Daily Health Check

```typescript
async performHealthCheck(): Promise<HealthStatus> {
  const analytics = await this.getAnalytics()
  const quality = await this.getQualityRating()

  // Check for issues
  if (analytics.blockRate > 5) {
    await this.notifyAdmin('High block rate detected', 'warning')
  }

  if (quality.rating === 'RED') {
    await this.notifyAdmin('WhatsApp quality rating is RED', 'critical')
  }

  return {
    status: quality.rating,
    metrics: analytics,
    alerts: this.generateAlerts(analytics)
  }
}
```

### 7.3 Compliance Checklist

- [ ] All recipients have given explicit consent
- [ ] Opt-out mechanism is clearly provided
- [ ] Templates are approved by WhatsApp
- [ ] Messages comply with business hours
- [ ] No spam or promotional abuse
- [ ] Data privacy requirements met
- [ ] Quality rating is monitored
- [ ] Rate limits are respected

## 8. Template Approval Process

### 8.1 Submission Guidelines

1. **Category Selection**: Choose appropriate category (Marketing/Utility/Authentication)
2. **Content Guidelines**:
   - No misleading claims
   - No spam indicators
   - Clear and concise language
   - Proper formatting

3. **Variable Usage**:
   - Use {{variable}} format
   - Provide example values
   - Don't exceed character limits

### 8.2 Common Rejection Reasons

- Ambiguous or unclear purpose
- Missing opt-out information
- Misleading claims
- Inappropriate content
- Poor formatting
- Spam indicators

### 8.3 Appeal Process

If template is rejected:
1. Review rejection reason
2. Fix identified issues
3. Resubmit with changes
4. Document changes made

## 9. Emergency Procedures

### 9.1 Account Suspension

If account is suspended:
1. Immediately stop all WhatsApp messaging
2. Review compliance status
3. Identify and fix violations
4. Submit appeal to WhatsApp
5. Implement additional safeguards

### 9.2 Quality Rating Drop

Actions for RED quality rating:
1. Pause marketing campaigns
2. Review recent messages for issues
3. Clean up contact list
4. Reduce sending frequency
5. Focus on utility messages only

## 10. Best Practices

### 10.1 Message Content

- Keep messages relevant and valuable
- Personalize when possible
- Use clear call-to-actions
- Avoid excessive emojis or special characters
- Test readability on mobile devices

### 10.2 List Management

- Regularly clean contact lists
- Remove bounced or inactive numbers
- Honor opt-outs immediately
- Segment lists appropriately

### 10.3 Customer Experience

- Respond promptly to inquiries
- Provide helpful information
- Make it easy to opt-out
- Monitor feedback and complaints

## 11. Contact Information

For compliance questions or issues:

- **Compliance Officer**: compliance@mariia.studio
- **Technical Support**: tech@mariia.studio
- **WhatsApp Business Support**: [Meta Business Help Center](https://www.facebook.com/business/help)

## 12. Updates and Review

This compliance guide should be reviewed:
- **Quarterly**: For general updates
- **Immediately**: When WhatsApp policies change
- **Annually**: For comprehensive compliance audit

### Version History

- **v1.0** - Jan 2024: Initial version
- **v1.1** - Feb 2024: Added quality rating guidelines
- **v1.2** - Oct 2024: Updated for WhatsApp Business API v18.0

---

**Disclaimer**: This guide is for informational purposes only and does not constitute legal advice. Please consult with legal professionals for specific compliance requirements.