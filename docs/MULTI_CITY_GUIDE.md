# Multi-City Support Implementation Guide

This guide provides comprehensive documentation for implementing and using the multi-city support feature in the Mariia Hub platform.

## Overview

The multi-city support enables the platform to operate across multiple Polish cities with location-aware services, regional pricing, and compliance management. This implementation includes:

- Automatic location detection
- City-specific service availability
- Regional pricing and tax configuration
- Compliance management by location
- Location-aware booking flow

## Architecture

### Core Components

1. **LocationService** (`src/services/LocationService.ts`)
   - Geolocation detection (IP-based and browser)
   - Distance calculations
   - City and location management
   - Timezone handling

2. **LocationContext** (`src/contexts/LocationContext.tsx`)
   - Global location state management
   - User location preferences
   - City and location selection logic
   - Caching and persistence

3. **Location Components** (`src/components/location/`)
   - `CitySelector.tsx`: City selection UI
   - `LocationSelector.tsx`: Location selection UI
   - `LocationDisplay.tsx`: Location information display

4. **Database Schema**
   - `cities`: City configuration
   - `locations`: Physical service locations
   - `regional_pricing`: Price management by location
   - `service_location_availability`: Service availability rules
   - `city_tax_config`: Tax configuration by city
   - `legal_requirements`: Compliance by location

## Setup Instructions

### 1. Database Migration

Run the migration script to create the multi-city tables:

```bash
# Apply the migration to your Supabase database
npx supabase db push

# Or run the migration manually
psql YOUR_DATABASE_URL < supabase/migrations/20240101_add_multi_city_support.sql
```

### 2. Environment Configuration

Add location service configuration to your `.env` file:

```bash
# Location Services (optional - free tier available)
VITE_IPINFO_TOKEN="your-ipinfo-token"
VITE_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

### 3. Data Migration

Run the migration script to migrate existing data:

```bash
# Install dependencies if needed
npm install @supabase/supabase-js dotenv

# Run the migration script
node scripts/migrate-multi-city.js
```

### 4. Application Integration

The LocationProvider is already integrated into `App.tsx`. The context provides:

```typescript
const {
  currentCity,
  currentLocation,
  userLocation,
  availableCities,
  availableLocations,
  setCity,
  setLocation,
  detectUserLocation,
  searchNearbyLocations
} = useLocation();
```

## Usage Examples

### 1. Adding a City Selector

```tsx
import { CitySelector } from '@/components/location/CitySelector';

function Header() {
  return (
    <div className="header">
      <div className="logo">MyApp</div>
      <CitySelector variant="compact" />
    </div>
  );
}
```

### 2. Location-Aware Service Display

```tsx
import { useLocation } from '@/contexts/LocationContext';
import { LocationSelector } from '@/components/location/LocationSelector';

function ServicePage() {
  const { currentCity, currentLocation, setLocation } = useLocation();

  return (
    <div>
      <h2>Services in {currentCity?.name}</h2>
      <LocationSelector
        cityId={currentCity?.id}
        selectedLocationId={currentLocation?.id}
        onLocationChange={setLocation}
        showDistance
        userCoordinates={userLocation?.coordinates}
      />
    </div>
  );
}
```

### 3. Distance Calculation

```tsx
import LocationService from '@/services/LocationService';

function DistanceDisplay({ from, to }) {
  const distance = LocationService.calculateDistance(from, to);
  const formatted = LocationService.formatDistance(distance);

  return <span>{formatted} away</span>;
}
```

### 4. Location-Aware Pricing

```tsx
async function getServicePricing(serviceId, locationId) {
  const { data, error } = await supabase
    .from('regional_pricing')
    .select('*')
    .eq('service_id', serviceId)
    .eq('location_id', locationId)
    .eq('is_active', true)
    .single();

  return data;
}
```

## Configuration

### City Configuration

Cities are configured in the `cities` table with the following options:

```sql
INSERT INTO cities (
  name,
  country_code,
  region,
  seo_slug,
  default_currency,
  timezone,
  is_active,
  launch_date,
  marketing_config,
  legal_config,
  tax_config
) VALUES (
  'Krakow',
  'PL',
  'Lesser Poland',
  'krakow',
  'PLN',
  'Europe/Warsaw',
  false,
  '2024-06-01',
  '{"heroTitle": "Beauty in Krakow", "tagline": "Coming Soon"}',
  '{"ageRestrictions": {"minAge": 18}}',
  '{"vatRate": 0.23}'
);
```

### Location Configuration

Physical locations are configured with:

```sql
INSERT INTO locations (
  name,
  type,
  city_id,
  address,
  coordinates,
  operating_hours,
  services_offered,
  is_primary_location
) VALUES (
  'BM BEAUTY Studio',
  'studio',
  'city-id',
  'Smolna 8, Warsaw',
  '(52.2297, 21.0122)',
  '{"monday": {"open": "09:00", "close": "20:00"}}',
  '{"pmu", "brow-lamination", "makeup"}',
  true
);
```

### Regional Pricing

Configure pricing by location:

```sql
INSERT INTO regional_pricing (
  service_id,
  city_id,
  location_id,
  base_price,
  currency,
  tax_rate,
  price_adjustments
) VALUES (
  'service-id',
  'city-id',
  'location-id',
  500.00,
  'PLN',
  0.23,
  '{"weekendSurcharge": 0.1, "eveningSurcharge": 0.15}'
);
```

## Best Practices

### 1. Location Detection

- Always provide a manual override option
- Cache location data to reduce API calls
- Handle permission denials gracefully
- Show loading states during detection

### 2. Performance

- Use React Query for location data caching
- Implement distance calculations on the client
- Preload nearby location data
- Use CDN for static location data

### 3. User Experience

- Show current location prominently
- Provide clear feedback during detection
- Allow easy location changes
- Display distances in user-friendly format

### 4. Privacy

- Request location permission transparently
- Provide clear privacy policy links
- Allow users to clear location data
- Follow GDPR requirements

## Troubleshooting

### Common Issues

1. **Location Detection Not Working**
   - Check IPINFO_TOKEN in environment variables
   - Verify network connectivity
   - Check browser permissions for geolocation

2. **Cities Not Showing**
   - Verify database migration completed
   - Check city `is_active` flag
   - Verify city `launch_date` is in the past

3. **Distance Calculations Incorrect**
   - Ensure coordinates are in decimal degrees
   - Check coordinate order (lat, lng)
   - Validate coordinate ranges

4. **Pricing Not Updating**
   - Check regional_pricing table entries
   - Verify `is_active` flag
   - Check valid date ranges

### Debug Tools

```typescript
// Enable debug logging in LocationService
localStorage.setItem('debug_location', 'true');

