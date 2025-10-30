import { cn } from '@/lib/utils';

interface PremiumLoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'shimmer';
  className?: string;
  text?: string;
}

export const PremiumLoading = ({
  size = 'md',
  variant = 'spinner',
  className,
  text,
}: PremiumLoadingProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'rounded-full bg-champagne animate-pulse',
              size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : size === 'lg' ? 'w-2.5 h-2.5' : 'w-3 h-3'
            )}
            style={{
              animationDelay: `${i * 200}ms`,
              animationDuration: '1000ms',
            }}
          />
        ))}
        {text && <span className={cn('ml-2 text-champagne/70', textSizes[size])}>{text}</span>}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)}>
        <div
          className={cn(
            'rounded-full bg-champagne animate-pulse',
            sizeClasses[size]
          )}
        />
        {text && <span className={cn('text-champagne/70', textSizes[size])}>{text}</span>}
      </div>
    );
  }

  if (variant === 'shimmer') {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)}>
        <div className="relative overflow-hidden rounded-lg bg-cocoa-200" style={{ width: '200px', height: size === 'sm' ? '20px' : size === 'md' ? '24px' : size === 'lg' ? '32px' : '40px' }}>
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>
        {text && <span className={cn('text-champagne/70', textSizes[size])}>{text}</span>}
      </div>
    );
  }

  // Default spinner variant
  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div
        className={cn(
          'border-2 border-champagne/20 border-t-champagne rounded-full animate-spin',
          sizeClasses[size]
        )}
      />
      {text && <span className={cn('text-champagne/70', textSizes[size])}>{text}</span>}
    </div>
  );
};

export default PremiumLoading;
