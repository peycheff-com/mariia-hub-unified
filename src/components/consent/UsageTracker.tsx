import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Search,
  Camera,
  Video,
  FileText,
  Share2,
  Globe,
  Megaphone,
  Mail,
  CalendarIcon,
  Upload,
  Eye,
  Download,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ConsentUsageLog, ModelConsent } from '@/types/consent';
import { cn } from '@/lib/utils';

interface UsageTrackerProps {
  consents: ModelConsent[];
  onLogUsage: (usageData: Omit<ConsentUsageLog, 'id' | 'created_at' | 'used_at' | 'metadata'>) => void;
  isLoading?: boolean;
}

interface UsageFormData {
  consentId: string;
  usageType: string;
  usageContext: string;
  usageDescription?: string;
  mediaType?: string;
  mediaUrls: string[];
  campaignId?: string;
  geographicRegion?: string;
  displayStartDate?: Date;
  displayEndDate?: Date;
  department?: string;
  projectName?: string;
  complianceNotes?: string;
}

const UsageTracker: React.FC<UsageTrackerProps> = ({
  consents,
  onLogUsage,
  isLoading = false
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConsent, setSelectedConsent] = useState<ModelConsent | null>(null);
  const [showUsageDialog, setShowUsageDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [formData, setFormData] = useState<UsageFormData>({
    consentId: '',
    usageType: '',
    usageContext: '',
    mediaUrls: []
  });

  // Filter active consents
  const activeConsents = consents.filter(consent => consent.status === 'active');

  // Filter consents by search term
  const filteredConsents = activeConsents.filter(consent => {
    if (!searchTerm) return true;
    return (
      consent.client_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consent.consent_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      Object.entries(consent.scope as any).some(([scope, selected]) =>
        selected && scope.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  });

  const usageTypes = [
    {
      value: 'website',
      label: 'Website',
      icon: Globe,
      description: 'Display on company website',
      mediaTypes: ['photo', 'video', 'mixed']
    },
    {
      value: 'social_media',
      label: 'Social Media',
      icon: Share2,
      description: 'Share on social platforms',
      mediaTypes: ['photo', 'video', 'text', 'mixed']
    },
    {
      value: 'portfolio',
      label: 'Portfolio',
      icon: Camera,
      description: 'Include in professional portfolio',
      mediaTypes: ['photo', 'video', 'mixed']
    },
    {
      value: 'advertisement',
      label: 'Advertisement',
      icon: Megaphone,
      description: 'Use in marketing materials',
      mediaTypes: ['photo', 'video', 'mixed']
    },
    {
      value: 'print',
      label: 'Print Media',
      icon: FileText,
      description: 'Print publications',
      mediaTypes: ['photo', 'mixed']
    },
    {
      value: 'email',
      label: 'Email Marketing',
      icon: Mail,
      description: 'Newsletter and email campaigns',
      mediaTypes: ['photo', 'text', 'mixed']
    },
    {
      value: 'case_study',
      label: 'Case Study',
      icon: FileText,
      description: 'Educational content',
      mediaTypes: ['photo', 'video', 'text', 'mixed']
    },
    {
      value: 'testimonial',
      label: 'Testimonial',
      icon: FileText,
      description: 'Client testimonials',
      mediaTypes: ['text', 'photo', 'video']
    }
  ];

  const mediaTypes = [
    { value: 'photo', label: 'Photo' },
    { value: 'video', label: 'Video' },
    { value: 'text', label: 'Text' },
    { value: 'audio', label: 'Audio' },
    { value: 'mixed', label: 'Mixed Media' }
  ];

  const departments = [
    { value: 'marketing', label: 'Marketing' },
    { value: 'social_media', label: 'Social Media' },
    { value: 'design', label: 'Design' },
    { value: 'content', label: 'Content' },
    { value: 'sales', label: 'Sales' },
    { value: 'other', label: 'Other' }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addMediaUrl = () => {
    if (mediaUrlInput.trim()) {
      setFormData(prev => ({
        ...prev,
        mediaUrls: [...prev.mediaUrls, mediaUrlInput.trim()]
      }));
      setMediaUrlInput('');
    }
  };

  const removeMediaUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      mediaUrls: prev.mediaUrls.filter((_, i) => i !== index)
    }));
  };

  const openUsageDialog = (consent: ModelConsent) => {
    setSelectedConsent(consent);
    setFormData({
      consentId: consent.id,
      usageType: '',
      usageContext: '',
      mediaUrls: []
    });
    setShowUsageDialog(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedConsent || !formData.usageType || !formData.usageContext) {
      return;
    }

    // Verify consent scope allows this usage type
    const consentScope = selectedConsent.scope as any;
    const scopeKey = formData.usageType.replace('_media', '').replace('_', ' ');

    if (!consentScope[formData.usageType] && !consentScope[scopeKey]) {
      alert(`This consent does not allow usage for: ${formData.usageType}`);
      return;
    }

    const usageData = {
      ...formData,
      display_start_date: formData.displayStartDate?.toISOString().split('T')[0],
      display_end_date: formData.displayEndDate?.toISOString().split('T')[0],
      used_by: undefined // Will be set by service
    };

    onLogUsage(usageData);
    setShowUsageDialog(false);
    setFormData({
      consentId: '',
      usageType: '',
      usageContext: '',
      mediaUrls: []
    });
    setUploadedFiles([]);
    setSelectedConsent(null);
  };

  const getConsentBadge = (consent: ModelConsent) => {
    const scopes = Object.entries(consent.scope as any)
      .filter(([_, selected]) => selected)
      .map(([scope]) => scope.replace('_', ' '));

    return (
      <div className="flex flex-wrap gap-1">
        {scopes.slice(0, 3).map((scope) => (
          <Badge key={scope} variant="outline" className="text-xs">
            {scope}
          </Badge>
        ))}
        {scopes.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{scopes.length - 3}
          </Badge>
        )}
      </div>
    );
  };

  const getUsageTypeIcon = (type: string) => {
    const usageType = usageTypes.find(ut => ut.value === type);
    return usageType ? usageType.icon : FileText;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Content Usage Tracker
          </CardTitle>
          <p className="text-gray-600">
            Log and track where consented content is being used
          </p>
        </CardHeader>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Find Consent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by client ID, type, or scope..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Available Consents */}
      <Card>
        <CardHeader>
          <CardTitle>Available Consents ({filteredConsents.length})</CardTitle>
          <p className="text-sm text-gray-600">
            Only active consents are shown. Select one to log usage.
          </p>
        </CardHeader>
        <CardContent>
          {filteredConsents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No active consents found matching your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredConsents.map((consent) => (
                <Card key={consent.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium capitalize">{consent.consent_type}</div>
                          <div className="text-sm text-gray-500">
                            Client: {consent.client_id?.substring(0, 8)}...
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      </div>

                      {getConsentBadge(consent)}

                      <div className="text-sm text-gray-600">
                        <div>Signed: {format(new Date(consent.consent_date), 'MMM dd, yyyy')}</div>
                        {consent.expiry_date && (
                          <div>Expires: {format(new Date(consent.expiry_date), 'MMM dd, yyyy')}</div>
                        )}
                      </div>

                      <Button
                        size="sm"
                        onClick={() => openUsageDialog(consent)}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Log Usage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Logging Dialog */}
      <Dialog open={showUsageDialog} onOpenChange={setShowUsageDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Log Content Usage</DialogTitle>
            {selectedConsent && (
              <div className="text-sm text-gray-600">
                Logging usage for {selectedConsent.consent_type} consent from client {selectedConsent.client_id?.substring(0, 8)}...
              </div>
            )}
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Usage Type */}
            <div>
              <Label>Usage Type *</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {usageTypes.map((type) => {
                  const Icon = type.icon;
                  const isAvailable = selectedConsent?.scope?.[type.value as keyof typeof selectedConsent.scope];

                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, usageType: type.value }))}
                      disabled={!isAvailable}
                      className={cn(
                        "p-3 border rounded-lg text-left transition-colors",
                        formData.usageType === type.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300",
                        !isAvailable && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="font-medium">{type.label}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {type.description}
                      </div>
                      {!isAvailable && (
                        <div className="text-xs text-red-600 mt-1">
                          Not covered by this consent
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Usage Context */}
            <div>
              <Label htmlFor="usage-context">Usage Context *</Label>
              <Textarea
                id="usage-context"
                value={formData.usageContext}
                onChange={(e) => setFormData(prev => ({ ...prev, usageContext: e.target.value }))}
                placeholder="Describe where and how the content is being used..."
                rows={3}
                required
              />
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Media Type</Label>
                <Select
                  value={formData.mediaType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, mediaType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select media type" />
                  </SelectTrigger>
                  <SelectContent>
                    {mediaTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Department</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.value} value={dept.value}>
                        {dept.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Media URLs */}
            <div>
              <Label>Media URLs</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={mediaUrlInput}
                    onChange={(e) => setMediaUrlInput(e.target.value)}
                    placeholder="Enter media URL..."
                    onKeyPress={(e) => e.key === 'Enter' && addMediaUrl()}
                  />
                  <Button type="button" onClick={addMediaUrl}>
                    Add
                  </Button>
                </div>

                {formData.mediaUrls.map((url, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Eye className="w-4 h-4 text-blue-500" />
                    <span className="text-sm flex-1 truncate">{url}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMediaUrl(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* File Upload */}
            <div>
              <Label>Upload Media Files</Label>
              <div className="mt-2">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-2 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <Upload className="w-4 h-4 text-green-500" />
                      <span className="text-sm flex-1">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Display Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-2",
                        !formData.displayStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.displayStartDate ? format(formData.displayStartDate, "PPP") : "Pick start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.displayStartDate}
                      onSelect={(date) => setFormData(prev => ({ ...prev, displayStartDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Display End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-2",
                        !formData.displayEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.displayEndDate ? format(formData.displayEndDate, "PPP") : "Pick end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.displayEndDate}
                      onSelect={(date) => setFormData(prev => ({ ...prev, displayEndDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Compliance Notes */}
            <div>
              <Label>Compliance Notes</Label>
              <Textarea
                value={formData.complianceNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, complianceNotes: e.target.value }))}
                placeholder="Any additional compliance information..."
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUsageDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!formData.usageType || !formData.usageContext || isLoading}
              >
                {isLoading ? 'Logging...' : 'Log Usage'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Compliance Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Remember to only use content within the scope of consent granted by the client.
          All usage is logged for compliance and audit purposes.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default UsageTracker;