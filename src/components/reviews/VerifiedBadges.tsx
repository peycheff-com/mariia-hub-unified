import {
  CheckCircle,
  Shield,
  Camera,
  Award,
  Star,
  Zap,
  Crown,
  Gem,
  Diamond,
  Sparkles,
  Verified
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

interface VerifiedBadgesProps {
  isVerified: boolean;
  verificationMethod?: string | null;
  isFeatured?: boolean;
  sourcePlatform?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const VerifiedBadge = ({
  isVerified,
  verificationMethod,
  isFeatured,
  sourcePlatform,
  className = "",
  size = "md"
}: VerifiedBadgesProps) => {
  if (!isVerified) return null;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  const getBadgeContent = () => {
    switch (verificationMethod) {
      case 'photo':
        return {
          icon: <Camera className={iconSizes[size]} />,
          text: "Photo Verified",
          bgColor: "bg-blue/20",
          textColor: "text-blue",
          borderColor: "border-blue/30"
        };
      case 'service':
        return {
          icon: <Award className={iconSizes[size]} />,
          text: "Service Verified",
          bgColor: "bg-purple/20",
          textColor: "text-purple",
          borderColor: "border-purple/30"
        };
      case 'google':
        return {
          icon: <Star className={iconSizes[size]} />,
          text: "Google Verified",
          bgColor: "bg-emerald/20",
          textColor: "text-emerald",
          borderColor: "border-emerald/30"
        };
      case 'booksy':
        return {
          icon: <CheckCircle className={iconSizes[size]} />,
          text: "Booksy Verified",
          bgColor: "bg-sage/20",
          textColor: "text-sage",
          borderColor: "border-sage/30"
        };
      case 'ai':
        return {
          icon: <Zap className={iconSizes[size]} />,
          text: "AI Verified",
          bgColor: "bg-amber/20",
          textColor: "text-amber",
          borderColor: "border-amber/30"
        };
      default:
        return {
          icon: <Shield className={iconSizes[size]} />,
          text: "Verified",
          bgColor: "bg-emerald/20",
          textColor: "text-emerald",
          borderColor: "border-emerald/30"
        };
    }
  };

  const badgeContent = getBadgeContent();

  return (
    <Badge
      variant="outline"
      className={`flex items-center gap-1 ${badgeContent.bgColor} ${badgeContent.textColor} ${badgeContent.borderColor} ${sizeClasses[size]} ${className}`}
    >
      {badgeContent.icon}
      {size !== "sm" && badgeContent.text}
    </Badge>
  );
};

export const FeaturedBadge = ({ size = "md", className = "" }: { size?: "sm" | "md" | "lg", className?: string }) => {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  return (
    <Badge
      className={`flex items-center gap-1 bg-gradient-to-r from-lip-rose/20 to-champagne/20 text-lip-rose border-lip-rose/30 ${sizeClasses[size]} ${className}`}
    >
      <Sparkles className={iconSizes[size]} />
      {size !== "sm" && "Featured"}
    </Badge>
  );
};

export const SourcePlatformBadge = ({
  platform,
  size = "md",
  className = ""
}: {
  platform: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) => {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5"
  };

  const getPlatformContent = () => {
    switch (platform) {
      case 'google':
        return {
          icon: "🔍",
          text: "Google",
          bgColor: "bg-emerald/20",
          textColor: "text-emerald",
          borderColor: "border-emerald/30"
        };
      case 'booksy':
        return {
          icon: "📚",
          text: "Booksy",
          bgColor: "bg-sage/20",
          textColor: "text-sage",
          borderColor: "border-sage/30"
        };
      case 'instagram':
        return {
          icon: "📷",
          text: "Instagram",
          bgColor: "bg-pink/20",
          textColor: "text-pink",
          borderColor: "border-pink/30"
        };
      case 'facebook':
        return {
          icon: "📘",
          text: "Facebook",
          bgColor: "bg-blue/20",
          textColor: "text-blue",
          borderColor: "border-blue/30"
        };
      case 'twitter':
        return {
          icon: "🐦",
          text: "Twitter",
          bgColor: "bg-sky/20",
          textColor: "text-sky",
          borderColor: "border-sky/30"
        };
      default:
        return {
          icon: "✨",
          text: "mariiaborysevych",
          bgColor: "bg-champagne/20",
          textColor: "text-champagne",
          borderColor: "border-champagne/30"
        };
    }
  };

  const platformContent = getPlatformContent();

  return (
    <Badge
      variant="outline"
      className={`flex items-center gap-1 ${platformContent.bgColor} ${platformContent.textColor} ${platformContent.borderColor} ${sizeClasses[size]} ${className}`}
    >
      <span>{platformContent.icon}</span>
      {platformContent.text}
    </Badge>
  );
};

export const TrustScoreBadge = ({
  score,
  size = "md",
  className = ""
}: {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) => {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  const getScoreColor = () => {
    if (score >= 90) return {
      icon: <Diamond className={iconSizes[size]} />,
      bgColor: "bg-gradient-to-r from-blue/20 to-purple/20",
      textColor: "text-blue",
      borderColor: "border-blue/30"
    };
    if (score >= 75) return {
      icon: <Gem className={iconSizes[size]} />,
      bgColor: "bg-emerald/20",
      textColor: "text-emerald",
      borderColor: "border-emerald/30"
    };
    if (score >= 50) return {
      icon: <Star className={iconSizes[size]} />,
      bgColor: "bg-champagne/20",
      textColor: "text-champagne",
      borderColor: "border-champagne/30"
    };
    return {
      icon: <Shield className={iconSizes[size]} />,
      bgColor: "bg-pearl/20",
      textColor: "text-pearl",
      borderColor: "border-pearl/30"
    };
  };

  const scoreContent = getScoreColor();

  return (
    <Badge
      variant="outline"
      className={`flex items-center gap-1 ${scoreContent.bgColor} ${scoreContent.textColor} ${scoreContent.borderColor} ${sizeClasses[size]} ${className}`}
    >
      {scoreContent.icon}
      Trust Score {score}%
    </Badge>
  );
};

export const ReviewerBadge = ({
  reviewCount,
  isVerified = false,
  size = "md",
  className = ""
}: {
  reviewCount: number;
  isVerified?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) => {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  if (reviewCount >= 50) {
    return (
      <Badge
        className={`flex items-center gap-1 bg-gradient-to-r from-purple/20 to-pink/20 text-purple border-purple/30 ${sizeClasses[size]} ${className}`}
      >
        <Crown className={iconSizes[size]} />
        {size !== "sm" && "Elite Reviewer"}
      </Badge>
    );
  }

  if (reviewCount >= 20) {
    return (
      <Badge
        className={`flex items-center gap-1 bg-emerald/20 text-emerald border-emerald/30 ${sizeClasses[size]} ${className}`}
      >
        <Star className={iconSizes[size]} />
        {size !== "sm" && "Top Reviewer"}
      </Badge>
    );
  }

  if (reviewCount >= 5) {
    return (
      <Badge
        variant="outline"
        className={`flex items-center gap-1 bg-champagne/20 text-champagne border-champagne/30 ${sizeClasses[size]} ${className}`}
      >
        <CheckCircle className={iconSizes[size]} />
        {size !== "sm" && "Active Reviewer"}
      </Badge>
    );
  }

  if (isVerified) {
    return (
      <Badge
        variant="outline"
        className={`flex items-center gap-1 bg-sage/20 text-sage border-sage/30 ${sizeClasses[size]} ${className}`}
      >
        <Verified className={iconSizes[size]} />
        {size !== "sm" && "Verified"}
      </Badge>
    );
  }

  return null;
};

// Combined badge component for review cards
export const ReviewBadges = ({
  review,
  size = "md",
  className = ""
}: {
  review: any;
  size?: "sm" | "md" | "lg";
  className?: string;
}) => {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <VerifiedBadge
        isVerified={review.is_verified}
        verificationMethod={review.verification_method}
        size={size}
      />

      {review.is_featured && (
        <FeaturedBadge size={size} />
      )}

      <SourcePlatformBadge
        platform={review.source_platform}
        size={size}
      />

      {review.trust_score && (
        <TrustScoreBadge
          score={review.trust_score}
          size={size}
        />
      )}

      {review.review_count && (
        <ReviewerBadge
          reviewCount={review.review_count}
          isVerified={review.reviewer_verified}
          size={size}
        />
      )}
    </div>
  );
};