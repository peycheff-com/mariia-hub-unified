import Foundation
import SwiftUI

// MARK: - Core Data Models

struct Service: Identifiable, Codable, Hashable {
    let id: String
    let title: String
    let description: String?
    let serviceType: ServiceType
    let durationMinutes: Int
    let price: Double
    let currency: String
    let images: [String]?
    let isActive: Bool
    let category: String?
    let requiresDeposit: Bool?
    let depositPercentage: Double?
    let metadata: ServiceMetadata?
    let locationType: LocationType?
    let bufferMinutes: Int?
    let maxCapacity: Int?
    let tags: [String]?
    let createdAt: Date?
    let updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, title, description, price, currency, images, category, tags
        case serviceType = "service_type"
        case durationMinutes = "duration_minutes"
        case isActive = "is_active"
        case requiresDeposit = "requires_deposit"
        case depositPercentage = "deposit_percentage"
        case metadata, locationType = "location_type"
        case bufferMinutes = "buffer_minutes"
        case maxCapacity = "max_capacity"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

struct ServiceMetadata: Codable, Hashable {
    let preparation: String?
    let aftercare: String?
    let expectations: String?
    let contraindications: [String]?
    let benefits: [String]?
    let addons: [ServiceAddon]?
    let faq: [FAQ]?
}

struct ServiceAddon: Identifiable, Codable, Hashable {
    let id: String
    let name: String
    let description: String?
    let price: Double
    let durationMinutes: Int
    let isRequired: Bool?
}

struct FAQ: Identifiable, Codable, Hashable {
    let id: String
    let question: String
    let answer: String
    let order: Int?
}

enum ServiceType: String, CaseIterable, Codable {
    case beauty = "beauty"
    case fitness = "fitness"
    case lifestyle = "lifestyle"

    var localizedName: String {
        switch self {
        case .beauty: return "Beauty"
        case .fitness: return "Fitness"
        case .lifestyle: return "Lifestyle"
        }
    }

    var iconName: String {
        switch self {
        case .beauty: return "sparkles"
        case .fitness: return "figure.fitness"
        case .lifestyle: return "heart.circle"
        }
    }

    var color: Color {
        switch self {
        case .beauty: return Color(hex: "FFB6C1")
        case .fitness: return Color(hex: "87CEEB")
        case .lifestyle: return Color(hex: "DDA0DD")
        }
    }
}

enum LocationType: String, CaseIterable, Codable {
    case studio = "studio"
    case mobile = "mobile"
    case online = "online"
    case salon = "salon"

    var localizedName: String {
        switch self {
        case .studio: return "Studio"
        case .mobile: return "Mobile"
        case .online: return "Online"
        case .salon: return "Salon"
        }
    }

    var iconName: String {
        switch self {
        case .studio: return "house.fill"
        case .mobile: return "car.fill"
        case .online: return "video.fill"
        case .salon: return "building.2.fill"
        }
    }
}

// MARK: - Booking Models

struct Booking: Identifiable, Codable, Hashable {
    let id: String
    let serviceId: String
    let clientId: String?
    let clientName: String
    let clientEmail: String
    let clientPhone: String?
    let bookingDate: String
    let startTime: String
    let endTime: String
    let totalAmount: Double
    let currency: String
    let status: BookingStatus
    let paymentStatus: PaymentStatus?
    let depositAmount: Double?
    let notes: String?
    let preferences: BookingPreferences?
    let locationType: LocationType?
    let bookingData: BookingData?
    let metadata: [String: Any]?
    let externalBookingId: String?
    let externalSource: String?
    let stripePaymentIntentId: String?
    let createdAt: Date?
    let updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, notes, metadata
        case serviceId = "service_id"
        case clientId = "user_id"
        case clientName = "client_name"
        case clientEmail = "client_email"
        case clientPhone = "client_phone"
        case bookingDate = "booking_date"
        case startTime = "start_time"
        case endTime = "end_time"
        case totalAmount = "total_amount"
        case currency, status
        case paymentStatus = "payment_status"
        case depositAmount = "deposit_amount"
        case preferences, locationType = "location_type"
        case bookingData = "booking_data"
        case externalBookingId = "external_booking_id"
        case externalSource = "external_source"
        case stripePaymentIntentId = "stripe_payment_intent_id"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

struct BookingPreferences: Codable, Hashable {
    let communicationChannel: String?
    let reminderTiming: String?
    let specialRequests: String?
    let consent: ConsentData?
}

struct ConsentData: Codable, Hashable {
    let photoConsent: Bool?
    let communicationConsent: Bool?
    let dataProcessingConsent: Bool?
    let marketingConsent: Bool?
}

struct BookingData: Codable, Hashable {
    let selectedAddons: [String]?
    let packageBooking: Bool?
    let groupId: String?
    let customDuration: Int?
    let locationDetails: String?
}

enum BookingStatus: String, CaseIterable, Codable {
    case draft = "draft"
    case pending = "pending"
    case confirmed = "confirmed"
    case cancelled = "cancelled"
    case completed = "completed"
    case noShow = "no_show"
    case rescheduled = "rescheduled"

