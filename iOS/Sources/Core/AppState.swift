import Foundation
import SwiftUI
import Combine

@MainActor
class AppState: ObservableObject {
    @Published var isFirstLaunch = true
    @Published var needsAuthentication = false
    @Published var currentFlow: AppFlow = .onboarding
    @Published var isLoading = false
    @Published var errorMessage: String?

    // User state
    @Published var currentUser: UserProfile?
    @Published var isAuthenticated = false
    @Published var userPreferences: UserPreferences?

    // App settings
    @Published var selectedLanguage: String = "en"
    @Published var selectedCurrency: String = "PLN"
    @Published var notificationsEnabled = true
    @Published var biometricAuthEnabled = false

    // Booking state
    @Published var bookingDrafts: [BookingFlowState] = []
    @Published var quickBookService: Service?

    private let userDefaults = UserDefaults.standard
    private let cancellables = Set<AnyCancellable>()

    init() {
        loadAppState()
        setupNotifications()
    }

    // MARK: - App Lifecycle

    func completeOnboarding() {
        isFirstLaunch = false
        currentFlow = .main
        userDefaults.set(false, forKey: "is_first_launch")
        userDefaults.set(currentFlow.rawValue, forKey: "current_flow")

        AnalyticsManager.shared.trackOnboardingStep("completed", completed: true)
    }

    func setAuthenticationRequired(_ required: Bool) {
        needsAuthentication = required
        currentFlow = required ? .authentication : .main
        userDefaults.set(required, forKey: "needs_authentication")
    }

    func completeAuthentication() {
        isAuthenticated = true
        needsAuthentication = false
        currentFlow = .main
        userDefaults.set(true, forKey: "is_authenticated")
        userDefaults.set(currentFlow.rawValue, forKey: "current_flow")

        AnalyticsManager.shared.trackEvent("authentication_completed")
    }

    // MARK: - User Management

    func setCurrentUser(_ user: UserProfile) {
        currentUser = user
        isAuthenticated = true

        // Save to UserDefaults (in production, use secure storage)
        if let userData = try? JSONEncoder().encode(user) {
            userDefaults.set(userData, forKey: "current_user")
        }

        AnalyticsManager.shared.setUserId(user.id)
        AnalyticsManager.shared.setUserProperties([
            "user_type": user.role ?? "client",
            "language": userPreferences?.language ?? "en",
            "currency": userPreferences?.currency ?? "PLN"
        ])
    }

    func logout() {
        currentUser = nil
        isAuthenticated = false
        userPreferences = nil

        userDefaults.removeObject(forKey: "current_user")
        userDefaults.removeObject(forKey: "user_preferences")
        userDefaults.set(false, forKey: "is_authenticated")

        // Reset analytics
        AnalyticsManager.shared.clearUserData()

        // Go to authentication if biometric is enabled
        if biometricAuthEnabled {
            setAuthenticationRequired(true)
        } else {
            currentFlow = .authentication
        }
    }

    // MARK: - Settings Management

    func updateLanguage(_ language: String) {
        selectedLanguage = language
        userDefaults.set(language, forKey: "selected_language")

        if var preferences = userPreferences {
            preferences.language = language
            userPreferences = preferences
            saveUserPreferences()
        }

        AnalyticsManager.shared.trackUserAction("language_changed", parameters: ["language": language])
    }

    func updateCurrency(_ currency: String) {
        selectedCurrency = currency
        userDefaults.set(currency, forKey: "selected_currency")

        if var preferences = userPreferences {
            preferences.currency = currency
            userPreferences = preferences
            saveUserPreferences()
        }

        AnalyticsManager.shared.trackUserAction("currency_changed", parameters: ["currency": currency])
    }

    func toggleNotifications(_ enabled: Bool) {
        notificationsEnabled = enabled
        userDefaults.set(enabled, forKey: "notifications_enabled")

        if var preferences = userPreferences {
            preferences.notifications?.pushEnabled = enabled
            userPreferences = preferences
            saveUserPreferences()
        }

        AnalyticsManager.shared.trackUserAction("notifications_toggled", parameters: ["enabled": enabled])
    }

    func toggleBiometricAuth(_ enabled: Bool) {
        biometricAuthEnabled = enabled
        userDefaults.set(enabled, forKey: "biometric_auth_enabled")

        if enabled {
            setAuthenticationRequired(true)
        }

        AnalyticsManager.shared.trackUserAction("biometric_auth_toggled", parameters: ["enabled": enabled])
    }

    // MARK: - Booking Draft Management

