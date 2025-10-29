# Mariia Hub - AI Agent Prompts for Parallel Development
*Tailored prompts for Claude Code/Codex to develop missing features*

---

## 🎯 **INSTRUCTIONS FOR PARALLEL DEVELOPMENT**

Each prompt below is self-contained and can be executed independently by an AI agent. Agents can work in parallel on different phases or sections within phases.

**Important Setup Before Starting:**
1. Each agent should first read `CLAUDE.md` for project context
2. Check existing implementations before building new features
3. Follow the established patterns and architecture
4. Use TypeScript and existing component libraries
5. Test implementations before marking as complete

---

## 🚀 **PHASE 0: PRE-PRODUCTION SETUP**

### **Prompt 0.1: Testing Infrastructure Setup**
```
You are implementing the testing infrastructure for Mariia Hub, a premium beauty and fitness booking platform.

CONTEXT:
- Built with React 18, TypeScript, Vite, Supabase
- Current testing setup: Vitest + Testing Library partially configured
- Need comprehensive test coverage targeting 90%

TASKS:
1. Configure Vitest for comprehensive unit testing
   - Update vitest.config.ts with proper test environment
   - Add test scripts to package.json
   - Configure coverage reporting with target 90%

2. Set up Testing Library for component tests
   - Configure test-utils for React components
   - Create custom render methods with providers
   - Add userEvent setup for interaction testing

3. Configure Playwright for E2E testing
   - Install and configure Playwright
   - Create test configuration for multiple browsers
   - Set up test environment variables

4. Add visual regression testing
   - Integrate with Chromatic or Percy
   - Configure screenshot testing
   - Add baseline capture workflow

5. Create test data factories
   - Build factories for bookings, services, users
   - Use factory pattern with faker library
   - Create mock data generators

6. Set up test utilities and helpers
   - Create test database setup/teardown
   - Add mock Supabase client
   - Build test assertion helpers

DELIVERABLES:
- Updated vitest.config.ts
- New playwright.config.ts
- Test factory files in src/test/factories/
- Test utilities in src/test/utils/
- Updated package.json with test scripts
- Coverage configuration

IMPLEMENTATION NOTES:
- Follow existing code patterns
- Use TypeScript strictly for tests
- Mock external services (Stripe, Booksy)
- Ensure tests are isolated and repeatable
```

### **Prompt 0.2: Staging Environment Configuration**
```
You are setting up a staging environment for Mariia Hub to enable preview deployments.

CONTEXT:
- Production uses Supabase with PostgreSQL
- Need preview branch deployments for PR testing
- Currently only development and production environments exist

TASKS:
1. Configure staging environment with Supabase preview
   - Create Supabase preview branch configuration
   - Set up staging database schema
   - Configure environment-specific variables

2. Set up preview branch deployments
   - Configure Vercel/Netlify for preview deployments
   - Create deployment pipeline for PR branches
   - Set up automatic preview URL generation

3. Configure environment variables
   - Create .env.staging template
   - Set up staging secrets management
   - Configure staging API endpoints

4. Set up staging database with seed data
   - Create seed script for staging data
   - Generate sample bookings, services, users
   - Set up database reset automation

5. Configure staging domain
   - Set up staging subdomain
   - Configure SSL certificates
   - Set up DNS records

DELIVERABLES:
- .env.staging configuration
- Database seed scripts
- Deployment configuration files
- Staging environment documentation
- PR template with preview deployment info

IMPLEMENTATION NOTES:
- Ensure staging is isolated from production
- Use realistic but anonymized test data
- Implement proper security for staging access
```

### **Prompt 0.3: CI/CD Pipeline Implementation**
```
You are implementing a comprehensive CI/CD pipeline for Mariia Hub.

CONTEXT:
- Git repository with feature branch workflow
- Need automated testing and deployment
- Multiple environments: dev, staging, production

TASKS:
1. Set up GitHub Actions workflows
   - Create .github/workflows/ directory
   - Configure test workflow for PR validation
   - Set up build and deployment workflows
   - Add security scanning workflow

2. Configure automated testing on PR
   - Run unit tests on every push
   - Execute integration tests
   - Run E2E tests on staging deployment
   - Require test coverage report

3. Add automated deployment to staging
   - Deploy preview environments for PRs
   - Auto-deploy main branch to staging
   - Run smoke tests after deployment
   - Generate deployment notifications

4. Configure production deployment with approval
   - Require manual approval for production
   - Run full test suite before deployment
   - Implement blue-green deployment
   - Add rollback capability

5. Add build artifact management
   - Store build artifacts
   - Manage versioned deployments
   - Clean up old artifacts
   - Create deployment history

DELIVERABLES:
- GitHub Actions workflow files
- Deployment scripts
- Environment configuration files
- README for CI/CD process
- Monitoring dashboard configuration

IMPLEMENTATION NOTES:
- Use GitHub secrets for sensitive data
- Implement proper error handling
- Add deployment notifications to Slack/Discord
- Document deployment procedures
```

### **Prompt 0.4: Monitoring Dashboards Setup**
```
You are setting up comprehensive monitoring for Mariia Hub production systems.

CONTEXT:
- React/Vite frontend with Supabase backend
- Need to monitor performance, errors, and business metrics
- Production environment requires observability

TASKS:
1. Configure Sentry error tracking
   - Set up Sentry project
   - Install @sentry/react and @sentry/tracing
   - Configure error boundaries
   - Add performance monitoring
   - Set up release tracking

2. Set up performance monitoring (Web Vitals)
   - Install web-vitals library
   - Configure Core Web Vitals tracking
   - Set up custom performance metrics
   - Create performance budget alerts

3. Create custom dashboards in Grafana
   - Set up Grafana instance
   - Create business metrics dashboard
   - Build technical performance dashboard
   - Add real-time monitoring views

4. Configure log aggregation (Loki)
   - Set up Loki for log collection
   - Configure log shipping from frontend
   - Add structured logging
   - Create log query dashboards

5. Set up uptime monitoring
   - Configure uptime checks
   - Set up alerting for downtime
   - Create status page
   - Add performance alerts

DELIVERABLES:
- Sentry configuration files
- Grafana dashboard configurations
- Logging configuration
- Monitoring documentation
- Alert configuration files

IMPLEMENTATION NOTES:
- Ensure PII is not logged
- Set up proper alert thresholds
- Create on-call rotation
- Document incident response
```

---

## 📅 **PHASE 1: CORE BOOKING ENHANCEMENTS**

