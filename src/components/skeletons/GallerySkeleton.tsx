import { cn } from '@/lib/utils';

interface GallerySkeletonProps {
  className?: string;
  count?: number;
}

export const GallerySkeleton: React.FC<GallerySkeletonProps> = ({
  className,
  count = 6
}) => (
  <div className={cn('grid gap-4', className)}>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="aspect-square bg-champagne/20 rounded-2xl animate-pulse"
      />
    ))}
  </div>
);

export const GalleryThumbnailSkeleton: React.FC<{ className?: string }> = ({
  className
}) => (
  <div
    className={cn('aspect-square bg-champagne/20 rounded-xl animate-pulse', className)}
  />
);