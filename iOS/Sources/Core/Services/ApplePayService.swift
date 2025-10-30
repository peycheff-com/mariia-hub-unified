import Foundation
import PassKit
import SwiftUI

class ApplePayService: NSObject, ObservableObject {
    static let shared = ApplePayService()

    @Published var isAvailable = false
    @Published var paymentStatus: PKPaymentAuthorizationStatus?
    @Published var errorMessage: String?

    private var paymentCompletion: ((Result<PKPayment, Error>) -> Void)?

    override init() {
        super.init()
        checkAvailability()
    }

    // MARK: - Availability Check

    func checkAvailability() {
        isAvailable = PKPaymentAuthorizationController.canMakePayments()
    }

    // MARK: - Payment Request

    func createPaymentRequest(
        for booking: Booking,
        amount: Double,
        currency: String = "PLN"
    ) -> PKPaymentRequest? {
        guard isAvailable else {
            errorMessage = "Apple Pay is not available on this device"
            return nil
        }

        let paymentRequest = PKPaymentRequest()

        // Configure merchant
        paymentRequest.merchantIdentifier = ProcessInfo.processInfo.environment["APPLE_PAY_MERCHANT_ID"] ?? "merchant.com.mariiahub.ios"
        paymentRequest.countryCode = "PL"
        paymentRequest.currencyCode = currency

        // Configure payment capabilities
        paymentRequest.merchantCapabilities = [.capability3DS, .capabilityCredit, .capabilityDebit]
        paymentRequest.supportedNetworks = [.visa, .masterCard, .amex, .discover]

        // Configure payment summary items
        var paymentSummaryItems = [PKPaymentSummaryItem]()

        // Service cost
        let serviceItem = PKPaymentSummaryItem(
            label: booking.serviceId, // This would be service title
            amount: NSDecimalNumber(value: amount),
            type: .final
        )
        paymentSummaryItems.append(serviceItem)

        // Add-ons if any
        if let depositAmount = booking.depositAmount, depositAmount > 0 {
            let depositItem = PKPaymentSummaryItem(
                label: "Deposit",
                amount: NSDecimalNumber(value: depositAmount),
                type: .final
            )
            paymentSummaryItems.append(depositItem)
        }

        // Total
        let totalItem = PKPaymentSummaryItem(
            label: "Mariia Hub",
            amount: NSDecimalNumber(value: amount),
            type: .final
        )
        paymentSummaryItems.append(totalItem)

        paymentRequest.paymentSummaryItems = paymentSummaryItems

        // Add contact fields if needed
        paymentRequest.requiredBillingContactFields = [.postalAddress, .name, .phoneNumber]
        paymentRequest.requiredShippingContactFields = [.emailAddress, .name, .phoneNumber]

        // Add application data
        if let applicationData = createApplicationData(for: booking) {
            paymentRequest.applicationData = applicationData
        }

        return paymentRequest
    }

    func presentPayment(
        for booking: Booking,
        amount: Double,
        completion: @escaping (Result<PKPayment, Error>) -> Void
    ) {
        guard let paymentRequest = createPaymentRequest(for: booking, amount: amount) else {
            completion(.failure(ApplePayError.notAvailable))
            return
        }

        self.paymentCompletion = completion

        let controller = PKPaymentAuthorizationController(paymentRequest: paymentRequest)
        controller.delegate = self
        controller.present(completion: nil)
    }

    // MARK: - Helper Methods

    private func createApplicationData(for booking: Booking) -> Data? {
        let bookingData: [String: Any] = [
            "booking_id": booking.id,
            "service_id": booking.serviceId,
            "client_email": booking.clientEmail,
            "booking_date": booking.bookingDate,
            "start_time": booking.startTime
        ]

        return try? JSONSerialization.data(withJSONObject: bookingData)
    }

    private func processPayment(_ payment: PKPayment) async throws {
        // Here you would integrate with your payment processor
        // For now, simulate successful processing
        print("Processing Apple Pay payment...")
        print("Token: \(payment.token)")

        // Send payment token to your backend for processing
        // This would involve making an API call to your server
        // which would then process the payment with Stripe or another payment processor

        try await Task.sleep(nanoseconds: 2_000_000_000) // Simulate processing delay

        // Simulate success
        print("Payment processed successfully")
    }
}

// MARK: - PKPaymentAuthorizationControllerDelegate

extension ApplePayService: PKPaymentAuthorizationControllerDelegate {
    func paymentAuthorizationController(
        _ controller: PKPaymentAuthorizationController,
        didAuthorizePayment payment: PKPayment,
        handler completion: @escaping (PKPaymentAuthorizationResult) -> Void
    ) {
        Task {
            do {
                try await processPayment(payment)

                await MainActor.run {
                    self.paymentStatus = .success
                    completion(PKPaymentAuthorizationResult(status: .success, errors: nil))
                }
            } catch {
                await MainActor.run {
                    self.paymentStatus = .failure
                    self.errorMessage = error.localizedDescription
                    completion(PKPaymentAuthorizationResult(status: .failure, errors: [error]))
                }
            }
        }
    }

    func paymentAuthorizationControllerDidFinish(_ controller: PKPaymentAuthorizationController) {
        controller.dismiss()

        if let completion = paymentCompletion {
            switch paymentStatus {
            case .success:
                // We need to get the payment token, but it's not available here
                // This is a limitation - in a real implementation, you'd handle this differently
                let error = NSError(domain: "ApplePayError", code: 0, userInfo: [NSLocalizedDescriptionKey: "Payment completed successfully"])
                completion(.success(PKPayment())) // This is simplified
            case .failure:
                let error = NSError(domain: "ApplePayError", code: 1, userInfo: [NSLocalizedDescriptionKey: errorMessage ?? "Payment failed"])
                completion(.failure(error))
            case .none:
                let error = NSError(domain: "ApplePayError", code: 2, userInfo: [NSLocalizedDescriptionKey: "Payment was cancelled"])
                completion(.failure(error))
            }

            paymentCompletion = nil
        }

        // Reset status
        paymentStatus = nil
        errorMessage = nil
    }
}

