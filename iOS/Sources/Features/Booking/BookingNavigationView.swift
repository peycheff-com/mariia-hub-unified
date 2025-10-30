import SwiftUI
import Combine

struct BookingNavigationView: View {
    @StateObject private var viewModel = BookingViewModel()
    @State private var showConfirmation = false
    @State private var showingError = false

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Progress indicator
                BookingProgressView(currentStep: viewModel.currentStep)
                    .padding(.top, 16)
                    .padding(.horizontal, 24)

                // Step content
                ScrollView {
                    LazyVStack(spacing: 24) {
                        stepContent
                            .transition(.asymmetric(
                                insertion: .move(edge: .trailing).combined(with: .opacity),
                                removal: .move(edge: .leading).combined(with: .opacity)
                            ))
                    }
                    .padding(.horizontal, 24)
                    .padding(.vertical, 32)
                }

                // Navigation buttons
                BookingNavigationButtons(
                    viewModel: viewModel,
                    onConfirm: {
                        showConfirmation = true
                    },
                    onError: {
                        showingError = true
                    }
                )
                .padding(.horizontal, 24)
                .padding(.bottom, 32)
            }
            .navigationTitle("Book Appointment")
            .navigationBarTitleDisplayMode(.large)
            .background(
                LinearGradient(
                    colors: [
                        Color(hex: "1a1a1a"),
                        Color(hex: "2d2d2d")
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
        }
        .accentColor(Color(hex: "D4AF37"))
        .alert("Booking Confirmation", isPresented: $showConfirmation) {
            Button("Confirm", role: .destructive) {
                viewModel.confirmBooking()
            }
            Button("Cancel", role: .cancel) {
                showConfirmation = false
            }
        } message: {
            Text("Are you sure you want to book this appointment?")
        }
        .alert("Booking Error", isPresented: $showingError) {
            Button("OK", role: .cancel) { }
        } message: {
            Text(viewModel.errorMessage ?? "An unknown error occurred")
        }
        .onAppear {
            viewModel.startBookingFlow()
        }
    }

    @ViewBuilder
    private var stepContent: some View {
        switch viewModel.currentStep {
        case .serviceSelection:
            ServiceSelectionView(
                selectedServiceType: $viewModel.selectedServiceType,
                selectedService: $viewModel.selectedService,
                availableServices: viewModel.availableServices,
                onServiceSelect: { service in
                    viewModel.selectService(service)
                },
                onContinue: {
                    viewModel.proceedToNextStep()
                }
            )
            .id("service-selection")

        case .timeSelection:
            TimeSelectionView(
                selectedService: viewModel.selectedService,
                selectedDate: $viewModel.selectedDate,
                selectedTimeSlot: $viewModel.selectedTimeSlot,
                availableSlots: viewModel.availableTimeSlots,
                isLoading: viewModel.isLoading,
                onDateSelect: { date in
                    viewModel.selectDate(date)
                },
                onTimeSlotSelect: { slot in
                    viewModel.selectTimeSlot(slot)
                },
                onContinue: {
                    viewModel.proceedToNextStep()
                }
            )
            .id("time-selection")

        case .details:
            ClientDetailsView(
                clientDetails: $viewModel.clientDetails,
                selectedService: viewModel.selectedService,
                selectedTimeSlot: viewModel.selectedTimeSlot,
                onContinue: {
                    viewModel.proceedToNextStep()
                }
            )
            .id("client-details")

        case .payment:
            PaymentView(
                bookingSummary: viewModel.bookingSummary,
                selectedPaymentMethod: $viewModel.selectedPaymentMethod,
                paymentMethods: viewModel.availablePaymentMethods,
                isLoading: viewModel.isLoading,
                onPaymentComplete: {
                    viewModel.completeBooking()
                }
            )
            .id("payment")
        }
    }
}

// MARK: - Progress View

struct BookingProgressView: View {
    let currentStep: BookingStep

