package com.mariiahub.wear

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.wear.compose.foundation.CurvedTextStyle
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.foundation.rememberActiveFocusRequester
import androidx.wear.compose.material.*
import androidx.wear.compose.navigation.SwipeDismissableNavHost
import androidx.wear.compose.navigation.composable
import androidx.wear.compose.navigation.rememberSwipeDismissableNavController
import androidx.wear.compose.ui.curvedText
import androidx.wear.compose.ui.tooling.preview.WearPreviewDevices
import androidx.wear.tiles.tooling.preview.Preview
import androidx.wear.tiles.tooling.preview.TilePreviewData
import com.mariiahub.wear.presentation.MariiaHubWearApp
import com.mariiahub.wear.presentation.screens.*
import com.mariiahub.wear.ui.theme.MariiaHubWearTheme
import com.mariiahub.wear.presentation.viewmodel.MainViewModel
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var healthManager: com.mariiahub.wear.domain.health.HealthManager

    @Inject
    lateinit var connectivityManager: com.mariiahub.wear.domain.connectivity.ConnectivityManager

    @Inject
    lateinit var hapticManager: com.mariiahub.wear.domain.haptic.HapticManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            WearApp()
        }
    }
}

@Composable
fun WearApp(
    mainViewModel: MainViewModel = viewModel()
) {
    MariiaHubWearTheme {
        val navController = rememberSwipeDismissableNavController()
        val focusRequester = rememberActiveFocusRequester()

        LaunchedEffect(Unit) {
            focusRequester.requestFocus()
            mainViewModel.initialize()
        }

        SwipeDismissableNavHost(
            navController = navController,
            startDestination = "main",
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colors.background)
        ) {
            composable("main") {
                MainScreen(
                    mainViewModel = mainViewModel,
                    onNavigateToAppointments = {
                        navController.navigate("appointments")
                    },
                    onNavigateToQuickActions = {
                        navController.navigate("quick_actions")
                    },
                    onNavigateToStats = {
                        navController.navigate("stats")
                    },
                    onNavigateToProfile = {
                        navController.navigate("profile")
                    }
                )
            }

            composable("appointments") {
                AppointmentsScreen(
                    mainViewModel = mainViewModel,
                    onNavigateBack = {
                        navController.popBackStack()
                    },
                    onAppointmentClick = { appointment ->
                        navController.navigate("appointment_detail/${appointment.id}")
                    }
                )
            }

            composable("appointment_detail/{appointmentId}") { backStackEntry ->
                val appointmentId = backStackEntry.arguments?.getString("appointmentId")
                AppointmentDetailScreen(
                    appointmentId = appointmentId ?: "",
                    mainViewModel = mainViewModel,
                    onNavigateBack = {
                        navController.popBackStack()
                    }
                )
            }

            composable("quick_actions") {
                QuickActionsScreen(
                    mainViewModel = mainViewModel,
                    onNavigateBack = {
                        navController.popBackStack()
                    },
                    onNavigateToBooking = {
                        navController.navigate("quick_booking")
                    },
                    onNavigateToWorkout = {
                        navController.navigate("workout")
                    }
                )
            }

            composable("quick_booking") {
                QuickBookingScreen(
                    mainViewModel = mainViewModel,
                    onNavigateBack = {
                        navController.popBackStack()
                    }
                )
            }

            composable("workout") {
                WorkoutScreen(
                    mainViewModel = mainViewModel,
                    onNavigateBack = {
                        navController.popBackStack()
                    }
                )
            }

            composable("stats") {
                StatsScreen(
                    mainViewModel = mainViewModel,
                    onNavigateBack = {
                        navController.popBackStack()
                    }
                )
            }

            composable("profile") {
                ProfileScreen(
                    mainViewModel = mainViewModel,
                    onNavigateBack = {
                        navController.popBackStack()
                    },
                    onNavigateToSettings = {
                        navController.navigate("settings")
                    }
                )
            }

            composable("settings") {
                SettingsScreen(
                    mainViewModel = mainViewModel,
                    onNavigateBack = {
                        navController.popBackStack()
                    }
                )
            }
        }
    }
}

@Composable
fun MainScreen(
    mainViewModel: MainViewModel,
    onNavigateToAppointments: () -> Unit,
    onNavigateToQuickActions: () -> Unit,
    onNavigateToStats: () -> Unit,
    onNavigateToProfile: () -> Unit
) {
    val pagerState = rememberPagerState(pageCount = { 4 })
    val uiState by mainViewModel.uiState.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colors.background)
    ) {
        // Curved text at the top
        curvedText(
            text = "Mariia Hub",
            style = CurvedTextStyle(
                fontSize = 14.sp,
                color = MaterialTheme.colors.primary
            ),
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
                .padding(top = 12.dp)
        )

        // Main content
        HorizontalPager(
            state = pagerState,
            modifier = Modifier
                .fillMaxSize()
                .padding(
                    top = 52.dp,
                    bottom = 52.dp
                )
        ) { page ->
            when (page) {
                0 -> AppointmentsCard(
                    todayAppointments = uiState.todayAppointments,
                    onClick = onNavigateToAppointments
                )
                1 -> QuickActionsCard(
                    onClick = onNavigateToQuickActions
                )
                2 -> StatsCard(
                    stats = uiState.stats,
                    onClick = onNavigateToStats
                )
                3 -> ProfileCard(
                    onClick = onNavigateToProfile
                )
            }
        }

        // Page indicator
        PageIndicator(
            pagerState = pagerState,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 16.dp)
        )
    }
}

