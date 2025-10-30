package com.mariiahub.wear.domain.health

import android.content.Context
import androidx.health.services.client.HealthServicesClient
import androidx.health.services.client.MeasureCallback
import androidx.health.services.client.data.*
import androidx.health.services.client.data.Availability.Companion.AVAILABLE
import androidx.health.services.client.data.DataType.Companion.*
import androidx.lifecycle.flowWithLifecycle
import androidx.lifecycle.lifecycleScope
import com.mariiahub.wear.domain.model.*
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import timber.log.Timber
import java.time.LocalDateTime
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class HealthManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val healthServicesClient: HealthServicesClient
) {

    private val _healthMetrics = MutableStateFlow(
        HealthMetrics(
            steps = 0,
            calories = 0,
            heartRate = null,
            weight = null,
            activeMinutes = 0,
            distance = null,
            lastSync = LocalDateTime.now()
        )
    )
    val healthMetrics: StateFlow<HealthMetrics> = _healthMetrics.asStateFlow()

    private val _workoutSession = MutableStateFlow<WorkoutSession?>(null)
    val workoutSession: StateFlow<WorkoutSession?> = _workoutSession.asStateFlow()

    private val _connectionState = MutableStateFlow(ConnectionState.CONNECTED)
    val connectionState: StateFlow<ConnectionState> = _connectionState.asStateFlow()

    private val measureCallback = object : MeasureCallback {
        override fun onAvailabilityChanged(dataType: DataType<*, *>, availability: Availability) {
            if (availability is AVAILABLE) {
                Timber.d("Data type ${dataType.name} is now available")
            }
        }

        override fun onDataReceived(data: List<DataPoint>) {
            data.forEach { dataPoint ->
                when (dataPoint.dataType) {
                    STEPS_DAILY -> {
                        val steps = dataPoint.getValue(DataType.Steps)
                        updateSteps(steps)
                    }
                    CALORIES_DAILY -> {
                        val calories = dataPoint.getValue(DataType.Calories)
                        updateCalories(calories)
                    }
                    HEART_RATE_BPM -> {
                        val heartRate = dataPoint.getValue(DataType.HeartRate)
                        updateHeartRate(heartRate)
                    }
                    DISTANCE_DAILY -> {
                        val distance = dataPoint.getValue(DataType.Distance)
                        updateDistance(distance)
                    }
                    ACTIVE_MINUTES_DAILY -> {
                        val activeMinutes = dataPoint.getValue(DataType.ActiveMinutes)
                        updateActiveMinutes(activeMinutes)
                    }
                    BODY_WEIGHT -> {
                        val weight = dataPoint.getValue(DataType.BodyWeight)
                        updateWeight(weight)
                    }
                }
            }
        }
    }

    suspend fun checkHealthPermissions(): Boolean {
        return try {
            val capabilities = healthServicesClient.getCapabilitiesAsync().await()
            val supportedDataTypes = capabilities.supportedDataTypes
            val requiredDataTypes = setOf(
                STEPS_DAILY,
                CALORIES_DAILY,
                HEART_RATE_BPM,
                DISTANCE_DAILY,
                ACTIVE_MINUTES_DAILY
            )

            requiredDataTypes.all { dataType ->
                supportedDataTypes.contains(dataType)
            }
        } catch (e: Exception) {
            Timber.e(e, "Failed to check health permissions")
            false
        }
    }

    fun registerHealthDataCallback() {
        try {
            val dataTypes = setOf(
                STEPS_DAILY,
                CALORIES_DAILY,
                HEART_RATE_BPM,
                DISTANCE_DAILY,
                ACTIVE_MINUTES_DAILY,
                BODY_WEIGHT
            )

            healthServicesClient.measureClient.registerCallback(
                callback = measureCallback,
                dataTypes = dataTypes
            )

            Timber.d("Health data callback registered successfully")
        } catch (e: Exception) {
            Timber.e(e, "Failed to register health data callback")
            _connectionState.value = ConnectionState.DISCONNECTED
        }
    }

    fun unregisterHealthDataCallback() {
        try {
            healthServicesClient.measureClient.unregisterCallback(measureCallback)
            Timber.d("Health data callback unregistered")
        } catch (e: Exception) {
            Timber.e(e, "Failed to unregister health data callback")
        }
    }

    suspend fun startWorkoutSession(workoutType: WorkoutType): String {
        return try {
            val capabilities = healthServicesClient.getCapabilitiesAsync().await()
            val exerciseTypes = capabilities.supportedExerciseTypes

            val healthServiceType = when (workoutType) {
                WorkoutType.STRENGTH -> ExerciseType.STRENGTH_TRAINING
                WorkoutType.CARDIO -> ExerciseType.RUNNING
                WorkoutType.YOGA -> ExerciseType.YOGA
                WorkoutType.PILATES -> ExerciseType.PILATES
                WorkoutType.STRETCHING -> ExerciseType.STRETCHING
                WorkoutType.FUNCTIONAL -> ExerciseType.FUNCTIONAL_STRENGTH_TRAINING
            }

            if (!exerciseTypes.contains(healthServiceType)) {
                throw IllegalArgumentException("Workout type $workoutType not supported")
            }

            val warmUpConfig = WarmUpConfig(
                exerciseType = healthServiceType,
                dataTypes = setOf(
                    HEART_RATE_BPM,
                    STEPS,
                    CALORIES,
                    DISTANCE
                )
            )

            val warmUpResponse = healthServicesClient.exerciseClient.startExerciseAsync(warmUpConfig).await()

            val session = WorkoutSession(
                id = warmUpResponse.token.toString(),
                type = workoutType,
                startTime = LocalDateTime.now(),
                endTime = null,
                duration = null,
                caloriesBurned = null,
                heartRateData = emptyList(),
                stepsCount = null,
                isActive = true
            )

            _workoutSession.value = session
            Timber.d("Workout session started: ${session.id}")

            session.id
        } catch (e: Exception) {
            Timber.e(e, "Failed to start workout session")
            throw e
        }
    }

    suspend fun stopWorkoutSession() {
        val session = _workoutSession.value ?: return

        try {
            healthServicesClient.exerciseClient.endExerciseAsync().await()

            val updatedSession = session.copy(
                endTime = LocalDateTime.now(),
                isActive = false,
                duration = java.time.Duration.between(
                    session.startTime,
                    LocalDateTime.now()
                ).seconds.toInt()
            )

            _workoutSession.value = updatedSession
            Timber.d("Workout session ended: ${session.id}")
        } catch (e: Exception) {
            Timber.e(e, "Failed to stop workout session")
        }
    }

    suspend fun pauseWorkoutSession() {
        val session = _workoutSession.value ?: return

        try {
            healthServicesClient.exerciseClient.pauseExerciseAsync().await()
            Timber.d("Workout session paused: ${session.id}")
        } catch (e: Exception) {
            Timber.e(e, "Failed to pause workout session")
        }
    }

    suspend fun resumeWorkoutSession() {
        val session = _workoutSession.value ?: return

        try {
            healthServicesClient.exerciseClient.resumeExerciseAsync().await()
            Timber.d("Workout session resumed: ${session.id}")
        } catch (e: Exception) {
            Timber.e(e, "Failed to resume workout session")
        }
    }

    suspend fun getTodayHealthData(): HealthMetrics {
        return try {
            val today = java.time.LocalDate.now()
            val startOfDay = today.atStartOfDay()
            val endOfDay = today.atTime(23, 59, 59)

            val stepsResponse = healthServicesClient.measureClient.getLatestDataAsync(
                request = DataPointRequest(
                    dataType = STEPS_DAILY,
                    timeRangeFilter = TimeRangeFilter.between(startOfDay, endOfDay)
                )
            ).await()

            val caloriesResponse = healthServicesClient.measureClient.getLatestDataAsync(
                request = DataPointRequest(
                    dataType = CALORIES_DAILY,
                    timeRangeFilter = TimeRangeFilter.between(startOfDay, endOfDay)
                )
            ).await()

            val heartRateResponse = healthServicesClient.measureClient.getLatestDataAsync(
                request = DataPointRequest(
                    dataType = HEART_RATE_BPM,
                    timeRangeFilter = TimeRangeFilter.between(startOfDay, endOfDay)
                )
            ).await()

            val distanceResponse = healthServicesClient.measureClient.getLatestDataAsync(
                request = DataPointRequest(
                    dataType = DISTANCE_DAILY,
                    timeRangeFilter = TimeRangeFilter.between(startOfDay, endOfDay)
                )
            ).await()

            val activeMinutesResponse = healthServicesClient.measureClient.getLatestDataAsync(
                request = DataPointRequest(
                    dataType = ACTIVE_MINUTES_DAILY,
                    timeRangeFilter = TimeRangeFilter.between(startOfDay, endOfDay)
                )
            ).await()

            val steps = stepsResponse.getOrNull()?.data?.firstOrNull()?.getValue(DataType.Steps) ?: 0
            val calories = caloriesResponse.getOrNull()?.data?.firstOrNull()?.getValue(DataType.Calories) ?: 0.0
            val heartRate = heartRateResponse.getOrNull()?.data?.firstOrNull()?.getValue(DataType.HeartRate)
            val distance = distanceResponse.getOrNull()?.data?.firstOrNull()?.getValue(DataType.Distance)
            val activeMinutes = activeMinutesResponse.getOrNull()?.data?.firstOrNull()?.getValue(DataType.ActiveMinutes)

            HealthMetrics(
                steps = steps,
                calories = calories.toInt(),
                heartRate = heartRate?.value,
                weight = null, // Weight is typically not measured daily
                activeMinutes = activeMinutes?.value ?: 0,
                distance = distance?.inMeters,
                lastSync = LocalDateTime.now()
            )
        } catch (e: Exception) {
            Timber.e(e, "Failed to get today's health data")
            _healthMetrics.value
        }
    }

    fun enableBackgroundHealthTracking() {
        // Enable continuous heart rate and step tracking
        try {
            val continuousDataTypes = setOf(
                HEART_RATE_BPM,
                STEPS_DAILY
            )

            healthServicesClient.measureClient.setPassiveListenerCallback(
                callback = measureCallback,
                dataTypes = continuousDataTypes
            )

            Timber.d("Background health tracking enabled")
        } catch (e: Exception) {
            Timber.e(e, "Failed to enable background health tracking")
        }
    }

    fun disableBackgroundHealthTracking() {
        try {
            healthServicesClient.measureClient.clearPassiveListenerCallback()
            Timber.d("Background health tracking disabled")
        } catch (e: Exception) {
            Timber.e(e, "Failed to disable background health tracking")
        }
    }

    // Private update methods

    private fun updateSteps(steps: Long) {
        _healthMetrics.update { current ->
            current.copy(steps = steps.toInt())
        }
    }

    private fun updateCalories(calories: Double) {
        _healthMetrics.update { current ->
            current.copy(calories = calories.toInt())
        }
    }

    private fun updateHeartRate(heartRate: HeartRateMeasurement) {
        _healthMetrics.update { current ->
            current.copy(heartRate = heartRate.bpm)
        }

        // Update current workout session if active
        _workoutSession.value?.let { session ->
            if (session.isActive) {
                val newHeartRateData = HeartRateData(
                    timestamp = LocalDateTime.now(),
                    heartRate = heartRate.bpm
                )
                _workoutSession.value = session.copy(
                    heartRateData = session.heartRateData + newHeartRateData
                )
            }
        }
    }

    private fun updateDistance(distance: Length) {
        _healthMetrics.update { current ->
            current.copy(distance = distance.inMeters)
        }
    }

    private fun updateActiveMinutes(activeMinutes: ActiveMinutes) {
        _healthMetrics.update { current ->
            current.copy(activeMinutes = activeMinutes.value)
        }
    }

    private fun updateWeight(weight: Mass) {
        _healthMetrics.update { current ->
            current.copy(weight = weight.inKilograms)
        }
    }

    fun getCurrentHealthMetrics(): HealthMetrics {
        return _healthMetrics.value
    }

    fun getActiveWorkoutSession(): WorkoutSession? {
        return _workoutSession.value
    }
}

enum class ConnectionState {
    CONNECTED,
    DISCONNECTED,
    CONNECTING,
    UNKNOWN
}