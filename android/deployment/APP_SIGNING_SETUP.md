# Mariia Hub Android App Signing and Release Management

## Overview

Comprehensive setup for Android app signing, release tracks, and automated deployment pipeline for Mariia Hub beauty and fitness booking platform.

## App Signing Strategy

### 1. Signing Keys Configuration

#### Production Release Key
```bash
# Generate production release keystore
keytool -genkeypair -v \
  -keystore mariia_hub_release.keystore \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias mariia_hub_production \
  -dname "CN=Mariia Hub Production, OU=Mobile Development, O=Mariia Hub Sp. z o.o., L=Warsaw, ST=Mazowieckie, C=PL" \
  -storepass [STRONG_PASSWORD] \
  -keypass [STRONG_KEY_PASSWORD]
```

#### Upload Key (Google Play App Signing)
```bash
# Generate upload keystore for Play Console
keytool -genkeypair -v \
  -keystore mariia_hub_upload.keystore \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias mariia_hub_upload \
  -dname "CN=Mariia Hub Upload, OU=Mobile Development, O=Mariia Hub Sp. z o.o., L=Warsaw, ST=Mazowieckie, C=PL" \
  -storepass [UPLOAD_PASSWORD] \
  -keypass [UPLOAD_KEY_PASSWORD]
```

#### Key Storage and Security
```bash
# Secure key storage strategy
# Store keys in encrypted password manager (1Password, Bitwarden)
# Never commit keys to version control
# Restrict access to core development team only
# Create encrypted backups in secure cloud storage
```

### 2. Gradle Signing Configuration

#### Build Configuration (app/build.gradle.kts)
```kotlin
android {
    signingConfigs {
        create("release") {
            keyAlias = System.getenv("KEY_ALIAS") ?: "mariia_hub_production"
            keyPassword = System.getenv("KEY_PASSWORD") ?: project.property("keyPassword")
            storeFile = file("../mariia_hub_release.keystore")
            storePassword = System.getenv("STORE_PASSWORD") ?: project.property("storePassword")
        }
        create("upload") {
            keyAlias = System.getenv("UPLOAD_KEY_ALIAS") ?: "mariia_hub_upload"
            keyPassword = System.getenv("UPLOAD_KEY_PASSWORD") ?: project.property("uploadKeyPassword")
            storeFile = file("../mariia_hub_upload.keystore")
            storePassword = System.getenv("UPLOAD_STORE_PASSWORD") ?: project.property("uploadStorePassword")
        }
    }

    buildTypes {
        getByName("debug") {
            isDebuggable = true
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
            signingConfig = signingConfigs.getByName("debug")
        }

        getByName("release") {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("release")
        }

        create("staging") {
            initWith(getByName("release"))
            applicationIdSuffix = ".staging"
            versionNameSuffix = "-staging"
            matchingFallbacks.add("release")
            signingConfig = signingConfigs.getByName("upload")
        }
    }
}
```

#### Local Properties Configuration (local.properties)
```properties
# Never commit this file to version control
# Add to .gitignore

# Release signing configuration
keyPassword=[YOUR_RELEASE_KEY_PASSWORD]
storePassword=[YOUR_RELEASE_STORE_PASSWORD]

# Upload signing configuration
uploadKeyPassword=[YOUR_UPLOAD_KEY_PASSWORD]
uploadStorePassword=[YOUR_UPLOAD_STORE_PASSWORD]

# Alternative: Use environment variables for CI/CD
```

### 3. ProGuard Configuration

