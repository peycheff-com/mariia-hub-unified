import * as React from "react";
import { cn } from "@/lib/utils";

// Enhanced Loading Spinner with luxury styling
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "luxury" | "minimal";
  color?: "champagne" | "cocoa" | "rose" | "success";
  className?: string;
}

const LuxuryLoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ size = "md", variant = "luxury", color = "champagne", className, ...props }, ref) => {
    const sizeClasses = {
      sm: "w-4 h-4",
      md: "w-6 h-6",
      lg: "w-8 h-8",
      xl: "w-12 h-12",
    };

    const colorClasses = {
      champagne: "border-champagne-400 border-t-champagne-600",
      cocoa: "border-cocoa-300 border-t-cocoa-600",
      rose: "border-rose-gold-300 border-t-rose-gold-500",
      success: "border-success-300 border-t-success-600",
    };

    const variantClasses = {
      default: "",
      luxury: "drop-shadow-lg",
      minimal: "",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-block rounded-full border-2 animate-spin transform-gpu will-change-transform",
          sizeClasses[size],
          colorClasses[color],
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);

LuxuryLoadingSpinner.displayName = "LuxuryLoadingSpinner";

// Luxury Skeleton Component with gradient animation
interface SkeletonProps {
  className?: string;
  variant?: "default" | "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  lines?: number;
  animated?: boolean;
}

const LuxurySkeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = "default", width, height, lines = 1, animated = true, ...props }, ref) => {
    const variantClasses = {
      default: "rounded-xl",
      text: "rounded-lg h-4",
      circular: "rounded-full",
      rectangular: "rounded-2xl",
    };

    if (variant === "text" && lines > 1) {
      return (
        <div ref={ref} className="space-y-2" {...props}>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-4 rounded-xl bg-gradient-to-r from-cocoa-100 via-cocoa-200 to-cocoa-100",
                animated && "animate-pulse",
                i === lines - 1 && "w-3/4", // Last line shorter
                className
              )}
              style={{
                width: width || undefined,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "bg-gradient-to-r from-cocoa-100 via-cocoa-200 to-cocoa-100",
          variantClasses[variant],
          animated && "animate-pulse",
          className
        )}
        style={{
          width: width || undefined,
          height: height || undefined,
        }}
        {...props}
      />
    );
  }
);

LuxurySkeleton.displayName = "LuxurySkeleton";

// Advanced Loading Component with progress
interface LoadingProgressProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "luxury" | "minimal";
  showValue?: boolean;
  label?: string;
  className?: string;
}

const LuxuryLoadingProgress = React.forwardRef<HTMLDivElement, LoadingProgressProps>(
  ({ value, max = 100, size = "md", variant = "luxury", showValue = true, label, className, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizeClasses = {
      sm: "h-2",
      md: "h-3",
      lg: "h-4",
    };

    const variantClasses = {
      default: "bg-cocoa-200",
      luxury: "glass-luxury bg-champagne/20",
      minimal: "bg-cocoa-100",
    };

    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {(label || showValue) && (
          <div className="flex items-center justify-between text-sm">
            {label && (
              <span className="text-cocoa-700 font-medium font-body">{label}</span>
            )}
            {showValue && (
              <span className="text-champagne-600 font-semibold font-body">
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        )}
        <div className={cn(
          "relative w-full rounded-full overflow-hidden",
          sizeClasses[size],
          variantClasses[variant]
        )}>
          {/* Background shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-pulse" />

          {/* Progress bar */}
          <div
            className={cn(
              "h-full bg-gradient-to-r from-champagne-400 to-champagne-600 rounded-full transition-all duration-500 ease-out relative overflow-hidden",
              "shadow-lg shadow-champagne-500/30"
            )}
            style={{ width: `${percentage}%` }}
          >
            {/* Shimmer effect on progress */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }
);

LuxuryLoadingProgress.displayName = "LuxuryLoadingProgress";

// Pulse Loading Component for content sections
interface PulseLoadingProps {
  children: React.ReactNode;
  className?: string;
}

const LuxuryPulseLoading: React.FC<PulseLoadingProps> = ({ children, className }) => {
  return (
    <div className={cn("animate-pulse", className)}>
      {children}
    </div>
  );
};

// Loading Overlay Component
interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  variant?: "default" | "blur" | "skeleton";
  message?: string;
  spinnerSize?: "sm" | "md" | "lg";
  className?: string;
}

const LuxuryLoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  variant = "blur",
  message,
  spinnerSize = "md",
  className
}) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isLoading]);

  if (!isLoading && !isVisible) {
    return <>{children}</>;
  }

  return (
    <div className={cn("relative", className)}>
      {/* Content */}
      <div className={cn(
        "transition-all duration-300",
        isLoading && variant === "blur" && "blur-sm opacity-50",
        isLoading && variant === "skeleton" && "opacity-30"
      )}>
        {children}
      </div>

      {/* Overlay */}
      {isVisible && (
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 glass-luxury rounded-inherit">
          <LuxuryLoadingSpinner size={spinnerSize} variant="luxury" color="champagne" />
          {message && (
            <p className="text-cocoa-700 font-medium font-body text-center max-w-xs">
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export {
  LuxuryLoadingSpinner,
  LuxurySkeleton,
  LuxuryLoadingProgress,
  LuxuryPulseLoading,
  LuxuryLoadingOverlay,
};