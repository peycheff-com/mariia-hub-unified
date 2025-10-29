import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Laptop, Dumbbell } from "lucide-react";
import { format, addDays, getDay, setHours, setMinutes, startOfDay, isBefore } from "date-fns";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

import BookingSheet from "./booking/BookingSheet";

interface AvailableSlotsListProps {
  serviceType?: 'beauty' | 'fitness';
  limit?: number;
  showViewAll?: boolean;
}

interface TimeSlot {
  date: Date;
  time: string;
  location: string;
  serviceType: 'beauty' | 'fitness';
  slotId: string;
}

interface Service {
  id: string;
  title: string;
  service_type: 'beauty' | 'fitness' | 'lifestyle';
  category: string | null;
  description: string | null;
  price: number;
  duration_minutes: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location: string;
  service_type: 'beauty' | 'fitness' | 'lifestyle';
  max_bookings: number;
  is_available: boolean;
}

interface BookingData {
  booking_date: string;
  service_id: string;
  services: Service;
}

const getLocationIcon = (location: string) => {
  switch (location) {
    case 'studio': return <MapPin className="w-4 h-4" />;
    case 'online': return <Laptop className="w-4 h-4" />;
    case 'fitness': return <Dumbbell className="w-4 h-4" />;
    default: return <MapPin className="w-4 h-4" />;
  }
};

const getLocationLabel = (location: string, i18nLang: string) => {
  switch (location) {
    case 'studio': 
      return i18nLang === 'pl' ? 'Studio' : i18nLang === 'en' ? 'Studio' : 'Студія';
    case 'online': 
      return i18nLang === 'pl' ? 'Online' : i18nLang === 'en' ? 'Online' : 'Онлайн';
    case 'fitness': 
      return i18nLang === 'pl' ? 'Zdrofit' : i18nLang === 'en' ? 'Fitness' : 'Фітнес';
    default: 
      return location;
  }
};

const AvailableSlotsList = ({ serviceType, limit = 8, showViewAll = true }: AvailableSlotsListProps) => {
  const { i18n } = useTranslation();
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [isBookerOpen, setIsBookerOpen] = useState(false);
  const [_selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch services
        let servicesQuery = supabase
          .from('services')
          .select('*')
          .eq('is_active', true);
        
        if (serviceType) {
          servicesQuery = servicesQuery.eq('service_type', serviceType);
        }

        const { data: servicesData } = await servicesQuery;
        setServices(servicesData || []);

        // Fetch availability slots
        let slotsQuery = supabase
          .from('availability_slots')
          .select('*')
          .eq('is_available', true);
        
        if (serviceType) {
          slotsQuery = slotsQuery.eq('service_type', serviceType);
        }

        const { data: slotsData, error: slotsError } = await slotsQuery;
        
        if (slotsError) throw slotsError;

        // Fetch existing bookings for the next 14 days
        const today = new Date();
        const twoWeeksLater = addDays(today, 14);
        
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('booking_date, service_id, services(service_type)')
          .in('status', ['confirmed', 'pending', 'completed'])
          .gte('booking_date', today.toISOString())
          .lte('booking_date', twoWeeksLater.toISOString());

        // Generate future time slots from recurring availability
        const futureSlots: TimeSlot[] = [];
        
        for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
          const targetDate = addDays(startOfDay(today), dayOffset);
          const dayOfWeek = getDay(targetDate);
          
          // Find slots for this day of week
          const daySlotsData = (slotsData as AvailabilitySlot[] || []).filter(
            slot => slot.day_of_week === dayOfWeek
          );

          for (const slot of daySlotsData) {
            // Parse time
            const [hours, minutes] = slot.start_time.split(':').map(Number);
            const slotDateTime = setMinutes(setHours(targetDate, hours), minutes);

            // Skip if in the past
            if (isBefore(slotDateTime, new Date())) continue;

            // Check if this slot is already booked
            const isBooked = (bookingsData as BookingData[])?.some(booking => {
              const bookingDate = new Date(booking.booking_date);
              const bookingServiceType = booking.services.service_type;

              // Check if same time, same day, and same service type (or same location)
              return (
                format(bookingDate, 'yyyy-MM-dd HH:mm') === format(slotDateTime, 'yyyy-MM-dd HH:mm') &&
                (!serviceType || bookingServiceType === serviceType ||
                 booking.services.category === slot.location)
              );
            });

            if (!isBooked) {
              futureSlots.push({
                date: slotDateTime,
                time: slot.start_time.substring(0, 5),
                location: slot.location || 'studio',
                serviceType: slot.service_type as 'beauty' | 'fitness',
                slotId: slot.id,
              });
            }
          }
        }

        // Sort by date and time, limit results
        const sortedSlots = futureSlots
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .slice(0, limit);

        setAvailableSlots(sortedSlots);
      } catch (error) {
        logger.error('Error fetching availability:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [serviceType, limit]);

  const handleBookSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setIsBookerOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (availableSlots.length === 0) {
    return (
      <Card className="glass-card p-8 text-center">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          {i18n.language === 'pl' 
            ? 'Brak dostępnych terminów. Sprawdź ponownie wkrótce!' 
            : i18n.language === 'en'
            ? 'No available slots. Check back soon!'
            : 'Немає доступних слотів. Перевірте пізніше!'}
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl md:text-3xl font-bold">
            {i18n.language === 'pl' 
              ? 'Najbliższe Terminy' 
              : i18n.language === 'en'
              ? 'Next Available Slots'
              : 'Наступні Доступні Слоти'}
          </h3>
          {showViewAll && (
            <Button variant="link" className="text-primary hover:text-primary/80">
              {i18n.language === 'pl' ? 'Zobacz wszystkie →' : i18n.language === 'en' ? 'View All →' : 'Переглянути всі →'}
            </Button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {availableSlots.map((slot, _index) => {
            const slotsLeftToday = availableSlots.filter(s =>
              format(s.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
            ).length;
            const isToday = format(slot.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            const showUrgency = isToday && slotsLeftToday <= 3 && slotsLeftToday > 0;

            return (
              <Card
                key={`${slot.slotId}-${slot.date.toISOString()}`}
                className="glass-card p-5 hover:border-primary/50 transition-all group cursor-pointer relative overflow-hidden"
                onClick={() => handleBookSlot(slot)}
              >
                {showUrgency && (
                  <div className="absolute top-3 right-3 z-10">
                    <Badge variant="destructive" className="text-[10px] px-2 py-0.5 font-semibold animate-pulse">
                      Only {slotsLeftToday} left today!
                    </Badge>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {format(slot.date, 'EEE, MMM d')}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{slot.time}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        {getLocationIcon(slot.location)}
                        <span>{getLocationLabel(slot.location, i18n.language)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="group-hover:scale-105 transition-transform"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBookSlot(slot);
                  }}
                >
                  {i18n.language === 'pl' ? 'Rezerwuj' : i18n.language === 'en' ? 'Book' : 'Забронювати'}
                </Button>
              </div>
            </Card>
          );
          })}
        </div>
      </div>

      <BookingSheet
        isOpen={isBookerOpen}
        onClose={() => {
          setIsBookerOpen(false);
          setSelectedSlot(null);
        }}
        services={services}
      />
    </>
  );
};

export default AvailableSlotsList;