#### ProGuard Rules (proguard-rules.pro)
```proguard
# Mariia Hub ProGuard Configuration

# Keep model classes
-keep class com.mariaborysevych.beautyfitness.data.model.** { *; }
-keep class com.mariaborysevych.beautyfitness.data.remote.dto.** { *; }

# Retrofit and OkHttp
-keepattributes Signature, InnerClasses, EnclosingMethod
-keepattributes RuntimeVisibleAnnotations, RuntimeVisibleParameterAnnotations
-keepattributes AnnotationDefault

-keepclassmembers,allowshrinking,allowobfuscation interface * {
    @retrofit2.http.* <methods>;
}

-dontwarn org.codehaus.mojo.animal_sniffer.IgnoreJRERequirement
-dontwarn javax.annotation.**
-dontwarn kotlin.Unit
-dontwarn retrofit2.KotlinExtensions
-dontwarn retrofit2.KotlinExtensions$*
-if interface * { @retrofit2.http.* <methods>; }
-keep,allowobfuscation interface <1>

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-keepnames class okhttp3.internal.publicsuffix.PublicSuffixDatabase

# Gson
-keepattributes Signature
-keepattributes *Annotation*
-dontwarn sun.misc.**
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer

# Keep Retrofit interfaces
-keep interface com.mariaborysevych.beautyfitness.data.remote.api.** { *; }

# Supabase
-keep class io.supabase.** { *; }
-dontwarn io.supabase.**

# Room Database
-keep class * extends androidx.room.RoomDatabase
-dontwarn androidx.room.paging.**

# Hilt/Dagger
-keep class dagger.hilt.** { *; }
-keep class * extends dagger.hilt.android.HiltAndroidApp
-keepclasseswithmembers class * {
    @dagger.hilt.android.AndroidEntryPoint <methods>;
}

# Kotlin Coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-keepclassmembernames class kotlinx.** {
    volatile <fields>;
}

# Material Design
-keep class com.google.android.material.** { *; }

# Jetpack Compose
-keep class androidx.compose.** { *; }
-dontwarn androidx.compose.**

# Firebase
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Google Pay
-keep class com.google.android.gms.wallet.** { *; }
-dontwarn com.google.android.gms.wallet.**

# Custom models for Mariia Hub
-keep class com.mariaborysevych.beautyfitness.domain.model.** { *; }

# Enum classes
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Parcelable implementations
-keep class * implements android.os.Parcelable {
    public static final ** CREATOR;
}

# Keep R class
-keepclassmembers class **.R$* {
    public static <fields>;
}
```

## Google Play App Signing Setup

### 1. Initial App Signing Configuration

#### Upload Production Key to Google Play
1. Navigate to Google Play Console
2. Go to App Setup > App Integrity
3. Select "Google Play App Signing"
4. Upload the upload keystore (mariia_hub_upload.keystore)
5. Google Play will manage the release signing key
6. Download the derived signing key for backup

#### Signing Key Security
```bash
# Create encrypted backup of signing keys
gpg --symmetric --cipher-algo AES256 \
  --output mariia_hub_keys_backup.gpg \
  mariia_hub_release.keystore mariia_hub_upload.keystore

# Store the encrypted backup in multiple secure locations:
# 1. Encrypted cloud storage (Google Drive, Dropbox)
# 2. Physical encrypted drive
# 3. Enterprise password manager

# Recovery process (only when needed):
gpg --decrypt --output mariia_hub_release.keystore mariia_hub_keys_backup.gpg
```

### 2. App Bundle Configuration

#### App Bundle Configuration (app/build.gradle.kts)
```kotlin
android {
    bundle {
        language {
            enableSplit = true
        }
        density {
            enableSplit = true
        }
        abi {
            enableSplit = true
        }
    }

    // Play Publishing configuration
    publishing {
        singleVariant("release") {
            withSourcesJar()
            withJavadocJar()
        }

        // Multiple variants for different tracks
        singleVariant("staging") {
            withSourcesJar()
        }
    }
}

// Play Publishing plugin
plugins {
    id("com.android.application")
    id("com.github.triplet.play") version "3.8.4"
}

play {
    serviceAccountCredentials.set(file("../play-service-account.json"))
    defaultToAppBundles.set(true)
    track.set("internal") // Can be: internal, alpha, beta, production
    releaseStatus.set("draft") // Can be: draft, completed, halted, inProgress
    updatePriority.set(2) // Higher number = higher priority (1-5)
}
```

#### Service Account Configuration
```json
// play-service-account.json
{
  "type": "service_account",
  "project_id": "mariia-hub-android",
  "private_key_id": "[KEY_ID]",
  "private_key": "-----BEGIN PRIVATE KEY-----\n[PRIVATE_KEY]\n-----END PRIVATE KEY-----\n",
  "client_email": "play-publisher@mariia-hub-android.iam.gserviceaccount.com",
  "client_id": "[CLIENT_ID]",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

## Release Tracks Configuration

### 1. Internal Testing Track

#### Configuration
```kotlin
// gradle.properties
RELEASE_TRACK_INTERNAL=true
INTERNAL_TESTERS_EMAILS=dev@mariaborysevych.com,qa@mariaborysevych.com

// Play Console setup
// Track: Internal Testing
// Testers: Development team, QA team
// Rollout: 100% of internal testers
// Review: No review required
// Auto-promote: No
```

#### Internal Testing Build Pipeline
```yaml
# .github/workflows/internal-testing.yml
name: Internal Testing Build