    var body: some View {
        VStack(spacing: 16) {
            // Step indicators
            HStack {
                ForEach(BookingStep.allCases, id: \.self) { step in
                    StepIndicator(
                        step: step,
                        isActive: step == currentStep,
                        isCompleted: step.rawValue < currentStep.rawValue,
                        stepNumber: step.rawValue
                    )

                    if step.rawValue < BookingStep.allCases.count {
                        Spacer()
                        ProgressLine(
                            isActive: step.rawValue < currentStep.rawValue
                        )
                        Spacer()
                    }
                }
            }

            // Current step title and description
            VStack(spacing: 4) {
                Text(currentStep.title)
                    .font(.title2)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)

                Text(currentStep.description)
                    .font(.subheadline)
                    .foregroundColor(Color(hex: "F5DEB3").opacity(0.8))
            }
        }
    }
}

struct StepIndicator: View {
    let step: BookingStep
    let isActive: Bool
    let isCompleted: Bool
    let stepNumber: Int

    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                Circle()
                    .fill(backgroundColor)
                    .frame(width: 32, height: 32)
                    .overlay(
                        Circle()
                            .stroke(borderColor, lineWidth: 2)
                    )

                if isCompleted {
                    Image(systemName: "checkmark")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)
                } else {
                    Text("\(stepNumber)")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(textColor)
                }
            }

            Text(step.localizedName)
                .font(.caption)
                .foregroundColor(isActive ? Color(hex: "D4AF37") : Color(hex: "F5DEB3").opacity(0.6))
                .fontWeight(isActive ? .semibold : .medium)
        }
    }

    private var backgroundColor: Color {
        if isActive {
            return Color(hex: "D4AF37")
        } else if isCompleted {
            return Color.green
        } else {
            return Color(hex: "2d2d2d")
        }
    }

    private var borderColor: Color {
        if isActive || isCompleted {
            return Color.clear
        } else {
            return Color(hex: "F5DEB3").opacity(0.3)
        }
    }

    private var textColor: Color {
        if isActive || isCompleted {
            return .white
        } else {
            return Color(hex: "F5DEB3").opacity(0.6)
        }
    }
}

struct ProgressLine: View {
    let isActive: Bool

    var body: some View {
        Rectangle()
            .fill(isActive ? Color.green : Color(hex: "F5DEB3").opacity(0.3))
            .frame(height: 2)
    }
}

// MARK: - Navigation Buttons

struct BookingNavigationButtons: View {
    @ObservedObject var viewModel: BookingViewModel
    let onConfirm: () -> Void
    let onError: () -> Void

    var body: some View {
        HStack(spacing: 16) {
            // Back button
            if viewModel.currentStep.rawValue > 1 {
                Button(action: {
                    viewModel.goToPreviousStep()
                }) {
                    HStack {
                        Image(systemName: "chevron.left")
                        Text("Back")
                    }
                    .font(.headline)
                    .foregroundColor(Color(hex: "F5DEB3"))
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .background(
                        RoundedRectangle(cornerRadius: 28)
                            .stroke(Color(hex: "D4AF37"), lineWidth: 2)
                    )
                }
                .disabled(viewModel.isLoading)
            }

            // Continue/Complete button
            Button(action: {
                if viewModel.currentStep == .payment {
                    onConfirm()
                } else {
                    viewModel.proceedToNextStep()
                }
            }) {
                HStack {
                    if viewModel.isLoading {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            .scaleEffect(0.8)
                    } else {
                        Text(buttonText)
                        if viewModel.currentStep != .payment {
                            Image(systemName: "chevron.right")
                        }
                    }
                }
                .font(.headline)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 56)
                .background(
                    RoundedRectangle(cornerRadius: 28)
                        .fill(
                            LinearGradient(
                                colors: [Color(hex: "D4AF37"), Color(hex: "B8860B")],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .shadow(color: Color(hex: "D4AF37").opacity(0.3), radius: 10, x: 0, y: 5)
                )
            }
            .disabled(!viewModel.canProceed || viewModel.isLoading)
        }
    }

    private var buttonText: String {
        switch viewModel.currentStep {
        case .serviceSelection, .timeSelection, .details:
            return "Continue"
        case .payment:
            return "Complete Booking"
        }
    }
}

// MARK: - Service Selection View

struct ServiceSelectionView: View {
    @Binding var selectedServiceType: ServiceType?
    @Binding var selectedService: Service?
    let availableServices: [Service]
    let onServiceSelect: (Service) -> Void
    let onContinue: () -> Void

