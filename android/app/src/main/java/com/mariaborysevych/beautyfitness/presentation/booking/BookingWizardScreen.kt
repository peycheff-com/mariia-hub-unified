package com.mariaborysevych.beautyfitness.presentation.booking

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mariaborysevych.beautyfitness.presentation.booking.components.BookingStepIndicator
import com.mariaborysevych.beautyfitness.presentation.booking.components.Step1ServiceSelection
import com.mariaborysevych.beautyfitness.presentation.booking.components.Step2TimeSelection
import com.mariaborysevych.beautyfitness.presentation.booking.components.Step3ClientDetails
import com.mariaborysevych.beautyfitness.presentation.booking.components.Step4Payment
import com.mariaborysevych.beautyfitness.ui.theme.MariiaHubColors
import com.mariaborysevych.beautyfitness.ui.theme.MariiaHubShapes

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BookingWizardScreen(
    serviceId: String,
    onBookingComplete: (String) -> Unit,
    onNavigateBack: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: BookingWizardViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    // Initialize with service ID if provided
    LaunchedEffect(serviceId) {
        if (uiState.currentStep == 1 && uiState.selectedService?.id != serviceId) {
            viewModel.initializeWithService(serviceId)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Book Service",
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            Icons.Default.ArrowBack,
                            contentDescription = "Back",
                            tint = MaterialTheme.colorScheme.onPrimary
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary
                )
            )
        },
        bottomBar = {
            if (uiState.currentStep > 1) {
                BookingBottomBar(
                    currentStep = uiState.currentStep,
                    totalSteps = 4,
                    onPreviousClick = { viewModel.previousStep() },
                    onNextClick = { viewModel.nextStep() },
                    onCompleteClick = {
                        viewModel.completeBooking { bookingId ->
                            onBookingComplete(bookingId)
                        }
                    },
                    canProceed = uiState.canProceedToNext,
                    isCompleting = uiState.isCreatingBooking
                )
            }
        },
        modifier = modifier
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.background)
        ) {
            // Step Indicator
            BookingStepIndicator(
                currentStep = uiState.currentStep,
                totalSteps = 4,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 24.dp)
            )

            // Step Content
            AnimatedContent(
                targetState = uiState.currentStep,
                transitionSpec = {
                    slideInHorizontally(
                        animationSpec = tween(300),
                        initialOffsetX = { it }
                    ) with fadeOut(animationSpec = tween(300))
                },
                label = "booking_step_animation"
            ) { currentStep ->
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 16.dp)
                ) {
                    when (currentStep) {
                        1 -> Step1ServiceSelection(
                            selectedService = uiState.selectedService,
                            selectedLocation = uiState.selectedLocation,
                            availableLocations = uiState.availableLocations,
                            onServiceSelected = { service -> viewModel.selectService(service) },
                            onLocationSelected = { location -> viewModel.selectLocation(location) },
                            onSearchQuery = viewModel::searchServices,
                            searchResults = uiState.searchResults,
                            isLoading = uiState.isLoading
                        )

                        2 -> Step2TimeSelection(
                            selectedService = uiState.selectedService,
                            selectedDate = uiState.selectedDate,
                            selectedTimeSlot = uiState.selectedTimeSlot,
                            availableTimeSlots = uiState.availableTimeSlots,
                            onDateSelected = { date -> viewModel.selectDate(date) },
                            onTimeSlotSelected = { timeSlot -> viewModel.selectTimeSlot(timeSlot) },
                            isLoading = uiState.isLoading,
                            onHoldExpired = { viewModel.handleHoldExpired() }
                        )

                        3 -> Step3ClientDetails(
                            clientDetails = uiState.clientDetails,
                            preferences = uiState.bookingPreferences,
                            onClientDetailsChanged = { details -> viewModel.updateClientDetails(details) },
                            onPreferencesChanged = { prefs -> viewModel.updatePreferences(prefs) },
                            isFormValid = uiState.isClientDetailsValid
                        )

                        4 -> Step4Payment(
                            bookingSummary = uiState.bookingSummary,
                            selectedPaymentMethod = uiState.selectedPaymentMethod,
                            onPaymentMethodSelected = { method -> viewModel.selectPaymentMethod(method) },
                            onPaymentComplete = { paymentResult ->
                                viewModel.processPayment(paymentResult) { bookingId ->
                                    onBookingComplete(bookingId)
                                }
                            },
                            isLoading = uiState.isProcessingPayment,
                            paymentMethods = uiState.availablePaymentMethods
                        )
                    }
                }
            }

            // Error message
            if (uiState.error != null) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer
                    ),
                    shape = MariiaHubShapes.CardStandard
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = uiState.error,
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun BookingBottomBar(
    currentStep: Int,
    totalSteps: Int,
    onPreviousClick: () -> Unit,
    onNextClick: () -> Unit,
    onCompleteClick: () -> Unit,
    canProceed: Boolean,
    isCompleting: Boolean
) {
    Surface(
        shadowElevation = 8.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Previous Button
            if (currentStep > 1) {
                OutlinedButton(
                    onClick = onPreviousClick,
                    modifier = Modifier.widthIn(min = 120.dp),
                    shape = MariiaHubShapes.ButtonSecondary
                ) {
                    Text("Previous")
                }
            } else {
                Spacer(modifier = Modifier.width(120.dp))
            }

            // Progress Text
            Text(
                text = "$currentStep of $totalSteps",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontWeight = FontWeight.Medium
            )

            // Next/Complete Button
            when (currentStep) {
                totalSteps -> {
                    Button(
                        onClick = onCompleteClick,
                        enabled = canProceed && !isCompleting,
                        modifier = Modifier.widthIn(min = 120.dp),
                        shape = MariiaHubShapes.ButtonPrimary
                    ) {
                        if (isCompleting) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                strokeWidth = 2.dp,
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                        } else {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    Icons.Default.Check,
                                    contentDescription = null,
                                    modifier = Modifier.size(18.dp)
                                )
                                Text("Complete Booking")
                            }
                        }
                    }
                }
                else -> {
                    Button(
                        onClick = onNextClick,
                        enabled = canProceed,
                        modifier = Modifier.widthIn(min = 120.dp),
                        shape = MariiaHubShapes.ButtonPrimary
                    ) {
                        Text("Next")
                    }
                }
            }
        }
    }
}