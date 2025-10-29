# Consent Management System - Implementation Guide

## Quick Start

This guide helps developers implement and use the consent management system in their applications.

## Prerequisites

- Node.js 18+
- React 18+
- TypeScript 5+
- Supabase configured
- Tailwind CSS installed

## Installation

### 1. Database Setup

First, run the database migration:

```sql
-- Apply the consent management migration
-- File: supabase/migrations/20250206000000_consent_management_system.sql
```

### 2. Type Installation

The consent types are already included in the main Supabase types file. No additional installation needed.

### 3. Component Imports

```typescript
// Import consent components
import { SignaturePad } from '@/components/consent/SignaturePad';
import { ConsentForm } from '@/components/consent/ConsentForm';
import { ConsentRequestForm } from '@/components/consent/ConsentRequestForm';
import { ConsentManagementDashboard } from '@/components/consent/ConsentManagementDashboard';
import { UsageTracker } from '@/components/consent/UsageTracker';

// Import hooks
import {
  useConsents,
  useConsent,
  useCreateConsent,
  useConsentTemplates,
  useConsentAnalytics,
  useConsentForm,
  useConsentRequestManager
} from '@/hooks/useConsent';

// Import service
import { ConsentService } from '@/services/consent.service';

// Import types
import {
  ModelConsent,
  ConsentTemplate,
  ConsentFormData,
  ConsentScope
} from '@/types/consent';
```

## Basic Usage Examples

### 1. Creating a Consent Request

```typescript
import { useState } from 'react';
import { ConsentRequestForm } from '@/components/consent/ConsentRequestForm';
import { useConsentTemplates, useCreateConsentRequest } from '@/hooks/useConsent';

const CreateConsentRequest: React.FC = () => {
  const { data: templates } = useConsentTemplates({ active: true });
  const createRequest = useCreateConsentRequest();

  const handleSubmit = async (requestData) => {
    try {
      const request = await createRequest.mutateAsync(requestData);
      console.log('Consent request created:', request);
      // Send notification logic here
    } catch (error) {
      console.error('Error creating request:', error);
    }
  };

  return (
    <ConsentRequestForm
      clientId="client-uuid"
      availableTemplates={templates || []}
      onSubmit={handleSubmit}
      isLoading={createRequest.isPending}
    />
  );
};
```

### 2. Displaying Consent Form

```typescript
import { useParams } from 'react-router-dom';
import { ConsentForm } from '@/components/consent/ConsentForm';
import { useConsentRequestByToken, useConsentForm } from '@/hooks/useConsent';

const ConsentFormPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { data: request, isLoading } = useConsentRequestByToken(token || '');
  const { data: template } = useConsentTemplate(request?.template_id || '');
  const { submitForm, isSubmitting } = useConsentForm(template?.id);

  const handleSubmit = async (formData: ConsentFormData) => {
    if (!token) return;

    const success = await submitForm(token, formData);
    if (success) {
      // Redirect to success page
      window.location.href = '/consent/success';
    }
  };

  if (isLoading || !request || !template) {
    return <div>Loading...</div>;
  }

  return (
    <ConsentForm
      template={template}
      clientId={request.client_id}
      bookingId={request.booking_id}
      onSubmit={handleSubmit}
      isLoading={isSubmitting}
    />
  );
};
```

### 3. Consent Management Dashboard

