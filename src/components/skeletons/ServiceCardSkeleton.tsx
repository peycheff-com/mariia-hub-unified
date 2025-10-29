import { cn } from '@/lib/utils';

interface ServiceCardSkeletonProps {
  className?: string;
}

export const ServiceCardSkeleton: React.FC<ServiceCardSkeletonProps> = ({ className }) => (
  <div className={cn('glass-card p-6 min-h-[240px] animate-pulse', className)}>
    {/* Image placeholder */}
    <div className="h-32 bg-champagne/20 rounded-2xl mb-4" />

    {/* Title placeholder */}
    <div className="h-6 bg-champagne/20 rounded-xl mb-2" />

    {/* Description placeholder */}
    <div className="space-y-2 mb-4">
      <div className="h-3 bg-champagne/10 rounded-lg w-3/4" />
      <div className="h-3 bg-champagne/10 rounded-lg w-1/2" />
    </div>

    {/* Meta info placeholder */}
    <div className="flex justify-between items-center">
      <div className="h-4 bg-champagne/15 rounded-lg w-20" />
      <div className="h-6 bg-champagne/20 rounded-xl w-16" />
    </div>
  </div>
);