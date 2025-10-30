package com.mariaborysevych.beautyfitness.wear.tiles

import android.content.Context
import androidx.wear.tiles.LayoutElementBuilders
import androidx.wear.tiles.TileBuilders
import androidx.wear.tiles.TimelineBuilders
import androidx.wear.tiles.TileService
import androidx.wear.tiles.material.*
import androidx.wear.tiles.material.Text
import androidx.wear.tiles.material.layouts.PrimaryLayout
import coil.ImageLoader
import com.google.android.horologist.tiles.images.drawableResToImageResource
import com.mariaborysevych.beautyfitness.wear.R
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf
import java.time.Instant
import javax.inject.Inject

@AndroidEntryPoint
class BookingTileService : TileService() {

    @Inject
    lateinit var tileRenderer: BookingTileRenderer

    override fun onTileRequest(requestParams: TileBuilders.TileRequest): Flow<TileBuilders.Tile> {
        return flowOf(tileRenderer.render())
    }

    override fun onTileResourcesRequest(requestParams: TileBuilders.ResourceRequest): Flow<TileBuilders.Resources> {
        return flowOf(tileRenderer.produceResources())
    }
}

class BookingTileRenderer @Inject constructor(
    private val context: Context
) {
    private val imageLoader = ImageLoader.Builder(context).build()

    fun render(): TileBuilders.Tile {
        val todayBooking = getTodayBooking() // Get from your data source
        val nextBooking = getNextBooking() // Get from your data source

        return TileBuilders.Tile.Builder()
            .setResourcesVersion("1")
            .setTimeline(
                TimelineBuilders.Timeline.Builder()
                    .addTimelineEntry(
                        TimelineBuilders.TimelineEntry.Builder()
                            .setStartMillis(Instant.now().toEpochMilli())
                            .setEndMillis(Instant.now().plusSeconds(3600).toEpochMilli())
                            .setLayout(
                                LayoutElementBuilders.Layout.Builder()
                                    .setRoot(createTileLayout(todayBooking, nextBooking))
                                    .build()
                            )
                            .build()
                    )
                    .build()
            )
            .build()
    }

    private fun createTileLayout(todayBooking: String?, nextBooking: String?): LayoutElementBuilders.LayoutElement {
        return PrimaryLayout.Builder(
            deviceParameters = DeviceParametersBuilders.DeviceParameters.Builder()
                .setScreenWidthDp(200)
                .setScreenHeightDp(200)
                .build()
        )
            .setContent(
                LayoutElementBuilders.Column.Builder()
                    .addContent(
                        Text.Builder(context, "Mariia Hub")
                            .setColor(ColorBuilders.argb(0xFFFFFFFF.toInt()))
                            .setTypography(Typography.TYPOGRAPHY_CAPTION1)
                            .build()
                    )
                    .addContent(
                        LayoutElementBuilders.Spacer.Builder()
                            .setHeight(dp(8f))
                            .build()
                    )
                    .addContent(
                        Text.Builder(context, "Today")
                            .setColor(ColorBuilders.argb(0xFFFFFFFF.toInt()))
                            .setTypography(Typography.TYPOGRAPHY_TITLE3)
                            .build()
                    )
                    .addContent(
                        LayoutElementBuilders.Spacer.Builder()
                            .setHeight(dp(4f))
                            .build()
                    )
                    .addContent(
                        Text.Builder(context, todayBooking ?: "No bookings")
                            .setColor(ColorBuilders.argb(0xFFAAAAAA.toInt()))
                            .setTypography(Typography.TYPOGRAPHY_BODY1)
                            .build()
                    )
                    .addContent(
                        LayoutElementBuilders.Spacer.Builder()
                            .setHeight(dp(8f))
                            .build()
                    )
                    .addContent(
                        Text.Builder(context, "Next: ${nextBooking ?: "None"}")
                            .setColor(ColorBuilders.argb(0xFFAAAAAA.toInt()))
                            .setTypography(Typography.TYPOGRAPHY_CAPTION2)
                            .build()
                    )
                    .build()
            )
            .setPrimaryChipContent(
                Chip.Builder(
                    context,
                    LayoutElementBuilders.TEXT_ELEMENT_ID,
                    Chip.Builder.ICON_IMAGE_ID
                )
                    .setText("Open App")
                    .setIconContent(drawableResToImageResource(R.drawable.ic_spa))
                    .build()
            )
            .build()
    }

    fun produceResources(): TileBuilders.Resources {
        return TileBuilders.Resources.Builder()
            .setVersion("1")
            .addIdToImageMapping(
                TileBuilders.IMAGE_ID_RESOURCE_ID,
                drawableResToImageResource(R.drawable.ic_spa)
            )
            .build()
    }

    private fun getTodayBooking(): String? {
        // TODO: Implement actual data fetching
        return "2:30 PM - Beauty"
    }

    private fun getNextBooking(): String? {
        // TODO: Implement actual data fetching
        return "Tomorrow, 10:00 AM"
    }
}

// Luxury Watch Face Tile
class LuxuryWatchFaceTile @Inject constructor(
    private val context: Context
) {
    fun render(): TileBuilders.Tile {
        return TileBuilders.Tile.Builder()
            .setResourcesVersion("1")
            .setTimeline(
                TimelineBuilders.Timeline.Builder()
                    .addTimelineEntry(
                        TimelineBuilders.TimelineEntry.Builder()
                            .setStartMillis(Instant.now().toEpochMilli())
                            .setEndMillis(Instant.now().plusSeconds(60).toEpochMilli())
                            .setLayout(
                                LayoutElementBuilders.Layout.Builder()
                                    .setRoot(createLuxuryLayout())
                                    .build()
                            )
                            .build()
                    )
                    .build()
            )
            .build()
    }

    private fun createLuxuryLayout(): LayoutElementBuilders.LayoutElement {
        return LayoutElementBuilders.Box.Builder()
            .setWidth(LayoutElementBuilders.ExpandedDimensionProp.Builder().build())
            .setHeight(LayoutElementBuilders.ExpandedDimensionProp.Builder().build())
            .addContent(
                LayoutElementBuilders.Arc.Builder()
                    .addContent(
                        LayoutElementBuilders.ArcText.Builder()
                            .setText("✨")
                            .setFontStyle(
                                LayoutElementBuilders.FontStyle.Builder()
                                    .setSize(sp(20f))
                                    .build()
                            )
                            .build()
                    )
                    .setAnchorAngle(degrees(0f))
                    .build()
            )
            .addContent(
                LayoutElementBuilders.Column.Builder()
                    .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
                    .setVerticalAlignment(LayoutElementBuilders.VERTICAL_ALIGN_CENTER)
                    .addContent(
                        Text.Builder(context, "Mariia")
                            .setColor(ColorBuilders.argb(0xFFD4AF37.toInt())) // Gold
                            .setTypography(Typography.TYPOGRAPHY_DISPLAY3)
                            .build()
                    )
                    .addContent(
                        LayoutElementBuilders.Spacer.Builder()
                            .setHeight(dp(4f))
                            .build()
                    )
                    .addContent(
                        Text.Builder(context, getTimeString())
                            .setColor(ColorBuilders.argb(0xFFFFFFFF.toInt()))
                            .setTypography(Typography.TYPOGRAPHY_TITLE1)
                            .build()
                    )
                    .build()
            )
            .build()
    }

    private fun getTimeString(): String {
        val now = java.time.LocalTime.now()
        return now.format(java.time.format.DateTimeFormatter.ofPattern("HH:mm"))
    }
}