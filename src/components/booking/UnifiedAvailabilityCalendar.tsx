import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format, addDays, addWeeks, addMonths, startOfWeek, startOfMonth, endOfWeek, endOfMonth, isSameDay, isToday, isWeekend, parseISO, setHours, setMinutes } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, Users, MapPin, Filter, ChevronLeft, ChevronRight, Grid3X3, List, Calendar as CalendarIcon, ZoomIn, ZoomOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { TimeSlotWithCapacity } from '@/types/booking';
import { useBookingStore } from '@/stores/bookingStore';
import { cn } from '@/lib/utils';

export type CalendarView = 'day' | 'week' | 'month';
export type CalendarFilter = {
  serviceIds: string[];
  locations: string[];
  specialists: string[];
  minCapacity: number;
  showWeekends: boolean;
  showOnlyAvailable: boolean;
};

interface UnifiedAvailabilityCalendarProps {
  selectedService?: string;
  onTimeSlotSelect: (slot: TimeSlotWithCapacity) => void;
  selectedSlot?: TimeSlotWithCapacity | null;
  compact?: boolean;
  showFilters?: boolean;
  enableBulkOperations?: boolean;
  adminMode?: boolean;
  initialView?: CalendarView;
  initialDate?: Date;
  className?: string;
}

export const UnifiedAvailabilityCalendar: React.FC<UnifiedAvailabilityCalendarProps> = ({
  selectedService,
  onTimeSlotSelect,
  selectedSlot,
  compact = false,
  showFilters = true,
  enableBulkOperations = false,
  adminMode = false,
  initialView = 'week',
  initialDate = new Date(),
  className
}) => {
  const { t, i18n } = useTranslation();
  const currentLocale = i18n.language === 'pl' ? pl : enUS;

  // State
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [view, setView] = useState<CalendarView>(initialView);
  const [timeSlots, setTimeSlots] = useState<TimeSlotWithCapacity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<CalendarFilter>({
    serviceIds: selectedService ? [selectedService] : [],
    locations: [],
    specialists: [],
    minCapacity: 1,
    showWeekends: true,
    showOnlyAvailable: false
  });
  const [services, setServices] = useState<Array<{ id: string; title: string; service_type: string }>>([]);
  const [specialists, setSpecialists] = useState<Array<{ id: string; name: string }>>([]);
  const [bulkSelection, setBulkSelection] = useState<Set<string>>(new Set());
  const [zoomLevel, setZoomLevel] = useState(1);

  const { selectTimeSlot } = useBookingStore();

  // Load services and specialists
  useEffect(() => {
    loadServices();
    loadSpecialists();
  }, []);

  // Load availability data
  useEffect(() => {
    loadAvailabilityData();
  }, [currentDate, view, filter, selectedService]);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, title, service_type')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error('Failed to load services:', err);
    }
  };

  const loadSpecialists = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'specialist')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setSpecialists(data || []);
    } catch (err) {
      console.error('Failed to load specialists:', err);
    }
  };

  const loadAvailabilityData = async () => {
    setLoading(true);
    setError(null);

    try {
      const dateRange = getDateRangeForView(currentDate, view);
      const serviceIds = filter.serviceIds.length > 0 ? filter.serviceIds : services.map(s => s.id);

      if (serviceIds.length === 0) {
        setTimeSlots([]);
        setLoading(false);
        return;
      }

      // Load availability slots
      const { data: slots, error: slotsError } = await supabase
        .from('availability_slots')
        .select('*')
        .in('service_id', serviceIds)
        .gte('slot_date', dateRange.start.toISOString().split('T')[0])
        .lte('slot_date', dateRange.end.toISOString().split('T')[0])
        .is('is_available', true);

      if (slotsError) throw slotsError;

      // Load current bookings for capacity checking
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .in('service_id', serviceIds)
        .in('status', ['pending', 'confirmed'])
        .gte('booking_date', dateRange.start.toISOString().split('T')[0])
        .lte('booking_date', dateRange.end.toISOString().split('T')[0]);

      if (bookingsError) throw bookingsError;

      // Transform and merge data
      const transformedSlots = transformAvailabilityData(slots || [], bookings || [], filter);
      setTimeSlots(transformedSlots);
    } catch (err) {
      console.error('Failed to load availability:', err);
      setError(err instanceof Error ? err.message : 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const transformAvailabilityData = (
    slots: any[],
    bookings: any[],
    filter: CalendarFilter
  ): TimeSlotWithCapacity[] => {
    const timeSlots: TimeSlotWithCapacity[] = [];

    slots.forEach(slot => {
      // Generate time slots for each availability slot
      const startTime = parseISO(`${slot.slot_date}T${slot.start_time}`);
      const endTime = parseISO(`${slot.slot_date}T${slot.end_time}`);
      const duration = 30; // 30-minute slots

      let currentTime = startTime;
      while (currentTime < endTime) {
        const timeStr = format(currentTime, 'HH:mm');
        const dateStr = format(currentTime, 'yyyy-MM-dd');

        // Count existing bookings for this slot
        const slotBookings = bookings.filter(booking =>
          booking.booking_date === dateStr &&
          booking.booking_time === timeStr &&
          booking.service_id === slot.service_id
        );

        const currentBookings = slotBookings.length;
        const remainingCapacity = Math.max(0, slot.max_capacity - currentBookings);
        const available = remainingCapacity > 0;

        // Apply filters
        if (filter.showOnlyAvailable && !available) continue;
        if (filter.minCapacity > remainingCapacity) continue;

        timeSlots.push({
          id: `${slot.service_id}-${dateStr}-${timeStr}`,
          date: currentTime,
          time: timeStr,
          available,
          location: slot.location_type,
          capacity: slot.max_capacity,
          currentBookings,
          remainingCapacity,
          allowsGroups: slot.allows_groups,
          maxGroupSize: slot.max_group_size || 10,
          serviceId: slot.service_id,
          specialistId: slot.specialist_id
        });

        currentTime = new Date(currentTime.getTime() + duration * 60 * 1000);
      }
    });

    return timeSlots.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const getDateRangeForView = (date: Date, view: CalendarView) => {
    switch (view) {
      case 'day':
        return {
          start: startOfDay(date),
          end: endOfDay(date)
        };
      case 'week':
        return {
          start: startOfWeek(date, { weekStartsOn: 1 }),
          end: endOfWeek(date, { weekStartsOn: 1 })
        };
      case 'month':
        return {
          start: startOfMonth(date),
          end: endOfMonth(date)
        };
    }
  };

  const startOfDay = (date: Date) => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  };

  const endOfDay = (date: Date) => {
    const newDate = new Date(date);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const dateRanges = {
      day: { amount: 1, unit: 'days' as const },
      week: { amount: 1, unit: 'weeks' as const },
      month: { amount: 1, unit: 'months' as const }
    };

    const { amount, unit } = dateRanges[view];
    const newDate = direction === 'prev'
      ? addDays(currentDate, -amount * (unit === 'days' ? 1 : unit === 'weeks' ? 7 : 30))
      : addDays(currentDate, amount * (unit === 'days' ? 1 : unit === 'weeks' ? 7 : 30));

    setCurrentDate(newDate);
  };

  const handleTimeSlotClick = useCallback((slot: TimeSlotWithCapacity) => {
    if (enableBulkOperations) {
      const newSelection = new Set(bulkSelection);
      if (newSelection.has(slot.id)) {
        newSelection.delete(slot.id);
      } else {
        newSelection.add(slot.id);
      }
      setBulkSelection(newSelection);
    } else {
      onTimeSlotSelect(slot);
      selectTimeSlot(slot);
    }
  }, [enableBulkOperations, bulkSelection, onTimeSlotSelect, selectTimeSlot]);

  const getFilteredSlots = useMemo(() => {
    let filtered = [...timeSlots];

    // Filter by date range based on view
    const dateRange = getDateRangeForView(currentDate, view);
    filtered = filtered.filter(slot =>
      slot.date >= dateRange.start && slot.date <= dateRange.end
    );

    // Apply weekend filter
    if (!filter.showWeekends) {
      filtered = filtered.filter(slot => !isWeekend(slot.date));
    }

    // Apply specialist filter
    if (filter.specialists.length > 0) {
      filtered = filtered.filter(slot =>
        slot.specialistId && filter.specialists.includes(slot.specialistId)
      );
    }

    return filtered;
  }, [timeSlots, currentDate, view, filter]);

  const renderDayView = () => {
    const daySlots = getFilteredSlots.filter(slot => isSameDay(slot.date, currentDate));
    const groupedSlots = daySlots.reduce((acc, slot) => {
      const hour = format(slot.date, 'HH');
      if (!acc[hour]) acc[hour] = [];
      acc[hour].push(slot);
      return acc;
    }, {} as Record<string, TimeSlotWithCapacity[]>);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {format(currentDate, 'EEEE, MMMM d, yyyy', { locale: currentLocale })}
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-96">
          <div className="space-y-1" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}>
            {Object.entries(groupedSlots).map(([hour, slots]) => (
              <div key={hour} className="flex gap-2 p-2 border rounded">
                <div className="w-16 text-sm font-medium text-gray-600">
                  {hour}:00
                </div>
                <div className="flex-1 grid grid-cols-4 gap-2">
                  {slots.map(slot => (
                    <TimeSlotCard
                      key={slot.id}
                      slot={slot}
                      selected={selectedSlot?.id === slot.id}
                      bulkSelected={bulkSelection.has(slot.id)}
                      onClick={() => handleTimeSlotClick(slot)}
                      compact={compact}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    if (!filter.showWeekends) {
      weekDays.splice(5, 2); // Remove Saturday and Sunday
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          {format(weekStart, 'MMM d', { locale: currentLocale })} - {format(addDays(weekStart, 6), 'MMM d, yyyy', { locale: currentLocale })}
        </h3>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map(day => {
            const daySlots = getFilteredSlots.filter(slot => isSameDay(slot.date, day));
            const isCurrentDay = isToday(day);

            return (
              <div key={day.toISOString()} className={cn(
                "border rounded-lg p-2",
                isCurrentDay && "bg-blue-50 border-blue-200"
              )}>
                <div className="text-center mb-2">
                  <div className="text-sm font-medium">
                    {format(day, 'EEE', { locale: currentLocale })}
                  </div>
                  <div className={cn(
                    "text-lg font-bold",
                    isCurrentDay && "text-blue-600"
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>

                <ScrollArea className="h-64">
                  <div className="space-y-1">
                    {daySlots.slice(0, 6).map(slot => (
                      <TimeSlotCard
                        key={slot.id}
                        slot={slot}
                        selected={selectedSlot?.id === slot.id}
                        bulkSelected={bulkSelection.has(slot.id)}
                        onClick={() => handleTimeSlotClick(slot)}
                        compact={true}
                      />
                    ))}
                    {daySlots.length > 6 && (
                      <div className="text-xs text-center text-gray-500 p-1">
                        +{daySlots.length - 6} more
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const monthDays = Array.from({ length: monthEnd.getDate() }, (_, i) => {
      return new Date(monthStart.getFullYear(), monthStart.getMonth(), i + 1);
    });

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          {format(currentDate, 'MMMM yyyy', { locale: currentLocale })}
        </h3>

        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-600 p-2">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {monthDays.map(day => {
            const daySlots = getFilteredSlots.filter(slot => isSameDay(slot.date, day));
            const availableSlots = daySlots.filter(slot => slot.available);
            const isCurrentDay = isToday(day);
            const isWeekendDay = isWeekend(day);

            if (isWeekendDay && !filter.showWeekends) {
              return null;
            }

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "border rounded p-1 min-h-20 cursor-pointer hover:bg-gray-50",
                  isCurrentDay && "bg-blue-50 border-blue-200",
                  availableSlots.length > 0 && "bg-green-50 border-green-200"
                )}
                onClick={() => {
                  setCurrentDate(day);
                  setView('day');
                }}
              >
                <div className="text-xs font-medium mb-1">
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {availableSlots.slice(0, 3).map(slot => (
                    <div
                      key={slot.id}
                      className="text-xs p-1 bg-green-100 rounded text-green-800 truncate"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTimeSlotClick(slot);
                      }}
                    >
                      {slot.time}
                    </div>
                  ))}
                  {availableSlots.length > 3 && (
                    <div className="text-xs text-center text-gray-500">
                      +{availableSlots.length - 3}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {t('booking.availability.title', 'Availability Calendar')}
          </CardTitle>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              {t('booking.availability.today', 'Today')}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Tabs value={view} onValueChange={(value) => setView(value as CalendarView)}>
            <TabsList>
              <TabsTrigger value="day" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                {t('booking.availability.day', 'Day')}
              </TabsTrigger>
              <TabsTrigger value="week" className="flex items-center gap-2">
                <Grid3X3 className="h-4 w-4" />
                {t('booking.availability.week', 'Week')}
              </TabsTrigger>
              <TabsTrigger value="month" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t('booking.availability.month', 'Month')}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {showFilters && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => {/* Toggle filter panel */}}
            >
              <Filter className="h-4 w-4" />
              {t('booking.availability.filters', 'Filters')}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <Tabs value={view} className="w-full">
            <TabsContent value="day">
              {renderDayView()}
            </TabsContent>
            <TabsContent value="week">
              {renderWeekView()}
            </TabsContent>
            <TabsContent value="month">
              {renderMonthView()}
            </TabsContent>
          </Tabs>
        )}

        {enableBulkOperations && bulkSelection.size > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">
                {bulkSelection.size} slots selected
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  {t('booking.availability.bulkActions.makeAvailable', 'Make Available')}
                </Button>
                <Button size="sm" variant="outline">
                  {t('booking.availability.bulkActions.makeUnavailable', 'Make Unavailable')}
                </Button>
                <Button size="sm" variant="outline">
                  {t('booking.availability.bulkActions.blockSlots', 'Block Slots')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface TimeSlotCardProps {
  slot: TimeSlotWithCapacity;
  selected?: boolean;
  bulkSelected?: boolean;
  onClick: () => void;
  compact?: boolean;
}

const TimeSlotCard: React.FC<TimeSlotCardProps> = ({
  slot,
  selected,
  bulkSelected,
  onClick,
  compact = false
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "border rounded p-2 cursor-pointer transition-all hover:shadow-md",
        selected && "ring-2 ring-blue-500 bg-blue-50",
        bulkSelected && "ring-2 ring-green-500 bg-green-50",
        !slot.available && "opacity-50 cursor-not-allowed",
        slot.available && "hover:bg-gray-50"
      )}
    >
      {!compact && (
        <div className="text-xs text-gray-600 mb-1">
          {slot.time}
        </div>
      )}

      <div className="flex items-center justify-between">
        {slot.available ? (
          <Badge variant="secondary" className="text-xs">
            {slot.remainingCapacity} left
          </Badge>
        ) : (
          <Badge variant="destructive" className="text-xs">
            Full
          </Badge>
        )}

        {slot.allowsGroups && (
          <Users className="h-3 w-3 text-blue-600" />
        )}
      </div>

      {!compact && (
        <div className="text-xs text-gray-500 mt-1">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {slot.location}
          </div>
          {slot.capacity > 1 && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {slot.capacity} total
            </div>
          )}
        </div>
      )}
    </div>
  );
};