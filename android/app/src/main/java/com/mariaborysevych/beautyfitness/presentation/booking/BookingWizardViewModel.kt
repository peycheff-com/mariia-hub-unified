package com.mariaborysevych.beautyfitness.presentation.booking

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mariaborysevych.beautyfitness.data.repository.BookingRepository
import com.mariaborysevych.beautyfitness.presentation.booking.model.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import javax.inject.Inject

@HiltViewModel
class BookingWizardViewModel @Inject constructor(
    private val bookingRepository: BookingRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(BookingWizardUiState())
    val uiState: StateFlow<BookingWizardUiState> = _uiState.asStateFlow()

    // Generate unique session ID for this booking session
    private val sessionId = java.util.UUID.randomUUID().toString()

    init {
        loadInitialData()
    }

    private fun loadInitialData() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }

            try {
                // Load all services
                val services = bookingRepository.getServices()
                _uiState.update { currentState ->
                    currentState.copy(
                        allServices = services,
                        isLoading = false
                    )
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = "Failed to load services: ${e.message}"
                    )
                }
            }
        }
    }

    fun initializeWithService(serviceId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }

            try {
                val service = bookingRepository.getServiceById(serviceId)
                if (service != null) {
                    selectService(service)
                }
                _uiState.update { it.copy(isLoading = false) }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = "Failed to load service: ${e.message}"
                    )
                }
            }
        }
    }

    fun selectService(service: Service) {
        _uiState.update { currentState ->
            currentState.copy(
                selectedService = service,
                selectedLocation = null,
                selectedDate = null,
                selectedTimeSlot = null,
                availableTimeSlots = emptyList(),
                currentStep = 2
            )
        }

        // Load locations for this service
        loadServiceLocations(service)
    }

    fun selectLocation(location: Location) {
        _uiState.update { it.copy(selectedLocation = location) }
        saveBookingDraft()
    }

    private fun loadServiceLocations(service: Service) {
        viewModelScope.launch {
            // Default locations based on service type
            val locations = when (service.service_type) {
                "beauty" -> listOf(
                    Location("studio_warsaw", "Warsaw Studio", "studio"),
                    Location("mobile_warsaw", "Mobile - Warsaw", "mobile")
                )
                "fitness" -> listOf(
                    Location("gym_warsaw", "Warsaw Gym", "gym"),
                    Location("outdoor_warsaw", "Outdoor - Warsaw", "outdoor")
                )
                else -> emptyList()
            }

            _uiState.update {
                it.copy(
                    availableLocations = locations,
                    // Auto-select first location if only one
                    selectedLocation = if (locations.size == 1) locations.first() else null
                )
            }
        }
    }

    fun selectDate(date: LocalDate) {
        _uiState.update { currentState ->
            currentState.copy(
                selectedDate = date,
                selectedTimeSlot = null,
                availableTimeSlots = emptyList()
            )
        }

        // Load available time slots for selected date
        loadAvailableTimeSlots(date)
    }

    private fun loadAvailableTimeSlots(date: LocalDate) {
        viewModelScope.launch {
            val service = _uiState.value.selectedService ?: return@launch

            _uiState.update { it.copy(isLoading = true) }

            try {
                val dateString = date.format(DateTimeFormatter.ISO_LOCAL_DATE)
                val timeSlots = bookingRepository.getAvailabilitySlots(service.id, dateString)

                _uiState.update { currentState ->
                    currentState.copy(
                        availableTimeSlots = timeSlots.map { slot ->
                            TimeSlot(
                                id = slot.id,
                                startTime = slot.start_time,
                                endTime = slot.end_time,
                                available = slot.is_available,
                                capacity = slot.capacity ?: 1,
                                currentBookings = slot.current_bookings ?: 0
                            )
                        },
                        isLoading = false
                    )
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = "Failed to load available times: ${e.message}"
                    )
                }
            }
        }
    }

    suspend fun selectTimeSlot(timeSlot: TimeSlot): Boolean {
        // Create a hold to prevent double booking
        val date = _uiState.value.selectedDate ?: return false
        val service = _uiState.value.selectedService ?: return false

        return try {
            val holdResult = bookingRepository.createHold(
                serviceId = service.id,
                date = date.format(DateTimeFormatter.ISO_LOCAL_DATE),
                timeSlot = timeSlot.startTime,
                sessionId = sessionId
            )

            if (holdResult.isSuccess) {
                _uiState.update {
                    it.copy(
                        selectedTimeSlot = timeSlot,
                        currentStep = 3
                    )
                }
                saveBookingDraft()
                true
            } else {
                _uiState.update {
                    it.copy(
                        error = "Time slot is no longer available"
                    )
                }
                false
            }
        } catch (e: Exception) {
            _uiState.update {
                it.copy(
                    error = "Failed to select time slot: ${e.message}"
                )
            }
            false
        }
    }

    fun updateClientDetails(details: ClientDetails) {
        _uiState.update { it.copy(clientDetails = details) }
        saveBookingDraft()
    }

    fun updatePreferences(preferences: BookingPreferences) {
        _uiState.update { it.copy(bookingPreferences = preferences) }
        saveBookingDraft()
    }

    fun selectPaymentMethod(method: PaymentMethod) {
        _uiState.update { it.copy(selectedPaymentMethod = method) }
    }

    private fun saveBookingDraft() {
        viewModelScope.launch {
            val draftData = mapOf(
                "serviceId" to (_uiState.value.selectedService?.id ?: ""),
                "location" to (_uiState.value.selectedLocation?.name ?: ""),
                "date" to (_uiState.value.selectedDate?.format(DateTimeFormatter.ISO_LOCAL_DATE) ?: ""),
                "timeSlot" to (_uiState.value.selectedTimeSlot?.startTime ?: ""),
                "clientDetails" to (_uiState.value.clientDetails ?: emptyMap<String, Any>()),
                "preferences" to (_uiState.value.bookingPreferences ?: emptyMap<String, Any>()),
                "currentStep" to _uiState.value.currentStep,
                "updatedAt" to java.time.Instant.now().toString()
            )

            bookingRepository.createOrUpdateBookingDraft(sessionId, draftData)
        }
    }

    fun nextStep() {
        val currentState = _uiState.value

        if (!currentState.canProceedToNext) return

        when (currentState.currentStep) {
            1 -> {
                // Service selection - auto-advance when service is selected
                if (currentState.selectedService != null && currentState.selectedLocation != null) {
                    _uiState.update { it.copy(currentStep = 2) }
                }
            }
            2 -> {
                // Time selection - need date and time slot
                if (currentState.selectedDate != null && currentState.selectedTimeSlot != null) {
                    _uiState.update { it.copy(currentStep = 3) }
                }
            }
            3 -> {
                // Client details - need valid client information
                if (currentState.isClientDetailsValid) {
                    _uiState.update { it.copy(currentStep = 4) }
                }
            }
            4 -> {
                // Payment - handled by completeBooking
            }
        }

        saveBookingDraft()
    }

    fun previousStep() {
        val currentStep = _uiState.value.currentStep
        if (currentStep > 1) {
            _uiState.update { it.copy(currentStep = currentStep - 1) }
            saveBookingDraft()
        }
    }

    suspend fun completeBooking(onSuccess: (String) -> Unit) {
        val currentState = _uiState.value

        if (!currentState.canProceedToNext) {
            _uiState.update { it.copy(error = "Please complete all required fields") }
            return
        }

        _uiState.update { it.copy(isCreatingBooking = true) }

        try {
            val service = currentState.selectedService!!
            val clientDetails = currentState.clientDetails!!
            val bookingRequest = BookingRequest(
                service_id = service.id,
                client_name = "${clientDetails.firstName} ${clientDetails.lastName}",
                client_email = clientDetails.email,
                client_phone = clientDetails.phone,
                booking_date = currentState.selectedDate?.format(DateTimeFormatter.ISO_LOCAL_DATE)!!,
                start_time = currentState.selectedTimeSlot!!.startTime,
                end_time = currentState.selectedTimeSlot!!.endTime,
                total_amount = service.price,
                currency = service.currency,
                deposit_amount = if (service.requires_deposit) {
                    (service.price * (service.deposit_percentage ?: 20)) / 100
                } else null,
                location_type = currentState.selectedLocation?.type,
                preferences = currentState.bookingPreferences?.let { prefs ->
                    mapOf(
                        "notes" to prefs.notes,
                        "consultation" to prefs.requiresConsultation,
                        "language" to prefs.preferredLanguage
                    )
                },
                notes = currentState.bookingPreferences?.notes,
                user_id = null // Will be filled after auth integration
            )

            val bookingResult = bookingRepository.createBooking(bookingRequest)

            if (bookingResult.isSuccess) {
                val booking = bookingResult.getOrNull()!!

                // Remove the hold
                bookingRepository.removeHold(sessionId)

                // Clean up booking draft
                // bookingRepository.deleteBookingDraft(sessionId) // Implement if needed

                _uiState.update {
                    it.copy(
                        isCreatingBooking = false,
                        completedBooking = booking
                    )
                }

                onSuccess(booking.id)
            } else {
                _uiState.update {
                    it.copy(
                        isCreatingBooking = false,
                        error = "Failed to create booking: ${bookingResult.exceptionOrNull()?.message}"
                    )
                }
            }
        } catch (e: Exception) {
            _uiState.update {
                it.copy(
                    isCreatingBooking = false,
                    error = "Failed to complete booking: ${e.message}"
                )
            }
        }
    }

    fun processPayment(paymentResult: PaymentResult, onSuccess: (String) -> Unit) {
        viewModelScope.launch {
            _uiState.update { it.copy(isProcessingPayment = true) }

            try {
                if (paymentResult.status == PaymentStatus.SUCCESS) {
                    // Payment successful, complete booking
                    completeBooking(onSuccess)
                } else {
                    _uiState.update {
                        it.copy(
                            isProcessingPayment = false,
                            error = "Payment failed: ${paymentResult.errorMessage}"
                        )
                    }
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isProcessingPayment = false,
                        error = "Payment processing error: ${e.message}"
                    )
                }
            }
        }
    }

    fun handleHoldExpired() {
        _uiState.update {
            it.copy(
                error = "Your selected time slot has expired. Please select a new time.",
                selectedTimeSlot = null,
                currentStep = 2
            )
        }
        bookingRepository.removeHold(sessionId)
    }

    fun searchServices(query: String) {
        viewModelScope.launch {
            if (query.isBlank()) {
                _uiState.update { it.copy(searchResults = emptyList()) }
                return@launch
            }

            try {
                val results = bookingRepository.searchServices(query)
                _uiState.update { it.copy(searchResults = results) }
            } catch (e: Exception) {
                // Keep current results, don't show error for search
            }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
}