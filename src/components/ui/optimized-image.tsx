import React, { useState, useRef, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
  webpSrc?: string;
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage = memo(({
  src,
  alt,
  width,
  height,
  className,
  fallbackSrc,
  webpSrc,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false,
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    // Use Intersection Observer for lazy loading if not priority
    if (!priority) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.disconnect();
              }
            }
          });
        },
        {
          rootMargin: '50px 0px', // Start loading 50px before entering viewport
          threshold: 0.01,
        }
      );

      if (img.dataset.src) {
        observer.observe(img);
      }

      return () => observer.disconnect();
    }
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const generateWebpSrc = (originalSrc: string) => {
    // If custom WebP source is provided, use it
    if (webpSrc) return webpSrc;

    // Otherwise, try to convert to WebP by changing extension
    if (originalSrc.includes('.')) {
      return originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }
    return originalSrc;
  };

  const imgSrc = hasError && fallbackSrc ? fallbackSrc : src;
  const webpUrl = generateWebpSrc(imgSrc);

  return (
    <picture className={cn('block', className)}>
      {/* WebP source for modern browsers */}
      <source
        srcSet={webpUrl}
        type="image/webp"
        sizes={sizes}
      />

      {/* Fallback for older browsers */}
      <img
        ref={imgRef}
        src={priority ? imgSrc : undefined}
        data-src={!priority ? imgSrc : undefined}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        {...props}
      />

      {/* Loading placeholder */}
      {!isLoaded && (
        <div
          className={cn(
            'absolute inset-0 bg-gray-100 animate-pulse',
            'flex items-center justify-center',
            className
          )}
          aria-hidden="true"
        >
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}
    </picture>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;