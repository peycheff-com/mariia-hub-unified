package com.mariiahub.wear.domain.tiles

import android.content.Context
import androidx.wear.protolayout.ColorBuilders.argb
import androidx.wear.protolayout.DimensionBuilders.*
import androidx.wear.protolayout.LayoutElementBuilders.*
import androidx.wear.protolayout.MaterialComponents.*
import androidx.wear.protolayout.ModifiersBuilders.*
import androidx.wear.protolayout.TypeBuilders.StringProp
import androidx.wear.protolayout.expression.FluentExpression
import androidx.wear.tiles.*
import androidx.wear.tiles.TileService
import androidx.wear.tiles.TimelineBuilders.Timeline
import androidx.wear.tiles.TimelineBuilders.TimelineEntry
import androidx.wear.tiles.TimelineBuilders.TimeInterval
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture
import com.mariiahub.wear.R
import com.mariiahub.wear.domain.model.AppointmentStatus
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.*
import timber.log.Timber
import java.time.Instant
import java.util.concurrent.TimeUnit
import javax.inject.Inject

@AndroidEntryPoint
class MariiaHubTileService : TileService() {

    @Inject
    lateinit var tileDataProvider: TileDataProvider

    private val serviceScope = CoroutineScope(Dispatchers.Default + SupervisorJob())

    override fun onTileRequest(requestParams: TileRequest): ListenableFuture<TileBuilders.Tile> {
        return Futures.immediateFuture(
            serviceScope.async {
                try {
                    val tileData = tileDataProvider.getTileData()
                    buildTile(tileData, requestParams)
                } catch (e: Exception) {
                    Timber.e(e, "Failed to build tile")
                    buildErrorTile()
                }
            }.asListenableFuture()
        )
    }

    override fun onTileAddEvent(requestParams: TileAddEvent) {
        super.onTileAddEvent(requestParams)
        Timber.d("Tile added: ${requestParams.tileId}")
    }

    override fun onTileRemoveEvent(requestParams: TileRemoveEvent) {
        super.onTileRemoveEvent(requestParams)
        Timber.d("Tile removed: ${requestParams.tileId}")
    }

    override fun onTileEnterEvent(requestParams: TileEnterEvent) {
        super.onTileEnterEvent(requestParams)
        Timber.d("Tile entered: ${requestParams.tileId}")
    }

    override fun onTileLeaveEvent(requestParams: TileLeaveEvent) {
        super.onTileLeaveEvent(requestParams)
        Timber.d("Tile left: ${requestParams.tileId}")
    }

    private suspend fun buildTile(tileData: TileData, requestParams: TileRequest): TileBuilders.Tile {
        val tile = TileBuilders.Tile.Builder()
            .setResourcesVersion(RESOURCES_VERSION)
            .setTimeline(buildTimeline(tileData))

        // Set freshness interval based on data type
        when (requestParams.tileId) {
            "appointments_tile" -> tile.setFreshnessIntervalMillis(TimeUnit.MINUTES.toMillis(15))
            "stats_tile" -> tile.setFreshnessIntervalMillis(TimeUnit.MINUTES.toMillis(30))
            "health_tile" -> tile.setFreshnessIntervalMillis(TimeUnit.MINUTES.toMillis(10))
            else -> tile.setFreshnessIntervalMillis(TimeUnit.MINUTES.toMillis(60))
        }

        return tile.build()
    }

    private fun buildTimeline(tileData: TileData): Timeline {
        val entries = mutableListOf<TimelineEntry>()

        // Current time entry
        entries.add(
            TimelineEntry.Builder()
                .setValidityInterval(
                    TimeInterval.builder()
                        .setStartMillis(Instant.now().toEpochMilli())
                        .setEndMillis(Instant.now().plusMillis(TimeUnit.HOURS.toMillis(1)).toEpochMilli())
                        .build()
                )
                .setLayout(
                    LayoutElementBuilders.Layout.Builder()
                        .setRoot(buildLayoutElement(tileData))
                        .build()
                )
                .build()
        )

        // Add entries for upcoming appointments
        tileData.upcomingAppointments.forEach { appointment ->
            val entryTime = appointment.bookingDate.atStartOfDay().toInstant().toEpochMilli()
            entries.add(
                TimelineEntry.Builder()
                    .setValidityInterval(
                        TimeInterval.builder()
                            .setStartMillis(entryTime - TimeUnit.MINUTES.toMillis(30)) // 30 minutes before
                            .setEndMillis(entryTime + TimeUnit.HOURS.toMillis(2)) // 2 hours after
                            .build()
                    )
                    .setLayout(
                        LayoutElementBuilders.Layout.Builder()
                            .setRoot(buildAppointmentReminderLayout(appointment))
                            .build()
                    )
                    .build()
            )
        }

        return Timeline.Builder()
            .setTimelineEntries(entries)
            .build()
    }

