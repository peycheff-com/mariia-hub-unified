package com.mariaborysevych.beautyfitness.data.remote

import com.mariaborysevych.beautyfitness.MariiaHubApplication
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.status.SessionStatus
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.realtime.Realtime
import io.github.jan.supabase.realtime.channel
import io.github.jan.supabase.realtime realtime
import io.github.jan.supabase.storage.Storage
import io.github.jan.supabase.storage.storage
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SupabaseClient @Inject constructor(
    private val application: MariiaHubApplication
) {
    private val client: SupabaseClient = application.supabase

    // Auth
    val auth: Auth = client.auth
    val authStatus: Flow<SessionStatus> = auth.statusAsFlow()

    // Database
    val database: Postgrest = client.postgrest

    // Realtime
    val realtime: Realtime = client.realtime

    // Storage
    val storage: Storage = client.storage

    // Auth methods
    suspend fun signIn(email: String, password: String) = auth.signInWith(email, password)
    suspend fun signUp(email: String, password: String) = auth.signUpWith(email, password)
    suspend fun signOut() = auth.signOut()
    suspend fun resetPassword(email: String) = auth.resetPasswordForEmail(email)

    // Current user
    val currentUser get() = auth.currentUserOrNull()
    val isSignedIn get() = authStatus.map { it == SessionStatus.Authenticated }

    // Generic database operations
    suspend fun <T> getAll(table: String): List<T> {
        return client.from(table).select().decodeList<T>()
    }

    suspend fun <T> getById(table: String, id: String): T? {
        return client.from(table).select {
            filter {
                eq("id", id)
            }
        }.decodeSingleOrNull<T>()
    }

    suspend fun <T> insert(table: String, data: T): T {
        return client.from(table).insert(data) {
            select()
        }.decodeSingle<T>()
    }

    suspend fun <T> update(table: String, id: String, data: T): T {
        return client.from(table).update(data) {
            select()
            filter {
                eq("id", id)
            }
        }.decodeSingle<T>()
    }

    suspend fun delete(table: String, id: String) {
        client.from(table).delete {
            filter {
                eq("id", id)
            }
        }
    }

    // Service-specific operations
    suspend fun getServices(serviceType: String? = null) = try {
        if (serviceType != null) {
            database.from("services").select {
                filter {
                    eq("service_type", serviceType)
                    eq("is_active", true)
                }
            }.decodeList<Service>()
        } else {
            database.from("services").select {
                filter {
                    eq("is_active", true)
                }
            }.decodeList<Service>()
        }
    } catch (e: Exception) {
        emptyList()
    }

    suspend fun getServiceById(id: String): Service? = try {
        getById("services", id)
    } catch (e: Exception) {
        null
    }

    suspend fun getAvailabilitySlots(serviceId: String, date: String): List<AvailabilitySlot> = try {
        database.from("availability_slots").select {
            filter {
                eq("service_id", serviceId)
                eq("date", date)
                eq("is_available", true)
            }
        }.decodeList<AvailabilitySlot>()
    } catch (e: Exception) {
        emptyList()
    }

    suspend fun createBooking(booking: BookingRequest): Booking? = try {
        insert("bookings", booking)
    } catch (e: Exception) {
        null
    }

    suspend fun getUserBookings(userId: String): List<Booking> = try {
        database.from("bookings").select {
            filter {
                eq("user_id", userId)
            }
        }.decodeList<Booking>()
    } catch (e: Exception) {
        emptyList()
    }

    // Realtime subscriptions
    fun subscribeToBookings(userId: String, onBookingChange: (Booking) -> Unit) {
        val channel = realtime.channel("user_bookings:$userId")
        channel.postgresChangeFlow<PostgresAction>(schema = "public", table = "bookings") {
            filter = "user_id=eq.$userId"
        }.collect { change ->
            when (change) {
                is PostgresAction.Insert -> onBookingChange(change.record as Booking)
                is PostgresAction.Update -> onBookingChange(change.record as Booking)
                is PostgresAction.Delete -> {} // Handle deletion if needed
            }
        }
        realtime.connect()
    }

    // Storage operations
    suspend fun uploadServiceImage(serviceId: String, imageBytes: ByteArray, fileName: String): String? = try {
        val uploadResult = storage.from("service-images").upload(
            path = "$serviceId/$fileName",
            data = imageBytes
        )
        uploadResult
    } catch (e: Exception) {
        null
    }

    suspend fun getServiceImageUrl(serviceId: String, fileName: String): String? = try {
        storage.from("service-images").publicUrl("$serviceId/$fileName")
    } catch (e: Exception) {
        null
    }

    // Profile operations
    suspend fun getUserProfile(userId: String): Profile? = try {
        getById("profiles", userId)
    } catch (e: Exception) {
        null
    }

    suspend fun updateUserProfile(profile: Profile): Profile? = try {
        update("profiles", profile.id, profile)
    } catch (e: Exception) {
        null
    }

    // Booking draft operations for session persistence
    suspend fun createBookingDraft(draft: BookingDraft): BookingDraft? = try {
        insert("booking_drafts", draft)
    } catch (e: Exception) {
        null
    }

    suspend fun updateBookingDraft(sessionId: String, draft: BookingDraft): BookingDraft? = try {
        database.from("booking_drafts").update(draft) {
            select()
            filter {
                eq("session_id", sessionId)
            }
        }.decodeSingleOrNull<BookingDraft>()
    } catch (e: Exception) {
        null
    }

    suspend fun getBookingDraft(sessionId: String): BookingDraft? = try {
        database.from("booking_drafts").select {
            filter {
                eq("session_id", sessionId)
            }
        }.decodeSingleOrNull<BookingDraft>()
    } catch (e: Exception) {
        null
    }

    // Hold operations for preventing double bookings
    suspend fun createHold(hold: Hold): Hold? = try {
        insert("holds", hold)
    } catch (e: Exception) {
        null
    }

    suspend fun removeHold(sessionId: String) {
        try {
            database.from("holds").delete {
                filter {
                    eq("session_id", sessionId)
                }
            }
        } catch (e: Exception) {
            // Handle error
        }
    }

    // Service content operations
    suspend fun getServiceContent(serviceId: String): List<ServiceContent> = try {
        database.from("service_content").select {
            filter {
                eq("service_id", serviceId)
            }
        }.decodeList<ServiceContent>()
    } catch (e: Exception) {
        emptyList()
    }

    suspend fun getServiceGallery(serviceId: String): List<ServiceGallery> = try {
        database.from("service_gallery").select {
            filter {
                eq("service_id", serviceId)
                eq("is_active", true)
            }
            order("order_index")
        }.decodeList<ServiceGallery>()
    } catch (e: Exception) {
        emptyList()
    }
}

