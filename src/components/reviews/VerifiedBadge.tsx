import React, { useState } from 'react';
import {
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
  Info,
  Calendar,
  Smartphone,
  Mail,
  CreditCard,
  Camera,
  Globe,
  Badge as BadgeIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Review, ReviewVerification } from '@/types/review';

interface VerifiedBadgeProps {
  review: Review;
  verifications?: ReviewVerification[];
  variant?: 'default' | 'compact' | 'detailed';
  showTooltip?: boolean;
  className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  review,
  verifications = [],
  variant = 'default',
  showTooltip = true,
  className = ''
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!review.is_verified) {
    return null;
  }

  const getVerificationIcon = (type: string) => {
    switch (type) {
      case 'booking_confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'photo_metadata':
        return <Camera className="w-4 h-4" />;
      case 'email_verified':
        return <Mail className="w-4 h-4" />;
      case 'phone_verified':
        return <Smartphone className="w-4 h-4" />;
      case 'ip_analysis':
        return <Globe className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getVerificationLabel = (type: string) => {
    switch (type) {
      case 'booking_confirmed':
        return 'Confirmed Booking';
      case 'photo_metadata':
        return 'Photo Verified';
      case 'email_verified':
        return 'Email Verified';
      case 'phone_verified':
        return 'Phone Verified';
      case 'ip_analysis':
        return 'Location Verified';
      default:
        return 'Verified';
    }
  };

  const getVerificationDescription = (type: string) => {
    switch (type) {
      case 'booking_confirmed':
        return 'This reviewer has a confirmed booking with us';
      case 'photo_metadata':
        return 'Photos were taken on a real device with valid metadata';
      case 'email_verified':
        return 'The reviewer\'s email address has been verified';
      case 'phone_verified':
        return 'The reviewer\'s phone number has been verified';
      case 'ip_analysis':
        return 'IP location matches the booking location';
      default:
        return 'This review has passed our verification checks';
    }
  };

  const getBadgeVariant = () => {
    const allPassed = verifications.every(v => v.status === 'passed');
    const hasFailed = verifications.some(v => v.status === 'failed');

    if (allPassed && verifications.length > 2) return 'default';
    if (allPassed) return 'secondary';
    if (hasFailed) return 'destructive';
    return 'outline';
  };

  const renderCompact = () => (
    <Badge variant={getBadgeVariant()} className={`text-xs ${className}`}>
      <Shield className="w-3 h-3 mr-1" />
      Verified
    </Badge>
  );

  const renderDefault = () => (
    <Badge variant={getBadgeVariant()} className={className}>
      <Shield className="w-4 h-4 mr-1" />
      {review.verification_method ? getVerificationLabel(review.verification_method) : 'Verified'}
    </Badge>
  );

  const renderDetailed = () => (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {verifications.map((verification, index) => (
        <Badge
          key={verification.id}
          variant={verification.status === 'passed' ? 'default' : 'destructive'}
          className="text-xs"
        >
          {getVerificationIcon(verification.verification_type)}
          <span className="ml-1">
            {getVerificationLabel(verification.verification_type)}
          </span>
          {verification.status === 'failed' && (
            <AlertCircle className="w-3 h-3 ml-1" />
          )}
        </Badge>
      ))}
    </div>
  );

  const VerificationDetails = () => (
    <Dialog open={showDetails} onOpenChange={setShowDetails}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Review Verification Details
          </DialogTitle>
          <DialogDescription>
            This review has undergone multiple verification checks to ensure authenticity
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Verification Status */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <BadgeIcon className="w-5 h-5 text-primary" />
              <span className="font-medium">Overall Status</span>
            </div>
            <p className="text-sm text-muted-foreground">
              This review has been verified as authentic through {verifications.length} different methods.
            </p>
          </div>

          {/* Verification Methods */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Verification Methods
            </h4>
            {verifications.map((verification) => (
              <div key={verification.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="mt-0.5">
                  {getVerificationIcon(verification.verification_type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {getVerificationLabel(verification.verification_type)}
                    </span>
                    <Badge
                      variant={verification.status === 'passed' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {verification.status === 'passed' ? 'Passed' : 'Failed'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getVerificationDescription(verification.verification_type)}
                  </p>
                  {verification.verified_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Verified on {new Date(verification.verified_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Additional Information */}
          {review.verification_data && Object.keys(review.verification_data).length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Info className="w-4 h-4" />
                Additional Information
              </h4>
              <div className="p-3 bg-muted rounded-lg">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(review.verification_data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Trust Score */}
          <div className="p-4 border rounded-lg bg-primary/5">
            <div className="flex items-center justify-between">
              <span className="font-medium">Trust Score</span>
              <span className="text-2xl font-bold text-primary">
                {Math.round((1 - (review.fraud_score || 0)) * 100)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on verification checks and authenticity analysis
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const badgeContent = () => {
    switch (variant) {
      case 'compact':
        return renderCompact();
      case 'detailed':
        return renderDetailed();
      default:
        return renderDefault();
    }
  };

  if (!showTooltip) {
    return (
      <>
        {badgeContent()}
        {variant !== 'detailed' && <VerificationDetails />}
      </>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="inline-flex"
            onClick={() => variant !== 'detailed' && setShowDetails(true)}
          >
            {badgeContent()}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            This review has been verified for authenticity
          </p>
          <p className="text-xs text-muted-foreground">
            Click for details
          </p>
        </TooltipContent>
      </Tooltip>
      {variant !== 'detailed' && <VerificationDetails />}
    </TooltipProvider>
  );
};

export default VerifiedBadge;