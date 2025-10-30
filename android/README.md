# Mariia Hub - Luxury Beauty & Fitness Android App

A premium native Android application for beauty and fitness booking, built with Jetpack Compose and targeting the luxury Warsaw market. The app seamlessly integrates with the existing web platform while providing a truly native Android experience with Google ecosystem integration.

## 🎯 Overview

The Mariia Hub Android app is a luxury booking platform that offers:
- **Beauty Services**: PMU, brows, lip enhancements, and more
- **Fitness Programs**: Personal training, glutes programs, and lifestyle coaching
- **4-Step Booking Wizard**: Service selection → Time slots → Client details → Payment
- **Google Ecosystem Integration**: Google Pay, Google Fit, Calendar, and Assistant
- **Biometric Security**: Fingerprint and face authentication
- **Wear OS Companion**: Smartwatch app for on-the-go management
- **Android Auto Integration**: Appointment management while driving
- **Premium Design**: Luxury Cocoa/Champagne theme with glass morphism effects

## 🏗️ Architecture

### Tech Stack
- **UI Framework**: Jetpack Compose with Material Design 3
- **Architecture**: MVVM with Repository pattern
- **Dependency Injection**: Hilt
- **Database**: Room for offline storage + Supabase for cloud sync
- **Networking**: Retrofit + Ktor with Supabase client
- **Async Operations**: Kotlin Coroutines + Flow
- **Testing**: JUnit, Mockito, and Compose Testing

### Project Structure
```
android/
├── app/                          # Main Android app
│   ├── src/main/java/
│   │   └── com/mariaborysevych/beautyfitness/
│   │       ├── data/             # Data layer
│   │       │   ├── local/        # Room database
│   │       │   ├── remote/       # Supabase API
│   │       │   ├── repository/   # Repository implementations
│   │       │   └── sync/         # Offline sync manager
│   │       ├── domain/           # Business logic
│   │       ├── presentation/     # UI layer
│   │       │   ├── auth/         # Authentication
│   │       │   ├── booking/      # Booking flow
│   │       │   ├── home/         # Home screen
│   │       │   ├── navigation/   # Navigation
│   │       │   └── ui/           # UI components
│   │       ├── integration/      # Google services
│   │       │   ├── google/       # Google Fit, Calendar
│   │       │   ├── payments/     # Google Pay
│   │       │   └── assistant/    # Google Assistant
│   │       ├── notifications/    # Push notifications
│   │       ├── auto/             # Android Auto
│   │       ├── wear/             # Wear OS integration
│   │       └── ui/theme/         # Luxury theming
│   └── build.gradle.kts          # App build configuration
├── wear/                         # Wear OS companion app
│   ├── src/main/java/
│   │   └── com/mariaborysevych/beautyfitness/wear/
│   │       ├── presentation/     # Wear UI
│   │       ├── tiles/            # Wear tiles
│   │       └── theme/            # Wear theming
│   └── build.gradle.kts          # Wear app build
└── build.gradle.kts              # Project build
```

## 🎨 Design System

### Luxury Theme
The app features a sophisticated luxury design system:
- **Primary Colors**: Cocoa/Champagne palette (`#8B4513`, `#F5DEB3`)
- **Accent Colors**: Gold and Bronze tones
- **Typography**: Inter (body), Space Grotesk (headings), Playfair Display (display)
- **Shapes**: Consistent 12px border radius with premium variations
- **Animations**: Subtle micro-interactions with spring physics

### Key Components
- **Glass Morphism Cards**: Translucent effects with backdrop blur
- **Luxury Buttons**: Gradient backgrounds with haptic feedback
- **Premium Progress Indicators**: Gold-animated progress bars
- **Staggered Animations**: Sophisticated entrance animations

## 🔑 Core Features

### 1. Booking System
- **Service Selection**: Browse beauty and fitness services with search
- **Time Slot Booking**: Real-time availability with hold system
- **Client Details**: Form validation with biometric confirmation
- **Payment Processing**: Google Pay integration with secure checkout

### 2. Google Ecosystem Integration
- **Google Pay**: One-tap payment with tokenization
- **Google Fit**: Activity tracking and workout logging
- **Google Calendar**: Automatic appointment creation and conflict detection
- **Google Assistant**: Voice commands for booking ("Book PMU for tomorrow at 2 PM")

