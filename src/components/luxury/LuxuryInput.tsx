import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: "default" | "luxury" | "minimal" | "accent";
  loading?: boolean;
}

const LuxuryInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, leftIcon, rightIcon, variant = "luxury", loading, disabled, ...props }, ref) => {
    const [focused, setFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value.length > 0);
      props.onChange?.(e);
    };

    const inputVariants = {
      default: "glass-card border-champagne/20 focus:border-champagne-400 focus:shadow-lg focus:shadow-champagne-400/20",
      luxury: "glass-luxury border-champagne/30 focus:border-champagne-400 focus:shadow-xl focus:shadow-champagne-400/30 bg-white/80",
      minimal: "glass-subtle border-transparent focus:border-champagne-300 focus:shadow-md focus:shadow-champagne-300/20",
      accent: "glass-accent border-champagne/40 focus:border-champagne-500 focus:shadow-xl focus:shadow-champagne-500/30 bg-champagne/5",
    };

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-cocoa-700 font-body leading-tight" htmlFor="label">
            {label}
          </label>
        )}

        <div className="relative group">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-cocoa-400 pointer-events-none transition-colors duration-200 group-focus-within:text-champagne-500">
              {leftIcon}
            </div>
          )}

          {/* Input Field */}
          <input
            type={type}
            className={cn(
              // Base styles
              "w-full px-4 py-3 text-base placeholder-cocoa-400 text-cocoa-900 bg-transparent",
              "rounded-2xl border transition-all duration-300 ease-out",
              "focus:outline-none focus:ring-0",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",

              // Variants
              inputVariants[variant],

              // Icon spacing
              leftIcon && "pl-12",
              rightIcon && "pr-12",

              // Error state
              error && "border-error-500 focus:border-error-500 focus:shadow-error-500/20",

              // Loading state
              loading && "pr-12",

              // Performance optimizations
              "transform-gpu will-change-transform",
              className
            )}
            ref={ref}
            disabled={disabled || loading}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${props.id || 'input'}-error` : helperText ? `${props.id || 'input'}-helper` : undefined}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
          />

          {/* Animated Border Effect */}
          <div
            className={cn(
              "absolute inset-0 rounded-2xl transition-all duration-300 ease-out pointer-events-none",
              "border-2 border-champagne-500 opacity-0 scale-[1.02]",
              focused && !error && "opacity-100 scale-[1.02]",
              error && "border-error-500 opacity-100 scale-[1.02]"
            )}
          />

          {/* Right Icon or Loading Spinner */}
          {(rightIcon || loading) && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-champagne-300 border-t-champagne-500 rounded-full animate-spin" />
              ) : (
                <div className="text-cocoa-400 transition-colors duration-200 group-focus-within:text-champagne-500">
                  {rightIcon}
                </div>
              )}
            </div>
          )}

          {/* Floating Label Effect */}
          {label && variant === "luxury" && (
            <div
              className={cn(
                "absolute left-4 top-3 text-sm text-cocoa-500 transition-all duration-300 pointer-events-none",
                "bg-gradient-to-b from-transparent to-white/80 px-1",
                (focused || hasValue || props.placeholder) && "top-[-10px] left-3 text-xs text-champagne-600 bg-white px-2 rounded-full"
              )}
            >
              {label}
            </div>
          )}
        </div>

        {/* Helper Text */}
        {helperText && !error && (
          <p className="text-xs text-cocoa-500 font-body leading-relaxed">
            {helperText}
          </p>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center space-x-2 text-error-600 animate-pulse">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
      </div>
    );
  }
);

LuxuryInput.displayName = "LuxuryInput";

export { LuxuryInput };