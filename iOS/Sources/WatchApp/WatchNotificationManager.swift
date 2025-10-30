import Foundation
import UserNotifications
import WatchKit

class WatchNotificationManager: NSObject, ObservableObject {
    static let shared = WatchNotificationManager()

    @Published var notificationPermissionGranted = false
    @Published var pendingNotifications: [UNNotificationRequest] = []

    private override init() {
        super.init()
        UNUserNotificationCenter.current().delegate = self
        loadPendingNotifications()
    }

    // MARK: - Permission Management

    func requestPermissions() async -> Bool {
        do {
            let granted = try await UNUserNotificationCenter.current().requestAuthorization(options: [
                .alert,
                .badge,
                .sound,
                .criticalAlert
            ])

            await MainActor.run {
                self.notificationPermissionGranted = granted
            }

            return granted
        } catch {
            print("Failed to request notification permissions: \(error)")
            return false
        }
    }

    // MARK: - Notification Scheduling

    func scheduleAppointmentReminder(for appointment: AppointmentInfo, minutesBefore: Int = 30) {
        let content = UNMutableNotificationContent()
        content.title = "Upcoming Appointment"
        content.body = "\(appointment.serviceName) in \(minutesBefore) minutes"
        content.sound = .default
        content.categoryIdentifier = "APPOINTMENT_REMINDER"
        content.userInfo = [
            "appointmentId": appointment.id,
            "serviceName": appointment.serviceName,
            "clientName": appointment.clientName,
            "timestamp": appointment.date.timeIntervalSince1970
        ]

        // Add actions
        let quickAction = UNNotificationAction(
            identifier: "QUICK_ACTION",
            title: "Quick Actions",
            options: []
        )

        let snoozeAction = UNNotificationAction(
            identifier: "SNOOZE",
            title: "Snooze 5 min",
            options: []
        )

        let category = UNNotificationCategory(
            identifier: "APPOINTMENT_REMINDER",
            actions: [quickAction, snoozeAction],
            intentIdentifiers: [],
            options: []
        )

        UNUserNotificationCenter.current().setNotificationCategories([category])

        // Schedule notification
        let triggerDate = appointment.date.addingTimeInterval(-TimeInterval(minutesBefore * 60))
        let trigger = UNCalendarNotificationTrigger(
            dateMatching: Calendar.current.dateComponents([.year, .month, .day, .hour, .minute, .second], from: triggerDate),
            repeats: false
        )

        let request = UNNotificationRequest(
            identifier: "appointment_\(appointment.id)_\(minutesBefore)",
            content: content,
            trigger: trigger
        )

        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Failed to schedule appointment reminder: \(error)")
            }
        }
    }

    func scheduleWorkoutReminder(for workout: WorkoutInfo, minutesBefore: Int = 15) {
        let content = UNMutableNotificationContent()
        content.title = "Workout Reminder"
        content.body = "Get ready for \(workout.type) workout in \(minutesBefore) minutes"
        content.sound = .default
        content.categoryIdentifier = "WORKOUT_REMINDER"
        content.userInfo = [
            "workoutId": workout.id,
            "workoutType": workout.type,
            "duration": workout.duration
        ]

        let startAction = UNNotificationAction(
            identifier: "START_WORKOUT",
            title: "Start Now",
            options: []
        )

        let category = UNNotificationCategory(
            identifier: "WORKOUT_REMINDER",
            actions: [startAction],
            intentIdentifiers: [],
            options: []
        )

        UNUserNotificationCenter.current().setNotificationCategories([category])

        let triggerDate = workout.startTime.addingTimeInterval(-TimeInterval(minutesBefore * 60))
        let trigger = UNCalendarNotificationTrigger(
            dateMatching: Calendar.current.dateComponents([.year, .month, .day, .hour, .minute, .second], from: triggerDate),
            repeats: false
        )

        let request = UNNotificationRequest(
            identifier: "workout_\(workout.id)",
            content: content,
            trigger: trigger
        )

        UNUserNotificationCenter.current().add(request)
    }

    func scheduleHealthReminder(type: HealthReminderType, time: Date) {
        let content = UNMutableNotificationContent()

        switch type {
        case .hydration:
            content.title = "Stay Hydrated"
            content.body = "Time to drink water for optimal beauty and health"
        case .postTreatmentCare:
            content.title = "Post-Treatment Care"
            content.body = "Remember to follow your aftercare instructions"
        case .meditation:
            content.title = "Mindful Moment"
            content.body = "Take a moment for meditation and relaxation"
        case .movement:
            content.title = "Movement Break"
            content.body = "Time for a quick stretch and movement"
        }

        content.sound = .default
        content.categoryIdentifier = "HEALTH_REMINDER"

        let trigger = UNCalendarNotificationTrigger(
            dateMatching: Calendar.current.dateComponents([.hour, .minute], from: time),
            repeats: true
        )

        let request = UNNotificationRequest(
            identifier: "health_\(type.rawValue)_\(time.timeIntervalSince1970)",
            content: content,
            trigger: trigger
        )

        UNUserNotificationCenter.current().add(request)
    }

    func scheduleEmergencyAlert(for emergency: EmergencyInfo) {
        let content = UNMutableNotificationContent()
        content.title = "Emergency Alert"
        content.body = emergency.message
        content.sound = UNNotificationSound.defaultCritical
        content.categoryIdentifier = "EMERGENCY_ALERT"
        content.userInfo = [
            "emergencyId": emergency.id,
            "location": emergency.location,
            "type": emergency.type.rawValue,
            "timestamp": Date().timeIntervalSince1970
        ]

        let criticalAlert = UNNotificationAction(
            identifier: "EMERGENCY_RESPONSE",
            title: "Respond",
            options: [.critical, .foreground]
        )

        let category = UNNotificationCategory(
            identifier: "EMERGENCY_ALERT",
            actions: [criticalAlert],
            intentIdentifiers: [],
            options: [.criticalAlert]
        )

        UNUserNotificationCenter.current().setNotificationCategories([category])

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: "emergency_\(emergency.id)",
            content: content,
            trigger: trigger
        )

        UNUserNotificationCenter.current().add(request)
    }

    // MARK: - Notification Management

    func cancelAllNotifications() {
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
        loadPendingNotifications()
    }

    func cancelNotification(withIdentifier identifier: String) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [identifier])
        loadPendingNotifications()
    }

    private func loadPendingNotifications() {
        UNUserNotificationCenter.current().getPendingNotificationRequests { requests in
            DispatchQueue.main.async {
                self.pendingNotifications = requests
            }
        }
    }

    // MARK: - Rich Notifications

    func sendInteractiveNotification(for booking: BookingInteractiveInfo) {
        let content = UNMutableNotificationContent()
        content.title = "New Booking Request"
        content.body = "Request from \(booking.clientName) for \(booking.serviceName)"
        content.sound = .default
        content.categoryIdentifier = "BOOKING_REQUEST"

        let acceptAction = UNNotificationAction(
            identifier: "ACCEPT_BOOKING",
            title: "Accept",
            options: []
        )

        let declineAction = UNNotificationAction(
            identifier: "DECLINE_BOOKING",
            title: "Decline",
            options: []
        )

        let rescheduleAction = UNNotificationAction(
            identifier: "RESCHEDULE_BOOKING",
            title: "Reschedule",
            options: []
        )

        let category = UNNotificationCategory(
            identifier: "BOOKING_REQUEST",
            actions: [acceptAction, declineAction, rescheduleAction],
            intentIdentifiers: [],
            options: []
        )

        UNUserNotificationCenter.current().setNotificationCategories([category])

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: "booking_request_\(booking.id)",
            content: content,
            trigger: trigger
        )

        UNUserNotificationCenter.current().add(request)
    }
}

