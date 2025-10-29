import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import {
  ZoomIn,
  ZoomOut,
  Move,
  Maximize2,
  RotateCw,
  Info,
  Download,
  Share2,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { LazyImage } from '@/components/ui/lazy-image'

interface BeforeAfterImages {
  id: string
  beforeImage: string
  afterImage: string
  beforeLabel?: string
  afterLabel?: string
  title?: string
  description?: string
  date?: string
  tags?: string[]
}

interface BeforeAfterSliderProps {
  images: BeforeAfterImages | BeforeAfterImages[]
  beforeLabel?: string
  afterLabel?: string
  initialPosition?: number
  showLabels?: boolean
  showControls?: boolean
  showThumbnails?: boolean
  showProgress?: boolean
  allowDownload?: boolean
  allowShare?: boolean
  className?: string
  onSliderChange?: (position: number) => void
  onImageChange?: (index: number) => void
  c2paVerified?: boolean
  authenticityInfo?: {
    verified: boolean
    manifestId?: string
    verificationDate?: string
  }
}

interface TouchState {
  startX: number
  startY: number
  currentX: number
  currentY: number
  lastTap: number
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  images,
  beforeLabel = 'Before',
  afterLabel = 'After',
  initialPosition = 50,
  showLabels = true,
  showControls = true,
  showThumbnails = true,
  showProgress = true,
  allowDownload = true,
  allowShare = true,
  className,
  onSliderChange,
  onImageChange,
  c2paVerified = false,
  authenticityInfo
}) => {
  // Normalize images to array format
  const imagesArray = Array.isArray(images) ? images : [images]
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sliderPosition, setSliderPosition] = useState(initialPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })
  const [showAuthenticity, setShowAuthenticity] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [touchState, setTouchState] = useState<TouchState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    lastTap: 0
  })
  const [isPinching, setIsPinching] = useState(false)
  const [initialPinchDistance, setInitialPinchDistance] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const sliderRef = useRef<HTMLDivElement>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)

  const currentImages = imagesArray[currentIndex]!

  // Enhanced mouse event handlers with better performance
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return
    e.preventDefault()

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = (x / rect.width) * 100
    const clampedPercentage = Math.min(Math.max(percentage, 0), 100)

    setSliderPosition(clampedPercentage)
    onSliderChange?.(clampedPercentage)
  }, [isDragging, onSliderChange])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => {
      const newLevel = Math.min(prev + 0.5, 3)
      setIsZoomed(newLevel > 1)
      return newLevel
    })
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => {
      const newLevel = Math.max(prev - 0.5, 1)
      if (newLevel === 1) {
        setIsZoomed(false)
        setPanPosition({ x: 0, y: 0 })
      }
      return newLevel
    })
  }, [])

  const handleReset = useCallback(() => {
    setSliderPosition(initialPosition)
    setZoomLevel(1)
    setIsZoomed(false)
    setPanPosition({ x: 0, y: 0 })
  }, [initialPosition])

  // Touch event handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      if (!touch) return

      const now = Date.now()

      // Double tap detection
      if (now - touchState.lastTap < 300) {
        // Double tap to reset zoom
        handleReset()
        setTouchState(prev => ({ ...prev, lastTap: 0 }))
        return
      }

      setTouchState(prev => ({
        ...prev,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        lastTap: now
      }))

      // Start dragging if not zoomed
      if (!isZoomed) {
        setIsDragging(true)
      }
    } else if (e.touches.length === 2 && e.touches[0] && e.touches[1]) {
      // Pinch to zoom
      setIsPinching(true)
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      setInitialPinchDistance(distance)
    }
  }, [touchState.lastTap, isZoomed, handleReset])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()

    if (e.touches.length === 1 && !isPinching) {
      const touch = e.touches[0]
      if (!touch) return

      if (isZoomed) {
        // Pan when zoomed
        const deltaX = touch.clientX - touchState.currentX
        const deltaY = touch.clientY - touchState.currentY

        setPanPosition(prev => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY
        }))

        setTouchState(prev => ({
          ...prev,
          currentX: touch.clientX,
          currentY: touch.clientY
        }))
      } else if (isDragging && containerRef.current) {
        // Slider drag
        const rect = containerRef.current.getBoundingClientRect()
        const x = touch.clientX - rect.left
        const percentage = (x / rect.width) * 100
        const clampedPercentage = Math.min(Math.max(percentage, 0), 100)

        setSliderPosition(clampedPercentage)
        onSliderChange?.(clampedPercentage)
      }
    } else if (e.touches.length === 2 && isPinching && e.touches[0] && e.touches[1]) {
      // Pinch zoom
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )

      if (initialPinchDistance > 0) {
        const scale = distance / initialPinchDistance
        const newZoomLevel = Math.min(Math.max(zoomLevel * scale, 1), 3)
        setZoomLevel(newZoomLevel)
        setIsZoomed(newZoomLevel > 1)
      }
    }
  }, [isDragging, isZoomed, isPinching, zoomLevel, initialPinchDistance, touchState.currentX, touchState.currentY, onSliderChange])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    setIsPinching(false)
    setInitialPinchDistance(0)
  }, [])

  // Global event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'grabbing'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          navigateImage(-1)
          break
        case 'ArrowRight':
          navigateImage(1)
          break
        case 'Escape':
          if (isFullscreen) {
            handleToggleFullscreen()
          } else if (isZoomed) {
            handleReset()
          }
          break
        case '+':
        case '=':
          handleZoomIn()
          break
        case '-':
        case '_':
          handleZoomOut()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen, isZoomed])

  // Click handler for slider positioning
  const handleSliderClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging || isZoomed) return

    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = (x / rect.width) * 100
    setSliderPosition(percentage)
    onSliderChange?.(percentage)
  }, [isDragging, isZoomed, onSliderChange])

  // Navigation handlers
  const navigateImage = useCallback((direction: number) => {
    const newIndex = currentIndex + direction
    if (newIndex >= 0 && newIndex < imagesArray.length) {
      setCurrentIndex(newIndex)
      onImageChange?.(newIndex)
      handleReset()
    }
  }, [currentIndex, imagesArray.length, onImageChange, handleReset])

  // Fullscreen handler
  const handleToggleFullscreen = useCallback(() => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true)
      })
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
      })
    }
  }, [])

  // Download handler
  const handleDownload = useCallback(() => {
    const link = document.createElement('a')
    link.href = currentImages.afterImage
    link.download = `after-${currentImages.id || 'image'}.jpg`
    link.click()
  }, [currentImages])

  // Share handler
  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentImages.title || 'Before & After',
          text: currentImages.description || 'Check out this transformation!',
          url: window.location.href
        })
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      setShowShareMenu(true)
      setTimeout(() => setShowShareMenu(false), 2000)
    }
  }, [currentImages])

  // Cleanup zoom when changing images
  useEffect(() => {
    handleReset()
  }, [currentIndex, handleReset])

  return (
    <div className={cn('relative group', className)}>
      {/* Main Container */}
      <div
        ref={containerRef}
        className={cn(
          'relative bg-muted overflow-hidden',
          isFullscreen ? 'w-screen h-screen' : 'aspect-[4/3]',
          isZoomed && 'cursor-grab active:cursor-grabbing'
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={imageContainerRef}
          className="relative w-full h-full"
          style={{
            transform: `scale(${zoomLevel}) translate(${panPosition.x}px, ${panPosition.y}px)`,
            transformOrigin: 'center',
            transition: isDragging || isPinching ? 'none' : 'transform 0.3s ease-out'
          }}
        >
          {/* Before Image */}
          <div className="absolute inset-0">
            <LazyImage
              src={currentImages.beforeImage}
              alt="Before"
              className="w-full h-full object-cover"
              loading="eager"
            />
            {showLabels && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-4 left-4 rounded-lg bg-black/70 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm"
              >
                {currentImages.beforeLabel || beforeLabel}
              </motion.div>
            )}
          </div>

          {/* After Image (clipped) */}
          <div
            className="absolute inset-0"
            style={{
              clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`
            }}
          >
            <LazyImage
              src={currentImages.afterImage}
              alt="After"
              className="w-full h-full object-cover"
              loading="eager"
            />
            {showLabels && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-4 right-4 rounded-lg bg-black/70 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm"
                style={{
                  opacity: sliderPosition > 10 ? 1 : 0,
                  transform: `translateX(${Math.max(0, 10 - sliderPosition) * 10}%)`
                }}
              >
                {currentImages.afterLabel || afterLabel}
              </motion.div>
            )}
          </div>

          {/* Progress indicator */}
          {showProgress && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-lg bg-black/70 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
              {Math.round(sliderPosition)}%
            </div>
          )}

          {/* Slider Line */}
          <div
            ref={sliderRef}
            className="absolute top-0 h-full w-0.5 bg-white shadow-lg cursor-grab active:cursor-grabbing"
            style={{ left: `${sliderPosition}%` }}
            onClick={handleSliderClick}
          >
            {/* Slider Handle */}
            <motion.div
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg cursor-grab active:cursor-grabbing"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              drag="x"
              dragElastic={0}
              dragMomentum={false}
              dragConstraints={{ left: 0, right: 0 }}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setIsDragging(false)}
              onDrag={(event, info) => {
                if (containerRef.current) {
                  const rect = containerRef.current.getBoundingClientRect()
                  const delta = info.offset.x
                  const newPercentage = ((rect.width * sliderPosition / 100) + delta) / rect.width * 100
                  const clampedPercentage = Math.min(Math.max(newPercentage, 0), 100)
                  setSliderPosition(clampedPercentage)
                  onSliderChange?.(clampedPercentage)
                }
              }}
            >
              <Move className="h-5 w-5 text-muted-foreground" />
            </motion.div>

            {/* Vertical Divider Line */}
            <div className="absolute top-0 h-full w-px bg-white/50" />
          </div>
        </div>
      </div>

      {/* Gallery Navigation */}
      {imagesArray.length > 1 && (
        <>
          <button
            onClick={() => navigateImage(-1)}
            disabled={currentIndex === 0}
            className={cn(
              'absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-all',
              'opacity-0 group-hover:opacity-100',
              'disabled:opacity-30 disabled:cursor-not-allowed',
              'hover:bg-black/70'
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigateImage(1)}
            disabled={currentIndex === imagesArray.length - 1}
            className={cn(
              'absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-all',
              'opacity-0 group-hover:opacity-100',
              'disabled:opacity-30 disabled:cursor-not-allowed',
              'hover:bg-black/70'
            )}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Controls */}
      {showControls && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-lg bg-black/70 p-2 backdrop-blur-sm"
        >
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            className="rounded p-1.5 text-white transition-colors hover:bg-white/20 disabled:opacity-50"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3}
            className="rounded p-1.5 text-white transition-colors hover:bg-white/20 disabled:opacity-50"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleReset}
            className="rounded p-1.5 text-white transition-colors hover:bg-white/20"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <button
            onClick={handleToggleFullscreen}
            className="rounded p-1.5 text-white transition-colors hover:bg-white/20"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          {allowDownload && (
            <button
              onClick={handleDownload}
              className="rounded p-1.5 text-white transition-colors hover:bg-white/20"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
          {allowShare && (
            <button
              onClick={handleShare}
              className="rounded p-1.5 text-white transition-colors hover:bg-white/20"
            >
              <Share2 className="h-4 w-4" />
            </button>
          )}
          {c2paVerified && (
            <button
              onClick={() => setShowAuthenticity(!showAuthenticity)}
              className="rounded p-1.5 text-white transition-colors hover:bg-white/20"
            >
              <Info className="h-4 w-4" />
            </button>
          )}
        </motion.div>
      )}

      {/* Thumbnails */}
      {showThumbnails && imagesArray.length > 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2">
          {imagesArray.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/70'
              )}
            />
          ))}
        </div>
      )}

      {/* Authenticity Badge */}
      {c2paVerified && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-green-500/90 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm"
        >
          <div className="h-2 w-2 rounded-full bg-white" />
          C2PA Verified Authentic
        </motion.div>
      )}

      {/* Authenticity Info Panel */}
      <AnimatePresence>
        {showAuthenticity && authenticityInfo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-20 left-4 right-4 rounded-lg bg-black/90 p-4 text-white backdrop-blur-sm"
          >
            <h3 className="mb-2 font-semibold">Authenticity Information</h3>
            <div className="space-y-1 text-sm">
              <p className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                {authenticityInfo.verified ? 'Verified Authentic' : 'Verification Failed'}
              </p>
              {authenticityInfo.manifestId && (
                <p className="text-muted-foreground">
                  Manifest ID: {authenticityInfo.manifestId.slice(0, 8)}...
                </p>
              )}
              {authenticityInfo.verificationDate && (
                <p className="text-muted-foreground">
                  Verified: {new Date(authenticityInfo.verificationDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Confirmation */}
      <AnimatePresence>
        {showShareMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-4 right-4 rounded-lg bg-black/90 px-3 py-2 text-sm text-white backdrop-blur-sm"
          >
            Link copied to clipboard!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Info */}
      {currentImages.title && (
        <div className="absolute top-4 left-4 right-4 text-center">
          <h2 className="text-lg font-semibold text-white drop-shadow-lg">
            {currentImages.title}
          </h2>
          {currentImages.description && (
            <p className="text-sm text-white/80 drop-shadow">
              {currentImages.description}
            </p>
          )}
          {currentImages.date && (
            <p className="text-xs text-white/60 drop-shadow">
              {new Date(currentImages.date).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Zoom Indicator */}
      {isZoomed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-4 right-4 rounded-lg bg-black/70 px-3 py-1.5 text-sm text-white backdrop-blur-sm"
        >
          {Math.round(zoomLevel * 100)}%
        </motion.div>
      )}
    </div>
  )
}