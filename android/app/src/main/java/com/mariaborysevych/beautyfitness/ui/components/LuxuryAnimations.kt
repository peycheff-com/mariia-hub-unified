package com.mariaborysevych.beautyfitness.ui.components

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mariaborysevych.beautyfitness.ui.theme.MariiaHubColors
import com.mariaborysevych.beautyfitness.ui.theme.MariiaHubShapes
import kotlinx.coroutines.delay

// Luxury entrance animations
@Composable
fun LuxuryFadeInSlideUp(
    modifier: Modifier = Modifier,
    delay: Int = 0,
    content: @Composable AnimatedVisibilityScope.() -> Unit
) {
    AnimatedVisibility(
        visible = true,
        modifier = modifier,
        enter = fadeIn(
            animationSpec = tween(
                durationMillis = 800,
                delayMillis = delay,
                easing = EaseOutQuart
            )
        ) + slideInVertically(
            initialOffsetY = { it / 4 }, // Slide from 25% of height
            animationSpec = tween(
                durationMillis = 1000,
                delayMillis = delay,
                easing = EaseOutQuart
            )
        ),
        exit = fadeOut(
            animationSpec = tween(durationMillis = 300, easing = EaseInQuart)
        ) + slideOutVertically(
            targetOffsetY = { -it / 4 },
            animationSpec = tween(durationMillis = 300, easing = EaseInQuart)
        ),
        content = content
    )
}

@Composable
fun LuxuryScaleIn(
    modifier: Modifier = Modifier,
    delay: Int = 0,
    content: @Composable AnimatedVisibilityScope.() -> Unit
) {
    AnimatedVisibility(
        visible = true,
        modifier = modifier,
        enter = fadeIn(
            animationSpec = tween(
                durationMillis = 600,
                delayMillis = delay,
                easing = EaseOutQuart
            )
        ) + scaleIn(
            initialScale = 0.8f,
            animationSpec = tween(
                durationMillis = 800,
                delayMillis = delay,
                easing = EaseOutQuart
            )
        ),
        exit = fadeOut(
            animationSpec = tween(durationMillis = 300, easing = EaseInQuart)
        ) + scaleOut(
            targetScale = 0.8f,
            animationSpec = tween(durationMillis = 300, easing = EaseInQuart)
        ),
        content = content
    )
}

// Glass morphism animation
@Composable
fun AnimatedGlassCard(
    modifier: Modifier = Modifier,
    isVisible: Boolean = true,
    content: @Composable BoxScope.() -> Unit
) {
    var animatedOpacity by remember { mutableStateOf(0f) }
    var animatedScale by remember { mutableStateOf(0.95f) }

    LaunchedEffect(isVisible) {
        if (isVisible) {
            animatedOpacity = 1f
            animatedScale = 1f
        } else {
            animatedOpacity = 0f
            animatedScale = 0.95f
        }
    }

    Card(
        modifier = modifier
            .scale(animatedScale)
            .graphicsLayer {
                alpha = animatedOpacity
                shadowElevation = 8.dp.toPx()
            }
            .shadow(
                elevation = 8.dp,
                shape = MariiaHubShapes.CardStandard,
                ambientColor = MariiaHubColors.ShadowGold,
                spotColor = MariiaHubColors.Gold
            ),
        shape = MariiaHubShapes.CardStandard,
        colors = CardDefaults.cardColors(
            containerColor = MariiaHubColors.GlassMedium.copy(alpha = animatedOpacity * 0.8f)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            MariiaHubColors.ChampagneLight.copy(alpha = 0.1f * animatedOpacity),
                            Color.Transparent
                        ),
                        radius = 200f
                    )
                ),
            content = content
        )
    }
}

// Premium button with ripple effect
@Composable
fun LuxuryButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    isLoading: Boolean = false,
    text: String,
    icon: @Composable (() -> Unit)? = null
) {
    var isPressed by remember { mutableStateOf(false) }
    val pressScale by animateFloatAsState(
        targetValue = if (isPressed) 0.95f else 1f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessLow
        )
    )

    Button(
        onClick = {
            if (enabled && !isLoading) {
                onClick()
            }
        },
        modifier = modifier
            .scale(pressScale)
            .pointerInput(Unit) {
                detectTapGestures(
                    onPress = {
                        isPressed = true
                        awaitRelease()
                        isPressed = false
                    }
                )
            },
        enabled = enabled,
        shape = MariiaHubShapes.ButtonPrimary,
        colors = ButtonDefaults.buttonColors(
            containerColor = MariiaHubColors.Primary,
            contentColor = MariiaHubColors.OnPrimary
        ),
        elevation = ButtonDefaults.buttonElevation(
            defaultElevation = 4.dp,
            pressedElevation = 2.dp,
            disabledElevation = 0.dp
        )
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.size(20.dp),
                color = MariiaHubColors.OnPrimary,
                strokeWidth = 2.dp
            )
        } else {
            Row(
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                icon?.invoke()
                Text(
                    text = text,
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}

// Shimmer effect for luxury loading states
@Composable
fun LuxuryShimmerEffect(
    modifier: Modifier = Modifier,
    isLoading: Boolean = true,
    content: @Composable () -> Unit
) {
    if (isLoading) {
        val transition = rememberInfiniteTransition()
        val alpha by transition.animateFloat(
            initialValue = 0.2f,
            targetValue = 0.8f,
            animationSpec = infiniteRepeatable(
                animation = tween(1000),
                repeatMode = RepeatMode.Reverse
            )
        )

        Box(
            modifier = modifier.clip(MariiaHubShapes.CardStandard)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.linearGradient(
                            colors = listOf(
                                MariiaHubColors.ChampagneLight.copy(alpha = alpha),
                                MariiaHubColors.Primary.copy(alpha = alpha * 0.5f),
                                MariiaHubColors.ChampagneLight.copy(alpha = alpha)
                            ),
                            start = Offset(-100f, -100f),
                            end = Offset(100f, 100f)
                        )
                    )
            )
        }
    } else {
        content()
    }
}

