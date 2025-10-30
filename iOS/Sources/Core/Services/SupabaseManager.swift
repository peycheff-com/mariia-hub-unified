import Foundation
import Supabase
import Combine

class SupabaseManager: ObservableObject {
    static let shared = SupabaseManager()

    private(set) var client: SupabaseClient?
    private var cancellables = Set<AnyCancellable>()

    private init() {}

    func initialize() {
        // Configuration from environment variables
        let supabaseURL = URL(string: ProcessInfo.processInfo.environment["SUPABASE_URL"] ?? "https://your-project-id.supabase.co")!
        let supabaseKey = ProcessInfo.processInfo.environment["SUPABASE_ANON_KEY"] ?? "your-anon-key"

        client = SupabaseClient(
            supabaseURL: supabaseURL,
            supabaseKey: supabaseKey
        )

        print("✅ Supabase client initialized")
    }

    // MARK: - Generic CRUD Operations

    func fetch<T: Codable>(_ table: String, filter: String? = nil) async throws -> [T] {
        guard let client = client else {
            throw SupabaseError.notInitialized
        }

        var query = client.database.from(table).select()

        if let filter = filter {
            query = query.filter(filter)
        }

        let response: [T] = try await query.execute().value
        return response
    }

    func fetchById<T: Codable & Identifiable>(_ table: String, id: T.ID) async throws -> T? {
        guard let client = client else {
            throw SupabaseError.notInitialized
        }

        let response: [T] = try await client.database
            .from(table)
            .select()
            .eq("id", value: id)
            .execute()
            .value

        return response.first
    }

    func insert<T: Codable>(_ table: String, item: T) async throws -> T {
        guard let client = client else {
            throw SupabaseError.notInitialized
        }

        let response: [T] = try await client.database
            .from(table)
            .insert(item)
            .execute()
            .value

        return response.first!
    }

    func update<T: Codable & Identifiable>(_ table: String, item: T) async throws -> T {
        guard let client = client else {
            throw SupabaseError.notInitialized
        }

        let response: [T] = try await client.database
            .from(table)
            .update(item)
            .eq("id", value: item.id)
            .execute()
            .value

        return response.first!
    }

    func delete<T: Codable & Identifiable>(_ table: String, id: T.ID) async throws {
        guard let client = client else {
            throw SupabaseError.notInitialized
        }

        _ = try await client.database
            .from(table)
            .delete()
            .eq("id", value: id)
            .execute()
    }

    // MARK: - Service-Specific Methods

    func fetchServices(serviceType: ServiceType? = nil, isActive: Bool = true) async throws -> [Service] {
        guard let client = client else {
            throw SupabaseError.notInitialized
        }

        var query = client.database
            .from("services")
            .select()
            .eq("is_active", value: isActive)

        if let serviceType = serviceType {
            query = query.eq("service_type", value: serviceType.rawValue)
        }

        let response: [Service] = try await query
            .order("created_at", ascending: false)
            .execute()
            .value

        return response
    }

    func fetchService(with id: String) async throws -> Service? {
        return try await fetchById("services", id: id)
    }

    func fetchAvailabilitySlots(
        for serviceId: String,
        from startDate: Date,
        to endDate: Date
    ) async throws -> [AvailabilitySlot] {
        guard let client = client else {
            throw SupabaseError.notInitialized
        }

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"

        let startDateString = formatter.string(from: startDate)
        let endDateString = formatter.string(from: endDate)

        let response: [AvailabilitySlot] = try await client.database
            .from("availability_slots")
            .select()
            .eq("service_id", value: serviceId)
            .gte("date", value: startDateString)
            .lte("date", value: endDateString)
            .eq("is_available", value: true)
            .order("date", ascending: true)
            .order("start_time", ascending: true)
            .execute()
            .value

        return response
    }

    func createBooking(_ booking: Booking) async throws -> Booking {
        return try await insert("bookings", item: booking)
    }

    func fetchUserBookings(userId: String) async throws -> [Booking] {
        guard let client = client else {
            throw SupabaseError.notInitialized
        }

        let response: [Booking] = try await client.database
            .from("bookings")
            .select()
            .eq("user_id", value: userId)
            .order("booking_date", ascending: false)
            .order("start_time", ascending: false)
            .execute()
            .value

        return response
    }

    func fetchUserBookingsByEmail(_ email: String) async throws -> [Booking] {
        guard let client = client else {
            throw SupabaseError.notInitialized
        }

        let response: [Booking] = try await client.database
            .from("bookings")
            .select()
            .eq("client_email", value: email)
            .order("booking_date", ascending: false)
            .order("start_time", ascending: false)
            .execute()
            .value

        return response
    }

    func updateBookingStatus(bookingId: String, status: BookingStatus) async throws -> Booking {
        guard let client = client else {
            throw SupabaseError.notInitialized
        }

        let response: [Booking] = try await client.database
            .from("bookings")
            .update(["status": status.rawValue])
            .eq("id", value: bookingId)
            .execute()
            .value

        return response.first!
    }

    // MARK: - User Profile Methods

    func createProfile(_ profile: UserProfile) async throws -> UserProfile {
        return try await insert("profiles", item: profile)
    }

    func updateProfile(_ profile: UserProfile) async throws -> UserProfile {
        return try await update("profiles", item: profile)
    }