    var body: some View {
        VStack(spacing: 24) {
            if selectedServiceType == nil {
                // Service type selection
                VStack(spacing: 16) {
                    Text("What brings you here today?")
                        .font(.title2)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)

                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 16) {
                        ForEach(ServiceType.allCases, id: \.self) { type in
                            ServiceTypeCard(
                                type: type,
                                isSelected: selectedServiceType == type
                            ) {
                                withAnimation(.easeInOut(duration: 0.3)) {
                                    selectedServiceType = type
                                }
                            }
                        }
                    }
                }
            } else {
                // Service selection for chosen type
                VStack(spacing: 16) {
                    HStack {
                        Button(action: {
                            withAnimation(.easeInOut(duration: 0.3)) {
                                selectedServiceType = nil
                                selectedService = nil
                            }
                        }) {
                            HStack {
                                Image(systemName: "chevron.left")
                                Text("Change Type")
                            }
                            .font(.subheadline)
                            .foregroundColor(Color(hex: "D4AF37"))
                        }
                        Spacer()
                    }

                    Text("Select a service")
                        .font(.title2)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)

                    LazyVStack(spacing: 12) {
                        ForEach(filteredServices, id: \.id) { service in
                            ServiceCard(
                                service: service,
                                isSelected: selectedService?.id == service.id
                            ) {
                                onServiceSelect(service)
                            }
                        }
                    }
                }
            }
        }
    }

    private var filteredServices: [Service] {
        guard let serviceType = selectedServiceType else { return [] }
        return availableServices.filter { $0.serviceType == serviceType }
    }
}

struct ServiceTypeCard: View {
    let type: ServiceType
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 16) {
                Image(systemName: type.iconName)
                    .font(.system(size: 40))
                    .foregroundColor(type.color)

                VStack(spacing: 4) {
                    Text(type.localizedName)
                        .font(.title3)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)

                    Text(subtitle)
                        .font(.subheadline)
                        .foregroundColor(Color(hex: "F5DEB3").opacity(0.8))
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 160)
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(backgroundColor)
                    .overlay(
                        RoundedRectangle(cornerRadius: 20)
                            .stroke(borderColor, lineWidth: 2)
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
    }

    private var backgroundColor: Color {
        isSelected ? Color(hex: "D4AF37").opacity(0.2) : Color(hex: "2d2d2d")
    }

    private var borderColor: Color {
        isSelected ? Color(hex: "D4AF37") : Color(hex: "F5DEB3").opacity(0.3)
    }

    private var subtitle: String {
        switch type {
        case .beauty: return "PMU • Brows • Lips"
        case .fitness: return "Training • Coaching"
        case .lifestyle: return "Wellness • Recovery"
        }
    }
}