// Floating luxury card with parallax effect
@Composable
fun FloatingLuxuryCard(
    modifier: Modifier = Modifier,
    elevation: Float = 8f,
    content: @Composable BoxScope.() -> Unit
) {
    val density = LocalDensity.current
    var offsetX by remember { mutableStateOf(0f) }
    var offsetY by remember { mutableStateOf(0f) }

    Card(
        modifier = modifier
            .offset {
                IntOffset(
                    offsetX.toInt(),
                    offsetY.toInt()
                )
            }
            .pointerInput(Unit) {
                detectTapGestures(
                    onPress = {
                        // Add subtle press animation
                        val pressAnimation = animateFloatAsState(
                            targetValue = 0.95f,
                            animationSpec = tween(100)
                        )
                        awaitRelease()
                    }
                )
            },
        shape = MariiaHubShapes.CardStandard,
        colors = CardDefaults.cardColors(
            containerColor = MariiaHubColors.GlassHeavy
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = elevation.dp
        )
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            MariiaHubColors.ChampagneLight.copy(alpha = 0.1f),
                            Color.Transparent
                        ),
                        radius = 150f
                    )
                ),
            content = content
        )
    }
}

// Luxury progress indicator
@Composable
fun LuxuryLinearProgressIndicator(
    progress: Float,
    modifier: Modifier = Modifier,
    color: Color = MariiaHubColors.Gold,
    backgroundColor: Color = MariiaHubColors.GlassSubtle
) {
    val animatedProgress by animateFloatAsState(
        targetValue = progress,
        animationSpec = tween(1000, easing = EaseOutQuart)
    )

    Canvas(
        modifier = modifier
            .fillMaxWidth()
            .height(8.dp)
            .clip(RoundedCornerShape(4.dp))
    ) {
        // Background
        drawRoundRect(
            color = backgroundColor,
            size = size,
            cornerRadius = androidx.compose.ui.geometry.CornerRadius(4.dp.toPx())
        )

        // Progress
        if (animatedProgress > 0) {
            val progressWidth = size.width * animatedProgress
            drawRoundRect(
                color = color,
                size = androidx.compose.ui.geometry.Size(progressWidth, size.height),
                cornerRadius = androidx.compose.ui.geometry.CornerRadius(4.dp.toPx())
            )

            // Add shimmer effect
            val shimmerWidth = progressWidth * 0.3f
            val shimmerOffset = (size.width * progress * 0.7f) % (progressWidth + shimmerWidth)

            drawRoundRect(
                color = Color.White.copy(alpha = 0.3f),
                topLeft = androidx.compose.ui.geometry.Offset(
                    (shimmerOffset - shimmerWidth).coerceAtLeast(0f),
                    0f
                ),
                size = androidx.compose.ui.geometry.Size(
                    shimmerWidth.coerceAtMost(progressWidth - shimmerOffset),
                    size.height
                ),
                cornerRadius = androidx.compose.ui.geometry.CornerRadius(4.dp.toPx())
            )
        }

        // Border
        drawRoundRect(
            color = color.copy(alpha = 0.5f),
            size = size,
            style = Stroke(width = 1.dp.toPx()),
            cornerRadius = androidx.compose.ui.geometry.CornerRadius(4.dp.toPx())
        )
    }
}

// Pulse animation for important elements
@Composable
fun PulseAnimation(
    modifier: Modifier = Modifier,
    pulseColor: Color = MariiaHubColors.Gold,
    content: @Composable () -> Unit
) {
    val infiniteTransition = rememberInfiniteTransition()
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.8f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        )
    )

    Box(
        modifier = modifier
    ) {
        // Pulse background
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    color = pulseColor.copy(alpha = alpha * 0.3f),
                    shape = MariiaHubShapes.CardStandard
                )
        )

        content()
    }
}

// Staggered list animation
@Composable
fun <T> StaggeredAnimatedList(
    items: List<T>,
    modifier: Modifier = Modifier,
    key: ((T) -> Any)? = null,
    content: @Composable (item: T) -> Unit
) {
    val density = LocalDensity.current

    LazyColumn(
        modifier = modifier,
        contentPadding = PaddingValues(vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        itemsIndexed(items, key = key) { index, item ->
            key(index) {
                LuxuryFadeInSlideUp(
                    delay = index * 100
                ) {
                    content(item)
                }
            }
        }
    }
}

// Luxury tab indicator animation
@Composable
fun LuxuryTabIndicator(
    modifier: Modifier = Modifier,
    selectedTabIndex: Int,
    tabCount: Int,
    color: Color = MariiaHubColors.Gold
) {
    val animatedOffset by animateDpAsState(
        targetValue = (selectedTabIndex * 100).dp, // Assuming each tab is 100dp wide
        animationSpec = tween(300, easing = EaseOutQuart)
    )

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(3.dp)
            .background(
                color = color.copy(alpha = 0.3f)
            )
    ) {
        Box(
            modifier = Modifier
                .offset(x = animatedOffset)
                .width(100.dp)
                .height(3.dp)
                .background(
                    color = color,
                    RoundedCornerShape(topStart = 2.dp, topEnd = 2.dp)
                )
        )
    }
}