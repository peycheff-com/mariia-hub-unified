import Foundation
import WatchKit
import AVFoundation

class HapticManager: ObservableObject {
    static let shared = HapticManager()

    private var audioPlayer: AVAudioPlayer?

    private init() {}

    // MARK: - Haptic Feedback Types

    enum HapticType {
        case notification
        case success
        case warning
        case error
        case selection
        case impact(light: Bool = false, medium: Bool = false, heavy: Bool = false)
        case pulse
        case heartbeat
        case breathing
    }

    func play(_ type: HapticType) {
        switch type {
        case .notification:
            playNotification()
        case .success:
            playSuccess()
        case .warning:
            playWarning()
        case .error:
            playError()
        case .selection:
            playSelection()
        case .impact(let light, let medium, let heavy):
            if light {
                playImpactLight()
            } else if medium {
                playImpactMedium()
            } else if heavy {
                playImpactHeavy()
            }
        case .pulse:
            playPulse()
        case .heartbeat:
            playHeartbeat()
        case .breathing:
            playBreathing()
        }
    }

    // MARK: - Core Haptic Functions

    private func playNotification() {
        WKInterfaceDevice.current().play(.notification)
    }

    private func playSuccess() {
        WKInterfaceDevice.current().play(.success)
    }

    private func playWarning() {
        WKInterfaceDevice.current().play(.start)
    }

    private func playError() {
        WKInterfaceDevice.current().play(.failure)
    }

    private func playSelection() {
        WKInterfaceDevice.current().play(.click)
    }

    private func playImpactLight() {
        WKInterfaceDevice.current().play(.notification)
    }

    private func playImpactMedium() {
        WKInterfaceDevice.current().play(.success)
    }

    private func playImpactHeavy() {
        WKInterfaceDevice.current().play(.failure)
    }

    // MARK: - Custom Haptic Patterns

    func playPulse() {
        createCustomPattern(pattern: [100, 50, 100, 50, 100])
    }

    func playHeartbeat() {
        createCustomPattern(pattern: [200, 100, 200, 500, 200, 100, 200, 800])
    }

    func playBreathing() {
        createCustomPattern(pattern: [300, 200, 300, 200, 300, 200, 300, 1000])
    }

    private func createCustomPattern(pattern: [TimeInterval]) {
        Task {
            for (index, duration) in pattern.enumerated() {
                if index % 2 == 0 {
                    WKInterfaceDevice.current().play(.notification)
                }
                try? await Task.sleep(nanoseconds: UInt64(duration * 1_000_000_000))
            }
        }
    }

    // MARK: - Audio Feedback for Premium Experience

    func playPremiumSound(_ soundType: PremiumSoundType) {
        guard let url = Bundle.main.url(forResource: soundType.fileName, withExtension: "wav") else {
            return
        }

        do {
            audioPlayer = try AVAudioPlayer(contentsOf: url)
            audioPlayer?.play()
        } catch {
            print("Failed to play premium sound: \(error)")
        }
    }

    enum PremiumSoundType {
        case bookingConfirmed
        case luxuryTap
        case premiumUnlock
        case achievement
        case meditationBell

        var fileName: String {
            switch self {
            case .bookingConfirmed:
                return "luxury_booking_confirmed"
            case .luxuryTap:
                return "luxury_tap"
            case .premiumUnlock:
                return "premium_unlock"
            case .achievement:
                return "achievement_chime"
            case .meditationBell:
                return "meditation_bell"
            }
        }
    }

    // MARK: - Contextual Haptics

    func playBookingFlowHaptic(for step: BookingStep) {
        switch step {
        case .serviceSelected:
            play(.impact(light: true))
        case .timeSelected:
            play(.selection)
        case .confirmed:
            play(.success)
            playPremiumSound(.bookingConfirmed)
        case .cancelled:
            play(.warning)
        }
    }

    func playWorkoutHaptic(for state: WorkoutState) {
        switch state {
        case .starting:
            play(.pulse)
        case .paused:
            play(.warning)
        case .resumed:
            play(.impact(medium: true))
        case .completed:
            play(.success)
        case .milestone:
            play(.heartbeat)
        }
    }

    func playEmergencyHaptic() {
        // Strong, attention-grabbing pattern for emergencies
        createCustomPattern(pattern: [500, 100, 500, 100, 500, 100, 500])
        playPremiumSound(.premiumUnlock)
    }

    func playNavigationHaptic(for instruction: NavigationInstruction) {
        switch instruction {
        case .turnLeft:
            play(.impact(light: true))
        case .turnRight:
            play(.impact(light: true))
        case .arrived:
            play(.success)
        case .rerouting:
            play(.warning)
        }
    }

    // MARK: - Accessibility Haptics

    func playAccessibilityHaptic(for element: AccessibilityElement) {
        switch element {
        case .focused:
            play(.selection)
        case .activated:
            play(.success)
        case .warning:
            play(.warning)
        case .error:
            play(.error)
        }
    }

    // MARK: - Battery-Aware Haptics

    func playBatteryAwareHaptic(_ type: HapticType, batteryLevel: Float) {
        // Reduce haptic intensity when battery is low
        if batteryLevel < 0.2 {
            switch type {
            case .impact, .pulse, .heartbeat, .breathing:
                // Skip non-essential haptics when battery is low
                return
            default:
                play(type)
            }
        } else {
            play(type)
        }
    }
}

// MARK: - Supporting Enums

enum BookingStep {
    case serviceSelected
    case timeSelected
    case confirmed
    case cancelled
}

enum WorkoutState {
    case starting
    case paused
    case resumed
    case completed
    case milestone
}

enum NavigationInstruction {
    case turnLeft
    case turnRight
    case arrived
    case rerouting
}

enum AccessibilityElement {
    case focused
    case activated
    case warning
    case error
}