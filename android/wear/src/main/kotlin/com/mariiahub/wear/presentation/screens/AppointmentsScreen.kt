package com.mariiahub.wear.presentation.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.material.*
import androidx.wear.compose.ui.tooling.preview.WearPreviewDevices
import com.mariiahub.wear.domain.model.*
import com.mariiahub.wear.presentation.viewmodel.MainViewModel
import com.mariiahub.wear.ui.theme.MariiaHubWearTheme
import kotlinx.coroutines.launch

@Composable
fun AppointmentsScreen(
    mainViewModel: MainViewModel,
    onNavigateBack: () -> Unit,
    onAppointmentClick: (Appointment) -> Unit
) {
    val scrollState = rememberScalingLazyListState()
    val scaffoldState = rememberScaffoldState()
    val coroutineScope = rememberCoroutineScope()
    val uiState by mainViewModel.uiState.collectAsState()

    LaunchedEffect(Unit) {
        mainViewModel.loadAppointments()
    }

    Scaffold(
        state = scaffoldState,
        vignette = {
            Vignette(vignetteAlpha = 0.5f)
        },
        positionIndicator = {
            PositionIndicator(scalingLazyListState = scrollState)
        },
        timeText = {
            TimeText()
        }
    ) {
        ScalingLazyColumn(
            modifier = Modifier.fillMaxSize(),
            autoCentering = true,
            state = scrollState
        ) {
            item {
                ListHeader {
                    Text(
                        text = "Appointments",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            if (uiState.todayAppointments.isEmpty()) {
                item {
                    EmptyState(
                        icon = Icons.Default.CalendarToday,
                        title = "No appointments today",
                        subtitle = "Enjoy your free time!"
                    )
                }
            } else {
                item {
                    Text(
                        text = "Today",
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colors.onSurface.copy(alpha = 0.7f)
                    )
                }

                items(uiState.todayAppointments) { appointment ->
                    AppointmentCard(
                        appointment = appointment,
                        onClick = { onAppointmentClick(appointment) }
                    )
                }

                item {
                    Spacer(modifier = Modifier.height(16.dp))
                }

                if (uiState.upcomingAppointments.isNotEmpty()) {
                    item {
                        Text(
                            text = "Upcoming",
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colors.onSurface.copy(alpha = 0.7f)
                        )
                    }

                    items(uiState.upcomingAppointments.take(3)) { appointment ->
                        AppointmentCard(
                            appointment = appointment,
                            isUpcoming = true,
                            onClick = { onAppointmentClick(appointment) }
                        )
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }
}

@Composable
fun AppointmentCard(
    appointment: Appointment,
    isUpcoming: Boolean = false,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp),
        background = CardDefaults.cardBackground(
            activeBackgroundColor = if (isUpcoming) {
                MaterialTheme.colors.surface.copy(alpha = 0.5f)
            } else {
                when (appointment.status) {
                    AppointmentStatus.CONFIRMED -> Color(0xFF4CAF50).copy(alpha = 0.2f)
                    AppointmentStatus.PENDING -> Color(0xFFFF9800).copy(alpha = 0.2f)
                    AppointmentStatus.COMPLETED -> Color(0xFF2196F3).copy(alpha = 0.2f)
                    AppointmentStatus.CANCELLED -> Color(0xFFF44336).copy(alpha = 0.2f)
                    else -> MaterialTheme.colors.surface
                }
            }
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = appointment.clientName,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colors.onSurface,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )

                    Text(
                        text = appointment.formattedTime,
                        fontSize = 12.sp,
                        color = MaterialTheme.colors.primary,
                        fontWeight = FontWeight.Medium
                    )

                    Text(
                        text = appointment.serviceName,
                        fontSize = 10.sp,
                        color = MaterialTheme.colors.onSurface.copy(alpha = 0.7f),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                // Status indicator
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .background(
                            color = when (appointment.status) {
                                AppointmentStatus.CONFIRMED -> Color(0xFF4CAF50)
                                AppointmentStatus.PENDING -> Color(0xFFFF9800)
                                AppointmentStatus.COMPLETED -> Color(0xFF2196F3)
                                AppointmentStatus.CANCELLED -> Color(0xFFF44336)
                                else -> Color.Gray
                            },
                            shape = androidx.compose.foundation.shape.CircleShape
                        )
                )
            }

            if (!isUpcoming && appointment.status == AppointmentStatus.CONFIRMED) {
                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Schedule,
                        contentDescription = null,
                        tint = MaterialTheme.colors.primary,
                        modifier = Modifier.size(12.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "30 min",
                        fontSize = 10.sp,
                        color = MaterialTheme.colors.onSurface.copy(alpha = 0.6f)
                    )
                }
            }
        }
    }
}

@Composable
fun EmptyState(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = MaterialTheme.colors.primary,
            modifier = Modifier.size(48.dp)
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = title,
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colors.onSurface,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = subtitle,
            fontSize = 12.sp,
            color = MaterialTheme.colors.onSurface.copy(alpha = 0.7f),
            textAlign = TextAlign.Center
        )
    }
}

@WearPreviewDevices
@Composable
fun AppointmentsScreenPreview() {
    MariiaHubWearTheme {
        // Preview would need mock viewmodel data
    }
}