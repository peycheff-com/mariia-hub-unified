import SwiftUI
import WatchKit
import ClockKit
import WatchConnectivity
import HealthKit
import UserNotifications
import AVFoundation

@main
struct MariiaHub_WatchApp: App {
    @StateObject private var watchConnectivityManager = WatchConnectivityManager.shared
    @StateObject private var healthKitManager = HealthKitManager.shared
    @StateObject private var notificationManager = WatchNotificationManager.shared
    @StateObject private var hapticManager = HapticManager.shared
    @WKApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    @SceneBuilder var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(watchConnectivityManager)
                .environmentObject(healthKitManager)
                .environmentObject(notificationManager)
                .environmentObject(hapticManager)
                .onAppear {
                    initializeWatchApp()
                }
        }
    }

    private func initializeWatchApp() {
        Task {
            await watchConnectivityManager.activateSession()
            await healthKitManager.requestPermissions()
            await notificationManager.requestPermissions()
        }
    }
}

class AppDelegate: NSObject, WKApplicationDelegate {
    func applicationDidFinishLaunching() {
        // Initialize background tasks and complications
        scheduleComplicationUpdates()
        initializeHealthBackgroundDelivery()
    }

    func handle(_ backgroundTasks: Set<WKRefreshBackgroundTask>) {
        for task in backgroundTasks {
            switch task {
            case let backgroundTask as WKApplicationRefreshBackgroundTask:
                handleAppRefresh(task)
            case let complicationTask as WKURLSessionRefreshBackgroundTask:
                handleComplicationRefresh(complicationTask)
            case let snapshotTask as WKSnapshotRefreshBackgroundTask:
                handleSnapshotRefresh(snapshotTask)
            default:
                task.setTaskCompleted()
            }
        }
    }

    private func handleAppRefresh(_ task: WKApplicationRefreshBackgroundTask) {
        Task {
            await WatchConnectivityManager.shared.syncData()
            scheduleNextAppRefresh()
            task.setTaskCompleted()
        }
    }

    private func handleComplicationRefresh(_ task: WKURLSessionRefreshBackgroundTask) {
        Task {
            await ComplicationController.shared.updateComplications()
            task.setTaskCompleted()
        }
    }

    private func handleSnapshotRefresh(_ task: WKSnapshotRefreshBackgroundTask) {
        // Update UI for snapshot
        task.setTaskCompleted(restoredDefaultState: false)
    }

    private func scheduleComplicationUpdates() {
        ComplicationController.shared.scheduleUpdates()
    }

    private func initializeHealthBackgroundDelivery() {
        Task {
            await HealthKitManager.shared.enableBackgroundDelivery()
        }
    }

    private func scheduleNextAppRefresh() {
        let nextDate = Date().addingTimeInterval(15 * 60) // 15 minutes
        WKApplication.shared().scheduleBackgroundRefresh(withPreferredDate: nextDate) { error in
            if let error = error {
                print("Failed to schedule background refresh: \(error)")
            }
        }
    }
}

struct ContentView: View {
    @StateObject private var watchViewModel = WatchViewModel()
    @State private var selectedTab: WatchTab = .appointments

    var body: some View {
        TabView(selection: $selectedTab) {
            // Appointments Tab
            AppointmentsView()
                .tag(WatchTab.appointments)
                .tabItem {
                    Image(systemName: "calendar")
                    Text("Today")
                }

            // Quick Actions Tab
            QuickActionsView()
                .tag(WatchTab.quickActions)
                .tabItem {
                    Image(systemName: "bolt.circle")
                    Text("Quick")
                }

            // Stats Tab
            StatsView()
                .tag(WatchTab.stats)
                .tabItem {
                    Image(systemName: "chart.bar")
                    Text("Stats")
                }

            // Profile Tab
            ProfileView()
                .tag(WatchTab.profile)
                .tabItem {
                    Image(systemName: "person.circle")
                    Text("Profile")
                }
        }
        .environmentObject(watchViewModel)
        .onAppear {
            watchViewModel.loadData()
        }
    }
}

enum WatchTab: Int, CaseIterable {
    case appointments = 0
    case quickActions = 1
    case stats = 2
    case profile = 3
}

// MARK: - Appointments View

struct AppointmentsView: View {
    @StateObject private var watchViewModel = WatchViewModel()
    @State private var showingAppointmentDetail = false
    @State private var selectedAppointment: Booking?