```typescript
import { ConsentManagementDashboard } from '@/components/consent/ConsentManagementDashboard';
import {
  useConsents,
  useConsentRequests,
  useUsageLogs,
  useConsentAnalytics,
  useRevokeConsent,
  useLogConsentUsage
} from '@/hooks/useConsent';

const AdminConsentDashboard: React.FC = () => {
  const { data: consents } = useConsents();
  const { data: requests } = useConsentRequests();
  const { data: usageLogs } = useUsageLogs();
  const { data: analytics } = useConsentAnalytics();
  const revokeConsent = useRevokeConsent();
  const logUsage = useLogConsentUsage();

  const handleRevokeConsent = async (consentId: string, reason: string) => {
    try {
      await revokeConsent.mutateAsync({
        consent_uuid: consentId,
        revocation_reason_param: reason,
        revocation_type_param: 'client_request'
      });
      console.log('Consent revoked successfully');
    } catch (error) {
      console.error('Error revoking consent:', error);
    }
  };

  const handleLogUsage = async (consentId: string, usageType: string, context: string) => {
    try {
      await logUsage.mutateAsync({
        consent_uuid: consentId,
        usage_type_param: usageType,
        usage_context_param: context,
        used_by_uuid: 'current-user-id' // Get from auth context
      });
      console.log('Usage logged successfully');
    } catch (error) {
      console.error('Error logging usage:', error);
    }
  };

  return (
    <ConsentManagementDashboard
      consents={consents || []}
      requests={requests || []}
      usageLogs={usageLogs || []}
      analytics={analytics}
      onViewConsent={(consent) => console.log('View consent:', consent)}
      onEditConsent={(consent) => console.log('Edit consent:', consent)}
      onRevokeConsent={handleRevokeConsent}
      onLogUsage={handleLogUsage}
      onSendRequest={(clientId) => console.log('Send request to:', clientId)}
      onRefresh={() => console.log('Refresh data')}
      isLoading={false}
    />
  );
};
```

### 4. Usage Tracking

```typescript
import { UsageTracker } from '@/components/consent/UsageTracker';
import { useConsents, useCreateUsageLog } from '@/hooks/useConsent';

const ContentUsageTracker: React.FC = () => {
  const { data: consents } = useConsents({ status: ['active'] });
  const createUsageLog = useCreateUsageLog();

  const handleLogUsage = async (usageData) => {
    try {
      await createUsageLog.mutateAsync(usageData);
      console.log('Usage logged successfully');
    } catch (error) {
      console.error('Error logging usage:', error);
    }
  };

  return (
    <UsageTracker
      consents={consents || []}
      onLogUsage={handleLogUsage}
      isLoading={createUsageLog.isPending}
    />
  );
};
```

## Advanced Usage

### 1. Custom Consent Forms

```typescript
import { useState } from 'react';
import { SignaturePad } from '@/components/consent/SignaturePad';
import { ConsentFormData, SignatureData } from '@/types/consent';

const CustomConsentForm: React.FC = () => {
  const [formData, setFormData] = useState<Partial<ConsentFormData>>({});
  const [signature, setSignature] = useState<SignatureData | null>(null);

  const handleSignatureChange = (signatureData: SignatureData | null) => {
    setSignature(signatureData);
    setFormData(prev => ({
      ...prev,
      signature_data: signatureData || undefined,
      signature_method: signatureData?.type || 'drawn'
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signature) {
      alert('Please provide a signature');
      return;
    }

    // Submit logic here
    console.log('Consent data:', { ...formData, signature_data: signature });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Your custom form fields */}

      <SignaturePad
        onSignatureChange={handleSignatureChange}
        value={signature}
      />

      <button type="submit">Submit Consent</button>
    </form>
  );
};
```

### 2. Consent Validation

```typescript
import { ConsentFormData, consentFormValidation } from '@/types/consent';

const validateConsentForm = (formData: Partial<ConsentFormData>): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // Check required fields
  consentFormValidation.required_fields.forEach(field => {
    if (field === 'signature_data' && !formData.signature_data) {
      errors.signature = 'Signature is required';
    }
    if (field === 'agreed' && !formData.agreed) {
      errors.agreed = 'You must agree to the consent terms';
    }
    if (field === 'client_understands' && !formData.client_understands) {
      errors.understands = 'You must confirm that you understand the consent';
    }
  });

  // Check scope
  const hasScopeSelection = formData.scope && Object.values(formData.scope).some(value => value === true);
  if (!hasScopeSelection) {
    errors.scope = 'Please select at least one usage scope';
  }

  // Check expiry date for non-permanent consent
  if (formData.duration !== 'permanent' && !formData.expiry_date) {
    errors.expiry_date = 'Expiry date is required for time-limited consent';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
```

