import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95 font-body",
  {
    variants: {
      variant: {
        // Enhanced luxury primary with gradient and glass effect
        default: "bg-gradient-brand text-white shadow-luxury hover:shadow-luxury-strong hover:scale-[1.02] active:shadow-medium active:scale-[0.98] border border-white/10",

        // Enhanced destructive with rose gold
        destructive: "bg-gradient-rose text-rose-foreground shadow-luxury hover:shadow-luxury-strong hover:scale-[1.02] active:shadow-medium active:scale-[0.98] border border-rose-gold/20",

        // Enhanced outline with glass morphism
        outline: "glass-card text-foreground hover:bg-champagne/10 hover:shadow-luxury hover:scale-[1.02] active:shadow-medium active:scale-[0.98] border border-champagne/30",

        // Enhanced secondary with subtle luxury
        secondary: "glass-card text-foreground hover:bg-white/10 hover:shadow-luxury hover:scale-[1.02] active:shadow-medium active:scale-[0.98] border border-white/10",

        // Enhanced ghost with smooth transitions
        ghost: "text-foreground hover:bg-champagne/10 hover:text-champagne-foreground transition-all duration-200 active:scale-[0.98]",

        // Enhanced link with luxury styling
        link: "text-brand underline-offset-4 hover:underline transition-colors duration-200 decoration-2",

        // New luxury variant with full glass effect
        luxury: "glass-accent text-pearl-foreground hover:text-pearl-foreground shadow-luxury hover:shadow-luxury-strong hover:scale-[1.02] active:shadow-medium active:scale-[0.98] border border-white/15",

        // New subtle variant for minimal interfaces
        subtle: "text-foreground hover:bg-champagne/5 hover:text-champagne-foreground transition-all duration-200 active:scale-[0.98]",

        // New gradient outline variant
        "gradient-outline": "relative bg-transparent text-foreground hover:text-champagne-foreground transition-all duration-200 active:scale-[0.98] border border-accent-gradient",
      },
      size: {
        // Enhanced size system with better proportions (min 44px for touch targets)
        xs: "h-11 px-3 text-xs gap-1.5 rounded-lg",
        sm: "h-11 px-4 text-sm gap-2 rounded-xl",
        default: "h-11 px-6 text-sm gap-2 rounded-2xl",
        lg: "h-12 px-8 text-base gap-2.5 rounded-2xl",
        xl: "h-14 px-10 text-lg gap-3 rounded-3xl",
        icon: "h-11 w-11 rounded-2xl",
        "icon-sm": "h-11 w-11 rounded-xl",
        "icon-lg": "h-12 w-12 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
