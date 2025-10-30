# Mariia Hub iOS In-App Purchases and Subscriptions Setup

## Overview

Comprehensive configuration for iOS in-app purchases (IAP) and subscriptions for Mariia Hub beauty and fitness booking platform.

## In-App Purchase Strategy

### Business Model
**Freemium with Premium Features**:
- Free app with basic booking functionality
- Premium subscriptions for advanced features
- Individual service packages and bundles
- Pay-per-session options for premium services

### Revenue Streams
1. **Premium Subscriptions** (Monthly/Annual)
2. **Service Packages** (One-time purchases)
3. **Premium Features** (Add-ons)
4. **Gift Cards** (Redeemable credits)
5. **Premium Content** (Educational materials)

## Product Catalog

### 1. Premium Subscriptions

#### Mariia Hub Premium (Monthly)
- **Product ID**: com.mariiahub.ios.premium.monthly
- **Type**: Auto-Renewable Subscription
- **Duration**: 1 month
- **Price**: $19.99 USD / 89.99 PLN
- **Features**:
  - Unlimited bookings
  - Priority booking access
  - 10% discount on all services
  - Advanced progress tracking
  - Premium customer support
  - Exclusive content access

#### Mariia Hub Premium (Annual)
- **Product ID**: com.mariiahub.ios.premium.annual
- **Type**: Auto-Renewable Subscription
- **Duration**: 1 year
- **Price**: $199.99 USD / 899.99 PLN (Save 17%)
- **Features**: Same as monthly + annual bonus benefits
  - 20% discount on all services
  - Free annual beauty consultation
  - Priority customer support
  - Exclusive event invitations

#### Beauty Professional Subscription
- **Product ID**: com.mariiahub.ios.beauty.professional
- **Type**: Auto-Renewable Subscription
- **Duration**: 1 month
- **Price**: $49.99 USD / 229.99 PLN
- **Target**: Beauty professionals and salon owners
- **Features**:
  - Professional profile management
  - Advanced booking calendar
  - Client management tools
  - Analytics dashboard
  - Marketing tools

#### Fitness Professional Subscription
- **Product ID**: com.mariiahub.ios.fitness.professional
- **Type**: Auto-Renewable Subscription
- **Duration**: 1 month
- **Price**: $39.99 USD / 179.99 PLN
- **Target**: Fitness trainers and gym owners
- **Features**:
  - Trainer profile management
  - Client progress tracking
  - Workout plan creation
  - Nutrition planning tools
  - Group class management

### 2. Service Packages (Non-Consumable)

#### Ultimate Beauty Package
- **Product ID**: com.mariiahub.ios.package.beauty.ultimate
- **Type**: Non-Consumable
- **Price**: $299.99 USD / 1,399.99 PLN
- **Contents**:
  - 3 lip enhancement sessions
  - 2 brow styling sessions
  - 1 professional makeup session
  - Before/after photoshoot
  - Personalized beauty consultation

#### Fitness Transformation Package
- **Product ID**: com.mariiahub.ios.package.fitness.transformation
- **Type**: Non-Consumable
- **Price**: $399.99 USD / 1,799.99 PLN
- **Contents**:
  - 12 personal training sessions
  - Custom workout plan
  - Nutrition guidance
  - Progress tracking
  - Before/after assessment

#### Wedding Package
- **Product ID**: com.mariiahub.ios.package.wedding
- **Type**: Non-Consumable
- **Price**: $599.99 USD / 2,699.99 PLN
- **Contents**:
  - Bridal makeup and hair
  - Bridal party makeup (3 people)
  - Trial session
  - On-location service
  - Touch-up kit

### 3. Premium Features (Add-ons)

#### Advanced Analytics
- **Product ID**: com.mariiahub.ios.feature.analytics
- **Type**: Non-Consumable
- **Price**: $9.99 USD / 44.99 PLN
- **Features**:
  - Detailed progress analytics
  - Trend analysis
  - Goal tracking
  - Export capabilities

