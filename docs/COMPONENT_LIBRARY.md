# Component Library Documentation

This document outlines the component library patterns, guidelines, and best practices for the Mariia Hub booking platform built with shadcn/ui + Radix UI.

## 🎨 Design System Overview

### Core Philosophy
- **Luxury Aesthetic**: Premium feel suitable for Warsaw beauty/fitness market
- **Accessibility First**: WCAG AA compliance by default
- **Developer Experience**: Predictable, composable components
- **Consistent Patterns**: Unified styling and behavior
- **Performance Optimized**: Fast, lightweight, and bundle-friendly

### Design Tokens

#### Color Palette (Cocoa/Champagne Theme)
```css
/* Primary Colors */
--primary-50: #f5deb3;    /* Light champagne */
--primary-100: #e6d7a8;
--primary-500: #8b4513;    /* Cocoa brown */
--primary-900: #5a2d0c;

/* Secondary Colors */
--secondary: #d4af37;      /* Gold accent */
--accent: #cd853f;         /* Peru/saddle brown */

/* Neutral Colors */
--background: #faf7f2;      /* Cream white */
--foreground: #2c1810;      /* Deep charcoal */
--muted: #a8a29e;         /* Muted brown-gray */

/* Semantic Colors */
--success: #22c55e;        /* Success green */
--warning: #f59e0b;        /* Warning amber */
--error: #ef4444;           /* Error red */
--info: #3b82f6;           /* Info blue */
```

#### Typography Scale
```css
/* Font Families */
--font-primary: 'Inter', system-ui, sans-serif;
--font-display: 'Space Grotesk', 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Size Scale */
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;     /* 36px */
```

