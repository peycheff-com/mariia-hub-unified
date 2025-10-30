import Foundation
import Combine
import SwiftUI

@MainActor
class BookingViewModel: ObservableObject {
    @Published var currentStep: BookingStep = .serviceSelection
    @Published var selectedServiceType: ServiceType?
    @Published var selectedService: Service?
    @Published var selectedDate: Date?
    @Published var selectedTimeSlot: AvailabilitySlot?
    @Published var clientDetails: ClientDetails?
    @Published var selectedPaymentMethod: PaymentMethod?
    @Published var isLoading = false
    @Published var errorMessage: String?

    // Available data
    @Published var availableServices: [Service] = []
    @Published var availableTimeSlots: [AvailabilitySlot] = []
    @Published var availablePaymentMethods: [PaymentMethod] = [.applePay, .stripe]

    // Computed properties
    var canProceed: Bool {
        switch currentStep {
        case .serviceSelection:
            return selectedService != nil
        case .timeSelection:
            return selectedDate != nil && selectedTimeSlot != nil
        case .details:
            return clientDetails?.email.isEmpty == false &&
                   clientDetails?.name.isEmpty == false
        case .payment:
            return selectedPaymentMethod != nil
        }
    }

    var bookingSummary: BookingSummary? {
        guard let service = selectedService,
              let timeSlot = selectedTimeSlot else { return nil }

        return BookingSummary(
            serviceTitle: service.title,
            servicePrice: service.price,
            duration: service.durationMinutes,
            date: formatDate(timeSlot.date),
            time: formatTime(timeSlot.startTime),
            locationType: timeSlot.locationType ?? .studio,
            addons: [],
            totalAmount: service.price
        )
    }

    private let supabaseManager = SupabaseManager.shared
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Booking Flow Management

    func startBookingFlow() {
        loadAvailableServices()
        currentStep = .serviceSelection
    }

    func proceedToNextStep() {
        guard canProceed else { return }

        withAnimation(.easeInOut(duration: 0.3)) {
            switch currentStep {
            case .serviceSelection:
                currentStep = .timeSelection
                loadAvailableTimeSlots()
            case .timeSelection:
                currentStep = .details
            case .details:
                currentStep = .payment
            case .payment:
                completeBooking()
            }
        }
    }

    func goToPreviousStep() {
        withAnimation(.easeInOut(duration: 0.3)) {
            switch currentStep {
            case .serviceSelection:
                break // Can't go back from first step
            case .timeSelection:
                currentStep = .serviceSelection
            case .details:
                currentStep = .timeSelection
            case .payment:
                currentStep = .details
            }
        }
    }

    // MARK: - Service Selection

    func selectService(_ service: Service) {
        selectedService = service
        selectedServiceType = service.serviceType
    }

    private func loadAvailableServices() {
        Task {
            do {
                let services = try await supabaseManager.fetchServices(isActive: true)
                await MainActor.run {
                    self.availableServices = services
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = "Failed to load services: \(error.localizedDescription)"
                }
            }
        }
    }

    // MARK: - Time Selection

    func selectDate(_ date: Date) {
        selectedDate = date
        selectedTimeSlot = nil
        loadAvailableTimeSlots()
    }

    func selectTimeSlot(_ timeSlot: AvailabilitySlot) {
        selectedTimeSlot = timeSlot
    }

    private func loadAvailableTimeSlots() {
        guard let service = selectedService,
              let selectedDate = selectedDate else { return }

        isLoading = true

        Task {
            do {
                let endDate = Calendar.current.date(byAdding: .day, value: 7, to: selectedDate) ?? selectedDate
                let slots = try await supabaseManager.fetchAvailabilitySlots(
                    for: service.id,
                    from: selectedDate,
                    to: endDate
                )

                let filteredSlots = slots.filter { slot in
                    let slotDate = parseDate(slot.date)
                    return Calendar.current.isDate(slotDate, inSameDayAs: selectedDate)
                }

                await MainActor.run {
                    self.availableTimeSlots = filteredSlots
                    self.isLoading = false
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = "Failed to load available times: \(error.localizedDescription)"
                    self.isLoading = false
                }
            }
        }
    }