### **Prompt 1.1: Group Booking System**
```
You are implementing a group booking system for Mariia Hub.

CONTEXT:
- Current booking system supports individual appointments
- Need to allow groups to book services together
- Services: beauty treatments, fitness classes, corporate wellness

TASKS:
1. Database Schema Updates
   - Modify bookings table to support groups
   - Add group_size and group_type fields
   - Create group_booking_members table
   - Update availability_slots for capacity

2. Frontend Implementation
   - Create GroupBookingModal component
   - Add group size selection UI
   - Implement group member details form
   - Update booking flow for groups

3. Backend Logic
   - Implement group pricing logic
   - Add group availability checking
   - Create group booking API endpoints
   - Handle group notifications

4. Validation & Rules
   - Add minimum/maximum group sizes
   - Implement group discount rules
   - Validate group member details
   - Add group booking policies

DELIVERABLES:
- Database migration files
- GroupBookingModal.tsx component
- Group booking service functions
- Updated booking flow components
- Group booking tests

IMPLEMENTATION NOTES:
- Follow existing booking patterns
- Use TypeScript interfaces for group data
- Maintain backward compatibility
- Test with various group sizes
```

### **Prompt 1.2: Waitlist System with Auto-Promotion**
```
You are implementing a waitlist system for Mariia Hub to capture demand when slots are full.

CONTEXT:
- Users need to join waitlist when preferred slots are unavailable
- System should auto-promote when slots open
- Need notifications for waitlist movements

TASKS:
1. Database Implementation
   ```sql
   CREATE TABLE waitlist_entries (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     service_id UUID REFERENCES services(id),
     user_id UUID REFERENCES profiles(id),
     preferred_date DATE NOT NULL,
     preferred_time TIME,
     group_size INTEGER DEFAULT 1,
     status TEXT DEFAULT 'active', -- active, promoted, expired, cancelled
     created_at TIMESTAMP DEFAULT now(),
     promoted_at TIMESTAMP,
     expires_at TIMESTAMP DEFAULT (now() + INTERVAL '30 days')
   );
   ```

2. Waitlist Join Flow
   - Create JoinWaitlistModal component
   - Add waitlist button to booking flow
   - Collect preferred dates/times
   - Send confirmation notifications

3. Auto-Promotion System
   - Create database function check_waitlist_promotion
   - Set up trigger on booking cancellations
   - Implement promotion logic based on waitlist position
   - Send promotion notifications

4. Waitlist Management
   - Build admin waitlist dashboard
   - Add manual promotion capabilities
   - Create waitlist analytics
   - Implement waitlist expiration

DELIVERABLES:
- Database migration file
- JoinWaitlistModal component
- Waitlist service functions
- Admin waitlist dashboard
- Notification templates
- Waitlist tests

IMPLEMENTATION NOTES:
- Prioritize by waitlist creation time
- Handle multiple service availability
- Send SMS/email notifications
- Create fair promotion algorithm
```

### **Prompt 1.3: Capacity Management System**
```
You are implementing capacity management for time slots to handle multiple bookings per slot.

CONTEXT:
- Current system allows 1 booking per slot
- Need to support variable capacity for different services
- Some services can handle multiple clients simultaneously

TASKS:
1. Database Updates
   ```sql
   ALTER TABLE availability_slots ADD COLUMN capacity INTEGER DEFAULT 1;
   ALTER TABLE availability_slots ADD COLUMN booked_count INTEGER DEFAULT 0;
   CREATE UNIQUE INDEX slots_unique_capacity
     ON availability_slots(service_id, start_time, provider_id);
   ```

2. Capacity Checking Logic
   - Update availability checking functions
   - Implement capacity-aware booking validation
   - Add visual indicators for remaining capacity
   - Create capacity override for admins

3. Frontend Updates
   - Update Step2Time component to show capacity
   - Add capacity badges in calendar view
   - Create capacity legend
   - Show "X of Y slots available" indicators

4. Admin Capacity Management
   - Build capacity configuration UI
   - Add bulk capacity updates
   - Create capacity reports
   - Implement capacity alerts

DELIVERABLES:
- Database migration
- Updated booking flow components
- Capacity management admin UI
- Capacity checking functions
- Capacity analytics reports

IMPLEMENTATION NOTES:
- Maintain backward compatibility
- Update all booking validation logic
- Add capacity to booking confirmations
- Test edge cases (full capacity, cancellations)
```

### **Prompt 1.4: Dynamic Pricing Engine**
```
You are implementing a dynamic pricing system for Mariia Hub to adjust prices based on demand, time, and other factors.

CONTEXT:
- Current pricing is static per service
- Need flexible pricing rules for groups, seasons, events
- Should maintain base prices with modifiers

TASKS:
1. Database Schema
   ```sql
   CREATE TABLE pricing_rules (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     service_id UUID REFERENCES services(id),
     rule_type TEXT NOT NULL, -- seasonal, demand, group, custom
     conditions JSONB, -- {time_range, min_bookings, etc}
     modifier_type TEXT NOT NULL, -- percentage, fixed
     modifier_value DECIMAL(10,2) NOT NULL,
     is_active BOOLEAN DEFAULT true,
     valid_from DATE,
     valid_until DATE,
     created_at TIMESTAMP DEFAULT now()
   );
   ```

2. Pricing Engine
   - Create calculateDynamicPricing function
   - Implement rule matching logic
   - Add multiple rule combination
   - Create price preview feature

3. Admin Pricing Interface
   - Build pricing rules dashboard
   - Add rule creation wizard
   - Implement rule preview simulation
   - Create pricing analytics

4. Frontend Integration
   - Update pricing displays throughout app
   - Add price breakdown modals
   - Show dynamic pricing explanations
   - Create price comparison views

DELIVERABLES:
- Database migration
- Pricing engine service
- Admin pricing dashboard
- Updated pricing components
- Pricing calculation tests

IMPLEMENTATION NOTES:
- Cache calculated prices
- Log all price calculations
- Create audit trail for pricing changes
- Test rule precedence and conflicts
```

---

## 👤 **PHASE 2: USER EXPERIENCE & PACKAGES**

### **Prompt 2.1: Package Management Database Schema**
```
You are implementing the database schema for service packages in Mariia Hub.

CONTEXT:
- Need to sell packages of multiple sessions at discounted prices
- Track package purchases and session usage
- Support package expiration and renewal

TASKS:
1. Create package tables:
   ```sql
   -- Service packages defined by admins
   CREATE TABLE service_packages (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name TEXT NOT NULL,
     description TEXT,
     service_id UUID REFERENCES services(id),
     session_count INTEGER NOT NULL,
     original_price DECIMAL(10,2),
     package_price DECIMAL(10,2) NOT NULL,
     savings_amount DECIMAL(10,2),
     validity_days INTEGER DEFAULT 365,
     is_active BOOLEAN DEFAULT true,
     features JSONB, -- {include_aftercare, premium_support, etc}
     created_at TIMESTAMP DEFAULT now()
   );

   -- Track purchased packages per client
   CREATE TABLE client_packages (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     client_id UUID REFERENCES profiles(id),
     package_id UUID REFERENCES service_packages(id),
     purchase_date TIMESTAMP DEFAULT now(),
     expiry_date TIMESTAMP,
     sessions_remaining INTEGER DEFAULT 0,
     total_sessions INTEGER NOT NULL,
     payment_id UUID REFERENCES payments(id),
     status TEXT DEFAULT 'active', -- active, expired, depleted
     created_at TIMESTAMP DEFAULT now()
   );

   -- Track individual session usage
   CREATE TABLE package_sessions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     client_package_id UUID REFERENCES client_packages(id),
     booking_id UUID REFERENCES bookings(id),
     used_at TIMESTAMP,
     notes TEXT,
     created_at TIMESTAMP DEFAULT now()
   );
   ```

2. Create database functions:
   - purchase_package() - Create client_package record
   - use_package_session() - Redeem session for booking
   - check_package_balance() - Get remaining sessions
   - calculate_package_expiry() - Set expiry dates

3. Create views for reporting:
   - active_packages_view
   - package_usage_analytics
   - package_revenue_summary

DELIVERABLES:
- Migration file: 20250125000000_service_packages.sql
- Database functions in supabase/functions/
- View definitions
- Index creation statements

IMPLEMENTATION NOTES:
- Add proper foreign key constraints
- Create indexes for performance
- Implement cascade delete rules
- Add check constraints for data integrity
```

