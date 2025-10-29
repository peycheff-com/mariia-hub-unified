import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CurrencyStore {
  // State
  currency: string;
  exchangeRates: Record<string, number>;
  lastUpdated: Date | null;
  isLoading: boolean;

  // Actions
  setCurrency: (currency: string) => void;
  setExchangeRates: (rates: Record<string, number>) => void;
  updateExchangeRates: () => Promise<void>;
  convertPrice: (priceInPLN: number, toCurrency?: string) => string;
  convertValue: (value: number, from: string, to: string) => number;
}

// Default exchange rates (should be updated from API)
const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  PLN: 1, // Base currency
  EUR: 0.23,
  USD: 0.25,
  GBP: 0.20,
  UAH: 10.00,
  BYN: 0.78,
  CHF: 0.22,
  CZK: 5.85,
};

// API endpoint for exchange rates
const EXCHANGE_RATE_API = import.meta.env.VITE_EXCHANGE_RATE_API || 'https://api.exchangerate-api.com/v4/latest/PLN';

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currency: 'PLN',
      exchangeRates: DEFAULT_EXCHANGE_RATES,
      lastUpdated: null,
      isLoading: false,

      // Actions
      setCurrency: (currency: string) => {
        set({ currency });
      },

      setExchangeRates: (rates: Record<string, number>) => {
        set({
          exchangeRates: rates,
          lastUpdated: new Date(),
        });
      },

      updateExchangeRates: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch(EXCHANGE_RATE_API);
          if (!response.ok) {
            throw new Error('Failed to fetch exchange rates');
          }

          const data = await response.json();

          // Process the API response
          const rates: Record<string, number> = {
            PLN: 1, // Base currency
          };

          // Add rates from API
          if (data.rates) {
            Object.entries(data.rates).forEach(([code, rate]) => {
              if (typeof rate === 'number') {
                rates[code] = rate;
              }
            });
          } else if (data.conversion_rates) {
            // Alternative API response format
            Object.entries(data.conversion_rates as Record<string, number>).forEach(([code, rate]) => {
              rates[code] = rate;
            });
          }

          set({
            exchangeRates: rates,
            lastUpdated: new Date(),
          });
        } catch (error) {
          console.error('Failed to update exchange rates:', error);
          // Keep using existing rates if API fails
        } finally {
          set({ isLoading: false });
        }
      },

      convertPrice: (priceInPLN: number, toCurrency?: string) => {
        const { currency, exchangeRates } = get();
        const targetCurrency = toCurrency || currency;
        const rate = exchangeRates[targetCurrency] || 1;
        const convertedAmount = priceInPLN * rate;

        // Format with locale
        const locale = getLocaleForCurrency(targetCurrency);
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: targetCurrency,
          minimumFractionDigits: targetCurrency === 'BYN' ? 0 : 2,
          maximumFractionDigits: targetCurrency === 'BYN' ? 0 : 2,
        }).format(convertedAmount);
      },

      convertValue: (value: number, from: string, to: string) => {
        const { exchangeRates } = get();

        if (from === to) return value;

        // Convert to PLN first (base currency)
        const valueInPLN = from === 'PLN' ? value : value / (exchangeRates[from] || 1);

        // Then convert to target currency
        return to === 'PLN' ? valueInPLN : valueInPLN * (exchangeRates[to] || 1);
      },
    }),
    {
      name: 'currency-store',
      partialize: (state) => ({
        currency: state.currency,
        exchangeRates: state.exchangeRates,
        lastUpdated: state.lastUpdated,
      }),
      onRehydrateStorage: () => (state) => {
        // Auto-update rates if they're older than 24 hours
        if (state) {
          const now = new Date();
          const lastUpdated = state.lastUpdated ? new Date(state.lastUpdated) : null;
          const hoursSinceUpdate = lastUpdated
            ? (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60)
            : 24;

          if (hoursSinceUpdate >= 24) {
            state.updateExchangeRates();
          }
        }
      },
    }
  )
);

// Helper function to get locale for currency
function getLocaleForCurrency(currency: string): string {
  const currencyLocales: Record<string, string> = {
    PLN: 'pl-PL',
    EUR: 'de-DE', // Use Germany for Euro formatting
    USD: 'en-US',
    GBP: 'en-GB',
    UAH: 'uk-UA',
    BYN: 'be-BY',
    CHF: 'de-CH',
    CZK: 'cs-CZ',
  };

  return currencyLocales[currency] || 'pl-PL';
}

// Custom hook for easier usage
export const useCurrency = () => {
  const {
    currency,
    exchangeRates,
    lastUpdated,
    isLoading,
    setCurrency,
    updateExchangeRates,
    convertPrice,
    convertValue,
  } = useCurrencyStore();

  return {
    currency,
    exchangeRates,
    lastUpdated,
    isLoading,
    setCurrency,
    updateExchangeRates,
    convertPrice,
    convertValue,
  };
};

export default useCurrencyStore;