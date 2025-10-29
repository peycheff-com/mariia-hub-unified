import { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { format, addDays, isSameDay, startOfDay, isToday, isTomorrow, startOfMonth } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { useAvailability } from '@/hooks/useAvailability';


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
}

export const Step2Time = ({
  serviceId,
  serviceType,
  durationMinutes,
  locationId,
  onComplete,
  onBack,
}: Step2Props) => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'quick' | 'calendar'>('quick');
  
  const { slots, loading, error } = useAvailability({
    serviceId,
    locationId,
    date: selectedDate,
    durationMinutes,
  });

  // Auto-select first available slot if viewing today
  useEffect(() => {
    if (slots.length > 0 && !selectedTime && isToday(selectedDate)) {
      setSelectedTime(slots[0].time);
    }
  }, [slots, selectedTime, selectedDate]);

  // Auto-complete when time is selected
  useEffect(() => {
    if (selectedTime) {
      const slot = slots.find(s => s.time === selectedTime);
      onComplete({
        date: selectedDate,
        time: selectedTime,
        slotId: slot?.id,
      });
    }
  }, [selectedTime, selectedDate, slots, onComplete]);

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

  const timeGroups = {
    morning: slots.filter(s => {
      const hour = parseInt(s.time.split(':')[0]);
      return hour >= 6 && hour < 12;
    }),
    afternoon: slots.filter(s => {
      const hour = parseInt(s.time.split(':')[0]);
      return hour >= 12 && hour < 17;
    }),
    evening: slots.filter(s => {
      const hour = parseInt(s.time.split(':')[0]);
      return hour >= 17;
    }),
  };

  const hasSlots = Object.values(timeGroups).some(group => group.length > 0);

  return (
    <div className="space-y-6">
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
              {quickDates.map((date, index) => (
                <button
                  key={date.toISOString()}
                  onClick={() => {
                    setSelectedDate(date);
                    setSelectedTime(null);
                  }}
                  className={cn(
                    "flex flex-col items-center px-3 sm:px-4 py-3 rounded-2xl border-2 transition-all whitespace-nowrap min-w-[70px] sm:min-w-[80px] flex-shrink-0",
                    isSameDay(selectedDate, date)
                      ? "border-champagne/50 glass-card text-pearl shadow-luxury"
                      : "border-champagne/15 glass-subtle text-pearl/70 hover:text-pearl hover:border-champagne/30"
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="text-xs mb-1 font-medium">{getDateLabel(date)}</div>
                  <div className="font-bold text-lg">{format(date, 'd')}</div>
                  <div className="text-xs opacity-80">{format(date, 'MMM')}</div>
                </button>
              ))}
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
                
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (isCurrentMonth) {
                        setSelectedDate(dayDate);
                        setSelectedTime(null);
                      }
                    }}
                    disabled={!isCurrentMonth || dayDate < new Date()}
                    className={cn(
                      "aspect-square rounded-lg text-sm transition-all flex items-center justify-center",
                      isSelected && "bg-champagne text-cocoa font-bold",
                      !isSelected && isTodayDate && "border border-champagne/50",
                      !isSelected && isCurrentMonth && dayDate >= new Date() && "text-pearl hover:bg-champagne/10",
                      !isCurrentMonth && "text-pearl/20",
                      dayDate < new Date() && "text-pearl/20 cursor-not-allowed"
                    )}
                  >
                    {format(dayDate, 'd')}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Time slots */}
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
            <div className="text-pearl/60 mb-4">No times available on {format(selectedDate, 'MMM d')}</div>
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
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5 md:gap-2">
                  {timeGroups.morning.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedTime(slot.time)}
                      disabled={!slot.available}
                      className={cn(
                        "py-2 md:py-3 px-2 md:px-4 rounded-lg md:rounded-xl border-2 transition-all text-xs md:text-sm font-medium",
                        selectedTime === slot.time
                          ? "border-champagne/50 glass-card text-pearl"
                          : slot.available
                          ? "border-champagne/15 glass-subtle text-pearl/70 hover:text-pearl hover:border-champagne/30"
                          : "border-pearl/10 opacity-50 cursor-not-allowed text-pearl/30"
                      )}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Afternoon slots */}
            {timeGroups.afternoon.length > 0 && (
              <div>
                <div className="text-xs text-pearl/60 mb-2">Afternoon</div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5 md:gap-2">
                  {timeGroups.afternoon.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedTime(slot.time)}
                      disabled={!slot.available}
                      className={cn(
                        "py-2 md:py-3 px-2 md:px-4 rounded-lg md:rounded-xl border-2 transition-all text-xs md:text-sm font-medium",
                        selectedTime === slot.time
                          ? "border-champagne/50 glass-card text-pearl"
                          : slot.available
                          ? "border-champagne/15 glass-subtle text-pearl/70 hover:text-pearl hover:border-champagne/30"
                          : "border-pearl/10 opacity-50 cursor-not-allowed text-pearl/30"
                      )}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Evening slots */}
            {timeGroups.evening.length > 0 && (
              <div>
                <div className="text-xs text-pearl/60 mb-2">Evening</div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5 md:gap-2">
                  {timeGroups.evening.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedTime(slot.time)}
                      disabled={!slot.available}
                      className={cn(
                        "py-2 md:py-3 px-2 md:px-4 rounded-lg md:rounded-xl border-2 transition-all text-xs md:text-sm font-medium",
                        selectedTime === slot.time
                          ? "border-champagne/50 glass-card text-pearl"
                          : slot.available
                          ? "border-champagne/15 glass-subtle text-pearl/70 hover:text-pearl hover:border-champagne/30"
                          : "border-pearl/10 opacity-50 cursor-not-allowed text-pearl/30"
                      )}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick pick options */}
            <div className="pt-2 border-t border-pearl/10">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const firstAvailable = slots.find(s => s.available);
                    if (firstAvailable) setSelectedTime(firstAvailable.time);
                  }}
                  className="px-4 py-2 rounded-xl text-xs border border-champagne/15 glass-subtle text-champagne hover:border-champagne/30"
                >
                  ✨ First available
                </button>
                {timeGroups.morning.length > 0 && (
                  <button
                    onClick={() => {
                      const first = timeGroups.morning.find(s => s.available);
                      if (first) setSelectedTime(first.time);
                    }}
                    className="px-4 py-2 rounded-xl text-xs border border-champagne/15 glass-subtle text-pearl/70 hover:text-pearl hover:border-champagne/30"
                  >
                    Morning
                  </button>
                )}
                {timeGroups.afternoon.length > 0 && (
                  <button
                    onClick={() => {
                      const first = timeGroups.afternoon.find(s => s.available);
                      if (first) setSelectedTime(first.time);
                    }}
                    className="px-4 py-2 rounded-xl text-xs border border-champagne/15 glass-subtle text-pearl/70 hover:text-pearl hover:border-champagne/30"
                  >
                    Afternoon
                  </button>
                )}
                {timeGroups.evening.length > 0 && (
                  <button
                    onClick={() => {
                      const first = timeGroups.evening.find(s => s.available);
                      if (first) setSelectedTime(first.time);
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