    var body: some View {
        NavigationView {
            ScrollView {
                LazyVStack(spacing: 12) {
                    if watchViewModel.todayAppointments.isEmpty {
                        EmptyStateView(
                            icon: "calendar.badge.plus",
                            title: "No appointments today",
                            subtitle: "Enjoy your free time!"
                        )
                    } else {
                        ForEach(watchViewModel.todayAppointments, id: \.id) { appointment in
                            AppointmentCard(appointment: appointment) {
                                selectedAppointment = appointment
                                showingAppointmentDetail = true
                            }
                        }
                    }

                    if !watchViewModel.upcomingAppointments.isEmpty {
                        Text("Upcoming")
                            .font(.headline)
                            .foregroundColor(.secondary)
                            .padding(.top)

                        ForEach(watchViewModel.upcomingAppointments.prefix(3), id: \.id) { appointment in
                            AppointmentCard(appointment: appointment, isUpcoming: true) {
                                selectedAppointment = appointment
                                showingAppointmentDetail = true
                            }
                        }
                    }
                }
                .padding(.horizontal, 8)
            }
            .navigationTitle("Appointments")
            .navigationBarTitleDisplayMode(.inline)
        }
        .sheet(isPresented: $showingAppointmentDetail) {
            if let appointment = selectedAppointment {
                AppointmentDetailView(appointment: appointment)
            }
        }
    }
}

struct AppointmentCard: View {
    let appointment: Booking
    let isUpcoming: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(appointment.clientName)
                            .font(.headline)
                            .foregroundColor(.primary)
                            .lineLimit(1)

                        Text(formatTime(appointment.startTime))
                            .font(.caption)
                            .foregroundColor(.secondary)

                        Text(formatDate(appointment.bookingDate))
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }

                    Spacer()

                    // Status indicator
                    Circle()
                        .fill(statusColor)
                        .frame(width: 8, height: 8)
                }

                if !isUpcoming {
                    HStack {
                        Label("30 min", systemImage: "clock")
                            .font(.caption2)
                            .foregroundColor(.secondary)

                        Spacer()

                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 10)
                    .fill(cardBackgroundColor)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }

    private var cardBackgroundColor: Color {
        if isUpcoming {
            return Color.secondary.opacity(0.1)
        } else {
            switch appointment.status {
            case .confirmed:
                return Color.green.opacity(0.1)
            case .pending:
                return Color.orange.opacity(0.1)
            default:
                return Color.secondary.opacity(0.1)
            }
        }
    }

    private var statusColor: Color {
        switch appointment.status {
        case .confirmed:
            return .green
        case .pending:
            return .orange
        case .cancelled:
            return .red
        case .completed:
            return .blue
        default:
            return .gray
        }
    }

    private func formatTime(_ time: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        if let date = formatter.date(from: time) {
            formatter.timeStyle = .short
            return formatter.string(from: date)
        }
        return time
    }

    private func formatDate(_ dateString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        if let date = formatter.date(from: dateString) {
            formatter.dateStyle = .short
            return formatter.string(from: date)
        }
        return dateString
    }
}

struct AppointmentDetailView: View {
    let appointment: Booking
    @Environment(\.dismiss) private var dismiss
    @State private var showingNavigation = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 16) {
                    // Client info
                    VStack(spacing: 8) {
                        Image(systemName: "person.circle.fill")
                            .font(.system(size: 40))
                            .foregroundColor(.accentColor)

                        Text(appointment.clientName)
                            .font(.title3)
                            .fontWeight(.semibold)

                        Text(appointment.clientEmail)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    // Appointment details
                    VStack(spacing: 12) {
                        DetailRow(
                            icon: "calendar",
                            title: "Date",
                            value: formatDate(appointment.bookingDate)
                        )

                        DetailRow(
                            icon: "clock",
                            title: "Time",
                            value: formatTime(appointment.startTime)
                        )

                        DetailRow(
                            icon: "clock.arrow.circlepath",
                            title: "Duration",
                            value: "60 minutes"
                        )

                        DetailRow(
                            icon: "phone",
                            title: "Phone",
                            value: appointment.clientPhone ?? "Not provided"
                        )

                        DetailRow(
                            icon: "info.circle",
                            title: "Status",
                            value: appointment.status.localizedName
                        )
                    }

                    // Actions
                    VStack(spacing: 8) {
                        Button("Get Directions") {
                            showingNavigation = true
                        }
                        .buttonStyle(.borderedProminent)

                        Button("Send Message") {
                            // Open messages app
                        }
                        .buttonStyle(.bordered)

                        Button("Reschedule") {
                            // Open reschedule flow
                        }
                        .buttonStyle(.bordered)
                    }
                }
                .padding()
            }
            .navigationTitle("Appointment")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
        .sheet(isPresented: $showingNavigation) {
            NavigationView {
                // Navigation interface
                Text("Navigation to appointment location")
                    .navigationTitle("Directions")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .navigationBarTrailing) {
                            Button("Close") {
                                showingNavigation = false
                            }
                        }
                    }
            }
        }
    }

    private func formatDate(_ dateString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        if let date = formatter.date(from: dateString) {
            formatter.dateStyle = .medium
            return formatter.string(from: date)
        }
        return dateString
    }

    private func formatTime(_ time: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        if let date = formatter.date(from: time) {
            formatter.timeStyle = .short
            return formatter.string(from: date)
        }
        return time
    }
}

