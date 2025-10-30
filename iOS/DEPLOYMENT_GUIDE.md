# Mariia Hub iOS App Deployment Guide

## Overview
This guide covers the complete deployment process for the luxury Mariia Hub iOS app, including development setup, testing, and App Store submission.

## Prerequisites
- Xcode 14.0+
- iOS 15.0+ target
- macOS Monterey or later
- Apple Developer Account (Paid)
- Physical iOS device for testing

## Architecture Overview
- **Main App**: SwiftUI + Combine architecture with luxury design
- **Watch App**: Native watchOS app for quick access and notifications
- **Backend Integration**: Supabase for data persistence and real-time sync
- **Payment**: Apple Pay + Stripe integration
- **Authentication**: Biometric (Face ID/Touch ID) + Supabase Auth
- **Health Integration**: HealthKit for fitness tracking

## Setup Instructions

### 1. Environment Configuration

#### Xcode Project Setup
```bash
# Clone the repository
git clone https://github.com/your-org/mariia-hub-unified.git
cd mariia-hub-unified/iOS

# Install dependencies (using Swift Package Manager)
# Dependencies are configured in Package.swift
```

#### Configuration Files
1. **Configuration.xcconfig**: Update with your specific values
   - `DEVELOPMENT_TEAM`: Your Apple Developer Team ID
   - `PRODUCT_BUNDLE_IDENTIFIER`: Your app bundle ID
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `APPLE_PAY_MERCHANT_ID`: Your Apple Pay merchant ID

2. **Info.plist**: Review and update as needed
   - Bundle identifiers
   - Usage descriptions for permissions
   - Background modes
   - App Transport Security settings

#### Supabase Setup
```swift
// In SupabaseManager.swift
let supabaseURL = URL(string: "https://your-project-id.supabase.co")!
let supabaseKey = "your-production-anon-key"
```

#### Apple Pay Setup
1. Enable Apple Pay in Xcode: Capabilities → Apple Pay
2. Configure merchant ID in Apple Developer Portal
3. Add merchant ID to Configuration.xcconfig

#### HealthKit Setup
1. Enable HealthKit in Xcode: Capabilities → HealthKit
2. Add usage descriptions to Info.plist
3. Test with physical device (not simulator)

### 2. Development Build

#### Local Development
```bash
# Open in Xcode
open MariiaHub.xcodeproj

# Build and run on simulator/device
# Use iOS Simulator for UI testing
# Use physical device for HealthKit/Apple Pay testing
```

#### Environment Variables
Development environment uses local Supabase:
```
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-local-anon-key
```

### 3. Testing

#### Unit Testing
```bash
# Run unit tests
xcodebuild test -scheme MariiaHub -destination 'platform=iOS Simulator,name=iPhone 14'

# Run with coverage
xcodebuild test -scheme MariiaHub -enableCodeCoverage YES
```

#### UI Testing
```bash
# Run UI tests
xcodebuild test -scheme MariiaHubUITests -destination 'platform=iOS Simulator,name=iPhone 14'
```

#### Device Testing
Required for features:
- **Apple Pay**: Physical device with test cards
- **HealthKit**: Physical device with health data
- **Biometrics**: Physical device with Face ID/Touch ID
- **Push Notifications**: Physical device

#### Performance Testing
- Test on various iPhone models
- Monitor memory usage
- Test network conditions (3G, 4G, WiFi)
- Test with different data loads

### 4. Build Configuration

#### Development Build
```bash
# Debug configuration
xcodebuild -scheme MariiaHub -configuration Debug -sdk iphonesimulator build
```

#### Production Build
```bash
# Release configuration
xcodebuild -scheme MariiaHub -configuration Release -sdk iphoneos build
```

#### Archive for App Store
```bash
# Create archive
xcodebuild -scheme MariiaHub -configuration Release -sdk iphoneos archive \
  -archivePath ./build/MariiaHub.xcarchive
```

### 5. App Store Submission

#### Pre-Submission Checklist
- [ ] App Store metadata prepared
- [ ] Screenshots for all device sizes
- [ ] App icon in all required sizes
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Marketing URL
- [ ] App category selected
- [ ] Age rating determined
- [ ] Export compliance completed
- [ ] Signing certificates configured
- [ ] Provisioning profiles updated

