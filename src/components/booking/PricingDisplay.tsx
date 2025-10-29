import React from 'react';
import { TrendingDown, Info } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AppliedPricingRule } from '@/types/booking';

interface PricingDisplayProps {
  originalPrice: number;
  finalPrice: number;
  appliedRules: AppliedPricingRule[];
  currency?: string;
  showBreakdown?: boolean;
}

export function PricingDisplay({
  originalPrice,
  finalPrice,
  appliedRules,
  currency = 'PLN',
  showBreakdown = true
}: PricingDisplayProps) {
  const totalDiscount = originalPrice - finalPrice;
  const discountPercentage = originalPrice > 0 ? (totalDiscount / originalPrice) * 100 : 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getRuleDescription = (rule: AppliedPricingRule) => {
    switch (rule.ruleType) {
      case 'group_discount':
        return `Group discount (${rule.discountPercentage}%)`;
      case 'early_bird':
        return `Early bird discount (${rule.discountPercentage}%)`;
      case 'last_minute':
        return `Last minute offer (${rule.discountPercentage}%)`;
      case 'seasonal':
        return 'Seasonal pricing adjustment';
      case 'time_based':
        return 'Off-peak discount';
      case 'demand_based':
        return 'Dynamic pricing';
      default:
        return 'Special discount';
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {/* Price Summary */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">
                {formatPrice(finalPrice)}
              </span>
              {totalDiscount > 0 && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Save {discountPercentage.toFixed(0)}%
                </Badge>
              )}
            </div>
            {totalDiscount > 0 && (
              <div className="text-sm text-muted-foreground line-through">
                Was {formatPrice(originalPrice)}
              </div>
            )}
          </div>
        </div>

        {/* Discount Highlight */}
        {totalDiscount > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <TrendingDown className="h-4 w-4" />
              <span className="font-medium">
                You saved {formatPrice(totalDiscount)}
              </span>
            </div>
          </div>
        )}

        {/* Pricing Rules Breakdown */}
        {showBreakdown && appliedRules.length > 0 && (
          <div className="space-y-2">
            <Separator />
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              Applied Discounts
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">
                    Discounts are automatically applied based on group size,
                    booking time, and special promotions.
                  </p>
                </TooltipContent>
              </Tooltip>
            </h4>
            <div className="space-y-1">
              {appliedRules.map((rule, index) => (
                <div key={rule.ruleId || index} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {getRuleDescription(rule)}
                  </span>
                  <span className="font-medium text-green-600">
                    -{formatPrice(rule.appliedAmount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price Per Person for Groups */}
        {appliedRules.some(r => r.ruleType === 'group_discount') && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-800 font-medium">
                Price per person
              </span>
              <span className="font-bold text-blue-900">
                {formatPrice(finalPrice / Math.max(1, appliedRules.find(r => r.ruleType === 'group_discount')?.appliedAmount || 1))}
              </span>
            </div>
          </div>
        )}

        {/* Tax and Fees Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            • All prices include VAT
          </p>
          <p>
            • No hidden fees
          </p>
          <p>
            • Free cancellation up to 24 hours before
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}