plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("kotlin-kapt")
    id("dagger.hilt.android.plugin")
    id("kotlin-parcelize")
    id("com.google.gms.google-services")
    id("com.google.android.libraries.mapsplatform.secrets-gradle-plugin")
    id("io.gitlab.arturbosch.detekt")
}

android {
    namespace = "com.mariaborysevych.beautyfitness"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.mariaborysevych.beautyfitness"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }

        buildConfigField("String", "SUPABASE_URL", "\"https://your-project-id.supabase.co\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"your-anon-key\"")
        buildConfigField("String", "STRIPE_PUBLISHABLE_KEY", "\"pk_test_your_key\"")
    }

    buildTypes {
        debug {
            isDebuggable = true
            isMinifyEnabled = false
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
            buildConfigField("String", "SUPABASE_URL", "\"http://10.0.2.2:54321\"")
            buildConfigField("String", "SUPABASE_ANON_KEY", "\"your-local-anon-key\"")
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            // Configure signing for production
            signingConfig = signingConfigs.getByName("debug") // Replace with production config
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
        freeCompilerArgs = listOf(
            "-opt-in=androidx.compose.material3.ExperimentalMaterial3Api",
            "-opt-in=androidx.compose.foundation.ExperimentalFoundationApi",
            "-opt-in=kotlinx.coroutines.ExperimentalCoroutinesApi"
        )
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.13"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }

    testOptions {
        unitTests {
            isIncludeAndroidResources = true
        }
    }
}

dependencies {
    // Core Android
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-compose:1.9.0")
    implementation("androidx.navigation:navigation-compose:2.7.7")

    // Compose BOM - manages all Compose library versions
    implementation(platform("androidx.compose:compose-bom:2024.04.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")

    // Material Design 3
    implementation("com.google.android.material:material:1.11.0")

    // Dependency Injection
    implementation("com.google.dagger:hilt-android:2.48")
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")
    kapt("com.google.dagger:hilt-compiler:2.48")
    implementation("androidx.hilt:hilt-work:1.2.0")

    // Network & Data
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    implementation("io.coil-kt:coil-compose:2.6.0")

    // Supabase
    implementation("io.github.jan-tennert.supabase:supabase-kt:2.3.1")
    implementation("io.github.jan-tennert.supabase:gotrue-kt:2.3.1")
    implementation("io.github.jan-tennert.supabase:postgrest-kt:2.3.1")
    implementation("io.github.jan-tennert.supabase:realtime-kt:2.3.1")
    implementation("io.github.jan-tennert.supabase:storage-kt:2.3.1")
    implementation("io.github.jan-tennert.supabase:auth-kt:2.3.1")
    implementation("io.ktor:ktor-client-android:2.3.10")

    // Room Database
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    kapt("androidx.room:room-compiler:2.6.1")

    // WorkManager for background tasks
    implementation("androidx.work:work-runtime-ktx:2.9.0")

    // Google Services
    implementation("com.google.android.gms:play-services-wallet:19.3.0") // Google Pay
    implementation("com.google.android.gms:play-services-fitness:21.1.0") // Google Fit
    implementation("com.google.android.gms:play-services-auth:21.0.0") // Auth
    implementation("com.google.api-client:google-api-client:2.0.0")
    implementation("com.google.oauth-client:google-oauth-client-jetty:1.34.1")
    implementation("com.google.apis:google-api-services-calendar:v3-rev20220715-2.0.0")

    // Biometric Authentication
    implementation("androidx.biometric:biometric:1.1.0")
    implementation("androidx.security:security-crypto:1.1.0-alpha06")

    // Payments
    implementation("com.stripe:stripe-android:20.48.1")
    implementation("com.google.pay:compose-pay-button:0.1.0-beta01")

    // Wear OS (companion app)
    wearApp(project(":wear"))
    implementation("com.google.android.gms:play-services-wearable:18.1.0")

    // Android Auto
    implementation("androidx.car.app:app:1.4.0")

    // Assistant Integration
    implementation("com.google.assistant.actions:actions:0.1.1")

    // Notifications
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.work:work-runtime-ktx:2.9.0")

    // Camera & Media
    implementation("androidx.camera:camera-camera2:1.3.1")
    implementation("androidx.camera:camera-lifecycle:1.3.1")
    implementation("androidx.camera:camera-view:1.3.1")

    // Internationalization
    implementation("androidx.compose.runtime:runtime-livedata:1.6.5")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")

    // Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.mockito:mockito-core:5.11.0")
    testImplementation("org.mockito.kotlin:mockito-kotlin:5.2.1")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.0")
    testImplementation("androidx.room:room-testing:2.6.1")
    testImplementation("androidx.work:work-testing:2.9.0")
    testImplementation("androidx.compose.ui:ui-test-junit4")

    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    androidTestImplementation("androidx.navigation:navigation-testing:2.7.7")
    androidTestImplementation("com.google.dagger:hilt-android-testing:2.48")
    kaptAndroidTest("com.google.dagger:hilt-compiler:2.48")

    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}

// Allow references to generated code
kapt {
    correctErrorTypes = true
}

// Detekt configuration
detekt {
    toolVersion = "1.23.5"
    config.setFrom(files("$projectDir/config/detekt/detekt.yml"))
    buildUponDefaultConfig = true
    autoCorrect = true
}