struct ServiceCard: View {
    let service: Service
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                // Service image placeholder
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color(hex: "D4AF37").opacity(0.2))
                    .frame(width: 80, height: 80)
                    .overlay(
                        Image(systemName: service.serviceType.iconName)
                            .font(.system(size: 24))
                            .foregroundColor(Color(hex: "D4AF37"))
                    )

                // Service details
                VStack(alignment: .leading, spacing: 4) {
                    Text(service.title)
                        .font(.headline)
                        .foregroundColor(.white)
                        .multilineTextAlignment(.leading)

                    if let description = service.description {
                        Text(description)
                            .font(.subheadline)
                            .foregroundColor(Color(hex: "F5DEB3").opacity(0.8))
                            .lineLimit(2)
                            .multilineTextAlignment(.leading)
                    }

                    HStack(spacing: 16) {
                        Label("\(service.durationMinutes) min", systemImage: "clock")
                            .font(.caption)
                            .foregroundColor(Color(hex: "F5DEB3").opacity(0.7))

                        Label("\(Int(service.price)) PLN", systemImage: "zlotysign.circle")
                            .font(.caption)
                            .foregroundColor(Color(hex: "D4AF37"))
                    }
                }

                Spacer()

                // Selection indicator
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 24))
                    .foregroundColor(isSelected ? Color(hex: "D4AF37") : Color(hex: "F5DEB3").opacity(0.5))
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(backgroundColor)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(borderColor, lineWidth: 2)
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
    }

    private var backgroundColor: Color {
        isSelected ? Color(hex: "D4AF37").opacity(0.2) : Color(hex: "2d2d2d")
    }

    private var borderColor: Color {
        isSelected ? Color(hex: "D4AF37") : Color(hex: "F5DEB3").opacity(0.3)
    }
}

// MARK: - Time Selection View

struct TimeSelectionView: View {
    let selectedService: Service?
    @Binding var selectedDate: Date?
    @Binding var selectedTimeSlot: AvailabilitySlot?
    let availableSlots: [AvailabilitySlot]
    let isLoading: Bool
    let onDateSelect: (Date) -> Void
    let onTimeSlotSelect: (AvailabilitySlot) -> Void
    let onContinue: () -> Void

    @State private var showingDatePicker = false

