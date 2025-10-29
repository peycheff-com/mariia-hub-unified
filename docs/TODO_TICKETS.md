# TODO Tickets

This document tracks all TODO comments found in the codebase that need to be addressed.

## 🎫 Active Tickets

### Booking Service Enhancements

#### Ticket #001: Add-ons Implementation
- **File**: `src/services/bookingDomainService.ts:373`
- **Description**: Implement add-ons selection in booking flow
- **Priority**: High
- **Impact**: Revenue optimization
- **Estimated effort**: 3 days
- **Requirements**:
  - Add add-on selection UI in booking wizard
  - Update pricing calculation with add-ons
  - Store selected add-ons in booking record
  - Implement add-on inventory management

#### Ticket #002: Multi-currency Support
- **File**: `src/services/bookingDomainService.ts:375`
- **Description**: Get currency from user preferences instead of hardcoded PLN
- **Priority**: Medium
- **Impact**: International user experience
- **Estimated effort**: 2 days
- **Requirements**:
  - Add currency preference to user profile
  - Implement currency converter service
  - Update UI to show selected currency
  - Store original amount and converted amount

#### Ticket #003: Dynamic Pricing Calculation
- **File**: `src/services/bookingDomainService.ts:376`
- **Description**: Calculate total amount including add-ons
- **Priority**: High
- **Impact**: Revenue accuracy
- **Estimated effort**: 1 day
- **Requirements**:
  - Include add-on prices in total calculation
  - Apply correct currency conversion
  - Handle discounts and promotions
  - Display detailed price breakdown

#### Ticket #004: Discount System
- **File**: `src/services/bookingDomainService.ts:412`
- **Description**: Implement discount code logic
- **Priority**: Medium
- **Impact**: Marketing and promotions
- **Estimated effort**: 3 days
- **Requirements**:
  - Create discount code management system
  - Implement percentage and fixed amount discounts
  - Add expiration and usage limits
  - Track discount usage analytics

### Media Management

#### Ticket #005: Bulk Delete Feature
- **File**: `src/components/media/MediaLibrary.tsx:156`
- **Description**: Implement bulk delete for multiple media assets
- **Priority**: Medium
- **Impact**: Admin efficiency
- **Estimated effort**: 2 days
- **Requirements**:
  - Add checkbox selection for items
  - Implement bulk delete API endpoint
  - Add confirmation dialog
  - Show progress indicator for bulk operations

#### Ticket #006: File Upload Enhancement
- **File**: `src/components/media/MediaLibrary.tsx:200`
- **Description**: Improve file upload with drag-and-drop and progress
- **Priority**: High
- **Impact**: User experience
- **Estimated effort**: 3 days
- **Requirements**:
  - Implement drag-and-drop upload zone
  - Show upload progress for each file
  - Support multiple file selection
  - Add file type validation and size limits
  - Show preview for images

#### Ticket #007: Asset Download Feature
- **File**: `src/components/media/MediaLibrary.tsx:215, 235`
- **Description**: Implement download functionality for assets
- **Priority**: Low
- **Impact**: Convenience
- **Estimated effort**: 1 day
- **Requirements**:
  - Add download button to each asset
  - Implement batch download
  - Preserve original file name
  - Show download progress

### Booking Store

#### Ticket #008: API Integration
- **File**: `src/stores/bookingStore.ts:150`
- **Description**: Replace mock implementation with actual API calls
- **Priority**: Critical
- **Impact**: Core functionality
- **Estimated effort**: 5 days
- **Requirements**:
  - Integrate with all booking endpoints
  - Implement proper error handling
  - Add loading states
  - Cache frequently accessed data
  - Implement optimistic updates

## 📊 Summary

- **Total Tickets**: 8
- **Critical**: 1
- **High**: 3
- **Medium**: 3
- **Low**: 1
- **Total Estimated Effort**: 20 days

## 🚨 Immediate Actions Required

1. **Ticket #008** - Critical: Booking store API integration
   - This blocks core booking functionality
   - Must be completed before launch

2. **Ticket #003** - High: Dynamic pricing calculation
   - Direct impact on revenue
   - Dependencies: Ticket #001

3. **Ticket #006** - High: File upload enhancement
   - Major UX improvement
   - Frequently used feature

## 📋 Next Steps

1. Create detailed GitHub issues for each ticket
2. Assign tickets to appropriate team members
3. Set up milestone releases
4. Implement regular code reviews to catch new TODOs
5. Set up automated TODO detection in CI/CD

## 🔄 Process

- **TODO Detection**: Automated scan runs weekly
- **Ticket Creation**: TODOs are converted to tickets within 2 days
- **Review Process**: Tickets are reviewed and prioritized daily
- **Documentation**: Completed tickets are documented in changelog

---

*Last updated: $(date '+%Y-%m-%d %H:%M:%S')*