package com.mariaborysevych.beautyfitness.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp

// Luxury shape system - consistent 12px border radius with premium variations
val Shapes = Shapes(
    extraSmall = RoundedCornerShape(4.dp),  // For tags, chips, small elements
    small = RoundedCornerShape(8.dp),       // For buttons, small cards
    medium = RoundedCornerShape(12.dp),     // Primary luxury radius - for cards, dialogs
    large = RoundedCornerShape(16.dp),      // For large cards, bottom sheets
    extraLarge = RoundedCornerShape(28.dp), // For hero sections, special containers
)

// Extended shape system for specific components
object MariiaHubShapes {

    // Button shapes
    val ButtonPrimary = RoundedCornerShape(12.dp)
    val ButtonSecondary = RoundedCornerShape(8.dp)
    val ButtonPill = RoundedCornerShape(50) // Full rounded for special buttons

    // Card shapes
    val CardStandard = RoundedCornerShape(12.dp)
    val CardLarge = RoundedCornerShape(16.dp)
    val CardService = RoundedCornerShape(20.dp) // For service cards
    val CardHero = RoundedCornerShape(24.dp)    // For hero sections

    // Input field shapes
    val InputField = RoundedCornerShape(12.dp)
    val SearchField = RoundedCornerShape(50)    // Full rounded search

    // Dialog and bottom sheet shapes
    val Dialog = RoundedCornerShape(28.dp)
    val BottomSheet = RoundedCornerShape(28.dp, 28.dp, 0.dp, 0.dp)

    // Navigation shapes
    val NavigationItem = RoundedCornerShape(12.dp)
    val NavigationRail = RoundedCornerShape(0.dp, 16.dp, 16.dp, 0.dp)

    // Badge and indicator shapes
    val Badge = RoundedCornerShape(50) // Circle badges
    val Chip = RoundedCornerShape(50)  // Pill-shaped chips

    // Image shapes
    val ImageThumbnail = RoundedCornerShape(8.dp)
    val ImageService = RoundedCornerShape(16.dp)
    val ImageAvatar = RoundedCornerShape(50) // Circle avatars

    // Container shapes
    val ContainerStandard = RoundedCornerShape(12.dp)
    val ContainerGlass = RoundedCornerShape(20.dp)
    val ContainerHero = RoundedCornerShape(32.dp)

    // Step indicator shapes
    val StepIndicator = RoundedCornerShape(50) // Circle step indicators
    val StepConnector = RoundedCornerShape(4.dp) // Small rounded connectors

    // Floating action button
    val Fab = RoundedCornerShape(16.dp)

    // Tab shapes
    val TabSelected = RoundedCornerShape(12.dp)
    val TabUnselected = RoundedCornerShape(8.dp)

    // Gallery shapes
    val GalleryItem = RoundedCornerShape(12.dp)
    val GalleryHero = RoundedCornerShape(20.dp)

    // Notification shapes
    val Notification = RoundedCornerShape(12.dp)
    val NotificationToast = RoundedCornerShape(50)

    // Progress indicators
    val ProgressBar = RoundedCornerShape(50)
    val ProgressSegment = RoundedCornerShape(2.dp)

    // Time slot shapes
    val TimeSlot = RoundedCornerShape(12.dp)
    val TimeSlotSelected = RoundedCornerShape(16.dp)

    // Service category shapes
    val CategoryBeauty = RoundedCornerShape(20.dp, 20.dp, 8.dp, 8.dp) // Asymmetric for beauty
    val CategoryFitness = RoundedCornerShape(8.dp, 8.dp, 20.dp, 20.dp) // Inverted for fitness
    val CategoryLifestyle = RoundedCornerShape(12.dp) // Standard for lifestyle

    // Luxury accent shapes
    val GoldAccent = RoundedCornerShape(50, 8.dp, 50, 8.dp) // Decorative gold accents
    val ChampagneBubble = RoundedCornerShape(50) // Circle for bubble effects
}