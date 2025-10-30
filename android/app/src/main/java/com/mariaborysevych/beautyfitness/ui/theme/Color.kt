package com.mariaborysevych.beautyfitness.ui.theme

import androidx.compose.ui.graphics.Color

// Luxury Cocoa/Champagne Color Palette - matching web platform
object MariiaHubColors {

    // Primary Colors - Cocoa/Champagne Tones
    val Primary = Color(0xFF8B4513) // Cocoa Brown
    val PrimaryVariant = Color(0xFF6B3410) // Darker Cocoa
    val OnPrimary = Color(0xFFFFFFFF) // White text on primary

    // Secondary Colors - Champagne Accents
    val Secondary = Color(0xFFF5DEB3) // Champagne
    val SecondaryVariant = Color(0xFFE6D4A3) // Darker Champagne
    val OnSecondary = Color(0xFF3E2723) // Dark text on secondary

    // Surface Colors - Glass morphism effect
    val Surface = Color(0x1A8B4513) // 10% Cocoa on transparent
    val SurfaceVariant = Color(0x2A8B4513) // 16% Cocoa on transparent
    val OnSurface = Color(0xFFF5DEB3) // Champagne text
    val OnSurfaceVariant = Color(0xFFE6D4A3) // Light champagne

    // Background Colors
    val Background = Color(0xFF1A1A1A) // Dark luxury background
    val BackgroundVariant = Color(0xFF252525) // Slightly lighter

    // Accent Colors - Bronze and Gold
    val Accent = Color(0xFFCD7F32) // Bronze
    val Gold = Color(0xFFFFD700) // Gold
    val GoldVariant = Color(0xFFB8860B) // Darker Gold

    // Text Colors
    val TextPrimary = Color(0xFFF5F5F5) // Pearl white
    val TextSecondary = Color(0xFFE6D4A3) // Champagne text
    val TextTertiary = Color(0xFFB8B8B8) // Muted gray
    val TextOnPrimary = Color(0xFFFFFFFF)
    val TextOnSecondary = Color(0xFF3E2723)

    // State Colors
    val Success = Color(0xFF4CAF50) // Green
    val SuccessVariant = Color(0xFF388E3C)
    val Warning = Color(0xFFFF9800) // Orange
    val WarningVariant = Color(0xFFF57C00)
    val Error = Color(0xFFE53935) // Red
    val ErrorVariant = Color(0xFFD32F2F)
    val Info = Color(0xFF2196F3) // Blue
    val InfoVariant = Color(0xFF1976D2)

    // Border Colors
    val Border = Color(0x33F5DEB3) // 20% Champagne
    val BorderFocus = Color(0x66F5DEB3) // 40% Champagne
    val BorderSelected = Color(0x80F5DEB3) // 50% Champagne

    // Shadow Colors
    val Shadow = Color(0x4D000000) // Black with opacity
    val ShadowLight = Color(0x1A000000) // Light shadow
    val ShadowGold = Color(0x33FFD700) // Gold tinted shadow

    // Glass Effect Colors
    val GlassSubtle = Color(0x0A8B4513) // Very subtle glass
    val GlassMedium = Color(0x1A8B4513) // Medium glass
    val GlassHeavy = Color(0x338B4513) // Heavy glass

    // Gradient Colors
    val GradientStart = Color(0xFF8B4513) // Cocoa
    val GradientEnd = Color(0xFFCD7F32) // Bronze
    val GoldGradientStart = Color(0xFFFFD700) // Gold
    val GoldGradientEnd = Color(0xFFB8860B) // Dark Gold

    // Luxury Specific Colors
    val Pearl = Color(0xFFF8F6F0) // Pearl white
    val Ivory = Color(0xFFFFFFF0) // Ivory
    val Cream = Color(0xFFF5F5DC) // Cream
    val ChampagneLight = Color(0xFFF7E7CE) // Light champagne
    val ChampagneDark = Color(0xFFD4AF37) // Dark champagne

    // Service Category Colors
    val BeautyPrimary = Color(0xFFE91E63) // Pink for beauty services
    val FitnessPrimary = Color(0xFF4CAF50) // Green for fitness services
    val LifestylePrimary = Color(0xFF9C27B0) // Purple for lifestyle services

