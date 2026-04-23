import { useEffect, useState } from 'react';
import { getPricingPreview } from '@/api/payments';
import type { LocalizedPrices } from '@/api/payments/types';

export function usePricingPreview(): { prices: LocalizedPrices | null; isLoading: boolean } {
  const [prices, setPrices] = useState<LocalizedPrices | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getPricingPreview()
      .then((data) => {
        if (!cancelled) setPrices(data);
      })
      .catch(() => {
        // silent fallback — hardcoded prices remain visible
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { prices, isLoading };
}