// MARK: - UNUserNotificationCenterDelegate

extension WatchNotificationManager: UNUserNotificationCenterDelegate {
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        // Show notifications even when app is in foreground
        completionHandler([.banner, .sound, .badge])
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo
        let actionIdentifier = response.actionIdentifier

        handleNotificationAction(actionIdentifier, userInfo: userInfo)
        completionHandler()
    }

    private func handleNotificationAction(_ action: String, userInfo: [AnyHashable: Any]) {
        switch action {
        case "ACCEPT_BOOKING":
            NotificationCenter.default.post(
                name: .bookingActionAccepted,
                object: nil,
                userInfo: userInfo
            )
        case "DECLINE_BOOKING":
            NotificationCenter.default.post(
                name: .bookingActionDeclined,
                object: nil,
                userInfo: userInfo
            )
        case "RESCHEDULE_BOOKING":
            NotificationCenter.default.post(
                name: .bookingActionReschedule,
                object: nil,
                userInfo: userInfo
            )
        case "START_WORKOUT":
            NotificationCenter.default.post(
                name: .workoutActionStart,
                object: nil,
                userInfo: userInfo
            )
        case "QUICK_ACTION":
            NotificationCenter.default.post(
                name: .quickActionRequested,
                object: nil,
                userInfo: userInfo
            )
        case "EMERGENCY_RESPONSE":
            NotificationCenter.default.post(
                name: .emergencyAlertReceived,
                object: nil,
                userInfo: userInfo
            )
        default:
            break
        }
    }
}

// MARK: - Data Models

struct AppointmentInfo {
    let id: String
    let serviceName: String
    let clientName: String
    let date: Date
}

struct WorkoutInfo {
    let id: String
    let type: String
    let duration: TimeInterval
    let startTime: Date
}

enum HealthReminderType: String, CaseIterable {
    case hydration = "hydration"
    case postTreatmentCare = "post_treatment_care"
    case meditation = "meditation"
    case movement = "movement"
}

struct EmergencyInfo {
    let id: String
    let message: String
    let location: String?
    let type: EmergencyType
}

enum EmergencyType: String {
    case medical = "medical"
    case safety = "safety"
    case location = "location"
    case system = "system"
}

struct BookingInteractiveInfo {
    let id: String
    let clientName: String
    let serviceName: String
    let requestedTime: Date
}

// MARK: - Notification Names

extension Notification.Name {
    static let bookingActionAccepted = Notification.Name("bookingActionAccepted")
    static let bookingActionDeclined = Notification.Name("bookingActionDeclined")
    static let bookingActionReschedule = Notification.Name("bookingActionReschedule")
    static let workoutActionStart = Notification.Name("workoutActionStart")
    static let quickActionRequested = Notification.Name("quickActionRequested")
    static let emergencyAlertReceived = Notification.Name("emergencyAlertReceived")
}