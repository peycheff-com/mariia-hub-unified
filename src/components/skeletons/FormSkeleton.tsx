import { cn } from '@/lib/utils';

interface FormSkeletonProps {
  className?: string;
  fieldCount?: number;
}

export const FormSkeleton: React.FC<FormSkeletonProps> = ({
  className,
  fieldCount = 4
}) => (
  <div className={cn('space-y-6', className)}>
    {Array.from({ length: fieldCount }).map((_, i) => (
      <div key={i} className="space-y-2">
        {/* Label */}
        <div className="h-4 bg-champagne/15 rounded-lg w-24 animate-pulse" />

        {/* Input field */}
        <div className="h-12 bg-champagne/10 rounded-xl animate-pulse" />
      </div>
    ))}

    {/* Button placeholder */}
    <div className="h-12 bg-champagne/20 rounded-xl animate-pulse mt-8" />
  </div>
);

export const BookingFormSkeleton: React.FC<{ className?: string }> = ({
  className
}) => (
  <div className={cn('space-y-8', className)}>
    {/* Service selection */}
    <div className="space-y-4">
      <div className="h-5 bg-champagne/15 rounded-lg w-32 animate-pulse" />
      <div className="grid gap-4">
        <div className="h-24 bg-champagne/10 rounded-xl animate-pulse" />
        <div className="h-24 bg-champagne/10 rounded-xl animate-pulse" />
      </div>
    </div>

    {/* Date/Time selection */}
    <div className="space-y-4">
      <div className="h-5 bg-champagne/15 rounded-lg w-32 animate-pulse" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-12 bg-champagne/10 rounded-xl animate-pulse" />
        <div className="h-12 bg-champagne/10 rounded-xl animate-pulse" />
      </div>
    </div>

    {/* Personal info */}
    <div className="space-y-4">
      <div className="h-5 bg-champagne/15 rounded-lg w-32 animate-pulse" />
      <div className="space-y-3">
        <div className="h-12 bg-champagne/10 rounded-xl animate-pulse" />
        <div className="h-12 bg-champagne/10 rounded-xl animate-pulse" />
        <div className="h-12 bg-champagne/10 rounded-xl animate-pulse" />
      </div>
    </div>

    {/* Submit button */}
    <div className="h-14 bg-champagne/20 rounded-xl animate-pulse" />
  </div>
);