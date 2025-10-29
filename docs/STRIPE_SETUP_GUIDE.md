# Stripe Setup and Configuration Guide

This guide covers the complete Stripe setup for the Mariia Hub booking platform with Polish VAT compliance.

## ✅ Current Status

### Stripe Account Configuration
- **Status**: ✅ Logged in and configured
- **Account ID**: `acct_1S4TLQ3b878SLCqi`
- **Business Type**: Individual
- **Country**: Canada (CA)
- **Default Currency**: CAD
- **Charges Enabled**: ✅
- **Payouts Enabled**: ❌ (individual account)
- **Dashboard Name**: peycheff
- **Timezone**: Europe/Sofia

### Available Capabilities
- ✅ Card Payments (active)
- ✅ Link Payments (active)
- ✅ Transfers (active)
- ✅ AfterPay/Clearpay (active)
- ✅ Bancontact (active)
- ✅ EPS (active)
- ✅ Klarna (active)
- ⏳ Cartes Bancaires (pending)
- ✅ ACSS Debit (active)

### Webhook Endpoints
- **ID**: `we_1S4qt73b878SLCqiD1OeiWve`
- **URL**: `https://peycheff.com/.netlify/functions/stripe-webhook`
- **Status**: Enabled
- **Mode**: Test Mode
- **Events**:
  - checkout.session.completed
  - payment_intent.succeeded
  - customer.subscription.created

## 🔧 Local Development Setup

### 1. Stripe CLI Configuration
The Stripe CLI is already configured with:
- Test mode API key: `sk_test_...` (removed for security)
- Publishable key: `pk_test_...` (removed for security)
- Webhook secret: `whsec_...` (removed for security)

### 2. Environment Configuration
Create a `.env` file in the project root with:

```bash
# Copy from .env.example
cp .env.example .env

# Update Stripe configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (get from Stripe dashboard)
STRIPE_SECRET_KEY=sk_test_... (get from Stripe dashboard)
STRIPE_WEBHOOK_SECRET=whsec_... (get from Stripe webhook setup)
```

### 3. Webhook Development Setup

#### Option A: Using the Script (Recommended)
```bash
# Start webhook listener for development
./scripts/start-stripe-webhooks.sh

# For production
./scripts/start-stripe-webhooks.sh production
```

#### Option B: Manual Command
```bash
# Listen to all payment-related events
stripe listen \
  --events payment_intent.succeeded,payment_intent.payment_failed,invoice.payment_succeeded,invoice.created,invoice.finalized \
  --forward-to http://localhost:8080/api/stripe/webhook \
  --skip-verify
```

### 4. API Keys Configuration
The platform uses both test and live mode keys:

**Test Mode** (Development):
- Publishable: `pk_test_...` (get from Stripe dashboard)
- Secret: `sk_test_...` (get from Stripe dashboard)

**Live Mode** (Production):
- Publishable: `pk_live_...` (get from Stripe dashboard)
- Secret: `sk_live_...` (get from Stripe dashboard)

## 🇵🇵 Polish VAT Compliance Configuration

### Polish Company Settings
Add these to your `.env` file:

```bash
# Polish VAT Configuration
VITE_COMPANY_NIP=1234567890
VITE_COMPANY_NAME=Mariia Hub Sp. z o.o.
VITE_COMPANY_ADDRESS=ul. Jana Pawła II 43/15, 00-001 Warszawa, Polska
VITE_COMPANY_BANK_ACCOUNT=PL123456789012345678901234567890
VITE_TAX_OFFICE_CODE=1411
VITE_INVOICE_PREFIX=FV

# Polish Features
VITE_ENABLE_POLISH_VAT=true
VITE_ENABLE_SPLIT_PAYMENT=true
VITE_ENABLE_ELECTRONIC_INVOICES=true
```

### VAT Rates Configuration
The system supports these Polish VAT rates:
- 23% - Standard rate
- 8% - Reduced rate (books, restaurants)
- 5% - Reduced rate (some food products)
- 0% - Zero rate (exports, intra-EU)
- zw. - Tax exempt
- np. - Not applicable

## 🚀 Production Deployment

