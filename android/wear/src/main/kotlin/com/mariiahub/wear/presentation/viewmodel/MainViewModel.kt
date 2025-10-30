package com.mariiahub.wear.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mariiahub.wear.domain.connectivity.ConnectivityManager
import com.mariiahub.wear.domain.health.HealthManager
import com.mariiahub.wear.domain.model.*
import com.mariiahub.wear.domain.haptic.HapticManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import timber.log.Timber
import java.time.LocalDateTime
import javax.inject.Inject

@HiltViewModel
class MainViewModel @Inject constructor(
    private val healthManager: HealthManager,
    private val connectivityManager: ConnectivityManager,
    private val hapticManager: HapticManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(MainUiState())
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    init {
        observeHealthData()
        observeConnectivity()
        observeIncomingMessages()
    }

    fun initialize() {
        viewModelScope.launch {
            try {
                _isLoading.value = true

                // Check health permissions
                val hasPermissions = healthManager.checkHealthPermissions()
                if (hasPermissions) {
                    healthManager.registerHealthDataCallback()
                    healthManager.enableBackgroundHealthTracking()
                }

                // Load initial data
                loadAppointments()
                loadHealthMetrics()
                loadStats()

                _isLoading.value = false
                Timber.d("MainViewModel initialized successfully")
            } catch (e: Exception) {
                _error.value = "Initialization failed: ${e.message}"
                _isLoading.value = false
                Timber.e(e, "Failed to initialize MainViewModel")
            }
        }
    }

    private fun observeHealthData() {
        viewModelScope.launch {
            healthManager.healthMetrics.collect { healthMetrics ->
                _uiState.update { current ->
                    current.copy(
                        healthMetrics = healthMetrics,
                        stats = current.stats.copy(
                            todaySteps = healthMetrics.steps,
                            todayCalories = healthMetrics.calories,
                            currentHeartRate = healthMetrics.heartRate,
                            isHealthConnected = true
                        )
                    )
                }
            }
        }

        viewModelScope.launch {
            healthManager.workoutSession.collect { workoutSession ->
                _uiState.update { current ->
                    current.copy(activeWorkoutSession = workoutSession)
                }
            }
        }
    }

    private fun observeConnectivity() {
        viewModelScope.launch {
            connectivityManager.connectionState.collect { connectionState ->
                val isConnected = connectionState == com.mariiahub.wear.domain.connectivity.ConnectionState.CONNECTED
                _uiState.update { current ->
                    current.copy(isPhoneConnected = isConnected)
                }

                if (isConnected) {
                    // Request sync when connected
                    connectivityManager.requestSyncData()
                }
            }
        }

        viewModelScope.launch {
            connectivityManager.incomingMessages.collect { message ->
                handleIncomingMessage(message)
            }
        }

        viewModelScope.launch {
            connectivityManager.syncEvents.collect { event ->
                handleSyncEvent(event)
            }
        }
    }

    private fun observeIncomingMessages() {
        // Already handled in observeConnectivity
    }

    private fun handleIncomingMessage(message: com.mariiahub.wear.domain.connectivity.SyncMessage) {
        when (message) {
            is com.mariiahub.wear.domain.connectivity.SyncMessage.AppointmentsUpdate -> {
                _uiState.update { current ->
                    current.copy(
                        todayAppointments = message.appointments.filter { it.isToday },
                        upcomingAppointments = message.appointments.filter { it.isUpcoming }
                    )
                }
                hapticManager.playNotification()
            }
            is com.mariiahub.wear.domain.connectivity.SyncMessage.HealthUpdate -> {
                _uiState.update { current ->
                    current.copy(
                        healthMetrics = message.healthMetrics,
                        stats = current.stats.copy(
                            todaySteps = message.healthMetrics.steps,
                            todayCalories = message.healthMetrics.calories,
                            currentHeartRate = message.healthMetrics.heartRate
                        )
                    )
                }
            }
            is com.mariiahub.wear.domain.connectivity.SyncMessage.QuickAction -> {
                handleQuickAction(message.action)
            }
            else -> {
                Timber.d("Received unhandled message type: ${message::class.simpleName}")
            }
        }
    }

    private fun handleSyncEvent(event: com.mariiahub.wear.domain.connectivity.SyncEvent) {
        when (event) {
            is com.mariiahub.wear.domain.connectivity.SyncEvent.AppointmentsSynced -> {
                Timber.d("Appointments synced successfully")
            }
            is com.mariiahub.wear.domain.connectivity.SyncEvent.HealthSynced -> {
                Timber.d("Health data synced successfully")
            }
            is com.mariiahub.wear.domain.connectivity.SyncEvent.QuickActionSent -> {
                Timber.d("Quick action sent successfully")
                hapticManager.playSuccess()
            }
            is com.mariiahub.wear.domain.connectivity.SyncEvent.SyncError -> {
                _error.value = event.message
                hapticManager.playError()
                Timber.e("Sync error: ${event.message}")
            }
        }
    }

    private fun handleQuickAction(action: com.mariiahub.wear.domain.connectivity.QuickActionData) {
        hapticManager.playClick()
        // Handle quick actions from phone
        when (action.type) {
            "quick_book" -> {
                // Navigate to booking
            }
            "emergency" -> {
                handleEmergencyAction()
            }
            "workout_start" -> {
                startWorkout(WorkoutType.STRENGTH)
            }
            "workout_stop" -> {
                stopWorkout()
            }
        }
    }

    fun loadAppointments() {
        viewModelScope.launch {
            try {
                // In a real app, this would load from API/database
                val mockAppointments = getMockAppointments()
                _uiState.update { current ->
                    current.copy(
                        todayAppointments = mockAppointments.filter { it.isToday },
                        upcomingAppointments = mockAppointments.filter { it.isUpcoming }
                    )
                }
            } catch (e: Exception) {
                _error.value = "Failed to load appointments: ${e.message}"
                Timber.e(e, "Failed to load appointments")
            }
        }
    }

    fun loadHealthMetrics() {
        viewModelScope.launch {
            try {
                val healthMetrics = healthManager.getTodayHealthData()
                _uiState.update { current ->
                    current.copy(
                        healthMetrics = healthMetrics,
                        stats = current.stats.copy(
                            todaySteps = healthMetrics.steps,
                            todayCalories = healthMetrics.calories,
                            currentHeartRate = healthMetrics.heartRate,
                            isHealthConnected = true
                        )
                    )
                }
            } catch (e: Exception) {
                _error.value = "Failed to load health metrics: ${e.message}"
                Timber.e(e, "Failed to load health metrics")
            }
        }
    }

    fun loadStats() {
        viewModelScope.launch {
            try {
                val healthMetrics = healthManager.getTodayHealthData()
                val stats = Stats(
                    todayAppointments = _uiState.value.todayAppointments.size,
                    completedToday = _uiState.value.todayAppointments.count { it.status == AppointmentStatus.COMPLETED },
                    todayRevenue = _uiState.value.todayAppointments
                        .filter { it.status == AppointmentStatus.COMPLETED }
                        .sumOf { it.totalAmount },
                    todaySteps = healthMetrics.steps,
                    todayCalories = healthMetrics.calories,
                    weekTotal = 15, // Mock data
                    weekRevenue = 4500.0, // Mock data
                    totalBookings = 156, // Mock data
                    currentHeartRate = healthMetrics.heartRate,
                    batteryLevel = getBatteryLevel(),
                    isHealthConnected = true
                )

                _uiState.update { current ->
                    current.copy(stats = stats)
                }
            } catch (e: Exception) {
                _error.value = "Failed to load stats: ${e.message}"
                Timber.e(e, "Failed to load stats")
            }
        }
    }

    fun loadQuickActions() {
        viewModelScope.launch {
            try {
                val quickActions = listOf(
                    QuickAction(
                        id = "1",
                        title = "Quick Book",
                        description = "Book new appointment",
                        icon = "calendar_add",
                        action = ActionType.QUICK_BOOK,
                        isEnabled = true
                    ),
                    QuickAction(
                        id = "2",
                        title = "Call Salon",
                        description = "Contact immediately",
                        icon = "phone",
                        action = ActionType.CALL_SALON,
                        isEnabled = true
                    ),
                    QuickAction(
                        id = "3",
                        title = "Emergency",
                        description = "Get help now",
                        icon = "priority_high",
                        action = ActionType.EMERGENCY_CONTACT,
                        isEnabled = true
                    ),
                    QuickAction(
                        id = "4",
                        title = "Start Workout",
                        description = "Begin fitness session",
                        icon = "fitness_center",
                        action = ActionType.START_WORKOUT,
                        isEnabled = true
                    )
                )

                _uiState.update { current ->
                    current.copy(quickActions = quickActions)
                }
            } catch (e: Exception) {
                _error.value = "Failed to load quick actions: ${e.message}"
                Timber.e(e, "Failed to load quick actions")
            }
        }
    }

    fun startWorkout(workoutType: WorkoutType) {
        viewModelScope.launch {
            try {
                val sessionId = healthManager.startWorkoutSession(workoutType)
                hapticManager.playSuccess()
                Timber.d("Workout started: $sessionId")
            } catch (e: Exception) {
                _error.value = "Failed to start workout: ${e.message}"
                hapticManager.playError()
                Timber.e(e, "Failed to start workout")
            }
        }
    }

    fun stopWorkout() {
        viewModelScope.launch {
            try {
                healthManager.stopWorkoutSession()
                hapticManager.playSuccess()
                Timber.d("Workout stopped")
            } catch (e: Exception) {
                _error.value = "Failed to stop workout: ${e.message}"
                hapticManager.playError()
                Timber.e(e, "Failed to stop workout")
            }
        }
    }

    fun handleEmergencyAction() {
        viewModelScope.launch {
            try {
                // Send emergency notification to phone
                val emergencyAction = com.mariiahub.wear.domain.connectivity.QuickActionData(
                    type = "emergency",
                    parameters = mapOf(
                        "location" to "unknown", // In real app, get actual location
                        "timestamp" to System.currentTimeMillis()
                    )
                )
                connectivityManager.sendQuickAction(emergencyAction)
                hapticManager.playEmergency()
                Timber.d("Emergency action triggered")
            } catch (e: Exception) {
                _error.value = "Failed to handle emergency: ${e.message}"
                Timber.e(e, "Failed to handle emergency")
            }
        }
    }

    fun sendQuickAction(actionType: ActionType) {
        viewModelScope.launch {
            try {
                val quickAction = com.mariiahub.wear.domain.connectivity.QuickActionData(
                    type = actionType.name.lowercase(),
                    parameters = mapOf(
                        "source" to "wear_app",
                        "timestamp" to System.currentTimeMillis()
                    )
                )
                connectivityManager.sendQuickAction(quickAction)
                hapticManager.playClick()
            } catch (e: Exception) {
                _error.value = "Failed to send quick action: ${e.message}"
                Timber.e(e, "Failed to send quick action")
            }
        }
    }

    fun clearError() {
        _error.value = null
    }

    override fun onCleared() {
        super.onCleared()
        healthManager.unregisterHealthDataCallback()
        connectivityManager.disconnect()
        Timber.d("MainViewModel cleared")
    }

    private fun getMockAppointments(): List<Appointment> {
        val now = LocalDateTime.now()
        return listOf(
            Appointment(
                id = "1",
                clientId = "client1",
                clientName = "Anna Kowalska",
                clientEmail = "anna@example.com",
                clientPhone = "+48 123 456 789",
                serviceId = "service1",
                serviceName = "Lip Enhancement",
                serviceType = ServiceType.BEAUTY,
                bookingDate = now.plusHours(1),
                startTime = "${now.plusHours(1).hour}:00",
                endTime = "${now.plusHours(2).hour}:00",
                duration = 60,
                totalAmount = 300.0,
                currency = "PLN",
                status = AppointmentStatus.CONFIRMED,
                paymentStatus = PaymentStatus.PAID,
                locationType = LocationType.STUDIO,
                notes = null,
                preferences = null,
                createdAt = now.minusDays(1),
                updatedAt = now.minusDays(1)
            ),
            Appointment(
                id = "2",
                clientId = "client2",
                clientName = "Maria Nowak",
                clientEmail = "maria@example.com",
                clientPhone = "+48 987 654 321",
                serviceId = "service2",
                serviceName = "Brow Design",
                serviceType = ServiceType.BEAUTY,
                bookingDate = now.plusHours(3),
                startTime = "${now.plusHours(3).hour}:00",
                endTime = "${now.plusHours(4).hour}:00",
                duration = 45,
                totalAmount = 250.0,
                currency = "PLN",
                status = AppointmentStatus.CONFIRMED,
                paymentStatus = PaymentStatus.PAID,
                locationType = LocationType.STUDIO,
                notes = null,
                preferences = null,
                createdAt = now.minusDays(2),
                updatedAt = now.minusDays(2)
            ),
            Appointment(
                id = "3",
                clientId = "client3",
                clientName = "Ewa Wiśniewska",
                clientEmail = "ewa@example.com",
                clientPhone = "+48 555 123 456",
                serviceId = "service3",
                serviceName = "Glute Training",
                serviceType = ServiceType.FITNESS,
                bookingDate = now.minusHours(2),
                startTime = "${now.minusHours(2).hour}:00",
                endTime = "${now.minusHours(1).hour}:00",
                duration = 60,
                totalAmount = 200.0,
                currency = "PLN",
                status = AppointmentStatus.COMPLETED,
                paymentStatus = PaymentStatus.PAID,
                locationType = LocationType.STUDIO,
                notes = null,
                preferences = null,
                createdAt = now.minusDays(3),
                updatedAt = now.minusDays(3)
            )
        )
    }

    private fun getBatteryLevel(): Float {
        // This would get actual battery level from the system
        return 0.75f
    }
}

data class MainUiState(
    val todayAppointments: List<Appointment> = emptyList(),
    val upcomingAppointments: List<Appointment> = emptyList(),
    val healthMetrics: HealthMetrics = HealthMetrics(
        steps = 0,
        calories = 0,
        heartRate = null,
        weight = null,
        activeMinutes = 0,
        distance = null,
        lastSync = LocalDateTime.now()
    ),
    val stats: Stats = Stats(
        todayAppointments = 0,
        completedToday = 0,
        todayRevenue = 0.0,
        todaySteps = 0,
        todayCalories = 0,
        weekTotal = 0,
        weekRevenue = 0.0,
        totalBookings = 0,
        currentHeartRate = null,
        batteryLevel = 0f,
        isHealthConnected = false
    ),
    val quickActions: List<QuickAction> = emptyList(),
    val activeWorkoutSession: WorkoutSession? = null,
    val isPhoneConnected: Boolean = false,
    val connectionState: com.mariiahub.wear.domain.connectivity.ConnectionState = com.mariiahub.wear.domain.connectivity.ConnectionState.DISCONNECTED
)