### **Prompt 2.2: Package Purchase Flow**
```
You are implementing the package purchase flow for Mariia Hub.

CONTEXT:
- Users need to browse and purchase service packages
- Integration with Stripe for payment
- Package management in user dashboard

TASKS:
1. Package Listing Page
   - Create src/pages/packages/PackageList.tsx
   - Display available packages with pricing
   - Show savings calculations
   - Filter by service category
   - Sort by popularity/savings

2. Package Card Component
   - Create src/components/packages/PackageCard.tsx
   - Show package details and benefits
   - Display session count and validity
   - Add savings highlight
   - Include purchase CTA

3. Package Purchase Modal
   - Create src/components/packages/PackagePurchaseModal.tsx
   - Terms and conditions acceptance
   - Payment integration with Stripe
   - Purchase confirmation
   - Email receipt generation

4. Package Service Layer
   - Create src/services/packageService.ts
   - API functions for packages
   - Purchase processing
   - Package validation
   - Expiry checking

DELIVERABLES:
- PackageList page component
- PackageCard component
- PackagePurchaseModal component
- packageService.ts API layer
- Package routing configuration
- Package purchase tests

IMPLEMENTATION NOTES:
- Follow existing booking patterns
- Use shadcn/ui components
- Implement proper loading states
- Add error handling for payments
- Create purchase analytics tracking
```

### **Prompt 2.3: User Dashboard Implementation**
```
You are creating a comprehensive user dashboard for Mariia Hub clients.

CONTEXT:
- Users need central hub for bookings, packages, profile
- Quick access to common actions
- Personalized experience

TASKS:
1. Main Dashboard Page
   - Create src/pages/user/Dashboard.tsx
   - Welcome message with personalization
   - Upcoming appointments cards
   - Quick rebooking functionality
   - Package balance display
   - Recent activity feed

2. Dashboard Components
   - UpcomingAppointments component
   - QuickRebook component
   - PackageBalance component
   - RecentActivity component
   - PromotionalBanner component

3. Booking Management Page
   - Create src/pages/user/Bookings.tsx
   - Booking history with filters
   - Status indicators (confirmed, completed, cancelled)
   - Cancellation flow with reasons
   - Reschedule functionality
   - Review submission prompt

4. Profile Management Page
   - Create src/pages/user/Profile.tsx
   - Personal information editing
   - Preferences management
   - Notification settings
   - Payment methods
   - Security settings

DELIVERABLES:
- User Dashboard page
- User Bookings page
- User Profile page
- Dashboard components
- User routing setup
- User hooks (useUserDashboard)

IMPLEMENTATION NOTES:
- Use React Router for navigation
- Implement lazy loading
- Add proper TypeScript types
- Create responsive design
- Include accessibility features
```

### **Prompt 2.4: Booksy API Integration**
```
You are implementing bi-directional sync with Booksy for Mariia Hub.

CONTEXT:
- Many providers use Booksy for existing appointments
- Need real-time sync between systems
- Prevent double bookings and conflicts

TASKS:
1. Booksy API Client Service
   - Create src/services/booksyService.ts
   - Implement OAuth authentication
   - Add rate limiting (100 requests/minute)
   - Create API wrapper functions
   - Handle API errors and retries

2. Webhook Handler
   - Create supabase/functions/booksy-webhook/index.ts
   - Process booking updates from Booksy
   - Handle availability changes
   - Validate webhook signatures
   - Update local database

3. Sync Service
   - Create src/services/booksySyncService.ts
   - Local → Booksy sync direction
   - Booksy → Local sync direction
   - Conflict resolution logic
   - Sync status tracking
   - Error recovery mechanisms

4. Admin Sync Dashboard
   - Create src/components/admin/BooksySyncDashboard.tsx
   - Sync status indicators
   - Manual sync triggers
   - Conflict resolution interface
   - Sync logs and history
   - Connection management

DELIVERABLES:
- booksyService.ts API client
- Booksy webhook handler
- booksySyncService.ts sync logic
- BooksySyncDashboard component
- Booksy configuration UI
- Sync monitoring setup

IMPLEMENTATION NOTES:
- Store Booksy credentials securely
- Implement exponential backoff for retries
- Create comprehensive logging
- Test all webhook events
- Handle rate limits gracefully
```

---

## 📊 **PHASE 3: ANALYTICS & POLISH COMPLIANCE**

### **Prompt 3.1: Advanced Analytics Dashboard**
```
You are implementing comprehensive analytics dashboard for Mariia Hub administrators.

CONTEXT:
- Need insights into revenue, bookings, user behavior
- Visual charts and data visualization
- Export capabilities for reports

TASKS:
1. Analytics Components
   - Create src/components/admin/analytics/RevenueChart.tsx
   - Implement src/components/admin/analytics/BookingFunnel.tsx
   - Build src/components/admin/analytics/ServicePopularity.tsx
   - Create src/components/admin/analytics/ClientDemographics.tsx
   - Add src/components/admin/analytics/ProviderPerformance.tsx
   - Build src/components/admin/analytics/TimeAnalysis.tsx

2. Analytics Dashboard Page
   - Create src/pages/admin/analytics/Dashboard.tsx
   - KPI cards with key metrics
   - Interactive date range selector
   - Multiple chart types (line, bar, pie)
   - Real-time data refresh
   - Export to PDF/CSV functionality

3. Data Aggregation
   - Create supabase/functions/analytics-aggregation
   - Pre-calculate complex metrics
   - Optimize query performance
   - Cache aggregation results
   - Schedule daily updates

4. Report Builder
   - Create src/pages/admin/analytics/Reports.tsx
   - Custom date ranges
   - Metric selection
   - Report templates
   - Automated report generation
   - Email delivery of reports

DELIVERABLES:
- All analytics components
- Analytics dashboard page
- Reports page with builder
- Data aggregation functions
- Analytics API endpoints
- Chart configurations

IMPLEMENTATION NOTES:
- Use recharts or chart.js for visualizations
- Implement date filters with persistence
- Add loading states for data
- Create responsive grid layout
- Include drill-down capabilities
```

### **Prompt 3.2: Polish VAT Compliance System**
```
You are implementing Polish VAT compliance for Mariia Hub.

CONTEXT:
- Business operates in Poland requiring proper VAT handling
- Need to support both B2C and B2B with NIP numbers
- Generate compliant invoices and tax reports

TASKS:
1. Tax Configuration System
   - Create tax rates table:
   ```sql
   CREATE TABLE tax_rates (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     country_code TEXT NOT NULL,
     rate_type TEXT NOT NULL, -- standard, reduced, exempt
     rate DECIMAL(5,4) NOT NULL,
     valid_from DATE NOT NULL,
     valid_until DATE,
     is_default BOOLEAN DEFAULT false,
     created_at TIMESTAMP DEFAULT now()
   );
   ```

2. NIP Validation System
   - Create src/lib/vat/nipValidation.ts
   - Implement Polish NIP checksum validation
   - Add VIES EU VAT validation API integration
   - Create NIP verification storage
   - Build validation UI components

3. Invoice Generation
   - Create src/lib/invoice/invoiceGenerator.ts
   - Compliant invoice templates
   - Sequential invoice numbering
   - VAT amount calculations
   - Multi-language invoice support
   - PDF generation with jsPDF

4. Checkout Enhancement
   - Update Step4PaymentCompliant.tsx
   - Add company/B2B checkout flow
   - NIP collection field with validation
   - VAT-0 handling for EU B2B
   - Reverse charge mechanism

DELIVERABLES:
- Tax configuration system
- NIP validation service
- Invoice generation system
- Updated checkout flow
- VAT reporting functions
- Compliance documentation

IMPLEMENTATION NOTES:
- Consult Polish tax regulations
- Store all tax documents for 10 years
- Implement audit logging
- Create tax rate update mechanism
- Add multi-currency VAT support
```

### **Prompt 3.3: Multi-language Enhancement**
```
You are completing the multi-language support for Mariia Hub.

CONTEXT:
- Target Polish market with Ukrainian and Russian speakers
- Need complete translation coverage
- Proper language detection and switching

TASKS:
1. Complete Polish Translations
   - Review all components for missing translations
   - Update src/i18n/locales/pl.json
   - Translate email templates
   - Translate SMS templates
   - Add Polish date/time formats (DD.MM.YYYY)
   - Translate error messages

2. Add Ukrainian Language Support
   - Create src/i18n/locales/ua.json
   - Translate all UI text
   - Add Ukrainian currency formatting (UAH)
   - Implement Cyrillic character support
   - Test RTL/LTR compatibility

3. Add Russian Language Support
   - Create src/i18n/locales/ru.json
   - Complete Russian translations
   - Add Russian number formatting
   - Test character encoding
   - Verify font support

4. Language Detection
   - Implement browser language detection
   - Add IP-based location detection
   - Create language preference storage
   - Add language switcher in navigation
   - Implement language-specific URLs

DELIVERABLES:
- Complete translation files
- Updated components with i18n
- Language detection logic
- Language switcher component
- Multi-language tests
- Translation documentation

IMPLEMENTATION NOTES:
- Use i18next namespaces for organization
- Implement pluralization rules
- Add context-specific translations
- Create translation validation script
- Test all language flows
```

---

## 💳 **PHASE 4: PAYMENTS & LOYALTY**

### **Prompt 4.1: Automated Deposit System**
```
You are implementing an automated deposit calculation system for bookings.

CONTEXT:
- Need to require deposits for high-value services
- Variable deposit rates based on service type and price
- Automated deposit refunds and calculations

TASKS:
1. Deposit Rules Engine
   - Create deposit rules configuration:
   ```sql
   CREATE TABLE deposit_rules (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     service_id UUID REFERENCES services(id),
     service_type TEXT, -- beauty, fitness, lifestyle
     price_min DECIMAL(10,2),
     price_max DECIMAL(10,2),
     deposit_type TEXT NOT NULL, -- fixed, percentage
     deposit_amount DECIMAL(10,2) NOT NULL,
     refund_policy TEXT, -- refundable, non-refundable, partial
     days_before_refund INTEGER DEFAULT 7,
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP DEFAULT now()
   );
   ```

2. Deposit Calculation Service
   - Create src/services/depositService.ts
   - calculateDepositAmount() function
   - Apply deposit rules based on service
   - Handle edge cases and promotions
   - Generate deposit breakdown

3. Payment Flow Updates
   - Modify Step4PaymentCompliant.tsx
   - Show deposit amount clearly
   - Display remaining balance
   - Add deposit payment terms
   - Include deposit refund policy

4. Deposit Refund System
   - Automated refund on cancellation
   - Calculate refund amount based on policy
   - Process refunds through Stripe
   - Send refund notifications
   - Track refund status

DELIVERABLES:
- Deposit rules database
- Deposit calculation service
- Updated payment flow
- Refund processing system
- Deposit analytics
- Deposit policy documentation

IMPLEMENTATION NOTES:
- Clear deposit communication to users
- Implement proper timing for refunds
- Handle partial refunds gracefully
- Create deposit dispute resolution
- Track deposit revenue separately
```

### **Prompt 4.2: Loyalty Points System**
```
You are implementing a comprehensive loyalty program with points system.

CONTEXT:
- Reward repeat customers with points
- Redeem points for discounts and services
- Tier-based membership with benefits

TASKS:
1. Loyalty Database Schema
   ```sql
   CREATE TABLE loyalty_program (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name TEXT NOT NULL,
     description TEXT,
     points_per_currency DECIMAL(4,2) DEFAULT 1.0,
     welcome_bonus INTEGER DEFAULT 0,
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP DEFAULT now()
   );

   CREATE TABLE customer_points (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     customer_id UUID REFERENCES profiles(id),
     points_earned INTEGER DEFAULT 0,
     points_redeemed INTEGER DEFAULT 0,
     points_balance INTEGER DEFAULT 0,
     tier_level TEXT DEFAULT 'bronze', -- bronze, silver, gold, platinum
     tier_updated_at TIMESTAMP,
     created_at TIMESTAMP DEFAULT now(),
     updated_at TIMESTAMP DEFAULT now()
   );

   CREATE TABLE point_transactions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     customer_id UUID REFERENCES profiles(id),
     transaction_type TEXT NOT NULL, -- earn, redeem, expire, adjust
     points INTEGER NOT NULL,
     reference_id UUID, -- booking_id, payment_id, etc
     reference_type TEXT,
     description TEXT,
     created_at TIMESTAMP DEFAULT now()
   );
   ```

2. Points Engine
   - Create src/services/loyaltyService.ts
   - earnPoints() function
   - redeemPoints() function
   - calculatePointsForBooking()
   - processTierProgression()
   - expireOldPoints()

3. Loyalty Dashboard
   - Create src/components/loyalty/LoyaltyDashboard.tsx
   - Points balance display
   - Tier progress bar
   - Transaction history
   - Rewards catalog
   - Tier benefits showcase

4. Rewards Catalog
   - Create rewards management system
   - Points-to-discount conversion
   - Free service rewards
   - Premium benefits
   - Seasonal special rewards

DELIVERABLES:
- Loyalty database schema
- Points engine service
- Loyalty dashboard
- Rewards catalog system
- Tier management logic
- Loyalty analytics

IMPLEMENTATION NOTES:
- Implement points expiration (12 months)
- Create point adjustment for support
- Build fraud detection for points
- Add gamification elements
- Design elegant tier progression
```