#### Virtual Consultations
- **Product ID**: com.mariiahub.ios.feature.virtual.consultation
- **Type**: Consumable (5-pack)
- **Price**: $149.99 USD / 699.99 PLN
- **Contents**: 5 virtual consultation sessions

#### Priority Booking
- **Product ID**: com.mariiahub.ios.feature.priority.booking
- **Type**: Non-Consumable
- **Price**: $14.99 USD / 69.99 PLN
- **Features**:
  - 24-hour priority booking window
  - Exclusive time slot access
  - Reduced wait times

### 4. Gift Cards and Credits

#### Gift Card Credits
- **Product ID**: com.mariiahub.ios.gift.50credits
- **Type**: Consumable
- **Price**: $50.00 USD / 229.99 PLN
- **Contents**: 50 service credits

- **Product ID**: com.mariiahub.ios.gift.100credits
- **Type**: Consumable
- **Price**: $100.00 USD / 449.99 PLN
- **Contents**: 100 service credits

#### Birthday Package
- **Product ID**: com.mariiahub.ios.gift.birthday
- **Type**: Consumable
- **Price**: $79.99 USD / 359.99 PLN
- **Contents**:
  - Birthday discount vouchers
  - Complimentary consultation
  - Priority booking access

## App Store Connect Configuration

### 1. Setting Up Products

#### Product Information Template
```json
{
  "productId": "com.mariiahub.ios.premium.monthly",
  "type": "autoRenewableSubscription",
  "state": "readyForReview",
  "pricing": {
    "baseCountry": "US",
    "price": 19.99,
    "pricePerLocale": {
      "US": 19.99,
      "PL": 89.99,
      "GB": 17.99,
      "DE": 18.99
    }
  },
  "localizations": {
    "en": {
      "displayName": "Mariia Hub Premium",
      "description": "Unlock premium features for your beauty and fitness journey"
    },
    "pl": {
      "displayName": "Mariia Hub Premium",
      "description": "Odblokuj premium funkcje dla swojej podróży piękna i fitnessu"
    }
  }
}
```

### 2. Subscription Groups Configuration

#### Premium Subscription Group
- **Subscription Group ID**: com.mariiahub.ios.subscriptions.premium
- **Display Name**: Premium Plans
- **Products in Group**:
  - Mariia Hub Premium (Monthly)
  - Mariia Hub Premium (Annual)

#### Professional Subscription Group
- **Subscription Group ID**: com.mariiahub.ios.subscriptions.professional
- **Display Name**: Professional Plans
- **Products in Group**:
  - Beauty Professional Subscription
  - Fitness Professional Subscription

### 3. Promotional Offers

#### Free Trial Offers
**Mariia Hub Premium Trial**:
- **Duration**: 7 days
- **Offer Type**: Free Trial
- **Eligibility**: New users only
- **Product**: com.mariiahub.ios.premium.monthly

#### Introductory Offers
**First-Time User Discount**:
- **Duration**: 3 months
- **Discount**: 50% off
- **Type**: Promotional Offer
- **Eligibility**: New premium subscribers
- **Product**: com.mariiahub.ios.premium.monthly

#### Promotional Codes
**Influencer Codes**:
- **Code**: INFLUENCER20
- **Discount**: 20% off first month
- **Usage Limit**: Single use per customer
- **Duration**: 30 days

**Student Discount**:
- **Code**: STUDENT15
- **Discount**: 15% off monthly subscription
- **Verification Required**: Student ID verification
- **Duration**: Ongoing with verification

## Technical Implementation

### 1. StoreKit Configuration

