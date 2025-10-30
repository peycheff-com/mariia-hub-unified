# iOS Certificates and Provisioning Profiles Setup Guide

## Overview

This guide walks through the complete setup of iOS certificates and provisioning profiles for Mariia Hub distribution through the App Store.

## Prerequisites

### Apple Developer Program
- Active Apple Developer Program membership ($99/year)
- Team Admin or Account Holder role
- Access to App Store Connect

### Required Tools
- Xcode 15.0+
- iOS 17.0+ devices for testing
- macOS computer for development
- Apple ID with Developer Program enrollment

## Step 1: Development Certificates

### 1.1 Generate Development Certificate
```bash
# Open Keychain Access
open /Applications/Utilities/Keychain\ Access.app

# Generate Certificate Signing Request (CSR)
# In Keychain Access: Keychain Access > Certificate Assistant > Request a Certificate from a Certificate Authority
# Enter: Mariia Hub Development
# Email: your-email@mariaborysevych.com
# Save to disk
```

### 1.2 Upload CSR to Developer Portal
1. Sign in to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to Certificates, Identifiers & Profiles
3. Select Certificates > All
4. Click (+) to add new certificate
5. Choose Apple Development certificate type
6. Upload the CSR file created in step 1.1
7. Download the generated certificate (.cer file)
8. Double-click to install in Keychain Access

### 1.3 Verify Development Certificate
```bash
# List installed certificates
security find-certificate -c "Apple Development" -p | openssl x509 -text
```

## Step 2: Distribution Certificates

### 2.1 Generate App Store Distribution Certificate
1. In Developer Portal, go to Certificates > All
2. Click (+) to add new certificate
3. Choose App Store and Ad Hoc distribution type
4. Upload CSR (can reuse the one from Step 1.1 or create new)
5. Download the distribution certificate
6. Install in Keychain Access

### 2.2 Backup Certificate
```bash
# Export certificate and private key
# In Keychain Access: Right-click certificate > Export
# Format: .p12
# Set a strong password (store securely)

# Save backup in secure location (not in git)
```

## Step 3: App Identifiers

### 3.1 Create App ID
1. In Developer Portal, go to Identifiers > App IDs
2. Click (+) to register new App ID
3. Configure App ID:
   ```
   Description: Mariia Hub iOS App
   Bundle ID: com.mariiahub.ios
   Platform: iOS
   ```

### 3.2 Configure Capabilities
Enable the following capabilities for Mariia Hub:

#### Core Capabilities
- ✅ **In-App Purchase**: For premium subscriptions and services
- ✅ **Push Notifications**: For appointment reminders and updates
- ✅ **Sign in with Apple**: For user authentication
- ✅ **Associated Domains**: For deep linking and web integration
- ✅ **App Groups**: For data sharing between app and extensions

#### Health & Fitness Capabilities
- ✅ **HealthKit**: For fitness tracking and wellness data
- ✅ **Motion & Fitness**: For activity tracking

#### Payment Capabilities
- ✅ **Apple Pay**: For secure payment processing
- ✅ **Wallet**: For loyalty cards and tickets

#### Background Capabilities
- ✅ **Background App Refresh**: For syncing data
- ✅ **Background Processing**: For background tasks
- ✅ **Remote Notifications**: For silent notifications

#### Watch & Car Capabilities
- ✅ **WatchKit**: For Apple Watch companion app
- ✅ **CarPlay**: For hands-free access

#### Other Capabilities
- ✅ **iCloud**: For data synchronization
- ✅ **Game Center**: For achievements and leaderboards (future feature)
- ✅ **Maps**: For location-based services
- ✅ **SiriKit**: For voice commands
- ✅ **User Notifications**: For rich notifications

### 3.3 App ID Configuration Details
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>application-identifier</key>
    <string>YOUR_TEAM_ID.com.mariiahub.ios</string>
    <key>keychain-access-groups</key>
    <array>
        <string>YOUR_TEAM_ID.com.mariiahub.ios</string>
    </array>
    <key>aps-environment</key>
    <string>production</string>
    <key>com.apple.developer.associated-domains</key>
    <array>
        <string>applinks:mariaborysevych.com</string>
    </array>
    <key>com.apple.developer.healthkit</key>
    <true/>
    <key>com.apple.developer.healthkit.access</key>
    <array/>
    <key>com.apple.developer.in-app-payments</key>
    <array>
        <string>merchant.com.mariiahub.ios</string>
    </array>
    <key>com.apple.developer.parent-application-identifiers</key>
    <array>
        <string>YOUR_TEAM_ID.com.mariiahub.ios</string>
    </array>
    <key>com.apple.developer.payment-pass-provisioning</key>
    <true/>
    <key>com.apple.developer.pushkit</key>
    <true/>
    <key>com.apple.developer.siri</key>
    <true/>
    <key>com.apple.developer.ubiquity-kvstore-identifier</key>
    <string>YOUR_TEAM_ID.com.mariiahub.ios</string>
    <key>com.apple.developer.watchkit</key>
    <array>
        <dict>
            <key>WKExtensionDelegateRunnable</key>
            <true/>
        </dict>
    </array>
