package com.mariiahub.wear.domain.model

import java.time.LocalDateTime

data class Appointment(
    val id: String,
    val clientId: String,
    val clientName: String,
    val clientEmail: String,
    val clientPhone: String?,
    val serviceId: String,
    val serviceName: String,
    val serviceType: ServiceType,
    val bookingDate: LocalDateTime,
    val startTime: String,
    val endTime: String,
    val duration: Int,
    val totalAmount: Double,
    val currency: String,
    val status: AppointmentStatus,
    val paymentStatus: PaymentStatus,
    val locationType: LocationType,
    val notes: String? = null,
    val preferences: String? = null,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
)

data class Service(
    val id: String,
    val title: String,
    val description: String,
    val serviceType: ServiceType,
    val category: String,
    val price: Double,
    val duration: Int,
    val isActive: Boolean
)

data class Stats(
    val todayAppointments: Int,
    val completedToday: Int,
    val todayRevenue: Double,
    val todaySteps: Int,
    val todayCalories: Int,
    val weekTotal: Int,
    val weekRevenue: Double,
    val totalBookings: Int,
    val currentHeartRate: Int?,
    val batteryLevel: Float,
    val isHealthConnected: Boolean
)

data class QuickAction(
    val id: String,
    val title: String,
    val description: String,
    val icon: String,
    val action: ActionType,
    val isEnabled: Boolean = true
)

data class WorkoutSession(
    val id: String,
    val type: WorkoutType,
    val startTime: LocalDateTime,
    val endTime: LocalDateTime?,
    val duration: Int?,
    val caloriesBurned: Int?,
    val heartRateData: List<HeartRateData>,
    val stepsCount: Int?,
    val isActive: Boolean
)

data class HeartRateData(
    val timestamp: LocalDateTime,
    val heartRate: Int
)

data class HealthMetrics(
    val steps: Int,
    val calories: Int,
    val heartRate: Int?,
    val weight: Double?,
    val activeMinutes: Int,
    val distance: Double?,
    val lastSync: LocalDateTime
)

data class NotificationInfo(
    val id: String,
    val title: String,
    val message: String,
    val type: NotificationType,
    val timestamp: LocalDateTime,
    val isRead: Boolean,
    val actionUrl: String? = null
)

// Enums

enum class ServiceType {
    BEAUTY,
    FITNESS,
    LIFESTYLE
}

enum class AppointmentStatus {
    PENDING,
    CONFIRMED,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED,
    NO_SHOW
}

enum class PaymentStatus {
    PENDING,
    PAID,
    FAILED,
    REFUNDED
}

enum class LocationType {
    STUDIO,
    HOME_VISIT,
    ONLINE
}

enum class ActionType {
    QUICK_BOOK,
    CALL_SALON,
    GET_DIRECTIONS,
    START_WORKOUT,
    EMERGENCY_CONTACT,
    SEND_MESSAGE
}

enum class WorkoutType {
    STRENGTH,
    CARDIO,
    YOGA,
    PILATES,
    STRETCHING,
    FUNCTIONAL
}

enum class NotificationType {
    APPOINTMENT_REMINDER,
    BOOKING_CONFIRMATION,
    CANCELLATION,
    WORKOUT_REMINDER,
    HEALTH_ALERT,
    EMERGENCY,
    SYSTEM_UPDATE
}

// Extensions

fun Appointment.formattedTime: String
    get() = startTime.substring(0, 5) // "HH:mm"

fun Appointment.isToday: Boolean
    get() {
        val now = LocalDateTime.now()
        return bookingDate.toLocalDate().isEqual(now.toLocalDate())
    }

fun Appointment.isUpcoming: Boolean
    get() {
        val now = LocalDateTime.now()
        return bookingDate.isAfter(now) && status == AppointmentStatus.CONFIRMED
    }

fun Stats.formattedRevenue: String
    get() = "PLN ${todayRevenue.toInt()}"

fun Stats.heartRateText: String
    get() = currentHeartRate?.let { "$it bpm" } ?: "N/A"

fun WorkoutSession.formattedDuration: String
    get() = duration?.let { "$it min" } ?: "Active"