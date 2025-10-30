import { useState, useEffect } from "react";
import { MessageSquare, Bot, Send, Save, Clock, CheckCircle, AlertCircle, Sparkles, History } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";

interface ResponseTemplate {
  id: string;
  name: string;
  rating_range_start: number;
  rating_range_end: number;
  service_type: string | null;
  template_content: string;
  is_active: boolean;
}

interface ReviewResponse {
  id: string;
  review_id: string;
  content: string;
  status: 'draft' | 'sent' | 'scheduled';
  scheduled_for: string | null;
  ai_generated: boolean;
  created_at: string;
  sent_at: string | null;
}

interface Review {
  id: string;
  title: string | null;
  content: string;
  rating: number;
  is_approved: boolean;
  created_at: string;
  profiles: {
    full_name: string;
  };
  services: {
    title: string;
    service_type: string;
  } | null;
  response_content: string | null;
  response_date: string | null;
}

interface ReviewResponseManagerProps {
  review: Review;
  onResponseSent?: () => void;
}

export const ReviewResponseManager = ({ review, onResponseSent }: ReviewResponseManagerProps) => {
  const [responseContent, setResponseContent] = useState("");
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [responses, setResponses] = useState<ReviewResponse[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  useEffect(() => {
    loadTemplates();
    loadResponseHistory();
  }, []);

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from("review_response_templates")
      .select("*")
      .eq("is_active", true)
      .order("rating_range_start");

    if (error) {
      console.error("Error loading templates:", error);
    } else {
      setTemplates(data || []);
    }
  };

  const loadResponseHistory = async () => {
    const { data, error } = await supabase
      .from("review_responses")
      .select("*")
      .eq("review_id", review.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading response history:", error);
    } else {
      setResponses(data || []);
    }
  };

  const generateAIResponse = async () => {
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-review-response', {
        body: {
          reviewContent: review.content,
          rating: review.rating,
          serviceTitle: review.services?.title,
          serviceType: review.services?.service_type,
          customerName: review.profiles.full_name
        }
      });

      if (error) throw error;

      setResponseContent(data.response);
      toast aria-live="polite" aria-atomic="true"({
        title: "AI Response Generated",
        description: "You can edit the response before sending",
      });
    } catch (error: any) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: error.message || "Failed to generate AI response",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setResponseContent(template.template_content);
      setSelectedTemplate(templateId);
    }
  };

  const saveDraft = async () => {
    if (!responseContent.trim()) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: "Please write a response before saving",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("review_responses")
        .insert({
          review_id: review.id,
          content: responseContent.trim(),
          status: 'draft',
          ai_generated: useAI
        });

      if (error) throw error;

      toast aria-live="polite" aria-atomic="true"({
        title: "Draft Saved",
        description: "Response saved as draft",
      });

      loadResponseHistory();
    } catch (error: any) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const sendResponse = async (schedule?: boolean) => {
    if (!responseContent.trim()) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: "Please write a response before sending",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      if (schedule && scheduledDate) {
        // Schedule response
        const { error } = await supabase
          .from("review_responses")
          .insert({
            review_id: review.id,
            content: responseContent.trim(),
            status: 'scheduled',
            scheduled_for: scheduledDate,
            ai_generated: useAI
          });

        if (error) throw error;

        toast aria-live="polite" aria-atomic="true"({
          title: "Response Scheduled",
          description: `Response scheduled for ${new Date(scheduledDate).toLocaleDateString()}`,
        });
      } else {
        // Send immediately
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase
          .from("reviews")
          .update({
            response_content: responseContent.trim(),
            response_date: new Date().toISOString(),
            response_by: user?.id
          })
          .eq("id", review.id);

        if (error) throw error;

        // Log the response
        await supabase
          .from("review_responses")
          .insert({
            review_id: review.id,
            content: responseContent.trim(),
            status: 'sent',
            sent_at: new Date().toISOString(),
            ai_generated: useAI
          });

        toast aria-live="polite" aria-atomic="true"({
          title: "Response Sent",
          description: "Your response has been published",
        });

        onResponseSent?.();
      }

      setResponseContent("");
      loadResponseHistory();
    } catch (error: any) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const getRelevantTemplates = () => {
    return templates.filter(template =>
      template.rating_range_start <= review.rating &&
      template.rating_range_end >= review.rating &&
      (!template.service_type || template.service_type === review.services?.service_type)
    );
  };

  const relevantTemplates = getRelevantTemplates();

  return (
    <Card className="border-champagne/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-champagne" />
              Response Manager
            </CardTitle>
            <CardDescription>
              Respond to {review.profiles.full_name}'s review
            </CardDescription>
          </div>

          {responses.length > 0 && (
            <Dialog open={showHistory} onOpenChange={setShowHistory}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <History className="w-4 h-4 mr-2" />
                  History ({responses.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Response History</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {responses.map((response) => (
                    <div key={response.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={
                          response.status === 'sent' ? 'default' :
                          response.status === 'scheduled' ? 'secondary' : 'outline'
                        }>
                          {response.status}
                        </Badge>
                        <div className="flex items-center gap-2 text-sm text-pearl/60">
                          {response.ai_generated && <Bot className="w-3 h-3" />}
                          {formatDistanceToNow(new Date(response.created_at), { addSuffix: true })}
                        </div>
                      </div>
                      <p className="text-sm text-pearl/80">{response.content}</p>
                      {response.scheduled_for && (
                        <p className="text-xs text-pearl/50 mt-2">
                          Scheduled for: {new Date(response.scheduled_for).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Review Summary */}
        <div className="p-3 bg-champagne/10 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-pearl">Review by {review.profiles.full_name}</span>
            <Badge variant="outline">{review.rating} stars</Badge>
          </div>
          <p className="text-sm text-pearl/70 line-clamp-2">{review.content}</p>
        </div>

        {/* AI Assistant Toggle */}
        <div className="flex items-center justify-between p-3 bg-sage/10 rounded-lg">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-sage" />
            <Label className="text-sm font-medium">AI Assistant</Label>
          </div>
          <Switch
            checked={useAI}
            onCheckedChange={setUseAI}
          />
        </div>

        {/* AI Generate Button */}
        {useAI && (
          <Button
            onClick={generateAIResponse}
            disabled={isGenerating}
            variant="outline"
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate AI Response
              </>
            )}
          </Button>
        )}

        {/* Template Selection */}
        {relevantTemplates.length > 0 && (
          <div className="space-y-2">
            <Label>Quick Templates</Label>
            <Select value={selectedTemplate} onValueChange={applyTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template..." />
              </SelectTrigger>
              <SelectContent>
                {relevantTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-pearl/50">
                        {template.rating_range_start}-{template.rating_range_end} stars
                        {template.service_type && ` • ${template.service_type}`}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Response Textarea */}
        <div className="space-y-2">
          <Label htmlFor="response">Your Response</Label>
          <Textarea
            id="response"
            placeholder="Write your response..."
            value={responseContent}
            onChange={(e) => setResponseContent(e.target.value)}
            rows={6}
          />
          <div className="text-right text-sm text-pearl/60">
            {responseContent.length} characters
          </div>
        </div>

        {/* Scheduling Option */}
        <div className="space-y-2">
          <Label>Schedule Response (Optional)</Label>
          <input
            type="datetime-local"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full px-3 py-2 bg-pearl/10 border border-champagne/30 rounded-lg text-pearl"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={saveDraft}
            disabled={isSaving || !responseContent.trim()}
            variant="outline"
            className="flex-1"
          >
            {isSaving ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </>
            )}
          </Button>

          <Button
            onClick={() => sendResponse()}
            disabled={isSending || !responseContent.trim()}
            className="flex-1 bg-champagne hover:bg-champagne/90"
          >
            {isSending ? (
              <>
                <Send className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Now
              </>
            )}
          </Button>

          {scheduledDate && (
            <Button
              onClick={() => sendResponse(true)}
              disabled={isSending || !responseContent.trim()}
              variant="outline"
            >
              <Clock className="w-4 h-4 mr-2" />
              Schedule
            </Button>
          )}
        </div>

        {/* Tips */}
        <div className="p-3 bg-amber/10 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber mt-0.5" />
            <div className="text-xs text-pearl/70">
              <p className="font-medium mb-1">Response Tips:</p>
              <ul className="space-y-0.5">
                <li>• Thank the customer for their feedback</li>
                <li>• Address specific points they mentioned</li>
                <li>• Offer solutions for any issues raised</li>
                <li>• Invite them back for future services</li>
                <li>• Keep it professional and genuine</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewResponseManager;