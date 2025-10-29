import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[100px] md:min-h-[80px] w-full rounded-2xl border border-champagne/20 glass-card text-foreground placeholder:text-graphite-500 px-4 py-3.5 font-body text-base touch-manipulation focus-visible:outline-none focus-visible:border-champagne/60 focus-visible:ring-2 focus-visible:ring-champagne/20 focus-visible:bg-champagne/5 hover:border-champagne/30 hover:bg-champagne/5 disabled:cursor-not-allowed disabled:opacity-60 transition-all duration-200 resize-none [color-scheme:dark]",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
