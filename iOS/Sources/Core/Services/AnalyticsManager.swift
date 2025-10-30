import Foundation
import Combine

class AnalyticsManager: ObservableObject {
    static let shared = AnalyticsManager()

    private var isInitialized = false
    private let trackingQueue = DispatchQueue(label: "analytics.queue", qos: .utility)
    private var pendingEvents: [AnalyticsEvent] = []

    private init() {}

    func initialize() {
        guard !isInitialized else { return }

        isInitialized = true
        trackingQueue.async {
            self.flushPendingEvents()
        }
    }

    // MARK: - Event Tracking

    func trackEvent(_ name: String, parameters: [String: Any] = [:]) {
        let event = AnalyticsEvent(
            name: name,
            parameters: parameters,
            timestamp: Date(),
            sessionId: currentSessionId,
            userId: currentUserId
        )

        if isInitialized {
            trackingQueue.async {
                self.sendEvent(event)
            }
        } else {
            pendingEvents.append(event)
        }
    }

    func trackScreenView(_ screenName: String, parameters: [String: Any] = [:]) {
        var eventParams = parameters
        eventParams["screen_name"] = screenName
        eventParams["event_type"] = "screen_view"

        trackEvent("screen_view", parameters: eventParams)
    }

    func trackUserAction(_ action: String, parameters: [String: Any] = [:]) {
        var eventParams = parameters
        eventParams["action"] = action
        eventParams["event_type"] = "user_action"

        trackEvent("user_action", parameters: eventParams)
    }

    func trackBookingEvent(_ eventName: String, booking: Booking, parameters: [String: Any] = [:]) {
        var eventParams = parameters
        eventParams["booking_id"] = booking.id
        eventParams["service_id"] = booking.serviceId
        eventParams["total_amount"] = booking.totalAmount
        eventParams["currency"] = booking.currency
        eventParams["status"] = booking.status.rawValue
        eventParams["payment_status"] = booking.paymentStatus?.rawValue

        trackEvent(eventName, parameters: eventParams)
    }

    func trackServiceInteraction(_ serviceName: String, action: String, parameters: [String: Any] = [:]) {
        var eventParams = parameters
        eventParams["service_name"] = serviceName
        eventParams["interaction_type"] = action

        trackEvent("service_interaction", parameters: eventParams)
    }

    func trackError(_ error: Error, context: [String: Any] = [:]) {
        var eventParams = context
        eventParams["error_message"] = error.localizedDescription
        eventParams["error_type"] = String(describing: type(of: error))

        trackEvent("error_occurred", parameters: eventParams)
    }

    func trackPerformanceMetric(_ metricName: String, value: Double, unit: String, context: [String: Any] = [:]) {
        var eventParams = context
        eventParams["metric_name"] = metricName
        eventParams["metric_value"] = value
        eventParams["metric_unit"] = unit
        eventParams["event_type"] = "performance"

        trackEvent("performance_metric", parameters: eventParams)
    }

    // MARK: - User Tracking

    func setUserId(_ userId: String) {
        currentUserId = userId
        trackEvent("user_identified", parameters: ["user_id": userId])
    }

    func setUserProperties(_ properties: [String: Any]) {
        currentUserProperties = currentUserProperties.merging(properties) { _, new in new }
        trackEvent("user_properties_updated", parameters: properties)
    }

    // MARK: - E-commerce Tracking

    func trackPurchase(_ booking: Booking, paymentMethod: String, transactionId: String) {
        let eventParams: [String: Any] = [
            "transaction_id": transactionId,
            "payment_method": paymentMethod,
            "revenue": booking.totalAmount,
            "currency": booking.currency,
            "items": [
                [
                    "item_id": booking.serviceId,
                    "item_name": "Service Booking",
                    "category": booking.serviceId, // Would be service type
                    "quantity": 1,
                    "price": booking.totalAmount
                ]
            ]
        ]

        trackEvent("purchase", parameters: eventParams)
    }

