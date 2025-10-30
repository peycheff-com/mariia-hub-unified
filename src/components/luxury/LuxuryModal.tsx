import * as React from "react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  variant?: "default" | "luxury" | "minimal";
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  preventBodyScroll?: boolean;
  className?: string;
}

const LuxuryModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  variant = "luxury",
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  preventBodyScroll = true,
  className,
}) => {
  const [isAnimating, setIsAnimating] = React.useState(false);
  const modalRef = React.useRef<HTMLDivElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  // Size configurations
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[95vw] w-[95vw] max-h-[95vh]",
  };

  // Variant configurations
  const variantClasses = {
    default: "glass-luxury",
    luxury: "glass-luxury border-champagne/30 shadow-2xl",
    minimal: "glass-subtle border-transparent",
  };

  // Handle body scroll prevention
  React.useEffect(() => {
    if (isOpen && preventBodyScroll) {
      document.body.style.overflow = "hidden";
      previousFocusRef.current = document.activeElement as HTMLElement;
    } else {
      document.body.style.overflow = "";
      if (previousFocusRef.current && isOpen === false) {
        previousFocusRef.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, preventBodyScroll]);

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEscape && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, closeOnEscape, onClose]);

  // Focus management
  React.useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  };

  // Handle open/close animations
  React.useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // Small delay for backdrop to appear first
      setTimeout(() => {
        setIsAnimating(true);
      }, 10);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          isAnimating ? "opacity-100" : "opacity-0"
        )}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        ref={modalRef}
        className={cn(
          "relative transform transition-all duration-300 ease-out",
          "w-full max-h-[90vh] overflow-hidden rounded-3xl",
          "focus:outline-none focus:ring-0",
          variantClasses[variant],
          sizeClasses[size],
          isAnimating
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4",
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        aria-describedby={description ? "modal-description" : undefined}
        tabIndex={-1}
      >
        {/* Modal Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-champagne/10">
            <div className="flex-1">
              {title && (
                <h2
                  id="modal-title"
                  className="text-2xl font-semibold text-cocoa-900 font-display leading-tight"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id="modal-description"
                  className="mt-2 text-cocoa-600 font-body leading-relaxed"
                >
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                className={cn(
                  "ml-4 p-2 rounded-xl transition-all duration-200",
                  "text-cocoa-400 hover:text-cocoa-600 hover:bg-cocoa-100/50",
                  "focus:outline-none focus:ring-2 focus:ring-champagne-500 focus:ring-offset-2",
                  "transform hover:scale-110 active:scale-95"
                )}
                onClick={onClose}
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Modal Content */}
        <div className={cn(
          "overflow-y-auto",
          title || description ? "max-h-[calc(90vh-120px)]" : "max-h-[90vh]"
        )}>
          <div className="p-6">
            {children}
          </div>
        </div>

        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-champagne/30 rounded-tl-3xl" />
        <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-champagne/30 rounded-tr-3xl" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-champagne/30 rounded-bl-3xl" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-champagne/30 rounded-br-3xl" />
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export { LuxuryModal };