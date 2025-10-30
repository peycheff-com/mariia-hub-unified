package com.mariaborysevych.beautyfitness.data.sync

import android.content.Context
import androidx.work.*
import com.mariaborysevych.beautyfitness.data.local.database.dao.*
import com.mariaborysevych.beautyfitness.data.remote.SupabaseClient
import com.mariaborysevych.beautyfitness.workers.SyncWorker
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class OfflineSyncManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val syncQueueDao: SyncQueueDao,
    private val bookingDao: BookingDao,
    private val serviceDao: ServiceDao,
    private val profileDao: ProfileDao,
    private val userPreferencesDao: UserPreferencesDao,
    private val supabaseClient: SupabaseClient
) {
    companion object {
        private const val SYNC_WORK_NAME = "offline_sync_work"
        private const val PERIODIC_SYNC_INTERVAL_HOURS = 6L
        private const val RETRY_DELAY_MINUTES = 15L
    }

    private val workManager = WorkManager.getInstance(context)

    private val _syncStatus = MutableStateFlow(SyncStatus.IDLE)
    val syncStatus: StateFlow<SyncStatus> = _syncStatus.asStateFlow()

    private val _lastSyncTime = MutableStateFlow<Long?>(null)
    val lastSyncTime: StateFlow<Long?> = _lastSyncTime.asStateFlow()

    private val _pendingSyncCount = MutableStateFlow(0)
    val pendingSyncCount: StateFlow<Int> = _pendingSyncCount.asStateFlow()

    private val syncScope = CoroutineScope(Dispatchers.IO)

    init {
        observeSyncQueue()
        setupPeriodicSync()
    }

    private fun observeSyncQueue() {
        syncScope.launch {
            syncQueueDao.getAllSyncItems().collect { syncItems ->
                _pendingSyncCount.value = syncItems.size

                // Auto-sync when there are pending items and we're online
                if (syncItems.isNotEmpty() && _syncStatus.value == SyncStatus.IDLE) {
                    scheduleImmediateSync()
                }
            }
        }
    }

    private fun setupPeriodicSync() {
        val periodicWorkRequest = PeriodicWorkRequestBuilder<SyncWorker>(
            PERIODIC_SYNC_INTERVAL_HOURS,
            TimeUnit.HOURS
        )
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .setRequiresBatteryNotLow(true)
                    .build()
            )
            .setBackoffCriteria(
                BackoffPolicy.EXPONENTIAL,
                RETRY_DELAY_MINUTES,
                TimeUnit.MINUTES
            )
            .build()

        workManager.enqueueUniquePeriodicWork(
            SYNC_WORK_NAME,
            ExistingPeriodicWorkPolicy.UPDATE,
            periodicWorkRequest
        )
    }

    fun scheduleImmediateSync() {
        val syncWorkRequest = OneTimeWorkRequestBuilder<SyncWorker>()
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()
            )
            .addTag("immediate_sync")
            .build()

        workManager.enqueueUniqueWork(
            "immediate_sync_work",
            ExistingWorkPolicy.REPLACE,
            syncWorkRequest
        )
    }

    suspend fun enqueueSyncOperation(
        entityType: String,
        entityId: String,
        operation: String,
        data: Map<String, String>? = null
    ) {
        withContext(Dispatchers.IO) {
            val syncItem = com.mariaborysevych.beautyfitness.data.local.database.entities.SyncQueueEntity(
                id = "${entityType}_${entityId}_${System.currentTimeMillis()}",
                entityType = entityType,
                entityId = entityId,
                operation = operation,
                data = data,
                retryCount = 0,
                scheduledAt = System.currentTimeMillis()
            )

            syncQueueDao.addToSyncQueue(syncItem)
        }
    }

    suspend fun syncAll(): SyncResult {
        return withContext(Dispatchers.IO) {
            try {
                _syncStatus.value = SyncStatus.SYNCING

                val syncItems = syncQueueDao.getAllSyncItems().first()
                val results = mutableListOf<SyncItemResult>()

                for (syncItem in syncItems) {
                    val result = processSyncItem(syncItem)
                    results.add(result)

                    if (result.success) {
                        syncQueueDao.removeFromSyncQueue(syncItem)
                    } else {
                        // Handle retry logic
                        handleSyncFailure(syncItem, result.error)
                    }
                }

                _lastSyncTime.value = System.currentTimeMillis()
                _syncStatus.value = SyncStatus.IDLE

                SyncResult(
                    success = true,
                    processedItems = results.size,
                    failedItems = results.count { !it.success },
                    results = results
                )

            } catch (e: Exception) {
                _syncStatus.value = SyncStatus.ERROR
                SyncResult(
                    success = false,
                    error = e.message ?: "Unknown sync error"
                )
            }
        }
    }

    private suspend fun processSyncItem(
        syncItem: com.mariaborysevych.beautyfitness.data.local.database.entities.SyncQueueEntity
    ): SyncItemResult {
        return try {
            when (syncItem.entityType) {
                "booking" -> processBookingSync(syncItem)
                "profile" -> processProfileSync(syncItem)
                "service" -> processServiceSync(syncItem)
                else -> SyncItemResult(
                    syncItemId = syncItem.id,
                    success = false,
                    error = "Unknown entity type: ${syncItem.entityType}"
                )
            }
        } catch (e: Exception) {
            SyncItemResult(
                syncItemId = syncItem.id,
                success = false,
                error = e.message ?: "Unknown processing error"
            )
        }
    }

    private suspend fun processBookingSync(
        syncItem: com.mariaborysevych.beautyfitness.data.local.database.entities.SyncQueueEntity
    ): SyncItemResult {
        return when (syncItem.operation) {
            "create" -> {
                val booking = bookingDao.getBookingById(syncItem.entityId)
                if (booking != null) {
                    val bookingRequest = com.mariaborysevych.beautyfitness.data.remote.BookingRequest(
                        service_id = booking.serviceId,
                        client_name = booking.clientName,
                        client_email = booking.clientEmail,
                        client_phone = booking.clientPhone,
                        booking_date = booking.bookingDate,
                        start_time = booking.startTime,
                        end_time = booking.endTime,
                        total_amount = booking.totalAmount,
                        currency = booking.currency,
                        deposit_amount = booking.depositAmount,
                        location_type = booking.locationType,
                        preferences = booking.preferences,
                        notes = booking.notes,
                        user_id = booking.userId
                    )

                    val result = supabaseClient.createBooking(bookingRequest)
                    if (result != null) {
                        // Update local booking with remote ID and mark as synced
                        val updatedBooking = booking.copy(
                            id = result.id,
                            isSynced = true
                        )
                        bookingDao.updateBooking(updatedBooking)

                        SyncItemResult(
                            syncItemId = syncItem.id,
                            success = true,
                            remoteId = result.id
                        )
                    } else {
                        SyncItemResult(
                            syncItemId = syncItem.id,
                            success = false,
                            error = "Failed to create booking on server"
                        )
                    }
                } else {
                    SyncItemResult(
                        syncItemId = syncItem.id,
                        success = false,
                        error = "Local booking not found"
                    )
                }
            }
            "update" -> {
                // Handle booking updates
                SyncItemResult(
                    syncItemId = syncItem.id,
                    success = false,
                    error = "Update operations not yet implemented"
                )
            }
            "delete" -> {
                // Handle booking deletions
                SyncItemResult(
                    syncItemId = syncItem.id,
                    success = false,
                    error = "Delete operations not yet implemented"
                )
            }
            else -> SyncItemResult(
                syncItemId = syncItem.id,
                success = false,
                error = "Unknown operation: ${syncItem.operation}"
            )
        }
    }

    private suspend fun processProfileSync(
        syncItem: com.mariaborysevych.beautyfitness.data.local.database.entities.SyncQueueEntity
    ): SyncItemResult {
        return when (syncItem.operation) {
            "update" -> {
                val profile = profileDao.getProfileById(syncItem.entityId)
                if (profile != null) {
                    val result = supabaseClient.updateUserProfile(profile.toDomain())
                    if (result != null) {
                        SyncItemResult(
                            syncItemId = syncItem.id,
                            success = true
                        )
                    } else {
                        SyncItemResult(
                            syncItemId = syncItem.id,
                            success = false,
                            error = "Failed to update profile on server"
                        )
                    }
                } else {
                    SyncItemResult(
                        syncItemId = syncItem.id,
                        success = false,
                        error = "Local profile not found"
                    )
                }
            }
            else -> SyncItemResult(
                syncItemId = syncItem.id,
                success = false,
                error = "Profile operation ${syncItem.operation} not yet implemented"
            )
        }
    }

    private suspend fun processServiceSync(
        syncItem: com.mariaborysevych.beautyfitness.data.local.database.entities.SyncQueueEntity
    ): SyncItemResult {
        // Services are typically read-only from the server, so we mainly handle cache refresh
        return SyncItemResult(
            syncItemId = syncItem.id,
            success = true,
            error = null
        )
    }

    private suspend fun handleSyncFailure(
        syncItem: com.mariaborysevych.beautyfitness.data.local.database.entities.SyncQueueEntity,
        error: String?
    ) {
        val maxRetries = 3
        val updatedItem = syncItem.copy(
            retryCount = syncItem.retryCount + 1,
            lastError = error,
            scheduledAt = if (syncItem.retryCount < maxRetries) {
                System.currentTimeMillis() + (RETRY_DELAY_MINUTES * 60 * 1000 * (syncItem.retryCount + 1))
            } else {
                0 // Mark for removal
            }
        )

        if (syncItem.retryCount >= maxRetries) {
            // Remove from sync queue after max retries
            syncQueueDao.removeFromSyncQueue(syncItem)
        } else {
            // Update with retry info
            syncQueueDao.addToSyncQueue(updatedItem)
        }
    }

    suspend fun refreshCache(): CacheRefreshResult {
        return withContext(Dispatchers.IO) {
            try {
                _syncStatus.value = SyncStatus.CACHING

                // Refresh services
                val services = supabaseClient.getServices()
                serviceDao.insertServices(services.map { it.toEntity() })

                // Refresh availability slots for today and next few days
                val today = java.time.LocalDate.now().toString()
                val endDate = java.time.LocalDate.now().plusDays(7).toString()

                // This would need to be implemented in the repository
                // For now, we'll just update the last sync time
                _lastSyncTime.value = System.currentTimeMillis()
                _syncStatus.value = SyncStatus.IDLE

                CacheRefreshResult(
                    success = true,
                    servicesRefreshed = services.size,
                    error = null
                )

            } catch (e: Exception) {
                _syncStatus.value = SyncStatus.ERROR
                CacheRefreshResult(
                    success = false,
                    error = e.message ?: "Cache refresh failed"
                )
            }
        }
    }

    suspend fun clearFailedSyncs() {
        withContext(Dispatchers.IO) {
            syncQueueDao.deleteOldSyncItems(System.currentTimeMillis() - TimeUnit.DAYS.toMillis(1))
        }
    }

    suspend fun forceSync() {
        scheduleImmediateSync()
    }

    fun isOnline(): Boolean {
        // Check network connectivity
        return true // Simplified - would use actual network check
    }

    suspend fun getSyncStats(): SyncStats {
        return withContext(Dispatchers.IO) {
            val pendingItems = syncQueueDao.getAllSyncItems().first()
            val failedItems = pendingItems.filter { it.retryCount > 0 }

            SyncStats(
                pendingItems = pendingItems.size,
                failedItems = failedItems.size,
                lastSyncTime = _lastSyncTime.value,
                isOnline = isOnline()
            )
        }
    }
}

enum class SyncStatus {
    IDLE,
    SYNCING,
    CACHING,
    ERROR
}

data class SyncResult(
    val success: Boolean,
    val processedItems: Int = 0,
    val failedItems: Int = 0,
    val results: List<SyncItemResult> = emptyList(),
    val error: String? = null
)

data class SyncItemResult(
    val syncItemId: String,
    val success: Boolean,
    val remoteId: String? = null,
    val error: String? = null
)

data class CacheRefreshResult(
    val success: Boolean,
    val servicesRefreshed: Int = 0,
    val error: String? = null
)

data class SyncStats(
    val pendingItems: Int,
    val failedItems: Int,
    val lastSyncTime: Long?,
    val isOnline: Boolean
)