    var localizedName: String {
        switch self {
        case .draft: return "Draft"
        case .pending: return "Pending"
        case .confirmed: return "Confirmed"
        case .cancelled: return "Cancelled"
        case .completed: return "Completed"
        case .noShow: return "No Show"
        case .rescheduled: return "Rescheduled"
        }
    }

    var color: Color {
        switch self {
        case .draft: return .gray
        case .pending: return .orange
        case .confirmed: return .green
        case .cancelled: return .red
        case .completed: return .blue
        case .noShow: return .purple
        case .rescheduled: return .cyan
        }
    }

    var isActive: Bool {
        switch self {
        case .confirmed, .pending:
            return true
        default:
            return false
        }
    }
}

enum PaymentStatus: String, CaseIterable, Codable {
    case pending = "pending"
    case paid = "paid"
    case refunded = "refunded"
    case partiallyRefunded = "partially_refunded"
    case failed = "failed"

    var localizedName: String {
        switch self {
        case .pending: return "Pending"
        case .paid: return "Paid"
        case .refunded: return "Refunded"
        case .partiallyRefunded: return "Partially Refunded"
        case .failed: return "Failed"
        }
    }
}

// MARK: - Availability Models

struct AvailabilitySlot: Identifiable, Codable, Hashable {
    let id: String
    let serviceId: String
    let date: String
    let startTime: String
    let endTime: String
    let isAvailable: Bool?
    let capacity: Int?
    let currentBookings: Int?
    let locationType: LocationType?
    let notes: String?
    let createdAt: Date?
    let updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, date, notes, capacity
        case serviceId = "service_id"
        case startTime = "start_time"
        case endTime = "end_time"
        case isAvailable = "is_available"
        case currentBookings = "current_bookings"
        case locationType = "location_type"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    var isBooked: Bool {
        guard let capacity = capacity,
              let currentBookings = currentBookings else {
            return false
        }
        return currentBookings >= capacity
    }

