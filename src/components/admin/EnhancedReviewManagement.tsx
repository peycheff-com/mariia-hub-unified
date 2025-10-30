import { useState, useEffect } from "react";
import {
  Star,
  Check,
  X,
  Eye,
  EyeOff,
  MessageSquare,
  Camera,
  Shield,
  Flag,
  ThumbsUp,
  AlertTriangle,
  Search,
  Filter,
  Download,
  ExternalLink,
  RefreshCw,
  Zap,
  UserCheck,
  Ban,
  Sparkles,
  Clock,
  TrendingUp
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";
import { ReviewCard } from "@/components/reviews/ReviewCard";


interface Review {
  id: string;
  title: string | null;
  content: string;
  rating: number;
  is_approved: boolean;
  is_featured: boolean;
  is_verified: boolean;
  verification_method: string | null;
  helpful_count: number;
  report_count: number;
  created_at: string;
  source_platform: string;
  sentiment_score: number;
  photos: string[];
  response_content: string | null;
  response_date: string | null;
  profiles: {
    full_name: string;
    email: string;
  };
  services: {
    title: string;
    service_type: string;
  } | null;
}

const EnhancedReviewManagement = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterVerification, setFilterVerification] = useState("all");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [responseContent, setResponseContent] = useState("");
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  useEffect(() => {
    loadReviews();
    const channel = supabase
      .channel('reviews-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reviews'
      }, () => loadReviews())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    filterReviews();
  }, [reviews, searchTerm, filterPlatform, filterRating, filterStatus, filterVerification]);

  const loadReviews = async () => {
    const { data, error } = await supabase
      .from("comprehensive_reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setReviews(data || []);
    }
    setLoading(false);
  };

  const filterReviews = () => {
    let filtered = reviews;

    if (searchTerm) {
      filtered = filtered.filter(review =>
        review.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.services?.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterPlatform !== "all") {
      filtered = filtered.filter(review => review.source_platform === filterPlatform);
    }

    if (filterRating !== "all") {
      filtered = filtered.filter(review => review.rating === parseInt(filterRating));
    }

    if (filterStatus !== "all") {
      if (filterStatus === "approved") {
        filtered = filtered.filter(review => review.is_approved);
      } else if (filterStatus === "pending") {
        filtered = filtered.filter(review => !review.is_approved);
      } else if (filterStatus === "featured") {
        filtered = filtered.filter(review => review.is_featured);
      }
    }

    if (filterVerification !== "all") {
      if (filterVerification === "verified") {
        filtered = filtered.filter(review => review.is_verified);
      } else if (filterVerification === "unverified") {
        filtered = filtered.filter(review => !review.is_verified);
      }
    }

    setFilteredReviews(filtered);
  };

  const toggleApproval = async (reviewId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("reviews")
      .update({ is_approved: !currentStatus })
      .eq("id", reviewId);

    if (error) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast aria-live="polite" aria-atomic="true"({
        title: "Success",
        description: !currentStatus ? "Review approved" : "Review unapproved",
      });
      loadReviews();
    }
  };

  const toggleFeatured = async (reviewId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("reviews")
      .update({ is_featured: !currentStatus })
      .eq("id", reviewId);

    if (error) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast aria-live="polite" aria-atomic="true"({
        title: "Success",
        description: !currentStatus ? "Review featured" : "Review unfeatured",
      });
      loadReviews();
    }
  };

  const verifyReview = async (reviewId: string, verificationMethod: 'photo' | 'service' | 'manual') => {
    const { error } = await supabase
      .from("reviews")
      .update({
        is_verified: true,
        verification_method: verificationMethod
      })
      .eq("id", reviewId);

    if (error) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast aria-live="polite" aria-atomic="true"({
        title: "Success",
        description: "Review verified successfully",
      });

      // Log verification
      await supabase
        .from("review_verifications")
        .insert({
          review_id: reviewId,
          verification_type: verificationMethod,
          verification_status: 'approved',
          verification_data: { verified_by: 'admin' }
        });

      loadReviews();
    }
  };

  const submitResponse = async () => {
    if (!selectedReview || !responseContent.trim()) return;

    const { error } = await supabase
      .from("reviews")
      .update({
        response_content: responseContent.trim(),
        response_date: new Date().toISOString(),
        response_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq("id", selectedReview.id);

    if (error) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast aria-live="polite" aria-atomic="true"({
        title: "Success",
        description: "Response submitted",
      });
      setResponseContent("");
      setSelectedReview(null);
      loadReviews();
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) return;

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId);

    if (error) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast aria-live="polite" aria-atomic="true"({
        title: "Success",
        description: "Review deleted",
      });
      loadReviews();
    }
  };

  const bulkApprove = async () => {
    const { error } = await supabase
      .from("reviews")
      .update({ is_approved: true })
      .in("id", selectedReviews);

    if (error) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast aria-live="polite" aria-atomic="true"({
        title: "Success",
        description: `${selectedReviews.length} reviews approved`,
      });
      setSelectedReviews([]);
      loadReviews();
    }
  };

  const syncExternalReviews = async (platform: 'google' | 'booksy') => {
    setIsSyncing(true);

    // Create sync log
    const { data: syncLog, error: syncError } = await supabase
      .from("external_review_syncs")
      .insert({
        platform,
        sync_type: 'import',
        status: 'pending'
      })
      .select()
      .single();

    if (syncError) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: "Failed to start sync process",
        variant: "destructive",
      });
      setIsSyncing(false);
      return;
    }

    // Call edge function for sync
    try {
      const { data, error } = await supabase.functions.invoke(`sync-${platform}-reviews`, {
        body: { syncId: syncLog.id }
      });

      if (error) throw error;

      toast aria-live="polite" aria-atomic="true"({
        title: "Sync started",
        description: `Importing reviews from ${platform}...`,
      });

      // Poll for completion
      const checkStatus = async () => {
        const { data: log } = await supabase
          .from("external_review_syncs")
          .select("status, imported_reviews, error_message")
          .eq("id", syncLog.id)
          .single();

        if (log?.status === 'success') {
          toast aria-live="polite" aria-atomic="true"({
            title: "Sync completed",
            description: `Imported ${log.imported_reviews} reviews from ${platform}`,
          });
          loadReviews();
          setIsSyncing(false);
        } else if (log?.status === 'failed') {
          toast aria-live="polite" aria-atomic="true"({
            title: "Sync failed",
            description: log.error_message || "Unknown error",
            variant: "destructive",
          });
          setIsSyncing(false);
        } else {
          setTimeout(checkStatus, 2000);
        }
      };

      setTimeout(checkStatus, 2000);
    } catch (error: any) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsSyncing(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "fill-champagne text-champagne" : "text-pearl/30"
            }`}
          />
        ))}
      </div>
    );
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return 'text-emerald';
    if (score < -0.3) return 'text-rose';
    return 'text-amber';
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'google': return '🔍';
      case 'booksy': return '📚';
      case 'instagram': return '📷';
      case 'facebook': return '📘';
      default: return '✨';
    }
  };

  const pendingReviews = filteredReviews.filter(r => !r.is_approved);
  const flaggedReviews = filteredReviews.filter(r => r.report_count > 0);
  const unverifiedReviews = filteredReviews.filter(r => !r.is_verified && r.photos && r.photos.length > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-pearl">Loading reviews...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif text-pearl">Review Management</h2>
          <p className="text-pearl/60 mt-1">
            {pendingReviews.length} pending • {flaggedReviews.length} flagged • {unverifiedReviews.length} unverified with photos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => syncExternalReviews('google')}
            disabled={isSyncing}
            className="text-pearl/70 hover:text-champagne"
          >
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Sync Google
          </Button>

          <Button
            variant="outline"
            onClick={() => syncExternalReviews('booksy')}
            disabled={isSyncing}
            className="text-pearl/70 hover:text-champagne"
          >
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Sync Booksy
          </Button>

          {selectedReviews.length > 0 && (
            <Button onClick={bulkApprove} className="bg-champagne hover:bg-champagne/90">
              Approve Selected ({selectedReviews.length})
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="border-champagne/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-pearl/50" />
                <Input
                  placeholder="Search reviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Platform</Label>
              <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="mariia_hub">Mariia Hub</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="booksy">Booksy</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Rating</Label>
              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Verification</Label>
              <Select value={filterVerification} onValueChange={setFilterVerification}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reviews</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingReviews.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-rose text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingReviews.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="flagged">
            Flagged
            {flaggedReviews.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-amber text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {flaggedReviews.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingReviews.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-pearl/60">No pending reviews</p>
              </CardContent>
            </Card>
          ) : (
            pendingReviews.map((review) => (
              <Card key={review.id} className="border-champagne/30">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        {renderStars(review.rating)}
                        <Badge variant="outline" className="bg-amber/20 text-amber border-amber/30">
                          Pending
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getPlatformIcon(review.source_platform)}
                          {review.source_platform}
                        </Badge>
                        {review.photos && review.photos.length > 0 && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Camera className="w-3 h-3" />
                            {review.photos.length}
                          </Badge>
                        )}
                      </div>
                      {review.title && (
                        <CardTitle className="text-lg">{review.title}</CardTitle>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-sage/20 text-sage hover:bg-sage/30"
                        onClick={() => toggleApproval(review.id, review.is_approved)}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedReview(review)}
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Respond
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Respond to Review</DialogTitle>
                            <DialogDescription>
                              Write a response to {review.profiles.full_name}'s review
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Textarea
                              placeholder="Write your response..."
                              value={responseContent}
                              onChange={(e) => setResponseContent(e.target.value)}
                              rows={4}
                            />
                            <div className="flex gap-2">
                              <Button onClick={submitResponse} disabled={!responseContent.trim()}>
                                Submit Response
                              </Button>
                              <Button variant="outline" onClick={() => setSelectedReview(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-destructive/20 text-destructive hover:bg-destructive/30"
                        onClick={() => deleteReview(review.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-pearl/80">{review.content}</p>

                  {review.photos && review.photos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {review.photos.slice(0, 4).map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Review photo ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-pearl/10">
                    <div className="text-sm text-pearl/60">
                      <span className="font-medium">{review.profiles.full_name}</span>
                      {review.services && <span> • {review.services.title}</span>}
                      <span> • {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className={`flex items-center gap-1 ${getSentimentColor(review.sentiment_score || 0)}`}>
                        <TrendingUp className="w-4 h-4" />
                        {Math.round((review.sentiment_score || 0) * 100)}%
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        {review.helpful_count}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {filteredReviews.filter(r => r.is_approved).map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              showActions={true}
              onReply={(reviewId) => {
                const review = filteredReviews.find(r => r.id === reviewId);
                if (review) setSelectedReview(review);
              }}
            />
          ))}
        </TabsContent>

        <TabsContent value="flagged" className="space-y-4">
          {flaggedReviews.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-pearl/60">No flagged reviews</p>
              </CardContent>
            </Card>
          ) : (
            flaggedReviews.map((review) => (
              <Card key={review.id} className="border-amber/30">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber" />
                    <span className="text-amber">Flagged for review</span>
                    <Badge variant="outline">{review.report_count} reports</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ReviewCard review={review} showActions={true} />
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="verified" className="space-y-4">
          {filteredReviews.filter(r => r.is_verified).map((review) => (
            <Card key={review.id} className="border-emerald/30">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-emerald" />
                  <span className="text-emerald">Verified Review</span>
                  <Badge variant="outline" className="bg-emerald/20 text-emerald border-emerald/30">
                    {review.verification_method}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ReviewCard review={review} showActions={true} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedReviewManagement;