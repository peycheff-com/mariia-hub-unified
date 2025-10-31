# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a unified booking and management platform for beauty and fitness services targeting the premium Warsaw market. The application supports multiple service categories, booking workflows, content management, and administrative features with a luxury positioning.

### Core Technologies
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with Cocoa/Champagne luxury color palette
- **State Management**: React Context + TanStack Query for server state
- **Routing**: React Router v6 with lazy loading
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Testing**: Vitest + Testing Library
- **Internationalization**: i18next (English/Polish)

## Development Commands

### Core Development
```bash
npm run dev          # Start development server (port 8080)
npm run build        # Production build
npm run build:dev    # Development build
npm run preview      # Preview production build
npm run lint         # ESLint
npm run test         # Run tests with Vitest
```

### Key Development Notes
- Uses Vite with SWC for fast builds and HMR
- Service worker registration in production for offline support
- Lazy loading implemented for all pages for performance
- Path alias `@/` points to `src/` directory
- TypeScript configured with relaxed rules for flexibility

## Architecture Overview

### Application Structure

#### **Core Contexts** (`src/contexts/`)
- **BookingContext**: Manages service selection and booking flow state across the application
- **CurrencyContext**: Handles currency switching (PLN/EUR/USD) and conversion
- **ModeContext**: Manages beauty/fitness mode preferences and user behavior tracking

#### **Page Structure** (`src/pages/`)
- **Main pages**: Index, Beauty, Fitness, About, Contact, Blog
- **Service detail pages**: BeautyServiceDetail, FitnessProgramDetail
- **Booking flow**: BookingWizard (4-step process)
- **Admin**: Dashboard and Admin pages for content management
- **Landing pages**: Specialized marketing pages for specific services
- **Legal**: Legal pages and policies

#### **Component Organization** (`src/components/`)
- **UI components**: shadcn/ui based components in `ui/` subdirectory
- **Booking components**: Multi-step booking flow components in `booking/`
- **Admin components**: Full CMS in `admin/` with analytics, content management, and settings
- **Feature components**: Service cards, testimonials, navigation, hero sections

#### **Data Layer** (`src/integrations/`)
- **Supabase client**: Typed database client with comprehensive schema
- **Database schema**: Extensive schema covering bookings, services, users, content, and analytics

### Key Architectural Patterns

#### **Service Types**
The application supports three main service types defined in the database schema:
- `beauty`: Beauty services (lip enhancements, brows, etc.)
- `fitness`: Fitness programs (glutes, starter programs, etc.)
- `lifestyle`: Additional lifestyle services

#### **Booking Flow**
4-step booking wizard with session persistence:
1. **Step1Choose**: Service selection with filtering
2. **Step2Time**: Time slot selection with availability checking and Booksy fallback
3. **Step3Details**: Client information and preferences
4. **Step4Payment**: Payment processing with Stripe integration

#### **Content Management**
Full CMS with:
- Service management with galleries, FAQs, and detailed content
- Blog system with categories, comments, and SEO
- Image management with optimization
- Analytics and performance tracking
- Newsletter management
- Social media integration

#### **Internationalization**
- Multi-language support (English/Polish) with i18next
- Language detection and switching
- Localized content for services and UI elements

### Database Schema Highlights

#### **Core Tables**
- **services**: Main service catalog with pricing, duration, metadata, and translations
- **bookings**: Booking records with status tracking, payment integration, and external sync
- **profiles**: User profiles with preferences, consents, and behavior tracking
- **availability_slots**: Time-based availability management with resource allocation
- **service_content**: Detailed service information (preparation, aftercare, expectations)

#### **Supporting Tables**
- **booking_drafts**: Session-based booking progress persistence
- **holds**: Temporary slot reservations during booking (5-minute expiry)
- **service_gallery**: Image management for services with captions and ordering
- **blog_posts**: Content management with SEO optimization
- **analytics**: Service usage, booking patterns, and user behavior tracking

### Key Features

#### **Smart Booking System**
- Real-time availability checking with database functions
- Hold system to prevent double bookings during session
- Session-based booking draft persistence across browser refreshes
- Booksy integration for existing appointment management
- Package booking support with session tracking
- Advanced scheduling with buffer times and resource management

