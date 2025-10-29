import { useState } from 'react';
import { Calendar, MapPin, Laptop, Dumbbell, Clock, AlertCircle, Plus, Trash2, Edit2, User, DollarSign, X } from 'lucide-react';
import { format } from 'date-fns';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AvailabilitySlot, Booking } from '@/hooks/useAvailability';


interface AvailabilityCalendarProps {
  slots: Record<number, AvailabilitySlot[]>;
  bookings: Record<number, Booking[]>;
  onAddSlot: (dayOfWeek: number) => void;
  onEditSlot: (slot: AvailabilitySlot) => void;
  onDeleteSlot?: (slotId: string) => void;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

const AvailabilityCalendar = ({ slots, bookings, onAddSlot, onEditSlot, onDeleteSlot }: AvailabilityCalendarProps) => {
  const [dayViewOpen, setDayViewOpen] = useState(false);
  const [selectedDayData, setSelectedDayData] = useState<{
    day: number;
    slots: AvailabilitySlot[];
    bookings: Booking[];
  } | null>(null);
  const [hoveredBooking, setHoveredBooking] = useState<string | null>(null);

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const getTotalSlotsHours = (dayOfWeek: number) => {
    const daySlots = slots[dayOfWeek] || [];
    return daySlots.reduce((total, slot) => {
      const start = new Date(`2000-01-01T${slot.start_time}`);
      const end = new Date(`2000-01-01T${slot.end_time}`);
      return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);
  };

  const handleDayClick = (day: number) => {
    const daySlots = slots[day] || [];
    const dayBookings = bookings[day] || [];
    setSelectedDayData({ day, slots: daySlots, bookings: dayBookings });
    setDayViewOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Legend */}
      <Card className="glass-card p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-pearl/70">Legend:</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-lip-rose/40 border border-lip-rose" />
              <span className="text-xs text-pearl/70">Studio</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-sage/40 border border-sage" />
              <span className="text-xs text-pearl/70">Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-champagne/40 border border-champagne" />
              <span className="text-xs text-pearl/70">Fitness Center</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3 h-3 text-champagne" />
              <span className="text-xs text-pearl/70">Has Bookings</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Week View - Interactive Calendar */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[1, 2, 3, 4, 5, 6, 0].map((day) => {
          const daySlots = slots[day] || [];
          const dayBookings = bookings[day] || [];
          const hasBookings = dayBookings.length > 0;
          const totalHours = getTotalSlotsHours(day);

          return (
            <Card
              key={day}
              onClick={() => handleDayClick(day)}
              className="glass-card p-4 cursor-pointer transition-all hover:scale-105 hover:shadow-xl hover:border-champagne/50 animate-fade-in group"
            >
              <div className="text-center space-y-3">
                <div>
                  <div className="text-xs text-pearl/60 font-medium uppercase tracking-wider">{DAY_ABBR[day]}</div>
                  <div className="text-base font-serif text-pearl mt-1 font-semibold">{DAYS[day]}</div>
                </div>
                
                {/* Stats */}
                <div className="space-y-2">
                  {totalHours > 0 && (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-champagne">
                      <Clock className="w-3 h-3" />
                      <span className="font-medium">{totalHours}h</span>
                    </div>
                  )}
                  
                  {daySlots.length > 0 && (
                    <div className="text-xs text-pearl/70">
                      {daySlots.length} slot{daySlots.length !== 1 ? 's' : ''}
                    </div>
                  )}

                  {hasBookings && (
                    <Badge className="bg-champagne/20 text-champagne border-champagne/40 text-[10px] px-2 py-0.5">
                      {dayBookings.length} booking{dayBookings.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>

                {/* Location Icons Preview */}
                {daySlots.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center">
                    {daySlots.slice(0, 3).map((slot) => (
                      <div
                        key={slot.id}
                        className={`p-1 rounded border ${getLocationColor(slot.location)}`}
                      >
                        {getLocationIcon(slot.location)}
                      </div>
                    ))}
                    {daySlots.length > 3 && (
                      <div className="text-[10px] text-pearl/60 self-center">+{daySlots.length - 3}</div>
                    )}
                  </div>
                )}

                {daySlots.length === 0 && (
                  <div className="text-xs text-pearl/40 italic">No slots</div>
                )}

                {/* Hover indicator */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-champagne">
                  Click to view →
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Interactive Day View Dialog */}
      <Dialog open={dayViewOpen} onOpenChange={setDayViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] glass-card">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-serif flex items-center gap-3">
                <Calendar className="w-6 h-6 text-champagne" />
                {selectedDayData && DAYS[selectedDayData.day]}
              </DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedDayData && onAddSlot(selectedDayData.day)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Slot
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh] pr-4">
            {selectedDayData && (
              <div className="space-y-6">
                {/* Availability Slots Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <h4 className="font-semibold text-pearl flex items-center gap-2">
                      <Clock className="w-4 h-4 text-champagne" />
                      Availability Slots
                    </h4>
                    <span className="text-sm text-pearl/60">
                      {selectedDayData.slots.length} slots · {getTotalSlotsHours(selectedDayData.day)}h total
                    </span>
                  </div>

                  {selectedDayData.slots.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDayData.slots.map((slot) => {
                        const duration = (new Date(`2000-01-01T${slot.end_time}`).getTime() - new Date(`2000-01-01T${slot.start_time}`).getTime()) / (1000 * 60);
                        return (
                          <Card
                            key={slot.id}
                            className="p-4 hover:border-champagne/50 transition-all hover:shadow-md group relative"
                          >
                            {!slot.is_available && (
                              <div className="absolute inset-0 bg-graphite/10 rounded-lg pointer-events-none" />
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="flex items-center gap-2 font-medium min-w-[140px]">
                                  <Clock className="w-4 h-4 text-champagne" />
                                  <span className="tabular-nums text-lg">{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
                                </div>
                                <span className="text-sm text-muted-foreground">({duration}min)</span>
                                <Badge className={`${getLocationColor(slot.location)} border`}>
                                  {getLocationIcon(slot.location)}
                                  <span className="ml-1.5 capitalize">
                                    {slot.location}
                                  </span>
                                </Badge>
                                {!slot.is_available && (
                                  <Badge variant="destructive" className="text-xs">
                                    Unavailable
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="text-xs capitalize">
                                  {slot.service_type}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEditSlot(slot)}
                                  className="h-8 w-8 p-0"
                                  title="Edit slot"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                {onDeleteSlot && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDeleteSlot(slot.id)}
                                    className="h-8 w-8 p-0 text-red-400 hover:text-red-500"
                                    title="Delete slot"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            {slot.notes && (
                              <p className="text-sm text-muted-foreground mt-2 ml-6 italic">"{slot.notes}"</p>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 border border-dashed rounded-lg">
                      <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-3">No availability slots for this day</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAddSlot(selectedDayData.day)}
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add first slot
                      </Button>
                    </div>
                  )}
                </div>

                {/* Bookings Section */}
                {selectedDayData.bookings.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <h4 className="font-semibold text-pearl flex items-center gap-2">
                        <User className="w-4 h-4 text-champagne" />
                        Confirmed Bookings
                      </h4>
                      <span className="text-sm text-pearl/60">
                        {selectedDayData.bookings.length} booking{selectedDayData.bookings.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {selectedDayData.bookings.map((booking) => {
                        const isBooksy = booking.booking_source === 'booksy' || booking.booksy_appointment_id;
                        const time = new Date(booking.booking_date).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                        const isHovered = hoveredBooking === booking.id;
                        
                        return (
                          <Card 
                            key={booking.id} 
                            className={`
                              transition-all cursor-pointer p-4
                              ${isHovered ? 'bg-champagne/20 border-champagne shadow-lg' : 'bg-champagne/10 border-champagne/30'}
                            `}
                            onMouseEnter={() => setHoveredBooking(booking.id)}
                            onMouseLeave={() => setHoveredBooking(null)}
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-semibold text-lg">
                                    {(booking.services as any)?.title || 'Service'}
                                  </div>
                                  {booking.client_name && (
                                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                                      <User className="w-3.5 h-3.5" />
                                      {booking.client_name}
                                      {booking.client_email && (
                                        <span className="text-muted-foreground/60">· {booking.client_email}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  {isBooksy && (
                                    <Badge className="bg-sage/20 text-sage border-sage/30">
                                      Booksy
                                    </Badge>
                                  )}
                                  <Badge className={
                                    booking.status === 'confirmed' || booking.status === 'paid'
                                      ? 'bg-sage/20 text-sage border-sage' 
                                      : booking.status === 'cancelled'
                                      ? 'bg-graphite/20 text-muted-foreground border-graphite'
                                      : 'bg-champagne/20 text-champagne border-champagne'
                                  }>
                                    {booking.status}
                                  </Badge>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1.5 font-medium tabular-nums">
                                  <Clock className="w-4 h-4" />
                                  {time}
                                </div>
                                {(booking.services as any)?.duration_minutes && (
                                  <div>
                                    {(booking.services as any).duration_minutes} min
                                  </div>
                                )}
                                {booking.amount_paid && (
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="w-4 h-4" />
                                    {booking.amount_paid} {booking.currency || 'PLN'}
                                  </div>
                                )}
                              </div>

                              {(booking.notes || booking.client_notes) && (
                                <div className="pt-2 border-t">
                                  <p className="text-sm text-muted-foreground italic">"{booking.notes || booking.client_notes}"</p>
                                </div>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AvailabilityCalendar;
