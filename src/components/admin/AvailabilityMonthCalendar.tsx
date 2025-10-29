import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Laptop, Dumbbell, Clock, Plus } from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  getDay
} from 'date-fns';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AvailabilitySlot, Booking } from '@/hooks/useAvailability';


interface AvailabilityMonthCalendarProps {
  slots: AvailabilitySlot[];
  bookings: Booking[];
  onAddSlot: (date: Date) => void;
  onEditSlot: (slot: AvailabilitySlot) => void;
  onSelectDate: (date: Date) => void;
  selectedDate: Date | null;
}

const getLocationIcon = (location: string) => {
  switch (location) {
    case 'studio': return <MapPin className="w-3 h-3" />;
    case 'online': return <Laptop className="w-3 h-3" />;
    case 'fitness': return <Dumbbell className="w-3 h-3" />;
    default: return <MapPin className="w-3 h-3" />;
  }
};

const getLocationColor = (location: string) => {
  switch (location) {
    case 'studio': return 'bg-lip-rose/20 text-lip-rose border-lip-rose/30';
    case 'online': return 'bg-sage/20 text-sage border-sage/30';
    case 'fitness': return 'bg-champagne/20 text-champagne border-champagne/30';
    default: return 'bg-pearl/20 text-pearl border-pearl/30';
  }
};

const AvailabilityMonthCalendar = ({ 
  slots, 
  bookings, 
  onAddSlot, 
  onEditSlot, 
  onSelectDate,
  selectedDate 
}: AvailabilityMonthCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getSlotsForDate = (date: Date) => {
    const dayOfWeek = getDay(date);
    return slots.filter(slot => slot.day_of_week === dayOfWeek);
  };

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => 
      isSameDay(new Date(booking.booking_date), date)
    );
  };

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <Card className="glass-card p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={previousMonth}
            className="text-pearl hover:bg-cocoa/50"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-champagne" />
            <h3 className="text-2xl font-serif text-pearl">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={nextMonth}
            className="text-pearl hover:bg-cocoa/50"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </Card>

      {/* Calendar Grid */}
      <Card className="glass-card p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-pearl/60 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, idx) => {
            const daySlots = getSlotsForDate(day);
            const dayBookings = getBookingsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            const isPast = day < new Date() && !isToday;

            return (
              <button
                key={idx}
                onClick={() => onSelectDate(day)}
                disabled={isPast}
                className={`
                  min-h-[100px] p-2 rounded-lg border-2 transition-all
                  ${!isCurrentMonth ? 'opacity-30' : ''}
                  ${isSelected ? 'ring-2 ring-champagne border-champagne' : 'border-graphite/20'}
                  ${isToday ? 'bg-champagne/10' : ''}
                  ${isPast ? 'cursor-not-allowed opacity-40' : 'hover:border-champagne/50 cursor-pointer'}
                  ${dayBookings.length > 0 ? 'bg-sage/5' : ''}
                `}
              >
                <div className="space-y-2">
                  {/* Date Number */}
                  <div className={`
                    text-sm font-medium text-right
                    ${isToday ? 'text-champagne font-bold' : 'text-pearl'}
                  `}>
                    {format(day, 'd')}
                  </div>

                  {/* Slots Indicators */}
                  {daySlots.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-center">
                      {daySlots.slice(0, 3).map((slot) => (
                        <div
                          key={slot.id}
                          className={`w-2 h-2 rounded-full ${getLocationColor(slot.location).split(' ')[0]}`}
                        />
                      ))}
                      {daySlots.length > 3 && (
                        <div className="text-[9px] text-pearl/60">+{daySlots.length - 3}</div>
                      )}
                    </div>
                  )}

                  {/* Bookings Count */}
                  {dayBookings.length > 0 && (
                    <Badge className="text-[9px] px-1 py-0 bg-sage/20 text-sage border-sage/30 w-full">
                      {dayBookings.length} booking{dayBookings.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card className="glass-card p-6 animate-scale-in">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-champagne" />
                <h3 className="text-xl font-serif text-pearl">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </h3>
              </div>
              <Button
                onClick={() => onAddSlot(selectedDate)}
                className="bg-champagne text-charcoal hover:bg-champagne/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Time Slot
              </Button>
            </div>

            {/* Availability Slots */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-pearl/70">Recurring Weekly Slots</h4>
              {getSlotsForDate(selectedDate).length > 0 ? (
                <div className="space-y-2">
                  {getSlotsForDate(selectedDate).map((slot) => (
                    <Card
                      key={slot.id}
                      className="glass-card p-4 hover:border-champagne/30 transition-colors cursor-pointer"
                      onClick={() => onEditSlot(slot)}
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-champagne" />
                        <span className="text-pearl font-medium">
                          {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                        </span>
                        <Badge className={`${getLocationColor(slot.location)} border`}>
                          {getLocationIcon(slot.location)}
                          <span className="ml-1.5">
                            {slot.location.charAt(0).toUpperCase() + slot.location.slice(1)}
                          </span>
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {slot.service_type}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-graphite/20 rounded-lg">
                  <Clock className="w-6 h-6 text-pearl/30 mx-auto mb-2" />
                  <p className="text-sm text-pearl/60">No slots for this day</p>
                </div>
              )}
            </div>

            {/* Bookings */}
            {getBookingsForDate(selectedDate).length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-pearl/70">Bookings</h4>
                <div className="space-y-2">
                  {getBookingsForDate(selectedDate).map((booking) => {
                    const isBooksy = booking.booking_source === 'booksy' || booking.booksy_appointment_id;
                    const time = new Date(booking.booking_date).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    
                    return (
                      <Card key={booking.id} className="bg-champagne/10 border-champagne/30 p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-pearl">
                                {(booking.services as any)?.title || 'Service'}
                              </div>
                              {booking.client_name && (
                                <div className="text-xs text-pearl/60 mt-0.5">
                                  {booking.client_name}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {isBooksy && (
                                <Badge className="bg-sage/20 text-sage border-sage/30 text-xs">
                                  Booksy
                                </Badge>
                              )}
                              <Badge className={
                                booking.status === 'confirmed' || booking.status === 'paid'
                                  ? 'bg-sage/20 text-sage' 
                                  : 'bg-champagne/20 text-champagne'
                              }>
                                {booking.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-pearl/70">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {time}
                            </div>
                            {(booking.services as any)?.duration_minutes && (
                              <div>
                                {(booking.services as any).duration_minutes} min
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AvailabilityMonthCalendar;
