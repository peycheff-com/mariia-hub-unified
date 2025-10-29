import { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Loader2, Users, AlertCircle } from 'lucide-react';
import { format, addDays, isSameDay, startOfDay, isToday, isTomorrow, startOfMonth } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { useBookingCapacity } from '@/hooks/useBookingCapacity';
import { TimeSlotWithCapacity } from '@/services/bookingCapacity.service';

interface Step2Props {
  serviceId: string;
  serviceType: 'beauty' | 'fitness';
  durationMinutes: number;
  locationId: string;
  onComplete: (data: {
    date: Date;
    time: string;
    slotId?: string;
  }) => void;
  onBack?: () => void;
  groupSize?: number;
}

export const Step2TimeWithCapacity = ({
  serviceId,
  serviceType,
  durationMinutes,
  locationId,
  onComplete,
  onBack,
  groupSize = 1,
}: Step2Props) => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'quick' | 'calendar'>('quick');

  const { slots, loading, error } = useBookingCapacity({
    serviceId,
    date: selectedDate,
    durationMinutes,
  });

  // Auto-select first available slot if viewing today
  useEffect(() => {
    if (slots.length > 0 && !selectedTime && isToday(selectedDate)) {
      const firstAvailable = slots.find(s => s.available_spots >= groupSize);
      if (firstAvailable) {
        setSelectedTime(format(new Date(firstAvailable.start_time), 'HH:mm'));
      }
    }
  }, [slots, selectedTime, selectedDate, groupSize]);

  // Auto-complete when time is selected
  useEffect(() => {
    if (selectedTime) {
      const slot = slots.find(s =>
        format(new Date(s.start_time), 'HH:mm') === selectedTime
      );
      if (slot && slot.available_spots >= groupSize) {
        onComplete({
          date: selectedDate,
          time: selectedTime,
          slotId: slot.id,
        });
      }
    }
  }, [selectedTime, selectedDate, slots, onComplete, groupSize]);

  // Responsive date count based on screen size
  const [dateCount, setDateCount] = useState(7);

  useEffect(() => {
    const updateDateCount = () => {
      const width = window.innerWidth;
      if (width < 640) setDateCount(5);  // Mobile
      else if (width < 768) setDateCount(7);  // Tablet
      else setDateCount(10);  // Desktop
    };

    updateDateCount();
    window.addEventListener('resize', updateDateCount);
    return () => window.removeEventListener('resize', updateDateCount);
  }, []);

  const quickDates = Array.from({ length: dateCount }, (_, i) => addDays(new Date(), i));

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE d');
  };

  // Group slots by time period and check capacity
  const timeGroups = {
    morning: slots.filter(s => {
      const hour = parseInt(format(new Date(s.start_time), 'HH'));
      return hour >= 6 && hour < 12;
    }),
    afternoon: slots.filter(s => {
      const hour = parseInt(format(new Date(s.start_time), 'HH'));
      return hour >= 12 && hour < 17;
    }),
    evening: slots.filter(s => {
      const hour = parseInt(format(new Date(s.start_time), 'HH'));
      return hour >= 17;
    }),
  };

  const hasSlots = Object.values(timeGroups).some(group =>
    group.some(s => s.available_spots >= groupSize)
  );

  // Get capacity display info
  const getCapacityInfo = (slot: TimeSlotWithCapacity) => {
    const remaining = slot.available_spots;
    const total = slot.capacity;
    const utilization = ((total - remaining) / total) * 100;

    if (remaining < groupSize) {
      return {
        label: 'Full',
        color: 'text-red-400',
        bgColor: 'bg-red-400/10',
        borderColor: 'border-red-400/30',
        disabled: true,
      };
    } else if (utilization >= 75) {
      return {
        label: `${remaining}/${total}`,
        color: 'text-orange-400',
        bgColor: 'bg-orange-400/10',
        borderColor: 'border-orange-400/30',
        disabled: false,
      };
    } else if (utilization >= 50) {
      return {
        label: `${remaining}/${total}`,
        color: 'text-champagne',
        bgColor: 'bg-champagne/10',
        borderColor: 'border-champagne/30',
        disabled: false,
      };
    } else {
      return {
        label: `${remaining}/${total}`,
        color: 'text-green-400',
        bgColor: 'bg-green-400/10',
        borderColor: 'border-green-400/30',
        disabled: false,
      };
    }
  };

  const timeString = (dateString: string) => format(new Date(dateString), 'HH:mm');

  return (
    <div className="space-y-6">
      {/* Capacity legend */}
      <div className="flex items-center justify-between px-1">
        <div className="text-xs text-pearl/60">
          Booking for {groupSize} {groupSize === 1 ? 'person' : 'people'}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-pearl/60">Available</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-orange-400" />
            <span className="text-pearl/60">Filling</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-pearl/60">Full</span>
          </div>
        </div>
      </div>

      {/* Quick date selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base md:text-lg font-semibold text-pearl">When works for you?</h3>
          <button
            onClick={() => setViewMode(viewMode === 'quick' ? 'calendar' : 'quick')}
            className="text-pearl/60 hover:text-pearl text-xs md:text-sm flex items-center gap-1 p-2 -mr-2"
          >
            <Calendar className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">{viewMode === 'quick' ? 'Calendar' : 'Quick view'}</span>
          </button>
        </div>

        {viewMode === 'quick' ? (
          <div className="relative">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {quickDates.map((date, index) => {
                const dateSlots = slots.filter(s =>
                  isSameDay(new Date(s.start_time), date)
                );
                const hasAvailableSlots = dateSlots.some(s => s.available_spots >= groupSize);

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedTime(null);
                    }}
                    className={cn(
                      "flex flex-col items-center px-3 sm:px-4 py-3 rounded-2xl border-2 transition-all whitespace-nowrap min-w-[70px] sm:min-w-[80px] flex-shrink-0 relative",
                      isSameDay(selectedDate, date)
                        ? "border-champagne/50 glass-card text-pearl shadow-luxury"
                        : hasAvailableSlots
                        ? "border-champagne/15 glass-subtle text-pearl/70 hover:text-pearl hover:border-champagne/30"
                        : "border-pearl/10 glass-subtle text-pearl/30 cursor-not-allowed"
                    )}
                    style={{ animationDelay: `${index * 30}ms` }}
                    disabled={!hasAvailableSlots}
                  >
                    <div className="text-xs mb-1 font-medium">{getDateLabel(date)}</div>
                    <div className="font-bold text-lg">{format(date, 'd')}</div>
                    <div className="text-xs opacity-80">{format(date, 'MMM')}</div>
                    {dateSlots.length > 0 && (
                      <div className="absolute -top-1 -right-1">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          hasAvailableSlots ? "bg-green-400" : "bg-red-400"
                        )} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {/* Scroll indicators */}
            {dateCount > 5 && (
              <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-cocoa to-transparent pointer-events-none" />
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl glass-subtle border border-champagne/15">
            <div className="grid grid-cols-7 gap-1">
              {/* Calendar header */}
              <div className="col-span-7 flex items-center justify-between mb-3">
                <button
                  onClick={() => setSelectedDate(addDays(selectedDate, -30))}
                  className="p-2 hover:bg-champagne/10 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-pearl" />
                </button>
                <div className="text-pearl font-semibold">
                  {format(selectedDate, 'MMMM yyyy')}
                </div>
                <button
                  onClick={() => setSelectedDate(addDays(selectedDate, 30))}
                  className="p-2 hover:bg-champagne/10 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-pearl" />
                </button>
              </div>

              {/* Day labels */}
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                <div key={day} className="text-xs text-pearl/50 text-center py-1">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {Array.from({ length: 35 }, (_, i) => {
                const firstDay = startOfMonth(selectedDate);
                const startOffset = firstDay.getDay();
                const dayDate = addDays(firstDay, i - startOffset);
                const isCurrentMonth = dayDate.getMonth() === selectedDate.getMonth();
                const isSelected = isSameDay(selectedDate, dayDate);
                const isTodayDate = isToday(dayDate);
                const daySlots = slots.filter(s =>
                  isSameDay(new Date(s.start_time), dayDate)
                );
                const hasAvailableSlots = daySlots.some(s => s.available_spots >= groupSize);

                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (isCurrentMonth && hasAvailableSlots) {
                        setSelectedDate(dayDate);
                        setSelectedTime(null);
                      }
                    }}
                    disabled={!isCurrentMonth || dayDate < new Date() || !hasAvailableSlots}
                    className={cn(
                      "aspect-square rounded-lg text-sm transition-all flex items-center justify-center relative",
                      isSelected && "bg-champagne text-cocoa font-bold",
                      !isSelected && isTodayDate && "border border-champagne/50",
                      !isSelected && isCurrentMonth && hasAvailableSlots && dayDate >= new Date() && "text-pearl hover:bg-champagne/10",
                      !isCurrentMonth && "text-pearl/20",
                      (!hasAvailableSlots || dayDate < new Date()) && "text-pearl/20 cursor-not-allowed"
                    )}
                  >
                    {format(dayDate, 'd')}
                    {daySlots.length > 0 && (
                      <div className="absolute -top-0.5 -right-0.5">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          hasAvailableSlots ? "bg-green-400" : "bg-red-400"
                        )} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Time slots with capacity indicators */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-pearl flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Available times for {getDateLabel(selectedDate)}
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-champagne animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-pearl/60 mb-2">Unable to load available times</div>
            <button
              onClick={() => window.location.reload()}
              className="text-champagne hover:text-champagne-400 text-sm underline"
            >
              Try again
            </button>
          </div>
        ) : !hasSlots ? (
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-4" />
            <div className="text-pearl/60 mb-4">
              {groupSize > 1
                ? `No times available for ${groupSize} people on ${format(selectedDate, 'MMM d')}`
                : `No times available on ${format(selectedDate, 'MMM d')}`
              }
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                className="px-4 py-2 rounded-xl border border-champagne/15 glass-subtle text-pearl/70 hover:text-pearl hover:border-champagne/30"
              >
                <ChevronLeft className="w-4 h-4 inline mr-1" />
                Previous day
              </button>
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                className="px-4 py-2 rounded-xl border border-champagne/15 glass-subtle text-pearl/70 hover:text-pearl hover:border-champagne/30"
              >
                Next day
                <ChevronRight className="w-4 h-4 inline ml-1" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Morning slots */}
            {timeGroups.morning.length > 0 && (
              <div>
                <div className="text-xs text-pearl/60 mb-2">Morning</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {timeGroups.morning.map((slot) => {
                    const capacityInfo = getCapacityInfo(slot);
                    const time = timeString(slot.start_time);
                    const isSelected = selectedTime === time;

                    return (
                      <button
                        key={slot.id}
                        onClick={() => !capacityInfo.disabled && setSelectedTime(time)}
                        disabled={capacityInfo.disabled}
                        className={cn(
                          "relative p-3 rounded-xl border-2 transition-all text-xs md:text-sm font-medium group",
                          isSelected
                            ? "border-champagne/50 glass-card text-pearl"
                            : capacityInfo.disabled
                            ? "border-pearl/10 opacity-50 cursor-not-allowed"
                            : `border-champagne/15 glass-subtle text-pearl/70 hover:text-pearl hover:border-champagne/30 ${capacityInfo.bgColor}`
                        )}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className={cn(
                            "font-medium",
                            capacityInfo.disabled && "text-pearl/30"
                          )}>
                            {time}
                          </span>
                          {slot.capacity > 1 && (
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span className={cn(
                                "text-xs font-medium",
                                capacityInfo.color
                              )}>
                                {capacityInfo.label}
                              </span>
                            </div>
                          )}
                        </div>
                        {!capacityInfo.disabled && slot.capacity > 1 && (
                          <div className="absolute -top-1 -right-1">
                            <div className={cn(
                              "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold",
                              capacityInfo.color === 'text-green-400' && "bg-green-400 text-cocoa",
                              capacityInfo.color === 'text-champagne' && "bg-champagne text-cocoa",
                              capacityInfo.color === 'text-orange-400' && "bg-orange-400 text-cocoa"
                            )}>
                              {slot.available_spots}
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Afternoon slots */}
            {timeGroups.afternoon.length > 0 && (
              <div>
                <div className="text-xs text-pearl/60 mb-2">Afternoon</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {timeGroups.afternoon.map((slot) => {
                    const capacityInfo = getCapacityInfo(slot);
                    const time = timeString(slot.start_time);
                    const isSelected = selectedTime === time;

                    return (
                      <button
                        key={slot.id}
                        onClick={() => !capacityInfo.disabled && setSelectedTime(time)}
                        disabled={capacityInfo.disabled}
                        className={cn(
                          "relative p-3 rounded-xl border-2 transition-all text-xs md:text-sm font-medium group",
                          isSelected
                            ? "border-champagne/50 glass-card text-pearl"
                            : capacityInfo.disabled
                            ? "border-pearl/10 opacity-50 cursor-not-allowed"
                            : `border-champagne/15 glass-subtle text-pearl/70 hover:text-pearl hover:border-champagne/30 ${capacityInfo.bgColor}`
                        )}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className={cn(
                            "font-medium",
                            capacityInfo.disabled && "text-pearl/30"
                          )}>
                            {time}
                          </span>
                          {slot.capacity > 1 && (
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span className={cn(
                                "text-xs font-medium",
                                capacityInfo.color
                              )}>
                                {capacityInfo.label}
                              </span>
                            </div>
                          )}
                        </div>
                        {!capacityInfo.disabled && slot.capacity > 1 && (
                          <div className="absolute -top-1 -right-1">
                            <div className={cn(
                              "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold",
                              capacityInfo.color === 'text-green-400' && "bg-green-400 text-cocoa",
                              capacityInfo.color === 'text-champagne' && "bg-champagne text-cocoa",
                              capacityInfo.color === 'text-orange-400' && "bg-orange-400 text-cocoa"
                            )}>
                              {slot.available_spots}
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Evening slots */}
            {timeGroups.evening.length > 0 && (
              <div>
                <div className="text-xs text-pearl/60 mb-2">Evening</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {timeGroups.evening.map((slot) => {
                    const capacityInfo = getCapacityInfo(slot);
                    const time = timeString(slot.start_time);
                    const isSelected = selectedTime === time;

                    return (
                      <button
                        key={slot.id}
                        onClick={() => !capacityInfo.disabled && setSelectedTime(time)}
                        disabled={capacityInfo.disabled}
                        className={cn(
                          "relative p-3 rounded-xl border-2 transition-all text-xs md:text-sm font-medium group",
                          isSelected
                            ? "border-champagne/50 glass-card text-pearl"
                            : capacityInfo.disabled
                            ? "border-pearl/10 opacity-50 cursor-not-allowed"
                            : `border-champagne/15 glass-subtle text-pearl/70 hover:text-pearl hover:border-champagne/30 ${capacityInfo.bgColor}`
                        )}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className={cn(
                            "font-medium",
                            capacityInfo.disabled && "text-pearl/30"
                          )}>
                            {time}
                          </span>
                          {slot.capacity > 1 && (
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span className={cn(
                                "text-xs font-medium",
                                capacityInfo.color
                              )}>
                                {capacityInfo.label}
                              </span>
                            </div>
                          )}
                        </div>
                        {!capacityInfo.disabled && slot.capacity > 1 && (
                          <div className="absolute -top-1 -right-1">
                            <div className={cn(
                              "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold",
                              capacityInfo.color === 'text-green-400' && "bg-green-400 text-cocoa",
                              capacityInfo.color === 'text-champagne' && "bg-champagne text-cocoa",
                              capacityInfo.color === 'text-orange-400' && "bg-orange-400 text-cocoa"
                            )}>
                              {slot.available_spots}
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick pick options */}
            <div className="pt-2 border-t border-pearl/10">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const firstAvailable = slots.find(s => s.available_spots >= groupSize);
                    if (firstAvailable) setSelectedTime(timeString(firstAvailable.start_time));
                  }}
                  className="px-4 py-2 rounded-xl text-xs border border-champagne/15 glass-subtle text-champagne hover:border-champagne/30"
                >
                  ✨ First available
                </button>
                {timeGroups.morning.some(s => s.available_spots >= groupSize) && (
                  <button
                    onClick={() => {
                      const first = timeGroups.morning.find(s => s.available_spots >= groupSize);
                      if (first) setSelectedTime(timeString(first.start_time));
                    }}
                    className="px-4 py-2 rounded-xl text-xs border border-champagne/15 glass-subtle text-pearl/70 hover:text-pearl hover:border-champagne/30"
                  >
                    Morning
                  </button>
                )}
                {timeGroups.afternoon.some(s => s.available_spots >= groupSize) && (
                  <button
                    onClick={() => {
                      const first = timeGroups.afternoon.find(s => s.available_spots >= groupSize);
                      if (first) setSelectedTime(timeString(first.start_time));
                    }}
                    className="px-4 py-2 rounded-xl text-xs border border-champagne/15 glass-subtle text-pearl/70 hover:text-pearl hover:border-champagne/30"
                  >
                    Afternoon
                  </button>
                )}
                {timeGroups.evening.some(s => s.available_spots >= groupSize) && (
                  <button
                    onClick={() => {
                      const first = timeGroups.evening.find(s => s.available_spots >= groupSize);
                      if (first) setSelectedTime(timeString(first.start_time));
                    }}
                    className="px-4 py-2 rounded-xl text-xs border border-champagne/15 glass-subtle text-pearl/70 hover:text-pearl hover:border-champagne/30"
                  >
                    Evening
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};