#### **Admin Dashboard**
- Comprehensive analytics with custom charts
- Content management for all services with rich text editing
- Availability management with calendar views (day/week/month)
- Blog and newsletter management with subscriber tracking
- User management with role-based access control
- Integration settings for external services
- Review management and social media integration

#### **Performance Optimizations**
- Lazy loading for all routes with React.lazy
- Image optimization and CDN delivery preparation
- Service worker for offline support and caching
- Efficient state management with React Query (5min cache)
- Component-level code splitting
- Bundle optimization in Vite configuration

## UI/UX Design System

### Design Principles
- **Luxury positioning**: Premium aesthetic suitable for Warsaw beauty market
- **Liquid Glass morphism**: Translucent effects with subtle animations
- **Mobile-first approach**: Touch-optimized interactions
- **Accessibility first**: WCAG AA compliance target

### Color Palette
- **Primary**: Cocoa/Champagne tones (#8B4513, #F5DEB3)
- **Secondary**: Bronze and gold accents
- **Neutral**: Cream and soft whites
- **Text**: Deep charcoal for readability

### Typography
- **Headings**: Inter/Space Grotesk for modern luxury feel
- **Body**: Inter for readability
- **Accent**: Display fonts for hero sections

### Component Standards
- **Shadcn/ui**: Base component library with custom theming
- **Animations**: Subtle micro-interactions (0.2s ease)
- **Spacing**: 8px grid system
- **Border radius**: Consistent 12px for luxury feel

## Testing Strategy

### Unit Testing
- Vitest with jsdom environment
- Focus on booking flow utilities and hooks
- Test setup in `src/test/setup.ts`
- Component testing with Testing Library

### Key Test Areas
- Booking wizard flow and validation
- Time slot availability calculations
- Service data transformations
- Form validation and error handling

## Development Guidelines

### Code Standards
- Use TypeScript for type safety (configured with relaxed rules)
- Follow React 18 patterns with hooks and functional components
- Implement proper error boundaries and loading states
- Use established context provider patterns
- Maintain consistency with shadcn/ui component patterns

### Performance Requirements
- Lighthouse score 95+ target
- 60fps animations requirement
- Mobile page load under 2 seconds
- Efficient bundle splitting

### Accessibility Standards
- WCAG AA compliance target
- Screen reader optimization
- Keyboard navigation support
- High contrast color ratios
- Focus management in forms

## Integration Points

### External Services
- **Supabase**: Authentication, database, and file storage
- **Stripe**: Payment processing (via Stripe Price IDs)
- **Booksy**: External booking system synchronization
- **Google Analytics**: User behavior tracking
- **Newsletter service**: Email marketing integration

### API Patterns
- React Query for server state management
- Optimistic updates for better UX
- Error boundary handling
- Retry logic with exponential backoff

## Service CLI Commands and Environment Variables

This section documents the CLI commands for all external services used in the project with their required environment variables for local and production environments.

### Supabase CLI

#### Installation
```bash
# Using Homebrew (recommended)
brew install supabase/tap/supabase

# Or using npm
npm install -g supabase
```

#### Local Development Commands
```bash
# Start local Supabase instance
supabase start

# Get local connection details
supabase status -o env

# Stop local instance
supabase stop

# Reset local database
supabase db reset

# Apply migrations to local database
supabase db push

# Generate types from database schema
supabase gen types typescript --local > src/integrations/supabase/types.ts

# Link to a remote project
supabase link --project-ref $VITE_SUPABASE_PROJECT_ID
```

#### Production/Staging Commands
```bash
# Apply migrations to remote database
npx supabase db push --db-url $SUPABASE_DB_URL

# Generate types from remote database
supabase gen types typescript --project-id $VITE_SUPABASE_PROJECT_ID > src/integrations/supabase/types.ts

# Get project status
supabase status --project-ref $VITE_SUPABASE_PROJECT_ID

# Manage functions
supabase functions deploy <function-name> --project-ref $VITE_SUPABASE_PROJECT_ID

# View migration history
supabase migration list --project-ref $VITE_SUPABASE_PROJECT_ID

# Create new migration
supabase migration new <migration-name>
```

#### Environment Variables
```bash
# Local Development
VITE_SUPABASE_URL="http://localhost:54321"
VITE_SUPABASE_ANON_KEY="your-local-anon-key"
VITE_SUPABASE_SERVICE_ROLE_KEY="your-local-service-role-key"
VITE_SUPABASE_PROJECT_ID="local"

# Production/Staging
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-production-anon-key"
VITE_SUPABASE_SERVICE_ROLE_KEY="your-production-service-role-key"
VITE_SUPABASE_PROJECT_ID="your-project-id"
SUPABASE_DB_URL="postgresql://postgres:[password]@db.your-project-id.supabase.co:5432/postgres"
```

### Stripe CLI

#### Installation
```bash
# Using Homebrew
brew install stripe/stripe-cli/stripe

# Or using npm
npm install -g stripe-cli
```

#### Local Development Commands
```bash
# Login to Stripe
stripe login

# Start webhook listener for development
stripe listen \
  --events payment_intent.succeeded,payment_intent.payment_failed,invoice.payment_succeeded,invoice.created,invoice.finalized \
  --forward-to http://localhost:8080/api/stripe/webhook \
  --skip-verify

# Using the provided script (recommended)
./scripts/start-stripe-webhooks.sh

# For production webhooks
./scripts/start-stripe-webhooks.sh production

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger invoice.payment_succeeded

# List webhook endpoints
stripe webhook_endpoints list

# Create webhook endpoint
stripe webhook_endpoints create \
  --url "https://your-domain.com/api/stripe/webhook" \
  --enabled-events "payment_intent.succeeded,payment_intent.payment_failed,invoice.payment_succeeded"

# Verify CLI configuration
stripe config --list
```

#### Environment Variables
```bash
# Local Development (Test Mode)
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_WEBHOOK_ENDPOINT="http://localhost:8080/api/stripe/webhook"

# Production (Live Mode)
VITE_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_WEBHOOK_ENDPOINT="https://your-domain.com/api/stripe/webhook"

# Polish VAT Configuration
VITE_COMPANY_NIP="1234567890"
VITE_COMPANY_NAME="Mariia Hub Sp. z o.o."
VITE_COMPANY_ADDRESS="ul. Jana Pawła II 43/15, 00-001 Warszawa, Polska"
VITE_COMPANY_BANK_ACCOUNT="PL123456789012345678901234567890"
VITE_TAX_OFFICE_CODE="1411"
VITE_ENABLE_POLISH_VAT="true"
VITE_ENABLE_SPLIT_PAYMENT="true"
VITE_ENABLE_ELECTRONIC_INVOICES="true"
```

### Vercel CLI

#### Installation
```bash
# Using npm
npm install -g vercel

# Or using yarn
yarn global add vercel
```

#### Development Commands
```bash
# Login to Vercel
vercel login

# Link project to Vercel
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Pull environment variables from Vercel
vercel env pull .env.local

# List environment variables
vercel env ls

# Add environment variable
vercel env add VARIABLE_NAME

# Remove environment variable
vercel env rm VARIABLE_NAME

# View deployment logs
vercel logs

# View project info
vercel info

# Inspect build
vercel inspect
```

#### Production Deployment Scripts
```bash
# Using project scripts (recommended)
npm run deploy:staging    # Deploy to staging environment
./scripts/deploy.sh      # General deployment script
./scripts/deploy-production.sh  # Production deployment with security checks

# Manual deployment
vercel --scope $VERCEL_ORG --confirm
```

#### Environment Variables
```bash
# Vercel-specific variables (auto-populated)
VERCEL="1"
VERCEL_ENV="production" | "preview" | "development"
VERCEL_URL="your-app-domain.vercel.app"
VERCEL_GIT_COMMIT_SHA="commit-sha"
VERCEL_GIT_COMMIT_MESSAGE="commit message"
VERCEL_GIT_REPO_OWNER="owner"
VERCEL_GIT_REPO_SLUG="repo"

# Project configuration
VERCEL_ORG="your-vercel-org"
VERCEL_PROJECT_ID="your-project-id"
VERCEL_PROJECT_NAME="mariia-hub-unified"

# Build configuration
NODE_ENV="production"
BUILD_COMMAND="npm run build"
OUTPUT_DIRECTORY="dist"
```

### Docker Commands

#### Development
```bash
# Start development environment
docker-compose up -d

# Start with specific services
docker-compose up -d app db redis

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Rebuild and start
docker-compose up --build

# Execute commands in container
docker-compose exec app npm run dev
docker-compose exec db psql -U postgres -d mariia_hub
```

#### Production
```bash
# Build production image
docker build -t mariia-hub:latest .

# Run production container
docker run -d \
  --name mariia-hub \
  -p 3000:3000 \
  --env-file .env.production \
  mariia-hub:latest

# Using production compose
docker-compose -f docker-compose.prod.yml up -d

# Cleanup unused images
docker image prune -f
```

### Testing CLI Commands

#### Vitest (Unit/Integration Tests)
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage

# Run tests for specific file
npx vitest run src/services/__tests__/booking.service.test.ts

# Run tests matching pattern
npx vitest run --grep "booking"

# Run tests with specific reporter
npx vitest run --reporter=verbose
```

#### Playwright (E2E Tests)
```bash
# Install browsers
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# Generate test code
npm run test:e2e:codegen

# Run specific test file
npx playwright test tests/e2e/booking-flow.spec.ts

# Run tests with specific project (chromium/firefox/webkit)
npx playwright test --project=chromium

# Run tests headed
npx playwright test --headed
```

### Git Workflow Commands

#### Branch Management
```bash
# Create new feature branch
git checkout -b feature/your-feature-name

# Switch to main branch
git checkout main

# Merge feature branch
git merge feature/your-feature-name

# Delete branch
git branch -d feature/your-feature-name
```

#### Synchronization
```bash
# Fetch latest changes
git fetch origin

# Pull latest changes
git pull origin main

# Push changes to remote
git push origin feature/your-feature-name

# Push and set upstream
git push -u origin feature/your-feature-name
```

#### Commit Management
```bash
# Stage changes
git add .

# Commit with message
git commit -m "feat: add new booking feature"

# Amend last commit
git commit --amend

# View commit history
git log --oneline --graph

# View detailed commit
git show <commit-hash>
```

### Security & Monitoring Commands

#### Security Scanning
```bash
# Run security audit
npm run security-audit

# Run comprehensive security verification
./scripts/comprehensive-security-verification.sh

# Run security scan
npm audit

# Fix security vulnerabilities
npm audit fix
```

#### Performance Monitoring
```bash
# Analyze bundle size
npm run build:analyze

# Run performance tests
./scripts/run-comprehensive-tests.sh

# Check dependencies
npm run check-deps

# Update dependencies
npm run update-deps
```

### Environment Setup Scripts

#### Quick Setup
```bash
# Setup staging environment
npm run setup:staging

# Setup domain for staging
npm run setup:domain

# Health check for staging
npm run health:staging

# Seed staging data
npm run db:seed:staging

# Seed preview data
npm run db:seed:preview
```

#### Database Management
```bash
# Reset staging database
npm run db:reset:staging

# Update types from database
npx tsx scripts/update-types-from-db.ts

# Create database backup
npx supabase db dump --project-ref $VITE_SUPABASE_PROJECT_ID > backup.sql

# Restore database backup
npx supabase db restore --project-ref $VITE_SUPABASE_PROJECT_ID backup.sql
```

## Production Deployment

### Build Process
- Vite production build with optimization
- Service worker generation for PWA features
- Asset optimization and minification
- Source map generation for debugging

### Environment Configuration
- Development: Local Supabase instance
- Staging: Supabase preview branch
- Production: Supabase production with proper RLS policies

### Security Considerations
- Supabase Row Level Security (RLS) policies
- Input validation and sanitization
- CSRF protection
- Content Security Policy implementation
- GDPR compliance with consent management

## Known Issues & Technical Debt

### Current Limitations
- TypeScript configuration uses strict mode with comprehensive type checking
- Some components need accessibility improvements
- Admin interface needs mobile optimization
- Error handling could be more comprehensive

### Planned Improvements
- Enhanced error boundary implementation
- Enhanced mobile admin experience
- Advanced analytics implementation
- Performance monitoring integration
- Additional TypeScript strictness optimizations

This codebase is designed for scalability and maintainability, targeting the premium beauty and fitness market in Warsaw with a focus on exceptional user experience and conversion optimization.