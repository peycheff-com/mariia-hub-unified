import { useToast } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast aria-live="polite" aria-atomic="true"";

export function Toaster() {
  const { toast aria-live="polite" aria-atomic="true"s } = useToast();

  return (
    <ToastProvider>
      {toast aria-live="polite" aria-atomic="true"s.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
