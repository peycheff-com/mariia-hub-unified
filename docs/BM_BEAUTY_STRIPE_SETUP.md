# BM Beauty Stripe Setup Guide

## Account Information
- **Account**: BM Beauty
- **Email**: mindburnlabs@gmail.com
- **Account ID**: `acct_1SA2UU3CebPCwwrV`
- **Country**: PL (Poland)
- **Default Currency**: EUR
- **Business Type**: Individual
- **Statement Descriptor**: BM BEAUTY

## Current Status
✅ **Charges Enabled**: Yes
✅ **Payouts Enabled**: Yes
✅ **Details Submitted**: Yes
✅ **Stripe CLI Connected**: Yes

## Active Payment Methods
- ✅ Bancontact Payments
- ✅ BLIK Payments (Polish instant payment)
- ✅ Card Payments
- 🔄 Cartes Bancaires Payments (pending)
- ✅ EPS Payments (Austrian)
- ✅ Klarna Payments
- ✅ Link Payments
- ✅ P24 Payments (Polish)
- ✅ Revolut Pay Payments
- ✅ Transfers

## Required Actions

### 1. Configure PLN Currency
The BM Beauty account currently uses EUR as default currency. To properly use PLN:

**Important**: You cannot change the default currency once the account is created.

**Solutions**:
1. **Option A**: Keep the current EUR account but create PLN prices for all products
2. **Option B**: Create a new Stripe account specifically for Poland with PLN as default

**To Create PLN Prices**:
1. In Stripe Dashboard → Products → Create Product
2. When adding pricing, select "PLN" as currency
3. Example: Price 100 PLN for a service instead of 23 EUR

**Multi-Currency Support**:
- The app already supports PLN, EUR, and USD
- Customers can switch currencies
- Exchange rates are automatically applied
- Payments will be processed in your account currency (EUR) with conversion

### 2. Get API Keys
Visit https://dashboard.stripe.com/apikeys to get your API keys:
- Publishable key (starts with `pk_`)
- Secret key (starts with `sk_`)
- Webhook signing secret (starts with `whsec_`)

### 3. Configure Webhooks
Create a webhook endpoint in Stripe Dashboard:
1. Go to Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `invoice.payment_succeeded`
   - `invoice.created`
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `payment_intent.payment_failed`
   - `invoice.payment_failed`

### 4. Update Environment Variables
Update `.env` files with BM Beauty keys:

```bash
# .env.local or .env.production
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Polish VAT Configuration
VITE_COMPANY_NIP=1181746309
VITE_COMPANY_NAME=BM Beauty
VITE_COMPANY_ADDRESS=Warsaw, Poland
VITE_TAX_OFFICE_CODE=1411
VITE_INVOICE_PREFIX=FV
VITE_ENABLE_POLISH_VAT=true
VITE_ENABLE_SPLIT_PAYMENT=true
```

### 5. Create Products
Create products in Stripe Dashboard:
1. Go to Products → Add product
2. Create products for:
   - Beauty services (lashes, brows, PMU)
   - Fitness programs
   - Package deals
   - Gift cards

**Important**: When creating prices, select PLN currency to charge in Polish Złoty

### 6. Configure Polish VAT
1. Go to Settings → Tax
2. Add Polish VAT rates:
   - 23% (standard rate)
   - 8% (reduced rate)
   - 5% (super reduced rate)
   - 0% (exempt)
   - O zw. (exempt with reverse charge)

### 7. Test Integration
```bash
# Start webhook listener for testing
stripe listen --forward-to http://localhost:8080/api/stripe/webhook

# Test payment with test card
# Card number: 4242 4242 4242 4242
# Expiry: Any future date
# CVC: Any 3 digits
```

## Development Setup

### Local Development
```bash
# Use the BM Beauty configuration file
cp .env.stripe.bmbeauty .env.local

# Edit with actual keys
# Start dev server
npm run dev
```

### Webhook Development
```bash
# Start webhook listener
stripe listen --events payment_intent.succeeded,invoice.payment_succeeded,invoice.created --forward-to http://localhost:8080/api/stripe/webhook --skip-verify

# The webhook secret will be displayed in the output
# Update STRIPE_WEBHOOK_SECRET with this value
```

## Polish VAT Compliance Features

### Implemented Features
1. **NIP Validation**: Polish VAT number validation
2. **VAT Calculation**: Automatic VAT calculation based on service type
3. **Invoice Generation**: Polish-compliant invoices with sequential numbering
4. **Split Payment (MPP)**: For transactions > 15,000 PLN
5. **JPK_FA XML**: Tax reporting format
6. **Electronic Invoices**: KSeF compliance ready

### VAT Rates by Service Type
- **Beauty Services**: 23% (standard)
- **Fitness Programs**: 8% (reduced)
- **Educational Services**: 5% (super reduced)
- **EU B2B**: 0% (reverse charge)
- **Exports**: 0% (exempt)

## Testing Cards
Use these test cards for testing different scenarios:

| Card Number | Use Case | Result |
|-------------|----------|--------|
| 4242 4242 4242 4242 | Standard payment | Success |
| 4000 0000 0000 9995 | Insufficient funds | Failure |
| 4000 0000 0000 9987 | Lost card | Failure |
| 4000 0000 0000 9979 | Stolen card | Failure |

## Production Checklist
- [ ] Get live API keys
- [ ] Configure live webhook endpoint
- [ ] Update environment variables
- [ ] Create live products and prices
- [ ] Enable Polish VAT in live mode
- [ ] Test live payment flow
- [ ] Set up Stripe Radar for fraud detection
- [ ] Configure email receipts
- [ ] Set up 1099/KYC forms if needed

## Support
- Stripe Documentation: https://stripe.com/docs
- Polish Guide: https://stripe.com/docs/poland
- Support: https://support.stripe.com

## Current Webhook Listener
The webhook listener is currently running with:
- **Webhook Secret**: `whsec_02fc2ab63ee4c27ccab98eb33787071f7238c82595ecf6078963abb75c32df04`
- **Forwarding URL**: `http://localhost:8080/api/stripe/webhook`
- **Events**: payment_intent.succeeded, invoice.payment_succeeded, invoice.created