### **Prompt 4.3: Gift Cards & Vouchers System**
```
You are implementing a gift cards and vouchers system for Mariia Hub.

CONTEXT:
- Allow customers to purchase gift cards for others
- Create promotional vouchers for marketing
- Track balances and redemption

TASKS:
1. Gift Card Database
   ```sql
   CREATE TABLE gift_cards (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     card_code TEXT UNIQUE NOT NULL,
     initial_balance DECIMAL(10,2) NOT NULL,
     current_balance DECIMAL(10,2) NOT NULL,
     currency TEXT DEFAULT 'PLN',
     purchaser_id UUID REFERENCES profiles(id),
     recipient_email TEXT,
     recipient_name TEXT,
     message TEXT,
     purchase_date TIMESTAMP DEFAULT now(),
     expiry_date TIMESTAMP,
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP DEFAULT now()
   );

   CREATE TABLE gift_card_transactions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     gift_card_id UUID REFERENCES gift_cards(id),
     amount DECIMAL(10,2) NOT NULL,
     transaction_type TEXT NOT NULL, -- purchase, redemption, refund
     reference_id UUID,
     created_at TIMESTAMP DEFAULT now()
   );
   ```

2. Gift Card Purchase Flow
   - Create src/components/giftcards/GiftCardPurchase.tsx
   - Design selection (amount or service)
   - Personalization options
   - Email delivery scheduling
   - PDF gift card generation

3. Gift Card Redemption
   - Integrate with payment flow
   - Add gift card code input
   - Validate and check balance
   - Partial redemption support
   - Combine with other payments

4. Voucher System
   - Create promotional vouchers
   - Discount codes for campaigns
   - Usage limits and restrictions
   - Bulk voucher generation
   - Campaign tracking

DELIVERABLES:
- Gift card database schema
- Purchase flow components
- Redemption system
- Voucher management
- Gift card templates
- Balance tracking system

IMPLEMENTATION NOTES:
- Generate secure gift card codes
- Implement QR codes for physical cards
- Add gift card balance lookup
- Create refund policies
- Build analytics for gift cards
```

---

## 💬 **PHASE 5: COMMUNICATIONS HUB**

### **Prompt 5.1: WhatsApp Business Integration**
```
You are implementing WhatsApp Business API integration for Mariia Hub.

CONTEXT:
- Need two-way WhatsApp messaging
- Appointment confirmations and reminders
- Customer support via WhatsApp

TASKS:
1. WhatsApp Setup
   - Configure WhatsApp Business API
   - Set up webhook endpoints
   - Verify webhook signatures
   - Create message templates
   - Configure phone numbers

2. Message Service
   - Create src/services/whatsappService.ts
   - sendTemplateMessage() function
   - sendCustomMessage() function
   - handleIncomingMessage()
   - message status tracking

3. Notification Templates
   - Booking confirmation template
   - Appointment reminder (24h, 2h)
   - Cancellation notifications
   - Payment confirmations
   - Promotional messages

4. Two-Way Messaging
   - Create src/components/admin/WhatsAppInbox.tsx
   - Message threading view
   - Quick reply templates
   - Auto-responder for common queries
   - Agent assignment system

DELIVERABLES:
- WhatsApp API integration
- Message templates
- Inbox interface
- Notification automation
- Analytics dashboard
- Compliance documentation

IMPLEMENTATION NOTES:
- Follow WhatsApp messaging policies
- Implement rate limiting
- Store message history
- Handle opt-out requests
- Create message templates approval
```

### **Prompt 5.2: Unified Messaging Inbox**
```
You are creating a unified inbox for all customer communications.

CONTEXT:
- Messages come from email, SMS, WhatsApp, website chat
- Need centralized view of customer conversations
- Maintain conversation history across channels

TASKS:
1. Unified Message Database
   ```sql
   CREATE TABLE messages (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     conversation_id UUID NOT NULL,
     customer_id UUID REFERENCES profiles(id),
     channel TEXT NOT NULL, -- email, sms, whatsapp, chat
     direction TEXT NOT NULL, -- inbound, outbound
     content TEXT NOT NULL,
     metadata JSONB,
     status TEXT DEFAULT 'sent', -- sent, delivered, read, failed
     agent_id UUID REFERENCES profiles(id),
     created_at TIMESTAMP DEFAULT now()
   );

   CREATE TABLE conversations (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     customer_id UUID REFERENCES profiles(id),
     last_message_at TIMESTAMP,
     status TEXT DEFAULT 'open', -- open, closed, archived
     assigned_agent_id UUID REFERENCES profiles(id),
     tags TEXT[],
     created_at TIMESTAMP DEFAULT now()
   );
   ```

2. Inbox Interface
   - Create src/components/admin/UnifiedInbox.tsx
   - Conversation list with unread counts
   - Message thread view
   - Channel indicators
   - Customer information sidebar
   - Quick actions (reply, assign, tag)

3. Message Composition
   - Rich text editor
   - Template insertion
   - File attachments
   - Channel-specific formatting
   - Scheduled sending

4. Automation Rules
   - Auto-assignment based on skill
   - Canned responses for FAQs
   - Escalation rules
   - SLA tracking
   - Response time metrics

DELIVERABLES:
- Unified message schema
- Inbox interface components
- Message composition UI
- Automation rules engine
- Analytics dashboard
- Mobile responsive design

IMPLEMENTATION NOTES:
- Real-time message updates
- Search and filter conversations
- Bulk operations
- Internal notes on conversations
- Integration with CRM data
```