// MARK: - Apple Pay Errors

enum ApplePayError: LocalizedError {
    case notAvailable
    case paymentFailed(String)
    case invalidRequest
    case processingError

    var errorDescription: String? {
        switch self {
        case .notAvailable:
            return "Apple Pay is not available on this device"
        case .paymentFailed(let message):
            return "Payment failed: \(message)"
        case .invalidRequest:
            return "Invalid payment request"
        case .processingError:
            return "Error processing payment"
        }
    }
}

// MARK: - SwiftUI Integration

struct ApplePayButton: View {
    let amount: Double
    let booking: Booking
    let onPaymentComplete: (PKPayment) -> Void
    let onError: (Error) -> Void

    @State private var isProcessing = false
    @State private var showAlert = false
    @State private var alertMessage = ""

    var body: some View {
        Button(action: {
            isProcessing = true
            ApplePayService.shared.presentPayment(for: booking, amount: amount) { result in
                DispatchQueue.main.async {
                    isProcessing = false
                    switch result {
                    case .success(let payment):
                        onPaymentComplete(payment)
                    case .failure(let error):
                        alertMessage = error.localizedDescription
                        showAlert = true
                        onError(error)
                    }
                }
            }
        }) {
            HStack {
                if isProcessing {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .scaleEffect(0.8)
                } else {
                    Image(systemName: "applelogo")
                        .font(.system(size: 16, weight: .medium))
                }

                Text("Pay with Apple Pay")
                    .font(.headline)
                    .fontWeight(.medium)
            }
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.black)
            )
            .disabled(isProcessing)
        }
        .alert("Payment Error", isPresented: $showAlert) {
            Button("OK", role: .cancel) { }
        } message: {
            Text(alertMessage)
        }
    }
}

// MARK: - Payment Status View

struct PaymentStatusView: View {
    let status: PKPaymentAuthorizationStatus?
    let errorMessage: String?

    var body: some View {
        VStack(spacing: 16) {
            if let status = status {
                switch status {
                case .success:
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 48))
                        .foregroundColor(.green)
                    Text("Payment Successful")
                        .font(.title2)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)

                case .failure:
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 48))
                        .foregroundColor(.red)
                    Text("Payment Failed")
                        .font(.title2)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)

                @unknown default:
                    EmptyView()
                }
            }

            if let errorMessage = errorMessage {
                Text(errorMessage)
                    .font(.subheadline)
                    .foregroundColor(Color(hex: "F5DEB3").opacity(0.8))
                    .multilineTextAlignment(.center)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(hex: "2d2d2d"))
        )
    }
}

// MARK: - Apple Pay Configuration

struct ApplePayConfiguration {
    static let supportedNetworks: [PKPaymentNetwork] = [
        .visa,
        .masterCard,
        .amex,
        .discover,
        .maestro,
        .chinaUnionPay,
        .interac,
        .privateLabel
    ]

    static let merchantCapabilities: PKMerchantCapability = [
        .capability3DS,
        .capabilityCredit,
        .capabilityDebit,
        .capabilityEMV
    ]

    static let requiredShippingAddressFields: Set<PKAddressField> = [
        .emailAddress,
        .name,
        .phoneNumber,
        .postalAddress
    ]

    static let requiredBillingAddressFields: Set<PKAddressField> = [
        .name,
        .phoneNumber,
        .postalAddress
    ]
}

// MARK: - Payment Summary Helper

struct PaymentSummaryHelper {
    static func createPaymentSummaryItems(
        for booking: Booking,
        currency: String = "PLN"
    ) -> [PKPaymentSummaryItem] {
        var items: [PKPaymentSummaryItem] = []

        // Service item
        let serviceItem = PKPaymentSummaryItem(
            label: "Service",
            amount: NSDecimalNumber(value: booking.totalAmount),
            type: .final
        )
        items.append(serviceItem)

        // Deposit if applicable
        if let depositAmount = booking.depositAmount, depositAmount > 0 {
            let depositItem = PKPaymentSummaryItem(
                label: "Deposit",
                amount: NSDecimalNumber(value: depositAmount),
                type: .final
            )
            items.append(depositItem)
        }

        // Total
        let totalItem = PKPaymentSummaryItem(
            label: "Mariia Hub",
            amount: NSDecimalNumber(value: booking.totalAmount),
            type: .final
        )
        items.append(totalItem)

        return items
    }

    static func formatAmount(_ amount: Double, currency: String) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency
        return formatter.string(from: NSNumber(value: amount)) ?? "\(amount) \(currency)"
    }
}

// MARK: - Payment Analytics

extension ApplePayService {
    func trackPaymentAttempt(amount: Double, currency: String) {
        AnalyticsManager.shared.trackEvent("apple_pay_attempt", parameters: [
            "amount": amount,
            "currency": currency,
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ])
    }

    func trackPaymentSuccess(amount: Double, currency: String) {
        AnalyticsManager.shared.trackEvent("apple_pay_success", parameters: [
            "amount": amount,
            "currency": currency,
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ])
    }

    func trackPaymentFailure(error: String, amount: Double) {
        AnalyticsManager.shared.trackEvent("apple_pay_failure", parameters: [
            "error": error,
            "amount": amount,
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ])
    }
}