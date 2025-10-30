# Smartwatch Companion Apps Deployment Guide

## Overview

This guide covers the deployment and optimization strategies for the Mariia Hub smartwatch companion apps, including Apple Watch (watchOS) and Wear OS applications.

## Table of Contents

1. [Apple Watch Deployment](#apple-watch-deployment)
2. [Wear OS Deployment](#wear-os-deployment)
3. [Cross-Platform Synchronization](#cross-platform-synchronization)
4. [Performance Optimization](#performance-optimization)
5. [Health Integration Setup](#health-integration-setup)
6. [Luxury Features Configuration](#luxury-features-configuration)
7. [Testing Strategies](#testing-strategies)
8. [Monitoring and Analytics](#monitoring-and-analytics)

## Apple Watch Deployment

### Prerequisites

- Xcode 15.0 or later
- iOS 17.0 or later deployment target
- watchOS 10.0 or later
- Apple Developer account
- Physical Apple Watch for testing (recommended)

### Build Configuration

#### iOS App Target Settings

```swift
// Info.plist configurations required for Apple Watch
<key>WKWatchKitApp</key>
<true/>
<key>WKExtensionDelegateClassName</key>
<string>$(PRODUCT_MODULE_NAME).ExtensionDelegate</string>
```

#### Watch App Extension Settings

```swift
// Watch Extension Info.plist
<key>NSExtension</key>
<dict>
    <key>NSExtensionPointIdentifier</key>
    <string>com.apple.watchkit</string>
    <key>WKAppBundleIdentifier</key>
    <string>com.mariiahub.watchkitapp</string>
    <key>WKExtensionDelegateClassName</key>
    <string>$(PRODUCT_MODULE_NAME).ExtensionDelegate</string>
</dict>
```

### Deployment Steps

1. **Configure Signing Certificates**
   ```bash
   # Generate provisioning profiles
   xcodebuild -showBuildSettings -scheme MariiaHubWatch
   ```

2. **Build for Distribution**
   ```bash
   # Archive the app
   xcodebuild -scheme MariiaHubWatch -configuration Release archive
   ```

3. **Submit to App Store Connect**
   - Create new app in App Store Connect
   - Upload watchOS binary
   - Configure app metadata
   - Submit for review

### Complications Configuration

```swift
// Info.plist for complications
<key>CLKComplicationPrincipalClass</key>
<string>ComplicationController</string>
<key>CLKComplicationSupportedFamilies</key>
<array>
    <string>CLKComplicationFamilyCircularSmall</string>
    <string>CLKComplicationFamilyModularSmall</string>
    <string>CLKComplicationFamilyModularLarge</string>
    <string>CLKComplicationFamilyUtilitarianSmall</string>
    <string>CLKComplicationFamilyGraphicCorner</string>
    <string>CLKComplicationFamilyGraphicCircular</string>
    <string>CLKComplicationFamilyGraphicRectangular</string>
</array>
```

## Wear OS Deployment

### Prerequisites

- Android Studio Hedgehog or later
- Wear OS 4.0 or later
- Google Play Developer account
- Physical Wear OS device for testing

### Build Configuration

#### Gradle Configuration

```kotlin
// build.gradle (Wear OS module)
android {
    compileSdk 34

    defaultConfig {
        applicationId "com.mariiahub.wear"
        minSdk 30
        targetSdk 34
        versionCode 1
        versionName "1.0.0"

        wearAppConfig {
            wearApp {
                // Prevents wear app from being embedded in mobile app
                enabled false
            }
        }
    }

    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }

    kotlinOptions {
        jvmTarget = '1.8'
    }

    buildFeatures {
        compose true
    }

    composeOptions {
        kotlinCompilerExtensionVersion '1.5.4'
    }
}

dependencies {
    implementation "androidx.wear.compose:compose-material:1.2.1"
    implementation "androidx.wear.compose:compose-foundation:1.2.1"
    implementation "androidx.wear.compose:compose-navigation:1.2.1"
    implementation "androidx.wear.tiles:tiles:1.2.0"
    implementation "androidx.wear.tiles:tiles-material:1.2.0"
    implementation "androidx.wear.watchface:watchface:1.2.0"
    implementation "androidx.health:health-services-client:1.0.0-rc01"
    implementation "com.google.android.gms:play-services-wearable:18.1.0"
    implementation "org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.7.3"
}
```

### Deployment Steps

1. **Generate Signed APK/AAB**
   ```bash
   ./gradlew assembleRelease
   # or for Play Store
   ./gradlew bundleRelease
   ```

2. **Upload to Google Play Console**
   - Create new Wear OS app listing
   - Upload signed bundle
   - Configure store listing
   - Set up pricing and distribution

3. **Configure Tiles Service**
   ```xml
   <!-- AndroidManifest.xml -->
   <service
       android:name=".domain.tiles.MariiaHubTileService"
       android:label="@string/app_name"
       android:icon="@drawable/ic_launcher"
       android:exported="true">
       <intent-filter>
           <action android:name="androidx.wear.tiles.action.BIND_TILE_PROVIDER" />
       </intent-filter>
   </service>
   ```

## Cross-Platform Synchronization

### Database Schema

```sql
-- User devices table for cross-platform sync
CREATE TABLE user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL UNIQUE,
    platform TEXT NOT NULL CHECK (platform IN ('web', 'ios', 'android', 'watchos', 'wearos')),
    device_name TEXT,
    app_version TEXT,
    os_version TEXT,
    push_token TEXT,
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    capabilities JSONB DEFAULT '{}',
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sync events table
CREATE TABLE sync_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Health data sync
CREATE TABLE health_data_sync (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    data_type TEXT NOT NULL,
    health_data JSONB NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Real-time Sync Setup

```typescript
// Supabase real-time subscriptions
import { supabase } from '@/integrations/supabase/client';

const setupRealtimeSync = () => {
  // Listen for sync events
  const syncChannel = supabase
    .channel('sync_events')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sync_events' },
      (payload) => handleSyncEvent(payload)
    )
    .subscribe();

  // Listen for health data updates
  const healthChannel = supabase
    .channel('health_data')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'health_data_sync' },
      (payload) => handleHealthDataUpdate(payload)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(syncChannel);
    supabase.removeChannel(healthChannel);
  };
};
```

## Performance Optimization

### Apple Watch Optimization

```swift
// Optimized complications with caching
class ComplicationController: NSObject, CLKComplicationDataSource {
    private let cache = ComplicationCache()
    private let cacheTimeout: TimeInterval = 300 // 5 minutes

    func getCurrentTimelineEntry(for complication: CLKComplication, withHandler handler: @escaping (CLKComplicationTimelineEntry?) -> Void) {
        Task {
            let entry = await getCachedOrFetchTimelineEntry(for: complication)
            handler(entry)
        }
    }

    private func getCachedOrFetchTimelineEntry(for complication: CLKComplication) async -> CLKComplicationTimelineEntry {
        if let cached = cache.getEntry(for: complication.family),
           Date().timeIntervalSince(cached.timestamp) < cacheTimeout {
            return cached.entry
        }

        let entry = await fetchTimelineEntry(for: complication)
        cache.setEntry(entry, for: complication.family)
        return entry
    }
}

// Battery-aware operations
extension HapticManager {
    func playBatteryAwareHaptic(_ type: HapticType, batteryLevel: Float) {
        guard batteryLevel > 0.2 else { return } // Skip haptics below 20%
        play(type)
    }
}
```

### Wear OS Optimization

```kotlin
// Efficient data loading with paging
class AppointmentsViewModel(
    private val repository: AppointmentsRepository
) : ViewModel() {

    private val _appointments = MutableLiveData<PagingData<Appointment>>()
    val appointments: LiveData<PagingData<Appointment>> = _appointments

    fun loadAppointments() {
        viewModelScope.launch {
            val pager = Pager(
                config = PagingConfig(pageSize = 10, enablePlaceholders = false),
                pagingSourceFactory = { AppointmentsPagingSource(repository) }
            ).flow.cachedIn(viewModelScope)

            pager.collect { pagingData ->
                _appointments.value = pagingData
            }
        }
    }
}

// Battery optimization for background work
class HealthWorkManager {
    companion object {
        const val WORK_NAME = "HealthSyncWork"
        const val REPEAT_INTERVAL = 15L // minutes
    }

    fun scheduleHealthSync(context: Context) {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .setRequiresBatteryNotLow(true)
            .build()

        val workRequest = PeriodicWorkRequestBuilder<HealthSyncWorker>(
            REPEAT_INTERVAL, TimeUnit.MINUTES
        )
            .setConstraints(constraints)
            .setBackoffCriteria(
                BackoffPolicy.LINEAR,
                30, // minutes
                TimeUnit.MINUTES
            )
            .build()

        WorkManager.getInstance(context)
            .enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.UPDATE,
                workRequest
            )
    }
}
```

## Health Integration Setup

### Apple Health Integration

```swift
// HealthKit permissions setup
import HealthKit

class HealthManager: ObservableObject {
    private let healthStore = HKHealthStore()

    func requestPermissions() async -> Bool {
        guard HKHealthStore.isHealthDataAvailable() else { return false }

        let allDataTypes: Set<HKSampleType> = [
            HKQuantityType.workoutType(),
            HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)!,
            HKQuantityType.quantityType(forIdentifier: .heartRate)!,
            HKQuantityType.quantityType(forIdentifier: .stepCount)!,
            HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning)!,
            HKQuantityType.quantityType(forIdentifier: .bodyMass)!,
            HKQuantityType.quantityType(forIdentifier: .bloodOxygenSaturation)!
        ]

        do {
            try await healthStore.requestAuthorization(toShare: nil, read: allDataTypes)
            return true
        } catch {
            print("Failed to request HealthKit authorization: \(error)")
            return false
        }
    }
}
```

### Google Fit Integration

```kotlin
// Google Fit setup
class GoogleFitManager(private val context: Context) {
    private val fitnessOptions = FitnessOptions.builder()
        .addDataType(DataType.TYPE_STEP_COUNT_DELTA, FitnessOptions.ACCESS_READ)
        .addDataType(DataType.TYPE_HEART_RATE_BPM, FitnessOptions.ACCESS_READ)
        .addDataType(DataType.TYPE_CALORIES_EXPENDED, FitnessOptions.ACCESS_READ)
        .addDataType(DataType.TYPE_DISTANCE_DELTA, FitnessOptions.ACCESS_READ)
        .build()

    fun requestPermissions(): Task<GoogleSignInAccount> {
        return GoogleSignIn.requestPermissions(
            this,
            REQUEST_OAUTH_REQUEST_CODE,
            getGoogleSignInAccount(),
            fitnessOptions
        )
    }

    fun subscribeToHealthData(account: GoogleSignInAccount) {
        Fitness.getRecordingClient(this, account)
            .subscribe(listOf(DataType.TYPE_STEP_COUNT_DELTA))
            .addOnSuccessListener { subscription ->
                Log.i("GoogleFit", "Successfully subscribed to step count")
            }
            .addOnFailureListener { e ->
                Log.w("GoogleFit", "Failed to subscribe to step count", e)
            }
    }
}
```

## Luxury Features Configuration

### Premium Theme System

```typescript
// Luxury theme configuration
const luxuryThemes = {
  champagneGold: {
    primary: '#D4AF37',
    secondary: '#F5DEB3',
    accent: '#B8860B',
    background: '#1a1a1a',
    text: '#FFFFFF',
    animations: {
      fade: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      shimmer: 'ease-in-out',
      rotation: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    },
    sounds: {
      tap: 'luxury_tap.wav',
      success: 'chime_premium.wav',
      notification: 'bell_luxury.wav'
    }
  },
  platinum: {
    primary: '#E5E4E2',
    secondary: '#FFFFFF',
    accent: '#8C7853',
    background: '#000000',
    text: '#FFFFFF',
    // ... other properties
  }
};
```

### Premium Complications

```swift
// Apple Watch premium complications
struct PremiumComplication {
    static func createLuxuryTimeComplication() -> CLKComplicationTemplate {
        let template = CLKComplicationTemplateGraphicCircularImage()
        template.imageProvider = CLKFullColorImageProvider(fullColorImage: UIImage(named: "luxury_clock")!)
        template.textProvider = CLKSimpleTextProvider(text: "Premium")
        template.gaugeProvider = CLKSimpleGaugeProvider(
            style: .closed,
            gaugeColor: UIColor(hex: "D4AF37"),
            fillFraction: 0.75
        )
        return template
    }
}
```

## Testing Strategies

### Automated Testing

```yaml
# GitHub Actions workflow for smartwatch apps
name: Smartwatch CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-watchos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Xcode
        uses: maxim-lobanov/setup-xcode@v1
        with:
          xcode-version: latest-stable
      - name: Build and Test
        run: |
          xcodebuild clean build test \
            -scheme MariiaHubWatch \
            -destination 'platform=watchOS Simulator,name=Apple Watch Series 8 (45mm)'
          -enableCodeCoverage YES
      - name: Upload Coverage
        uses: codecov/codecov-action@v3

  test-wearos:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup JDK
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
      - name: Run Tests
        run: |
          ./gradlew testDebugUnitTest
          ./gradlew connectedDebugAndroidTest
```

### Manual Testing Checklist

#### Apple Watch Testing
- [ ] Complications display correctly on all supported families
- [ ] Haptic feedback works appropriately
- [ ] Performance meets < 2 second loading times
- [ ] Battery life optimized (no background drain)
- [ ] Sync with iOS app works seamlessly
- [ ] Health data integration functions properly
- [ ] Premium features accessible to subscribed users

#### Wear OS Testing
- [ ] Tiles update correctly and efficiently
- [ ] Navigation works with rotary input
- [ ] Performance on low-end devices acceptable
- [ ] Battery optimization active
- [ ] Ambient mode functionality works
- [ ] Health Services integration functional
- [ ] Cross-device sync operates smoothly

## Monitoring and Analytics

### Custom Analytics Events

```typescript
// Analytics tracking for smartwatch features
interface WatchAnalytics {
  trackComplicationInteraction(family: string, action: string): void;
  trackHealthDataSync(source: string, metrics: HealthMetrics): void;
  trackPremiumFeatureUsage(feature: string, membershipLevel: string): void;
  trackWatchFaceSelection(watchFaceId: string): void;
  trackWorkoutSession(type: string, duration: number, calories: number): void;
}

// Firebase Analytics implementation
class FirebaseWatchAnalytics implements WatchAnalytics {
  trackComplicationInteraction(family: string, action: string) {
    analytics().logEvent('complication_interaction', {
      family,
      action,
      platform: this.getPlatform()
    });
  }

  // ... other implementations
}
```

### Performance Monitoring

```swift
// Apple Watch performance monitoring
class PerformanceMonitor {
    func trackComplicationLoadTime(family: CLKComplicationFamily, duration: TimeInterval) {
        let metrics = [
            "complication_family": family.rawValue,
            "load_time": duration,
            "timestamp": Date().timeIntervalSince1970
        ]

        // Send to analytics service
        AnalyticsService.track("complication_performance", parameters: metrics)
    }

    func trackMemoryUsage() {
        let memoryInfo = mach_task_basic_info()
        var count = mach_msg_type_number_t(MemoryLayout<mach_task_basic_info>.size)/4

        let kerr: kern_return_t = withUnsafeMutablePointer(to: &memoryInfo) {
            $0.withMemoryRebound(to: integer_t.self, capacity: 1) {
                task_info(mach_task_self_,
                         task_flavor_t(MACH_TASK_BASIC_INFO),
                         $0,
                         &count)
            }
        }

        if kerr == KERN_SUCCESS {
            let memoryUsageMB = Double(memoryInfo.resident_size) / (1024 * 1024)
            AnalyticsService.track("memory_usage", [
                "usage_mb": memoryUsageMB,
                "platform": "watchos"
            ])
        }
    }
}
```

## Deployment Checklist

### Pre-Deployment Checklist

#### Apple Watch
- [ ] All complications tested on Apple Watch Series 4-8
- [ ] Performance meets Apple Watch guidelines
- [ ] App Store Connect metadata complete
- [ ] Privacy policy updated for health data
- [ ] TestFlight beta testing completed
- [ ] Battery life testing passed (> 18 hours typical use)

#### Wear OS
- [ ] Tested on multiple Wear OS devices (different screen sizes)
- [ ] Tiles function correctly on all supported Wear OS versions
- [ ] Google Play Console listing complete
- [ ] Accessibility testing passed
- [ ] Battery optimization verified
- [ ] Internal testing completed

### Post-Deployment Monitoring

1. **Performance Metrics**
   - Complication load times < 2 seconds
   - Tile update frequency within limits
   - Memory usage below platform thresholds
   - Battery drain < 10% per day typical use

2. **User Analytics**
   - Feature adoption rates
   - Premium conversion rates
   - Health data sync success rates
   - Cross-platform engagement metrics

3. **Error Monitoring**
   - Crash rates < 1%
   - Sync failure rates < 0.5%
   - Health data permission grant rates
   - API response times

## Conclusion

This comprehensive deployment guide ensures that the Mariia Hub smartwatch companion apps provide a premium, reliable experience across Apple Watch and Wear OS platforms. The combination of luxury features, health integration, and cross-platform synchronization creates a truly unified ecosystem that enhances the beauty and fitness booking experience for premium Warsaw market clients.