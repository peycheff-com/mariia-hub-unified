import { useState, useEffect } from "react";
import { Star, Check, X, Eye, EyeOff } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface Review {
  id: string;
  title: string | null;
  content: string;
  rating: number;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
  services: {
    title: string;
  } | null;
}

const ReviewManagement = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadReviews();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('reviews-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews'
        },
        () => {
          loadReviews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadReviews = async () => {
    const { data, error } = await (supabase as any)
      .from("reviews")
      .select(`
        *,
        profiles (
          full_name,
          email
        ),
        services (
          title
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setReviews(data || []);
    }
    setLoading(false);
  };

  const toggleApproval = async (reviewId: string, currentStatus: boolean) => {
    const { error } = await (supabase as any)
      .from("reviews")
      .update({ is_approved: !currentStatus })
      .eq("id", reviewId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: !currentStatus ? "Review approved" : "Review unapproved",
      });
      loadReviews();
    }
  };

  const toggleFeatured = async (reviewId: string, currentStatus: boolean) => {
    const { error } = await (supabase as any)
      .from("reviews")
      .update({ is_featured: !currentStatus })
      .eq("id", reviewId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: !currentStatus ? "Review featured" : "Review unfeatured",
      });
      loadReviews();
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    const { error } = await (supabase as any)
      .from("reviews")
      .delete()
      .eq("id", reviewId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Review deleted",
      });
      loadReviews();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-pearl">Loading reviews...</div>
      </div>
    );
  }

  const pendingReviews = reviews.filter((r) => !r.is_approved);
  const approvedReviews = reviews.filter((r) => r.is_approved);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-serif text-pearl">Review Management</h2>
        <div className="text-sm text-pearl/60">
          {pendingReviews.length} pending • {approvedReviews.length} approved
        </div>
      </div>

      {/* Pending Reviews */}
      {pendingReviews.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-serif text-pearl">Pending Approval</h3>
          <div className="grid gap-4">
            {pendingReviews.map((review) => (
              <Card key={review.id} className="border-champagne/30">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        {renderStars(review.rating)}
                        <Badge variant="outline" className="bg-champagne/20 text-champagne border-champagne/30">
                          Pending
                        </Badge>
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
                  <div className="flex items-center justify-between pt-3 border-t border-pearl/10">
                    <div className="text-sm text-pearl/60">
                      <span className="font-medium">{review.profiles.full_name}</span>
                      {review.services && <span> • {review.services.title}</span>}
                      <span> • {new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Approved Reviews */}
      <div className="space-y-4">
        <h3 className="text-xl font-serif text-pearl">Approved Reviews</h3>
        {approvedReviews.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-pearl/60">No approved reviews yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {approvedReviews.map((review) => (
              <Card key={review.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        {renderStars(review.rating)}
                        {review.is_featured && (
                          <Badge className="bg-lip-rose/20 text-lip-rose border-lip-rose/30">
                            Featured
                          </Badge>
                        )}
                      </div>
                      {review.title && (
                        <CardTitle className="text-lg">{review.title}</CardTitle>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={review.is_featured}
                          onCheckedChange={() => toggleFeatured(review.id, review.is_featured)}
                        />
                        <span className="text-sm text-pearl/70">Featured</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleApproval(review.id, review.is_approved)}
                      >
                        <EyeOff className="w-4 h-4 mr-1" />
                        Unapprove
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => deleteReview(review.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-pearl/80">{review.content}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-pearl/10">
                    <div className="text-sm text-pearl/60">
                      <span className="font-medium">{review.profiles.full_name}</span>
                      {review.services && <span> • {review.services.title}</span>}
                      <span> • {new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewManagement;