    // MARK: - Payment

    func confirmBooking() {
        completeBooking()
    }

    func completeBooking() {
        guard canProceed else { return }

        isLoading = true
        errorMessage = nil

        Task {
            do {
                // Create booking
                let booking = await createBookingObject()

                _ = try await supabaseManager.createBooking(booking)

                // Handle payment if needed
                if let paymentMethod = selectedPaymentMethod {
                    try await processPayment(paymentMethod, for: booking)
                }

                await MainActor.run {
                    self.isLoading = false
                    self.resetBookingFlow()

                    // Show success notification
                    NotificationManager.shared.showBookingConfirmation(booking: booking)

                    // Schedule reminders
                    NotificationManager.shared.scheduleBookingReminder(booking: booking)
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = "Booking failed: \(error.localizedDescription)"
                    self.isLoading = false
                }
            }
        }
    }

    private func createBookingObject() async -> Booking {
        guard let service = selectedService,
              let timeSlot = selectedTimeSlot,
              let details = clientDetails else {
            fatalError("Missing required booking information")
        }

        return Booking(
            id: UUID().uuidString,
            serviceId: service.id,
            clientId: nil, // Will be set when user is logged in
            clientName: details.name,
            clientEmail: details.email,
            clientPhone: details.phone,
            bookingDate: timeSlot.date,
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime,
            totalAmount: service.price,
            currency: service.currency,
            status: .pending,
            paymentStatus: .pending,
            depositAmount: service.requiresDeposit == true ? (service.price * (service.depositPercentage ?? 20) / 100) : nil,
            notes: details.notes,
            preferences: BookingPreferences(
                communicationChannel: "app",
                reminderTiming: "1hour",
                specialRequests: details.notes,
                consent: ConsentData(
                    photoConsent: false,
                    communicationConsent: true,
                    dataProcessingConsent: true,
                    marketingConsent: false
                )
            ),
            locationType: timeSlot.locationType,
            bookingData: BookingData(
                selectedAddons: [],
                packageBooking: false,
                groupId: nil,
                customDuration: nil,
                locationDetails: nil
            ),
            metadata: ["source": "ios_app"],
            externalBookingId: nil,
            externalSource: nil,
            stripePaymentIntentId: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
    }

    private func processPayment(_ method: PaymentMethod, for booking: Booking) async throws {
        switch method {
        case .applePay:
            try await processApplePay(for: booking)
        case .stripe:
            try await processStripePayment(for: booking)
        case .cash, .bankTransfer:
            // Handle offline payment methods
            break
        }
    }

    private func processApplePay(for booking: Booking) async throws {
        // Implement Apple Pay integration
        print("Processing Apple Pay payment for booking \(booking.id)")
    }

    private func processStripePayment(for booking: Booking) async throws {
        // Implement Stripe payment integration
        print("Processing Stripe payment for booking \(booking.id)")
    }

    // MARK: - Booking State Management

    func resetBookingFlow() {
        withAnimation(.easeInOut(duration: 0.3)) {
            currentStep = .serviceSelection
            selectedServiceType = nil
            selectedService = nil
            selectedDate = nil
            selectedTimeSlot = nil
            clientDetails = nil
            selectedPaymentMethod = nil
            availableTimeSlots = []
            errorMessage = nil
        }
    }

    func saveBookingDraft() {
        // Save current booking state to UserDefaults for persistence
        let draft = BookingFlowState(
            serviceId: selectedService?.id ?? "",
            serviceType: selectedServiceType ?? .beauty,
            selectedDate: selectedDate,
            selectedTimeSlot: selectedTimeSlot,
            clientDetails: clientDetails,
            selectedAddons: [],
            specialRequests: clientDetails?.notes,
            paymentMethod: selectedPaymentMethod,
            currentStep: currentStep,
            isCompleted: false
        )

        if let encoded = try? JSONEncoder().encode(draft) {
            UserDefaults.standard.set(encoded, forKey: "bookingDraft")
        }
    }

    func loadBookingDraft() {
        guard let data = UserDefaults.standard.data(forKey: "bookingDraft"),
              let draft = try? JSONDecoder().decode(BookingFlowState.self, from: data) else {
            return
        }

        // Restore booking state
        currentStep = draft.currentStep
        selectedServiceType = draft.serviceType
        selectedDate = draft.selectedDate
        selectedTimeSlot = draft.selectedTimeSlot
        clientDetails = draft.clientDetails
        selectedPaymentMethod = draft.paymentMethod

        // Load service details
        Task {
            if let serviceId = draft.serviceId as String? {
                do {
                    let service = try await supabaseManager.fetchService(with: serviceId)
                    await MainActor.run {
                        self.selectedService = service
                    }
                } catch {
                    print("Failed to load service from draft: \(error)")
                }
            }
        }
    }

    // MARK: - Helper Methods

    private func parseDate(_ dateString: String) -> Date {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: dateString) ?? Date()
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

    private func formatTime(_ timeString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        if let date = formatter.date(from: timeString) {
            formatter.timeStyle = .short
            return formatter.string(from: date)
        }
        return timeString
    }

    // MARK: - Validation

    func validateCurrentStep() -> [String] {
        var errors: [String] = []

        switch currentStep {
        case .serviceSelection:
            if selectedService == nil {
                errors.append("Please select a service")
            }
        case .timeSelection:
            if selectedDate == nil {
                errors.append("Please select a date")
            }
            if selectedTimeSlot == nil {
                errors.append("Please select a time slot")
            }
        case .details:
            if clientDetails?.name.isEmpty == true {
                errors.append("Please enter your name")
            }
            if clientDetails?.email.isEmpty == true {
                errors.append("Please enter your email")
            }
            if let email = clientDetails?.email, !isValidEmail(email) {
                errors.append("Please enter a valid email address")
            }
        case .payment:
            if selectedPaymentMethod == nil {
                errors.append("Please select a payment method")
            }
        }

        return errors
    }

    private func isValidEmail(_ email: String) -> Bool {
        let emailRegEx = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPred = NSPredicate(format:"SELF MATCHES %@", emailRegEx)
        return emailPred.evaluate(with: email)
    }
}

// MARK: - Booking State Extensions

extension BookingFlowState: Codable {
    enum CodingKeys: String, CodingKey {
        case id, serviceId, serviceType, selectedDate, selectedTimeSlot
        case clientDetails, selectedAddons, specialRequests
        case paymentMethod, currentStep, isCompleted
    }
}

extension ClientDetails: Codable {
    enum CodingKeys: String, CodingKey {
        case name, email, phone, notes, preferences
    }
}

// MARK: - Analytics Integration

extension BookingViewModel {
    func trackBookingStepCompletion() {
        let analyticsData: [String: Any] = [
            "step": currentStep.rawValue,
            "step_name": currentStep.localizedName,
            "service_type": selectedServiceType?.rawValue ?? "",
            "service_id": selectedService?.id ?? "",
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ]

        // Send to analytics
        AnalyticsManager.shared.trackEvent("booking_step_completed", parameters: analyticsData)
    }

    func trackBookingCompletion(_ booking: Booking) {
        let analyticsData: [String: Any] = [
            "booking_id": booking.id,
            "service_id": booking.serviceId,
            "service_type": selectedServiceType?.rawValue ?? "",
            "total_amount": booking.totalAmount,
            "payment_method": selectedPaymentMethod?.rawValue ?? "",
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ]

        AnalyticsManager.shared.trackEvent("booking_completed", parameters: analyticsData)
    }

    func trackBookingError(_ error: String) {
        let analyticsData: [String: Any] = [
            "step": currentStep.rawValue,
            "error_message": error,
            "service_type": selectedServiceType?.rawValue ?? "",
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ]

        AnalyticsManager.shared.trackEvent("booking_error", parameters: analyticsData)
    }
}