    var availableSpots: Int {
        guard let capacity = capacity,
              let currentBookings = currentBookings else {
            return 0
        }
        return max(0, capacity - currentBookings)
    }
}

// MARK: - User Profile Models

struct UserProfile: Identifiable, Codable, Hashable {
    let id: String
    let email: String?
    let fullName: String?
    let phone: String?
    let avatarUrl: String?
    let role: String?
    let preferences: UserPreferences?
    let createdAt: Date?
    let updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, email, phone, role, preferences
        case fullName = "full_name"
        case avatarUrl = "avatar_url"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

struct UserPreferences: Codable, Hashable {
    let language: String?
    let currency: String?
    let notifications: NotificationPreferences?
    let privacy: PrivacyPreferences?
    let accessibility: AccessibilityPreferences?
}

struct NotificationPreferences: Codable, Hashable {
    let pushEnabled: Bool?
    let emailEnabled: Bool?
    let smsEnabled: Bool?
    let remindersEnabled: Bool?
    let marketingEnabled: Bool?
}

struct PrivacyPreferences: Codable, Hashable {
    let dataSharing: Bool?
    let analyticsEnabled: Bool?
    let photoConsent: Bool?
    let testimonialConsent: Bool?
}

struct AccessibilityPreferences: Codable, Hashable {
    let largeTextEnabled: Bool?
    let reducedMotionEnabled: Bool?
    let highContrastEnabled: Bool?
    let voiceOverEnabled: Bool?
}

// MARK: - Booking Flow State Models

struct BookingFlowState: Identifiable, Codable {
    let id = UUID()
    let serviceId: String
    let serviceType: ServiceType
    let selectedDate: Date?
    let selectedTimeSlot: AvailabilitySlot?
    let clientDetails: ClientDetails?
    let selectedAddons: [ServiceAddon]
    let specialRequests: String?
    let paymentMethod: PaymentMethod?
    let currentStep: BookingStep
    let isCompleted: Bool

    enum CodingKeys: String, CodingKey {
        case serviceId = "service_id"
        case serviceType = "service_type"
        case selectedDate = "selected_date"
        case selectedTimeSlot = "selected_time_slot"
        case clientDetails = "client_details"
        case selectedAddons = "selected_addons"
        case specialRequests = "special_requests"
        case paymentMethod = "payment_method"
        case currentStep = "current_step"
        case isCompleted = "is_completed"
    }
}

struct ClientDetails: Codable, Hashable {
    let name: String
    let email: String
    let phone: String?
    let notes: String?
    let preferences: [String: Any]?
}

enum PaymentMethod: String, CaseIterable, Codable {
    case applePay = "apple_pay"
    case stripe = "stripe"
    case cash = "cash"
    case bankTransfer = "bank_transfer"

    var localizedName: String {
        switch self {
        case .applePay: return "Apple Pay"
        case .stripe: return "Card"
        case .cash: return "Cash"
        case .bankTransfer: return "Bank Transfer"
        }
    }

    var iconName: String {
        switch self {
        case .applePay: return "applelogo"
        case .stripe: return "creditcard"
        case .cash: return "banknote"
        case .bankTransfer: return "building.columns"
        }
    }
}

enum BookingStep: Int, CaseIterable, Codable {
    case serviceSelection = 1
    case timeSelection = 2
    case details = 3
    case payment = 4

    var localizedName: String {
        switch self {
        case .serviceSelection: return "Service"
        case .timeSelection: return "Time"
        case .details: return "Details"
        case .payment: return "Payment"
        }
    }

    var title: String {
        switch self {
        case .serviceSelection: return "Choose Service"
        case .timeSelection: return "Select Time"
        case .details: return "Your Details"
        case .payment: return "Payment"
        }
    }

    var description: String {
        switch self {
        case .serviceSelection: return "Select your desired service"
        case .timeSelection: return "Choose available time slot"
        case .details: return "Provide your information"
        case .payment: return "Complete booking"
        }
    }
}

// MARK: - Review Models

struct Review: Identifiable, Codable, Hashable {
    let id: String
    let serviceId: String
    let bookingId: String?
    let userId: String?
    let rating: Int
    let title: String?
    let content: String?
    let helpfulCount: Int?
    let isPublic: Bool?
    let isVerified: Bool?
    let respondedAt: Date?
    let responseText: String?
    let createdAt: Date?
    let updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, rating, title, content
        case serviceId = "service_id"
        case bookingId = "booking_id"
        case userId = "user_id"
        case helpfulCount = "helpful_count"
        case isPublic = "is_public"
        case isVerified = "is_verified"
        case respondedAt = "responded_at"
        case responseText = "response_text"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    var isValidRating: Bool {
        return rating >= 1 && rating <= 5
    }

    var ratingStars: String {
        return String(repeating: "⭐", count: min(max(rating, 1), 5))
    }
}