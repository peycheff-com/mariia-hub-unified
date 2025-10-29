import React, { useState } from 'react';
import {
  MessageSquare,
  Bot,
  User,
  Clock,
  CheckCircle,
  Edit3,
  Save,
  X,
  Sparkles,
  Send,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Review, ReviewResponseTemplate } from '@/types/review';

interface ReviewResponseProps {
  review: Review;
  response?: string;
  templates?: ReviewResponseTemplate[];
  onResponseSubmit?: (response: string) => Promise<void>;
  onResponseEdit?: (response: string) => Promise<void>;
  isSubmitting?: boolean;
  isEditing?: boolean;
  canRespond?: boolean;
  canEdit?: boolean;
  showTemplates?: boolean;
  aiGenerated?: boolean;
  sentiment?: 'positive' | 'negative' | 'neutral';
  className?: string;
}

export const ReviewResponse: React.FC<ReviewResponseProps> = ({
  review,
  response,
  templates = [],
  onResponseSubmit,
  onResponseEdit,
  isSubmitting = false,
  isEditing = false,
  canRespond = true,
  canEdit = true,
  showTemplates = true,
  aiGenerated = false,
  sentiment,
  className = ''
}) => {
  const [newResponse, setNewResponse] = useState('');
  const [editResponse, setEditResponse] = useState(response || '');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const hasResponse = !!review.ai_response && !!review.responded_at;
  const isEditingResponse = isEditing || (!hasResponse && canRespond);

  const getSentimentColor = (sent?: string) => {
    switch (sent) {
      case 'positive':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'negative':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'neutral':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getSentimentIcon = (sent?: string) => {
    switch (sent) {
      case 'positive':
        return '😊';
      case 'negative':
        return '😔';
      case 'neutral':
        return '😐';
      default:
        return '📝';
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      let responseText = template.template_text;

      // Replace template variables
      responseText = responseText.replace(
        /\{(\w+)\}/g,
        (match, key) => {
          switch (key) {
            case 'customer_name':
              return review.client_id ? 'Valued Customer' : 'Guest';
            case 'service_name':
              return 'Our Service';
            case 'rating':
              return review.rating.toString();
            case 'contact_info':
              return 'our support team';
            default:
              return match;
          }
        }
      );

      if (isEditing && hasResponse) {
        setEditResponse(responseText);
      } else {
        setNewResponse(responseText);
      }
      setSelectedTemplate(templateId);
    }
  };

  const handleGenerateAIResponse = async () => {
    setIsGeneratingAI(true);

    // Simulate AI generation
    setTimeout(() => {
      const aiResponse = generateAIResponse(review);
      if (isEditing && hasResponse) {
        setEditResponse(aiResponse);
      } else {
        setNewResponse(aiResponse);
      }
      setIsGeneratingAI(false);
    }, 1500);
  };

  const generateAIResponse = (reviewData: Review): string => {
    const responses = {
      positive: [
        "Thank you so much for your wonderful review! We're thrilled that you had a great experience and look forward to welcoming you back soon.",
        "We're so grateful for your positive feedback! It's wonderful to hear you enjoyed your visit. Your satisfaction is our top priority.",
        "Thank you for taking the time to share your experience! We're delighted you had a positive experience and can't wait to see you again."
      ],
      neutral: [
        "Thank you for your feedback. We appreciate you sharing your experience and will take your comments into consideration as we continually improve.",
        "We appreciate you taking the time to review your visit. We're always looking for ways to enhance our services.",
        "Thank you for your honest feedback. We value all input from our clients as it helps us improve."
      ],
      negative: [
        "We're sorry to hear that your experience didn't meet expectations. We take all feedback seriously and would like to understand more about what went wrong. Please reach out to us directly so we can make this right.",
        "We apologize for falling short of your expectations. Your feedback is valuable to us, and we'd appreciate the opportunity to address your concerns.",
        "We're sorry to hear about your experience. We're committed to providing excellent service and would like to learn more about how we can improve."
      ]
    };

    const category = review.rating >= 4 ? 'positive' : review.rating <= 2 ? 'negative' : 'neutral';
    const categoryResponses = responses[category as keyof typeof responses];
    return categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
  };

  const handleSubmit = async () => {
    const responseText = isEditing && hasResponse ? editResponse : newResponse;
    if (!responseText.trim()) return;

    if (isEditing && hasResponse) {
      await onResponseEdit?.(responseText);
    } else {
      await onResponseSubmit?.(responseText);
    }
  };

  const handleCancel = () => {
    if (isEditing && hasResponse) {
      setEditResponse(review.ai_response || '');
    } else {
      setNewResponse('');
    }
    setSelectedTemplate('');
  };

  if (!isEditingResponse && hasResponse) {
    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">Response from Business</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(review.responded_at!).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {aiGenerated && (
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Generated
                </Badge>
              )}

              {review.ai_response_sentiment && (
                <Badge
                  variant="outline"
                  className={`text-xs ${getSentimentColor(review.ai_response_sentiment)}`}
                >
                  {getSentimentIcon(review.ai_response_sentiment)}
                  {review.ai_response_sentiment}
                </Badge>
              )}

              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <p className="text-sm">{review.ai_response}</p>
          {review.ai_confidence && (
            <p className="text-xs text-muted-foreground mt-2">
              AI Confidence: {Math.round(review.ai_confidence * 100)}%
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (isEditingResponse) {
    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">
                {hasResponse ? 'Edit Response' : 'Write a Response'}
              </p>
              <p className="text-xs text-muted-foreground">
                {hasResponse ? 'Update your response' : 'Respond to this review'}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Template Selection */}
          {showTemplates && templates.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-medium">Use a template:</label>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates
                    .filter(t =>
                      !t.rating_range ||
                      (review.rating >= t.rating_range.start && review.rating < t.rating_range.end)
                    )
                    .map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* AI Generation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateAIResponse}
              disabled={isGeneratingAI}
            >
              {isGeneratingAI ? (
                <>
                  <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full mr-1" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 mr-1" />
                  Generate AI Response
                </>
              )}
            </Button>
          </div>

          {/* Response Textarea */}
          <Textarea
            value={isEditing && hasResponse ? editResponse : newResponse}
            onChange={(e) =>
              isEditing && hasResponse
                ? setEditResponse(e.target.value)
                : setNewResponse(e.target.value)
            }
            placeholder="Write your response here..."
            className="min-h-[100px] resize-none"
          />
        </CardContent>

        <CardFooter className="flex justify-end gap-2 pt-0">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!newResponse.trim() && !editResponse.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full mr-1" />
                Saving...
              </>
            ) : (
              <>
                {hasResponse ? (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    Update
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1" />
                    Respond
                  </>
                )}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return null;
};

export default ReviewResponse;