package com.mariaborysevych.beautyfitness

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.tooling.preview.Preview
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.google.accompanist.systemuicontroller.rememberSystemUiController
import com.mariaborysevych.beautyfitness.ui.theme.MariiaHubTheme
import com.mariaborysevych.beautyfitness.presentation.navigation.MariiaHubNavigation
import com.mariaborysevych.beautyfitness.presentation.auth.AuthViewModel
import com.mariaborysevych.beautyfitness.presentation.onboarding.OnboardingScreen
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Install splash screen
        installSplashScreen()

        // Enable edge-to-edge display
        enableEdgeToEdge()

        setContent {
            MariiaHubTheme {
                MariiaHubApp()
            }
        }
    }
}

@Composable
fun MariiaHubApp() {
    val authViewModel: AuthViewModel = hiltViewModel()
    val authState by authViewModel.authState.collectAsStateWithLifecycle()
    val systemUiController = rememberSystemUiController()
    val darkTheme = isSystemInDarkTheme()

    // Configure system UI for luxury feel
    DisposableEffect(systemUiController, darkTheme) {
        systemUiController.setSystemBarsColor(
            color = Color.Transparent,
            darkIcons = !darkTheme
        )
        systemUiController.setNavigationBarColor(
            color = Color.Transparent,
            darkIcons = !darkTheme
        )
        onDispose {}
    }

    when {
        authState.isLoading -> {
            // Show loading/splash screen
        }
        authState.isOnboardingRequired -> {
            OnboardingScreen(
                onComplete = { authViewModel.completeOnboarding() }
            )
        }
        else -> {
            MariiaHubNavigation()
        }
    }
}

@Preview(showBackground = true)
@Composable
fun MariiaHubAppPreview() {
    MariiaHubTheme {
        MariiaHubApp()
    }
}