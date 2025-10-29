import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type Currency = 'PLN' | 'EUR' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (pricePLN: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Exchange rates (approximate, updated periodically)
const EXCHANGE_RATES = {
  PLN: 1,
  EUR: 0.23,
  USD: 0.25,
};

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  PLN: 'zł',
  EUR: '€',
  USD: '$',
};

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider = ({ children }: CurrencyProviderProps) => {
  const [currency, setCurrency] = useState<Currency>('PLN');
  const contextValue = useMemo(() => {
    const formatPrice = (pricePLN: number): string => {
      const convertedPrice = Math.round(pricePLN * EXCHANGE_RATES[currency]);
      const symbol = CURRENCY_SYMBOLS[currency];

      if (currency === "PLN") {
        return `${convertedPrice} ${symbol}`;
      }

      return `${symbol}${convertedPrice}`;
    };

    return { currency, setCurrency, formatPrice };
  }, [currency]);

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
