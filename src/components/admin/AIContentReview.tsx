import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Edit3,
  Send,
  Clock,
  FileText,
  Shield,
  Target,
  Star,
  MessageSquare,
  RefreshCw,
  Save,
  Ban,
  Flag
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

interface ContentForReview {
  id: string;
  type: 'blog' | 'service' | 'email' | 'social';
  title?: string;
  content: string;
  authorId: string;
  authorName: string;
  generatedAt: string;
  qualityScore: number;
  seoScore: number;
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  metadata: {
    wordCount: number;
    language: string;
    tokensUsed: number;
    filterIssues: string[];
    requiresReview: boolean;
  };
  reviewHistory?: ReviewAction[];
}

interface ReviewAction {
  id: string;
  reviewerId: string;
  reviewerName: string;
  action: 'approve' | 'reject' | 'request_revision';
  comment: string;
  timestamp: string;
  suggestions?: string[];
}

interface QualityMetrics {
  readabilityScore: number;
  grammarScore: number;
  factualAccuracyScore: number;
  brandAlignmentScore: number;
  complianceScore: number;
  overallScore: number;
}

const AIContentReview = () => {
  const [contentQueue, setContentQueue] = useState<ContentForReview[]>([]);
  const [selectedContent, setSelectedContent] = useState<ContentForReview | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("queue");
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics | null>(null);
  const { toast } = useToast();

  // Load content queue on mount
  useEffect(() => {
    loadContentQueue();
  }, []);

  const loadContentQueue = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_generated_content')
        .select(`
          *,
          author:profiles(name)
        `)
        .eq('status', 'pending')
        .order('generated_at', { ascending: false });

      if (error) throw error;

      const formattedData: ContentForReview[] = (data || []).map(item => ({
        id: item.id,
        type: item.content_type,
        title: item.title,
        content: item.content,
        authorId: item.author_id,
        authorName: item.author?.name || 'Unknown',
        generatedAt: item.generated_at,
        qualityScore: item.quality_score || 0,
        seoScore: item.seo_score || 0,
        status: item.status,
        metadata: {
          wordCount: item.metadata?.wordCount || 0,
          language: item.metadata?.language || 'en',
          tokensUsed: item.metadata?.tokensUsed || 0,
          filterIssues: item.metadata?.filterIssues || [],
          requiresReview: item.metadata?.requiresReview || false
        },
        reviewHistory: item.review_history || []
      }));

      setContentQueue(formattedData);
    } catch (error) {
      logger.error('Error loading content queue:', error);
      toast({
        title: "Error",
        description: "Failed to load content queue",
        variant: "destructive"
      });
    }
  };

  const analyzeContentQuality = async (content: ContentForReview) => {
    setLoading(true);
    try {
      // Simulate quality analysis (in real implementation, this would call an AI service)
      const metrics: QualityMetrics = {
        readabilityScore: Math.floor(Math.random() * 30) + 70,
        grammarScore: Math.floor(Math.random() * 20) + 80,
        factualAccuracyScore: Math.floor(Math.random() * 25) + 75,
        brandAlignmentScore: Math.floor(Math.random() * 20) + 80,
        complianceScore: Math.floor(Math.random() * 15) + 85,
        overallScore: 0
      };

      metrics.overallScore = Math.round(
        (metrics.readabilityScore * 0.25 +
         metrics.grammarScore * 0.20 +
         metrics.factualAccuracyScore * 0.25 +
         metrics.brandAlignmentScore * 0.15 +
         metrics.complianceScore * 0.15)
      );

      setQualityMetrics(metrics);
    } catch (error) {
      logger.error('Error analyzing content quality:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContentSelect = (content: ContentForReview) => {
    setSelectedContent(content);
    setReviewComment("");
    setSuggestions([]);
    setQualityMetrics(null);
    analyzeContentQuality(content);
  };

  const submitReview = async (action: 'approve' | 'reject' | 'request_revision') => {
    if (!selectedContent) return;

    setLoading(true);
    try {
      const reviewer = (await supabase.auth.getUser()).data.user;
      if (!reviewer) throw new Error('Not authenticated');

      const reviewAction: ReviewAction = {
        id: crypto.randomUUID(),
        reviewerId: reviewer.id,
        reviewerName: reviewer.user_metadata?.name || 'Admin',
        action,
        comment: reviewComment,
        timestamp: new Date().toISOString(),
        suggestions: suggestions.length > 0 ? suggestions : undefined
      };

      // Update content status
      const { error: updateError } = await supabase
        .from('ai_generated_content')
        .update({
          status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'needs_revision',
          review_history: [...(selectedContent.reviewHistory || []), reviewAction],
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewer.id
        })
        .eq('id', selectedContent.id);

      if (updateError) throw updateError;

      // Send notification aria-live="polite" aria-atomic="true" if needed
      if (action === 'request_revision') {
        await sendRevisionRequest(selectedContent, reviewAction);
      }

      toast({
        title: "Success",
        description: `Content ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'sent for revision'}`
      });

      // Reload queue and reset selection
      loadContentQueue();
      setSelectedContent(null);
      setReviewComment("");
      setSuggestions([]);

    } catch (error) {
      logger.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendRevisionRequest = async (content: ContentForReview, review: ReviewAction) => {
    // Send email or notification aria-live="polite" aria-atomic="true" to content author
    logger.info('Sending revision request for content:', content.id, 'Review:', review);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'needs_revision': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const addSuggestion = () => {
    if (reviewComment.trim()) {
      setSuggestions([...suggestions, reviewComment.trim()]);
      setReviewComment("");
    }
  };

  const removeSuggestion = (index: number) => {
    setSuggestions(suggestions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          <h2 className="text-3xl font-serif">AI Content Review</h2>
          {contentQueue.length > 0 && (
            <Badge variant="secondary">{contentQueue.length} pending</Badge>
          )}
        </div>
        <Button onClick={loadContentQueue} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="queue">Review Queue</TabsTrigger>
          <TabsTrigger value="review">Content Review</TabsTrigger>
          <TabsTrigger value="analytics">Review Analytics</TabsTrigger>
        </TabsList>

        {/* Review Queue */}
        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              {contentQueue.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No content pending review</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contentQueue.map((content) => (
                    <div
                      key={content.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedContent?.id === content.id ? 'border-primary bg-muted/30' : 'border-border'
                      }`}
                      onClick={() => handleContentSelect(content)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {content.type}
                            </Badge>
                            <Badge className={`text-xs ${getStatusColor(content.status)}`}>
                              {content.status.replace('_', ' ')}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {content.metadata.language}
                            </Badge>
                          </div>
                          {content.title && (
                            <h3 className="font-medium truncate mb-1">{content.title}</h3>
                          )}
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {content.content.substring(0, 150)}...
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>By {content.authorName}</span>
                            <span>{content.metadata.wordCount} words</span>
                            <span>{new Date(content.generatedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              <span className={`text-sm font-medium ${getScoreColor(content.qualityScore)}`}>
                                {content.qualityScore}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              <span className={`text-sm font-medium ${getScoreColor(content.seoScore)}`}>
                                SEO: {content.seoScore}
                              </span>
                            </div>
                            {content.metadata.requiresReview && (
                              <AlertTriangle className="w-3 h-3 text-yellow-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Review */}
        <TabsContent value="review" className="space-y-4">
          {selectedContent ? (
            <>
              {/* Content Details */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {selectedContent.title || 'Untitled Content'}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{selectedContent.type}</Badge>
                      <Badge className={getStatusColor(selectedContent.status)}>
                        {selectedContent.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label>Author</Label>
                      <p className="font-medium">{selectedContent.authorName}</p>
                    </div>
                    <div>
                      <Label>Generated</Label>
                      <p className="font-medium">
                        {new Date(selectedContent.generatedAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <Label>Language</Label>
                      <p className="font-medium">{selectedContent.metadata.language}</p>
                    </div>
                    <div>
                      <Label>Word Count</Label>
                      <p className="font-medium">{selectedContent.metadata.wordCount}</p>
                    </div>
                  </div>

                  {selectedContent.metadata.filterIssues.length > 0 && (
                    <Alert>
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription>
                        <div className="font-medium mb-1">Filter Issues:</div>
                        <ul className="list-disc list-inside text-sm">
                          {selectedContent.metadata.filterIssues.map((issue, idx) => (
                            <li key={idx}>{issue}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div>
                    <Label>Content Preview</Label>
                    <ScrollArea className="h-40 w-full border rounded-md p-3 mt-2">
                      <pre className="whitespace-pre-wrap text-sm font-sans">
                        {selectedContent.content}
                      </pre>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>

              {/* Quality Metrics */}
              {qualityMetrics && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Quality Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Overall Score</Label>
                        <span className={`font-bold ${getScoreColor(qualityMetrics.overallScore)}`}>
                          {qualityMetrics.overallScore}/100
                        </span>
                      </div>
                      <Progress value={qualityMetrics.overallScore} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <Label className="text-sm">Readability</Label>
                          <span className="text-sm font-medium">{qualityMetrics.readabilityScore}%</span>
                        </div>
                        <Progress value={qualityMetrics.readabilityScore} className="h-1" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <Label className="text-sm">Grammar</Label>
                          <span className="text-sm font-medium">{qualityMetrics.grammarScore}%</span>
                        </div>
                        <Progress value={qualityMetrics.grammarScore} className="h-1" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <Label className="text-sm">Factual Accuracy</Label>
                          <span className="text-sm font-medium">{qualityMetrics.factualAccuracyScore}%</span>
                        </div>
                        <Progress value={qualityMetrics.factualAccuracyScore} className="h-1" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <Label className="text-sm">Brand Alignment</Label>
                          <span className="text-sm font-medium">{qualityMetrics.brandAlignmentScore}%</span>
                        </div>
                        <Progress value={qualityMetrics.brandAlignmentScore} className="h-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Review Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Review Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Review Comment</Label>
                    <Textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Add your review comments..."
                      rows={3}
                    />
                    <Button
                      onClick={addSuggestion}
                      variant="outline"
                      size="sm"
                      disabled={!reviewComment.trim()}
                    >
                      Add as Suggestion
                    </Button>
                  </div>

                  {suggestions.length > 0 && (
                    <div className="space-y-2">
                      <Label>Suggestions for Author</Label>
                      <div className="space-y-2">
                        {suggestions.map((suggestion, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-2 bg-muted rounded">
                            <span className="text-sm flex-1">{suggestion}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSuggestion(idx)}
                            >
                              <XCircle className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => submitReview('approve')}
                      disabled={loading}
                      className="flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => submitReview('request_revision')}
                      disabled={loading}
                      variant="outline"
                      className="flex-1"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Request Revision
                    </Button>
                    <Button
                      onClick={() => submitReview('reject')}
                      disabled={loading}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Review History */}
              {selectedContent.reviewHistory && selectedContent.reviewHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Review History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedContent.reviewHistory.map((review) => (
                        <div key={review.id} className="border-l-2 border-muted pl-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{review.reviewerName}</span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className={`mb-2 ${
                              review.action === 'approve' ? 'border-green-500 text-green-700' :
                              review.action === 'reject' ? 'border-red-500 text-red-700' :
                              'border-yellow-500 text-yellow-700'
                            }`}
                          >
                            {review.action.replace('_', ' ')}
                          </Badge>
                          {review.comment && (
                            <p className="text-sm mt-2">{review.comment}</p>
                          )}
                          {review.suggestions && review.suggestions.length > 0 && (
                            <ul className="list-disc list-inside text-sm mt-2 text-muted-foreground">
                              {review.suggestions.map((suggestion, idx) => (
                                <li key={idx}>{suggestion}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <Eye className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Select content from the queue to review</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-sm text-muted-foreground">Approved Today</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">0</div>
                  <div className="text-sm text-muted-foreground">Revisions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">0</div>
                  <div className="text-sm text-muted-foreground">Rejected</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">0</div>
                  <div className="text-sm text-muted-foreground">Avg Review Time</div>
                </div>
              </div>
              <div className="text-center text-muted-foreground">
                Analytics will be available after processing reviews
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIContentReview;