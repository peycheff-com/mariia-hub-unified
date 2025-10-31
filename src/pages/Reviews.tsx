import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Star,
  Filter,
  Search,
  Plus,
  Camera,
  Shield,
  TrendingUp,
  MessageSquare,
  ThumbsUp,
  Users,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import ReviewForm from "@/components/reviews/ReviewForm";
import { ReviewBadges } from "@/components/reviews/VerifiedBadges";
import { SEOHead } from "@/components/seo/SEOHead";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

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
  created_at: string;
  source_platform: string;
  photos: string[];
  response_content: string | null;
  response_date: string | null;
  profiles: {
    full_name: string;
    avatar_url?: string;
  };
  services: {
    title: string;
    service_type: string;
  } | null;
}

interface Stats {
  total_reviews: number;
  average_rating: number;
  rating_distribution: { [key: number]: number };
  verified_reviews: number;
  total_photos: number;
  response_rate: number;
}

export default function ReviewsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [filterRating, setFilterRating] = useState("all");
  const [filterService, setFilterService] = useState("all");
  const [filterVerified, setFilterVerified] = useState("all");
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [showFilters, setShowFilters] = useState(false);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    loadReviews();
    loadStats();
    loadServices();
  }, []);

  useEffect(() => {
    filterReviews();
  }, [reviews, sortBy, filterRating, filterService, filterVerified, searchTerm]);

  const loadReviews = async () => {
    const { data, error } = await supabase
      .from("comprehensive_reviews")
      .select("*")
      .eq("is_approved", true)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      });
    } else {
      setReviews(data || []);
    }
    setLoading(false);
  };

  const loadStats = async () => {
    const { data: reviews } = await supabase
      .from("reviews")
      .select("rating, is_verified, photos, response_content")
      .eq("is_approved", true);

    if (reviews) {
      const total = reviews.length;
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / total;
      const distribution = reviews.reduce((acc: { [key: number]: number }, r) => {
        acc[r.rating] = (acc[r.rating] || 0) + 1;
        return acc;
      }, {});
      const verified = reviews.filter(r => r.is_verified).length;
      const photos = reviews.reduce((sum, r) => sum + (r.photos?.length || 0), 0);
      const responseRate = (reviews.filter(r => r.response_content).length / total) * 100;

      setStats({
        total_reviews: total,
        average_rating: avgRating,
        rating_distribution: distribution,
        verified_reviews: verified,
        total_photos: photos,
        response_rate
      });
    }
  };

  const loadServices = async () => {
    const { data } = await supabase
      .from("services")
      .select("id, title, service_type")
      .eq("is_active", true)
      .order("title");

    if (data) {
      setServices(data);
    }
  };

  const filterReviews = () => {
    let filtered = [...reviews];

    // Rating filter
    if (filterRating !== "all") {
      filtered = filtered.filter(r => r.rating === parseInt(filterRating));
    }

    // Service filter
    if (filterService !== "all") {
      filtered = filtered.filter(r => r.service_id === filterService);
    }

    // Verified filter
    if (filterVerified === "verified") {
      filtered = filtered.filter(r => r.is_verified);
    } else if (filterVerified === "unverified") {
      filtered = filtered.filter(r => !r.is_verified);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.services?.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "rating_high":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "rating_low":
        filtered.sort((a, b) => a.rating - b.rating);
        break;
      case "helpful":
        filtered.sort((a, b) => b.helpful_count - a.helpful_count);
        break;
      case "verified":
        filtered.sort((a, b) => {
          if (a.is_verified === b.is_verified) return 0;
          return a.is_verified ? -1 : 1;
        });
        break;
    }

    return filtered;
  };

  const filteredReviews = filterReviews();

  const renderStars = (rating: number, size = "w-5 h-5") => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating
                ? "fill-champagne text-champagne"
                : "text-pearl/20"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <SEOHead
        title="Customer Reviews - Mariia Hub"
        description="Read authentic reviews from our satisfied customers. Discover why Mariia Hub is Warsaw's premier destination for beauty and fitness services."
        keywords="customer reviews, testimonials, beauty reviews, fitness reviews, Warsaw"
      />

      <div className="min-h-screen bg-gradient-to-b from-pearl to-champagne/5">
        {/* Hero Section */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-6xl font-serif text-pearl mb-4">
                Customer Reviews
              </h1>
              <p className="text-xl text-pearl/70 max-w-2xl mx-auto">
                Real experiences from real clients. Your trust is our greatest achievement.
              </p>

              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-champagne">{stats.total_reviews}</div>
                    <div className="text-sm text-pearl/60">Total Reviews</div>
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center mb-1">
                      {renderStars(Math.round(stats.average_rating))}
                    </div>
                    <div className="text-2xl font-bold text-champagne">{stats.average_rating.toFixed(1)}</div>
                    <div className="text-sm text-pearl/60">Average Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald">{stats.verified_reviews}</div>
                    <div className="text-sm text-pearl/60">Verified Reviews</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-lip-rose">{stats.response_rate.toFixed(0)}%</div>
                    <div className="text-sm text-pearl/60">Response Rate</div>
                  </div>
                </div>
              )}
            </div>

            {/* Rating Distribution */}
            {stats && (
              <div className="bg-pearl/10 backdrop-blur-lg rounded-2xl p-8 mb-8">
                <h3 className="text-xl font-serif text-pearl mb-6">Rating Distribution</h3>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = stats.rating_distribution[rating] || 0;
                    const percentage = (count / stats.total_reviews) * 100;
                    return (
                      <div key={rating} className="flex items-center gap-3">
                        <div className="flex items-center gap-1 w-16">
                          <span className="text-pearl font-medium">{rating}</span>
                          <Star className="w-4 h-4 fill-champagne text-champagne" />
                        </div>
                        <div className="flex-1 bg-pearl/20 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-champagne to-lip-rose"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="text-sm text-pearl/60 w-12 text-right">
                          {count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-pearl/50" />
                  <Input
                    placeholder="Search reviews..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-pearl/10 border-champagne/30 text-pearl placeholder:text-pearl/50"
                  />
                </div>

                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="border-champagne/30 text-pearl hover:bg-champagne/10"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                </Button>

                <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
                  <DialogTrigger asChild>
                    <Button className="bg-champagne hover:bg-champagne/90 text-pearl">
                      <Plus className="w-4 h-4 mr-2" />
                      Write Review
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Share Your Experience</DialogTitle>
                      <DialogDescription>
                        Help others make informed decisions by sharing your experience
                      </DialogDescription>
                    </DialogHeader>
                    <ReviewForm />
                  </DialogContent>
                </Dialog>
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48 bg-pearl/10 border-champagne/30 text-pearl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="rating_high">Highest Rating</SelectItem>
                  <SelectItem value="rating_low">Lowest Rating</SelectItem>
                  <SelectItem value="helpful">Most Helpful</SelectItem>
                  <SelectItem value="verified">Verified First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="bg-pearl/10 backdrop-blur-lg rounded-xl p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-pearl mb-2 block" htmlFor="rating">Rating</label>
                    <Select value={filterRating} onValueChange={setFilterRating}>
                      <SelectTrigger className="bg-pearl/20 border-champagne/30 text-pearl">
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
                    <label className="text-sm font-medium text-pearl mb-2 block" htmlFor="service">Service</label>
                    <Select value={filterService} onValueChange={setFilterService}>
                      <SelectTrigger className="bg-pearl/20 border-champagne/30 text-pearl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Services</SelectItem>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-pearl mb-2 block" htmlFor="verification">Verification</label>
                    <Select value={filterVerified} onValueChange={setFilterVerified}>
                      <SelectTrigger className="bg-pearl/20 border-champagne/30 text-pearl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Reviews</SelectItem>
                        <SelectItem value="verified">Verified Only</SelectItem>
                        <SelectItem value="unverified">Unverified Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews List */}
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="text-pearl">Loading reviews...</div>
                </div>
              ) : filteredReviews.length === 0 ? (
                <Card className="border-champagne/30">
                  <CardContent className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-champagne mx-auto mb-4" />
                    <h3 className="text-xl font-serif text-pearl mb-2">No reviews found</h3>
                    <p className="text-pearl/60">
                      {searchTerm || filterRating !== "all" || filterService !== "all" || filterVerified !== "all"
                        ? "Try adjusting your filters or search terms"
                        : "Be the first to share your experience!"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-pearl/60">
                      Showing {filteredReviews.length} review{filteredReviews.length !== 1 ? "s" : ""}
                    </p>
                    <div className="flex items-center gap-2">
                      <ReviewBadges review={{
                        is_verified: true,
                        verification_method: 'photo',
                        source_platform: 'mariia_hub'
                      }} size="sm" />
                      <span className="text-xs text-pearl/50">Verified reviews are authentic</span>
                    </div>
                  </div>

                  <div className="grid gap-6">
                    {filteredReviews.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}