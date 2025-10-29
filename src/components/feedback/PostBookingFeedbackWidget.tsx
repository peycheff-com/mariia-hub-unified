import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, X, ChevronRight, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useFeedback } from '@/hooks/useFeedback';
import { cn } from '@/lib/utils';

import { FeedbackForm } from './FeedbackForm';

interface PostBookingFeedbackWidgetProps {
  bookingId: string;
  serviceName: string;
  bookingDate: string;
  autoShowDelay?: number; // milliseconds after which to auto-show
  showTrigger?: boolean;
  compact?: boolean;
  className?: string;
}

export const PostBookingFeedbackWidget: React.FC<PostBookingFeedbackWidgetProps> = ({
  bookingId,
  serviceName,
  bookingDate,
  autoShowDelay = 30000, // 30 seconds
  showTrigger = true,
  compact = false,
  className,
}) => {
  const { feedback } = useFeedback({ bookingId, feedbackType: 'post_booking_review' });
  const [isOpen, setIsOpen] = useState(false);
  const [hasGivenFeedback, setHasGivenFeedback] = useState(false);
  const [showWidget, setShowWidget] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check if user has already given feedback for this booking
  useEffect(() => {
    if (feedback.length > 0) {
      setHasGivenFeedback(true);
    }
  }, [feedback]);

  // Auto-show widget after delay
  useEffect(() => {
    if (hasGivenFeedback || dismissed) return;

    const timer = setTimeout(() => {
      setShowWidget(true);
    }, autoShowDelay);

    return () => clearTimeout(timer);
  }, [autoShowDelay, hasGivenFeedback, dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    setShowWidget(false);
  };

  const handleFeedbackComplete = () => {
    setIsOpen(false);
    setHasGivenFeedback(true);
    setShowWidget(false);
  };

  // Don't show if already given feedback or dismissed
  if (hasGivenFeedback || dismissed) {
    return null;
  }

  // Compact floating widget
  if (compact && showWidget) {
    return (
      <div className={cn(
        "fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-full",
        className
      )}>
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-sm">How was your experience?</span>
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  Share your feedback about your {serviceName} appointment
                </p>
                <div className="flex items-center gap-2">
                  <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Leave Review
                        <Star className="w-3 h-3 ml-1" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Share Your Experience</DialogTitle>
                        <DialogDescription>
                          Help us improve by sharing your thoughts about your {serviceName} appointment
                        </DialogDescription>
                      </DialogHeader>
                      <FeedbackForm
                        feedbackType="post_booking_review"
                        bookingId={bookingId}
                        onComplete={handleFeedbackComplete}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Maybe later
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Full card widget
  if (!compact && showWidget) {
    return (
      <Card className={cn(
        "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg",
        className
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">How was your experience?</CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(bookingDate), 'MMM dd, yyyy')}
                  <span className="mx-1">•</span>
                  <span className="font-medium">{serviceName}</span>
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-gray-600 mb-4">
            Your feedback helps us improve our services and provide better experiences for all our clients.
          </p>

          <div className="flex items-center gap-3">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Share Your Experience
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Share Your Experience</DialogTitle>
                  <DialogDescription>
                    Help us improve by sharing your thoughts about your {serviceName} appointment
                  </DialogDescription>
                </DialogHeader>
                <FeedbackForm
                  feedbackType="post_booking_review"
                  bookingId={bookingId}
                  onComplete={handleFeedbackComplete}
                />
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              onClick={handleDismiss}
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Maybe later
            </Button>
          </div>

          <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>This reminder will disappear after you dismiss it</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Trigger button (if widget is not auto-shown)
  if (showTrigger && !showWidget) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className={cn("gap-2", className)}>
            <MessageSquare className="w-4 h-4" />
            Share Your Experience
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Share Your Experience</DialogTitle>
            <DialogDescription>
              Help us improve by sharing your thoughts about your {serviceName} appointment
            </DialogDescription>
          </DialogHeader>
          <FeedbackForm
            feedbackType="post_booking_review"
            bookingId={bookingId}
            onComplete={handleFeedbackComplete}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return null;
};

export default PostBookingFeedbackWidget;