    var body: some View {
        VStack(spacing: 24) {
            // Date selection
            VStack(spacing: 16) {
                Text("Select Date")
                    .font(.title2)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)

                Button(action: {
                    showingDatePicker = true
                }) {
                    HStack {
                        Image(systemName: "calendar")
                        Text(selectedDate?.formatted(date: .abbreviated, time: .omitted) ?? "Choose Date")
                        Spacer()
                        Image(systemName: "chevron.down")
                    }
                    .padding(16)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color(hex: "2d2d2d"))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color(hex: "D4AF37"), lineWidth: 1)
                            )
                    )
                }
                .foregroundColor(.white)
            }

            // Time slots
            if selectedDate != nil {
                VStack(spacing: 16) {
                    Text("Available Times")
                        .font(.title2)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)

                    if isLoading {
                        ProgressView("Loading available times...")
                            .progressViewStyle(CircularProgressViewStyle(tint: Color(hex: "D4AF37")))
                            .foregroundColor(Color(hex: "F5DEB3"))
                    } else if groupedTimeSlots.isEmpty {
                        Text("No available time slots for this date")
                            .font(.subheadline)
                            .foregroundColor(Color(hex: "F5DEB3").opacity(0.8))
                    } else {
                        LazyVStack(spacing: 16) {
                            ForEach(groupedTimeSlots.keys.sorted(), id: \.self) { timePeriod in
                                VStack(alignment: .leading, spacing: 8) {
                                    Text(timePeriod)
                                        .font(.subheadline)
                                        .fontWeight(.semibold)
                                        .foregroundColor(Color(hex: "D4AF37"))
                                        .padding(.horizontal, 4)

                                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 3), spacing: 8) {
                                        ForEach(groupedTimeSlots[timePeriod] ?? [], id: \.id) { slot in
                                            TimeSlotCard(
                                                slot: slot,
                                                isSelected: selectedTimeSlot?.id == slot.id
                                            ) {
                                                onTimeSlotSelect(slot)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        .sheet(isPresented: $showingDatePicker) {
            DatePickerView(
                selectedDate: $selectedDate,
                onDateSelect: onDateSelect
            )
        }
    }

    private var groupedTimeSlots: [String: [AvailabilitySlot]] {
        Dictionary(grouping: availableSlots) { slot in
            let hour = Int(slot.startTime.prefix(2)) ?? 0
            switch hour {
            case 0..<12: return "Morning"
            case 12..<17: return "Afternoon"
            default: return "Evening"
            }
        }
    }
}

struct TimeSlotCard: View {
    let slot: AvailabilitySlot
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Text(formattedTime(slot.startTime))
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(isSelected ? .black : .white)

                if slot.availableSpots > 1 {
                    Text("\(slot.availableSpots) spots")
                        .font(.caption2)
                        .foregroundColor(isSelected ? .black.opacity(0.7) : Color(hex: "F5DEB3").opacity(0.7))
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .padding(.horizontal, 4)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(backgroundColor)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(borderColor, lineWidth: 1)
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
        .disabled(slot.isBooked)
    }

    private var backgroundColor: Color {
        if slot.isBooked {
            return Color.gray.opacity(0.3)
        } else if isSelected {
            return Color(hex: "D4AF37")
        } else {
            return Color(hex: "2d2d2d")
        }
    }

    private var borderColor: Color {
        if slot.isBooked {
            return Color.gray.opacity(0.5)
        } else if isSelected {
            return Color(hex: "D4AF37")
        } else {
            return Color(hex: "F5DEB3").opacity(0.3)
        }
    }

    private func formattedTime(_ time: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        if let date = formatter.date(from: time) {
            formatter.timeStyle = .short
            return formatter.string(from: date)
        }
        return time
    }
}

struct DatePickerView: View {
    @Binding var selectedDate: Date?
    let onDateSelect: (Date) -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            VStack {
                DatePicker(
                    "Select Appointment Date",
                    selection: Binding(
                        get: { selectedDate ?? Date() },
                        set: { newDate in
                            selectedDate = newDate
                        }
                    ),
                    in: Date()...,
                    displayedComponents: .date
                )
                .datePickerStyle(.graphical)
                .padding()

                Spacer()
            }
            .navigationTitle("Choose Date")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        if let date = selectedDate {
                            onDateSelect(date)
                        }
                        dismiss()
                    }
                    .fontWeight(.semibold)
                    .foregroundColor(Color(hex: "D4AF37"))
                }

                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Client Details View

struct ClientDetailsView: View {
    @Binding var clientDetails: ClientDetails?
    let selectedService: Service?
    let selectedTimeSlot: AvailabilitySlot?
    let onContinue: () -> Void

    @State private var name = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var notes = ""

    var body: some View {
        VStack(spacing: 24) {
            // Booking summary
            if let service = selectedService,
               let timeSlot = selectedTimeSlot {
                BookingSummaryCard(
                    service: service,
                    timeSlot: timeSlot
                )
            }

            // Client information form
            VStack(spacing: 20) {
                Text("Your Information")
                    .font(.title2)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)

                VStack(spacing: 16) {
                    // Name field
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Full Name")
                            .font(.subheadline)
                            .foregroundColor(Color(hex: "F5DEB3"))

                        TextField("Enter your full name", text: $name)
                            .textFieldStyle(LuxuryTextFieldStyle())
                    }

                    // Email field
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Email Address")
                            .font(.subheadline)
                            .foregroundColor(Color(hex: "F5DEB3"))

                        TextField("Enter your email", text: $email)
                            .textFieldStyle(LuxuryTextFieldStyle())
                            .keyboardType(.emailAddress)
                            .autocapitalization(.none)
                    }

                    // Phone field
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Phone Number")
                            .font(.subheadline)
                            .foregroundColor(Color(hex: "F5DEB3"))

                        TextField("Enter your phone number", text: $phone)
                            .textFieldStyle(LuxuryTextFieldStyle())
                            .keyboardType(.phonePad)
                    }

                    // Notes field
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Special Requests (Optional)")
                            .font(.subheadline)
                            .foregroundColor(Color(hex: "F5DEB3"))

                        TextField("Any special requirements or preferences", text: $notes, axis: .vertical)
                            .textFieldStyle(LuxuryTextFieldStyle())
                            .lineLimit(3...5)
                    }
                }

                // Terms and privacy
                VStack(spacing: 8) {
                    Text("By proceeding, you agree to our Terms of Service and Privacy Policy")
                        .font(.caption)
                        .foregroundColor(Color(hex: "F5DEB3").opacity(0.7))
                        .multilineTextAlignment(.center)

                    HStack {
                        Button("Terms of Service") {
                            // Open terms
                        }
                        .foregroundColor(Color(hex: "D4AF37"))
                        .font(.caption)

                        Text("•")
                            .foregroundColor(Color(hex: "F5DEB3").opacity(0.7))

                        Button("Privacy Policy") {
                            // Open privacy policy
                        }
                        .foregroundColor(Color(hex: "D4AF37"))
                        .font(.caption)
                    }
                }
            }
        }
        .onAppear {
            loadClientDetails()
        }
        .onChange(of: [name, email, phone, notes]) { _ in
            saveClientDetails()
        }
    }

    private func loadClientDetails() {
        if let existingDetails = clientDetails {
            name = existingDetails.name
            email = existingDetails.email
            phone = existingDetails.phone ?? ""
            notes = existingDetails.notes ?? ""
        }
    }

    private func saveClientDetails() {
        clientDetails = ClientDetails(
            name: name,
            email: email,
            phone: phone.isEmpty ? nil : phone,
            notes: notes.isEmpty ? nil : notes,
            preferences: nil
        )
    }
}

