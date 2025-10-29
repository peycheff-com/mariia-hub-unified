import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { CheckCircle, Calendar, MessageCircle, Mail, MapPin } from "lucide-react";
import { format } from "date-fns";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PostBookingFeedbackWidget } from "@/components/feedback";

const Success = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  const sessionId = searchParams.get('session_id');
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ variant: "default" | "destructive"; title: string; description: string } | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId && !sessionId) {
        setStatus({
          variant: "destructive",
          title: "Missing Information",
          description: "We couldn't find your payment details. Please check the link in your email or contact support.",
        });
        setLoading(false);
        return;
      }

      setLoading(true);
      setStatus(null);

      try {
        let resolvedBookingId = bookingId;

        if (!resolvedBookingId && sessionId) {
          const { data, error } = await supabase.functions.invoke('verify-booking-payment', {
            body: { sessionId },
          });

          if (error) {
            throw new Error(error.message || 'Failed to verify payment');
          }

          if (!data?.bookingId) {
            throw new Error('Booking not found for this payment session.');
          }

          resolvedBookingId = data.bookingId;

          if (data.success) {
            setStatus({
              variant: "default",
              title: "Payment Confirmed",
              description: "Your booking has been verified successfully.",
            });
          } else {
            setStatus({
              variant: "destructive",
              title: "Payment Pending",
              description: data.paymentStatus
                ? `Your payment is currently marked as ${data.paymentStatus}. Please contact us if this seems incorrect.`
                : 'We were unable to confirm your payment. Please contact support.',
            });
          }
        }

        if (!resolvedBookingId) {
          throw new Error('Booking details are unavailable.');
        }

        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select('*, services(title, service_type, duration_minutes)')
          .eq('id', resolvedBookingId)
          .single();

        if (bookingError) {
          throw new Error(bookingError.message || 'Failed to load booking details');
        }

        setBooking(bookingData);
      } catch (error: any) {
        setBooking(null);
        setStatus({
          variant: "destructive",
          title: "Verification Error",
          description: error?.message || 'Something went wrong while verifying your booking.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, sessionId]);

  const addToCalendar = () => {
    if (!booking) return;

    const startDate = new Date(booking.booking_date);
    const endDate = new Date(startDate.getTime() + (booking.services?.duration_minutes || 60) * 60000);
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(booking.services?.title || 'Appointment')}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${encodeURIComponent(`Booking with Mariia Borysevych\nLocation: Smolna 8, Warsaw`)}&location=${encodeURIComponent('ul. Smolna 8, lok. 254, Warszawa')}`;
    
    window.open(calendarUrl, '_blank');
  };

  const downloadICS = () => {
    if (!booking) return;
    const startDate = new Date(booking.booking_date);
    const endDate = new Date(startDate.getTime() + (booking.services?.duration_minutes || 60) * 60000);
    const dt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Mariia Borysevych//Booking//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${booking.id}@mariiaborysevych.com`,
      `DTSTAMP:${dt(new Date())}`,
      `DTSTART:${dt(startDate)}`,
      `DTEND:${dt(endDate)}`,
      `SUMMARY:${(booking.services?.title || 'Appointment').replace(/\n/g, ' ')}`,
      'DESCRIPTION:Appointment with Mariia Borysevych',
      'LOCATION:ul. Smolna 8, lok. 254, Warszawa',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-${booking.id}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="py-20">
        <div className="container mx-auto px-6 md:px-8 max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-sage/20 mb-6">
              <CheckCircle className="w-12 h-12 text-sage" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Booking Confirmed!</h1>
            <p className="text-xl text-muted-foreground">
              {loading ? 'Loading your booking details...' : booking
                ? `Your ${booking.services?.title} appointment has been received`
                : 'We\'ve received your request and will confirm your appointment shortly'}
            </p>
          </div>

          {status && (
            <Alert variant={status.variant} className="mb-8 text-left">
              <AlertTitle>{status.title}</AlertTitle>
              <AlertDescription>{status.description}</AlertDescription>
            </Alert>
          )}

          {booking && !loading && (
            <div className="bg-muted/30 rounded-2xl p-8 mb-8">
              <h2 className="text-2xl font-semibold mb-6">Appointment Details</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Service</p>
                    <p className="font-semibold">{booking.services?.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date & Time</p>
                    <p className="font-semibold">
                      {format(new Date(booking.booking_date), 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="text-sm">
                      {format(new Date(booking.booking_date), 'h:mm a')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Duration</p>
                    <p className="font-semibold">{booking.services?.duration_minutes} minutes</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Location</p>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                      <div>
                        <p className="font-semibold">ul. Smolna 8, lok. 254</p>
                        <p className="text-sm">00-375 Warszawa</p>
                      </div>
                    </div>
                  </div>
                  {booking.amount_paid && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Amount Paid</p>
                      <p className="font-semibold text-lg">
                        {booking.amount_paid} {booking.currency?.toUpperCase()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4 mb-12">
            <Button 
              variant="outline" 
              size="lg" 
              className="h-auto py-6 flex flex-col gap-2"
              onClick={addToCalendar}
              disabled={!booking}
            >
              <Calendar className="w-6 h-6" />
              <span>Add to Calendar</span>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="h-auto py-6 flex flex-col gap-2"
              onClick={downloadICS}
              disabled={!booking}
            >
              <Calendar className="w-6 h-6" />
              <span>Download .ics</span>
            </Button>
            
            <Button variant="outline" size="lg" className="h-auto py-6 flex flex-col gap-2" asChild>
              <a href="https://wa.me/48536200573" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-6 h-6" />
                <span>WhatsApp</span>
              </a>
            </Button>
            
            <Button variant="outline" size="lg" className="h-auto py-6 flex flex-col gap-2" asChild>
              <a href="mailto:hi@mariiaborysevych.com">
                <Mail className="w-6 h-6" />
                <span>Email Us</span>
              </a>
            </Button>
          </div>

          <div className="bg-gradient-to-br from-primary/5 to-background rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-6">What Happens Next?</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Confirmation Email</h3>
                  <p className="text-muted-foreground">
                    You'll receive a confirmation email within 24 hours with all the details
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Preparation Guide</h3>
                  <p className="text-muted-foreground">
                    Check your email for specific preparation instructions for your service
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Questions?</h3>
                  <p className="text-muted-foreground">
                    Feel free to reach out on WhatsApp anytime. I'm here to help!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 rounded-2xl p-6 mb-8">
            <h3 className="font-semibold mb-3">Cancellation Policy</h3>
            <p className="text-sm text-muted-foreground">
              Free cancellation up to 48 hours before your appointment. Please contact us via WhatsApp 
              or email if you need to reschedule.
            </p>
          </div>

          {/* Feedback Widget */}
          {booking && (
            <PostBookingFeedbackWidget
              bookingId={booking.id}
              serviceName={booking.services?.title || 'your appointment'}
              bookingDate={booking.booking_date}
              compact={true}
              autoShowDelay={10000} // Show after 10 seconds
            />
          )}

          <div className="text-center space-y-4">
            <Button size="lg" asChild>
              <Link to="/dashboard">View My Bookings</Link>
            </Button>
            <div>
              <Button variant="ghost" asChild>
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Success;