### 3. Android-Specific Features
- **Biometric Authentication**: Fingerprint/face unlock with secure storage
- **Advanced Notifications**: Expandable notifications with quick actions
- **Android Auto**: Voice-first appointment management while driving
- **Wear OS**: Smartwatch companion with tiles and complications
- **Dynamic Tiles**: Home screen widgets for quick access
- **Picture-in-Picture**: Video consultation support

### 4. Offline Support
- **Room Database**: Local caching for offline-first experience
- **Sync Queue**: Automatic background synchronization
- **Conflict Resolution**: Smart merging of online/offline changes
- **WorkManager**: Background tasks for data synchronization

## 🔧 Configuration

### Build Variants
```kotlin
buildTypes {
    debug {
        isDebuggable = true
        applicationIdSuffix = ".debug"
        buildConfigField("String", "SUPABASE_URL", "\"http://10.0.2.2:54321\"")
    }
    release {
        isMinifyEnabled = true
        buildConfigField("String", "SUPABASE_URL", "\"https://your-project.supabase.co\"")
    }
}
```

### Environment Variables
```kotlin
// Supabase Configuration
buildConfigField("String", "SUPABASE_URL", "\"https://your-project.supabase.co\"")
buildConfigField("String", "SUPABASE_ANON_KEY", "\"your-anon-key\"")

// Payment Configuration
buildConfigField("String", "STRIPE_PUBLISHABLE_KEY", "\"pk_live_your_key\"")

// Google Services
buildConfigField("String", "GOOGLE_PAY_MERCHANT_ID", "\"your-merchant-id\"")
```

## 📱 Android Integration

### 1. Supabase Setup
```kotlin
// Application class
@HiltAndroidApp
class MariiaHubApplication : Application() {
    val supabase: SupabaseClient by lazy {
        createSupabaseClient(
            supabaseUrl = BuildConfig.SUPABASE_URL,
            supabaseKey = BuildConfig.SUPABASE_ANON_KEY
        ) {
            install(Auth)
            install(Postgrest)
            install(Realtime)
            install(Storage)
        }
    }
}
```

### 2. Google Pay Integration
```kotlin
fun requestPayment(amount: Long, currency: String = "PLN") {
    val paymentDataRequestJson = createPaymentDataRequest(amount, currency)
    val request = PaymentDataRequest.fromJson(paymentDataRequestJson.toString())

    paymentsClient.loadPaymentData(request)
        .addOnSuccessListener { paymentData ->
            handlePaymentSuccess(paymentData)
        }
}
```

### 3. Google Fit Integration
```kotlin
suspend fun loadTodaysFitnessData(): FitnessData {
    val readRequest = DataReadRequest.Builder()
        .read(DataType.TYPE_STEP_COUNT_DELTA)
        .read(DataType.TYPE_CALORIES_EXPENDED)
        .setTimeRange(startOfDay, now, TimeUnit.MILLISECONDS)
        .build()

    return fitnessClient.readData(readRequest).await()
}
```

### 4. Wear OS Companion
```kotlin
@Composable
fun WearOSHomeScreen() {
    ScalingLazyColumn {
        item { Text("Mariia Hub", style = MaterialTheme.typography.title3) }
        item { QuickBookingCard() }
        item { FitnessStatsCard() }
        item { NextAppointmentCard() }
    }
}
```

## 🔒 Security Features

### Biometric Authentication
```kotlin
fun authenticate(activity: FragmentActivity) {
    val promptInfo = BiometricPrompt.PromptInfo.Builder()
        .setTitle("Verify Your Identity")
        .setSubtitle("Use your fingerprint or face to continue")
        .setAllowedAuthenticators(BIOMETRIC_STRONG or DEVICE_CREDENTIAL)
        .build()

    biometricPrompt.authenticate(promptInfo)
}
```

### Secure Storage
```kotlin
private fun createEncryptionCipher(): Cipher {
    return MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build().let { masterKey ->
            EncryptedSharedPreferences.create(
                context,
                "secure_prefs",
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        }
}
```

## 📊 Data Layer

### Database Schema
```sql
-- Services Table
CREATE TABLE services (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    service_type TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    price INTEGER NOT NULL,
    currency TEXT DEFAULT 'PLN',
    is_active BOOLEAN DEFAULT 1
);

-- Bookings Table
CREATE TABLE bookings (
    id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    booking_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    is_synced BOOLEAN DEFAULT 0
);

-- Sync Queue Table
CREATE TABLE sync_queue (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    data TEXT,
    retry_count INTEGER DEFAULT 0
);
```

