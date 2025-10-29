# Project Context

## Purpose

Mariia Hub is a premium beauty and fitness booking platform designed exclusively for the Warsaw market. We provide seamless booking experiences for clients and powerful management tools for service providers, combining luxury aesthetics with cutting-edge technology.

### Core Mission
- Transform the beauty and fitness booking experience in Warsaw
- Empower service providers with comprehensive business management tools
- Deliver luxury, mobile-first experiences with multi-language support
- Bridge international clients with premium local services

## Tech Stack

### Frontend
- **Framework**: React 18.3.1 with TypeScript 5.9.3
- **Build Tool**: Vite 7.1.11 with SWC compiler
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS 3.4.17 with custom luxury design system
- **State Management**: Zustand 5.0.8 for client state
- **Server State**: TanStack Query 5.90.4 for API state management
- **Routing**: React Router 6.30.1 with lazy loading
- **Forms**: React Hook Form 7.61.1 with Zod validation
- **Animations**: Framer Motion 12.23.24
- **Internationalization**: i18next 25.6.0 with react-i18next
- **Testing**: Vitest 3.2.4 (unit), Playwright 1.56.1 (E2E)
- **Error Tracking**: Sentry 10.21.0

### Backend & Infrastructure
- **Database**: PostgreSQL via Supabase 2.76.1
- **Authentication**: Supabase Auth with JWT and RLS policies
- **File Storage**: Supabase Storage
- **Real-time**: Supabase Realtime subscriptions
- **Edge Functions**: Supabase Edge Functions for serverless compute
- **Payment Processing**: Stripe 8.1.0 with multi-currency support
- **Email Service**: Resend
- **Communication**: Twilio WhatsApp integration
- **Monitoring**: Sentry error tracking
- **Analytics**: Google Analytics 4 with custom event tracking

### Development Tools
- **Package Manager**: npm
- **Code Quality**: ESLint 9.32.0 with TypeScript plugin
- **Formatting**: Prettier with custom config
- **Git Hooks**: Pre-commit hooks for code quality
- **Type Checking**: Strict TypeScript configuration
- **Bundle Analysis**: Rollup plugin visualizer
- **Image Optimization**: Custom optimization scripts
- **Performance Monitoring**: Lighthouse CI with 90+ score requirements
- **Security**: npm audit with custom security audit scripts
- **PostCSS**: Autoprefixer for CSS vendor prefixes

### Additional UI Libraries
- **Drag & Drop**: @hello-pangea/dnd 18.0.1 for drag interactions
- **Icons**: Lucide React for consistent iconography
- **Carousels**: Embla Carousel for image galleries
- **Command Palette**: cmdk for command palette functionality
- **Toast Notifications**: Sonner for toast notifications
- **Modals**: Vaul for drawer/modal components
- **Date Handling**: date-fns 3.6.0 and moment-timezone 0.6.0
- **Forms**: Zod 3.25.76 for schema validation
- **Charts**: Recharts 2.15.4 for data visualization
- **File Upload**: react-dropzone 14.3.8 for file handling
- **WYSIWYG**: Custom rich text editors with DOMPurify 3.3.0 for security
- **SEO**: react-helmet-async 2.0.5 for meta tag management
- **Theme**: next-themes 0.3.0 for dark mode support

### AI Integration
- **OpenAI SDK**: @anthropic-ai/sdk for AI features
- **Google Generative AI**: @google/generative-ai for content generation
- **AI Features**: Content generation, automated responses, analytics insights

### Database & Storage
- **Redis Cache**: ioredis 5.8.1 for performance optimization
- **Real-time**: Socket.io-client 4.8.1 for WebSocket connections
- **File Handling**: Custom media processing and optimization
- **UUID**: uuid 13.0.0 for unique identifier generation

## Project Conventions

### Code Style
- **Language**: TypeScript with strict mode enabled
- **Formatting**:
  - 2-space indentation
  - Single quotes for strings
  - No semicolons
  - Trailing commas (ES5)
  - 100 character line limit
- **Naming Conventions**:
  - Components: PascalCase (e.g., `BookingSheet.tsx`)
  - Files: kebab-case for utilities, PascalCase for components
  - Variables: camelCase
  - Constants: UPPER_SNAKE_CASE
  - Types/Interfaces: PascalCase with `I` prefix for interfaces (optional)
- **Imports**: Absolute imports using `@/` alias for src directory
- **Export**: Named exports preferred, default exports only for components

### Architecture Patterns
- **Component Architecture**: Functional components with hooks only
- **State Management**:
  - Local state with React hooks
  - Global state with Zustand stores
  - Server state with TanStack Query
