import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import PricingService, { PriceCalculationParams, PriceCalculationResult } from '@/services/PricingService';

import { useLocation } from './LocationContext';

interface PricingContextType {
  // Current pricing calculation
  currentPricing: PriceCalculationResult | null;
  isCalculating: boolean;
  pricingError: string | null;

  // Actions
  calculatePrice: (params: PriceCalculationParams) => Promise<PriceCalculationResult>;
  clearPricing: () => void;

  // Utilities
  formatPrice: (amount: number, currency?: string) => string;
  getTaxRate: (cityId: string) => Promise<number>;
}

const PricingContext = createContext<PricingContextType | undefined>(undefined);

interface PricingProviderProps {
  children: ReactNode;
}

export function PricingProvider({ children }: PricingProviderProps) {
  const [currentPricing, setCurrentPricing] = useState<PriceCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const { currentCity } = useLocation();

  // Clear pricing when city changes
  useEffect(() => {
    setCurrentPricing(null);
    setPricingError(null);
  }, [currentCity?.id]);

  const calculatePrice = async (params: PriceCalculationParams): Promise<PriceCalculationResult> => {
    setIsCalculating(true);
    setPricingError(null);

    try {
      // Ensure cityId is included
      const enhancedParams = {
        ...params,
        cityId: params.cityId || currentCity?.id
      };

      const result = await PricingService.calculatePrice(enhancedParams);
      setCurrentPricing(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to calculate price';
      setPricingError(errorMessage);
      throw error;
    } finally {
      setIsCalculating(false);
    }
  };

  const clearPricing = () => {
    setCurrentPricing(null);
    setPricingError(null);
  };

  const formatPrice = (amount: number, currency?: string): string => {
    return PricingService.formatPrice(amount, currency || currentPricing?.currency || 'PLN');
  };

  const getTaxRate = async (cityId: string): Promise<number> => {
    const taxConfig = await PricingService.getTaxConfiguration(cityId);
    return taxConfig.totalTaxRate;
  };

  const value: PricingContextType = {
    currentPricing,
    isCalculating,
    pricingError,
    calculatePrice,
    clearPricing,
    formatPrice,
    getTaxRate
  };

  return (
    <PricingContext.Provider value={value}>
      {children}
    </PricingContext.Provider>
  );
}

export function usePricing() {
  const context = useContext(PricingContext);
  if (context === undefined) {
    throw new Error('usePricing must be used within a PricingProvider');
  }
  return context;
}

export default PricingContext;