### **Prompt 5.3: Marketing Automation Flows**
```
You are implementing marketing automation flows for customer engagement.

CONTEXT:
- Automated email/SMS campaigns
- Behavioral trigger automation
- Personalized customer journeys

TASKS:
1. Automation Workflow Engine
   - Create workflow designer
   - Trigger conditions (events, time, behavior)
   - Action nodes (send email, update data, wait)
   - Branching logic
   - A/B testing capabilities

2. Pre-built Workflows
   - Welcome series for new customers
   - Aftercare reminders post-appointment
   - Review request automation (3 days after)
   - Re-engagement for inactive customers
   - Birthday/anniversary messages
   - Abandoned booking recovery

3. Template Management
   - Email templates with drag-drop editor
   - SMS templates with personalization
   - WhatsApp message templates
   - Dynamic content blocks
   - Multi-language templates

4. Campaign Analytics
   - Open rates and click tracking
   - Conversion metrics
   - Unsubscribe rates
   - A/B test results
   - ROI calculations

DELIVERABLES:
- Workflow engine
- Pre-built automation flows
- Template management system
- Campaign analytics
- Customer segmentation
- Compliance management

IMPLEMENTATION NOTES:
- GDPR compliance for marketing
- Unsubscribe handling
- Preference management
- Send time optimization
- Personalization tokens
```

---

## 📸 **PHASE 6: MEDIA & CONSENT MANAGEMENT**

### **Prompt 6.1: C2PA Watermarking System**
```
You are implementing C2PA (Coalition for Content Provenance and Authenticity) watermarking for photos.

CONTEXT:
- Verify authenticity of before/after photos
- Prevent misuse of client images
- Build trust with verified content

TASKS:
1. C2PA Integration
   - Create supabase/functions/c2pa-watermark/index.ts
   - Integrate C2PA SDK
   - Generate provenance metadata
   - Create content manifests
   - Sign with private key

2. Watermarking Service
   - Create src/services/c2paService.ts
   - addWatermark() function
   - verifyWatermark() function
   - extractMetadata() function
   - batch processing capabilities

3. Media Upload Flow
   - Update image upload components
   - Add C2PA processing on upload
   - Store manifest data
   - Display verification status
   - Show provenance information

4. Verification System
   - Create verification badge UI
   - Public verification page
   - API for external verification
   - Browser-based verification
   - Mobile app verification

DELIVERABLES:
- C2PA watermarking function
- Verification service
- Updated upload flow
- Verification UI components
- Provenance display
- API documentation

IMPLEMENTATION NOTES:
- Follow C2PA standards
- Secure private key storage
- Optimize image processing
- Create verification education
- Handle legacy content
```

### **Prompt 6.2: Before/After Slider Component**
```
You are creating an interactive before/after photo comparison component.

CONTEXT:
- Showcase treatment results effectively
- Mobile-optimized interaction
- Zoom functionality for details

TASKS:
1. Slider Component
   - Create src/components/media/BeforeAfterSlider.tsx
   - Smooth drag interaction
   - Touch gesture support
   - Animated transitions
   - Percentage indicator

2. Zoom Functionality
   - Click to zoom
   - Pinch to zoom on mobile
   - Zoom controls
   - Pan while zoomed
   - Double-click to reset

3. Image Optimization
   - Lazy loading
   - Progressive image loading
   - WebP format support
   - Responsive image sizes
   - Blurhash placeholders

4. Gallery Integration
   - Multiple before/after sets
   - Thumbnail navigation
   - Fullscreen mode
   - Sharing capabilities
   - Download options

DELIVERABLES:
- BeforeAfterSlider component
- Zoom functionality
- Gallery integration
- Mobile optimization
- Accessibility features
- Performance optimization

IMPLEMENTATION NOTES:
- Use pointer events for better interaction
- Implement proper image loading
- Add keyboard navigation
- Create smooth animations
- Test on various devices
```

### **Prompt 6.3: Model Consent Management**
```
You are implementing a comprehensive consent management system for client photos and content.

CONTEXT:
- GDPR compliance for photo usage
- Digital signatures for consent
- Granular usage permissions

TASKS:
1. Consent Database Schema
   ```sql
   CREATE TABLE model_consent (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     client_id UUID REFERENCES profiles(id),
     consent_type TEXT NOT NULL, -- photo, video, testimonial
     scope JSONB, -- {website, social_media, portfolio, ads}
     duration TEXT, -- permanent, time_limited, campaign_specific
     expiry_date DATE,
     compensation_details TEXT,
     restrictions TEXT[],
     signature_data JSONB,
     ip_address TEXT,
     user_agent TEXT,
     consent_date TIMESTAMP DEFAULT now(),
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP DEFAULT now()
   );

   CREATE TABLE consent_usage_log (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     consent_id UUID REFERENCES model_consent(id),
     usage_type TEXT,
     usage_context TEXT,
     used_at TIMESTAMP DEFAULT now()
   );
   ```

2. E-Signature System
   - Create src/components/consent/SignaturePad.tsx
   - Draw signature with mouse/touch
   - Type signature option
   - Upload signature image
   - Save with timestamp
   - Verification checks

3. Consent Forms
   - Dynamic consent form builder
   - Multi-language support
   - Clear explanations
   - Visual examples
   - FAQ section
   - Download PDF copy

4. Consent Management
   - Client consent dashboard
   - Expiry notifications
   - Revocation mechanism
   - Usage tracking
   - Audit trail
   - Admin override capabilities

DELIVERABLES:
- Consent database schema
- E-signature component
- Consent form templates
- Management dashboard
- Usage tracking system
- Compliance documentation

IMPLEMENTATION NOTES:
- Secure signature storage
- Immutable consent records
- Clear consent language
- Easy withdrawal process
- Regular compliance checks
```

---

## 🌍 **PHASE 7: SEO & INTERNATIONALIZATION**

### **Prompt 7.1: Advanced SEO Implementation**
```
You are implementing advanced SEO features for Mariia Hub.

CONTEXT:
- Multi-language SEO for Polish market
- Local SEO for Warsaw beauty services
- Structured data for rich snippets

TASKS:
1. Hreflang and Canonical Tags
   - Create src/lib/seo/hreflangGenerator.ts
   - Generate hreflang tags for all pages
   - Implement canonical URL management
   - Create language-specific sitemaps
   - Handle page variants properly

2. Structured Data (Schema.org)
   - Create src/lib/seo/structuredData.ts
   - LocalBusiness schema for each location
   - Service schema with pricing
   - Review aggregate schema
   - FAQ schema for service pages
   - BreadcrumbList schema

3. Local SEO Optimization
   - Google Business Profile integration
   - Local citation building
   - Location-specific landing pages
   - Warsaw district targeting
   - Local backlink strategy

4. SEO Analytics
   - Search console integration
   - Keyword ranking tracking
   - Organic traffic analysis
   - Competitor analysis
   - Content gap analysis

DELIVERABLES:
- Hreflang generator
- Structured data components
- Local SEO strategy
- SEO analytics dashboard
- Sitemap generator
- Meta tag optimization

IMPLEMENTATION NOTES:
- Follow Google's SEO guidelines
- Use Next.js for better SSR if needed
- Optimize Core Web Vitals
- Create SEO-friendly URLs
- Regular SEO audits
```