struct DetailRow: View {
    let icon: String
    let title: String
    let value: String

    var body: some View {
        HStack {
            Image(systemName: icon)
                .frame(width: 20)
                .foregroundColor(.accentColor)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)

            Spacer()

            Text(value)
                .font(.caption)
                .foregroundColor(.primary)
        }
    }
}

// MARK: - Quick Actions View

struct QuickActionsView: View {
    @StateObject private var watchViewModel = WatchViewModel()
    @State private var showingBookingFlow = false

    var body: some View {
        NavigationView {
            ScrollView {
                LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
                    QuickActionCard(
                        icon: "calendar.badge.plus",
                        title: "Book",
                        subtitle: "New appointment",
                        color: .blue
                    ) {
                        showingBookingFlow = true
                    }

                    QuickActionCard(
                        icon: "phone.fill",
                        title: "Call",
                        subtitle: "Contact salon",
                        color: .green
                    ) {
                        // Initiate phone call
                    }

                    QuickActionCard(
                        icon: "message.fill",
                        title: "Message",
                        subtitle: "Send text",
                        color: .orange
                    ) {
                        // Open messages
                    }

                    QuickActionCard(
                        icon: "location.fill",
                        title: "Location",
                        subtitle: "Get directions",
                        color: .red
                    ) {
                        // Open maps
                    }

                    QuickActionCard(
                        icon: "star.fill",
                        title: "Review",
                        subtitle: "Rate service",
                        color: .yellow
                    ) {
                        // Open review flow
                    }

                    QuickActionCard(
                        icon: "heart.fill",
                        title: "Favorites",
                        subtitle: "Saved services",
                        color: .pink
                    ) {
                        // Show favorites
                    }
                }
                .padding(.horizontal, 8)
            }
            .navigationTitle("Quick Actions")
            .navigationBarTitleDisplayMode(.inline)
        }
        .sheet(isPresented: $showingBookingFlow) {
            WatchBookingFlow()
        }
    }
}

struct QuickActionCard: View {
    let icon: String
    let title: String
    let subtitle: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 24))
                    .foregroundColor(color)

                Text(title)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)

                Text(subtitle)
                    .font(.caption2)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 80)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(color.opacity(0.1))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(color.opacity(0.3), lineWidth: 1)
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Stats View

struct StatsView: View {
    @StateObject private var watchViewModel = WatchViewModel()

    var body: some View {
        NavigationView {
            ScrollView {
                LazyVStack(spacing: 16) {
                    // Today's Stats
                    VStack(spacing: 8) {
                        Text("Today")
                            .font(.headline)
                            .foregroundColor(.primary)

                        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 8) {
                            StatCard(
                                title: "Appointments",
                                value: "\(watchViewModel.todayAppointments.count)",
                                icon: "calendar",
                                color: .blue
                            )

                            StatCard(
                                title: "Completed",
                                value: "\(watchViewModel.completedToday)",
                                icon: "checkmark.circle",
                                color: .green
                            )

                            StatCard(
                                title: "Earnings",
                                value: formatCurrency(watchViewModel.todayEarnings),
                                icon: "zlotysign.circle",
                                color: .orange
                            )

                            StatCard(
                                title: "Reviews",
                                value: "\(watchViewModel.todayReviews)",
                                icon: "star.circle",
                                color: .yellow
                            )
                        }
                    }

                    // Week Stats
                    VStack(spacing: 8) {
                        Text("This Week")
                            .font(.headline)
                            .foregroundColor(.primary)

                        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 8) {
                            StatCard(
                                title: "Total",
                                value: "\(watchViewModel.weekTotal)",
                                icon: "calendar.badge.checkmark",
                                color: .purple
                            )

                            StatCard(
                                title: "Revenue",
                                value: formatCurrency(watchViewModel.weekRevenue),
                                icon: "banknote",
                                color: .green
                            )
                        }
                    }

                    // Health Integration
                    if watchViewModel.isHealthKitConnected {
                        VStack(spacing: 8) {
                            Text("Health Stats")
                                .font(.headline)
                                .foregroundColor(.primary)

                            StatCard(
                                title: "Steps",
                                value: "\(watchViewModel.todaySteps)",
                                icon: "figure.walk",
                                color: .red
                            )

                            StatCard(
                                title: "Active Cal",
                                value: "\(watchViewModel.activeCalories)",
                                icon: "flame",
                                color: .orange
                            )
                        }
                    }
                }
                .padding(.horizontal, 8)
            }
            .navigationTitle("Statistics")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "PLN"
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: amount)) ?? "0 PLN"
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundColor(color)

            Text(value)
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(.primary)

            Text(title)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .frame(height: 60)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(color.opacity(0.1))
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(color.opacity(0.3), lineWidth: 1)
                )
        )
    }
}

