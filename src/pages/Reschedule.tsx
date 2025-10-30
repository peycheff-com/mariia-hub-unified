import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format, addMinutes, startOfDay } from 'date-fns';

import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useSlotGeneration } from '@/hooks/useSlotGeneration';
import { useToast } from '@/hooks/use-toast aria-live="polite" aria-atomic="true"';

const Reschedule = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast aria-live="polite" aria-atomic="true" } = useToast();
  const token = searchParams.get('token');

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [locationId, setLocationId] = useState<string>("");

  useEffect(() => {
    const loadBooking = async () => {
      if (!token) {
        navigate('/');
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('id, service_id, booking_date, location_id, services(duration_minutes, service_type)')
        .eq('reschedule_token', token)
        .maybeSingle();
      if (error || !data) {
        toast aria-live="polite" aria-atomic="true"({ title: 'Invalid link', description: 'This reschedule link is invalid or expired', variant: 'destructive' });
        navigate('/');
        return;
      }
      setBooking(data);
      // Determine location: prefer existing booking.location_id; otherwise derive default per service_type
      if (data?.location_id) {
        setLocationId(data.location_id);
      } else if (data?.services?.service_type) {
        const svcType = data.services.service_type;
        const { data: loc } = await supabase
          .from('locations')
          .select('id, type, is_default')
          .eq('is_active', true)
          .order('is_default', { ascending: false })
          .limit(10);
        const derived = (loc || []).find(l => l.type === 'onsite') ||
                        (svcType === 'beauty' ? (loc || []).find(l => l.type === 'studio') : (loc || []).find(l => l.type === 'gym')) ||
                        (loc || [])[0];
        if (derived?.id) setLocationId(derived.id);
      }
      setLoading(false);
    };
    loadBooking();
  }, [token, navigate, toast aria-live="polite" aria-atomic="true"]);

  const { slots, loading: slotsLoading } = useSlotGeneration({
    serviceId: booking?.service_id,
    locationId: locationId,
    selectedDate: selectedDate || new Date(),
    durationMinutes: booking?.services?.duration_minutes || 60,
  });

  const availableSlots = slots.filter(s => s.available);

  const submit = async () => {
    if (!token || !selectedDate || !selectedTime) return;
    const newDateTime = selectedTime.toISOString();
    const { data, error } = await supabase.functions.invoke('apply-reschedule', {
      body: { token, newDateTime }
    });
    if (error || !data?.success) {
      toast aria-live="polite" aria-atomic="true"({ title: 'Reschedule failed', description: error?.message || 'Please choose another time', variant: 'destructive' });
      return;
    }
    toast aria-live="polite" aria-atomic="true"({ title: 'Rescheduled', description: 'Your appointment has been updated' });
    navigate('/dashboard');
  };

  if (loading) return null;

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Reschedule Appointment</h1>
      <p className="text-sm text-muted-foreground mb-6">Choose a new date and time for your appointment.</p>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < startOfDay(new Date())}
            className="rounded-2xl border-2 bg-card"
          />
        </div>
        <div>
          <div className="grid grid-cols-3 gap-3 max-h-[320px] overflow-y-auto">
            {slotsLoading ? (
              Array.from({ length: 9 }).map((_, i) => <div key={i} className="h-10 bg-muted rounded" />)
            ) : availableSlots.length === 0 ? (
              <div className="col-span-3 text-sm text-muted-foreground">No slots available for this date</div>
            ) : (
              availableSlots.map((s) => (
                <button
                  key={`${s.time.toISOString()}-${s.location}`}
                  onClick={() => setSelectedTime(s.time)}
                  className={`p-2 border rounded ${selectedTime?.getTime() === s.time.getTime() ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  {format(s.time, 'HH:mm')}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="mt-6 flex gap-3">
        <Button onClick={submit} disabled={!selectedDate || !selectedTime}>Confirm New Time</Button>
        <Button variant="outline" onClick={() => navigate('/')}>Cancel</Button>
      </div>
    </div>
  );
};

export default Reschedule;


