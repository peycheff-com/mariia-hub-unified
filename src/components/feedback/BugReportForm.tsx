import React, { useState, useEffect } from 'react';
import {
  Bug,
  AlertTriangle,
  Monitor,
  Smartphone,
  Globe,
  CreditCard,
  Calendar,
  MessageSquare,
  Send,
  Camera,
  Upload,
  Info,
  CheckCircle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast aria-live="polite" aria-atomic="true"';
import { cn } from '@/lib/utils';

import { FeedbackForm } from './FeedbackForm';


interface BugReportFormProps {
  trigger?: React.ReactNode;
  defaultCategory?: string;
  defaultSeverity?: string;
  autoFillContext?: {
    url?: string;
    userAgent?: string;
    error?: string;
  };
  className?: string;
}

const severityLevels = {
  low: {
    label: 'Low',
    description: 'Minor issue that doesn\'t affect core functionality',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    icon: Info,
  },
  medium: {
    label: 'Medium',
    description: 'Issue that affects some functionality but has workarounds',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    icon: AlertTriangle,
  },
  high: {
    label: 'High',
    description: 'Major issue that significantly impacts user experience',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    icon: AlertTriangle,
  },
  critical: {
    label: 'Critical',
    description: 'System-breaking issue that prevents core functionality',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    icon: AlertTriangle,
  },
};

const commonIssues = [
  'Page not loading',
  'Button not working',
  'Form submission error',
  'Payment processing issue',
  'Booking system error',
  'Login/authentication problem',
  'Mobile app crash',
  'Display/formatting issue',
  'Performance/slow loading',
  'Other',
];

export const BugReportForm: React.FC<BugReportFormProps> = ({
  trigger,
  defaultCategory,
  defaultSeverity = 'medium',
  autoFillContext,
  className,
}) => {
  const { toast aria-live="polite" aria-atomic="true" } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    severity: defaultSeverity,
    category: defaultCategory || '',
    title: '',
    description: '',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: '',
    browserInfo: '',
    deviceInfo: '',
    frequency: '',
    url: autoFillContext?.url || '',
    error: autoFillContext?.error || '',
  });

  useEffect(() => {
    if (autoFillContext?.userAgent) {
      setFormData(prev => ({
        ...prev,
        browserInfo: autoFillContext.userAgent!,
      }));
    }
  }, [autoFillContext]);

  const handleScreenshotChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setScreenshots(prev => [...prev, ...files]);
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      toast aria-live="polite" aria-atomic="true"({
        title: 'Validation Error',
        description: 'Please provide a title and description for the bug report',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create comprehensive bug report content
      const bugReportContent = `
**Issue Description:**
${formData.description}

**Steps to Reproduce:**
${formData.stepsToReproduce || 'Not provided'}

**Expected Behavior:**
${formData.expectedBehavior || 'Not provided'}

**Actual Behavior:**
${formData.actualBehavior || 'Not provided'}

**Browser/Device Info:**
${formData.browserInfo || 'Not provided'}

**Frequency:** ${formData.frequency || 'Not provided'}
**URL:** ${formData.url || 'Not provided'}
**Error Message:** ${formData.error || 'Not provided'}

**Screenshots:** ${screenshots.length > 0 ? `${screenshots.length} file(s) attached` : 'None'}
      `.trim();

      const feedbackData = {
        feedback_type: 'bug_report' as const,
        title: formData.title,
        content: bugReportContent,
        category: formData.category,
        priority: formData.severity as any,
        metadata: {
          bug_report_details: {
            steps_to_reproduce: formData.stepsToReproduce,
            expected_behavior: formData.expectedBehavior,
            actual_behavior: formData.actualBehavior,
            browser_info: formData.browserInfo,
            device_info: formData.deviceInfo,
            frequency: formData.frequency,
            url: formData.url,
            error_message: formData.error,
            screenshot_count: screenshots.length,
          },
          auto_filled: !!autoFillContext,
        },
      };

      setSubmitted(true);
      toast aria-live="polite" aria-atomic="true"({
        title: 'Bug Report Submitted',
        description: 'Thank you for helping us improve our service. We\'ll investigate this issue.',
      });

      // Reset form after delay
      setTimeout(() => {
        setIsOpen(false);
        resetForm();
      }, 2000);

    } catch (error: any) {
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: error.message || 'Failed to submit bug report',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      severity: defaultSeverity,
      category: defaultCategory || '',
      title: '',
      description: '',
      stepsToReproduce: '',
      expectedBehavior: '',
      actualBehavior: '',
      browserInfo: autoFillContext?.userAgent || '',
      deviceInfo: '',
      frequency: '',
      url: autoFillContext?.url || '',
      error: autoFillContext?.error || '',
    });
    setScreenshots([]);
    setSubmitted(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (!submitted) {
      resetForm();
    }
  };

  const QuickIssueSelector = () => (
    <div className="space-y-2">
      <Label>Quick Issue Selection</Label>
      <div className="grid grid-cols-2 gap-2">
        {commonIssues.map((issue) => (
          <Button
            key={issue}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setFormData(prev => ({
                ...prev,
                title: issue,
                category: issue === 'Other' ? '' : issue,
              }));
            }}
            className={cn(
              "justify-start text-xs h-auto py-2",
              formData.title === issue && "border-blue-500 bg-blue-50"
            )}
          >
            {issue}
          </Button>
        ))}
      </div>
    </div>
  );

  const SeveritySelector = () => (
    <div className="space-y-3">
      <Label>Severity Level</Label>
      <RadioGroup
        value={formData.severity}
        onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value }))}
      >
        {Object.entries(severityLevels).map(([level, config]) => {
          const Icon = config.icon;
          return (
            <div key={level} className="flex items-center space-x-2">
              <RadioGroupItem value={level} id={level} />
              <Label
                htmlFor={level}
                className="flex items-center gap-2 cursor-pointer flex-1"
              >
                <div className={cn('p-1 rounded', config.bgColor)}>
                  <Icon className={cn('w-4 h-4', config.color)} />
                </div>
                <div>
                  <div className="font-medium">{config.label}</div>
                  <div className="text-xs text-gray-500">{config.description}</div>
                </div>
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );

  if (submitted) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" className="gap-2">
              <Bug className="w-4 h-4" />
              Report Bug
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Bug Report Submitted!</h3>
            <p className="text-gray-600 mb-6">
              Thank you for helping us identify and fix this issue. Our team will investigate it promptly.
            </p>
            <Button onClick={handleClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Bug className="w-4 h-4" />
            Report Bug
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-red-600" />
            Report a Bug
          </DialogTitle>
          <DialogDescription>
            Help us improve by reporting technical issues or bugs you've encountered
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <QuickIssueSelector />

              <SeveritySelector />

              <div className="space-y-2">
                <Label htmlFor="title">Bug Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief description of the issue"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Please describe the issue in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="steps">Steps to Reproduce</Label>
                <Textarea
                  id="steps"
                  placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
                  value={formData.stepsToReproduce}
                  onChange={(e) => setFormData(prev => ({ ...prev, stepsToReproduce: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expected">Expected Behavior</Label>
                <Textarea
                  id="expected"
                  placeholder="What did you expect to happen?"
                  value={formData.expectedBehavior}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedBehavior: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actual">Actual Behavior</Label>
                <Textarea
                  id="actual"
                  placeholder="What actually happened?"
                  value={formData.actualBehavior}
                  onChange={(e) => setFormData(prev => ({ ...prev, actualBehavior: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">How often does this happen?</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">First time</SelectItem>
                    <SelectItem value="rarely">Rarely</SelectItem>
                    <SelectItem value="sometimes">Sometimes</SelectItem>
                    <SelectItem value="often">Often</SelectItem>
                    <SelectItem value="always">Every time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL (if applicable)</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://..."
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Screenshots</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    id="screenshots"
                    multiple
                    accept="image/*"
                    onChange={handleScreenshotChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="screenshots"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Camera className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Click to upload screenshots
                    </span>
                    <span className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB each
                    </span>
                  </label>
                </div>

                {screenshots.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Screenshots</Label>
                    {screenshots.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span className="text-sm truncate flex-1">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeScreenshot(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Auto-filled Information */}
          {(autoFillContext || formData.browserInfo) && (
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                <strong>System Information:</strong> Browser and device details have been automatically included to help us diagnose the issue.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" className="flex-1">
              <Send className="w-4 h-4 mr-2" />
              Submit Bug Report
            </Button>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BugReportForm;