// MARK: - Profile View

struct ProfileView: View {
    @StateObject private var watchViewModel = WatchViewModel()
    @State private var showingSettings = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 16) {
                    // Profile Header
                    VStack(spacing: 8) {
                        Image(systemName: "person.circle.fill")
                            .font(.system(size: 48))
                            .foregroundColor(.accentColor)

                        Text("Professional")
                            .font(.title3)
                            .fontWeight(.semibold)

                        Text("Premium Member")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    // Quick Stats
                    VStack(spacing: 8) {
                        Text("Overview")
                            .font(.headline)
                            .foregroundColor(.primary)

                        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 8) {
                            StatCard(
                                title: "Total Bookings",
                                value: "\(watchViewModel.totalBookings)",
                                icon: "calendar.badge.checkmark",
                                color: .blue
                            )

                            StatCard(
                                title: "Member Since",
                                value: "2023",
                                icon: "calendar",
                                color: .green
                            )
                        }
                    }

                    // Settings
                    VStack(spacing: 8) {
                        Text("Settings")
                            .font(.headline)
                            .foregroundColor(.primary)

                        VStack(spacing: 4) {
                            SettingsRow(
                                icon: "bell.fill",
                                title: "Notifications",
                                value: "On",
                                action: { }
                            )

                            SettingsRow(
                                icon: "heart.fill",
                                title: "Health Sync",
                                value: watchViewModel.isHealthKitConnected ? "Connected" : "Off",
                                action: { }
                            )

                            SettingsRow(
                                icon: "gear",
                                title: "App Settings",
                                value: "",
                                action: { showingSettings = true }
                            )
                        }
                    }
                }
                .padding(.horizontal, 8)
            }
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.inline)
        }
        .sheet(isPresented: $showingSettings) {
            WatchSettingsView()
        }
    }
}

struct SettingsRow: View {
    let icon: String
    let title: String
    let value: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon)
                    .frame(width: 20)
                    .foregroundColor(.accentColor)

                Text(title)
                    .font(.caption)
                    .foregroundColor(.primary)

                Spacer()

                if !value.isEmpty {
                    Text(value)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.vertical, 8)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Watch Booking Flow

struct WatchBookingFlow: View {
    @Environment(\.dismiss) private var dismiss
    @State private var selectedService: String?
    @State private var selectedDate: Date = Date()
    @State private var selectedTime: String?

    let services = [
        "Lip Enhancement",
        "Brow Design",
        "Glute Training",
        "Personal Training"
    ]

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 16) {
                    // Service Selection
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Service")
                            .font(.headline)
                            .foregroundColor(.primary)

                        ForEach(services, id: \.self) { service in
                            Button(service) {
                                selectedService = service
                            }
                            .font(.caption)
                            .foregroundColor(selectedService == service ? .white : .primary)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(
                                RoundedRectangle(cornerRadius: 8)
                                    .fill(selectedService == service ? Color.accentColor : Color.secondary.opacity(0.2))
                            )
                        }
                    }

                    // Date Selection
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Date")
                            .font(.headline)
                            .foregroundColor(.primary)

                        DatePicker("Select Date", selection: $selectedDate, in: Date()...)
                            .datePickerStyle(.compact)
                    }

                    // Time Selection
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Time")
                            .font(.headline)
                            .foregroundColor(.primary)

                        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 3), spacing: 4) {
                            ForEach(["9:00", "10:00", "11:00", "14:00", "15:00", "16:00"], id: \.self) { time in
                                Button(time) {
                                    selectedTime = time
                                }
                                .font(.caption2)
                                .foregroundColor(selectedTime == time ? .white : .primary)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(
                                    RoundedRectangle(cornerRadius: 6)
                                        .fill(selectedTime == time ? Color.accentColor : Color.secondary.opacity(0.2))
                                )
                            }
                        }
                    }

                    // Book Button
                    Button("Book Appointment") {
                        // Process booking
                        dismiss()
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(selectedService == nil || selectedTime == nil)
                }
                .padding()
            }
            .navigationTitle("Quick Book")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Watch Settings View