    func saveBookingDraft(_ draft: BookingFlowState) {
        // Remove existing draft for the same service if it exists
        bookingDrafts.removeAll { $0.serviceId == draft.serviceId }
        bookingDrafts.append(draft)

        // Save to UserDefaults
        if let draftsData = try? JSONEncoder().encode(bookingDrafts) {
            userDefaults.set(draftsData, forKey: "booking_drafts")
        }

        AnalyticsManager.shared.trackUserAction("booking_draft_saved", parameters: [
            "service_id": draft.serviceId,
            "current_step": draft.currentStep.rawValue
        ])
    }

    func loadBookingDraft(for serviceId: String) -> BookingFlowState? {
        return bookingDrafts.first { $0.serviceId == serviceId }
    }

    func removeBookingDraft(for serviceId: String) {
        bookingDrafts.removeAll { $0.serviceId == serviceId }

        if let draftsData = try? JSONEncoder().encode(bookingDrafts) {
            userDefaults.set(draftsData, forKey: "booking_drafts")
        }
    }

    func clearBookingDrafts() {
        bookingDrafts.removeAll()
        userDefaults.removeObject(forKey: "booking_drafts")
    }

    // MARK: - Quick Actions

    func setQuickBookService(_ service: Service) {
        quickBookService = service
        if let serviceData = try? JSONEncoder().encode(service) {
            userDefaults.set(serviceData, forKey: "quick_book_service")
        }
    }

    func clearQuickBookService() {
        quickBookService = nil
        userDefaults.removeObject(forKey: "quick_book_service")
    }

    // MARK: - Error Handling

    func showError(_ message: String) {
        errorMessage = message
        AnalyticsManager.shared.trackError(AppStateError.custom(message), context: ["error_type": "app_state"])
    }

    func clearError() {
        errorMessage = nil
    }

    // MARK: - Persistence

    private func loadAppState() {
        // Load basic app state
        isFirstLaunch = userDefaults.bool(forKey: "is_first_launch")
        needsAuthentication = userDefaults.bool(forKey: "needs_authentication")
        isAuthenticated = userDefaults.bool(forKey: "is_authenticated")

        // Load current flow
        if let flowRawValue = userDefaults.string(forKey: "current_flow"),
           let flow = AppFlow(rawValue: flowRawValue) {
            currentFlow = flow
        } else {
            currentFlow = isFirstLaunch ? .onboarding : (needsAuthentication ? .authentication : .main)
        }

        // Load settings
        selectedLanguage = userDefaults.string(forKey: "selected_language") ?? "en"
        selectedCurrency = userDefaults.string(forKey: "selected_currency") ?? "PLN"
        notificationsEnabled = userDefaults.bool(forKey: "notifications_enabled")
        biometricAuthEnabled = userDefaults.bool(forKey: "biometric_auth_enabled")

        // Load user data
        loadCurrentUser()
        loadUserPreferences()
        loadBookingDrafts()
        loadQuickBookService()
    }

    private func loadCurrentUser() {
        guard let userData = userDefaults.data(forKey: "current_user"),
              let user = try? JSONDecoder().decode(UserProfile.self, from: userData) else {
            return
        }

        currentUser = user

        if userDefaults.bool(forKey: "is_authenticated") {
            AnalyticsManager.shared.setUserId(user.id)
        }
    }

    private func loadUserPreferences() {
        guard let preferencesData = userDefaults.data(forKey: "user_preferences"),
              let preferences = try? JSONDecoder().decode(UserPreferences.self, from: preferencesData) else {
            return
        }

        userPreferences = preferences

        // Update settings from preferences
        if let language = preferences.language {
            selectedLanguage = language
        }
        if let currency = preferences.currency {
            selectedCurrency = currency
        }
        if let notifications = preferences.notifications {
            notificationsEnabled = notifications.pushEnabled ?? true
        }
    }

    private func saveUserPreferences() {
        guard let preferences = userPreferences,
              let preferencesData = try? JSONEncoder().encode(preferences) else {
            return
        }

        userDefaults.set(preferencesData, forKey: "user_preferences")
    }

    private func loadBookingDrafts() {
        guard let draftsData = userDefaults.data(forKey: "booking_drafts"),
              let drafts = try? JSONDecoder().decode([BookingFlowState].self, from: draftsData) else {
            return
        }

        // Filter out old drafts (older than 7 days)
        let sevenDaysAgo = Date().addingTimeInterval(-7 * 24 * 3600)
        bookingDrafts = drafts.filter { $0.id.uuidString.compare(ISO8601DateFormatter().string(from: sevenDaysAgo)) == .orderedDescending }
    }

