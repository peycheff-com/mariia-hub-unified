package com.mariaborysevych.beautyfitness.data.repository

import com.mariaborysevych.beautyfitness.data.local.database.dao.BookingDao
import com.mariaborysevych.beautyfitness.data.local.database.entities.BookingEntity
import com.mariaborysevych.beautyfitness.data.local.database.entities.ServiceEntity
import com.mariaborysevych.beautyfitness.data.remote.SupabaseClient
import com.mariaborysevych.beautyfitness.data.remote.Booking
import com.mariaborysevych.beautyfitness.data.remote.BookingRequest
import com.mariaborysevych.beautyfitness.data.remote.Service
import com.mariaborysevych.beautyfitness.data.remote.AvailabilitySlot
import com.mariaborysevych.beautyfitness.data.remote.BookingDraft
import com.mariaborysevych.beautyfitness.data.remote.Hold
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BookingRepository @Inject constructor(
    private val supabaseClient: SupabaseClient,
    private val bookingDao: BookingDao
) {

    // Service operations
    suspend fun getServices(serviceType: String? = null): List<Service> {
        return try {
            val services = supabaseClient.getServices(serviceType)
            // Cache services locally for offline use
            services.forEach { service ->
                bookingDao.insertService(service.toEntity())
            }
            services
        } catch (e: Exception) {
            // Fallback to cached data
            bookingDao.getServices(serviceType).map { it.toDomain() }
        }
    }

    suspend fun getServiceById(serviceId: String): Service? {
        return try {
            supabaseClient.getServiceById(serviceId)?.also { service ->
                bookingDao.insertService(service.toEntity())
            }
        } catch (e: Exception) {
            bookingDao.getServiceById(serviceId)?.toDomain()
        }
    }

    // Availability operations
    suspend fun getAvailabilitySlots(serviceId: String, date: String): List<AvailabilitySlot> {
        return try {
            supabaseClient.getAvailabilitySlots(serviceId, date)
        } catch (e: Exception) {
            emptyList()
        }
    }

    // Booking operations
    suspend fun createBooking(bookingRequest: BookingRequest): Result<Booking> {
        return try {
            val booking = supabaseClient.createBooking(bookingRequest)
            if (booking != null) {
                // Cache booking locally
                bookingDao.insertBooking(booking.toEntity())
                Result.success(booking)
            } else {
                Result.failure(Exception("Failed to create booking"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getUserBookings(userId: String): Flow<List<Booking>> {
        return try {
            // Try to fetch fresh data
            val bookings = supabaseClient.getUserBookings(userId)
            // Update local cache
            bookings.forEach { booking ->
                bookingDao.insertBooking(booking.toEntity())
            }
            bookingDao.getUserBookings(userId).map { entities ->
                entities.map { it.toDomain() }
            }
        } catch (e: Exception) {
            // Fallback to local data
            bookingDao.getUserBookings(userId).map { entities ->
                entities.map { it.toDomain() }
            }
        }
    }

    // Booking draft operations for session persistence
    suspend fun createOrUpdateBookingDraft(sessionId: String, draftData: Map<String, Any>): Result<BookingDraft> {
        return try {
            val existingDraft = supabaseClient.getBookingDraft(sessionId)
            val draft = if (existingDraft != null) {
                existingDraft.copy(
                    client_data = draftData,
                    updated_at = java.time.Instant.now().toString()
                )
            } else {
                BookingDraft(
                    session_id = sessionId,
                    client_data = draftData,
                    expires_at = java.time.Instant.now().plusSeconds(3600).toString() // 1 hour expiry
                )
            }

            val result = if (existingDraft != null) {
                supabaseClient.updateBookingDraft(sessionId, draft)
            } else {
                supabaseClient.createBookingDraft(draft)
            }

            if (result != null) {
                Result.success(result)
            } else {
                Result.failure(Exception("Failed to save booking draft"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getBookingDraft(sessionId: String): BookingDraft? {
        return try {
            supabaseClient.getBookingDraft(sessionId)
        } catch (e: Exception) {
            null
        }
    }

    // Hold operations for preventing double bookings
    suspend fun createHold(serviceId: String, date: String, timeSlot: String, sessionId: String): Result<Hold> {
        return try {
            val hold = Hold(
                service_id = serviceId,
                session_id = sessionId,
                date = date,
                time_slot = timeSlot,
                expires_at = java.time.Instant.now().plusSeconds(300).toString() // 5 minutes
            )

            val result = supabaseClient.createHold(hold)
            if (result != null) {
                Result.success(result)
            } else {
                Result.failure(Exception("Failed to create hold"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun removeHold(sessionId: String) {
        try {
            supabaseClient.removeHold(sessionId)
        } catch (e: Exception) {
            // Handle error
        }
    }

    // Offline sync operations
    suspend fun syncPendingBookings(): Result<List<Booking>> {
        return try {
            val pendingBookings = bookingDao.getPendingBookings()
            val syncedBookings = mutableListOf<Booking>()

            pendingBookings.forEach { pendingBooking ->
                val bookingRequest = BookingRequest(
                    service_id = pendingBooking.service_id,
                    client_name = pendingBooking.client_name,
                    client_email = pendingBooking.client_email,
                    client_phone = pendingBooking.client_phone,
                    booking_date = pendingBooking.booking_date,
                    start_time = pendingBooking.start_time,
                    end_time = pendingBooking.end_time,
                    total_amount = pendingBooking.total_amount,
                    currency = pendingBooking.currency,
                    deposit_amount = pendingBooking.deposit_amount,
                    location_type = pendingBooking.location_type,
                    preferences = pendingBooking.preferences,
                    notes = pendingBooking.notes,
                    user_id = pendingBooking.user_id
                )

                val result = createBooking(bookingRequest)
                if (result.isSuccess) {
                    syncedBookings.add(result.getOrNull()!!)
                    // Mark as synced in local database
                    bookingDao.markBookingAsSynced(pendingBooking.id)
                }
            }

            Result.success(syncedBookings)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Validation operations
    suspend fun validateTimeSlot(serviceId: String, date: String, timeSlot: String): Boolean {
        return try {
            val availabilitySlots = getAvailabilitySlots(serviceId, date)
            availabilitySlots.any { slot ->
                slot.start_time == timeSlot && slot.is_available &&
                (slot.capacity == null || slot.current_bookings ?: 0 < slot.capacity)
            }
        } catch (e: Exception) {
            false
        }
    }

    suspend fun checkServiceAvailability(serviceId: String): Boolean {
        return try {
            val service = getServiceById(serviceId)
            service?.is_active == true
        } catch (e: Exception) {
            false
        }
    }

    // Search and filter operations
    suspend fun searchServices(query: String, serviceType: String? = null): List<Service> {
        return try {
            val allServices = getServices(serviceType)
            allServices.filter { service ->
                service.title.contains(query, ignoreCase = true) ||
                service.description?.contains(query, ignoreCase = true) == true ||
                service.category?.contains(query, ignoreCase = true) == true ||
                service.tags?.any { tag -> tag.contains(query, ignoreCase = true) } == true
            }
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun getServicesByCategory(category: String, serviceType: String? = null): List<Service> {
        return try {
            val allServices = getServices(serviceType)
            allServices.filter { service ->
                service.category?.equals(category, ignoreCase = true) == true
            }
        } catch (e: Exception) {
            emptyList()
        }
    }

    // Analytics and insights
    suspend fun getBookingStats(userId: String): Map<String, Int> {
        return try {
            val bookings = supabaseClient.getUserBookings(userId)
            mapOf(
                "total" to bookings.size,
                "completed" to bookings.count { it.status == "completed" },
                "cancelled" to bookings.count { it.status == "cancelled" },
                "pending" to bookings.count { it.status == "pending" },
                "upcoming" to bookings.count { it.status == "confirmed" }
            )
        } catch (e: Exception) {
            emptyMap()
        }
    }
}

// Extension functions for mapping between domain and database entities
fun Service.toEntity(): ServiceEntity {
    return ServiceEntity(
        id = this.id,
        title = this.title,
        description = this.description,
        serviceType = this.service_type,
        durationMinutes = this.duration_minutes,
        price = this.price,
        currency = this.currency,
        category = this.category,
        images = this.images,
        isActive = this.is_active,
        locationType = this.location_type,
        maxCapacity = this.max_capacity,
        requiresDeposit = this.requires_deposit,
        depositPercentage = this.deposit_percentage,
        bufferMinutes = this.buffer_minutes,
        tags = this.tags,
        metadata = this.metadata,
        createdAt = this.created_at,
        updatedAt = this.updated_at
    )
}

fun ServiceEntity.toDomain(): Service {
    return Service(
        id = this.id,
        title = this.title,
        description = this.description,
        service_type = this.serviceType,
        duration_minutes = this.durationMinutes,
        price = this.price,
        currency = this.currency,
        category = this.category,
        images = this.images,
        is_active = this.isActive,
        location_type = this.locationType,
        max_capacity = this.maxCapacity,
        requires_deposit = this.requiresDeposit,
        deposit_percentage = this.depositPercentage,
        buffer_minutes = this.bufferMinutes,
        tags = this.tags,
        metadata = this.metadata,
        created_at = this.createdAt,
        updated_at = this.updatedAt
    )
}

fun Booking.toEntity(): BookingEntity {
    return BookingEntity(
        id = this.id,
        serviceId = this.service_id,
        clientName = this.client_name,
        clientEmail = this.client_email,
        clientPhone = this.client_phone,
        bookingDate = this.booking_date,
        startTime = this.start_time,
        endTime = this.end_time,
        totalAmount = this.total_amount,
        currency = this.currency,
        depositAmount = this.deposit_amount,
        status = this.status,
        paymentStatus = this.payment_status,
        stripePaymentIntentId = this.stripe_payment_intent_id,
        locationType = this.location_type,
        preferences = this.preferences,
        bookingData = this.booking_data,
        metadata = this.metadata,
        notes = this.notes,
        externalBookingId = this.external_booking_id,
        externalSource = this.external_source,
        userId = this.user_id,
        isSynced = true,
        createdAt = this.created_at,
        updatedAt = this.updated_at
    )
}

fun BookingEntity.toDomain(): Booking {
    return Booking(
        id = this.id,
        service_id = this.serviceId,
        client_name = this.clientName,
        client_email = this.clientEmail,
        client_phone = this.clientPhone,
        booking_date = this.bookingDate,
        start_time = this.startTime,
        end_time = this.endTime,
        total_amount = this.totalAmount,
        currency = this.currency,
        deposit_amount = this.depositAmount,
        status = this.status,
        payment_status = this.paymentStatus,
        stripe_payment_intent_id = this.stripePaymentIntentId,
        location_type = this.locationType,
        preferences = this.preferences,
        booking_data = this.bookingData,
        metadata = this.metadata,
        notes = this.notes,
        external_booking_id = this.externalBookingId,
        external_source = this.externalSource,
        user_id = this.userId,
        created_at = this.createdAt,
        updated_at = this.updatedAt
    )
}