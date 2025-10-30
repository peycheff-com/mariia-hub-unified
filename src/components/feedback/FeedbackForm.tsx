import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Bug, Lightbulb, Send, Paperclip, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast aria-live="polite" aria-atomic="true"';
import { useFeedback, useFeedbackTemplates } from '@/hooks/useFeedback';
import { Enums } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

interface FeedbackFormProps {
  feedbackType?: Enums['feedback_type'];
  bookingId?: string;
  serviceId?: string;
  title?: string;
  description?: string;
  trigger?: React.ReactNode;
  onComplete?: (feedbackId: string) => void;
  className?: string;
}

const feedbackTypeConfig = {
  service_rating: {
    icon: Star,
    label: 'Service Rating',
    description: 'Rate your experience with our service',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  post_booking_review: {
    icon: MessageSquare,
    label: 'Post-Booking Review',
    description: 'Share your experience after your appointment',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  bug_report: {
    icon: Bug,
    label: 'Bug Report',
    description: 'Report technical issues or bugs',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  feature_request: {
    icon: Lightbulb,
    label: 'Feature Request',
    description: 'Suggest new features or improvements',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  general_feedback: {
    icon: MessageSquare,
    label: 'General Feedback',
    description: 'Share your thoughts and suggestions',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
  nps_survey: {
    icon: Star,
    label: 'NPS Survey',
    description: 'How likely are you to recommend us?',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  user_experience: {
    icon: MessageSquare,
    label: 'User Experience',
    description: 'Help us improve your experience',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
  customer_support: {
    icon: MessageSquare,
    label: 'Customer Support',
    description: 'Rate your support experience',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  payment_experience: {
    icon: MessageSquare,
    label: 'Payment Experience',
    description: 'Share your payment process experience',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
};

interface FormData {
  feedback_type: Enums['feedback_type'];
  title: string;
  content: string;
  rating: number | null;
  category: string;
  priority: Enums['feedback_priority'];
  attachments: File[];
  tags: string[];
}

const categories = {
  service_rating: ['Service Quality', 'Staff Professionalism', 'Cleanliness', 'Value for Money', 'Overall Experience'],
  post_booking_review: ['Booking Process', 'Service Quality', 'Staff Professionalism', 'Location', 'Value for Money'],
  bug_report: ['Website Issue', 'Mobile App Issue', 'Booking System', 'Payment Issue', 'Other Technical Issue'],
  feature_request: ['New Service', 'Website Improvement', 'Mobile App Feature', 'Booking Enhancement', 'Other'],
  general_feedback: ['Compliment', 'Complaint', 'Suggestion', 'Question', 'Other'],
  user_experience: ['Navigation', 'Design', 'Performance', 'Accessibility', 'Overall UX'],
  customer_support: ['Response Time', 'Helpfulness', 'Professionalism', 'Resolution', 'Overall Experience'],
  payment_experience: ['Ease of Use', 'Security', 'Speed', 'Options', 'Overall Experience'],
};

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  feedbackType = 'general_feedback',
  bookingId,
  serviceId,
  title,
  description,
  trigger,
  onComplete,
  className,
}) => {
  const { toast aria-live="polite" aria-atomic="true" } = useToast();
  const { submitFeedback, submitting } = useFeedback({ bookingId, serviceId });
  const { getTemplate } = useFeedbackTemplates();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    feedback_type: feedbackType,
    title: '',
    content: '',
    rating: null,
    category: '',
    priority: 'medium',
    attachments: [],
    tags: [],
  });
  const [template, setTemplate] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('basic');

  const config = feedbackTypeConfig[feedbackType];

  useEffect(() => {
    const loadTemplate = async () => {
      const templateData = await getTemplate(feedbackType);
      setTemplate(templateData);
    };
    loadTemplate();
  }, [feedbackType, getTemplate]);

  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }));
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.content.trim()) {
      toast aria-live="polite" aria-atomic="true"({
        title: 'Validation Error',
        description: 'Please provide feedback content',
        variant: 'destructive',
      });
      return;
    }

    try {
      const feedbackData = {
        feedback_type: formData.feedback_type,
        title: formData.title || config.label,
        content: formData.content,
        rating: formData.rating,
        category: formData.category || null,
        priority: formData.priority,
        tags: formData.tags,
        booking_id: bookingId || null,
        service_id: serviceId || null,
        metadata: {
          has_attachments: formData.attachments.length > 0,
          attachment_count: formData.attachments.length,
        },
      };

      const result = await submitFeedback(feedbackData);

      if (result) {
        // Upload attachments if any
        if (formData.attachments.length > 0) {
          await uploadAttachments(result.id, formData.attachments);
        }

        toast aria-live="polite" aria-atomic="true"({
          title: 'Thank you for your feedback!',
          description: 'Your feedback has been submitted successfully.',
        });

        setOpen(false);
        onComplete?.(result.id);

        // Reset form
        setFormData({
          feedback_type: feedbackType,
          title: '',
          content: '',
          rating: null,
          category: '',
          priority: 'medium',
          attachments: [],
          tags: [],
        });
      }
    } catch (error: any) {
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: error.message || 'Failed to submit feedback',
        variant: 'destructive',
      });
    }
  };

  const uploadAttachments = async (feedbackId: string, files: File[]) => {
    for (const file of files) {
      const filePath = `feedback/${feedbackId}/${file.name}`;
      const { error } = await supabase.storage
        .from('feedback-attachments')
        .upload(filePath, file);

      if (error) {
        console.error('Error uploading attachment:', error);
      }
    }
  };

  const renderRatingStars = () => {
    if (!['service_rating', 'post_booking_review', 'customer_support', 'payment_experience'].includes(feedbackType)) {
      return null;
    }

    return (
      <div className="space-y-2">
        <Label>Rating</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingChange(star)}
              className="p-1 hover:scale-110 transition-transform"
            >
              <Star
                className={cn(
                  'w-8 h-8',
                  star <= (formData.rating || 0)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                )}
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderNPSRating = () => {
    if (feedbackType !== 'nps_survey') {
      return null;
    }

    return (
      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          How likely are you to recommend us to friends and colleagues?
        </Label>
        <div className="flex gap-2 justify-between">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
            <button
              key={score}
              type="button"
              onClick={() => handleRatingChange(score)}
              className={cn(
                'w-10 h-10 rounded-lg border-2 font-semibold transition-colors',
                formData.rating === score
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              )}
            >
              {score}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Not likely</span>
          <span>Very likely</span>
        </div>
      </div>
    );
  };

  const renderTemplateQuestions = () => {
    if (!template || !template.template_config?.questions) {
      return null;
    }

    return (
      <div className="space-y-4">
        {template.template_config.questions.map((question: any, index: number) => {
          switch (question.type) {
            case 'rating':
              return (
                <div key={index} className="space-y-2">
                  <Label>{question.label}</Label>
                  <div className="flex gap-1">
                    {[...Array(question.max - question.min + 1)].map((_, i) => {
                      const rating = question.min + i;
                      return (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => handleRatingChange(rating)}
                          className="p-1"
                        >
                          <Star
                            className={cn(
                              'w-6 h-6',
                              rating <= (formData.rating || 0)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            case 'textarea':
              return (
                <div key={index} className="space-y-2">
                  <Label>{question.label}</Label>
                  <Textarea
                    placeholder={question.placeholder || 'Enter your response...'}
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    required={question.required}
                  />
                </div>
              );
            default:
              return null;
          }
        })}
      </div>
    );
  };

  const FormContent = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
        <config.icon className={cn('w-6 h-6', config.color)} />
        <div>
          <h3 className="font-semibold">{config.label}</h3>
          <p className="text-sm text-gray-600">{config.description}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          {template ? (
            renderTemplateQuestions()
          ) : (
            <>
              {renderNPSRating()}
              {renderRatingStars()}

              {!template && (
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Brief title for your feedback"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="content">Feedback</Label>
                <Textarea
                  id="content"
                  placeholder="Please share your detailed feedback..."
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={5}
                  required
                />
              </div>

              {categories[feedbackType as keyof typeof categories] && (
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories[feedbackType as keyof typeof categories].map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="space-y-2">
            <Label>Priority</Label>
            <RadioGroup
              value={formData.priority}
              onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as Enums['feedback_priority'] }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="low" id="low" />
                <Label htmlFor="low">Low</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium">Medium</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high" id="high" />
                <Label htmlFor="high">High</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="urgent" id="urgent" />
                <Label htmlFor="urgent">Urgent</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {['urgent', 'follow-up', 'resolved', 'investigating'].map((tag) => (
                <Badge
                  key={tag}
                  variant={formData.tags.includes(tag) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      tags: prev.tags.includes(tag)
                        ? prev.tags.filter(t => t !== tag)
                        : [...prev.tags, tag],
                    }));
                  }}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="attachments" className="space-y-4">
          <div className="space-y-2">
            <Label>Attachments</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="attachments"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="attachments"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-gray-500">
                  Images, PDF, DOC files (max 10MB)
                </span>
              </label>
            </div>

            {formData.attachments.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files</Label>
                {formData.attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <span className="text-sm truncate flex-1">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={submitting}
          className="flex-1"
        >
          {submitting ? 'Submitting...' : 'Submit Feedback'}
          <Send className="w-4 h-4 ml-2" />
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );

  if (trigger) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title || config.label}</DialogTitle>
            <DialogDescription>
              {description || config.description}
            </DialogDescription>
          </DialogHeader>
          <FormContent />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <config.icon className={cn('w-5 h-5', config.color)} />
          {title || config.label}
        </CardTitle>
        <CardDescription>{description || config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <FormContent />
      </CardContent>
    </Card>
  );
};

export default FeedbackForm;