on:
  push:
    branches: [ develop, feature/* ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Cache Gradle packages
        uses: actions/cache@v3
        with:
          path: |
            ~/.gradle/caches
            ~/.gradle/wrapper
          key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
          restore-keys: |
            ${{ runner.os }}-gradle-

      - name: Decode Keystore
        env:
          ENCODED_STRING: ${{ secrets.KEYSTORE_BASE64 }}
        run: |
          echo $ENCODED_STRING | base64 -di > android/app/mariia_hub_upload.keystore

      - name: Build Release APK
        env:
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
        run: |
          ./gradlew assembleRelease

      - name: Deploy to Internal Testing
        env:
          SERVICE_ACCOUNT_JSON: ${{ secrets.PLAY_SERVICE_ACCOUNT_JSON }}
        run: |
          echo "$SERVICE_ACCOUNT_JSON" > android/play-service-account.json
          ./gradlew publishReleaseBundle --track=internal
```

### 2. Closed Testing (Alpha) Track

#### Configuration
```kotlin
// gradle.properties
RELEASE_TRACK_ALPHA=true
ALPHA_TESTERS_COUNT=50

// Play Console setup
// Track: Alpha (Closed Testing)
// Testers: Up to 50 invited users
// Rollout: Gradual (25%, 50%, 100%)
// Review: Standard review process
// Auto-promote: To Beta after 7 days
```

#### Alpha Testing Pipeline
```yaml
# .github/workflows/alpha-testing.yml
name: Alpha Testing Build

on:
  push:
    branches: [ release/* ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Run Tests
        run: ./gradlew test

      - name: Build Release Bundle
        env:
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
        run: |
          ./gradlew bundleRelease

      - name: Deploy to Alpha Testing
        env:
          SERVICE_ACCOUNT_JSON: ${{ secrets.PLAY_SERVICE_ACCOUNT_JSON }}
        run: |
          echo "$SERVICE_ACCOUNT_JSON" > android/play-service-account.json
          ./gradlew publishReleaseBundle --track=alpha --status=completed

      - name: Notify Testers
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#mobile-testing'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()
```

### 3. Open Testing (Beta) Track

#### Configuration
```kotlin
// gradle.properties
RELEASE_TRACK_BETA=true
BETA_TESTERS_OPT_IN=true

// Play Console setup
// Track: Beta (Open Testing)
// Testers: Up to 1000 users via opt-in link
// Rollout: Gradual (10%, 25%, 50%, 100%)
// Review: Standard review process
// Auto-promote: To Production after 14 days
```

#### Beta Testing Management
```typescript
// beta-tester-management.ts
export class BetaTesterManager {
  private testerDatabase: FirebaseFirestore;

  async addBetaTester(email: string, deviceInfo: DeviceInfo): Promise<void> {
    await this.testerDatabase.collection('beta_testers').doc(email).set({
      email,
      deviceInfo,
      joinedAt: Timestamp.now(),
      status: 'active',
      feedback: []
    });
  }

  async getTesterStats(): Promise<BetaTesterStats> {
    const snapshot = await this.testerDatabase
      .collection('beta_testers')
      .where('status', '==', 'active')
      .get();

    return {
      totalTesters: snapshot.size,
      activeTesters: snapshot.docs.filter(doc => {
        const lastActive = doc.data().lastActive?.toDate();
        return lastActive && lastActive > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      }).length,
      devices: this.getDeviceStats(snapshot)
    };
  }

  async sendBetaInvites(emails: string[]): Promise<void> {
    const optInLink = 'https://play.google.com/apps/testing/com.mariaborysevych.beautyfitness';

    for (const email of emails) {
      await this.sendEmail({
        to: email,
        subject: 'Join Mariia Hub Beta Testing Program',
        template: 'beta-invitation',
        data: { optInLink }
      });
    }
  }
}
```

### 4. Production Release Track

#### Configuration
```kotlin
// gradle.properties
RELEASE_TRACK_PRODUCTION=true
PRODUCTION_ROLLOUT_STAGES=1%,5%,20%,50%,100%

// Play Console setup
// Track: Production
// Rollout: Staged rollout (1% → 5% → 20% → 50% → 100%)
// Review: Full review process
// Auto-promote: No (manual control)
```

#### Production Release Pipeline
```yaml
# .github/workflows/production-release.yml
name: Production Release

on:
  push:
    tags: [ 'v*' ]

jobs:
  create-release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Extract Version
        id: version
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT

      - name: Create Release Notes
        id: release_notes
        run: |
          # Generate release notes from git commits
          echo "NOTES<<EOF" >> $GITHUB_OUTPUT
          git log --pretty=format:"- %s" $(git describe --tags --abbrev=0 HEAD^)..HEAD >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Mariia Hub v${{ steps.version.outputs.VERSION }}
          body: ${{ steps.release_notes.outputs.NOTES }}
          draft: false
          prerelease: false

  build-and-deploy:
    needs: create-release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Run Full Test Suite
        run: |
          ./gradlew test
          ./gradlew connectedAndroidTest

      - name: Build Release Bundle
        env:
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
        run: ./gradlew bundleRelease

      - name: Deploy to Production (1% Rollout)
        env:
          SERVICE_ACCOUNT_JSON: ${{ secrets.PLAY_SERVICE_ACCOUNT_JSON }}
        run: |
          echo "$SERVICE_ACCOUNT_JSON" > android/play-service-account.json
          ./gradlew publishReleaseBundle --track=production --status=completed --rollout-percentage=1

      - name: Notify Team
        uses: 8398a7/action-slack@v3
        with:
          status: success
          channel: '#releases'
          message: "🚀 Mariia Hub v${{ needs.create-release.outputs.VERSION }} deployed to production (1% rollout)"
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Release Automation and Management

### 1. Automated Version Management

#### Version Configuration
```kotlin
// gradle.properties
VERSION_NAME=1.0.0
VERSION_CODE=1

// app/build.gradle.kts
android {
    defaultConfig {
        versionCode = project.property("VERSION_CODE").toString().toInt()
        versionName = project.property("VERSION_NAME").toString()
    }
}

// Automatic version incrementing
tasks.register("incrementVersionCode") {
    doLast {
        val versionCode = project.property("VERSION_CODE").toString().toInt() + 1
        project.ext.set("VERSION_CODE", versionCode)

        val propertiesFile = file("gradle.properties")
        val properties = java.util.Properties()
        properties.load(propertiesFile.inputStream())
        properties.setProperty("VERSION_CODE", versionCode.toString())
        properties.store(propertiesFile.outputStream(), "Version increment")
    }
}
```

#### Release Notes Generation
```typescript
// release-notes-generator.ts
export class ReleaseNotesGenerator {
  async generateReleaseNotes(fromTag: string, toTag: string): Promise<string> {
    const commits = await this.getCommitsBetweenTags(fromTag, toTag);
    const groupedCommits = this.groupCommitsByType(commits);

    let notes = `# Release ${toTag}\n\n`;

    notes += `## 🚀 Features\n`;
    notes += this.formatCommits(groupedCommits.features);

    notes += `\n## 🐛 Bug Fixes\n`;
    notes += this.formatCommits(groupedCommits.fixes);

    notes += `\n## 🔧 Improvements\n`;
    notes += this.formatCommits(groupedCommits.improvements);

    notes += `\n## 📱 Platform Changes\n`;
    notes += this.formatCommits(groupedCommits.platform);

    return notes;
  }

  private groupCommitsByType(commits: GitCommit[]): GroupedCommits {
    return commits.reduce((groups, commit) => {
      if (commit.message.startsWith('feat:')) groups.features.push(commit);
      else if (commit.message.startsWith('fix:')) groups.fixes.push(commit);
      else if (commit.message.startsWith('improvement:')) groups.improvements.push(commit);
      else if (commit.message.startsWith('android:') || commit.message.startsWith('ios:')) groups.platform.push(commit);
      else groups.other.push(commit);
      return groups;
    }, { features: [], fixes: [], improvements: [], platform: [], other: [] });
  }
}
```

### 2. Rollout Management

#### Staged Rollout Control
```kotlin
// RolloutManager.kt
class RolloutManager {
    private val playService = PlayService()

    suspend fun monitorRollout(appId: String, releaseId: String): Flow<RolloutStatus> = flow {
        var currentPercentage = 1
        val stages = listOf(1, 5, 20, 50, 100)

        for (stage in stages) {
            // Wait for monitoring period (usually 24-48 hours)
            delay(Duration.ofHours(48))

            // Check rollout health metrics
            val healthMetrics = playService.getRolloutHealthMetrics(appId, releaseId)

            if (shouldContinueRollout(healthMetrics)) {
                if (currentPercentage < stage) {
                    playService.updateRolloutPercentage(appId, releaseId, stage)
                    currentPercentage = stage
                    emit(RolloutStatus(stage, "healthy"))
                }
            } else {
                // Pause rollout if issues detected
                playService.pauseRollout(appId, releaseId)
                emit(RolloutStatus(currentPercentage, "paused", healthMetrics.issues))
                break
            }
        }
    }

    private fun shouldContinueRollout(metrics: RolloutHealthMetrics): Boolean {
        return metrics.crashRate < 0.01 &&
               metrics.anrRate < 0.005 &&
               metrics.userRating > 4.0 &&
               metrics.issueReportRate < 0.001
    }
}
```

### 3. Emergency Procedures

#### Emergency Rollback
```yaml
# .github/workflows/emergency-rollback.yml
name: Emergency Rollback

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to rollback to'
        required: true
        type: string
      reason:
        description: 'Reason for rollback'
        required: true
        type: string

jobs:
  emergency-rollback:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Checkout Previous Version
        run: git checkout tags/v${{ github.event.inputs.version }}

      - name: Build Emergency Release
        env:
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
        run: ./gradlew bundleRelease

      - name: Deploy Emergency Fix
        env:
          SERVICE_ACCOUNT_JSON: ${{ secrets.PLAY_SERVICE_ACCOUNT_JSON }}
        run: |
          echo "$SERVICE_ACCOUNT_JSON" > android/play-service-account.json
          ./gradlew publishReleaseBundle --track=production --status=completed --rollout-percentage=100

      - name: Notify Emergency
        uses: 8398a7/action-slack@v3
        with:
          status: success
          channel: '#emergency'
          message: "🚨 EMERGENCY ROLLBACK: Deployed v${{ github.event.inputs.version }}. Reason: ${{ github.event.inputs.reason }}"
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

#### Hotfix Process
```bash
#!/bin/bash
# hotfix-branch.sh

VERSION=$1
HOTFIX_REASON=$2

if [ -z "$VERSION" ] || [ -z "$HOTFIX_REASON" ]; then
    echo "Usage: ./hotfix-branch.sh <version> <reason>"
    exit 1
fi

# Create hotfix branch
git checkout -b hotfix/$VERSION

# Update version
echo "VERSION_NAME=$VERSION" >> gradle.properties
echo "HOTFIX_REASON=$HOTFIX_REASON" >> gradle.properties

# Commit changes
git add gradle.properties
git commit -m "hotfix: Prepare hotfix $VERSION - $HOTFIX_REASON"

echo "Hotfix branch created: hotfix/$VERSION"
echo "Remember to:"
echo "1. Make necessary fixes"
echo "2. Update version code"
echo "3. Test thoroughly"
echo "4. Create pull request to main"
```

## Monitoring and Analytics

### 1. Release Monitoring Dashboard

```typescript
// release-monitoring.ts
export class ReleaseMonitoring {
  private analytics: FirebaseAnalytics;
  private crashlytics: Crashlytics;

  async getReleaseMetrics(version: string): Promise<ReleaseMetrics> {
    const [crashData, performanceData, usageData] = await Promise.all([
      this.getCrashMetrics(version),
      this.getPerformanceMetrics(version),
      this.getUsageMetrics(version)
    ]);

    return {
      version,
      crashRate: crashData.crashRate,
      anrRate: crashData.anrRate,
      avgLoadTime: performanceData.avgLoadTime,
      crashFreeUsers: crashData.crashFreeUsers,
      dailyActiveUsers: usageData.dailyActiveUsers,
      retentionRate: usageData.retentionRate,
      userRating: await this.getUserRating(version)
    };
  }

  async checkReleaseHealth(version: string): Promise<ReleaseHealth> {
    const metrics = await this.getReleaseMetrics(version);

    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    if (metrics.crashRate > 0.01) {
      issues.push(`High crash rate: ${(metrics.crashRate * 100).toFixed(2)}%`);
      status = 'critical';
    } else if (metrics.crashRate > 0.005) {
      issues.push(`Elevated crash rate: ${(metrics.crashRate * 100).toFixed(2)}%`);
      status = 'warning';
    }

    if (metrics.anrRate > 0.005) {
      issues.push(`High ANR rate: ${(metrics.anrRate * 100).toFixed(2)}%`);
      status = 'critical';
    }

    if (metrics.avgLoadTime > 3000) {
      issues.push(`Slow app startup: ${metrics.avgLoadTime}ms`);
      if (status === 'healthy') status = 'warning';
    }

    if (metrics.userRating < 4.0) {
      issues.push(`Low user rating: ${metrics.userRating}/5`);
      status = 'critical';
    }

    return { status, issues, metrics };
  }
}
```

This comprehensive Android app signing and release management setup ensures secure, automated, and monitored deployments for Mariia Hub with proper rollback capabilities and release health monitoring.