    private func loadQuickBookService() {
        guard let serviceData = userDefaults.data(forKey: "quick_book_service"),
              let service = try? JSONDecoder().decode(Service.self, from: serviceData) else {
            return
        }

        quickBookService = service
    }

    private func setupNotifications() {
        // Listen for various app notifications
        NotificationCenter.default.publisher(for: UIApplication.didBecomeActiveNotification)
            .sink { [weak self] _ in
                self?.handleAppBecomeActive()
            }
            .store(in: &cancellables)

        NotificationCenter.default.publisher(for: UIApplication.willResignActiveNotification)
            .sink { [weak self] _ in
                self?.handleAppWillResignActive()
            }
            .store(in: &cancellables)

        NotificationCenter.default.publisher(for: .addToCalendar)
            .sink { [weak self] notification in
                self?.handleAddToCalendar(notification)
            }
            .store(in: &cancellables)

        NotificationCenter.default.publisher(for: .getDirections)
            .sink { [weak self] notification in
                self?.handleGetDirections(notification)
            }
            .store(in: &cancellables)
    }

    private func handleAppBecomeActive() {
        AnalyticsManager.shared.trackAppForeground()

        // Check if authentication is needed
        if biometricAuthEnabled && !isAuthenticated && !isFirstLaunch {
            setAuthenticationRequired(true)
        }

        // Refresh data if needed
        Task {
            await refreshAppData()
        }
    }

    private func handleAppWillResignActive() {
        AnalyticsManager.shared.trackAppBackground()

        // Save current state
        userDefaults.set(currentFlow.rawValue, forKey: "current_flow")
        userDefaults.set(isAuthenticated, forKey: "is_authenticated")
    }

    private func handleAddToCalendar(_ notification: Notification) {
        guard let userInfo = notification.userInfo else { return }
        AnalyticsManager.shared.trackUserAction("add_to_calendar", parameters: userInfo as? [String: Any] ?? [:])
    }

    private func handleGetDirections(_ notification: Notification) {
        guard let userInfo = notification.userInfo else { return }
        AnalyticsManager.shared.trackUserAction("get_directions", parameters: userInfo as? [String: Any] ?? [:])
    }

    private func refreshAppData() async {
        // Refresh user data, bookings, etc.
        guard isAuthenticated else { return }

        // This would typically involve API calls to refresh data
        print("Refreshing app data...")
    }
}

// MARK: - App Flow Enum

enum AppFlow: String, CaseIterable {
    case onboarding = "onboarding"
    case authentication = "authentication"
    case main = "main"
    case booking = "booking"
    case profile = "profile"

    var localizedName: String {
        switch self {
        case .onboarding:
            return "Onboarding"
        case .authentication:
            return "Authentication"
        case .main:
            return "Main"
        case .booking:
            return "Booking"
        case .profile:
            return "Profile"
        }
    }
}

// MARK: - App State Errors

enum AppStateError: LocalizedError {
    case persistenceError(String)
    case authenticationError(String)
    case networkError(String)
    case custom(String)

    var errorDescription: String? {
        switch self {
        case .persistenceError(let message):
            return "Data persistence error: \(message)"
        case .authenticationError(let message):
            return "Authentication error: \(message)"
        case .networkError(let message):
            return "Network error: \(message)"
        case .custom(let message):
            return message
        }
    }
}

// MARK: - SwiftUI Integration

extension AppState {
    var hasActiveBookingDraft: Bool {
        return !bookingDrafts.isEmpty
    }

    var canQuickBook: Bool {
        return quickBookService != nil
    }

    var needsDataRefresh: Bool {
        // Logic to determine if data needs to be refreshed
        return false
    }

    func getGreetingMessage() -> String {
        let hour = Calendar.current.component(.hour, from: Date())

        switch hour {
        case 0..<12:
            return "Good morning"
        case 12..<17:
            return "Good afternoon"
        default:
            return "Good evening"
        }
    }

    func getDisplayName() -> String {
        if let fullName = currentUser?.fullName, !fullName.isEmpty {
            return fullName.components(separatedBy: " ").first ?? fullName
        } else if let email = currentUser?.email {
            return email.components(separatedBy: "@").first ?? "User"
        } else {
            return "Guest"
        }
    }
}

// MARK: - Environment Key

struct AppStateKey: EnvironmentKey {
    static let defaultValue = AppState()
}

extension EnvironmentValues {
    var appState: AppState {
        get { self[AppStateKey.self] }
        set { self[AppStateKey.self] = newValue }
    }
}