    private fun buildLayoutElement(tileData: TileData): LayoutElement {
        return Column.Builder()
            .setWidth(expand())
            .setHeight(expand())
            .setModifiers(
                Modifiers.Builder()
                    .setBackground(
                        Background.Builder()
                            .setColor(argb(0xFF2D2D2D))
                            .setCorner(Corner.Builder().setRadius(dp(16f)).build())
                            .build()
                    )
                    .setPadding(
                        Padding.Builder()
                            .setStart(dp(12f))
                            .setEnd(dp(12f))
                            .setTop(dp(8f))
                            .setBottom(dp(8f))
                            .build()
                    )
                    .build()
            )
            .addContent(buildHeader(tileData))
            .addContent(buildMainContent(tileData))
            .addContent(buildFooter(tileData))
            .build()
    }

    private fun buildHeader(tileData: TileData): LayoutElement {
        return Row.Builder()
            .setWidth(wrap())
            .setHeight(wrap())
            .addContent(
                Text.Builder()
                    .setText("Mariia Hub")
                    .setColor(argb(0xFFD4AF37))
                    .setTypography(TYPOGRAPHY_CAPTION2)
                    .build()
            )
            .addContent(
                Spacer.Builder()
                    .setWidth(dp(4f))
                    .setHeight(dp(1f))
                    .build()
            )
            .addContent(
                Text.Builder()
                    .setText("Premium")
                    .setColor(argb(0xFFFFFFFF))
                    .setTypography(TYPOGRAPHY_CAPTION2)
                    .build()
            )
            .build()
    }

    private fun buildMainContent(tileData: TileData): LayoutElement {
        return Column.Builder()
            .setWidth(expand())
            .setHeight(expand())
            .setModifiers(
                Modifiers.Builder()
                    .setPadding(
                        Padding.Builder()
                            .setVertical(dp(4f))
                            .build()
                    )
                    .build()
            )
            .addContent(buildStatsRow(tileData))
            .addContent(
                Spacer.Builder()
                    .setWidth(dp(1f))
                    .setHeight(dp(8f))
                    .build()
            )
            .addContent(buildNextAppointmentRow(tileData))
            .build()
    }

    private fun buildStatsRow(tileData: TileData): LayoutElement {
        return Row.Builder()
            .setWidth(expand())
            .setHeight(wrap())
            .addContent(buildStatItem("Appointments", tileData.todayAppointments.toString()))
            .addContent(
                Spacer.Builder()
                    .setWidth(dp(8f))
                    .setHeight(dp(1f))
                    .build()
            )
            .addContent(buildStatItem("Revenue", formatCurrency(tileData.todayRevenue)))
            .build()
    }

    private fun buildStatItem(label: String, value: String): LayoutElement {
        return Column.Builder()
            .setWidth(wrap())
            .setHeight(wrap())
            .setModifiers(
                Modifiers.Builder()
                    .setBackground(
                        Background.Builder()
                            .setColor(argb(0xFFD4AF37).copy(alpha = 0x20))
                            .setCorner(Corner.Builder().setRadius(dp(8f)).build())
                            .build()
                    )
                    .setPadding(
                        Padding.Builder()
                            .setAll(dp(6f))
                            .build()
                    )
                    .build()
            )
            .addContent(
                Text.Builder()
                    .setText(value)
                    .setColor(argb(0xFFD4AF37))
                    .setTypography(TYPOGRAPHY_TITLE3)
                    .build()
            )
            .addContent(
                Text.Builder()
                    .setText(label)
                    .setColor(argb(0xFFFFFFFF))
                    .setTypography(TYPOGRAPHY_CAPTION3)
                    .build()
            )
            .build()
    }

