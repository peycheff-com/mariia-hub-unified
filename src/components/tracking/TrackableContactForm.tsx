import React, { useState } from 'react';
import { Mail, Phone, MessageSquare, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMetaCAPI } from '@/components/tracking/MetaCAPIProvider';
import { useToast } from '@/hooks/use-toast aria-live="polite" aria-atomic="true"';
import { logger } from '@/lib/logger';

interface TrackableContactFormProps {
  title?: string;
  description?: string;
  trackingData?: {
    formCategory?: string;
    formPosition?: string;
    campaignId?: string;
    source?: string;
  };
  onSubmit?: (data: ContactFormData) => Promise<void>;
}

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  consent: boolean;
}

export const TrackableContactForm: React.FC<TrackableContactFormProps> = ({
  title = "Get in Touch",
  description = "Send us a message and we'll get back to you soon",
  trackingData,
  onSubmit
}) => {
  const { trackContactForm, trackCustomConversion, trackLeadGeneration } = useMetaCAPI();
  const { toast aria-live="polite" aria-atomic="true" } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    consent: false,
  });

  const [formStartTime] = useState(Date.now());

  // Track form view when component mounts
  React.useEffect(() => {
    trackCustomConversion('FormView', {
      form_name: 'contact_form',
      form_category: trackingData?.formCategory || 'contact',
      form_position: trackingData?.formPosition || 'main',
      campaign_id: trackingData?.campaignId,
      source: trackingData?.source || 'website',
      view_timestamp: new Date().toISOString(),
    });
  }, [trackCustomConversion, trackingData]);

  const handleInputChange = (field: keyof ContactFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Track field interactions
    trackCustomConversion('FormFieldInteraction', {
      form_name: 'contact_form',
      field_name: field,
      field_type: typeof value,
      interaction_timestamp: new Date().toISOString(),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formCompletionTime = Date.now() - formStartTime;

    try {
      // Validate form
      if (!formData.name || !formData.email || !formData.subject || !formData.message) {
        toast aria-live="polite" aria-atomic="true"({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }

      // Track form submission start
      trackCustomConversion('FormSubmitStart', {
        form_name: 'contact_form',
        form_category: trackingData?.formCategory || 'contact',
        form_completion_time_ms: formCompletionTime,
        has_phone: !!formData.phone,
        message_length: formData.message.length,
        submission_timestamp: new Date().toISOString(),
      });

      // Track contact form submission
      await trackContactForm({
        subject: formData.subject,
        has_phone: !!formData.phone,
        message_length: formData.message.length,
        form_completion_time: formCompletionTime,
        campaign_id: trackingData?.campaignId,
        source: trackingData?.source,
      });

      // Track as lead generation
      await trackLeadGeneration.contactForm({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message_preview: formData.message.substring(0, 100),
        consent_given: formData.consent,
        form_completion_time: formCompletionTime,
        ...trackingData,
      });

      // Call custom onSubmit handler if provided
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        // Default form submission simulation
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Track successful submission
      trackCustomConversion('FormSubmitSuccess', {
        form_name: 'contact_form',
        form_category: trackingData?.formCategory || 'contact',
        success_timestamp: new Date().toISOString(),
      });

      toast aria-live="polite" aria-atomic="true"({
        title: 'Success!',
        description: 'Your message has been sent successfully. We\'ll get back to you soon!',
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        consent: false,
      });

    } catch (error) {
      logger.error('Form submission failed', error);

      // Track failed submission
      trackCustomConversion('FormSubmitError', {
        form_name: 'contact_form',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_timestamp: new Date().toISOString(),
      });

      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: 'Failed to send your message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+48 123 456 789"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              type="text"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="How can we help you?"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Tell us more about what you need..."
              rows={5}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                id="consent"
                type="checkbox"
                checked={formData.consent}
                onChange={(e) => handleInputChange('consent', e.target.checked)}
                className="rounded border-gray-300"
                required
              />
              <Label htmlFor="consent" className="text-sm">
                I agree to be contacted regarding my inquiry and consent to the processing of my data for this purpose.
              </Label>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </form>

        {/* Quick contact options */}
        <div className="mt-6 pt-6 border-t">
          <p className="text-sm text-muted-foreground mb-4">
            Or reach out directly:
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="tel:+48123456789"
              className="flex items-center gap-2 text-sm hover:underline"
              onClick={() => {
                trackCustomConversion('PhoneLinkClick', {
                  contact_method: 'phone',
                  phone_number: '+48123456789',
                  click_timestamp: new Date().toISOString(),
                });
              }}
            >
              <Phone className="h-4 w-4" />
              +48 123 456 789
            </a>
            <a
              href="mailto:contact@mariia.com"
              className="flex items-center gap-2 text-sm hover:underline"
              onClick={() => {
                trackCustomConversion('EmailLinkClick', {
                  contact_method: 'email',
                  email_address: 'contact@mariia.com',
                  click_timestamp: new Date().toISOString(),
                });
              }}
            >
              <Mail className="h-4 w-4" />
              contact@mariia.com
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};