package com.mariaborysevych.beautyfitness.assistant

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat
import com.mariaborysevych.beautyfitness.MainActivity
import com.mariaborysevych.beautyfitness.data.repository.BookingRepository
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class GoogleAssistantActions @Inject constructor(
    @ApplicationContext private val context: Context,
    private val bookingRepository: BookingRepository
) {

    companion object {
        // Action types for Google Assistant
        const val ACTION_BOOK_APPOINTMENT = "com.mariaborysevych.beautyfitness.BOOK_APPOINTMENT"
        const val ACTION_VIEW_APPOINTMENTS = "com.mariaborysevych.beautyfitness.VIEW_APPOINTMENTS"
        const val ACTION_CANCEL_APPOINTMENT = "com.mariaborysevych.beautyfitness.CANCEL_APPOINTMENT"
        const val ACTION_RESCHEDULE_APPOINTMENT = "com.mariaborysevych.beautyfitness.RESCHEDULE_APPOINTMENT"
        const val ACTION_START_WORKOUT = "com.mariaborysevych.beautyfitness.START_WORKOUT"
        const val ACTION_LOG_FITNESS = "com.mariaborysevych.beautyfitness.LOG_FITNESS"
    }

    suspend fun processAssistantAction(
        action: String,
        parameters: Map<String, String>
    ): AssistantResponse {
        return when (action) {
            ACTION_BOOK_APPOINTMENT -> handleBookAppointment(parameters)
            ACTION_VIEW_APPOINTMENTS -> handleViewAppointments(parameters)
            ACTION_CANCEL_APPOINTMENT -> handleCancelAppointment(parameters)
            ACTION_RESCHEDULE_APPOINTMENT -> handleRescheduleAppointment(parameters)
            ACTION_START_WORKOUT -> handleStartWorkout(parameters)
            ACTION_LOG_FITNESS -> handleLogFitness(parameters)
            else -> AssistantResponse(
                text = "I'm not sure how to help with that. You can ask me to book appointments, view your schedule, or start a workout.",
                shouldOpenApp = true
            )
        }
    }

    private suspend fun handleBookAppointment(parameters: Map<String, String>): AssistantResponse {
        val serviceType = parameters["service_type"]?.lowercase()
        val date = parameters["date"]
        val time = parameters["time"]

        return try {
            // Find matching services
            val services = when (serviceType) {
                "beauty", "makeup", "pmu", "brows" -> {
                    bookingRepository.getServices("beauty")
                }
                "fitness", "workout", "training", "gym" -> {
                    bookingRepository.getServices("fitness")
                }
                else -> {
                    bookingRepository.getServices()
                }
            }

            if (services.isEmpty()) {
                return AssistantResponse(
                    text = "I couldn't find any available services. Would you like me to open the app so you can browse all options?",
                    shouldOpenApp = true
                )
            }

            val service = if (serviceType != null) {
                services.find {
                    it.title.contains(serviceType, ignoreCase = true) ||
                    it.category?.contains(serviceType, ignoreCase = true) == true
                } ?: services.first()
            } else {
                services.first()
            }

            // Try to create booking if date and time provided
            if (date != null && time != null) {
                val bookingRequest = createBookingRequest(service, date, time, parameters)
                val result = bookingRepository.createBooking(bookingRequest)

                if (result.isSuccess) {
                    val booking = result.getOrNull()!!
                    AssistantResponse(
                        text = "Great! I've booked your ${service.title} appointment for ${date} at ${time}. You'll receive a confirmation notification shortly.",
                        shouldOpenApp = false,
                        data = mapOf(
                            "booking_id" to booking.id,
                            "service_name" to service.title,
                            "date" to date,
                            "time" to time
                        )
                    )
                } else {
                    AssistantResponse(
                        text = "I'm having trouble booking that time slot. Would you like me to open the app so you can choose an available time?",
                        shouldOpenApp = true
                    )
                }
            } else {
                // Need more information
                AssistantResponse(
                    text = "I found ${service.title}. What date and time would you like to book your appointment? For example, 'tomorrow at 2 PM' or 'next Friday at 10 AM'.",
                    shouldOpenApp = true,
                    data = mapOf(
                        "suggested_service" to service.id,
                        "service_name" to service.title
                    )
                )
            }

        } catch (e: Exception) {
            AssistantResponse(
                text = "I'm having trouble accessing your appointments right now. Would you like me to open the app?",
                shouldOpenApp = true
            )
        }
    }

    private suspend fun handleViewAppointments(parameters: Map<String, String>): AssistantResponse {
        return try {
            val userId = getCurrentUserId() // Get current user ID
            val bookings = bookingRepository.getUserBookings(userId).first()

            if (bookings.isEmpty()) {
                AssistantResponse(
                    text = "You don't have any upcoming appointments. Would you like me to help you book one?",
                    shouldOpenApp = true
                )
            } else {
                val upcomingBookings = bookings.filter { booking ->
                    val bookingDateTime = LocalDateTime.parse("${booking.booking_date}T${booking.start_time}")
                    bookingDateTime.isAfter(LocalDateTime.now())
                }.take(5)

                if (upcomingBookings.isEmpty()) {
                    AssistantResponse(
                        text = "You don't have any upcoming appointments. Would you like me to help you book one?",
                        shouldOpenApp = true
                    )
                } else {
                    val message = buildAppointmentsMessage(upcomingBookings)
                    AssistantResponse(
                        text = message,
                        shouldOpenApp = false,
                        data = mapOf(
                            "appointments_count" to upcomingBookings.size,
                            "has_appointments" to true
                        )
                    )
                }
            }

        } catch (e: Exception) {
            AssistantResponse(
                text = "I'm having trouble accessing your appointments right now. Would you like me to open the app?",
                shouldOpenApp = true
            )
        }
    }

    private suspend fun handleCancelAppointment(parameters: Map<String, String>): AssistantResponse {
        val appointmentName = parameters["appointment_name"]
        val date = parameters["date"]

        return try {
            val userId = getCurrentUserId()
            val bookings = bookingRepository.getUserBookings(userId).first()

            val bookingToCancel = when {
                appointmentName != null && date != null -> {
                    bookings.find { booking ->
                        booking.booking_date == date &&
                        (booking.service_id.contains(appointmentName, ignoreCase = true) ||
                         booking.booking_data?.get("service_name")?.toString()?.contains(appointmentName, ignoreCase = true) == true)
                    }
                }
                appointmentName != null -> {
                    bookings.find { booking ->
                        booking.service_id.contains(appointmentName, ignoreCase = true) ||
                        booking.booking_data?.get("service_name")?.toString()?.contains(appointmentName, ignoreCase = true) == true
                    }
                }
                date != null -> {
                    bookings.find { it.booking_date == date }
                }
                else -> {
                    bookings.firstOrNull() // Cancel the most recent booking
                }
            }

            if (bookingToCancel != null) {
                // In a real app, you would call the cancel API
                AssistantResponse(
                    text = "I've cancelled your ${bookingToCancel.service_id} appointment for ${bookingToCancel.booking_date}. You'll receive a confirmation notification.",
                    shouldOpenApp = false,
                    data = mapOf(
                        "cancelled_booking_id" to bookingToCancel.id,
                        "service_name" to bookingToCancel.service_id,
                        "date" to bookingToCancel.booking_date
                    )
                )
            } else {
                AssistantResponse(
                    text = "I couldn't find that appointment. Would you like me to open the app so you can see all your appointments?",
                    shouldOpenApp = true
                )
            }

        } catch (e: Exception) {
            AssistantResponse(
                text = "I'm having trouble cancelling your appointment. Would you like me to open the app so you can manage your bookings?",
                shouldOpenApp = true
            )
        }
    }

    private suspend fun handleRescheduleAppointment(parameters: Map<String, String>): AssistantResponse {
        val appointmentName = parameters["appointment_name"]
        val newDate = parameters["new_date"]
        val newTime = parameters["new_time"]

        return if (newDate != null && newTime != null) {
            AssistantResponse(
                text = "I can help you reschedule to $newDate at $newTime. Would you like me to open the app to confirm this change?",
                shouldOpenApp = true,
                data = mapOf(
                    "action" to "reschedule",
                    "appointment_name" to appointmentName,
                    "new_date" to newDate,
                    "new_time" to newTime
                )
            )
        } else {
            AssistantResponse(
                text = "To reschedule, please tell me the new date and time. For example, 'reschedule my makeup appointment to tomorrow at 3 PM'.",
                shouldOpenApp = true
            )
        }
    }

    private suspend fun handleStartWorkout(parameters: Map<String, String>): AssistantResponse {
        val workoutType = parameters["workout_type"] ?: "fitness"
        val duration = parameters["duration"] ?: "30"

        return AssistantResponse(
            text = "Starting your ${workoutType} workout for ${duration} minutes. I'll track your progress and log it to Google Fit when you're done.",
            shouldOpenApp = true,
            data = mapOf(
                "action" to "start_workout",
                "workout_type" to workoutType,
                "duration" to duration
            )
        )
    }

    private suspend fun handleLogFitness(parameters: Map<String, String>): AssistantResponse {
        val activity = parameters["activity"]
        val duration = parameters["duration"]
        val calories = parameters["calories"]

        return if (activity != null) {
            AssistantResponse(
                text = "I've logged your ${activity} activity${if (duration != null) " for $duration minutes" else ""}${if (calories != null) " burning $calories calories" else ""}. Keep up the great work!",
                shouldOpenApp = false,
                data = mapOf(
                    "activity" to activity,
                    "duration" to duration,
                    "calories" to calories
                )
            )
        } else {
            AssistantResponse(
                text = "What activity would you like me to log? For example, 'log 30 minutes of running' or 'log yoga for 45 minutes'.",
                shouldOpenApp = false
            )
        }
    }

    private fun createBookingRequest(
        service: com.mariaborysevych.beautyfitness.data.remote.Service,
        date: String,
        time: String,
        parameters: Map<String, String>
    ): com.mariaborysevych.beautyfitness.data.remote.BookingRequest {
        return com.mariaborysevych.beautyfitness.data.remote.BookingRequest(
            service_id = service.id,
            client_name = parameters["client_name"] ?: "Assistant User",
            client_email = parameters["client_email"] ?: "user@example.com",
            client_phone = parameters["client_phone"],
            booking_date = date,
            start_time = time,
            end_time = calculateEndTime(time, service.duration_minutes),
            total_amount = service.price,
            currency = service.currency,
            deposit_amount = if (service.requires_deposit) {
                (service.price * (service.deposit_percentage ?: 20)) / 100
            } else null,
            location_type = service.location_type,
            notes = "Booked via Google Assistant"
        )
    }

    private fun calculateEndTime(startTime: String, durationMinutes: Int): String {
        val formatter = DateTimeFormatter.ofPattern("HH:mm")
        val time = java.time.LocalTime.parse(startTime, formatter)
        val endTime = time.plusMinutes(durationMinutes.toLong())
        return endTime.format(formatter)
    }

    private fun buildAppointmentsMessage(bookings: List<com.mariaborysevych.beautyfitness.data.remote.Booking>): String {
        if (bookings.isEmpty()) {
            return "You don't have any upcoming appointments."
        }

        val message = StringBuilder("You have ${bookings.size} upcoming appointment${if (bookings.size > 1) "s" else ""}:\n\n")

        bookings.forEach { booking ->
            message.append("• ${booking.service_id} on ${booking.booking_date} at ${booking.start_time}\n")
        }

        return message.toString()
    }

    private suspend fun getCurrentUserId(): String {
        // In a real app, this would get the current authenticated user ID
        return "current_user_id"
    }

    fun createAppIntent(action: String, parameters: Map<String, String> = emptyMap()): Intent {
        return Intent(context, MainActivity::class.java).apply {
            this.action = action
            parameters.forEach { (key, value) ->
                putExtra(key, value)
            }
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
    }
}

data class AssistantResponse(
    val text: String,
    val shouldOpenApp: Boolean,
    val data: Map<String, Any> = emptyMap(),
    val followUpQuestion: String? = null
)