- **Context Providers**: Auth, Booking, Currency, and Mode contexts
- **Route Organization**: Lazy-loaded pages with route-based code splitting
- **API Layer**: Service layer pattern with typed Supabase client
- **Error Handling**: Error boundaries with Sentry integration
- **Form Handling**: Controlled components with React Hook Form
- **Styling**: Tailwind classes with CSS-in-JS for dynamic styles
- **Component Library**: shadcn/ui with custom theming and luxury design system

### Testing Strategy
- **Unit Testing**: Vitest 3.2.4 with jsdom environment, 90% coverage target
  - Coverage provider: v8
  - Reporters: text, json, html, lcov
  - Test timeout: 10 seconds
  - Retry configuration: 2 retries for flaky tests
- **Component Testing**: React Testing Library 16.1.0 for user behavior testing
  - User Event library for interaction simulation
  - Jest DOM matchers for assertions
- **E2E Testing**: Playwright 1.56.1 for critical user journeys
  - Browsers: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
  - CI URL: https://staging.mariia-hub.com
  - Local URL: http://localhost:8080
  - Viewport: 1280x720 (desktop), mobile devices
  - Timezone: Europe/Warsaw
  - Locale: en-US
  - Features: Screenshots on failure, video recording, trace retention
- **Test Organization**:
  - Co-located test files: `Component.test.tsx` or `Component.spec.tsx`
  - Test utilities in `src/test/utils/`
  - Factories for test data in `src/test/factories/`
  - Global setup/teardown for E2E tests
- **Coverage Requirements**: 90% threshold for branches, functions, lines, statements
- **Performance Testing**: Lighthouse CI with automated audits
  - Performance: 90+ threshold
  - Accessibility: 90+ threshold (error level)
  - Best Practices: 90+ threshold
  - SEO: 90+ threshold
- **CI Integration**:
  - Automated testing on all PRs
  - GitHub Actions for CI/CD
  - Parallel test execution
  - Test result reporting (JSON, HTML)

### Git Workflow
- **Branching Strategy**:
  - `main` - Production-ready code
  - `develop` - Integration branch for features
  - `feature/*` - Feature branches
  - `hotfix/*` - Critical fixes
- **Commit Convention**: Conventional commits with format:
  ```
  type(scope): description

  Types: feat, fix, docs, style, refactor, test, chore
  Example: feat(booking): add payment integration
  ```
- **PR Requirements**:
  - Automated checks pass (lint, test, build)
  - At least one review
  - Clear description of changes
  - Screenshots for UI changes

## Domain Context

### Business Domain
- **Industry**: Beauty and wellness services
- **Market**: Warsaw, Poland (primary), with expansion plans
- **Service Categories**:
  - Beauty: Lip enhancements, brow services, makeup, skincare
  - Fitness: Personal training, glutes programs, group classes
- **Target Audience**:
  - Age 25-45 (primary), 18-60 (secondary)
  - 85% female, 15% male
  - Above average income, premium service seekers

### Key Concepts
- **Services**: Bookable offerings with duration, pricing, and availability
- **Bookings**: Scheduled appointments with status tracking
- **Profiles**: User accounts with preferences and history
- **Availability**: Time slots with resource allocation
- **Packages**: Bundled services with pricing discounts
- **Hold System**: Temporary reservations during booking flow

### Business Rules
- **Booking Flow**: 4-step wizard with session persistence
- **Payment**: Required at booking with secure Stripe integration
- **Cancellation**: 24-hour policy with automatic refunds
- **Availability**: Real-time with 5-minute hold system
- **Pricing**: Multi-currency (PLN/EUR/USD) with dynamic conversion
- **Language**: Support for EN, PL, UA, RU with true localization

## Important Constraints

### Technical Constraints
- **Performance**: Lighthouse score 95+, sub-2 second load times
- **Mobile-First**: Responsive design, touch-optimized interactions
- **Accessibility**: WCAG AA compliance target
- **Security**:
  - GDPR compliance with data protection
  - Row-level security (RLS) on all database tables
  - PCI compliance for payment processing
  - Content Security Policy implementation
- **Browser Support**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
- **Bundle Size**: Optimized with code splitting, <1MB initial load

### Business Constraints
- **Geographic**: Warsaw-focused initially, Poland market
- **Regulatory**:
  - GDPR compliance for EU users
  - Polish VAT compliance (23% standard rate)
  - Consumer protection laws
- **Payment**: Stripe Poland integration, PLN primary currency
- **Language**: Polish and English required, additional languages for expansion
- **Data Privacy**: Right to deletion, data portability, consent management