struct WatchSettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var notificationsEnabled = true
    @State private var healthSyncEnabled = true

    var body: some View {
        NavigationView {
            Form {
                Section("Notifications") {
                    Toggle("Push Notifications", isOn: $notificationsEnabled)
                    Toggle("Appointment Reminders", isOn: .constant(true))
                }

                Section("Health Integration") {
                    Toggle("HealthKit Sync", isOn: $healthSyncEnabled)
                }

                Section("About") {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Empty State

struct EmptyStateView: View {
    let icon: String
    let title: String
    let subtitle: String

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 32))
                .foregroundColor(.secondary)

            Text(title)
                .font(.headline)
                .foregroundColor(.primary)

            Text(subtitle)
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
    }
}

// MARK: - Watch ViewModel

@MainActor
class WatchViewModel: ObservableObject {
    @Published var todayAppointments: [Booking] = []
    @Published var upcomingAppointments: [Booking] = []
    @Published var completedToday = 0
    @Published var todayEarnings = 0.0
    @Published var todayReviews = 0
    @Published var weekTotal = 0
    @Published var weekRevenue = 0.0
    @Published var totalBookings = 0
    @Published var isHealthKitConnected = false
    @Published var todaySteps = 0
    @Published var activeCalories = 0

    func loadData() {
        Task {
            await loadAppointments()
            await loadStats()
            await loadHealthData()
        }
    }

    private func loadAppointments() async {
        // Simulate loading appointments
        let mockAppointments: [Booking] = [
            Booking(
                id: "1",
                serviceId: "service-1",
                clientId: "client-1",
                clientName: "Anna Kowalska",
                clientEmail: "anna@example.com",
                clientPhone: "+48 123 456 789",
                bookingDate: "2024-01-30",
                startTime: "09:00",
                endTime: "10:00",
                totalAmount: 300.0,
                currency: "PLN",
                status: .confirmed,
                paymentStatus: .paid,
                depositAmount: nil,
                notes: nil,
                preferences: nil,
                locationType: .studio,
                bookingData: nil,
                metadata: nil,
                externalBookingId: nil,
                externalSource: nil,
                stripePaymentIntentId: nil,
                createdAt: Date(),
                updatedAt: Date()
            )
        ]

        await MainActor.run {
            self.todayAppointments = mockAppointments
            self.upcomingAppointments = mockAppointments
            self.completedToday = 1
        }
    }

    private func loadStats() async {
        await MainActor.run {
            self.todayEarnings = 1200.0
            self.todayReviews = 2
            self.weekTotal = 15
            self.weekRevenue = 4500.0
            self.totalBookings = 156
        }
    }

    private func loadHealthData() async {
        await MainActor.run {
            self.isHealthKitConnected = true
            self.todaySteps = 8432
            self.activeCalories = 420
        }
    }
}

// MARK: - Enhanced Complication Provider

class ComplicationController: NSObject, CLKComplicationDataSource {
    static let shared = ComplicationController()
    private let dataProvider = ComplicationDataProvider.shared

    func getCurrentTimelineEntry(for complication: CLKComplication, withHandler handler: @escaping (CLKComplicationTimelineEntry?) -> Void) {
        Task {
            let timelineEntry = await createTimelineEntry(for: complication)
            handler(timelineEntry)
        }
    }

    func getLocalizableSampleTemplate(for complication: CLKComplication, withHandler handler: @escaping (CLKComplicationTemplate?) -> Void) {
        let template = createSampleTemplate(for: complication)
        handler(template)
    }

    func getTimelineEntries(for complication: CLKComplication, after date: Date, limit: Int, withHandler handler: @escaping ([CLKComplicationTimelineEntry]?) -> Void) {
        Task {
            let entries = await createTimelineEntries(for: complication, after: date, limit: limit)
            handler(entries)
        }
    }

    func getPrivacyBehavior(for complication: CLKComplication, withHandler handler: @escaping (CLKComplicationPrivacyBehavior) -> Void) {
        handler(.showOnLockScreen)
    }

    private func createTimelineEntry(for complication: CLKComplication) async -> CLKComplicationTimelineEntry {
        let data = await dataProvider.getLatestComplicationData()

        switch complication.family {
        case .circularSmall:
            return createCircularSmallEntry(data: data)
        case .modularSmall:
            return createModularSmallEntry(data: data)
        case .modularLarge:
            return createModularLargeEntry(data: data)
        case .utilitarianSmall:
            return createUtilitarianSmallEntry(data: data)
        case .utilitarianLarge:
            return createUtilitarianLargeEntry(data: data)
        case .graphicCorner:
            return createGraphicCornerEntry(data: data)
        case .graphicBezel:
            return createGraphicBezelEntry(data: data)
        case .graphicCircular:
            return createGraphicCircularEntry(data: data)
        case .graphicRectangular:
            return createGraphicRectangularEntry(data: data)
        case .extraLarge:
            return createExtraLargeEntry(data: data)
        @unknown default:
            return createDefaultEntry(for: complication)
        }
    }

    private func createTimelineEntries(for complication: CLKComplication, after date: Date, limit: Int) async -> [CLKComplicationTimelineEntry] {
        var entries: [CLKComplicationTimelineEntry] = []
        let appointments = await dataProvider.getUpcomingAppointments(after: date, limit: limit)

        for appointment in appointments.prefix(limit) {
            let entry = createAppointmentTimelineEntry(for: complication, appointment: appointment)
            entries.append(entry)
        }

        return entries
    }

    // MARK: - Individual Complication Templates

    private func createCircularSmallEntry(data: ComplicationData) -> CLKComplicationTimelineEntry {
        let template = CLKComplicationTemplateCircularSmallSimpleText()
        template.textProvider = CLKSimpleTextProvider(text: "\(data.todayAppointmentsCount)")
        template.tintColor = UIColor(hex: "D4AF37")
        return CLKComplicationTimelineEntry(date: Date(), complicationTemplate: template)
    }

    private func createModularSmallEntry(data: ComplicationData) -> CLKComplicationTimelineEntry {
        let template = CLKComplicationTemplateModularSmallStackImage()
        template.line1ImageProvider = CLKImageProvider(onePieceImage: UIImage(systemName: "calendar")!)
        template.line1TextProvider = CLKSimpleTextProvider(text: "\(data.todayAppointmentsCount)")
        template.line2TextProvider = CLKSimpleTextProvider(text: "Today")
        return CLKComplicationTimelineEntry(date: Date(), complicationTemplate: template)
    }

    private func createModularLargeEntry(data: ComplicationData) -> CLKComplicationTimelineEntry {
        let template = CLKComplicationTemplateModularLargeTable()
        template.headerTextProvider = CLKSimpleTextProvider(text: "Today's Schedule")
        template.row1Column1TextProvider = CLKSimpleTextProvider(text: "Appointments")
        template.row1Column2TextProvider = CLKSimpleTextProvider(text: "\(data.todayAppointmentsCount)")
        template.row2Column1TextProvider = CLKSimpleTextProvider(text: "Revenue")
        template.row2Column2TextProvider = CLKSimpleTextProvider(text: formatCurrency(data.todayRevenue))
        template.row3Column1TextProvider = CLKSimpleTextProvider(text: "Steps")
        template.row3Column2TextProvider = CLKSimpleTextProvider(text: "\(data.todaySteps)")
        return CLKComplicationTimelineEntry(date: Date(), complicationTemplate: template)
    }

    private func createUtilitarianSmallEntry(data: ComplicationData) -> CLKComplicationTimelineEntry {
        let template = CLKComplicationTemplateUtilitarianSmallFlat()
        template.textProvider = CLKSimpleTextProvider(text: "\(data.todayAppointmentsCount) appointments")
        return CLKComplicationTimelineEntry(date: Date(), complicationTemplate: template)
    }

    private func createUtilitarianLargeEntry(data: ComplicationData) -> CLKComplicationTimelineEntry {
        let template = CLKComplicationTemplateUtilitarianLargeFlat()
        template.textProvider = CLKSimpleTextProvider(text: "\(data.todayAppointmentsCount) appointments • \(formatCurrency(data.todayRevenue))")
        return CLKComplicationTimelineEntry(date: Date(), complicationTemplate: template)
    }

    private func createGraphicCornerEntry(data: ComplicationData) -> CLKComplicationTimelineEntry {
        let template = CLKComplicationTemplateGraphicCornerCircularText()
        template.textProvider = CLKSimpleTextProvider(text: "\(data.todayAppointmentsCount)")
        template.gaugeProvider = CLKSimpleGaugeProvider(style: .open, gaugeColor: UIColor(hex: "D4AF37"), fillFraction: Float(data.weekProgress))
        return CLKComplicationTimelineEntry(date: Date(), complicationTemplate: template)
    }

    private func createGraphicBezelEntry(data: ComplicationData) -> CLKComplicationTimelineEntry {
        let circularTemplate = CLKComplicationTemplateGraphicCircularImage()
        circularTemplate.imageProvider = CLKFullColorImageProvider(fullColorImage: UIImage(systemName: "calendar.circle.fill")!)
        circularTemplate.textProvider = CLKSimpleTextProvider(text: "\(data.todayAppointmentsCount)")

        let template = CLKComplicationTemplateGraphicBezelCircularText()
        template.circularTemplate = circularTemplate
        template.textProvider = CLKSimpleTextProvider(text: "Today: \(data.todayAppointmentsCount) appointments")
        return CLKComplicationTimelineEntry(date: Date(), complicationTemplate: template)
    }

    private func createGraphicCircularEntry(data: ComplicationData) -> CLKComplicationTimelineEntry {
        let template = CLKComplicationTemplateGraphicCircularClosedGaugeImage()
        template.bottomImageProvider = CLKFullColorImageProvider(fullColorImage: UIImage(systemName: "heart.fill")!)
        template.bottomTextProvider = CLKSimpleTextProvider(text: "\(data.todaySteps)")

        let gaugeProvider = CLKSimpleGaugeProvider(
            style: .closed,
            gaugeColors: [
                UIColor(hex: "D4AF37"),
                UIColor(hex: "B8860B"),
                UIColor.systemOrange
            ],
            gaugeColorLocations: [0.0, 0.5, 1.0],
            fillFraction: Float(data.weekProgress)
        )
        template.gaugeProvider = gaugeProvider

        return CLKComplicationTimelineEntry(date: Date(), complicationTemplate: template)
    }

    private func createGraphicRectangularEntry(data: ComplicationData) -> CLKComplicationTimelineEntry {
        let template = CLKComplicationTemplateGraphicRectangularStandardBody()
        template.headerTextProvider = CLKSimpleTextProvider(text: "Mariia Hub")
        template.body1TextProvider = CLKSimpleTextProvider(text: "\(data.todayAppointmentsCount) appointments today")
        template.body2TextProvider = CLKSimpleTextProvider(text: "\(formatCurrency(data.todayRevenue)) revenue • \(data.todaySteps) steps")

        if let nextAppointment = data.nextAppointment {
            template.headerTextProvider = CLKSimpleTextProvider(text: "Next: \(nextAppointment.time)")
            template.body1TextProvider = CLKSimpleTextProvider(text: nextAppointment.clientName)
            template.body2TextProvider = CLKSimpleTextProvider(text: nextAppointment.serviceName)
        }

        return CLKComplicationTimelineEntry(date: Date(), complicationTemplate: template)
    }

    private func createExtraLargeEntry(data: ComplicationData) -> CLKComplicationTimelineEntry {
        let template = CLKComplicationTemplateExtraLargeCircularSimpleText()
        template.textProvider = CLKSimpleTextProvider(text: "\(data.todayAppointmentsCount)")
        template.tintColor = UIColor(hex: "D4AF37")
        return CLKComplicationTimelineEntry(date: Date(), complicationTemplate: template)
    }

    private func createAppointmentTimelineEntry(for complication: CLKComplication, appointment: AppointmentComplicationData) -> CLKComplicationTimelineEntry {
        let appointmentText = "\(appointment.clientName) • \(appointment.serviceName)"

        switch complication.family {
        case .graphicRectangular:
            let template = CLKComplicationTemplateGraphicRectangularStandardBody()
            template.headerTextProvider = CLKSimpleTextProvider(text: appointment.time)
            template.body1TextProvider = CLKSimpleTextProvider(text: appointment.clientName)
            template.body2TextProvider = CLKSimpleTextProvider(text: appointment.serviceName)
            return CLKComplicationTimelineEntry(date: appointment.date, complicationTemplate: template)

        case .modularLarge:
            let template = CLKComplicationTemplateModularLargeStandardBody()
            template.headerTextProvider = CLKSimpleTextProvider(text: appointment.time)
            template.body1TextProvider = CLKSimpleTextProvider(text: appointment.clientName)
            template.body2TextProvider = CLKSimpleTextProvider(text: appointment.serviceName)
            return CLKComplicationTimelineEntry(date: appointment.date, complicationTemplate: template)

        default:
            let template = CLKComplicationTemplateUtilitarianSmallFlat()
            template.textProvider = CLKSimpleTextProvider(text: appointment.time)
            return CLKComplicationTimelineEntry(date: appointment.date, complicationTemplate: template)
        }
    }

    private func createDefaultEntry(for complication: CLKComplication) -> CLKComplicationTimelineEntry {
        let template = CLKComplicationTemplateUtilitarianSmallFlat()
        template.textProvider = CLKSimpleTextProvider(text: "Mariia Hub")
        return CLKComplicationTimelineEntry(date: Date(), complicationTemplate: template)
    }

    private func createSampleTemplate(for complication: CLKComplication) -> CLKComplicationTemplate {
        switch complication.family {
        case .circularSmall:
            let template = CLKComplicationTemplateCircularSmallSimpleText()
            template.textProvider = CLKSimpleTextProvider(text: "3")
            template.tintColor = UIColor(hex: "D4AF37")
            return template
        case .modularSmall:
            let template = CLKComplicationTemplateModularSmallStackImage()
            template.line1ImageProvider = CLKImageProvider(onePieceImage: UIImage(systemName: "calendar")!)
            template.line1TextProvider = CLKSimpleTextProvider(text: "3")
            template.line2TextProvider = CLKSimpleTextProvider(text: "Today")
            return template
        case .modularLarge:
            let template = CLKComplicationTemplateModularLargeTable()
            template.headerTextProvider = CLKSimpleTextProvider(text: "Today's Schedule")
            template.row1Column1TextProvider = CLKSimpleTextProvider(text: "Appointments")
            template.row1Column2TextProvider = CLKSimpleTextProvider(text: "3")
            template.row2Column1TextProvider = CLKSimpleTextProvider(text: "Revenue")
            template.row2Column2TextProvider = CLKSimpleTextProvider(text: "PLN 900")
            template.row3Column1TextProvider = CLKSimpleTextProvider(text: "Steps")
            template.row3Column2TextProvider = CLKSimpleTextProvider(text: "8,432")
            return template
        case .graphicRectangular:
            let template = CLKComplicationTemplateGraphicRectangularStandardBody()
            template.headerTextProvider = CLKSimpleTextProvider(text: "Next Appointment")
            template.body1TextProvider = CLKSimpleTextProvider(text: "Anna Kowalska")
            template.body2TextProvider = CLKSimpleTextProvider(text: "Lip Enhancement • 09:00")
            return template
        default:
            let template = CLKComplicationTemplateUtilitarianSmallFlat()
            template.textProvider = CLKSimpleTextProvider(text: "3 appointments")
            return template
        }
    }

    // MARK: - Update Scheduling

    func scheduleUpdates() {
        let server = CLKComplicationServer.sharedInstance()
        guard let complications = server.activeComplications else { return }

        for complication in complications {
            server.reloadTimeline(for: complication)
        }

        // Schedule next update
        let nextUpdate = Date().addingTimeInterval(15 * 60) // 15 minutes
        server.reloadTimeline(ofKind: .all, after: nextUpdate)
    }

    func updateComplications() async {
        let server = CLKComplicationServer.sharedInstance()
        guard let complications = server.activeComplications else { return }

        for complication in complications {
            server.reloadTimeline(for: complication)
        }
    }

    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "PLN"
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: amount)) ?? "0 PLN"
    }
}

