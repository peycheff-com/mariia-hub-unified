import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Package,
  Calendar,
  Star,
  Users,
  Clock,
  Check,
  Gift,
  Sparkles,
  TrendingUp,
  Timer
} from 'lucide-react';

import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ServicePackage } from '@/services/packageService';

interface PackageCardProps {
  package: ServicePackage;
  onPurchase?: (pkg: ServicePackage) => void;
  onInfo?: (pkg: ServicePackage) => void;
  variant?: 'default' | 'featured' | 'compact';
  showProgress?: boolean;
  currentProgress?: number;
  className?: string;
}

const PackageCard: React.FC<PackageCardProps> = ({
  package: pkg,
  onPurchase,
  onInfo,
  variant = 'default',
  showProgress = false,
  currentProgress = 0,
  className
}) => {
  const { i18n } = useTranslation();
  const { formatPrice, currency } = useCurrency();
  const { toast } = useToast();

  const handlePurchase = () => {
    if (onPurchase) {
      onPurchase(pkg);
    }
  };

  const handleInfo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onInfo) {
      onInfo(pkg);
    }
  };

  const getSavingsDisplay = () => {
    if (!pkg.savings_percentage || pkg.savings_percentage <= 0) return null;

    return (
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-green-500" />
        <span className="text-sm font-semibold text-green-500">
          {pkg.savings_percentage.toFixed(0)}% {i18n.t('package.savings', 'Save')}
        </span>
        {pkg.savings_amount && (
          <span className="text-xs text-green-400">
            ({formatPrice(pkg.savings_amount)})
          </span>
        )}
      </div>
    );
  };

  const isExpiringSoon = () => {
    if (!pkg.valid_until) return false;
    const expiryDate = new Date(pkg.valid_until);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = () => {
    if (!pkg.valid_until) return false;
    return new Date(pkg.valid_until) < new Date();
  };

  const getValidityDisplay = () => {
    const days = pkg.validity_days || 365;
    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30);
    const remainingDays = days % 30;

    if (years > 0) {
      return i18n.t('package.validityYears', '{{years}} year(s)', { years });
    } else if (months > 0) {
      return i18n.t('package.validityMonths', '{{months}} month(s)', { months });
    } else {
      return i18n.t('package.validityDays', '{{days}} day(s)', { days });
    }
  };

  const getPackageTypeIcon = () => {
    switch (pkg.service?.service_type) {
      case 'beauty':
        return <Sparkles className="w-5 h-5" />;
      case 'fitness':
        return <Users className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const getPackageTypeLabel = () => {
    switch (pkg.service?.service_type) {
      case 'beauty':
        return i18n.t('beauty.title', 'Beauty');
      case 'fitness':
        return i18n.t('fitness.title', 'Fitness');
      case 'lifestyle':
        return i18n.t('lifestyle.title', 'Lifestyle');
      default:
        return i18n.t('general.service', 'Service');
    }
  };

  if (variant === 'compact') {
    return (
      <Card className={cn(
        "glass-card hover:border-champagne/40 transition-all duration-300 cursor-pointer group",
        className
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {getPackageTypeLabel()}
                </Badge>
                {pkg.badge_text && (
                  <Badge variant="default" className="text-xs bg-gradient-brand text-brand-foreground">
                    {pkg.badge_text}
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-pearl mb-1 line-clamp-1">
                {pkg.name}
              </h3>
              <p className="text-sm text-pearl/60 line-clamp-2">
                {pkg.description}
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-pearl">
                {formatPrice(pkg.package_price)}
              </div>
              {getSavingsDisplay()}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3 text-xs text-pearl/60">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{getValidityDisplay()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Timer className="w-3 h-3" />
              <span>{pkg.session_count} {i18n.t('package.sessions', 'sessions')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "glass-card group hover:scale-[1.02] transition-all duration-300 relative overflow-hidden",
      variant === 'featured' && "border-champagne/40 bg-champagne/5",
      isExpired() && "opacity-60",
      className
    )}>
      {/* Featured Badge */}
      {pkg.is_featured && (
        <div className="absolute -top-3 right-6 z-10">
          <Badge className="bg-gradient-brand text-brand-foreground shadow-lg animate-fade-rise">
            <Sparkles className="w-3 h-3 mr-1" />
            {i18n.t('package.featured', 'Featured')}
          </Badge>
        </div>
      )}

      {/* Expiring Soon Badge */}
      {isExpiringSoon() && !isExpired() && (
        <div className="absolute -top-3 left-6 z-10">
          <Badge variant="destructive" className="animate-pulse">
            <Clock className="w-3 h-3 mr-1" />
            {i18n.t('package.expiringSoon', 'Expiring Soon')}
          </Badge>
        </div>
      )}

      {/* Custom Badge Text */}
      {pkg.badge_text && !pkg.is_featured && (
        <div className="absolute -top-3 right-6 z-10">
          <Badge className="bg-gradient-brand text-brand-foreground shadow-lg">
            {pkg.badge_text}
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Badge
                variant="secondary"
                className="text-xs font-medium"
              >
                {getPackageTypeIcon()}
                <span className="ml-1">{getPackageTypeLabel()}</span>
              </Badge>
            </div>
            <h3 className="text-xl font-semibold text-pearl mb-2 leading-tight">
              {pkg.name}
            </h3>
            <p className="text-pearl/70 text-sm leading-relaxed line-clamp-3">
              {pkg.description}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {showProgress && currentProgress > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-pearl/60 mb-2">
              <span>{i18n.t('package.progress', 'Progress')}</span>
              <span>{Math.round((currentProgress / pkg.session_count) * 100)}%</span>
            </div>
            <Progress
              value={(currentProgress / pkg.session_count) * 100}
              className="h-2"
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Price Section */}
        <div className="mb-4">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl font-bold text-pearl">
              {formatPrice(pkg.package_price)}
            </span>
            {pkg.original_price && pkg.original_price > pkg.package_price && (
              <span className="text-lg text-pearl/40 line-through">
                {formatPrice(pkg.original_price)}
              </span>
            )}
          </div>

          {/* Savings */}
          {getSavingsDisplay()}
        </div>

        {/* Package Details */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-pearl/70">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{getValidityDisplay()}</span>
          </div>
          <div className="flex items-center gap-2 text-pearl/70">
            <Timer className="w-4 h-4" />
            <span className="text-sm">
              {pkg.session_count} {i18n.t('package.sessions', 'sessions')}
            </span>
          </div>
        </div>

        {/* Benefits/Features */}
        {pkg.benefits && pkg.benefits.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-pearl mb-2">
              {i18n.t('package.benefits', 'What\'s included')}
            </h4>
            <div className="space-y-2">
              {pkg.benefits.slice(0, 3).map((benefit, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-champagne-200 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-pearl/70">{benefit}</span>
                </div>
              ))}
              {pkg.benefits.length > 3 && (
                <p className="text-xs text-pearl/50">
                  +{pkg.benefits.length - 3} {i18n.t('package.moreBenefits', 'more benefits')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Image */}
        {pkg.image_url && (
          <div className="mb-4 -mx-6 -mt-4">
            <img
              src={pkg.image_url}
              alt={pkg.name}
              className="w-full h-48 object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-4 gap-3">
        <Button
          onClick={handlePurchase}
          disabled={isExpired()}
          className="flex-1 bg-gradient-brand text-brand-foreground shadow-luxury hover:shadow-luxury-lg"
        >
          <Package className="w-4 h-4 mr-2" />
          {isExpired()
            ? i18n.t('package.expired', 'Expired')
            : i18n.t('package.purchase', 'Purchase Package')
          }
        </Button>
        <Button
          variant="outline"
          onClick={handleInfo}
          className="border-champagne/20 hover:bg-white/10"
        >
          {i18n.t('general.info', 'Info')}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PackageCard;