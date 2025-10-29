import { useEffect, useState } from 'react';

import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type Consent = {
  id?: string;
  user_id?: string | null;
  consent_given_at?: string;
};

interface CookieConsentProps {
  onConsent?: () => void;
}

export const CookieConsent = ({ onConsent }: CookieConsentProps = {}) => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkConsent = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const stored = localStorage.getItem('cookieConsent');
        if (stored === 'granted') {
          setVisible(false);
          onConsent?.();
          return;
        }
        if (user) {
          const { data } = await supabase
            .from('user_consents')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          if (data) {
            localStorage.setItem('cookieConsent', 'granted');
            setVisible(false);
            onConsent?.();
            return;
          }
        }
        setVisible(true);
      } finally {
        setLoading(false);
      }
    };
    checkConsent();
  }, [onConsent]);

  const accept = async () => {
    localStorage.setItem('cookieConsent', 'granted');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_consents').insert({
          user_id: user.id,
          consent_given_at: new Date().toISOString(),
        } as Consent);
      }
    } catch {
      // Ignore cookie storage errors
    }
    onConsent?.();
    setVisible(false);
  };

  if (loading || !visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <Card className="max-w-2xl mx-auto p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="text-sm text-muted-foreground">
          We use cookies for analytics and to improve your experience. You can change your preferences anytime in your account settings.
        </div>
        <div className="ml-auto flex gap-2">
          <Button size="sm" onClick={accept}>Accept</Button>
        </div>
      </Card>
    </div>
  );
};

export default CookieConsent;


