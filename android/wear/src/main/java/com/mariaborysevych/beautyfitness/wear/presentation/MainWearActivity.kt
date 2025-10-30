package com.mariaborysevych.beautyfitness.wear.presentation

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.wear.compose.navigation.SwipeDismissableNavHost
import androidx.wear.compose.navigation.composable
import androidx.wear.compose.navigation.rememberSwipeDismissableNavController
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.navigation.wearableNavigator
import com.mariaborysevych.beautyfitness.wear.presentation.screens.*
import com.mariaborysevych.beautyfitness.wear.presentation.theme.MariiaHubWearTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainWearActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            MariiaHubWearApp()
        }
    }
}

@Composable
fun MariiaHubWearApp() {
    MariiaHubWearTheme {
        val navController = rememberSwipeDismissableNavController()

        SwipeDismissableNavHost(
            navController = navController,
            startDestination = Screen.Home.route
        ) {
            composable(Screen.Home.route) {
                HomeScreen(
                    onNavigateToBookings = {
                        navController.navigate(Screen.Bookings.route)
                    },
                    onNavigateToWorkout = {
                        navController.navigate(Screen.Workout.route)
                    },
                    onNavigateToProfile = {
                        navController.navigate(Screen.Profile.route)
                    }
                )
            }

            composable(Screen.Bookings.route) {
                BookingsScreen(
                    onNavigateBack = {
                        navController.popBackStack()
                    },
                    onNavigateToBookingDetail = { bookingId ->
                        navController.navigate(Screen.BookingDetail.createRoute(bookingId))
                    }
                )
            }

            composable(Screen.BookingDetail.route) { backStackEntry ->
                val bookingId = backStackEntry.arguments?.getString("bookingId")
                bookingId?.let {
                    BookingDetailScreen(
                        bookingId = it,
                        onNavigateBack = {
                            navController.popBackStack()
                        }
                    )
                }
            }

            composable(Screen.Workout.route) {
                WorkoutScreen(
                    onNavigateBack = {
                        navController.popBackStack()
                    },
                    onNavigateToWorkoutActive = {
                        navController.navigate(Screen.WorkoutActive.route)
                    }
                )
            }

            composable(Screen.WorkoutActive.route) {
                WorkoutActiveScreen(
                    onNavigateBack = {
                        navController.popBackStack()
                    }
                )
            }

            composable(Screen.Profile.route) {
                ProfileScreen(
                    onNavigateBack = {
                        navController.popBackStack()
                    },
                    onNavigateToSettings = {
                        navController.navigate(Screen.Settings.route)
                    }
                )
            }

            composable(Screen.Settings.route) {
                SettingsScreen(
                    onNavigateBack = {
                        navController.popBackStack()
                    }
                )
            }
        }
    }
}

sealed class Screen(val route: String) {
    object Home : Screen("home")
    object Bookings : Screen("bookings")
    object BookingDetail : Screen("booking_detail/{bookingId}") {
        fun createRoute(bookingId: String) = "booking_detail/$bookingId"
    }
    object Workout : Screen("workout")
    object WorkoutActive : Screen("workout_active")
    object Profile : Screen("profile")
    object Settings : Screen("settings")
}