    func trackAddToCart(_ service: Service, parameters: [String: Any] = [:]) {
        var eventParams = parameters
        eventParams["item_id"] = service.id
        eventParams["item_name"] = service.title
        eventParams["category"] = service.serviceType.rawValue
        eventParams["price"] = service.price
        eventParams["currency"] = service.currency

        trackEvent("add_to_cart", parameters: eventParams)
    }

    // MARK: - Health Integration Tracking

    func trackHealthKitEvent(_ eventName: String, data: [String: Any]) {
        var eventParams = data
        eventParams["source"] = "healthkit"
        eventParams["event_type"] = "health_data"

        trackEvent(eventName, parameters: eventParams)
    }

    func trackWorkoutCompleted(_ workoutType: String, duration: TimeInterval, calories: Double) {
        let eventParams: [String: Any] = [
            "workout_type": workoutType,
            "duration_seconds": duration,
            "calories_burned": calories,
            "source": "healthkit"
        ]

        trackEvent("workout_completed", parameters: eventParams)
    }

    // MARK: - Apple Pay Tracking

    func trackApplePayEvent(_ eventName: String, amount: Double, status: String, parameters: [String: Any] = [:]) {
        var eventParams = parameters
        eventParams["payment_method"] = "apple_pay"
        eventParams["amount"] = amount
        eventParams["status"] = status

        trackEvent(eventName, parameters: eventParams)
    }

    // MARK: - Push Notification Tracking

    func trackNotificationReceived(_ userInfo: [String: Any]) {
        var eventParams: [String: Any] = ["event_type": "push_notification"]

        if let notificationType = userInfo["type"] as? String {
            eventParams["notification_type"] = notificationType
        }

        trackEvent("notification_received", parameters: eventParams)
    }

    func trackNotificationOpened(_ userInfo: [String: Any]) {
        var eventParams: [String: Any] = ["event_type": "push_notification"]

        if let notificationType = userInfo["type"] as? String {
            eventParams["notification_type"] = notificationType
        }

        trackEvent("notification_opened", parameters: eventParams)
    }

    // MARK: - App Lifecycle Tracking

    func trackAppOpen() {
        trackEvent("app_opened", parameters: [
            "event_type": "app_lifecycle",
            "app_version": currentAppVersion,
            "os_version": currentOSVersion
        ])
    }

    func trackAppBackground() {
        trackEvent("app_backgrounded", parameters: [
            "event_type": "app_lifecycle"
        ])
    }

    func trackAppForeground() {
        trackEvent("app_foregrounded", parameters: [
            "event_type": "app_lifecycle"
        ])
    }

    // MARK: - Session Management

    private var currentSessionId: String {
        // Generate or retrieve session ID
        if let sessionId = UserDefaults.standard.string(forKey: "analytics_session_id") {
            return sessionId
        } else {
            let newSessionId = UUID().uuidString
            UserDefaults.standard.set(newSessionId, forKey: "analytics_session_id")
            return newSessionId
        }
    }

    private var currentUserId: String? {
        get { UserDefaults.standard.string(forKey: "analytics_user_id") }
        set { UserDefaults.standard.set(newValue, forKey: "analytics_user_id") }
    }

    private var currentUserProperties: [String: Any] {
        get {
            guard let data = UserDefaults.standard.data(forKey: "analytics_user_properties"),
                  let properties = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                return [:]
            }
            return properties
        }
        set {
            if let data = try? JSONSerialization.data(withJSONObject: newValue) {
                UserDefaults.standard.set(data, forKey: "analytics_user_properties")
            }
        }
    }

    private var currentAppVersion: String {
        return Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "unknown"
    }

    private var currentOSVersion: String {
        return ProcessInfo.processInfo.operatingSystemVersionString
    }

    // MARK: - Event Processing

    private func sendEvent(_ event: AnalyticsEvent) {
        // In a real implementation, this would send to Google Analytics, Mixpanel, etc.
        print("📊 Analytics Event: \(event.name)")
        print("   Parameters: \(event.parameters)")
        print("   Timestamp: \(event.timestamp)")
        print("   Session ID: \(event.sessionId)")

        if let userId = event.userId {
            print("   User ID: \(userId)")
        }

        // Simulate network request
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            // Event sent successfully
        }
    }

    private func flushPendingEvents() {
        for event in pendingEvents {
            sendEvent(event)
        }
        pendingEvents.removeAll()
    }

    // MARK: - Data Management

    func clearUserData() {
        currentUserId = nil
        currentUserProperties = [:]
        trackEvent("user_data_cleared")
    }

    func exportAnalyticsData() -> [String: Any] {
        return [
            "session_id": currentSessionId,
            "user_id": currentUserId as Any,
            "user_properties": currentUserProperties,
            "app_version": currentAppVersion,
            "os_version": currentOSVersion
        ]
    }
}