struct BookingSummaryCard: View {
    let service: Service
    let timeSlot: AvailabilitySlot

    var body: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Service")
                        .font(.caption)
                        .foregroundColor(Color(hex: "F5DEB3").opacity(0.7))
                    Text(service.title)
                        .font(.headline)
                        .foregroundColor(.white)
                }
                Spacer()
                Text("\(Int(service.price)) PLN")
                    .font(.headline)
                    .foregroundColor(Color(hex: "D4AF37"))
            }

            Divider()
                .background(Color(hex: "F5DEB3").opacity(0.3))

            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Date & Time")
                        .font(.caption)
                        .foregroundColor(Color(hex: "F5DEB3").opacity(0.7))
                    Text("\(formatDate(timeSlot.date)) at \(formatTime(timeSlot.startTime))")
                        .font(.subheadline)
                        .foregroundColor(.white)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 4) {
                    Text("Duration")
                        .font(.caption)
                        .foregroundColor(Color(hex: "F5DEB3").opacity(0.7))
                    Text("\(service.durationMinutes) min")
                        .font(.subheadline)
                        .foregroundColor(.white)
                }
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(hex: "2d2d2d"))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color(hex: "D4AF37"), lineWidth: 1)
                )
        )
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
}

struct LuxuryTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color(hex: "1a1a1a"))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color(hex: "F5DEB3").opacity(0.3), lineWidth: 1)
                    )
            )
            .foregroundColor(.white)
            .accentColor(Color(hex: "D4AF37"))
    }
}

// MARK: - Payment View

struct PaymentView: View {
    let bookingSummary: BookingSummary?
    @Binding var selectedPaymentMethod: PaymentMethod?
    let paymentMethods: [PaymentMethod]
    let isLoading: Bool
    let onPaymentComplete: () -> Void

