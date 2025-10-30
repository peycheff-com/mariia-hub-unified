import { useState } from "react";
import { Mail, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";
import { ResendService } from "@/lib/resend";

const NewsletterSignup = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast aria-live="polite" aria-atomic="true" } = useToast();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast aria-live="polite" aria-atomic="true"({
        title: t('newsletter.error', 'Error'),
        description: t('newsletter.invalidEmail', 'Please enter a valid email'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Subscribe using ResendService
      await ResendService.subscribeToList(email.toLowerCase().trim());

      toast aria-live="polite" aria-atomic="true"({
        title: t('newsletter.success', 'Subscribed!'),
        description: t('newsletter.successDesc', 'Thank you for subscribing to our newsletter'),
      });
      setEmail("");

      // Optionally send a welcome email
      try {
        await ResendService.sendNewsletter({
          to: email.toLowerCase().trim(),
          template: 'weekly',
          data: {
            content: `
              <h3>Welcome to BM Beauty Studio! 🎉</h3>
              <p>Thank you for subscribing to our newsletter. You'll receive weekly updates about:</p>
              <ul>
                <li>New beauty treatments and services</li>
                <li>Fitness programs and tips</li>
                <li>Special promotions and discounts</li>
                <li>Beauty and wellness insights</li>
              </ul>
              <p>Stay tuned for our next newsletter!</p>
            `,
            unsubscribe_url: `${window.location.origin}/unsubscribe?email=${encodeURIComponent(email)}`,
            manage_url: `${window.location.origin}/manage-newsletter`
          }
        });
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't show error to user since subscription succeeded
      }

    } catch (error: any) {
      toast aria-live="polite" aria-atomic="true"({
        title: t('newsletter.error', 'Error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1 w-full">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('newsletter.placeholder', 'Enter your email')}
            className="pl-10 h-11 sm:h-12 glass-card w-full"
            disabled={loading}
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          size="lg"
          className="whitespace-nowrap px-6 sm:px-8 h-11 sm:h-12 flex-shrink-0 w-full sm:w-auto"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            t('newsletter.subscribe', 'Subscribe')
          )}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground mt-3 text-center px-2">
        {t('newsletter.privacy', 'We respect your privacy. Unsubscribe anytime.')}
      </p>
    </div>
  );
};

export default NewsletterSignup;
