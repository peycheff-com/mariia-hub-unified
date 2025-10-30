package com.mariaborysevych.beautyfitness.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

// Luxury theme configuration matching web platform aesthetic
private val DarkColorScheme = darkColorScheme(
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

private val LightColorScheme = lightColorScheme(
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

@Composable
fun MariiaHubTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    // Dynamic color is available on Android 12+ but we're using custom luxury theme
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.primary.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        shapes = Shapes,
        content = content
    )
}

// Extended theme composable with luxury customizations
@Composable
fun MariiaHubLuxuryTheme(
    darkTheme: Boolean = true, // Default to dark for luxury feel
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = Color.Transparent.toArgb()
            window.navigationBarColor = Color.Transparent.toArgb()
            WindowCompat.setDecorFitsSystemWindows(window, false)
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
            WindowCompat.getInsetsController(window, view).isAppearanceLightNavigationBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        shapes = Shapes,
        content = content
    )
}

// Theme extensions for luxury styling
object MariiaHubThemeExtensions {

    @Composable
    fun getLuxuryColorScheme(): ColorScheme {
        return MaterialTheme.colorScheme
    }

    @Composable
    fun isDarkTheme(): Boolean {
        return MaterialTheme.colorScheme.primary == MariiaHubColors.ChampagneLight
    }

    // Service category specific colors
    @Composable
    fun getServiceCategoryColor(serviceType: String): Color {
        return when (serviceType.lowercase()) {
            "beauty" -> MariiaHubColors.BeautyPrimary
            "fitness" -> MariiaHubColors.FitnessPrimary
            "lifestyle" -> MariiaHubColors.LifestylePrimary
            else -> MaterialTheme.colorScheme.primary
        }
    }

    // Booking step colors
    @Composable
    fun getBookingStepColor(isCompleted: Boolean, isActive: Boolean): Color {
        return when {
            isCompleted -> MariiaHubColors.StepCompleted
            isActive -> MariiaHubColors.StepActive
            else -> MariiaHubColors.StepInactive
        }
    }

    // Glass morphism colors
    @Composable
    fun getGlassSurfaceColor(intensity: Float = 0.2f): Color {
        val baseColor = if (isDarkTheme()) Color.Black else Color.White
        return baseColor.copy(alpha = intensity)
    }

    // Accent colors based on theme
    @Composable
    fun getGoldAccent(): Color {
        return if (isDarkTheme()) MariiaHubColors.Gold else MariiaHubColors.GoldVariant
    }

    @Composable
    fun getChampagneAccent(): Color {
        return if (isDarkTheme()) MariiaHubColors.ChampagneLight else MariiaHubColors.Primary
    }
}