// MARK: - Analytics Event Model

struct AnalyticsEvent: Codable {
    let name: String
    let parameters: [String: Any]
    let timestamp: Date
    let sessionId: String
    let userId: String?

    enum CodingKeys: String, CodingKey {
        case name, parameters, timestamp, sessionId, userId
    }

    init(name: String, parameters: [String: Any], timestamp: Date, sessionId: String, userId: String?) {
        self.name = name
        self.parameters = parameters
        self.timestamp = timestamp
        self.sessionId = sessionId
        self.userId = userId
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        name = try container.decode(String.self, forKey: .name)
        timestamp = try container.decode(Date.self, forKey: .timestamp)
        sessionId = try container.decode(String.self, forKey: .sessionId)
        userId = try container.decodeIfPresent(String.self, forKey: .userId)

        // Handle parameters serialization
        if let parametersData = try? container.decodeIfPresent(Data.self, forKey: .parameters),
           let parameters = try? JSONSerialization.jsonObject(with: parametersData) as? [String: Any] {
            self.parameters = parameters
        } else {
            self.parameters = [:]
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(name, forKey: .name)
        try container.encode(timestamp, forKey: .timestamp)
        try container.encode(sessionId, forKey: .sessionId)
        try container.encodeIfPresent(userId, forKey: .userId)

        // Handle parameters serialization
        if let parametersData = try? JSONSerialization.data(withJSONObject: parameters) {
            try container.encode(parametersData, forKey: .parameters)
        }
    }
}

// MARK: - Analytics Extensions

extension AnalyticsManager {
    func trackOnboardingStep(_ step: String, completed: Bool = false) {
        trackEvent("onboarding_step", parameters: [
            "step": step,
            "completed": completed,
            "event_type": "onboarding"
        ])
    }

    func trackSearchQuery(_ query: String, resultsCount: Int, category: String? = nil) {
        var params: [String: Any] = [
            "search_query": query,
            "results_count": resultsCount,
            "event_type": "search"
        ]

        if let category = category {
            params["search_category"] = category
        }

        trackEvent("search_performed", parameters: params)
    }

    func trackFormSubmission(_ formName: String, success: Bool, errors: [String] = []) {
        trackEvent("form_submitted", parameters: [
            "form_name": formName,
            "success": success,
            "error_count": errors.count,
            "errors": errors,
            "event_type": "form"
        ])
    }

    func trackFeatureUsage(_ featureName: String, parameters: [String: Any] = [:]) {
        var eventParams = parameters
        eventParams["feature_name"] = featureName
        eventParams["event_type"] = "feature_usage"

        trackEvent("feature_used", parameters: eventParams)
    }

    func trackContentInteraction(_ contentType: String, contentId: String, action: String) {
        trackEvent("content_interaction", parameters: [
            "content_type": contentType,
            "content_id": contentId,
            "interaction_action": action,
            "event_type": "content"
        ])
    }
}

// MARK: - SwiftUI Integration

extension View {
    func analyticsScreenView(_ screenName: String) -> some View {
        self.onAppear {
            AnalyticsManager.shared.trackScreenView(screenName)
        }
    }

    func analyticsTrackTap(_ actionName: String, parameters: [String: Any] = [:]) -> some View {
        self.onTapGesture {
            AnalyticsManager.shared.trackUserAction(actionName, parameters: parameters)
        }
    }
}