### **Prompt 7.2: Translation Memory System**
```
You are implementing a translation memory system to improve translation efficiency.

CONTEXT:
- Reduce translation costs and time
- Maintain consistency across translations
- Support professional translation workflows

TASKS:
1. TM Database Schema
   ```sql
   CREATE TABLE translation_memory (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     source_text TEXT NOT NULL,
     target_text TEXT NOT NULL,
     source_lang TEXT NOT NULL,
     target_lang TEXT NOT NULL,
     context TEXT, -- Component name, page, etc
     domain TEXT, -- UI, email, legal, etc
     quality_score INTEGER DEFAULT 100,
     usage_count INTEGER DEFAULT 0,
     last_used TIMESTAMP,
     is_approved BOOLEAN DEFAULT false,
     translator_id UUID REFERENCES profiles(id),
     created_at TIMESTAMP DEFAULT now(),
     updated_at TIMESTAMP DEFAULT now()
   );

   CREATE INDEX tm_source_idx ON translation_memory(source_text, source_lang, target_lang);
   CREATE INDEX tm_fuzzy_idx ON translation_memory USING gist(source_text, target_lang);
   ```

2. TM Management Interface
   - Create src/components/translations/TMManager.tsx
   - Search and filter TM entries
   - Fuzzy matching suggestions
   - Import/export TMX files
   - Quality assessment
   - Translator assignments

3. Translation Editor
   - Enhanced translation interface
   - TM suggestions panel
   - Concordance search
   - Machine translation integration
   - Translation preview
   - Validation checks

4. Automation Features
   - Auto-suggest translations
   - Detect untranslated content
   - Translation progress tracking
   - Consistency checks
   - Automated QA

DELIVERABLES:
- Translation memory database
- TM management interface
- Enhanced translation editor
- Import/export tools
- Automation features
- Translation analytics

IMPLEMENTATION NOTES:
- Implement Levenshtein distance for fuzzy matching
- Support plural forms and variables
- Create translation glossaries
- Handle context-aware translations
- Regular TM maintenance
```

---

## 🤖 **PHASE 8: AI & AUTOMATION**

### **Prompt 8.1: AI Content Generation**
```
You are implementing AI-powered content generation for Mariia Hub.

CONTEXT:
- Generate blog posts automatically
- Create service descriptions
- Optimize for SEO keywords
- Maintain brand voice consistency

TASKS:
1. OpenAI Integration
   - Create src/services/aiService.ts
   - Configure OpenAI API
   - Implement rate limiting
   - Add content filtering
   - Create prompt templates

2. Blog Post Generator
   - Generate topic ideas
   - Create outlines
   - Write full articles
   - Optimize for SEO
   - Add relevant images
   - Include CTAs

3. Service Description Generator
   - Input service details
   - Generate descriptions
   - Include benefits
   - Add SEO keywords
   - Maintain tone
   - Multiple variations

4. AI Editor Tools
   - Content enhancement
   - Grammar checking
   - Style suggestions
   - SEO optimization
   - A/B testing suggestions

DELIVERABLES:
- AI service integration
- Content generation UI
- Editor tools
- Prompt templates
- Quality filters
- Usage analytics

IMPLEMENTATION NOTES:
- Implement content review before publishing
- Create brand voice guidelines
- Add fact-checking for medical content
- Monitor AI content quality
- Human oversight required
```

### **Prompt 8.2: Smart Scheduling Assistant**
```
You are building an AI-powered smart scheduling assistant.

CONTEXT:
- Optimize appointment scheduling
- Predict best times for clients
- Reduce no-shows with AI insights

TASKS:
1. Scheduling AI Engine
   - Create src/services/schedulingAI.ts
   - Analyze booking patterns
   - Predict optimal times
   - Consider client preferences
   - Optimize provider schedules

2. Recommendation System
   - Suggest best appointment times
   - Recommend package bookings
   - Predict rescheduling needs
   - Optimize for revenue

3. No-Show Prediction
   - Analyze historical data
   - Identify risk factors
   - Send targeted reminders
   - Implement deposits for high-risk

4. Smart Reminders
   - Optimal timing calculations
   - Personalized messages
   - Channel selection
   - Frequency optimization

DELIVERABLES:
- Scheduling AI engine
- Recommendation UI
- Prediction models
- Smart reminder system
- Analytics dashboard
- Performance metrics

IMPLEMENTATION NOTES:
- Train models on historical data
- Consider seasonal patterns
- Privacy compliance for data
- Continuous learning system
- Human override options
```

### **Prompt 8.3: Feature Flags System**
```
You are implementing a comprehensive feature flags system for controlled rollouts.

CONTEXT:
- A/B testing capabilities
- Gradual feature rollouts
- Kill switch for problematic features

TASKS:
1. Feature Flag Infrastructure
   ```sql
   CREATE TABLE feature_flags (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     flag_key TEXT UNIQUE NOT NULL,
     description TEXT,
     is_active BOOLEAN DEFAULT false,
     rollout_percentage INTEGER DEFAULT 0,
     target_segments JSONB,
     created_by UUID REFERENCES profiles(id),
     created_at TIMESTAMP DEFAULT now()
   );

   CREATE TABLE user_flag_assignments (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES profiles(id),
     flag_key TEXT REFERENCES feature_flags(flag_key),
     is_enabled BOOLEAN,
     created_at TIMESTAMP DEFAULT now()
   );
   ```

2. Flag Management UI
   - Create src/components/admin/FeatureFlags.tsx
   - Toggle features on/off
   - Set rollout percentages
   - Target specific segments
   - Monitor performance
   - Rollback capabilities

3. Client-Side Integration
   - Create src/hooks/useFeatureFlags.ts
   - Check flag status
   - Segment evaluation
   - A/B test assignment
   - Performance tracking

4. Experiment Tracking
   - Create src/services/experimentService.ts
   - Track user assignments
   - Measure conversion rates
   - Statistical significance
   - Auto-allocate traffic

DELIVERABLES:
- Feature flag database
- Management interface
- Client integration
- Experiment tracking
- Analytics dashboard
- SDK for easy integration

IMPLEMENTATION NOTES:
- Implement caching for performance
- Create audit trail
- Support complex targeting rules
- Real-time flag updates
- Disaster recovery procedures
```

---

## 📱 **PHASE 9: MOBILE & PWA ENHANCEMENTS**

### **Prompt 9.1: Calendar Integration**
```
You are implementing calendar integration for automatic appointment additions.

CONTEXT:
- Google Calendar, Outlook, Apple Calendar support
- Automatic event creation on booking
- Sync updates and cancellations

TASKS:
1. Calendar API Integration
   - Google Calendar API (OAuth 2.0)
   - Microsoft Graph API (Outlook)
   - Apple Calendar (CalDAV)
   - Create unified calendar service

2. Event Creation Service
   - Create src/services/calendarService.ts
   - Create calendar events on booking
   - Include all appointment details
   - Add reminders and alerts
   - Update on reschedule

3. Consent Management
   - Calendar permission requests
   - Preference storage
   - Granular permissions
   - Easy disconnect

4. Sync Management
   - Two-way sync support
   - Conflict resolution
   - Sync status indicators
   - Error handling

DELIVERABLES:
- Calendar service integration
- Event creation automation
- Permission UI components
- Sync management
- Calendar analytics
- Troubleshooting tools

IMPLEMENTATION NOTES:
- Secure OAuth implementation
- Rate limiting per provider
- Handle provider differences
- Offline sync support
- Privacy compliance
```

