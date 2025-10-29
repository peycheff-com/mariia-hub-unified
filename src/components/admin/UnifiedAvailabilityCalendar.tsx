import { useState, useEffect } from 'react';
import {
  Calendar, MapPin, Laptop, Dumbbell, Clock, User, DollarSign, Edit2, Trash2,
  Check, X, GripVertical, ChevronLeft, ChevronRight, AlertTriangle, Plus,
  RefreshCw, Sparkles
} from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  addMinutes,
  setHours,
  setMinutes as setMin
} from 'date-fns';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AvailabilitySlot, Booking } from '@/hooks/useAvailability';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


interface UnifiedAvailabilityCalendarProps {
  slots: AvailabilitySlot[];
  bookings: Booking[];
  onSlotUpdate: (slot: AvailabilitySlot) => void;
  onSlotDelete: (slotId: string) => void;
  onAddSlot: (dayOfWeek: number) => void;
  onRefresh: () => void;
}

interface TimeSlotEvent {
  id: string;
  type: 'booking' | 'block' | 'hold';
  title: string;
  startTime: Date;
  endTime: Date;
  status?: string;
  color: string;
  booking?: any;
  block?: any;
  hold?: any;
}

const UnifiedAvailabilityCalendar = ({
  slots,
  bookings,
  onSlotUpdate,
  onSlotDelete,
  onAddSlot,
  onRefresh
}: UnifiedAvailabilityCalendarProps) => {
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayViewOpen, setDayViewOpen] = useState(false);
  const [timelineViewOpen, setTimelineViewOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [draggingBooking, setDraggingBooking] = useState<Booking | null>(null);
  const [events, setEvents] = useState<TimeSlotEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [createBlockOpen, setCreateBlockOpen] = useState(false);
  const [editEventOpen, setEditEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimeSlotEvent | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'timeline'>('month');

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const hours = Array.from({ length: 15 }, (_, i) => i + 6); // 6am to 9pm

  const LOCATION_ICONS = {
    studio: MapPin,
    online: Laptop,
    fitness: Dumbbell,
  };

  const LOCATION_COLORS = {
    studio: 'text-lip-rose',
    online: 'text-blue-400',
    fitness: 'text-sage',
  };

  // Load events for selected date
  useEffect(() => {
    if (selectedDate && timelineViewOpen) {
      loadDayEvents();
    }
  }, [selectedDate, timelineViewOpen]);

  const loadDayEvents = async () => {
    if (!selectedDate) return;

    setLoadingEvents(true);
    try {
      const dayStart = setHours(setMin(selectedDate, 0), 0);
      const dayEnd = setHours(setMin(selectedDate, 59), 23);

      // Get resource
      const { data: resource } = await supabase
        .from('resources')
        .select('id')
        .eq('is_active', true)
        .single();

      if (!resource) return;

      // Load bookings
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          *,
          services(title, service_type, duration_minutes),
          locations(name)
        `)
        .eq('resource_id', resource.id)
        .gte('booking_date', dayStart.toISOString())
        .lte('booking_date', dayEnd.toISOString())
        .in('status', ['confirmed', 'pending']);

      // Load blocks
      const { data: blocks } = await supabase
        .from('calendar_blocks')
        .select('*')
        .eq('resource_id', resource.id)
        .gte('start_time', dayStart.toISOString())
        .lte('start_time', dayEnd.toISOString());

      // Load holds
      const { data: holds } = await supabase
        .from('holds')
        .select('*, services(title)')
        .eq('resource_id', resource.id)
        .gt('expires_at', new Date().toISOString())
        .gte('start_time', dayStart.toISOString())
        .lte('start_time', dayEnd.toISOString());

      const allEvents: TimeSlotEvent[] = [];

      // Convert bookings
      if (bookingsData) {
        bookingsData.forEach(booking => {
          const color = booking.services?.service_type === 'beauty' ? 'bg-rose-500' :
                       booking.services?.service_type === 'fitness' ? 'bg-teal-500' : 'bg-blue-500';

          const clientName = booking.client_name || booking.client_email || 'Client';

          allEvents.push({
            id: booking.id,
            type: 'booking',
            title: `${booking.services?.title || 'Service'} - ${clientName}`,
            startTime: new Date(booking.booking_date),
            endTime: addMinutes(new Date(booking.booking_date), booking.services?.duration_minutes || 60),
            status: booking.status,
            color,
            booking,
          });
        });
      }

      // Convert blocks
      if (blocks) {
        blocks.forEach(block => {
          const color = block.reason === 'booksy' ? 'bg-purple-500' :
                       block.reason === 'travel' ? 'bg-gray-500' : 'bg-orange-500';

          allEvents.push({
            id: block.id,
            type: 'block',
            title: `${block.reason.toUpperCase()} - ${block.notes || ''}`,
            startTime: new Date(block.start_time),
            endTime: new Date(block.end_time),
            color,
            block,
          });
        });
      }

      // Convert holds
      if (holds) {
        holds.forEach(hold => {
          allEvents.push({
            id: hold.id,
            type: 'hold',
            title: `HOLD - ${hold.services?.title || ''}`,
            startTime: new Date(hold.start_time),
            endTime: new Date(hold.end_time),
            color: 'bg-yellow-500 border-2 border-dashed',
            hold,
          });
        });
      }

      setEvents(allEvents);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load calendar events',
        variant: 'destructive',
      });
    } finally {
      setLoadingEvents(false);
    }
  };

  const getLocationIcon = (location: string) => {
    const Icon = LOCATION_ICONS[location as keyof typeof LOCATION_ICONS] || MapPin;
    return <Icon className={`w-3 h-3 ${LOCATION_COLORS[location as keyof typeof LOCATION_COLORS]}`} />;
  };

  const getSlotsForDay = (date: Date) => {
    const dayOfWeek = date.getDay();
    return slots.filter(slot => slot.day_of_week === dayOfWeek && slot.is_available);
  };

  const getBookingsForDay = (date: Date) => {
    return bookings.filter(booking => {
      const bookingDate = parseISO(booking.booking_date);
      return isSameDay(bookingDate, date);
    });
  };

  const getTotalSlotsHours = (daySlots: AvailabilitySlot[]) => {
    return daySlots.reduce((total, slot) => {
      const start = slot.start_time.split(':');
      const end = slot.end_time.split(':');
      const hours = (parseInt(end[0]) - parseInt(start[0])) + (parseInt(end[1]) - parseInt(start[1])) / 60;
      return total + hours;
    }, 0).toFixed(1);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    if (viewMode === 'timeline') {
      setTimelineViewOpen(true);
    } else {
      setDayViewOpen(true);
    }
  };

  const handleTimelineSlotClick = (hour: number) => {
    if (!selectedDate) return;

    const start = setHours(setMin(selectedDate, 0), hour);
    const end = addMinutes(start, 60);

    // Check if slot is occupied
    const hasConflict = events.some(event => {
      return (start >= event.startTime && start < event.endTime) ||
             (end > event.startTime && end <= event.endTime) ||
             (start <= event.startTime && end >= event.endTime);
    });

    if (hasConflict) {
      toast({
        title: 'Slot Occupied',
        description: 'This time slot is already booked or blocked',
        variant: 'destructive',
      });
      return;
    }

    setSelectedSlot({ start, end });
    setCreateBlockOpen(true);
  };

  const handleCreateBlock = async (reason: string, notes: string) => {
    if (!selectedSlot) return;

    try {
      const { data: resource } = await supabase
        .from('resources')
        .select('id')
        .eq('is_active', true)
        .single();

      if (!resource) throw new Error('No resource found');

      const { error } = await supabase
        .from('calendar_blocks')
        .insert({
          resource_id: resource.id,
          start_time: selectedSlot.start.toISOString(),
          end_time: selectedSlot.end.toISOString(),
          reason,
          notes,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Block created successfully',
      });

      setCreateBlockOpen(false);
      setSelectedSlot(null);
      loadDayEvents();
      onRefresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create block',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteEvent = async (event: TimeSlotEvent) => {
    if (!confirm(`Delete this ${event.type}?`)) return;

    try {
      if (event.type === 'booking') {
        const { error } = await supabase
          .from('bookings')
          .update({ status: 'cancelled' })
          .eq('id', event.id);

        if (error) throw error;
      } else if (event.type === 'block') {
        const { error } = await supabase
          .from('calendar_blocks')
          .delete()
          .eq('id', event.id);

        if (error) throw error;
      } else if (event.type === 'hold') {
        const { error } = await supabase
          .from('holds')
          .delete()
          .eq('id', event.id);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: `${event.type} deleted successfully`,
      });

      loadDayEvents();
      onRefresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete event',
        variant: 'destructive',
      });
    }
  };

  const handleBookingUpdate = async (bookingId: string, updates: any) => {
    const { error } = await supabase.from('bookings').update(updates).eq('id', bookingId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Booking updated' });
      setEditingBooking(null);
      onRefresh();
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled') => {
    await handleBookingUpdate(bookingId, { status: newStatus });
  };

  const handleRefund = async (bookingId: string) => {
    const amountStr = prompt('Refund amount (PLN):');
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (Number.isNaN(amount) || amount <= 0) return;
    try {
      const { error } = await supabase.functions.invoke('refund-payment', {
        body: { bookingId, amount, reason: 'admin_initiated' }
      });
      if (error) throw error;
      toast({ title: 'Refund issued' });
      onRefresh();
    } catch (e: any) {
      toast({ title: 'Refund failed', description: e?.message, variant: 'destructive' });
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !selectedDate) return;

    const booking = draggingBooking;
    if (!booking) return;

    // Parse the destination time from the droppable ID (format: "time-HH:MM")
    const newTime = result.destination.droppableId.replace('time-', '');
    const newDate = format(selectedDate, 'yyyy-MM-dd');
    const newDateTime = `${newDate}T${newTime}:00`;

    await handleBookingUpdate(booking.id, { booking_date: newDateTime });
    setDraggingBooking(null);
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

  const getEventPosition = (event: TimeSlotEvent) => {
    const startHour = event.startTime.getHours();
    const startMinute = event.startTime.getMinutes();
    const endHour = event.endTime.getHours();
    const endMinute = event.endTime.getMinutes();

    const top = ((startHour - 6) * 60 + startMinute) * (80 / 60); // 80px per hour
    const height = ((endHour - startHour) * 60 + (endMinute - startMinute)) * (80 / 60);

    return { top, height };
  };

  // Day View Dialog
  const DayViewDialog = () => {
    if (!selectedDate) return null;

    const daySlots = getSlotsForDay(selectedDate);
    const dayBookings = getBookingsForDay(selectedDate);

    // Generate time slots from 6 AM to 10 PM
    const timeSlots = Array.from({ length: 17 }, (_, i) => {
      const hour = 6 + i;
      return `${hour.toString().padStart(2, '0')}:00`;
    });

    return (
      <Dialog open={dayViewOpen} onOpenChange={setDayViewOpen}>
        <DialogContent className="bg-charcoal border-graphite/20 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-pearl flex items-center gap-2">
              <Calendar className="w-5 h-5 text-champagne" />
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              {isToday(selectedDate) && (
                <Badge className="bg-champagne/20 text-champagne">Today</Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-cocoa/50 border-graphite/20 p-3">
                <div className="text-pearl/60 text-xs">Available Slots</div>
                <div className="text-pearl text-2xl font-bold">{daySlots.length}</div>
              </Card>
              <Card className="bg-cocoa/50 border-graphite/20 p-3">
                <div className="text-pearl/60 text-xs">Bookings</div>
                <div className="text-pearl text-2xl font-bold">{dayBookings.length}</div>
              </Card>
              <Card className="bg-cocoa/50 border-graphite/20 p-3">
                <div className="text-pearl/60 text-xs">Total Hours</div>
                <div className="text-pearl text-2xl font-bold">{getTotalSlotsHours(daySlots)}h</div>
              </Card>
            </div>

            {/* Available Slots */}
            {daySlots.length > 0 && (
              <div>
                <h3 className="text-pearl font-medium mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-champagne" />
                  Available Time Slots
                </h3>
                <div className="grid gap-2">
                  {daySlots.map(slot => (
                    <Card key={slot.id} className="bg-cocoa/30 border-graphite/20 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getLocationIcon(slot.location)}
                          <span className="text-pearl">
                            {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {slot.service_type}
                          </Badge>
                        </div>
                        {slot.notes && (
                          <span className="text-pearl/50 text-sm">{slot.notes}</span>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Bookings with Drag & Drop */}
            <DragDropContext onDragEnd={handleDragEnd}>
              <div>
                <h3 className="text-pearl font-medium mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-champagne" />
                  Bookings ({dayBookings.length})
                </h3>

                {dayBookings.length === 0 ? (
                  <Card className="bg-cocoa/30 border-graphite/20 p-6 text-center">
                    <p className="text-pearl/50">No bookings for this day</p>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {timeSlots.map(timeSlot => {
                      const bookingsAtTime = dayBookings.filter(b => {
                        const bookingTime = parseISO(b.booking_date).toTimeString().substring(0, 5);
                        return bookingTime === timeSlot;
                      });

                      return (
                        <Droppable key={timeSlot} droppableId={`time-${timeSlot}`}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`min-h-[60px] border border-graphite/20 rounded-lg p-2 transition-colors ${
                                snapshot.isDraggingOver ? 'bg-champagne/10 border-champagne/30' : 'bg-cocoa/20'
                              }`}
                            >
                              <div className="text-pearl/50 text-xs mb-1">{timeSlot}</div>
                              {bookingsAtTime.length === 0 ? (
                                <div className="text-pearl/30 text-xs italic">Available</div>
                              ) : (
                                bookingsAtTime.map((booking, index) => (
                                  <Draggable key={booking.id} draggableId={booking.id} index={index}>
                                    {(provided, snapshot) => (
                                      <Card
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={`bg-charcoal/50 border-graphite/20 p-3 mb-2 ${
                                          snapshot.isDragging ? 'shadow-lg ring-2 ring-champagne/50' : ''
                                        }`}
                                      >
                                        <div className="flex items-start gap-3">
                                          <div {...provided.dragHandleProps}>
                                            <GripVertical className="w-4 h-4 text-pearl/30 cursor-grab active:cursor-grabbing" />
                                          </div>

                                          <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                              <div className="flex items-center gap-2">
                                                <span className="text-pearl font-medium">{booking.client_name}</span>
                                                <Badge className={getStatusColor(booking.status)} variant="outline">
                                                  {booking.status}
                                                </Badge>
                                              </div>

                                              {editingBooking?.id === booking.id ? (
                                                <div className="flex gap-1">
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setEditingBooking(null)}
                                                    className="h-7 px-2"
                                                  >
                                                    <X className="w-3 h-3" />
                                                  </Button>
                                                </div>
                                              ) : (
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={() => {
                                                    setEditingBooking(booking);
                                                    setDraggingBooking(booking);
                                                  }}
                                                  className="h-7 px-2"
                                                >
                                                  <Edit2 className="w-3 h-3" />
                                                </Button>
                                              )}
                                            </div>

                                            <div className="space-y-1 text-sm text-pearl/60">
                                              <div className="flex items-center gap-2">
                                                <Clock className="w-3 h-3" />
                                                {format(parseISO(booking.booking_date), 'HH:mm')}
                                                {booking.services?.duration_minutes && (
                                                  <span>({booking.services.duration_minutes} min)</span>
                                                )}
                                              </div>
                                              <div>{booking.services?.title}</div>
                                              {booking.amount_paid && (
                                                <div className="flex items-center gap-2">
                                                  <DollarSign className="w-3 h-3" />
                                                  {booking.amount_paid} {booking.currency}
                                                </div>
                                              )}
                                              {booking.client_notes && (
                                                <div className="text-xs italic border-l-2 border-champagne/30 pl-2 mt-2">
                                                  {booking.client_notes}
                                                </div>
                                              )}
                                            </div>

                                            {editingBooking?.id === booking.id && (
                                              <div className="mt-3 flex gap-2">
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => handleStatusChange(booking.id, 'confirmed')}
                                                  className="text-sage border-sage/30 hover:bg-sage/10"
                                                >
                                                  <Check className="w-3 h-3 mr-1" />
                                                  Confirm
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => handleStatusChange(booking.id, 'completed')}
                                                  className="text-bronze border-bronze/30 hover:bg-bronze/10"
                                                >
                                                  Complete
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => handleStatusChange(booking.id, 'cancelled')}
                                                  className="text-graphite border-graphite/30 hover:bg-graphite/10"
                                                >
                                                  Cancel
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => handleRefund(booking.id)}
                                                  className="text-champagne border-champagne/30 hover:bg-champagne/10"
                                                >
                                                  Refund
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </Card>
                                    )}
                                  </Draggable>
                                ))
                              )}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      );
                    })}
                  </div>
                )}
              </div>
            </DragDropContext>

            <Button
              onClick={() => onAddSlot(selectedDate.getDay())}
              className="w-full bg-champagne text-charcoal hover:bg-champagne/90"
            >
              Add Time Slot for this Day
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Timeline View Dialog
  const TimelineViewDialog = () => {
    if (!selectedDate) return null;

    return (
      <Dialog open={timelineViewOpen} onOpenChange={setTimelineViewOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-serif text-pearl flex items-center gap-3">
                <Calendar className="w-6 h-6 text-champagne" />
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </DialogTitle>
              <div className="flex gap-2">
                <Button onClick={loadDayEvents} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  onClick={() => onAddSlot(selectedDate.getDay())}
                  className="bg-champagne text-charcoal hover:bg-champagne/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Slot
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-sm mb-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-rose-500 rounded" />
              <span className="text-pearl">Beauty</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-teal-500 rounded" />
              <span className="text-pearl">Fitness</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded" />
              <span className="text-pearl">Booksy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-500 rounded" />
              <span className="text-pearl">Travel</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded" />
              <span className="text-pearl">Admin Block</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 border-2 border-dashed rounded" />
              <span className="text-pearl">Hold</span>
            </div>
          </div>

          {/* Timeline */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <ScrollArea className="max-h-[600px]">
              <div className="relative" style={{ minHeight: '1200px' }}>
                {loadingEvents ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-champagne animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Hour markers with droppables */}
                    {hours.map((hour) => {
                      const timeString = format(setHours(new Date(), hour), 'HH:mm');
                      const bookingsAtTime = events.filter(e =>
                        e.type === 'booking' &&
                        format(e.startTime, 'HH:mm') === timeString
                      );

                      return (
                        <div
                          key={hour}
                          className="absolute left-0 right-0 border-t border-graphite/20"
                          style={{ top: (hour - 6) * 80 }}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-pearl/60 w-16">
                              {timeString}
                            </span>
                            <Droppable key={timeString} droppableId={`time-${timeString}`} type="timeline">
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className={cn(
                                    'flex-1 h-20 transition-colors rounded text-xs border',
                                    snapshot.isDraggingOver
                                      ? 'bg-champagne/10 border-champagne/30'
                                      : 'border-transparent hover:border-graphite/40 hover:bg-cocoa/30'
                                  )}
                                  onClick={() => handleTimelineSlotClick(hour)}
                                >
                                  <div className="p-2">
                                    {bookingsAtTime.length === 0 ? (
                                      <div className="text-pearl/30 text-center">
                                        Click to add block
                                      </div>
                                    ) : (
                                      <div className="space-y-1">
                                        {bookingsAtTime.map((booking, index) => (
                                          <Draggable
                                            key={booking.id}
                                            draggableId={booking.id}
                                            index={index}
                                            type="timeline"
                                          >
                                            {(provided, snapshot) => (
                                              <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className={cn(
                                                  'p-2 rounded text-xs text-white cursor-move',
                                                  booking.color,
                                                  snapshot.isDragging && 'shadow-lg ring-2 ring-champagne/50'
                                                )}
                                              >
                                                <div className="flex items-center gap-2">
                                                  <GripVertical className="w-3 h-3" />
                                                  <span className="truncate flex-1">{booking.title}</span>
                                                  {booking.status && (
                                                    <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                                      {booking.status}
                                                    </Badge>
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                          </Draggable>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </div>

                          {/* Non-booking events (blocks, holds) */}
                          {events
                            .filter(e => e.type !== 'booking' &&
                              Math.floor(e.startTime.getHours()) === hour)
                            .map((event) => {
                              const { top } = getEventPosition(event);
                              return (
                                <div
                                  key={event.id}
                                  className={cn(
                                    'absolute left-20 right-4 rounded-lg p-2 cursor-pointer',
                                    'hover:ring-2 hover:ring-champagne transition-all',
                                    event.color,
                                    'text-white text-sm overflow-hidden'
                                  )}
                                  style={{ top: `${top - ((hour - 6) * 80)}px`, minHeight: '40px' }}
                                  onClick={() => {
                                    setSelectedEvent(event);
                                    setEditEventOpen(true);
                                  }}
                                >
                                  <div className="font-semibold truncate">{event.title}</div>
                                  <div className="text-xs opacity-90">
                                    {format(event.startTime, 'HH:mm')} - {format(event.endTime, 'HH:mm')}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </ScrollArea>
          </DragDropContext>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-serif text-pearl">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'month' ? 'timeline' : 'month')}
            className="border-graphite/20"
          >
            <Clock className="w-4 h-4 mr-2" />
            {viewMode === 'month' ? 'Timeline View' : 'Month View'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="border-graphite/20"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
            className="border-graphite/20"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="border-graphite/20"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-2">
          <MapPin className="w-3 h-3 text-lip-rose" />
          <span className="text-pearl/60">Studio</span>
        </div>
        <div className="flex items-center gap-2">
          <Laptop className="w-3 h-3 text-blue-400" />
          <span className="text-pearl/60">Online</span>
        </div>
        <div className="flex items-center gap-2">
          <Dumbbell className="w-3 h-3 text-sage" />
          <span className="text-pearl/60">Fitness Center</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-pearl/60 text-sm font-medium py-2">
            {day}
          </div>
        ))}

        {daysInMonth.map(date => {
          const daySlots = getSlotsForDay(date);
          const dayBookings = getBookingsForDay(date);
          const hasConflicts = dayBookings.length > daySlots.length;

          return (
            <Card
              key={date.toISOString()}
              onClick={() => handleDayClick(date)}
              className={`
                min-h-[100px] p-2 cursor-pointer transition-all hover:scale-105 hover:shadow-lg
                ${!isSameMonth(date, currentMonth) ? 'opacity-30' : ''}
                ${isToday(date) ? 'ring-2 ring-champagne/50 bg-champagne/5' : 'bg-charcoal/50'}
                border-graphite/20 hover:border-champagne/30
              `}
            >
              <div className="flex items-start justify-between mb-1">
                <span className={`text-sm ${isToday(date) ? 'text-champagne font-bold' : 'text-pearl'}`}>
                  {format(date, 'd')}
                </span>
                {hasConflicts && (
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                )}
              </div>

              <div className="space-y-1">
                {daySlots.slice(0, 2).map(slot => (
                  <div key={slot.id} className="flex items-center gap-1">
                    {getLocationIcon(slot.location)}
                    <span className="text-[10px] text-pearl/60">
                      {slot.start_time.substring(0, 5)}
                    </span>
                  </div>
                ))}
                {daySlots.length > 2 && (
                  <div className="text-[10px] text-pearl/40">
                    +{daySlots.length - 2} more
                  </div>
                )}
                {dayBookings.length > 0 && (
                  <Badge variant="outline" className="text-[10px] bg-sage/20 text-sage border-sage/30 mt-1">
                    {dayBookings.length} {dayBookings.length === 1 ? 'booking' : 'bookings'}
                  </Badge>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <DayViewDialog />
      <TimelineViewDialog />

      {/* Create Block Dialog */}
      <Dialog open={createBlockOpen} onOpenChange={setCreateBlockOpen}>
        <DialogContent className="bg-charcoal border-graphite/20">
          <DialogHeader>
            <DialogTitle className="text-pearl">Create Admin Block</DialogTitle>
          </DialogHeader>
          <BlockForm
            initialStart={selectedSlot?.start}
            initialEnd={selectedSlot?.end}
            onSubmit={handleCreateBlock}
            onCancel={() => setCreateBlockOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={editEventOpen} onOpenChange={setEditEventOpen}>
        <DialogContent className="bg-charcoal border-graphite/20">
          <DialogHeader>
            <DialogTitle className="text-pearl">Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <EventDetails
              event={selectedEvent}
              onDelete={() => {
                handleDeleteEvent(selectedEvent);
                setEditEventOpen(false);
              }}
              onClose={() => setEditEventOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Block Form Component
const BlockForm = ({ initialStart, initialEnd, onSubmit, onCancel }: any) => {
  const [reason, setReason] = useState('admin_block');
  const [notes, setNotes] = useState('');

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-pearl">Reason</Label>
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger className="bg-cocoa/60 border-graphite/20 text-pearl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-charcoal border-graphite/20">
            <SelectItem value="admin_block">Admin Block</SelectItem>
            <SelectItem value="personal">Personal Time</SelectItem>
            <SelectItem value="travel">Travel</SelectItem>
            <SelectItem value="booksy">Booksy Sync</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-pearl">Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes..."
          rows={3}
          className="bg-cocoa/60 border-graphite/20 text-pearl"
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={() => onSubmit(reason, notes)} className="flex-1 bg-champagne text-charcoal hover:bg-champagne/90">
          Create Block
        </Button>
        <Button onClick={onCancel} variant="outline" className="border-graphite/20 text-pearl hover:bg-cocoa/50">
          Cancel
        </Button>
      </div>
    </div>
  );
};

// Event Details Component
const EventDetails = ({ event, onDelete, onClose }: any) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-pearl">
          <Clock className="w-4 h-4 text-champagne" />
          <span className="font-medium">
            {format(event.startTime, 'HH:mm')} - {format(event.endTime, 'HH:mm')}
          </span>
        </div>

        {event.booking && (
          <>
            <div className="flex items-center gap-2 text-pearl">
              <User className="w-4 h-4 text-champagne" />
              <span>{event.booking.client_name || event.booking.client_email || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-2 text-pearl">
              <MapPin className="w-4 h-4 text-champagne" />
              <span>{event.booking.locations?.name || 'No location'}</span>
            </div>
            <div className="flex items-center gap-2 text-pearl">
              <DollarSign className="w-4 h-4 text-champagne" />
              <span>{event.booking.amount_paid || 0} PLN</span>
            </div>
          </>
        )}

        {event.block && event.block.notes && (
          <p className="text-sm text-pearl/70">{event.block.notes}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={onDelete} variant="destructive" className="flex-1">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
        <Button onClick={onClose} variant="outline" className="border-graphite/20 text-pearl hover:bg-cocoa/50">
          Close
        </Button>
      </div>
    </div>
  );
};

export default UnifiedAvailabilityCalendar;