// MARK: - Complication Data Provider

class ComplicationDataProvider {
    static let shared = ComplicationDataProvider()

    private var cachedData: ComplicationData?
    private var lastUpdate = Date()

    func getLatestComplicationData() async -> ComplicationData {
        if let cached = cachedData, Date().timeIntervalSince(lastUpdate) < 300 { // 5 minutes cache
            return cached
        }

        let data = await fetchLatestData()
        await MainActor.run {
            self.cachedData = data
            self.lastUpdate = Date()
        }
        return data
    }

    func getUpcomingAppointments(after date: Date, limit: Int) async -> [AppointmentComplicationData] {
        // Fetch appointments from watch connectivity or local cache
        return mockUpcomingAppointments().prefix(limit).map { appointment in
            AppointmentComplicationData(
                id: appointment.id,
                clientName: appointment.clientName,
                serviceName: appointment.serviceName,
                date: appointment.date,
                time: appointment.time
            )
        }
    }

    private func fetchLatestData() async -> ComplicationData {
        // Simulate data fetching
        return ComplicationData(
            todayAppointmentsCount: 3,
            todayRevenue: 1200.0,
            todaySteps: 8432,
            weekProgress: 0.65,
            nextAppointment: AppointmentComplicationData(
                id: "1",
                clientName: "Anna Kowalska",
                serviceName: "Lip Enhancement",
                date: Date().addingTimeInterval(3600),
                time: "09:00"
            )
        )
    }

