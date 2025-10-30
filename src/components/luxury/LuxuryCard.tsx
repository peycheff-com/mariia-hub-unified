import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "minimal" | "accent" | "glass" | "luxury";
  interactive?: boolean;
  hover?: boolean;
  gradient?: boolean;
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  avatar?: React.ReactNode;
  actions?: React.ReactNode;
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const LuxuryCard = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "luxury", interactive = true, hover = true, gradient = false, children, ...props }, ref) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const [isPressed, setIsPressed] = React.useState(false);

    const variantClasses = {
      default: "glass-card border-champagne/10",
      elevated: "glass-luxury border-champagne/20 shadow-luxury",
      minimal: "glass-subtle border-transparent",
      accent: "glass-accent border-champagne/30 bg-champagne/5",
      glass: "glass-card border-champagne/15",
      luxury: "glass-luxury border-champagne/25 shadow-luxury bg-white/60",
    };

    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          "relative overflow-hidden rounded-3xl transition-all duration-300 ease-out",
          "transform-gpu will-change-transform",

          // Variants
          variantClasses[variant],

          // Interactive states
          interactive && "cursor-pointer",
          hover && [
            "hover:shadow-luxury-strong hover:scale-[1.02]",
            "active:scale-[0.98] active:shadow-medium"
          ],

          // Gradient overlay
          gradient && "bg-gradient-to-br from-champagne/10 via-transparent to-cocoa/10",

          // Dynamic states
          isHovered && "shadow-luxury-strong",
          isPressed && "scale-[0.98]",

          className
        )}
        onMouseEnter={() => hover && setIsHovered(true)}
        onMouseLeave={() => hover && setIsHovered(false)}
        onMouseDown={() => hover && setIsPressed(true)}
        onMouseUp={() => hover && setIsPressed(false)}
        {...props}
      >
        {/* Decorative hover effect */}
        {hover && (
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br from-transparent via-champagne/10 to-transparent opacity-0 transition-opacity duration-500 pointer-events-none",
              isHovered && "opacity-100"
            )}
          />
        )}

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>

        {/* Corner accents */}
        {variant === "luxury" || variant === "elevated" ? (
          <>
            <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-champagne/30 rounded-tl-3xl opacity-50" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-champagne/30 rounded-tr-3xl opacity-50" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-champagne/30 rounded-bl-3xl opacity-50" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-champagne/30 rounded-br-3xl opacity-50" />
          </>
        ) : null}
      </div>
    );
  }
);

LuxuryCard.displayName = "LuxuryCard";

const LuxuryCardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, avatar, actions, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col space-y-3 p-6 pb-4",
        title && avatar && "flex-row items-center justify-between space-y-0 space-x-4",
        className
      )}
      {...props}
    >
      {(title || subtitle || avatar) && (
        <div className="flex items-start justify-between space-x-4">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {avatar && (
              <div className="flex-shrink-0 transform transition-transform duration-200 hover:scale-105">
                {avatar}
              </div>
            )}
            <div className="min-w-0 flex-1">
              {title && (
                <h3 className="text-xl font-semibold text-cocoa-900 font-display leading-tight truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-cocoa-600 font-body leading-relaxed mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  )
);

LuxuryCardHeader.displayName = "LuxuryCardHeader";

const LuxuryCardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("p-6 pt-2 space-y-4", className)}
      {...props}
    />
  )
);

LuxuryCardContent.displayName = "LuxuryCardContent";

const LuxuryCardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between p-6 pt-4 border-t border-champagne/10",
        className
      )}
      {...props}
    />
  )
);

LuxuryCardFooter.displayName = "LuxuryCardFooter";

// Card with special pricing badge
const LuxuryCardPricing = React.forwardRef<HTMLDivElement, CardProps & {
  badge?: string;
  featured?: boolean;
}>(({ className, badge, featured = false, children, ...props }, ref) => (
  <LuxuryCard
    ref={ref}
    className={cn(
      featured && "ring-2 ring-champagne-400 ring-offset-4 shadow-luxury-strong scale-[1.05]",
      className
    )}
    {...props}
  >
    {badge && (
      <div className="absolute -top-4 right-6 z-20">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-champagne text-cocoa-900 shadow-lg">
          {badge}
        </span>
      </div>
    )}
    {children}
  </LuxuryCard>
));

LuxuryCardPricing.displayName = "LuxuryCardPricing";

export {
  LuxuryCard,
  LuxuryCardHeader,
  LuxuryCardContent,
  LuxuryCardFooter,
  LuxuryCardPricing,
};