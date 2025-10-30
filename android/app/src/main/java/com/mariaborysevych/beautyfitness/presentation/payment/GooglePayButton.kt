package com.mariaborysevych.beautyfitness.presentation.payment

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.vectorResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mariaborysevych.beautyfitness.R
import com.mariaborysevych.beautyfitness.ui.theme.MariiaHubColors
import com.mariaborysevych.beautyfitness.ui.theme.MariiaHubShapes

@Composable
fun GooglePayButton(
    amount: Long,
    currency: String = "PLN",
    onPaymentSuccess: (PaymentResult) -> Unit,
    onPaymentError: (String) -> Unit,
    modifier: Modifier = Modifier,
    viewModel: GooglePayViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(uiState.paymentResult) {
        uiState.paymentResult?.let { result ->
            when (result.status) {
                PaymentStatus.SUCCESS -> {
                    onPaymentSuccess(result)
                    viewModel.clearPaymentResult()
                }
                PaymentStatus.FAILED -> {
                    onPaymentError(result.errorMessage ?: "Payment failed")
                    viewModel.clearPaymentResult()
                }
                PaymentStatus.CANCELLED -> {
                    // Handle cancellation if needed
                    viewModel.clearPaymentResult()
                }
            }
        }
    }

    LaunchedEffect(uiState.error) {
        uiState.error?.let { error ->
            onPaymentError(error)
            viewModel.clearError()
        }
    }

    if (uiState.isGooglePayAvailable) {
        GooglePayButtonContent(
            amount = amount,
            currency = currency,
            isLoading = uiState.isLoading,
            onClick = { viewModel.requestPayment(amount, currency) },
            modifier = modifier
        )
    } else {
        GooglePayUnavailable(modifier = modifier)
    }
}

@Composable
private fun GooglePayButtonContent(
    amount: Long,
    currency: String,
    isLoading: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(48.dp)
            .clip(RoundedCornerShape(50))
            .background(Color.Black)
            .border(
                BorderStroke(1.dp, Color.Gray.copy(alpha = 0.5f)),
                RoundedCornerShape(50)
            )
            .clickable(enabled = !isLoading) { onClick() },
        contentAlignment = Alignment.Center
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.size(24.dp),
                color = Color.White,
                strokeWidth = 2.dp
            )
        } else {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
            ) {
                // Google Pay "G" logo
                GooglePayLogo(
                    modifier = Modifier.size(20.dp)
                )

                Spacer(modifier = Modifier.width(12.dp))

                Text(
                    text = "Pay with Google Pay",
                    color = Color.White,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Medium
                )

                Spacer(modifier = Modifier.width(8.dp))

                Icon(
                    Icons.Default.Lock,
                    contentDescription = "Secure payment",
                    tint = Color.White,
                    modifier = Modifier.size(14.dp)
                )
            }
        }
    }
}

@Composable
private fun GooglePayLogo(
    modifier: Modifier = Modifier
) {
    // Simplified Google Pay logo using shapes
    // In production, you'd use the actual Google Pay logo assets
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Blue "G"
        Box(
            modifier = Modifier
                .size(20.dp)
                .background(
                    Color(0xFF4285F4),
                    RoundedCornerShape(4.dp)
                ),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "G",
                color = Color.White,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.width(2.dp))

        // Red "Pay"
        Box(
            modifier = Modifier
                .background(
                    Color.Transparent,
                    RoundedCornerShape(4.dp)
                ),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "Pay",
                color = Color(0xFFEA4335),
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
private fun GooglePayUnavailable(
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        ),
        shape = MariiaHubShapes.ButtonPrimary,
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Lock,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(20.dp)
            )

            Spacer(modifier = Modifier.width(8.dp))

            Text(
                text = "Google Pay not available",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

// Alternative luxury styled Google Pay button for premium feel
@Composable
fun LuxuryGooglePayButton(
    amount: Long,
    currency: String = "PLN",
    onPaymentSuccess: (PaymentResult) -> Unit,
    onPaymentError: (String) -> Unit,
    modifier: Modifier = Modifier,
    viewModel: GooglePayViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(uiState.paymentResult) {
        uiState.paymentResult?.let { result ->
            when (result.status) {
                PaymentStatus.SUCCESS -> {
                    onPaymentSuccess(result)
                    viewModel.clearPaymentResult()
                }
                PaymentStatus.FAILED -> {
                    onPaymentError(result.errorMessage ?: "Payment failed")
                    viewModel.clearPaymentResult()
                }
                PaymentStatus.CANCELLED -> {
                    viewModel.clearPaymentResult()
                }
            }
        }
    }

    if (uiState.isGooglePayAvailable) {
        LuxuryGooglePayButtonContent(
            amount = amount,
            currency = currency,
            isLoading = uiState.isLoading,
            onClick = { viewModel.requestPayment(amount, currency) },
            modifier = modifier
        )
    } else {
        GooglePayUnavailable(modifier = modifier)
    }
}

@Composable
private fun LuxuryGooglePayButtonContent(
    amount: Long,
    currency: String,
    isLoading: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(56.dp)
            .clip(MariiaHubShapes.ButtonPrimary)
            .background(
                androidx.compose.ui.graphics.Brush.linearGradient(
                    colors = listOf(
                        MariiaHubColors.Primary,
                        MariiaHubColors.Gold
                    )
                )
            )
            .border(
                BorderStroke(1.dp, MariiaHubColors.Border),
                MariiaHubShapes.ButtonPrimary
            )
            .clickable(enabled = !isLoading) { onClick() },
        contentAlignment = Alignment.Center
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.size(24.dp),
                color = Color.White,
                strokeWidth = 2.dp
            )
        } else {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center,
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp)
            ) {
                GooglePayLogo(
                    modifier = Modifier.size(24.dp)
                )

                Spacer(modifier = Modifier.width(12.dp))

                Text(
                    text = "Pay with Google Pay",
                    color = Color.White,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 0.5.sp
                )

                Spacer(modifier = Modifier.width(8.dp))

                Icon(
                    Icons.Default.Lock,
                    contentDescription = "Secure payment",
                    tint = Color.White,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}