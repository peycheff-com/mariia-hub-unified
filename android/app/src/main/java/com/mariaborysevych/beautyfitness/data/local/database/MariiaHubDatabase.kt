package com.mariaborysevych.beautyfitness.data.local.database

import androidx.room.*
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import com.mariaborysevych.beautyfitness.data.local.database.dao.*
import com.mariaborysevych.beautyfitness.data.local.database.entities.*
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Database(
    entities = [
        ServiceEntity::class,
        BookingEntity::class,
        ProfileEntity::class,
        AvailabilitySlotEntity::class,
        BookingDraftEntity::class,
        SyncQueueEntity::class,
        UserPreferencesEntity::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class MariiaHubDatabase : RoomDatabase() {
    abstract fun serviceDao(): ServiceDao
    abstract fun bookingDao(): BookingDao
    abstract fun profileDao(): ProfileDao
    abstract fun availabilitySlotDao(): AvailabilitySlotDao
    abstract fun bookingDraftDao(): BookingDraftDao
    abstract fun syncQueueDao(): SyncQueueDao
    abstract fun userPreferencesDao(): UserPreferencesDao
}

@Singleton
class DatabaseCallback @Inject constructor() : RoomDatabase.Callback() {
    override fun onCreate(db: SupportSQLiteDatabase) {
        super.onCreate(db)
        // Create indexes for better performance
        db.execSQL("CREATE INDEX IF NOT EXISTS `index_bookings_user_id` ON `bookings` (`user_id`)")
        db.execSQL("CREATE INDEX IF NOT EXISTS `index_bookings_booking_date` ON `bookings` (`booking_date`)")
        db.execSQL("CREATE INDEX IF NOT EXISTS `index_services_service_type` ON `services` (`service_type`)")
        db.execSQL("CREATE INDEX IF NOT EXISTS `index_services_is_active` ON `services` (`is_active`)")
        db.execSQL("CREATE INDEX IF NOT EXISTS `index_availability_slots_service_id_date` ON `availability_slots` (`service_id`, `date`)")
        db.execSQL("CREATE INDEX IF NOT EXISTS `index_sync_queue_created_at` ON `sync_queue` (`created_at`)")
    }
}

// Type converters for Room
class Converters {
    @TypeConverter
    fun fromStringList(value: List<String>): String {
        return value.joinToString(",")
    }

    @TypeConverter
    fun toStringList(value: String): List<String> {
        return if (value.isEmpty()) emptyList() else value.split(",")
    }

    @TypeConverter
    fun fromStringMap(value: Map<String, String>): String {
        return value.entries.joinToString(";") { "${it.key}:${it.value}" }
    }

    @TypeConverter
    fun toStringMap(value: String): Map<String, String> {
        return if (value.isEmpty()) {
            emptyMap()
        } else {
            value.split(";").associate { entry ->
                val parts = entry.split(":", limit = 2)
                parts[0] to (if (parts.size > 1) parts[1] else "")
            }
        }
    }

    @TypeConverter
    fun fromBoolean(value: Boolean?): Int {
        return when (value) {
            true -> 1
            false -> 0
            null -> -1
        }
    }

    @TypeConverter
    fun toBoolean(value: Int): Boolean? {
        return when (value) {
            1 -> true
            0 -> false
            else -> null
        }
    }
}

// DAO interfaces
@Dao
interface ServiceDao {
    @Query("SELECT * FROM services WHERE is_active = 1")
    fun getAllActiveServices(): Flow<List<ServiceEntity>>

    @Query("SELECT * FROM services WHERE service_type = :serviceType AND is_active = 1")
    fun getServicesByType(serviceType: String): Flow<List<ServiceEntity>>

    @Query("SELECT * FROM services WHERE id = :id")
    suspend fun getServiceById(id: String): ServiceEntity?

    @Query("SELECT * FROM services WHERE title LIKE '%' || :query || '%' OR description LIKE '%' || :query || '%'")
    suspend fun searchServices(query: String): List<ServiceEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertService(service: ServiceEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertServices(services: List<ServiceEntity>)

    @Update
    suspend fun updateService(service: ServiceEntity)

    @Delete
    suspend fun deleteService(service: ServiceEntity)

    @Query("DELETE FROM services")
    suspend fun deleteAllServices()
}

@Dao
interface BookingDao {
    @Query("SELECT * FROM bookings WHERE user_id = :userId ORDER BY booking_date DESC, start_time DESC")
    fun getUserBookings(userId: String): Flow<List<BookingEntity>>

    @Query("SELECT * FROM bookings WHERE id = :id")
    suspend fun getBookingById(id: String): BookingEntity?

    @Query("SELECT * FROM bookings WHERE booking_date >= :date ORDER BY booking_date ASC, start_time ASC")
    fun getUpcomingBookings(date: String): Flow<List<BookingEntity>>

    @Query("SELECT * FROM bookings WHERE status = 'pending' AND is_synced = 0")
    suspend fun getPendingBookings(): List<BookingEntity>

    @Query("UPDATE bookings SET is_synced = 1 WHERE id = :id")
    suspend fun markBookingAsSynced(id: String)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBooking(booking: BookingEntity)

    @Update
    suspend fun updateBooking(booking: BookingEntity)

    @Delete
    suspend fun deleteBooking(booking: BookingEntity)

    @Query("DELETE FROM bookings WHERE id = :id")
    suspend fun deleteBookingById(id: String)
}

@Dao
interface ProfileDao {
    @Query("SELECT * FROM profiles WHERE id = :id")
    suspend fun getProfileById(id: String): ProfileEntity?

    @Query("SELECT * FROM profiles WHERE email = :email")
    suspend fun getProfileByEmail(email: String): ProfileEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProfile(profile: ProfileEntity)

    @Update
    suspend fun updateProfile(profile: ProfileEntity)

    @Delete
    suspend fun deleteProfile(profile: ProfileEntity)
}

@Dao
interface AvailabilitySlotDao {
    @Query("SELECT * FROM availability_slots WHERE service_id = :serviceId AND date = :date")
    suspend fun getAvailabilitySlots(serviceId: String, date: String): List<AvailabilitySlotEntity>

    @Query("SELECT * FROM availability_slots WHERE service_id = :serviceId AND date >= :date")
    fun getFutureAvailabilitySlots(serviceId: String, date: String): Flow<List<AvailabilitySlotEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAvailabilitySlot(slot: AvailabilitySlotEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAvailabilitySlots(slots: List<AvailabilitySlotEntity>)

    @Query("DELETE FROM availability_slots WHERE date < :date")
    suspend fun deleteOldAvailabilitySlots(date: String)
}

@Dao
interface BookingDraftDao {
    @Query("SELECT * FROM booking_drafts WHERE session_id = :sessionId")
    suspend fun getBookingDraftBySession(sessionId: String): BookingDraftEntity?

    @Query("SELECT * FROM booking_drafts WHERE user_id = :userId")
    suspend fun getBookingDraftsByUser(userId: String): List<BookingDraftEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBookingDraft(draft: BookingDraftEntity)

    @Update
    suspend fun updateBookingDraft(draft: BookingDraftEntity)

    @Delete
    suspend fun deleteBookingDraft(draft: BookingDraftEntity)

    @Query("DELETE FROM booking_drafts WHERE expires_at < :timestamp")
    suspend fun deleteExpiredDrafts(timestamp: Long)
}

@Dao
interface SyncQueueDao {
    @Query("SELECT * FROM sync_queue ORDER BY created_at ASC")
    fun getAllSyncItems(): Flow<List<SyncQueueEntity>>

    @Query("SELECT * FROM sync_queue WHERE entity_type = :entityType")
    suspend fun getSyncItemsByType(entityType: String): List<SyncQueueEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun addToSyncQueue(item: SyncQueueEntity)

    @Delete
    suspend fun removeFromSyncQueue(item: SyncQueueEntity)

    @Query("DELETE FROM sync_queue WHERE id = :id")
    suspend fun removeSyncItem(id: String)

    @Query("DELETE FROM sync_queue WHERE created_at < :timestamp")
    suspend fun deleteOldSyncItems(timestamp: Long)
}

@Dao
interface UserPreferencesDao {
    @Query("SELECT * FROM user_preferences WHERE user_id = :userId")
    suspend fun getUserPreferences(userId: String): UserPreferencesEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUserPreferences(preferences: UserPreferencesEntity)

    @Update
    suspend fun updateUserPreferences(preferences: UserPreferencesEntity)

    @Query("UPDATE user_preferences SET last_sync_at = :timestamp WHERE user_id = :userId")
    suspend fun updateLastSyncTimestamp(userId: String, timestamp: Long)
}

// Database provider
@Singleton
class DatabaseProvider @Inject constructor(
    private val database: MariiaHubDatabase
) {
    fun getServiceDao(): ServiceDao = database.serviceDao()
    fun getBookingDao(): BookingDao = database.bookingDao()
    fun getProfileDao(): ProfileDao = database.profileDao()
    fun getAvailabilitySlotDao(): AvailabilitySlotDao = database.availabilitySlotDao()
    fun getBookingDraftDao(): BookingDraftDao = database.bookingDraftDao()
    fun getSyncQueueDao(): SyncQueueDao = database.syncQueueDao()
    fun getUserPreferencesDao(): UserPreferencesDao = database.userPreferencesDao()
}