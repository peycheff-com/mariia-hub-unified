import Foundation
import UserNotifications
import UIKit

class NotificationManager: ObservableObject {
    static let shared = NotificationManager()

    @Published var authorizationStatus: UNAuthorizationStatus = .notDetermined

    private init() {
        checkAuthorizationStatus()
    }

    func requestAuthorization() async -> Bool {
        let options: UNAuthorizationOptions = [.alert, .sound, .badge, .criticalAlert]

        do {
            let granted = try await UNUserNotificationCenter.current().requestAuthorization(options: options)
            await MainActor.run {
                self.authorizationStatus = granted ? .authorized : .denied
            }

            if granted {
                registerForRemoteNotifications()
            }

            return granted
        } catch {
            print("Error requesting notification authorization: \(error)")
            return false
        }
    }

    private func checkAuthorizationStatus() {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            DispatchQueue.main.async {
                self.authorizationStatus = settings.authorizationStatus
            }
        }
    }

    private func registerForRemoteNotifications() {
        DispatchQueue.main.async {
            UIApplication.shared.registerForRemoteNotifications()
        }
    }

    // MARK: - Local Notifications

    func scheduleBookingReminder(booking: Booking) {
        guard let bookingDate = parseBookingDate(booking.bookingDate, time: booking.startTime) else {
            return
        }

        let reminderTimes = [
            bookingDate.addingTimeInterval(-3600), // 1 hour before
            bookingDate.addingTimeInterval(-86400), // 1 day before
        ]

        for (index, reminderDate) in reminderTimes.enumerated() {
            if reminderDate > Date() {
                scheduleReminder(booking: booking, date: reminderDate, identifier: "\(booking.id)-\(index)")
            }
        }
    }

    func scheduleReminder(booking: Booking, date: Date, identifier: String) {
        let content = UNMutableNotificationContent()
        content.title = "Upcoming Appointment"
        content.body = "Your \(booking.serviceType.localizedName) appointment is scheduled for \(formatTime(date))"
        content.sound = .default
        content.badge = 1
        content.categoryIdentifier = "BOOKING_REMINDER"

        // Add rich content
        if let imageURL = URL(string: "https://example.com/booking-icon.png") {
            do {
                let attachment = try UNNotificationAttachment(identifier: "booking-image", url: imageURL, options: nil)
                content.attachments = [attachment]
            } catch {
                print("Error creating notification attachment: \(error)")
            }
        }

        let calendar = Calendar.current
        let components = calendar.dateComponents([.year, .month, .day, .hour, .minute], from: date)

        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
        let request = UNNotificationRequest(identifier: identifier, content: content, trigger: trigger)

        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Error scheduling notification: \(error)")
            }
        }
    }

    func cancelBookingReminders(bookingId: String) {
        let identifiers = [
            "\(bookingId)-0", // 1 hour before
            "\(bookingId)-1"  // 1 day before
        ]

        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: identifiers)
    }

    func showBookingConfirmation(booking: Booking) {
        let content = UNMutableNotificationContent()
        content.title = "Booking Confirmed!"
        content.body = "Your appointment has been successfully booked for \(booking.bookingDate) at \(booking.startTime)"
        content.sound = .default
        content.categoryIdentifier = "BOOKING_CONFIRMATION"

        // Add interactive buttons
        let addToCalendarAction = UNNotificationAction(
            identifier: "ADD_TO_CALENDAR",
            title: "Add to Calendar",
            options: .foreground
        )

        let getDirectionsAction = UNNotificationAction(
            identifier: "GET_DIRECTIONS",
            title: "Get Directions",
            options: .foreground
        )

        let category = UNNotificationCategory(
            identifier: "BOOKING_CONFIRMATION",
            actions: [addToCalendarAction, getDirectionsAction],
            intentIdentifiers: [],
            options: .customDismissAction
        )

        UNUserNotificationCenter.current().setNotificationCategories([category])

        let request = UNNotificationRequest(
            identifier: "booking-confirmation-\(booking.id)",
            content: content,
            trigger: nil // Immediate notification
        )

        UNUserNotificationCenter.current().add(request)
    }

    func showAppointmentReminder(booking: Booking, timeUntil: TimeInterval) {
        let content = UNMutableNotificationContent()
        content.title = "Appointment Soon"
        content.body = "Your appointment starts in \(formatTimeInterval(timeUntil))"
        content.sound = UNNotificationSound.critical
        content.categoryIdentifier = "APPOINTMENT_URGENT"
        content.interruptionLevel = .critical

        let request = UNNotificationRequest(
            identifier: "urgent-reminder-\(booking.id)",
            content: content,
            trigger: nil
        )

        UNUserNotificationCenter.current().add(request)
    }

    // MARK: - Push Notification Handling

    func handleRemoteNotification(_ userInfo: [AnyHashable: Any]) {
        guard let aps = userInfo["aps"] as? [String: Any] else { return }

        // Handle different notification types
        if let notificationType = userInfo["type"] as? String {
            switch notificationType {
            case "booking_update":
                handleBookingUpdate(userInfo)
            case "promotion":
                handlePromotion(userInfo)
            case "new_service":
                handleNewService(userInfo)
            default:
                break
            }
        }

        // Update badge
        if let badge = aps["badge"] as? Int {
            DispatchQueue.main.async {
                UIApplication.shared.applicationIconBadgeNumber = badge
            }
        }
    }

    private func handleBookingUpdate(_ userInfo: [AnyHashable: Any]) {
        // Handle booking status updates
        if let bookingId = userInfo["booking_id"] as? String,
           let status = userInfo["status"] as? String {
            print("Booking \(bookingId) updated to status: \(status)")
            // Update local data, refresh UI, etc.
        }
    }

    private func handlePromotion(_ userInfo: [AnyHashable: Any]) {
        // Handle promotional notifications
        if let promoCode = userInfo["promo_code"] as? String,
           let discount = userInfo["discount"] as? String {
            print("Promotion: \(promoCode) - \(discount) discount")
        }
    }

    private func handleNewService(_ userInfo: [AnyHashable: Any]) {
        // Handle new service announcements
        if let serviceName = userInfo["service_name"] as? String {
            print("New service available: \(serviceName)")
        }
    }

    // MARK: - Helper Methods

    private func parseBookingDate(_ dateString: String, time: String) -> Date? {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm"
        let dateTimeString = "\(dateString) \(time)"
        return formatter.date(from: dateTimeString)
    }

    private func formatTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        formatter.dateStyle = .none
        return formatter.string(from: date)
    }

    private func formatTimeInterval(_ interval: TimeInterval) -> String {
        let hours = Int(interval / 3600)
        let minutes = Int((interval.truncatingRemainder(dividingBy: 3600)) / 60)

        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }

    // MARK: - Notification Categories Setup

    func setupNotificationCategories() {
        // Booking reminder category
        let reminderCategory = UNNotificationCategory(
            identifier: "BOOKING_REMINDER",
            actions: [],
            intentIdentifiers: [],
            options: []
        )

        // Booking confirmation category with actions
        let confirmAction = UNNotificationAction(
            identifier: "VIEW_DETAILS",
            title: "View Details",
            options: .foreground
        )

        let cancelAction = UNNotificationAction(
            identifier: "CANCEL_BOOKING",
            title: "Cancel Booking",
            options: .destructive
        )

        let confirmationCategory = UNNotificationCategory(
            identifier: "BOOKING_CONFIRMATION",
            actions: [confirmAction, cancelAction],
            intentIdentifiers: [],
            options: .customDismissAction
        )

        // Urgent appointment category
        let urgentCategory = UNNotificationCategory(
            identifier: "APPOINTMENT_URGENT",
            actions: [],
            intentIdentifiers: [],
            options: [.criticalAlert]
        )

        UNUserNotificationCenter.current().setNotificationCategories([
            reminderCategory,
            confirmationCategory,
            urgentCategory
        ])
    }

    // MARK: - Badge Management

    func updateBadgeCount(_ count: Int) {
        DispatchQueue.main.async {
            UIApplication.shared.applicationIconBadgeNumber = count
        }
    }

    func clearBadge() {
        updateBadgeCount(0)
    }
}

