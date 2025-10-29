import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Cancel = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<{variant:'default'|'destructive',title:string,desc:string}|null>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    const run = async () => {
      if (!token) {
        navigate('/');
        return;
      }
      const { data, error } = await supabase.functions.invoke('cancel-booking', { body: { token } });
      if (error || !data?.success) {
        setStatus({ variant: 'destructive', title: 'Cancellation failed', desc: error?.message || 'Link invalid or expired' });
      } else {
        setStatus({ variant: 'default', title: 'Booking cancelled', desc: 'Your booking has been cancelled.' });
      }
    };
    run();
  }, [token, navigate]);

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      {status && (
        <Alert variant={status.variant} className="mb-6">
          <AlertTitle>{status.title}</AlertTitle>
          <AlertDescription>{status.desc}</AlertDescription>
        </Alert>
      )}
      <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
    </div>
  );
};

export default Cancel;


