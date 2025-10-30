package com.mariiahub.wear.presentation.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.material.*
import androidx.wear.compose.ui.curvedText
import androidx.wear.compose.ui.tooling.preview.WearPreviewDevices
import com.mariiahub.wear.domain.model.ActionType
import com.mariiahub.wear.presentation.viewmodel.MainViewModel
import com.mariiahub.wear.ui.theme.MariiaHubWearTheme

@Composable
fun QuickActionsScreen(
    mainViewModel: MainViewModel,
    onNavigateBack: () -> Unit,
    onNavigateToBooking: () -> Unit,
    onNavigateToWorkout: () -> Unit
) {
    val scrollState = rememberScalingLazyListState()
    val scaffoldState = rememberScaffoldState()
    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        mainViewModel.loadQuickActions()
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
                        text = "Quick Actions",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            item {
                // Premium Actions Grid
                Text(
                    text = "Premium Actions",
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colors.primary
                )
            }

            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    QuickActionButton(
                        icon = Icons.Default.Add,
                        label = "Book",
                        color = Color(0xFFD4AF37),
                        onClick = onNavigateToBooking
                    )
                    QuickActionButton(
                        icon = Icons.Default.FitnessCenter,
                        label = "Workout",
                        color = Color(0xFF4CAF50),
                        onClick = onNavigateToWorkout
                    )
                    QuickActionButton(
                        icon = Icons.Default.Phone,
                        label = "Call",
                        color = Color(0xFF2196F3),
                        onClick = { /* Handle call */ }
                    )
                }
            }

            item {
                Spacer(modifier = Modifier.height(24.dp))
            }

            item {
                // Standard Actions
                Text(
                    text = "Standard Actions",
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colors.onSurface.copy(alpha = 0.8f)
                )
            }

            items(getStandardActions()) { action ->
                StandardActionCard(
                    action = action,
                    onClick = { handleAction(action, mainViewModel) }
                )
            }

            item {
                // Emergency Action
                Spacer(modifier = Modifier.height(16.dp))
                EmergencyActionCard(
                    onClick = { handleEmergencyAction(mainViewModel) }
                )
            }

            item {
                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }
}

@Composable
fun QuickActionButton(
    icon: ImageVector,
    label: String,
    color: Color,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .padding(4.dp)
    ) {
        Button(
            onClick = onClick,
            modifier = Modifier
                .size(48.dp)
                .background(
                    color = color.copy(alpha = 0.2f),
                    shape = CircleShape
                ),
            colors = ButtonDefaults.buttonColors(
                backgroundColor = color.copy(alpha = 0.1f)
            )
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = color,
                modifier = Modifier.size(24.dp)
            )
        }

        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = label,
            fontSize = 10.sp,
            fontWeight = FontWeight.Medium,
            color = MaterialTheme.colors.onSurface.copy(alpha = 0.8f),
            textAlign = TextAlign.Center
        )
    }
}

@Composable
fun StandardActionCard(
    action: QuickActionData,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp),
        background = CardDefaults.cardBackground(
            activeBackgroundColor = MaterialTheme.colors.surface
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .background(
                        color = action.color.copy(alpha = 0.2f),
                        shape = RoundedCornerShape(16.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = action.icon,
                    contentDescription = action.title,
                    tint = action.color,
                    modifier = Modifier.size(16.dp)
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = action.title,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colors.onSurface
                )
                Text(
                    text = action.description,
                    fontSize = 12.sp,
                    color = MaterialTheme.colors.onSurface.copy(alpha = 0.7f)
                )
            }

            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = null,
                tint = MaterialTheme.colors.onSurface.copy(alpha = 0.5f),
                modifier = Modifier.size(16.dp)
            )
        }
    }
}

@Composable
fun EmergencyActionCard(
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp),
        background = CardDefaults.cardBackground(
            activeBackgroundColor = Color(0xFFE53935).copy(alpha = 0.2f)
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .background(
                        color = Color(0xFFE53935),
                        shape = CircleShape
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.PriorityHigh,
                    contentDescription = "Emergency",
                    tint = Color.White,
                    modifier = Modifier.size(16.dp)
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = "Emergency Contact",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFFE53935)
                )
                Text(
                    text = "Get immediate help",
                    fontSize = 12.sp,
                    color = MaterialTheme.colors.onSurface.copy(alpha = 0.7f)
                )
            }

            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = null,
                tint = Color(0xFFE53935).copy(alpha = 0.7f),
                modifier = Modifier.size(16.dp)
            )
        }
    }
}

private fun getStandardActions(): List<QuickActionData> {
    return listOf(
        QuickActionData(
            title = "Get Directions",
            description = "Navigate to salon",
            icon = Icons.Default.Place,
            color = Color(0xFFFF9800),
            actionType = ActionType.GET_DIRECTIONS
        ),
        QuickActionData(
            title = "Send Message",
            description = "Quick text to salon",
            icon = Icons.Default.Message,
            color = Color(0xFF9C27B0),
            actionType = ActionType.SEND_MESSAGE
        ),
        QuickActionData(
            title = "View Profile",
            description = "Your premium profile",
            icon = Icons.Default.Person,
            color = Color(0xFF607D8B),
            actionType = ActionType.QUICK_BOOK
        ),
        QuickActionData(
            title = "Health Stats",
            description = "Today's health data",
            icon = Icons.Default.Favorite,
            color = Color(0xFFE91E63),
            actionType = ActionType.START_WORKOUT
        )
    )
}

private fun handleAction(action: QuickActionData, mainViewModel: MainViewModel) {
    // Handle different action types
    when (action.actionType) {
        ActionType.QUICK_BOOK -> {
            // Navigate to booking
        }
        ActionType.CALL_SALON -> {
            // Initiate phone call
        }
        ActionType.GET_DIRECTIONS -> {
            // Open maps
        }
        ActionType.SEND_MESSAGE -> {
            // Open messages
        }
        ActionType.START_WORKOUT -> {
            // Start workout session
        }
        ActionType.EMERGENCY_CONTACT -> {
            // Handle emergency
        }
    }
}

private fun handleEmergencyAction(mainViewModel: MainViewModel) {
    // Handle emergency action - send notification, call emergency contact, etc.
}

data class QuickActionData(
    val title: String,
    val description: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val color: Color,
    val actionType: ActionType
)

@WearPreviewDevices
@Composable
fun QuickActionsScreenPreview() {
    MariiaHubWearTheme {
        // Preview would need mock viewmodel data
    }
}