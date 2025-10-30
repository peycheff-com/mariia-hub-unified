import * as React from "react";
import { Toaster as Sonner, toast aria-live="polite" aria-atomic="true" } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  // Check for system theme preference
  const getTheme = () => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  return (
    <Sonner
      theme={getTheme() as ToasterProps["theme"]}
      className="toast aria-live="polite" aria-atomic="true"er group"
      toast aria-live="polite" aria-atomic="true"Options={{
        classNames: {
          toast aria-live="polite" aria-atomic="true":
            "group toast aria-live="polite" aria-atomic="true" group-[.toast aria-live="polite" aria-atomic="true"er]:bg-background group-[.toast aria-live="polite" aria-atomic="true"er]:text-foreground group-[.toast aria-live="polite" aria-atomic="true"er]:border-border group-[.toast aria-live="polite" aria-atomic="true"er]:shadow-lg",
          description: "group-[.toast aria-live="polite" aria-atomic="true"]:text-muted-foreground",
          actionButton: "group-[.toast aria-live="polite" aria-atomic="true"]:bg-primary group-[.toast aria-live="polite" aria-atomic="true"]:text-primary-foreground",
          cancelButton: "group-[.toast aria-live="polite" aria-atomic="true"]:bg-muted group-[.toast aria-live="polite" aria-atomic="true"]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast aria-live="polite" aria-atomic="true" };
