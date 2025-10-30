import Foundation
import LocalAuthentication
import Combine
import Security

class BiometricAuthenticationService: ObservableObject {
    @Published var isAvailable = false
    @Published var isAuthenticated = false
    @Published var biometricType: LABiometricType = .none
    @Published var authenticationError: String?

    private let keychain = Keychain(service: "com.mariiahub.auth")

    init() {
        checkBiometricAvailability()
        checkExistingAuthentication()
    }

    func checkBiometricAvailability() {
        let context = LAContext()
        var error: NSError?

        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            self.biometricType = .none
            self.isAvailable = false
            return
        }

        self.isAvailable = true
        self.biometricType = context.biometryType
    }

    func checkExistingAuthentication() {
        isAuthenticated = keychain.retrieve("is_authenticated") == "true"
    }

    func authenticate(reason: String = "Verify your identity to access the app") async -> Bool {
        guard isAvailable else {
            authenticationError = "Biometric authentication is not available"
            return false
        }

        let context = LAContext()
        context.localizedFallbackTitle = "Use Passcode"

        do {
            let success = try await context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: reason
            )

            await MainActor.run {
                if success {
                    self.isAuthenticated = true
                    self.keychain.store("is_authenticated", value: "true")
                    self.authenticationError = nil
                } else {
                    self.authenticationError = "Authentication failed"
                }
            }

            return success
        } catch {
            await MainActor.run {
                self.authenticationError = error.localizedDescription
            }
            return false
        }
    }

    func signOut() {
        isAuthenticated = false
        keychain.delete("is_authenticated")
        authenticationError = nil
    }

    func resetAuthentication() {
        signOut()
        checkBiometricAvailability()
    }
}

class Keychain {
    let service: String

    init(service: String) {
        self.service = service
    }

    func store(_ key: String, value: String) -> Bool {
        guard let data = value.data(using: .utf8) else { return false }

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecValueData as String: data
        ]

        // Delete existing item first
        delete(key)

        let status = SecItemAdd(query as CFDictionary, nil)
        return status == errSecSuccess
    }

    func retrieve(_ key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess,
              let data = result as? Data,
              let value = String(data: data, encoding: .utf8) else {
            return nil
        }

        return value
    }

    func delete(_ key: String) -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key
        ]

        let status = SecItemDelete(query as CFDictionary)
        return status == errSecSuccess || status == errSecItemNotFound
    }
}

class AuthenticationService: ObservableObject {
    @Published var currentUser: UserProfile?
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let supabaseManager = SupabaseManager.shared
    private var cancellables = Set<AnyCancellable>()

    func signIn(email: String, password: String) async throws {
        isLoading = true
        errorMessage = nil

        defer { isLoading = false }

        // This would integrate with Supabase Auth
        // For now, simulate with user profile lookup
        do {
            let userProfiles = try await supabaseManager.fetchUserBookingsByEmail(email)

            // Create or update user profile
            let profile = UserProfile(
                id: UUID().uuidString,
                email: email,
                fullName: nil,
                phone: nil,
                avatarUrl: nil,
                role: "client",
                preferences: nil,
                createdAt: Date(),
                updatedAt: Date()
            )

            _ = try await supabaseManager.createProfile(profile)

            await MainActor.run {
                self.currentUser = profile
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
            }
            throw error
        }
    }

    func signUp(profile: UserProfile, password: String) async throws {
        isLoading = true
        errorMessage = nil

        defer { isLoading = false }

        do {
            _ = try await supabaseManager.createProfile(profile)

            await MainActor.run {
                self.currentUser = profile
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
            }
            throw error
        }
    }

    func signOut() {
        currentUser = nil
        errorMessage = nil
    }

    func updateProfile(_ profile: UserProfile) async throws {
        guard currentUser?.id == profile.id else {
            throw AuthenticationError.unauthorized
        }

        do {
            let updatedProfile = try await supabaseManager.updateProfile(profile)

            await MainActor.run {
                self.currentUser = updatedProfile
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
            }
            throw error
        }
    }
}

enum AuthenticationError: LocalizedError {
    case unauthorized
    case invalidCredentials
    case networkError
    case custom(String)

    var errorDescription: String? {
        switch self {
        case .unauthorized:
            return "You are not authorized to perform this action"
        case .invalidCredentials:
            return "Invalid email or password"
        case .networkError:
            return "Network error occurred"
        case .custom(let message):
            return message
        }
    }
}