### **Prompt 9.2: Offline Mode Enhancement**
```
You are enhancing the PWA with robust offline capabilities.

CONTEXT:
- Allow viewing bookings offline
- Cache critical app data
- Sync when connection restored

TASKS:
1. Offline Data Strategy
   - Identify critical data to cache
   - Implement IndexedDB for storage
   - Create sync queue for actions
   - Version cache management

2. Offline UI Components
   - Offline indicators
   - Cached data warnings
   - Sync progress indicators
   - Read-only mode messaging

3. Background Sync
   - Register sync events
   - Queue offline actions
   - Implement retry logic
   - Conflict resolution

4. Cache Management
   - Service worker updates
   - Cache invalidation
   - Storage optimization
   - User controls for cache

DELIVERABLES:
- Offline service worker
- IndexedDB implementation
- Sync management system
- Offline UI components
- Cache strategies
- Performance monitoring

IMPLEMENTATION NOTES:
- Progressive enhancement approach
- Graceful degradation
- Clear offline limitations
- Data freshness indicators
- User education needed
```

### **Prompt 9.3: Push Notification System**
```
You are implementing a comprehensive push notification system.

CONTEXT:
- Appointment reminders
- Promotional notifications
- Re-engagement campaigns

TASKS:
1. Push Notification Infrastructure
   - Service worker registration
   - VAPID key setup
   - Permission management
   - Subscription storage

2. Notification Types
   - Appointment reminders (24h, 2h)
   - Booking confirmations
   - Promotional offers
   - Abandoned cart recovery
   - New service announcements

3. Notification Composer
   - Create notification templates
   - Personalization tokens
   - Multi-language support
   - Rich media support
   - Scheduling system

4. Analytics & Optimization
   - Open rates tracking
   - Click-through rates
   - Conversion tracking
   - A/B testing
   - Optimal timing analysis

DELIVERABLES:
- Push notification service
- Template management
- Permission UI
- Analytics dashboard
- Campaign management
- Performance monitoring

IMPLEMENTATION NOTES:
- Respect user preferences
- Easy opt-out process
- Don't spam notifications
- Time zone awareness
- Browser compatibility
```

---

## 🔧 **PHASE 10+: ADVANCED FEATURES** (Combined Prompts)

### **Prompt 10.1: SRE & Observability**
```
You are implementing Site Reliability Engineering practices for Mariia Hub.

TASKS:
1. Health Check Endpoints
   - Create /health, /ready, /live endpoints
   - Check dependencies (DB, APIs, services)
   - Implement health scoring
   - Add automated recovery actions

2. Error Budget Tracking
   - Define SLOs (Service Level Objectives)
   - Track error rates and latency
   - Calculate burn rate
   - Create alerting thresholds
   - Generate postmortems

3. Alerting System
   - Configure multi-tier alerts
   - Escalation policies
   - Alert enrichment
   - Suppression rules
   - On-call rotation

4. Audit Logging
   - Log all system events
   - Immutable log storage
   - Log retention policies
   - Audit report generation
   - Compliance monitoring

DELIVERABLES:
- Health check endpoints
- Error budget dashboard
- Alerting configuration
- Audit logging system
- SRE documentation
- Runbook templates

IMPLEMENTATION NOTES:
- Follow SRE best practices
- Create clear runbooks
- Regular incident reviews
- Blameless postmortems
- Continuous improvement
```

### **Prompt 10.2: Multi-City Expansion**
```
You are implementing multi-city support for Mariia Hub expansion.

TASKS:
1. Multi-City Architecture
   - City-specific configurations
   - Regional pricing tables
   - Local provider management
   - City-based routing
   - Multi-language per city

2. Location Features
   - Geolocation detection
   - City selection UI
   - Local content display
   - Regional SEO optimization
   - Local analytics

3. Operations Support
   - City management dashboard
   - Local compliance tracking
   - Regional reporting
   - Multi-city inventory
   - Cross-city promotions

DELIVERABLES:
- Multi-city database schema
- City selection components
- Regional pricing system
- Local SEO implementation
- City analytics dashboard
- Expansion playbooks

IMPLEMENTATION NOTES:
- Start with one new city
- Document city onboarding
- Create city-specific templates
- Handle currency/timezones
- Local partnerships needed
```

### **Prompt 10.3: B2B Corporate Wellness Platform**
```
You are enhancing the B2B features for corporate wellness programs.

TASKS:
1. Corporate Features
   - Employee management system
   - Budget tracking per department
   - Wellness program reporting
   - Bulk booking capabilities
   - Company wellness analytics

2. Billing System
   - Monthly invoicing
   - Usage-based billing
   - Department cost allocation
   - PO and approval workflows
   - Tax compliance (B2B)

3. Employee Portal
   - Company-branded portal
   - Employee self-service
   - Wellness tracking
   - Team challenges
   - Incentive programs

DELIVERABLES:
- Corporate dashboard
- Employee portal
- B2B billing system
- Reporting suite
- Wellness program tools
- Integration APIs

IMPLEMENTATION NOTES:
- SSO integration needed
- Data privacy between companies
- Custom branding options
- Bulk operations optimization
- Account management features
```

---

## 🚀 **EXECUTION GUIDELINES**

### **For AI Agents Working in Parallel:**

1. **Initialization**:
   - Always read `CLAUDE.md` first
   - Check existing implementations
   - Understand the tech stack
   - Review coding standards

2. **Development Process**:
   - Create feature branches
   - Implement with TypeScript
   - Follow established patterns
   - Write tests as you code
   - Document your changes

3. **Quality Assurance**:
   - Run linting and formatting
   - Execute test suites
   - Verify integration points
   - Check mobile responsiveness
   - Validate accessibility

4. **Completion Criteria**:
   - All tasks completed
   - Tests passing
   - Documentation updated
   - Code reviewed and merged
   - Feature deployed to staging

5. **Communication**:
   - Update task status regularly
   - Report blockers immediately
   - Share progress insights
   - Coordinate integration points
   - Document decisions made

### **Success Metrics for Each Phase:**
- All deliverables completed
- Test coverage >80%
- Performance metrics met
- Security standards maintained
- Documentation complete
- Stakeholder approval received

These prompts provide comprehensive guidance for AI agents to develop missing features in parallel, ensuring consistent quality and rapid development of the Mariia Hub platform.