# Mariia Hub Documentation

Welcome to the Mariia Hub documentation center. This repository contains a unified booking and management platform for beauty and fitness services targeting the premium Warsaw market.

## 📚 Documentation Structure

### Getting Started
- [**Project README**](../README.md) - Project overview and quick start
- [**Technical Architecture**](TECHNICAL_ARCHITECTURE.md) - System architecture and design patterns
- [**Development Plan**](DEVELOPMENT_PLAN.md) - Current development roadmap
- [**PRD**](PRD.md) - Product Requirements Document

### API Documentation
- [**Supabase Functions**](api/SUPABASE_FUNCTIONS.md) - Backend API documentation
- [**Service Layer**](api/SERVICE_LAYER.md) - Frontend service APIs
- [**Database Schema**](../DATABASE_SCHEMA.md) - Database structure and relationships
- [**OpenAPI Spec**](api/openapi.yaml) - Complete API specification

### Implementation Guides
- [**Booking System**](BOOKSY_COMPLETE_SOLUTION.md) - Complete booking workflow
- [**Payment Integration**](STRIPE_SETUP_GUIDE.md) - Stripe payment setup
- [**Multi-City Support**](MULTI_CITY_GUIDE.md) - Multi-location implementation
- [**Internationalization**](MULTI_LANGUAGE_IMPLEMENTATION_GUIDE.md) - i18n setup

### Admin Features
- [**Admin Dashboard**](admin/ADMIN_DASHBOARD.md) - Admin interface guide
- [**Analytics System**](admin/ANALYTICS_SYSTEM.md) - Analytics and reporting
- [**Content Management**](admin/CONTENT_MANAGEMENT.md) - CMS usage
- [**User Management**](admin/USER_MANAGEMENT.md) - User administration

### Security & Compliance
- [**Security Overview**](SECURITY_AUDIT_REPORT.md) - Security measures and policies
- [**GDPR Compliance**](GDPR_COMPLIANCE_GUIDE.md) - Data protection compliance
- [**Polish VAT Compliance**](POLISH_VAT_COMPLIANCE_GUIDE.md) - Tax compliance
- [**Consent Management**](CONSENT_SYSTEM_IMPLEMENTATION_GUIDE.md) - User consent system

### Deployment & Operations
- [**Deployment Guide**](DEPLOYMENT_GUIDE.md) - Production deployment
- [**Staging Environment**](STAGING_ENVIRONMENT_GUIDE.md) - Staging setup
- [**Monitoring**](MONITORING_GUIDE.md) - System monitoring and alerting
- [**Emergency Runbook**](EMERGENCY_RUNBOOK.md) - Incident response procedures

### Development Resources
- [**Contributing**](../CONTRIBUTING.md) - Contribution guidelines
- [**Testing Strategy**](TESTING_STRATEGY.md) - Comprehensive testing approach
- [**Testing Playbook**](TESTING_PLAYBOOK.md) - Developer testing guide
- [**Testing Troubleshooting**](TESTING_TROUBLESHOOTING.md) - Common test issues & solutions
- [**Business Logic & Domain**](BUSINESS_LOGIC_DOMAIN.md) - Domain concepts & rules
- [**Component Library**](COMPONENT_LIBRARY.md) - UI components & patterns
- [**Architecture Decisions**](./architecture/) - ADRs and technical decisions

### Feature Documentation
- [**Reviews System**](REVIEWS_IMPLEMENTATION_GUIDE.md) - Customer reviews
- [**Loyalty Program**](PAYMENT_LOYALTY_IMPLEMENTATION.md) - Customer loyalty
- [**Gift Cards**](GIFT_CARDS_IMPLEMENTATION.md) - Gift card system
- [**WhatsApp Integration**](WHATSAPP_COMPLIANCE_GUIDE.md) - WhatsApp business API

### Marketing & SEO
- [**SEO Implementation**](SEO_IMPLEMENTATION_GUIDE.md) - SEO optimization
- [**Meta CAPI**](META_CAPI_IMPLEMENTATION_GUIDE.md) - Meta conversions API
- [**Marketing Automation**](MARKETING_AUTOMATION_SYSTEM.md) - Marketing workflows

## Quick Links

### Core Technologies
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui + Radix UI
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS
- **Testing**: Vitest + Testing Library
- **Internationalization**: i18next

### Key Services
- [Booking Service](../src/services/booking.service.ts) - Core booking logic
- [Payment Service](../src/services/paymentSystemService.ts) - Payment processing
- [Analytics Service](../src/services/analytics.service.ts) - Usage analytics
- [Notification Service](../src/services/notification.service.ts) - User notifications

### Database Tables
- [services](../supabase/migrations/) - Service catalog
- [bookings](../supabase/migrations/) - Booking records
- [profiles](../supabase/migrations/) - User profiles
- [availability_slots](../supabase/migrations/) - Time slot management

## Documentation Status

This documentation is actively maintained. Last updated: 2025-01-24

For questions or contributions, please refer to the [Contributing Guide](../CONTRIBUTING.md).

## Navigation

- Use the sidebar in compatible viewers to navigate sections
- Search functionality is available for most documentation viewers
- Each section includes related topics and cross-references