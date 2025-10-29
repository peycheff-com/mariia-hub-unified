import React, { useState, useRef, useEffect } from 'react';

import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw',
  quality = 75,
  format = 'auto',
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);

  // Generate srcset for responsive images
  const generateSrcSet = (baseSrc: string) => {
    const widths = [384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840];
    const formats = format === 'auto' ? ['avif', 'webp', 'jpg'] : [format];

    return formats.map(fmt => {
      const srcset = widths
        .map(w => `${baseSrc}?w=${w}&f=${fmt}&q=${quality} ${w}w`)
        .join(', ');

      return {
        type: fmt === 'jpg' ? 'image/jpeg' : `image/${fmt}`,
        srcset
      };
    });
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  // Calculate aspect ratio for placeholder
  const aspectRatio = width && height ? `${width} / ${height}` : undefined;

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const sources = generateSrcSet(src);

  // Show error state
  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-neutral-100 dark:bg-neutral-800',
          className
        )}
        style={{ width, height, aspectRatio }}
      >
        <span className="text-neutral-400 text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Placeholder */}
      {placeholder === 'blur' && !isLoaded && (
        <div
          ref={placeholderRef}
          className="absolute inset-0 transform scale-110 filter blur-2xl"
          style={{
            backgroundImage: blurDataURL
              ? `url(${blurDataURL})`
              : `url(${src}?w=40&h=40&blur=20)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            aspectRatio,
          }}
        />
      )}

      {/* Main image */}
      {isInView && (
        <picture>
          {/* Modern formats */}
          {sources.map((source, index) => (
            <source
              key={index}
              type={source.type}
              srcSet={source.srcset}
              sizes={sizes}
            />
          ))}

          {/* Fallback */}
          <img
            ref={imgRef}
            src={`${src}?w=${width || 800}&q=${quality}`}
            srcSet={`${src}?w=${width || 800}&q=${quality} 1x, ${src}?w=${(width || 800) * 2}&q=${quality * 0.8} 2x`}
            sizes={sizes}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0',
              placeholder === 'blur' && !isLoaded && 'absolute inset-0'
            )}
            style={{ aspectRatio }}
          />
        </picture>
      )}

      {/* Loading skeleton */}
      {!isLoaded && !hasError && placeholder === 'empty' && (
        <div className="absolute inset-0 bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
      )}
    </div>
  );
};

// Specialized components for common use cases
export const AvatarImage: React.FC<Omit<OptimizedImageProps, 'sizes' | 'priority'>> = (props) => (
  <OptimizedImage
    {...props}
    sizes="64px"
    className={cn('rounded-full object-cover', props.className)}
  />
);

export const HeroImage: React.FC<Omit<OptimizedImageProps, 'sizes' | 'priority'>> = (props) => (
  <OptimizedImage
    {...props}
    priority={true}
    sizes="100vw"
    className={cn('w-full h-full object-cover', props.className)}
  />
);

export const CardImage: React.FC<Omit<OptimizedImageProps, 'sizes'>> = (props) => (
  <OptimizedImage
    {...props}
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    className={cn('w-full rounded-2xl object-cover', props.className)}
  />
);

export const GalleryImage: React.FC<Omit<OptimizedImageProps, 'sizes'>> = (props) => (
  <OptimizedImage
    {...props}
    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 75vw, 50vw"
    className={cn('w-full h-full object-cover', props.className)}
  />
);