// MARK: - Notification Delegate

class NotificationDelegate: NSObject, UNUserNotificationCenterDelegate {
    static let shared = NotificationDelegate()

    private override init() {
        super.init()
    }

    // Handle notification when app is in foreground
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        // Show notification even when app is in foreground
        completionHandler([.banner, .sound, .badge])
    }

    // Handle notification interaction
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo

        switch response.actionIdentifier {
        case "ADD_TO_CALENDAR":
            handleAddToCalendar(userInfo)
        case "GET_DIRECTIONS":
            handleGetDirections(userInfo)
        case "VIEW_DETAILS":
            handleViewDetails(userInfo)
        case "CANCEL_BOOKING":
            handleCancelBooking(userInfo)
        default:
            // Handle notification tap
            handleNotificationTap(userInfo)
        }

        completionHandler()
    }

    private func handleAddToCalendar(_ userInfo: [AnyHashable: Any]) {
        // Navigate to calendar integration
        NotificationCenter.default.post(name: .addToCalendar, object: userInfo)
    }

    private func handleGetDirections(_ userInfo: [AnyHashable: Any]) {
        // Open maps app with directions
        NotificationCenter.default.post(name: .getDirections, object: userInfo)
    }

    private func handleViewDetails(_ userInfo: [AnyHashable: Any]) {
        // Navigate to booking details
        NotificationCenter.default.post(name: .viewBookingDetails, object: userInfo)
    }

    private func handleCancelBooking(_ userInfo: [AnyHashable: Any]) {
        // Navigate to cancel booking flow
        NotificationCenter.default.post(name: .cancelBooking, object: userInfo)
    }

    private func handleNotificationTap(_ userInfo: [AnyHashable: Any]) {
        // General notification tap handling
        NotificationCenter.default.post(name: .notificationTapped, object: userInfo)
    }
}

// MARK: - Notification Names

extension Notification.Name {
    static let addToCalendar = Notification.Name("addToCalendar")
    static let getDirections = Notification.Name("getDirections")
    static let viewBookingDetails = Notification.Name("viewBookingDetails")
    static let cancelBooking = Notification.Name("cancelBooking")
    static let notificationTapped = Notification.Name("notificationTapped")
}