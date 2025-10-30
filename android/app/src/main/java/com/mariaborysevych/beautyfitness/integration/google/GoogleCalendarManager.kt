package com.mariaborysevych.beautyfitness.integration.google

import android.app.Activity
import android.content.Context
import android.content.Intent
import androidx.activity.result.ActivityResultLauncher
import com.google.api.client.googleapis.extensions.android.gms.auth.GoogleAccountCredential
import com.google.api.client.googleapis.extensions.android.gms.auth.UserRecoverableAuthIOException
import com.google.api.client.http.javanet.NetHttpTransport
import com.google.api.client.json.JsonFactory
import com.google.api.client.json.jackson2.JacksonFactory
import com.google.api.client.util.DateTime
import com.google.api.services.calendar.Calendar
import com.google.api.services.calendar.CalendarScopes
import com.google.api.services.calendar.model.*
import com.mariaborysevych.beautyfitness.BuildConfig
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import java.io.IOException
import java.time.*
import java.time.format.DateTimeFormatter
import java.util.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class GoogleCalendarManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        private const val CALENDAR_ID = "primary"
        private const val APPLICATION_NAME = "Mariia Hub Beauty & Fitness"
    }

    private val httpTransport = NetHttpTransport()
    private val jsonFactory: JsonFactory = JacksonFactory.getDefaultInstance()

    private var calendarService: Calendar? = null

    private val _isAuthorized = MutableStateFlow(false)
    val isAuthorized: StateFlow<Boolean> = _isAuthorized.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    private val _events = MutableStateFlow<List<CalendarEvent>>(emptyList())
    val events: StateFlow<List<CalendarEvent>> = _events.asStateFlow()

    fun initialize(credential: GoogleAccountCredential) {
        try {
            calendarService = Calendar.Builder(
                httpTransport,
                jsonFactory,
                credential
            )
                .setApplicationName(APPLICATION_NAME)
                .build()

            _isAuthorized.value = true
        } catch (e: Exception) {
            _error.value = "Failed to initialize calendar: ${e.message}"
        }
    }

    suspend fun createBookingEvent(
        title: String,
        description: String,
        location: String,
        startTime: LocalDateTime,
        endTime: LocalDateTime,
        reminderMinutes: List<Int> = listOf(60, 15) // 1 hour and 15 minutes before
    ): Result<String> {
        return withContext(Dispatchers.IO) {
            if (!_isAuthorized.value) {
                return@withContext Result.failure(Exception("Calendar not authorized"))
            }

            _isLoading.value = true

            try {
                val event = Event().apply {
                    summary = title
                    description = description
                    location = location
                    start = EventDateTime().setDateTime(
                        DateTime(startTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli())
                    )
                    end = EventDateTime().setDateTime(
                        DateTime(endTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli())
                    )

                    // Set reminders
                    reminders = Event.Reminders().apply {
                        useDefault = false
                        overrides = reminderMinutes.map { minutes ->
                            EventReminder().apply {
                                method = "popup"
                                minutes = minutes
                            }
                        }
                    }

                    // Add color for beauty/fitness services
                    colorId = when {
                        title.contains("beauty", ignoreCase = true) ||
                        title.contains("PMU", ignoreCase = true) ||
                        title.contains("brows", ignoreCase = true) -> "9" // Light blue
                        title.contains("fitness", ignoreCase = true) ||
                        title.contains("training", ignoreCase = true) ||
                        title.contains("gym", ignoreCase = true) -> "6" // Orange
                        else -> "2" // Green
                    }

                    // Add extended properties for app identification
                    extendedProperties = Event.ExtendedProperties().apply {
                        private_ = mapOf(
                            "app_name" to "mariia_hub",
                            "event_type" to "booking",
                            "created_at" to Instant.now().toString()
                        )
                    }
                }

                val result = calendarService?.events()?.insert(CALENDAR_ID, event)?.execute()
                if (result?.id != null) {
                    Result.success(result.id)
                } else {
                    Result.failure(Exception("Failed to create calendar event"))
                }

            } catch (e: UserRecoverableAuthIOException) {
                _error.value = "Authorization required for calendar access"
                Result.failure(e)
            } catch (e: IOException) {
                _error.value = "Network error: ${e.message}"
                Result.failure(e)
            } catch (e: Exception) {
                _error.value = "Failed to create calendar event: ${e.message}"
                Result.failure(e)
            } finally {
                _isLoading.value = false
            }
        }
    }

    suspend fun updateEvent(
        eventId: String,
        title: String? = null,
        description: String? = null,
        location: String? = null,
        startTime: LocalDateTime? = null,
        endTime: LocalDateTime? = null
    ): Result<Unit> {
        return withContext(Dispatchers.IO) {
            if (!_isAuthorized.value) {
                return@withContext Result.failure(Exception("Calendar not authorized"))
            }

            try {
                val existingEvent = calendarService?.events()?.get(CALENDAR_ID, eventId)?.execute()
                    ?: return@withContext Result.failure(Exception("Event not found"))

                // Update fields if provided
                title?.let { existingEvent.summary = it }
                description?.let { existingEvent.description = it }
                location?.let { existingEvent.location = it }

                startTime?.let { start ->
                    existingEvent.start = EventDateTime().setDateTime(
                        DateTime(start.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli())
                    )
                }

                endTime?.let { end ->
                    existingEvent.end = EventDateTime().setDateTime(
                        DateTime(end.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli())
                    )
                }

                calendarService?.events()?.update(CALENDAR_ID, eventId, existingEvent)?.execute()
                Result.success(Unit)

            } catch (e: Exception) {
                _error.value = "Failed to update event: ${e.message}"
                Result.failure(e)
            }
        }
    }

    suspend fun deleteEvent(eventId: String): Result<Unit> {
        return withContext(Dispatchers.IO) {
            if (!_isAuthorized.value) {
                return@withContext Result.failure(Exception("Calendar not authorized"))
            }

            try {
                calendarService?.events()?.delete(CALENDAR_ID, eventId)?.execute()
                Result.success(Unit)
            } catch (e: Exception) {
                _error.value = "Failed to delete event: ${e.message}"
                Result.failure(e)
            }
        }
    }

    suspend fun loadUpcomingEvents(days: Int = 30): Result<List<CalendarEvent>> {
        return withContext(Dispatchers.IO) {
            if (!_isAuthorized.value) {
                return@withContext Result.failure(Exception("Calendar not authorized"))
            }

            _isLoading.value = true

            try {
                val now = DateTime(System.currentTimeMillis())
                val endTime = DateTime(
                    Instant.now().plus(days, ChronoUnit.DAYS).toEpochMilli()
                )

                val events = calendarService?.events()
                    ?.list(CALENDAR_ID)
                    ?.setTimeMin(now)
                    ?.setTimeMax(endTime)
                    ?.setSingleEvents(true)
                    ?.setOrderBy("startTime")
                    ?.execute()
                    ?.items
                    ?.map { event ->
                        CalendarEvent(
                            id = event.id ?: "",
                            title = event.summary ?: "",
                            description = event.description ?: "",
                            location = event.location ?: "",
                            startTime = event.start?.dateTime?.value?.let { time ->
                                LocalDateTime.ofInstant(Instant.ofEpochMilli(time), ZoneId.systemDefault())
                            } ?: LocalDateTime.now(),
                            endTime = event.end?.dateTime?.value?.let { time ->
                                LocalDateTime.ofInstant(Instant.ofEpochMilli(time), ZoneId.systemDefault())
                            } ?: LocalDateTime.now(),
                            colorId = event.colorId
                        )
                    } ?: emptyList()

                _events.value = events
                Result.success(events)

            } catch (e: Exception) {
                _error.value = "Failed to load events: ${e.message}"
                Result.failure(e)
            } finally {
                _isLoading.value = false
            }
        }
    }

    suspend fun checkConflicts(
        startTime: LocalDateTime,
        endTime: LocalDateTime
    ): Result<Boolean> {
        return withContext(Dispatchers.IO) {
            if (!_isAuthorized.value) {
                return@withContext Result.failure(Exception("Calendar not authorized"))
            }

            try {
                val startDateTime = DateTime(
                    startTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
                )
                val endDateTime = DateTime(
                    endTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
                )

                val events = calendarService?.events()
                    ?.list(CALENDAR_ID)
                    ?.setTimeMin(startDateTime)
                    ?.setTimeMax(endDateTime)
                    ?.setSingleEvents(true)
                    ?.execute()
                    ?.items
                    ?: emptyList()

                Result.success(events.isNotEmpty())

            } catch (e: Exception) {
                _error.value = "Failed to check conflicts: ${e.message}"
                Result.failure(e)
            }
        }
    }

    suspend fun createRecurringClassEvent(
        title: String,
        description: String,
        location: String,
        startTime: LocalTime,
        endTime: LocalTime,
        daysOfWeek: List<DayOfWeek>,
        recurrenceEnd: LocalDate,
        reminderMinutes: List<Int> = listOf(60, 15)
    ): Result<String> {
        return withContext(Dispatchers.IO) {
            if (!_isAuthorized.value) {
                return@withContext Result.failure(Exception("Calendar not authorized"))
            }

            try {
                // Create recurrence rule
                val daysStr = daysOfWeek.joinToString(",") { day ->
                    when (day.value) {
                        1 -> "MO"
                        2 -> "TU"
                        3 -> "WE"
                        4 -> "TH"
                        5 -> "FR"
                        6 -> "SA"
                        7 -> "SU"
                        else -> ""
                    }
                }

                val recurrenceRule = "RRULE:FREQ=WEEKLY;BYDAY=$daysStr;UNTIL=" +
                    recurrenceEnd.format(DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'"))

                val firstEvent = Event().apply {
                    summary = title
                    description = description
                    location = location

                    // Set first occurrence time
                    val today = LocalDate.now()
                    val nextOccurrence = daysOfWeek
                        .map { day ->
                            val date = today.plusDays(
                                (day.value - today.dayOfWeek.value + 7) % 7L
                            )
                            ZonedDateTime.of(date, startTime, ZoneId.systemDefault())
                        }
                        .minOrNull()
                        ?: ZonedDateTime.now()

                    start = EventDateTime().setDateTime(
                        DateTime(nextOccurrence.toInstant().toEpochMilli())
                    )
                    end = EventDateTime().setDateTime(
                        DateTime(nextOccurrence.plusHours(1).toInstant().toEpochMilli())
                    )

                    recurrence = listOf(recurrenceRule)

                    reminders = Event.Reminders().apply {
                        useDefault = false
                        overrides = reminderMinutes.map { minutes ->
                            EventReminder().apply {
                                method = "popup"
                                minutes = minutes
                            }
                        }
                    }

                    colorId = when {
                        title.contains("beauty", ignoreCase = true) -> "9"
                        title.contains("fitness", ignoreCase = true) -> "6"
                        else -> "2"
                    }

                    extendedProperties = Event.ExtendedProperties().apply {
                        private_ = mapOf(
                            "app_name" to "mariia_hub",
                            "event_type" to "recurring_class",
                            "created_at" to Instant.now().toString()
                        )
                    }
                }

                val result = calendarService?.events()?.insert(CALENDAR_ID, firstEvent)?.execute()
                if (result?.id != null) {
                    Result.success(result.id)
                } else {
                    Result.failure(Exception("Failed to create recurring event"))
                }

            } catch (e: Exception) {
                _error.value = "Failed to create recurring event: ${e.message}"
                Result.failure(e)
            }
        }
    }

    suspend fun getBookingEvents(): Result<List<CalendarEvent>> {
        return withContext(Dispatchers.IO) {
            if (!_isAuthorized.value) {
                return@withContext Result.failure(Exception("Calendar not authorized"))
            }

            try {
                val now = DateTime(System.currentTimeMillis())
                val endTime = DateTime(
                    Instant.now().plus(365, ChronoUnit.DAYS).toEpochMilli()
                )

                val events = calendarService?.events()
                    ?.list(CALENDAR_ID)
                    ?.setTimeMin(now)
                    ?.setTimeMax(endTime)
                    ?.setSingleEvents(true)
                    ?.setOrderBy("startTime")
                    ?.execute()
                    ?.items
                    ?.filter { event ->
                        // Filter for events created by our app
                        event.extendedProperties?.private?.get("app_name") == "mariia_hub" &&
                        event.extendedProperties?.private?.get("event_type") == "booking"
                    }
                    ?.map { event ->
                        CalendarEvent(
                            id = event.id ?: "",
                            title = event.summary ?: "",
                            description = event.description ?: "",
                            location = event.location ?: "",
                            startTime = event.start?.dateTime?.value?.let { time ->
                                LocalDateTime.ofInstant(Instant.ofEpochMilli(time), ZoneId.systemDefault())
                            } ?: LocalDateTime.now(),
                            endTime = event.end?.dateTime?.value?.let { time ->
                                LocalDateTime.ofInstant(Instant.ofEpochMilli(time), ZoneId.systemDefault())
                            } ?: LocalDateTime.now(),
                            colorId = event.colorId
                        )
                    } ?: emptyList()

                Result.success(events)

            } catch (e: Exception) {
                _error.value = "Failed to load booking events: ${e.message}"
                Result.failure(e)
            }
        }
    }

    fun clearError() {
        _error.value = null
    }
}

data class CalendarEvent(
    val id: String,
    val title: String,
    val description: String,
    val location: String,
    val startTime: LocalDateTime,
    val endTime: LocalDateTime,
    val colorId: String? = null
) {
    val durationMinutes: Long get() = java.time.Duration.between(startTime, endTime).toMinutes()
    val isPast: Boolean get() = endTime.isBefore(LocalDateTime.now())
    val isToday: Boolean get() =
        startTime.toLocalDate() == LocalDate.now() ||
        endTime.toLocalDate() == LocalDate.now()
    val isUpcoming: Boolean get() = startTime.isAfter(LocalDateTime.now())
}