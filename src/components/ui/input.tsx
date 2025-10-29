import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Enhanced base styles with luxury design system (mobile-first with 48px min height)
          "flex h-12 md:h-11 w-full rounded-2xl border border-champagne/20 glass-card text-foreground placeholder:text-graphite-500 px-4 py-3 font-body text-base touch-manipulation",

          // Enhanced focus states with glass morphism
          "focus-visible:outline-none focus-visible:border-champagne/60 focus-visible:ring-2 focus-visible:ring-champagne/20 focus-visible:bg-champagne/5",

          // Enhanced hover states
          "hover:border-champagne/30 hover:bg-champagne/5",

          // Disabled states with luxury styling
          "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-graphite/100 disabled:border-graphite/300",

          // Transitions and smooth interactions
          "transition-all duration-200 ease-smooth",

          // Color scheme and accessibility
          "[color-scheme:dark] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-champagne file:text-foreground hover:file:bg-champagne-600",

          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