// Clear location cache
LocationService.clearCachedLocation();

// Test geolocation
navigator.geolocation.getCurrentPosition(
  (pos) => console.log('Position:', pos),
  (err) => console.error('Error:', err)
);
```

## API Reference

### LocationService Methods

```typescript
// Detect user location
LocationService.detectUserLocation(): Promise<UserLocation | null>

// Get active cities
LocationService.getActiveCities(): Promise<City[]>

// Get city by slug
LocationService.getCityBySlug(slug: string): Promise<City | null>

// Get locations in city
LocationService.getLocationsInCity(cityId: string): Promise<Location[]>

// Search nearby locations
LocationService.searchNearbyLocations(params: SearchParams): Promise<Location[]>

// Calculate distance
LocationService.calculateDistance(from: Coordinates, to: Coordinates): number

// Get travel time
LocationService.getTravelTime(from: Coordinates, to: Coordinates, mode?: string): Promise<TravelTime>

// Format distance
LocationService.formatDistance(meters: number, locale?: string): string
```

### LocationContext Values

```typescript
interface LocationContextType {
  // State
  currentCity: City | null;
  currentLocation: Location | null;
  userLocation: UserLocation | null;
  availableCities: City[];
  availableLocations: Location[];
  isDetectingLocation: boolean;
  locationError: string | null;

  // Actions
  setCity: (cityId: string) => Promise<void>;
  setLocation: (locationId: string) => Promise<void>;
  detectUserLocation: () => Promise<void>;
  searchNearbyLocations: (coordinates: Coordinates) => Promise<Location[]>;
  clearLocationData: () => void;
}
```

## Future Enhancements

### Planned Features

1. **Advanced Search**
   - Filter by multiple criteria
   - Sort by distance, price, rating
   - Saved search preferences

2. **Map Integration**
   - Interactive map view
   - Street view integration
   - Route planning

3. **Analytics Dashboard**
   - Location-based metrics
   - User location patterns
   - Service popularity by region

4. **Mobile App Features**
   - Background location updates
   - Push notifications for nearby services
   - Offline mode support

### Scalability Considerations

1. **Database Optimization**
   - Add spatial indexes for coordinates
   - Partition tables by region
   - Optimize queries for large datasets

2. **Caching Strategy**
   - Redis for location data
   - CDN for static assets
   - Edge computing for location APIs

3. **Microservices Architecture**
   - Separate location service
   - Dedicated pricing service
   - Independent compliance service

## Security Considerations

1. **Data Privacy**
   - Encrypt location data at rest
   - Implement data retention policies
   - Provide data export tools

2. **API Security**
   - Rate limit location APIs
   - Validate coordinate inputs
   - Secure location data transmission

3. **Compliance**
   - GDPR compliance for EU users
   - Local data residency requirements
   - Age verification for services

## Support

For issues or questions regarding multi-city support:

1. Check the troubleshooting section
2. Review the implementation examples
3. Create an issue in the project repository
4. Contact the development team

## Migration Checklist

- [ ] Run database migrations
- [ ] Configure environment variables
- [ ] Run data migration script
- [ ] Test location detection
- [ ] Verify city selection
- [ ] Test distance calculations
- [ ] Validate pricing updates
- [ ] Check compliance features
- [ ] Update documentation
- [ ] Train support team