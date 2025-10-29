import { useState, useEffect } from 'react';
import { MapPin, Clock, Sparkles, Dumbbell, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useMetaTracking } from '@/hooks/useMetaTracking';
import { logger } from '@/lib/logger';

interface Service {
  id: string;
  title: string;
  service_type: 'beauty' | 'fitness' | 'lifestyle';
  duration_minutes?: number;
  price_from?: number;
  category?: string;
  add_ons?: Array<{
    id: string;
    name: string;
    duration_minutes: number;
    price: number;
  }>;
  location_rules?: {
    allowed_locations: string[];
  };
}

interface Location {
  id: string;
  name: string;
  type: string;
}

interface Step1Props {
  services: Service[];
  locations: Location[];
  preselectedService?: string;
  preselectedType?: 'beauty' | 'fitness';
  onComplete: (data: {
    serviceId: string;
    serviceType: 'beauty' | 'fitness';
    durationMinutes: number;
    locationId: string;
    selectedAddOns: string[];
  }) => void;
}

export const Step1Choose = ({
  services,
  locations,
  preselectedService,
  preselectedType,
  onComplete
}: Step1Props) => {
  const { i18n } = useTranslation();
  const {
    trackServiceView,
    trackServiceSelection,
    trackBookingFunnel,
    trackServiceCategory,
    trackCustomConversion
  } = useMetaTracking();

  const [selectedType, setSelectedType] = useState<'beauty' | 'fitness' | null>(preselectedType || null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewedServices, setViewedServices] = useState<Set<string>>(new Set());

  // Auto-load preselected service
  useEffect(() => {
    if (preselectedService) {
      const service = services.find(s => s.id === preselectedService);
      if (service) {
        const mappedType = service.service_type === 'lifestyle' ? 'fitness' : service.service_type;
        setSelectedType(mappedType);
        setSelectedService(service);
        
        const defaultLocation = locations.find(l => 
          service.service_type === 'beauty' ? l.type === 'studio' : l.type === 'gym'
        );
        if (defaultLocation) {
          setSelectedLocation(defaultLocation.id);
        }
      }
    }
  }, [preselectedService, services, locations]);

  // Track service type selection
  useEffect(() => {
    if (selectedType) {
      trackCustomConversion('ServiceTypeSelected', {
        service_type: selectedType,
        selection_timestamp: new Date().toISOString(),
      });
    }
  }, [selectedType, trackCustomConversion]);

  // Track service selection
  useEffect(() => {
    if (selectedService) {
      // Track service selection with enhanced data
      trackServiceSelection(selectedService, 1);

      // Track service category-specific events
      if (selectedService.service_type === 'beauty') {
        trackServiceCategory.beautyServiceView(selectedService);
      } else if (selectedService.service_type === 'fitness') {
        trackServiceCategory.fitnessProgramView(selectedService);
      } else {
        trackServiceCategory.lifestyleServiceView(selectedService);
      }

      // Track detailed service selection
      trackCustomConversion('ServiceDetailedSelection', {
        service_id: selectedService.id,
        service_name: selectedService.title,
        service_type: selectedService.service_type,
        service_category: selectedService.category,
        price_from: selectedService.price_from,
        duration_minutes: selectedService.duration_minutes,
        has_addons: selectedService.add_ons && selectedService.add_ons.length > 0,
        addon_count: selectedService.add_ons?.length || 0,
        selection_step: 'step1_choose',
        selection_timestamp: new Date().toISOString(),
      });

      // Track booking funnel progression
      trackBookingFunnel.serviceSelected(selectedService);

      logger.info('Service selection tracked', {
        serviceId: selectedService.id,
        serviceType: selectedService.service_type,
        category: selectedService.category,
      });
    }
  }, [selectedService, trackServiceSelection, trackServiceCategory, trackCustomConversion, trackBookingFunnel]);

  // Track location selection
  useEffect(() => {
    if (selectedLocation && selectedService) {
      const location = locations.find(l => l.id === selectedLocation);
      if (location) {
        trackCustomConversion('LocationSelected', {
          service_id: selectedService.id,
          location_id: selectedLocation,
          location_name: location.name,
          location_type: location.type,
          selection_timestamp: new Date().toISOString(),
        });
      }
    }
  }, [selectedLocation, selectedService, locations, trackCustomConversion]);

  // Track search interactions
  useEffect(() => {
    if (searchOpen) {
      trackCustomConversion('ServiceSearchOpened', {
        search_timestamp: new Date().toISOString(),
        current_service_type: selectedType,
      });
    }
  }, [searchOpen, trackCustomConversion, selectedType]);

  // Track search queries
  useEffect(() => {
    if (searchTerm.length > 2) {
      trackCustomConversion('ServiceSearchQuery', {
        search_term: searchTerm,
        search_timestamp: new Date().toISOString(),
        service_type: selectedType,
        search_length: searchTerm.length,
      });
    }
  }, [searchTerm, trackCustomConversion, selectedType]);

  // Track service impressions (when services are displayed)
  const trackServiceImpression = (service: Service, position: number) => {
    if (!viewedServices.has(service.id)) {
      setViewedServices(prev => new Set([...prev, service.id]));

      trackServiceView(service);

      trackCustomConversion('ServiceGridImpression', {
        service_id: service.id,
        service_name: service.title,
        service_type: service.service_type,
        service_category: service.category,
        price_from: service.price_from,
        grid_position: position,
        total_services: services.length,
        current_filter: selectedType || 'all',
        impression_timestamp: new Date().toISOString(),
      });
    }
  };

  // Auto-complete when ready
  useEffect(() => {
    if (selectedService && selectedLocation) {
      // Track booking progression to next step
      trackBookingFunnel.timeSlotSelected({
        service_id: selectedService.id,
        service_name: selectedService.title,
        location_id: selectedLocation,
        step_completed: 'service_selection',
      });

      const mappedType = selectedService.service_type === 'lifestyle' ? 'fitness' : selectedService.service_type;
      onComplete({
        serviceId: selectedService.id,
        serviceType: mappedType as 'beauty' | 'fitness',
        durationMinutes: selectedService.duration_minutes || 60,
        locationId: selectedLocation,
        selectedAddOns: [],
      });
    }
  }, [selectedService, selectedLocation, onComplete, trackBookingFunnel]);

  const filteredServices = services
    .filter(s => !selectedType || s.service_type === selectedType)
    .filter(s => !searchTerm || s.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const beautyServices = filteredServices.filter(s => s.service_type === 'beauty').slice(0, 6);
  const fitnessServices = filteredServices.filter(s => s.service_type === 'fitness').slice(0, 6);

  const handleServiceClick = (service: Service) => {
    setSelectedService(service);

    // Track detailed service click
    trackCustomConversion('ServiceCardClick', {
      service_id: service.id,
      service_name: service.title,
      service_type: service.service_type,
      service_category: service.category,
      price_from: service.price_from,
      click_timestamp: new Date().toISOString(),
      current_filter: selectedType || 'all',
      search_active: searchOpen,
      search_term: searchTerm || null,
    });

    // Auto-select location if only one valid option
    const allowed = service?.location_rules?.allowed_locations || ['studio'];
    const validLocations = locations.filter(l => allowed.includes(l.type));
    if (validLocations.length === 1) {
      setSelectedLocation(validLocations[0].id);

      // Track auto-location selection
      trackCustomConversion('LocationAutoSelected', {
        service_id: service.id,
        location_id: validLocations[0].id,
        location_name: validLocations[0].name,
        location_type: validLocations[0].type,
        auto_selection_reason: 'single_valid_option',
      });
    }
  };

  const availableLocations = selectedService 
    ? locations.filter(l => (selectedService.location_rules?.allowed_locations || ['studio']).includes(l.type))
    : [];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Step 1: Choose Type (Beauty or Fitness) */}
      {!selectedType ? (
        <div className="space-y-3">
          <h3 className="text-base md:text-lg font-semibold text-pearl">What brings you here?</h3>
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <button
              onClick={() => setSelectedType('beauty')}
              className="p-6 md:p-8 rounded-2xl md:rounded-3xl border-2 border-champagne/20 glass-subtle hover:border-champagne/50 hover:shadow-luxury transition-all"
            >
              <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-champagne mx-auto mb-2 md:mb-3" />
              <div className="text-pearl font-semibold text-base md:text-lg">Beauty</div>
              <div className="text-pearl/60 text-xs mt-1">PMU • Brows</div>
            </button>
            <button
              onClick={() => setSelectedType('fitness')}
              className="p-6 md:p-8 rounded-2xl md:rounded-3xl border-2 border-champagne/20 glass-subtle hover:border-champagne/50 hover:shadow-luxury transition-all"
            >
              <Dumbbell className="w-6 h-6 md:w-8 md:h-8 text-champagne mx-auto mb-2 md:mb-3" />
              <div className="text-pearl font-semibold text-base md:text-lg">Fitness</div>
              <div className="text-pearl/60 text-xs mt-1">Training</div>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Compact breadcrumb for selected type */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedType === 'beauty' ? <Sparkles className="w-4 h-4 text-champagne" /> : <Dumbbell className="w-4 h-4 text-champagne" />}
              <span className="text-pearl/70 text-sm capitalize">{selectedType}</span>
            </div>
            <button onClick={() => { setSelectedType(null); setSelectedService(null); setSearchOpen(false); }} className="text-pearl/60 hover:text-pearl text-xs underline hover:text-pearl/80">
              Change
            </button>
          </div>

          {/* Step 2: Choose Service (compact tiles) */}
          {!selectedService ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base md:text-lg font-semibold text-pearl">Pick a service</h3>
                <button onClick={() => setSearchOpen(!searchOpen)} className="text-pearl/60 hover:text-pearl p-2 -mr-2">
                  <Search className="w-4 h-4" />
                </button>
              </div>

              {searchOpen && (
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-3 md:px-4 py-2 rounded-xl bg-cocoa/60 border border-pearl/30 text-pearl placeholder:text-pearl/40 text-sm md:text-base"
                  autoFocus
                />
              )}

              <div className="grid grid-cols-1 gap-2 max-h-[50vh] md:max-h-[400px] overflow-y-auto scrollbar-hide">
                {(selectedType === 'beauty' ? beautyServices : fitnessServices).map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceClick(service)}
                    className="p-3 md:p-4 rounded-xl md:rounded-2xl border border-champagne/15 glass-subtle hover:border-champagne/30 hover:shadow-medium transition-all text-left"
                  >
                    <div className="flex items-start justify-between gap-2 md:gap-3">
                      <div className="flex-1">
                        <div className="text-pearl font-medium text-sm md:text-base mb-1 line-clamp-2">{service.title}</div>
                        <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-xs md:text-sm text-pearl/60">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{service.duration_minutes || 60}m</span>
                          </div>
                          {service.price_from && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span className="text-champagne-200">{service.price_from} PLN</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-champagne text-base md:text-lg mt-0.5">→</div>
                    </div>
                  </button>
                ))}
              </div>

              {filteredServices.length > 6 && (
                <button onClick={() => setSearchOpen(true)} className="text-pearl/70 hover:text-pearl text-sm underline-offset-4 hover:underline w-full text-center">
                  See all {filteredServices.length} services
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Selected service summary */}
              <div className="p-4 rounded-2xl border-2 border-champagne/50 glass-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-pearl font-semibold mb-1">{selectedService.title}</div>
                    <div className="flex items-center gap-2 text-xs text-pearl/60">
                      <Clock className="w-3 h-3" />
                      <span>{selectedService.duration_minutes || 60} min</span>
                      {selectedService.price_from && (
                        <>
                          <span>•</span>
                          <span>From {selectedService.price_from} PLN</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelectedService(null); setSelectedLocation(''); }}
                    className="text-pearl/60 hover:text-pearl text-xs underline hover:text-pearl/80"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Step 3: Pick location (only if multiple) */}
              {availableLocations.length > 1 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-pearl flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Where?
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {availableLocations.map((loc) => (
                      <button
                        key={loc.id}
                        onClick={() => setSelectedLocation(loc.id)}
                        className={cn(
                          "px-4 py-2 rounded-xl border-2 transition-all",
                          selectedLocation === loc.id
                            ? "border-champagne/50 glass-card text-pearl"
                            : "border-champagne/15 glass-subtle text-pearl/70 hover:text-pearl hover:border-champagne/30"
                        )}
                      >
                        {loc.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