### 3. Email Templates for Consent Requests

```typescript
interface ConsentRequestEmail {
  to: string;
  subject: string;
  template: string;
  data: {
    clientName: string;
    consentType: string;
    requestPurpose: string;
    consentFormUrl: string;
    expiryDate: string;
  };
}

const generateConsentRequestEmail = (request: ConsentRequest, client: any): ConsentRequestEmail => {
  const consentFormUrl = `${window.location.origin}/consent/form/${request.consent_form_token}`;
  const expiryDate = new Date(request.expires_at).toLocaleDateString();

  return {
    to: client.email,
    subject: `Consent Request - ${request.request_type}`,
    template: 'consent-request',
    data: {
      clientName: client.full_name,
      consentType: request.request_type,
      requestPurpose: request.request_purpose,
      consentFormUrl,
      expiryDate
    }
  };
};
```

## Database Functions

### 1. Using Built-in Functions

```typescript
import { ConsentService } from '@/services/consent.service';

// Check if consent is active
const isActive = await ConsentService.isConsentActive('consent-uuid');

// Log usage with automatic validation
const usageLogId = await ConsentService.logConsentUsage({
  consent_uuid: 'consent-uuid',
  usage_type_param: 'social_media',
  usage_context_param: 'Instagram post about client transformation',
  used_by_uuid: 'user-uuid'
});

// Revoke consent with automatic processing
const revoked = await ConsentService.revokeConsent({
  consent_uuid: 'consent-uuid',
  revocation_reason_param: 'Client requested withdrawal',
  revocation_type_param: 'client_request',
  processed_by_uuid: 'user-uuid'
});

// Get expiring consents for notifications
const expiringConsents = await ConsentService.getExpiringConsent(30);
```

### 2. Custom Queries

```typescript
import { supabase } from '@/integrations/supabase/client';

// Get consents expiring next month
const expiringNextMonth = await supabase
  .from('model_consent')
  .select('*')
  .eq('status', 'active')
  .gte('expiry_date', new Date().toISOString())
  .lte('expiry_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());

// Get usage analytics for a specific consent
const usageAnalytics = await supabase
  .from('consent_usage_log')
  .select('usage_type, used_at')
  .eq('consent_id', 'consent-uuid')
  .order('used_at', { ascending: false });

// Get client consent history
const clientHistory = await supabase
  .from('model_consent')
  .select('*, consent_usage_log(*)')
  .eq('client_id', 'client-uuid')
  .order('created_at', { ascending: false });
```

## Error Handling

### 1. Service Layer Errors

```typescript
import { ConsentService } from '@/services/consent.service';

const handleConsentOperation = async () => {
  try {
    const consent = await ConsentService.createConsent(consentData);
    return { success: true, data: consent };
  } catch (error) {
    console.error('Consent operation failed:', error);

    // Handle specific error types
    if (error.code === '23505') { // Unique constraint violation
      return { success: false, error: 'Consent already exists' };
    }

    if (error.code === '23503') { // Foreign key violation
      return { success: false, error: 'Invalid client or booking ID' };
    }

    if (error.code === '42501') { // RLS policy violation
      return { success: false, error: 'Permission denied' };
    }

    return { success: false, error: 'Failed to process consent' };
  }
};
```

### 2. React Query Error Handling

```typescript
import { useConsents } from '@/hooks/useConsent';

const ConsentList: React.FC = () => {
  const { data, error, isLoading, refetch } = useConsents();

  if (error) {
    return (
      <div className="text-red-600">
        Error loading consents: {error.message}
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  if (isLoading) {
    return <div>Loading consents...</div>;
  }

  return (
    <div>
      {/* Render consent list */}
    </div>
  );
};
```

## Testing

### 1. Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { SignaturePad } from '@/components/consent/SignaturePad';