#### Metadata Requirements
**App Information:**
- Name: Mariia Hub - Beauty & Fitness
- Subtitle: Luxury Booking in Warsaw
- Description: Premium beauty and fitness booking platform
- Keywords: beauty, fitness, booking, Warsaw, luxury
- Support URL: https://mariaborysevych.com/support
- Marketing URL: https://mariaborysevych.com

**Screenshots Required:**
- iPhone 6.7" Display: 2 screenshots
- iPhone 6.5" Display: 2 screenshots
- iPhone 5.5" Display: 2 screenshots
- iPad Pro (12.9-inch): 2 screenshots
- iPad Pro (11-inch): 2 screenshots

#### App Store Review Guidelines
- **Guideline 1.1**: App completeness
- **Guideline 1.2**: Metadata accuracy
- **Guideline 2.1**: App functionality
- **Guideline 2.3**: Performance
- **Guideline 3.1**: Payments (Apple Pay compliance)
- **Guideline 5.1.1**: Data collection and privacy
- **Guideline 5.1.2**: Health data (HealthKit compliance)

### 6. Continuous Integration

#### GitHub Actions Workflow
```yaml
name: iOS CI
on: [push, pull_request]

jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - name: Select Xcode
        run: sudo xcode-select -switch /Applications/Xcode.app/Contents/Developer
      - name: Build and Test
        run: |
          xcodebuild clean build test \
            -project MariiaHub.xcodeproj \
            -scheme MariiaHub \
            -destination 'platform=iOS Simulator,name=iPhone 14'
```

#### Automated Testing
- Unit tests on every push
- UI tests on pull requests
- Performance benchmarks
- Security scanning
- Code coverage reporting

### 7. Release Process

#### Version Management
- Use semantic versioning (MAJOR.MINOR.PATCH)
- Update build number for each submission
- Maintain changelog in release notes

#### Beta Testing
1. **TestFlight Internal Testing**
   - Development team testing
   - Early bug detection

2. **TestFlight External Testing**
   - Limited group of beta testers
   - Real-world usage testing

#### Release Steps
1. Final testing on release candidate
2. Update App Store metadata
3. Submit to App Store Review
4. Monitor review status
5. Release upon approval

### 8. Post-Launch Monitoring

#### Analytics
- User acquisition metrics
- App store performance
- User engagement data
- Conversion rates
- Error reporting

#### Crash Reporting
- Set up crash analytics
- Monitor crash rates
- Prioritize bug fixes
- Update releases regularly

#### Performance Monitoring
- API response times
- App launch times
- Memory usage
- Network performance

### 9. Maintenance

#### Regular Updates
- Monthly bug fix releases
- Quarterly feature updates
- Annual major releases
- Security patches

#### Dependency Management
- Regular dependency updates
- Security vulnerability scanning
- Compatibility testing
- Documentation updates

### 10. Troubleshooting

#### Common Issues
1. **Build Failures**
   - Check Xcode version compatibility
   - Verify bundle identifiers
   - Update provisioning profiles

2. **Supabase Connection Issues**
   - Verify URL and keys
   - Check network connectivity
   - Review RLS policies

3. **Apple Pay Issues**
   - Verify merchant ID configuration
   - Check certificate setup
   - Test with physical device

4. **HealthKit Issues**
   - Verify user permissions
   - Test with physical device
   - Check data format compatibility

#### Debugging Tools
- Xcode debugger
- Console app for device logs
- Network debugging tools
- Performance instruments

## Support

For deployment issues, contact:
- Development Team: dev@mariaborysevych.com
- Project Manager: pm@mariaborysevych.com
- DevOps Team: ops@mariaborysevych.com

## Resources
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Supabase iOS Documentation](https://supabase.com/docs/reference/swift)
- [SwiftUI Documentation](https://developer.apple.com/documentation/swiftui/)
- [HealthKit Documentation](https://developer.apple.com/documentation/healthkit/)
- [Apple Pay Documentation](https://developer.apple.com/apple-pay/)