</dict>
</plist>
```

## Step 4: Development Provisioning Profiles

### 4.1 Create Development Profile
1. In Developer Portal, go to Profiles > All
2. Click (+) to add new profile
3. Choose iOS App Development profile type
4. Select App ID: com.mariiahub.ios
5. Select development certificates
6. Select test devices (include development and test iPhones/iPads)
7. Name profile: Mariia Hub Development Profile
8. Download and install profile

### 4.2 Add Test Devices
Add UDIDs of test devices:
```bash
# Find device UDID
# Connect device via USB and run:
idevice_id -l
# Or use Xcode: Window > Devices and Simulators
```

Required test devices for Mariia Hub:
- iPhone 15 Pro (latest iOS version)
- iPhone 14 (for compatibility testing)
- iPad Pro (for iPad layout testing)
- Apple Watch Series 9 (for Watch app testing)

## Step 5: Distribution Provisioning Profiles

### 5.1 Create App Store Distribution Profile
1. In Developer Portal, go to Profiles > All
2. Click (+) to add new profile
3. Choose App Store distribution type
4. Select App ID: com.mariiahub.ios
5. Select App Store distribution certificate
6. Name profile: Mariia Hub App Store Profile
7. Download and install profile

### 5.2 Create Ad Hoc Distribution Profile (Optional)
For beta testing outside TestFlight:
1. Choose Ad Hoc distribution type
2. Select same App ID and distribution certificate
3. Add beta tester device UDIDs
4. Name profile: Mariia Hub Ad Hoc Profile

## Step 6: Xcode Configuration

### 6.1 Project Settings
```swift
// In Xcode Project Navigator > Project > Info
// Set Bundle Identifier to: com.mariiahub.ios

// Signing & Capabilities tab:
// - Automatically manage signing: ✅
// - Team: Your Developer Team
// - Provisioning Profile: Select appropriate profile

// Capabilities to enable (matching App ID):
// - In-App Purchase
// - Push Notifications
// - Sign in with Apple
// - Associated Domains
// - HealthKit
// - Apple Pay
// - Background Modes
// - WatchKit App
// - CarPlay
```

### 6.2 Info.plist Updates
```xml
<!-- Add to Info.plist for new capabilities -->
<key>NSHealthShareUsageDescription</key>
<string>Mariia Hub needs access to your health data to track fitness progress and provide personalized workout recommendations.</string>

<key>NSHealthUpdateUsageDescription</key>
<string>Mariia Hub needs permission to save workout data to HealthKit when you complete fitness sessions.</string>

<key>NSPaymentAuthorizationUsageDescription</key>
<string>Mariia Hub uses Apple Pay to provide secure and convenient payment processing for your appointments.</string>

<key>NSCalendarsUsageDescription</key>
<string>Mariia Hub needs calendar access to add your appointments and send you reminders.</string>

<key>NSMotionUsageDescription</key>
<string>Mariia Hub uses motion data to track your fitness activities and provide accurate workout measurements.</string>

<key>NSRemindersUsageDescription</key>
<string>Mariia Hub needs reminders access to help you stay on track with your beauty and fitness goals.</string>

