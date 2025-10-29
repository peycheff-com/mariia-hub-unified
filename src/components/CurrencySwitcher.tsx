import { DollarSign } from 'lucide-react';

import { useCurrency } from '@/contexts/CurrencyContext';

import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const CurrencySwitcher = () => {
  const { currency, setCurrency } = useCurrency();

  const currencies = [
    { code: 'PLN' as const, name: 'Polish Złoty', symbol: 'zł' },
    { code: 'EUR' as const, name: 'Euro', symbol: '€' },
    { code: 'USD' as const, name: 'US Dollar', symbol: '$' },
  ];

  const currentCurrency = currencies.find(c => c.code === currency) || currencies[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-pearl hover:text-champagne min-h-[44px] min-w-[44px] touch-manipulation">
          <DollarSign className="w-4 h-4" />
          <span className="text-sm font-medium">{currentCurrency.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="glass-card backdrop-blur-xl border-pearl/20 min-w-[180px] z-50"
      >
        {currencies.map((curr) => (
          <DropdownMenuItem
            key={curr.code}
            onClick={() => setCurrency(curr.code)}
            className={`cursor-pointer py-3 px-4 min-h-[44px] touch-manipulation ${
              currency === curr.code
                ? 'bg-champagne/20 text-champagne font-semibold'
                : 'text-pearl hover:text-champagne hover:bg-pearl/10'
            }`}
          >
            <span className="mr-3 text-base">{curr.symbol}</span>
            <span className="font-medium">{curr.code}</span>
            <span className="ml-2 text-xs text-pearl/50">- {curr.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CurrencySwitcher;
