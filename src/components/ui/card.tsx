import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-3xl glass-card text-foreground transition-all duration-300 hover:shadow-luxury-strong hover:scale-[1.01] border border-champagne/10",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col space-y-2 p-6 pb-4",
        className
      )}
      {...props}
    />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-2xl font-semibold font-display leading-tight tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        "text-base text-graphite-600 font-body leading-relaxed",
        className
      )}
      {...props}
    />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "p-6 pt-2 space-y-4",
        className
      )}
      {...props}
    />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between p-6 pt-4 border-t border-champagne/10",
        className
      )}
      {...props}
    />
  ),
);
CardFooter.displayName = "CardFooter";

// Enhanced Card variants for different use cases
const CardElevated = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-3xl glass-strong text-foreground transition-all duration-300 hover:shadow-luxury-strong hover:scale-[1.02] border border-champagne/20",
      className
    )}
    {...props}
  />
));
CardElevated.displayName = "CardElevated";

const CardMinimal = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl glass-subtle text-foreground transition-all duration-300 hover:shadow-luxury border border-champagne/5",
      className
    )}
    {...props}
  />
));
CardMinimal.displayName = "CardMinimal";

const CardAccent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-3xl glass-accent text-foreground transition-all duration-300 hover:shadow-luxury-strong hover:scale-[1.01] border border-champagne/30 bg-gradient-to-br from-champagne/5 to-transparent",
      className
    )}
    {...props}
  />
));
CardAccent.displayName = "CardAccent";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, CardElevated, CardMinimal, CardAccent };
