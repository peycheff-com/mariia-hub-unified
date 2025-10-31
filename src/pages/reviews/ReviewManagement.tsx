import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star,
  MessageSquare,
  Shield,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  Camera,
  Video,
  BarChart3,
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Review, ReviewVerification } from '@/types/review';
import ReviewAnalytics from '@/components/reviews/ReviewAnalytics';
import ReviewVerificationSystem from '@/components/reviews/ReviewVerificationSystem';
import ReviewResponse from '@/components/reviews/ReviewResponse';
import VerifiedBadge from '@/components/reviews/VerifiedBadge';
import { ReviewSecurityService } from '@/lib/review-security';
import { fraudDetector } from '@/lib/review-fraud-detection';
import { EnhancedReviewAggregator, scheduleReviewAggregation } from '@/integrations/social-media/enhanced-review-aggregator';

const ReviewManagement: React.FC = () => {
  const { tab = 'overview' } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [verifications, setVerifications] = useState<ReviewVerification[]>([]);
  const [isAggregating, setIsAggregating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:client_id (full_name, email),
          services:service_id (title, service_type),
          review_sources (platform, external_url, sync_date)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);

      // Load statistics
      const { data: statsData } = await supabase
        .from('review_statistics')
        .select('*')
        .single();

      setStatistics(statsData);

      // Load verifications for selected review
      if (selectedReview) {
        const { data: verificationsData } = await supabase
          .from('review_verifications')
          .select('*')
          .eq('review_id', selectedReview.id);

        setVerifications(verificationsData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load review data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (reviewId: string, action: string) => {
    try {
      switch (action) {
        case 'approve':
          await supabase
            .from('reviews')
            .update({ status: 'published' })
            .eq('id', reviewId);
          break;

        case 'hide':
          await supabase
            .from('reviews')
            .update({ status: 'hidden' })
            .eq('id', reviewId);
          break;

        case 'feature':
          await supabase
            .from('reviews')
            .update({ featured: true })
            .eq('id', reviewId);
          break;

        case 'verify':
          await fraudDetector.analyzeReview({ id: reviewId });
          await supabase
            .from('reviews')
            .update({ is_verified: true })
            .eq('id', reviewId);
          break;

        case 'delete':
          if (confirm('Are you sure you want to delete this review?')) {
            await supabase
              .from('reviews')
              .delete()
              .eq('id', reviewId);
          }
          break;
      }

      toast({
        title: 'Success',
        description: `Review ${action}d successfully`,
      });

      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${action} review`,
        variant: 'destructive',
      });
    }
  };

  const handleAggregateReviews = async () => {
    setIsAggregating(true);
    try {
      const aggregatedReviews = await scheduleReviewAggregation();
      toast({
        title: 'Success',
        description: `Aggregated ${aggregatedReviews.length} reviews from social platforms`,
      });
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to aggregate reviews',
        variant: 'destructive',
      });
    } finally {
      setIsAggregating(false);
    }
  };

  const handleExportReviews = async () => {
    try {
      const { data } = await supabase
        .from('reviews')
        .select('*, profiles!inner(full_name), services!inner(title)')
        .order('created_at', { ascending: false });

      if (!data) return;

      const csv = [
        ['Date', 'Reviewer', 'Service', 'Rating', 'Comment', 'Verified', 'Platform'],
        ...data.map(review => [
          review.created_at,
          review.profiles?.full_name || 'Anonymous',
          review.services?.title || 'N/A',
          review.rating,
          `"${review.comment || ''}"`,
          review.is_verified ? 'Yes' : 'No',
          review.review_sources?.[0]?.platform || 'Internal'
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reviews-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export reviews',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Review Management</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleAggregateReviews}
            disabled={isAggregating}
          >
            {isAggregating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Aggregating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Reviews
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleExportReviews}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviews.length}</div>
            <p className="text-xs text-muted-foreground">
              {reviews.filter(r => r.status === 'published').length} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reviews.length > 0
                ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                : '0.0'}
            </div>
            <p className="text-xs text-muted-foreground">Overall rating</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Reviews</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reviews.filter(r => r.is_verified).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {reviews.length > 0
                ? `${((reviews.filter(r => r.is_verified).length / reviews.length) * 100).toFixed(1)}%`
                : '0%'} verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Media Reviews</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reviews.filter(r => r.photos.length > 0 || r.videos.length > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {reviews.filter(r => r.photos.length > 0).length} photos,{' '}
              {reviews.filter(r => r.videos.length > 0).length} videos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(value) => navigate(`/reviews/${value}`)}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <ReviewAnalytics />
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <div className="grid gap-4">
            {reviews.map((review) => (
              <Card key={review.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{review.profiles?.full_name || 'Anonymous'}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <VerifiedBadge review={review} />
                  </div>
                  <div className="flex gap-2">
                    {review.status === 'published' ? (
                      <Badge variant="default">
                        <Eye className="w-3 h-3 mr-1" />
                        Published
                      </Badge>
                    ) : review.status === 'hidden' ? (
                      <Badge variant="secondary">
                        <EyeOff className="w-3 h-3 mr-1" />
                        Hidden
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                    {review.featured && (
                      <Badge variant="secondary">Featured</Badge>
                    )}
                    {review.is_fraud_suspected && (
                      <Badge variant="destructive">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Suspicious
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    {review.services && (
                      <Badge variant="outline" className="text-xs">
                        {review.services.title}
                      </Badge>
                    )}
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{review.helpful_count} helpful</span>
                    <span>{review.report_count} reports</span>
                    {review.photos.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Camera className="w-3 h-3" />
                        {review.photos.length} photos
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedReview(review)}
                    >
                      View Details
                    </Button>
                    {review.status !== 'published' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReviewAction(review.id, 'approve')}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                    )}
                  </div>
                </div>

                {/* Response */}
                {review.ai_response && (
                  <div className="mt-4 pt-4 border-t">
                    <ReviewResponse review={review} />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          {selectedReview ? (
            <div className="space-y-4">
              <Button
                variant="outline"
                onClick={() => setSelectedReview(null)}
              >
                ← Back to Reviews
              </Button>
              <ReviewVerificationSystem
                review={selectedReview}
                verifications={verifications}
                onManualVerification={async (type, status, details) => {
                  await supabase
                    .from('review_verifications')
                    .insert({
                      review_id: selectedReview.id,
                      verification_type: type,
                      status,
                      details,
                      verified_by: 'admin'
                    });
                  loadData();
                }}
                onReverify={async (reviewId) => {
                  const result = await fraudDetector.analyzeReview(selectedReview);
                  if (result.should_flag) {
                    await supabase
                      .from('reviews')
                      .update({
                        is_fraud_suspected: true,
                        fraud_score: result.fraud_score,
                        fraud_flags: result.flags
                      })
                      .eq('id', reviewId);
                  }
                  loadData();
                }}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Select a review to view verification details</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Review security monitoring and fraud detection system status.
              </p>
              {/* Add security dashboard content here */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium" htmlFor="auto-approve-reviews">Auto-approve reviews</label>
                <p className="text-xs text-muted-foreground">
                  Automatically publish reviews that pass verification
                </p>
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="require-photo-verification">Require photo verification</label>
                <p className="text-xs text-muted-foreground">
                  Require photos to have valid EXIF metadata for verification
                </p>
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="enable-ai-responses">Enable AI responses</label>
                <p className="text-xs text-muted-foreground">
                  Generate AI-powered responses to reviews
                </p>
              </div>
              {/* Add more settings */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReviewManagement;