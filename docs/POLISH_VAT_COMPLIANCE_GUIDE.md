# Polish VAT Compliance System - Implementation Guide

This guide documents the comprehensive Polish VAT compliance features implemented for the Mariia Hub booking platform.

## Overview

The Polish VAT compliance system includes:

1. **NIP (VAT Number) Validation System** - Validates Polish VAT numbers using checksum algorithm
2. **VAT Calculation Engine** - Calculates correct VAT rates for different service categories
3. **Compliant Invoice Generation** - Generates Polish-compliant invoices with all required fields
4. **B2B Company Checkout Flow** - Enhanced checkout for business customers
5. **Credit Notes and Refunds System** - Handles returns and financial adjustments
6. **Tax Reporting Features** - Generates JPK files and VAT registers

## Architecture

### Database Schema

The system adds several new tables to the database:

- `nip_validations` - Cache for validated NIP numbers
- `company_profiles` - Company information for B2B customers
- `invoices` - Main invoices table with Polish compliance fields
- `invoice_items` - Detailed invoice line items
- `credit_notes` - Credit notes (faktury korygujące)
- `refunds` - Refund tracking
- `vat_registers` - VAT registers for tax reporting
- `vat_rate_configurations` - VAT rate rules and conditions

### Key Components

#### 1. NIP Validation (`/src/lib/vat/nip-validation.ts`)

**Features:**
- Checksum validation using official Polish algorithm
- API integration with VAT-ON service (mock implementation)
- Database caching for performance
- Batch validation support

**Usage:**
```typescript
import { useNIPValidation } from '@/lib/vat/nip-validation';

const { validateNIP, validateAndFormatNIP } = useNIPValidation();

// Validate NIP
const result = await validateNIP('123-456-78-90', true); // useAPI = true

// Validate and format
const { formattedNIP, validation } = await validateAndFormatNIP('1234567890');
```

#### 2. VAT Calculation (`/src/lib/vat/vat-calculator.ts`)

**Features:**
- Support for all Polish VAT rates (23%, 8%, 5%, 0%, zw., np.)
- Reverse charge mechanism for EU customers
- Service category-based rate determination
- Conditional rate application

**Usage:**
```typescript
import { useVATCalculator } from '@/lib/vat/vat-calculator';

const { calculateVAT } = useVATCalculator();

const result = await calculateVAT({
  amount: 100,
  serviceType: 'beauty',
  serviceCategory: 'lip_enhancements',
  customerType: 'company_polish',
  customerCountry: 'Polska'
});
```

#### 3. Invoice Generation (`/src/lib/invoice/invoice-generator.ts`)

**Features:**
- Polish-compliant invoice format
- Automatic invoice numbering
- JPK_FA XML generation
- QR code payment support
- Multi-currency support

**Usage:**
```typescript
import { useInvoiceGenerator } from '@/lib/invoice/invoice-generator';

const { generateInvoice } = useInvoiceGenerator();

const invoice = await generateInvoice({
  invoiceType: 'faktura',
  issueDate: new Date(),
  customerType: 'company_polish',
  customerName: 'Company Ltd.',
  customerNIP: '1234567890',
  items: [/* invoice items */],
  // ... other invoice data
});
```

#### 4. B2B Checkout Flow (`/src/components/checkout/B2BCheckoutFlow.tsx`)

**Features:**
- Step-by-step company registration
- NIP validation integration
- Address management
- Invoice preferences
- Agreement handling

**Usage:**
```tsx
import { B2BCheckoutFlow } from '@/components/checkout/B2BCheckoutFlow';

<B2BCheckoutFlow
  service={service}
  bookingData={bookingData}
  onComplete={handleComplete}
  onBack={handleBack}
/>
```

#### 5. Refund Management (`/src/lib/refunds/refund-manager.ts`)

**Features:**
- Multiple refund methods (Stripe, bank transfer, cash, account credit)
- Credit note generation
- Refund policy enforcement
- Status tracking

**Usage:**
```typescript
import { useRefundManager } from '@/lib/refunds/refund-manager';

const { processRefund, generateCreditNote } = useRefundManager();

const refund = await processRefund({
  invoiceId: 'invoice-123',
  refundAmount: 100,
  refundReason: 'Customer request',
  refundMethod: 'stripe',
  // ... other data
});
```

#### 6. Tax Reporting (`/src/lib/tax/tax-reporting.ts`)

**Features:**
- VAT register generation
- JPK_FA file generation
- Period-based reporting
- Multiple export formats

**Usage:**
```typescript
import { useTaxReporting } from '@/lib/tax/tax-reporting';

const { generateJPK_FA, generateVATRegister } = useTaxReporting();

const jpkData = await generateJPK_FA({
  periodType: 'monthly',
  year: 2024,
  month: 10,
  format: 'xml',
  includeDetailed: true
});
```

## Integration with Existing Booking Flow

### Enhanced Payment Step

The existing `Step4Payment.tsx` can be replaced with `Step4PaymentCompliant.tsx` to add VAT compliance features:

1. **Customer Type Selection** - Person vs Company
2. **Company Information** - NIP validation, address details
3. **VAT Calculation** - Automatic calculation based on service and customer
4. **Invoice Preferences** - Electronic invoices, split payment
5. **Agreements** - Terms, privacy, electronic invoice consent

### Database Migration

Run the migration script to add the required tables:

```sql
-- The migration is located at:
-- /supabase/migrations/20250126000000_polish_vat_compliance.sql
```

## Configuration

### Company Information

Update the seller information in `invoice-generator.ts`:

```typescript
private static readonly SELLER_INFO: SellerInfo = {
  name: 'Your Company Name',
  address: {
    street: 'Your Street',
    buildingNumber: '1',
    city: 'Warsaw',
    postalCode: '00-001',
    country: 'Polska'
  },
  nip: 'YOUR_NIP_NUMBER',
  bankAccount: 'YOUR_BANK_ACCOUNT',
  // ... other details
};
```

### VAT Rate Configuration

Configure VAT rates for different services:

```sql
INSERT INTO vat_rate_configurations (
  service_type, service_category, default_vat_rate, legal_basis
) VALUES
  ('beauty', 'lip_enhancements', '23', 'Art. 41 ust. 1 Ustawy o VAT'),
  ('beauty', 'brows_lamination', '23', 'Art. 41 ust. 1 Ustawy o VAT'),
  -- ... add more configurations
```

### Tax Office Code

Update the tax office code for your location:

```typescript
// In tax-reporting.ts
KodUrzedu: '1411' // Warsaw tax office code
```

## Features Breakdown

### 1. NIP Validation System

**Checksum Algorithm:**
- Validates Polish NIP numbers using official weights [6, 5, 7, 2, 3, 4, 5, 6, 7]
- Handles edge cases (checksum = 10)
- Supports formatted (123-456-78-90) and unformatted (1234567890) input

**API Integration:**
- Integrates with Polish Ministry of Finance VAT-ON API
- Caches results to optimize performance
- Handles API failures gracefully

**Usage Examples:**
```typescript
// Basic validation
const isValid = NIPChecksumValidator.validate('123-456-78-90');

// With API verification
const result = await NIPValidationService.validateNIP('1234567890', true);

// Batch validation
const results = await NIPValidationService.validateMultipleNIPs([
  '1234567890',
  '0987654321'
], true);
```

### 2. VAT Calculation Engine

**Supported Rates:**
- 23% - Standard rate
- 8% - Reduced rate (books, restaurants)
- 5% - Reduced rate (some food products)
- 0% - Zero rate (exports, intra-EU)
- zw. - Tax exempt
- np. - Not applicable

**Customer Type Handling:**
- Person (B2C) - Standard VAT rates
- Polish company - Standard VAT rates with NIP validation
- EU company - Reverse charge (0% with self-calculation)
- Non-EU company - Export treatment

**Service Categories:**
```typescript
// Beauty services
'lip_enhancements' -> 23%
'brows_lamination' -> 23%
'makeup_services' -> 23%

// Fitness services
'personal_training' -> 23%
'group_classes' -> 23%
'fitness_programs' -> 23%
```

### 3. Invoice Generation

**Required Fields (Polish Compliance):**
- Invoice number with proper format (FV/0001/2024)
- Issue date, sale date, due date
- Seller and buyer information (name, address, NIP)
- Item details (name, quantity, unit price, VAT rate)
- VAT amounts and totals
- Legal basis for VAT exemption/reverse charge
- Bank account details for transfers