    // Booking Flow Colors
    val StepActive = Color(0xFFF5DEB3) // Champagne for active step
    val StepCompleted = Color(0xFF4CAF50) // Green for completed step
    val StepInactive = Color(0x66F5DEB3) // Muted champagne for inactive
}

// Extended color scheme for Material 3
val LightColorScheme = androidx.compose.material3.lightColorScheme(
    primary = MariiaHubColors.Primary,
    onPrimary = MariiaHubColors.OnPrimary,
    primaryContainer = MariiaHubColors.ChampagneLight,
    onPrimaryContainer = MariiaHubColors.Primary,
    secondary = MariiaHubColors.Secondary,
    onSecondary = MariiaHubColors.OnSecondary,
    secondaryContainer = MariiaHubColors.Cream,
    onSecondaryContainer = MariiaHubColors.Primary,
    tertiary = MariiaHubColors.Accent,
    onTertiary = Color.White,
    tertiaryContainer = MariiaHubColors.ChampagneDark,
    onTertiaryContainer = Color.White,
    error = MariiaHubColors.Error,
    onError = Color.White,
    errorContainer = MariiaHubColors.ErrorVariant,
    onErrorContainer = Color.White,
    background = Color.White,
    onBackground = Color.Black,
    surface = Color.White,
    onSurface = Color.Black,
    surfaceVariant = MariiaHubColors.Surface,
    onSurfaceVariant = MariiaHubColors.TextSecondary,
    outline = MariiaHubColors.Border,
    outlineVariant = MariiaHubColors.BorderFocus,
    scrim = MariiaHubColors.Shadow,
    inverseSurface = Color.Black,
    inverseOnSurface = Color.White,
    inversePrimary = MariiaHubColors.ChampagneLight,
    surfaceDim = Color(0xFFE8E8E8),
    surfaceBright = Color.White,
    surfaceContainerLowest = Color.White,
    surfaceContainerLow = Color(0xFFF5F5F5),
    surfaceContainer = Color(0xFFEEEEEE),
    surfaceContainerHigh = Color(0xFFE8E8E8),
    surfaceContainerHighest = Color(0xFFE2E2E2),
)

val DarkColorScheme = androidx.compose.material3.darkColorScheme(
    primary = MariiaHubColors.ChampagneLight,
    onPrimary = Color.Black,
    primaryContainer = MariiaHubColors.Primary,
    onPrimaryContainer = MariiaHubColors.ChampagneLight,
    secondary = MariiaHubColors.GoldVariant,
    onSecondary = Color.Black,
    secondaryContainer = MariiaHubColors.PrimaryVariant,
    onSecondaryContainer = MariiaHubColors.ChampagneLight,
    tertiary = MariiaHubColors.Accent,
    onTertiary = Color.Black,
    tertiaryContainer = MariiaHubColors.PrimaryVariant,
    onTertiaryContainer = MariiaHubColors.ChampagneLight,
    error = MariiaHubColors.Error,
    onError = Color.Black,
    errorContainer = MariiaHubColors.ErrorVariant,
    onErrorContainer = Color.Black,
    background = MariiaHubColors.Background,
    onBackground = MariiaHubColors.TextPrimary,
    surface = MariiaHubColors.BackgroundVariant,
    onSurface = MariiaHubColors.TextPrimary,
    surfaceVariant = MariiaHubColors.Surface,
    onSurfaceVariant = MariiaHubColors.TextSecondary,
    outline = MariiaHubColors.Border,
    outlineVariant = MariiaHubColors.BorderFocus,
    scrim = MariiaHubColors.Shadow,
    inverseSurface = Color.White,
    inverseOnSurface = Color.Black,
    inversePrimary = MariiaHubColors.Primary,
    surfaceDim = Color(0xFF121212),
    surfaceBright = Color(0xFF1E1E1E),
    surfaceContainerLowest = Color(0xFF0D0D0D),
    surfaceContainerLow = Color(0xFF1A1A1A),
    surfaceContainer = Color(0xFF1E1E1E),
    surfaceContainerHigh = Color(0xFF252525),
    surfaceContainerHighest = Color(0xFF2A2A2A),
)