    func fetchProfile(userId: String) async throws -> UserProfile? {
        return try await fetchById("profiles", id: userId)
    }

    // MARK: - Review Methods

    func fetchReviews(for serviceId: String) async throws -> [Review] {
        guard let client = client else {
            throw SupabaseError.notInitialized
        }

        let response: [Review] = try await client.database
            .from("reviews")
            .select()
            .eq("service_id", value: serviceId)
            .eq("is_public", value: true)
            .order("created_at", ascending: false)
            .execute()
            .value

        return response
    }

    func createReview(_ review: Review) async throws -> Review {
        return try await insert("reviews", item: review)
    }

    // MARK: - Real-time Subscription

    func subscribeToBookingUpdates(userId: String, onUpdate: @escaping (Booking) -> Void) throws {
        guard let client = client else {
            throw SupabaseError.notInitialized
        }

        _ = client.realtime.channel("bookings")
            .onPostgresChange(
                event: .all,
                schema: "public",
                table: "bookings",
                filter: "user_id=eq.\(userId)"
            ) { payload in
                if let booking = try? JSONDecoder().decode(Booking.self, from: JSONEncoder().encode(payload.data)) {
                    DispatchQueue.main.async {
                        onUpdate(booking)
                    }
                }
            }
            .subscribe()
    }

    func subscribeToAvailabilityUpdates(serviceId: String, onUpdate: @escaping ([AvailabilitySlot]) -> Void) throws {
        guard let client = client else {
            throw SupabaseError.notInitialized
        }

        _ = client.realtime.channel("availability")
            .onPostgresChange(
                event: .all,
                schema: "public",
                table: "availability_slots",
                filter: "service_id=eq.\(serviceId)"
            ) { payload in
                // Fetch updated availability when changes occur
                Task {
                    do {
                        let slots = try await self.fetchAvailabilitySlots(
                            for: serviceId,
                            from: Date(),
                            to: Calendar.current.date(byAdding: .day, value: 30, to: Date()) ?? Date()
                        )
                        DispatchQueue.main.async {
                            onUpdate(slots)
                        }
                    } catch {
                        print("Error fetching updated availability: \(error)")
                    }
                }
            }
            .subscribe()
    }

    // MARK: - Storage Methods

    func uploadImage(data: Data, path: String) async throws -> URL? {
        guard let client = client else {
            throw SupabaseError.notInitialized
        }

        let fileName = "\(UUID().uuidString).jpg"
        let fullPath = "\(path)/\(fileName)"

        let response = try await client.storage
            .from("service-images")
            .upload(data: data, path: fullPath)

        let publicURL = try await client.storage
            .from("service-images")
            .getPublicURL(path: fullPath)

        return publicURL
    }

    func deleteImage(path: String) async throws {
        guard let client = client else {
            throw SupabaseError.notInitialized
        }

        _ = try await client.storage
            .from("service-images")
            .remove(paths: [path])
    }
}

// MARK: - Error Types

enum SupabaseError: LocalizedError {
    case notInitialized
    case invalidConfiguration
    case networkError
    case decodingError
    case custom(String)

    var errorDescription: String? {
        switch self {
        case .notInitialized:
            return "Supabase client not initialized"
        case .invalidConfiguration:
            return "Invalid Supabase configuration"
        case .networkError:
            return "Network error occurred"
        case .decodingError:
            return "Failed to decode response"
        case .custom(let message):
            return message
        }
    }
}

// MARK: - Extensions

extension SupabaseManager {
    func searchServices(query: String, serviceType: ServiceType? = nil) async throws -> [Service] {
        guard let client = client else {
            throw SupabaseError.notInitialized
        }

        var queryBuilder = client.database
            .from("services")
            .select()
            .eq("is_active", value: true)
            .or("title.ilike.%\(query)%,description.ilike.%\(query)%,category.ilike.%\(query)%")

        if let serviceType = serviceType {
            queryBuilder = queryBuilder.eq("service_type", value: serviceType.rawValue)
        }

        let response: [Service] = try await queryBuilder
            .order("created_at", ascending: false)
            .execute()
            .value

        return response
    }

    func checkAvailability(serviceId: String, date: String, timeSlot: String) async throws -> AvailabilitySlot? {
        guard let client = client else {
            throw SupabaseError.notInitialized
        }

        let response: [AvailabilitySlot] = try await client.database
            .from("availability_slots")
            .select()
            .eq("service_id", value: serviceId)
            .eq("date", value: date)
            .eq("start_time", value: timeSlot)
            .eq("is_available", value: true)
            .execute()
            .value

        return response.first
    }

    func holdTimeSlot(serviceId: String, date: String, timeSlot: String, sessionId: String) async throws {
        guard let client = client else {
            throw SupabaseError.notInitialized
        }

        let hold = [
            "service_id": serviceId,
            "date": date,
            "time_slot": timeSlot,
            "session_id": sessionId,
            "expires_at": ISO8601DateFormatter().string(from: Date().addingTimeInterval(300)) // 5 minutes
        ] as [String: Any]

        _ = try await client.database
            .from("holds")
            .insert(hold)
            .execute()
    }

    func releaseTimeSlot(sessionId: String) async throws {
        guard let client = client else {
            throw SupabaseError.notInitialized
        }

        _ = try await client.database
            .from("holds")
            .delete()
            .eq("session_id", value: sessionId)
            .execute()
    }
}