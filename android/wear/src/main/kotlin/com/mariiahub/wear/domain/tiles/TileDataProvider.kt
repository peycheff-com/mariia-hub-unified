package com.mariiahub.wear.domain.tiles

import com.mariiahub.wear.domain.model.Appointment
import com.mariiahub.wear.domain.model.AppointmentStatus
import com.mariiahub.wear.domain.health.HealthManager
import dagger.hilt.android.scopes.ServiceScoped
import kotlinx.coroutines.*
import timber.log.Timber
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import javax.inject.Inject

@ServiceScoped
class TileDataProvider @Inject constructor(
    private val healthManager: HealthManager
) {

    private val _tileData = MutableStateFlow(TileData())
    val tileData: StateFlow<TileData> = _tileData.asStateFlow()

    private var dataRefreshJob: Job? = null

    init {
        startPeriodicDataRefresh()
    }

    suspend fun getTileData(): TileData {
        refreshTileData()
        return _tileData.value
    }

    private fun startPeriodicDataRefresh() {
        dataRefreshJob?.cancel()
        dataRefreshJob = CoroutineScope(Dispatchers.IO).launch {
            while (isActive) {
                try {
                    refreshTileData()
                    delay(REFRESH_INTERVAL_MS)
                } catch (e: Exception) {
                    Timber.e(e, "Error refreshing tile data")
                    delay(REFRESH_INTERVAL_MS * 2) // Wait longer on error
                }
            }
        }
    }

    private suspend fun refreshTileData() {
        try {
            // Get current health metrics
            val healthMetrics = healthManager.getTodayHealthData()

            // Get mock appointments (in real app, this would come from API/database)
            val appointments = getMockAppointments()
            val todayAppointments = appointments.filter { it.isToday }
            val upcomingAppointments = appointments.filter { it.isUpcoming }

            val tileData = TileData(
                todayAppointments = todayAppointments.size,
                todayRevenue = todayAppointments
                    .filter { it.status == AppointmentStatus.COMPLETED }
                    .sumOf { it.totalAmount },
                todaySteps = healthMetrics.steps,
                batteryLevel = getBatteryLevel(), // Get from system
                isHealthConnected = true,
                upcomingAppointments = upcomingAppointments.take(3),
                nextAppointment = todayAppointments
                    .filter { it.status == AppointmentStatus.CONFIRMED }
                    .minByOrNull { it.bookingDate },
                currentHeartRate = healthMetrics.heartRate
            )

            _tileData.value = tileData
            Timber.d("Tile data refreshed: $tileData")
        } catch (e: Exception) {
            Timber.e(e, "Failed to refresh tile data")
        }
    }

    private fun getBatteryLevel(): Float {
        // This would get the actual battery level from the system
        // For now, return a mock value
        return 0.75f
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
                serviceType = com.mariiahub.wear.domain.model.ServiceType.BEAUTY,
                bookingDate = now.plusHours(1),
                startTime = "${now.plusHours(1).hour}:00",
                endTime = "${now.plusHours(2).hour}:00",
                duration = 60,
                totalAmount = 300.0,
                currency = "PLN",
                status = AppointmentStatus.CONFIRMED,
                paymentStatus = com.mariiahub.wear.domain.model.PaymentStatus.PAID,
                locationType = com.mariiahub.wear.domain.model.LocationType.STUDIO,
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
                serviceType = com.mariiahub.wear.domain.model.ServiceType.BEAUTY,
                bookingDate = now.plusHours(3),
                startTime = "${now.plusHours(3).hour}:00",
                endTime = "${now.plusHours(4).hour}:00",
                duration = 45,
                totalAmount = 250.0,
                currency = "PLN",
                status = AppointmentStatus.CONFIRMED,
                paymentStatus = com.mariiahub.wear.domain.model.PaymentStatus.PAID,
                locationType = com.mariiahub.wear.domain.model.LocationType.STUDIO,
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
                serviceType = com.mariiahub.wear.domain.model.ServiceType.FITNESS,
                bookingDate = now.minusHours(2),
                startTime = "${now.minusHours(2).hour}:00",
                endTime = "${now.minusHours(1).hour}:00",
                duration = 60,
                totalAmount = 200.0,
                currency = "PLN",
                status = AppointmentStatus.COMPLETED,
                paymentStatus = com.mariiahub.wear.domain.model.PaymentStatus.PAID,
                locationType = com.mariiahub.wear.domain.model.LocationType.STUDIO,
                notes = null,
                preferences = null,
                createdAt = now.minusDays(3),
                updatedAt = now.minusDays(3)
            )
        )
    }

    fun stopPeriodicRefresh() {
        dataRefreshJob?.cancel()
        dataRefreshJob = null
    }

    companion object {
        private const val REFRESH_INTERVAL_MS = 30_000L // 30 seconds
    }
}

data class TileData(
    val todayAppointments: Int = 0,
    val todayRevenue: Double = 0.0,
    val todaySteps: Int = 0,
    val batteryLevel: Float = 0f,
    val isHealthConnected: Boolean = false,
    val upcomingAppointments: List<Appointment> = emptyList(),
    val nextAppointment: Appointment? = null,
    val currentHeartRate: Int? = null
)

data class AppointmentTileData(
    val clientName: String,
    val serviceName: String,
    val bookingDate: LocalDateTime,
    val formattedTime: String
)

// Extension functions for tile data
fun Appointment.toTileData(): AppointmentTileData {
    return AppointmentTileData(
        clientName = clientName,
        serviceName = serviceName,
        bookingDate = bookingDate,
        formattedTime = formattedTime
    )
}