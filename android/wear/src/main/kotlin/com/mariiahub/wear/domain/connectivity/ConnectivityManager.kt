package com.mariiahub.wear.domain.connectivity

import android.content.Context
import com.google.android.gms.wearable.*
import com.google.gson.Gson
import com.mariiahub.wear.domain.model.*
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.tasks.await
import timber.log.Timber
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ConnectivityManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val gson: Gson
) : DataClient.OnDataChangedListener, MessageClient.MessageListener, CapabilityClient.OnCapabilityChangedListener {

    private val dataClient by lazy { Wearable.getDataClient(context) }
    private val messageClient by lazy { Wearable.getMessageClient(context) }
    private val capabilityClient by lazy { Wearable.getCapabilityClient(context) }
    private val channelClient by lazy { Wearable.getChannelClient(context) }

    private val _connectionState = MutableStateFlow(ConnectionState.DISCONNECTED)
    val connectionState: StateFlow<ConnectionState> = _connectionState.asStateFlow()

    private val _incomingMessages = Channel<SyncMessage>(capacity = Channel.UNLIMITED)
    val incomingMessages: Flow<SyncMessage> = _incomingMessages.receiveAsFlow()

    private val _syncEvents = Channel<SyncEvent>(capacity = Channel.UNLIMITED)
    val syncEvents: Flow<SyncEvent> = _syncEvents.receiveAsFlow()

    private var phoneNodeId: String? = null

    companion object {
        private const val CAPABILITY_NAME = "mariia_hub_phone"
        private const val MESSAGE_PATH_APPOINTMENTS = "/appointments"
        private const val MESSAGE_PATH_HEALTH = "/health"
        private const val MESSAGE_PATH_QUICK_ACTION = "/quick_action"
        private const val MESSAGE_PATH_SYNC_REQUEST = "/sync_request"
        private const val DATA_PATH_APPOINTMENTS = "/appointments_data"
        private const val DATA_PATH_HEALTH = "/health_data"
    }

    init {
        connect()
    }

    fun connect() {
        try {
            // Register listeners
            dataClient.addListener(this)
            messageClient.addListener(this)
            capabilityClient.addListener(this, CapabilityClient.FILTER_ALL)

            // Find connected phone
            findConnectedPhone()

            Timber.d("Wear connectivity manager initialized")
        } catch (e: Exception) {
            Timber.e(e, "Failed to initialize wear connectivity")
            _connectionState.value = ConnectionState.ERROR
        }
    }

    fun disconnect() {
        try {
            dataClient.removeListener(this)
            messageClient.removeListener(this)
            capabilityClient.removeListener(this)

            _connectionState.value = ConnectionState.DISCONNECTED
            Timber.d("Wear connectivity manager disconnected")
        } catch (e: Exception) {
            Timber.e(e, "Failed to disconnect wear connectivity")
        }
    }

    private fun findConnectedPhone() {
        capabilityClient.getCapability(CAPABILITY_NAME, CapabilityClient.FILTER_REACHABLE)
            .addOnSuccessListener { capabilityInfo ->
                val nodes = capabilityInfo.nodes
                phoneNodeId = nodes.firstOrNull { it.isNearby }?.id ?: nodes.firstOrNull()?.id

                if (phoneNodeId != null) {
                    _connectionState.value = ConnectionState.CONNECTED
                    Timber.d("Connected to phone: $phoneNodeId")

                    // Request initial sync
                    requestSyncData()
                } else {
                    _connectionState.value = ConnectionState.DISCONNECTED
                    Timber.w("No connected phone found")
                }
            }
            .addOnFailureListener { e ->
                Timber.e(e, "Failed to find connected phone")
                _connectionState.value = ConnectionState.ERROR
            }
    }

    suspend fun syncAppointments(appointments: List<Appointment>) {
        phoneNodeId?.let { nodeId ->
            try {
                val data = gson.toJson(SyncData(
                    type = "appointments",
                    timestamp = System.currentTimeMillis(),
                    data = appointments
                ))

                val putDataRequest = PutDataRequest.Builder()
                    .setPath(DATA_PATH_APPOINTMENTS)
                    .setData(data.toByteArray())
                    .setUrgent()
                    .build()

                val result = dataClient.putDataItem(putDataRequest).await()
                Timber.d("Appointments synced: ${result.uri}")

                _syncEvents.trySend(SyncEvent.AppointmentsSynced)
            } catch (e: Exception) {
                Timber.e(e, "Failed to sync appointments")
                _syncEvents.trySend(SyncEvent.SyncError("Failed to sync appointments: ${e.message}"))
            }
        } ?: run {
            Timber.w("No connected phone for appointments sync")
        }
    }

    suspend fun syncHealthMetrics(healthMetrics: HealthMetrics) {
        phoneNodeId?.let { nodeId ->
            try {
                val data = gson.toJson(SyncData(
                    type = "health",
                    timestamp = System.currentTimeMillis(),
                    data = healthMetrics
                ))

                val putDataRequest = PutDataRequest.Builder()
                    .setPath(DATA_PATH_HEALTH)
                    .setData(data.toByteArray())
                    .setUrgent()
                    .build()

                val result = dataClient.putDataItem(putDataRequest).await()
                Timber.d("Health metrics synced: ${result.uri}")

                _syncEvents.trySend(SyncEvent.HealthSynced)
            } catch (e: Exception) {
                Timber.e(e, "Failed to sync health metrics")
                _syncEvents.trySend(SyncEvent.SyncError("Failed to sync health metrics: ${e.message}"))
            }
        }
    }

    suspend fun sendQuickAction(action: QuickActionData) {
        phoneNodeId?.let { nodeId ->
            try {
                val data = gson.toJson(action)
                messageClient.sendMessage(nodeId, MESSAGE_PATH_QUICK_ACTION, data.toByteArray())
                    .await()

                Timber.d("Quick action sent: ${action.type}")
                _syncEvents.trySend(SyncEvent.QuickActionSent)
            } catch (e: Exception) {
                Timber.e(e, "Failed to send quick action")
                _syncEvents.trySend(SyncEvent.SyncError("Failed to send quick action: ${e.message}"))
            }
        } ?: run {
            Timber.w("No connected phone for quick action")
        }
    }

    suspend fun requestSyncData() {
        phoneNodeId?.let { nodeId ->
            try {
                val data = gson.toJson(SyncRequest(
                    type = "full_sync",
                    timestamp = System.currentTimeMillis()
                ))

                messageClient.sendMessage(nodeId, MESSAGE_PATH_SYNC_REQUEST, data.toByteArray())
                    .await()

                Timber.d("Sync data requested from phone")
            } catch (e: Exception) {
                Timber.e(e, "Failed to request sync data")
            }
        }
    }

    // DataClient callbacks
    override fun onDataChanged(dataEvents: DataEventBuffer) {
        dataEvents.forEach { event ->
            when (event.type) {
                DataEvent.TYPE_CHANGED -> {
                    when (event.dataItem.uri.path) {
                        DATA_PATH_APPOINTMENTS -> handleAppointmentsData(event.dataItem)
                        DATA_PATH_HEALTH -> handleHealthData(event.dataItem)
                    }
                }
                DataEvent.TYPE_DELETED -> {
                    Timber.d("Data deleted: ${event.dataItem.uri.path}")
                }
            }
        }
    }

    private fun handleAppointmentsData(dataItem: DataItem) {
        try {
            val data = dataItem.data
            val jsonString = String(data)
            val syncData = gson.fromJson(jsonString, SyncData::class.java)

            if (syncData.type == "appointments") {
                val appointments = gson.fromJson(
                    gson.toJson(syncData.data),
                    Array<Appointment>::class.java
                ).toList()

                _incomingMessages.trySend(
                    SyncMessage.AppointmentsUpdate(appointments)
                )

                Timber.d("Received appointments update: ${appointments.size} items")
            }
        } catch (e: Exception) {
            Timber.e(e, "Failed to handle appointments data")
        }
    }

    private fun handleHealthData(dataItem: DataItem) {
        try {
            val data = dataItem.data
            val jsonString = String(data)
            val syncData = gson.fromJson(jsonString, SyncData::class.java)

            if (syncData.type == "health") {
                val healthMetrics = gson.fromJson(
                    gson.toJson(syncData.data),
                    HealthMetrics::class.java
                )

                _incomingMessages.trySend(
                    SyncMessage.HealthUpdate(healthMetrics)
                )

                Timber.d("Received health metrics update")
            }
        } catch (e: Exception) {
            Timber.e(e, "Failed to handle health data")
        }
    }

    // MessageClient callbacks
    override fun onMessageReceived(messageEvent: MessageEvent) {
        try {
            when (messageEvent.path) {
                MESSAGE_PATH_SYNC_REQUEST -> {
                    _incomingMessages.trySend(
                        SyncMessage.SyncRequest(messageEvent.sourceNodeId)
                    )
                }
                MESSAGE_PATH_QUICK_ACTION -> {
                    val action = gson.fromJson(
                        String(messageEvent.data),
                        QuickActionData::class.java
                    )
                    _incomingMessages.trySend(
                        SyncMessage.QuickAction(action)
                    )
                }
            }
        } catch (e: Exception) {
            Timber.e(e, "Failed to handle message: ${messageEvent.path}")
        }
    }

    // CapabilityClient callbacks
    override fun onCapabilityChanged(capabilityInfo: CapabilityInfo) {
        if (capabilityInfo.name == CAPABILITY_NAME) {
            val nodes = capabilityInfo.nodes
            phoneNodeId = nodes.firstOrNull { it.isNearby }?.id ?: nodes.firstOrNull()?.id

            if (phoneNodeId != null) {
                _connectionState.value = ConnectionState.CONNECTED
                Timber.d("Phone capability detected: $phoneNodeId")
                requestSyncData()
            } else {
                _connectionState.value = ConnectionState.DISCONNECTED
                Timber.w("Phone capability lost")
            }
        }
    }

    suspend fun openChannelForFileTransfer(): ChannelClient.Channel? {
        phoneNodeId?.let { nodeId ->
            try {
                val channel = channelClient.openChannel(nodeId, "/file_transfer").await()
                Timber.d("Channel opened for file transfer: ${channel.channelId}")
                return channel
            } catch (e: Exception) {
                Timber.e(e, "Failed to open channel")
            }
        }
        return null
    }

    fun getConnectionStatus(): ConnectionState {
        return _connectionState.value
    }

    fun isPhoneConnected(): Boolean {
        return _connectionState.value == ConnectionState.CONNECTED && phoneNodeId != null
    }
}

// Data classes for synchronization
data class SyncData(
    val type: String,
    val timestamp: Long,
    val data: Any
)

data class SyncRequest(
    val type: String,
    val timestamp: Long
)

data class QuickActionData(
    val type: String,
    val parameters: Map<String, Any> = emptyMap()
)

sealed class SyncMessage {
    data class AppointmentsUpdate(val appointments: List<Appointment>) : SyncMessage()
    data class HealthUpdate(val healthMetrics: HealthMetrics) : SyncMessage()
    data class SyncRequest(val nodeId: String) : SyncMessage()
    data class QuickAction(val action: QuickActionData) : SyncMessage()
}

sealed class SyncEvent {
    object AppointmentsSynced : SyncEvent()
    object HealthSynced : SyncEvent()
    object QuickActionSent : SyncEvent()
    data class SyncError(val message: String) : SyncEvent()
}

enum class ConnectionState {
    CONNECTED,
    DISCONNECTED,
    CONNECTING,
    ERROR
}