<key>NSSiriUsageDescription</key>
<string>Mariia Hub uses Siri to let you book appointments and check your schedule using voice commands.</string>
```

## Step 7: App Store Connect Configuration

### 7.1 Create App Record
1. Sign in to [App Store Connect](https://appstoreconnect.apple.com)
2. Click My Apps > (+) to add new app
3. App Information:
   ```
   Name: Mariia Hub - Beauty & Fitness
   Primary Language: English
   Bundle ID: com.mariiahub.ios
   SKU: MARIIA-HUB-IOS-001
   Platform: iOS
   ```

### 7.2 App Store Information
Configure all required fields in App Store Connect:
- App privacy policy URL
- Category information
- Age rating
- Pricing and availability
- App review information

## Step 8: Certificate Management Automation

### 8.1 Fastlane Setup
```ruby
# Fastfile
platform :ios do
  desc "Install certificates and provisioning profiles"
  lane :certificates do
    match(
      app_identifier: "com.mariiahub.ios",
      type: "development",
      readonly: true
    )

    match(
      app_identifier: "com.mariiahub.ios",
      type: "appstore",
      readonly: true
    )
  end

  desc "Update provisioning profiles"
  lane :update_profiles do
    get_provisioning_profile(
      app_identifier: "com.mariiahub.ios",
      provisioning_name: "Mariia Hub Development Profile",
      platform: "ios"
    )
  end
end
```

### 8.2 Certificate Monitoring Script
```bash
#!/bin/bash
# certificates-check.sh

# Check certificate expiration dates
echo "Checking iOS certificate expiration dates..."

# Development certificates
security find-certificate -c "Apple Development" -p | openssl x509 -enddate -noout

# Distribution certificates
security find-certificate -c "Apple Distribution" -p | openssl x509 -enddate -noout

# Check provisioning profiles
ls ~/Library/MobileDevice/Provisioning\ Profiles/ | while read profile; do
    echo "Profile: $profile"
    security cms -D -i ~/Library/MobileDevice/Provisioning\ Profiles/$profile | plutil -p -
done
```

## Step 9: Security Best Practices

### 9.1 Certificate Security
- Store private keys securely in encrypted keychain
- Use strong passwords for .p12 exports
- Never commit certificates or profiles to version control
- Regularly rotate certificates (before expiration)
- Limit access to certificates to necessary team members

### 9.2 Backup Strategy
```bash
# Create secure backup of certificates and profiles
mkdir -p ~/Certificates_Backup/$(date +%Y%m%d)
security export -k ~/Library/Keychains/login.keychain-db -t certs -f pkcs12 -o ~/Certificates_Backup/$(date +%Y%m%d)/mariia_hub_certificates.p12

# Backup provisioning profiles
cp -r ~/Library/MobileDevice/Provisioning\ Profiles/* ~/Certificates_Backup/$(date +%Y%m%d)/

# Encrypt backup
zip -er ~/Certificates_Backup/mariia_hub_backup_$(date +%Y%m%d).zip ~/Certificates_Backup/$(date +%Y%m%d)/
```

### 9.3 Monitoring and Alerts
Set up alerts for:
- Certificate expiration (30 days before)
- Provisioning profile expiration
- App ID changes
- Team membership changes

## Step 10: Troubleshooting

### 10.1 Common Issues

#### Certificate Not Found
```bash
# Check if certificate is installed
security find-certificate -c "Apple Development" | grep "iOS Distribution"

# Reinstall certificate if missing
# Download from Developer Portal and double-click
```

#### Provisioning Profile Invalid
```bash
# Remove old profiles
rm ~/Library/MobileDevice/Provisioning\ Profiles/*.mobileprovision

# Download fresh profiles from Developer Portal
# Or use fastlane to update automatically
```

#### Build Signing Issues
```bash
# Clean build folder
xcodebuild clean -workspace MariiaHub.xcworkspace -scheme MariiaHub

# Reset signing in Xcode
# Project Settings > Signing & Capabilities > Reset to Automatically Manage Signing
```

#### Push Notifications Not Working
```bash
# Verify push notification entitlements
codesign -d --entitlements - /path/to/MariiaHub.app

# Check APNS certificate is valid
# In Developer Portal: Check Push Notifications certificate expiration
```

### 10.2 Debug Information
```bash
# Get detailed certificate information
security find-certificate -c "Apple Distribution" -p | openssl x509 -text -noout

# Check provisioning profile details
security cms -D -i /path/to/profile.mobileprovision | plutil -p -

# Verify app signing
codesign -dv --verbose=4 /path/to/MariiaHub.app
```

## Maintenance Schedule

### Monthly
- Check certificate expiration dates
- Review provisioning profile validity
- Test certificate renewal process

### Quarterly
- Update certificate passwords
- Backup certificates and profiles
- Review team member access

### Annually
- Renew Apple Developer Program membership
- Audit all certificates and profiles
- Update security protocols

---

This comprehensive setup ensures Mariia Hub has proper certificates and provisioning profiles for both development and App Store distribution. Regular maintenance and monitoring prevents deployment issues and ensures continuous app availability.