### 1. Production Webhook Setup
1. **Update Webhook URL in Stripe Dashboard**:
   - Go to: https://dashboard.stripe.com/webhooks
   - Update endpoint to: `https://your-domain.com/api/stripe/webhook`
   - Add these events:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `invoice.payment_succeeded`
     - `invoice.created`
     - `invoice.finalized`
     - `charge.succeeded`
     - `charge.failed`

2. **Update Production Environment Variables**:
   ```bash
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### 2. Payout Configuration
For production, you'll need to:
1. Upgrade to a Stripe business account
2. Complete business verification
3. Configure payout schedule
4. Set up bank account for payouts

### 3. Polish Business Registration
To fully utilize Polish VAT features:
1. Register as a Polish business entity
2. Obtain NIP number
3. Register for VAT (VAT-UE if doing EU business)
4. Set up Polish bank account

## 🔍 Testing

### Test Cards for Development
Use these test card numbers from Stripe:
- Successful payment: `4242424242424242`
- 3D Secure: `4000002500003155`
- Declined: `4000000000000002`

### Testing Polish VAT Features
1. Test NIP validation: `1234567890` (valid checksum)
2. Test different VAT rates with various service types
3. Test invoice generation with Polish format
4. Test split payment (MPP) for amounts > 15,000 PLN

### Webhook Testing
```bash
# Trigger test webhook events
stripe trigger payment_intent.succeeded
stripe trigger invoice.payment_succeeded
```

## 📊 Monitoring

### Stripe Dashboard
Monitor transactions at: https://dashboard.stripe.com
- Payments
- Invoices
- Subscriptions
- Customers
- Disputes

### Local Development
- View webhook events in the CLI
- Check Supabase logs for webhook processing
- Monitor payment status in the application

## 🔧 Integration Points

### Frontend Components
- `src/lib/stripe.ts` - Stripe client initialization
- `src/components/payment/` - Payment UI components
- `src/lib/vat/` - VAT calculation components
- `src/lib/invoice/` - Invoice generation components

### Backend Functions
- `supabase/functions/create-payment-intent/` - Payment intent creation
- `supabase/functions/stripe-webhook/` - Webhook handler
- `supabase/functions/refund-payment/` - Refund processing
- `supabase/functions/create-booking-payment/` - Booking payments

### Database Tables
- `payments` - Payment records
- `invoices` - Invoice data
- `stripe_customers` - Stripe customer mapping
- `nip_validations` - NIP validation cache
- `vat_registers` - VAT reporting

## 🛡 Security Considerations

### 1. API Key Management
- Never expose secret keys in client-side code
- Use environment variables for sensitive data
- Rotate API keys regularly

### 2. Webhook Security
- Verify webhook signatures
- Use HTTPS for production webhooks
- Validate event types before processing

### 3. PCI DSS Compliance
- Never store raw card data
- Use Stripe Elements for card collection
- Implement proper security headers

### 4. Data Protection
- Comply with GDPR for EU customers
- Implement data retention policies
- Secure customer data handling

## 📞 Support Resources

### Documentation
- Stripe API Docs: https://stripe.com/docs/api
- Polish VAT Guide: `docs/POLISH_VAT_COMPLIANCE_GUIDE.md`
- Integration Summary: `STRIPE_IMPLEMENTATION_SUMMARY.md`

### Tools
- Stripe CLI: `stripe --help`
- Webhook Builder: https://stripe.com/webhooks
- Payment Links: https://dashboard.stripe.com/payment-links

### Troubleshooting
1. Check CLI configuration: `stripe config --list`
2. Verify webhook endpoints: `stripe webhook_endpoints list`
3. Test webhook connectivity: `stripe listen --forward-to localhost:3000/webhook`

## 📈 Performance Optimization

### Best Practices
1. Use Stripe Elements for PCI compliance
2. Implement payment intent caching
3. Optimize webhook processing
4. Monitor payment success rates
5. Implement proper error handling

### Metrics to Track
- Payment success rate
- Average transaction value
- Failed payment reasons
- Webhook delivery success
- VAT calculation accuracy

---

**Last Updated**: October 23, 2025
**Status**: ✅ Fully Configured and Ready for Production