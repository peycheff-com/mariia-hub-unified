package com.mariaborysevych.beautyfitness.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.Person
import androidx.core.app.RemoteInput
import com.mariaborysevych.beautyfitness.R
import com.mariaborysevych.beautyfitness.MainActivity
import com.mariaborysevych.beautyfitness.data.remote.Booking
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BookingNotificationManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        private const val CHANNEL_BOOKING_REMINDERS = "booking_reminders"
        private const val CHANNEL_BOOKING_CONFIRMATIONS = "booking_confirmations"
        private const val CHANNEL_PROMOTIONS = "promotions"
        private const val CHANNEL_URGENT = "urgent"

        // Notification IDs
        private const val NOTIFICATION_REMINDER_BASE = 1000
        private const val NOTIFICATION_CONFIRMATION_BASE = 2000
        private const val NOTIFICATION_PROMOTION_BASE = 3000
        private const val NOTIFICATION_URGENT_BASE = 4000

        // Actions
        private const val ACTION_RESCHEDULE = "com.mariaborysevych.beautyfitness.RESCHEDULE"
        private const val ACTION_CANCEL = "com.mariaborysevych.beautyfitness.CANCEL"
        private const val ACTION_CONFIRM = "com.mariaborysevych.beautyfitness.CONFIRM"
        private const val ACTION_VIEW_DETAILS = "com.mariaborysevych.beautyfitness.VIEW_DETAILS"

        // Remote Input for quick replies
        private const val KEY_QUICK_REPLY = "quick_reply"
    }

    private val notificationManager = NotificationManagerCompat.from(context)

    private val _notificationHistory = MutableStateFlow<List<NotificationRecord>>(emptyList())
    val notificationHistory: StateFlow<List<NotificationRecord>> = _notificationHistory.asStateFlow()

    init {
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Booking Reminders Channel
            val remindersChannel = NotificationChannel(
                CHANNEL_BOOKING_REMINDERS,
                "Booking Reminders",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Reminders for upcoming beauty and fitness appointments"
                enableLights(true)
                enableVibration(true)
                setShowBadge(true)
                group = "bookings"
            }

            // Booking Confirmations Channel
            val confirmationsChannel = NotificationChannel(
                CHANNEL_BOOKING_CONFIRMATIONS,
                "Booking Confirmations",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Confirmations for successful bookings"
                enableLights(true)
                enableVibration(false)
                setShowBadge(true)
                group = "bookings"
            }

            // Promotions Channel
            val promotionsChannel = NotificationChannel(
                CHANNEL_PROMOTIONS,
                "Special Offers",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Special offers and promotions"
                enableLights(false)
                enableVibration(false)
                setShowBadge(true)
                group = "marketing"
            }

            // Urgent Notifications Channel
            val urgentChannel = NotificationChannel(
                CHANNEL_URGENT,
                "Urgent Updates",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Urgent booking updates and changes"
                enableLights(true)
                enableVibration(true)
                setShowBadge(true)
                group = "urgent"
            }

            notificationManager.createNotificationChannels(
                listOf(remindersChannel, confirmationsChannel, promotionsChannel, urgentChannel)
            )

            // Create notification groups
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val bookingGroup = NotificationChannel(
                    "bookings",
                    "Bookings",
                    NotificationManager.IMPORTANCE_HIGH
                )
                notificationManager.createNotificationChannel(bookingGroup)
            }
        }
    }

    fun showBookingReminder(
        booking: Booking,
        reminderMinutes: Int,
        isSnoozeAvailable: Boolean = true
    ) {
        val notificationId = NOTIFICATION_REMINDER_BASE + booking.id.hashCode()

        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("booking_id", booking.id)
            putExtra("notification_type", "reminder")
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Actions
        val actions = mutableListOf<NotificationCompat.Action>()

        // Confirm attendance action
        val confirmIntent = Intent(context, NotificationActionReceiver::class.java).apply {
            action = ACTION_CONFIRM
            putExtra("booking_id", booking.id)
        }
        val confirmPendingIntent = PendingIntent.getBroadcast(
            context,
            0,
            confirmIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        actions.add(
            NotificationCompat.Action.Builder(
                R.drawable.ic_check,
                "Confirm",
                confirmPendingIntent
            ).build()
        )

        // Reschedule action
        val rescheduleIntent = Intent(context, NotificationActionReceiver::class.java).apply {
            action = ACTION_RESCHEDULE
            putExtra("booking_id", booking.id)
        }
        val reschedulePendingIntent = PendingIntent.getBroadcast(
            context,
            0,
            rescheduleIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        actions.add(
            NotificationCompat.Action.Builder(
                R.drawable.ic_calendar,
                "Reschedule",
                reschedulePendingIntent
            ).build()
        )

        // Cancel action
        val cancelIntent = Intent(context, NotificationActionReceiver::class.java).apply {
            action = ACTION_CANCEL
            putExtra("booking_id", booking.id)
        }
        val cancelPendingIntent = PendingIntent.getBroadcast(
            context,
            0,
            cancelIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        actions.add(
            NotificationCompat.Action.Builder(
                R.drawable.ic_cancel,
                "Cancel",
                cancelPendingIntent
            ).build()
        )

        // Quick reply for messages
        if (isSnoozeAvailable) {
            val remoteInput = RemoteInput.Builder(KEY_QUICK_REPLY)
                .setLabel("Add a note...")
                .build()

            val snoozeIntent = Intent(context, NotificationActionReceiver::class.java).apply {
                action = "com.mariaborysevych.beautyfitness.SNOOZE"
                putExtra("booking_id", booking.id)
            }
            val snoozePendingIntent = PendingIntent.getBroadcast(
                context,
                0,
                snoozeIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            actions.add(
                NotificationCompat.Action.Builder(
                    R.drawable.ic_snooze,
                    "Snooze",
                    snoozePendingIntent
                ).addRemoteInput(remoteInput)
                .build()
            )
        }

        val notification = NotificationCompat.Builder(context, CHANNEL_BOOKING_REMINDERS)
            .setSmallIcon(R.drawable.ic_notification)
            .setLargeIcon(BitmapFactory.decodeResource(context.resources, R.drawable.ic_spa))
            .setContentTitle("Booking Reminder")
            .setContentText("Your ${booking.service_id} appointment is in $reminderMinutes minutes")
            .setStyle(
                NotificationCompat.BigTextStyle()
                    .bigText(buildBookingReminderMessage(booking, reminderMinutes))
            )
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setGroup("bookings")
            .setGroupSummary(false)
            .addAction(actions[0]) // Confirm
            .addAction(actions[1]) // Reschedule
            .addAction(actions[2]) // Cancel
            .apply {
                if (isSnoozeAvailable) {
                    addAction(actions[3]) // Snooze
                }
            }
            .build()

        notificationManager.notify(notificationId, notification)

        // Record notification
        recordNotification(
            notificationId,
            "booking_reminder",
            "Reminder for ${booking.client_name}'s appointment",
            booking.id
        )
    }

    fun showBookingConfirmation(booking: Booking) {
        val notificationId = NOTIFICATION_CONFIRMATION_BASE + booking.id.hashCode()

        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("booking_id", booking.id)
            putExtra("notification_type", "confirmation")
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // View details action
        val detailsIntent = Intent(context, NotificationActionReceiver::class.java).apply {
            action = ACTION_VIEW_DETAILS
            putExtra("booking_id", booking.id)
        }
        val detailsPendingIntent = PendingIntent.getBroadcast(
            context,
            0,
            detailsIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_BOOKING_CONFIRMATIONS)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("Booking Confirmed!")
            .setContentText("Your appointment has been successfully booked")
            .setStyle(
                NotificationCompat.BigTextStyle()
                    .bigText(buildConfirmationMessage(booking))
            )
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setCategory(NotificationCompat.CATEGORY_EVENT)
            .setGroup("bookings")
            .addAction(
                NotificationCompat.Action.Builder(
                    R.drawable.ic_info,
                    "View Details",
                    detailsPendingIntent
                ).build()
            )
            .build()

        notificationManager.notify(notificationId, notification)

        recordNotification(
            notificationId,
            "booking_confirmation",
            "Confirmation for ${booking.client_name}'s booking",
            booking.id
        )
    }

    fun showBookingCancellation(booking: Booking, reason: String? = null) {
        val notificationId = NOTIFICATION_URGENT_BASE + booking.id.hashCode()

        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("booking_id", booking.id)
            putExtra("notification_type", "cancellation")
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_URGENT)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("Booking Cancelled")
            .setContentText("Your appointment has been cancelled")
            .setStyle(
                NotificationCompat.BigTextStyle()
                    .bigText(buildCancellationMessage(booking, reason))
            )
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_EVENT)
            .setGroup("bookings")
            .build()

        notificationManager.notify(notificationId, notification)

        recordNotification(
            notificationId,
            "booking_cancellation",
            "Cancellation notice for ${booking.client_name}",
            booking.id
        )
    }

    fun showPromotionalNotification(
        title: String,
        message: String,
        imageUrl: String? = null
    ) {
        val notificationId = NOTIFICATION_PROMOTION_BASE + System.currentTimeMillis().toInt()

        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("notification_type", "promotion")
            putExtra("promotion_title", title)
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = NotificationCompat.Builder(context, CHANNEL_PROMOTIONS)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(message)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_PROMO)
            .setGroup("promotions")

        // Add image if provided
        if (imageUrl != null) {
            // TODO: Load image from URL using Coil or similar
            builder.setStyle(
                NotificationCompat.BigPictureStyle()
                    .bigPicture(null) // Set loaded image here
                    .bigLargeIcon(null)
            )
        } else {
            builder.setStyle(
                NotificationCompat.BigTextStyle()
                    .bigText(message)
            )
        }

        notificationManager.notify(notificationId, builder.build())

        recordNotification(
            notificationId,
            "promotion",
            "Promotional: $title",
            null
        )
    }

    fun showUpcomingBookingsSummary(bookings: List<Booking>) {
        if (bookings.isEmpty()) return

        val notificationId = NOTIFICATION_REMINDER_BASE + "summary".hashCode()

        val inboxStyle = NotificationCompat.InboxStyle()
            .setBigContentTitle("Upcoming Appointments")
            .setSummaryText("${bookings.size} appointments this week")

        bookings.take(5).forEach { booking ->
            inboxStyle.addLine(formatBookingLine(booking))
        }

        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("notification_type", "upcoming_summary")
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_BOOKING_REMINDERS)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("Upcoming Appointments")
            .setContentText("You have ${bookings.size} appointments this week")
            .setStyle(inboxStyle)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setGroup("bookings")
            .setGroupSummary(true)
            .build()

        notificationManager.notify(notificationId, notification)

        recordNotification(
            notificationId,
            "upcoming_summary",
            "Weekly summary of ${bookings.size} bookings",
            null
        )
    }

    private fun buildBookingReminderMessage(booking: Booking, reminderMinutes: Int): String {
        val timeFormatter = DateTimeFormatter.ofPattern("h:mm a")
        val dateFormatter = DateTimeFormatter.ofPattern("EEEE, MMMM d")

        return "📍 ${booking.location_type ?: "Studio"}\n" +
                "📅 ${LocalDateTime.parse(booking.booking_date).format(dateFormatter)}\n" +
                "⏰ ${booking.start_time}\n" +
                "💄 ${booking.service_id}\n\n" +
                "Your appointment is in $reminderMinutes minutes. " +
                "Please confirm your attendance or reschedule if needed."
    }

    private fun buildConfirmationMessage(booking: Booking): String {
        return "✅ Your appointment has been confirmed!\n\n" +
                "Service: ${booking.service_id}\n" +
                "Date: ${booking.booking_date}\n" +
                "Time: ${booking.start_time}\n" +
                "Location: ${booking.location_type ?: "Studio"}\n\n" +
                "We'll send you a reminder before your appointment."
    }

    private fun buildCancellationMessage(booking: Booking, reason: String?): String {
        val baseMessage = "❌ Your appointment has been cancelled.\n\n" +
                "Service: ${booking.service_id}\n" +
                "Date: ${booking.booking_date}\n" +
                "Time: ${booking.start_time}"

        return if (reason != null) {
            "$baseMessage\n\nReason: $reason"
        } else {
            baseMessage
        }
    }

    private fun formatBookingLine(booking: Booking): String {
        return "${booking.booking_date} • ${booking.start_time} • ${booking.service_id}"
    }

    private fun recordNotification(
        notificationId: Int,
        type: String,
        message: String,
        bookingId: String?
    ) {
        val record = NotificationRecord(
            id = notificationId,
            type = type,
            message = message,
            bookingId = bookingId,
            timestamp = System.currentTimeMillis()
        )

        val currentHistory = _notificationHistory.value.toMutableList()
        currentHistory.add(0, record) // Add to beginning

        // Keep only last 100 notifications
        if (currentHistory.size > 100) {
            currentHistory.removeAt(currentHistory.size - 1)
        }

        _notificationHistory.value = currentHistory
    }

    fun cancelNotification(notificationId: Int) {
        notificationManager.cancel(notificationId)
    }

    fun cancelAllNotifications() {
        notificationManager.cancelAll()
    }

    fun cancelNotificationsForBooking(bookingId: String) {
        val notificationsToCancel = _notificationHistory.value
            .filter { it.bookingId == bookingId }
            .map { it.id }

        notificationsToCancel.forEach { id ->
            notificationManager.cancel(id)
        }
    }
}

data class NotificationRecord(
    val id: Int,
    val type: String,
    val message: String,
    val bookingId: String?,
    val timestamp: Long
)