    var body: some View {
        VStack(spacing: 24) {
            if let summary = bookingSummary {
                // Booking summary
                VStack(spacing: 16) {
                    Text("Booking Summary")
                        .font(.title2)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)

                    BookingSummaryDetails(summary: summary)
                }

                // Payment method selection
                VStack(spacing: 16) {
                    Text("Payment Method")
                        .font(.title2)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)

                    LazyVStack(spacing: 12) {
                        ForEach(paymentMethods, id: \.self) { method in
                            PaymentMethodCard(
                                method: method,
                                isSelected: selectedPaymentMethod == method
                            ) {
                                selectedPaymentMethod = method
                            }
                        }
                    }
                }

                // Pay button
                Button(action: onPaymentComplete) {
                    HStack {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(0.8)
                        } else {
                            Image(systemName: "lock.fill")
                            Text("Pay \(summary.totalAmount, specifier: "%.2f") PLN")
                        }
                    }
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .background(
                        RoundedRectangle(cornerRadius: 28)
                            .fill(
                                LinearGradient(
                                    colors: [Color(hex: "D4AF37"), Color(hex: "B8860B")],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .shadow(color: Color(hex: "D4AF37").opacity(0.3), radius: 10, x: 0, y: 5)
                    )
                }
                .disabled(selectedPaymentMethod == nil || isLoading)
            }
        }
    }
}

struct BookingSummaryDetails: View {
    let summary: BookingSummary

    var body: some View {
        VStack(spacing: 12) {
            // Service details
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(summary.serviceTitle)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.white)
                    Text("\(summary.duration) min")
                        .font(.caption)
                        .foregroundColor(Color(hex: "F5DEB3").opacity(0.7))
                }
                Spacer()
                Text("\(summary.servicePrice, specifier: "%.2f") PLN")
                    .font(.subheadline)
                    .foregroundColor(.white)
            }

            // Appointment details
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(summary.date) at \(summary.time)")
                        .font(.subheadline)
                        .foregroundColor(.white)
                    Text(summary.locationType.localizedName)
                        .font(.caption)
                        .foregroundColor(Color(hex: "F5DEB3").opacity(0.7))
                }
                Spacer()
            }

            // Add-ons
            if !summary.addons.isEmpty {
                ForEach(summary.addons, id: \.name) { addon in
                    HStack {
                        Text(addon.name)
                            .font(.caption)
                            .foregroundColor(Color(hex: "F5DEB3").opacity(0.8))
                        Spacer()
                        Text("\(addon.price, specifier: "%.2f") PLN")
                            .font(.caption)
                            .foregroundColor(.white)
                    }
                }
            }

            Divider()
                .background(Color(hex: "F5DEB3").opacity(0.3))

            // Total
            HStack {
                Text("Total")
                    .font(.headline)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                Spacer()
                Text("\(summary.totalAmount, specifier: "%.2f") PLN")
                    .font(.headline)
                    .fontWeight(.semibold)
                    .foregroundColor(Color(hex: "D4AF37"))
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(hex: "2d2d2d"))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color(hex: "D4AF37"), lineWidth: 1)
                )
        )
    }
}

struct PaymentMethodCard: View {
    let method: PaymentMethod
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                Image(systemName: method.iconName)
                    .font(.system(size: 24))
                    .foregroundColor(Color(hex: "D4AF37"))
                    .frame(width: 40)

                Text(method.localizedName)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)

                Spacer()

                // Selection indicator
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 20))
                    .foregroundColor(isSelected ? Color(hex: "D4AF37") : Color(hex: "F5DEB3").opacity(0.5))
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(backgroundColor)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(borderColor, lineWidth: 2)
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
    }

    private var backgroundColor: Color {
        isSelected ? Color(hex: "D4AF37").opacity(0.2) : Color(hex: "2d2d2d")
    }

    private var borderColor: Color {
        isSelected ? Color(hex: "D4AF37") : Color(hex: "F5DEB3").opacity(0.3)
    }
}

// MARK: - Booking Summary Model

struct BookingSummary {
    let serviceTitle: String
    let servicePrice: Double
    let duration: Int
    let date: String
    let time: String
    let locationType: LocationType
    let addons: [BookingAddon]
    let totalAmount: Double
}

struct BookingAddon {
    let name: String
    let price: Double
}