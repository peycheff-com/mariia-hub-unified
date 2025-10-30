plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("kotlin-kapt")
    id("dagger.hilt.android.plugin")
    id("com.google.gms.google-services")
}

android {
    namespace = "com.mariaborysevych.beautyfitness.wear"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.mariaborysevych.beautyfitness.wear"
        minSdk = 30
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        debug {
            isDebuggable = true
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
        freeCompilerArgs = listOf(
            "-opt-in=androidx.compose.foundation.ExperimentalFoundationApi",
            "-opt-in=androidx.wear.compose.material.ExperimentalWearMaterialApi"
        )
    }

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.13"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    // Wear OS Core
    implementation("com.google.android.gms:play-services-wearable:18.1.0")
    implementation("androidx.wear:wear:1.3.0")

    // Wear Compose BOM
    implementation(platform("androidx.wear.compose:compose-bom:2024.04.01"))
    implementation("androidx.wear.compose:compose-foundation")
    implementation("androidx.wear.compose:compose-ui-tooling")
    implementation("androidx.wear.compose:compose-navigation")
    implementation("androidx.wear.compose:compose-material")

    // Wear Tiles
    implementation("androidx.wear.tiles:tiles:1.3.0")
    implementation("androidx.wear.tiles:tiles-material:1.3.0")

    // Watch Face (optional for luxury watch face)
    implementation("androidx.wear.watchface:watchface:1.2.1")
    implementation("androidx.wear.watchface:watchface-complications-data-source-ktx:1.2.1")

    // Dependency Injection
    implementation("com.google.dagger:hilt-android:2.48")
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")
    kapt("com.google.dagger:hilt-compiler:2.48")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.0")

    // Data Layer for phone communication
    implementation("androidx.wear:wear-remote-interactions:1.0.0")
    implementation("androidx.wear.phone:wear-phone-interactions:1.1.0-alpha04")

    // Health Services
    implementation("androidx.health:health-services-client:1.0.0-rc02")

    // Sensors
    implementation("androidx.wear:wear-input:1.2.0-alpha02")

    // Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.mockito:mockito-core:5.11.0")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.0")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-tooling")
}