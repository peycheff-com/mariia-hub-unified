import { useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PremiumImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'photo' | 'portrait' | 'landscape';
  hoverEffect?: 'zoom' | 'overlay' | 'blur' | 'tilt' | 'shine';
  children?: ReactNode;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  loading?: 'lazy' | 'eager';
}

export const PremiumImage = ({
  src,
  alt,
  className,
  aspectRatio = 'square',
  hoverEffect = 'zoom',
  children,
  rounded = 'xl',
  loading = 'lazy',
}: PremiumImageProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    photo: 'aspect-photo',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
  };

  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
    full: 'rounded-full',
  };

  const getHoverEffect = () => {
    switch (hoverEffect) {
      case 'zoom':
        return 'group-hover:scale-110';
      case 'overlay':
        return 'group-hover:scale-105';
      case 'blur':
        return 'group-hover:blur-sm';
      case 'tilt':
        return 'group-hover:rotate-1 group-hover:scale-105';
      case 'shine':
        return 'group-hover:scale-105';
      default:
        return 'group-hover:scale-110';
    }
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        aspectRatioClasses[aspectRatio],
        roundedClasses[rounded],
        className
      )}
    >
      {/* Image with hover effect */}
      <div className="relative h-full w-full transition-transform duration-500 ease-out group">
        {!imageError ? (
          <img
            src={src}
            alt={alt}
            loading={loading}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={cn(
              'h-full w-full object-cover transition-all duration-500 ease-out',
              getHoverEffect(),
              !imageLoaded && 'opacity-0'
            )}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-cocoa-100 text-cocoa-400">
            <span className="text-sm">Image not available</span>
          </div>
        )}

        {/* Shine effect overlay */}
        {hoverEffect === 'shine' && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
          </div>
        )}

        {/* Blur overlay effect */}
        {hoverEffect === 'blur' && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
        )}

        {/* Overlay effect */}
        {hoverEffect === 'overlay' && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}

        {/* Loading shimmer */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-cocoa-200 via-cocoa-100 to-cocoa-200 bg-[length:200%_100%]" />
        )}
      </div>

      {/* Custom children content */}
      {children && (
        <div className="absolute inset-0 flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="text-white">{children}</div>
        </div>
      )}
    </div>
  );
};

export default PremiumImage;