### Repository Pattern
```kotlin
@Singleton
class BookingRepository @Inject constructor(
    private val supabaseClient: SupabaseClient,
    private val bookingDao: BookingDao,
    private val syncManager: OfflineSyncManager
) {
    suspend fun createBooking(request: BookingRequest): Result<Booking> {
        return try {
            // Try to create online first
            val booking = supabaseClient.createBooking(request)
            if (booking != null) {
                Result.success(booking)
            } else {
                // Fallback to offline
                createOfflineBooking(request)
            }
        } catch (e: Exception) {
            // Enqueue for sync and create offline
            syncManager.enqueueSyncOperation("booking", request.id, "create", request.toMap())
            createOfflineBooking(request)
        }
    }
}
```

## 🧪 Testing

### Unit Tests
```kotlin
@Test
fun `booking creation should validate required fields`() {
    val invalidRequest = BookingRequest(
        serviceId = "", // Invalid
        clientName = "",
        clientEmail = "invalid-email",
        // ...
    )

    val result = bookingRepository.createBooking(invalidRequest)

    assertThat(result.isFailure).isTrue()
    assertThat(result.exceptionOrNull()).isInstanceOf(ValidationException::class.java)
}
```

### UI Tests
```kotlin
@Test
fun `booking wizard should complete successfully`() {
    composeTestRule.setContent {
        BookingWizardScreen(serviceId = "test-service")
    }

    // Step 1: Select service
    composeTestRule.onNodeWithText("PMU Lips").performClick()

    // Step 2: Select time slot
    composeTestRule.onNodeWithText("2:00 PM").performClick()

    // Step 3: Fill client details
    composeTestRule.onNodeWithText("Name").performTextInput("John Doe")
    composeTestRule.onNodeWithText("Email").performTextInput("john@example.com")

    // Step 4: Complete booking
    composeTestRule.onNodeWithText("Complete Booking").performClick()

    composeTestRule.onNodeWithText("Booking Confirmed!").assertIsDisplayed()
}
```

## 🚀 Deployment

### Release Build Configuration
```kotlin
android {
    signingConfigs {
        create("release") {
            storeFile = file("../keystore/release.keystore")
            storePassword = System.getenv("KEYSTORE_PASSWORD")
            keyAlias = System.getenv("KEY_ALIAS")
            keyPassword = System.getenv("KEY_PASSWORD")
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}
```

### Google Play Store Configuration
- **Target SDK**: 34 (Android 14)
- **Minimum SDK**: 24 (Android 7.0)
- **Content Rating**: Everyone
- **Categories**: Health & Fitness, Lifestyle

## 📱 Supported Devices

### Phone/Tablet Requirements
- Android 7.0 (API 24) or higher
- 2GB RAM minimum
- Biometric sensor recommended
- Google Play Services required

### Wear OS Requirements
- Wear OS 3.0 or higher
- 1GB RAM minimum
- Round display support
- Heart rate sensor (for fitness tracking)

### Android Auto Requirements
- Android 10 or higher
- Compatible head unit
- Bluetooth connectivity

## 🔧 Development Setup

### Prerequisites
1. **Android Studio**: Arctic Fox or higher
2. **JDK**: 17 or higher
3. **Android SDK**: API 24-34
4. **Git**: Latest version

### Setup Commands
```bash
# Clone the repository
git clone https://github.com/your-org/mariia-hub-android.git
cd mariia-hub-android

# Add environment variables
cp app/src/main/env.template app/src/main/env.properties

# Build the project
./gradlew build

# Run tests
./gradlew test

# Install debug APK
./gradlew installDebug
```

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [UI Components Guide](./docs/components.md)
- [Offline Sync Architecture](./docs/offline-sync.md)
- [Google Integration Guide](./docs/google-integration.md)
- [Security Implementation](./docs/security.md)
- [Testing Strategy](./docs/testing.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** for providing the backend-as-a-service platform
- **Google** for Android platform and ecosystem integration
- **Jetpack Compose** team for the modern UI toolkit
- **Material Design** team for the design system inspiration

---

Built with ❤️ for the luxury beauty and fitness market in Warsaw.