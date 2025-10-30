package com.mariaborysevych.beautyfitness.integration.google

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.IntentSender
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.IntentSenderRequest
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.fitness.Fitness
import com.google.android.gms.fitness.FitnessOptions
import com.google.android.gms.fitness.data.*
import com.google.android.gms.fitness.request.DataReadRequest
import com.google.android.gms.fitness.result.DataReadResponse
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.tasks.await
import java.time.LocalDateTime
import java.time.ZoneId
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class GoogleFitManager @Inject constructor(
    private val context: Context
) {
    companion object {
        private const val AUTH_REQUEST_CODE = 1001
        private const val OAUTH_REQUEST_CODE = 1002

        // Fitness data types
        private val STEPS_DATA_TYPE = DataType.TYPE_STEP_COUNT_DELTA
        private val CALORIES_DATA_TYPE = DataType.TYPE_CALORIES_EXPENDED
        private val DISTANCE_DATA_TYPE = DataType.TYPE_DISTANCE_DELTA
        private val HEART_RATE_DATA_TYPE = DataType.TYPE_HEART_RATE_BPM
        private val ACTIVITY_DATA_TYPE = DataType.TYPE_ACTIVITY_SEGMENT
    }

    private val fitnessOptions = FitnessOptions.builder()
        .addDataType(STEPS_DATA_TYPE, FitnessOptions.ACCESS_READ)
        .addDataType(CALORIES_DATA_TYPE, FitnessOptions.ACCESS_READ)
        .addDataType(DISTANCE_DATA_TYPE, FitnessOptions.ACCESS_READ)
        .addDataType(HEART_RATE_DATA_TYPE, FitnessOptions.ACCESS_READ)
        .addDataType(ACTIVITY_DATA_TYPE, FitnessOptions.ACCESS_READ)
        .addDataType(DataType.TYPE_WEIGHT, FitnessOptions.ACCESS_READ_WRITE)
        .addDataType(DataType.TYPE_HEIGHT, FitnessOptions.ACCESS_READ_WRITE)
        .build()

    private val _isAuthorized = MutableStateFlow(false)
    val isAuthorized: StateFlow<Boolean> = _isAuthorized.asStateFlow()

    private val _fitnessData = MutableStateFlow<FitnessData?>(null)
    val fitnessData: StateFlow<FitnessData?> = _fitnessData.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    private var googleSignInAccount: GoogleSignInAccount? = null

    init {
        checkAuthorizationStatus()
    }

    private fun checkAuthorizationStatus() {
        val account = GoogleSignIn.getLastSignedInAccount(context)
        googleSignInAccount = account

        val isAuthorized = GoogleSignIn.hasPermissions(account, fitnessOptions)
        _isAuthorized.value = isAuthorized

        if (isAuthorized) {
            loadTodaysFitnessData()
        }
    }

    fun requestAuthorization(activity: Activity) {
        GoogleSignIn.requestPermissions(
            activity,
            OAUTH_REQUEST_CODE,
            googleSignInAccount,
            fitnessOptions
        )
    }

    fun handleAuthorizationResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == OAUTH_REQUEST_CODE) {
            checkAuthorizationStatus()
        }
    }

    suspend fun requestOAuthIntent(): IntentSender? {
        return try {
            val account = GoogleSignIn.getAccountForExtension(context, fitnessOptions)
            Fitness.getAuthClient(context)
                .requestOAuthIntent(account)
                .await()
        } catch (e: Exception) {
            _error.value = "Failed to request OAuth: ${e.message}"
            null
        }
    }

    suspend fun loadTodaysFitnessData() {
        if (!_isAuthorized.value) {
            _error.value = "Google Fit not authorized"
            return
        }

        _isLoading.value = true
        _error.value = null

        try {
            val now = System.currentTimeMillis()
            val startOfDay = LocalDateTime.now()
                .withHour(0)
                .withMinute(0)
                .withSecond(0)
                .withNano(0)
                .atZone(ZoneId.systemDefault())
                .toInstant()
                .toEpochMilli()

            val readRequest = DataReadRequest.Builder()
                .read(STEPS_DATA_TYPE)
                .read(CALORIES_DATA_TYPE)
                .read(DISTANCE_DATA_TYPE)
                .read(HEART_RATE_DATA_TYPE)
                .read(ACTIVITY_DATA_TYPE)
                .setTimeRange(startOfDay, now, TimeUnit.MILLISECONDS)
                .build()

            val fitnessClient = Fitness.getHistoryClient(context, googleSignInAccount)
            val response = fitnessClient.readData(readRequest).await()

            val fitnessData = parseFitnessData(response)
            _fitnessData.value = fitnessData

        } catch (e: Exception) {
            _error.value = "Failed to load fitness data: ${e.message}"
        } finally {
            _isLoading.value = false
        }
    }

    private fun parseFitnessData(response: DataReadResponse): FitnessData {
        var totalSteps = 0L
        var totalCalories = 0.0
        var totalDistance = 0.0
        val heartRateReadings = mutableListOf<Double>()
        val activities = mutableListOf<ActivityData>()

        response.dataSets.forEach { dataSet ->
            when (dataSet.dataType) {
                STEPS_DATA_TYPE -> {
                    dataSet.dataPoints.forEach { dataPoint ->
                        val steps = dataPoint.getValue(Field.FIELD_STEPS).asInt()
                        totalSteps += steps
                    }
                }
                CALORIES_DATA_TYPE -> {
                    dataSet.dataPoints.forEach { dataPoint ->
                        val calories = dataPoint.getValue(Field.FIELD_CALORIES).asFloat()
                        totalCalories += calories
                    }
                }
                DISTANCE_DATA_TYPE -> {
                    dataSet.dataPoints.forEach { dataPoint ->
                        val distance = dataPoint.getValue(Field.FIELD_DISTANCE).asFloat()
                        totalDistance += distance
                    }
                }
                HEART_RATE_DATA_TYPE -> {
                    dataSet.dataPoints.forEach { dataPoint ->
                        val heartRate = dataPoint.getValue(Field.FIELD_BPM).asFloat()
                        heartRateReadings.add(heartRate.toDouble())
                    }
                }
                ACTIVITY_DATA_TYPE -> {
                    dataSet.dataPoints.forEach { dataPoint ->
                        val activity = dataPoint.getValue(Field.FIELD_ACTIVITY).asString()
                        val startTime = dataPoint.getStartTime(TimeUnit.MILLISECONDS)
                        val endTime = dataPoint.getEndTime(TimeUnit.MILLISECONDS)

                        activities.add(
                            ActivityData(
                                type = activity,
                                startTime = startTime,
                                endTime = endTime,
                                duration = endTime - startTime
                            )
                        )
                    }
                }
            }
        }

        return FitnessData(
            steps = totalSteps,
            calories = totalCalories,
            distance = totalDistance / 1000, // Convert to km
            heartRate = if (heartRateReadings.isNotEmpty()) {
                heartRateReadings.average()
            } else null,
            activities = activities,
            timestamp = System.currentTimeMillis()
        )
    }

    suspend fun loadWeeklyFitnessData(): FitnessData? {
        if (!_isAuthorized.value) {
            _error.value = "Google Fit not authorized"
            return null
        }

        try {
            val now = System.currentTimeMillis()
            val weekAgo = now - TimeUnit.DAYS.toMillis(7)

            val readRequest = DataReadRequest.Builder()
                .read(STEPS_DATA_TYPE)
                .read(CALORIES_DATA_TYPE)
                .read(DISTANCE_DATA_TYPE)
                .setTimeRange(weekAgo, now, TimeUnit.MILLISECONDS)
                .build()

            val fitnessClient = Fitness.getHistoryClient(context, googleSignInAccount)
            val response = fitnessClient.readData(readRequest).await()

            return parseFitnessData(response)

        } catch (e: Exception) {
            _error.value = "Failed to load weekly fitness data: ${e.message}"
            return null
        }
    }

    suspend fun logWorkout(
        activityType: String,
        duration: Long,
        caloriesBurned: Double,
        distance: Double = 0.0
    ): Boolean {
        if (!_isAuthorized.value) {
            _error.value = "Google Fit not authorized"
            return false
        }

        try {
            val endTime = System.currentTimeMillis()
            val startTime = endTime - duration

            // Log activity segment
            val activityBuilder = DataSource.Builder()
                .setAppPackageName(context)
                .setDataType(ACTIVITY_DATA_TYPE)
                .setStreamName("$activityType - step_count")
                .setType(DataSource.TYPE_RAW)

            val activity = DataPoint.builder(activityBuilder.build())
                .setActivityField(activityType)
                .setTimeInterval(startTime, endTime, TimeUnit.MILLISECONDS)
                .build()

            // Log calories
            if (caloriesBurned > 0) {
                val caloriesBuilder = DataSource.Builder()
                    .setAppPackageName(context)
                    .setDataType(CALORIES_DATA_TYPE)
                    .setStreamName("$activityType - calories")
                    .setType(DataSource.TYPE_RAW)

                val calories = DataPoint.builder(caloriesBuilder.build())
                    .setField(Field.FIELD_CALORIES, caloriesBurned.toFloat())
                    .setTimeInterval(startTime, endTime, TimeUnit.MILLISECONDS)
                    .build()

                Fitness.getHistoryClient(context, googleSignInAccount)
                    .insertData(DataSet.Builder(caloriesBuilder.build())
                        .add(calories)
                        .build())
                    .await()
            }

            // Log distance
            if (distance > 0) {
                val distanceBuilder = DataSource.Builder()
                    .setAppPackageName(context)
                    .setDataType(DISTANCE_DATA_TYPE)
                    .setStreamName("$activityType - distance")
                    .setType(DataSource.TYPE_RAW)

                val distancePoint = DataPoint.builder(distanceBuilder.build())
                    .setField(Field.FIELD_DISTANCE, distance.toFloat())
                    .setTimeInterval(startTime, endTime, TimeUnit.MILLISECONDS)
                    .build()

                Fitness.getHistoryClient(context, googleSignInAccount)
                    .insertData(DataSet.Builder(distanceBuilder.build())
                        .add(distancePoint)
                        .build())
                    .await()
            }

            return true

        } catch (e: Exception) {
            _error.value = "Failed to log workout: ${e.message}"
            return false
        }
    }

    suspend fun updateWeight(weight: Double, unit: String = "kg"): Boolean {
        if (!_isAuthorized.value) {
            _error.value = "Google Fit not authorized"
            return false
        }

        try {
            val weightInKg = if (unit == "lb") weight * 0.453592 else weight

            val weightSource = DataSource.Builder()
                .setAppPackageName(context)
                .setDataType(DataType.TYPE_WEIGHT)
                .setStreamName("user_weight")
                .setType(DataSource.TYPE_RAW)
                .build()

            val weightPoint = DataPoint.builder(weightSource)
                .setField(Field.FIELD_WEIGHT, weightInKg.toFloat())
                .setTimestamp(System.currentTimeMillis(), TimeUnit.MILLISECONDS)
                .build()

            Fitness.getHistoryClient(context, googleSignInAccount)
                .insertData(DataSet.Builder(weightSource)
                    .add(weightPoint)
                    .build())
                .await()

            return true

        } catch (e: Exception) {
            _error.value = "Failed to update weight: ${e.message}"
            return false
        }
    }

    suspend fun updateHeight(height: Double, unit: String = "cm"): Boolean {
        if (!_isAuthorized.value) {
            _error.value = "Google Fit not authorized"
            return false
        }

        try {
            val heightInMeters = if (unit == "cm") height / 100 else height

            val heightSource = DataSource.Builder()
                .setAppPackageName(context)
                .setDataType(DataType.TYPE_HEIGHT)
                .setStreamName("user_height")
                .setType(DataSource.TYPE_RAW)
                .build()

            val heightPoint = DataPoint.builder(heightSource)
                .setField(Field.FIELD_HEIGHT, heightInMeters.toFloat())
                .setTimestamp(System.currentTimeMillis(), TimeUnit.MILLISECONDS)
                .build()

            Fitness.getHistoryClient(context, googleSignInAccount)
                .insertData(DataSet.Builder(heightSource)
                    .add(heightPoint)
                    .build())
                .await()

            return true

        } catch (e: Exception) {
            _error.value = "Failed to update height: ${e.message}"
            return false
        }
    }

    fun disconnect() {
        val fitnessClient = Fitness.getConfigClient(context, googleSignInAccount)
        fitnessClient.disableFit()
            .addOnSuccessListener {
                _isAuthorized.value = false
                _fitnessData.value = null
            }
            .addOnFailureListener { exception ->
                _error.value = "Failed to disconnect Google Fit: ${exception.message}"
            }
    }

    fun clearError() {
        _error.value = null
    }
}

data class FitnessData(
    val steps: Long,
    val calories: Double,
    val distance: Double, // in km
    val heartRate: Double?, // BPM
    val activities: List<ActivityData>,
    val timestamp: Long
)

data class ActivityData(
    val type: String,
    val startTime: Long,
    val endTime: Long,
    val duration: Long // in milliseconds
) {
    val durationInMinutes: Double get() = duration / 60000.0
    val durationFormatted: String get() = "${(durationInMinutes).toInt()} min"
}