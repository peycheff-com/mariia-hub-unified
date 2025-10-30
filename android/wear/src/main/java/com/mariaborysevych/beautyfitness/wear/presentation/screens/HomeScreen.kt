package com.mariaborysevych.beautyfitness.wear.presentation.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.wear.compose.foundation.CurvedDirection
import androidx.wear.compose.foundation.curvedRow
import androidx.wear.compose.material.*
import androidx.wear.compose.navigation SwipeDismissableNavHost
import com.mariaborysevych.beautyfitness.wear.presentation.components.QuickBookingCard
import com.mariaborysevych.beautyfitness.wear.presentation.components.WorkoutCard
import com.mariaborysevych.beautyfitness.wear.presentation.theme.MariiaHubWearTheme
import com.mariaborysevych.beautyfitness.wear.presentation.viewmodel.HomeViewModel

@Composable
fun HomeScreen(
    onNavigateToBookings: () -> Unit,
    onNavigateToWorkout: () -> Unit,
    onNavigateToProfile: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) {
        viewModel.loadHomeData()
    }

    ScalingLazyColumn(
        modifier = modifier.fillMaxSize(),
        autoCentering = true,
        contentPadding = PaddingValues(
            start = 8.dp,
            end = 8.dp,
            top = 32.dp,
            bottom = 32.dp
        ),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // Header
        item {
            Text(
                text = "Mariia Hub",
                style = MaterialTheme.typography.title3,
                color = MaterialTheme.colors.primary,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
        }

        item {
            Text(
                text = "Beauty & Fitness",
                style = MaterialTheme.typography.caption1,
                color = MaterialTheme.colors.onSurface,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
        }

        // Today's Overview
        item {
            Card(
                onClick = onNavigateToBookings,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "Today",
                        style = MaterialTheme.typography.title2,
                        color = MaterialTheme.colors.primary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "${uiState.todayBookings} bookings",
                        style = MaterialTheme.typography.body1,
                        color = MaterialTheme.colors.onSurface
                    )
                    if (uiState.nextBooking != null) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Next: ${uiState.nextBooking}",
                            style = MaterialTheme.typography.caption2,
                            color = MaterialTheme.colors.onSurfaceVariant
                        )
                    }
                }
            }
        }

        // Quick Booking
        item {
            Text(
                text = "Quick Book",
                style = MaterialTheme.typography.title3,
                color = MaterialTheme.colors.onSurface,
                modifier = Modifier.padding(horizontal = 8.dp)
            )
        }

        uiState.quickBookings.take(3).forEach { booking ->
            item {
                QuickBookingCard(
                    booking = booking,
                    onClick = {
                        // Handle quick booking action
                    }
                )
            }
        }

        // Workout Section
        item {
            Card(
                onClick = onNavigateToWorkout,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "Workout",
                        style = MaterialTheme.typography.title2,
                        color = MaterialTheme.colors.primary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    if (uiState.todayWorkout) {
                        Text(
                            text = "Start Workout",
                            style = MaterialTheme.typography.body1,
                            color = MaterialTheme.colors.primary
                        )
                    } else {
                        Text(
                            text = "No workout planned",
                            style = MaterialTheme.typography.caption1,
                            color = MaterialTheme.colors.onSurfaceVariant
                        )
                    }
                }
            }
        }

        // Fitness Stats
        item {
            Text(
                text = "Today's Activity",
                style = MaterialTheme.typography.title3,
                color = MaterialTheme.colors.onSurface,
                modifier = Modifier.padding(horizontal = 8.dp)
            )
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "${uiState.steps}",
                            style = MaterialTheme.typography.title2,
                            color = MaterialTheme.colors.primary
                        )
                        Text(
                            text = "Steps",
                            style = MaterialTheme.typography.caption2,
                            color = MaterialTheme.colors.onSurfaceVariant
                        )
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "${uiState.calories}",
                            style = MaterialTheme.typography.title2,
                            color = MaterialTheme.colors.primary
                        )
                        Text(
                            text = "Calories",
                            style = MaterialTheme.typography.caption2,
                            color = MaterialTheme.colors.onSurfaceVariant
                        )
                    }
                }
            }
        }

        // Profile Access
        item {
            Card(
                onClick = onNavigateToProfile,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Profile",
                        style = MaterialTheme.typography.body1,
                        color = MaterialTheme.colors.onSurface
                    )
                }
            }
        }
    }
}