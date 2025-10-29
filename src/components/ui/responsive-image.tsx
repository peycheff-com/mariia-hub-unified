import React, { useState, useCallback, useRef, useEffect } from 'react';

import { cn } from '@/lib/utils';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty' | 'color';
  blurDataURL?: string;
  className?: string;
  aspectRatio?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onLoadStart?: () => void;
  style?: React.CSSProperties;
  decoding?: 'async' | 'sync' | 'auto';
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
}

interface ImageState {
  isLoading: boolean;
  isLoaded: boolean;
  isError: boolean;
  srcSet?: string;
}

const generateSrcSet = (
  src: string,
  format: 'auto' | 'webp' | 'avif' | 'jpg' | 'png' = 'auto',
  quality: number = 75
): string => {
  // If it's already a data URL or external URL, return as-is
  if (src.startsWith('data:') || src.startsWith('http')) {
    return src;
  }

  const baseName = src.replace(/\.(jpg|jpeg|png|gif|webp|avif)$/i, '');
  const extension = src.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)?.[1] || 'jpg';

  // Generate responsive sizes
  const sizes = [320, 640, 768, 1024, 1280, 1536, 1920];
  const srcSetEntries = sizes.map(size => {
    let optimizedSrc = `${baseName}-${size}w.${extension}`;

    // If format is specified and different from original, add format parameter
    if (format !== 'auto' && format !== extension.toLowerCase()) {
      optimizedSrc = `${baseName}-${size}w.${format}?q=${quality}`;
    }

    return `${optimizedSrc} ${size}w`;
  });

  return srcSetEntries.join(', ');
};

