package com.mariaborysevych.beautyfitness.data.local.database.entities

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.mariaborysevych.beautyfitness.data.remote.Booking

@Entity(tableName = "bookings")
data class BookingEntity(
    @PrimaryKey
    val id: String,
    val serviceId: String,
    val clientName: String,
    val clientEmail: String,
    val clientPhone: String? = null,
    val bookingDate: String,
    val startTime: String,
    val endTime: String,
    val totalAmount: Int,
    val currency: String = "PLN",
    val depositAmount: Int? = null,
    val status: String = "pending",
    val paymentStatus: String? = null,
    val stripePaymentIntentId: String? = null,
    val locationType: String? = null,
    val preferences: Map<String, String>? = null,
    val bookingData: Map<String, String>? = null,
    val metadata: Map<String, String>? = null,
    val notes: String? = null,
    val externalBookingId: String? = null,
    val externalSource: String? = null,
    val userId: String? = null,
    val isSynced: Boolean = false,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

@Entity(tableName = "services")
data class ServiceEntity(
    @PrimaryKey
    val id: String,
    val title: String,
    val description: String? = null,
    val serviceType: String,
    val durationMinutes: Int,
    val price: Int,
    val currency: String = "PLN",
    val category: String? = null,
    val images: List<String>? = null,
    val isActive: Boolean = true,
    val locationType: String? = null,
    val maxCapacity: Int? = null,
    val requiresDeposit: Boolean = false,
    val depositPercentage: Int? = null,
    val bufferMinutes: Int? = null,
    val tags: List<String>? = null,
    val metadata: Map<String, String>? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

@Entity(tableName = "profiles")
data class ProfileEntity(
    @PrimaryKey
    val id: String,
    val email: String? = null,
    val fullName: String? = null,
    val avatarUrl: String? = null,
    val phone: String? = null,
    val role: String? = null,
    val preferences: Map<String, String>? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

@Entity(tableName = "availability_slots")
data class AvailabilitySlotEntity(
    @PrimaryKey
    val id: String,
    val serviceId: String,
    val date: String,
    val startTime: String,
    val endTime: String,
    val isAvailable: Boolean,
    val currentBookings: Int? = null,
    val capacity: Int? = null,
    val locationType: String? = null,
    val notes: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

@Entity(tableName = "booking_drafts")
data class BookingDraftEntity(
    @PrimaryKey
    val id: String? = null,
    val sessionId: String,
    val serviceId: String? = null,
    val serviceType: String? = null,
    val selectedDate: String? = null,
    val selectedTime: String? = null,
    val bookingDate: String? = null,
    val bookingTime: String? = null,
    val clientData: Map<String, String>? = null,
    val currentStep: Int? = null,
    val stepCompleted: Int? = null,
    val notes: String? = null,
    val userId: String? = null,
    val expiresAt: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

@Entity(tableName = "sync_queue")
data class SyncQueueEntity(
    @PrimaryKey
    val id: String,
    val entityType: String, // "booking", "profile", etc.
    val entityId: String,
    val operation: String, // "create", "update", "delete"
    val data: Map<String, String>? = null,
    val retryCount: Int = 0,
    val lastError: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val scheduledAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "user_preferences")
data class UserPreferencesEntity(
    @PrimaryKey
    val userId: String,
    val language: String = "en",
    val currency: String = "PLN",
    val notificationsEnabled: Boolean = true,
    val biometricEnabled: Boolean = false,
    val theme: String = "auto", // "light", "dark", "auto"
    val preferredLocation: String? = null,
    val preferredServiceTypes: List<String> = emptyList(),
    val lastSyncAt: Long? = null,
    val cacheEnabled: Boolean = true,
    val offlineMode: Boolean = false,
    val data: Map<String, String>? = null,
    val updatedAt: Long = System.currentTimeMillis()
)