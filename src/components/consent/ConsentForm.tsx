import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarIcon, Info, Download, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  ConsentFormData,
  ConsentTemplate,
  ConsentScope,
  SignatureData,
  consentFormValidation
} from '@/types/consent';
import { cn } from '@/lib/utils';

import { SignaturePad } from './SignaturePad';

interface ConsentFormProps {
  template: ConsentTemplate;
  clientId: string;
  bookingId?: string;
  onSubmit: (data: ConsentFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<ConsentFormData>;
  showPreview?: boolean;
}

const ConsentForm: React.FC<ConsentFormProps> = ({
  template,
  clientId,
  bookingId,
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
  showPreview = false
}) => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState<ConsentFormData>({
    consent_type: template.template_type,
    scope: template.default_scope as ConsentScope,
    duration: template.default_duration,
    compensation_type: template.default_compensation_type || 'none',
    restrictions: [],
    signature_method: 'drawn',
    agreed: false,
    client_understands: false,
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showFullText, setShowFullText] = useState(false);
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(
    initialData?.expiry_date ? new Date(initialData.expiry_date) : undefined
  );

  // Update form when template changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      consent_type: template.template_type,
      scope: template.default_scope as ConsentScope,
      duration: template.default_duration,
      compensation_type: template.default_compensation_type || 'none'
    }));
  }, [template]);

  const handleScopeChange = useCallback((key: keyof ConsentScope, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      scope: {
        ...prev.scope,
        [key]: checked
      }
    }));
  }, []);

  const handleSignatureChange = useCallback((signature: SignatureData | null) => {
    setFormData(prev => ({
      ...prev,
      signature_data: signature || undefined,
      signature_method: signature?.type || 'drawn'
    }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Check required fields
    consentFormValidation.required_fields.forEach(field => {
      if (field === 'signature_data' && !formData.signature_data) {
        newErrors.signature = 'Signature is required';
      }
      if (field === 'agreed' && !formData.agreed) {
        newErrors.agreed = 'You must agree to the consent terms';
      }
      if (field === 'client_understands' && !formData.client_understands) {
        newErrors.understands = 'You must confirm that you understand the consent';
      }
    });

    // Check if at least one scope option is selected
    const hasScopeSelection = Object.values(formData.scope).some(value => value === true);
    if (!hasScopeSelection) {
      newErrors.scope = 'Please select at least one usage scope';
    }

    // Check expiry date for non-permanent consent
    if (formData.duration !== 'permanent' && !expiryDate) {
      newErrors.expiry_date = 'Expiry date is required for time-limited consent';
    }

    // Check compensation details if compensation is offered
    if (formData.compensation_type !== 'none' && !formData.compensation_details) {
      newErrors.compensation_details = 'Please provide compensation details';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, expiryDate]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData: ConsentFormData = {
      ...formData,
      expiry_date: expiryDate?.toISOString().split('T')[0],
      signature_data: formData.signature_data!,
      consent_language: i18n.language
    };

    onSubmit(submitData);
  }, [formData, expiryDate, validateForm, onSubmit, i18n.language]);

  const downloadPDF = useCallback(() => {
    // This would generate and download a PDF version of the consent form
    // For now, we'll create a simple text download
    const content = `
CONSENT FORM - ${template.title.toUpperCase()}
Date: ${new Date().toLocaleDateString()}
Client ID: ${clientId}
Booking ID: ${bookingId || 'N/A'}

${template.consent_text}

Scope of Usage:
${Object.entries(formData.scope)
  .filter(([_, selected]) => selected)
  .map(([scope]) => `- ${scope.replace('_', ' ').toUpperCase()}`)
  .join('\n')}

Duration: ${formData.duration}
${expiryDate ? `Expires: ${format(expiryDate, 'PPP')}` : ''}

Compensation: ${formData.compensation_type}
${formData.compensation_details ? `Details: ${formData.compensation_details}` : ''}

Restrictions: ${formData.restrictions.length > 0 ? formData.restrictions.join(', ') : 'None'}

Signature Method: ${formData.signature_method}
Signed: ${formData.signature_data?.timestamp ? new Date(formData.signature_data.timestamp).toLocaleString() : 'Not signed'}

Client Declaration:
I confirm that I have read and understood this consent form.
I agree to the terms and conditions outlined above.
${formData.client_understands ? '✓' : '✗'} I understand the consent
${formData.agreed ? '✓' : '✗'} I agree to the terms
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consent-form-${template.template_type}-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [template, formData, clientId, bookingId, expiryDate]);

  const scopeOptions = [
    { key: 'website' as keyof ConsentScope, label: 'Website', description: 'Display on company website' },
    { key: 'social_media' as keyof ConsentScope, label: 'Social Media', description: 'Share on social platforms' },
    { key: 'portfolio' as keyof ConsentScope, label: 'Portfolio', description: 'Include in professional portfolio' },
    { key: 'ads' as keyof ConsentScope, label: 'Advertisements', description: 'Use in marketing materials' },
    { key: 'print' as keyof ConsentScope, label: 'Print Media', description: 'Print publications' },
    { key: 'internal_use' as keyof ConsentScope, label: 'Internal Use', description: 'Training and documentation' }
  ];

  const compensationTypes = [
    { value: 'none', label: 'No Compensation' },
    { value: 'discount', label: 'Service Discount' },
    { value: 'service', label: 'Free Service' },
    { value: 'cash', label: 'Cash Payment' },
    { value: 'gift', label: 'Gift/Product' }
  ];

  const durationOptions = [
    { value: 'permanent', label: 'Permanent', description: 'Consent does not expire' },
    { value: 'time_limited', label: 'Time Limited', description: 'Consent expires on a specific date' },
    { value: 'campaign_specific', label: 'Campaign Specific', description: 'Consent for a specific campaign' },
    { value: 'service_related', label: 'Service Related', description: 'Consent related to this service only' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>{template.title}</span>
            <Badge variant="outline">{template.template_type}</Badge>
          </CardTitle>
          <p className="text-gray-600">{template.description}</p>
        </CardHeader>
      </Card>

      {/* Consent Text */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Consent Terms</CardTitle>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowFullText(!showFullText)}
              >
                {showFullText ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showFullText ? 'Summary' : 'Full Text'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadPDF}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            {showFullText ? (
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {template.consent_text}
              </div>
            ) : (
              <div>
                <p className="text-sm leading-relaxed mb-4">
                  {template.explanation_text || template.consent_text.substring(0, 300) + '...'}
                </p>
                <Alert>
                  <Info className="w-4 h-4" />
                  <AlertDescription>
                    This is a summary. Click "Full Text" to read the complete consent terms.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>

          {template.usage_examples.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Usage Examples:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {template.usage_examples.map((example, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    {example}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Usage Scope */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Usage Scope</CardTitle>
            <p className="text-sm text-gray-600">
              Select where you consent to your content being used
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scopeOptions.map((option) => (
                <div key={option.key} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={option.key}
                    checked={formData.scope[option.key] || false}
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
            {errors.scope && (
              <p className="text-sm text-red-600 mt-2">{errors.scope}</p>
            )}
          </CardContent>
        </Card>

        {/* Duration and Expiry */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Consent Duration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={formData.duration}
              onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}
              disabled={isLoading}
            >
              {durationOptions.map((option) => (
                <div key={option.value} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <div className="flex-1">
                    <Label htmlFor={option.value} className="font-medium">
                      {option.label}
                    </Label>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>

            {formData.duration !== 'permanent' && (
              <div className="mt-4">
                <Label>Expiry Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-2",
                        !expiryDate && "text-muted-foreground"
                      )}
                      disabled={isLoading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expiryDate ? format(expiryDate, "PPP") : "Pick expiry date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={expiryDate}
                      onSelect={setExpiryDate}
                      initialFocus
                      disabled={(date) => date < new Date() || isLoading}
                    />
                  </PopoverContent>
                </Popover>
                {errors.expiry_date && (
                  <p className="text-sm text-red-600 mt-1">{errors.expiry_date}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compensation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compensation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={formData.compensation_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, compensation_type: value }))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select compensation type" />
              </SelectTrigger>
              <SelectContent>
                {compensationTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {formData.compensation_type !== 'none' && (
              <div>
                <Label htmlFor="compensation_details">Compensation Details</Label>
                <Textarea
                  id="compensation_details"
                  value={formData.compensation_details || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, compensation_details: e.target.value }))}
                  placeholder="Describe the compensation details..."
                  disabled={isLoading}
                  className="mt-2"
                  rows={3}
                />
                {errors.compensation_details && (
                  <p className="text-sm text-red-600 mt-1">{errors.compensation_details}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Restrictions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Restrictions (Optional)</CardTitle>
            <p className="text-sm text-gray-600">
              Any specific restrictions or limitations on content usage
            </p>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.restrictions.join('\n')}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                restrictions: e.target.value.split('\n').filter(r => r.trim())
              }))}
              placeholder="Enter any restrictions, one per line..."
              disabled={isLoading}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Legal Representative (for minors) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Legal Representative</CardTitle>
            <p className="text-sm text-gray-600">
              Required if the client is under 18 years of age
            </p>
          </CardHeader>
          <CardContent>
            <Input
              value={formData.legal_representative || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, legal_representative: e.target.value }))}
              placeholder="Full name of legal representative"
              disabled={isLoading}
            />
          </CardContent>
        </Card>

        {/* Digital Signature */}
        <SignaturePad
          onSignatureChange={handleSignatureChange}
          value={formData.signature_data}
          disabled={isLoading}
        />
        {errors.signature && (
          <p className="text-sm text-red-600">{errors.signature}</p>
        )}

        {/* Declarations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Client Declaration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="client_understands"
                checked={formData.client_understands}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, client_understands: checked as boolean }))}
                disabled={isLoading}
              />
              <div className="flex-1">
                <Label htmlFor="client_understands" className="font-medium">
                  I have read and fully understand the consent terms
                </Label>
                <p className="text-sm text-gray-600">
                  I understand what I am consenting to and the scope of usage
                </p>
              </div>
            </div>
            {errors.understands && (
              <p className="text-sm text-red-600">{errors.understands}</p>
            )}

            <Separator />

            <div className="flex items-start space-x-3">
              <Checkbox
                id="agreed"
                checked={formData.agreed}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreed: checked as boolean }))}
                disabled={isLoading}
              />
              <div className="flex-1">
                <Label htmlFor="agreed" className="font-medium">
                  I agree to the consent terms
                </Label>
                <p className="text-sm text-gray-600">
                  I voluntarily agree to the terms and conditions outlined in this consent form
                </p>
              </div>
            </div>
            {errors.agreed && (
              <p className="text-sm text-red-600">{errors.agreed}</p>
            )}

            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                You can withdraw this consent at any time by contacting us.
                Withdrawal will not affect the legality of any usage made before withdrawal.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Submit Consent'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ConsentForm;