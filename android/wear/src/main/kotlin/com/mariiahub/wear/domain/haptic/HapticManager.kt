package com.mariiahub.wear.domain.haptic

import android.content.Context
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class HapticManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val vibrator: Vibrator? = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
        val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
        vibratorManager.defaultVibrator
    } else {
        @Suppress("DEPRECATION")
        context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator?
    }

    private val coroutineScope = CoroutineScope(kotlinx.coroutines.Dispatchers.Default)

    fun playClick() {
        vibrate(VibrationEffect.createOneShot(10, VibrationEffect.DEFAULT_AMPLITUDE))
    }

    fun playSuccess() {
        val pattern = longArrayOf(0, 50, 30, 50)
        vibrate(VibrationEffect.createWaveform(pattern, -1))
    }

    fun playError() {
        val pattern = longArrayOf(0, 100, 50, 100, 50, 100)
        vibrate(VibrationEffect.createWaveform(pattern, -1))
    }

    fun playNotification() {
        vibrate(VibrationEffect.createOneShot(25, VibrationEffect.DEFAULT_AMPLITUDE))
    }

    fun playWarning() {
        val pattern = longArrayOf(0, 75, 50, 75)
        vibrate(VibrationEffect.createWaveform(pattern, -1))
    }

    fun playEmergency() {
        coroutineScope.launch {
            // Strong, attention-grabbing pattern for emergencies
            val pattern = longArrayOf(0, 200, 100, 200, 100, 200, 100, 200, 500, 300, 500, 300, 500)
            vibrate(VibrationEffect.createWaveform(pattern, -1))

            // Repeat after 2 seconds
            delay(2000)
            playEmergency()
        }
    }

    fun playHeartbeat() {
        val pattern = longArrayOf(0, 100, 200, 100, 800, 100, 200, 100, 1200)
        vibrate(VibrationEffect.createWaveform(pattern, -1))
    }

    fun playPulse() {
        val pattern = longArrayOf(0, 50, 50, 50, 50, 50)
        vibrate(VibrationEffect.createWaveform(pattern, -1))
    }

    fun playBreathing() {
        val pattern = longArrayOf(0, 150, 150, 150, 150, 150, 150, 150, 1000)
        vibrate(VibrationEffect.createWaveform(pattern, -1))
    }

    fun playWorkoutStart() {
        // Motivating pattern for workout start
        val pattern = longArrayOf(0, 80, 40, 80, 40, 120)
        vibrate(VibrationEffect.createWaveform(pattern, -1))
    }

    fun playWorkoutMilestone() {
        // Celebratory pattern for workout milestones
        val pattern = longArrayOf(0, 60, 30, 60, 30, 60, 30, 120)
        vibrate(VibrationEffect.createWaveform(pattern, -1))
    }

    fun playWorkoutComplete() {
        // Completion pattern
        val pattern = longArrayOf(0, 100, 50, 100, 50, 100, 50, 200)
        vibrate(VibrationEffect.createWaveform(pattern, -1))
    }

    fun playBookingFlowHaptic(step: BookingStep) {
        when (step) {
            BookingStep.SERVICE_SELECTED -> playClick()
            BookingStep.TIME_SELECTED -> playClick()
            BookingStep.CONFIRMED -> playSuccess()
            BookingStep.CANCELLED -> playWarning()
        }
    }

    fun playNavigationHaptic(instruction: NavigationInstruction) {
        when (instruction) {
            NavigationInstruction.TURN_LEFT -> vibrate(VibrationEffect.createOneShot(30, VibrationEffect.DEFAULT_AMPLITUDE))
            NavigationInstruction.TURN_RIGHT -> vibrate(VibrationEffect.createOneShot(30, VibrationEffect.DEFAULT_AMPLITUDE))
            NavigationInstruction.ARRIVED -> playSuccess()
            NavigationInstruction.REROUTING -> playWarning()
        }
    }

    fun playPremiumFeedback(type: PremiumFeedbackType) {
        when (type) {
            PremiumFeedbackType.LUXURY_TAP -> {
                // Soft, luxurious tap feedback
                vibrate(VibrationEffect.createOneShot(15, 80))
            }
            PremiumFeedbackType.PREMIUM_UNLOCK -> {
                // Satisfying unlock pattern
                val pattern = longArrayOf(0, 40, 20, 60, 20, 80)
                vibrate(VibrationEffect.createWaveform(pattern, -1))
            }
            PremiumFeedbackType.ACHIEVEMENT_UNLOCKED -> {
                // Celebratory achievement pattern
                val pattern = longArrayOf(0, 80, 40, 80, 40, 120, 40, 160)
                vibrate(VibrationEffect.createWaveform(pattern, -1))
            }
            PremiumFeedbackType.BOOKING_CONFIRMED -> {
                // Premium booking confirmation
                val pattern = longArrayOf(0, 60, 30, 90, 30, 120)
                vibrate(VibrationEffect.createWaveform(pattern, -1))
            }
        }
    }

    fun playBatteryAwareHaptic(type: HapticType, batteryLevel: Float) {
        // Reduce haptic intensity when battery is low
        if (batteryLevel < 0.2f) {
            when (type) {
                HapticType.NOTIFICATION -> return // Skip non-essential haptics
                HapticType.SUCCESS -> vibrate(VibrationEffect.createOneShot(20, 50))
                HapticType.ERROR -> vibrate(VibrationEffect.createOneShot(40, 80))
                HapticType.CLICK -> vibrate(VibrationEffect.createOneShot(5, 30))
                else -> return // Skip other non-essential haptics
            }
        } else {
            when (type) {
                HapticType.NOTIFICATION -> playNotification()
                HapticType.SUCCESS -> playSuccess()
                HapticType.ERROR -> playError()
                HapticType.WARNING -> playWarning()
                HapticType.CLICK -> playClick()
                HapticType.EMERGENCY -> playEmergency()
                HapticType.HEARTBEAT -> playHeartbeat()
                HapticType.PULSE -> playPulse()
                HapticType.BREATHING -> playBreathing()
            }
        }
    }

    fun playContinuousHeartbeat(duration: Long) {
        coroutineScope.launch {
            val startTime = System.currentTimeMillis()
            while (System.currentTimeMillis() - startTime < duration) {
                playHeartbeat()
                delay(3000) // Heartbeat every 3 seconds
            }
        }
    }

    fun playCustomPattern(pattern: LongArray, repeat: Int = -1) {
        vibrate(VibrationEffect.createWaveform(pattern, repeat))
    }

    private fun vibrate(effect: VibrationEffect?) {
        try {
            vibrator?.let {
                if (it.hasVibrator()) {
                    it.vibrate(effect)
                }
            }
        } catch (e: Exception) {
            Timber.e(e, "Failed to vibrate")
        }
    }

    fun hasVibrator(): Boolean {
        return vibrator?.hasVibrator() == true
    }

    fun stopVibration() {
        try {
            vibrator?.cancel()
        } catch (e: Exception) {
            Timber.e(e, "Failed to stop vibration")
        }
    }
}

// Enums for haptic types
enum class HapticType {
    NOTIFICATION,
    SUCCESS,
    ERROR,
    WARNING,
    CLICK,
    EMERGENCY,
    HEARTBEAT,
    PULSE,
    BREATHING
}

enum class BookingStep {
    SERVICE_SELECTED,
    TIME_SELECTED,
    CONFIRMED,
    CANCELLED
}

enum class NavigationInstruction {
    TURN_LEFT,
    TURN_RIGHT,
    ARRIVED,
    REROUTING
}

enum class PremiumFeedbackType {
    LUXURY_TAP,
    PREMIUM_UNLOCK,
    ACHIEVEMENT_UNLOCKED,
    BOOKING_CONFIRMED
}