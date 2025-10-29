# Business Logic and Domain Concepts

This document outlines the core business logic, domain concepts, and business rules for the Mariia Hub booking platform targeting the premium Warsaw beauty and fitness market.

## 🎯 Business Domain Overview

### Core Business Model
- **Service Booking Platform**: Connects clients with beauty and fitness services
- **Premium Market Focus**: Luxury positioning for Warsaw metropolitan area
- **Multi-Service Categories**: Beauty treatments, fitness programs, lifestyle services
- **Direct Booking**: Client books directly with service providers
- **Payment Integration**: Secure online payment processing
- **Multi-language Support**: Polish, English, Ukrainian, Russian

### Key Business Entities

#### 1. Services
The central entity representing what can be booked.

**Service Types**:
- **Beauty**: Cosmetic treatments (lashes, brows, PMU, etc.)
- **Fitness**: Training programs and classes
- **Lifestyle**: Additional premium services

**Service Properties**:
```typescript
interface Service {
  id: string;
  title: Record<string, string>;          // Multilingual titles
  description: Record<string, string>;     // Multilingual descriptions
  category: ServiceCategory;
  price: PricingInfo;                    // Complex pricing structure
  duration: Duration;                    // Service duration
  requirements: ServiceRequirements;       // Client requirements
  preparation: ContentBlock[];            // Before-care instructions
  aftercare: ContentBlock[];             // After-care instructions
  expectations: ContentBlock[];           // What to expect
  gallery: MediaGallery;                 // Service photos/videos
  faqs: FAQItem[];                     // Frequently asked questions
  availability: AvailabilityRules;          // Booking constraints
  location: ServiceLocation;              // Where service is provided
  tags: string[];                       // Search/filter tags
  status: ServiceStatus;                 // active, inactive, seasonal
}
```

#### 2. Bookings
The core transaction entity representing a service reservation.

**Booking Lifecycle**:
1. **Draft**: Session-based booking creation
2. **Hold**: Temporary slot reservation (5-minute window)
3. **Pending**: Confirmed, awaiting payment
4. **Confirmed**: Paid and scheduled
5. **InProgress**: Service currently being provided
6. **Completed**: Service finished, feedback requested
7. **Cancelled**: Cancelled (client/provider/initiated)
8. **NoShow**: Client didn't arrive

**Booking Properties**:
```typescript
interface Booking {
  id: string;
  serviceId: string;
  clientId?: string;                      // null for guest bookings
  clientInfo: ClientInformation;          // May be guest info
  scheduledTime: DateTime;               // Booking time with timezone
  duration: Duration;                   // Actual booking duration
  price: PriceInfo;                     // Final price with discounts
  status: BookingStatus;
  paymentInfo?: PaymentInfo;
  location: BookingLocation;
  notes?: string;                       // Client special requests
  groupBooking?: GroupBookingInfo;         // For multiple participants
  packageBooking?: PackageBookingInfo;     // When part of package
  externalSync: ExternalSyncInfo;         // Booksy/sync status
  metadata: BookingMetadata;             // Analytics and tracking
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

#### 3. Clients/Patrons
Users who book services.

**Client Types**:
- **Registered**: Full account with profile
- **Guest**: One-time booking without account
- **VIP**: Premium clients with special benefits

**Client Properties**:
```typescript
interface Client {
  id: string;
  profile: ClientProfile;
  preferences: ClientPreferences;
  bookingHistory: BookingSummary[];
  loyaltyInfo: LoyaltyStatus;
  paymentMethods: StoredPaymentMethod[];
  communicationPreferences: CommunicationSettings;
  privacy: PrivacySettings;
  membership?: MembershipInfo;
  createdAt: DateTime;
  lastActiveAt: DateTime;
}
```

## 💰 Pricing and Payment Domain

### Pricing Structure

#### Base Pricing Model
```typescript
interface PricingInfo {
  basePrice: Money;                     // Standard price
  currency: Currency;                   // PLN, EUR, USD
  priceType: PriceType;                  // fixed, range, custom
  discounts: DiscountRules[];             // Available discounts
  taxes: TaxCalculation[];              // VAT, service charges
  deposits: DepositPolicy;               // Deposit requirements
  cancellationPolicy: CancellationPolicy; // Fee structure
  dynamicPricing: DynamicPricingRules;   // Time-based adjustments
}
```

#### Discount Rules
**Discount Types**:
- **Package Discount**: Multiple services booked together
- **Loyalty Discount**: Based on client status
- **Time-based Discount**: Off-peak pricing
- **Group Discount**: Multiple participants
- **Promotional Discount**: Limited-time offers
- **First-time Discount**: New client incentive

**Discount Calculation Order**:
1. Base Price
2. - Package Discount
3. - Group Discount
4. - Loyalty Discount
5. - Promotional Discount
6. - Time-based Discount
7. = Subtotal
8. + Taxes/VAT
9. = Final Price

#### Polish VAT Rules
```typescript
interface VATRules {
  beautyServices: 23;                    // Standard VAT rate
  fitnessServices: 23;                   // Standard VAT rate
  reducedRate: 8;                       // Some specialized services
  exemptions: ServiceType[];               // Medical/exempt services