    private func mockUpcomingAppointments() -> [MockAppointment] {
        return [
            MockAppointment(id: "1", clientName: "Anna Kowalska", serviceName: "Lip Enhancement", date: Date().addingTimeInterval(3600), time: "09:00"),
            MockAppointment(id: "2", clientName: "Maria Nowak", serviceName: "Brow Design", date: Date().addingTimeInterval(7200), time: "10:00"),
            MockAppointment(id: "3", clientName: "Ewa Wiśniewska", serviceName: "Glute Training", date: Date().addingTimeInterval(14400), time: "14:00")
        ]
    }
}

// MARK: - Data Models

struct ComplicationData {
    let todayAppointmentsCount: Int
    let todayRevenue: Double
    let todaySteps: Int
    let weekProgress: Double
    let nextAppointment: AppointmentComplicationData?
}

struct AppointmentComplicationData {
    let id: String
    let clientName: String
    let serviceName: String
    let date: Date
    let time: String
}

private struct MockAppointment {
    let id: String
    let clientName: String
    let serviceName: String
    let date: Date
    let time: String
}

// MARK: - UIColor Extension

extension UIColor {
    convenience init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 0, 0, 0)
        }

        self.init(
            red: CGFloat(r) / 255,
            green: CGFloat(g) / 255,
            blue: CGFloat(b) / 255,
            alpha: CGFloat(a) / 255
        )
    }
}