**Invoice Types:**
- Faktura - Standard invoice
- Faktura pro forma - Pro forma invoice
- Faktura zaliczkowa - Advance invoice
- Korekta - Credit note

**Electronic Features:**
- QR code for payments
- JPK_FA XML generation
- Electronic delivery support

### 4. B2B Checkout Flow

**5-Step Process:**
1. **Customer Type** - Person vs Company selection
2. **Company Information** - NIP validation, company details
3. **Address Information** - Billing and shipping addresses
4. **Invoice Preferences** - Type, payment terms, electronic invoices
5. **Agreements** - Terms, privacy, electronic invoice consent

**Features:**
- Real-time NIP validation
- Address autocomplete
- VAT calculation preview
- Progress indicator
- Form validation

### 5. Refunds and Credit Notes

**Refund Methods:**
- Stripe (automatic)
- Bank transfer (manual processing)
- Cash (in-person)
- Account credit (store credit)

**Refund Policies:**
```typescript
// Beauty services
- 48+ hours: 100% refund
- 24-48 hours: 50% refund
- <24 hours: 0% refund

// Fitness services
- 24+ hours: 100% refund
- <24 hours: 0% refund
```

**Credit Notes:**
- Automatic generation for refunds
- Correction tracking
- Legal compliance
- Related invoice linking

### 6. Tax Reporting

**VAT Registers:**
- Monthly/quarterly reporting
- Automatic calculation from invoices
- Sales and purchase breakdown
- Tax liability calculation

**JPK_FA Files:**
- XML format for tax authorities
- All invoice details
- Company information
- Proper encoding and structure

**Export Formats:**
- JSON - For API integration
- XML - For tax authorities (JPK)
- PDF - For human-readable reports

## Security Considerations

### Data Protection
- GDPR compliance for customer data
- NIP number validation without storing sensitive data
- Secure invoice storage
- Encrypted payment processing

### Financial Security
- PCI DSS compliance for card payments
- Secure bank transfers
- Audit trail for all transactions
- Refund verification

## Testing

### Unit Tests
- NIP checksum algorithm
- VAT calculation logic
- Invoice formatting
- Tax reporting calculations

### Integration Tests
- Payment flow testing
- Invoice generation
- Refund processing
- API integration

### Manual Testing
- User acceptance testing
- Tax authority validation
- Cross-border transactions
- Error handling

## Deployment

### Environment Variables
```bash
# Polish API configuration
VITE_POLISH_VAT_API_URL=https://wl-test.mf.gov.pl/api
VITE_COMPANY_NIP=1234567890
VITE_COMPANY_NAME=Mariia Hub
VITE_TAX_OFFICE_CODE=1411

# Invoice configuration
VITE_INVOICE_PREFIX=FV
VITE_SELLER_BANK_ACCOUNT=PL123456789012345678901234567890
```

### Database Setup
1. Run the migration script
2. Configure VAT rate tables
3. Set up invoice sequences
4. Create company profiles
5. Configure tax office codes

### Monitoring
- VAT calculation accuracy
- Invoice generation success rate
- NIP validation performance
- Refund processing time

## Maintenance

### Regular Tasks
- Update VAT rate configurations
- Monitor tax law changes
- Validate JPK file format compliance
- Review refund policies

### Compliance Updates
- Stay informed about VAT rate changes
- Update legal basis references
- Modify tax office codes as needed
- Adapt to new reporting requirements

## Support

### Common Issues

**Q: NIP validation fails for valid numbers**
A: Check the checksum calculation and ensure proper formatting. Verify API integration if using online validation.

**Q: VAT rates are incorrect for certain services**
A: Review the `vat_rate_configurations` table and ensure service categories are properly mapped.

**Q: JPK files are rejected by tax authorities**
A: Verify XML structure, encoding, and required fields. Check tax office code and company information.

**Q: Invoice numbers are not sequential**
A: Ensure `invoice_sequences` table is properly maintained and sequences are reset yearly.

### Contact
For technical support:
- Database issues: Check migration scripts
- VAT calculation: Review rate configurations
- Invoice generation: Verify company settings
- API integration: Check environment variables

---

**Last Updated:** January 26, 2025
**Version:** 1.0.0
**Compliance:** Polish VAT Act requirements as of 2024