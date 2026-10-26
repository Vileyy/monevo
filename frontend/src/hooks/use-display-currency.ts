import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settings.store';
import { useCurrencyStore } from '@/store/currency.store';
import { BASE_CURRENCY } from '@/lib/currency-conversion';

/**
 * Re-renders a screen when the display currency or its rates change, so
 * `formatCurrency` (which reads the stores imperatively) stays in sync.
 */
export function useDisplayCurrency() {
  const currency = useSettingsStore((state) => state.currency);
  const rates = useCurrencyStore((state) => state.rates);
  const refreshRates = useCurrencyStore((state) => state.refreshRates);

  // A non-VND choice without rates means the startup fetch failed; retry so
  // the switch takes effect instead of silently staying on VND.
  useEffect(() => {
    if (currency !== BASE_CURRENCY && Object.keys(rates).length === 0) {
      void refreshRates();
    }
  }, [currency, rates, refreshRates]);
}