const generateBlurDataURL = (width: number, height: number, color: string = '#e5e7eb'): string => {
  // Create a simple blur placeholder using SVG
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}"/>
      <rect width="100%" height="100%" fill="url(#gradient)" opacity="0.3"/>
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:white;stop-opacity:0.5" />
          <stop offset="100%" style="stop-color:black;stop-opacity:0.1" />
        </linearGradient>
      </defs>
    </svg>
  `;

  const base64 = btoa(svg);
  return `data:image/svg+xml;base64,${base64}`;
};

export function ResponsiveImage({
  src,
  alt,
  width,
  height,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  className,
  aspectRatio,
  quality = 75,
  format = 'auto',
  onLoad,
  onError,
  onLoadStart,
  style,
  decoding = 'async',
  loading = 'lazy',
  fetchPriority = priority ? 'high' : 'auto',
  ...props
}: ResponsiveImageProps) {
  const [imageState, setImageState] = useState<ImageState>({
    isLoading: true,
    isLoaded: false,
    isError: false,
  });

  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Generate blur placeholder if not provided
  const finalBlurDataURL = blurDataURL || (placeholder === 'blur' && width && height)
    ? generateBlurDataURL(width, height)
    : undefined;

  // Generate srcset for responsive images
  const srcSet = React.useMemo(() => {
    if (src.startsWith('data:') || src.startsWith('http')) {
      return undefined;
    }
    return generateSrcSet(src, format, quality);
  }, [src, format, quality]);

  // Handle image load events
  const handleLoad = useCallback(() => {
    setImageState(prev => ({ ...prev, isLoading: false, isLoaded: true }));
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback((error: Event) => {
    setImageState(prev => ({ ...prev, isLoading: false, isError: true }));
    onError?.(new Error('Image failed to load'));
  }, [onError]);

  const handleLoadStart = useCallback(() => {
    setImageState(prev => ({ ...prev, isLoading: true }));
    onLoadStart?.();
  }, [onLoadStart]);

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (loading === 'lazy' && imgRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              if (img.dataset.srcSet) {
                img.srcset = img.dataset.srcSet;
              }
            }
            observerRef.current?.disconnect();
          }
        },
        {
          rootMargin: '50px', // Start loading 50px before it comes into view
        }
      );

      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [loading]);

  // Calculate aspect ratio style
  const aspectRatioStyle = aspectRatio ? {
    aspectRatio: `${aspectRatio}`,
    ...style,
  } : style;

  // Container styles for maintaining aspect ratio
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : 'auto',
    ...aspectRatioStyle,
  };

  // Image styles
  const imageStyles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'opacity 0.3s ease-in-out',
    opacity: imageState.isLoaded ? 1 : 0,
  };

  // Placeholder styles
  const placeholderStyles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: finalBlurDataURL ? `url(${finalBlurDataURL})` : '#f3f4f6',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: finalBlurDataURL ? 'blur(20px)' : 'none',
    transform: finalBlurDataURL ? 'scale(1.1)' : 'none',
    opacity: imageState.isLoaded ? 0 : 1,
    transition: 'opacity 0.3s ease-in-out',
  };

  return (
    <div className={cn('relative overflow-hidden', className)} style={containerStyle}>
      {/* Placeholder */}
      {placeholder !== 'empty' && !imageState.isError && (
        <div
          style={placeholderStyles}
          className={cn(
            'absolute inset-0',
            placeholder === 'blur' && 'blur-xl',
            placeholder === 'color' && 'bg-gray-200'
          )}
          aria-hidden="true"
        />
      )}

      {/* Loading indicator */}
      {imageState.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="animate-pulse">
            <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>
        </div>
      )}

      {/* Error state */}
      {imageState.isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-center">
            <div className="text-gray-400 dark:text-gray-500 mb-2">
              <svg
                className="h-8 w-8 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Failed to load image
            </p>
          </div>
        </div>
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={loading === 'lazy' ? undefined : src}
        data-src={loading === 'lazy' ? src : undefined}
        srcSet={loading === 'lazy' ? undefined : srcSet}
        data-srcSet={loading === 'lazy' ? srcSet : undefined}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
        fetchPriority={fetchPriority}
        onLoad={handleLoad}
        onError={handleError}
        onLoadStart={handleLoadStart}
        style={imageStyles}
        className={cn(
          'w-full h-full object-cover',
          imageState.isLoaded && 'opacity-100',
          !imageState.isLoaded && 'opacity-0'
        )}
        {...props}
      />

      {/* Priority loading indicator */}
      {priority && imageState.isLoading && (
        <div className="absolute top-2 right-2">
          <div className="flex items-center space-x-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
            <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full" />
            <span>Loading</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Specialized components for common use cases
export function ResponsiveAvatar({
  src,
  alt,
  size = 40,
  className,
  ...props
}: Omit<ResponsiveImageProps, 'width' | 'height'> & {
  size?: number;
}) {
  return (
    <div className={cn('relative rounded-full overflow-hidden', className)}>
      <ResponsiveImage
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="rounded-full"
        placeholder="blur"
        blurDataURL={generateBlurDataURL(size, size, '#e5e7eb')}
        {...props}
      />
    </div>
  );
}

export function ResponsiveHero({
  src,
  alt,
  className,
  ...props
}: Omit<ResponsiveImageProps, 'width' | 'height' | 'priority'>) {
  return (
    <ResponsiveImage
      src={src}
      alt={alt}
      width={1920}
      height={1080}
      aspectRatio={16 / 9}
      priority
      placeholder="blur"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
      className={cn('w-full h-screen object-cover', className)}
      {...props}
    />
  );
}

export function ResponsiveCard({
  src,
  alt,
  className,
  ...props
}: Omit<ResponsiveImageProps, 'width' | 'height'>) {
  return (
    <ResponsiveImage
      src={src}
      alt={alt}
      width={400}
      height={300}
      aspectRatio={4 / 3}
      placeholder="blur"
      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
      className={cn('w-full h-48 object-cover rounded-lg', className)}
      {...props}
    />
  );
}

export function ResponsiveGallery({
  src,
  alt,
  className,
  ...props
}: Omit<ResponsiveImageProps, 'width' | 'height'>) {
  return (
    <ResponsiveImage
      src={src}
      alt={alt}
      width={800}
      height={600}
      aspectRatio={4 / 3}
      placeholder="blur"
      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
      className={cn('w-full h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity', className)}
      {...props}
    />
  );
}