describe('SignaturePad', () => {
  it('should handle signature changes', () => {
    const mockOnChange = jest.fn();
    render(<SignaturePad onSignatureChange={mockOnChange} />);

    // Simulate signature drawing
    const canvas = screen.getByRole('img');
    fireEvent.mouseDown(canvas);
    fireEvent.mouseUp(canvas);

    // Test signature save
    const saveButton = screen.getByText('Save Signature');
    fireEvent.click(saveButton);

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'drawn',
        data: expect.any(String),
        timestamp: expect.any(String)
      })
    );
  });
});
```

### 2. Service Testing

```typescript
import { ConsentService } from '@/services/consent.service';

describe('ConsentService', () => {
  it('should create consent successfully', async () => {
    const consentData = {
      client_id: 'test-client',
      consent_type: 'photo',
      scope: { website: true },
      duration: 'permanent',
      signature_data: {
        type: 'typed',
        data: 'Test Signature',
        timestamp: new Date().toISOString()
      },
      agreed: true,
      client_understands: true,
      consent_language: 'en'
    };

    const result = await ConsentService.createConsent(consentData);

    expect(result).toHaveProperty('id');
    expect(result.client_id).toBe(consentData.client_id);
    expect(result.consent_type).toBe(consentData.consent_type);
  });
});
```

## Performance Considerations

### 1. Database Optimization

- Use proper indexes on frequently queried columns
- Implement pagination for large datasets
- Cache frequently accessed templates
- Use database functions for complex operations

### 2. Frontend Optimization

- Lazy load consent forms
- Implement virtual scrolling for large lists
- Cache consent data in React Query
- Use debounced search functionality

## Security Best Practices

### 1. Input Validation

```typescript
import { z } from 'zod';

const consentSchema = z.object({
  client_id: z.string().uuid(),
  consent_type: z.enum(['photo', 'video', 'testimonial', 'review', 'case_study']),
  scope: z.record(z.boolean()),
  duration: z.enum(['permanent', 'time_limited', 'campaign_specific', 'service_related']),
  signature_data: z.object({
    type: z.enum(['drawn', 'typed', 'uploaded']),
    data: z.string(),
    timestamp: z.string()
  }),
  agreed: z.boolean(),
  client_understands: z.boolean()
});

const validatedData = consentSchema.parse(inputData);
```

### 2. Access Control

```typescript
// RLS policies are enforced at the database level
// Ensure users can only access their own data or data they're authorized to see

const userConsents = await supabase
  .from('model_consent')
  .select('*')
  .eq('client_id', user.id); // Users can only see their own consents
```

## Deployment

### 1. Environment Variables

```bash
# Add to .env.production
CONSENT_FORM_URL=https://yourapp.com/consent
EMAIL_FROM_ADDRESS=noreply@yourapp.com
SUPPORT_EMAIL=support@yourapp.com
DPO_EMAIL=dpo@yourapp.com
```

### 2. Database Migration

```bash
# Apply migration to production
supabase db push

# Verify migration
supabase db reset --dry-run
```

## Troubleshooting

### Common Issues

1. **Consent form not loading**
   - Check template exists and is active
   - Verify database connection
   - Check RLS policies

2. **Signature not saving**
   - Check canvas rendering
   - Verify base64 encoding
   - Check network connection

3. **Email not sending**
   - Verify email configuration
   - Check template content
   - Review email logs

4. **Usage logging failing**
   - Verify consent is active
   - Check scope permissions
   - Review user permissions

### Debug Tools

```typescript
// Enable debug logging
console.log('Consent data:', consentData);

// Check RLS policies
const { data: test, error } = await supabase
  .from('model_consent')
  .select('*')
  .limit(1);

console.log('RLS test error:', error);

// Monitor performance
const startTime = performance.now();
const consent = await ConsentService.getConsentById(id);
const endTime = performance.now();
console.log(`Consent fetch took ${endTime - startTime} milliseconds`);
```

This implementation guide provides comprehensive examples and best practices for working with the consent management system. Adjust according to your specific requirements and architecture.