    private fun buildNextAppointmentRow(tileData: TileData): LayoutElement {
        val nextAppointment = tileData.nextAppointment
        return if (nextAppointment != null) {
            Column.Builder()
                .setWidth(expand())
                .setHeight(wrap())
                .addContent(
                    Text.Builder()
                        .setText("Next Appointment")
                        .setColor(argb(0xFFFFFFFF))
                        .setTypography(TYPOGRAPHY_CAPTION2)
                        .build()
                )
                .addContent(
                    Text.Builder()
                        .setText("${nextAppointment.clientName} • ${nextAppointment.formattedTime}")
                        .setColor(argb(0xFFFFFFFF))
                        .setTypography(TYPOGRAPHY_BODY2)
                        .build()
                )
                .addContent(
                    Text.Builder()
                        .setText(nextAppointment.serviceName)
                        .setColor(argb(0xFFD4AF37))
                        .setTypography(TYPOGRAPHY_CAPTION3)
                        .build()
                )
                .build()
        } else {
            Text.Builder()
                .setText("No appointments today")
                .setColor(argb(0xFF888888))
                .setTypography(TYPOGRAPHY_BODY2)
                .build()
        }
    }

    private fun buildFooter(tileData: TileData): LayoutElement {
        return Row.Builder()
            .setWidth(expand())
            .setHeight(wrap())
            .setModifiers(
                Modifiers.Builder()
                    .setPadding(
                        Padding.Builder()
                            .setTop(dp(4f))
                            .build()
                    )
                    .build()
            )
            .addContent(
                Text.Builder()
                    .setText("${tileData.todaySteps} steps")
                    .setColor(argb(0xAAAAAAAA))
                    .setTypography(TYPOGRAPHY_CAPTION3)
                    .build()
            )
            .addContent(
                Spacer.Builder()
                    .setWidth(dp(4f))
                    .setHeight(dp(1f))
                    .build()
            )
            .addContent(
                Text.Builder()
                    .setText("🔋 ${tileData.batteryLevel.toInt()}%")
                    .setColor(argb(0xAAAAAAAA))
                    .setTypography(TYPOGRAPHY_CAPTION3)
                    .build()
            )
            .build()
    }

    private fun buildAppointmentReminderLayout(appointment: AppointmentTileData): LayoutElement {
        return Column.Builder()
            .setWidth(expand())
            .setHeight(expand())
            .setModifiers(
                Modifiers.Builder()
                    .setBackground(
                        Background.Builder()
                            .setColor(argb(0xFFD4AF37))
                            .setCorner(Corner.Builder().setRadius(dp(16f)).build())
                            .build()
                    )
                    .setPadding(
                        Padding.Builder()
                            .setAll(dp(12f))
                            .build()
                    )
                    .build()
            )
            .addContent(
                Text.Builder()
                    .setText("Upcoming")
                    .setColor(argb(0xFF000000))
                    .setTypography(TYPOGRAPHY_CAPTION2)
                    .build()
            )
            .addContent(
                Text.Builder()
                    .setText(appointment.clientName)
                    .setColor(argb(0xFF000000))
                    .setTypography(TYPOGRAPHY_TITLE3)
                    .build()
            )
            .addContent(
                Text.Builder()
                    .setText(appointment.serviceName)
                    .setColor(argb(0xFF000000))
                    .setTypography(TYPOGRAPHY_BODY2)
                    .build()
            )
            .addContent(
                Text.Builder()
                    .setText(appointment.formattedTime)
                    .setColor(argb(0xFF000000))
                    .setTypography(TYPOGRAPHY_CAPTION2)
                    .build()
            )
            .build()
    }

    private fun buildErrorTile(): TileBuilders.Tile {
        return TileBuilders.Tile.Builder()
            .setResourcesVersion(RESOURCES_VERSION)
            .setTimeline(
                Timeline.Builder()
                    .addTimelineEntry(
                        TimelineEntry.Builder()
                            .setValidityInterval(
                                TimeInterval.builder()
                                    .setStartMillis(Instant.now().toEpochMilli())
                                    .setEndMillis(Instant.now().plusMillis(TimeUnit.MINUTES.toMillis(5)).toEpochMilli())
                                    .build()
                            )
                            .setLayout(
                                LayoutElementBuilders.Layout.Builder()
                                    .setRoot(
                                        Text.Builder()
                                            .setText("Error loading data")
                                            .setColor(argb(0xFFFF0000))
                                            .setTypography(TYPOGRAPHY_BODY1)
                                            .build()
                                    )
                                    .build()
                            )
                            .build()
                    )
                    .build()
            )
            .build()
    }

    private fun formatCurrency(amount: Double): String {
        return "PLN ${amount.toInt()}"
    }

    companion object {
        private const val RESOURCES_VERSION = "1"
    }
}

// Extension to convert Coroutine to ListenableFuture
fun <T> Deferred<T>.asListenableFuture(): ListenableFuture<T> {
    return Futures.submit<T> { this@asListenableFuture.await() }
}