import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const luxuryButtonVariants = cva(
  // Base styles with performance optimization
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-body transform-gpu will-change-transform",
  {
    variants: {
      variant: {
        // Premium luxury with gradient and glass effect
        luxury:
          "relative overflow-hidden bg-gradient-luxury text-white shadow-luxury hover:shadow-luxury-strong border border-white/10 " +
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full before:transition-transform before:duration-700 " +
          "hover:before:translate-x-full hover:scale-[1.02] active:scale-[0.98] active:shadow-medium",

        // Enhanced primary with shimmer effect
        primary:
          "relative overflow-hidden bg-gradient-brand text-white shadow-luxury hover:shadow-luxury-strong border border-white/10 " +
          "after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent after:translate-x-full after:transition-transform after:duration-1000 " +
          "hover:after:translate-x-full hover:scale-[1.02] active:scale-[0.98]",

        // Glass morphism variant
        glass:
          "glass-card text-cocoa-900 hover:text-champagne-700 hover:bg-white/80 hover:shadow-luxury hover:scale-[1.02] active:scale-[0.98] border border-champagne/20 " +
          "backdrop-blur-xl bg-white/60",

        // Accent with champagne gradient
        accent:
          "bg-gradient-champagne text-cocoa-900 shadow-luxury hover:shadow-luxury-strong hover:scale-[1.02] active:scale-[0.98] border border-champagne/30",

        // Outline with luxury styling
        outline:
          "glass-luxury text-cocoa-700 hover:text-champagne-700 hover:border-champagne-400 hover:shadow-luxury hover:scale-[1.02] active:scale-[0.98] border border-champagne/30",

        // Subtle with minimal styling
        subtle:
          "glass-subtle text-cocoa-600 hover:text-champagne-600 hover:bg-champagne/10 hover:scale-[1.01] active:scale-[0.98] border border-transparent",

        // Destructive with rose gold
        destructive:
          "bg-gradient-rose text-white shadow-luxury hover:shadow-luxury-strong hover:scale-[1.02] active:scale-[0.98] border border-rose-gold/20",

        // Ghost with smooth transitions
        ghost:
          "text-cocoa-600 hover:text-champagne-600 hover:bg-champagne/10 transition-all duration-200 active:scale-[0.98]",

        // Link variant with luxury styling
        link:
          "text-champagne-600 underline-offset-4 hover:underline hover:text-champagne-700 transition-colors duration-200 decoration-2 font-medium",
      },
      size: {
        // Enhanced size system with luxury proportions (min 44px for touch targets)
        xs: "h-11 px-3 text-xs gap-1.5 rounded-lg shadow-sm",
        sm: "h-11 px-4 text-sm gap-2 rounded-xl shadow-sm",
        default: "h-12 px-6 text-sm gap-2 rounded-2xl shadow-md",
        lg: "h-13 px-8 text-base gap-2.5 rounded-2xl shadow-lg",
        xl: "h-14 px-10 text-lg gap-3 rounded-3xl shadow-lg",
        icon: "h-12 w-12 rounded-2xl shadow-md",
        "icon-sm": "h-11 w-11 rounded-xl shadow-sm",
        "icon-lg": "h-13 w-13 rounded-2xl shadow-lg",
      },
      state: {
        default: "",
        loading: "cursor-not-allowed",
        success: "bg-success hover:bg-success-600 text-white",
        error: "bg-error hover:bg-error-600 text-white",
      },
    },
    defaultVariants: {
      variant: "luxury",
      size: "default",
      state: "default",
    },
  },
);

export interface LuxuryButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof luxuryButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  shimmer?: boolean;
}

const LuxuryButton = React.forwardRef<HTMLButtonElement, LuxuryButtonProps>(
  ({
    className,
    variant,
    size,
    state,
    asChild = false,
    loading = false,
    leftIcon,
    rightIcon,
    shimmer = false,
    children,
    disabled,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;

    return (
      <Comp
        className={cn(luxuryButtonVariants({ variant, size, state, className }))}
        ref={ref}
        disabled={isDisabled}
        data-loading={loading}
        {...props}
      >
        {/* Loading State */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Left Icon */}
        {leftIcon && !loading && (
          <span className="transition-transform duration-200 group-hover:scale-110">
            {leftIcon}
          </span>
        )}

        {/* Button Content */}
        <span className={cn(
          "transition-all duration-200",
          loading && "opacity-0",
          shimmer && "relative"
        )}>
          {children}

          {/* Shimmer Effect */}
          {shimmer && !loading && (
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-pulse" />
          )}
        </span>

        {/* Right Icon */}
        {rightIcon && !loading && (
          <span className="transition-transform duration-200 group-hover:scale-110">
            {rightIcon}
          </span>
        )}

        {/* Ripple Effect Container */}
        <span className="absolute inset-0 overflow-hidden rounded-inherit pointer-events-none" />
      </Comp>
    );
  },
);

LuxuryButton.displayName = "LuxuryButton";

export { LuxuryButton, luxuryButtonVariants };