  // B2B considerations
  b2bRequirement: {
    minAmount: 10000;                   // PLN 10,000 annual
    requiresNIP: true;                   // VAT ID required
  };
}
```

### Payment Processing

#### Payment Methods
- **Stripe**: Credit/debit cards, digital wallets
- **Gift Cards**: Internal gift card system
- **Loyalty Points**: Redeemable for discounts
- **Cash**: On-site payment (not online)

#### Payment Flow
1. **Price Calculation**: Final amount with discounts/taxes
2. **Payment Intent**: Stripe payment intent creation
3. **Client Confirmation**: 3D Secure if required
4. **Payment Capture**: Amount captured from card
5. **Booking Confirmation**: Final booking confirmation

#### Refund and Cancellation
**Cancellation Windows**:
- **24+ hours**: Full refund
- **12-24 hours**: 50% refund
- **<12 hours**: No refund (unless exceptional)
- **Emergency Cases**: Case-by-case review

**Refund Methods**:
- **Automatic**: System-initiated refunds
- **Manual**: Admin-approved special cases
- **Gift Card**: Store credit option
- **Loyalty Bonus**: Additional points for future use

## 📅 Availability and Scheduling

### Time Management

#### Availability Slots
```typescript
interface AvailabilitySlot {
  id: string;
  startTime: DateTime;                   // Slot start time
  endTime: DateTime;                     // Slot end time
  duration: Duration;                    // Slot duration
  capacity: number;                      // Max concurrent bookings
  bookedCount: number;                   // Current bookings
  available: boolean;                    // Can be booked
  locationId: string;                    // Service location
  providerId?: string;                   // Specific provider
  restrictions: SlotRestrictions[];        // Booking constraints
  metadata: SlotMetadata;                // Analytics data
}
```

#### Scheduling Rules
**Business Hours**:
- **Standard Hours**: 9:00 AM - 8:00 PM
- **Weekend**: Reduced hours
- **Holidays**: Polish holiday calendar
- **Special Events**: Modified schedules

**Service Duration Rules**:
- **Minimum Booking**: 30 minutes
- **Maximum Booking**: 4 hours
- **Buffer Time**: 15 minutes between bookings
- **Preparation Time**: Service-specific setup requirements

#### Resource Allocation
```typescript
interface Resource {
  id: string;
  name: string;
  type: ResourceType;                    // Room, equipment, staff
  capacity: number;
  location: ResourceLocation;
  schedule: ResourceSchedule;
  conflicts: BookingConflict[];          // Overlap detection
  maintenanceSchedule: MaintenanceWindow[];
}
```

### Capacity Management

#### Booking Limits
- **Per Slot**: Based on service type and resources
- **Per Day**: Maximum daily bookings per location
- **Per Provider**: Staff workload limits
- **System-wide**: Platform capacity constraints

#### Waitlist Management
```typescript
interface WaitlistEntry {
  id: string;
  serviceId: string;
  clientId: string;
  requestedTime: DateTime;
  requestedDuration: Duration;
  flexibility: TimeFlexibility;             // How flexible client is
  notificationPreferences: NotificationSettings;
  createdAt: DateTime;
  priority: WaitlistPriority;            // VIP status, etc.
}
```

## 🏷️ Multi-language and Localization

### Language Support
**Supported Languages**:
- **Polish (pl)**: Primary market language
- **English (en)**: Secondary language
- **Ukrainian (ua)**: Expatriate community
- **Russian (ru)**: Legacy support

### Content Localization Strategy

#### Multilingual Content
```typescript
interface LocalizedContent {
  key: string;                           // Content identifier
  translations: Record<Language, Translation>;
  context: ContentContext;                 // UI context usage
  lastUpdated: DateTime;
  status: TranslationStatus;               // draft, approved, published
}

