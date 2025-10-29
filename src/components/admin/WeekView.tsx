import { Calendar, Clock, User, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, parseISO, isSameDay } from 'date-fns';
import { useState } from 'react';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Booking } from '@/hooks/useAvailability';


interface WeekViewProps {
  bookings: Booking[];
  onBookingClick: (booking: Booking) => void;
}

const WeekView = ({ bookings, onBookingClick }: WeekViewProps) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getBookingsForDay = (date: Date) => {
    return bookings.filter(booking => {
      const bookingDate = parseISO(booking.booking_date);
      return isSameDay(bookingDate, date);
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-sage/20 text-sage border-sage/30';
      case 'pending': return 'bg-champagne/20 text-champagne border-champagne/30';
      case 'cancelled': return 'bg-graphite/20 text-pearl/60 border-graphite/30';
      case 'completed': return 'bg-bronze/20 text-bronze border-bronze/30';
      default: return 'bg-pearl/20 text-pearl border-pearl/30';
    }
  };

  return (
    <div className="space-y-4">
      {/* Week Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-serif text-pearl">
          Week of {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            className="border-graphite/20"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(new Date())}
            className="border-graphite/20"
          >
            This Week
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            className="border-graphite/20"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {daysInWeek.map(date => {
          const dayBookings = getBookingsForDay(date);
          const isToday = isSameDay(date, new Date());
          
          return (
            <Card
              key={date.toISOString()}
              className={`p-4 ${
                isToday ? 'ring-2 ring-champagne/50 bg-champagne/5' : 'bg-charcoal/50'
              } border-graphite/20`}
            >
              <div className="space-y-3">
                {/* Day Header */}
                <div className="border-b border-graphite/20 pb-2">
                  <div className={`text-xs uppercase tracking-wider ${
                    isToday ? 'text-champagne' : 'text-pearl/60'
                  }`}>
                    {format(date, 'EEE')}
                  </div>
                  <div className={`text-2xl font-bold ${
                    isToday ? 'text-champagne' : 'text-pearl'
                  }`}>
                    {format(date, 'd')}
                  </div>
                  {isToday && (
                    <Badge className="bg-champagne/20 text-champagne mt-1 text-[10px]">
                      Today
                    </Badge>
                  )}
                </div>

                {/* Bookings */}
                <div className="space-y-2">
                  {dayBookings.length === 0 ? (
                    <p className="text-pearl/40 text-xs italic">No bookings</p>
                  ) : (
                    dayBookings.map(booking => {
                      const bookingTime = parseISO(booking.booking_date);
                      
                      return (
                        <Card
                          key={booking.id}
                          onClick={() => onBookingClick(booking)}
                          className="bg-cocoa/30 border-graphite/20 p-2 cursor-pointer hover:bg-cocoa/50 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-pearl">
                                {format(bookingTime, 'HH:mm')}
                              </span>
                              <Badge 
                                variant="outline" 
                                className={`${getStatusColor(booking.status)} text-[10px]`}
                              >
                                {booking.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-pearl/80 font-medium">
                              {booking.client_name}
                            </p>
                            <p className="text-[10px] text-pearl/60">
                              {booking.services?.title}
                            </p>
                            {booking.amount_paid && (
                              <div className="flex items-center gap-1 text-[10px] text-pearl/50">
                                <DollarSign className="w-3 h-3" />
                                {booking.amount_paid} {booking.currency}
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>

                {/* Day Stats */}
                <div className="pt-2 border-t border-graphite/20 text-[10px] text-pearl/50">
                  {dayBookings.length} booking{dayBookings.length !== 1 ? 's' : ''}
                  {dayBookings.length > 0 && (
                    <>
                      {' • '}
                      {dayBookings.reduce((sum, b) => 
                        sum + (Number(b.amount_paid) || Number(b.services?.price_from) || 0), 0
                      )} PLN
                    </>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Week Summary */}
      <Card className="bg-charcoal/50 border-graphite/20 p-4">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xs text-pearl/60">Total Bookings</p>
            <p className="text-2xl font-bold text-pearl">
              {bookings.filter(b => {
                const bookingDate = parseISO(b.booking_date);
                return bookingDate >= weekStart && bookingDate <= weekEnd;
              }).length}
            </p>
          </div>
          <div>
            <p className="text-xs text-pearl/60">Confirmed</p>
            <p className="text-2xl font-bold text-sage">
              {bookings.filter(b => {
                const bookingDate = parseISO(b.booking_date);
                return b.status === 'confirmed' && bookingDate >= weekStart && bookingDate <= weekEnd;
              }).length}
            </p>
          </div>
          <div>
            <p className="text-xs text-pearl/60">Pending</p>
            <p className="text-2xl font-bold text-champagne">
              {bookings.filter(b => {
                const bookingDate = parseISO(b.booking_date);
                return b.status === 'pending' && bookingDate >= weekStart && bookingDate <= weekEnd;
              }).length}
            </p>
          </div>
          <div>
            <p className="text-xs text-pearl/60">Revenue</p>
            <p className="text-2xl font-bold text-pearl">
              {bookings
                .filter(b => {
                  const bookingDate = parseISO(b.booking_date);
                  return (b.status === 'confirmed' || b.status === 'completed') && 
                         bookingDate >= weekStart && bookingDate <= weekEnd;
                })
                .reduce((sum, b) => sum + (Number(b.amount_paid) || Number(b.services?.price_from) || 0), 0)
                .toFixed(0)} PLN
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WeekView;