#### Spacing System
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;       /* 16px */
--space-5: 1.25rem;    /* 20px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;       /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
```

## 🧩 Component Architecture

### Base Structure
All components follow this standardized structure:

```typescript
// src/components/ui/component-name.tsx
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Variant definitions using class-variance-authority
const variants = cva(
  'base-classes',
  {
    variants: {
      variant: {
        default: 'default-variant-classes',
        destructive: 'destructive-variant-classes',
        outline: 'outline-variant-classes',
      },
      size: {
        default: 'default-size-classes',
        sm: 'sm-size-classes',
        lg: 'lg-size-classes',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

// Component interface
export interface ComponentNameProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof variants> {
  // Component-specific props
  children?: React.ReactNode;
  loading?: boolean;
  icon?: React.ReactNode;
}

// Component implementation
const ComponentName = forwardRef<HTMLButtonElement, ComponentNameProps>(
  ({ className, variant, size, loading, icon, children, ...props }, ref) => {
    return (
      <button
        className={cn(variants({ variant, size }), className)}
        ref={ref}
        disabled={loading}
        {...props}
      >
        {loading && <LoadingSpinner className="mr-2" />}
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </button>
    );
  }
);

ComponentName.displayName = 'ComponentName';

export { ComponentName, type ComponentNameProps };
```

### Component Patterns

#### 1. Controlled vs Uncontrolled
```typescript
// Controlled component (recommended)
const [isOpen, setIsOpen] = useState(false);
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    Content
  </DialogContent>
</Dialog>

// Uncontrolled component (use when you don't need external control)
<Dialog>
  <DialogTrigger>Open Dialog</DialogTrigger>
  <DialogContent>
    Content
  </DialogContent>
</Dialog>
```

#### 2. Compound Components
```typescript
// Navigation Menu Example
<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Services</NavigationMenuTrigger>
      <NavigationMenuContent>
        <NavigationMenuLink href="/beauty">Beauty</NavigationMenuLink>
        <NavigationMenuLink href="/fitness">Fitness</NavigationMenuLink>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>
```

#### 3. AsChild Pattern
```typescript
// Using asChild to customize component behavior
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Edit</DropdownMenuItem>
    <DropdownMenuItem>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## 📚 Component Categories

### 1. Booking Components

#### BookingWizard
**Purpose**: Multi-step booking flow orchestration
**Location**: `src/components/booking/`
**Props**:
```typescript
interface BookingWizardProps {
  initialStep?: number;
  onComplete?: (booking: BookingData) => void;
  allowGuestBooking?: boolean;
}
```

#### Step Components
- `Step1Choose`: Service selection
- `Step2Time`: Time slot selection
- `Step3Details`: Client information
- `Step4Payment`: Payment processing

### 2. Form Components

#### FormField
**Purpose**: Standardized form input with label and validation
```typescript
interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  description?: string;
  children: React.ReactElement;
}

<FormField label="Email" error={errors.email} required>
  <Input type="email" {...field} />
</FormField>
```

#### Validation Patterns
```typescript
// Using react-hook-form with zod validation
const form = useForm<BookingFormData>({
  resolver: zodResolver(bookingSchema),
  defaultValues: {
    name: '',
    email: '',
    phone: '',
    notes: '',
  },
});
```

### 3. UI Components

#### Button
**Variants**: default, destructive, outline, ghost, secondary, link
**Sizes**: default, sm, lg, icon
**States**: default, loading, disabled

```typescript
<Button variant="outline" size="sm" loading={isLoading}>
  Submit
</Button>
```

#### Card
**Purpose**: Content container with header and optional actions
```typescript
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

#### Modal/Dialog
**Purpose**: Overlay dialogs for important interactions
```typescript
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Booking</DialogTitle>
      <DialogDescription>
        Are you sure you want to book this appointment?
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleConfirm}>
        Confirm
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 4. Display Components

#### ServiceCard
**Purpose**: Display service information in booking flow
```typescript
interface ServiceCardProps {
  service: Service;
  onSelect?: (service: Service) => void;
  selected?: boolean;
  variant?: 'default' | 'compact';
}

<ServiceCard
  service={service}
  selected={selectedService?.id === service.id}
  onSelect={handleServiceSelect}
/>
```

#### TimeSlot
**Purpose**: Display available time slots
```typescript
interface TimeSlotProps {
  slot: TimeSlot;
  selected?: boolean;
  onSelect?: (slot: TimeSlot) => void;
  disabled?: boolean;
}
```

### 5. Layout Components

#### Container
**Purpose**: Responsive layout container
```typescript
<Container className="py-8">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {children}
  </div>
</Container>
```

#### Section
**Purpose**: Page section with consistent spacing
```typescript
<Section className="bg-muted/50">
  <div className="container mx-auto py-12">
    <h2 className="text-3xl font-bold mb-8">Section Title</h2>
    {children}
  </div>
</Section>
```

## 🎯 Usage Guidelines

### 1. Component Composition

#### Compose, Don't Inherit
```typescript
// ✅ Good: Composition
<Card>
  <CardHeader>
    <CardTitle>Service Details</CardTitle>
  </CardHeader>
  <CardContent>
    <ServiceDetails service={service} />
  </CardContent>
</Card>

// ❌ Bad: Complex inheritance
class SpecializedCard extends Card {
  // Complex custom logic
}
```

#### Use asChild for Customization
```typescript
// ✅ Good: Use asChild for custom styling
<DropdownMenuTrigger asChild>
  <Button variant="ghost" size="sm" className="p-2">
    <MoreVertical className="h-4 w-4" />
  </Button>
</DropdownMenuTrigger>

// ❌ Bad: Complex styling overrides
<DropdownMenuTrigger className="custom-styles" />
```

### 2. Styling Guidelines

#### Use Tailwind Classes
```typescript
// ✅ Good: Tailwind classes
<Button className="flex items-center gap-2" />

// ❌ Bad: Inline styles
<Button style={{ display: 'flex', alignItems: 'center' }} />
```

#### Custom CSS for Complex Cases
```typescript
// ✅ Good: CSS modules for complex animations
import styles from './AnimatedCard.module.css';

<div className={styles.animatedCard}>

// ❌ Bad: Complex inline Tailwind
<div className="relative before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-full hover:before:translate-x-0 before:transition-transform before:duration-500">
```

### 3. Accessibility Guidelines

#### Semantic HTML
```typescript
// ✅ Good: Semantic elements
<nav>
  <ul className="flex space-x-4">
    <li><Link href="/">Home</Link></li>
    <li><Link href="/about">About</Link></li>
  </ul>
</nav>

// ❌ Bad: Generic elements
<div className="navigation">
  <div className="nav-item"><Link href="/">Home</Link></div>
  <div className="nav-item"><Link href="/about">About</Link></div>
</div>
```

#### ARIA Attributes
```typescript
// ✅ Good: Proper ARIA
<Button
  aria-label="Close dialog"
  aria-expanded={isOpen}
  aria-controls="dialog-content"
>
  <X className="h-4 w-4" />
</Button>

// ❌ Bad: Missing ARIA
<Button onClick={closeDialog}>
  <X className="h-4 w-4" />
</Button>
```

#### Focus Management
```typescript
// ✅ Good: Focus management
const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ children, ...props }, ref) => {
    useEffect(() => {
      const focusableElements = dialogRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements?.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }, []);

    return (
      <div ref={ref} role="dialog" aria-modal="true" {...props}>
        {children}
      </div>
    );
  }
);
```

## 🧪 Testing Components

### Testing Strategy

#### 1. Unit Testing
```typescript
// src/components/ui/button.test.tsx
import { render, screen, userEvent } from '@/test/utils';
import { Button } from './button';

describe('Button', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>);

    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button loading>Click me</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

#### 2. Integration Testing
```typescript
// src/components/booking/__tests__/Step1Choose.test.tsx
import { renderWithProviders } from '@/test/utils';
import { Step1Choose } from '../Step1Choose';

describe('Step1Choose Integration', () => {
  it('integrates with booking context', async () => {
    renderWithProviders(<Step1Choose />);

    // Test integration with booking state
    await userEvent.click(screen.getByText('Lash Enhancement'));
    expect(mockBookingContext.setService).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Lash Enhancement' })
    );
  });
});
```

#### 3. Accessibility Testing
```typescript
import { testAccessibility } from '@/test/utils/comprehensive-test-utils';

describe('Button Accessibility', () => {
  it('should be accessible', async () => {
    const { container } = render(<Button>Click me</Button>);
    await testAccessibility(container);
  });

  it('should be keyboard navigable', async () => {
    const { container } = render(<Button>Click me</Button>);
    await testKeyboardNavigation(container);
  });
});
```

## 🔧 Development Guidelines

### 1. File Organization
```
src/components/
├── ui/                    # Base UI components (buttons, forms, etc.)
│   ├── button.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   └── index.ts            # Export all UI components
├── booking/               # Booking-specific components
│   ├── Step1Choose.tsx
│   ├── Step2Time.tsx
│   └── __tests__/         # Component tests
├── admin/                # Admin-specific components
├── layout/               # Layout components
└── index.ts              # Export all components
```

### 2. Naming Conventions
```typescript
// Component file: PascalCase
Button.tsx
ServiceCard.tsx
BookingWizard.tsx

// Component export: PascalCase
export const Button = ...
export const ServiceCard = ...

// Component interface: PascalNameProps
export interface ButtonProps
export interface ServiceCardProps

// Test file: ComponentName.test.tsx
Button.test.tsx
ServiceCard.test.tsx
```

### 3. Props Interface Guidelines
```typescript
// ✅ Good: Clear, descriptive prop names
interface ServiceCardProps {
  service: Service;              // Always clear type
  onSelect?: (service: Service) => void;  // Optional with clear signature
  selected?: boolean;           // Boolean flag with clear purpose
  variant?: 'default' | 'compact';  // Union type with clear options
}

// ❌ Bad: Unclear prop names
interface ServiceCardProps {
  svc: any;                    // Unclear type, not descriptive
  cb?: Function;                // Abbreviation, unclear signature
  sel?: boolean;                // Abbreviation, unclear purpose
  var?: string;                 // Abbreviation, unclear options
}
```

### 4. Default Props and Variants
```typescript
// ✅ Good: Default variants with cva
const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
```

## 🎨 Theming and Customization

### 1. Theme Structure
```typescript
// src/lib/theme.ts
import type { Theme } from 'next-themes';

export const themeConfig = {
  light: {
    background: 'hsl(20 5% 96%)',     // Light cream
    foreground: 'hsl(24 9% 17%)',     // Dark brown
    primary: {
      DEFAULT: 'hsl(25 47% 25%)',     // Cocoa
      foreground: 'hsl(60 9% 97%)',
    },
  },
  dark: {
    background: 'hsl(24 9% 17%)',     // Dark brown
    foreground: 'hsl(20 5% 96%)',     // Light cream
    primary: {
      DEFAULT: 'hsl(25 47% 35%)',     // Lighter cocoa
      foreground: 'hsl(60 9% 97%)',
    },
  },
};
```

### 2. Custom Theme Provider
```typescript
// src/components/theme-provider.tsx
import { ThemeProvider as NextThemesProvider } from 'next-themes';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'light',
  storageKey = 'vite-ui-theme',
  ...props
}) => (
  <NextThemesProvider
    defaultTheme={defaultTheme}
    storageKey={storageKey}
    {...props}
  >
    {children}
  </NextThemesProvider>
);
```

### 3. Component Theme Overrides
```typescript
// Use CSS variables for theme customization
const componentStyles = cva(
  'base-styles',
  {
    variants: {
      variant: {
        primary: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
        secondary: 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]',
      },
    },
  }
);
```

## 📏 Responsive Design

### 1. Breakpoint System
```typescript
// tailwind.config.ts
module.exports = {
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
  },
}
```

### 2. Responsive Component Patterns
```typescript
// ✅ Good: Responsive with Tailwind
<Card className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {services.map(service => (
    <ServiceCard key={service.id} service={service} />
  ))}
</Card>

// ✅ Good: Responsive with conditional rendering
<div className="block md:hidden">
  <MobileNavigation />
</div>
<div className="hidden md:block">
  <DesktopNavigation />
</div>

// ❌ Bad: Complex responsive logic
<div className={`grid ${isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-3'}`}>
```

### 3. Container Patterns
```typescript
// Responsive container with consistent spacing
<Container className="py-8 md:py-12 lg:py-16">
  <div className="mx-auto max-w-7xl">
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  </div>
</Container>
```

## 🚀 Performance Optimization

### 1. Component Optimization
```typescript
// ✅ Good: React.memo for expensive components
const ExpensiveServiceCard = React.memo(({ service }) => {
  const complexCalculation = useMemo(() => {
    // Expensive calculation
    return calculateServiceDetails(service);
  }, [service.id]); // Dependency array

  return <Card>{complexCalculation}</Card>;
});

// ✅ Good: useCallback for event handlers
const BookingWizard = () => {
  const handleServiceSelect = useCallback((service: Service) => {
    // Handle selection
    setBooking(prev => ({ ...prev, service }));
  }, []); // Empty dependency if no external values

  return <Step1Choose onSelectService={handleServiceSelect} />;
};
```

### 2. Code Splitting
```typescript
// ✅ Good: Lazy loading for large components
const AdminDashboard = lazy(() => import('@/components/admin/AdminDashboard'));

// Usage with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <AdminDashboard />
</Suspense>
```

### 3. Bundle Optimization
```typescript
// Tree-shakeable components
export { Button } from './ui/button';
export { Card } from './ui/card';

// Individual exports
export { Button } from './button';
export { Card } from './card';

// Named exports for better tree shaking
export {
  Button,
  Card,
  Dialog,
  // ... other components
} from './index';
```

## 🔍 Debugging Components

### 1. Development Tools
```typescript
// Component debug prop for development
interface ComponentProps {
  debug?: boolean; // Remove in production
}

const MyComponent = ({ debug = false, ...props }) => {
  if (process.env.NODE_ENV === 'development' && debug) {
    console.log('Component props:', props);
  }

  return <div {...props} />;
};

// Usage
<MyComponent debug={true} />
```

### 2. Error Boundaries
```typescript
// src/components/error-boundary.tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<
  PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component error:', error, errorInfo);
    // Send to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

## 📋 Component Checklist

### Before Submitting
- [ ] Component follows naming conventions
- [ ] Props interface is properly typed
- [ ] Component has default props/variants defined
- [ ] Accessibility requirements are met
- [ ] Component is responsive
- [ ] Component has proper error handling
- [ ] Component has loading states if needed
- [ ] Component is properly tested
- [ ] Component documentation is updated
- [ ] Component exports are clean

### Testing Checklist
- [ ] Renders without errors
- [ ] Handles required props correctly
- [ ] Handles optional props gracefully
- [ ] User interactions work correctly
- [ ] Loading and error states are tested
- [ ] Accessibility is tested
- [ ] Responsive behavior is tested
- [ ] Performance is acceptable

---

*This documentation should be updated as the component library evolves. Last updated: January 2025*