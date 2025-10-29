import React, { useState, useRef, useEffect } from 'react'

import { cn } from '@/lib/utils'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  // Support for WebP with fallback
  webpSrc?: string
  // Placeholder options
  placeholder?: string
  // Loading strategy
  loading?: 'lazy' | 'eager'
  // Blur effect
  blur?: boolean
  // Animation
  fadeIn?: boolean
}

export function LazyImage({
  src,
  alt,
  className,
  width,
  height,
  webpSrc,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3C/svg%3E',
  loading = 'lazy',
  blur = true,
  fadeIn = true,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [inView, setInView] = useState(loading === 'eager')
  const imgRef = useRef<HTMLImageElement>(null)

  // Intersection Observer for truly lazy loading
  useEffect(() => {
    if (loading === 'eager') return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px 0px', // Start loading 50px before entering viewport
        threshold: 0.1,
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [loading])

  // Check if browser supports WebP
  const [supportsWebP, setSupportsWebP] = useState(false)
  useEffect(() => {
    const checkWebPSupport = async () => {
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      const webpDataURL = canvas.toDataURL('image/webp')
      const webPData = webpDataURL.slice(0, 20)
      const isSupported = webPData === 'data:image/webp;base64,' ||
                         webPData === 'data:image/webp;base64,'
      setSupportsWebP(isSupported)
    }
    checkWebPSupport()
  }, [])

  const handleLoad = () => {
    setIsLoaded(true)
  }

  const handleError = () => {
    setHasError(true)
  }

  const imageSrc = hasError || !webpSrc || !supportsWebP ? src : webpSrc

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        blur && !isLoaded && 'backdrop-blur-sm',
        className
      )}
      style={{ width, height }}
    >
      {/* Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse">
          <svg
            className="w-full h-full text-gray-300 dark:text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <rect x="0" y="0" width="100%" height="100%" fill="currentColor" opacity="0.1" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              fill="none"
              stroke="currentColor"
              opacity="0.3"
            />
          </svg>
        </div>
      )}

      {/* Actual Image */}
      {inView && (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover',
            fadeIn && 'transition-opacity duration-300 ease-out',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-center p-4">
            <svg
              className="w-12 h-12 mx-auto text-gray-400 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="text-sm text-gray-600 dark:text-gray-400">Failed to load image</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper component for responsive images with srcset
interface ResponsiveLazyImageProps extends Omit<LazyImageProps, 'src' | 'webpSrc'> {
  sources: Array<{
    src: string
    webpSrc?: string
    media?: string
  }>
}

export function ResponsiveLazyImage({
  sources,
  alt,
  className,
  width,
  height,
  loading = 'lazy',
  blur = true,
  fadeIn = true,
}: ResponsiveLazyImageProps) {
  const [currentSrc, setCurrentSrc] = useState('')
  const [currentWebpSrc, setCurrentWebpSrc] = useState('')

  useEffect(() => {
    // Default to the last source (largest)
    const defaultSource = sources[sources.length - 1]
    setCurrentSrc(defaultSource.src)
    setCurrentWebpSrc(defaultSource.webpSrc || '')

    // Simple media query matching
    for (const source of sources) {
      if (!source.media) continue

      const mediaQuery = window.matchMedia(source.media)
      if (mediaQuery.matches) {
        setCurrentSrc(source.src)
        setCurrentWebpSrc(source.webpSrc || '')
        break
      }

      // Listen for changes
      const handleChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          setCurrentSrc(source.src)
          setCurrentWebpSrc(source.webpSrc || '')
        }
      }

      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [sources])

  return (
    <LazyImage
      src={currentSrc}
      webpSrc={currentWebpSrc}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={loading}
      blur={blur}
      fadeIn={fadeIn}
    />
  )
}