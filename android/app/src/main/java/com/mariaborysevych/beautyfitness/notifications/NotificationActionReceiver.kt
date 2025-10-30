package com.mariaborysevych.beautyfitness.notifications

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.RemoteInput
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class NotificationActionReceiver : BroadcastReceiver() {

    @Inject
    lateinit var notificationManager: BookingNotificationManager

    @Inject
    lateinit var notificationActionHandler: NotificationActionHandler

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        val bookingId = intent.getStringExtra("booking_id")

        when (action) {
            "com.mariaborysevych.beautyfitness.CONFIRM" -> {
                handleConfirmAttendance(context, bookingId)
            }
            "com.mariaborysevych.beautyfitness.RESCHEDULE" -> {
                handleReschedule(context, bookingId)
            }
            "com.mariaborysevych.beautyfitness.CANCEL" -> {
                handleCancel(context, bookingId)
            }
            "com.mariaborysevych.beautyfitness.SNOOZE" -> {
                val quickReply = RemoteInput.getResultsFromIntent(intent)
                    ?.getCharSequence("quick_reply")?.toString()
                handleSnooze(context, bookingId, quickReply)
            }
            "com.mariaborysevych.beautyfitness.VIEW_DETAILS" -> {
                handleViewDetails(context, bookingId)
            }
        }
    }

    private fun handleConfirmAttendance(context: Context, bookingId: String?) {
        if (bookingId == null) return

        CoroutineScope(Dispatchers.IO).launch {
            notificationActionHandler.confirmAttendance(bookingId)
        }

        // Show confirmation notification
        showActionFeedback(context, "Attendance confirmed", "We'll see you there!")
    }

    private fun handleReschedule(context: Context, bookingId: String?) {
        if (bookingId == null) return

        // Open app to reschedule screen
        val appIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        appIntent?.apply {
            putExtra("action", "reschedule")
            putExtra("booking_id", bookingId)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(appIntent)

        showActionFeedback(context, "Opening app", "You can reschedule your appointment")
    }

    private fun handleCancel(context: Context, bookingId: String?) {
        if (bookingId == null) return

        CoroutineScope(Dispatchers.IO).launch {
            notificationActionHandler.initiateCancellation(bookingId)
        }

        showActionFeedback(context, "Cancellation initiated", "Please confirm in the app")
    }

    private fun handleSnooze(context: Context, bookingId: String?, quickReply: String?) {
        if (bookingId == null) return

        CoroutineScope(Dispatchers.IO).launch {
            notificationActionHandler.snoozeReminder(bookingId, quickReply)
        }

        showActionFeedback(context, "Reminder snoozed", "We'll remind you again in 15 minutes")
    }

    private fun handleViewDetails(context: Context, bookingId: String?) {
        if (bookingId == null) return

        // Open app to booking details
        val appIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        appIntent?.apply {
            putExtra("action", "view_details")
            putExtra("booking_id", bookingId)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(appIntent)
    }

    private fun showActionFeedback(context: Context, title: String, message: String) {
        val notificationManager = NotificationManagerCompat.from(context)

        val feedbackNotification = androidx.core.app.NotificationCompat.Builder(
            context,
            "booking_reminders"
        )
            .setSmallIcon(android.R.drawable.ic_menu_info_details)
            .setContentTitle(title)
            .setContentText(message)
            .setAutoCancel(true)
            .setPriority(androidx.core.app.NotificationCompat.PRIORITY_DEFAULT)
            .setTimeoutAfter(3000) // Auto-dismiss after 3 seconds
            .build()

        notificationManager.notify(System.currentTimeMillis().toInt(), feedbackNotification)
    }
}