interface Translation {
  text: string;
  culturalNotes?: string;                  // Cultural considerations
  genderVariants?: Record<'male' | 'female' | 'neutral', string>;
  pluralForms?: string[];                // Pluralization rules
}
```

#### Currency and Number Formatting
```typescript
interface LocalizationRules {
  currency: {
    primary: 'PLN';
    supported: ['PLN', 'EUR', 'USD'];
    symbolPosition: 'after';               // 100 zł vs $100
    decimalSeparator: ',';
    thousandsSeparator: ' ';
  };
  dateFormat: {
    polish: 'DD.MM.YYYY HH:mm';
    english: 'MM/DD/YYYY h:mm A';
    // Format patterns
  };
  numberFormat: {
    decimalPlaces: 2;
    useGrouping: true;
  };
}
```

## 🔐 Business Rules and Constraints

### Booking Constraints

#### Service-Specific Rules
```typescript
interface ServiceConstraints {
  minAdvanceBooking: Duration;              // Minimum advance notice
  maxAdvanceBooking: Duration;              // Maximum future booking
  cancellationDeadline: Duration;           // Latest cancellation time
  ageRequirements: AgeRestrictions;          // Age limits
  healthRequirements: HealthConditions[];     // Medical considerations
  preparationTime: Duration;               // Time needed before service
  aftercarePeriod: Duration;               // Recovery time
}
```

#### Client Validation Rules
- **Age Verification**: Services with age requirements
- **Health Screening**: Contra-indicated conditions
- **Payment Validation**: Valid payment method
- **Contact Verification**: Email/SMS confirmation
- **Location Validation**: Service area restrictions

### Quality Assurance Rules

#### Service Standards
- **Provider Certification**: Verified credentials
- **Facility Requirements**: Safety and hygiene standards
- **Equipment Standards**: Professional-grade equipment
- **Product Quality**: Premium products only

#### Client Experience Rules
- **Response Time**: <24 hours for inquiries
- **Resolution Time**: <48 hours for issues
- **Satisfaction Guarantee**: Problem resolution policy
- **Feedback Collection**: Post-service mandatory feedback

## 📊 Analytics and Business Intelligence

### Key Metrics

#### Operational KPIs
- **Booking Conversion Rate**: Visitors to bookings
- **Average Booking Value**: Revenue per booking
- **Cancellation Rate**: Percentage of cancelled bookings
- **No-show Rate**: Percentage of missed appointments
- **Client Retention**: Repeat booking rate
- **Service Utilization**: Capacity utilization percentage

#### Financial KPIs
- **Daily Revenue**: Total bookings revenue
- **Monthly Recurring Revenue**: Subscription/retainer income
- **Average Transaction Value**: Mean booking amount
- **Payment Success Rate**: Transaction completion rate
- **Refund Rate**: Percentage refunded

#### Customer Experience KPIs
- **Client Satisfaction Score**: Post-service ratings
- **Net Promoter Score**: Client recommendation likelihood
- **Response Time**: Inquiry response metrics
- **Issue Resolution**: Problem solving effectiveness
- **Loyalty Program Engagement**: Points usage and redemption

### Data Collection Points

#### Booking Journey
```typescript
interface BookingAnalytics {
  sessionId: string;                      // Visit session
  entryPoint: EntryPoint;                   // How they arrived
  serviceViewCount: number;                // Services viewed
  timeSpentBrowsing: Duration;             // Browsing time
  abandonedSteps: AbandonedStep[];          // Where they dropped off
  completionTime: Duration;                 // Time to complete
  deviceInfo: DeviceContext;                // Mobile/desktop/etc.
  locationContext: GeoContext;              # Geographic data
}
```

#### Service Performance
```typescript
interface ServiceAnalytics {
  serviceId: string;
  bookings: BookingMetrics[];
  revenue: RevenueMetrics[];
  clientFeedback: FeedbackSummary[];
  providerPerformance: PerformanceMetrics[];
  seasonalPatterns: SeasonalityData;
  peakHours: TimeSlotAnalytics[];
}
```

## 🔗 External Integrations

### Booksy Integration

#### Sync Direction
- **Bidirectional**: Changes sync both ways
- **Real-time**: Immediate booking updates
- **Conflict Resolution**: Intelligent merge strategies
- **Error Handling**: Graceful degradation

#### Sync Rules
```typescript
interface BooksySyncRules {
  priority: 'booksy' | 'mariia';          // Which system wins
  conflictResolution: ConflictStrategy;       // How to handle conflicts
  readonlyFields: string[];               // Fields that can't be changed
  syncWindow: Duration;                   // How often to sync
  errorHandling: ErrorHandlingPolicy;        // What to do on errors
}
```

### Stripe Integration

#### Payment Processing
- **PCI Compliance**: No card data touches servers
- **3D Secure**: Strong authentication when required
- **Multi-currency**: Automatic currency conversion
- **Dispute Handling**: Automated chargeback response
- **Webhook Processing**: Reliable event handling

#### Subscription Management
```typescript
interface SubscriptionModel {
  id: string;
  name: string;
  price: RecurringPrice;
  billingCycle: BillingCycle;
  includedServices: ServiceId[];
  benefits: SubscriptionBenefit[];
  terms: SubscriptionTerms;
  status: SubscriptionStatus;
}
```

## 🎯 Business Logic Implementation

### Booking Flow Logic

#### Price Calculation Algorithm
```typescript
function calculateBookingPrice(
  basePrice: Money,
  options: BookingOptions,
  client: ClientInfo,
  service: Service
): CalculatedPrice {
  let price = basePrice;

  // 1. Apply service-specific pricing
  if (service.pricing.dynamicPricing) {
    price = applyDynamicPricing(price, options.scheduledTime);
  }

  // 2. Apply group discounts
  if (options.groupSize > 1) {
    price = applyGroupDiscount(price, options.groupSize);
  }

  // 3. Apply loyalty discounts
  if (client.loyaltyInfo.tier !== 'none') {
    price = applyLoyaltyDiscount(price, client.loyaltyInfo);
  }

  // 4. Apply promotional discounts
  if (options.promoCode) {
    price = applyPromotionalDiscount(price, options.promoCode);
  }

  // 5. Calculate taxes
  const taxes = calculatePolishVAT(price, service.category);

  // 6. Calculate deposits if required
  const deposit = calculateDeposit(price, service.depositPolicy);

  return {
    subtotal: price,
    taxes,
    deposit,
    total: addAll([price, taxes]),
    currency: basePrice.currency,
  };
}
```

#### Availability Checking
```typescript
function checkAvailability(
  serviceId: string,
  requestedTime: DateTime,
  duration: Duration,
  groupSize: number = 1
): AvailabilityResult {
  // 1. Get service constraints
  const service = getService(serviceId);
  const constraints = service.availability.constraints;

  // 2. Validate time windows
  if (!isWithinBusinessHours(requestedTime, constraints.businessHours)) {
    return { available: false, reason: 'outside_business_hours' };
  }

  if (!meetsAdvanceBookingRequirements(requestedTime, constraints.minAdvanceBooking)) {
    return { available: false, reason: 'insufficient_advance_notice' };
  }

  // 3. Check resource availability
  const requiredResources = getServiceRequirements(serviceId, groupSize);
  const resourceAvailability = checkResourceAvailability(
    requiredResources,
    requestedTime,
    duration
  );

  if (!resourceAvailability.available) {
    return {
      available: false,
      reason: 'resource_conflict',
      conflicts: resourceAvailability.conflicts
    };
  }

  // 4. Check booking capacity
  const existingBookings = getBookingsInTimeRange(requestedTime, duration);
  if (exceedsCapacity(existingBookings, groupSize, constraints.maxCapacity)) {
    return { available: false, reason: 'capacity_exceeded' };
  }

  // 5. Check for concurrent bookings by same client
  const clientBookings = getClientBookingsInTimeRange(
    requestedTime,
    duration,
    constraints
  );

  if (hasConflictingClientBookings(clientBookings)) {
    return { available: false, reason: 'client_conflict' };
  }

  return {
    available: true,
    suggestedSlots: generateAlternativeSlots(requestedTime, duration)
  };
}
```

### Cancellation Logic

#### Refund Calculation
```typescript
function calculateRefund(
  booking: Booking,
  cancellationTime: DateTime,
  reason: CancellationReason
): RefundCalculation {
  const { price, scheduledTime, cancellationPolicy } = booking;

  // 1. Check cancellation window
  const timeUntilBooking = scheduledTime.diff(cancellationTime, 'hours');

  if (timeUntilBooking.hours >= 24) {
    // Full refund
    return {
      refundAmount: price.total,
      refundMethod: 'original_payment',
      processingFee: 0,
      reason: 'full_refund'
    };
  }

  if (timeUntilBooking.hours >= 12 && timeUntilBooking.hours < 24) {
    // 50% refund
    const refundAmount = price.total.multiply(0.5);
    return {
      refundAmount,
      refundMethod: 'original_payment',
      processingFee: price.total.multiply(0.5),
      reason: 'partial_refund_time_window'
    };
  }

  // Check for exceptions
  if (isExceptionalCircumstance(reason)) {
    return {
      refundAmount: price.total,
      refundMethod: 'store_credit',
      processingFee: 0,
      reason: 'exceptional_circumstance'
    };
  }

  // No refund for <12 hours
  return {
    refundAmount: Money.zero(price.currency),
    refundMethod: 'none',
    processingFee: price.total,
    reason: 'no_refund_time_window'
  };
}
```

## 🔍 Testing Business Logic

### Test Coverage for Business Rules

#### Price Calculation Tests
```typescript
describe('Booking Price Calculation', () => {
  it('applies Polish VAT correctly for beauty services', () => {
    const result = calculateBookingPrice(
      Money.pln(100),  // Base price
      mockBookingOptions,
      mockClient,
      mockBeautyService
    );

    expect(result.taxes.total).toEqual(Money.pln(23)); // 23% VAT
    expect(result.total).toEqual(Money.pln(123));
  });

  it('applies group discount correctly', () => {
    const result = calculateBookingPrice(
      Money.pln(200),
      { ...mockBookingOptions, groupSize: 3 },
      mockClient,
      mockService
    );

    expect(result.discounts).toContainEqual(
      expect.objectContaining({
        type: 'group',
        percentage: 15
      })
    );
  });

  it('handles VIP loyalty status', () => {
    const vipClient = { ...mockClient, loyaltyInfo: { tier: 'vip' } };
    const result = calculateBookingPrice(
      Money.pln(100),
      mockBookingOptions,
      vipClient,
      mockService
    );

    expect(result.discounts).toContainEqual(
      expect.objectContaining({
        type: 'loyalty',
        percentage: 10
      })
    );
  });
});
```

#### Availability Validation Tests
```typescript
describe('Availability Checking', () => {
  it('prevents booking outside business hours', () => {
    const result = checkAvailability(
      'service-1',
      DateTime.fromObject({ hour: 22 }),  // 10 PM
      Duration.fromObject({ hours: 1 })
    );

    expect(result.available).toBe(false);
    expect(result.reason).toBe('outside_business_hours');
  });

  it('requires minimum advance booking notice', () => {
    const service = { ...mockService, minAdvanceBooking: Duration.fromObject({ hours: 24 }) };
    const requestedTime = DateTime.now().plus(Duration.fromObject({ hours: 12 }));

    const result = checkAvailability('service-1', requestedTime, Duration.fromObject({ hours: 1 }));

    expect(result.available).toBe(false);
    expect(result.reason).toBe('insufficient_advance_notice');
  });
});
```

## 🚀 Future Business Logic Considerations

### Scalability Planning
- **Multi-location Support**: Expand to other cities
- **Service Provider Marketplace**: Multiple providers per service
- **AI-powered Recommendations**: Personalized service suggestions
- **Dynamic Pricing**: Real-time price adjustments
- **Subscription Models**: Ongoing service packages

### Compliance Requirements
- **GDPR**: Data protection compliance
- **Polish E-commerce Laws**: Consumer rights
- **Financial Regulations**: Payment processing compliance
- **Accessibility Standards**: WCAG AA compliance
- **Tax Compliance**: VAT and financial reporting

---

*This document should be updated as business logic evolves. Last updated: January 2025*