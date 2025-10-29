<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

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