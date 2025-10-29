import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

interface PageLoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  className,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={cn(
      'flex items-center justify-center min-h-[200px]',
      className
    )}>
      <Loader2 className={cn(
        'animate-spin text-champagne',
        sizeClasses[size]
      )} />
    </div>
  );
};