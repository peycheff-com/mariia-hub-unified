import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, MessageSquare, Send, Calendar, User, FileText, Clock, CheckCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ConsentRequest, ConsentTemplate, ConsentScope } from '@/types/consent';
import { cn } from '@/lib/utils';

interface ConsentRequestFormProps {
  clientId: string;
  bookingId?: string;
  availableTemplates: ConsentTemplate[];
  onSubmit: (data: Omit<ConsentRequest, 'id' | 'created_at' | 'updated_at' | 'consent_form_token'>) => void;
  isLoading?: boolean;
  initialData?: Partial<ConsentRequest>;
}

interface RequestScopeItem {
  key: keyof ConsentScope;
  label: string;
  description: string;
}

const ConsentRequestForm: React.FC<ConsentRequestFormProps> = ({
  clientId,
  bookingId,
  availableTemplates,
  onSubmit,
  isLoading = false,
  initialData
}) => {
  const { t, i18n } = useTranslation();
  const [selectedTemplate, setSelectedTemplate] = useState<ConsentTemplate | null>(null);
  const [requestType, setRequestType] = useState<string>(initialData?.request_type || '');
  const [requestPurpose, setRequestPurpose] = useState(initialData?.request_purpose || '');
  const [usageContext, setUsageContext] = useState<ConsentScope>({});
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSMS, setSendSMS] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(30);

  const scopeOptions: RequestScopeItem[] = [
    { key: 'website', label: 'Website', description: 'Display on company website' },
    { key: 'social_media', label: 'Social Media', description: 'Share on social platforms' },
    { key: 'portfolio', label: 'Portfolio', description: 'Include in professional portfolio' },
    { key: 'ads', label: 'Advertisements', description: 'Use in marketing materials' },
    { key: 'print', label: 'Print Media', description: 'Print publications' },
    { key: 'internal_use', label: 'Internal Use', description: 'Training and documentation' },
    { key: 'case_study', label: 'Case Study', description: 'Educational content' },
    { key: 'email_marketing', label: 'Email Marketing', description: 'Newsletter and emails' }
  ];

  const consentTypes = [
    { value: 'photo', label: 'Photography', description: 'Use of photographs' },
    { value: 'video', label: 'Video Recording', description: 'Use of video footage' },
    { value: 'testimonial', label: 'Testimonial', description: 'Client testimonials' },
    { value: 'review', label: 'Review', description: 'Service reviews' },
    { value: 'case_study', label: 'Case Study', description: 'Detailed case studies' }
  ];

  useEffect(() => {
    if (requestType) {
      const template = availableTemplates.find(t => t.template_type === requestType && t.language === i18n.language);
      if (template) {
        setSelectedTemplate(template);
        setUsageContext(template.default_scope as ConsentScope);
      } else {
        // Find default template in any language
        const defaultTemplate = availableTemplates.find(t => t.template_type === requestType);
        if (defaultTemplate) {
          setSelectedTemplate(defaultTemplate);
          setUsageContext(defaultTemplate.default_scope as ConsentScope);
        }
      }
    }
  }, [requestType, availableTemplates, i18n.language]);

  const handleScopeChange = (key: keyof ConsentScope, checked: boolean) => {
    setUsageContext(prev => ({
      ...prev,
      [key]: checked
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTemplate || !requestPurpose.trim()) {
      return;
    }

    const requestData = {
      client_id: clientId,
      booking_id: bookingId || null,
      request_type: requestType,
      request_purpose: requestPurpose.trim(),
      usage_context: usageContext,
      email_sent: sendEmail,
      email_template_used: selectedTemplate.id,
      sms_sent: sendSMS,
      expires_at: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString(),
      created_by: undefined // Will be set by the service
    };

    onSubmit(requestData);
  };

  const getDefaultMessage = () => {
    if (!selectedTemplate) return '';

    const templateText = i18n.language === 'pl' ?
      `Szanowny Kliencie,\n\nChcielibyśmy prosić o zgodę na ${selectedTemplate.template_type === 'photo' ? 'wykorzystanie zdjęć' : selectedTemplate.template_type === 'video' ? 'wykorzystanie nagrań wideo' : 'opublikowanie opinii'} z naszej usługi.\n\n${selectedTemplate.explanation_text || ''}\n\nProsimy o wypełnienie formularza zgody klikając w poniższy link:` :
      `Dear Client,\n\nWe would like to request your consent for ${selectedTemplate.template_type === 'photo' ? 'photo usage' : selectedTemplate.template_type === 'video' ? 'video usage' : 'testimonial publication'} from our service.\n\n${selectedTemplate.explanation_text || ''}\n\nPlease complete the consent form by clicking the link below:`;

    return templateText;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Create Consent Request
          </CardTitle>
          <p className="text-gray-600">
            Send a consent request to a client for photo, video, or testimonial usage
          </p>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Consent Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Consent Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={requestType} onValueChange={setRequestType} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select consent type" />
              </SelectTrigger>
              <SelectContent>
                {consentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-sm text-gray-600">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedTemplate && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">{selectedTemplate.title}</h4>
                    <p className="text-sm text-blue-700 mt-1">{selectedTemplate.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{selectedTemplate.language}</Badge>
                      {selectedTemplate.is_default && (
                        <Badge variant="secondary">Default Template</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Request Purpose */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Request Purpose</CardTitle>
            <p className="text-sm text-gray-600">
              Explain why you are requesting this consent
            </p>
          </CardHeader>
          <CardContent>
            <Textarea
              value={requestPurpose}
              onChange={(e) => setRequestPurpose(e.target.value)}
              placeholder="e.g., We would like to share your amazing results on our social media to inspire others..."
              disabled={isLoading}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Usage Context */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Usage Context</CardTitle>
            <p className="text-sm text-gray-600">
              Select where the content might be used
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scopeOptions.map((option) => (
                <div key={option.key} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={option.key}
                    checked={usageContext[option.key] || false}
                    onCheckedChange={(checked) => handleScopeChange(option.key, checked as boolean)}
                    disabled={isLoading}
                  />
                  <div className="flex-1">
                    <Label htmlFor={option.key} className="font-medium">
                      {option.label}
                    </Label>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Communication Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Communication Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="send_email"
                checked={sendEmail}
                onCheckedChange={(checked) => setSendEmail(checked as boolean)}
                disabled={isLoading}
              />
              <div className="flex-1">
                <Label htmlFor="send_email" className="font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Send Email Request
                </Label>
                <p className="text-sm text-gray-600">
                  Send consent request via email
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="send_sms"
                checked={sendSMS}
                onCheckedChange={(checked) => setSendSMS(checked as boolean)}
                disabled={isLoading}
              />
              <div className="flex-1">
                <Label htmlFor="send_sms" className="font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Send SMS Request
                </Label>
                <p className="text-sm text-gray-600">
                  Send consent request via SMS (if phone number available)
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="expires_in">Request expires in (days)</Label>
              <Select
                value={expiresInDays.toString()}
                onValueChange={(value) => setExpiresInDays(parseInt(value))}
                disabled={isLoading}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days (default)</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Custom Message */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Custom Message (Optional)</CardTitle>
            <p className="text-sm text-gray-600">
              Add a personal message to the consent request
            </p>
          </CardHeader>
          <CardContent>
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder={getDefaultMessage()}
              disabled={isLoading}
              rows={6}
            />
            <p className="text-xs text-gray-500 mt-2">
              Leave empty to use the default template message
            </p>
          </CardContent>
        </Card>

        {/* Preview */}
        {sendEmail && selectedTemplate && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Email Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div className="font-medium">Subject: Consent Request - {selectedTemplate.title}</div>
                  <Separator />
                  <div className="whitespace-pre-wrap">
                    {customMessage || getDefaultMessage()}
                  </div>
                  <Separator />
                  <div className="text-blue-600 underline">
                    [Consent Form Link]
                  </div>
                  <div className="text-gray-500 text-xs">
                    This link will expire in {expiresInDays} days.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !selectedTemplate || !requestPurpose.trim()}
          >
            <Send className="w-4 h-4 mr-2" />
            {isLoading ? 'Sending...' : 'Send Consent Request'}
          </Button>
        </div>
      </form>

      <Alert>
        <Clock className="w-4 h-4" />
        <AlertDescription>
          The consent request will include a secure link to an online consent form.
          The client can review the terms, provide their digital signature, and submit their response.
          You'll be notified when they respond.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ConsentRequestForm;