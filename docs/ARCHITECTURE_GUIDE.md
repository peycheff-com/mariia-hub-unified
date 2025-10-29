# Mariia Hub Unified - Architecture Guide

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Architecture Patterns](#architecture-patterns)
5. [Data Flow](#data-flow)
6. [Performance Optimizations](#performance-optimizations)
7. [Security](#security)
8. [Accessibility](#accessibility)
9. [Development Guidelines](#development-guidelines)
10. [Deployment](#deployment)

## Overview

Mariia Hub Unified is a premium beauty and fitness booking platform built for the Warsaw market. The application follows a microservices-inspired architecture with clear separation of concerns, comprehensive error handling, and enterprise-grade performance optimizations.

### Key Features
- Multi-service booking system (Beauty & Fitness)
- Real-time availability management
- Secure payment processing with Stripe
- Content management system
- Multi-language support (EN/PL/UA)
- Admin dashboard with analytics
- PWA capabilities

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with SWC
- **UI Library**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: React Query + React Context
- **Routing**: React Router v6 with lazy loading
- **Forms**: React Hook Form + Zod validation
- **Internationalization**: react-i18next

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Edge Functions**: Supabase Edge Functions
- **Payment**: Stripe

### Development Tools
- **Testing**: Vitest + Testing Library
- **E2E Testing**: Playwright
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript strict mode
- **Performance**: Lighthouse CI

## Project Structure

```
mariia-hub-unified/
├── public/                     # Static assets
│   ├── sw.js                 # Service worker
│   ├── _headers               # Security headers
│   └── favicon.ico
├── src/
│   ├── assets/               # Static assets
│   ├── components/           # React components
│   │   ├── ui/               # shadcn/ui base components
│   │   ├── admin/            # Admin components
│   │   ├── booking/          # Booking flow components
│   │   └── ...               # Feature components
│   ├── contexts/             # React contexts
│   │   ├── CurrencyContext.tsx
│   │   ├── ModeContext.tsx
│   │   └── ...
│   ├── hooks/                # Custom hooks
│   │   ├── useAuthState.ts
│   │   ├── useServices.ts
│   │   ├── useKeyboardNavigation.ts
│   │   └── ...
│   ├── integrations/         # External integrations
│   │   └── supabase/
│   ├── pages/                # Route pages
│   ├── services/             # Business logic services
│   │   ├── auth.service.ts
│   │   ├── booking.service.ts
│   │   ├── services.service.ts
│   │   └── api/
│   ├── utils/                # Utility functions
│   │   ├── accessibility.ts
│   │   ├── performance.ts
│   │   └── ...
│   ├── styles/               # Global styles
│   └── types/                # TypeScript types
├── tests/                    # Test files
│   ├── e2e/                 # End-to-end tests
│   └── unit/                # Unit tests
└── docs/                     # Documentation
```

## Architecture Patterns

### 1. Service Layer Pattern

Services encapsulate business logic and provide a clean API for components:

```typescript
// Example: services/auth.service.ts
export class AuthService {
  async signIn(credentials: SignInCredentials): Promise<AuthResult> {
    // Authentication logic
  }
}
```

### 2. Repository Pattern

Data access is abstracted through repositories:

```typescript
// Example: hooks/useServices.ts
export const useServices = (filters?: ServiceFilters) => {
  return useQuery({
    queryKey: ['services', filters],
    queryFn: () => servicesService.getServices(filters),
  });
};
```

### 3. Component Composition Pattern

Complex UI is built through composition of smaller, reusable components:

```typescript
// Example: BookingWizard
const BookingWizard = () => {
  return (
    <ErrorBoundary>
      <Step1Choose />
      <Step2Time />
      <Step3Details />
      <Step4Payment />
    </ErrorBoundary>
  );
};
```

### 4. Provider Pattern

Global state is managed through React Context providers:

```typescript
// Example: CurrencyContext
export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('PLN');
  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};
```

## Data Flow

### Request Flow

1. **Component triggers action** →
2. **Custom hook intercepts** →
3. **Service processes** →
4. **API/Database call** →
5. **State updates** →
6. **Component re-renders**

### State Management

- **Server State**: React Query with 5-minute cache
- **Client State**: React Context
- **Form State**: React Hook Form
- **UI State**: Local component state

### Caching Strategy

- **API Responses**: React Query缓存5分钟
- **Static Assets**: Service Worker缓存30天
- **User Preferences**: LocalStorage
- **Authentication**: IndexedDB + Supabase

## Performance Optimizations

### 1. Code Splitting

- **Route-based**: Lazy loading with React.lazy
- **Component-based**: Dynamic imports
- **Vendor chunks**: Separated libraries

### 2. Rendering Optimizations

- **React.memo**: Prevent unnecessary re-renders
- **useMemo**: Cache expensive calculations
- **useCallback**: Stable function references

### 3. Bundle Optimization

```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui', 'lucide-react'],
          'supabase-vendor': ['@supabase'],
        },
      },
    },
  },
});
```

### 4. Service Worker

Advanced caching with TTL and strategies:
- **Network First**: HTML and API
- **Cache First**: Images and fonts
- **Stale While Revalidate**: Dynamic content

## Security

### 1. Authentication & Authorization

- JWT tokens with refresh
- Row Level Security (RLS) policies
- Protected routes with role-based access

### 2. Input Validation

```typescript
// Zod schemas for runtime validation
const CreateBookingSchema = z.object({
  service_id: z.string().uuid(),
  client_info: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(6),
  }),
});
```

### 3. XSS Prevention

- Input sanitization
- Content Security Policy headers
- HTML escaping in templates

### 4. Secure Headers

```http
# public/_headers
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
```

## Accessibility

### 1. WCAG AA Compliance

- Color contrast ratios >= 4.5:1
- Keyboard navigation support
- Screen reader compatibility
- Focus management

### 2. ARIA Implementation

```typescript
// Example: ARIA labels
const generateAriaLabels = {
  button: (action: string, target?: string) => ({
    'aria-label': target ? `${action} ${target}` : action,
    'role': 'button',
  }),
};
```

### 3. Keyboard Navigation

- Tab order management
- Focus traps for modals
- Shortcut keys for power users
- Skip links for main content

## Development Guidelines

### 1. Code Standards

```typescript
// TypeScript strict mode
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
  }
}
```

### 2. Component Guidelines

- Use TypeScript interfaces for props
- Implement proper error boundaries
- Add loading states and error handling
- Include accessibility attributes

### 3. Testing Strategy

- **Unit Tests**: 80% coverage goal
- **Integration Tests**: API and service layer
- **E2E Tests**: Critical user journeys
- **Performance Tests**: Core Web Vitals

### 4. Git Workflow

- Feature branches for development
- Pull requests for code review
- Automated testing on CI/CD
- Semantic versioning

## Deployment

### 1. Build Process

```bash
# Development
npm run dev

# Production
npm run build

# Preview
npm run preview
```

### 2. Environment Configuration

```typescript
// Environment variables
VITE_SUPABASE_URL=...
VITE_STRIPE_PUBLIC_KEY=...
VITE_GTM_ID=...
```

### 3. Production Optimizations

- Minification with Terser
- Gzip compression
- Image optimization (WebP/AVIF)
- Service worker registration
- CDN deployment

### 4. Monitoring

- **Performance**: Core Web Vitals
- **Errors**: Sentry integration
- **Analytics**: Google Analytics 4
- **Uptime**: Uptime monitoring

## Best Practices

### 1. Performance

- Optimize images (WebP, lazy loading)
- Use Intersection Observer for lazy loading
- Implement virtual scrolling for long lists
- Monitor bundle size

### 2. Security

- Never expose secrets in frontend
- Validate all user inputs
- Use HTTPS in production
- Keep dependencies updated

### 3. Accessibility

- Test with screen readers
- Validate with axe-core
- Test keyboard navigation
- Support high contrast mode

### 4. Maintainability

- Write self-documenting code
- Use consistent naming conventions
- Keep components small and focused
- Document complex logic

## Troubleshooting

### Common Issues

1. **Build fails**: Check TypeScript errors and missing dependencies
2. **Performance issues**: Use React DevTools Profiler
3. **Memory leaks**: Check for unclosed intervals/event listeners
4. **Styling problems**: Check Tailwind class names and design tokens

### Debugging Tools

- React Developer Tools
- Chrome DevTools Performance tab
- Vue/React DevTools
- Browser console errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request
6. Request code review

## Resources

- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Supabase Docs](https://supabase.com/docs)
- [Playwright](https://playwright.dev)

---

Last updated: 2025-01-21