#### Product Identifiers
```swift
enum ProductIdentifier: String, CaseIterable {
    // Premium Subscriptions
    case premiumMonthly = "com.mariiahub.ios.premium.monthly"
    case premiumAnnual = "com.mariiahub.ios.premium.annual"

    // Professional Subscriptions
    case beautyProfessional = "com.mariiahub.ios.beauty.professional"
    case fitnessProfessional = "com.mariiahub.ios.fitness.professional"

    // Service Packages
    case ultimateBeautyPackage = "com.mariiahub.ios.package.beauty.ultimate"
    case fitnessTransformation = "com.mariiahub.ios.package.fitness.transformation"
    case weddingPackage = "com.mariiahub.ios.package.wedding"

    // Premium Features
    case advancedAnalytics = "com.mariiahub.ios.feature.analytics"
    case virtualConsultations = "com.mariiahub.ios.feature.virtual.consultation"
    case priorityBooking = "com.mariiahub.ios.feature.priority.booking"

    // Gift Cards
    case gift50Credits = "com.mariiahub.ios.gift.50credits"
    case gift100Credits = "com.mariiahub.ios.gift.100credits"
    case birthdayPackage = "com.mariiahub.ios.gift.birthday"
}
```

#### StoreKit Manager
```swift
import StoreKit
import RevenueCat

class IAPManager: ObservableObject {
    @Published var purchasedProducts: [Product] = []
    @Published var subscriptionStatus: [String: Product.SubscriptionInfo.Status] = [:]

    private let products: [Product] = []

    init() {
        Task {
            await initializeProducts()
            await updatePurchasedProducts()
        }
    }

    func initializeProducts() async {
        do {
            self.products = try await Product.products(for: ProductIdentifier.allCases.map(\.rawValue))
        } catch {
            print("Failed to load products: \(error)")
        }
    }

    func purchase(_ product: Product) async throws -> Transaction? {
        let result = try await product.purchase()

        switch result {
        case .success(let verification):
            let transaction = try checkVerified(verification)
            await updatePurchasedProducts()
            await transaction.finish()
            return transaction
        case .userCancelled:
            return nil
        case .pending:
            // Handle pending transaction
            return nil
        @unknown default:
            return nil
        }
    }

    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified:
            throw IAPError.verificationFailed
        case .verified(let safe):
            return safe
        }
    }

    func isPurchased(_ product: Product) -> Bool {
        purchasedProducts.contains(product)
    }

    func hasActiveSubscription(_ productId: ProductIdentifier) -> Bool {
        guard let status = subscriptionStatus[productId.rawValue] else { return false }
        switch status {
        case .subscribed, .inGracePeriod, .inBillingRetryPeriod:
            return true
        case .expired, .revoked, .inBillingRetryPeriod:
            return false
        }
    }
}
```

### 2. Receipt Validation

#### Server-Side Validation
```typescript
// receipt-validation.ts
import { validateReceipt } from 'apple-app-store-receipt-validator';

export async function validateAppStoreReceipt(
  receiptData: string,
  productId: string
): Promise<ValidationResult> {
  try {
    const validation = await validateReceipt({
      receipt: receiptData,
      password: process.env.APP_STORE_SHARED_SECRET!,
      environment: ENVIRONMENT === 'production' ? 'production' : 'sandbox'
    });

    // Check if the receipt contains the purchased product
    const inAppPurchase = validation.latest_receipt_info?.find(
      (purchase) => purchase.product_id === productId
    );

    if (!inAppPurchase) {
      return { valid: false, reason: 'Product not found in receipt' };
    }

    // Check subscription status
    if (inAppPurchase.expires_date_ms) {
      const expirationDate = new Date(parseInt(inAppPurchase.expires_date_ms));
      if (expirationDate < new Date()) {
        return { valid: false, reason: 'Subscription expired' };
      }
    }

    return {
      valid: true,
      transactionId: inAppPurchase.transaction_id,
      originalTransactionId: inAppPurchase.original_transaction_id,
      expirationDate: inAppPurchase.expires_date_ms ?
        new Date(parseInt(inAppPurchase.expires_date_ms)) : null
    };

  } catch (error) {
    console.error('Receipt validation failed:', error);
    return { valid: false, reason: 'Validation error' };
  }
}
```

### 3. Subscription Management

