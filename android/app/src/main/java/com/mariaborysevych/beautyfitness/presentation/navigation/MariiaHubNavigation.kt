package com.mariaborysevych.beautyfitness.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.mariaborysevych.beautyfitness.presentation.auth.AuthScreen
import com.mariaborysevych.beautyfitness.presentation.home.HomeScreen
import com.mariaborysevych.beautyfitness.presentation.booking.BookingWizardScreen
import com.mariaborysevych.beautyfitness.presentation.services.ServicesScreen
import com.mariaborysevych.beautyfitness.presentation.profile.ProfileScreen
import com.mariaborysevych.beautyfitness.presentation.splash.SplashScreen

@Composable
fun MariiaHubNavigation(
    modifier: Modifier = Modifier,
    navController: NavHostController = rememberNavController()
) {
    NavHost(
        navController = navController,
        startDestination = Screen.Splash.route,
        modifier = modifier
    ) {
        // Splash Screen
        composable(Screen.Splash.route) {
            SplashScreen(
                onNavigationComplete = { destination ->
                    when (destination) {
                        "home" -> navController.navigate(Screen.Home.route) {
                            popUpTo(Screen.Splash.route) { inclusive = true }
                        }
                        "auth" -> navController.navigate(Screen.Auth.route) {
                            popUpTo(Screen.Splash.route) { inclusive = true }
                        }
                        "onboarding" -> navController.navigate(Screen.Onboarding.route) {
                            popUpTo(Screen.Splash.route) { inclusive = true }
                        }
                    }
                }
            )
        }

        // Authentication Flow
        composable(Screen.Auth.route) {
            AuthScreen(
                onAuthSuccess = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Auth.route) { inclusive = true }
                    }
                },
                onNavigateToSignUp = {
                    navController.navigate(Screen.SignUp.route)
                }
            )
        }

        composable(Screen.SignUp.route) {
            // Sign Up Screen
        }

        // Onboarding
        composable(Screen.Onboarding.route) {
            // OnboardingScreen handled in MainActivity
        }

        // Main App Navigation
        composable(Screen.Home.route) {
            HomeScreen(
                onNavigateToServices = { serviceType ->
                    navController.navigate(Screen.Services.createRoute(serviceType))
                },
                onNavigateToBooking = { serviceId ->
                    navController.navigate(Screen.BookingWizard.createRoute(serviceId))
                },
                onNavigateToProfile = {
                    navController.navigate(Screen.Profile.route)
                }
            )
        }

        // Services
        composable(Screen.Services.route) { backStackEntry ->
            val serviceType = backStackEntry.arguments?.getString("serviceType")
            ServicesScreen(
                serviceType = serviceType,
                onServiceSelected = { serviceId ->
                    navController.navigate(Screen.BookingWizard.createRoute(serviceId))
                },
                onNavigateBack = {
                    navController.navigateUp()
                }
            )
        }

        // Booking Wizard
        composable(Screen.BookingWizard.route) { backStackEntry ->
            val serviceId = backStackEntry.arguments?.getString("serviceId")
            serviceId?.let { id ->
                BookingWizardScreen(
                    serviceId = id,
                    onBookingComplete = { bookingId ->
                        navController.navigate(Screen.BookingConfirmation.createRoute(bookingId)) {
                            popUpTo(Screen.Home.route)
                        }
                    },
                    onNavigateBack = {
                        navController.navigateUp()
                    }
                )
            }
        }

        composable(Screen.BookingConfirmation.route) { backStackEntry ->
            val bookingId = backStackEntry.arguments?.getString("bookingId")
            // Booking Confirmation Screen
        }

        // Profile
        composable(Screen.Profile.route) {
            ProfileScreen(
                onNavigateToBookings = {
                    navController.navigate(Screen.MyBookings.route)
                },
                onNavigateToSettings = {
                    navController.navigate(Screen.Settings.route)
                },
                onSignOut = {
                    navController.navigate(Screen.Auth.route) {
                        popUpTo(Screen.Home.route) { inclusive = true }
                    }
                }
            )
        }

        // My Bookings
        composable(Screen.MyBookings.route) {
            // My Bookings Screen
        }

        // Settings
        composable(Screen.Settings.route) {
            // Settings Screen
        }

        // Service Detail
        composable(Screen.ServiceDetail.route) { backStackEntry ->
            val serviceId = backStackEntry.arguments?.getString("serviceId")
            serviceId?.let { id ->
                // Service Detail Screen
            }
        }
    }
}

// Navigation Routes
sealed class Screen(val route: String) {
    object Splash : Screen("splash")
    object Auth : Screen("auth")
    object SignUp : Screen("sign_up")
    object Onboarding : Screen("onboarding")
    object Home : Screen("home")
    object Services : Screen("services/{serviceType}") {
        fun createRoute(serviceType: String) = "services/$serviceType"
    }
    object ServiceDetail : Screen("service_detail/{serviceId}") {
        fun createRoute(serviceId: String) = "service_detail/$serviceId"
    }
    object BookingWizard : Screen("booking_wizard/{serviceId}") {
        fun createRoute(serviceId: String) = "booking_wizard/$serviceId"
    }
    object BookingConfirmation : Screen("booking_confirmation/{bookingId}") {
        fun createRoute(bookingId: String) = "booking_confirmation/$bookingId"
    }
    object Profile : Screen("profile")
    object MyBookings : Screen("my_bookings")
    object Settings : Screen("settings")
}

// Navigation extensions
fun NavController.navigateToServices(serviceType: String? = null) {
    if (serviceType != null) {
        navigate(Screen.Services.createRoute(serviceType))
    } else {
        navigate(Screen.Services.route)
    }
}

fun NavController.navigateToBookingWizard(serviceId: String) {
    navigate(Screen.BookingWizard.createRoute(serviceId))
}

fun NavController.navigateToServiceDetail(serviceId: String) {
    navigate(Screen.ServiceDetail.createRoute(serviceId))
}

fun NavController.navigateToBookingConfirmation(bookingId: String) {
    navigate(Screen.BookingConfirmation.createRoute(bookingId))
}