import SwiftUI
import Supabase

@main
struct MariiaHubApp: App {
    @StateObject private var appState = AppState()
    @StateObject private var biometricAuth = BiometricAuthenticationService()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .environmentObject(biometricAuth)
                .onAppear {
                    setupApp()
                }
                .preferredColorScheme(.dark) // Luxury dark theme
        }
    }

    private func setupApp() {
        // Initialize Supabase client
        SupabaseManager.shared.initialize()

        // Request necessary permissions
        NotificationManager.shared.requestAuthorization()
        HealthKitManager.shared.requestPermissions()

        // Initialize analytics
        AnalyticsManager.shared.initialize()

        // Setup remote notifications
        setupRemoteNotifications()
    }

    private func setupRemoteNotifications() {
        UNUserNotificationCenter.current().delegate = NotificationDelegate.shared

        UIApplication.shared.registerForRemoteNotifications()
    }
}

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var biometricAuth: BiometricAuthenticationService

    var body: some View {
        Group {
            if appState.isFirstLaunch {
                OnboardingView()
            } else if appState.needsAuthentication {
                AuthenticationView()
            } else {
                MainTabView()
            }
        }
        .animation(.easeInOut(duration: 0.3), value: appState.currentFlow)
    }
}

// MARK: - Onboarding Flow
struct OnboardingView: View {
    @EnvironmentObject var appState: AppState
    @State private var currentPage = 0

    var body: some View {
        ZStack {
            // Luxury gradient background
            LinearGradient(
                colors: [
                    Color(hex: "8B4513"),
                    Color(hex: "D2691E"),
                    Color(hex: "F5DEB3")
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            // Onboarding content
            TabView(selection: $currentPage) {
                OnboardingPage(
                    imageName: "sparkles",
                    title: "Luxury Beauty",
                    subtitle: "Premium PMU and brow services in the heart of Warsaw"
                )
                .tag(0)

                OnboardingPage(
                    imageName: "figure.fitness",
                    title: "Elite Fitness",
                    subtitle: "Personalized training programs with expert guidance"
                )
                .tag(1)

                OnboardingPage(
                    imageName: "applelogo",
                    title: "Seamless Integration",
                    subtitle: "Apple Pay, HealthKit, and Calendar sync"
                )
                .tag(2)
            }
            .tabViewStyle(.page(indexDisplayMode: .always))
            .indexViewStyle(PageIndexViewStyle(backgroundDisplayMode: .always))

            // Continue button
            VStack {
                Spacer()

                Button(action: {
                    if currentPage < 2 {
                        withAnimation(.easeInOut(duration: 0.5)) {
                            currentPage += 1
                        }
                    } else {
                        appState.completeOnboarding()
                    }
                }) {
                    Text(currentPage < 2 ? "Continue" : "Get Started")
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(
                            RoundedRectangle(cornerRadius: 28)
                                .fill(Color(hex: "D4AF37"))
                                .shadow(color: .black.opacity(0.3), radius: 10, x: 0, y: 5)
                        )
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 50)
            }
        }
        .preferredColorScheme(.dark)
    }
}

struct OnboardingPage: View {
    let imageName: String
    let title: String
    let subtitle: String

    var body: some View {
        VStack(spacing: 40) {
            Spacer()

            Image(systemName: imageName)
                .font(.system(size: 80))
                .foregroundColor(Color(hex: "F5DEB3"))
                .shadow(color: Color(hex: "D4AF37").opacity(0.5), radius: 20, x: 0, y: 0)

            VStack(spacing: 16) {
                Text(title)
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.white)

                Text(subtitle)
                    .font(.title3)
                    .multilineTextAlignment(.center)
                    .foregroundColor(Color(hex: "F5DEB3").opacity(0.9))
                    .padding(.horizontal, 40)
            }

            Spacer()
            Spacer()
        }
    }
}

// MARK: - Main Tab View
struct MainTabView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            ServicesHomeView()
                .tabItem {
                    Image(systemName: "house.fill")
                    Text("Home")
                }
                .tag(0)

            BookingNavigationView()
                .tabItem {
                    Image(systemName: "calendar.badge.plus")
                    Text("Book")
                }
                .tag(1)

            AppointmentsView()
                .tabItem {
                    Image(systemName: "list.bullet.clipboard")
                    Text("Appointments")
                }
                .tag(2)

            ProfileView()
                .tabItem {
                    Image(systemName: "person.circle")
                    Text("Profile")
                }
                .tag(3)
        }
        .accentColor(Color(hex: "D4AF37"))
        .onAppear {
            customizeTabBarAppearance()
        }
    }

    private func customizeTabBarAppearance() {
        let appearance = UITabBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor(red: 0.55, green: 0.27, blue: 0.07, alpha: 1.0)
        appearance.shadowColor = UIColor.black

        // Normal state
        appearance.stackedLayoutAppearance.normal.titleTextAttributes = [
            .foregroundColor: UIColor(red: 0.96, green: 0.87, blue: 0.7, alpha: 1.0),
            .font: UIFont.systemFont(ofSize: 12, weight: .medium)
        ]
        appearance.stackedLayoutAppearance.normal.iconColor = UIColor(red: 0.96, green: 0.87, blue: 0.7, alpha: 1.0)

        // Selected state
        appearance.stackedLayoutAppearance.selected.titleTextAttributes = [
            .foregroundColor: UIColor(red: 0.83, green: 0.69, blue: 0.22, alpha: 1.0),
            .font: UIFont.systemFont(ofSize: 12, weight: .semibold)
        ]
        appearance.stackedLayoutAppearance.selected.iconColor = UIColor(red: 0.83, green: 0.69, blue: 0.22, alpha: 1.0)

        UITabBar.appearance().standardAppearance = appearance
        UITabBar.appearance().scrollEdgeAppearance = appearance
    }
}

// MARK: - Color Extension
extension Color {
    init(hex: String) {
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
            (a, r, g, b) = (1, 1, 1, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}