@Composable
fun AppointmentsCard(
    todayAppointments: List<com.mariiahub.wear.domain.model.Appointment>,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier
            .fillMaxSize()
            .padding(8.dp),
        background = CardDefaults.cardBackground(
            activeBackgroundColor = MaterialTheme.colors.surface,
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = Icons.Default.CalendarToday,
                contentDescription = "Appointments",
                tint = MaterialTheme.colors.primary,
                modifier = Modifier.size(32.dp)
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Today's Appointments",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colors.onSurface,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "${todayAppointments.size}",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colors.primary,
                textAlign = TextAlign.Center
            )

            if (todayAppointments.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "Next: ${todayAppointments.first().clientName}",
                    fontSize = 12.sp,
                    color = MaterialTheme.colors.onSurface.copy(alpha = 0.7f),
                    textAlign = TextAlign.Center,
                    maxLines = 1
                )
            }
        }
    }
}

@Composable
fun QuickActionsCard(onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = Modifier
            .fillMaxSize()
            .padding(8.dp),
        background = CardDefaults.cardBackground(
            activeBackgroundColor = MaterialTheme.colors.surface,
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = Icons.Default.Bolt,
                contentDescription = "Quick Actions",
                tint = MaterialTheme.colors.primary,
                modifier = Modifier.size(32.dp)
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Quick Actions",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colors.onSurface,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(16.dp))

            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                QuickActionIcon(
                    icon = Icons.Default.Add,
                    contentDescription = "Book"
                )
                QuickActionIcon(
                    icon = Icons.Default.Phone,
                    contentDescription = "Call"
                )
                QuickActionIcon(
                    icon = Icons.Default.Place,
                    contentDescription = "Location"
                )
            }
        }
    }
}

@Composable
fun QuickActionIcon(
    icon: ImageVector,
    contentDescription: String
) {
    Box(
        modifier = Modifier
            .size(32.dp)
            .background(
                MaterialTheme.colors.primary.copy(alpha = 0.2f),
                shape = RoundedCornerShape(16.dp)
            ),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = contentDescription,
            tint = MaterialTheme.colors.primary,
            modifier = Modifier.size(16.dp)
        )
    }
}

@Composable
fun StatsCard(
    stats: com.mariiahub.wear.domain.model.Stats,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier
            .fillMaxSize()
            .padding(8.dp),
        background = CardDefaults.cardBackground(
            activeBackgroundColor = MaterialTheme.colors.surface,
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = Icons.Default.BarChart,
                contentDescription = "Statistics",
                tint = MaterialTheme.colors.primary,
                modifier = Modifier.size(32.dp)
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Statistics",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colors.onSurface,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(16.dp))

            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                StatItem(
                    label = "Revenue",
                    value = formatCurrency(stats.todayRevenue)
                )
                StatItem(
                    label = "Completed",
                    value = "${stats.completedToday}"
                )
                StatItem(
                    label = "Steps",
                    value = "${stats.todaySteps}"
                )
            }
        }
    }
}

@Composable
fun StatItem(label: String, value: String) {
    Row(
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.fillMaxWidth()
    ) {
        Text(
            text = label,
            fontSize = 10.sp,
            color = MaterialTheme.colors.onSurface.copy(alpha = 0.7f)
        )
        Text(
            text = value,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colors.primary
        )
    }
}

@Composable
fun ProfileCard(onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = Modifier
            .fillMaxSize()
            .padding(8.dp),
        background = CardDefaults.cardBackground(
            activeBackgroundColor = MaterialTheme.colors.surface,
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = Icons.Default.Person,
                contentDescription = "Profile",
                tint = MaterialTheme.colors.primary,
                modifier = Modifier.size(32.dp)
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Profile",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colors.onSurface,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Premium Member",
                fontSize = 12.sp,
                color = MaterialTheme.colors.primary,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "156 Total Bookings",
                fontSize = 10.sp,
                color = MaterialTheme.colors.onSurface.copy(alpha = 0.7f),
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
fun PageIndicator(
    pagerState: androidx.compose.foundation.pager.PagerState,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        repeat(pagerState.pageCount) { page ->
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .background(
                        color = if (page == pagerState.currentPage) {
                            MaterialTheme.colors.primary
                        } else {
                            MaterialTheme.colors.onSurface.copy(alpha = 0.3f)
                        },
                        shape = androidx.compose.foundation.shape.CircleShape
                    )
            )

            if (page < pagerState.pageCount - 1) {
                Spacer(modifier = Modifier.width(4.dp))
            }
        }
    }
}

@Preview(device = WearPreviewDevices.ROUND_38MM)
@Composable
fun MainScreenPreview() {
    // This preview would need mock data
    // MariiaHubWearTheme {
    //     MainScreen(
    //         mainViewModel = // mock viewmodel,
    //         onNavigateToAppointments = {},
    //         onNavigateToQuickActions = {},
    //         onNavigateToStats = {},
    //         onNavigateToProfile = {}
    //     )
    // }
}

private fun formatCurrency(amount: Double): String {
    return "PLN ${amount.toInt()}"
}