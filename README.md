# mariiaborysevych - Premium Beauty & Fitness Booking Platform

![mariiaborysevych](/docs/assets/mariia-hub-banner.webp)

A sophisticated, unified booking and management platform for beauty and fitness services, targeting the premium Warsaw market. Built with modern technologies and a focus on exceptional user experience.

## ✨ Features

### 🎯 Core Functionality
- **Multi-Service Booking**: Beauty treatments, fitness programs, and lifestyle services
- **Smart Scheduling**: AI-powered availability management with conflict prevention
- **Multi-Language Support**: English, Polish, Ukrainian, and Russian
- **Multi-Currency**: PLN, EUR, USD with dynamic conversion
- **Mobile-First Design**: Progressive Web App with offline capabilities

### 💅 Beauty Services
- PMU (Permanent Makeup) for brows and lips
- Brow lamination and tinting
- Eyelash extensions and lifts
- Luxury beauty treatments

### 💪 Fitness Programs
- Personal training sessions
- Group fitness classes
- Glutes specialization programs
- Starter fitness packages

### 🛠️ Management Features
- **Admin Dashboard**: Comprehensive analytics and content management
- **Real-time Availability**: Advanced capacity management
- **Payment Processing**: Stripe integration with multiple payment methods
- **Review System**: Customer feedback with AI-powered moderation
- **Loyalty Program**: Rewards system for repeat customers
- **Gift Cards**: Digital gift card management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/mariia-hub-unified.git
cd mariia-hub-unified

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080`

### Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key

# Meta Pixel
VITE_META_PIXEL_ID=your_pixel_id

# Google Analytics
VITE_GA_TRACKING_ID=your_ga_id
```

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui + Radix UI primitives
- **Styling**: Tailwind CSS with luxury design system
- **State Management**: React Context + TanStack Query
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Payments**: Stripe
- **Testing**: Vitest + Testing Library
- **Internationalization**: i18next

### Project Structure
```
mariia-hub-unified/
├── src/                    # Application source code
│   ├── components/         # Reusable UI components
│   │   ├── admin/         # Admin-specific components
│   │   ├── booking/       # Booking flow components
│   │   └── ui/            # Base UI components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   ├── pages/             # Route components
│   ├── services/          # API and business logic
│   ├── stores/            # State management
│   └── types/             # TypeScript type definitions
├── config/                # Consolidated configuration files
│   ├── vite.config.ts     # Vite configuration
│   ├── vitest.config.ts   # Vitest configuration
│   ├── eslint.config.js   # ESLint configuration
│   └── tailwind.config.ts # Tailwind configuration
├── infra/                 # Infrastructure as Code
│   ├── terraform/         # Terraform modules
│   ├── nginx/             # Nginx configurations
│   └── k8s/               # Kubernetes manifests
├── scripts/               # Unified operational scripts (16 total)
│   ├── deploy/            # Deployment scripts
│   ├── utils/             # Utility scripts
│   ├── devops/            # DevOps automation
│   ├── security/          # Security scanning
│   ├── testing/           # Testing automation
│   └── backup/            # Backup & recovery
└── docs/                  # Documentation
```

### 🏗️ Refactored Infrastructure (October 2025)
- **Scripts**: Consolidated from 100 to 16 unified scripts (84% reduction)
- **Docker**: Reduced from 11 to 3 configuration files (73% reduction)
- **Infrastructure**: Merged 4 directories into 1 unified structure (75% reduction)
- **Configuration**: All configs organized in `config/` directory
- **See**: `FINAL_REFACTORING_SUMMARY.md` for complete details

### Database Architecture
- **PostgreSQL** with Row Level Security (RLS)
- **Realtime subscriptions** for live updates
- **Comprehensive schema** for bookings, services, users
- **Advanced functions** for availability and scheduling

## 📖 Documentation

Comprehensive documentation is available in the `/docs` directory:

### Essential Reading
- [Technical Architecture](docs/TECHNICAL_ARCHITECTURE.md) - System design and patterns
- [API Documentation](docs/README.md#api-documentation) - Complete API reference
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Production deployment
- [Security Overview](docs/SECURITY_AUDIT_REPORT.md) - Security measures

### Key Guides
- [Booking System Implementation](docs/BOOKSY_COMPLETE_SOLUTION.md)
- [Payment Integration](docs/STRIPE_SETUP_GUIDE.md)
- [Multi-Language Setup](docs/MULTI_LANGUAGE_IMPLEMENTATION_GUIDE.md)
- [Admin Features](docs/admin/ADMIN_DASHBOARD.md)

## 🧪 Testing

### Using Unified Test Runner (Recommended)
```bash
# Run all test suites
./scripts/testing/test-runner.sh --action run --suite all

# Run specific test suite
./scripts/testing/test-runner.sh --action run --suite unit
./scripts/testing/test-runner.sh --action run --suite e2e
./scripts/testing/test-runner.sh --action run --suite visual
./scripts/testing/test-runner.sh --action run --suite accessibility

# Generate coverage report
./scripts/testing/test-runner.sh --action coverage

# Watch mode for development
./scripts/testing/test-runner.sh --action watch
```

### Standard Testing Commands
```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage

# Type checking
npm run type-check
```

## 📦 Build & Deploy

### Using Unified Scripts (Recommended)
```bash
# Build application
./scripts/utils/build-manager.sh --action build

# Deploy to production (Vercel)
./scripts/deploy/unified-deploy.sh --action deploy --target vercel --env production

# Deploy to Docker
./scripts/deploy/unified-deploy.sh --action deploy --target docker --env staging

# Run all tests
./scripts/testing/test-runner.sh --action run --suite all

# Security scan
./scripts/security/security-monitor.sh --action scan --target all
```

### Standard Commands
```bash
# Development build
npm run build:dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

See `CLAUDE.md` for complete documentation of all 16 unified scripts.

## 🔧 Development Workflow

### Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature development
- `hotfix/*` - Production fixes

### Commit Convention
```bash
feat: Add new feature
fix: Bug fix
docs: Documentation update
style: Code style changes
refactor: Code refactoring
test: Add or update tests
chore: Maintenance tasks
```

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details on:

- Code of Conduct
- Development process
- Pull request guidelines
- Coding standards
- Issue reporting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Documentation**: Check `/docs` directory
- **Issues**: [GitHub Issues](https://github.com/your-username/mariia-hub-unified/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/mariia-hub-unified/discussions)

## 🎯 Roadmap

### Current Development (Q1 2025)
- [ ] Advanced AI scheduling features
- [ ] Enhanced mobile app experience
- [ ] Multi-location expansion
- [ ] Advanced analytics dashboard

### Planned Features
- [ ] Virtual consultations
- [ ] Integration with beauty product suppliers
- [ ] Advanced marketing automation
- [ ] Franchise management system

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Backend powered by [Supabase](https://supabase.com/)
- Payments processed by [Stripe](https://stripe.com/)
- Icons from [Lucide](https://lucide.dev/)

---

**Made with ❤️ for the beauty and fitness industry**

Last updated: 2025-10-31 (Refactoring Complete)