### Operational Constraints
- **Service Provider Vetting**: Quality standards for providers
- **Availability Synchronization**: Real-time sync with Booksy integration
- **Customer Support**: Response time <24 hours
- **Uptime**: 99.9% availability target
- **Backup**: Daily database backups with point-in-time recovery

## Project Structure & Scripts

### Available Scripts
- **Development**:
  - `npm run dev` - Start development server on port 8080
  - `npm run build` - Production build with optimization
  - `npm run build:dev` - Development build
  - `npm run build:analyze` - Build with bundle analysis
  - `npm run preview` - Preview production build
- **Testing**:
  - `npm run test` - Run unit tests with Vitest
  - `npm run test:watch` - Watch mode for unit tests
  - `npm run test:ui` - Vitest UI interface
  - `npm run test:coverage` - Generate coverage report
  - `npm run test:e2e` - Run E2E tests with Playwright
  - `npm run test:e2e:ui` - Playwright UI mode
  - `npm run test:e2e:debug` - Debug E2E tests
  - `npm run test:e2e:codegen` - Generate Playwright tests
  - `npm run test:e2e:visual` - Visual regression tests
  - `npm run test:e2e:ci` - CI E2E tests with JSON output
  - `npm run test:all` - Run all tests (unit + E2E)
- **Code Quality**:
  - `npm run lint` - Run ESLint
  - `npm run security-audit` - Run npm audit + custom security checks
  - `npm run check-deps` - Check for outdated dependencies
  - `npm run update-deps` - Update dependencies automatically
- **Asset Management**:
  - `npm run create-placeholders` - Generate placeholder images
  - `npm run generate-media` - Generate optimized media assets
  - `npm run optimize-images` - Optimize existing images

### Directory Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui base components
│   ├── admin/          # Admin dashboard components
│   ├── booking/        # Booking flow components
│   ├── feedback/       # Feedback system components
│   ├── localization/   # Localization components
│   ├── payment/        # Payment processing components
│   └── reviews/        # Review management components
├── contexts/           # React context providers
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── pages/              # Page components with lazy loading
├── services/           # API service layer
├── stores/             # Zustand stores
├── types/              # TypeScript type definitions
├── i18n/               # Internationalization setup
└── test/               # Test utilities and setup
```

### shadcn/ui Configuration
- **Style**: Default variant
- **TypeScript**: Enabled
- **Tailwind**: Custom config with CSS variables
- **Base Color**: Slate
- **Aliases**:
  - `@/components` → components
  - `@/lib/utils` → lib/utils
  - `@/components/ui` → components/ui
  - `@/lib` → lib
  - `@/hooks` → hooks

## External Dependencies

### Critical Services
- **Supabase**: Backend-as-a-Service providing database, auth, storage, and edge functions
  - Database: PostgreSQL with RLS policies
  - Authentication: JWT-based with social login support
  - Storage: CDN-enabled file storage
  - Real-time: WebSocket subscriptions
- **Stripe**: Payment processing
  - Acceptance: PLN, EUR, USD
  - Methods: Cards, Apple Pay, Google Pay
  - Features: Subscriptions, packages, refunds
- **Vercel**: Frontend hosting and deployment
  - Edge network for global CDN
  - Automatic deployments from git
  - Preview environments for PRs

### Communication Services
- **Resend**: Transactional email service
  - Booking confirmations
  - Appointment reminders
  - Marketing campaigns
- **Twilio**: WhatsApp Business API
  - Appointment notifications
  - Customer support
  - Marketing messages
- **Google Analytics**: Usage tracking and insights
  - Event tracking for user behavior
  - Conversion tracking
  - Custom dashboards

### Monitoring & Analytics
- **Sentry**: Error tracking and performance monitoring
  - Real-time error alerts
  - Performance insights
  - Release tracking
- **Custom Analytics**:
  - Booking conversion rates
  - Service popularity metrics
  - User behavior patterns

### Development Dependencies
- **Lovable**: Development tooling and component tagging
- **GitHub**: Version control and CI/CD
  - Actions for automated testing
  - Dependabot for dependency updates
  - Security scanning
- **Playwright**: E2E testing cloud service
  - Cross-browser testing
  - Visual regression testing
  - Mobile testing

### Integration Requirements
- **Booksy API**: Sync with existing appointment systems
- **Google Calendar**: Export bookings to user calendars
- **Social Media**:
  - Instagram Business API for content
  - Facebook for reviews and messaging
- **Mapping**:
  - Google Maps API for location services
  - Geocoding for address validation