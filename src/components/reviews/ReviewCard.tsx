import { useState } from "react";
import {
  Star,
  ThumbsUp,
  MessageSquare,
  Flag,
  Share2,
  Camera,
  CheckCircle,
  Shield,
  Sparkles,
  Calendar,
  User,
  ExternalLink,
  Heart,
  MapPin
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";
import { useAuth } from "@/hooks/useAuth";
import { ResponsiveAvatar } from "@/components/ui/responsive-image";

import { PhotoViewer } from "./PhotoViewer";

interface ReviewCardProps {
  review: any;
  showActions?: boolean;
  compact?: boolean;
  onReply?: (reviewId: string) => void;
}

export const ReviewCard = ({
  review,
  showActions = true,
  compact = false,
  onReply
}: ReviewCardProps) => {
  const { user } = useAuth();
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  const [isHelpful, setIsHelpful] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count || 0);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const renderStars = (rating: number, size: "sm" | "md" | "lg" = "md") => {
    const sizeClass = {
      sm: "w-3 h-3",
      md: "w-4 h-4",
      lg: "w-5 h-5"
    }[size];

    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating
                ? "fill-champagne text-champagne"
                : "text-pearl/20"
            }`}
          />
        ))}
      </div>
    );
  };

  const handleHelpful = async () => {
    if (!user) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Login required",
        description: "Please log in to mark reviews as helpful",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isHelpful) {
        // Remove helpful vote
        await supabase
          .from("review_helpful_votes")
          .delete()
          .eq("review_id", review.id)
          .eq("user_id", user.id);

        setHelpfulCount(prev => prev - 1);
        setIsHelpful(false);
      } else {
        // Add helpful vote
        await supabase
          .from("review_helpful_votes")
          .insert({
            review_id: review.id,
            user_id: user.id,
            is_helpful: true
          });

        setHelpfulCount(prev => prev + 1);
        setIsHelpful(true);
      }
    } catch (error: any) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReport = async () => {
    if (!user) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Login required",
        description: "Please log in to report reviews",
        variant: "destructive",
      });
      return;
    }

    if (!reportReason.trim()) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Reason required",
        description: "Please provide a reason for reporting this review",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await supabase
        .from("review_reports")
        .insert({
          review_id: review.id,
          reporter_id: user.id,
          reason: reportReason,
          description: `Reported by user: ${user.id}`
        });

      toast aria-live="polite" aria-atomic="true"({
        title: "Review reported",
        description: "Thank you. Our team will review this report.",
      });

      setShowReportDialog(false);
      setReportReason('');
    } catch (error: any) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Review: ${review.title || 'Service Review'}`,
          text: `${review.content.substring(0, 100)}...`,
          url: window.location.href
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast aria-live="polite" aria-atomic="true"({
        title: "Link copied",
        description: "Review link copied to clipboard",
      });
    }
  };

  const getServiceTypeColor = (type: string) => {
    switch (type) {
      case 'beauty': return 'bg-lip-rose/20 text-lip-rose border-lip-rose/30';
      case 'fitness': return 'bg-sage/20 text-sage border-sage/30';
      default: return 'bg-champagne/20 text-champagne border-champagne/30';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'google': return '🔍';
      case 'booksy': return '📚';
      case 'instagram': return '📷';
      case 'facebook': return '📘';
      default: return '✨';
    }
  };

  if (compact) {
    return (
      <div className="flex items-start gap-3 p-3 border border-champagne/20 rounded-lg hover:bg-champagne/5 transition-colors">
        <div className="flex-shrink-0">
          {review.reviewer_avatar ? (
            <ResponsiveAvatar
              src={review.reviewer_avatar}
              alt={review.reviewer_name}
              size="sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-champagne/20 flex items-center justify-center">
              <User className="w-5 h-5 text-champagne" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-pearl">{review.reviewer_name}</span>
            {renderStars(review.rating, "sm")}
            <span className="text-xs text-pearl/50">
              {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
            </span>
          </div>

          <p className="text-sm text-pearl/70 line-clamp-2">{review.content}</p>

          {review.photos && review.photos.length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Camera className="w-3 h-3 text-pearl/50" />
              <span className="text-xs text-pearl/50">{review.photos.length} photo(s)</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={`border-champagne/30 ${review.is_featured ? 'ring-2 ring-champagne/30' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {/* User Avatar */}
            <div className="flex-shrink-0">
              {review.reviewer_avatar ? (
                <ResponsiveAvatar
                  src={review.reviewer_avatar}
                  alt={review.reviewer_name}
                  size="md"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-champagne/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-champagne" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              {/* User Name and Badges */}
              <div className="flex items-center gap-2">
                <span className="font-medium text-pearl">{review.reviewer_name}</span>

                {review.is_verified && (
                  <Badge variant="outline" className="bg-emerald/10 text-emerald border-emerald/30 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </Badge>
                )}

                {review.is_featured && (
                  <Badge className="bg-lip-rose/20 text-lip-rose border-lip-rose/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Featured
                  </Badge>
                )}

                {review.source_platform !== 'mariia_hub' && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getSourceIcon(review.source_platform)}
                    {review.source_platform}
                  </Badge>
                )}
              </div>

              {/* Rating and Date */}
              <div className="flex items-center gap-3">
                {renderStars(review.rating)}
                <span className="text-sm text-pearl/60">
                  {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                </span>
              </div>

              {/* Service Info */}
              {review.service_title && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getServiceTypeColor(review.service_type)}>
                    {review.service_title}
                  </Badge>
                </div>
              )}

              {/* Review Title */}
              {review.title && (
                <h3 className="text-lg font-medium text-pearl">{review.title}</h3>
              )}
            </div>
          </div>

          {/* External Link */}
          {review.external_platform_url && (
            <a
              href={review.external_platform_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-champagne hover:text-champagne/80"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Review Content */}
        <p className="text-pearl/80 leading-relaxed">{review.content}</p>

        {/* Photos */}
        {review.photos && review.photos.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-pearl/60">
              <Camera className="w-4 h-4" />
              <span>{review.photos.length} photo{review.photos.length > 1 ? 's' : ''}</span>
              {review.is_verified && (
                <span className="flex items-center gap-1 text-emerald">
                  <Shield className="w-3 h-3" />
                  Verified photos
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {review.photos.slice(0, 3).map((photo: string, index: number) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedPhotoIndex(index);
                    setShowPhotoViewer(true);
                  }}
                  className="relative aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
                >
                  <img
                    src={photo}
                    alt={`Review photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {index === 2 && review.photos.length > 3 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-medium">+{review.photos.length - 3}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Response */}
        {review.response_content && (
          <div className="p-4 bg-champagne/10 rounded-lg border-l-4 border-champagne">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-champagne" />
              <span className="text-sm font-medium text-pearl">Response from {review.responder_name || 'the team'}</span>
              <span className="text-xs text-pearl/50">
                {formatDistanceToNow(new Date(review.response_date), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-pearl/70">{review.response_content}</p>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex items-center justify-between pt-3 border-t border-pearl/10">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleHelpful}
                className={`text-pearl/60 hover:text-champagne hover:bg-champagne/10 ${isHelpful ? 'text-champagne bg-champagne/10' : ''}`}
              >
                <ThumbsUp className={`w-4 h-4 mr-1 ${isHelpful ? 'fill-current' : ''}`} />
                Helpful ({helpfulCount})
              </Button>

              {onReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReply(review.id)}
                  className="text-pearl/60 hover:text-champagne hover:bg-champagne/10"
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Reply
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="text-pearl/60 hover:text-champagne hover:bg-champagne/10"
              >
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
            </div>

            <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-pearl/60 hover:text-destructive hover:bg-destructive/10"
                >
                  <Flag className="w-4 h-4 mr-1" />
                  Report
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Report Review</DialogTitle>
                  <DialogDescription>
                    Why are you reporting this review?
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <Textarea
                    placeholder="Please provide a reason for reporting this review..."
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    rows={3}
                  />

                  <div className="flex gap-2">
                    <Button
                      onClick={handleReport}
                      disabled={isSubmitting || !reportReason.trim()}
                      className="flex-1"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Report'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowReportDialog(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>

      {/* Photo Viewer Dialog */}
      {showPhotoViewer && review.photos && (
        <PhotoViewer
          photos={review.photos}
          initialIndex={selectedPhotoIndex}
          isOpen={showPhotoViewer}
          onClose={() => setShowPhotoViewer(false)}
        />
      )}
    </Card>
  );
};

export default ReviewCard;