#### Subscription Status Tracking
```swift
class SubscriptionManager: ObservableObject {
    @Published var currentSubscription: SubscriptionInfo?
    @Published var isEligibleForTrial = true
    @Published var renewalDate: Date?

    func checkSubscriptionStatus() async {
        guard let subscription = await getActiveSubscription() else {
            self.currentSubscription = nil
            return
        }

        self.currentSubscription = subscription
        self.renewalDate = subscription.expirationDate
        self.isEligibleForTrial = false
    }

    func getActiveSubscription() async -> SubscriptionInfo? {
        // Implementation for checking active subscriptions
        return nil
    }

    func cancelSubscription() {
        // Open App Store subscription management
        if let url = URL(string: "https://apps.apple.com/account/subscriptions") {
            UIApplication.shared.open(url)
        }
    }

    func restorePurchases() async {
        // Implement purchase restoration
        await IAPManager.shared.updatePurchasedProducts()
    }
}
```

## Compliance and Best Practices

### 1. App Store Guidelines Compliance

#### Required Information
- Clear description of all in-app purchases
- Privacy policy link
- Terms of service link
- Contact information
- Subscription management instructions

#### User Experience Guidelines
- Clear pricing information
- No deceptive or confusing interfaces
- Easy subscription cancellation
- Transparent renewal policies

### 2. Legal Compliance

#### GDPR Considerations
- Clear consent for payment processing
- Data minimization for purchase data
- Right to access and delete purchase history
- Secure payment processing

#### Consumer Protection
- Clear refund policy
- No auto-renewal without explicit consent
- Easy cancellation process
- Transparent terms and conditions

### 3. Pricing Strategy

#### Tier Structure
- **Free**: Basic booking functionality
- **Premium**: $19.99/month (Full access)
- **Professional**: $39.99-$49.99/month (Business tools)
- **Packages**: $299.99-$599.99 (Service bundles)

#### Localization Pricing
```swift
struct PriceLocalization {
    let country: String
    let currency: String
    let basePrice: Double
    let localizedPrice: String

    static let premiumMonthly = [
        PriceLocalization(country: "US", currency: "USD", basePrice: 19.99, localizedPrice: "$19.99"),
        PriceLocalization(country: "PL", currency: "PLN", basePrice: 89.99, localizedPrice: "89,99 zł"),
        PriceLocalization(country: "GB", currency: "GBP", basePrice: 17.99, localizedPrice: "£17.99"),
        PriceLocalization(country: "DE", currency: "EUR", basePrice: 18.99, localizedPrice: "18,99 €"),
        PriceLocalization(country: "FR", currency: "EUR", basePrice: 19.99, localizedPrice: "19,99 €")
    ]
}
```

## Testing and Quality Assurance

### 1. Sandbox Testing

#### Test Account Setup
- Create sandbox test users in App Store Connect
- Test various purchase scenarios
- Verify subscription flows
- Test receipt validation

#### Test Scenarios
- Successful purchases
- Failed purchases
- Subscription renewals
- Cancellation flows
- Receipt validation failures
- Network error handling

### 2. Production Monitoring

#### Key Metrics
- Purchase conversion rate
- Subscription retention rate
- Revenue per user
- Failed purchase rate
- Customer support tickets related to IAP

#### Alerting Setup
- Revenue drop alerts
- High failure rate alerts
- Server validation errors
- Subscription status issues

## Customer Support

### 1. Purchase Issues

#### Common Problems
- Purchase not recognized
- Subscription not activating
- Incorrect charges
- Refund requests
- Technical difficulties

#### Support Workflow
1. Verify purchase via receipt validation
2. Check subscription status
3. Restore purchases if needed
4. Process refunds if appropriate
5. Escalate to Apple if necessary

### 2. Documentation

#### User-Facing Documentation
- How to purchase and manage subscriptions
- Subscription cancellation instructions
- Troubleshooting common issues
- Contact information for support

#### Developer Documentation
- IAP implementation guide
- Testing procedures
- Troubleshooting guide
- Monitoring and alerting setup

---

This comprehensive IAP setup ensures that Mariia Hub has a robust, user-friendly, and compliant in-app purchase system that supports various revenue streams while maintaining excellent user experience.