// Data classes matching the database schema
data class Service(
    val id: String,
    val title: String,
    val description: String? = null,
    val service_type: String,
    val duration_minutes: Int,
    val price: Int,
    val currency: String = "PLN",
    val category: String? = null,
    val images: List<String>? = null,
    val is_active: Boolean = true,
    val location_type: String? = null,
    val max_capacity: Int? = null,
    val requires_deposit: Boolean = false,
    val deposit_percentage: Int? = null,
    val buffer_minutes: Int? = null,
    val tags: List<String>? = null,
    val metadata: Map<String, Any>? = null,
    val created_at: String? = null,
    val updated_at: String? = null
)

data class AvailabilitySlot(
    val id: String,
    val service_id: String,
    val date: String,
    val start_time: String,
    val end_time: String,
    val is_available: Boolean,
    val current_bookings: Int? = null,
    val capacity: Int? = null,
    val location_type: String? = null,
    val notes: String? = null,
    val created_at: String? = null,
    val updated_at: String? = null
)

data class Booking(
    val id: String,
    val service_id: String,
    val client_name: String,
    val client_email: String,
    val client_phone: String? = null,
    val booking_date: String,
    val start_time: String,
    val end_time: String,
    val total_amount: Int,
    val currency: String = "PLN",
    val deposit_amount: Int? = null,
    val status: String = "pending",
    val payment_status: String? = null,
    val stripe_payment_intent_id: String? = null,
    val location_type: String? = null,
    val preferences: Map<String, Any>? = null,
    val booking_data: Map<String, Any>? = null,
    val metadata: Map<String, Any>? = null,
    val notes: String? = null,
    val external_booking_id: String? = null,
    val external_source: String? = null,
    val user_id: String? = null,
    val created_at: String? = null,
    val updated_at: String? = null
)

data class BookingRequest(
    val service_id: String,
    val client_name: String,
    val client_email: String,
    val client_phone: String? = null,
    val booking_date: String,
    val start_time: String,
    val end_time: String,
    val total_amount: Int,
    val currency: String = "PLN",
    val deposit_amount: Int? = null,
    val location_type: String? = null,
    val preferences: Map<String, Any>? = null,
    val notes: String? = null,
    val user_id: String? = null
)

data class Profile(
    val id: String,
    val email: String? = null,
    val full_name: String? = null,
    val avatar_url: String? = null,
    val phone: String? = null,
    val role: String? = null,
    val preferences: Map<String, Any>? = null,
    val created_at: String? = null,
    val updated_at: String? = null
)

data class BookingDraft(
    val id: String? = null,
    val session_id: String,
    val service_id: String? = null,
    val service_type: String? = null,
    val selected_date: String? = null,
    val selected_time: String? = null,
    val booking_date: String? = null,
    val booking_time: String? = null,
    val client_data: Map<String, Any>? = null,
    val current_step: Int? = null,
    val step_completed: Int? = null,
    val notes: String? = null,
    val user_id: String? = null,
    val expires_at: String? = null,
    val created_at: String? = null,
    val updated_at: String? = null
)

data class Hold(
    val id: String? = null,
    val service_id: String,
    val session_id: String,
    val date: String,
    val time_slot: String,
    val expires_at: String,
    val user_id: String? = null,
    val created_at: String? = null
)

data class ServiceContent(
    val id: String,
    val service_id: String,
    val title: String,
    val content: String,
    val content_type: String,
    val order_index: Int? = null,
    val created_at: String? = null,
    val updated_at: String? = null
)

data class ServiceGallery(
    val id: String,
    val service_id: String,
    val image_url: String,
    val caption: String? = null,
    val order_index: Int? = null,
    val is_active: Boolean = true,
    val created_at: String? = null,
    val updated_at: String? = null
)

sealed class PostgresAction {
    data class Insert(val record: Any) : PostgresAction()
    data class Update(val record: Any) : PostgresAction()
    data class Delete(val oldRecord: Any) : PostgresAction()
}